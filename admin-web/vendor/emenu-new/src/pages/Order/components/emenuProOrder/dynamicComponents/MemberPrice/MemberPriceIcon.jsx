import { serverUrl } from '@/utils/env_var'
import { useEmenuProThemeAdapter } from '../../components/EmenuProTheme'
import { useMemo } from 'react'

const MemberPriceIcon = ({ config }) => {
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

  return <img src={imgUrl} style={{ ...themeStyles }} />
}

export default MemberPriceIcon
