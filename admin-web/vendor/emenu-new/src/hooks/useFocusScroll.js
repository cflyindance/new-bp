export default function useFocusScroll() {
  const osInfo = /OS (\d+)_(\d+)_?(\d+)?/i.exec(navigator.appVersion)
  const osVersion = osInfo?.[1]
  const focusIn = () => {
    if (Number(osVersion) >= 12) {
      const t = setTimeout(() => {
        window.scrollTo(0, 0)
        clearTimeout(t)
      }, 100)
    }
  }
  const focusOut = () => {
    if (Number(osVersion) >= 12) {
      const height = Math.max(
        0,
        document.body.scrollTop,
        document.documentElement.scrollTop
      )
      const t = setTimeout(() => {
        window.scrollTo(0, height)
        clearTimeout(t)
      }, 100)
    }
  }

  return [focusIn, focusOut]
}
