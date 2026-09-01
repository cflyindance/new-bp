export const getDefaultBrandSetting = (typeA, typeB, { getTypeMark } = {}) => {
  const itemList = []
  typeA.forEach((typeAItem) => {
    typeB.forEach((typeBItem) => {
      const itemName = `${typeAItem}-${typeBItem}`
      const data = {
        itemName,
        buffetId: null,
        orderDishes: [],
        // 按类别配置
        viewOnlyDishes: [],
        typeAItem,
        typeBItem,
        // 配置类型
        dishType: 1,
        // 按菜配置
        viewOnlyIds: [],
      }
      if (getTypeMark && getTypeMark(typeAItem)) {
        data.mark = getTypeMark(typeAItem)
      }
      itemList.push(data)
    })
  })
  return itemList
}
