const calcOrderTypeCount = (list, orderType) => {
  let n = 0;
  for (let i = 0; i < list.length; i++) {
    let temp = list[i];
    if (temp?.itemPrices) {
      // 是否堂吃
      if (orderType === 'DINE_IN') {
        let dineInList = temp.itemPrices.filter((f) => f.type === 'DINE_IN');
        if (dineInList.length) {
          n++;
          continue;
        } else {
          let AllList = temp.itemPrices.filter((f) => f.type === 'ALL');
          if (AllList.length) {
            n++;
            continue;
          }
        }
      } else if (orderType === 'TO_GO') {
        // 是否打包
        let togoList = temp.itemPrices.filter((f) => f.type === 'TOGO');
        if (togoList.length) {
          n++;
          continue;
        } else {
          let AllList = temp.itemPrices.filter((f) => f.type === 'ALL');
          if (AllList.length) {
            n++;
            continue;
          }
        }
      } else if (orderType === 'PICK_UP') {
        // 是否打包
        let pickUpList = temp.itemPrices.filter((f) => f.type === 'PICKUP');
        if (pickUpList.length) {
          n++;
          continue;
        } else {
          let AllList = temp.itemPrices.filter((f) => f.type === 'ALL');
          if (AllList.length) {
            n++;
            continue;
          }
        }
      }
    } else {
      n++;
    }
  }

  return n;
};

export default calcOrderTypeCount;
