import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import Toast from '@/component/toast';
import {
  checkIsItemPromotionValid,
  makeUpPromotionAddOnItem,
  makeUpSpecialPromotionAddOnItem,
  checkIsRuleValid,
  getGiftPromotionRewardItems,
} from '@/utils/PromotionCenterIntegration/checkCloudPromotion';
import { getValidCategoryList } from '@/utils/getStandardCateDish';
import { addCampaignItemsToOrder } from '@/actions';
import { setItemValidPromotion } from '@/actions/promotion';
import {
  GIFT_PROMOTION_TYPE,
  RECOMMEND_SUCCESS_TYPE,
} from '@/constants/promotion';
import {
  makeUpItemValidPromotion,
  getPromotionCenterActivityRuleText,
} from '@/utils/PromotionCenterIntegration';
import Big from 'big.js';

const initDrawerState = {
  visible: false,
  promotion: null,
  max: 9999,
  type: null, // 标识类型，凑单/奖励
};

/**
 * 促销凑单功能 Hook
 * @param {Object} params - 参数对象（可选）
 * @param {Function} params.onSkip - 跳过回调（可选）
 * @param {Function} params.onClose - 关闭吊起该方法组件的回调（可选）
 * @param {Function} params.goOrder - 跳转页面的回调（可选）
 * @returns {Object} 返回 ItemsDrawer 组件、控制方法和状态
 */
const useAddOnPromotion = ({
  onSkip,
  onClose,
  goOrder,
  isGiftPromotionAutoOpenRewardModal,
  promotionCenterList,
} = {}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // 从 Redux 获取数据
  const currentOrder = useSelector((state) => state.currentOrder);
  const menuGroup = useSelector((state) => state.menuGroup);
  const itemValidPromotion = useSelector(
    (state) => state.promotion.itemValidPromotion
  );
  const promotionCenterMetas = useSelector(
    (state) => state.promotion.promotionCenterMetas
  );
  const memberCRMInfo = useSelector((state) => state.crm.memberCRMInfo);
  const selfConfig = useSelector((state) => state.selfConfig);
  const [drawerState, setDrawerState] = useState(initDrawerState);

  const addOnItemDrawerVisible = useMemo(() => {
    return drawerState.visible;
  }, [drawerState]);
  const addOnPromotion = useMemo(() => {
    return drawerState.promotion;
  }, [drawerState]);
  const addOnPromotionMax = useMemo(() => {
    return drawerState.max;
  }, [drawerState]);
  const drawerType = useMemo(() => {
    return drawerState.type;
  }, [drawerState]);

  /**
   * 关闭抽屉
   */
  const handleCloseDrawer = useCallback(() => {
    setDrawerState(initDrawerState);
  }, []);

  // 计算商品资源列表
  const itemResources = useMemo(() => {
    if (!currentOrder?.orderType) return [];
    const withoutFreeItemMenu = menuGroup.filter(
      (g) => !g.isFreeItemMenu && g.id !== 'promotion-deals-list'
    );
    return getValidCategoryList(
      withoutFreeItemMenu,
      currentOrder.orderType,
      false
    )
      .flatMap((category) => category.saleItems)
      .filter(Boolean);
  }, [menuGroup, currentOrder?.orderType]);

  // 生成订单商品列表（带唯一ID）
  const orderListItems = useMemo(() => {
    if (currentOrder?.itemList?.length > 0) {
      return currentOrder.itemList.map((e) => ({
        ...e,
        uniqueItemTempId: uuidv4(),
      }));
    }
    return [];
  }, [currentOrder?.itemList]);

  const value = useMemo(() => {
    if (addOnPromotion && orderListItems?.length > 0) {
      const { promotion } = addOnPromotion;
      if (!GIFT_PROMOTION_TYPE.includes(promotion.type)) return orderListItems;
      return drawerType === 'addon'
        ? orderListItems.filter((e) => !e.manualSelectRewardDiscount)
        : orderListItems.filter((e) => e.manualSelectRewardDiscount);
    }
  }, [orderListItems, addOnPromotion, drawerType]);

  /**
   * 打开凑单抽屉
   * @param {Object} promotionItem - 促销项
   * @param {Boolean} isDealListClick - 是否是从卡片列表点击，当促销活动是特价优惠时，从卡片列表点击是打开活动列表，若点击【去凑单】，则去菜单页；（因为特价优惠特殊，商品即可以凑单又可以参与活动）
   */
  const goAddOnPromotion = useCallback(
    (promotionItem, isDealListClick = false) => {
      const {
        promotion: {
          type,
          memberScope,
          ruleExpression: { condition, benefits, options },
        },
        orderItemList,
      } = promotionItem;
      let itemList = []; //商品列表
      if (memberScope === 'allMember' && !Object.keys(memberCRMInfo)?.length) {
        return Toast.info(t('promotion-select-member-item'), 2000);
      }

      const getFilterType = () => {
        const isGiftOrFixedPrice =
          type === 'orderItemGiftItem' || type === 'orderItemFixedPrice';

        const filterType = isGiftOrFixedPrice
          ? benefits?.[0]?.condition?.itemFilter?.type
          : condition?.itemFilter?.type;

        return filterType;
      };

      // 获取促销的 itemFilter value
      const getFilterValue = () => {
        if (type === 'orderItemGiftItem') {
          // 买赠
          return benefits?.[0]?.condition?.itemFilter?.value;
        } else if (type === 'orderItemFixedPrice') {
          //特价优惠
          return benefits.flatMap(
            (benefit) => benefit.condition.itemFilter?.value || []
          );
        }
        return condition?.itemFilter?.value;
      };

      const itemFilterType = getFilterType();
      const itemFilterValue = getFilterValue();

      // 特价优惠菜品处理
      if (type === 'orderItemFixedPrice') {
        itemList = makeUpSpecialPromotionAddOnItem({
          benefits,
          itemResources,
          orderType: currentOrder.orderType,
          options,
        });
        if (!isDealListClick) {
          if (onClose) {
            onClose();
          }
          if (goOrder) {
            goOrder();
          }
          return;
        }
      } else if (type === 'orderItemGiftItem') {
        // 买赠凑单菜处理
        const rule = {
          promotion: {
            ruleExpression: {
              condition: benefits?.[0].condition,
            },
          },
        };
        itemList = makeUpPromotionAddOnItem({
          promotionRule: rule,
          itemResources,
          orderType: currentOrder?.orderType,
        });
      } else {
        // 全部商品参与
        if (
          itemFilterType === 'all' ||
          !itemFilterType ||
          !itemFilterValue?.length
        ) {
          // 关闭调起凑单的界面
          if (onClose) {
            onClose();
          }
          // 是否需要跳转某些页面
          if (goOrder) {
            goOrder();
          }
          return;
        }
        itemList = makeUpPromotionAddOnItem({
          promotionRule: promotionItem,
          itemResources,
          orderType: currentOrder.orderType,
        });
      }
      if (!itemList?.length) {
        Toast.info(t('noValidItem'));
        return;
      }

      // 合并状态更新，避免两次渲染
      setDrawerState({
        visible: true,
        promotion: { ...promotionItem, itemList },
        max: itemList[0]?.quantityLimit || 9999,
        type: GIFT_PROMOTION_TYPE.includes(type) ? 'addon' : 'reward', // 对于满赠，买赠来说是凑单
      });
    },
    [itemResources, currentOrder?.orderType, onClose, goOrder, t, memberCRMInfo]
  );

  // 打开满赠 买赠, 选赠菜抽屉
  const handleSelectGiftReward = useCallback(
    (promotionItem) => {
      const {
        recommendType,
        orderItemList,
        promotion,
        extraInfo,
        selectQuantity,
      } = promotionItem;
      if (RECOMMEND_SUCCESS_TYPE.includes(recommendType)) {
        const rewardItemPool =
          promotion.type === 'amountGiftItem'
            ? extraInfo?.currentGiftItemList || orderItemList
            : orderItemList;
        if (!rewardItemPool?.length)
          return Toast.info(t('no-promotion-reward-pool'));
        const itemList = getGiftPromotionRewardItems({
          itemResources,
          orderItemList: rewardItemPool,
          orderType: currentOrder?.orderType,
        });
        setDrawerState({
          visible: true,
          promotion: { ...promotionItem, itemList },
          max:
            promotion.type === 'orderItemGiftItem'
              ? selectQuantity
              : extraInfo?.currentSelectQuantity,
          type: 'reward',
        });
      }
    },
    [
      itemResources,
      currentOrder?.orderType,
      onClose,
      goOrder,
      orderListItems,
      t,
    ]
  );

  // 确认满赠 买赠的凑单菜
  const handleAddonItemFromGiftPromotion = useCallback(
    async (items) => {
      const rewardItems = orderListItems.filter(
        (e) => e.manualSelectRewardDiscount
      );
      const allItems = [...items, ...rewardItems];
      const { promotion: rule } = addOnPromotion;
      const res = await checkIsItemPromotionValid({
        rules: promotionCenterList,
        promotionCenterMetas,
        allItems,
      });
      let newItemValidPromotion = [];

      const currentRule = res.filter(
        (item) => item?.validateInfo?.result?.nodeId === rule?.id
      );
      if (currentRule?.length === 1) {
        const currentRuleInfo = currentRule[0];
        const { recommendType, promotion, selectQuantity } = currentRuleInfo;
        // 凑完单后，订单里没有可以直接赠送的菜
        if (RECOMMEND_SUCCESS_TYPE.includes(recommendType)) {
          if (itemValidPromotion) {
            newItemValidPromotion = itemValidPromotion.map((each) => {
              return each.promotion.id === promotion.id
                ? { ...currentRuleInfo, isSelected: each.isSelected || false }
                : { ...each };
            });
          } else {
            newItemValidPromotion = [{ ...currentRuleInfo, isSelected: false }];
          }
          dispatch(addCampaignItemsToOrder(items));
          dispatch(setItemValidPromotion(newItemValidPromotion));
          if (isGiftPromotionAutoOpenRewardModal) {
            const rewardItemNum = items
              ?.filter((e) => e.manualSelectRewardDiscount)
              ?.reduce((acc, item) => {
                return acc + item.quantity || 0;
              }, 0);
            if (rewardItemNum < selectQuantity) {
              handleSelectGiftReward(currentRuleInfo);
            }
            return false;
          }
          // 关闭drawer
          handleCloseDrawer();
          return true;
        }
        // 未达门槛，更新菜，更新促销状态，关闭促销弹窗
        newItemValidPromotion = makeUpItemValidPromotion({
          currentRuleInfo,
          itemValidPromotion,
          isCurrentSelected: false,
        });
        dispatch(addCampaignItemsToOrder(items));
        dispatch(setItemValidPromotion(newItemValidPromotion));
        Toast.info(t('notReachThreshold'));
        handleCloseDrawer();
        return false;
      }
      Toast.info(t('notValidPromotion'));
      handleCloseDrawer();
      return false;
    },
    [
      addOnPromotion,
      promotionCenterMetas,
      itemValidPromotion,
      dispatch,
      handleCloseDrawer,
      t,
      isGiftPromotionAutoOpenRewardModal,
      handleSelectGiftReward,
      orderListItems,
      promotionCenterList,
    ]
  );

  // 确认满赠 买赠的赠菜
  const handleConfirmGiftReward = useCallback(
    async (items) => {
      const { promotion: rule } = addOnPromotion;
      const manualSelectRewardItems = items.map((item) => ({
        ...item,
        // 手动选赠菜 需要增加部分信息给sdk
        manualSelectRewardDiscount: [
          {
            extraInfo: {
              isUserSelected: true,
            },
            isReward: true,
            id: rule.id,
            amount: 0,
            type: 'promotion',
          },
        ],
      }));
      const orderItems = orderListItems.filter(
        (e) => !e.manualSelectRewardDiscount
      );
      const allItems = [...orderItems, ...manualSelectRewardItems];
      // 如果赠菜总价为0, 没有意义
      const allItemPrice = manualSelectRewardItems
        ?.reduce((acc, item) => {
          return Big(acc).plus(item.totalAmount || 0);
        }, 0)
        ?.toNumber();
      if (allItemPrice === 0) return Toast.info(t('no-reward-zero-price-item'));
      const res = await checkIsItemPromotionValid({
        rules: promotionCenterList,
        promotionCenterMetas,
        allItems,
      });
      const currentRule = res.filter(
        (item) => item?.validateInfo?.result?.nodeId === rule?.id
      );
      if (currentRule?.length === 1) {
        const currentRuleInfo = currentRule[0];
        const { validateInfo } = currentRuleInfo;
        const isRuleValid = checkIsRuleValid(validateInfo);
        let newItemValidPromotion = [];
        // 校验成功
        if (isRuleValid) {
          newItemValidPromotion = makeUpItemValidPromotion({
            currentRuleInfo,
            itemValidPromotion,
            isCurrentSelected: true,
          });
          dispatch(addCampaignItemsToOrder(allItems));
          dispatch(setItemValidPromotion(newItemValidPromotion));
          // 关闭drawer
          handleCloseDrawer();
          // 如果有 onSkip 回调，则调用（关闭弹窗且跳转到下一步）
          // onSkip?.();
          return true;
        }

        Toast.info(t('notReachThreshold'));
        return false;
      }
      Toast.info(t('notValidPromotion'));
      handleCloseDrawer();
      return false;
    },
    [
      addOnPromotion,
      promotionCenterMetas,
      itemValidPromotion,
      dispatch,
      handleCloseDrawer,
      // onSkip,
      t,
      orderListItems,
      promotionCenterList,
    ]
  );

  /**
   * 非满赠，买赠的凑单确认
   * @param {Array} items - 选中的商品列表
   * @returns {Promise<boolean>} 是否成功
   */
  const handleSelectRewardItem = useCallback(
    async (items) => {
      const { promotion: rule } = addOnPromotion;
      // 如果菜总价为0, 没有意义
      const allItemPrice = items
        ?.reduce((acc, item) => {
          return Big(acc).plus(item.totalAmount || 0);
        }, 0)
        ?.toNumber();
      if (allItemPrice === 0) return Toast.info(t('no-reward-zero-price-item'));
      const res = await checkIsItemPromotionValid({
        rules: promotionCenterList,
        promotionCenterMetas,
        allItems: items,
      });
      const currentRule = res.filter(
        (item) => item?.validateInfo?.result?.nodeId === rule?.id
      );
      if (currentRule?.length === 1) {
        const currentRuleInfo = currentRule[0];
        const { validateInfo, promotion } = currentRuleInfo;
        const isRuleValid = checkIsRuleValid(validateInfo);
        let newItemValidPromotion = [];
        // 校验成功
        if (isRuleValid) {
          newItemValidPromotion = makeUpItemValidPromotion({
            currentRuleInfo,
            itemValidPromotion,
            isCurrentSelected: true,
          });
          dispatch(addCampaignItemsToOrder(items));
          dispatch(setItemValidPromotion(newItemValidPromotion));
          // 关闭drawer
          handleCloseDrawer();
          // 如果有 onSkip 回调，则调用（关闭弹窗且跳转到下一步）
          // onSkip?.();
          return true;
        }
        // 未达门槛，更新菜，更新促销状态，关闭促销弹窗
        newItemValidPromotion = makeUpItemValidPromotion({
          currentRuleInfo,
          itemValidPromotion,
          isCurrentSelected: false,
        });
        dispatch(addCampaignItemsToOrder(items));
        dispatch(setItemValidPromotion(newItemValidPromotion));
        Toast.info(t('notReachThreshold'));
        handleCloseDrawer();
        return false;
      }

      Toast.info(t('notValidPromotion'));
      handleCloseDrawer();
      return false;
    },
    [
      addOnPromotion,
      promotionCenterMetas,
      itemValidPromotion,
      dispatch,
      handleCloseDrawer,
      // onSkip,
      t,
      promotionCenterList,
    ]
  );

  // 弹窗确认
  const handleDrawerConfirm = useCallback(
    async (items) => {
      const {
        promotion: { type },
      } = addOnPromotion;
      // 非满赠 买赠
      if (!GIFT_PROMOTION_TYPE.includes(type))
        return await handleSelectRewardItem(items);
      // 满赠买赠的凑单
      return drawerType === 'addon'
        ? await handleAddonItemFromGiftPromotion(items)
        : await handleConfirmGiftReward(items);
      // 满赠买赠的选奖励菜
    },
    [
      addOnPromotion,
      handleSelectRewardItem,
      handleConfirmGiftReward,
      handleAddonItemFromGiftPromotion,
      drawerType,
    ]
  );

  return {
    drawerProps: {
      open: addOnItemDrawerVisible,
      displayName: getPromotionCenterActivityRuleText({
        t,
        activityRule: addOnPromotion?.promotion?.activityRule,
        type: addOnPromotion?.promotion?.type,
        promotionName: addOnPromotion?.promotion?.promotionName,
        selfConfig,
        promoCenterHitActivity: addOnPromotion,
      }),
      activityInfo: addOnPromotion?.promotion,
      itemList: addOnPromotion?.itemList || [],
      value,
      max: addOnPromotionMax,
      drawerType,
    },
    // 控制方法
    goAddOnPromotion,
    handleCloseDrawer,
    handleDrawerConfirm,
    handleSelectGiftReward,
  };
};

export default useAddOnPromotion;
