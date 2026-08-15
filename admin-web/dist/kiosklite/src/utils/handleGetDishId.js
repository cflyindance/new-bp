export const handleGetDishId = (item) => {
  let ids = [];

  const recurse = (item) => {
    if (!Array.isArray(item)) {
      ids.push(item.id);
      if (item.saleItems?.length > 0) {
        recurse(item.saleItems);
      }
      if (item.comboSections?.length > 0) {
        const newComboSections = item.comboSections.map((each) => ({
          ...each,
          id: `${item.id}${each.id}`,
        }));
        recurse(newComboSections);
      }
    } else {
      item.forEach((each) => recurse(each));
    }
  };

  recurse(item);
  return ids;
};

export const getUniqueId = (ids) => {
  const newIds = ids.reduce((pre, cur) => {
    if (!pre.length) return pre.concat(cur);
    const isExist = pre.find((each) => each === cur);
    return isExist ? pre : pre.concat(cur);
  }, []);
  return newIds;
};
