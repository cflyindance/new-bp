import i18n from '@/assets/i18n/i18n';
import { langCodeMap } from '@/constants/mockData';
import checkCRMStatus from '@/utils/checkCRMStatus';
import { filterValidPromotionCenterList } from '@/utils/PromotionCenterIntegration/checkCloudPromotion';

export const createPromotionDealsList = async ({ promotion, allSysConfig }) => {
  const {
    cloudPromotion,
    orderDiscount,
    buyGiftRule,
    buyDiscountRule,
    promotionCenterList,
    promotionCenterMetas,
  } = promotion;
  const isCRMEnable = !checkCRMStatus(allSysConfig);
  const menuId = 'promotion-deals-list';
  const t = i18n.t;

  // 使用全局方法过滤有效的促销中心列表
  const filteredList = await filterValidPromotionCenterList({
    promotionCenterList,
    promotionCenterMetas,
    allItems: [],
  });

  const promotionList = [
    ...(cloudPromotion || []),
    ...(orderDiscount?.filter(
      (each) =>
        ((each?.activityRule?.isFirstOrderDiscount === '1' && isCRMEnable) ||
          each?.activityRule?.isFirstOrderDiscount !== '1') &&
        each?.activityRule?.usePromotionCode !== '1'
    ) || []),
    ...(buyGiftRule || []),
    ...(buyDiscountRule || []),
    ...(filteredList || []),
  ];

  if (!promotionList.length) return {};
  return {
    id: menuId,
    fieldDisplayNameGroups: [
      {
        fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
          name: t(menuId, { lng: key }),
          fieldName: 'name',
          languageCode: langCodeMap[key],
        })),
        fieldName: 'name',
      },
    ],
    menuCategories: [
      {
        id: menuId,
        groupId: menuId,
        fieldDisplayNameGroups: [
          {
            fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
              name: t(menuId, { lng: key }),
              fieldName: 'name',
              languageCode: langCodeMap[key],
            })),
            fieldName: 'name',
          },
        ],
        saleItems: promotionList,
        hiddenCategory: false,
      },
    ],
  };
};
