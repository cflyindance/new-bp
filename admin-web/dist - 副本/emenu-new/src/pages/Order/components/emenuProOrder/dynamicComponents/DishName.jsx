import React, { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { useTranslation } from 'react-i18next'

const DishNameComponent = ({ config, saleItem }) => {
  const { style } = config

  const themeStyles = useEmenuProThemeAdapter(style)

  const { t } = useTranslation()

  return (
    <div style={{ ...themeStyles }}>
      {t(saleItem.id, { defaultValue: saleItem.name, ns: 'dish' })}
    </div>
  )
}

const DishName = ({ config, saleItemMap }) => {
  const saleItem = useMemo(() => {
    const saleItemId = Number(config.props.itemId)
    const saleItem = saleItemMap.get(saleItemId)
    return saleItem
  }, [config.props.itemId, saleItemMap])

  if (!saleItem) return null
  return <DishNameComponent config={config} saleItem={saleItem} />
}

export default React.memo(DishName)
