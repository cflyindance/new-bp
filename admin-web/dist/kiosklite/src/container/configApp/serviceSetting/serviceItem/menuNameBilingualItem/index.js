import React from 'react';
import { withTranslation } from 'react-i18next';
import styles from './menuNameBilingualItem.module.scss';
import Checkbox from '../../../checkbox';
import Radio from '../../../radio';

const MenuNameBilingualItem = ({
  t,
  visible,
  configInfo,
  languageOptions = [],
  onDisplayLangsChange,
  onPrimaryLangChange,
}) => {
  const { displayLangs = [], primaryLang = '' } = configInfo?.value || {};
  const isMaxSelected = displayLangs.length >= 2;
  const selectedDisplayLangs = displayLangs.length ? displayLangs : [];

  const handleDisplayLangClick = (code) => {
    if (displayLangs.includes(code)) {
      onDisplayLangsChange(code);
      return;
    }
    if (isMaxSelected) {
      return;
    }
    onDisplayLangsChange(code);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.subSection}>
        <div className={styles.subLabel}>{t('menu-name-display-langs')}</div>
        <div className={styles.langBox}>
          {languageOptions.map((code) => {
            const isChecked = displayLangs.includes(code);
            const isDisabled = !isChecked && isMaxSelected;

            return (
              <div
                className={`${styles.langItem} ${
                  isDisabled ? styles.langItemDisabled : ''
                }`}
                key={code}
                onClick={() => {
                  if (!isDisabled) {
                    handleDisplayLangClick(code);
                  }
                }}
              >
                <Checkbox checkedB={isChecked} />
                <span className={styles.checkText}>
                  {t('language-' + code)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {selectedDisplayLangs.length > 0 && (
        <div className={styles.subSection}>
          <div className={styles.subLabel}>{t('menu-name-primary-lang')}</div>
          <div className={styles.radioBox}>
            {selectedDisplayLangs.map((code) => (
              <div
                className={styles.langItem}
                key={code}
                onClick={() => onPrimaryLangChange(code)}
              >
                <Radio checkedB={primaryLang === code} />
                <span className={styles.checkText}>{t('language-' + code)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default withTranslation()(MenuNameBilingualItem);
