import { getStorageValue } from '@/utils/storage'
import { roundToPrecision } from './number'

// 根据categoryId 计算商品信息
export const distributeByCategoryId = (dishes, isInCanada) => {
  return dishes
    .reduce((pre, cur) => {
      const { categoryId, id, count, realPrice, price, taxIds, taxFreeMinQty } =
        cur
      const actualPrice = realPrice ?? price
      const goodsPrice = actualPrice * count
      const sameCateIdx = pre?.findIndex(
        (each) => each.categoryId === categoryId
      )
      if (sameCateIdx === -1) {
        pre.push({
          categoryId,
          ids: [id], // 记录当前类下商品 id
          allCount: count,
          allPrice: goodsPrice,
          taxIds, // 同一个cate下 taxIds一致
          taxFreeMinQty: isInCanada ? (taxFreeMinQty ?? 0) : null, // null -> 不在加拿大不生效
        })
      } else {
        const cateInfo = pre[sameCateIdx]
        cateInfo.ids.push(id)
        cateInfo.allCount = cateInfo.allCount + count
        cateInfo.allPrice = cateInfo.allPrice + goodsPrice
      }
      return pre
    }, [])
    .map((each) => {
      return {
        ...each,
        allPrice: roundToPrecision(each.allPrice),
      }
    })
}

// 当前类下是否有加拿大税
export const isExistCATax = (taxes) => {
  // 有增值税就是加拿大税
  const CATax = taxes?.find(
    (each) => each.taxIncreaseRate && Number(each.taxIncreaseRate) > 0
  )
  return !!CATax
}

// taxFreeMinQty 是否合法
export const isExistTaxFreeMinQty = (isInCanada, hasCATax, taxFreeMinQty) => {
  // 不在加拿大/不包含加拿大税
  if (!isInCanada || !hasCATax) {
    return false
  }
  return (taxFreeMinQty ?? 0) > 0
}

// 是否在canada
export const isInCanada = () => {
  const systemConfig = getStorageValue('emenu_system')
  return (
    systemConfig?.find(
      (each) => each.name === 'COUNTRY_STATES_PROVINCE_TERRITORY'
    )?.value === 'ONTARIO'
  )
}

// 计算增值税, 非加拿大区域不生效
export const getValueAddedRate = (isInCanada, taxIncreaseRate) => {
  return isInCanada ? (taxIncreaseRate ?? 0) : 0
}

// 计算实际税率
export const getFinalRate = (
  isInCanada,
  priceLimit,
  priceLimitByTaxType,
  rate,
  valueAddedTax
) => {
  if (!isInCanada) {
    return rate
  }
  // 是否达到增值税
  const isOverPriceLimit = priceLimitByTaxType > (priceLimit ?? 0)
  if (isOverPriceLimit) {
    return rate + valueAddedTax
  }
  return rate
}

// 计算最后dish tax
export const countFinalTax = (
  itemTax,
  countByCate,
  taxFreeMinQty,
  isValidMinQty
) => {
  if (!isValidMinQty) {
    return itemTax
  }
  // 当前菜品类下总数大于等于最小免税量时 免税, 否则计税
  return countByCate >= taxFreeMinQty ? 0 : itemTax
}

// 如果两个类商品 的 taxId存在一致的。 且这个taxId 是加拿大税， 那么price就要按照两个类下所有商品的和来算
export const getFinalPriceLimitByTaxId = (goods, taxId, catsCart, id) => {
  // 包含当前税的 category
  const includeThisTaxCate = catsCart.filter((cate) =>
    cate.taxIds?.includes(taxId)
  )
  // 查找是否存在当前tax下 已满足可免税的cate
  const isFreeTaxCate = includeThisTaxCate?.find(
    (each) => each.taxFreeMinQty && each.allCount >= each.taxFreeMinQty
  )
  let finalTaxLimitPrice
  // 没有满足可免税数量的cate priceLimit是cate下菜品price相加
  if (!isFreeTaxCate) {
    const limitPriceByAllGoods = goods.reduce((pre, cur) => {
      const { count, realPrice, price, taxIds } = cur
      if (!taxIds?.includes(taxId)) return pre
      const actualPrice = realPrice ?? price
      const goodsPrice = actualPrice * count
      return pre + goodsPrice
    }, 0)
    finalTaxLimitPrice = roundToPrecision(limitPriceByAllGoods)
  } else {
    // 有满足可免税数量的cate, 每个priceLimit按照每个cate总价来算
    finalTaxLimitPrice = includeThisTaxCate?.find((each) =>
      each.ids.includes(id)
    )?.allPrice
  }
  return finalTaxLimitPrice
}
