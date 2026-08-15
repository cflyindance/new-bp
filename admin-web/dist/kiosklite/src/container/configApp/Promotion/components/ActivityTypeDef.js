import React from 'react';
import { activityTypes } from '@/constants/selfConfig';
import { useTranslation } from 'react-i18next';
import styles from './ActivityTypeDef.module.scss';
import { useCloseModalOnHomePage } from '@/hooks';
import { Divider } from 'antd';

const ActivityTypeDef = (props) => {
  const { t } = useTranslation();
  const { onClose } = props;
  useCloseModalOnHomePage(onClose);

  return (
    <div>
      {activityTypes.map((each) => {
        return (
          <div key={each.value} className={styles.defRow}>
            <p className={styles.title}>
              {t(each.value)}：<span className={styles.desc}>{t(`${each.value}-tip`)}</span>
            </p>
            <Divider />
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTypeDef;
