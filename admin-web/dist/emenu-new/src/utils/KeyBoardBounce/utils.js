export const getPlatformType = () => {
  const ua = window.navigator.userAgent.toLocaleLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(ua)
  const isAndroid = /android/.test(ua)

  return {
    isIOS,
    isAndroid,
  }
}
