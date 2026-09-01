/**
 * 将配置中心「当前生效屏保」接口数据映射为 Kiosk 本地屏保结构（与 selfConfig id:35 一致）
 * @see https://s.apifox.cn/087bfa37-200f-4ff8-8f56-b9a1f1a695b8/446768254e0.md
 */

const emptyOrientation = () => ({
  type: 'image',
  imageList: [],
  videoList: [],
});

// 屏保资源是否有内容
const orientationHasContent = (o) =>
  !!(o && Array.isArray(o.fileUrls) && o.fileUrls.some(Boolean));

export const cloudLayoutHasContent = (layout) => {
  if (!layout) return false;
  return (
    orientationHasContent(layout.horizontal) ||
    orientationHasContent(layout.vertical)
  );
};

const mapImageTransitionEffect = (effect) => {
  if (!effect || typeof effect !== 'string') return 'fade';
  const k = effect.toUpperCase();
  const map = {
    SLIDE: 'slide',
    FADE: 'fade',
    ZOOM: 'zoom',
    ROTATE: 'rotate',
    BOUNCE: 'bounce',
    FLIP: 'flip',
  };
  return map[k] || 'fade';
};

const mapOrientation = (o) => {
  if (!orientationHasContent(o)) {
    return emptyOrientation();
  }
  const urls = o.fileUrls.filter(Boolean);
  const isVideo = String(o.mediaType || '').toUpperCase() === 'VIDEO';
  if (isVideo) {
    const videoList = urls.map((url) => ({ url }));
    return {
      type: 'video',
      imageList: [],
      videoList,
      videoUrl: videoList[0]?.url,
    };
  }
  return {
    type: 'image',
    imageList: urls.map((url) => ({
      url,
      default: /^https?:\/\//i.test(url),
    })),
    videoList: [],
  };
};

/**
 * @param {object} layout ScreenSaverLayoutConfigResponse
 * @returns {object|null} 与 margin id:35 value 同构；无有效素材时返回 null
 */
export function mapCloudLayoutToScreenSaverValue(layout) {
  if (!cloudLayoutHasContent(layout)) {
    return null;
  }
  const delayTime =
    layout.stayTimeSeconds != null ? layout.stayTimeSeconds : 60;
  const swiperTime =
    layout.transitionSpeedSeconds != null
      ? layout.transitionSpeedSeconds
      : 3;
  return {
    status: true,
    showHomePage: true,
    delayTime,
    imageAnimation: mapImageTransitionEffect(layout.imageTransitionEffect),
    swiperTime,
    horizontalData: mapOrientation(layout.horizontal),
    verticalityData: mapOrientation(layout.vertical),
  };
}
