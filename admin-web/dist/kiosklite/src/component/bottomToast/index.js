import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './bottomToast.module.scss';
// import paymentOperation from '@/assets/lottie/payment_operation.json';
// import LottieControlablePlayer from '@/component/LottiePlayer/controlable';

const BottomToast = (props) => {
  const { t } = useTranslation();
  const { onLoadingShow, onLoadingHide } = props;
  const bottomRef = useRef(null);

  useEffect(() => {
    let intersectionObserver = null;
    if (bottomRef.current) {
      intersectionObserver = new IntersectionObserver(function (entries) {
        if (entries[0].intersectionRatio > 0) {
          onLoadingShow?.();
        } else {
          onLoadingHide?.();
        }
      });
      intersectionObserver.observe(bottomRef.current);
    }

    return () => {
      if (bottomRef.current) {
        intersectionObserver.unobserve(bottomRef.current);
      }
      intersectionObserver.disconnect();
      intersectionObserver = null;
    };
  }, [bottomRef.current, onLoadingShow, onLoadingHide]);

  return (
    <div ref={bottomRef} className={styles.container}>
      <div>{t('bottom')}</div>
      {/* <LottieControlablePlayer animationData={paymentOperation} /> */}
    </div>
  );
};

export default BottomToast;
