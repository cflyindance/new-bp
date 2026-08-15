import { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../../components/EmenuProTheme'
import { ButtonBase, makeStyles } from '@material-ui/core'
import { serverUrl } from '@/utils/env_var'

const useStyles = makeStyles(() => ({
  btnIcon: {
    width: '100%',
    height: '100%',
  },
}))

const ExpandMenuButton = ({ config, direction, onClick }) => {
  const { style, props } = config

  const classes = useStyles()
  const themeStyles = useEmenuProThemeAdapter(style, {
    exclude: ['visibility'],
  })
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
  }, [props.imgUrl, props.defaultImg, direction])

  return (
    <ButtonBase
      style={{
        ...themeStyles,
        position: 'absolute',
        ...(direction === 'horizontal' ? { top: 0 } : { left: 0 }),
      }}
      onClick={onClick}
    >
      <img src={imgUrl} className={classes.btnIcon} />
    </ButtonBase>
  )
}

export default ExpandMenuButton
