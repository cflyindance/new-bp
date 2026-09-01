import Toast from '@/component/toast';
import i18n from '@/assets/i18n/i18n';

/**
 * 库存占用的底层菜品 id
 * 积分兑换菜、部分活动菜使用 oId 指向原菜，与普通菜共用库存
 */
export function getStockItemId(item) {
  if (!item) {
    return undefined;
  }
  if (item.oId != null) {
    return item.oId;
  }
  return item.id;
}

export function getItemStockNum(itemInfo, menuItemList) {
  if (!itemInfo) {
    return undefined;
  }
  const stockItemId = getStockItemId(itemInfo);
  const stockFromMenu = menuItemList?.[stockItemId]?.stockNum;
  if (stockFromMenu !== undefined) {
    return stockFromMenu;
  }
  const stockCloudId = itemInfo.cloudId;
  if (stockCloudId && menuItemList) {
    for (const menuItem of Object.values(menuItemList)) {
      if (menuItem?.cloudId === stockCloudId && menuItem?.stockNum !== undefined) {
        return menuItem.stockNum;
      }
    }
  }
  return itemInfo.stockNum;
}

export function getCartItemQtyByStockId(
  itemList,
  stockItemId,
  stockCloudId,
  excludeSequence
) {
  if (!Array.isArray(itemList) || (stockItemId == null && stockCloudId == null)) {
    return 0;
  }
  return itemList.reduce((sum, item) => {
    if (excludeSequence != null && item.sequence === excludeSequence) {
      return sum;
    }
    const parentQty = item.quantity || 1;
    let optionQty = 0;
    for (const section of item.sectionDetail || []) {
      if (section.id !== -2) {
        continue;
      }
      for (const option of section.options || []) {
        if (stockCloudId) {
          if (option.cloudId === stockCloudId) {
            optionQty += (option.quantity || 1) * parentQty;
          }
        } else {
          if (getStockItemId(option) === stockItemId) {
            optionQty += (option.quantity || 1) * parentQty;
          }
        }
      }
    }
    if (stockCloudId) {
      if (item.cloudId === stockCloudId) {
        return sum + (item.quantity || 0) + optionQty;
      }
    } else {
      if (getStockItemId(item) === stockItemId) {
        return sum + (item.quantity || 0) + optionQty;
      }
    }
    return sum + optionQty;
  }, 0);
}

/** 购物车中套餐子菜数量（按底层菜品 id 汇总，含套餐份数） */
export function getComboSubItemQtyInCart(itemList, stockItemId, stockCloudId) {
  if (!Array.isArray(itemList) || (stockItemId == null && stockCloudId == null)) {
    return 0;
  }
  let qty = 0;
  for (const orderItem of itemList) {
    if (orderItem.itemType === 'SALE_ITEM') {
      continue;
    }
    const parentQty = orderItem.quantity || 1;
    const sectionDetail = orderItem.sectionDetail;
    if (!sectionDetail?.length) {
      continue;
    }
    let subCountInOneCombo = 0;
    for (const section of sectionDetail) {
      if (section.id <= 0) {
        continue;
      }
      for (const subItem of section.items || []) {
        const subItemQty = subItem.quantity || 1;
        if (stockCloudId) {
          if (subItem.cloudId === stockCloudId) {
            subCountInOneCombo += subItemQty;
          }
        } else {
          if (getStockItemId(subItem) === stockItemId) {
            subCountInOneCombo += subItemQty;
          }
        }
        const optionSectionList = subItem.selectedOptionList?.length
          ? subItem.selectedOptionList
          : subItem.sectionDetail;
        for (const optionSection of optionSectionList || []) {
          if (optionSection.id !== -2) {
            continue;
          }
          for (const option of optionSection.options || []) {
            if (stockCloudId) {
              if (option.cloudId === stockCloudId) {
                subCountInOneCombo += (option.quantity || 1) * subItemQty;
              }
            } else {
              if (getStockItemId(option) === stockItemId) {
                subCountInOneCombo += (option.quantity || 1) * subItemQty;
              }
            }
          }
        }
      }
    }
    qty += subCountInOneCombo * parentQty;
  }
  return qty;
}

/** 当前正在组装的套餐内子菜数量 */
export function getComboBuildingQtyByStockId(
  currentOrderCombo,
  stockItemId,
  stockCloudId,
  excludeSectionId
) {
  if (!Array.isArray(currentOrderCombo) || (stockItemId == null && stockCloudId == null)) {
    return 0;
  }
  let qty = 0;
  for (const section of currentOrderCombo) {
    if (section.id <= 0) {
      continue;
    }
    if (excludeSectionId != null && section.id === excludeSectionId) {
      continue;
    }
    for (const subItem of section.items || []) {
      const subItemQty = subItem.quantity || 1;
      if (stockCloudId) {
        if (subItem.cloudId === stockCloudId) {
          qty += subItemQty;
        }
      } else {
        if (getStockItemId(subItem) === stockItemId) {
          qty += subItemQty;
        }
      }
      const optionSectionList = subItem.selectedOptionList?.length
        ? subItem.selectedOptionList
        : subItem.sectionDetail;
      for (const optionSection of optionSectionList || []) {
        if (optionSection.id !== -2) {
          continue;
        }
        for (const option of optionSection.options || []) {
          if (stockCloudId) {
            if (option.cloudId === stockCloudId) {
              qty += (option.quantity || 1) * subItemQty;
            }
          } else {
            if (getStockItemId(option) === stockItemId) {
              qty += (option.quantity || 1) * subItemQty;
            }
          }
        }
      }
    }
  }
  return qty;
}

function groupComboSubItemsByStockId(itemsToAdd) {
  const groups = {};
  for (const item of itemsToAdd || []) {
    if (!item) {
      continue;
    }
    const itemQty = item.quantity || 1;
    const stockItemId = getStockItemId(item);
    const stockCloudId = item.cloudId;
    if (stockItemId == null && stockCloudId == null) {
      continue;
    }
    const key = stockCloudId ? `${stockCloudId}` : `${stockItemId}`;
    if (!groups[key]) {
      groups[key] = { itemInfo: item, count: 0 };
    }
    groups[key].count += itemQty;
  }
  return Object.values(groups);
}

/** 兑换中心 / RewardBanner 待落袋的赠菜（selectedFreeItem、tempCampaign） */
export function getRewardPendingItems(crm) {
  const items = [];
  const seen = new Set();

  const appendItem = (item) => {
    if (!item) {
      return;
    }
    const stockItemId = getStockItemId(item);
    const stockCloudId = item.cloudId;
    if (stockItemId == null && stockCloudId == null) {
      return;
    }
    const key = stockCloudId ? `${stockCloudId}` : `${stockItemId}_${item.id ?? ''}_${item._id ?? ''}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    items.push(item);
  };

  (crm?.selectedFreeItem || []).forEach(appendItem);

  const tempCampaign = crm?.tempCampaign;
  if (Array.isArray(tempCampaign)) {
    tempCampaign.forEach(appendItem);
  } else {
    appendItem(tempCampaign);
  }

  return items;
}

/** 赠菜/活动菜是否已写入购物车，避免与 selectedFreeItem 重复计数 */
function isRewardItemInCart(item, itemList) {
  if (!Array.isArray(itemList)) {
    return false;
  }
  const stockItemId = getStockItemId(item);
  const stockCloudId = item.cloudId;
  return itemList.some(
    (cartItem) =>
      (stockCloudId ? cartItem.cloudId === stockCloudId : getStockItemId(cartItem) === stockItemId) &&
      (cartItem.isFreeItem ||
        cartItem.campaignRewardItem ||
        cartItem.isCRMIntegrationSpecialItem ||
        cartItem.isCRMIntegrationBundleDiscountItem)
  );
}

/** ItemsDrawer 凑单抽屉内待确认加购占用数量（跳过已在购物车中的项） */
export function getDrawerPendingQtyByStockId(drawerPendingItems, stockItemId, stockCloudId) {
  if (!Array.isArray(drawerPendingItems) || (stockItemId == null && stockCloudId == null)) {
    return 0;
  }
  let qty = 0;
  for (const item of drawerPendingItems) {
    if (item?.isFromCurrentOrderItemList) {
      continue;
    }
    if (item.itemType === 'SALE_ITEM' || !item.sectionDetail?.length) {
      if (stockCloudId) {
        if (item.cloudId === stockCloudId) {
          qty += item.quantity || 1;
        }
      } else {
        if (getStockItemId(item) === stockItemId) {
          qty += item.quantity || 1;
        }
      }
      const parentQty = item.quantity || 1;
      for (const section of item.sectionDetail || []) {
        if (section.id !== -2) {
          continue;
        }
        for (const option of section.options || []) {
          if (stockCloudId) {
            if (option.cloudId === stockCloudId) {
              qty += (option.quantity || 1) * parentQty;
            }
          } else {
            if (getStockItemId(option) === stockItemId) {
              qty += (option.quantity || 1) * parentQty;
            }
          }
        }
      }
      continue;
    }
    const parentQty = item.quantity || 1;
    for (const section of item.sectionDetail) {
      if (section.id <= 0) {
        continue;
      }
      for (const subItem of section.items || []) {
        const subItemQty = subItem.quantity || 1;
        if (stockCloudId) {
          if (subItem.cloudId === stockCloudId) {
            qty += subItemQty * parentQty;
          }
        } else {
          if (getStockItemId(subItem) === stockItemId) {
            qty += subItemQty * parentQty;
          }
        }
        const optionSectionList = subItem.selectedOptionList?.length
          ? subItem.selectedOptionList
          : subItem.sectionDetail;
        for (const optionSection of optionSectionList || []) {
          if (optionSection.id !== -2) {
            continue;
          }
          for (const option of optionSection.options || []) {
            if (stockCloudId) {
              if (option.cloudId === stockCloudId) {
                qty += (option.quantity || 1) * subItemQty * parentQty;
              }
            } else {
              if (getStockItemId(option) === stockItemId) {
                qty += (option.quantity || 1) * subItemQty * parentQty;
              }
            }
          }
        }
      }
    }
  }
  return qty;
}

/** 兑换中心待确认的赠菜占用数量 */
export function getRewardPendingQtyByStockId(crm, stockItemId, stockCloudId, itemList) {
  if (stockItemId == null && stockCloudId == null) {
    return 0;
  }
  return getRewardPendingItems(crm).reduce((sum, item) => {
    if (getStockItemId(item) !== stockItemId) {
      return sum;
    }
    if (isRewardItemInCart(item, itemList)) {
      return sum;
    }
    return sum + (item.quantity || 1);
  }, 0);
}

export function getOccupiedQtyByStockId({
  itemList = [],
  currentOrderCombo = [],
  crm,
  stockItemId,
  stockCloudId,
  excludeSequence,
  excludeSectionId,
  excludeRewardPending = false,
  drawerPendingItems,
}) {
  const cartQty = getCartItemQtyByStockId(
    itemList,
    stockItemId,
    stockCloudId,
    excludeSequence
  );
  const comboCartQty = getComboSubItemQtyInCart(itemList, stockItemId, stockCloudId);
  const buildingQty = getComboBuildingQtyByStockId(
    currentOrderCombo,
    stockItemId,
    stockCloudId,
    excludeSectionId
  );
  const rewardPendingQty = excludeRewardPending
    ? 0
    : getRewardPendingQtyByStockId(crm, stockItemId, stockCloudId, itemList);
  const drawerPendingQty = drawerPendingItems
    ? getDrawerPendingQtyByStockId(drawerPendingItems, stockItemId, stockCloudId)
    : 0;
  return (
    cartQty +
    comboCartQty +
    buildingQty +
    rewardPendingQty +
    drawerPendingQty
  );
}

/**
 * 获取某菜品当前可展示的剩余库存（总库存 - 已占用数量）
 * 说明：这里的已占用数量与库存校验口径保持一致，包含购物车、套餐子菜、待确认赠菜等占用
 */
export function getRemainingStockNum({
  itemInfo,
  itemList = [],
  menuItemList,
  currentOrderCombo = [],
  crm,
  excludeSequence,
  excludeSectionId,
  excludeRewardPending = false,
  drawerPendingItems,
}) {
  const stockNum = getItemStockNum(itemInfo, menuItemList);
  if (stockNum === undefined) {
    return undefined;
  }
  const stockItemId = getStockItemId(itemInfo);
  const stockCloudId = itemInfo?.cloudId;
  const occupiedQty = getOccupiedQtyByStockId({
    itemList,
    currentOrderCombo,
    crm,
    stockItemId,
    stockCloudId,
    excludeSequence,
    excludeSectionId,
    excludeRewardPending,
    drawerPendingItems,
  });
  return Math.max(stockNum - occupiedQty, 0);
}

/**
 * 套餐子菜加购前校验（购物车 + 当前套餐内已选 + 即将加购）
 */
export function canAddComboSubItems({
  itemsToAdd,
  itemList = [],
  currentOrderCombo = [],
  menuItemList,
  crm,
  excludeSectionId,
  drawerPendingItems,
}) {
  const groups = groupComboSubItemsByStockId(itemsToAdd);
  for (const { itemInfo, count } of groups) {
    const stockNum = getItemStockNum(itemInfo, menuItemList);
    if (stockNum === undefined) {
      continue;
    }
    const stockItemId = getStockItemId(itemInfo);
    const stockCloudId = itemInfo.cloudId;
    const totalQty =
      getOccupiedQtyByStockId({
        itemList,
        currentOrderCombo,
        crm,
        excludeSectionId,
        stockItemId,
        stockCloudId,
        drawerPendingItems,
      }) + count;
    if (totalQty > stockNum) {
      return false;
    }
  }
  return true;
}

/** 套餐提交进购物车时校验子菜库存（含套餐份数） */
export function validateComboSubmitStock(
  comboInfo,
  state,
  { drawerPendingItems } = {}
) {
  const { itemList } = state.currentOrder || {};
  const { menuItemList } = state;
  const parentQty = comboInfo?.quantity || 1;
  const sectionDetail = comboInfo?.sectionDetail || [];
  const addMap = {};

  for (const section of sectionDetail) {
    if (section.id <= 0) {
      continue;
    }
    for (const subItem of section.items || []) {
      const subItemQty = subItem.quantity || 1;
      const stockItemId = getStockItemId(subItem);
      const stockCloudId = subItem.cloudId;
      if (stockItemId == null && stockCloudId == null) {
        continue;
      }
      const key = stockCloudId ? `${stockCloudId}` : `${stockItemId}`;
      if (!addMap[key]) {
        addMap[key] = { itemInfo: subItem, count: 0 };
      }
      addMap[key].count += subItemQty * parentQty;
    }
  }

  for (const { itemInfo, count } of Object.values(addMap)) {
    const stockNum = getItemStockNum(itemInfo, menuItemList);
    if (stockNum === undefined) {
      continue;
    }
    const stockItemId = getStockItemId(itemInfo);
    const stockCloudId = itemInfo.cloudId;
    const occupiedQty = getOccupiedQtyByStockId({
      itemList,
      // 提交当前套餐时，count 已包含本次套餐内容，避免与 currentOrderCombo 重复计数
      currentOrderCombo: [],
      crm: state.crm,
      stockItemId,
      stockCloudId,
      drawerPendingItems,
    });
    if (occupiedQty + count > stockNum) {
      return false;
    }
  }
  return true;
}

export function isStockSufficient({
  itemInfo,
  addQty = 1,
  itemList = [],
  menuItemList,
  excludeSequence,
  currentOrderCombo,
  crm,
  excludeRewardPending = false,
  drawerPendingItems,
}) {
  const stockNum = getItemStockNum(itemInfo, menuItemList);
  if (stockNum !== undefined) {
    const stockItemId = getStockItemId(itemInfo);
    const stockCloudId = itemInfo.cloudId;
    const occupiedQty = getOccupiedQtyByStockId({
      itemList,
      currentOrderCombo,
      crm,
      stockItemId,
      stockCloudId,
      excludeSequence,
      excludeRewardPending,
      drawerPendingItems,
    });
    if (occupiedQty + addQty > stockNum) {
      return false;
    }
  }
  const optionAddMap = {};
  for (const section of itemInfo?.sectionDetail || []) {
    if (section.id !== -2) {
      continue;
    }
    for (const option of section.options || []) {
      const optionStockItemId = getStockItemId(option);
      const optionStockCloudId = option.cloudId;
      if (optionStockItemId == null && optionStockCloudId == null) {
        continue;
      }
      const optionKey = optionStockCloudId
        ? `${optionStockCloudId}`
        : `${optionStockItemId}`;
      if (!optionAddMap[optionKey]) {
        optionAddMap[optionKey] = { itemInfo: option, count: 0 };
      }
      optionAddMap[optionKey].count += (option.quantity || 1) * addQty;
    }
  }
  for (const { itemInfo: optionItem, count } of Object.values(optionAddMap)) {
    const optionStockNum = getItemStockNum(optionItem, menuItemList);
    if (optionStockNum === undefined) {
      continue;
    }
    const optionStockItemId = getStockItemId(optionItem);
    const optionStockCloudId = optionItem.cloudId;
    const optionOccupiedQty = getOccupiedQtyByStockId({
      itemList,
      currentOrderCombo,
      crm,
      stockItemId: optionStockItemId,
      stockCloudId: optionStockCloudId,
      excludeSequence,
      excludeRewardPending,
      drawerPendingItems,
    });
    if (optionOccupiedQty + count > optionStockNum) {
      return false;
    }
  }
  return true;
}

/** 校验某菜品在购物车中的总数量是否不超过库存 */
export function isTotalQtyWithinStock({
  itemInfo,
  totalQty,
  menuItemList,
  itemList = [],
  currentOrderCombo = [],
  crm,
  drawerPendingItems,
}) {
  const stockNum = getItemStockNum(itemInfo, menuItemList);
  if (stockNum === undefined) {
    return true;
  }
  const stockItemId = getStockItemId(itemInfo);
  const stockCloudId = itemInfo.cloudId;
  const rewardPendingQty = getRewardPendingQtyByStockId(
    crm,
    stockItemId,
    stockCloudId,
    itemList
  );
  const comboCartQty = getComboSubItemQtyInCart(itemList, stockItemId, stockCloudId);
  const buildingQty = getComboBuildingQtyByStockId(
    currentOrderCombo,
    stockItemId,
    stockCloudId
  );
  const drawerPendingQty = drawerPendingItems
    ? getDrawerPendingQtyByStockId(drawerPendingItems, stockItemId, stockCloudId)
    : 0;
  return (
    totalQty +
      comboCartQty +
      buildingQty +
      rewardPendingQty +
      drawerPendingQty <=
    stockNum
  );
}

export function showInsufficientStockToast() {
  Toast.info(i18n.t('insufficient-stock'), 1000);
}
