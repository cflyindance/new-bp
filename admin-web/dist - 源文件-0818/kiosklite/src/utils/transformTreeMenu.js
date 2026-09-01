export const transformTreeDishId = (dishId, removePrefix = false) => {
  if (dishId == null || dishId === '') {
    return dishId;
  }

  if (removePrefix) {
    if (typeof dishId === 'string') {
      if (dishId.startsWith('dish_combo_')) {
        return dishId.replace('dish_combo_', '');
      }
      if (dishId.startsWith('dish_')) {
        return Number(dishId.replace('dish_', ''));
      }
      const num = Number(dishId);
      return Number.isNaN(num) ? dishId : num;
    }
    return dishId;
  }

  if (typeof dishId === 'string') {
    if (dishId.startsWith('dish_combo_') || dishId.startsWith('dish_')) {
      return dishId;
    }
    return 'dish_combo_' + dishId;
  }
  if (typeof dishId === 'number') {
    return 'dish_' + dishId;
  }

  return dishId;
};

// 部分勾选 combo 子菜时，TreeSelect 不会带上主菜节点；补全主菜 _id 以支持「主菜参与、部分子菜不参与」
export const appendParentDishTreeIds = (selectedIds = [], treeData = []) => {
  const result = new Set(selectedIds);

  const walk = (nodes) => {
    nodes?.forEach((node) => {
      const isComboParent =
        node._id?.startsWith('dish_') &&
        !node._id?.startsWith('dish_combo_') &&
        node.children?.length > 0;

      if (isComboParent) {
        const hasSelectedChild = node.children.some((child) =>
          result.has(child._id)
        );
        if (hasSelectedChild) {
          result.add(node._id);
        }
      }

      if (node.children?.length) {
        walk(node.children);
      }
    });
  };

  walk(treeData);
  return Array.from(result);
};

// buyDishes 持久化含主菜 id，但 TreeSelect 不能把 combo 主节点放进 value（否则父节点全选，无法部分取消子菜）
export const buyDishesToTreeSelectValue = (buyDishes = [], treeData = []) => {
  const buyDishSet = new Set(buyDishes?.map((id) => String(id)) || []);
  const result = [];

  const walk = (nodes) => {
    nodes?.forEach((node) => {
      const isComboParent =
        node._id?.startsWith('dish_') &&
        !node._id?.startsWith('dish_combo_') &&
        node.children?.length > 0;

      if (isComboParent) {
        const mainId = String(node._id.replace('dish_', ''));
        const selectedChildren = node.children.filter((child) =>
          buyDishSet.has(child._id.replace('dish_combo_', ''))
        );

        if (selectedChildren.length > 0) {
          result.push(...selectedChildren.map((child) => child._id));
        } else if (buyDishSet.has(mainId)) {
          // 兼容旧数据：仅有主菜 id 时表示全部子菜参与
          result.push(...node.children.map((child) => child._id));
        }
      } else if (
        node._id?.startsWith('dish_') &&
        !node._id?.startsWith('dish_combo_')
      ) {
        const mainId = String(node._id.replace('dish_', ''));
        if (buyDishSet.has(mainId)) {
          result.push(node._id);
        }
      }

      if (node.children?.length) {
        walk(node.children);
      }
    });
  };

  walk(treeData);
  return result;
};

// 保存时移除没有选中子菜的 combo 主菜 id
export const normalizeStoredBuyDishes = (buyDishes = [], treeData = []) => {
  if (!buyDishes?.length) return buyDishes;

  const dishSet = new Set(buyDishes.map((id) => String(id)));
  const comboParentChildIds = new Map();

  const walk = (nodes) => {
    nodes?.forEach((node) => {
      const isComboParent =
        node._id?.startsWith('dish_') &&
        !node._id?.startsWith('dish_combo_') &&
        node.children?.length > 0;

      if (isComboParent) {
        const mainId = String(node._id.replace('dish_', ''));
        comboParentChildIds.set(
          mainId,
          node.children.map((child) =>
            child._id.replace('dish_combo_', '')
          )
        );
      }

      if (node.children?.length) {
        walk(node.children);
      }
    });
  };

  walk(treeData);

  return buyDishes.filter((id) => {
    const mainId = String(id);
    if (!comboParentChildIds.has(mainId)) return true;
    return comboParentChildIds
      .get(mainId)
      .some((childId) => dishSet.has(childId));
  });
};

export const transformTreeDishIds = (dishIds, removePrefix = false) => {
  if (dishIds?.length > 0) {
    return dishIds.map((each) => transformTreeDishId(each, removePrefix));
  }
  return dishIds;
};
