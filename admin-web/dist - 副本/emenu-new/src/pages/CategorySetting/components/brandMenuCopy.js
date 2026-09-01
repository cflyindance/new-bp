export const getIsBrandMenuConfigured = (item) => {
  const viewOnlyDishes =
    item?.dishType === 1 ? item.viewOnlyIds : item?.viewOnlyDishes

  return Boolean(item?.orderDishes?.length || viewOnlyDishes?.length)
}

export const copyBrandMenuSetting = (source, target, validItemNames) => {
  return {
    ...target,
    orderDishes: [...(source.orderDishes || [])],
    dishType: source.dishType ?? 0,
    viewOnlyDishes: (source.viewOnlyDishes || []).filter(
      (itemName) =>
        itemName !== target.itemName && validItemNames.includes(itemName)
    ),
    viewOnlyIds: [...(source.viewOnlyIds || [])],
  }
}
