import React, { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { serverUrl } from '@/utils/env_var'
import { ButtonBase, makeStyles } from '@material-ui/core'
import LanguageChange from '@/components/LanguageChange'

const useStyles = makeStyles(() => ({
  btnIcon: {
    width: '100%',
    height: '100%',
  },
}))

const ChangeLanguageButton = ({ config }) => {
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

  return (
    <LanguageChange
      renderButton={({ onClick }) => {
        return (
          <ButtonBase
            style={{ ...themeStyles, position: 'absolute' }}
            onClick={onClick}
          >
            <img src={imgUrl} className={classes.btnIcon} />
          </ButtonBase>
        )
      }}
    />
  )
}

export default React.memo(ChangeLanguageButton)
