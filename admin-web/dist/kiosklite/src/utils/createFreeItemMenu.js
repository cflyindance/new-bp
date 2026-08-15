import i18n from '@/assets/i18n/i18n';
import getRewardItemByRules from './getRewardItemByRules';
import { langCodeMap } from '@/constants/mockData';
import getCampaignViaType from '@/utils/CRMIntegration/getCampaignViaType';
import { resolveRewardItemCampaign } from '@/utils/CRMIntegration/resolveItemCampaign';

export const createFreeItemMenu = ({
  menuGroup,
  crmRewardCampaign,
  isCRMIntegration,
  orderType,
}) => {
  const t = i18n.t;
  const menuId = 'membership-point-redeem-menu';
  const categoryId = 'membership-point-redeem-category';

  if (crmRewardCampaign?.length > 0 && menuGroup.length > 0) {
    let freeItemList = [];
    const itemResources = menuGroup
      .flatMap((group) => group.menuCategories)
      .flatMap((category) => category?.saleItems)
      .filter(Boolean);
    if (isCRMIntegration) {
      const addItemReward = getCampaignViaType({
        campaigns: crmRewardCampaign,
        types: ['giftItemCoupon'],
        source: 'reward',
      });
      freeItemList = resolveRewardItemCampaign({
        rules: addItemReward,
        itemResources,
        orderType,
      });
    } else {
      freeItemList = getRewardItemByRules({
        rules: crmRewardCampaign,
        allItems: itemResources,
      });
    }
    const freeSaleItemList = isCRMIntegration
      ? freeItemList.map((each) => {
          return {
            ...each,
            id: `${each.ruleId}_${each.id}`,
            oId: each.id,
            oCategoryId: each.categoryId,
            isFreeItem: true,
            categoryId: categoryId,
          };
        })
      : freeItemList
          .reduce((pv, cv) => {
            const ruleId = cv._id;
            cv.items.forEach((e) => {
              pv.push({
                ...e,
                id: ruleId + '_' + e.id,
                oId: e.id,
                categoryId: categoryId,
                oCategoryId: e.categoryId,
                isFreeItem: true,
              });
            });
            return pv;
          }, [])
          .sort((a, b) => a.itemPoints - b.itemPoints);
    const freeItemMenu = {
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
        {
          fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
            name: t(menuId, { lng: key }),
            fieldName: 'shortName',
            languageCode: langCodeMap[key],
          })),
          fieldName: 'shortName',
        },
      ],
      menuCategories: [
        {
          id: categoryId,
          groupId: menuId,
          fieldDisplayNameGroups: [
            {
              fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
                name: t(categoryId, { lng: key }),
                fieldName: 'name',
                languageCode: langCodeMap[key],
              })),
              fieldName: 'name',
            },
            {
              fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
                name: t(categoryId, { lng: key }),
                fieldName: 'posName',
                languageCode: langCodeMap[key],
              })),
              fieldName: 'posName',
            },
            {
              fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
                name: t(categoryId, { lng: key }),
                fieldName: 'shortName',
                languageCode: langCodeMap[key],
              })),
              fieldName: 'shortName',
            },
          ],
          saleItems: freeSaleItemList,
          hiddenCategory: false,
          isFreeItemCategory: true,
        },
      ],
      isFreeItemMenu: true,
    };
    return freeItemMenu;
  }

  return null;
};
