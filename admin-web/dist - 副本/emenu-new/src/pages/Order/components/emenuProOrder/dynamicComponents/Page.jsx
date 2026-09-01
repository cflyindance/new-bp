import { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import CacheImage from '@/components/CacheImage'
import { KeepAlive } from 'react-activation'

const Page = ({ config, imgRef }) => {
  const { style, props } = config

  const themeStyles = useEmenuProThemeAdapter(style)
  const imgUrl = useMemo(
    () => (props.imgUrl ? '/kpos/' + props.imgUrl : ''),
    [props.imgUrl]
  )

  return imgUrl ? (
    <KeepAlive cacheKey={imgUrl} name={`Page-${imgUrl}`}>
      <CacheImage
        src={imgUrl}
        style={{ ...themeStyles, position: 'absolute' }}
        imgRef={imgRef}
      />
    </KeepAlive>
  ) : null
}

Page.displayName = 'Page'
export default Page
