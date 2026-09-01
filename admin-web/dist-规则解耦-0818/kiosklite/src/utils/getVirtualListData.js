import remToPx from '@/utils/CountRemToPx';
import handleCountRowNum from '@/utils/handleCountRowNum';
import store from '../reducers/store';
// import cloneDeep from 'lodash/cloneDeep';

/**
 * 获取虚拟列表数据
 * @param {Object} params - 参数对象
 * @param {Array} params.allCateList - 所有分类列表，包含分类信息和商品数据
 * @param {boolean} [params.isTopMenu=false] - 是否是顶部菜单布局
 * @param {Object} params.selfConfig - 系统配置对象，包含菜单配置信息
 * @param {boolean} [params.isExpand=false] - 是否展开，用于控制积分兑换分类的展开/收起状态
 * @param {number} [params.freeItemMenuPosition=0] - 免费商品菜单位置，用于判断是否显示展开按钮
 * @returns {Array} 返回处理后的虚拟列表数据，包含分类标题、描述、商品列表和空盒子等元素
 */

const getVirtualListData = ({
  allCateList,
  isTopMenu = false,
  selfConfig,
  isExpand = false,
  freeItemMenuPosition = 0,
  listPromotion,
}) => {
  const promotionState =
    listPromotion ?? store?.getState()?.promotion ?? {};
  const colNum = handleCountRowNum({ isTopMenu, selfConfig });
  const colNumCount = colNum.count;
  const promotionListHeight = remToPx(29);
  const cateTextHeight = remToPx(12.7);
  const cateDescHeight = remToPx(11);
  const singleItemHeight = remToPx(42);
  const hasPropertyHeight = remToPx(50);
  const expendButtonHeight = remToPx(10);
  const promotionTagHeight = remToPx(6);
  const extraHeight = remToPx(40);
  const maxRowsForMembership = 2; // 兑换商品收起时最多展示的行数
  const kioskPromotionBuyGiftRule = promotionState.buyGiftRule || [];
  const kioskPromotionDiscountRules = promotionState.buyDiscountRule || [];
  const itemMatchCloudPromotion = promotionState.itemMatchCloudPromotion;
  const isPropertyVisible = selfConfig?.configList?.find(
    (i) => i.id === 54
  )?.value;
  const propertyArr = isPropertyVisible
    ? selfConfig?.configList.find((i) => i.id === 38)?.value
    : []; // menu label

  return allCateList // cloneDeep(allCateList)
    .reduce((pre, cur) => {
      const { hiddenCategory, id, name, saleItems, description, ...rest } = cur;
      if (hiddenCategory) return pre;
      const saleItemsNumber = saleItems.length;
      // 是否是积分兑换分类
      const isMembershipCategory = id === 'membership-point-redeem-category';
      // promotionDeal;
      const isPromotionDealsList = id === 'promotion-deals-list';

      if (saleItemsNumber > 0) {
        const cateArr = [];
        if (isPromotionDealsList) {
          cateArr.push({
            id,
            type: 'promotionDealList',
            height: promotionListHeight,
            saleItems,
            ...rest,
          });
          return pre.concat(cateArr);
        }
        cateArr.push({
          id,
          name,
          type: 'cateText',
          height: cateTextHeight,
          ...rest,
        });
        if (description && description !== 'undefined') {
          cateArr.push({
            id,
            name,
            type: 'cateDesc',
            description,
            height: cateDescHeight,
            ...rest,
          });
        }
        let smallArrNum = 0;
        if (
          isMembershipCategory &&
          saleItemsNumber > maxRowsForMembership * colNumCount &&
          !isExpand &&
          freeItemMenuPosition === 0
        ) {
          smallArrNum = maxRowsForMembership;
        } else {
          smallArrNum = saleItemsNumber / colNumCount;
        }

        const ceilNum = Math.ceil(smallArrNum);

        const getListObj = (items) => ({
          id,
          name,
          type: 'cateList',
          colNum,
          ...rest,
          saleItems: items,
        });
        const itemList = saleItems
          .reduce((pre, cur) => {
            if (!pre.length) {
              const listObj = getListObj([cur]);
              pre.push(listObj);
              return pre;
            }
            const currentListObj = pre[pre.length - 1];
            if (currentListObj.saleItems.length < colNumCount) {
              currentListObj.saleItems.push(cur);
              return pre;
            }
            if (pre.length >= ceilNum) return pre;
            const listObj = getListObj([cur]);
            pre.push(listObj);
            return pre;
          }, [])
          .map((listItem) => {
            // 是否有菜品标签 properties是菜单接口返回的，包括本地菜单（无type属性）和商品中心（有type属性）
            // 本地菜单只展示'SPICY', 'RECOMMENDED'；商品中心不展示type为2的角标和3的统计标签；
            // 其余kiosk本地配置的标签都展示

            listItem.hasProperty = listItem.saleItems?.some(
              (each) =>
                each.properties?.find(
                  (tag) =>
                    (!tag.hasOwnProperty('type') &&
                      ['SPICY', 'RECOMMENDED'].includes(tag.name)) ||
                    (tag.hasOwnProperty('type') &&
                      tag.type !== 2 &&
                      tag.type !== 3)
                ) ||
                propertyArr.find(
                  (item) =>
                    item.dish?.includes(each.id) ||
                    item.dish?.includes(each?.oId)
                )
            );
            listItem.height =
              (listItem.hasProperty ? hasPropertyHeight : singleItemHeight) +
              12;

            // 是否有促销活动标签
            listItem.hasPromotion = listItem.saleItems?.some((saleItem) => {
              // 检查kiosk本地促销
              const hasKioskPromotion =
                kioskPromotionDiscountRules?.some((rule) =>
                  rule?.activityRule?.buyDishes?.includes(saleItem.id)
                ) ||
                kioskPromotionBuyGiftRule?.some((rule) =>
                  rule?.activityRule?.buyDishes?.includes(saleItem.id)
                );
              if (hasKioskPromotion) return true;

              // 检查促销平台活动(只要具体到菜品级的活动)
              const cloudPromotions = itemMatchCloudPromotion?.[saleItem.id];
              const hasCommercialPromotion = cloudPromotions?.some(
                (promotion) =>
                  promotion?.promotionType !== 'totalAmountQuantityDiscount'
              );

              return hasCommercialPromotion;
            });
            listItem.height += listItem.hasPromotion ? promotionTagHeight : 0;

            return listItem;
          });
        cateArr.push(...itemList);
        if (
          isMembershipCategory &&
          saleItemsNumber > maxRowsForMembership * colNumCount &&
          !isExpand &&
          freeItemMenuPosition === 0
        ) {
          cateArr.push({
            id,
            type: 'expendButton',
            height: expendButtonHeight,
            ...rest,
          });
        }
        return pre.concat(cateArr);
      }
      return pre;
    }, [])
    .concat({
      id: 'emptyBox',
      groupId: 'emptyBox',
      type: 'emptyBox',
      height: extraHeight,
    });
};

export default getVirtualListData;
