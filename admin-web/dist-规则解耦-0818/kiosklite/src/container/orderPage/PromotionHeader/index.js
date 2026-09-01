import React, { useCallback, useMemo, useState, memo } from 'react';
import styles from './index.module.scss';
import ARROW_RIGHT from '@/assets/images/arrow-right.png';
import Dialog from '@/component/dialog';
import OrderDiscountInfo from '@/component/OrderDiscountInfo';
import { useTranslation } from 'react-i18next';
import checkCRMStatus from '@/utils/checkCRMStatus';
import { connect } from 'react-redux';

// 促销改版，对接促销中心，当前组件暂时废弃
const PromotionHeader = (props) => {
  const [visible, setVisible] = useState(false);
  const {
    crm: { memberCRMInfo, isMemberOrderedBefore },
    promotion: { orderDiscount, cloudPromotion },
    currentOrder: { orderType },
    allSysConfig,
  } = props;
  const { t } = useTranslation();

  const isCRMEnable = useMemo(() => {
    if (allSysConfig && Object.keys(allSysConfig).length) {
      return !checkCRMStatus(allSysConfig);
    }
    return false;
  }, [allSysConfig]);

  const orderRedeemInfo = useMemo(() => {
    const orderTypeMap = {
      TO_GO: 'TOGO',
      DINE_IN: 'DINE_IN',
      PICK_UP: 'PICKUP',
    };
    const actualType = orderTypeMap[orderType];
    return cloudPromotion.filter(
      (each) =>
        each.type === 'WholeOrderGift' &&
        each.conditions[0]['order/orderType']?.includes(actualType)
    );
  }, [cloudPromotion, orderType]);

  const data = useMemo(() => {
    // 促销码活动不展示、没开crm不展示新会员活动
    if (orderDiscount.length)
      return orderDiscount.filter(
        (each) =>
          ((each?.activityRule?.isFirstOrderDiscount === '1' && isCRMEnable) ||
            each?.activityRule?.isFirstOrderDiscount !== '1') &&
          each?.activityRule?.usePromotionCode !== '1'
      );
    if (orderRedeemInfo.length) return orderRedeemInfo;
    return [];
  }, [orderDiscount, orderRedeemInfo, isCRMEnable]);

  const isShowMore = useMemo(() => {
    return data.length > 1;
  }, [data]);

  // 首单折扣
  const firstOrderDiscount = useMemo(() => {
    return orderDiscount.find(
      (each) => each.activityRule.isFirstOrderDiscount === '1' &&
        each?.activityRule?.usePromotionCode !== '1'
    );
  }, [orderDiscount]);

  // 不包含促销码活动的活动列表
  const excludePromocodeList = useMemo(() => {
    return orderDiscount.filter(
      (each) =>
        each?.activityRule?.usePromotionCode !== '1'
    );
  }, [orderDiscount]);

  const firstDiscountItemInfo = useMemo(() => {
    if (!orderDiscount.length || !excludePromocodeList.length) return null;
    const firstPriorityDiscount = firstOrderDiscount || excludePromocodeList[0];
    const { satisfyPrice, discountType, discountNumber, isFirstOrderDiscount } =
      firstPriorityDiscount?.activityRule;
    const isFixed = discountType === 'fixDiscount';
    return {
      satisfyPrice,
      discountNumber: `${isFixed ? '$' : ''}${discountNumber}${!isFixed ? '%' : ''}`,
      isFirstOrderDiscount,
    };
  }, [isShowMore, orderDiscount, firstOrderDiscount, excludePromocodeList]);

  const orderDiscountContent = useMemo(() => {
    const isLogin = Object.keys(memberCRMInfo || {})?.length > 0;
    if (
      firstDiscountItemInfo?.isFirstOrderDiscount === '1' &&
      isCRMEnable &&
      (!isLogin || (isLogin && !isMemberOrderedBefore))
    ) {
      const { satisfyPrice, discountNumber } = firstDiscountItemInfo;
      if (satisfyPrice === '0') {
        return t('firstOrder_no_threshold', { discountNumber });
      } else {
        return t('firstOrder_threshold', { satisfyPrice, discountNumber });
      }
    }
    if (isShowMore && excludePromocodeList.length) return t('discountInfo');
    if (!firstDiscountItemInfo) return null;
    return Number(firstDiscountItemInfo?.satisfyPrice) > 0
      ? t('discountItemInfo', {
        price: firstDiscountItemInfo?.satisfyPrice,
        discountNumber: firstDiscountItemInfo?.discountNumber,
      })
      : t('discountWithZeroPrice', {
        discountNumber: firstDiscountItemInfo?.discountNumber,
      });
  }, [
    isShowMore,
    t,
    firstDiscountItemInfo,
    memberCRMInfo,
    isMemberOrderedBefore,
  ]);

  const getOrderRedeemItem = useCallback((info) => {
    const condition = info.conditions[0];
    const benefitCondition = info.benefits[0]?.condition;
    const range = condition['order/totalAmount'];
    const count = benefitCondition.maxNum;
    let price = `$${range['gt*']}+`;
    if (Object.keys(range).length === 2) {
      price = `$${range['gt*']}-$${range['lt*']}`;
    }
    return {
      price,
      count,
    };
  }, []);

  const redeemItemInfo = useMemo(() => {
    if (isShowMore || !orderRedeemInfo.length) return null;
    const info = orderRedeemInfo[0];
    return getOrderRedeemItem(info);
  }, [isShowMore, orderRedeemInfo, getOrderRedeemItem]);

  const orderRedeemContent = useMemo(() => {
    if (isShowMore && orderRedeemInfo.length) return t('orderRedeemInfo');
    if (!redeemItemInfo) return null;
    return t('redeemItemInfo', {
      price: redeemItemInfo.price,
      count: redeemItemInfo.count,
    });
  }, [orderRedeemInfo, isShowMore, t, redeemItemInfo]);

  const content = useMemo(() => {
    return orderRedeemContent || orderDiscountContent;
  }, [orderRedeemContent, orderDiscountContent]);

  const renderOrderPromotionInfo = useCallback(
    (row, idx) => {
      const { activityType, activityRule, type } = row;
      if (type === 'WholeOrderGift') {
        const { price, count } = getOrderRedeemItem(row);
        return (
          <>
            <span>{idx + 1}. </span>
            <span>{t('redeemItemInfo', { price, count })}</span>
          </>
        );
      }
      if (activityType === 'orderDiscount') {
        const {
          satisfyPrice,
          discountType,
          discountNumber,
          isFirstOrderDiscount,
        } = activityRule;
        const isFixed = discountType === 'fixDiscount';
        const discountNumberStr = `${isFixed ? '$' : ''}${discountNumber}${!isFixed ? '%' : ''}`;
        let content = null;
        if (isFirstOrderDiscount === '1') {
          content =
            Number(satisfyPrice) > 0
              ? t('firstOrder_threshold', {
                satisfyPrice,
                discountNumber: discountNumberStr,
              })
              : t('firstOrder_no_threshold', {
                discountNumber: discountNumberStr,
              });
        } else {
          content =
            Number(satisfyPrice) > 0
              ? t('discountItemInfo', {
                price: satisfyPrice,
                discountNumber: discountNumberStr,
              })
              : t('discountWithZeroPrice', {
                discountNumber: `${isFixed ? '$' : ''}${discountNumber}${!isFixed ? '%' : ''}`,
              });
        }
        return (
          <span>
            {idx + 1}. {content}
          </span>
        );
      }
      return null;
    },
    [getOrderRedeemItem, t]
  );

  if (!data.length) return null;
  return (
    <>
      <div
        className={styles.OrderDiscountFooter}
        onClick={() => setVisible(true)}
      >
        <span>{content}</span>
        {isShowMore && (
          <span className={styles.more}>
            {/*<span className={styles.moreText}>*/}
            {/*  {t('discountInfoTotal', { count: orderDiscount.length })}*/}
            {/*</span>*/}
            <img src={ARROW_RIGHT} alt="more" />
          </span>
        )}
      </div>
      <Dialog
        visible={visible}
        html={
          <OrderDiscountInfo
            data={data}
            renderOrderPromotionInfo={renderOrderPromotionInfo}
            setVisible={setVisible}
          />
        }
        onClose={() => setVisible(false)}
      />
    </>
  );
};

function mapStateToProps(state) {
  return {
    promotion: state.promotion,
    currentOrder: state.currentOrder,
    crm: state.crm,
    allSysConfig: state.allSysConfig,
  };
}

export default connect(mapStateToProps, {})(PromotionHeader);
