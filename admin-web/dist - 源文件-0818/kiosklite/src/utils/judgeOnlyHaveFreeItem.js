import store from '@/reducers/store';

const judgeOnlyHaveFreeItem = () => {
  const state = store.getState();
  const {
    crm: { selectedFreeItem },
    currentOrder: { itemList },
  } = state;
  // 未选菜，只选了兑换菜
  if (itemList.length === 0) return selectedFreeItem.length > 0;
  // 选的菜都是兑换菜
  return itemList.every((item) => Boolean(item?.isFreeItem));
};

export default judgeOnlyHaveFreeItem;

// onlyHaveFreeItem
