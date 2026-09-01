import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import cloneDeep from 'lodash/cloneDeep';
import dayjs from 'dayjs';
import { getMarginappFetchConfig } from '@/api';
import { fetchEffectiveScreen } from '@/api/kioskConfigApi';
import IMG_HOST from '@/utils/getImageHost';
import defaultVImage from '@/assets/images/screen-v.png';
import defaultHImage from '@/assets/images/screen-h.png';
import { selfConfigList } from '@/constants/selfConfig';
import getDeviceDirection from '@/utils/getDeviceDirection';
import { compare, getCookie } from '@/utils';
import Loading from '@/component/loading';
import WaitingInfo from '@/container/orderPage/waitingInfo';
import styles from '../mainPage.module.scss';
import {
  mapCloudLayoutToScreenSaverValue,
  cloudLayoutHasContent,
} from './mapEffectiveScreenLayout';
import {
  normalizeScreenSaverDataSource,
  SCREENSAVER_DATA_SOURCE,
} from '@/utils/screenSaverConfig';
import { getScreenSaverImageTransitionStyle } from './screenSaverImageTransition';

// -1:屏保计时还没开始；0：计时中；1：显示中
export const SCREENSAVERSTATUS = {
  READING: -1,
  TIMING: 0,
  DISPLAY: 1,
};

/** 云屏保 effective-layout 超过此时长未响应则改用本地 margin id:35 */
const EFFECTIVE_SCREEN_FETCH_TIMEOUT_MS = 1000 * 10;
const PRELOAD_VIDEO_TIMEOUT_MS = 8000;

const syncStatusRef = (ref, status) => {
  ref.current = status;
};

const resolveImageSrc = (item) => {
  if (!item?.url) return '';
  if (item.default || /^https?:\/\//i.test(item.url)) {
    return item.url;
  }
  return `${IMG_HOST}/${item.url}`;
};

const resolveVideoSrc = (videoUrl) => {
  if (!videoUrl) return '';
  if (/^https?:\/\//i.test(videoUrl)) {
    return videoUrl;
  }
  return `${IMG_HOST}/${videoUrl}`;
};

const preloadImage = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve({ ok: false, src });
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ ok: true, src });
    img.onerror = () => resolve({ ok: false, src });
    img.src = src;
  });

const preloadVideo = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve({ ok: false, src });
      return;
    }
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      v.removeEventListener('canplaythrough', onReady);
      v.removeEventListener('loadeddata', onReady);
      v.removeEventListener('error', onError);
      v.removeAttribute('src');
      try {
        v.load();
      } catch (_) {
        /* ignore */
      }
      resolve({ ok, src });
    };
    const timer = setTimeout(() => finish(false), PRELOAD_VIDEO_TIMEOUT_MS);
    const onReady = () => {
      clearTimeout(timer);
      finish(true);
    };
    const onError = () => {
      clearTimeout(timer);
      finish(false);
    };
    v.addEventListener('canplaythrough', onReady);
    v.addEventListener('loadeddata', onReady);
    v.addEventListener('error', onError);
    v.src = src;
    v.load();
  });

const createDefaultImageScreenSaverData = (sourceData) => {
  const next = cloneDeep(sourceData || {});
  const defaultImage =
    getDeviceDirection() === 'vertical' ? defaultVImage : defaultHImage;
  const base = next.data || {};
  next.data = {
    ...base,
    type: 'image',
    imageList: [{ default: true, url: defaultImage }],
    videoList: [],
    videoUrl: '',
  };
  return next;
};

const ensureScreenSaverDataRenderable = async (sourceData) => {
  const next = cloneDeep(sourceData || {});
  const data = next?.data || {};
  if (data.type === 'image') {
    const imageList = Array.isArray(data.imageList) ? data.imageList : [];
    if (!imageList.length) {
      return createDefaultImageScreenSaverData(next);
    }
    const results = await Promise.all(
      imageList.map((item) => preloadImage(resolveImageSrc(item)))
    );
    const validImageList = imageList.filter((_, idx) => results[idx]?.ok);
    if (!validImageList.length) {
      return createDefaultImageScreenSaverData(next);
    }
    next.data.imageList = validImageList;
    return next;
  }
  if (data.type === 'video') {
    const videoUrl = data.videoUrl || data.videoList?.[0]?.url;
    const res = await preloadVideo(resolveVideoSrc(videoUrl));
    if (!res.ok) {
      return createDefaultImageScreenSaverData(next);
    }
    return next;
  }
  return createDefaultImageScreenSaverData(next);
};

/** 屏保展示前预加载当前方向下全部图片或视频，避免逐张自上而下渐进显示 */
const preloadScreenSaverMedia = async (screenSaverData) => {
  const data = screenSaverData?.data;
  if (!data) return;
  if (
    data.type === 'image' &&
    Array.isArray(data.imageList) &&
    data.imageList.length > 0
  ) {
    await Promise.all(
      data.imageList.map((item) => preloadImage(resolveImageSrc(item)))
    );
    return;
  }
  if (
    data.type === 'video' &&
    data.videoUrl &&
    String(data.videoUrl).length > 0
  ) {
    await preloadVideo(resolveVideoSrc(data.videoUrl));
  }
};

const MainPageScreenSaver = forwardRef(function MainPageScreenSaver(
  {
    merchantId,
    toggleKioskLicense,
    setShowScreensaver,
    onStartOrder,
    onSaveConfig,
    onMetaChange,
    onScreenSaverLoadStarted,
    onScreenSaverLoadSettled,
    bottomText,
  },
  ref
) {
  const [screenSaverData, setScreenSaverData] = useState({});
  const [screenCurrentIndex, setScreenCurrentIndex] = useState(0);
  const [screenSaverStatus, setScreenSaverStatus] = useState(
    SCREENSAVERSTATUS.READING
  );
  const [vedioLoading, setVedioLoading] = useState(false);

  const screenSaverStatusRef = useRef(SCREENSAVERSTATUS.READING);
  const screenSaverDataRef = useRef({});
  const screenCurrentIndexRef = useRef(0);
  const screenSaverTimerRef = useRef(null);
  const screenImageintervalRef = useRef(null);
  const handScreenSaverRef = useRef(() => {});
  const loadLocalScreenSaverGenRef = useRef(0);
  const skipFirstMerchantEffectRef = useRef(true);

  useEffect(() => {
    screenSaverDataRef.current = screenSaverData;
  }, [screenSaverData]);

  useEffect(() => {
    screenCurrentIndexRef.current = screenCurrentIndex;
  }, [screenCurrentIndex]);

  useEffect(() => {
    onMetaChange?.({ screenSaverData, screenSaverStatus });
  }, [screenSaverData, screenSaverStatus, onMetaChange]);

  const clearScreenTimers = useCallback(() => {
    if (screenSaverTimerRef.current !== null) {
      clearTimeout(screenSaverTimerRef.current);
      screenSaverTimerRef.current = null;
    }
    if (screenImageintervalRef.current !== null) {
      clearInterval(screenImageintervalRef.current);
      screenImageintervalRef.current = null;
    }
  }, []);

  const setupImageAutoSwitch = useCallback((nextData) => {
    if (screenImageintervalRef.current !== null) {
      clearInterval(screenImageintervalRef.current);
      screenImageintervalRef.current = null;
    }
    const imageList = nextData?.data?.imageList || [];
    if (imageList.length <= 1) return;
    const swiperTime = Number(nextData?.swiperTime) || 3;
    screenImageintervalRef.current = setInterval(() => {
      setScreenCurrentIndex((prev) => {
        const currentImageList =
          screenSaverDataRef.current?.data?.imageList || [];
        if (currentImageList.length === 0) {
          return prev;
        }
        const currentIndex = Math.max(
          0,
          Math.min(prev || 0, currentImageList.length - 1)
        );
        return (currentIndex + 1) % currentImageList.length;
      });
    }, swiperTime * 1000);
  }, []);

  const dealScreenSaverData = useCallback(() => {
    const data = screenSaverDataRef.current;
    const status = screenSaverStatusRef.current;
    if (
      !Object.prototype.hasOwnProperty.call(data, 'delayTime') ||
      !Object.prototype.hasOwnProperty.call(data, 'status') ||
      !data.status ||
      status === SCREENSAVERSTATUS.TIMING ||
      status === SCREENSAVERSTATUS.DISPLAY
    ) {
      return;
    }
    syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.TIMING);
    setScreenSaverStatus(SCREENSAVERSTATUS.TIMING);
    setVedioLoading(true);

    setShowScreensaver(false);
    if (screenSaverTimerRef.current !== null) {
      clearTimeout(screenSaverTimerRef.current);
      screenSaverTimerRef.current = null;
    }

    screenSaverTimerRef.current = setTimeout(() => {
      (async () => {
        const currentScreenSaverData = screenSaverDataRef.current;
        let displayScreenSaverData = currentScreenSaverData;
        try {
          displayScreenSaverData = await ensureScreenSaverDataRenderable(
            currentScreenSaverData
          );
        } catch (_) {
          displayScreenSaverData = createDefaultImageScreenSaverData(
            currentScreenSaverData
          );
        }
        screenSaverDataRef.current = displayScreenSaverData;
        setScreenSaverData(displayScreenSaverData);
        const imageList = displayScreenSaverData?.data?.imageList || [];
        const validIndex =
          imageList.length > 0
            ? Math.max(
                0,
                Math.min(
                  screenCurrentIndexRef.current || 0,
                  imageList.length - 1
                )
              )
            : 0;

        syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.DISPLAY);
        setScreenSaverStatus(SCREENSAVERSTATUS.DISPLAY);
        setScreenCurrentIndex(validIndex);
        setShowScreensaver(true);

        if (imageList.length > 0) {
          setupImageAutoSwitch(displayScreenSaverData);
        }
      })();
    }, data.delayTime * 1000);
  }, [setShowScreensaver, setupImageAutoSwitch]);

  const commitScreenSaverData = useCallback(
    (raw) => {
      const nextScreenSaverData = cloneDeep(raw);
      const direction = getDeviceDirection();
      direction === 'vertical'
        ? (nextScreenSaverData.data = nextScreenSaverData.verticalityData)
        : (nextScreenSaverData.data = nextScreenSaverData.horizontalData);
      if (
        nextScreenSaverData.data.type === 'image' &&
        nextScreenSaverData.data.imageList.length === 0
      ) {
        if (direction === 'vertical')
          nextScreenSaverData.data.imageList = [
            { default: true, url: defaultVImage },
          ];
        else
          nextScreenSaverData.data.imageList = [
            { default: true, url: defaultHImage },
          ];
      }
      if (
        nextScreenSaverData.data.videoList &&
        Array.isArray(nextScreenSaverData.data.videoList) &&
        nextScreenSaverData.data.videoList.length > 0
      ) {
        nextScreenSaverData.data.videoUrl =
          nextScreenSaverData.data.videoList[0].url;
      }
      delete nextScreenSaverData.horizontalData;
      delete nextScreenSaverData.verticalityData;
      const prevVideoUrl =
        screenSaverStatusRef.current === SCREENSAVERSTATUS.DISPLAY
          ? screenSaverDataRef.current?.data?.videoUrl
          : undefined;
      screenSaverDataRef.current = nextScreenSaverData;
      setScreenSaverData(nextScreenSaverData);
      setScreenCurrentIndex(0);

      // 总开关关闭：不进入屏保计时/展示，并清理可能残留的展示态
      if (!nextScreenSaverData.status) {
        clearScreenTimers();
        syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.READING);
        setScreenSaverStatus(SCREENSAVERSTATUS.READING);
        setShowScreensaver(false);
        return;
      }

      // DISPLAY 中收到轮询更新：立即刷新展示素材与轮播，不走 delayTime 倒计时
      if (screenSaverStatusRef.current === SCREENSAVERSTATUS.DISPLAY) {
        const data = nextScreenSaverData?.data || {};
        if (data.type === 'image') {
          setVedioLoading(false);
          setScreenCurrentIndex(0);
          setupImageAutoSwitch(nextScreenSaverData);
        } else {
          if (screenImageintervalRef.current !== null) {
            clearInterval(screenImageintervalRef.current);
            screenImageintervalRef.current = null;
          }
          const nextVideoUrl = data.videoUrl || '';
          const videoUrlChanged =
            resolveVideoSrc(prevVideoUrl || '') !==
            resolveVideoSrc(nextVideoUrl);
          // 轮询更新但视频地址未变时，播放器不会再次触发 onPlay，避免 loading 卡住
          setVedioLoading(videoUrlChanged);
        }
        return;
      }

      dealScreenSaverData();
    },
    [
      dealScreenSaverData,
      clearScreenTimers,
      setShowScreensaver,
      setupImageAutoSwitch,
    ]
  );

  const loadLocalScreenSaver = useCallback(
    (opts) => {
      if (!opts?.continuation) {
        loadLocalScreenSaverGenRef.current += 1;
      }
      const gen = loadLocalScreenSaverGenRef.current;
      const settled = () => {
        if (gen !== loadLocalScreenSaverGenRef.current) return;
        onScreenSaverLoadSettled?.();
      };
      getMarginappFetchConfig()
        .then(async (res) => {
          if (!res.data.result.successful) {
            settled();
            return;
          }
          let list = res.data.marginAppConfigTypes;
          let obj = list.find((l) => l.product == 'KIOSKLITE');
          if (!obj || !obj.data) {
            settled();
            return;
          }
          let arr = JSON.parse(obj.data);
          if (!arr.configList) {
            settled();
            return;
          }
          let screenDataIndex = arr.configList.findIndex(
            (item) => item.id === 35
          );
          if (screenDataIndex < 0) {
            let screen = selfConfigList.configList.find((c) => c.id == 35);
            arr.configList.push(screen);
            arr.configList.sort(compare('id'));
            const parseObj = cloneDeep(arr);
            onSaveConfig(parseObj);
            handScreenSaverRef.current({ continuation: true });
            return;
          }

          let nextScreenSaverData = normalizeScreenSaverDataSource(
            cloneDeep(arr.configList[screenDataIndex].value),
            true
          );

          const notifyBootstrapStartedIfNeeded = () => {
            if (opts?.skipBootstrapLoading) return;
            if (!nextScreenSaverData.status) return;
            onScreenSaverLoadStarted?.();
          };

          // 开启本地直接用本地配置
          if (
            nextScreenSaverData.dataSource === SCREENSAVER_DATA_SOURCE.LOCAL
          ) {
            notifyBootstrapStartedIfNeeded();
            commitScreenSaverData(nextScreenSaverData);
            settled();
            return;
          }

          // 云屏保数据
          if (
            nextScreenSaverData.dataSource === SCREENSAVER_DATA_SOURCE.CLOUD &&
            merchantId
          ) {
            notifyBootstrapStartedIfNeeded();
            try {
              // 因为云屏保不会存在无首页情况，所以一旦走到获取云资源逻辑时，就取消倒计时loading，避免长时间无意义等待
              settled();
              // 接口获取时间限定 EFFECTIVE_SCREEN_FETCH_TIMEOUT_MS 秒 超时用本地
              const resCloud = await Promise.race([
                fetchEffectiveScreen({
                  merchantId: String(merchantId),
                  channel: 'KIOSK',
                  atTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error('EFFECTIVE_SCREEN_TIMEOUT')),
                    EFFECTIVE_SCREEN_FETCH_TIMEOUT_MS
                  )
                ),
              ]);
              const layout = resCloud?.data?.data;
              if (layout != null && cloudLayoutHasContent(layout)) {
                const mapped = mapCloudLayoutToScreenSaverValue(layout);
                if (mapped) {
                  mapped.showHomePage =
                    nextScreenSaverData.showHomePage !== undefined
                      ? nextScreenSaverData.showHomePage
                      : true;
                  mapped.status =
                    nextScreenSaverData.status !== undefined
                      ? nextScreenSaverData.status
                      : true;
                  mapped.dataSource =
                    nextScreenSaverData.dataSource !== undefined
                      ? nextScreenSaverData.dataSource
                      : SCREENSAVER_DATA_SOURCE.CLOUD;
                  commitScreenSaverData(mapped);
                  return;
                }
              } else {
                // 无数据用本地
                commitScreenSaverData(nextScreenSaverData);
                settled();
              }
            } catch (_) {
              /* 超时、网络错误或云无有效数据时使用本地 margin */
              commitScreenSaverData(nextScreenSaverData);
              settled();
            }
          }
        })
        .catch(() => {
          settled();
        });
    },
    [
      commitScreenSaverData,
      onSaveConfig,
      merchantId,
      onScreenSaverLoadStarted,
      onScreenSaverLoadSettled,
    ]
  );

  const handScreenSaver = useCallback(
    (opts) => {
      loadLocalScreenSaver(opts);
    },
    [loadLocalScreenSaver]
  );

  handScreenSaverRef.current = handScreenSaver;

  useImperativeHandle(
    ref,
    () => ({
      reload: (reloadOpts = {}) => {
        const skip =
          reloadOpts.skipBootstrapLoading !== undefined
            ? reloadOpts.skipBootstrapLoading
            : true;
        handScreenSaver({ ...reloadOpts, skipBootstrapLoading: skip });
      },
    }),
    [handScreenSaver]
  );

  useEffect(() => {
    if (skipFirstMerchantEffectRef.current) {
      skipFirstMerchantEffectRef.current = false;
      return;
    }
    handScreenSaverRef.current();
  }, [merchantId]);

  // 倒计时阶段并行预热素材，缩短进入 DISPLAY 前的等待
  useEffect(() => {
    if (screenSaverStatus !== SCREENSAVERSTATUS.TIMING) return;
    preloadScreenSaverMedia(screenSaverData).catch(() => {});
  }, [screenSaverStatus, screenSaverData]);

  // 视频换源后若 onPlay 未触发，超时兜底关闭 loading
  useEffect(() => {
    if (screenSaverStatus !== SCREENSAVERSTATUS.DISPLAY) return;
    if (screenSaverData?.data?.type !== 'video') return;
    if (!vedioLoading) return;
    const timer = setTimeout(() => {
      setVedioLoading(false);
    }, PRELOAD_VIDEO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [vedioLoading, screenSaverStatus, screenSaverData]);

  const touchScreenAndSaverEnd = useCallback(() => {
    let video = document.getElementById('videoRef');
    if (!!video) {
      video.muted = true;
      video.src = '';
      video.pause();
      video.parentNode.removeChild(video);
    }
    if (!!screenImageintervalRef.current) {
      clearInterval(screenImageintervalRef.current);
      screenImageintervalRef.current = null;
    }
    syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.READING);
    setScreenSaverStatus(SCREENSAVERSTATUS.READING);
    setShowScreensaver(false);
  }, [setShowScreensaver]);

  const handleClick = useCallback(() => {
    const data = screenSaverDataRef.current;
    if (!toggleKioskLicense || !getCookie('kioskLicense')) {
      setShowScreensaver(false);
      return;
    }
    if (data.showHomePage || data.showHomePage === undefined) {
      syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.READING);
      setScreenSaverStatus(SCREENSAVERSTATUS.READING);
      dealScreenSaverData();
    } else {
      onStartOrder();
    }
    setShowScreensaver(false);
  }, [
    toggleKioskLicense,
    setShowScreensaver,
    dealScreenSaverData,
    onStartOrder,
  ]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
      clearScreenTimers();
    };
  }, [handleClick, clearScreenTimers]);

  useEffect(() => {
    return () => {
      clearScreenTimers();
    };
  }, [clearScreenTimers]);

  if (screenSaverStatus !== SCREENSAVERSTATUS.DISPLAY) {
    return null;
  }

  const hasImages =
    screenSaverData.data?.type === 'image' &&
    screenSaverData.data?.imageList?.length > 0;
  const hasVideo =
    !!screenSaverData.data?.videoUrl &&
    screenSaverData.data.videoUrl.length > 0;

  if (hasImages) {
    return (
      <div onClick={touchScreenAndSaverEnd} className={`${styles.screenSaver}`}>
        {screenSaverData.data.imageList.map((item, index) => {
          const transitionStyle = getScreenSaverImageTransitionStyle({
            effect: screenSaverData.imageAnimation,
            index,
            currentIndex: screenCurrentIndex,
            imageCount: screenSaverData.data.imageList.length,
          });
          return (
            <img
              key={index}
              src={resolveImageSrc(item)}
              alt={`${index + 1}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                minWidth: '100vw',
                minHeight: '100vh',
                width: '100vw',
                height: '100vh',
                transition: 'opacity 1s ease-in-out, transform 1s ease-in-out',
                ...transitionStyle,
              }}
            />
          );
        })}
        {bottomText}
        <WaitingInfo isFixed={true} />
      </div>
    );
  }

  if (hasVideo) {
    const videoSrc = resolveVideoSrc(screenSaverData.data.videoUrl);
    return (
      <div className={`${styles.screenSaver}`} onClick={touchScreenAndSaverEnd}>
        <video
          key={videoSrc}
          id="videoRef"
          loop
          muted
          autoPlay
          playsInline
          webkit-playsinline="true"
          preload="auto"
          onLoadedData={() => {
            setVedioLoading(false);
          }}
          onPlay={() => {
            setTimeout(() => {
              setVedioLoading(false);
            }, 100);
          }}
          onError={() => {
            const fallbackData = createDefaultImageScreenSaverData(
              screenSaverDataRef.current
            );
            screenSaverDataRef.current = fallbackData;
            setScreenSaverData(fallbackData);
            setScreenCurrentIndex(0);
            setVedioLoading(false);
          }}
          style={{
            height: '100vh',
            width: '100vw',
            zIndex: vedioLoading ? -1 : 1,
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {bottomText}
        <WaitingInfo isFixed={true} />
        <Loading visible={vedioLoading} />
      </div>
    );
  }

  return null;
});

export default MainPageScreenSaver;
