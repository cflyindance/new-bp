import { useRequest } from 'ahooks'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useDispatch } from 'react-redux'
import { effects } from '@/store/slices/systemConfig.slice'

const options = {
  manual: true,
  pollingInterval: 5 * 60 * 1000,
  pollingWhenHidden: false,
}

const usePollingCenter = () => {
  const { runFetchOrder } = useFetchOrder()
  const { runGetMenus } = useSetMenus()
  const dispatch = useDispatch()

  const { run: runPollingOrder, cancel: cancelPollingOrder } = useRequest(
    async () => {
      await runFetchOrder(undefined, 'polling')
    },
    {
      ...options,
      pollingInterval: 5 * 1000,
    }
  )

  const { run: runPollingMenu, cancel: cancelPollingMenu } = useRequest(() => {
    runGetMenus(undefined, 'polling')
  }, options)

  const { run: runPollingConfig, cancel: cancelPollingConfig } = useRequest(
    () => {
      dispatch(effects.fetchConfig({}))
    },
    options
  )

  const { run: runPollingEmenuProConfig, cancel: cancelPollingEmenuProConfig } =
    useRequest(() => {
      dispatch(effects.fetchEmenuProConfig())
    }, options)

  return {
    runPollingOrder,
    cancelPollingOrder,
    runPollingMenu,
    cancelPollingMenu,
    runPollingConfig,
    cancelPollingConfig,
    runPollingEmenuProConfig,
    cancelPollingEmenuProConfig,
  }
}

export default usePollingCenter
