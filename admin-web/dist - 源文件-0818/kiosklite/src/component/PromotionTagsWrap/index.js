import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from './index.module.scss';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getPromotionCenterActivityRuleText } from '@/utils/PromotionCenterIntegration/getPromotionCenterDisplayText';
import i18n from '@/assets/i18n/i18n';
import formatOrdinals from '@/utils/formatOrdinals';
import MOREPROMOTION from '@/assets/images/morePromotion.png';
import RETRACTPROMOTION from '@/assets/images/retractPromotion.png';
import { GIFT_PROMOTION_TYPE } from '@/constants/promotion';

/**
 * 促销标签组件
 * @param {Object} itemInfo - 商品信息对象，需要包含 id 属性
 * @param {Object} promotion - 促销数据对象，包含 buyDiscountRule, buyGiftRule, itemMatchCloudPromotion
 * @param {boolean} isComboType - 是否是套餐类型，如果是套餐则不显示促销标签
 * @param {Array<string>} tags - 促销标签文本数组（可选，如果提供则直接使用，否则根据 itemInfo 和 promotion 计算）
 * @param {string} className - 自定义样式类名
 */
const PromotionTagsWrap = ({
  itemInfo,
  promotion,
  isComboType = false,
  tags,
  className,
}) => {
  const { t } = useTranslation();
  const selfConfig = useSelector((state) => state.selfConfig);
  const [showTotalPromotion, setShowTotalPromotion] = useState(false);
  const promotionWrapRef = useRef(null);

  // 点击外部区域关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showTotalPromotion || !promotionWrapRef.current) return;

      // 处理触屏事件
      const target = event.touches?.[0]?.target || event.target;

      if (!promotionWrapRef.current.contains(target)) {
        setShowTotalPromotion(false);
      }
    };

    if (showTotalPromotion) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTotalPromotion]);

  // 处理折扣标签 - kiosk本地 M件N折
  const discountList = useMemo(() => {
    if (!promotion?.buyDiscountRule || !itemInfo) return [];
    const discountInfo = promotion.buyDiscountRule.find((info) =>
      info?.activityRule?.buyDishes?.includes(itemInfo.id)
    );
    if (!discountInfo) return [];
    const {
      activityRule: {
        giftsDiscount,
        buyNumber,
        giftsDiscountRule,
        buyType,
      },
    } = discountInfo;
    const isIdenticalBuyType = buyType === 'identical';
    const isEachItemQty = Number(buyNumber) === 1;
    const buyNumberStr =
      i18n.language === 'en' ? formatOrdinals(buyNumber + '') : buyNumber + '';
    const text =
      giftsDiscountRule !== '1'
        ? isEachItemQty
          ? t('secondDiscountEach', { value: giftsDiscount })
          : t(
              isIdenticalBuyType
                ? 'secondDiscountIdentical'
                : 'secondDiscount',
              { value: giftsDiscount, quantity: buyNumberStr }
            )
        : t(
            isIdenticalBuyType ? 'overDiscountIdentical' : 'overDiscount',
            { value: giftsDiscount, quantity: buyNumber }
          );
    return [text];
  }, [promotion?.buyDiscountRule, itemInfo, t]);

  // 处理买赠标签 - kiosk本地 买X送N
  const enabledBuyGifts = useMemo(() => {
    if (!promotion?.buyGiftRule || !itemInfo) return [];
    return promotion.buyGiftRule
      ?.filter((each) => each?.activityRule?.buyDishes?.includes(itemInfo.id))
      ?.map(({ activityRule: { buyNumber, giftsNumber } }) =>
        t('buy-x-give-n', { buyNumber, giftsNumber })
      );
  }, [promotion?.buyGiftRule, itemInfo, t]);

  // 处理促销中心活动标签
  const commercialPromotion = useMemo(() => {
    if (!promotion?.itemMatchCloudPromotion || !itemInfo) return [];
    const itemPromotionCenterInfo =
      promotion.itemMatchCloudPromotion?.[itemInfo.id] || [];
    // 过滤出商品级promotion 满减 满赠，买赠 促销码 不展示标签
    return itemPromotionCenterInfo
      .filter((promotion) => {
        const isExcludedType =
          promotion?.promotionType === 'totalAmountQuantityDiscount' ||
          GIFT_PROMOTION_TYPE.includes(promotion?.promotionType);
        const hasPromotionCodes = promotion?.promotionCodes?.length > 0;
        return !isExcludedType && !hasPromotionCodes;
      })
      .map((each) => {
        const { activityRule, promotionName, promotionType } = each;
        return getPromotionCenterActivityRuleText({
          t,
          activityRule,
          type: promotionType,
          promotionName,
          selfConfig,
          promoCenterHitActivity: {
            promotion: {
              activityRule,
              type: promotionType,
            },
          },
        });
      });
  }, [promotion?.itemMatchCloudPromotion, itemInfo, t, selfConfig]);

  // 合并所有促销标签
  const combinePromotion = useMemo(() => {
    // 如果直接提供了 tags，则使用 tags
    if (tags && Array.isArray(tags)) {
      return tags;
    }
    // 否则根据 itemInfo 和 promotion 计算
    return [...discountList, ...enabledBuyGifts, ...commercialPromotion];
  }, [tags, discountList, enabledBuyGifts, commercialPromotion]);

  // 如果是套餐类型，子菜不显示促销标签
  if (isComboType) return null;

  if (!combinePromotion || !combinePromotion.length) return null;

  const showMoreIcon = combinePromotion.length > 1;
  const firstTag = combinePromotion[0];

  const toggleTotalPromotion = (e, active) => {
    // 打开、关闭完整promotionTag
    e.stopPropagation();
    setShowTotalPromotion(active);
  };

  // 标签展开时，阻止整个组件的点击事件向上冒泡
  const handleContainerClick = (e) => {
    if (!showTotalPromotion) return;
    e.stopPropagation();
  };

  // 标签子项
  const renderPromotionTag = (promotionInfoText) => {
    return (
      <div className={styles.promotionTagItem} key={promotionInfoText}>
        {promotionInfoText}
      </div>
    );
  };

  return (
    <div
      ref={promotionWrapRef}
      className={classNames(
        styles.promotionTagsWrap,
        { [styles.showTotalPromotion]: showTotalPromotion },
        className
      )}
      onClick={handleContainerClick}
    >
      {!showTotalPromotion && (
        <>
          {renderPromotionTag(firstTag)}
          {showMoreIcon && (
            <img
              src={MOREPROMOTION}
              alt="morePromotion"
              onClick={(e) => toggleTotalPromotion(e, true)}
            />
          )}
        </>
      )}
      {showTotalPromotion && (
        <>
          {/* 隐藏的占位元素，保持文档流高度，防止坍塌 */}
          <div className={styles.placeholderBlock}>
            {combinePromotion.map((each) => {
              return renderPromotionTag(each);
            })}
            <img src={RETRACTPROMOTION} alt="placeholder" />
          </div>
          {/* 绝对定位的展示元素 */}
          <div className={styles.totalPromotionBlock}>
            {combinePromotion.map((each) => {
              return renderPromotionTag(each);
            })}
            <img
              src={RETRACTPROMOTION}
              alt="restractPromotion"
              onClick={(e) => toggleTotalPromotion(e, false)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PromotionTagsWrap;
