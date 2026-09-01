import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core'
// import { lsKey } from '@/constants/localstorage'
import { makeStyles } from '@material-ui/core/styles'
import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'
import StyledButton from './StyledButton'
import { useNavigate } from 'react-router-dom'
import { getStorageValue } from '@/utils/storage'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import useCheckVersion from '@/hooks/useCheckVersion'

const useStyles = makeStyles((theme) => ({
  actions: {
    padding: theme.spacing(2, 3),
    //columnGap: theme.spacing(1),
  },
  btn: {
    // width: 144,
    height: 48,
    fontSize: 18,
    fontWeight: 600,
  },
}))

// 检查sw更新或轮询文件的间隔
const intervalMS = 60 * 1000

export default function UpdatePrompt() {
  const navigate = useNavigate()
  const classes = useStyles()
  const { t } = useTranslation()
  // 是否轮询version.json文件，不支持serviceWorker时使用轮询处理
  // const pollingVersion = useMemo(() => {
  //   return !('serviceWorker' in window.navigator)
  // }, [window.navigator])
  const [, setVersionInfo] = useLocalStorage('new-version', {})
  const { checkVersionRequest } = useCheckVersion()

  const onSubmit = () => {
    // 04/07 更新时不清除LS信息
    navigate('/')
    const t = setTimeout(() => {
      window.location.reload()
      clearTimeout(t)
    }, 300)
  }

  useRequest(checkVersionRequest, {
    pollingInterval: intervalMS,
    onSuccess: (res) => {
      const { data } = res
      const { version } = data
      const versionInfo = getStorageValue('new-version')
      const isHasAuth = getStorageValue('emenu_auth')
      // 没有鉴权信息, 没有之前的版本号 -> 目前理解为已清缓存
      if (!isHasAuth || !versionInfo?.version) {
        setVersionInfo(data)
        return
      }
      // 版本号不同时 更新
      if (version !== versionInfo.version) {
        setVersionInfo(data)
        // setNeedRefresh(true)
        onSubmit()
      }
    },
  })

  return (
    <Dialog open={false}>
      <DialogTitle>{t('UpdatePrompt.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('UpdatePrompt.content2')}</DialogContentText>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <StyledButton
          type="submit"
          variant="contained"
          color="primary"
          className={classes.btn}
          onClick={onSubmit}
        >
          {t('UpdatePrompt.submit')}
        </StyledButton>
      </DialogActions>
    </Dialog>
  )
}
