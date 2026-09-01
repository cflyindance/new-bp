import React from 'react';
import { withTranslation } from 'react-i18next';
import Dialog from '../dialog';
import styles from './index.module.scss';

const DescViewModal = ({ visible, description, onClose, title, t }) => {
  return (
    <Dialog
      isMountOnBody
      visible={visible}
      html={
        <div
          className={styles.descModalWrapper}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.text}>{title || t('cate-description')}</div>
          </div>
          <div className={styles.content}>{description}</div>
        </div>
      }
      onClose={onClose}
    />
  );
};

export default withTranslation()(DescViewModal);
