// 处理菜一级option
const resolveDishOption = (dish) => {
  const { optionList, id } = dish
  let newOptionList = optionList
  // 一级option
  const noSubs = optionList?.filter(
    (each) => !each?.options?.length && each.type === 'option'
  )
  if (noSubs?.length > 0) {
    // 二级option
    const hasSubs = optionList?.filter((each) => each?.options?.length)
    const tierOneOptions = {
      id: `${id}season`,
      label: 'season',
      price: 0,
      type: 'option',
      required: false,
      options: noSubs?.map((each) => {
        return {
          ...each,
          onlyFirstLevel: true,
          name: each.label,
          count: 1,
        }
      }),
    }
    newOptionList = hasSubs.concat(tierOneOptions)
  }
  return {
    ...dish,
    optionList: newOptionList,
  }
}

const afterResolveOption = (data) => {
  return data.map((group) => {
    return {
      ...group,
      list: group.list.map((category) => {
        return {
          ...category,
          list: category.list.map((dish) => {
            if (dish.isSpecialCombo) {
              dish.comboList = dish.comboList?.map((item) =>
                resolveDishOption(item)
              )
            }
            // 有详情的子菜支持一级option
            if (dish.optionList?.length > 0) {
              dish.optionList = dish.optionList.map((optionItem) => {
                if (!optionItem.options?.length) return optionItem
                return {
                  ...optionItem,
                  options: optionItem.options.map((o) => {
                    return o.optionList?.length > 0 ? resolveDishOption(o) : o
                  }),
                }
              })
            }
            return resolveDishOption(dish)
          }),
        }
      }),
    }
  })
}

export default afterResolveOption
