import React, { Suspense, lazy, useMemo } from 'react'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { serverUrl } from '@/utils/env_var'
import { Badge, ButtonBase, makeStyles } from '@material-ui/core'
import { Transition } from 'react-transition-group'
import { useBoolean } from 'ahooks'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import ShoppingCartButtonComponent from '@/components/ShoppingCart/ShoppingCartButton'

const ShoppingCart = lazy(() => import('@/components/ShoppingCart'))

const useStyles = makeStyles(() => ({
  cartImg: {
    width: '100%',
    height: '100%',
  },
  cartBadge: {
    transform: 'scale(1) translate(50%, -50%)',
  },
  '@keyframes shakeY': {
    'from, to': {
      transform: 'scale(1) translate3d(50%, -50%, 0)',
    },
    '10%, 30%, 50%, 70%, 90%': {
      transform: 'scale(1.2) translate3d(50%, -100%, 0)',
    },
    '20%, 40%, 60%, 80%': {
      transform: 'scale(1.2) translate3d(50%, 0, 0)',
    },
  },
  shakeY: {
    animation: '$shakeY 1000ms ease-in-out',
  },
}))

const ShoppingCartButton = ({ config }) => {
  const { style, props } = config

  const classes = useStyles()
  const themeStyles = useEmenuProThemeAdapter(style)

  const imgUrl = useMemo(() => {
    const imgUrl = props.imgUrl
    if (imgUrl) return serverUrl + imgUrl
    const defaultImg = props.defaultImg
    if (defaultImg) {
      const defaultImgArray = defaultImg.split('/')
      const imageName = defaultImgArray[defaultImgArray.length - 1]
      return `${serverUrl}emenuPro/images/${imageName}`
    }
    return undefined
  }, [props.imgUrl, props.defaultImg])

  const [
    shoppingCartVisible,
    { setTrue: openShoppingCart, setFalse: closeShoppingCart },
  ] = useBoolean(false)

  return (
    <>
      <ShoppingCartButtonComponent
        onClick={openShoppingCart}
        renderButton={({ displayCount, shoppingCartButtonRef, onClick }) => {
          return (
            <ButtonBase
              style={{
                ...themeStyles,
                position: 'absolute',
              }}
              onClick={onClick}
              ref={shoppingCartButtonRef}
            >
              <Transition key={displayCount} timeout={0}>
                <Badge
                  badgeContent={displayCount}
                  color="primary"
                  overlap="circular"
                  classes={
                    displayCount > 0
                      ? {
                          root: classes.cartImg,
                          badge: `${classes.cartBadge} ${classes.shakeY}`,
                        }
                      : { root: classes.cartImg }
                  }
                >
                  <img src={imgUrl} className={classes.cartImg} />
                </Badge>
              </Transition>
            </ButtonBase>
          )
        }}
      />

      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <ShoppingCart
          isOpen={shoppingCartVisible}
          handleClose={closeShoppingCart}
        />
      </Suspense>
    </>
  )
}

export default React.memo(ShoppingCartButton)
