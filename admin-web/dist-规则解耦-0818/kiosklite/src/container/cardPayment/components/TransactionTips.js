import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TransactionTips.module.scss';
import PAYCANCEL from '@/assets/lottie/error.json';
import PROCESSING from '@/assets/lottie/process.json';
import LottiePlayer from '@/component/LottiePlayer';
import { getCookie } from '@/utils';
import Dialog from '@/component/dialog';

const TransactionTips = (props) => {
  const { t } = useTranslation();
  const {
    isShowModal,
    onCancelPay,
    tipsText,
    tipsType,
    showTriposCancelButton, // tripos ready超时展示的取消按钮
  } = props;

  const status = {
    payCancel: PAYCANCEL,
    payPreparing: PROCESSING,
    payReading: PROCESSING,
  };

  return (
    <Dialog
      visible={isShowModal}
      html={
        <div className={styles.tipWrap}>
          <div className={styles.title}>{tipsText}</div>
          <div className={styles.imageWrap}>
            <LottiePlayer animationData={status[tipsType]} />
          </div>
          {/* 当INGENICO设备且10秒后未收到triposPayReady状态时显示取消按钮 */}
          {getCookie('serviceTarget') === 'INGENICO' &&
            showTriposCancelButton && (
              <div className={styles.triposCancelButton}>
                <div onClick={onCancelPay}>{t('payment_cancel')}</div>
              </div>
            )}
        </div>
      }
    />
  );
};

export default TransactionTips;
