import { useRef, useState } from 'react'
import { serverUrl } from '@/utils/env_var'
import { SocketClient } from '@menusifu/socket-client'
import { NEW_MESSAGE_TYPE } from '@/constants/websocket'
import { useLocalStorageState } from 'bhooks'
import { actions } from '@/store/slices/system.slice'
import { useDispatch } from 'react-redux'

const scUrl = `${serverUrl.replace(/^http/, 'ws')}api/ws`

const useSocketCenter = (props) => {
  const { refreshSessionKey } = props
  const dispatch = useDispatch()
  const [, setAuthInfo] = useLocalStorageState('emenu_auth', {
    defaultValue: {},
    listenStorageChange: true,
  })
  const [message, setMessage] = useState(null)
  const scRef = useRef(null)

  const scConnect = () => {
    if (scRef.current) return

    const scClient = new SocketClient(scUrl, 'EMENU')
    const originalClose = scClient.close.bind(scClient)
    scClient.close = (...args) => {
      if (window.globalWs === scClient) {
        window.globalWs = null
      }
      if (scRef.current === scClient) {
        scRef.current = null
      }
      return originalClose(...args)
    }
    window.globalWs = scRef.current = scClient

    // 建立连接
    scClient.on('open', (evt, attempt) => {
      dispatch(actions.setWSStatus(false))
      console.log(`连接成功，尝试次数: ${attempt}`)
    })

    // 监听消息
    scClient.on('message', (payload) => {
      const { payload: messageBody, topic } = payload
      console.log(
        `[WebSocket message] %c${JSON.stringify(messageBody)}`,
        'color:green'
      )
      // 老消息处理
      if (topic === 'oldEventTopic') {
        return setMessage(messageBody)
      }
      // 订单消息
      if (topic === 'orderEventTopic') {
        return setMessage(messageBody)
      }
      // socket配置消息
      if (topic === 'socketConfigEventTopic') {
        return setMessage(messageBody)
      }
      const { type } = messageBody
      // 新消息只处理三种类型
      if (!NEW_MESSAGE_TYPE.includes(type)) return
      if (type === 'menuChange') {
        const prodLine = messageBody.payload
        if (prodLine && (prodLine.length === 0 || prodLine.includes('EMENU'))) {
          return setMessage(messageBody)
        }
        return
      }
      return setMessage(messageBody)
    })

    // 监听错误
    scClient.on('error', (evt) => {
      console.error('连接错误:', evt)
    })

    // 监听关闭
    scClient.on('close', async (evt) => {
      console.log('连接关闭，代码:', evt.code)
      if (evt.code < 4000 || !evt.code) {
        if (scClient === window.globalWs) {
          dispatch(actions.setWSStatus(true))
        }
      }
      // 4000 -> license 被占用
      if (evt.code === 4000) {
        scDisconnect()
        try {
          const res = await refreshSessionKey(false)
          if (!res) {
            throw res
          }
        } catch {
          setAuthInfo({})
        }
      }
      // license 过期
      if (evt.code === 4001) {
        scDisconnect()
        await refreshSessionKey()
      }
    })

    // 监听重连
    scClient.on('reconnect', (info) => {
      console.log(`重连中，尝试次数: ${info.attempt}`)
    })

    // 监听断连数据过期事件
    scClient.on('messageExpired', function () {
      console.log('获取断连期间消息')
      setMessage('messageExpired')
      return setMessage({
        type: 'messageExpired',
        version: Date.now(),
      })
    })

    // 连接
    scClient.connect()
  }

  const scDisconnect = () => {
    if (!scRef.current) return
    scRef.current.close()
    window.globalWs = scRef.current = null
  }

  return {
    scConnect,
    scDisconnect,
    scMessage: message,
  }
}

export default useSocketCenter
