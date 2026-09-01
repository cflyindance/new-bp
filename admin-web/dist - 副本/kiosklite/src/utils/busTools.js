import { langCodeMap } from '../constants/mockData';
import { isIpadEnv } from './index';
import store from '../reducers/store';
import { getOrderInfoObj } from '../api/submitOrderObj';
import { getMarginappFetchConfig } from '../api';
import { judgeSskeyIsActiveTime } from './index';
import getJudgeOrderDishItem from './getJudgeOrderDishItem';
import refreshOrderStockBeforeSubmit from './refreshOrderStockBeforeSubmit';
import syncMenuStockNum from './syncMenuStockNum';
import itemIsSoldOut, { getOrderSoldOutDetails } from '@/utils/itemIsSoldOut';
import { getItemStockNum, getStockItemId } from '@/utils/validateItemStock';
import cloneDeep from 'lodash/cloneDeep';
import getMenuDisplayName, {
  getSingleItemLanguageName,
} from '@/utils/getMenuDisplayName';
import Big from 'big.js';

// 判断当前菜，是否有详情等字段
export const judgeHasDetailInfo = (itemInfo, isCombo = false) => {
  let isHas = true;
  const state = store?.getState();
  const currentCategory = state.currentCategoryList?.find((cate) =>
    cate.saleItems?.find((item) => item.id === itemInfo.id)
  );
  // 是否有备注（id:3）
  const isShowRemark = state.selfConfig?.configMap?.id_3;
  // 如果当前是自选套餐里面的单菜
  if (isCombo) {
    // 套餐子菜是否展示备注
    const isSubDishRemark = state.selfConfig?.configMap?.id_30;
    // 菜（size，options，描述，categoryOptions）
    if (
      itemInfo.itemPrices?.length > 1 ||
      itemInfo.options ||
      itemInfo.description ||
      (isShowRemark && isSubDishRemark) ||
      itemInfo.categoryOptions?.length
    ) {
      isHas = true;
    } else {
      isHas = false;
    }

    return isHas;
  } else {
    // 菜（size，options，描述）+ 子菜判断 *自己*父类的options 固定套餐菜有产品详情
    if (
      itemInfo.itemPrices?.length > 1 ||
      itemInfo.options ||
      itemInfo.description ||
      isShowRemark ||
      currentCategory?.options?.length ||
      (itemInfo.comboType === 'FIXED_SELECTION' &&
        itemInfo.comboSections?.length)
    ) {
      isHas = true;
    } else {
      isHas = false;
    }

    return isHas;
  }
};

// 展示名称（中，英文）
export const getCurrentItemLanguage = (nameDict, lang = 'en') => {
  return getSingleItemLanguageName(nameDict, lang);
};

// 菜品名称展示（支持菜单名称双语配置 id:66）
export const getDishItemLanguage = (nameDict, lang = 'en') => {
  const menuNameConfig = store?.getState()?.selfConfig?.configMap?.id_66;
  if (menuNameConfig?.status) {
    return getMenuDisplayName(nameDict, lang, menuNameConfig);
  }
  return getSingleItemLanguageName(nameDict, lang);
};

export const getItemOptionName = (nameDict, language = 'en') => {
  if (!nameDict || !Array.isArray(nameDict)) {
    return '';
  }
  for (let nameGroup of nameDict) {
    if (nameGroup.fieldName == 'name' && nameGroup.fieldDisplayNames) {
      for (let displayName of nameGroup.fieldDisplayNames) {
        if (displayName.languageCode == langCodeMap[language]) {
          return displayName.name;
        }
      }
    }
  }
  return '';
};

export const getItemSizeName = (
  sizeId,
  defaultName,
  itemSizeList = [],
  language = 'en'
) => {
  if (!itemSizeList || !Array.isArray(itemSizeList)) {
    return defaultName || '';
  }
  for (let itemSize of itemSizeList) {
    if (itemSize.id == sizeId) {
      return (
        getItemOptionName(itemSize.fieldDisplayNameGroups, language) ||
        itemSize?.name ||
        defaultName ||
        ''
      );
    }
  }
  return defaultName || '';
};

export const lineBreakTransfer = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  return str.replace(/\\n/g, '\n');
};

// combo中验证每一项的菜品选择是否满足条件（id > 0）
export const getOneUncompletedSection = (sideNavList, currentOrderCombo) => {
  const isSectionCompleted = {};
  if (sideNavList?.length && currentOrderCombo?.length) {
    sideNavList.forEach((sct) => {
      let min = sct.minNumOfSelectionAllowed;
      let max = sct.maxNumOfSelectionAllowed;
      let priceRule = sct.priceRule;
      if (sct.id > 0) {
        let n = 0;
        let res = currentOrderCombo.find((c) => c.id == sct.id);
        res?.items.forEach((r) => {
          n += r.quantity;
        });
        // 至多选择max个
        if (min == undefined) {
          // 当规则是FIXED_UNTIL_MAX，没有自身最大限制
          if (priceRule == 'FIXED_UNTIL_MAX') {
            isSectionCompleted[sct.id] = {
              isContinueChoose: true,
              isCompleted: true,
            };
          } else {
            if (n < max) {
              isSectionCompleted[sct.id] = {
                isContinueChoose: true,
                isCompleted: true,
              };
            } else {
              isSectionCompleted[sct.id] = {
                isContinueChoose: false,
                isCompleted: true,
              };
            }
          }
        } else if (max == undefined) {
          // 至少选则min个
          if (n < min) {
            isSectionCompleted[sct.id] = {
              isContinueChoose: true,
              isCompleted: false,
            };
          } else {
            isSectionCompleted[sct.id] = {
              isContinueChoose: true,
              isCompleted: true,
            };
          }
        } else if (min == max) {
          if (
            sct.itemSelectionRule == 'RANGE' &&
            sct.priceRule == 'FIXED_UNTIL_MAX'
          ) {
            // 至少选择min（max）个
            if (n < min) {
              isSectionCompleted[sct.id] = {
                isContinueChoose: true,
                isCompleted: false,
              };
            } else {
              isSectionCompleted[sct.id] = {
                isContinueChoose: true,
                isCompleted: true,
              };
            }
          } else {
            // 固定选择min（max）个
            if (n == min) {
              isSectionCompleted[sct.id] = {
                isContinueChoose: false,
                isCompleted: true,
              };
            } else {
              isSectionCompleted[sct.id] = {
                isContinueChoose: true,
                isCompleted: false,
              };
            }
          }
        } else {
          // 范围选择min < x < max个
          // 当规则是FIXED_UNTIL_MAX，没有自身最大限制
          if (priceRule == 'FIXED_UNTIL_MAX') {
            if (n < min) {
              isSectionCompleted[sct.id] = {
                isContinueChoose: true,
                isCompleted: false,
              };
            } else if (n < max) {
              isSectionCompleted[sct.id] = {
                isContinueChoose: true,
                isCompleted: true,
              };
            } else {
              isSectionCompleted[sct.id] = {
                isContinueChoose: true,
                isCompleted: true,
              };
            }
          } else {
            if (n < min) {
              isSectionCompleted[sct.id] = {
                isContinueChoose: true,
                isCompleted: false,
              };
            } else if (n < max) {
              isSectionCompleted[sct.id] = {
                isContinueChoose: true,
                isCompleted: true,
              };
            } else {
              isSectionCompleted[sct.id] = {
                isContinueChoose: false,
                isCompleted: true,
              };
            }
          }
        }
      }
      // Sides/Drinks (-98, -99) - 可选区域，无规则限制
      else if (sct.id === -99 || sct.id === -98) {
        isSectionCompleted[sct.id] = {
          isContinueChoose: true, // 始终可以继续选择
          isCompleted: true, // 可选区域始终视为完成
        };
      }
    });
  }

  return isSectionCompleted;
};

// 判断是否含有必选菜
const judgeIsHasMustDish = (section) => {
  let isHas = false;
  if (section.comboSectionSaleItems?.length) {
    isHas = section.comboSectionSaleItems.some((sct) => sct.preSelected);
  }
  return isHas;
};

// 全局判断，每个步骤下，必选菜是否选择
export const judegStepIsHasMustDish = (sideNavList, currentOrderCombo) => {
  // 标记一种特殊情况：自选套餐有详情（size，其他options，描述，图片等），但是无size类型，则没有id: -1
  let isSpecial = false;
  let isHasSize = !!currentOrderCombo?.find((s) => s.id == -1);
  !isHasSize && (isSpecial = true);

  let obj = {};
  sideNavList?.forEach((sct, sctIdx) => {
    let isHas = false;
    if (sct.id > 0) {
      // 不再把预选菜处理成必选菜
      // let isInclude = judgeIsHasMustDish(sct);
      // if (isInclude) {
      // for (let i = 0; i < sct.comboSectionSaleItems.length; i++) {
      //   let com = sct.comboSectionSaleItems[i];
      //   // 必选标识
      //   if (com.preSelected) {
      //     let idx = sctIdx;
      //     if (isSpecial) {
      //       idx--;
      //     }
      //     let r = currentOrderCombo[idx].items.find((c) => c.id == com.saleItemId);
      //     if (r) {
      //       isHas = true;
      //     } else {
      //       isHas = false;
      //       break;
      //     }
      //   }
      // }
      // } else {
      isHas = true;
      // }
      obj[sct.id] = isHas;
    }
  });

  return obj;
};

// 提取combo单个步骤的规则
const countRangeHandler = (side, t, { isInFreeItem, isPromotionItem } = {}) => {
  if (side.id < 0) {
    if (side.id == -3 && side.numOfItemOptionAllowed) {
      return {
        [side.id]:
          '(' +
          t('selectionRuleMax', { rplc: side.numOfItemOptionAllowed }) +
          ')',
      };
    }
  } else {
    const min = side.minNumOfSelectionAllowed;
    const max = side.maxNumOfSelectionAllowed;
    const freeQuantity = side.freeQuantity;
    let range = '';
    if (min == undefined) {
      // 至多选择max个
      if (side.priceRule == 'FIXED_UNTIL_MAX') {
        range = t('selectionRuleMaxfixUntilMax', { rplc: max });
      } else {
        range = t('selectionRuleMax', { rplc: max });
      }
    } else if (max == undefined) {
      // 至少选择min个
      range = t('selectionRuleMin', { rplc: min });
    } else if (min == max) {
      if (
        side.itemSelectionRule == 'RANGE' &&
        side.priceRule == 'FIXED_UNTIL_MAX'
      ) {
        range = t('selectionRuleRangeEqual', { rplc: max });
      } else {
        range = t('selectionRuleEqual', { rplc: max });
      }
    } else {
      // range
      if (side.priceRule == 'FIXED_UNTIL_MAX') {
        range = t('selectionRuleRangefixUntilMax', { rplc1: min, rplc2: max });
      } else {
        if (min !== 0 || max !== 9999) {
          range = t('selectionRuleRange', { rplc1: min, rplc2: max });
          if (freeQuantity > 0 && !isInFreeItem && !isPromotionItem) {
            range = `${range}, ${t('selectionRuleRangeFree', { rplc: freeQuantity })}`;
          }
        }
      }
    }
    return {
      [side.id]: range ? '(' + range + ')' : '',
    };
  }
};

// 组合combo每个步骤的规则
export const allRangHandler = (
  sideNavList,
  t,
  { isInFreeItem, isPromotionItem } = {}
) => {
  let rangMap = {};
  sideNavList?.forEach((side) => {
    Object.assign(
      rangMap,
      countRangeHandler(side, t, { isInFreeItem, isPromotionItem })
    );
  });

  return rangMap;
};

/** 合并类目 options 到菜品（与 getCurrentItem 逻辑一致，用于凑单/活动等入口） */
export const attachCategoryOptionsToItem = (item, categoryList) => {
  if (!item?.categoryId || !categoryList?.length) {
    return item;
  }
  const category = categoryList.find((c) => c.id === item.categoryId);
  if (!category) {
    return item;
  }
  let categoryOptions;
  if (category.isFreeItemCategory) {
    const originCategory = categoryList.find((_) => _.id === item.oCategoryId);
    categoryOptions = originCategory?.options;
  } else {
    categoryOptions = category.options;
  }
  if (!categoryOptions?.length) {
    return item;
  }
  return { ...item, categoryOptions };
};

// 根据id查询，单个菜的详细
export const getComboItemDetailInfo = (itemId, currentCategoryList) => {
  for (let category of currentCategoryList) {
    let ctgOpts = category.options || [];
    let saleItems = category.saleItems;
    if (saleItems && saleItems.length) {
      for (let i = 0; i < saleItems.length; i++) {
        if (saleItems[i].id == itemId) {
          let tempItem = Object.assign({}, saleItems[i]);
          tempItem.categoryOptions = ctgOpts;
          return tempItem;
        }
      }
    }
  }
};

/** 从 sideNavList 安全获取套餐 section 配置 */
export const getComboSectionInfo = (sideNavList, sideNavId) => {
  if (!sideNavList?.length || sideNavId == null) {
    return undefined;
  }
  return sideNavList.find((item) => item?.id == sideNavId);
};

// combo中，判断当前菜是否是必选菜
export const judegIsComboStatusAndIsPreSelected = (
  itemInfo,
  sideNavList,
  sideNavId,
  currentOrderCombo
) => {
  let isPreSelected = false;
  // Sides/Drinks (-98, -99) 没有预选菜概念，直接返回 false
  if (sideNavId === -98 || sideNavId === -99) {
    return false;
  }
  if (currentOrderCombo.length) {
    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
    if (sectionInfo && itemInfo.id && sectionInfo.priceRule !== 'ITEM_CENTER') {
      let r = sectionInfo.comboSectionSaleItems?.find(
        (c) => c.saleItemId == itemInfo.id
      );
      if (r?.preSelected) {
        isPreSelected = r.preSelected;
      }
    }
  }
  return !!isPreSelected;
};

// 提交订单前，判断订单所有菜，是否含有售罄
export const judegOrderDishIsHasSoldout = (orderList, soldoutList) => {
  const {
    crm: { selectedFreeItem = [], tempCampaign = null } = {},
    promotion: { buyGifts = [] } = {},
    menuItemList = {},
  } = store.getState();

  const tempCampaignList = Array.isArray(tempCampaign)
    ? tempCampaign
    : tempCampaign
      ? [tempCampaign]
      : [];
  const promotionGiftItemList = buyGifts.flatMap(
    (promotionGift) => promotionGift?.items || []
  );

  // 合并下单前检查源：购物车 + CRM 赠菜/活动菜 + Promotion 买赠赠菜
  const mergedOrderList = [
    ...(orderList || []),
    ...selectedFreeItem,
    ...tempCampaignList,
    ...promotionGiftItemList,
  ]
    // 仅保留可视为菜品的对象
    .filter((item) => item && (item.id != null || item.oId != null));

  // 去重，避免 selectedFreeItem / tempCampaign 与 itemList 重复导致重复判断
  const uniqueOrderListMap = new Map();
  const getOrderCheckKey = (item) => {
    const hasSequence = item?.sequence != null;
    if (hasSequence) {
      return `seq_${item.sequence}`;
    }
    return `id_${item?.id ?? ''}_oid_${item?.oId ?? ''}_cloud_${item?.cloudId ?? ''}_free_${item?.isFreeItem ? 1 : 0}_promotion_${item?.promotionItem ? 1 : 0}_rule_${item?.ruleId ?? ''}`;
  };
  mergedOrderList.forEach((item) => {
    const key = getOrderCheckKey(item);
    if (!uniqueOrderListMap.has(key)) {
      uniqueOrderListMap.set(key, item);
    }
  });
  const uniqueOrderList = Array.from(uniqueOrderListMap.values());

  let allSoldIds = [];
  // 售罄菜（orderKey）
  const soldoutOrderKeySet = new Set();
  // 实际售罄项（主菜/子菜/option）
  const soldoutDetailList = [];

  uniqueOrderList.forEach((item) => {
    const soldoutDetail = getOrderSoldOutDetails(item, {
      kioskSoldOutList: soldoutList,
      fromOrder: true,
    });
    const isSoldout =
      soldoutDetail.length > 0 ||
      itemIsSoldOut(item, { kioskSoldOutList: soldoutList, fromOrder: true });
    if (isSoldout) {
      soldoutOrderKeySet.add(getOrderCheckKey(item));
      soldoutDetailList.push(...soldoutDetail);
    }
  });

  // 库存不足（主菜/子菜/option）也归并到售罄链路
  const stockUsageMap = new Map();
  const addStockUsage = ({
    rootOrderKey,
    stockItem,
    qty,
    soldoutType,
    parentItem,
  }) => {
    if (!stockItem || qty <= 0) {
      return;
    }
    const stockNum = Number(getItemStockNum(stockItem, menuItemList));
    if (!Number.isFinite(stockNum)) {
      return;
    }
    const stockItemId = getStockItemId(stockItem);
    const stockCloudId = stockItem?.cloudId;
    const stockKey =
      stockCloudId != null
        ? `cloud_${stockCloudId}`
        : stockItemId != null
          ? `id_${stockItemId}`
          : undefined;
    if (!stockKey) {
      return;
    }
    const detailId =
      (stockItem?.isFreeItem ? stockItem?.oId : stockItem?.id) ?? stockItem?.id;
    const parentId =
      (parentItem?.isFreeItem ? parentItem?.oId : parentItem?.id) ??
      parentItem?.id;
    const existed = stockUsageMap.get(stockKey) || {
      stockNum,
      totalQty: 0,
      orderQtyMap: new Map(),
      detailList: [],
    };
    existed.totalQty += qty;
    existed.stockNum = Number.isFinite(existed.stockNum)
      ? Math.min(existed.stockNum, stockNum)
      : stockNum;
    existed.orderQtyMap.set(
      rootOrderKey,
      (existed.orderQtyMap.get(rootOrderKey) || 0) + qty
    );
    existed.detailList.push({
      id: detailId,
      cloudId: stockItem?.cloudId,
      name: stockItem?.name,
      fieldDisplayNameGroups: stockItem?.fieldDisplayNameGroups,
      soldoutType,
      parentId,
      parentName: parentItem?.name,
      parentFieldDisplayNameGroups: parentItem?.fieldDisplayNameGroups,
      soldoutDisplayKey:
        soldoutType === 'item'
          ? `item_${stockItem?.cloudId ?? detailId}`
          : `${soldoutType}_${parentId ?? ''}_${stockItem?.cloudId ?? detailId}`,
      orderKey: rootOrderKey,
    });
    stockUsageMap.set(stockKey, existed);
  };

  const collectStockUsage = (
    rootOrderItem,
    currentOrderItem,
    parentItem,
    parentQty = 1
  ) => {
    if (!currentOrderItem) {
      return;
    }
    const currentItemQty = (currentOrderItem?.quantity || 1) * parentQty;
    const rootOrderKey = getOrderCheckKey(rootOrderItem);
    const stockItemId = currentOrderItem?.isFreeItem
      ? currentOrderItem?.oId
      : currentOrderItem?.id;
    const currentStockItem =
      stockItemId != null
        ? {
            ...currentOrderItem,
            id: stockItemId,
          }
        : currentOrderItem;

    addStockUsage({
      rootOrderKey,
      stockItem: currentStockItem,
      qty: currentItemQty,
      soldoutType: parentItem ? 'subItem' : 'item',
      parentItem,
    });

    const optionSectionList = currentOrderItem?.selectedOptionList?.length
      ? currentOrderItem.selectedOptionList
      : currentOrderItem?.sectionDetail;
    for (const section of optionSectionList || []) {
      if (section?.id !== -2) {
        continue;
      }
      for (const option of section?.options || []) {
        addStockUsage({
          rootOrderKey,
          stockItem: option,
          qty: (option?.quantity || 1) * currentItemQty,
          soldoutType: 'option',
          parentItem: currentOrderItem,
        });
      }
    }

    for (const section of currentOrderItem?.sectionDetail || []) {
      if (section?.id <= 0) {
        continue;
      }
      for (const subItem of section?.items || []) {
        collectStockUsage(
          rootOrderItem,
          subItem,
          currentOrderItem,
          currentItemQty
        );
      }
    }
  };

  uniqueOrderList.forEach((item) => {
    collectStockUsage(item, item);
  });

  const shortageList = [];
  stockUsageMap.forEach((usage, stockKey) => {
    if (usage.totalQty > usage.stockNum) {
      shortageList.push({
        stockKey,
        overflow: usage.totalQty - usage.stockNum,
        ...usage,
      });
    }
  });

  if (shortageList.length) {
    const insufficientOrderKeySet = new Set();
    // 只要某个库存键不足，就剔除所有占用该库存键的订单项
    shortageList.forEach((entry) => {
      entry.orderQtyMap.forEach((orderQty, orderKey) => {
        if (orderQty > 0) {
          insufficientOrderKeySet.add(orderKey);
        }
      });
    });

    insufficientOrderKeySet.forEach((key) => soldoutOrderKeySet.add(key));

    shortageList.forEach((entry) => {
      const detail = entry.detailList.find((detailItem) =>
        insufficientOrderKeySet.has(detailItem?.orderKey)
      );
      const finalDetail = detail || entry.detailList[0];
      if (finalDetail) {
        const { orderKey, ...rest } = finalDetail;
        soldoutDetailList.push(rest);
      }
    });
  }

  // 在售菜
  const saleList = [];
  // 售罄菜
  const slodoutList = [];
  uniqueOrderList.forEach((item) => {
    if (soldoutOrderKeySet.has(getOrderCheckKey(item))) {
      slodoutList.push(item);
    } else {
      saleList.push(item);
    }
  });

  const soldoutKeyMap = new Map();
  slodoutList.forEach((item) => {
    const hasSequence = item?.sequence != null;
    const key = hasSequence ? `seq_${item.sequence}` : `id_${item?.id}`;
    if (!soldoutKeyMap.has(key)) {
      soldoutKeyMap.set(key, {
        id: item?.id,
        sequence: hasSequence ? item.sequence : undefined,
      });
    }
  });
  allSoldIds = Array.from(soldoutKeyMap.values());

  return {
    saleList,
    slodoutList,
    allSoldIds,
    soldoutDetailList,
  };
};

// orderPage/comboPanel计算菜的列数
export const calcColNum = () => {
  // 判断pc环境，还是壳子、ios环境
  let u = window.navigator.userAgent;
  if (
    u.indexOf('Android') > -1 ||
    u.indexOf('Adr') > -1 ||
    !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
  ) {
    const dpr = window.devicePixelRatio;
    let screenWidth = 0;
    // ios环境，且横版（高变成宽）
    if (
      isIpadEnv() &&
      (window.orientation == 90 || window.orientation == -90)
    ) {
      screenWidth = window.screen.height;
    } else {
      screenWidth = window.screen.width;
    }
    const w = screenWidth * dpr;
    if (w <= 1100) {
      return 2;
    } else if (w <= 1600) {
      return 3;
    } else if (w <= 2400) {
      return 4;
    } else {
      return 5;
    }
  } else {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 800) {
      return 2;
    } else if (screenWidth <= 1000) {
      return 3;
    } else if (screenWidth <= 1200) {
      return 4;
    } else if (screenWidth <= 1400) {
      return 5;
    } else if (screenWidth <= 1600) {
      return 6;
    } else {
      return 7;
    }
  }
};

// 竖屏K2情况下，viewOrder按钮宽度和右侧一样
export const judegEnv = () => {
  // 判断pc环境，还是壳子、ios环境
  let u = window.navigator.userAgent;
  if (u.indexOf('Android') > -1 || u.indexOf('Adr') > -1) {
    const dpr = window.devicePixelRatio;
    let screenWidth = window.screen.width;
    const w = screenWidth * dpr;
    return !!(w <= 1100);
  }
};

// 当前是否有整单加收
export const judgeCharge = () => {
  const state = store?.getState();
  const chargeList = state.selfConfig?.charge;
  if (chargeList?.length) {
    let r = chargeList.find((c) => c.id === 1);
    if (r.select.id) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

// 当前非整单加收项是否需要付钱
export const judgeNeedPayOtherCharge = () => {
  const state = store?.getState();
  const chargeList = state.selfConfig?.charge;
  if (chargeList?.length) {
    const r2 = chargeList.find((c) => c.id == 2);
    if (r2?.select?.id) {
      const res2 = state.togoList?.find((item) => item.id == 2);
      if (res2?.select?.id && res2.select.rate > 0) {
        return true;
      }
    }

    const r3 = chargeList.find((c) => c.id == 3);
    if (r3?.select?.id) {
      const res3 = state.togoList?.find((item) => item.id == 3);
      if (res3?.select?.id && res3.select.rate > 0) {
        return true;
      }
    }

    const r4 = chargeList.find((c) => c.id == 4);
    if (r4?.select?.id) {
      const res4 = state.togoList?.find((item) => item.id == 4);
      if (res4?.select?.id && res4.select.rate > 0) {
        return true;
      }
    }
  }
  return false;
};

// 计算刷卡最低消费金额，返回当前金额
export const calcCardMinAmout = (tip = 0) => {
  const state = store?.getState();
  const { selfConfig } = state;
  const minCardAmount = selfConfig?.configMap?.id_21;
  const orderInfo = getOrderInfoObj(state);
  const subTotal = orderInfo.orderSubtotal;
  const totalTax = orderInfo.orderTaxTotal;
  const charge = orderInfo.chargeTotal;
  const togoTotal = orderInfo.togoTotal;
  // 促销 - 订单折扣
  const orderDiscount = orderInfo.orderDiscount;
  // 总金额
  const currentAmount = parseFloat(
    Big(subTotal)
      .plus(totalTax)
      .plus(charge)
      .plus(togoTotal)
      .plus(tip)
      .minus(orderDiscount)
      .toFixed(2)
  );
  // 当最低消费金额为0，或者没有设置时，说明没有最低金额限制
  if (minCardAmount && minCardAmount > currentAmount) {
    return currentAmount;
  } else {
    return false;
  }
};

/**
 * 统一的查询配置项、判断订单内是否含售罄菜的方法
 * @param {Function} fn - 成功回调函数
 * @param {Object} options - 配置选项
 * @param {Function} options.setSelfConfig - Redux action，用于设置selfConfig
 * @param {Function} options.setState - 组件setState方法
 * @param {Function} options.showApiModalTip - 显示API错误提示的方法
 * @param {Function} [options.reorder] - 重新点单的方法（可选）
 * @param {Function} [options.onSoldoutDetected] - 当检测到售罄菜时的额外回调（可选）
 * @param {Function} [options.onError] - 错误处理回调（可选）
 */
export const judgeConfigToSoldout = (fn, options = {}) => {
  const {
    setSelfConfig,
    setState,
    showApiModalTip,
    reorder,
    onSoldoutDetected,
    onError,
  } = options;

  const checkLatestStock = async () => {
    const stockCheckResult = await refreshOrderStockBeforeSubmit({
      refreshStock: () => syncMenuStockNum(store.dispatch, store.getState),
      getOrderItems: () => cloneDeep(getJudgeOrderDishItem()),
      judgeOrder: judegOrderDishIsHasSoldout,
      onRefreshError: (error) => {
        console.log(
          'refresh stock before submit failed, continue saveOrder',
          error
        );
        fn();
      },
    });

    if (stockCheckResult.status === 'refresh_failed') {
      return;
    }

    const { dishMap } = stockCheckResult;
    setState({ dishMap });
    if (dishMap.slodoutList?.length) {
      if (onSoldoutDetected) {
        onSoldoutDetected();
      }
      setState({ isHasSoldoutDish: true });
    } else if (dishMap.saleList?.length) {
      fn();
    } else if (reorder) {
      reorder(true);
    } else {
      fn();
    }
  };

  judgeSskeyIsActiveTime()
    .then(() => {
      getMarginappFetchConfig()
        .then((res) => {
          if (res.data.result.successful) {
            if (res.data.marginAppConfigTypes.length) {
              const state = store.getState();
              let selfConfig = cloneDeep(state.selfConfig);
              let obj = res.data.marginAppConfigTypes.find(
                (p) => p.product == 'KIOSKLITE'
              );
              let configMap = JSON.parse(obj.data);
              selfConfig.soldOut = configMap.soldOut;
              setSelfConfig(selfConfig);

              checkLatestStock();
            } else {
              checkLatestStock();
            }
          } else {
            // 处理失败情况
            if (onError) {
              onError(res.data?.result?.failureReason);
            } else {
              showApiModalTip(res.data?.result?.failureReason);
            }
          }
        })
        .catch((err) => {
          showApiModalTip(err?.message);
        });
    })
    .catch((err) => {
      showApiModalTip(err?.message);
    });
};
