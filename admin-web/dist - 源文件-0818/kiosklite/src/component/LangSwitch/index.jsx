import { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import styles from './langSwitch.module.scss';
import { systemLanguage } from '@/constants/mockData';
import { withTranslation } from 'react-i18next';

const LangSwitch = (props) => {
  const {
    t,
    selfConfig,
    i18n,
    i18n: { language },
  } = props;

  const [langList, setLangList] = useState([]);

  useEffect(() => {
    const availableLangs = systemLanguage.filter((lang) =>
      selfConfig?.configMap?.id_10?.includes(lang.code)
    );
    setLangList(availableLangs);
  }, [selfConfig, language]);

  const handleToggle = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className={styles.LangSwitchContainer}>
      {langList.map((lan) => {
        return (
          <div
            key={lan.code}
            className={`${styles.LangSwitchItem} ${language === lan.code ? styles.LangSwitchItemActive : ''}`}
            onClick={() => {
              handleToggle(lan.code);
            }}
          >
            {lan.abbr}
          </div>
        );
      })}
    </div>
  );
};

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps)(withTranslation()(LangSwitch));
