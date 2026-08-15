import { cloneDeep } from 'lodash-es'

export const filterMenuById = (menuData, config, currentIdx, key) => {
  const otherDishesIds = config
    .filter((_, idx) => currentIdx !== idx)
    .reduce((pre, cur) => {
      return pre.concat(cur[key])
    }, [])
  return deepFilter(cloneDeep(menuData), otherDishesIds)
}

export const deepFilter = (menuData = [], dishes = []) => {
  return menuData.filter((each) => {
    if (each.children?.length) {
      each.children = deepFilter(each.children, dishes)
    }
    if (each.children?.length === 0) return false
    return !dishes.includes(each.value)
  })
}

export const filterMenuByDefaultDish = (menuData, defaultDishIds) => {
  return menuData.map((group) => {
    return {
      ...group,
      list: group.list.map((cate) => {
        return {
          ...cate,
          list: cate.list.filter((dish) => !defaultDishIds.includes(dish.id)),
        }
      }),
    }
  })
}
