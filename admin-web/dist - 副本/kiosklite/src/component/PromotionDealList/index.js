import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.module.scss';
import i18n from '@/assets/i18n/i18n';
import ARROW_RIGHT from '@/assets/images/arrow-right.png';
import PROMOTIONTAG from '@/assets/images/promotion-tag.png';
import Dialog from '@/component/dialog';
import OrderDiscountInfo from '@/component/OrderDiscountInfo';
import checkCRMStatus from '@/utils/checkCRMStatus';
import formatOrdinals from '@/utils/formatOrdinals';
import { useAddOnPromotion } from '@/hooks';
import { filterValidPromotionCenterList } from '@/utils/PromotionCenterIntegration/checkCloudPromotion';
import { getPromotionCenterActivityRuleText } from '@/utils/PromotionCenterIntegration/getPromotionCenterDisplayText';
import ItemsDrawer from '@/component/RewardCenter/ItemsDrawer';
import useCrmPromotionContrary from '@/hooks/useCrmPromotionContrary';
import { getValidCategoryList } from '@/utils/getStandardCateDish';
import { addCampaignItemsToOrder } from '@/actions';
import { createPromotionPresentation } from './promotionPresentation';

const initLocalPromotionDrawerState = {
  visible: false,
  info: null,
};

const PromotionDealList = (props) => {
  const {
    promotion: {
      cloudPromotion,
      orderDiscount,
      buyGiftRule,
      buyDiscountRule,
      exchangePurchaseRule,
      promotionCenterList,
      promotionCenterMetas,
    },
    selfConfig,
    currentOrder: { orderType, itemList },
    menuGroup,
    allSysConfig,
    addCampaignItemsToOrder,
  } = props;
  const { t } = useTranslation();
  const selectTips = {
    part: t('promotion-select-part-item'),
    all: t('promotion-select-all'),
    allMember: t('promotion-select-member-item'),
  };
  const { handleCheckIsHasCampaign } = useCrmPromotionContrary();

  const [detailVisible, setDetailVisible] = useState(false);
  const [dealItemInfo, setDealItemInfo] = useState(null);
  const [localPromotionDrawerState, setLocalPromotionDrawerState] = useState(
    initLocalPromotionDrawerState
  );

  // 使用凑单促销 hook
  const {
    drawerProps,
    goAddOnPromotion,
    handleDrawerConfirm,
    handleCloseDrawer,
  } = useAddOnPromotion({
    promotionCenterList,
  });

  const isCRMEnable = useMemo(() => {
    if (allSysConfig && Object.keys(allSysConfig).length) {
      return !checkCRMStatus(allSysConfig);
    }
    return false;
  }, [allSysConfig]);

  const localPromotionItemList = useMemo(() => {
    if (!orderType) return [];
    const buyDishes =
      localPromotionDrawerState.info?.activityRule?.buyDishes || [];
    if (!buyDishes.length) return [];

    const withoutFreeItemMenu = (menuGroup || []).filter(
      (group) => !group.isFreeItemMenu && group.id !== 'promotion-deals-list'
    );
    return getValidCategoryList(withoutFreeItemMenu, orderType, false)
      .flatMap((category) =>
        (category.saleItems || []).map((item) => ({
          ...item,
          categoryId: item.categoryId ?? category.id,
        }))
      )
      .filter((item) => {
        if (!item) return false;
        if (buyDishes.includes(item.id)) return true;
        return item.comboSections?.some((section) =>
          buyDishes.includes(`${item.id}${section.id}`)
        );
      });
  }, [menuGroup, orderType, localPromotionDrawerState.info]);

  const localPromotionDrawerValue = useMemo(() => {
    return (
      itemList?.map((item) => ({
        ...item,
        uniqueItemTempId: uuidv4(),
      })) || []
    );
  }, [itemList]);

  const handleCloseLocalPromotionDrawer = useCallback(() => {
    setLocalPromotionDrawerState(initLocalPromotionDrawerState);
  }, []);

  const localPromotionDrawerProps = useMemo(() => {
    const resolvedName =
      localPromotionDrawerState.info?.displayName ??
      localPromotionDrawerState.info?.text;
    const displayName = Array.isArray(resolvedName)
      ? resolvedName[0]
      : resolvedName;
    return {
      open: localPromotionDrawerState.visible,
      displayName,
      itemList: localPromotionItemList,
      value: localPromotionDrawerValue,
      max: 9999,
      drawerType: 'addon',
    };
  }, [
    localPromotionDrawerState,
    localPromotionItemList,
    localPromotionDrawerValue,
    t,
  ]);

  //   ----------------旧云promotion 只有满赠
  const getOrderRedeemItem = useCallback(
    (info) => {
      const condition = info.conditions[0];
      const benefitCondition = info.benefits[0]?.condition;
      const range = condition['order/totalAmount'];
      const count = benefitCondition.maxNum;
      let price = `$${range['gt*']}+`;
      if (Object.keys(range).length === 2) {
        price = `$${range['gt*']}-$${range['lt*']}`;
      }
      return {
        text: t('redeemItemInfo', {
          price,
          count,
        }),
        commercialType: 'all',
        promotionType: 'amountGiftItem',
      };
    },
    [t]
  );

  const oldCloudPromotionList = useMemo(() => {
    const orderTypeMap = {
      TO_GO: 'TOGO',
      DINE_IN: 'DINE_IN',
      PICK_UP: 'PICKUP',
    };
    const actualType = orderTypeMap[orderType];
    const list = cloudPromotion.filter(
      (each) =>
        each.type === 'WholeOrderGift' &&
        each.conditions[0]['order/orderType']?.includes(actualType)
    );
    return list.map((info) => getOrderRedeemItem(info));
  }, [cloudPromotion, orderType, getOrderRedeemItem]);

  //   ----------------kiosk本地满减
  const kioskOrderDiscountList = useMemo(() => {
    // 促销码活动不展示、没开crm不展示新会员活动
    const validList = orderDiscount?.filter(
      (each) =>
        ((each?.activityRule?.isFirstOrderDiscount === '1' && isCRMEnable) ||
          each?.activityRule?.isFirstOrderDiscount !== '1') &&
        each?.activityRule?.usePromotionCode !== '1'
    );
    return validList.map((row) => {
      const { activityRule } = row;
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
      const promotionType =
        row?.activityRule?.isFirstOrderDiscount === '1'
          ? 'newMember'
          : 'totalAmountQuantityDiscount';
      return createPromotionPresentation({
        promotion: row,
        ruleText: content,
        source: selfConfig?.configMap?.id_64,
        language: i18n.language,
        commercialType: 'all',
        isLocalPromotion: true,
        promotionType,
      });
    });
  }, [orderDiscount, isCRMEnable, t, selfConfig]);

  //   --------------------kiosk本地买折
  const kioskBuyDiscountlist = useMemo(() => {
    return buyDiscountRule.map((discountInfo) => {
      const {
        activityRule: { giftsDiscount, buyNumber, giftsDiscountRule, buyType },
      } = discountInfo;
      const isIdenticalBuyType = buyType === 'identical';
      const isEachItemQty = Number(buyNumber) === 1;
      const buyNumberStr =
        i18n.language === 'en'
          ? formatOrdinals(buyNumber + '')
          : buyNumber + '';
      const text =
        giftsDiscountRule !== '1'
          ? isEachItemQty
            ? t('secondDiscountEach', { value: giftsDiscount })
            : t(
                isIdenticalBuyType
                  ? 'secondDiscountIdentical'
                  : 'secondDiscount',
                {
                  value: giftsDiscount,
                  quantity: buyNumberStr,
                }
              )
          : t(isIdenticalBuyType ? 'overDiscountIdentical' : 'overDiscount', {
              value: giftsDiscount,
              quantity: buyNumber,
            });
      return createPromotionPresentation({
        promotion: discountInfo,
        ruleText: text,
        source: selfConfig?.configMap?.id_64,
        language: i18n.language,
        isLocalPromotion: true,
        commercialType: 'part',
        activityRule: discountInfo.activityRule,
        promotionType: 'quantityItemDiscount',
      });
    });
  }, [buyDiscountRule, t, selfConfig]);

  // ----------------kiosk本地买赠 买X送N
  const kioskBuyGiftList = useMemo(() => {
    return buyGiftRule?.map((giftInfo) => {
      const {
        activityRule: { buyNumber, giftsNumber },
      } = giftInfo;
      return createPromotionPresentation({
        promotion: giftInfo,
        ruleText: t('buy-x-give-n', { buyNumber, giftsNumber }),
        source: selfConfig?.configMap?.id_64,
        language: i18n.language,
        commercialType: 'all',
        isLocalPromotion: true,
        promotionType: 'orderItemGiftItem',
      });
    });
  }, [buyGiftRule, t, selfConfig]);

  const kioskExchangePurchaseList = useMemo(() => {
    return exchangePurchaseRule?.map((rule) => {
      const { activityRule } = rule;
      const discount =
        activityRule.discountType === 'fixDiscount'
          ? `$${activityRule.discountNumber}`
          : `${activityRule.discountNumber}%`;
      const ruleText = t(
        activityRule.conditionType === 'orderAmount'
          ? 'exchangeOrderDeal'
          : 'exchangeItemDeal',
        {
          price: activityRule.satisfyPrice,
          buyNumber: activityRule.buyNumber,
          giftsNumber: activityRule.giftsNumber,
          giftsTypeLabel: t(activityRule.giftsType),
          discount,
        }
      );
      return createPromotionPresentation({
        promotion: rule,
        ruleText,
        source: selfConfig?.configMap?.id_64,
        language: i18n.language,
        commercialType: 'all',
        isLocalPromotion: true,
        promotionType: 'exchangePurchase',
      });
    });
  }, [exchangePurchaseRule, t, selfConfig]);

  // ----------------促销中心活动
  const [cloudPromotionCenterList, setCloudPromotionCenterList] = useState([]);

  useEffect(() => {
    const fetchPromotionList = async () => {
      if (!promotionCenterList?.length || !promotionCenterMetas) {
        return;
      }

      try {
        // 过滤有效的促销中心列表
        const filteredList = await filterValidPromotionCenterList({
          promotionCenterList,
          promotionCenterMetas,
          allItems: [],
        });

        const mappedList = filteredList?.map((each) => {
          const {
            activityRule,
            type,
            memberScope,
            promotionName,
            ruleExpression: { condition, benefits },
          } = each;

          let itemFilterType = '';
          if (type === 'orderItemGiftItem' || type === 'orderItemFixedPrice') {
            // 买赠 \ 特价优惠
            itemFilterType = benefits[0]?.condition?.itemFilter?.type;
          } else {
            // 满赠 、 满减、 M件N折
            itemFilterType = condition?.itemFilter?.type;
          }
          // 活动类型
          const commercialType =
            itemFilterType === 'all' || !itemFilterType ? 'all' : 'part';
          const ruleText = getPromotionCenterActivityRuleText({
            t,
            activityRule,
            type,
            promotionName,
            selfConfig: { configMap: { id_64: 0 } },
          });
          return {
            ruleText,
            displayName: getPromotionCenterActivityRuleText({
              t,
              activityRule,
              type,
              promotionName,
              selfConfig,
            }),
            commercialType,
            memberScope,
            promotionType: type,
            promotion: each,
          };
        });
        setCloudPromotionCenterList(mappedList || []);
      } catch (error) {
        console.error('获取促销中心活动失败:', error);
        setCloudPromotionCenterList([]);
      }
    };

    fetchPromotionList();
  }, [promotionCenterList, promotionCenterMetas, t, selfConfig]);

  const data = useMemo(() => {
    return [
      ...(oldCloudPromotionList || []),
      ...(kioskOrderDiscountList || []),
      ...(kioskBuyDiscountlist || []),
      ...(kioskBuyGiftList || []),
      ...(kioskExchangePurchaseList || []),
      ...(cloudPromotionCenterList || []),
    ];
  }, [
    oldCloudPromotionList,
    kioskOrderDiscountList,
    kioskBuyDiscountlist,
    kioskBuyGiftList,
    kioskExchangePurchaseList,
    cloudPromotionCenterList,
  ]);

  // 本地促销买折打开凑单，其他直接打开凑单抽屉；促销中心按 all/part 分别查看详情或凑单
  const checkDealItemInfo = useCallback(
    (info) => {
      if (info?.commercialType === 'all') {
        setDealItemInfo(info);
        setDetailVisible(true);
      } else {
        if (info?.isLocalPromotion) {
          handleCloseDrawer();
          setLocalPromotionDrawerState({
            visible: true,
            info,
          });
          return;
        }
        const isDealListClick = true;
        goAddOnPromotion(info, isDealListClick);
      }
    },
    [goAddOnPromotion, handleCloseDrawer]
  );

  // 顶部菜单
  const isTopMenu = useMemo(() => {
    return selfConfig?.configMap?.id_33 === 1;
  }, [selfConfig]);

  // 瀑布流菜单
  const isOpenLazyLoad = useMemo(() => {
    return selfConfig?.configMap?.id_32;
  }, [selfConfig]);

  // 最多展示数量;
  const maxDisplayItems = useMemo(() => {
    return isTopMenu ? 3 : 2;
  }, [isTopMenu]);

  // 展示see all
  const isShowMore = useMemo(() => {
    return data.length > maxDisplayItems;
  }, [data, maxDisplayItems]);

  //   渲染单个item
  const renderItem = (info, index) => {
    return (
      <div
        className={styles.dealItem}
        key={info?.promotion?.id || `${info?.promotionType}-${index}`}
        onClick={() => checkDealItemInfo(info)}
      >
        <div className={styles.dealItemInfo}>
          <img
            src={PROMOTIONTAG}
            alt="promotionTag"
            className={styles.dealItemTag}
          />
          <div className={styles.dealItemText}>
            <div className={styles.dealItemTitle}>
              {Array.isArray(info?.displayName ?? info?.text)
                ? (info?.displayName ?? info?.text)[0]
                : (info?.displayName ?? info?.text)}
            </div>
            {!info?.isLocalPromotion && (
              <div className={styles.dealItemTips}>
                {selectTips[
                  info?.memberScope === 'allMember'
                    ? info?.memberScope
                    : info?.commercialType
                ] || ''}
              </div>
            )}
          </div>
        </div>

        <img src={ARROW_RIGHT} alt="more" className={styles.dealItemArrow} />
      </div>
    );
  };

  const beforeSelectItemCheck = () => {
    const res = handleCheckIsHasCampaign();
    return !res;
  };

  const isLocalPromotionDrawerVisible = localPromotionDrawerState.visible;

  const handleCloseAddOnDrawer = useCallback(() => {
    if (isLocalPromotionDrawerVisible) {
      handleCloseLocalPromotionDrawer();
      return;
    }
    handleCloseDrawer();
  }, [
    isLocalPromotionDrawerVisible,
    handleCloseLocalPromotionDrawer,
    handleCloseDrawer,
  ]);

  const handleAddOnDrawerConfirm = useCallback(
    async (items) => {
      if (isLocalPromotionDrawerVisible) {
        addCampaignItemsToOrder(items);
        handleCloseLocalPromotionDrawer();
        return true;
      }
      return handleDrawerConfirm(items);
    },
    [
      isLocalPromotionDrawerVisible,
      addCampaignItemsToOrder,
      handleCloseLocalPromotionDrawer,
      handleDrawerConfirm,
    ]
  );

  return (
    <>
      <div className={styles.promotionDealWrap}>
        {isOpenLazyLoad && (
          <div className={styles.dealHeader}>
            <span className={styles.dealText}>{t('promotion-deals-list')}</span>
            {isShowMore && (
              <span
                className={styles.dealItemMore}
                onClick={() => {
                  setDealItemInfo(null);
                  setDetailVisible(true);
                }}
              >
                {t('see_all')} →
              </span>
            )}
          </div>
        )}
        <div
          className={`${styles.dealItemList} ${!isOpenLazyLoad ? styles.dealItemListNoLimit : ''} ${styles[`dealItemListCol${maxDisplayItems}`]}`}
        >
          {(isOpenLazyLoad ? data.slice(0, maxDisplayItems) : data).map(
            (item, index) => renderItem(item, index)
          )}
        </div>
      </div>
      <Dialog
        visible={detailVisible}
        html={
          <OrderDiscountInfo
            data={data}
            setDetailVisible={setDetailVisible}
            promotionItem={dealItemInfo}
          />
        }
        onClose={() => setDetailVisible(false)}
        isMountOnBody={true}
      />

      <ItemsDrawer
        {...(isLocalPromotionDrawerVisible
          ? localPromotionDrawerProps
          : drawerProps)}
        onClose={handleCloseAddOnDrawer}
        handleConfirm={handleAddOnDrawerConfirm}
        beforeSelectItemCheck={
          isLocalPromotionDrawerVisible ? undefined : beforeSelectItemCheck
        }
      />
    </>
  );
};

function mapStateToProps(state) {
  return {
    promotion: state.promotion,
    currentOrder: state.currentOrder,
    menuGroup: state.menuGroup,
    crm: state.crm,
    allSysConfig: state.allSysConfig,
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps, {
  addCampaignItemsToOrder,
})(PromotionDealList);
