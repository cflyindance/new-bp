import Big from 'big.js';

export const getItemPrice = function (item) {
  // 单个总价格（不乘quantity）
  let subTotal = Big(0);
  if (item.price) {
    subTotal = subTotal.plus(Big(item.price));
  }

  // 自选套餐sectionDetail内部items的内部selectedOptionList，其他菜品都是sectionDetail
  const sectionDetail = item.sectionDetail || item.selectedOptionList;
  // 有itemPrice，options
  if (sectionDetail && sectionDetail.length) {
    sectionDetail.forEach((sct) => {
      // size == -1
      if (sct.id == -1) {
        subTotal = subTotal.plus(Big(sct.sizeInfo?.price || 0));
      }
      // options == -2, -3
      if (sct.id == -2 || sct.id == -3) {
        sct.options.length &&
          sct.options.forEach((opt) => {
            subTotal = subTotal.plus(Big(opt.isFreeItem ? 0 : opt.price).times(opt.quantity));
          });
      }
      // 适用于自选套餐
      if (sct.id > 0) {
        sct.items.forEach((it) => {
          subTotal = subTotal.plus(Big(getItemPrice(it)).times(it.quantity));
        });
      }
    });
  }

  return Number(subTotal.toFixed(2) || 0);
};
