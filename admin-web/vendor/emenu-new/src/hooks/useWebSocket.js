import { useMemo, useRef, useState } from 'react'
import { serverUrl } from '@/utils/env_var'
import { HeartbeatTypes } from '@/constants/websocket'
import { useLocalStorageState } from 'bhooks'
import { useDispatch } from 'react-redux'
import { actions } from '@/store/slices/system.slice'

const wsUrl = serverUrl.replace(/^http/, 'ws') + 'webapp/webSocket/systemInfo'
const { heartbeatType, heartbeatInterval } = HeartbeatTypes.NORMAL

export function useWebSocket(props) {
  const { refreshSessionKey } = props
  const dispatch = useDispatch()
  const [message, setMessage] = useState('')
  const [authInfo, setAuthInfo] = useLocalStorageState('emenu_auth', {
    defaultValue: {},
    listenStorageChange: true,
  })
  const { instanceName, sessionKey } = useMemo(() => {
    return authInfo || { instanceName: null, sessionKey: null }
  }, [authInfo])

  const wsRef = useRef(null)
  const heartbeatTimer = useRef(null)
  const reconnectTimeout = useRef(null)
  const isReconnecting = useRef(null)

  const clearHeartbeatTimer = () => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current)
      heartbeatTimer.current = null
    }
  }

  const clearReconnectTimeout = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
  }

  const resetInitState = () => {
    clearHeartbeatTimer()
    clearReconnectTimeout()
  }

  const connect = () => {
    if (wsRef.current) {
      return
    }

    resetInitState()

    const ws = new WebSocket(wsUrl)
    window.globalWs = wsRef.current = ws

    ws.onopen = (e) => {
      dispatch(actions.setWSStatus(false))
      console.log(`[WebSocket] %c${e.type}`, 'color:green')
      ws.send(JSON.stringify({ instanceName, sessionKey }))
      heartbeatTimer.current = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ heartbeatType, sessionKey }))
        }
      }, heartbeatInterval)
    }

    ws.onclose = async (e) => {
      console.log(
        wsRef.current
          ? `[WebSocket] %cclosed%c by server`
          : `[WebSocket] %cclosed%c by unmount`,
        'color:red',
        ''
      )
      console.log(`[WebSocket] %c${e.type} ${e.code} ${e.reason}`, 'color:red')
      // 关闭心跳
      clearHeartbeatTimer()
      // 重置ws
      window.globalWs = wsRef.current = null
      // disconnect 后不再重连
      if (e.code === 4444 && e.reason === 'disconnect') return
      // license 过期
      if (e.code === 1003) {
        await refreshSessionKey()
        return
      }
      // license 被删除
      if (e.code === 1011) {
        setAuthInfo({})
        return
      }
      // 其他code 可以理解为ws通道关闭
      dispatch(actions.setWSStatus(true))
      // 5s后重连
      if (!isReconnecting.current) {
        isReconnecting.current = true
        reconnectTimeout.current = setTimeout(() => {
          connect()
          isReconnecting.current = false
        }, 5000)
      }
    }

    ws.onerror = (e) => {
      console.log(`[WebSocket] %c${e.type}`, 'color:red')
    }

    ws.onmessage = (e) => {
      console.log(`[WebSocket] %c${e.type}`, 'color:blue', e.data)
      if (e.data) {
        try {
          // license 被占用
          if (e.data === 'D') {
            setAuthInfo({})
            return
          }
          const dataObj = JSON.parse(e.data)
          if (
            dataObj.hasOwnProperty('menuUpdated') ||
            dataObj.hasOwnProperty('updatedOrderIds') ||
            dataObj.hasOwnProperty('messageTopic') ||
            dataObj.type === 'socketConfigEventTopic'
          ) {
            const newData = {
              ...dataObj,
              updateTime: Date.now(),
            }
            const newMessage = JSON.stringify(newData)
            setMessage(newMessage)
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message data:', error)
        }
      }
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      console.log('[WebSocket] Closing connection.')
      wsRef.current.close(4444, 'disconnect')
      window.globalWs = wsRef.current = null
    }
    resetInitState()
  }

  return {
    wsConnect: connect,
    wsDisconnect: disconnect,
    wsMessage: message,
  }
}
