import {
  Card,
  CardContent,
  Typography,
  Button,
  CardActions,
  IconButton,
  Box,
  Divider,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { ArrowBackIosRounded } from '@material-ui/icons'
import { useTranslation } from 'react-i18next'
import { roundToPrecision } from '@/utils/number'
import { serverUrl } from '@/utils/env_var'
import ImgFallback from '../common/ImgFallback'
import DishItemCount from '@/components/DishItemCount'
import AddInstructionsDialog from '@/components/AddInstructionsDialog'
import useSystemConfig from '@/hooks/useSystemConfig'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import { useCallback, useMemo } from 'react'
import { useGlobalState } from '@/hooks/useGlobalState'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import Toast from '@/components/Toast'
import useGetDishMax from '@/hooks/useGetDishMax'
import { isNil } from 'lodash-es'
import useTranslateOptions from '@/hooks/useTranslateOptions'

const useStyles = makeStyles((theme) => ({
  card: ({ hasOption }) => ({
    position: 'relative',
    display: 'flex',
    flexFlow: 'column nowrap',
    // width: hasOption ? 400 : 500,
    height: '100%',
    borderRadius: hasOption ? '20px 60px 0 20px' : 20,
    [theme.breakpoints.up('md')]: {
      maxWidth: hasOption ? 400 : 500,
    },
  }),
  wrapper: {
    paddingBottom: theme.spacing(4),
  },
  backIcon: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
    borderRadius: 5,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.15)',
  },
  media: ({ hasOption }) => ({
    minWidth: hasOption ? 400 : 500,
    height: hasOption ? 240 : 300,
    objectFit: 'cover',
    backgroundSize: 'cover',
    display: 'block',
  }),
  content: () => ({
    // minHeight: hasOption ? 235 : 'none',
    padding: theme.spacing(2, 3),
  }),
  title: {
    // height: 72,
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: -1,
    marginBottom: theme.spacing(2),
    // display: 'box',
    // overflow: 'hidden',
    // lineClamp: 2,
    // boxOrient: 'vertical',
  },
  desc: ({ hasOption }) => ({
    color: '#4F4F4F',
    fontSize: 16,
    paddingRight: 10,
    maxHeight: hasOption ? 115 : 44,
    overflow: 'auto',
    // display: 'box',
    // lineClamp: 5,
    // boxOrient: 'vertical',
    // textOverflow: 'ellipsis',
    '&::-webkit-scrollbar': {
      width: 4,
      height: 4,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A200,
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.primary.main,
    },
  }),
  price: {
    color: '#4F4F4F',
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  actions: () => ({
    flexDirection: 'column',
    justifyContent: 'center',
    padding: theme.spacing(3, 3, 0),
  }),
  remove: {
    height: 48,
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.2,
    marginBottom: theme.spacing(1),
  },
  submit: {
    // width: 280,
    height: 48,
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.2,
  },
  priceWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
}))

export default function LeftPanel({
  data,
  isCombo,
  mode,
  count,
  setCount,
  onClose,
  isValid,
  realMainPrice,
  realSubPrice,
  realMainBenefitPrice,
  realSubBenefitPrice,
  instructions,
  setInstructions,
  handleSubmit,
  handleRemove,
  isShowDisplayNote,
  itemMax,
  isSpecial = false,
  showPermissionModal,
  checkDish,
  isNeedPasswordAuth,
  isSubDish,
  hidePrice = false,
  /** When true, use side-by-side (narrow left) chrome even without POS options — e.g. seasoning Detail */
  sideBySide = false,
}) {
  const { t } = useTranslation(['translation', 'dish'])

  const { getItemSizeName } = useTranslateOptions()
  const name = useMemo(() => {
    let name = t(data.id, { defaultValue: data.name, ns: 'dish' })
    const showSizeAfterDishName =
      data.itemPrices?.length === 1 && !isNil(data.mergeDisplay)
    if (showSizeAfterDishName) {
      const sizeItem = data.itemPrices[0]
      const sizeName = getItemSizeName(sizeItem.sizeId) || sizeItem.size
      name = `${name} (${sizeName})`
    }
    return name
  }, [data, t])

  const hasOption =
    sideBySide ||
    data.itemPrices?.length > 1 ||
    data.optionList?.length > 0
  const hasRemove = mode === 'edit' && isCombo && count === 1
  const classes = useStyles({ hasOption })
  const { getFinalConfigById } = useSystemConfig()
  const [cart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const {
    needQuantityPermission,
    needOrderDishPermission,
    needOrderDishEveryonePermission,
    needOrderDishOncePermission,
    needDishSetPermission,
    needDishLimitPerRoundPermission,
    needMutexDishPermission,
    needOrderDishSetPermission,
  } = useCheckDishBeforeOrder()
  const [, setOrderAdminPermission] = useGlobalState('orderAdminPermission')
  const [isNeedCheckDishAuth, setIsNeedCheckDishAuth] = useGlobalState(
    'isNeedCheckDishAuth'
  )
  const isDisplayMode = getFinalConfigById(10)?.open
  const isOpenSpecialDishPermission = getFinalConfigById(36)?.open

  const checkDishStatus = useCallback(() => {
    if (!isNeedCheckDishAuth || isSubDish) return true
    const newCart =
      mode === 'edit'
        ? cart.map((item) => {
            if (item.id === data.id && item.key === data.key) {
              return { ...item, count }
            }
            return item
          })
        : [...cart, { id: data.id, count }]
    const dishLimitPerRoundPermission = needDishLimitPerRoundPermission(
      newCart,
      data.id
    )
    if (dishLimitPerRoundPermission.needPermission) {
      if (dishLimitPerRoundPermission.isDishLimit) {
        if (dishLimitPerRoundPermission.isDishCollection) {
          if (dishLimitPerRoundPermission.isDishType) {
            Toast.error(
              t('checkDish.permission_dishSetLimitPerRoundType', {
                val: dishLimitPerRoundPermission.limitNum,
              })
            )
            if (!isNeedPasswordAuth) return false
            setOrderAdminPermission({
              open: true,
              permission: 'dishSetLimitPerRoundType',
              next: () => {
                setCount(count + 1)
                setIsNeedCheckDishAuth(false)
              },
            })
          } else if (dishLimitPerRoundPermission.isDishPieceSame) {
            Toast.error(
              t('checkDish.permission_dishSetLimitPerRoundPieceSame', {
                val: dishLimitPerRoundPermission.limitNum,
              })
            )
            if (!isNeedPasswordAuth) return false
            setOrderAdminPermission({
              open: true,
              permission: 'dishSetLimitPerRoundPieceSame',
              next: () => {
                setCount(count + 1)
                setIsNeedCheckDishAuth(false)
              },
            })
          } else {
            Toast.error(
              t('checkDish.permission_dishSetLimitPerRound', {
                val: dishLimitPerRoundPermission.limitNum,
              })
            )
            if (!isNeedPasswordAuth) return false
            setOrderAdminPermission({
              open: true,
              permission: 'dishSetLimitPerRound',
              next: () => {
                setCount(count + 1)
                setIsNeedCheckDishAuth(false)
              },
            })
          }
        } else {
          Toast.error(
            t('checkDish.permission_singleDishLimit', {
              val: dishLimitPerRoundPermission.limitNum,
            })
          )
          if (!isNeedPasswordAuth) return false
          setOrderAdminPermission({
            open: true,
            permission: 'dishLimitEveryone',
            next: () => {
              setCount(count + 1)
              setIsNeedCheckDishAuth(false)
            },
          })
        }
      } else {
        Toast.error(
          t('checkDish.permission_orderQuantity', {
            val: dishLimitPerRoundPermission.maxLimit,
          })
        )
        if (!isNeedPasswordAuth) return false
        setOrderAdminPermission({
          open: true,
          permission: 'quantity',
          next: () => {
            setCount(count + 1)
            setIsNeedCheckDishAuth(false)
          },
        })
      }
      return false
    }

    const mutexDishPermission = needMutexDishPermission(newCart, data.id)
    if (mutexDishPermission.needPermission) {
      Toast.error(
        t('checkDish.permission_mutexDish', {
          dishA: t(mutexDishPermission.mutexId, { ns: 'dish' }),
          dishB: t(data.id, { ns: 'dish' }),
        })
      )
      if (!isNeedPasswordAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'mutex',
        next: () => {
          setCount(count + 1)
          setIsNeedCheckDishAuth(false)
        },
      })
      return false
    }

    const orderDishPermission = needOrderDishPermission(
      newCart,
      data.id,
      orders
    )
    if (orderDishPermission.needPermission) {
      Toast.error(
        t('checkDish.permission_singleDishLimit', {
          val: orderDishPermission.limitNum,
        })
      )
      if (!isNeedPasswordAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'dishLimit',
        next: () => {
          setCount(count + 1)
          setIsNeedCheckDishAuth(false)
        },
      })
      return false
    }

    const orderDishSetPermission = needOrderDishSetPermission(
      newCart,
      data.id,
      orders
    )
    if (orderDishSetPermission.needPermission) {
      Toast.error(
        t('checkDish.permission_dishSetLimit', {
          val: orderDishSetPermission.limitNum,
        })
      )
      if (!isNeedCheckDishAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'dishLimit',
        next: () => {
          setCount(count + 1)
          setIsNeedCheckDishAuth(false)
        },
      })
      return false
    }

    const dishSetPermission = needDishSetPermission(newCart, data.id, orders)
    if (dishSetPermission.needPermission) {
      Toast.error(
        t('checkDish.permission_dishSetLimit', {
          val: dishSetPermission.limitNum,
        })
      )
      if (!isNeedPasswordAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'dishLimit',
        next: () => {
          setCount(count + 1)
          setIsNeedCheckDishAuth(false)
        },
      })
      return false
    }

    const orderDishEveryonePermission = needOrderDishEveryonePermission(
      newCart,
      data.id,
      orders
    )
    if (orderDishEveryonePermission.needPermission) {
      Toast.error(
        t('checkDish.permission_singleDishLimit', {
          val: orderDishEveryonePermission.limitNum,
        })
      )
      if (!isNeedPasswordAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'dishLimitEveryone',
        next: () => {
          setCount(count + 1)
          setIsNeedCheckDishAuth(false)
        },
      })

      return false
    }

    const orderDishOncePermission = needOrderDishOncePermission(
      newCart,
      data.id,
      orders
    )
    if (orderDishOncePermission.needPermission) {
      Toast.error(
        t('checkDish.permission_singleDishLimit', {
          val: orderDishOncePermission.limitNum,
        })
      )
      if (!isNeedPasswordAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'dishLimitEveryone',
        next: () => {
          setCount(count + 1)
          setIsNeedCheckDishAuth(false)
        },
      })

      return false
    }
    const quantityPermission = needQuantityPermission(newCart, data.id)
    if (quantityPermission.needPermission) {
      Toast.error(
        t('checkDish.permission_orderQuantity', {
          val: quantityPermission.maxLimit,
        })
      )
      if (!isNeedPasswordAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'quantity',
        next: () => {
          setCount(count + 1)
          setIsNeedCheckDishAuth(false)
        },
      })
      return false
    }

    return true
  }, [
    cart,
    mode,
    data.id,
    data.key,
    orders,
    count,
    t,
    setCount,
    setOrderAdminPermission,
    needOrderDishEveryonePermission,
    needOrderDishOncePermission,
    needQuantityPermission,
    setIsNeedCheckDishAuth,
    needOrderDishPermission,
    needDishLimitPerRoundPermission,
    needMutexDishPermission,
    needOrderDishSetPermission,
    isNeedCheckDishAuth,
    isSubDish,
  ])

  const realShowPrice = useMemo(() => {
    const havePriceCount = count - (data?.freeQuantity ?? 0)
    return roundToPrecision(
      (havePriceCount > 0 ? realMainPrice : 0) + realSubPrice
    )?.toFixed(2)
  }, [realMainPrice, realSubPrice, count, data?.freeQuantity])

  const realShowBenefitPrice = useMemo(() => {
    const havePriceCount = count - (data?.freeQuantity ?? 0)
    return roundToPrecision(
      (havePriceCount > 0 ? (realMainBenefitPrice ?? realMainPrice) : 0) +
        (realSubBenefitPrice ?? realSubPrice)
    )?.toFixed(2)
  }, [
    realMainBenefitPrice,
    realMainPrice,
    realSubBenefitPrice,
    realSubPrice,
    count,
    data?.freeQuantity,
  ])

  const isShowBenefitPrice = useMemo(
    () => realShowPrice !== realShowBenefitPrice,
    [realShowPrice, realShowBenefitPrice]
  )

  const totalPrice = useMemo(() => {
    const subPrice = realSubPrice * count
    const havePriceCount = count - (data?.freeQuantity ?? 0)
    const mainPrice = havePriceCount > 0 ? realMainPrice * havePriceCount : 0
    return roundToPrecision(mainPrice + subPrice)?.toFixed(2)
  }, [realSubPrice, realMainPrice, count, data?.freeQuantity])

  const totalBenefitPrice = useMemo(() => {
    const subBenefitPrice = (realSubBenefitPrice ?? realSubPrice) * count
    const havePriceCount = count - (data?.freeQuantity ?? 0)
    const mainBenefitPrice =
      havePriceCount > 0
        ? (realMainBenefitPrice ?? realMainPrice) * havePriceCount
        : 0
    return roundToPrecision(mainBenefitPrice + subBenefitPrice)?.toFixed(2)
  }, [
    realMainBenefitPrice,
    realMainPrice,
    realSubBenefitPrice,
    realSubPrice,
    count,
    data?.freeQuantity,
  ])

  const onHandleWrapperClick = (event) => {
    const checkDishRes = checkDish()
    if (!checkDishRes) {
      event.stopPropagation()
    }
  }

  const { dishLimitPerRoundPerm, quantityPerm } = useMemo(() => {
    if (isSubDish) {
      return {}
    }
    const newCart =
      mode === 'edit'
        ? cart.map((item) => {
            if (item.id === data.id && item.key === data.key) {
              return { ...item, count }
            }
            return item
          })
        : [...cart, { id: data.id, count }]
    return {
      dishLimitPerRoundPerm: needDishLimitPerRoundPermission(newCart, data.id),
      quantityPerm: needQuantityPermission(newCart, data.id),
    }
  }, [
    mode,
    cart,
    data.id,
    data.key,
    count,
    needDishLimitPerRoundPermission,
    needQuantityPermission,
    isSubDish,
  ])

  const mutexDishPerm = useMemo(() => {
    if (isSubDish) {
      return {}
    }
    return needMutexDishPermission(cart, data.id)
  }, [cart, data.id, needMutexDishPermission, isSubDish])

  const dishMax = useGetDishMax(data.id)

  const _itemMax = useMemo(() => {
    if (isSubDish) {
      return itemMax ?? 99
    }
    const num = Math.min(
      itemMax ?? 99,
      dishMax ?? 99,
      dishLimitPerRoundPerm?.maxCartNum ?? 99,
      mutexDishPerm?.maxCartNum ?? 99,
      quantityPerm?.maxCartNum ?? 99
    )
    return num
  }, [
    itemMax,
    dishMax,
    dishLimitPerRoundPerm,
    mutexDishPerm,
    quantityPerm,
    isSubDish,
  ])

  const totalCount = useMemo(() => {
    if (mode === 'edit') {
      return count
    } else {
      return cart.reduce(
        (prev, cur) => (cur.id === data.id ? prev + cur.count : prev),
        count
      )
    }
  }, [cart, mode, count])

  return (
    <Card className={classes.card} elevation={0}>
      <IconButton className={classes.backIcon} onClick={onClose}>
        <ArrowBackIosRounded />
      </IconButton>
      <div className={classes.wrapper} onClickCapture={onHandleWrapperClick}>
        <ImgFallback
          className={classes.media}
          src={serverUrl + data.pic}
          alt={data.name}
          itemName={data.name}
        />
        <CardContent className={classes.content}>
          <Typography variant="h5" component="h2" className={classes.title}>
            {name}
          </Typography>
          <Typography variant="body2" component="p" className={classes.desc}>
            {t(data.id, { ns: 'description' })}
          </Typography>
        </CardContent>
        <Box marginTop="auto">
          {isDisplayMode ? (
            !hidePrice && (
              <Box paddingX={3}>
                <Typography
                  variant="body1"
                  component="h4"
                  className={classes.price}
                >
                  ${realShowPrice}
                </Typography>
              </Box>
            )
          ) : (
            <>
              <Box
                paddingX={3}
                display="flex"
                justifyContent={
                  hidePrice && hasOption ? 'flex-end' : 'space-between'
                }
                alignItems="center"
              >
                {!hidePrice && (
                  <div className={classes.priceWrapper}>
                    <Typography
                      variant="body1"
                      component="h4"
                      className={classes.price}
                    >
                      <>
                        {data.marketPriceItem ? (
                          t('Order.market_price')
                        ) : (
                          <>${realShowPrice}</>
                        )}
                      </>
                    </Typography>
                    {!data.marketPriceItem && isShowBenefitPrice && (
                      <VipPriceWithImg
                        style={{ marginLeft: 8, fontSize: '1rem' }}
                        benefitPrice={`$${realShowBenefitPrice}`}
                      />
                    )}
                  </div>
                )}
                {!isCombo && (
                  <DishItemCount
                    min={1}
                    count={count}
                    disableBtn={data?.disableBtn || totalCount >= _itemMax}
                    canClickDisableBtn={
                      dishLimitPerRoundPerm?.needPermission ||
                      quantityPerm?.needPermission
                    }
                    width={106}
                    onChange={(v) => setCount(v)}
                    max={_itemMax}
                    disabled={false}
                    isSpecial={isSpecial}
                    showPermissionModal={showPermissionModal}
                    isOpenSpecialDishPermission={isOpenSpecialDishPermission}
                    isContinueAddFn={checkDishStatus}
                  />
                )}
              </Box>
              <Box
                paddingX={3}
                marginTop={3}
                hidden={hasOption || !isShowDisplayNote}
              >
                <Divider light />
                <AddInstructionsDialog
                  type="detail"
                  content={instructions}
                  onChange={(v) => setInstructions(v)}
                />
                <Divider light />
              </Box>
              <CardActions className={classes.actions}>
                {hasRemove && (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    className={classes.remove}
                    onClick={handleRemove}
                  >
                    {t(`DishDialog.btn_remove_pot`)}
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={!isValid || data.disableBtn}
                  className={classes.submit}
                  onClick={handleSubmit}
                >
                  {/* {data.disableBtn.toString()}{isValid.toString()} */}
                  {t(
                    `DishDialog.btn_${mode === 'edit' ? 'update' : 'add_to'}_${
                      data.marketPriceItem || hidePrice
                        ? 'cart_market_price'
                        : isCombo
                          ? 'pot'
                          : 'cart'
                    }`,
                    {
                      count: count || '',
                      price: totalPrice,
                    }
                  )}
                  {!hidePrice &&
                    !data.marketPriceItem &&
                    isShowBenefitPrice && (
                      <VipPriceWithImg
                        imgType="white"
                        style={{
                          marginLeft: 8,
                          fontSize: '1rem',
                          color: '#fff',
                        }}
                        benefitPrice={`$${totalBenefitPrice}`}
                      />
                    )}
                </Button>
              </CardActions>
            </>
          )}
        </Box>
      </div>
    </Card>
  )
}
