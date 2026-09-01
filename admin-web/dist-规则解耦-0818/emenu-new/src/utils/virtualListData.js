const virtualListData = (allCateList) => {
  const categoryList = allCateList.map((cate) => {
    return {
      ...cate,
      list: cate.list
        ?.filter((d) => !d.hidden)
        ?.sort((a, b) => ~~b.showLarge - ~~a.showLarge),
      isHotPot: cate.list
        .filter((dish) => !dish.hidden)
        .every((dish) => dish?.comboList?.length > 0),
    }
  })
  // 手动根据grid 计算 col
  const countRowSize = () => {
    const width = window.innerWidth
    if (width >= 960) return { large: 2, normal: 4 }
    return {
      large: 1,
      normal: 2,
    }
  }
  const { large, normal } = countRowSize()
  const resolvedList = categoryList.reduce((pre, cur) => {
    const { isHotPot, hidden, id, name, list, icon } = cur
    if (hidden) return pre
    if (isHotPot) return pre.concat(cur)
    if (cur.list.length > 0) {
      const cateArr = []
      const cateObj = { id, name, icon, type: 'cateText' }
      cateArr.push(cateObj)
      // 计算large arr, normal arr
      const cateLargeDish = list.filter((dish) => dish.showLarge)
      const cateNormalDish = list.filter((dish) => !dish.showLarge)
      // 有大图菜
      if (cateLargeDish.length > 0) {
        let largeArrNum = cateLargeDish?.length / large
        const ceilNum = Math.ceil(largeArrNum)
        // 整数行large 菜品
        for (let i = 0; i < ceilNum; i++) {
          const listObj = { id, name, icon, type: 'cateList', isLargeRow: true }
          // 非整数行, 需要补足小图菜品, 只有一行展示两个大图菜时会有问题, 需要补两个小图菜
          listObj.list =
            cateLargeDish.length >= large
              ? cateLargeDish.splice(0, large)
              : [...cateLargeDish, ...cateNormalDish.splice(0, 2)]
          cateArr.push(listObj)
        }
      }
      if (cateNormalDish.length > 0) {
        let smallArrNum = cateNormalDish?.length / normal
        const ceilNum = Math.ceil(smallArrNum)
        for (let i = 0; i < ceilNum; i++) {
          const listObj = {
            id,
            name,
            icon,
            type: 'cateList',
            isLargeRow: false,
          }
          listObj.list =
            cateNormalDish.length >= normal
              ? cateNormalDish.splice(0, normal)
              : cateNormalDish
          cateArr.push(listObj)
        }
      }
      return pre.concat(cateArr)
    }
    return pre
  }, [])
  return resolvedList
}

export default virtualListData
