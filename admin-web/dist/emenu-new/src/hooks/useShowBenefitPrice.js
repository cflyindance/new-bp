import { useMemo } from 'react'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useTranslation } from 'react-i18next'
import { cloneDeep } from 'lodash-es'

const hasPrice = (list) => {
  if (!Array.isArray(list)) return false
  return list.some((item) => {
    if (item.price > 0) return true
    if (item.options && hasPrice(item.options)) return true
    return false
  })
}

const useShowBenefitPrice = ({
  price,
  itemPrices,
  benefitPrice,
  optionList,
  marketPriceItem,
  isInFreeQuantity,
}) => {
  const { t } = useTranslation()

  const { getFinalConfigById } = useSystemConfig()
  const isDisplayZeroPrice = getFinalConfigById(65)?.open

  const isHasItemPrice = useMemo(
    () => itemPrices?.some((each) => each.price > 0),
    [itemPrices]
  )

  const isShowPrice = useMemo(() => {
    if (isDisplayZeroPrice || marketPriceItem) return true
    if (isInFreeQuantity) return false
    if (price > 0) return true
    if (!itemPrices?.length && !optionList?.length && price === 0) return false
    if (isHasItemPrice) return true
    return hasPrice(optionList)
  }, [
    isDisplayZeroPrice,
    price,
    itemPrices,
    optionList,
    isHasItemPrice,
    marketPriceItem,
    isInFreeQuantity,
  ])

  const showPrice = useMemo(() => {
    if (marketPriceItem) return t('Order.market_price')
    if (itemPrices?.length) {
      const minPrice = isHasItemPrice
        ? cloneDeep(itemPrices).sort((a, b) => a.price - b.price)[0]?.price
        : 0
      return minPrice === 0 ? '$0.00' : `$${minPrice?.toFixed(2)}+`
    }
    let normalPrice = price ? `$${price?.toFixed(2)}` : '$0.00'
    if (optionList?.length > 0 && hasPrice(optionList)) {
      normalPrice = `${normalPrice}+`
    }
    return normalPrice
  }, [price, itemPrices, optionList, isHasItemPrice, marketPriceItem])

  const actualBenefitPrice = useMemo(() => {
    // 0也是有意义的
    if (benefitPrice || Number(benefitPrice) === 0)
      return `$${benefitPrice.toFixed(2)}`
    const detailBenefitsPrices = itemPrices
      ?.filter((each) => each.benefitPrice)
      ?.sort((a, b) => a.benefitPrice - b.benefitPrice)
    if (detailBenefitsPrices?.length)
      return `$${detailBenefitsPrices[0]?.benefitPrice?.toFixed(2)}+`
    return null
  }, [itemPrices, benefitPrice])

  const isHasBenefitPrice = useMemo(
    () => !!actualBenefitPrice,
    [actualBenefitPrice]
  )

  return {
    showPrice,
    actualBenefitPrice,
    isHasBenefitPrice,
    isShowPrice,
  }
}

export default useShowBenefitPrice
