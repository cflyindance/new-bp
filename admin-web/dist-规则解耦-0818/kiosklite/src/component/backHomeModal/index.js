import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './backHomeModal.module.scss';
import Dialog from '../../component/dialog';

class BackHomeModal extends Component {
  // 判断显示的文案提示
  judgeShowTextTip = () => {
    const { isGoBack } = this.props;
    let itemName = 'cancel_order_confirm';
    let subItemName = 'cancel_order_subtip';

    if (isGoBack) {
      return {
        itemName: 'go_to_pre_page',
        subItemName,
      };
    }

    if (window.location.hash.indexOf('/signature') > -1) {
      subItemName = 'signature_order_subtip';
    } else if (window.location.hash.indexOf('/orderFinish') > -1) {
      subItemName = 'orderFinish_order_subtip';
    }

    return {
      itemName,
      subItemName,
    };
  };

  render() {
    const {
      t,
      isShowModal,
      handleContinue,
      handleCancel,
      isGoBack = false,
    } = this.props;
    const msgObj = this.judgeShowTextTip();

    return (
      <Dialog
        visible={isShowModal}
        html={
          <div
            className={styles.containerBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.itemBox}>
              <div className={styles.itemName}>{t([msgObj.itemName])}</div>
              <div className={styles.subItemName}>
                {t([msgObj.subItemName])}
              </div>
            </div>
            <div className={styles.btnBox}>
              <span onClick={handleCancel}>{t('think-again')}</span>
              <span onClick={handleContinue} className='linear-animate-btn'>
                {t(isGoBack ? 'go-back-pre' : 'go-back-home')}
              </span>
            </div>
          </div>
        }
        onClose={handleCancel}
      />
    );
  }
}

export default withTranslation()(BackHomeModal);
