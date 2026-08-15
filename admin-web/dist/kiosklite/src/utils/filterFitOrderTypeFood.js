import { ORDER_TYPE } from '@/constants/order';

const filterFitOrderTypeFood = (list, orderType) => {
  return list?.reduce((pre, cur) => {
    if (!cur?.itemPrices) return pre.concat(cur);
    const currentOrderTypePriceList = cur.itemPrices.filter(
      (f) => f.type === ORDER_TYPE[orderType]
    );
    const allOrderTypePriceList = cur.itemPrices.filter(
      (f) => f.type === ORDER_TYPE['ALL']
    );
    const itemPriceList = currentOrderTypePriceList.length ? currentOrderTypePriceList : allOrderTypePriceList;
    if (!itemPriceList?.length) return pre;
    return pre.concat({
      ...cur,
      itemPrices: itemPriceList,
    });
  }, []);
};

export default filterFitOrderTypeFood;
// const filterFitOrderTypeFood = (list, orderType) => {
//   let arr = [];
//   for (let i = 0; i < list.length; i++) {
//     let temp = list[i];
//     if (temp?.itemPrices) {
//       // 是否堂吃
//       if (orderType === 'DINE_IN') {
//         let dineInList = temp.itemPrices.filter((f) => f.type === 'DINE_IN');
//         if (dineInList.length) {
//           temp.itemPrices = cloneDeep(dineInList);
//           arr.push(temp);
//           continue;
//         } else {
//           let AllList = temp.itemPrices.filter((f) => f.type === 'ALL');
//           if (AllList.length) {
//             temp.itemPrices = cloneDeep(AllList);
//             arr.push(temp);
//             continue;
//           } else {
//             list.splice(i, 1);
//             i--;
//           }
//         }
//       } else if (orderType === 'TO_GO') {
//         // 是否打包
//         let togoList = temp.itemPrices.filter((f) => f.type === 'TOGO');
//         if (togoList.length) {
//           temp.itemPrices = cloneDeep(togoList);
//           arr.push(temp);
//           continue;
//         } else {
//           let AllList = temp.itemPrices.filter((f) => f.type === 'ALL');
//           if (AllList.length) {
//             temp.itemPrices = cloneDeep(AllList);
//             arr.push(temp);
//             continue;
//           } else {
//             list.splice(i, 1);
//             i--;
//           }
//         }
//       } else if (orderType === 'PICK_UP') {
//         // 预约点单
//         let pickUpList = temp.itemPrices.filter((f) => f.type === 'PICKUP');
//         if (pickUpList.length) {
//           temp.itemPrices = cloneDeep(pickUpList);
//           arr.push(temp);
//           continue;
//         } else {
//           let AllList = temp.itemPrices.filter((f) => f.type === 'ALL');
//           if (AllList.length) {
//             temp.itemPrices = cloneDeep(AllList);
//             arr.push(temp);
//             continue;
//           } else {
//             list.splice(i, 1);
//             i--;
//           }
//         }
//       }
//     } else {
//       arr.push(temp);
//     }
//   }
//
//   return arr;
// };
