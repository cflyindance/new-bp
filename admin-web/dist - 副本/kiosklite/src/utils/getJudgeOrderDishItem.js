import store from '@/reducers/store';

const getJudgeOrderDishItem = () => {
  const state = store.getState();
  const {
    crm: { selectedFreeItem },
    currentOrder: { itemList },
  } = state;

  const items = [...itemList];
  // 赠菜
  if (selectedFreeItem?.length > 0) {
    items.push(...selectedFreeItem);
  }

  return items;
};

export default getJudgeOrderDishItem;
