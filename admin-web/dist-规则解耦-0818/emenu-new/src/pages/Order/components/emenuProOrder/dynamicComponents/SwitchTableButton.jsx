import React, { Suspense, lazy, useMemo } from 'react'
import { getStorageValue } from '@/utils/storage'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { ButtonBase, makeStyles } from '@material-ui/core'
import { useBoolean } from 'ahooks'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { serverUrl } from '@/utils/env_var'
import { useGlobalState } from '@/hooks/useGlobalState'

const AdminSettings = lazy(() => import('@/components/AdminSettings'))

const useStyles = makeStyles(() => ({
  btnIcon: {
    width: '100%',
    height: '100%',
  },
}))

const SwitchTableButton = ({ config }) => {
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

  const tableInfo = getStorageValue('emenu_table', {})
  const { currentTable } = tableInfo

  const [
    openAdminSetting,
    { setTrue: setOpenAdminSetting, setFalse: setCloseAdminSetting },
  ] = useBoolean()

  const closeAdminLogin = () => setOrderAdminPermission({ open: false })

  const switchTable = () => {
    setOrderAdminPermission({
      open: true,
      permission: 'tablePermission',
      next: () => {
        closeAdminLogin()
        setOpenAdminSetting()
      },
    })
  }

  if (!currentTable?.id) return null

  return (
    <>
      <ButtonBase
        style={{ ...themeStyles, position: 'absolute' }}
        onClick={switchTable}
      >
        <img src={imgUrl} className={classes.btnIcon} />
      </ButtonBase>
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <AdminSettings
          isOpen={openAdminSetting}
          handleClose={setCloseAdminSetting}
        />
      </Suspense>
    </>
  )
}

export default React.memo(SwitchTableButton)
