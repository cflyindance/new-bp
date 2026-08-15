import React, { useMemo } from 'react'
import useShowBenefitPrice from '@/hooks/useShowBenefitPrice'
import { useEmenuProThemeAdapter } from '../../components/EmenuProTheme'
import MemberPriceIcon from './MemberPriceIcon'
import MemberPriceValue from './MemberPriceValue'

const MemberPriceComponent = ({ config, saleItem }) => {
  const { style, children } = config

  const themeStyles = useEmenuProThemeAdapter(style)

  const { isHasBenefitPrice, isShowPrice, actualBenefitPrice } =
    useShowBenefitPrice({
      price: saleItem.price,
      itemPrices: saleItem.itemPrices,
      benefitPrice: saleItem.benefitPrice,
      optionList: saleItem.optionList,
      marketPriceItem: saleItem.marketPriceItem,
    })

  if (!(isShowPrice && !saleItem.marketPriceItem && isHasBenefitPrice)) {
    return null
  }

  return (
    <div style={{ ...themeStyles }}>
      {children.map((childConfig) => {
        switch (childConfig.component) {
          case 'MemberPriceIcon':
            return <MemberPriceIcon config={childConfig} />
          case 'MemberPriceValue':
            return (
              <MemberPriceValue
                config={childConfig}
                value={actualBenefitPrice}
              />
            )
          default:
            return null
        }
      })}
    </div>
  )
}

const MemberPrice = ({ config, saleItemMap }) => {
  const saleItem = useMemo(() => {
    const saleItemId = Number(config.props.itemId)
    const saleItem = saleItemMap.get(saleItemId)
    return saleItem
  }, [config.props.itemId, saleItemMap])

  if (!saleItem) return null
  return <MemberPriceComponent config={config} saleItem={saleItem} />
}

export default React.memo(MemberPrice)
