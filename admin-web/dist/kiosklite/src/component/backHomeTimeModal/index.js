import React from 'react';
import ReactDOM from 'react-dom';
import { withTranslation } from 'react-i18next';
import Dialog from '../../component/dialog';
import styles from './backHomeTimeModal.module.scss';

class BackHomeTimeModal extends React.Component {
  render() {
    const { t, loading, time, backHome, changeModel } = this.props;

    let dom = (
      <Dialog
        visible={loading}
        html={
          <div
            className={styles.containerBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.itemBox}>
              <div className={styles.itemName}>{t('timeout')}</div>
              <div className={styles.itemName}>{t('timeout2')}</div>
              <div className={styles.subItemName}>{t('timeout3')}</div>
            </div>
            <div className={styles.btnBox}>
              <span onClick={backHome}>{`${t('go-back-home')}(${time}s)`}</span>
              <span onClick={changeModel} className="linear-animate-btn">
                {t('continue')}
              </span>
            </div>
          </div>
        }
        onClose={changeModel}
      />
    );
    return ReactDOM.createPortal(dom, document.body);
  }
}

export default withTranslation()(BackHomeTimeModal);
