import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './cardPayTipModal.module.scss';
import Dialog from '../dialog';
import _ from 'lodash';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';

class CardPayTipModal extends Component {
  render() {
    const {
      t,
      isHasOrderCharge,
      handleCancel,
      handleConfirm,
      selfConfig,
      systemConfig,
    } = this.props;
    const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);

    let rate = 0;
    selfConfig.charge.map((item) => {
      if (item.id === 1 && item.select?.id) {
        if (item.select.ratetype == 1) {
          // rate = '$' + item.select.rate;
          rate = '$' + _.round(item.select.rate, 2).toFixed(2);
        } else if (item.select.ratetype == 2) {
          rate = item.select.rate + '%';
        }
      }
    });

    let htmlStr = t('card-tip', { rplc: rate });
    // 只开通卡支付
    if (paymentRouteResult.onlyCard) {
      htmlStr = t('card-tip-only-card-pay', { rplc: rate });
    }

    return (
      <Dialog
        visible={isHasOrderCharge}
        html={
          <div className={styles.tipBox} onClick={(e) => e.stopPropagation()}>
            <div
              className={styles.title}
              dangerouslySetInnerHTML={{ __html: htmlStr }}
            ></div>
            <div className={styles.tipBtn}>
              <div className={styles.cancel} onClick={handleCancel}>
                {t('cancel')}
              </div>
              <div className={`${styles.confirm} linear-animate-btn`} onClick={handleConfirm}>
                {t('confirm')}
              </div>
            </div>
          </div>
        }
        onClose={handleCancel}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
  };
}

export default withRouter(
  connect(mapStateToProps)(withTranslation()(CardPayTipModal))
);
