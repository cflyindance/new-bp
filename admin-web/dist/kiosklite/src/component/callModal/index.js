import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './callModal.module.scss';
import Dialog from '../dialog';
import MenusifuLoading from '../menusifuLoading';

const DELAY = 600;

const CallModal = (props) => {
  const { t } = useTranslation();
  const {
    loadObj: { msgDone, handlePrint, handleSkip },
    callLoading,
  } = props;
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer;
    if (callLoading) {
      // callLoading 为 true，启动定时器，600ms后显示
      timer = setTimeout(() => {
        setShow(true);
      }, DELAY);
    } else {
      // callLoading 为 false，取消定时器，立即隐藏
      clearTimeout(timer);
      setShow(false);
    }
    // 清理函数，组件卸载或 callLoading 变化时调用
    return () => clearTimeout(timer);
  }, [callLoading]);

  if (!show) {
    return null;
  }

  let loadingMsg =
    msgDone == 'fail' ? (
      <div className={styles.loadBox}>
        <div className={styles.orderBox}>
          <div className={styles.msg}>{t('delivery-number-fail')}</div>
          <div className={styles.orderBottom}>
            <div onClick={handleSkip}>{t('skip')}</div>
            <div onClick={handlePrint} className="linear-animate-btn">
              {t('delivery-number-again')}
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

export default CallModal;
