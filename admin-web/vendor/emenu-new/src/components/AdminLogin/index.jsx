import {
  alpha,
  Box,
  makeStyles,
  Modal,
  Button,
  Typography,
  InputBase,
  Paper,
} from '@material-ui/core'
import { common as commonColor } from '@material-ui/core/colors'
import BackspaceRoundedIcon from '@material-ui/icons/BackspaceRounded'
import { useEffect, useState, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchTable } from '@/services/tables'
import { clearOrderFromTable } from '@/services/orders'
import { useRequest } from 'ahooks'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { listPrivileges } from '@/services/system'
import { FeedbackErrorIcon } from '../common/SvgIcons'
import LoadingOverlay from '../common/LoadingOverlay'
import { getStorageValue } from '@/utils/storage'
import Toast from '@/components/Toast'
import useSystemConfig from '@/hooks/useSystemConfig'

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: commonColor.white,
    outline: 'none',
  },
  permission: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(3),
    maxWidth: 1000,
    background:
      'linear-gradient(90deg, rgba(57, 9, 6, 0.7) 0%, rgba(42, 42, 42, 0.7) 50%, rgba(34, 34, 34, 0.7) 100%)',
  },
  permissionError: {
    color: theme.palette.error.main,
  },
  permissionIcon: {
    fontSize: 30,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: -0.4,
    color: 'inherit',
  },
  permissionMessage: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 1.2,
    color: theme.palette.common.white,
  },
  inputRoot: {
    // margin: theme.spacing(2, 0, 1),
    width: 320,
  },
  input: {
    fontFamily: '"Verdana", "sans-serif"',
    padding: 0,
    fontSize: 20,
    letterSpacing: '1em',
    textAlign: 'center',
    textIndent: '1em',
    color: alpha(commonColor.white, 0.8),
  },
  keysList: {
    marginTop: theme.spacing(1.2),
    marginBottom: theme.spacing(2),
    maxWidth: 'calc((100vh - 210px) / 4 * 3 + 30px)',
    width: '40vh',
    minWidth: '30vh',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    // gap: '16px',
    flex: '1 1 90%',
  },
  keyItem: {
    margin: 8,
    fontSize: '3.5vh',
    flex: '1 1 calc(33.33% - 16px)',
    // aspectRatio: '1 / 1',
    padding: 'calc((33.33% - 16px - 1.5em)/2) 0',
    boxSizing: 'border-box',
    color: commonColor.white,
    backgroundColor: alpha(commonColor.white, 0.3),
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backItem: {
    margin: 8,
    flex: '1 1 calc(33.33% - 16px)',
    width: '5vw',
    // aspectRatio: '1 / 1',
    padding: 'calc((33.33% - 16px - 2.5em)/2) 0',
    boxSizing: 'border-box',
    color: commonColor.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delIcon: {
    fontSize: '3.5vh',
  },
  enterBtn: {
    width: 208,
    height: 53,
    fontSize: 18,
    // fontWeight: 600,
    borderRadius: theme.shape.borderRadius * 0.5,
    margin: '0 0.5rem',
  },
  closeIcon: {
    position: 'absolute',
    top: -50,
    right: -50,
    padding: 10,
    boxSizing: 'content-box',
  },
  footerBtn: {
    display: 'flex',
    // gap: '1rem',
  },
}))

function AdminLogin({ isOpen, handleClose, permission = '', next }) {
  const classes = useStyles()
  const { t } = useTranslation()
  const [passcode, setPasscode] = useState('')
  const [tip, setTip] = useState('AdminLogin.tip_initial')
  const [loginEffectLoading, setLoginEffectLoading] = useState(false)
  const [, setUserInfo] = useLocalStorage('emenu_user', {})
  const { getFinalConfigById } = useSystemConfig()
  const restrictNewOrder = getFinalConfigById(8)?.open
  const switchTableBeforeStartOrder = getFinalConfigById(73)?.open

  // listPrivileges 请求参数
  const listPrivilegesRequest = () => {
    const sessionKey = getStorageValue('emenu_auth')?.sessionKey
    return listPrivileges({
      passcode,
      sessionKey,
    })
  }

  const { loading: loginLoading, run } = useRequest(listPrivilegesRequest, {
    manual: true,
    // loadingDelay: 3000,
    onSuccess: async (res) => {
      setLoginEffectLoading(true)
      const { userId, userName, roles, function: rules } = res
      const currentTable = getStorageValue('emenu_table')?.currentTable || {}
      const { id: tableId } = currentTable
      const handleSetError = (errorMsg) => {
        setTip(`${errorMsg}`)
        setLoginEffectLoading(false)
      }
      // 下单时没有服务员信息
      if (permission === 'setOrderUser') {
        setUserInfo({ userId, userName, roles, rules })
      }
      // 检查 有没有切桌权限
      if (permission === 'tablePermission' && tableId) {
        const isHasChangeTableAuth = res.function?.find(
          (fun) => fun.name === 'CHANGE_TABLE'
        )
        if (!isHasChangeTableAuth) {
          handleSetError('AdminLogin.permission_changeTable')
          return
        }
      }
      // 不限制食客提前开单， 选桌/切桌时记录服务员信息
      if (
        (!restrictNewOrder || switchTableBeforeStartOrder) &&
        permission === 'tablePermission'
      ) {
        setUserInfo({ userId, userName, roles, rules })
      }
      // 限制食客提前开单，开单时记录服务员信息
      if (
        restrictNewOrder &&
        !switchTableBeforeStartOrder &&
        permission === 'startOrder'
      ) {
        setUserInfo({ userId, userName, roles, rules })
      }
      const currentOrder = getStorageValue('emenu_table')?.currentOrder || {}
      if (permission === 'tableClear') {
        // 检查有没有清桌权限
        const isHasClearTableAuth = res.function?.find(
          (fun) => fun.name === 'CLEAR_TABLE'
        )
        if (!isHasClearTableAuth) {
          handleSetError('AdminLogin.permission_clearTable')
          return
        }
        const tableRes = await fetchTable(tableId)
        if (!tableRes || Object.keys(tableRes)?.length === 0) {
          handleSetError('table.failed_to_fetch_table')
          return
        }
        const orderIds = tableRes?.table?.orders.map((i) => i.id)
        const table = {
          tableId,
          orderIds,
        }
        const info = await clearOrderFromTable(table)
        if (!info?.data?.result?.successful) {
          handleSetError('table.failed_to_clear_table')
          return
        }
        Toast.success(`${t('Landing.clear')} ${t('Landing.result')}`)
        next?.()
      }

      // 有订单时，检查当前staff权限
      if (
        (permission === 'showPartySize' || permission === 'buffet') &&
        Object.keys(currentOrder).length > 0
      ) {
        const isHasChangeGuest = rules?.find(
          (each) => each.name === 'CHANGE_GUEST'
        )
        if (!isHasChangeGuest)
          return handleSetError('AdminLogin.no_change_guest')
      }
      setLoginEffectLoading(false)
      handleClose()
      // 登录成功后执行
      next?.(
        permission === 'durationBillingEnd'
          ? { userId, userName, roles, rules }
          : undefined
      )
    },
    onError: (error) => {
      const refresh = () => {
        const timer = setTimeout(() => {
          window.location.reload()
          clearTimeout(timer)
        }, 1300)
      }
      // 不能自动刷新session key -> 重选license
      if (error.message === 'Invalid session key') {
        Toast.error(t('AdminLogin.failed_refresh_sessionKey'))
        refresh()
      }
      const authInfo = getStorageValue('emenu_auth')
      if (!authInfo || Object.keys(authInfo).length === 0) {
        setTip('AdminLogin.no_auth_info')
        refresh()
        return
      }
      setTip(error.message ?? 'AdminLogin.tip_wrong')
      if (permission === 'durationBillingEnd') {
        Toast.error(t('AdminLogin.tip_wrong'))
      }
    },
    onFinally: () => {},
  })

  const loading = useMemo(() => {
    return loginLoading || loginEffectLoading
  }, [loginLoading, loginEffectLoading])

  const handleInputKey = (key) => () => {
    if (passcode.length < 10) {
      setPasscode((code) => code + key)
    }
  }
  const handleBackInput = () => {
    setPasscode((code) => code.slice(0, -1))
  }
  const handleEnter = () => {
    if (loading) return
    run()
  }
  const handleKeyDown = (event) => {
    event.preventDefault()
    const key = event.key
    if (/^[0-9]$/.test(key)) {
      handleInputKey(key)()
    } else if (key === 'Backspace') {
      handleBackInput()
    } else if (key === 'Enter') {
      handleEnter()
    }
  }

  useEffect(() => {
    if (isOpen) {
      setPasscode('')
      setTip('AdminLogin.tip_initial')
    }
  }, [isOpen])

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      className={classes.root}
      // disableAutoFocus
      // disableEnforceFocus
      onKeyDown={handleKeyDown}
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 1)',
          // backdropFilter: 'blur(6px)',
          // WebkitBackdropFilter: 'blur(6px)',
        },
      }}
    >
      <Box className={classes.root}>
        <Paper className={classes.permission} hidden={!permission}>
          <Box
            display="flex"
            alignItems="center"
            className={classes.permissionError}
          >
            <FeedbackErrorIcon className={classes.permissionIcon} />
            <Box marginLeft={2}>
              <Typography variant="h5" className={classes.permissionTitle}>
                {t(`AdminLogin.permission_${permission}`)}
              </Typography>
              <Typography variant="body1" className={classes.permissionMessage}>
                {t(`AdminLogin.permission_errorMsg`)}
              </Typography>
            </Box>
          </Box>
        </Paper>
        <Typography variant="h6" align="center" color="inherit">
          {t(tip)}
        </Typography>
        <InputBase
          type="password"
          value={passcode}
          disabled
          autoComplete="current-password"
          /* inputProps={{
            inputMode: 'numeric',
            style: {
              textSecurity: 'disc',
              WebkitTextSecurity: 'disc',
            },
          }} */
          classes={{
            root: classes.inputRoot,
            input: classes.input,
          }}
        />
        <LoadingOverlay loading={loading} />
        <div className={classes.keysList}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'b'].map(
            (e, i) => {
              return e === 'b' ? (
                <div className={classes.backItem} key={i}>
                  <BackspaceRoundedIcon
                    onClick={handleBackInput}
                    className={classes.delIcon}
                  />
                </div>
              ) : e ? (
                <div
                  className={classes.keyItem}
                  key={i}
                  onClick={handleInputKey(e)}
                >
                  {e}
                </div>
              ) : (
                <div className={classes.backItem} key={i}></div>
              )
            }
          )}
        </div>
        <div className={classes.footerBtn}>
          <Button
            onClick={handleClose}
            variant="contained"
            className={classes.enterBtn}
          >
            {t('AdminSetting.btn_cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            className={classes.enterBtn}
            onClick={handleEnter}
          >
            {t(
              `AdminLogin.btn_${permission === 'tableClear' ? 'clear_table' : 'enter'}`
            )}
          </Button>
        </div>
      </Box>
    </Modal>
  )
}

export default memo(AdminLogin)
