import React, { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { serverUrl } from '@/utils/env_var'

const SoldOutFlagComponent = ({ config, saleItem }) => {
  const { style, props } = config

  const themeStyles = useEmenuProThemeAdapter(style)

  const imgUrl = useMemo(() => {
    const imgUrl = props.imgUrl
    if (imgUrl) return serverUrl + imgUrl
    const defaultImg = props.defaultImg
    if (defaultImg) {
      const defaultImgArray = defaultImg.split('/')
      const imageName = defaultImgArray[defaultImgArray.length - 1]
      return `${serverUrl}emenuPro/images/${imageName}`
    }
    return undefined
  }, [props.imgUrl, props.defaultImg])

  const soldOut = useMemo(() => saleItem.outOfStock, [saleItem.outOfStock])

  return soldOut ? (
    <img src={imgUrl} style={{ ...themeStyles, position: 'absolute' }} />
  ) : null
}

const SoldOutFlag = ({ config, saleItemMap }) => {
  const saleItem = useMemo(() => {
    const saleItemId = Number(config.props.itemId)
    return saleItemMap.get(saleItemId)
  }, [config.props.itemId, saleItemMap])

  if (!saleItem) return null
  return <SoldOutFlagComponent config={config} saleItem={saleItem} />
}

export default React.memo(SoldOutFlag)
