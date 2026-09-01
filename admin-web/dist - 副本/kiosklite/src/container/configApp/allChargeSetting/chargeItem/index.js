import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './chargeItem.module.scss';
import Radio from '../../radio';
import { Checkbox } from 'antd';

class ChargeItem extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { t, info, handleSelectRadio, disabled } = this.props;

    return (
      <div className={styles.chargeItemBox}>
        <div className={styles.chargeItemTitle}>
          <span>{t([info.title])}</span>
          {disabled ? (
            <span className={styles.titleDualPriceHint}>
              {t('entire-order-charge-dual-price-hint')}
            </span>
          ) : null}
        </div>
        <div className={styles.chargeItemData}>
          {info.data.length ? (
            info.data.map((item) => {
              let checked = false;
              if (info.id === 1) {
                checked =
                  item.id === info.select.id &&
                  item.ratetype === info.select.ratetype &&
                  item.rate === info.select.rate;
              } else {
                checked = item.id === info.select.id;
              }

              return (
                <div
                  key={item.id}
                  className={`${styles.chargeItem}${
                    disabled ? ` ${styles.chargeItemDisabled}` : ''
                  }`}
                  onClick={() => {
                    if (disabled) return;
                    handleSelectRadio(info.id, item);
                  }}
                >
                  <Radio checkedB={checked} />
                  {item.id == -1 ? (
                    <span>{t('free')}</span>
                  ) : (
                    <span>
                      {item.ratetype == 2 ? `${item.rate}%` : `$${item.rate}`}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <span className={styles.nocharge}>
              <i>!</i>
              {t('no-charge')}
            </span>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(withTranslation()(ChargeItem));
