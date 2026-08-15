import { useMount, useUnmount } from 'ahooks'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'
import styles from './index.module.less'
import { Button } from 'antd'

import { getRestaurantHour } from '@/services/menus'
import { useSelector } from 'react-redux'
import GlobalStorageContext from '@/context/GlobalStorageContext'

const GlobalNetworkModal = () => {
  const { t } = useTranslation()
  const { isNewSocket } = useContext(GlobalStorageContext)
  // 终端状态
  const isDisconnectPos = useRef(false)
  // 主机连接状态
  const { isWSDisconnect } = useSelector((state) => state.system)
  // 网络状态
  const [isOnline, setIsOnline] = useState(true)
  // 息屏时强制隐藏弹窗, 解决因网络不好导致的时间边界值问题
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(false)
  const [reloadLoading, setReloadLoading] = useState(false)
  const [isLifeCycleResume] = useGlobalState('isLifeCycleResume')

  // 定时器
  const timerRef = useRef(null)

  const handeOnline = () => setIsOnline(true)
  const handeOffline = () => setIsOnline(false)

  // getRestaurantHour轮询接口 检查网络状态
  const initInterval = () => {
    if (timerRef.current) return
    timerRef.current = setInterval(async () => {
      try {
        await getRestaurantHour()
        if (isDisconnectPos.current) {
          isDisconnectPos.current = false
        }
      } catch (e) {
        console.log(e)
        // 联网状态 请求不到 -> 终端被关闭
        if (window.navigator.onLine) {
          isDisconnectPos.current = true
        }
      }
    }, 5000)
  }

  const handleWatchScreenStatus = () => {
    if (document.visibilityState === 'hidden') {
      if (timerRef.current) {
        setVisible(false)
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    if (document.visibilityState === 'visible') {
      setVisible(true)
      initInterval()
    }
  }

  useMount(() => {
    window.addEventListener('online', handeOnline)
    window.addEventListener('offline', handeOffline)
  })

  useUnmount(() => {
    window.removeEventListener('online', handeOnline)
    window.removeEventListener('offline', handeOffline)
  })

  useEffect(() => {
    if (!isNewSocket) {
      window.addEventListener('visibilitychange', handleWatchScreenStatus)
      initInterval()

      return () => {
        window.removeEventListener('visibilitychange', handleWatchScreenStatus)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }, [isNewSocket])

  const title = useMemo(() => {
    if (!isOnline) return t('globalNetwork.network_title')
    if (isNewSocket ? isWSDisconnect : isDisconnectPos.current)
      return t('globalNetwork.pos_title')
    return ''
  }, [isWSDisconnect, isOnline, t, isDisconnectPos.current, isNewSocket])

  const subtitle = useMemo(() => {
    if (!isOnline) return t('globalNetwork.network_subTitle')
    if (isNewSocket ? isWSDisconnect : isDisconnectPos.current)
      return t('globalNetwork.pos_subTitle')
    return ''
  }, [isWSDisconnect, isOnline, t, isDisconnectPos.current, isNewSocket])

  const open = useMemo(() => {
    if (!visible) return false
    return (isNewSocket ? isWSDisconnect : isDisconnectPos.current) || !isOnline
  }, [isWSDisconnect, isOnline, isDisconnectPos.current, isNewSocket, visible])

  useEffect(() => {
    if (!open) {
      setLoading(false)
    }
  }, [open])

  const handlePingPosMaster = async () => {
    setLoading(true)
    const res = await getRestaurantHour({ link: 'connect' })
    if (res.result === 'false') {
      setLoading(false)
    }
  }

  const handleReload = () => {
    setReloadLoading(true)
    window.location.reload()
    setTimeout(() => {
      setReloadLoading(false)
    }, 1000)
  }

  return (
    <Dialog open={open && !isLifeCycleResume}>
      <div className={styles.globalNetworkWrapper}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>
        <div className={styles.btnWrapper}>
          <Button
            type="primary"
            className={styles.linkBtn}
            loading={reloadLoading}
            onClick={handleReload}
          >
            {t('globalNetwork.refresh')}
          </Button>
          <Button
            type="primary"
            className={styles.linkBtn}
            loading={loading}
            onClick={handlePingPosMaster}
          >
            {loading
              ? t(`globalNetwork.network_linking`)
              : t(`globalNetwork.network_reLink`)}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default GlobalNetworkModal
