import React, { Component } from 'react';
import styles from './SubmitModal.module.scss';
import { Button } from 'antd';
import {withTranslation} from "react-i18next";

const SubmitModal = (props) => {
  const { onClose, t } = props;

  return (
    <div className={styles.submitModalWrapper}>
      <div className={styles.content}>
          {t('sync-payType')}
      </div>
      <div className={styles.content}>{t('is-confirm')}</div>
      <footer className={styles.footerBtn}>
        <Button type="primary" onClick={() => onClose(true)}>
            {t('confirm')}
        </Button>
        <Button className={styles.cancel} onClick={() => onClose(false)}>
            {t('cancel')}
        </Button>
      </footer>
    </div>
  );
};

export default withTranslation()(SubmitModal);
