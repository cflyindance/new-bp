import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import Dialog from '@/component/dialog';
import {
  changeSkipPromotionCalculationStatus,
  recalculatePromotion,
  removeFreeItemInOrder,
  removeItemRewardInfoFromOrder,
  removeRewardItemFromList,
  recountCurrentOrderList,
  removeLocalPromotionRewardInfo,
} from '@/actions';
import {
  setTempCampaign,
  changeFreeItem,
  changeSelectedDiscount,
} from '@/actions/crm_action';
import {
  setItemValidPromotion,
  changeCrmPromotionContraryInfo,
  setIsPauseAutoValidatePromotion,
  setPromotionCode,
} from '@/actions/promotion';
import styles from './CrmPromotionMutual.module.scss';
import React, { useMemo, useEffect } from 'react';
import RewardItem from '@/component/RewardCenter/RewardItem';
import Big from 'big.js';
import { getItemPrice } from '@/utils/priceCalculator';
import { GIFT_PROMOTION_TYPE } from '@/constants/promotion';
import { useTranslation } from 'react-i18next';
import i18n from '@/assets/i18n/i18n';
import formatOrdinals from '@/utils/formatOrdinals';
import { useCloseModalOnHomePage } from '@/hooks';
import { getValidCategoryList } from '@/utils/getStandardCateDish';
import { isHasCRMCampaignFn } from '@/utils/CRMIntegration/crmPromotionContrary';
import {
  getMatchedActivityRuleItem,
  getPromotionCenterActivityRuleText,
  normalizePromotionDisplaySource,
  resolvePromotionDisplayName,
} from '@/utils/PromotionCenterIntegration';

const CrmPromotionMutual = (props) => {
  const { t } = useTranslation();
  const {
    crm: { selectedDiscount, selectedFreeItem },
    promotion: { buyGifts, promotionList, isSkipPromotionCalculation },
    currentOrder: { itemList, orderType },
    menuGroup,
    state,
    changeSkipPromotionCalculationStatus,
    recalculatePromotion,
    setTempCampaign,
    changeFreeItem,
    changeSelectedDiscount,
    removeFreeItemInOrder,
    setItemValidPromotion,
    removeItemRewardInfoFromOrder,
    crmPromotionContrary: {
      crmPromotionContraryInfo: { type, content, visible },
    },
    changeCrmPromotionContraryInfo,
    removeRewardItemFromList,
    recountCurrentOrderList,
    setIsPauseAutoValidatePromotion,
    removeLocalPromotionRewardInfo,
    setPromotionCode,
    selfConfig,
  } = props;

  // 当前订单是否还有crm活动
  const isCurrentOrderHasCrmCampaign = useMemo(() => {
    return isHasCRMCampaignFn({
      itemList,
      selectedFreeItem,
      selectedDiscount,
    });
  }, [itemList, selectedDiscount, selectedFreeItem]);

  const isHasPromotion = useMemo(() => {
    if (type === 'promotion') return content;
    return false;
  }, [type, content]);

  const isHasCRMCampaign = useMemo(() => {
    if (type === 'crm') return content;
    return false;
  }, [type, content]);

  // 当前促销是否是本地促销 - 满减促销
  const isLocalOrderDiscountPromotion = useMemo(() => {
    if (!promotionList?.length || !isHasPromotion) return false;
    return (
      promotionList?.length > 0 &&
      isHasPromotion?.activityType === 'orderDiscount' &&
      isHasPromotion?.actualDiscount > 0
    );
  }, [promotionList, isHasPromotion]);

  const isLocalBundleDiscount = useMemo(() => {
    return (
      isHasPromotion?.secondHalfInfo &&
      Object.keys(isHasPromotion?.secondHalfInfo || {})?.length > 0
    );
  }, [isHasPromotion]);

  useEffect(() => {
    // 删除crm后, 允许再次选促销
    if (!isCurrentOrderHasCrmCampaign) {
      changeSkipPromotionCalculationStatus(false);
      recountCurrentOrderList();
    } else {
      // 跳过promotion整单折扣计算, 不再展示买赠弹窗, 后续不再自动计算买折
      changeSkipPromotionCalculationStatus(true);
    }
  }, [isCurrentOrderHasCrmCampaign]);

  const onClose = () => {
    changeCrmPromotionContraryInfo({
      visible: false,
      content: undefined,
      type: undefined,
    });
  };

  useCloseModalOnHomePage(onClose);

  // const preItemList = usePrevious(itemList);
  // console.log(itemList, preItemList);

  // 计算当前订单下菜品数量
  // const itemCount = useMemo(() => {
  //   return itemList?.reduce((pre, cur) => {
  //     return pre + (cur?.quantity || 1);
  //   }, 0);
  // }, [itemList]);

  // 当前跳过本地促销, 且无crm活动被选中, 菜品有变化时, 自动开启本地促销
  // 并不标准的副作用... 但是能跑... 先跑起来了吧...
  // useEffect(() => {
  //   if (isSkipPromotionCalculation && !isCurrentOrderHasCrmCampaign) {
  //     changeSkipPromotionCalculationStatus(false);
  //   }
  // }, [itemCount]);

  // 计算商品资源列表
  const itemResources = useMemo(() => {
    if (!orderType) return [];
    const withoutFreeItemMenu = menuGroup.filter(
      (_) => !_.isFreeItemMenu && _.id !== 'promotion-deals-list'
    );
    return getValidCategoryList(withoutFreeItemMenu, orderType, false)
      .flatMap((category) => category.saleItems)
      .filter(Boolean);
  }, [menuGroup, orderType]);

  const promotionData = useMemo(() => {
    if (isHasPromotion) {
      // kiosk本地----买折
      if (isHasPromotion.hasOwnProperty('secondHalfInfo')) {
        const originalPrice = Number(
          (getItemPrice(isHasPromotion) || 0).toFixed(2)
        );
        const { discount } = isHasPromotion;
        return {
          ...isHasPromotion,
          originalPrice,
          rewardRule: {
            name: isHasPromotion.name,
            redeemRule: {
              strategy: 'byFreeItem',
              parameters: {
                itemDiscountPrice: Number(
                  Big(originalPrice).minus(discount).toFixed(2)
                ),
              },
            },
            rewardType: 'promotion',
            _id: isHasPromotion.secondHalfInfo.id,
          },
          crmIntegrationRule: {
            isValid: true,
          },
        };
      }
      // kiosk本地----买赠
      if (isHasPromotion?.ruleId && isHasPromotion?.items?.length > 0) {
        const giftItem = isHasPromotion.items[0];
        const originalPrice = Number((getItemPrice(giftItem) || 0).toFixed(2));
        return {
          ...giftItem,
          originalPrice,
          rewardRule: {
            name: giftItem.name,
            redeemRule: {
              strategy: 'byFreeItem',
              parameters: {
                itemDiscountPrice: 0,
              },
            },
            rewardType: 'promotion',
            _id: isHasPromotion?.ruleId,
          },
          crmIntegrationRule: {
            isValid: true,
          },
        };
      }
      // kiosk本地----整单折扣
      if (isHasPromotion?.activityType === 'orderDiscount') {
        const { activityRule } = isHasPromotion;
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
        return {
          ...isHasPromotion,
          name: content,
          rewardRule: {
            redeemRule: {
              parameters: {
                discount: Number(discountNumber),
              },
              strategy:
                discountType === 'rateDiscount'
                  ? 'byPercentageOff'
                  : 'byFixedAmount',
            },
            rewardType: 'promotion',
          },
          ruleId: isHasPromotion?.id,
          crmIntegrationRule: {
            isValid: true,
          },
        };
      }
      // 促销中心活动
      if (isHasPromotion?.isSelected) {
        const {
          promotion: { type, id },
          validateInfo,
        } = isHasPromotion;
        const activityRuleItem = getMatchedActivityRuleItem(isHasPromotion);

        // 促销活动命中的商品ids
        const itemsChosenIdsList = validateInfo?.result?.result?.orderItems;

        return {
          ...isHasPromotion,
          name: getPromotionCenterActivityRuleText({
            t,
            promotionName: isHasPromotion?.promotion?.promotionName,
            selfConfig,
            promoCenterHitActivity: isHasPromotion,
          }),
          rewardRule: {
            redeemRule: {
              parameters: {},
              strategy: type,
            },
            rewardType: 'promotion',
          },
          ruleId: id,
          crmIntegrationRule: {
            isValid: isHasPromotion?.validateInfo?.isValid,
          },
          hitRuleItem: activityRuleItem,
          // 特价优惠列表\买赠、满赠列表 ;M件N折 折扣在哪个商品上，展示那个商品
          orderItemFixedPriceList:
            type === 'orderItemFixedPrice' ||
            GIFT_PROMOTION_TYPE.includes(type) ||
            type === 'quantityItemDiscount'
              ? itemsChosenIdsList.reduce((acc, ruleItem) => {
                  const matchedItems = itemResources
                    .filter((item) => item.id === ruleItem.itemId)
                    .map((item) => ({
                      ...item,
                      promotionItemPrice:
                        ruleItem?.itemTotalPrice || ruleItem?.itemPrice,
                      promotionItemAmount: ruleItem.discounts[0]?.amount,
                    }));
                  return [...acc, ...matchedItems];
                }, [])
              : null,
        };
      }
    }
  }, [isHasPromotion, t, selfConfig]);

  // 促销中心活动商品级别活动
  const isPromotionCenterItemActivity = useMemo(() => {
    return [
      'amountGiftItem',
      'orderItemGiftItem',
      'orderItemFixedPrice',
    ].includes(promotionData?.promotion?.type);
  }, [promotionData]);

  // 促销中心活动订单级别活动
  const isPromotionCenterOrderActivity = useMemo(() => {
    return [
      'orderItemChangeItem',
      'quantityItemDiscount',
      'totalAmountQuantityDiscount',
    ].includes(promotionData?.promotion?.type);
  }, [promotionData]);

  const isOrderDiscountPromotion = useMemo(() => {
    return promotionData?.activityType === 'orderDiscount';
  }, [promotionData]);

  const isCRMDiscountActivity = useMemo(() => {
    return ['byPercentageOff', 'byFixedAmount'].includes(
      isHasCRMCampaign?.rewardRule?.redeemRule.strategy
    );
  }, [isHasCRMCampaign]);

  const isBuyDiscountPromotion = useMemo(() => {
    return isHasPromotion.hasOwnProperty('secondHalfInfo');
  }, [isHasPromotion]);

  const isBuyGiftPromotion = useMemo(() => {
    return buyGifts?.length > 0;
  }, [buyGifts]);

  // 促销中台标签
  const renderPromotionTag = useMemo(() => {
    if (!promotionData) return null;
    const { promotion } = promotionData;
    // 赠菜
    if (GIFT_PROMOTION_TYPE?.includes(promotion?.type)) {
      return (
        <div className={styles.promotionTagList}>
          <div className={styles.promotionTag}>{t('gift')}</div>
        </div>
      );
    }

    // M件N折
    if (promotion?.type === 'quantityItemDiscount') {
      const discountType = promotion?.activityRule?.[0]?.discountType;
      const discountNumber = promotion?.activityRule?.[0]?.discountNumber;
      const discountText =
        discountType &&
        `${discountType === 'minus' ? '$' : ''}${discountNumber}${
          discountType === 'percentage' ? '%' : ''
        }`;
      return (
        <div className={styles.promotionTagList}>
          <div
            className={styles.promotionTag}
          >{`${discountText} ${t('off')}`}</div>
        </div>
      );
    }

    // 特价优惠
    if (promotion?.type === 'orderItemFixedPrice') {
      return (
        <div className={styles.promotionTagList}>
          <div className={styles.promotionTag}>
            {t('orderItemFixedPrice_tag')}
          </div>
        </div>
      );
    }
  }, [promotionData]);

  const renderPromotionCondition = (item) => {
    if (isOrderDiscountPromotion) {
      return (
        <div className={styles.activity_discount}>
          -${promotionData.actualDiscount?.toFixed(2)}
        </div>
      );
    }
    if (isBuyDiscountPromotion) {
      const { originalPrice, discount } = promotionData;
      const discountPrice = Big(originalPrice).minus(discount).toFixed(2);
      return <div className={styles.activity_discount}>${discountPrice}</div>;
    }
    if (isBuyGiftPromotion) {
      return <div className={styles.activity_discount}>$0.00</div>;
    }
    if (
      isPromotionCenterOrderActivity &&
      promotionData?.promotion?.type !== 'quantityItemDiscount'
    ) {
      return <div className={styles.activity_discount}></div>;
    }
    if (
      isPromotionCenterItemActivity ||
      promotionData?.promotion?.type === 'quantityItemDiscount'
    ) {
      return (
        <div className={styles.activity_discount}>
          <span className={styles.specialPrice}>
            $
            {Big(item?.promotionItemPrice)
              .minus(item?.promotionItemAmount)
              .toFixed(2)}
          </span>
          <span className={styles.price}>
            ${item?.promotionItemPrice?.toFixed(2)}
          </span>
          {renderPromotionTag}
        </div>
      );
    }
  };

  // 删除促销相关信息
  const removePromotionCalculation = () => {
    // 不再自动生效促销中台校验
    setIsPauseAutoValidatePromotion(true);
    // 删除促销中台活动
    setItemValidPromotion(null);
    // 删除菜品上的促销中台信息
    removeItemRewardInfoFromOrder();
    // 删除本地促销买赠, 买折菜品
    recalculatePromotion();
    // 删除本地促销菜品上的信息
    removeLocalPromotionRewardInfo();
    // 本地m件n折活动
    if (isLocalBundleDiscount) {
      changeSkipPromotionCalculationStatus(true);
    }
    // 本地促销的买折活动
    if (isLocalOrderDiscountPromotion) {
      changeSkipPromotionCalculationStatus(true);
      recountCurrentOrderList();
    }
    // 促销码置空
    setPromotionCode('');
  };

  // 删除crm相关信息
  const removeCRMCampaign = () => {
    setTempCampaign(null);
    changeFreeItem([]);
    changeSelectedDiscount({});
    // 删除奖励菜品
    removeRewardItemFromList();
    // 删除菜品上的discountList信息
    removeItemRewardInfoFromOrder();
    //删除购物车里 M件N折、特价优惠 积分菜单添加的免费兑换 的商品
    const rewardItemInOrder = itemList.find((each) => each.isFreeItem);
    if (rewardItemInOrder) {
      removeFreeItemInOrder({
        freeItemId: rewardItemInOrder.id,
      });
    }
  };

  const handleRemoveActivity = () => {
    type === 'crm' ? removeCRMCampaign() : removePromotionCalculation();
    onClose();
  };

  const crmActiveType = useMemo(() => {
    // crm活动类型 积分 or 券
    return isHasCRMCampaign?.rewardRule?.type;
  }, [isHasCRMCampaign, t]);

  // ----------------kiosk本地满减
  const kioskOrderDiscountTxt = useMemo(() => {
    const localPromotion = promotionList?.find(
      (item) => item?.id === promotionData?.ruleId
    );
    if (!localPromotion || !isOrderDiscountPromotion) return '';
    const {
      activityRule: {
        satisfyPrice,
        discountType,
        discountNumber,
        isFirstOrderDiscount,
      },
    } = localPromotion;

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
    return resolvePromotionDisplayName({
      source: selfConfig?.configMap?.id_64,
      language: i18n.language,
      origin: 'local',
      promotion: localPromotion,
      ruleText: content,
    });
  }, [promotionList, promotionData, t, selfConfig]);

  //   --------------------kiosk本地买折
  const kioskBuyDiscountTxt = useMemo(() => {
    const localPromotion = promotionList?.find(
      (item) => item?.id === promotionData?.rewardRule?._id
    );
    if (!localPromotion || !isBuyDiscountPromotion) return '';
    const {
      activityRule: { giftsDiscount, buyNumber, giftsDiscountRule, buyType },
    } = localPromotion;

    const isIdenticalBuyType = buyType === 'identical';
    const isEachItemQty = Number(buyNumber) === 1;
    const buyNumberStr =
      i18n.language === 'en' ? formatOrdinals(buyNumber + '') : buyNumber + '';
    const text =
      giftsDiscountRule !== '1'
        ? isEachItemQty
          ? t('secondDiscountEach', { value: giftsDiscount })
          : t(
              isIdenticalBuyType ? 'secondDiscountIdentical' : 'secondDiscount',
              {
                value: giftsDiscount,
                quantity: buyNumberStr,
              }
            )
        : t(isIdenticalBuyType ? 'overDiscountIdentical' : 'overDiscount', {
            value: giftsDiscount,
            quantity: buyNumber,
          });
    return resolvePromotionDisplayName({
      source: selfConfig?.configMap?.id_64,
      language: i18n.language,
      origin: 'local',
      promotion: localPromotion,
      ruleText: text,
    });
  }, [promotionList, promotionData, t, selfConfig]);

  // ----------------kiosk本地买赠 买X送N
  const kioskBuyGiftTxt = useMemo(() => {
    const localPromotion = promotionList?.find(
      (item) => item?.id === promotionData?.rewardRule?._id
    );
    if (!localPromotion || !isBuyGiftPromotion) return '';
    const {
      activityRule: { buyNumber, giftsNumber },
    } = localPromotion;

    const ruleText = t('buy-x-give-n', { buyNumber, giftsNumber });
    return resolvePromotionDisplayName({
      source: selfConfig?.configMap?.id_64,
      language: i18n.language,
      origin: 'local',
      promotion: localPromotion,
      ruleText,
    });
  }, [promotionList, promotionData, t, selfConfig]);

  const renderTitle = useMemo(() => {
    if (type === 'crm') {
      return t('haveJoin', {
        activeTxt: `${crmActiveType === 'reward' ? t('reward_point') : t('reward_voucher')}${t('activity')}`,
      });
    } else {
      if (
        isBuyGiftPromotion ||
        isBuyDiscountPromotion ||
        isOrderDiscountPromotion
      ) {
        // 本地促销
        let activeText =
          kioskOrderDiscountTxt || kioskBuyDiscountTxt || kioskBuyGiftTxt;

        const displayText =
          normalizePromotionDisplaySource(selfConfig?.configMap?.id_64) === 0
            ? `${activeText}${t('activity')}`
            : activeText;
        return t('haveJoin', { activeTxt: displayText });
      } else {
        // 促销中心
        const activeText = getPromotionCenterActivityRuleText({
          t,
          promotionName: promotionData?.promotion?.promotionName,
          selfConfig,
          promoCenterHitActivity: promotionData,
        });
        const displayText =
          normalizePromotionDisplaySource(selfConfig?.configMap?.id_64) === 0
            ? `${activeText}${t('activity')}`
            : activeText;
        return t('haveJoin', {
          activeTxt: displayText,
        });
      }
    }
  }, [type, promotionData, t, selfConfig]);

  return (
    <Dialog
      visible={visible}
      isMountOnBody
      html={
        <div className={styles.crmPromotionMutualWrapper}>
          <div className={styles.title}>{renderTitle}</div>
          <div className={styles.subTitle}>
            {type === 'crm'
              ? t('promotionActivityReject')
              : t('crmActivityReject')}
          </div>
          <div className={styles.conflictItemWrapper}>
            {type === 'promotion' && isHasPromotion && (
              <div className={styles.conflictItem}>
                <div className={styles.itemInfo}>
                  {promotionData?.orderItemFixedPriceList ? (
                    promotionData?.orderItemFixedPriceList.map((item) => (
                      <RewardItem
                        data={{ ...item, ...promotionData }}
                        isLong
                        isMuted
                        renderCondition={renderPromotionCondition(item)}
                        styles={{ marginBottom: '1rem' }}
                      />
                    ))
                  ) : (
                    <RewardItem
                      data={promotionData}
                      isLong
                      isMuted
                      isInCrmPromotionMutual
                      renderCondition={renderPromotionCondition()}
                    />
                  )}
                </div>
              </div>
            )}
            {type === 'crm' && isHasCRMCampaign && (
              <div className={styles.conflictItem}>
                <div className={styles.itemInfo}>
                  <RewardItem
                    data={isHasCRMCampaign}
                    isLong
                    isMuted
                    isInCrmPromotionMutual
                    renderCondition={
                      isCRMDiscountActivity && (
                        <div className={styles.activity_discount}>
                          -${isHasCRMCampaign.actualDiscount?.toFixed(2)}
                        </div>
                      )
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <div className={styles.footerBtn}>
            <div onClick={onClose}>
              {t('keep-current-activity', {
                activeTxt: `${type === 'crm' ? (crmActiveType === 'reward' ? t('reward_point') : t('reward_voucher')) : t('promotion')}`,
              })}
            </div>
            <div onClick={handleRemoveActivity}>
              {t('remove-current-activity', {
                activeTxt: `${type === 'crm' ? (crmActiveType === 'reward' ? t('reward_point') : t('reward_voucher')) : t('promotion')}`,
              })}
            </div>
          </div>
        </div>
      }
    />
  );
};

function mapStateToProps(state) {
  return {
    state,
    crm: state.crm,
    avocado: state.avocado,
    promotion: state.promotion,
    currentOrder: state.currentOrder,
    menuGroup: state.menuGroup,
    crmPromotionContrary: state.crmPromotionContrary,
    selfConfig: state.selfConfig,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    changeSkipPromotionCalculationStatus,
    recalculatePromotion,
    setTempCampaign,
    changeFreeItem,
    changeSelectedDiscount,
    removeFreeItemInOrder,
    setItemValidPromotion,
    removeItemRewardInfoFromOrder,
    changeCrmPromotionContraryInfo,
    removeRewardItemFromList,
    recountCurrentOrderList,
    setIsPauseAutoValidatePromotion,
    removeLocalPromotionRewardInfo,
    setPromotionCode,
  })(CrmPromotionMutual)
);
