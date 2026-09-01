import { memo, useMemo, useState } from 'react'
import menu from '@/assets/image/noimage-menu.png'
import dish from '@/assets/image/noimage-dish.png'
import { serverUrl } from '@/utils/env_var'

const possibleExtensions = ['png', 'jpeg', 'jpg', 'PNG', 'JPEG', 'JPG']

const ImgFallback = ({ src, alt = '', type = 'dish', itemName, ...rest }) => {
  const [isError, setIsError] = useState(true)
  const [tryTimes, setTryTimes] = useState(0)
  const fallbackSrc = useMemo(() => {
    return type === 'menu' ? menu : dish
  }, [type])

  // 检查是否有手动放的图片
  const onErrorTryAgain = (e) => {
    e.target.onerror = null
    // 未找到图片 用默认图
    if (tryTimes >= possibleExtensions.length || !itemName) {
      e.target.src = fallbackSrc
      return
    }
    const imageExtend = possibleExtensions[tryTimes]
    const imageName = `${itemName}.${imageExtend}`
    e.target.src = `${serverUrl}img/gallery/emenu/${imageName}`
    setTryTimes((prev) => prev + 1)
  }

  return (
    <img
      src={src}
      alt={alt}
      style={type === 'dish' && isError ? { background: '#edf0f2' } : null}
      onLoad={() => {
        setIsError(false)
        setTryTimes(0)
      }}
      onError={(e) => {
        onErrorTryAgain(e)
      }}
      {...rest}
    />
  )
}

export default memo(ImgFallback)
