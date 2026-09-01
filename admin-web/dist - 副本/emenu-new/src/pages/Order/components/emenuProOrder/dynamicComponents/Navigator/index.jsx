import { useBoolean } from 'ahooks'
import MenuList from './MenuList'
import ExpandMenuButton from './ExpandMenuButton'
import NarrowMenuButton from './NarrowMenuButton'
import { useEmenuProThemeAdapter } from '../../components/EmenuProTheme'
import React, { useEffect, useMemo } from 'react'
import { useSwiper } from '../../components/SwiperProvider'

const Navigator = ({
  config,
  categoryList,
  expandMenuConfig,
  narrowMenuConfig,
}) => {
  const { style, props } = config

  const [visible, { setTrue: showNavigator, setFalse: hideNavigator }] =
    useBoolean(true)
  const { style: narrowMenuStyle = {} } = narrowMenuConfig || {}
  const themeStyles = useEmenuProThemeAdapter(style, {
    include: ['height', 'width'],
    returnNumber: true,
  })
  const narrowMenuThemeStyles = useEmenuProThemeAdapter(narrowMenuStyle, {
    include: ['top', 'left'],
    returnNumber: true,
  })

  const distance = useMemo(() => {
    if (props.direction === 'horizontal') {
      if (typeof narrowMenuThemeStyles.top === 'number') {
        return narrowMenuThemeStyles.top
      } else if (typeof themeStyles.height === 'number') {
        return themeStyles.height
      }
    } else {
      if (typeof narrowMenuThemeStyles.left === 'number') {
        return narrowMenuThemeStyles.left
      } else if (typeof themeStyles.width === 'number') {
        return themeStyles.width
      }
    }
    return 0
  }, [props.direction, themeStyles, narrowMenuThemeStyles])

  const toggleButtonStyle = useMemo(() => {
    let attr = props.direction === 'horizontal' ? 'top' : 'left'
    return { [attr]: distance, position: 'absolute' }
  }, [props.direction, distance])

  const time = useMemo(() => {
    return Math.max(distance * 3.5, 300)
  }, [distance])

  const animatedStyles = useMemo(() => {
    let attr = props.direction === 'horizontal' ? 'translateY' : 'translateX'
    if (visible) {
      return {
        transition: `transform ${time}ms cubic-bezier(0.59, 0.84, 0.49, 1.1)`,
        transform: `${attr}(0px)`,
      }
    } else {
      return {
        transition: `transform ${time}ms cubic-bezier(0.11, 0.63, 0.04, 0.96)`,
        transform: `${attr}(-${distance}px)`,
      }
    }
  }, [visible, props.direction, distance, time])

  const expandMenuButtonStyle = useMemo(() => {
    if (visible) {
      return {
        transition: `opacity ${time}ms cubic-bezier(0.59, 0.84, 0.49, 1.1)`,
        opacity: 0,
      }
    } else {
      return {
        transition: `opacity ${time}ms cubic-bezier(0.11, 0.63, 0.04, 0.96)`,
        opacity: 1,
      }
    }
  }, [visible, time])

  const narrowMenuButtonStyle = useMemo(() => {
    if (visible) {
      return {
        transition: `opacity ${time}ms cubic-bezier(0.59, 0.84, 0.49, 1.1)`,
        opacity: 1,
      }
    } else {
      return {
        transition: `opacity ${time}ms cubic-bezier(0.11, 0.63, 0.04, 0.96)`,
        opacity: 0,
      }
    }
  }, [visible, time])

  const onSliderMove = () => {
    hideNavigator()
  }

  const swiper = useSwiper()

  useEffect(() => {
    if (swiper && narrowMenuConfig && expandMenuConfig) {
      swiper.on('sliderMove', onSliderMove)
      return () => {
        swiper.off('sliderMove', onSliderMove)
      }
    }
  }, [swiper, narrowMenuConfig, expandMenuConfig])

  if (!categoryList || categoryList.length <= 0) {
    return null
  }

  return (
    <div style={animatedStyles}>
      <MenuList config={config} categoryList={categoryList} />
      {expandMenuConfig ? (
        <div style={{ ...toggleButtonStyle, ...expandMenuButtonStyle }}>
          <ExpandMenuButton
            config={expandMenuConfig}
            direction={props.direction}
            onClick={showNavigator}
          />
        </div>
      ) : null}
      {narrowMenuConfig ? (
        <div style={{ ...toggleButtonStyle, ...narrowMenuButtonStyle }}>
          <NarrowMenuButton
            config={narrowMenuConfig}
            direction={props.direction}
            onClick={hideNavigator}
          />
        </div>
      ) : null}
    </div>
  )
}

export default React.memo(Navigator)
