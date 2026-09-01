import cloneDeep from 'lodash/cloneDeep';

// 自选套餐：根据 dineIn/togo/pickup 过滤 itemPrices（size -1）
export default function buildComboSizeList(currentItem, currentOrder) {
  const itemPrices = currentItem?.itemPrices || [];
  if (!itemPrices.length) return [];

  const orderType = currentOrder?.orderType;
  if (orderType === 'DINE_IN') {
    const dineInList = itemPrices.filter((f) => f?.type === 'DINE_IN');
    if (dineInList.length) return cloneDeep(dineInList);
    const allList = itemPrices.filter((f) => f?.type === 'ALL');
    return allList.length ? cloneDeep(allList) : [];
  }

  if (orderType === 'TO_GO') {
    const togoList = itemPrices.filter((f) => f?.type === 'TOGO');
    if (togoList.length) return cloneDeep(togoList);
    const allList = itemPrices.filter((f) => f?.type === 'ALL');
    return allList.length ? cloneDeep(allList) : [];
  }

  if (orderType === 'PICK_UP') {
    const pickUpList = itemPrices.filter((f) => f?.type === 'PICKUP');
    if (pickUpList.length) return cloneDeep(pickUpList);
    const allList = itemPrices.filter((f) => f?.type === 'ALL');
    return allList.length ? cloneDeep(allList) : [];
  }

  return [];
}
