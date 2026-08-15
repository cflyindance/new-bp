import { Badge, Box, IconButton, makeStyles } from '@material-ui/core'
import { Transition } from 'react-transition-group'
import { ShoppingCartRounded as ShoppingCartIcon } from '@material-ui/icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGlobalState } from '@/hooks/useGlobalState'

const useStyles = makeStyles((theme) => ({
  cartBadge: {
    top: 0,
    right: theme.spacing(-1),
    padding: 3,
    textIndent: -1,
    transform: 'scale(0.8) translate(50%, -50%)',
  },
  '@keyframes shakeY': {
    'from, to': {
      transform: 'scale(0.8) translate3d(50%, -50%, 0)',
    },
    '10%, 30%, 50%, 70%, 90%': {
      transform: 'scale(1) translate3d(50%, -100%, 0)',
    },
    '20%, 40%, 60%, 80%': {
      transform: 'scale(1) translate3d(50%, 0, 0)',
    },
  },
  shakeY: {
    animation: '$shakeY 1000ms ease-in-out',
  },
  movingIcon: {
    position: 'absolute',
    height: '16px',
    width: '16px',
    background: '#96272F',
    borderRadius: '100%',
    left: 0,
    top: 0,
    opacity: 0,
  },
}))

const ShoppingCartButton = ({ onClick, renderButton }) => {
  const classes = useStyles()
  const [cart] = useGlobalState('Cart')
  const actualCart = useMemo(
    () => cart.filter((each) => !each.isBuffetItem),
    [cart]
  )
  const cartCount = useMemo(() => {
    return actualCart.reduce((prev, cur) => prev + cur.count, 0)
  }, [actualCart])
  const [addToCartQueue, setAddToCartQueue] = useGlobalState('addToCartQueue')
  const queueCount = useMemo(() => {
    return addToCartQueue.reduce((prev, cur) => prev + cur.count, 0)
  }, [addToCartQueue])
  const displayCount = useMemo(
    () => cartCount - queueCount,
    [cartCount, queueCount]
  )

  const shoppingCartButtonRef = useRef(null)

  const getPosition = useCallback((rect) => {
    return {
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
    }
  }, [])

  const getEndPosition = useCallback(() => {
    const rect = shoppingCartButtonRef.current?.getBoundingClientRect?.()
    return getPosition(rect)
  }, [])

  const onAniEnd = useCallback(
    (key) => () => {
      setAddToCartQueue((prev) => {
        const newQueue = prev.filter((_) => _.key !== key)
        return newQueue
      })
    },
    []
  )

  return (
    <>
      {renderButton ? (
        renderButton({
          displayCount,
          shoppingCartButtonRef,
          onClick,
        })
      ) : (
        <IconButton onClick={onClick} ref={shoppingCartButtonRef}>
          <Transition key={displayCount} timeout={0}>
            <Badge
              badgeContent={displayCount}
              color="primary"
              overlap="rectangular"
              // ref={badgeRef}
              classes={
                displayCount > 0
                  ? {
                      badge: `${classes.cartBadge} ${classes.shakeY}`,
                    }
                  : {}
              }
            >
              <ShoppingCartIcon />
            </Badge>
          </Transition>
        </IconButton>
      )}

      {addToCartQueue.map((item) => (
        <MovingIcon
          key={item.key}
          startPosition={getPosition(item.addButtonRect)}
          endPosition={getEndPosition()}
          onAniEnd={onAniEnd(item.key)}
        />
      ))}
    </>
  )
}

const MovingIcon = ({ startPosition, endPosition, onAniEnd }) => {
  const classes = useStyles()
  const [t, setT] = useState(0)

  const animationDuration = useMemo(() => {
    // 计算起始点和结束点之间的欧几里得距离
    const distance = Math.sqrt(
      Math.pow(endPosition.left - startPosition.left, 2) +
        Math.pow(endPosition.top - startPosition.top, 2)
    )
    // 根据距离计算动画持续时间
    return Math.max(distance * 0.6, 600)
  }, [startPosition, endPosition])

  // 贝塞尔曲线控制点
  const controlPoint = useMemo(
    () => ({
      x: (startPosition.left + endPosition.left) / 2,
      y: Math.min(startPosition.top, endPosition.top) - 100,
    }),
    [startPosition, endPosition]
  )

  const startAnimate = useCallback(() => {
    let start
    const frameFn = (time) => {
      if (start === undefined) {
        start = time
      }
      const elapsed = time - start
      const progress = Math.min(elapsed / animationDuration, 1)
      setT(progress)

      if (progress < 1) {
        requestAnimationFrame(frameFn)
      } else {
        onAniEnd?.()
      }
    }
    requestAnimationFrame(frameFn)
  }, [onAniEnd])

  const animatedStyle = useMemo(() => {
    const x =
      (1 - t) ** 2 * startPosition.left +
      2 * (1 - t) * t * controlPoint.x +
      t ** 2 * endPosition.left
    const y =
      (1 - t) ** 2 * startPosition.top +
      2 * (1 - t) * t * controlPoint.y +
      t ** 2 * endPosition.top
    let opacity = 0
    if (t <= 0.2) {
      opacity = t / 0.2
    } else if (t >= 0.8) {
      opacity = 1 - (t - 0.8) / 0.2
    } else {
      opacity = 1
    }

    return {
      transform: `translate(${x - 8}px, ${y - 8}px)`,
      opacity: opacity < 0.05 ? 0 : opacity,
    }
  }, [t, startPosition, controlPoint, endPosition])

  useEffect(() => {
    startAnimate()
  }, [])

  return <Box className={classes.movingIcon} style={animatedStyle} />
}

export default ShoppingCartButton
