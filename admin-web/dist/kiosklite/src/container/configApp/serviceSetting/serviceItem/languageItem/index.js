import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './languageItem.module.scss';
import Checkbox from '../../../checkbox';
import Toast from '../../../../../component/toast';
import { languageChooseOptions } from '@/constants/mockData';

class LanguageItem extends Component {
  render() {
    const {
      t,
      configInfo: { id, value },
    } = this.props;

    return (
      <div className={styles.langBox}>
        {languageChooseOptions.map((item) => {
          return (
            <div
              className={styles.langItem}
              key={item.code}
              onClick={() => {
                if (!value.length || value.length > 1) {
                  this.props.checkBox(id, item.code);
                } else if (value.length == 1) {
                  if (value[0] != item.code) {
                    this.props.checkBox(id, item.code);
                  } else {
                    Toast.info(t('language-tip'), 1000);
                  }
                }
              }}
            >
              <Checkbox checkedB={value.includes(item.code)} />
              <span className={styles.checkText}>{t('language-' + item.code)}</span>
            </div>
          );
        })}
      </div>
    );
  }
}

export default withTranslation()(LanguageItem);
