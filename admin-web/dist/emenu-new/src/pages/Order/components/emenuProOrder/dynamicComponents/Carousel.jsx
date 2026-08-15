import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { CircularProgress, makeStyles } from '@material-ui/core'
import { serverUrl } from '@/utils/env_var'
import { nanoid } from '@reduxjs/toolkit'
import { KeepAlive } from 'react-activation'
import Swiper from 'swiper'
import { Virtual, Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/virtual'
import 'swiper/css/autoplay'
import 'swiper/css/pagination'
import { useSwiper } from '../components/SwiperProvider'

const useStyles = makeStyles(() => ({
  swiper: {
    position: 'absolute',
    backgroundColor: '#000',
  },
  swiperPagination: {
    '& .swiper-pagination-bullet': {
      backgroundColor: '#96272F',
    },
  },
  imgWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    transformOrigin: 'center',
  },
  loadingIcon: {
    color: '#96272F',
  },
}))

const Carousel = ({ config, index }) => {
  const { style, props } = config
  const themeStyles = useEmenuProThemeAdapter(style)
  const classes = useStyles()

  const imageList = useMemo(() => {
    return props.images.map((url) => {
      return serverUrl + url
    })
  }, [props.images])

  const [swiper, setSwiper] = useState(null)
  const swiperRef = useRef(null)
  const swiperKey = useMemo(() => nanoid(), [imageList])
  const swiperPaginationRef = useRef(null)

  const globalSwiper = useSwiper()

  useEffect(() => {
    setTimeout(() => {
      if (!swiperRef.current || !imageList.length) {
        return
      }
      let options = {
        modules: [Virtual, Autoplay, Pagination],
        direction: 'horizontal',
        threshold: 0,
        touchRatio: 1.2,
        nested: true,
        virtual: true,
        pagination: {
          el: swiperPaginationRef.current,
        },
      }

      if (props.infinite) {
        options = {
          ...options,
          loop: true,
        }
        if (imageList.length <= 5) {
          // virtual + loop同时开启的时候，slide数量太少会有问题
          options.virtual = false
        }
      }

      if (props.draggable) {
        options = {
          ...options,
          allowTouchMove: true,
        }
      }

      if (props.autoplaySpeed) {
        options = {
          ...options,
          autoplay: {
            delay: props.autoplaySpeed,
          },
          on: {
            afterInit: (swiper) => {
              swiper.autoplay.stop()
            },
          },
        }
      }

      const swiper = new Swiper(swiperRef.current, options)
      setSwiper(swiper)

      return () => {
        swiper.destroy()
        setSwiper(null)
      }
    }, 0)
  }, [props, imageList])

  const onGlobalSwiperSetTransition = useCallback(() => {
    if (swiper) {
      swiper.autoplay.stop()
    }
  }, [swiper])

  const onGlobalSwiperTransitionEnd = useCallback(
    (globalSwiper) => {
      if (swiper) {
        if (globalSwiper.activeIndex === index) {
          if (props.autoplay) {
            swiper.autoplay.start()
          }
        } else {
          swiper.autoplay.stop()
          swiper.slideTo(0, 0)
        }
      }
    },
    [props.autoplay, index, swiper]
  )

  useEffect(() => {
    if (globalSwiper) {
      globalSwiper.on('setTransition', onGlobalSwiperSetTransition)
      globalSwiper.on('transitionEnd', onGlobalSwiperTransitionEnd)

      return () => {
        globalSwiper.off('setTransition', onGlobalSwiperSetTransition)
        globalSwiper.off('transitionEnd', onGlobalSwiperTransitionEnd)
      }
    }
  }, [globalSwiper, onGlobalSwiperSetTransition, onGlobalSwiperTransitionEnd])

  return (
    <div
      className={`swiper ${classes.swiper}`}
      style={themeStyles}
      key={swiperKey}
      ref={swiperRef}
    >
      <div className="swiper-wrapper">
        {imageList.map((url) => {
          return (
            <div className={`swiper-slide ${classes.swiperSlide}`} key={url}>
              <KeepAlive cacheKey={url}>
                <ImgInKeepAlive src={url} />
              </KeepAlive>
            </div>
          )
        })}
      </div>
      <div
        className={`swiper-pagination ${classes.swiperPagination}`}
        ref={swiperPaginationRef}
      ></div>
    </div>
  )
}

const ImgInKeepAlive = (props) => {
  const classes = useStyles()

  const [isLoading, setIsLoading] = useState(true)

  const onLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const imgStyle = useMemo(() => {
    return {
      opacity: isLoading ? 0 : 1,
    }
  }, [isLoading])

  return (
    <div className={classes.imgWrapper}>
      <img
        {...props}
        className={classes.img}
        onLoad={onLoad}
        style={imgStyle}
      />
      {isLoading && (
        <div className={classes.loading}>
          <CircularProgress classes={{ colorPrimary: classes.loadingIcon }} />
        </div>
      )}
    </div>
  )
}

export default React.memo(Carousel)
