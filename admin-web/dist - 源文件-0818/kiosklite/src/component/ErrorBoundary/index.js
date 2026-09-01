import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getKioskHomePath } from '@/constants/mockData';
import styles from './index.module.scss';

const goHomeAndReload = () => {
  window.location.hash = getKioskHomePath();
  window.location.reload();
};

const ErrorBoundary = () => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          queueMicrotask(goHomeAndReload);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div role="alert" className={styles.errorWrapper}>
      <div className={styles.errorMsg}>{t('errorBoundary_title')}</div>
      {/* <div className={styles.subErrorMsg}>
        {t('errorBoundary_countdown', { seconds: countdown })}
      </div> */}
      <div className={styles.refresh_btn} onClick={goHomeAndReload}>
        {`${t('refresh')} (${countdown}s)`}
      </div>
    </div>
  );
};

export default ErrorBoundary;
