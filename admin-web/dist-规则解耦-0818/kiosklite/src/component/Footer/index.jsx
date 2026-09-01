import { connect } from 'react-redux';
import POWERBYMENUSIFU from '@/assets/images/PowerByMenusifu.png';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import styles from './index.module.scss';
import packagePath from '@/utils/PackagePath';
import getDeviceDirection from '@/utils/getDeviceDirection';

const NOT_SHOW_PATH = [
  'promotion',
  'brandSetting',
  'allChargeSetting',
  'inventorySetting',
  'menuLabel',
  'screenSaver',
  'deviceSetting',
  'serviceSetting',
  'configApp',
  'orderReview',
  'orderPage',
  'reward',
  'phoneInput',
  'posterPro',
  'loginGuide',
  'tippingPanel',
  'chooseTable',
];
const Footer = (props) => {
  const {
    img: { isShowScreensaver },
    selfConfig,
  } = props;

  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [deviceDirection, setDeviceDirection] = useState(getDeviceDirection);

  const refreshDirection = useCallback(() => {
    setDeviceDirection(getDeviceDirection());
  }, []);

  // 监听 hash 变化
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.addEventListener('orientationchange', refreshDirection);
    window.addEventListener('resize', refreshDirection);
    return () => {
      window.removeEventListener('orientationchange', refreshDirection);
      window.removeEventListener('resize', refreshDirection);
    };
  }, [refreshDirection]);

  // kiosk后台配置开关
  const footerStatus = useMemo(() => {
    return selfConfig?.configMap?.id_50;
  }, [selfConfig]);

  const isHide = useMemo(() => {
    // 后台配置入口页面+屏保开启时+后台配置开关
    return (
      packagePath(NOT_SHOW_PATH).includes(currentHash) ||
      currentHash.includes('configApp') ||
      isShowScreensaver ||
      !footerStatus
    );
  }, [currentHash, isShowScreensaver, footerStatus]);

  const isOrderFinishLandscape =
    currentHash.includes('/orderFinish') && deviceDirection === 'horizontal';

  return isHide ? null : (
    <div
      className={`${styles.footerInfo}${
        isOrderFinishLandscape ? ` ${styles.footerInfoOrderFinishLandscape}` : ''
      }`}
    >
      <img
        className={styles.logoImg}
        src={POWERBYMENUSIFU}
        alt="POWER BY MENUSIFU"
      />
    </div>
  );
};

function mapStateToProps(state) {
  return {
    img: state.img,
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps)(Footer);
