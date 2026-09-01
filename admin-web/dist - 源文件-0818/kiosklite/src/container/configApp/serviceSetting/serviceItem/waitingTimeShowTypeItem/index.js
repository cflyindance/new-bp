import React from 'react';
import { withTranslation } from 'react-i18next';
import styles from './waitingTimeShowTypeItem.module.scss';
import Checkbox from '../../../checkbox';
import Toast from '../../../../../component/toast';

const WaitingTimeShowTypeItem = ({ t, configInfo, checkBox }) => {
  const { id, value = [] } = configInfo;

  const typeList = [
    {
      code: 'count',
      label: 'waiting-time-show-type-count',
    },
    {
      code: 'time',
      label: 'waiting-time-show-type-time',
    },
  ];

  const handleClick = (typeCode) => {
    // 如果当前只有一个选中，且点击的是已选中的，则不允许取消（必须至少选一个）
    if (value.length === 1 && value.includes(typeCode)) {
      Toast.info(t('waiting-time-show-type-tip'), 1000);
      return;
    }
    checkBox(id, typeCode);
  };

  return (
    <div className={styles.typeBox}>
      {typeList.map((item) => {
        return (
          <div
            className={styles.typeItem}
            key={item.code}
            onClick={() => handleClick(item.code)}
          >
            <Checkbox checkedB={value.includes(item.code)} />
            <span className={styles.checkText}>{t(item.label)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default withTranslation()(WaitingTimeShowTypeItem);

