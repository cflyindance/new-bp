const setOptions = (menuGroups) => {
  return menuGroups.map((group) => {
    return {
      ...group,
      menuCategories: group.menuCategories?.map((cate) => {
        const { options: cateOptions, saleItems } = cate
        return {
          ...cate,
          saleItems: saleItems?.map((dish) => {
            return {
              ...dish,
              options: dish.options?.concat(cateOptions || []) || cateOptions,
            }
          }),
        }
      }),
    }
  })
}

export default setOptions
