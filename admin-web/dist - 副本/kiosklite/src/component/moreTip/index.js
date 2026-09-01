import React from 'react';
import styles from './moreTip.module.scss';
import { useTranslation } from 'react-i18next';
import Icon from '../icon';

const MoreTip = (props) => {
  const { classname, tip } = props;
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div className={[styles.box, classname ? styles.boxOther : ''].join(' ')}>
        <div className={styles.more}>{tip || t('more')}</div>
        <Icon className={styles.moreIcon} type="more" size={3} color="#0090ff" />
      </div>
    </div>
  );
};

export default MoreTip;
