import getPosVersion from '@/utils/getPosVersion';
import store from '@/reducers/store';

// 检查菜品售罄状态
// POS30.16.4以下，soldOut: selfConfig?.soldOut 中判断
// POS30.16.4及以上，从menu接口中获取 outOfStock 状态
const MENU_OUT_OF_STOCK_MIN_POS_VERSION = 18030160400;

const isSameId = (a, b) => a != null && b != null && String(a) === String(b);

const shouldUseMenuOutOfStock = () =>
  Number(getPosVersion(localStorage.getItem('posVersion'))) >=
  MENU_OUT_OF_STOCK_MIN_POS_VERSION;

const isInKioskSoldOutList = (item, kioskSoldOutList = []) =>
  (kioskSoldOutList || []).some(
    (soldoutId) =>
      isSameId(soldoutId, item?.id) ||
      isSameId(soldoutId, item?.oId) ||
      isSameId(soldoutId, item?.cloudId)
  );

const checkBaseDishSoldOut = (item, { kioskSoldOutList }) => {
  if (shouldUseMenuOutOfStock()) {
    return !!item?.outOfStock;
  }

  return isInKioskSoldOutList(item, kioskSoldOutList);
};

const checkBaseSubOptionSoldOut = (
  currentItem,
  option,
  subOption,
  { kioskSoldOutList } = {}
) => {
  const currentOption = currentItem?.options?.find(
    (opt) =>
      isSameId(opt?.id, option?.id) ||
      isSameId(opt?.id, subOption?.itemOptionId) ||
      isSameId(opt?.id, subOption?.id)
  );
  if (!currentOption) {
    return shouldUseMenuOutOfStock()
      ? !!subOption?.outOfStock
      : isInKioskSoldOutList(subOption, kioskSoldOutList);
  }
  const currentSubOption = currentOption?.subOptions?.find((sub) =>
    isSameId(sub?.id, subOption?.id)
  );
  const resolvedSubOption = currentSubOption ?? subOption;

  if (!shouldUseMenuOutOfStock()) {
    return isInKioskSoldOutList(resolvedSubOption, kioskSoldOutList);
  }

  // 一级 option（无 subOptions）直接按 option 自身售罄判断
  if (
    (!currentOption?.subOptions?.length ||
      isSameId(currentOption?.id, subOption?.id)) &&
    currentOption?.outOfStock
  ) {
    return true;
  }
  return !!resolvedSubOption?.outOfStock;
};

const checkBaseSubOptionUnavailable = (currentItem, option, subOption) => {
  const currentOption = currentItem?.options?.find(
    (opt) =>
      isSameId(opt?.id, option?.id) ||
      isSameId(opt?.id, subOption?.itemOptionId) ||
      isSameId(opt?.id, subOption?.itemOption?.id)
  );
  if (!currentOption) {
    return subOption?.enabled === false;
  }
  if (!currentOption?.subOptions?.length) {
    return false;
  }
  const currentSubOption = currentOption.subOptions.find((sub) =>
    isSameId(sub?.id, subOption?.id)
  );
  return (currentSubOption ?? subOption)?.enabled === false;
};

const getCurrentSubOption = (currentItem, option, subOption) => {
  const currentOption = currentItem?.options?.find(
    (opt) =>
      isSameId(opt?.id, option?.id) ||
      isSameId(opt?.id, subOption?.itemOptionId) ||
      isSameId(opt?.id, subOption?.itemOption?.id)
  );
  if (!currentOption?.subOptions?.length) {
    return subOption;
  }
  return (
    currentOption.subOptions.find((sub) => isSameId(sub?.id, subOption?.id)) ||
    subOption
  );
};

const getSubOptionAvailableQty = (currentItem, option, subOption) => {
  const currentSubOption = getCurrentSubOption(currentItem, option, subOption);
  const addLimit = currentSubOption?.addLimit ?? 0;
  const stockNum = Number(currentSubOption?.stockNum);
  const hasStockLimit = Number.isFinite(stockNum);

  if (addLimit > 0 && hasStockLimit) {
    return Math.min(addLimit, Math.max(stockNum, 0));
  }
  if (addLimit > 0) {
    return addLimit;
  }
  if (hasStockLimit) {
    return Math.max(stockNum, 0);
  }
  return Number.MAX_SAFE_INTEGER;
};

const getComboSectionItemAvailableQty = (
  currentChildItem,
  comboSectionSaleItem,
  allowRepeatedItems
) => {
  const stockNum = Number(currentChildItem?.stockNum);
  const hasStockLimit = Number.isFinite(stockNum);
  const availableStock = hasStockLimit ? Math.max(stockNum, 0) : undefined;

  if (!allowRepeatedItems) {
    return hasStockLimit ? Math.min(availableStock, 1) : 1;
  }

  const addLimit = comboSectionSaleItem?.addLimit ?? 0;
  if (addLimit > 0 && hasStockLimit) {
    return Math.min(addLimit, availableStock);
  }
  if (addLimit > 0) {
    return addLimit;
  }
  if (hasStockLimit) {
    return availableStock;
  }
  return Number.MAX_SAFE_INTEGER;
};

const getOrderItemId = (item) => {
  if (!item) {
    return undefined;
  }
  if (item?.isFreeItem && item?.oId != null) {
    return item.oId;
  }
  return item?.id;
};

const resolveCurrentItem = (item, menuItemList = {}) => {
  if (!item) {
    return item;
  }
  const direct = menuItemList[item?.id];
  if (direct) {
    return direct;
  }
  if (item?.cloudId) {
    const byCloudId = Object.values(menuItemList).find(
      (menuItem) => menuItem?.cloudId === item.cloudId
    );
    if (byCloudId) {
      return byCloudId;
    }
  }
  return item;
};

const buildSoldOutDetail = ({ soldoutItem, soldoutType, parentItem }) => {
  const soldoutItemId = getOrderItemId(soldoutItem) ?? soldoutItem?.id;
  const parentItemId = getOrderItemId(parentItem) ?? parentItem?.id;
  return {
    id: soldoutItemId,
    cloudId: soldoutItem?.cloudId,
    name: soldoutItem?.name,
    fieldDisplayNameGroups: soldoutItem?.fieldDisplayNameGroups,
    soldoutType,
    parentId: parentItemId,
    parentName: parentItem?.name,
    parentFieldDisplayNameGroups: parentItem?.fieldDisplayNameGroups,
    soldoutDisplayKey:
      soldoutType === 'item'
        ? `item_${soldoutItemId}`
        : `${soldoutType}_${parentItemId ?? ''}_${soldoutItemId}`,
  };
};

const findOptionInfoBySubOptionId = (optionMap, subOptionId) => {
  for (const option of Object.values(optionMap)) {
    if (
      option?.subOptions?.some((subOption) =>
        isSameId(subOption?.id, subOptionId)
      )
    ) {
      return option;
    }
  }
  return undefined;
};

const collectOrderSoldOutDetailsInternal = (
  orderItem,
  config = {},
  parentItem
) => {
  const menuItemList = config?.menuItemList ?? store.getState().menuItemList;
  const kioskSoldOutList =
    config?.kioskSoldOutList ?? store.getState().selfConfig?.soldOut;
  const itemId = getOrderItemId(orderItem);
  if (itemId == null) {
    return [];
  }
  const currentItem = resolveCurrentItem(
    { ...orderItem, id: itemId },
    menuItemList
  );

  if (checkBaseDishSoldOut(currentItem, { kioskSoldOutList })) {
    return [
      buildSoldOutDetail({
        soldoutItem: currentItem,
        soldoutType: parentItem ? 'subItem' : 'item',
        parentItem,
      }),
    ];
  }

  const details = [];
  const optionMap = {};
  for (const option of currentItem?.options || []) {
    optionMap[option?.id] = option;
  }

  const optionSectionList = orderItem?.selectedOptionList?.length
    ? orderItem.selectedOptionList
    : orderItem?.sectionDetail;
  for (const section of optionSectionList || []) {
    if (section?.id !== -2) {
      continue;
    }
    for (const subOption of section?.options || []) {
      const optionInfo =
        subOption?.itemOption ||
        optionMap[subOption?.itemOptionId] ||
        optionMap[subOption?.itemOption?.id] ||
        findOptionInfoBySubOptionId(optionMap, subOption?.id);
      const subOptionSoldOut =
        checkBaseSubOptionSoldOut(currentItem, optionInfo, subOption, {
          kioskSoldOutList,
        }) ||
        checkBaseSubOptionUnavailable(currentItem, optionInfo, subOption);
      if (subOptionSoldOut) {
        details.push(
          buildSoldOutDetail({
            soldoutItem: subOption,
            soldoutType: 'option',
            parentItem: orderItem,
          })
        );
      }
    }
  }

  for (const section of orderItem?.sectionDetail || []) {
    if (section?.id <= 0) {
      continue;
    }
    for (const subItem of section?.items || []) {
      details.push(
        ...collectOrderSoldOutDetailsInternal(subItem, config, orderItem)
      );
    }
  }

  return details;
};

const checkSoldOut = (item, config) => {
  const kioskSoldOutList =
    config?.kioskSoldOutList ?? store.getState().selfConfig?.soldOut;
  const menuItemList = config?.menuItemList ?? store.getState().menuItemList;
  const fromOrder = config?.fromOrder ?? false;
  const currentItem = resolveCurrentItem(item, menuItemList);
  let finalSoldOut = checkBaseDishSoldOut(currentItem, { kioskSoldOutList });
  if (finalSoldOut) {
    return true;
  }

  if (fromOrder) {
    const findOptionInfoBySubOptionId = (subOptionId) => {
      for (const option of currentItem?.options || []) {
        if (option?.subOptions?.some((sub) => isSameId(sub?.id, subOptionId))) {
          return option;
        }
      }
      return undefined;
    };

    for (let i = 0; i < item?.sectionDetail?.length; i++) {
      const sectionDetailItem = item.sectionDetail[i];
      if (sectionDetailItem?.id === -2) {
        for (let j = 0; j < sectionDetailItem?.options?.length; j++) {
          const subOption = sectionDetailItem.options[j];
          const option =
            subOption?.itemOption ||
            findOptionInfoBySubOptionId(subOption?.id);
          const subOptionSoldOut =
            checkBaseSubOptionSoldOut(currentItem, option, subOption, {
              kioskSoldOutList,
            }) ||
            checkBaseSubOptionUnavailable(currentItem, option, subOption);
          if (subOptionSoldOut) {
            return true;
          }
        }
      }
      if (sectionDetailItem?.id > 0) {
        for (let j = 0; j < sectionDetailItem?.items?.length; j++) {
          const dishItem = sectionDetailItem.items[j];
          // 递归时以“订单中的子菜实例”为准，避免丢失该子菜已选择的 option 信息
          const dishSoldOut = checkSoldOut(dishItem, config);
          if (dishSoldOut) {
            return true;
          }
        }
      }
    }

    return false;
  } else {
    for (let i = 0; i < item?.comboSections?.length; i++) {
      const comboSection = item.comboSections[i];
      // 兼容不同套餐 section 结构：优先 comboSectionSaleItems，兜底 saleItems
      const sectionItems = comboSection?.comboSectionSaleItems?.length
        ? comboSection.comboSectionSaleItems
        : comboSection?.saleItems || [];
      const min = comboSection?.minNumOfSelectionAllowed ?? 0;

      let maxAvailableQty = 0;
      let hasUnlimitedQty = false;
      const soldOutChildIdSet = new Set();

      for (let j = 0; j < sectionItems.length; j++) {
        const comboSectionSaleItem = sectionItems[j];
        const childItemId =
          comboSectionSaleItem?.saleItemId ?? comboSectionSaleItem?.id;
        const currentChildItem = menuItemList[childItemId] ?? {
          ...comboSectionSaleItem,
          id: childItemId,
        };
        const childSoldOut = checkSoldOut(currentChildItem, {
          ...config,
          kioskSoldOutList,
        });
        if (childSoldOut) {
          soldOutChildIdSet.add(childItemId);
          continue;
        }

        const availableQty = getComboSectionItemAvailableQty(
          currentChildItem,
          comboSectionSaleItem,
          comboSection?.allowRepeatedItems
        );
        if (availableQty === Number.MAX_SAFE_INTEGER) {
          hasUnlimitedQty = true;
          break;
        }
        maxAvailableQty += availableQty;
      }

      // 预选子菜售罄时，不可满足必选要求，主菜视为售罄
      const hasPreSelectedSoldOut = sectionItems.some((sectionItem) => {
        if (!sectionItem?.preSelected) {
          return false;
        }
        const sectionItemId = sectionItem?.saleItemId ?? sectionItem?.id;
        return soldOutChildIdSet.has(sectionItemId);
      });
      if (hasPreSelectedSoldOut) {
        finalSoldOut = true;
        break;
      }

      // min 未设置或 <=0，代表该分组不影响“可否满足最小份数”
      if (min <= 0) {
        continue;
      }

      // section 总最大值：除 FIXED_UNTIL_MAX 外，以 maxNumOfSelectionAllowed 作为上限
      const max = comboSection?.maxNumOfSelectionAllowed;
      const sectionMaxQty =
        comboSection?.priceRule === 'FIXED_UNTIL_MAX' || max == undefined
          ? Number.MAX_SAFE_INTEGER
          : max;

      const sectionAvailableMaxQty = hasUnlimitedQty
        ? Number.MAX_SAFE_INTEGER
        : Math.min(maxAvailableQty, sectionMaxQty);

      if (sectionAvailableMaxQty < min) {
        finalSoldOut = true;
        break;
      }
    }

    if (finalSoldOut) {
      return true;
    }
  
    const optionList = currentItem?.options || item?.options || [];
    for (let i = 0; i < optionList.length; i++) {
      const option = optionList[i];
      const subOptions = option?.subOptions || [];
      const min = option?.min ?? 0;

      if (min <= 0) {
        continue;
      }

      let maxAvailableQty = 0;
      let hasUnlimitedQty = false;

      for (let j = 0; j < subOptions.length; j++) {
        const subOption = subOptions[j];
        const subSoldOut =
          checkBaseSubOptionSoldOut(currentItem, option, subOption, { kioskSoldOutList }) ||
          checkBaseSubOptionUnavailable(currentItem, option, subOption);
        if (subSoldOut) {
          continue;
        }
  
        const availableQty = getSubOptionAvailableQty(
          currentItem,
          option,
          subOption
        );
        if (availableQty === Number.MAX_SAFE_INTEGER) {
          hasUnlimitedQty = true;
          break;
        }
        maxAvailableQty += availableQty;
      }

      const max = option?.max;
      const optionMaxQty = max == undefined ? Number.MAX_SAFE_INTEGER : max;
      const optionAvailableMaxQty = hasUnlimitedQty
        ? Number.MAX_SAFE_INTEGER
        : Math.min(maxAvailableQty, optionMaxQty);

      if (optionAvailableMaxQty < min) {
        finalSoldOut = true;
        break;
      }
    }

    if (finalSoldOut) {
      return true;
    }

    return false;
  }
};

const checkUnavailable = (item, config = {}) => {
  const kioskSoldOutList =
    config?.kioskSoldOutList ?? store.getState().selfConfig?.soldOut;
  const menuItemList = config?.menuItemList ?? store.getState().menuItemList;
  const fromOrder = config?.fromOrder ?? false;
  const currentItem = resolveCurrentItem(item, menuItemList);

  if (fromOrder) {
    const findCurrentOptionBySubOptionId = (subOptionId) => {
      for (const option of currentItem?.options || []) {
        if (option?.subOptions?.some((sub) => isSameId(sub?.id, subOptionId))) {
          return option;
        }
      }
      return undefined;
    };

    for (let i = 0; i < item?.sectionDetail?.length; i++) {
      const sectionDetailItem = item.sectionDetail[i];
      if (sectionDetailItem?.id === -2) {
        for (let j = 0; j < sectionDetailItem?.options?.length; j++) {
          const subOption = sectionDetailItem.options[j];
          const option =
            subOption?.itemOption ||
            findCurrentOptionBySubOptionId(subOption?.id);
          if (checkBaseSubOptionUnavailable(currentItem, option, subOption)) {
            return true;
          }
        }
      }
      if (sectionDetailItem?.id > 0) {
        for (let j = 0; j < sectionDetailItem?.items?.length; j++) {
          const dishItem = sectionDetailItem.items[j];
          if (checkUnavailable(dishItem, config)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  for (let i = 0; i < currentItem?.comboSections?.length; i++) {
    const comboSection = currentItem.comboSections[i];
    const sectionItems = comboSection?.comboSectionSaleItems?.length
      ? comboSection.comboSectionSaleItems
      : comboSection?.saleItems || [];
    const min = comboSection?.minNumOfSelectionAllowed ?? 0;

    let maxAvailableQty = 0;
    let hasUnlimitedQty = false;
    let hasUnavailable = false;
    const unavailableChildIdSet = new Set();

    for (let j = 0; j < sectionItems.length; j++) {
      const comboSectionSaleItem = sectionItems[j];
      const childItemId =
        comboSectionSaleItem?.saleItemId ?? comboSectionSaleItem?.id;
      const currentChildItem =
        menuItemList[childItemId] ?? {
          ...comboSectionSaleItem,
          id: childItemId,
        };
      const childUnavailable = checkUnavailable(currentChildItem, config);
      const childSoldOut =
        !!comboSectionSaleItem?.outOfStock ||
        (kioskSoldOutList || []).some(
          (soldoutId) => String(soldoutId) === String(childItemId)
        ) ||
        checkSoldOut(currentChildItem, config);
      if (childUnavailable || childSoldOut) {
        if (childUnavailable) {
          hasUnavailable = true;
          unavailableChildIdSet.add(childItemId);
        }
        continue;
      }

      const availableQty = getComboSectionItemAvailableQty(
        currentChildItem,
        comboSectionSaleItem,
        comboSection?.allowRepeatedItems
      );
      if (availableQty === Number.MAX_SAFE_INTEGER) {
        hasUnlimitedQty = true;
        break;
      }
      maxAvailableQty += availableQty;
    }

    const hasPreSelectedUnavailable = sectionItems.some((sectionItem) => {
      if (!sectionItem?.preSelected) {
        return false;
      }
      const sectionItemId = sectionItem?.saleItemId ?? sectionItem?.id;
      return unavailableChildIdSet.has(sectionItemId);
    });
    if (hasPreSelectedUnavailable) {
      return true;
    }

    if (min <= 0) {
      continue;
    }

    const max = comboSection?.maxNumOfSelectionAllowed;
    const sectionMaxQty =
      comboSection?.priceRule === 'FIXED_UNTIL_MAX' || max == undefined
        ? Number.MAX_SAFE_INTEGER
        : max;

    const sectionAvailableMaxQty = hasUnlimitedQty
      ? Number.MAX_SAFE_INTEGER
      : Math.min(maxAvailableQty, sectionMaxQty);

    if (hasUnavailable && sectionAvailableMaxQty < min) {
      return true;
    }
  }

  const optionList = currentItem?.options || item?.options || [];
  for (let i = 0; i < optionList.length; i++) {
    const option = optionList[i];
    const subOptions = option?.subOptions || [];
    const min = option?.min ?? 0;

    if (min <= 0) {
      continue;
    }

    let maxAvailableQty = 0;
    let hasUnlimitedQty = false;
    let hasUnavailable = false;

    for (let j = 0; j < subOptions.length; j++) {
      const subOption = subOptions[j];
      const subUnavailable = checkBaseSubOptionUnavailable(
        currentItem,
        option,
        subOption
      );
      const subSoldOut = checkBaseSubOptionSoldOut(
        currentItem,
        option,
        subOption
      );
      if (subUnavailable || subSoldOut) {
        if (subUnavailable) {
          hasUnavailable = true;
        }
        continue;
      }

      const availableQty = getSubOptionAvailableQty(
        currentItem,
        option,
        subOption
      );
      if (availableQty === Number.MAX_SAFE_INTEGER) {
        hasUnlimitedQty = true;
        break;
      }
      maxAvailableQty += availableQty;
    }

    const max = option?.max;
    const optionMaxQty = max == undefined ? Number.MAX_SAFE_INTEGER : max;
    const optionAvailableMaxQty = hasUnlimitedQty
      ? Number.MAX_SAFE_INTEGER
      : Math.min(maxAvailableQty, optionMaxQty);

    if (hasUnavailable && optionAvailableMaxQty < min) {
      return true;
    }
  }

  return false;
};

const itemIsSoldOut = (item, options) => {
  if (!item) return false;

  const itemId = getOrderItemId(item);
  const isSoldOut = checkSoldOut({ ...item, id: itemId }, options);

  return isSoldOut;
};

export const getOrderSoldOutDetails = (orderItem, options = {}) => {
  if (!orderItem) {
    return [];
  }
  const itemId = getOrderItemId(orderItem);
  if (itemId == null) {
    return [];
  }
  const details = collectOrderSoldOutDetailsInternal(orderItem, options);
  if (details.length) {
    return details;
  }
  const isSoldOut = checkSoldOut(
    { ...orderItem, id: itemId },
    { ...options, fromOrder: true }
  );
  if (!isSoldOut) {
    return [];
  }
  return [
    buildSoldOutDetail({
      soldoutItem: orderItem,
      soldoutType: 'item',
    }),
  ];
};

export const itemIsSubOptionSoldOut = (item, option, subOption, config) => {
  if (!item || !option || !subOption) return false;

  const menuItemList = config?.menuItemList ?? store.getState().menuItemList;
  const itemId = getOrderItemId(item);
  const currentItem = resolveCurrentItem({ ...item, id: itemId }, menuItemList);
  const kioskSoldOutList =
    config?.kioskSoldOutList ?? store.getState().selfConfig?.soldOut;
  return checkBaseSubOptionSoldOut(currentItem, option, subOption, {
    kioskSoldOutList,
  });
};

export const itemIsSubOptionUnavailable = (item, option, subOption, config) => {
  if (!item || !option || !subOption) return false;

  const menuItemList = config?.menuItemList ?? store.getState().menuItemList;
  const itemId = getOrderItemId(item);
  const currentItem = resolveCurrentItem({ ...item, id: itemId }, menuItemList);
  return checkBaseSubOptionUnavailable(currentItem, option, subOption);
};

export const itemIsUnavailable = (item, options) => {
  if (!item) return false;

  const itemId = getOrderItemId(item);
  return checkUnavailable({ ...item, id: itemId }, options);
};

export const getItemStoppedStatus = (item, options) => {
  if (itemIsUnavailable(item, options)) {
    return 'unavailable';
  }
  if (itemIsSoldOut(item, options)) {
    return 'soldOut';
  }
  return null;
};

export default itemIsSoldOut;
