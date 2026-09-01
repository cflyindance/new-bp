import { getAllCloudPromotion } from '@/api/cloudPromotion';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  removeItemRewardInfoFromOrder,
  updatePromotionDealsInMenuGroup,
  addCampaignItemsToOrder,
  removeManualSelectRewardItemFromOrder,
} from '@/actions';
import {
  setCloudPromotionList,
  setCloudPromotionMetas,
  changeCloudPromotionStatus,
  setItemMatchCloudPromotion,
  setItemValidPromotion,
  setIsPauseAutoValidatePromotion,
} from '@/actions/promotion';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  checkIsItemHasPromotion,
  checkIsItemPromotionValid,
  checkIsRuleDiscountInvalid,
  checkIsRuleValid,
} from '@/utils/PromotionCenterIntegration/checkCloudPromotion';
import { ORDER_TYPE } from '@/constants/order';
import { v4 as uuidv4 } from 'uuid';
import {
  compareItemDiscount,
  compareSelectedPromotion,
  handleCheckOrderPromotion,
  getOrderItemWithRewardInfo,
} from '@/utils/PromotionCenterIntegration';
import { isConfigSettingRoute } from '@/constants/ConfigSettingRoute';
import { GIFT_PROMOTION_TYPE } from '@/constants/promotion';
import { isHasCRMCampaignFn } from '@/utils/CRMIntegration/crmPromotionContrary';
import { homeHash } from '@/constants/mockData';
import i18n from '@/assets/i18n/i18n';

/** 展示 buyNumber 时需要 quantity-1 的语言（贴合 Buy X, Get Y 语法） */
const MINUS_ONE_BUY_NUMBER_LANGUAGES = ['en', 'french', 'spanish'];

/** 需要更新促销活动的页面路由模式 */
const PROMOTION_UPDATE_PATTERNS = ['orderType', 'orderPage', 'orderReview'];

// 格式化折扣数字字符串
const formatDiscountNumberStr = (action) => {
  const discountType = action?.type;
  const discountNumber = action?.params?.value;
  return (
    discountType &&
    `${discountType === 'minus' ? '$' : ''}${discountNumber}${
      discountType === 'percentage' ? '%' : ''
    }`
  );
};

// 生成活动规则
const generateActivityRule = (
  benefits,
  options,
  condition,
  type,
  language = i18n.language
) => {
  // 满件数减xx
  const isTotalQuantityDiscount =
    type === 'totalAmountQuantityDiscount' &&
    options?.discountType === 'quantity';
  // M件N折
  const quantityItemDiscount = type === 'quantityItemDiscount';
  // M件N折 - 购买商品必须是同一商品
  const quantityItemDiscountIsSame = quantityItemDiscount && options?.sameItem;

  const useAddGrammar = MINUS_ONE_BUY_NUMBER_LANGUAGES.includes(language);

  return benefits.map((benefit) => {
    const action = benefit?.actions[0];
    const buyQuantity = benefit?.condition?.quantity;
    const getQuantity = action?.params?.quantity;
    const buyNumber =
      quantityItemDiscount && useAddGrammar
        ? buyQuantity - getQuantity
        : buyQuantity;

    return {
      specialPriceItemId: benefit?.condition?.itemFilter?.value[0]?.itemId,
      // specialPrice: action?.params?.price,
      discountType: action?.type,
      discountNumber: action?.params?.value,
      satisfyPrice: benefit?.condition?.totalAmount,
      buyNumber: benefit?.condition?.quantity,
      giftsNumber: action?.params?.quantity,
      totalAmount: condition?.totalAmount, //门槛
      maxAmount: options?.maxAmount, //最多减
      quantityLimit: options?.quantityLimit, //参与活动上限
      text: {
        i18nKey: isTotalQuantityDiscount
          ? `${type}Quantity_tag`
          : quantityItemDiscount && buyQuantity === 1
            ? `${type}${quantityItemDiscountIsSame ? 'IsSame' : ''}Single_tag`
            : quantityItemDiscountIsSame
              ? `${type}IsSame_tag`
              : `${type}_tag`,
        params: {
          discount: formatDiscountNumberStr(action),
          price: benefit?.condition?.totalAmount,
          buyNumber,
          giftsNumber: action?.params?.quantity,
        },
      },
    };
  });
};

const mapPromotionListWithActivityRule = (promotionList, language) =>
  promotionList?.map((each) => {
    const {
      ruleExpression: { benefits, options, condition },
      type,
    } = each;

    const activityRule = generateActivityRule(
      benefits,
      options,
      condition,
      type,
      language
    );
    return { ...each, activityRule };
  }) || [];

const CloudPromotion = (props) => {
  const {
    i18n: { language },
  } = useTranslation();
  const {
    crm: { tempCampaign, selectedDiscount, selectedFreeItem },
    avocado: { outletInfo },
    currentOrder,
    menuItemList,
    promotion: {
      promotionCenterList,
      isOpenCloudPromotion,
      itemValidPromotion,
      promotionCenterMetas,
      promotionCode,
    },
    setCloudPromotionList,
    setCloudPromotionMetas,
    changeCloudPromotionStatus,
    setItemMatchCloudPromotion,
    setItemValidPromotion,
    merchantProfile,
    removeItemRewardInfoFromOrder,
    addCampaignItemsToOrder,
    updatePromotionDealsInMenuGroup,
    location,
    crmPromotionContrary: { isPauseAutoValidatePromotion },
    setIsPauseAutoValidatePromotion,
    removeManualSelectRewardItemFromOrder,
  } = props;

  // 获取促销列表
  const getPromotionList = useCallback(async () => {
    // 检查 merchantProfile 是否存在，如果不存在则直接返回
    if (!merchantProfile?.merchantId) {
      return;
    }

    try {
      const res = await getAllCloudPromotion();

      if (res?.data?.success) {
        const {
          data: { promotionMetas },
        } = res.data;
        const mid = merchantProfile?.merchantId;
        const promotionData = res?.data?.data?.promotionList;

        // 添加安全检查
        if (!promotionData || !Array.isArray(promotionData)) {
          setCloudPromotionList([]);
          setCloudPromotionMetas(null);
          changeCloudPromotionStatus(false);
          return;
        }

        const validTypePromotion = promotionData.filter(
          (e) =>
            e?.productLine?.includes('KIOSK') &&
            e?.validMerchantIds?.includes(mid) &&
            e?.hasLimitCount &&
            [
              'totalAmountQuantityDiscount',
              'quantityItemDiscount',
              'orderItemFixedPrice',
              ...GIFT_PROMOTION_TYPE,
            ].includes(e?.type)
        );
        const promotionList = mapPromotionListWithActivityRule(
          validTypePromotion,
          i18n.language
        );
        setCloudPromotionList(promotionList || []);
        setCloudPromotionMetas(promotionMetas);
        changeCloudPromotionStatus((promotionList?.length || 0) > 0);
        // 不用在配置页更新卡片，否则调用saveOrder方法会报无订单类型的错误
        if (!isConfigSettingRoute(location.pathname)) {
          updatePromotionDealsInMenuGroup();
        }
      } else {
        // 如果接口返回失败，设置默认值
        setCloudPromotionList([]);
        setCloudPromotionMetas(null);
        changeCloudPromotionStatus(false);
      }
    } catch (error) {
      // 静默处理，避免阻塞渲染
      console.error('CloudPromotion: 获取促销列表失败', error);
      // 设置默认值，确保应用可以正常渲染
      setCloudPromotionList([]);
      setCloudPromotionMetas(null);
      changeCloudPromotionStatus(false);
    }
  }, [
    merchantProfile?.merchantId,
    setCloudPromotionList,
    setCloudPromotionMetas,
    changeCloudPromotionStatus,
    updatePromotionDealsInMenuGroup,
  ]);

  // 拉取促销活动
  useEffect(() => {
    const currentHash = window.location.hash || '#/';
    const normalizedHash = currentHash.split('?')[0];
    const isHomePage = homeHash.some((hash) => normalizedHash === hash);
    const isPromotionPage = PROMOTION_UPDATE_PATTERNS.some((pattern) =>
      normalizedHash.includes(pattern)
    );
    const shouldUpdateNow = isHomePage || isPromotionPage;

    if (merchantProfile?.merchantId && shouldUpdateNow) {
      getPromotionList();
    }
  }, [merchantProfile?.merchantId, getPromotionList, location.pathname]);

  const prevLanguageRef = useRef(language);

  // 切换语言时重新生成 activityRule（buyNumber 等文案依赖当前语言）
  useEffect(() => {
    if (prevLanguageRef.current === language) return;
    prevLanguageRef.current = language;

    if (!promotionCenterList?.length) return;

    const updatedPromotionList = mapPromotionListWithActivityRule(
      promotionCenterList,
      language
    );
    setCloudPromotionList(updatedPromotionList);

    if (itemValidPromotion?.length) {
      const promotionMap = new Map(
        updatedPromotionList.map((promo) => [promo.id, promo])
      );
      const updatedItemValidPromotion = itemValidPromotion.map((each) => {
        const updatedPromotion = promotionMap.get(each.promotion.id);
        return updatedPromotion
          ? { ...each, promotion: updatedPromotion }
          : each;
      });
      setItemValidPromotion(updatedItemValidPromotion);
    }

    if (!isConfigSettingRoute(location.pathname)) {
      updatePromotionDealsInMenuGroup();
    }
  }, [
    language,
    promotionCenterList,
    itemValidPromotion,
    setCloudPromotionList,
    setItemValidPromotion,
    updatePromotionDealsInMenuGroup,
    location.pathname,
  ]);

  useEffect(() => {
    const handleSetItemPromotion = async () => {
      try {
        const items = Object.values(menuItemList).filter((_) => !_.isFreeItem);
        const res = await checkIsItemHasPromotion({
          itemList: items,
          promotionList: promotionCenterList,
          orderType: ORDER_TYPE[currentOrder.orderType],
          appointItemFlag: true,
          merchantId: merchantProfile?.merchantId,
        });

        if (!res) {
          setItemMatchCloudPromotion({});
          return;
        }

        const promotionMap = new Map(
          promotionCenterList?.map((promo) => [promo.id, promo]) || []
        );
        const itemWithPromotionInfo = {};
        for (const [key, value] of res.entries()) {
          itemWithPromotionInfo[key] = value.map((item) =>
            getItemWithPromotionInfoRule(item, promotionMap)
          );
        }

        setItemMatchCloudPromotion(itemWithPromotionInfo);
      } catch (error) {
        console.error('CloudPromotion: 设置商品促销信息失败', error);
        setItemMatchCloudPromotion({});
      }
    };
    if (
      isOpenCloudPromotion &&
      menuItemList &&
      currentOrder.orderType &&
      merchantProfile?.merchantId
    ) {
      handleSetItemPromotion();
    } else {
      // 促销中心关闭或条件不满足时清空，避免 Redux 中残留旧映射导致商品仍显示促销标签
      setItemMatchCloudPromotion({});
    }
  }, [
    promotionCenterList,
    isOpenCloudPromotion,
    menuItemList,
    currentOrder.orderType,
    merchantProfile?.merchantId,
  ]);

  // 整理promotion的相关规则
  const getItemWithPromotionInfoRule = (item, promotionMap) => {
    const rules = promotionMap.get(item.promotionId);
    if (!rules) {
      return { ...item, activityRule: null };
    }

    const {
      ruleExpression: { benefits, options, condition },
      type,
    } = rules;

    const activityRule = generateActivityRule(
      benefits,
      options,
      condition,
      type,
      language
    );
    return {
      ...item,
      activityRule,
      promotionCodes: rules?.promotionCodes,
      promotionName: rules?.promotionName,
      promotionType: type,
    };
  };

  const allItems = useMemo(() => {
    if (currentOrder.itemList?.length > 0) {
      return currentOrder.itemList.map((each) => ({
        ...each,
        uniqueItemTempId: uuidv4(),
      }));
    }
    return [];
  }, [currentOrder.itemList]);

  // 是否有crm活动
  const isHasCrmCampaign = useMemo(() => {
    const crmCampaign = isHasCRMCampaignFn({
      itemList: currentOrder.itemList,
      selectedFreeItem,
      selectedDiscount,
    });
    return crmCampaign || tempCampaign?.length > 0;
  }, [currentOrder.itemList, selectedFreeItem, selectedDiscount, tempCampaign]);

  const isAlreadySelectedPromotion = useMemo(() => {
    return itemValidPromotion?.find((each) => each.isSelected);
  }, [itemValidPromotion]);

  const preSelectedPromotionId = useRef(null);
  useEffect(() => {
    if (isAlreadySelectedPromotion) {
      const preId = preSelectedPromotionId.current;
      const currentId = isAlreadySelectedPromotion.promotion.id;
      if (!preId) {
        preSelectedPromotionId.current = currentId;
        return;
      }
      if (preId !== currentId) {
        if (
          !GIFT_PROMOTION_TYPE.includes(
            isAlreadySelectedPromotion.promotion.type
          )
        ) {
          removeManualSelectRewardItemFromOrder();
        }
        preSelectedPromotionId.current = currentId;
      }
    }
  }, [isAlreadySelectedPromotion]);

  // 只有一个活动并且已经生效,自动选择促销
  useEffect(() => {
    const handleCheckItemPromotion = async () => {
      try {
        if (!allItems.length || !promotionCenterList?.length)
          return setItemValidPromotion(null);
        const onCheckSuccess = (validateRes) => {
          if (
            validateRes.length === 1 &&
            !GIFT_PROMOTION_TYPE.includes(validateRes[0].promotion.type) &&
            !validateRes[0].promotion.promotionCodes?.length // 满赠 买赠 促销码。 必须手动选
          ) {
            const firstRule = validateRes[0];
            const isRuleValid = checkIsRuleValid(firstRule.validateInfo);
            const isRuleDiscountInvalid = checkIsRuleDiscountInvalid(firstRule);
            if (isRuleValid && !isRuleDiscountInvalid)
              return setItemValidPromotion([
                { ...firstRule, isSelected: true },
              ]);
          }
        };
        await handleCheckOrderPromotion({
          promotionCenterList,
          promotionCenterMetas,
          onCheckSuccess,
          merchantId: merchantProfile?.merchantId,
        });
      } catch (error) {
        console.error('CloudPromotion: 检查商品促销失败', error);
      }
    };
    if (
      promotionCenterMetas &&
      merchantProfile?.merchantId &&
      !isHasCrmCampaign &&
      !isAlreadySelectedPromotion &&
      !isPauseAutoValidatePromotion
    ) {
      handleCheckItemPromotion();
    }
  }, [
    promotionCenterMetas,
    merchantProfile?.merchantId,
    allItems,
    promotionCenterList,
    isHasCrmCampaign,
    isAlreadySelectedPromotion,
  ]);

  const prePromotionRewardItem = useMemo(() => {
    return allItems?.find((e) => e.promotionRewardItem);
  }, [allItems]);

  // 没有订单 清空促销
  useEffect(() => {
    if (!currentOrder.itemList?.length) {
      setItemValidPromotion(null);
    }
  }, [currentOrder.itemList]);

  // 没有选中的促销时 清空菜上的促销信息
  useEffect(() => {
    if (!isAlreadySelectedPromotion) {
      removeItemRewardInfoFromOrder();
    } else {
      setIsPauseAutoValidatePromotion(false);
    }
  }, [isAlreadySelectedPromotion]);

  // 全局促销校验
  useEffect(() => {
    const validatePromotion = async (selectedPromotion) => {
      try {
        const { promotion } = selectedPromotion;
        const res = await checkIsItemPromotionValid({
          rules: promotionCenterList,
          promotionCenterMetas,
          allItems,
        });
        if (res?.length > 0) {
          const updatedRuleInfo = res.find(
            (item) => item?.validateInfo?.result?.nodeId === promotion?.id
          );
          if (!updatedRuleInfo) return;
          const { validateInfo, promotion: updatePromotion } = updatedRuleInfo;
          const isRuleValid = checkIsRuleValid(validateInfo);
          const isRuleDiscountInvalid =
            checkIsRuleDiscountInvalid(updatedRuleInfo);
          // 促销不再生效
          if (!isRuleValid || isRuleDiscountInvalid) {
            setItemValidPromotion(null);
            removeItemRewardInfoFromOrder();
            return;
          }
          // 对比生效活动
          const isSameValidPromotion =
            updatePromotion.id === isAlreadySelectedPromotion?.promotion?.id;
          // 对比折扣值
          const isSameValidDiscount =
            isAlreadySelectedPromotion?.validateInfo?.result?.result
              ?.discounts[0]?.amount ===
            validateInfo?.result?.result?.discounts[0]?.amount;
          // 对比折扣字段
          const isSameDiscountField = compareSelectedPromotion({
            originSelectedPromotion: isAlreadySelectedPromotion,
            newSelectedPromotion: updatedRuleInfo,
          });
          if (
            !isSameValidPromotion ||
            !isSameValidDiscount ||
            !isSameDiscountField
          ) {
            const newItemValidPromotion = itemValidPromotion.map((each) => {
              return each.promotion.id === updatePromotion.id
                ? { ...updatedRuleInfo, isSelected: true }
                : { ...each, isSelected: undefined };
            });
            setItemValidPromotion(newItemValidPromotion);
          }
          const validateResult = validateInfo.result.result;
          let { discounts: orderDiscountInfo, orderItems } = validateResult;
          // 当前生效活动是促销码活动的话,需要给orderDiscountInfo的extraInfo增加promotionCode字段
          if (
            updatedRuleInfo?.promotion?.promotionCodes?.length > 0 &&
            promotionCode &&
            updatedRuleInfo?.promotion?.promotionCodes?.includes(promotionCode)
          ) {
            orderDiscountInfo[0] = {
              ...orderDiscountInfo[0],
              extraInfo: {
                ...orderDiscountInfo[0]?.extraInfo,
                promotionCode,
              },
            };
          }
          // 处理购物车菜列表数据
          const afterRewardItem = getOrderItemWithRewardInfo({
            items: allItems,
            orderItems,
            orderDiscountInfo,
          });
          // 对比菜单列表的折扣值
          const isEqualDiscount = compareItemDiscount({
            originItemList: allItems,
            newItemList: afterRewardItem,
          });
          if (isEqualDiscount) return;
          addCampaignItemsToOrder(afterRewardItem);
        } else {
          setItemValidPromotion(null);
          removeItemRewardInfoFromOrder();
        }
      } catch (error) {
        console.error('CloudPromotion: 全局促销校验失败', error);
      }
    };

    // 菜单有变化时, 进行校验
    if (
      promotionCenterMetas &&
      isAlreadySelectedPromotion &&
      !isHasCrmCampaign
    ) {
      validatePromotion(isAlreadySelectedPromotion);
    }
  }, [
    isAlreadySelectedPromotion,
    promotionCenterMetas,
    itemValidPromotion,
    prePromotionRewardItem,
    isHasCrmCampaign,
    promotionCode,
    promotionCenterList,
  ]);

  return null;
};

function mapStateToProps(state) {
  return {
    currentOrder: state.currentOrder,
    menuItemList: state.menuItemList,
    promotion: state.promotion,
    merchantProfile: state.merchantProfile,
    crm: state.crm,
    avocado: state.avocado,
    crmPromotionContrary: state.crmPromotionContrary,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    setCloudPromotionList,
    setCloudPromotionMetas,
    changeCloudPromotionStatus,
    setItemMatchCloudPromotion,
    setItemValidPromotion,
    removeItemRewardInfoFromOrder,
    addCampaignItemsToOrder,
    updatePromotionDealsInMenuGroup,
    setIsPauseAutoValidatePromotion,
    removeManualSelectRewardItemFromOrder,
  })(CloudPromotion)
);
