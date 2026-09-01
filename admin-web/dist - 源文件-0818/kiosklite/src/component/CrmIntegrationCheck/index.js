import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './crmIntegrationCheck.module.scss';
import Dialog from '../dialog';

class CrmIntegrationCheck extends Component {
  render() {
    const { t, isShowModal, handleContinue, handleCancel, subTitle } =
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
              <div className={styles.itemName}>{t('crm_abandon_title')}</div>
              <div className={styles.subTitle}>{subTitle}</div>
            </div>
            <div className={styles.btnBox}>
              <span onClick={handleCancel}>{t('think-again')}</span>
              <span onClick={handleContinue} className="linear-animate-btn">
                {t('crm_abandon_btn')}
              </span>
            </div>
          </div>
        }
        onClose={handleCancel}
      />
    );
  }
}

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps)(withTranslation()(CrmIntegrationCheck));
