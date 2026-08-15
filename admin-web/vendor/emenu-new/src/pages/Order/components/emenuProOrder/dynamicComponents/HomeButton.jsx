import React, { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { serverUrl } from '@/utils/env_var'
import { useNavigate } from 'react-router-dom'
import { ButtonBase, makeStyles } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  btnIcon: {
    width: '100%',
    height: '100%',
  },
}))

const HomeButton = ({ config }) => {
  const { style, props } = config

  const classes = useStyles()
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

  const navigate = useNavigate()
  const onGoHome = () => {
    navigate('/')
  }

  return (
    <ButtonBase
      style={{ ...themeStyles, position: 'absolute' }}
      onClick={onGoHome}
    >
      <img src={imgUrl} className={classes.btnIcon} />
    </ButtonBase>
  )
}

export default React.memo(HomeButton)
