import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './TipsModal.module.scss';
import Dialog from '@/component/dialog';

class TipsModal extends Component {
  render() {
    const { t, tipsType, isShowModal, handleContinue, handleCancel } =
      this.props;

    return (
      <Dialog
        visible={isShowModal}
        html={
          <div
            className={styles.containerBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.itemBox}>
              <div className={styles.itemName}>
                {t('activityTipsTitle', { type: tipsType })}
              </div>
              <div className={styles.subItemName}>
                {t('activityTipsContent', { type: tipsType })}
              </div>
            </div>
            <div className={styles.btnBox}>
              <span onClick={handleCancel}>{t('think-again')}</span>
              <span onClick={handleContinue} className="linear-animate-btn">
                {t('confirm')}
              </span>
            </div>
          </div>
        }
        onClose={handleCancel}
      />
    );
  }
}

export default withTranslation()(TipsModal);
