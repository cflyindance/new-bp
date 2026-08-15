import React from 'react';
import { withTranslation } from 'react-i18next';
import Dialog from '../dialog';
import styles from './cashPayConfirmModal.module.scss';

const CashPayConfirmModal = ({
  visible,
  onClose,
  onConfirmCash,
  onConfirmCard,
  t,
}) => {
  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      html={
        <div className={styles.tipBox} onClick={(e) => e.stopPropagation()}>
          <div className={styles.title}>{t('cash-pay-confirm-dialog-message')}</div>
          <div className={styles.tipBtn}>
            <div
              className={`${styles.confirmCash} linear-animate-btn`}
              onClick={onConfirmCash}
            >
              {t('cash')}
            </div>
            <div
              className={`${styles.confirmCard} linear-animate-btn`}
              onClick={onConfirmCard}
            >
              {t('credit-card-payment')}
            </div>
          </div>
        </div>
      }
    />
  );
};

export default withTranslation()(CashPayConfirmModal);
