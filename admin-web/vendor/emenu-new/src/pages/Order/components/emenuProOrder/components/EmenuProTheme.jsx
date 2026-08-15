import { createContext, useContext, useMemo } from 'react'

const EmenuProThemeContext = createContext({})

const EmenuProThemeProvider = ({ children, theme }) => {
  const { width, height, ratio } = useMemo(() => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const viewportWidth = theme.viewportWidth
    const viewportHeight = theme.viewportHeight
    const viewportRatio = viewportWidth / viewportHeight
    const screenRatio = screenWidth / screenHeight
    if (viewportRatio < screenRatio) {
      // 16:10 < 16:9
      return {
        width: '100%',
        height: screenWidth / viewportRatio,
        ratio: screenWidth / viewportWidth,
      }
    } else if (viewportRatio > screenRatio) {
      return {
        width: screenHeight * viewportRatio,
        height: '100%',
        ratio: screenHeight / viewportHeight,
      }
    } else {
      return {
        width: '100%',
        height: '100%',
        ratio: screenWidth / viewportWidth,
      }
    }
  }, [theme])

  return (
    <EmenuProThemeContext.Provider value={{ width, height, ratio }}>
      {children}
    </EmenuProThemeContext.Provider>
  )
}

const useEmenuProThemeAdapter = (styles = {}, options = {}) => {
  const { width, height, ratio } = useContext(EmenuProThemeContext)
  const ignore = options.ignore || []
  const include = options.include || []
  const exclude = options.exclude || []
  const returnNumber = options.returnNumber || false

  let _styles = {}

  if (include.length > 0) {
    include.forEach((key) => {
      if (key in styles) {
        _styles[key] = styles[key]
      }
    })
  } else {
    _styles = {
      ...styles,
    }
  }

  if (exclude.length > 0) {
    exclude.forEach((key) => {
      if (key in _styles) {
        delete _styles[key]
      }
    })
  }

  const needConvertList = [
    'height',
    'width',
    'top',
    'left',
    'borderBottomRightRadius',
    'borderBottomLeftRadius',
    'borderTopRightRadius',
    'borderTopLeftRadius',
    'fontSize',
    'paddingBottom',
    'paddingTop',
    'paddingLeft',
    'paddingRight',
    'padding',
  ]

  needConvertList.forEach((key) => {
    if (key in _styles && !ignore.includes(key)) {
      if (key === 'height') {
        _styles[key] = pxConvert(_styles[key], ratio, {
          baseN: height,
          returnNumber,
        })
      } else if (key === 'width') {
        _styles[key] = pxConvert(_styles[key], ratio, {
          baseN: width,
          returnNumber,
        })
      } else if (key === 'padding') {
        const paddingList = _styles[key].split(' ')
        const paddingListResult = []
        paddingList.forEach((paddingXXX, index) => {
          paddingListResult[index] = pxConvert(paddingXXX, ratio, {
            returnNumber,
          })
        })
        _styles[key] = paddingListResult.join(' ')
      } else {
        _styles[key] = pxConvert(_styles[key], ratio, { returnNumber })
      }
    }
  })

  return _styles
}

const isPercent = (n) => {
  return typeof n === 'string' && n.includes('%')
}
const isAuto = (n) => {
  return n === 'auto'
}

const pxConvert = (n, ratio, { baseN, returnNumber }) => {
  if (isAuto(n)) {
    if (returnNumber) {
      return undefined
    } else {
      return n
    }
  } else if (isPercent(n)) {
    if (isPercent(baseN) || isAuto(baseN)) {
      if (returnNumber) {
        return undefined
      } else {
        return n
      }
    } else {
      const baseNumber = parseFloat(baseN)
      const nPercent = parseFloat(n)
      const result = (baseNumber * nPercent) / 100
      if (returnNumber) {
        return result
      } else {
        return result + 'px'
      }
    }
  } else {
    const nNumber = parseFloat(n)
    const result = nNumber * ratio
    if (returnNumber) {
      return result
    } else {
      return result + 'px'
    }
  }
}

export { EmenuProThemeProvider, useEmenuProThemeAdapter }
