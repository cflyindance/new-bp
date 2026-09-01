import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { KeepAlive } from 'react-activation'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { serverUrl } from '@/utils/env_var'
import { useSwiper } from '../components/SwiperProvider'
import { makeStyles, IconButton, CircularProgress } from '@material-ui/core'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'

const useStyles = makeStyles(() => ({
  videoWrapper: {
    backgroundColor: '#000',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  btnPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    pointerEvents: 'none',
  },
  btnPlayIcon: {
    fontSize: 32,
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

const Video = ({ config, index }) => {
  const { style, props } = {
    ...config,
    props: { ...config.props, autoplay: true },
  }
  const { objectFit, ...themeStyles } = useEmenuProThemeAdapter(style)

  const videoUrl = useMemo(() => serverUrl + props.videoUrl, [props.videoUrl])

  const swiper = useSwiper()
  const videoRef = useRef(null)

  const onSwiperSetTransition = useCallback(() => {
    videoRef.current?.pause()
  }, [])

  const onSwiperTransitionEnd = useCallback(() => {
    if (swiper?.activeIndex === index) {
      if (props.autoplay) {
        videoRef.current?.play().catch(() => {})
      }
    } else {
      videoRef.current?.pause()
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0
        }
      })
    }
  }, [swiper, props.autoplay, index])

  useEffect(() => {
    return () => {
      videoRef.current?.pause()
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0
        }
      })
    }
  }, [])

  useEffect(() => {
    if (swiper) {
      swiper.on('setTransition', onSwiperSetTransition)
      swiper.on('transitionEnd', onSwiperTransitionEnd)

      return () => {
        swiper.off('setTransition', onSwiperSetTransition)
        swiper.off('transitionEnd', onSwiperTransitionEnd)
      }
    }
  }, [swiper, onSwiperSetTransition, onSwiperTransitionEnd])

  return (
    <div style={{ ...themeStyles, position: 'absolute' }}>
      <KeepAlive cacheKey={videoUrl}>
        <VideoInKeepAlive
          muted={true}
          loop={props.autoplay}
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          ref={videoRef}
          src={videoUrl}
          disablePlayButton={props.autoplay}
          style={{ objectFit }}
        />
      </KeepAlive>
    </div>
  )
}

const VideoInKeepAlive = forwardRef(
  ({ style, disablePlayButton, ...props }, ref) => {
    const classes = useStyles()

    const [isLoading, setIsLoading] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [firstFrameLoaded, setFirstFrameLoaded] = useState(true)

    const videoRef = useRef(null)

    useEffect(() => {
      setIsLoading(false)
      setIsPlaying(false)
      setFirstFrameLoaded(true)
    }, [props.src])

    useImperativeHandle(ref, () => videoRef.current)

    const onVideoPlay = useCallback(() => {
      setIsPlaying(true)
    }, [])

    const onVideoPause = useCallback(() => {
      setIsPlaying(false)
    }, [])

    const onVideoEnded = useCallback(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0
      }
    }, [])

    const onVideoClick = useCallback(() => {
      if (disablePlayButton) return
      if (isLoading) return
      if (isPlaying) {
        videoRef.current?.pause()
      } else {
        videoRef.current?.play().catch(() => {})
      }
    }, [isPlaying, isLoading, disablePlayButton])

    const onVideoCanPlay = useCallback(() => {
      setIsLoading(false)
    }, [])

    const onVideoSeeked = useCallback((e) => {
      if (e.target.currentTime >= 0) {
        setFirstFrameLoaded(true)
      }
    }, [])

    const onVideoLoadedData = useCallback((e) => {
      e.target.currentTime = 0
    }, [])

    const onVideoLoadStart = useCallback(() => {
      setFirstFrameLoaded(false)
      setIsLoading(true)
    }, [])

    const onVideoWaiting = useCallback(() => {
      setIsLoading(true)
    }, [])

    const onVideoError = useCallback(() => {
      setIsLoading(false)
    }, [])

    const { objectFit, ...videoWrapperStyle } = style || {}

    const videoStyle = useMemo(() => {
      return {
        objectFit,
        opacity: firstFrameLoaded ? 1 : 0,
      }
    }, [firstFrameLoaded, objectFit])

    return (
      <div className={classes.videoWrapper} style={videoWrapperStyle}>
        <video
          {...props}
          className={classes.video}
          ref={videoRef}
          onPlay={onVideoPlay}
          onPause={onVideoPause}
          onEnded={onVideoEnded}
          onClick={onVideoClick}
          onCanPlay={onVideoCanPlay}
          onLoadStart={onVideoLoadStart}
          onWaiting={onVideoWaiting}
          onError={onVideoError}
          onLoadedData={onVideoLoadedData}
          onSeeked={onVideoSeeked}
          style={videoStyle}
        />
        {!isPlaying && !isLoading && !disablePlayButton && (
          <IconButton className={classes.btnPlay} color="primary">
            <PlayArrowIcon className={classes.btnPlayIcon} />
          </IconButton>
        )}
        {isLoading && (
          <div className={classes.loading}>
            <CircularProgress classes={{ colorPrimary: classes.loadingIcon }} />
          </div>
        )}
      </div>
    )
  }
)
VideoInKeepAlive.displayName = 'VideoInKeepAlive'

export default React.memo(Video)
