import Dialog from '@/component/dialog';
import { CloseOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './ItemPromotionModal.module.scss';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Toast from '@/component/toast';
import {
  checkIsGiftPromotionValid,
  checkIsRuleValid,
} from '@/utils/PromotionCenterIntegration/checkCloudPromotion';
import { setItemValidPromotion } from '@/actions/promotion';
import { useCloseModalOnHomePage, useAddOnPromotion } from '@/hooks';
import PROMOTION_TAG from '@/assets/images/promotion-tag.png';
import PROMOTION_TAG_WHITE from '@/assets/images/promotionTagWhite.png';
import { GIFT_PROMOTION_TYPE } from '@/constants/promotion';
import ItemsDrawer from '@/component/RewardCenter/ItemsDrawer';
import useCrmPromotionContrary from '@/hooks/useCrmPromotionContrary';
import { isHasCRMCampaignFn } from '@/utils/CRMIntegration/crmPromotionContrary';
import { getPromotionCenterActivityRuleText } from '@/utils/PromotionCenterIntegration/getPromotionCenterDisplayText';

const ItemPromotionModal = (props) => {
  const {
    t,
    visible,
    onClose,
    onSkip,
    onConfirm,
    goOrder,
    promotion: { itemValidPromotion, promotionCode, promotionCenterList },
    crm: { selectedDiscount, selectedFreeItem, tempCampaign },
    currentOrder,
    setItemValidPromotion,
    selfConfig,
  } = props;

  useCloseModalOnHomePage(onClose);
  const { handleCheckIsHasCampaign } = useCrmPromotionContrary();
  const [tempPromotion, setTempPromotion] = useState(null);

  // 使用凑单促销 hook
  const {
    drawerProps,
    handleDrawerConfirm,
    handleCloseDrawer,
    goAddOnPromotion,
    handleSelectGiftReward,
  } = useAddOnPromotion({
    onSkip,
    onClose,
    goOrder,
    promotionCenterList,
  });

  useEffect(() => {
    const isAlreadySelected = itemValidPromotion?.find(
      (each) => each.isSelected
    );
    if (isAlreadySelected) {
      setTempPromotion(isAlreadySelected);
    }
  }, [itemValidPromotion]);

  const handleSkip = () => {
    setItemValidPromotion(
      itemValidPromotion.map((each) => ({ ...each, isSelected: undefined }))
    );
    onSkip();
  };

  const handleConfirm = () => {
    if (!tempPromotion) return Toast.info(t('choose-a-activity'));
    onConfirm(tempPromotion);
    onClose();
  };

  const { validPromotion, invalidPromotion } = useMemo(() => {
    const beforeSortValidPromotion = [];
    const invalidPromotion = [];
    itemValidPromotion?.forEach((each) => {
      const { validateInfo, promotion, recommendType } = each;
      const isRuleValid = checkIsRuleValid(validateInfo);
      const isGiftPromotionValid = checkIsGiftPromotionValid({
        promotion,
        recommendType,
      });
      const promotionCodes = promotion?.promotionCodes;
      // 促销码不对或者没输入时，直接跳过渲染该活动
      if (
        promotionCodes?.length &&
        (!promotionCode || !promotionCodes.includes(promotionCode))
      ) {
        return;
      }
      if (isRuleValid || isGiftPromotionValid) {
        const discountAmount =
          validateInfo?.result?.result?.discounts?.[0]?.amount || 0;
        const promotionDiscountValue = Number(discountAmount).toFixed(2);
        beforeSortValidPromotion.push({
          ...each,
          available: true,
          promotionDiscountValue,
          clickable: isGiftPromotionValid || discountAmount !== 0,
        });
      } else {
        invalidPromotion.push({ ...each, available: false, clickable: true });
      }
    });
    const validPromotion = beforeSortValidPromotion.sort(
      (a, b) => b.promotionDiscountValue - a.promotionDiscountValue
    );
    return { validPromotion, invalidPromotion };
  }, [itemValidPromotion]);

  const handleClickPromotionItem = (each) => {
    if (!each.available || !each.clickable) return;
    setTempPromotion(each);
  };

  // 是否有crm活动
  const isHasCrmCampaign = useMemo(() => {
    const crmCampaign = isHasCRMCampaignFn({
      itemList: currentOrder.itemList,
      selectedFreeItem,
      selectedDiscount,
    });
    return crmCampaign || tempCampaign?.length > 0;
  }, [currentOrder.itemList, selectedFreeItem, selectedDiscount, tempCampaign]);

  // 是否有促销码活动
  const isHasPromotionCode = useMemo(() => {
    return promotionCenterList?.some(
      (item) => item?.promotionCodes?.length > 0
    );
  }, [promotionCenterList]);

  // 展示的生效的促销活动(过滤同时存在的折扣活动数额较小的)
  const showValidPromotion = useMemo(() => {
    if (!validPromotion?.length) return [];

    // 找出所有有 promotionDiscountValue 且值大于0的项 (非满赠\满赠)
    const itemsWithDiscount = validPromotion.filter((item) => {
      const discountValue = item?.promotionDiscountValue;
      return (
        discountValue !== undefined &&
        discountValue !== null &&
        Number(discountValue) > 0 &&
        !GIFT_PROMOTION_TYPE.includes(item?.promotion?.type)
      );
    });

    // 找出最大值
    const maxDiscountValue =
      itemsWithDiscount.length > 0
        ? Math.max(
            ...itemsWithDiscount.map((item) =>
              Number(item.promotionDiscountValue)
            )
          )
        : null;

    // 找出所有没有 promotionDiscountValue 或值为0的项 以及满赠\满赠
    const itemsWithoutDiscount = validPromotion.filter((item) => {
      const discountValue = item?.promotionDiscountValue;
      return (
        discountValue === undefined ||
        discountValue === null ||
        Number(discountValue) === 0 ||
        GIFT_PROMOTION_TYPE.includes(item?.promotion?.type)
      );
    });

    // 找出所有 promotionDiscountValue 等于最大值的项
    const itemsWithMaxDiscount =
      maxDiscountValue !== null
        ? itemsWithDiscount.filter(
            (item) =>
              Number(item.promotionDiscountValue) === maxDiscountValue ||
              item?.isSelected
          )
        : [];

    // 合并：最大值的项 + 没有值或值为0的项
    return [...itemsWithMaxDiscount, ...itemsWithoutDiscount];
  }, [validPromotion, promotionCode]);

  useEffect(() => {
    // 仅展示1个满足条件的促销活动时 除满赠买赠 默认选择满足条件的促销活动  ;已参与crm活动,不选中
    if (showValidPromotion?.length !== 1 || isHasCrmCampaign) return;
    const isGiftPromotion = GIFT_PROMOTION_TYPE.includes(
      showValidPromotion[0]?.promotion?.type
    );
    if (!isGiftPromotion) {
      setTempPromotion(showValidPromotion[0]);
    }
  }, [showValidPromotion, isHasCrmCampaign]);

  const isHasValidPromotion = useMemo(() => {
    return showValidPromotion?.length > 0;
  }, [showValidPromotion]);

  const renderPromotionItem = (each) => {
    const isSelected = tempPromotion?.promotion.id === each.promotion.id;
    const isAvailable = each.available;
    const isGiftPromotion = GIFT_PROMOTION_TYPE.includes(each.promotion.type);
    // const isGiftPromotionSelected = each.recommendType === 'REACHED_RECOMMEND';
    // 是否展示折扣金额，满赠 买赠单独处理
    const isShowDiscountVal = !isGiftPromotion ? isAvailable : false;
    return (
      <div
        className={classNames(
          styles.item_promotion_item,
          isSelected && styles.item_promotion_selected,
          !each.clickable && styles.item_promotion_disabled,
          isAvailable && styles.item_promotion_valid
        )}
        key={each.promotion.id}
        onClick={() => {
          if (!isAvailable) return goAddOnPromotion(each);
          if (!isGiftPromotion) {
            const res = handleCheckIsHasCampaign();
            if (res) return;
            return handleClickPromotionItem(each);
          }
          return handleSelectGiftReward(each);
        }}
      >
        <div className={styles.item_promotion_info}>
          <img
            className={styles.item_promotion_tag}
            src={isSelected ? PROMOTION_TAG_WHITE : PROMOTION_TAG}
            alt="promotionTag"
          />
          <div className={styles.item_promotion_title}>
            <div className={styles.item_promotion_name}>
              {getPromotionCenterActivityRuleText({
                t,
                activityRule: each.promotion?.activityRule,
                type: each.promotion?.type,
                promotionName: each.promotion?.promotionName,
                selfConfig,
                promoCenterHitActivity: each,
              })}
            </div>
            {!isAvailable && (
              <div className={styles.item_promotion_invalidReason}>
                {renderInvalidReason(each)}
              </div>
            )}
          </div>
        </div>
        {!isAvailable && (
          <div className={styles.goAddItem}>{t('goAddItem')}</div>
        )}
        {isShowDiscountVal && (
          <div className={styles.discountNumber}>
            -${each.promotionDiscountValue}
          </div>
        )}
        {isAvailable && isGiftPromotion && (
          <div className={styles.goAddItem}>{t('selectGift')}</div>
        )}
      </div>
    );
  };

  const renderInvalidReason = (each) => {
    const {
      promotion: { type },
      recommendType,
      discountRate,
      benefitAmount,
      selectQuantity,
      selectDiscountRate,
    } = each;
    const isQuantityTargetCount =
      (type === 'totalAmountQuantityDiscount' &&
        recommendType === 'QUANTITY_TO_DISCOUNT') ||
      type === 'quantityItemDiscount';
    const targetCount = isQuantityTargetCount
      ? each?.targetCount
      : each?.targetCount.toFixed(2);

    const discountValue = discountRate
      ? `${discountRate}%`
      : `$${benefitAmount}`;
    // 满减折扣
    if (type === 'totalAmountQuantityDiscount') {
      if (recommendType === 'QUANTITY_TO_DISCOUNT') {
        return (
          <span>
            {t('buyMoreAmountEnjoyDiscount', { targetCount, discountValue })}
          </span>
        );
      }
      if (recommendType === 'AMOUNT_TO_DISCOUNT') {
        return (
          <span>
            {t('buyMoreItemEnjoyDiscount', { targetCount, discountValue })}
          </span>
        );
      }
    }
    // m件n折
    if (type === 'quantityItemDiscount') {
      if (recommendType === 'QUANTITY_TO_DISCOUNT') {
        return (
          <span>
            {t('buyMoreItemEnjoyBundleDiscount', {
              targetCount,
              selectQuantity,
              discountValue: selectDiscountRate,
            })}
          </span>
        );
      }
    }
    // 特价商品
    if (type === 'orderItemFixedPrice') {
      if (recommendType === 'AMOUNT_TO_DISCOUNT') {
        return (
          <span>
            {t('buyMoreAmountEnjoySpecialItem', {
              targetCount,
            })}
          </span>
        );
      }
    }
    if (GIFT_PROMOTION_TYPE.includes(type)) {
      // 满赠
      if (recommendType === 'AMOUNT_TO_DISCOUNT') {
        return (
          <span>
            {t('buyMoreAmountEnjoyGiftItem', {
              targetCount,
              selectQuantity,
            })}
          </span>
        );
      }
      // 买赠
      if (recommendType === 'QUANTITY_TO_DISCOUNT') {
        return (
          <span>
            {t('buyMoreItemEnjoyGiftItem', {
              targetCount,
              selectQuantity,
            })}
          </span>
        );
      }
    }
  };

  const beforeSelectItemCheck = () => {
    const res = handleCheckIsHasCampaign();
    return !res;
  };

  return (
    <>
      <Dialog
        visible={visible}
        html={
          <div className={styles.itemPromotionCenter}>
            <CloseOutlined className={styles.closeIcon} onClick={onClose} />
            <header className={styles.item_promotion_header}>
              {t('chooseOneDeal')}
            </header>
            <div className={styles.item_promotion_content}>
              {isHasValidPromotion && (
                <>
                  <div className={styles.item_promotion_type}>
                    {t('validPromotion')}
                  </div>
                  {showValidPromotion?.map((each) => renderPromotionItem(each))}
                </>
              )}
              {invalidPromotion.length > 0 && (
                <>
                  <div
                    className={`${styles.item_promotion_type} ${styles.item_promotion_type_invalid}`}
                  >
                    {t('invalidPromotion')}
                  </div>
                  {invalidPromotion?.map((each) => renderPromotionItem(each))}
                </>
              )}
            </div>
            <div className={styles.item_promotion_footer}>
              {(!isHasValidPromotion ||
                isHasCrmCampaign ||
                isHasPromotionCode) && (
                <div onClick={handleSkip}>{t('origin-price-buy')}</div>
              )}
              {isHasValidPromotion && (
                <div onClick={handleConfirm} className="linear-animate-btn">
                  {t('confirm')}
                </div>
              )}
            </div>
          </div>
        }
      />
      <ItemsDrawer
        {...drawerProps}
        onClose={handleCloseDrawer}
        handleConfirm={handleDrawerConfirm}
        beforeSelectItemCheck={beforeSelectItemCheck}
      />
    </>
  );
};

function mapStateToProps(state) {
  return {
    crm: state.crm,
    promotion: state.promotion,
    currentOrder: state.currentOrder,
    selfConfig: state.selfConfig,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    setItemValidPromotion,
  })(withTranslation()(ItemPromotionModal))
);
