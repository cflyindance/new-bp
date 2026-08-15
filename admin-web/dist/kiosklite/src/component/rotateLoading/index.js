import React, { useState, useEffect } from 'react';
// import styles from './rotateLoading.module.scss';
import forkLoading from '@/assets/lottie/process.json';
// import forkLoading from '@/assets/lottie/fork_loading.json';
import LottiePlayer from '@/component/LottiePlayer';
import getDeviceDirection from '@/utils/getDeviceDirection';

const RotateLoading = () => {
  const [direction, setDirection] = useState(getDeviceDirection());

  useEffect(() => {
    const handleResize = () => {
      setDirection(getDeviceDirection());
    };

    // 监听 resize 和 orientationchange 事件
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 组件卸载时移除监听
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <LottiePlayer
      animationData={forkLoading}
      width={direction === 'vertical' ? '50%' : '30%'}
      speed={0.5}
    />
  );
};

export default RotateLoading;
