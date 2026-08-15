import React, { useMemo, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { Trans, withTranslation } from 'react-i18next';
import styles from './SelectedRewards.module.scss';
import {
  changeFreeItem,
  changeSelectedDiscount,
  setTempCampaign,
} from '@/actions/crm_action';
import ImgCard from '@/component/imgCard';
import POINT from '@/assets/images/star.png';
import CARTBLACK from '@/assets/images/cart-black.png';
import Dialog from '@/component/dialog';
import { getDishItemLanguage } from '@/utils/busTools';

const SelectedRewards = (props) => {
  const {
    crm: { tempCampaign },
    t,
    i18n: { language },
    selfConfig,
    changeFreeItem,
    changeSelectedDiscount,
    setTempCampaign,
  } = props;
  const [chosenItemVisible, setChosenItemVisible] = useState(false);

  const item = tempCampaign?.[0] || {};

  const campaignType = useMemo(() => {
    return item.rewardRule?.redeemRule.strategy;
  }, [item]);

  const isDiscount = useMemo(() => {
    return ['byPercentageOff', 'byFixedAmount'].includes(campaignType);
  }, [campaignType]);

  const isFreeItem = useMemo(() => {
    return campaignType === 'byFreeItem';
  }, [campaignType]);

  const itemName = useMemo(() => {
    return item.name
      ? getDishItemLanguage(item.fieldDisplayNameGroups, language) ||
          item.name
      : '';
  }, [item.name, language]);

  const discountTxt = useMemo(() => {
    if (!isDiscount) return;
    const {
      strategy,
      parameters: { discount },
    } = item?.rewardRule?.redeemRule;
    return strategy === 'byPercentageOff' ? `${discount}%` : `$${discount}`;
  }, [item?.rewardRule?.redeemRule]);

  const deleteItem = () => {
    if (isDiscount) {
      changeSelectedDiscount({});
    } else if (isFreeItem) {
      changeFreeItem([]);
    }
    setTempCampaign(null);
    setChosenItemVisible(false);
  };

  const freeItem = () => {
    return (
      <div className={styles.orderItemInfo}>
        <div className={styles.imgWrapper}>
          <ImgCard selfConfig={selfConfig} itemInfo={item} />
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.itemName}>{itemName}</div>
          {item.itemPoints && (
            <div className={styles.pointShow}>
              <img className={styles.pointImg} src={POINT} alt="point" />
              <div
                className={styles.pointText}
              >{`${item.itemPoints} ${t('pts')}`}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const discountItem = () => {
    const {
      parameters: { points },
    } = item?.redeemRule;
    return (
      <div className={styles.orderItemInfo}>
        <div className={styles.ruleDiscount}>
          <span>{discountTxt}</span>
          <span className={styles.discountOff}>{t('off')}</span>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.itemName}>
            <Trans
              i18nKey="discount_info"
              values={{
                discount: `$${item.actualDiscount.toFixed(2)}`,
              }}
              components={{
                span: <span className={styles.discountTxt}></span>,
              }}
            />
          </div>
          {points && (
            <div className={styles.pointShow}>
              <img className={styles.pointImg} src={POINT} alt="point" />
              <div className={styles.pointText}>{`${points} ${t('pts')}`}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={styles.chosenItem}
        onClick={() => setChosenItemVisible(true)}
      >
        <div className={styles.cartBox}>
          <img className={styles.cart} src={CARTBLACK} alt="cart"></img>
          <span className={styles.count}>1</span>
        </div>
      </div>

      <Dialog
        visible={chosenItemVisible}
        html={
          <div className={styles.chosenItemWrapper}>
            <div className={styles.orderItem}>
              {isDiscount ? discountItem() : freeItem()}
              <div className={styles.btn} onClick={deleteItem}>
                {t('operate-remove')}
              </div>
            </div>

            <div
              className={styles.continue}
              onClick={() => setChosenItemVisible(false)}
            >
              {t('continue')}
            </div>
          </div>
        }
        onClose={() => setChosenItemVisible(false)}
      />
    </>
  );
};

function mapStateToProps(state) {
  return {
    crm: state.crm,
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps, {
  changeSelectedDiscount,
  changeFreeItem,
  setTempCampaign,
})(withTranslation()(SelectedRewards));
