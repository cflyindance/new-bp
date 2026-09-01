import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './DealErrorTips.module.scss';
import { useCloseModalOnHomePage } from '@/hooks';

const DealErrorTips = (props) => {
  const { t } = useTranslation();
  const { onClose } = props;
  useCloseModalOnHomePage(onClose);
  const [time, setTime] = useState(15);
  const [timer, setTimer] = useState(null);

  // 返回首页
  const handleBackHome = () => {
    window.location.hash = '/';
  };

  useEffect(() => {
    if (timer) {
      clearInterval(timer);
    }
    const newTimer = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1;
        } else {
          handleBackHome();
          return 0;
        }
      });
    }, 1000);
    setTimer(newTimer);

    // 清理函数
    return () => {
      if (newTimer) {
        clearInterval(newTimer);
      }
    };
  }, []);

  return (
    <div className={styles.dealError}>
      <div className={styles.title}>{t('deal_error_tip')}</div>
      <div className={styles.txt}>{t('search_staff_for_help')}</div>
      <div className={styles.backHome} onClick={handleBackHome}>
        {`${t('go-back-home')}(${time}s)`}
      </div>
    </div>
  );
};

export default DealErrorTips;
