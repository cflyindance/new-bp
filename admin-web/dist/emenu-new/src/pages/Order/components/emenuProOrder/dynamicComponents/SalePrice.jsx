import React, { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import useShowBenefitPrice from '@/hooks/useShowBenefitPrice'

const SalePriceComponent = ({ config, saleItem }) => {
  const { style } = config

  const themeStyles = useEmenuProThemeAdapter(style)

  const { showPrice, isShowPrice } = useShowBenefitPrice({
    price: saleItem.price,
    itemPrices: saleItem.itemPrices,
    benefitPrice: saleItem.benefitPrice,
    optionList: saleItem.optionList,
    marketPriceItem: saleItem.marketPriceItem,
  })

  if (!isShowPrice) return null

  return (
    <div style={{ ...themeStyles }}>
      <span>{showPrice}</span>
    </div>
  )
}

const SalePrice = ({ config, saleItemMap }) => {
  const saleItem = useMemo(() => {
    const saleItemId = Number(config.props.itemId)
    const saleItem = saleItemMap.get(saleItemId)
    return saleItem
  }, [config.props.itemId, saleItemMap])

  if (!saleItem) return null
  return <SalePriceComponent config={config} saleItem={saleItem} />
}

export default React.memo(SalePrice)
