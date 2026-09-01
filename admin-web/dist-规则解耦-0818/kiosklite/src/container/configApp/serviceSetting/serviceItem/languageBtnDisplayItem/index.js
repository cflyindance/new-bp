import React from 'react';
import { withTranslation } from 'react-i18next';
import styles from './languageBtnDisplayItem.module.scss';
import Checkbox from '../../../checkbox';
import { languageChooseOptions } from '@/constants/mockData';

const LanguageBtnDisplayItem = ({ t, configInfo, checkBox }) => {
  const { id, value = [] } = configInfo;
  const isMaxSelected = value.length >= 2;

  const handleClick = (code) => {
    if (value.includes(code)) {
      checkBox(id, code);
      return;
    }
    if (isMaxSelected) {
      return;
    }
    checkBox(id, code);
  };

  return (
    <div className={styles.langBox}>
      {languageChooseOptions.map((item) => {
        const isChecked = value.includes(item.code);
        const isDisabled = !isChecked && isMaxSelected;

        return (
          <div
            className={`${styles.langItem} ${
              isDisabled ? styles.langItemDisabled : ''
            }`}
            key={item.code}
            onClick={() => {
              if (!isDisabled) {
                handleClick(item.code);
              }
            }}
          >
            <Checkbox checkedB={isChecked} />
            <span className={styles.checkText}>
              {t('language-' + item.code)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default withTranslation()(LanguageBtnDisplayItem);
