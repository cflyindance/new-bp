import { makeStyles } from '@material-ui/core'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { preloadImage } from '@/components/CacheImage'

const DECODE_TIMEOUT = 300

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}))

const safeDecodeImageElement = async (imageEl) => {
  if (!imageEl || typeof imageEl.decode !== 'function') {
    return
  }
  await Promise.race([
    imageEl.decode().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, DECODE_TIMEOUT)),
  ])
}

const Container = ({
  children,
  swiper,
  index,
  containerId,
  needPreRender,
  registerPreRender,
  getPageImageElement,
}) => {
  const classes = useStyles()
  const themeStyles = useEmenuProThemeAdapter({ width: '100%', height: '100%' })

  // 可以完整渲染的页面
  const [canRender, setCanRender] = useState(false)
  // 只渲染page组件的页面
  const [canRenderPage, setCanRenderPage] = useState(false)
  // 可以预渲染的页面
  const [canPreRender, setCanPreRender] = useState(false)
  const unregisterPreRenderRef = useRef(() => {})

  useEffect(() => {
    if (swiper) {
      const onActiveIndexChange = (swiper) => {
        const virtualSlidesBefore = swiper.virtual?.slidesBefore || 0
        const virtualSlidesAfter = swiper.virtual?.slidesAfter || 0
        const preIndex = (swiper.activeIndex || 0) - 1
        const nextIndex = (swiper.activeIndex || 0) + 1
        const prePageIndex = (swiper.activeIndex || 0) - virtualSlidesBefore
        const nextPageIndex = (swiper.activeIndex || 0) + virtualSlidesAfter
        if (index >= preIndex && index <= nextIndex) {
          setCanRender(true)
        } else {
          setCanRender(false)
        }
        if (index >= prePageIndex && index <= nextPageIndex) {
          setCanRenderPage(true)
        } else {
          setCanRenderPage(false)
        }
      }
      onActiveIndexChange(swiper)
      swiper.on('activeIndexChange', onActiveIndexChange)
      return () => {
        swiper.off('activeIndexChange', onActiveIndexChange)
      }
    } else {
      if (index === 0) {
        setCanRender(true)
        setCanRenderPage(true)
      }
    }
  }, [swiper, index])

  const { nodeList, pageImageUrl } = useMemo(() => {
    const list = Array.isArray(children) ? children : [children]
    let currentPageImageUrl = ''
    const filteredNodeList = list.filter((child) => {
      const componentName = child?.type?.displayName
      const isPageComponent = componentName === 'Page'
      if (isPageComponent) {
        const imgUrl = child?.props?.config?.props?.imgUrl
        currentPageImageUrl = imgUrl ? `/kpos/${imgUrl}` : ''
      }
      if (canRender) {
        return true
      }
      if (canPreRender || canRenderPage) {
        return isPageComponent
      }
      return false
    })
    return {
      nodeList: filteredNodeList,
      pageImageUrl: currentPageImageUrl,
    }
  }, [children, canRender, canRenderPage, canPreRender])

  useEffect(() => {
    let active = false
    const cleanup = () => {
      active = false
      unregisterPreRenderRef.current?.()
      unregisterPreRenderRef.current = () => {}
      setCanPreRender(false)
    }

    cleanup()

    if (registerPreRender && pageImageUrl) {
      const preparePreRender = async () => {
        await preloadImage(pageImageUrl).catch(() => {})
        if (!active) {
          return
        }
        const unregister = registerPreRender(
          async () => {
            if (!active) {
              return
            }
            setCanPreRender(true)
            try {
              await new Promise((resolve) => requestAnimationFrame(resolve))
              const pageImageEl = getPageImageElement?.(containerId)
              await safeDecodeImageElement(pageImageEl)
            } finally {
              setCanPreRender(false)
            }
          },
          needPreRender ? index : 1000 + index
        )
        unregisterPreRenderRef.current = unregister
      }
      active = true
      preparePreRender()
    }

    return cleanup
  }, [
    registerPreRender,
    pageImageUrl,
    needPreRender,
    index,
    containerId,
    getPageImageElement,
  ])

  return (
    <div className={classes.root}>
      <div style={{ ...themeStyles, position: 'relative', flex: 'none' }}>
        {nodeList}
      </div>
    </div>
  )
}

export default React.memo(Container)
