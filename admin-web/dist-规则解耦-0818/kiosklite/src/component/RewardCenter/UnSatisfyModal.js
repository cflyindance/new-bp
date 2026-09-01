import Dialog from '@/component/dialog';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './UnSatisfyModal.module.scss';
import { Button } from 'antd';

const UnSatisfyModal = (props) => {
  const { t } = useTranslation();
  const { unSatisfyModalInfo, onBack, onConfirm } = props;
  return (
    <Dialog
      isMountOnBody
      visible={unSatisfyModalInfo.open}
      html={
        <div class={styles.unSatisfyWrapper}>
          <header class={styles.header}>{t('crmJoinFaildReason')}</header>
          <div class={styles.content}>{unSatisfyModalInfo.failureReason}</div>
          <footer class={styles.footer}>
            <div onClick={onBack}>{t('continueJoinCrm')}</div>
            <div onClick={onConfirm} className="linear-animate-btn">
              {t('orderByOriPrice')}
            </div>
          </footer>
        </div>
      }
    />
  );
};

export default UnSatisfyModal;
