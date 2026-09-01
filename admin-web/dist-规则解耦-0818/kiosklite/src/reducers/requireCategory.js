import { SETREQUIRECATEGORY } from '../constants/actionTypes'
import cloneDeep from 'lodash/cloneDeep'

const initState = {
  requireCategoryList: [],
}

export default function requireCategoryList(state = initState.requireCategoryList, action) {
  switch (action.type) {
    case SETREQUIRECATEGORY:
      return filterCategoryList(action.data)
    default:
      return state
  }
}

function filterCategoryList(menuData) {
  let requireCategoryList = []
  menuData.forEach((item) => {
    if (item.menuCategories?.length) {
      for (let i = 0; i < item.menuCategories.length; i++) {
        if (item.menuCategories[i].saleItems?.length) {
          let newSaleItems = item.menuCategories[i].saleItems
          let bool = newSaleItems.filter((nk) => {
            return (!nk.hiddenItem) || (nk.hiddenItem && nk.isFreeItem)
          })
          if (!bool.length) {
            continue
          } else {
            if (item.menuCategories[i].requireCategory) {
              requireCategoryList.push(cloneDeep(item.menuCategories[i]))
            }
          }
        }
      }
    }
  })

  return requireCategoryList
}
