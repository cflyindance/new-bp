import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './radioGroup.module.scss';
import Radio from '../radio';

class RadioGroup extends Component {
  render() {
    const {
      t,
      configInfo,
      configInfo: { id, value, key },
      num,
      disabledValues = [],
    } = this.props;
    let domlist = [];

    for (let i = 0; i < num; i++) {
      const disabled = disabledValues.includes(i);
      domlist.push(
        <div
          key={i}
          aria-disabled={disabled}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.45 : 1,
          }}
          onClick={() => {
            if (!disabled) this.props.handleRadio(id, i);
          }}
        >
          <Radio checkedB={value === i} />
          <span className={styles.radioText}>{t([key + '-' + i])}</span>
        </div>
      );
    }

    return (
      <div className={styles.serviceBottom}>
        {id === 24 && configInfo.Authorization && (
          <span style={{ color: 'red', marginRight: '2rem' }}>
            {t('change-tips-procedure-authorize')}
          </span>
        )}
        {domlist}
      </div>
    );
  }
}

export default withTranslation()(RadioGroup);
