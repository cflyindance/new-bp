import { useCallback } from 'react';
import getCampaignViaType from '@/utils/CRMIntegration/getCampaignViaType';
import {
  resolveRewardItemCampaign,
  resolveVoucherItemCampaign,
} from '@/utils/CRMIntegration/resolveItemCampaign';
import { resolveDiscountCampaign } from '@/utils/CRMIntegration/resolveDiscountCampaign';
import { resolveSpecialItemCampaigns } from '@/utils/CRMIntegration/resolveSpecialItemCampaigns';
import { resolveBundleDiscount } from '@/utils/CRMIntegration/resolveBundleDiscount';

const useCRMIntegration = () => {
  const getCRMIntegrationRewardList = useCallback(
    ({ rewards, itemResources, orderType }) => {
      if (rewards?.length > 0) {
        // 积分相关
        // 赠菜
        const addItemReward = getCampaignViaType({
          campaigns: rewards,
          types: ['giftItemCoupon'],
          source: 'reward',
        });
        const rewardFreeItem = resolveRewardItemCampaign({
          rules: addItemReward,
          itemResources,
          orderType,
        });
        // 折扣
        const percentageFixedReward = getCampaignViaType({
          campaigns: rewards,
          types: ['discountCoupon', 'voucher'],
          source: 'reward',
        });
        const rewardDiscount = resolveDiscountCampaign(percentageFixedReward);
        // 特价商品
        const specialItemReward = getCampaignViaType({
          campaigns: rewards,
          types: ['orderItemFixedPriceCoupon'],
          source: 'reward',
        });
        const rewardSpecialItem = resolveSpecialItemCampaigns({
          rules: specialItemReward,
          itemResources,
          orderType,
        });
        // 第M件N折
        const bundleDiscount = getCampaignViaType({
          campaigns: rewards,
          types: ['quantityItemDiscountCoupon'],
          source: 'reward',
        });
        const rewardBundleDiscount = resolveBundleDiscount({
          rules: bundleDiscount,
          itemResources,
          orderType,
        });
        return [
          ...rewardFreeItem,
          ...rewardDiscount,
          ...rewardSpecialItem,
          ...rewardBundleDiscount,
        ];
      }
      return [];
    },
    []
  );

  const getCRMIntegrationVoucherList = useCallback(
    ({ vouchers, itemResources, orderType }) => {
      if (vouchers?.length > 0) {
        // 券相关
        const addItemVoucher = getCampaignViaType({
          campaigns: vouchers || [],
          types: ['giftItemCoupon'],
          source: 'voucher',
        });
        const voucherFreeItem = resolveVoucherItemCampaign({
          rules: addItemVoucher,
          itemResources,
          orderType,
        });
        const voucherFreeItemSet = voucherFreeItem
          .map((each) => each.extSkuMapping)
          ?.flat();
        const percentageFixedVoucher = getCampaignViaType({
          campaigns: vouchers || [],
          types: ['discountCoupon', 'voucher'],
          source: 'voucher',
        });
        const voucherDiscount = resolveDiscountCampaign(percentageFixedVoucher);
        // 特价商品
        const specialItemReward = getCampaignViaType({
          campaigns: vouchers || [],
          types: ['orderItemFixedPriceCoupon'],
          source: 'voucher',
        });
        const voucherSpecialItem = resolveSpecialItemCampaigns({
          rules: specialItemReward,
          itemResources,
          orderType,
        });
        // 第M件N折
        const bundleDiscount = getCampaignViaType({
          campaigns: vouchers || [],
          types: ['quantityItemDiscountCoupon'],
          source: 'voucher',
        });
        const voucherBundleDiscount = resolveBundleDiscount({
          rules: bundleDiscount,
          itemResources,
          orderType,
        });
        return [
          ...voucherDiscount,
          ...voucherFreeItemSet,
          ...voucherSpecialItem,
          ...voucherBundleDiscount,
        ];
      }
      return [];
    },
    []
  );

  return {
    getCRMIntegrationRewardList,
    getCRMIntegrationVoucherList,
  };
};

export default useCRMIntegration;
