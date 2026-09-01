import React, { Component } from 'react';
import styles from './Discount.module.scss';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Trans, withTranslation } from 'react-i18next';
import POINT from '@/assets/images/star.png';
import { changeSelectedDiscount } from '@/actions/crm_action';
import Toast from '@/component/toast';
import dayjs from 'dayjs';

class Discount extends Component {
  state = {};

  // 选中折扣
  handleChangeDiscount = (rule) => {
    const {
      t,
      crm: { memberCRMInfo, selectedFreeItem, selectedDiscount },
      changeSelectedDiscount,
      avocado,
      i18n: { language },
    } = this.props;
    const isAvocado = avocado?.outletInfo?.enabled === 1;
    const languageKey = language.replace('_', '-');
    if (!Object.keys(memberCRMInfo).length) {
      Toast.info(t('redeem-login-first'), 2000);
      return;
    }
    if (selectedFreeItem.length) {
      Toast.info(t('onlyOneFree'), 2000);
      return;
    }
    if (
      (memberCRMInfo?.pointBalance ?? 0) < rule.redeemRule?.parameters?.points
    ) {
      Toast.info(t('noEnoughPoints'), 2000);
      return;
    }
    if (isAvocado && !rule.isValid) {
      Toast.info(t(rule.invalidReason[0][languageKey]), 2000);
      return;
    }
    //原ad和自研关于id的字段名不一样，为了方便取值，在这里统一管理变量名，后改回一样，以防后期变动故先留存写法，方便调整
    let idFlag = isAvocado ? '_id' : '_id'; 
    if (selectedDiscount[idFlag] === rule[idFlag]) {
      changeSelectedDiscount({});
    } else {
      changeSelectedDiscount(rule);
    }
  };

  // ad会员折扣
  renderAdDiscount = () => {
    const {
      t,
      discountRules,
      crm: { selectedDiscount, selectedFreeItem },
      countRow,
      i18n: { language },
    } = this.props;
    const languageKey = language.replace('_', '-');
    const loyaltyDiscount = discountRules.filter(
      (each) => each.rewardType === 'loyalty'
    );
    const voucherDiscount = discountRules.filter(
      (each) => each.rewardType === 'voucher'
    );

    return (
      <>
        {loyaltyDiscount.length > 0 && (
          <div className={styles.ruleTitle}>{t(`discount_loyalty`)}</div>
        )}
        <div
          className={styles.ruleList}
          style={{
            gridTemplateColumns: `repeat(${countRow.count}, ${countRow.widthRate}%)`,
          }}
        >
          {loyaltyDiscount.map((rule) => {
            const strategy = rule.redeemRule.strategy;
            const value = rule.redeemRule.parameters.discount;
            const selected = selectedDiscount?._id === rule._id;
            const isDisabled =
              !rule.isSatisfyMinSpend ||
              selectedFreeItem.length ||
              (Object.keys(selectedDiscount).length && !selected) ||
              !rule.isValid;
            const discountTxt =
              strategy === 'byPercentageOff' ? `${value}% ` : `$${value} `;

            return (
              <div
                key={rule._id}
                className={classNames(
                  styles.ruleItem,
                  selected && styles.ruleItemSelected,
                  isDisabled && styles.disabledItem
                )}
                onClick={() => this.handleChangeDiscount(rule)}
              >
                <div className={styles.ruleDiscount}>
                  {`${discountTxt} ${t('off')}`}
                </div>
                <div className={styles.ruleCondition}>
                  {rule.actualDiscount ? (
                    <Trans
                      i18nKey="discount_info"
                      values={{
                        discount: `$${rule.actualDiscount?.toFixed(2) || 0}`,
                      }}
                      components={{
                        span: <span className={styles.discountTxt}></span>,
                      }}
                    />
                  ) : (
                    <span style={{ color: 'red' }}>
                      {t(rule.invalidReason[0][languageKey])}
                    </span>
                  )}
                </div>
                <div className={styles.ruleInfo}>
                  <div className={styles.pts}>
                    <img className={styles.pointImg} src={POINT} alt="point" />
                    <span>{`${rule.redeemRule?.parameters?.points} ${t('pts')}`}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {voucherDiscount.length > 0 && (
          <div className={styles.ruleTitle}>{t(`discount_voucher`)}</div>
        )}
        <div
          className={styles.ruleList}
          style={{
            gridTemplateColumns: `repeat(${countRow.count}, ${countRow.widthRate}%)`,
          }}
        >
          {voucherDiscount.map((rule) => {
            const { actualDiscount, isSatisfyMinSpend, useEndTime = '' } = rule;
            const strategy = rule.redeemRule.strategy;
            const value = rule.redeemRule.parameters.discount;
            const selected = selectedDiscount?._id === rule._id;
            const isDisabled =
              !isSatisfyMinSpend ||
              selectedFreeItem.length ||
              (Object.keys(selectedDiscount).length && !selected) ||
              !rule.isValid;
            const discountTxt =
              strategy === 'byPercentageOff' ? `${value}% ` : `$${value} `;
            return (
              <div
                key={rule._id}
                className={classNames(
                  styles.ruleItem,
                  styles.ruleVoucherItem,
                  selected && styles.ruleItemSelected,
                  isDisabled && styles.disabledItem
                )}
                onClick={() => this.handleChangeDiscount(rule)}
              >
                <div
                  className={classNames(
                    styles.ruleDiscount,
                    styles.ruleVoucherDiscount
                  )}
                >
                  {`${discountTxt} ${t('off')}`}
                </div>
                <div className={styles.voucherName}>{rule.name}</div>
                <div
                  className={classNames(
                    styles.ruleCondition,
                    styles.ruleVoucherCondition
                  )}
                >
                  {actualDiscount ? (
                    <Trans
                      i18nKey="discount_info"
                      values={{
                        discount: `$${actualDiscount?.toFixed(2) || 0}`,
                      }}
                      components={{
                        span: <span className={styles.discountTxt}></span>,
                      }}
                    />
                  ) : (
                    <span style={{ color: 'red' }}>
                      {t(rule.invalidReason[0][languageKey])}
                    </span>
                  )}
                </div>
                <div className={styles.voucherExpire}>
                  {useEndTime
                    ? t('voucher_period', {
                        value: dayjs(useEndTime).format('YYYY/MM/DD'),
                      })
                    : t('permanently_voucher')}
                </div>
                <div className={styles.ruleInfo}>
                  <div className={styles.voucherNum}>
                    {t('voucher_count', { value: 1 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // CRM会员折扣
  renderCRMDiscount = () => {
    const {
      t,
      crm: { selectedDiscount, selectedFreeItem },
      countRow,
      rowItems,
    } = this.props;

    return (
      <div
        className={styles.ruleList}
        style={{
          gridTemplateColumns: `repeat(${countRow.count}, ${countRow.widthRate}%)`,
        }}
      >
        {rowItems.map((rule) => {
          const {
            strategy,
            parameters: { points, discount },
          } = rule.redeemRule;
          const selected = selectedDiscount?._id === rule._id;
          const disabledItem =
            selectedFreeItem.length ||
            (Object.keys(selectedDiscount).length &&
              rule._id !== selectedDiscount?._id);
          const discountTxt =
            strategy === 'byPercentageOff' ? `${discount}% ` : `$${discount} `;

          return (
            <div
              key={rule._id}
              className={classNames(
                styles.ruleItem,
                selected && styles.ruleItemSelected,
                disabledItem && styles.disabled
              )}
              onClick={() => this.handleChangeDiscount(rule)}
            >
              <div className={styles.ruleDiscount}>
                {`${discountTxt} ${t('off')}`}
              </div>
              <div className={styles.ruleCondition}>
                <Trans
                  i18nKey="discount_info"
                  values={{
                    discount: `$${rule.actualDiscount?.toFixed(2) || 0}`,
                  }}
                  components={{
                    span: <span className={styles.discountTxt}></span>,
                  }}
                />
              </div>
              <div className={styles.ruleInfo}>
                <div className={styles.pts}>
                  <img className={styles.pointImg} src={POINT} alt="point" />
                  <span>{`${points} ${t('pts')}`}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  render() {
    const { avocado } = this.props;
    const isAvocado = avocado?.outletInfo?.enabled === 1;
    return isAvocado ? this.renderAdDiscount() : this.renderCRMDiscount();
  }
}

function mapStateToProps(state) {
  return {
    currentOrder: state.currentOrder,
    crm: state.crm,
    avocado: state.avocado,
  };
}

export default withRouter(
  connect(mapStateToProps, { changeSelectedDiscount })(
    withTranslation()(Discount)
  )
);
