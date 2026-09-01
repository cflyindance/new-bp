import React, { useCallback, useEffect, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import dayjs from 'dayjs';
import { getVersion } from '@/api';
import { EventBus } from '@/utils/EventBus';
import { homeHash } from '@/constants/mockData';
import classNames from 'classnames';
import { getCookie, setCookie } from '@/utils';
import { normalizeKioskVersionSegment } from '@/utils/kioskVersionRecord';
import { getRuntimeEnv, setRuntimeEnv } from '@/utils/runtimeEnv';
import EnvironmentDialog from '@/component/EnvironmentDialog';
import styles from './index.module.scss';

const VERSION_POLL_MS = 3 * 60 * 1000;
const VERSION_CLICK_LIMIT = 10;
const VERSION_CLICK_WINDOW = 5 * 1000;

// 店级版本链：pre 取自本机旧版本（与 DB current 一致时）或 DB current（多设备不同步时）
function resolveStorePreviousVersion(oldCurrent, localVersion) {
  if (!oldCurrent.version || oldCurrent.version === localVersion) {
    return localVersion;
  }
  return oldCurrent.version;
}

// 保存版本信息到数据库（店级一条历史）
async function saveKioskVersionToConfig(
  newVersion,
  localVersion,
  saveConfigData,
  setSelfConfig,
  selfConfig
) {
  try {
    if (!selfConfig?.configList?.length) {
      return false;
    }
    const parseObj = cloneDeep(selfConfig);

    const oldKv = parseObj.kioskVersion || {};
    const oldCurrent = normalizeKioskVersionSegment(oldKv.current);
    const oldPre = normalizeKioskVersionSegment(oldKv.pre);
    const oldPre2 = normalizeKioskVersionSegment(oldKv.pre2);

    // 幂等：店级 current 已是最新版本，无需写库
    if (oldCurrent.version === newVersion) {
      return true;
    }

    const updateTimeNow = dayjs().format('YYYY-MM-DD');
    const previousVersion = resolveStorePreviousVersion(
      oldCurrent,
      localVersion
    );
    const preUpdateTime = oldCurrent.updateTime;

    let newPre2;
    if (oldPre.version || oldPre.updateTime) {
      newPre2 = { ...oldPre };
    } else if (oldPre2.version || oldPre2.updateTime) {
      newPre2 = { ...oldPre2 };
    } else {
      newPre2 = { version: '', updateTime: '' };
    }

    const next = { ...parseObj };
    next.kioskVersion = {
      current: { version: newVersion, updateTime: updateTimeNow },
      pre: {
        version: previousVersion,
        updateTime: preUpdateTime,
      },
      pre2: newPre2,
    };

    const saveRes = await saveConfigData(next);
    if (!saveRes?.data?.result?.successful) {
      return false;
    }
    setSelfConfig(next);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Kiosk 前端版本：轮询检测、落库合并、底部版本号展示。
 */
function KioskVersionControl({
  selfConfig,
  saveConfigData,
  setSelfConfig,
  environment,
  screenSaverFooter,
}) {
  const [kioskVersion, setKioskVersion] = useState('');
  const [envDialogVisible, setEnvDialogVisible] = useState(false);
  const checkingRef = useRef(false);
  const versionClickRef = useRef({ count: 0, startTime: 0 });

  const depsRef = useRef({
    saveConfigData,
    setSelfConfig,
    selfConfig,
  });
  depsRef.current = { saveConfigData, setSelfConfig, selfConfig };

  const getCurrentVersion = useCallback(async () => {
    if (!homeHash.includes(window.location.hash) || checkingRef.current) return;

    checkingRef.current = true;
    const {
      saveConfigData: saveCfg,
      setSelfConfig: setCfg,
      selfConfig: cfg,
    } = depsRef.current;
    try {
      const res = await getVersion();
      const { version } = res.data;
      const localVersion = getCookie('kioskVersion');

      if (!localVersion) {
        setCookie('kioskVersion', version);
        setKioskVersion(version);
        return;
      }

      if (localVersion === version) return;

      const preVersion = Number(localVersion.replaceAll('.', '') || '0');
      const saved = await saveKioskVersionToConfig(
        version,
        localVersion,
        saveCfg,
        setCfg,
        cfg
      );
      if (!saved) return;

      if (preVersion < 361) {
        const keys = document.cookie.match(/[^ =;]+(?=\=)/g);
        if (keys) {
          for (let i = keys.length; i--; )
            document.cookie =
              keys[i] + '=0;expires=' + new Date(0).toUTCString();
        }
      }

      setCookie('kioskVersion', version);
      setKioskVersion(version);
      window.location.reload();
    } catch (e) {
      console.error('getCurrentVersion failed', e);
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const run = () => getCurrentVersion();
    const runOnHome = () => {
      if (homeHash.includes(window.location.hash)) run();
    };
    EventBus.on('mainPageConfigSettled', run);
    window.addEventListener('hashchange', runOnHome);
    const timer = setInterval(run, VERSION_POLL_MS);
    return () => {
      EventBus.off('mainPageConfigSettled');
      window.removeEventListener('hashchange', runOnHome);
      clearInterval(timer);
    };
  }, [getCurrentVersion]);

  // 连点版本号打开环境切换：只在非屏保时生效，避免吞掉退出屏保的点击
  const handleVersionClick = (e) => {
    e.stopPropagation();
    const now = Date.now();
    const clickInfo = versionClickRef.current;

    if (
      !clickInfo.startTime ||
      now - clickInfo.startTime > VERSION_CLICK_WINDOW
    ) {
      clickInfo.count = 1;
      clickInfo.startTime = now;
      return;
    }

    clickInfo.count += 1;
    if (clickInfo.count >= VERSION_CLICK_LIMIT) {
      clickInfo.count = 0;
      clickInfo.startTime = 0;
      setEnvDialogVisible(true);
    }
  };

  const handleConfirmEnvironment = (env) => {
    setEnvDialogVisible(false);
    setRuntimeEnv(env);
    window.location.reload();
  };

  const displayVersion = getCookie('kioskVersion')
    ? getCookie('kioskVersion')
    : kioskVersion;

  const versionLabel = `${environment ? `[${environment}]` : ''}K-V${displayVersion}-${getCookie('kioskLicense')}`;

  return (
    <>
      <div
        className={classNames(styles.versionText, {
          [styles.versionTextScreenSaver]: screenSaverFooter,
        })}
        onClick={screenSaverFooter ? undefined : handleVersionClick}
      >
        {versionLabel}
      </div>
      <EnvironmentDialog
        visible={envDialogVisible}
        value={getRuntimeEnv()}
        onCancel={() => setEnvDialogVisible(false)}
        onConfirm={handleConfirmEnvironment}
      />
    </>
  );
}

export default KioskVersionControl;
