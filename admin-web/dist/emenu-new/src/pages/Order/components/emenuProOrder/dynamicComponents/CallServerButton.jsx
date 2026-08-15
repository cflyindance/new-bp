import React, { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { serverUrl } from '@/utils/env_var'
import { ButtonBase, makeStyles } from '@material-ui/core'
import ServerButton from '@/components/ServerButton'
import { LoadingOutlined } from '@ant-design/icons'

const useStyles = makeStyles(() => ({
  btnIcon: {
    width: '100%',
    height: '100%',
  },
  btnLoading: {
    position: 'absolute',
    zIndex: 1,
  },
  btnDisabled: {
    filter: 'grayscale(100%) brightness(0.6)',
  },
}))

const CallServerButton = ({ config }) => {
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
    <ServerButton
      renderButton={({ onClick, isLoading }) => {
        return (
          <ButtonBase
            style={{ ...themeStyles, position: 'absolute' }}
            onClick={onClick}
            disabled={isLoading}
            className={isLoading ? classes.btnDisabled : undefined}
          >
            <img src={imgUrl} className={classes.btnIcon} />
            {isLoading && <LoadingOutlined className={classes.btnLoading} />}
          </ButtonBase>
        )
      }}
    />
  )
}

export default React.memo(CallServerButton)
