import React, { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import RedeemPoint from '@/components/RedeemPoint'
import { serverUrl } from '@/utils/env_var'

const MembershipPointsIcon = ({ config }) => {
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

  return <img src={imgUrl} alt="points" style={{ ...themeStyles }} />
}

const MembershipPointsValue = ({ config, value }) => {
  const { style } = config
  const themeStyles = useEmenuProThemeAdapter(style)

  return <div style={{ ...themeStyles }}>{value}</div>
}

const MembershipPointsComponent = ({ config, saleItem }) => {
  const { style, props, children = [] } = config
  const normalizedStyle = useMemo(
    () => ({
      ...style,
      ...(typeof style.padding === 'number'
        ? { padding: `${style.padding}px` }
        : {}),
    }),
    [style]
  )
  const themeStyles = useEmenuProThemeAdapter(normalizedStyle, {
    exclude: ['backgroundColor'],
  })
  const imgUrl = useMemo(() => {
    const defaultImg = props.defaultImg
    if (defaultImg) {
      const defaultImgArray = defaultImg.split('/')
      const imageName = defaultImgArray[defaultImgArray.length - 1]
      return `${serverUrl}emenuPro/images/${imageName}`
    }
    return undefined
  }, [props.defaultImg])

  return (
    <div style={{ ...themeStyles }}>
      {children.length > 0 ? (
        children.map((childConfig) => {
          switch (childConfig.component) {
            case 'MembershipPointsIcon':
              return (
                <MembershipPointsIcon
                  config={childConfig}
                  key={childConfig.id}
                />
              )
            case 'MembershipPointsValue':
              return (
                <MembershipPointsValue
                  config={childConfig}
                  key={childConfig.id}
                  value={saleItem.crmIntegrationPoints}
                />
              )
            default:
              return null
          }
        })
      ) : (
        <RedeemPoint points={saleItem.crmIntegrationPoints} imgUrl={imgUrl} />
      )}
    </div>
  )
}

const MembershipPoints = ({ config, crmIntegrationPointItemMap }) => {
  const saleItem = useMemo(() => {
    const saleItemId = Number(config.props.itemId)
    return crmIntegrationPointItemMap.get(saleItemId)
  }, [config.props.itemId, crmIntegrationPointItemMap])

  if (!saleItem) return null
  return <MembershipPointsComponent config={config} saleItem={saleItem} />
}

export default React.memo(MembershipPoints)
