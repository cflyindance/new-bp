import { useMount, useUnmount } from 'ahooks'
import { useDispatch } from 'react-redux'
import { setStorageValue } from '@/utils/storage'
import { effects } from '@/store/slices/systemConfig.slice'

const useFetchSystemConfig = () => {
  const dispatch = useDispatch()
  useMount(async () => {
    // await dispatch(effects.fetchConfig())
    await init()
  })

  useUnmount(() => {
    window.removeEventListener('message', fetchConfig)
  })

  const init = async () => {
    window.parent.postMessage({ type: 'getSessionKey' }, '*')
    window.addEventListener('message', fetchConfig)
  }

  const fetchConfig = async (event) => {
    if (event.data.type === 'sessionKey') {
      const newSessionKey = event.data.data
      setStorageValue('emenu_auth', {
        sessionKey: newSessionKey,
      })
      await dispatch(effects.fetchConfig({}))
      window.removeEventListener('message', fetchConfig)
    }
  }
}

export default useFetchSystemConfig
