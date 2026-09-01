import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './loading.module.scss';
import RotateLoading from '@/component/rotateLoading';

const Loading = (props) => {
  const { t } = useTranslation();
  const { visible, tipsText } = props;
  if (!visible) return null;

  return (
    <div className={styles.loadingBox}>
      <RotateLoading />
      <div className={styles.itemBox}>
        <div className={styles.itemName}>{tipsText || t('loading')}</div>
      </div>
    </div>
  );
};

export default Loading;
