import { useMemo, useEffect } from 'react'
import { usePrevious, useUnmount } from 'ahooks'
import { useWebSocket } from '@/hooks/useWebSocket'
import useSocketCenter from '@/hooks/useSocketCenter'
import { useLocalStorageState } from 'bhooks'
import { clientLogin } from '@/services/system'
import Toast from '@/components/Toast'

// true->新ws,  false->老ws, null->未定
const useWS = (props) => {
  const { isNewSocket } = props
  const [authInfo, setAuthInfo] = useLocalStorageState('emenu_auth', {
    defaultValue: {},
    listenStorageChange: true,
  })
  const refreshSessionKey = async (showToast = true) => {
    const res = await clientLogin({ appInstanceName: authInfo?.instanceName })
    if (res?.result?.successful) {
      const currentLoginInfo = {
        ...authInfo,
        secretKey: res?.secretKey,
        sessionKey: res?.sessionKey,
        LastLoginTime: Date.now(),
        sessionExpireTime:
          Date.now() + (res?.sessionKeyRemainingActiveTime ?? 24 * 3600000),
      }
      setAuthInfo(currentLoginInfo)
      return true
    }
    if (showToast) {
      Toast.error('Failed to refresh session key')
    }
    return false
  }

  const { wsConnect, wsDisconnect, wsMessage } = useWebSocket({
    refreshSessionKey,
  })

  const { scConnect, scDisconnect, scMessage } = useSocketCenter({
    refreshSessionKey,
  })

  const { instanceName, sessionKey } = useMemo(() => {
    return authInfo || { instanceName: null, sessionKey: null }
  }, [authInfo])
  const preInstanceName = usePrevious(instanceName)

  useEffect(() => {
    const handleAuthInfoChange = (event) => {
      if (!event?.detail) return
      setAuthInfo(event.detail)
    }
    window.addEventListener('emenu_auth_changed', handleAuthInfoChange)
    return () => {
      window.removeEventListener('emenu_auth_changed', handleAuthInfoChange)
    }
  }, [])

  useEffect(() => {
    if (!instanceName || !sessionKey || isNewSocket !== false) {
      wsDisconnect()
      return
    }
    if (preInstanceName && preInstanceName !== instanceName) {
      wsDisconnect()
      wsConnect()
      return
    }
    wsConnect()
  }, [preInstanceName, instanceName, sessionKey, isNewSocket])

  useEffect(() => {
    if (!instanceName || !sessionKey || !isNewSocket) {
      scDisconnect()
      return
    }
    if (preInstanceName && preInstanceName !== instanceName) {
      scDisconnect()
      scConnect()
      return
    }
    scConnect()
  }, [preInstanceName, instanceName, sessionKey, isNewSocket])

  useUnmount(() => {
    scDisconnect()
    wsDisconnect()
  })

  const message = useMemo(() => {
    if (!isNewSocket) return wsMessage
    return scMessage
  }, [isNewSocket, wsMessage, scMessage])

  return {
    message,
  }
}

export default useWS
