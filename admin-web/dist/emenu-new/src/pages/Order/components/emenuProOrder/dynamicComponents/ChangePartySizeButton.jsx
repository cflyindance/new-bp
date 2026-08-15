import React, { useContext, useMemo } from 'react'
import { getStorageValue } from '@/utils/storage'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { ButtonBase, makeStyles } from '@material-ui/core'
import { useBoolean } from 'ahooks'
import { serverUrl } from '@/utils/env_var'
import useSystemConfig from '@/hooks/useSystemConfig'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import PickSize from '@/components/PickSize'
import GlobalStorageContext from '@/context/GlobalStorageContext'
import { useGlobalState } from '@/hooks/useGlobalState'

const useStyles = makeStyles(() => ({
  btnIcon: {
    width: '100%',
    height: '100%',
  },
}))

const ChangePartySizeButton = ({ config }) => {
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

  const { getFinalConfigById } = useSystemConfig()
  const isNeedSelectGuest = getFinalConfigById(11)?.open

  const { isBrandModeOpen } = useClassifyOrderMode()

  const [
    openPickSize,
    { setTrue: setOpenPickSize, setFalse: setClosePickSize },
  ] = useBoolean()

  const closeAdminLogin = () => setOrderAdminPermission({ open: false })

  const switchPartySize = () => {
    const isShowPartySize = getFinalConfigById(15)?.open
    if (isShowPartySize) {
      setOpenPickSize()
      return
    }
    setOrderAdminPermission({
      open: true,
      permission: 'showPartySize',
      next: () => {
        closeAdminLogin()
        setOpenPickSize()
      },
    })
  }

  const storageInfo = useContext(GlobalStorageContext)

  const companyInfo = useMemo(() => {
    return storageInfo?.companyInfo
  }, [storageInfo])

  if (!isNeedSelectGuest || isBrandModeOpen) return null

  return (
    <>
      <ButtonBase
        style={{ ...themeStyles, position: 'absolute' }}
        onClick={switchPartySize}
      >
        <img src={imgUrl} className={classes.btnIcon} />
      </ButtonBase>
      <PickSize
        sizes={15}
        open={openPickSize}
        onCancel={setClosePickSize}
        onSubmit={setClosePickSize}
        name={companyInfo?.name}
        selectedNum={getStorageValue('emenu_partySize')}
      />
    </>
  )
}

export default React.memo(ChangePartySizeButton)
