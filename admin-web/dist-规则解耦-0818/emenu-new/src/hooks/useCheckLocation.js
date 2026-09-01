import { useMemoizedFn } from 'ahooks'

const useCheckLocation = () => {
  const isInTargetPage = useMemoizedFn((target) => {
    return location?.hash.includes(target)
  })

  return {
    isInOrderPage: isInTargetPage('order'),
    isInSettingPage: isInTargetPage('setting'),
    isInIndexPage: location.hash.split('/')?.[1] === '',
  }
}

export default useCheckLocation
