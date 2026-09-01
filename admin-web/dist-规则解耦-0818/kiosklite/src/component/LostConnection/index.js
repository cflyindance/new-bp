import React, { useEffect, useRef, useState } from 'react';
import styles from './index.module.scss';
import { fetchSessionKey, posFrontLog } from '@/api';
import { getCookie, setCookie } from '@/utils';
import { getKioskHomePath } from '@/constants/mockData';
import { withRouter } from 'react-router-dom';
import Toast from '@/component/toast';

const LostConnection = (props) => {
  const { isAvailable, pollingFailureReason, history } = props;
  const pollingRef = useRef(null);

  const [failureReason, setFailureReason] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!isAvailable && pollingFailureReason) {
        posFrontLog(
          `Kiosk Network Error: ${pollingFailureReason}`
        );
        if (
          pollingFailureReason === 'Invalid session key' ||
          pollingFailureReason === 'No session key'
        ) {
          const timer = setTimeout(async () => {
            await resetSessionKey();
            clearTimeout(timer);
          }, 1000);
          pollingRef.current = setInterval(async () => {
            await resetSessionKey();
          }, 60 * 1000);
        }
      }
    };
    checkStatus();
  }, [isAvailable, pollingFailureReason]);

  useEffect(() => {
    return () => {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      setFailureReason(null);
    };
  }, []);

  const resetSessionKey = async () => {
    const res = await fetchSessionKey();
    if (res.data?.result?.successful) {
      setCookie('kioskclientInstanceTime', +new Date());
      setCookie(
        'kioskSskeyActiveTime',
        res.data.sessionKeyRemainingActiveTime || 23 * 3600 * 1000
      );
      if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
        setCookie('AndroidSecret', res.data.secretKey);
      } else {
        setCookie('secretKey', res.data.secretKey);
      }
      posFrontLog(`old invalid session key: ${getCookie('sessionKey')}`);
      setCookie('sessionKey', res.data.sessionKey);
      posFrontLog(`new valid session key: ${res.data.sessionKey}`);
      return;
    }
    if (res.data?.result?.failureReason) {
      posFrontLog(
        `refresh session key failed: ${res.data?.result?.failureReason}`
      );
      setFailureReason(res.data?.result?.failureReason);
      Toast.info(res.data?.result?.failureReason, 2000);
      if (
        res.data?.result?.failureReason?.includes('Duplicate instance login:')
      ) {
        handleClearAllInfo();
        history.push(getKioskHomePath());
        window.location.reload();
      }
    }
  };

  const handleClearAllInfo = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(function (cookie) {
      document.cookie = cookie
        .replace(/^ +/, '') // 移除多余空格
        .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
    });
  };

  return (
    <div className={styles.endPointDialog}>
      <div className={styles.endPointTitle}>
        Failed to connect to the host. Please Check if the host is enabled.
      </div>
      {(failureReason || pollingFailureReason) && (
        <div className={styles.endPointInfo}>
          Reason: {failureReason || pollingFailureReason}
        </div>
      )}
      <div className={styles.endPointInfo}>
        After the host is enabled, Kiosk will reconnect automatically.
      </div>
    </div>
  );
};

export default withRouter(LostConnection);
