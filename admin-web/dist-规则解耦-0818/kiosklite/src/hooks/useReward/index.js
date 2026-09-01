import { useCallback, useEffect, useMemo, useState } from 'react';
import checkCRMType from '@/utils/checkCRMType';
import useCRMIntegration from '@/hooks/useReward/useCRMIntegration';
import useCRM from '@/hooks/useReward/useCRM';
import { checkIsCampaignValid } from '@/utils/CRMIntegration/checkCRMIntegrationCampaign';
import { getValidCategoryList } from '@/utils/getStandardCateDish';
import { isCampaignInTypes } from '@/utils/CRMIntegration/getTemplateAction';

export function useReward(props) {
  const {
    rewards,
    vouchers,
    allSysConfig,
    menuGroup,
    comboMenu,
    metaData,
    rewardRule,
    currentOrder,
  } = props;

  const hasOrderType = useMemo(() => {
    return !!currentOrder.orderType;
  }, [currentOrder.orderType]);

  const { getCRMIntegrationRewardList, getCRMIntegrationVoucherList } =
    useCRMIntegration();
  const { getCRMRewardFreeItem, getCRMRewardDiscount } = useCRM();

  const [validADRewards, setValidADRewards] = useState(null);
  const [validADVouchers, setValidADVouchers] = useState(null);
  const [rewardList, setRewardList] = useState(null);
  const [voucherList, setVoucherList] = useState(null);

  // 1-CRM 2-AD
  const crmType = useMemo(() => {
    return checkCRMType(allSysConfig);
  }, [allSysConfig]);

  const resolveCampaignData = useCallback((data) => {
    return data?.map((each) => {
      if (
        isCampaignInTypes({
          template: each.couponTemplate,
          // 第M件N折 特价菜默认校验通过
          types: ['orderItemFixedPriceCoupon', 'quantityItemDiscountCoupon'],
        })
      ) {
        return {
          ...each,
          crmIntegrationRule: {
            isValid: true,
          },
        };
      }
      return each;
    });
  }, []);

  // 提取所有菜品
  const itemResources = useMemo(() => {
    if (!currentOrder.orderType) return [];
    const withoutFreeItemMenu = menuGroup.filter(
      (_) => !_.isFreeItemMenu && _.id !== 'promotion-deals-list'
    );
    // 去除商品中心存在在combo菜里的子菜
    const comboMenuIds = comboMenu.map((each) => each.saleItemId);
    const pureSaleItems = withoutFreeItemMenu.map((item) => ({
      ...item,
      menuCategories: item?.menuCategories?.map((cate) => ({
        ...cate,
        saleItems: cate?.saleItems?.filter(
          (each) =>
            !(
              comboMenuIds.includes(each.id) &&
              each.itemPrices?.length > 0 &&
              each.itemPrices.every((item) => item.type.toUpperCase() === 'ALL')
            )
        ),
      })),
    }));
    return getValidCategoryList(pureSaleItems, currentOrder.orderType, false)
      .flatMap((category) => category.saleItems)
      .filter(Boolean);
  }, [menuGroup, currentOrder.orderType, comboMenu]);

  useEffect(() => {
    if (crmType !== 2) return;
    const getReward = async (coupons) => {
      if (!metaData || !hasOrderType) return;
      if (coupons?.length <= 0) return;
      const tempValidADRewards = coupons.filter((each) => each.couponTemplate);
      const res = await checkIsCampaignValid({
        coupons: tempValidADRewards,
        metaData,
      });
      setValidADRewards(resolveCampaignData(res));
    };
    const getVouchers = async (coupons) => {
      if (!metaData || !hasOrderType) return;
      const tempValidADVouchers =
        Array.isArray(coupons) && coupons?.length > 0
          ? coupons
              .filter(
                (voucher) =>
                  voucher.count > 0 &&
                  voucher.rewardRule &&
                  voucher.rewardRule.couponTemplate
              )
              .map((e) => {
                return e.rewardRule;
              })
          : [];
      const res = await checkIsCampaignValid({
        coupons: tempValidADVouchers,
        metaData,
      });
      setValidADVouchers(resolveCampaignData(res));
    };
    if (Array.isArray(rewards)) {
      getReward(rewards);
    } else {
      setValidADRewards(null);
    }
    if (Array.isArray(vouchers)) {
      getVouchers(vouchers);
    } else {
      setValidADVouchers(null);
    }
  }, [rewards, vouchers, crmType, metaData, hasOrderType]);

  useEffect(() => {
    if (crmType === 2 && itemResources?.length) {
      if (Array.isArray(validADRewards)) {
        const list = getCRMIntegrationRewardList({
          rewards: validADRewards || [],
          itemResources,
          orderType: currentOrder.orderType,
        });
        setRewardList(list.sort((a, b) => a.itemPoints - b.itemPoints));
      } else {
        setRewardList(null);
      }
      if (Array.isArray(validADVouchers)) {
        const list = getCRMIntegrationVoucherList({
          vouchers: validADVouchers || [],
          itemResources,
          orderType: currentOrder.orderType,
        });
        setVoucherList(list);
      } else {
        setVoucherList(null);
      }
    }
  }, [
    crmType,
    itemResources,
    validADRewards,
    validADVouchers,
    currentOrder.orderType,
  ]);

  useEffect(() => {
    if (crmType === 1 && hasOrderType) {
      const freeItemRewardList =
        itemResources?.length > 0
          ? getCRMRewardFreeItem({
              rules: rewardRule,
              itemResources,
            })
          : [];
      const discountRewardList = getCRMRewardDiscount({
        rules: rewardRule || [],
        itemResources: currentOrder.itemList || [],
      });
      setRewardList(
        [...freeItemRewardList, ...discountRewardList].sort(
          (a, b) => a.itemPoints - b.itemPoints
        )
      );
    }
  }, [crmType, itemResources, rewardRule, hasOrderType, currentOrder.itemList]);

  return {
    rewardList,
    voucherList,
  };
}

export default useReward;
