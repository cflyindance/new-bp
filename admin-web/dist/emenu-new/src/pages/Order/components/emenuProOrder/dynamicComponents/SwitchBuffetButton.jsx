import React, { useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { serverUrl } from '@/utils/env_var'
import { ButtonBase, makeStyles } from '@material-ui/core'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useBoolean } from 'ahooks'
import BuffetSelect from '@/components/BuffetSelect'

const useStyles = makeStyles(() => ({
  btnIcon: {
    width: '100%',
    height: '100%',
  },
}))

const SwitchBuffetButton = ({ config }) => {
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

  const [, setOrderAdminPermission] = useGlobalState('orderAdminPermission')

  const { isBrandModeOpen } = useClassifyOrderMode()
  const [menuClassify] = useGlobalState('selectedMenuClassify')

  const isBrandMode = useMemo(() => {
    return isBrandModeOpen && !menuClassify
  }, [isBrandModeOpen, menuClassify])

  const closeAdminLogin = () => setOrderAdminPermission({ open: false })

  const [
    openBuffetSelect,
    { setTrue: setOpenBuffetSelect, setFalse: setCloseBuffetSelect },
  ] = useBoolean()

  const switchBuffet = () => {
    setOrderAdminPermission({
      open: true,
      permission: 'buffet',
      next: () => {
        closeAdminLogin()
        setOpenBuffetSelect()
      },
    })
  }

  if (!isBrandMode) {
    return null
  }

  return (
    <>
      <ButtonBase
        style={{ ...themeStyles, position: 'absolute' }}
        onClick={switchBuffet}
      >
        <img src={imgUrl} className={classes.btnIcon} />
      </ButtonBase>
      <BuffetSelect
        open={openBuffetSelect}
        onCancel={setCloseBuffetSelect}
        onSubmit={setCloseBuffetSelect}
        isInOrder={true}
      />
    </>
  )
}

export default React.memo(SwitchBuffetButton)
