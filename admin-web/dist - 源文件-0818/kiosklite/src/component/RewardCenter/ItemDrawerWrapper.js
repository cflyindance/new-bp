import { withTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { setTempCampaign } from '@/actions/crm_action';
import ItemsDrawer from './ItemsDrawer';
import {
  checkIsCampaignValid,
  handleCheckBundleDiscount,
  handleCheckSpecialItem,
} from '@/utils/CRMIntegration/checkCRMIntegrationCampaign';
import React, { useCallback, useMemo, useState } from 'react';
import { addCampaignItemsToOrder } from '@/actions';
import UnSatisfyModal from './UnSatisfyModal';
import { v4 as uuidv4 } from 'uuid';

const initUnSatisfyModalInfo = {
  open: false,
  failureReason: '',
  items: [],
};

const ItemDrawerWrapper = (props) => {
  const {
    open,
    data,
    onClose,
    avocado: { metaData },
    setTempCampaign,
    currentOrder: { itemList },
    addCampaignItemsToOrder,
  } = props;

  const [unSatisfyModalInfo, setUnSatisfyModalInfo] = useState(
    initUnSatisfyModalInfo
  );

  const rewardStrategy = useMemo(() => {
    return data?.rewardRule?.redeemRule.strategy;
  }, [data]);

  const isSpecialItem = useMemo(() => {
    return rewardStrategy === 'setPrice';
  }, [rewardStrategy]);

  const isBundleDiscount = useMemo(() => {
    return rewardStrategy === 'orderItemFixedPriceCoupon';
  }, [rewardStrategy]);

  // 校验特价商品
  const handleConfirmSpecialItems = useCallback(async (items) => {
    const res = await checkIsCampaignValid({
      coupons: [data],
      metaData,
      allItems: items,
    });
    const rule = res?.[0];
    if (rule) {
      const { ruleId } = rule;
      const onCheckSuccess = (rule) => {
        const validRes = rule.crmIntegrationRule.result?.[0].calculatedOrder;
        const { orderItems, discounts: orderDiscountInfo } = validRes;
        const specialItemWithRule = items.reduce((pre, cur) => {
          const isRewardItem = orderItems.find(
            (i) => i.id === cur.uniqueItemTempId
          );
          if (!isRewardItem) return pre.concat(cur);
          const crmCampaignRewardInfo = {
            actualDiscount:
              cur?.actualDiscount ?? isRewardItem.discounts?.[0]?.amount,
            isCRMIntegrationSpecialItem: true, // 打个标签
            campaignRewardItem: true, // 奖励菜品
            _id: ruleId,
            orderDiscountInfo,
            itemDiscountInfo: isRewardItem.discounts,
          };
          if (cur.quantity === 1) {
            const rewardItem = {
              ...rule,
              ...cur,
              ...crmCampaignRewardInfo,
              crmCampaignRewardInfo: {
                ...crmCampaignRewardInfo,
                uniqueItemTempId: cur.uniqueItemTempId,
              },
            };
            return pre.concat(rewardItem);
          }
          const newItem = { ...cur, quantity: cur.quantity - 1 };
          const rewardItem = {
            ...rule,
            ...cur,
            ...crmCampaignRewardInfo,
            quantity: 1,
          };
          return pre.concat(newItem, rewardItem);
        }, []);
        setTempCampaign([rule]);
        addCampaignItemsToOrder(specialItemWithRule);
      };
      return handleCheckSpecialItem({ rule, onCheckSuccess });
    }
    return false;
  }, []);

  // m件n折校验失败
  const onCheckBundleDiscountFailed = ({ failureReason, items }) => {
    setUnSatisfyModalInfo({
      open: true,
      failureReason,
      items,
    });
  };

  const orderListItems = useMemo(() => {
    if (itemList?.length > 0) {
      return itemList.map((each) => ({
        ...each,
        uniqueItemTempId: uuidv4(),
        isFromCurrentOrderItemList: true,
      }));
    }
  }, [itemList]);

  // 校验m件n折菜品
  const handleConfirmBundleDiscount = useCallback(async (items) => {
    const res = await checkIsCampaignValid({
      coupons: [data],
      metaData,
      allItems: items,
    });
    const rule = res?.[0];
    if (rule) {
      const onCheckSuccess = (rule) => {
        const validRes = rule.crmIntegrationRule.result?.[0].calculatedOrder;
        const { orderItems, discounts: orderDiscountInfo } = validRes;
        const bundleDiscountItemWithRule = items.reduce((pre, cur) => {
          const isRewardItem = orderItems.find(
            (i) => i.id === cur.uniqueItemTempId
          );
          if (!isRewardItem) return pre.concat(cur);
          const crmCampaignRewardInfo = {
            actualDiscount:
              cur?.actualDiscount ?? isRewardItem.discounts?.[0]?.amount,
            orderDiscountInfo,
            itemDiscountInfo: isRewardItem.discounts,
            isCRMIntegrationBundleDiscountItem: true, // 打个标签
            campaignRewardItem: true, // 奖励菜品
          };
          if (cur.quantity === 1) {
            const rewardItem = {
              ...rule,
              ...cur,
              ...crmCampaignRewardInfo,
              crmCampaignRewardInfo: {
                ...crmCampaignRewardInfo,
                uniqueItemTempId: cur.uniqueItemTempId,
              },
            };
            return pre.concat(rewardItem);
          }
          const newItem = { ...cur, quantity: cur.quantity - 1 };
          const rewardItem = {
            ...rule,
            ...cur,
            ...crmCampaignRewardInfo,
            quantity: 1,
          };
          return pre.concat(newItem, rewardItem);
        }, []);
        setTempCampaign([rule]);
        addCampaignItemsToOrder(bundleDiscountItemWithRule);
      };
      return handleCheckBundleDiscount({
        rule,
        onCheckSuccess,
        onCheckFailed: ({ failureReason }) =>
          onCheckBundleDiscountFailed({ failureReason, items }),
      });
    }
    return false;
  }, []);

  const max = useMemo(() => {
    if (isSpecialItem) return 1;
    if (isBundleDiscount) return 9999;
  }, [isSpecialItem, isBundleDiscount]);

  const handleConfirm = useCallback(
    (items) => {
      if (isSpecialItem) return handleConfirmSpecialItems(items);
      if (isBundleDiscount) return handleConfirmBundleDiscount(items);
    },
    [
      isSpecialItem,
      isBundleDiscount,
      handleConfirmSpecialItems,
      handleConfirmBundleDiscount,
    ]
  );

  const handleBackToOrder = () => {
    setUnSatisfyModalInfo(initUnSatisfyModalInfo);
  };

  const handleContinueOrder = () => {
    const { items } = unSatisfyModalInfo;
    addCampaignItemsToOrder(items);
    onClose();
  };

  return (
    <>
      <ItemsDrawer
        open={open}
        displayName={data.displayName}
        activityInfo={data}
        itemList={data.couponItemList}
        onClose={onClose}
        max={max}
        value={orderListItems}
        handleConfirm={handleConfirm}
      />
      <UnSatisfyModal
        onBack={handleBackToOrder}
        onConfirm={handleContinueOrder}
        unSatisfyModalInfo={unSatisfyModalInfo}
      />
    </>
  );
};

function mapStateToProps(state) {
  return {
    crm: state.crm,
    avocado: state.avocado,
    currentOrder: state.currentOrder,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    setTempCampaign,
    addCampaignItemsToOrder,
  })(withTranslation()(ItemDrawerWrapper))
);
