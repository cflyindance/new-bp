import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './signatureModal.module.scss';
import Dialog from '../dialog';
import MenusifuLoading from '../menusifuLoading';

const DELAY = 600;
const SignatureModal = (props) => {
  const { t } = useTranslation();
  const {
    loadObj: { msgDone, handlePrint, handleSkip },
    signaLoading,
  } = props;
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer;
    if (signaLoading) {
      // signaLoading 为 true，启动定时器，600ms后显示
      timer = setTimeout(() => {
        setShow(true);
      }, DELAY);
    } else {
      // signaLoading 为 false，取消定时器，立即隐藏
      clearTimeout(timer);
      setShow(false);
    }
    // 清理函数，组件卸载或 signaLoading 变化时调用
    return () => clearTimeout(timer);
  }, [signaLoading]);

  if (!show) {
    return null;
  }

  let loadingMsg =
    msgDone == 'open' ? (
      <div className={styles.loadBox}>
        <div className={styles.orderBox}>
          <div className={styles.msg}>{t('signature-receipt')}</div>
          <div className={styles.orderBottom}>
            <div onClick={handleSkip}>{t('skip')}</div>
            <div onClick={handlePrint} className="linear-animate-btn">
              {t('signature-print')}
            </div>
          </div>
        </div>
      </div>
    ) : msgDone == 'fail' ? (
      <div className={styles.loadBox}>
        <div className={styles.orderBox}>
          <div className={styles.msg}>{t('signature-receipt-fail')}</div>
          <div className={styles.orderBottom}>
            <div onClick={handleSkip}>{t('skip')}</div>
            <div onClick={handlePrint} className="linear-animate-btn">
              {t('signature-print-again')}
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className={styles.loadBox}>
        <MenusifuLoading />
        <div className={styles.itemBox}>
          <div className={styles.itemName}>{t('print-msg-loading-title')}</div>
          <div className={styles.subItemName}>{t('wait')}</div>
        </div>
      </div>
    );
  return <Dialog visible={show} html={loadingMsg} />;
};

export default SignatureModal;
