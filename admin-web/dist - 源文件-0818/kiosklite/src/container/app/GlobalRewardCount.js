import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  changeFreeItem,
  changeSelectedDiscount,
  setTempCampaign,
} from '@/actions/crm_action';
import RewardCenterModal from '@/component/RewardCenter/RewardCenterModal';
import { changeRewardModalVisible } from '@/actions/avocado';
import useCRM from '@/hooks/useReward/useCRM';
import {
  initMenuGroup2,
  setUpdateMenuLoad,
  removeFreeItemInOrder,
  removeRewardItemFromList,
  addCampaignItemsToOrder,
} from '@/actions';
import { fetchMenuGroup } from '@/api';
import {
  checkIsCampaignValid,
  handleCheckBundleDiscount,
  handleCheckDiscount,
  handleCheckFreeItem,
  handleCheckSpecialItem,
} from '@/utils/CRMIntegration/checkCRMIntegrationCampaign';
import { mapCRMDiscountItems } from '@/utils/CRMIntegration/resolveCRMRewardItem';
import { createFreeItemMenu } from '@/utils/createFreeItemMenu';
import filterMenuGroupByLicense from '@/utils/filterMenuGroupByLicense';
import { v4 as uuidv4 } from 'uuid';

const getPointMenuSignature = (menu) => ({
  exists: Boolean(menu),
  items: (menu?.menuCategories || [])
    .flatMap((category) => category?.saleItems || [])
    .map((item) => [
      item?.id,
      item?.oId,
      item?.itemPoints,
      item?.itemMax,
      item?.crmDescription,
    ]),
});

const GlobalRewardCount = (props) => {
  const {
    crm: {
      selectedDiscount,
      selectedFreeItem,
      rewardRule,
      tempCampaign,
      isIgnoreReward,
    },
    avocado: { metaData, rewardModalVisible, rewards, outletInfo },
    currentOrder,
    menuGroup,
    sysCookie,
    changeSelectedDiscount,
    changeFreeItem,
    setTempCampaign,
    changeRewardModalVisible,
    initMenuGroup2,
    setUpdateMenuLoad,
    removeFreeItemInOrder,
    removeRewardItemFromList,
    addCampaignItemsToOrder,
  } = props;

  const isCRMIntegration = useMemo(() => {
    return outletInfo?.enabled === 1;
  }, [outletInfo]);

  const activeCampaigns = isCRMIntegration ? rewards : rewardRule;
  const crmMenuReady = isCRMIntegration
    ? Array.isArray(rewards) && Boolean(metaData)
    : rewardRule.length > 0 || isIgnoreReward;

  const { getCRMRewardDiscount } = useCRM();

  useEffect(() => {
    const handleInitMenuWithCrmCampaign = async () => {
      let menuLoadingVisible = false;
      try {
        const menuRes = await fetchMenuGroup();
        if (menuRes.data?.KioskMenus?.[0]?.menuGroups?.length) {
          const KioskMenus = menuRes.data.KioskMenus;
          const baseMenuGroups = sysCookie.systemLicense?.length
            ? filterMenuGroupByLicense(
                KioskMenus[0].menuGroups,
                sysCookie.systemLicense
              )
            : KioskMenus[0].menuGroups;
          const nextPointMenu = createFreeItemMenu({
            menuGroup: baseMenuGroups,
            crmRewardCampaign: activeCampaigns || [],
            isCRMIntegration,
            orderType: currentOrder.orderType,
          });
          const currentPointMenu = menuGroup.find(
            (group) => group.isFreeItemMenu
          );
          const pointMenuChanged =
            JSON.stringify(getPointMenuSignature(currentPointMenu)) !==
            JSON.stringify(getPointMenuSignature(nextPointMenu));

          if (!pointMenuChanged) {
            return;
          }

          setUpdateMenuLoad(true);
          menuLoadingVisible = true;
          await initMenuGroup2({
            KioskMenus,
          });
        }
      } catch (error) {
        console.log('Refresh point-redeem menu failed', error);
      } finally {
        if (menuLoadingVisible) {
          setUpdateMenuLoad(false);
        }
      }
    };
    if (crmMenuReady) {
      handleInitMenuWithCrmCampaign();
    }
  }, [activeCampaigns, crmMenuReady]);

  const discountCoupons = useMemo(() => {
    return selectedDiscount?._id ? [selectedDiscount] : [];
  }, [selectedDiscount]);

  const freeItemInOrder = useMemo(() => {
    if (currentOrder.itemList?.length) {
      return currentOrder.itemList.find((each) => each.isFreeItem);
    }
    return null;
  }, [currentOrder.itemList]);

  const freeItemCoupons = useMemo(() => {
    return freeItemInOrder
      ? [...selectedFreeItem, freeItemInOrder]
      : selectedFreeItem;
  }, [selectedFreeItem, freeItemInOrder]);

  const isSelectedDiscount = useMemo(() => {
    return Object.keys(selectedDiscount)?.length > 0;
  }, [selectedDiscount]);

  const isSelectedFreeItem = useMemo(() => {
    return freeItemCoupons?.length > 0;
  }, [freeItemCoupons]);

  const isSelectedBundleDiscount = useMemo(() => {
    return tempCampaign?.find(
      (c) => c.rewardRule.redeemRule.strategy === 'orderItemFixedPriceCoupon'
    );
  }, [tempCampaign]);

  const isSelectedSpecialItems = useMemo(() => {
    return tempCampaign?.find(
      (c) => c.rewardRule.redeemRule.strategy === 'setPrice'
    );
  }, [tempCampaign]);

  const allItems = useMemo(() => {
    if (currentOrder.itemList?.length > 0) {
      return currentOrder.itemList.map((each) => ({
        ...each,
        uniqueItemTempId: uuidv4(),
      }));
    }
  }, [currentOrder.itemList]);

  // crm集成 折扣全局校验
  useEffect(() => {
    const getNewCampaignInfo = async (coupons) => {
      const res = await checkIsCampaignValid({ coupons, metaData, allItems });
      const rule = res?.[0];
      if (coupons?.[0]?.actualDiscount === rule.actualDiscount) return;
      const onCheckSuccess = (newRule) => {
        const validRes = newRule.crmIntegrationRule.result?.[0].calculatedOrder;
        const { orderItems, discounts: orderDiscountInfo } = validRes;
        const newItemList = mapCRMDiscountItems({
          orderItems,
          orderDiscountInfo,
          items: allItems,
        });
        addCampaignItemsToOrder(newItemList);
        changeSelectedDiscount(newRule);
      };
      const onCheckFailed = () => {
        changeSelectedDiscount({});
        setTempCampaign(null);
      };
      handleCheckDiscount({ rule, onCheckSuccess, onCheckFailed });
    };
    if (
      metaData &&
      isSelectedDiscount &&
      isCRMIntegration &&
      currentOrder.orderType
    ) {
      getNewCampaignInfo(discountCoupons);
    }
  }, [
    metaData,
    currentOrder,
    isSelectedDiscount,
    discountCoupons,
    isCRMIntegration,
    allItems,
  ]);

  // crm集成 兑换赠菜全局校验
  useEffect(() => {
    const getNewCampaignInfo = async (coupons) => {
      const res = await checkIsCampaignValid({ coupons, metaData });
      const rule = res?.[0];
      const onCheckFailed = () => {
        changeFreeItem([]);
        setTempCampaign(null);
        if (freeItemInOrder) {
          removeFreeItemInOrder({
            freeItemId: freeItemInOrder.id,
          });
        }
      };
      handleCheckFreeItem({ rule, onCheckFailed });
    };
    if (
      metaData &&
      isSelectedFreeItem &&
      isCRMIntegration &&
      currentOrder.orderType
    ) {
      getNewCampaignInfo(freeItemCoupons);
    }
  }, [
    metaData,
    currentOrder,
    isSelectedFreeItem,
    isCRMIntegration,
    freeItemInOrder,
  ]);

  const selectedSpecialItems = useMemo(() => {
    return currentOrder.itemList?.filter(
      (each) => each.isCRMIntegrationSpecialItem
    );
  }, [currentOrder.itemList]);

  // crm集成 特价优惠券全局校验
  useEffect(() => {
    const getNewCampaignInfo = async (coupons) => {
      const res = await checkIsCampaignValid({
        coupons,
        metaData,
      });
      const rule = res?.[0];
      const onCheckFailed = () => {
        removeRewardItemFromList();
        setTempCampaign(null);
      };
      handleCheckSpecialItem({ rule, onCheckFailed });
    };
    if (
      metaData &&
      isSelectedSpecialItems &&
      isCRMIntegration &&
      currentOrder.orderType &&
      selectedSpecialItems?.length > 0
    ) {
      getNewCampaignInfo([isSelectedSpecialItems]);
    }
  }, [
    metaData,
    currentOrder,
    isSelectedSpecialItems,
    isCRMIntegration,
    selectedSpecialItems,
  ]);

  const selectedBundleItems = useMemo(() => {
    return currentOrder.itemList?.filter(
      (each) => each.isCRMIntegrationBundleDiscountItem
    );
  }, [currentOrder.itemList]);

  // crm集成 m件n折全局校验
  useEffect(() => {
    const getNewCampaignInfo = async (coupons) => {
      const res = await checkIsCampaignValid({ coupons, metaData });
      const rule = res?.[0];
      const onCheckFailed = () => {
        removeRewardItemFromList();
        setTempCampaign(null);
      };
      handleCheckBundleDiscount({ rule, onCheckFailed });
    };
    if (
      metaData &&
      isSelectedBundleDiscount &&
      isCRMIntegration &&
      currentOrder.orderType &&
      selectedBundleItems?.length > 0
    ) {
      getNewCampaignInfo([isSelectedBundleDiscount]);
    }
  }, [
    metaData,
    currentOrder,
    isSelectedBundleDiscount,
    isCRMIntegration,
    selectedBundleItems,
  ]);

  useEffect(() => {
    if (!tempCampaign?.length) {
      removeRewardItemFromList();
    }
  }, [tempCampaign]);

  // crm自研 折扣全局校验
  useEffect(() => {
    const getNewCampaignInfo = () => {
      const res = getCRMRewardDiscount({
        rules: discountCoupons,
        itemResources: currentOrder?.itemList,
      });
      const rule = res?.[0];
      if (discountCoupons?.[0]?.actualDiscount === rule.actualDiscount) return;
      changeSelectedDiscount(res?.[0]);
      // setTempCampaign(null);
    };
    if (isSelectedDiscount && !isCRMIntegration && currentOrder.orderType) {
      getNewCampaignInfo(discountCoupons);
    }
  }, [
    currentOrder?.itemList,
    currentOrder,
    isSelectedDiscount,
    discountCoupons,
    isCRMIntegration,
  ]);

  return (
    <RewardCenterModal
      visible={rewardModalVisible}
      onClose={() => changeRewardModalVisible(false)}
      onConfirm={() => changeRewardModalVisible(false)}
    />
  );
};

function mapStateToProps(state) {
  return {
    crm: state.crm,
    avocado: state.avocado,
    currentOrder: state.currentOrder,
    menuGroup: state.menuGroup,
    sysCookie: state.sysCookie,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    changeFreeItem,
    changeSelectedDiscount,
    setTempCampaign,
    changeRewardModalVisible,
    initMenuGroup2,
    setUpdateMenuLoad,
    removeFreeItemInOrder,
    removeRewardItemFromList,
    addCampaignItemsToOrder,
  })(GlobalRewardCount)
);
