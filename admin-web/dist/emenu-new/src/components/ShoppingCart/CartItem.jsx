import { Box, Paper, Typography } from '@material-ui/core'
import ImgFallback from '@/components/common/ImgFallback'
import { serverUrl } from '@/utils/env_var'
import DishItemCount from '@/components/DishItemCount'
import useGetDishMax from '@/hooks/useGetDishMax'
import { useTranslation } from 'react-i18next'
import { alpha, makeStyles } from '@material-ui/core/styles'
import BenefitDish from '@/assets/image/benefitDish.png'
import React, { useEffect, useMemo } from 'react'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import { useGlobalState } from '@/hooks/useGlobalState'
import RedeemPoint from '@/components/RedeemPoint'
import useTranslateOptions from '@/hooks/useTranslateOptions'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import useRafCountDown from '@/hooks/useRafCountDown'
import StarIcon from '@material-ui/icons/Star'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useSelector } from 'react-redux'
import { getDiscountedUnitPrice } from '@/utils/cartItemDiscount'
import { getDishItemRedeemPoints } from '@/utils/crmIntegrationRewards'

const useStyles = makeStyles((theme) => ({
  cartItem: {
    margin: theme.spacing(2, 0),
    borderRadius: 15,
    boxShadow: '-4px 4px 8px rgba(0, 0, 0, 0.04)',
    '&:first-child': {
      marginTop: 0,
    },
    '&:last-child': {
      marginBottom: 0,
    },
  },
  warnWrapper: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  warnContext: {
    backgroundColor: '#fef5f5',
    borderRadius: '5px',
    padding: '8px',
  },
  warnText: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  cartItemName: {
    marginBottom: 2,
    fontWeight: 600,
    fontSize: 18,
    letterSpacing: -0.4,
    lineHeight: '21px',
    //overflow: 'hidden',
    //whiteSpace: 'nowrap',
    //textOverflow: 'ellipsis',
  },
  cartItemOption: {
    marginBottom: 4,
    // lineHeight: '17px',
    minHeight: 23,
    whiteSpace: 'pre-line',
    wordBreak: 'break-word',
  },
  cartItemImg: {
    width: 80,
    height: 80,
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadius,
  },
  cartItemPrice: {
    fontWeight: 700,
    lineHeight: '19px',
    color: '#4F4F4F',
    display: 'flex',
    alignItems: 'baseline',
  },
  cartItemOriginalPriceDiscounted: {
    textDecoration: 'line-through',
    color: '#4F4F4F',
  },
  cartItemDiscountedPrice: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 700,
    lineHeight: '17px',
    color: '#96272F',
  },
  cartItemCount: {
    minWidth: 30,
    // height: 30,
    padding: '1px 3px',
    fontWeight: 700,
    lineHeight: '28px',
    textAlign: 'center',
    borderRadius: theme.shape.borderRadius * 0.5,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
  dishOrderRemainingTime: {},
  combinationIcon: {
    position: 'absolute',
    color: '#FF6A00',
    top: '-6px',
    left: '-6px',
  },
  iconWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
  },
}))

const CartItem = (props) => {
  const classes = useStyles()
  const { t } = useTranslation(['translation', 'dish'])
  const {
    e,
    overLimitItem,
    handleEditItem,
    handleChangeCount,
    disabled,
    isComboCart,
    isDisabledCounter,
    disableAddOnly,
    isDisplayZeroPrice,
    setDishIntervalList,
  } = props
  const sourceCartKey = e.crmIntegrationDisplaySourceKey || e.key
  const sourceCartCount = e.crmIntegrationDisplaySourceCount || e.count
  const editItem = e.crmIntegrationDisplaySourceItem || e
  const { getFinalConfigById } = useSystemConfig()
  const { renderItemOption } = useTranslateOptions()
  const [cart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const selectedBenefitValidation = useSelector(
    (state) => state.crmIntegrationValidationSlice.selectedBenefitValidation
  )
  const itemMaxFromHook = useGetDishMax(e.id)
  const {
    needOrderDishPermission,
    needOrderDishSetPermission,
    needOrderDishEveryonePermission,
    needOrderDishOncePermission,
    needDishSetPermission,
    needDishLimitPerRoundPermission,
    needDishOrderIntervalPermission,
    needMutexDishPermission,
  } = useCheckDishBeforeOrder()

  const itemMax = useMemo(() => {
    if (
      Object.hasOwnProperty.call(e, 'rewardRule') &&
      !!e.rewardRule &&
      Object.hasOwnProperty.call(e, 'itemMax') &&
      typeof e.itemMax === 'number'
    ) {
      // 如果是积分赠菜的话，菜品数量最大值取值e.itemMax
      return e.itemMax
    }
    return itemMaxFromHook
  }, [e, itemMaxFromHook])

  const [privilegeItem] = useGlobalState('privilegeItem')

  const isCrmIntegrationPointItem = !!(
    e.crmIntegrationPointItem || e.crmIntegrationPointItemKey
  )
  const redeemPoints = useMemo(
    () =>
      getDishItemRedeemPoints({
        rewardRule: e.rewardRule,
        crmIntegrationPointItem: isCrmIntegrationPointItem,
        crmIntegrationPoints: e.crmIntegrationPoints,
      }),
    [e.rewardRule, e.crmIntegrationPoints, isCrmIntegrationPointItem]
  )

  const isRedeemItem = useMemo(() => {
    return !!e.rewardRule || isCrmIntegrationPointItem
  }, [e.rewardRule, isCrmIntegrationPointItem])

  // 用于区分积分兑换的免费菜 或者 兑换的折扣菜
  const isBenefitCard = useMemo(() => {
    return e.id === privilegeItem.id
  }, [e.name])

  const isLotteryDish = useMemo(() => {
    return e.isLotteryDish
  }, [e])

  const isShowBenefitPrice = useMemo(() => {
    return (
      typeof e.realBenefitPrice === 'number' &&
      e.realBenefitPrice !== (e.realPrice ?? e.price ?? 0)
    )
  }, [e.realPrice, e.price, e.realBenefitPrice])

  const crmIntegrationDiscounts = useMemo(() => {
    const discounts =
      selectedBenefitValidation?.discountedItemInfoByKey?.[String(e.key)]
        ?.discounts
    if (Array.isArray(e.crmIntegrationDisplayDiscounts)) {
      return e.crmIntegrationDisplayDiscounts
    }
    if (Array.isArray(discounts)) {
      return discounts
    }
    return Array.isArray(e.discountList) ? e.discountList : []
  }, [
    e.key,
    e.crmIntegrationDisplayDiscounts,
    e.discountList,
    selectedBenefitValidation,
  ])

  const discountedUnitPrice = useMemo(() => {
    return getDiscountedUnitPrice(e, crmIntegrationDiscounts)
  }, [e, crmIntegrationDiscounts])

  // 免费积分兑换菜可能以 price=0，或“原价 + 折扣到 0”的形式进入购物车。
  const isPointFreeRedeem = useMemo(() => {
    return redeemPoints > 0 && (e.price === 0 || discountedUnitPrice === 0)
  }, [e.price, discountedUnitPrice, redeemPoints])

  const countMax = useMemo(() => {
    if (isBenefitCard || isRedeemItem) return 1
    if (isDisabledCounter || isLotteryDish) return e.count
    const DishPerm = needOrderDishPermission(cart, props.e.id, orders)
    const orderDishSetPerm = needOrderDishSetPermission(
      cart,
      props.e.id,
      orders
    )
    // const durPerm = needQuantityPermission()
    const onePerm = needOrderDishEveryonePermission(cart, props.e.id, orders)
    const oncePerm = needOrderDishOncePermission([], props.e.id)
    const dishSetPerm = needDishSetPermission(cart, props.e.id, orders)
    const dishLimitPerRoundPerm = needDishLimitPerRoundPermission(
      cart,
      props.e.id
    )
    const mutexDishPerm = needMutexDishPermission(cart, props.e.id)
    const num = Math.min(
      itemMax,
      orderDishSetPerm?.maxCartNum ?? 99,
      dishSetPerm?.maxCartNum ?? 99,
      oncePerm?.maxCartNum || 99,
      onePerm?.maxCartNum ?? 99,
      DishPerm?.maxCartNum ?? 99,
      dishLimitPerRoundPerm?.maxCartNum ?? 99,
      mutexDishPerm?.maxCartNum ?? 99
    )
    return num
  }, [
    isBenefitCard,
    isDisabledCounter,
    isLotteryDish,
    itemMax,
    e.count,
    orders,
    cart,
    needDishLimitPerRoundPermission,
    needMutexDishPermission,
    needOrderDishPermission,
    needOrderDishSetPermission,
    needOrderDishEveryonePermission,
  ])

  const isShowPrice = useMemo(() => {
    if (isDisplayZeroPrice) return true
    return (e.realPrice ?? e.price) > 0
  }, [e.price, e.realPrice, isDisplayZeroPrice])

  const dishOrderInterval = useMemo(() => {
    const dishOrderIntervalPermission = needDishOrderIntervalPermission(
      e.id,
      orders
    )
    return dishOrderIntervalPermission
  }, [e.id, orders, needDishOrderIntervalPermission])

  const { remainingTimeStr: dishOrderCurRemainingTimeStr } = useRafCountDown(
    dishOrderInterval.leftMin > 0 ? dishOrderInterval : null,
    500
  )

  useEffect(() => {
    if (dishOrderCurRemainingTimeStr && !isComboCart) {
      setDishIntervalList((prev) => [...prev, e.id])
    } else {
      setDishIntervalList((prev) => prev.filter((id) => id !== e.id))
    }
  }, [dishOrderCurRemainingTimeStr, isComboCart])

  const combinationDishConfig = getFinalConfigById(77)
  const showCombinationIcon = useMemo(() => {
    if (
      combinationDishConfig?.open &&
      combinationDishConfig?.combinationDish?.length
    ) {
      const combinationDishOptions =
        combinationDishConfig?.combinationDish || []
      for (const item of combinationDishOptions) {
        if (
          item.dishA?.find((each) => each === e.id) &&
          item.dishB?.length &&
          item.dishBCount > 0
        ) {
          return true
        }
      }
    }
    return false
  }, [combinationDishConfig, e.id])

  return isComboCart ? (
    <Paper key={e.tempHotPotId ?? e.key ?? e.id} className={classes.cartItem}>
      <Box padding={1}>
        <Typography
          variant="body1"
          component="h6"
          color="textPrimary"
          className={classes.cartItemName}
        >
          {t(e.id, { defaultValue: e.name, ns: 'dish' })}
        </Typography>
        {e.options && (
          <Typography
            variant="body2"
            color="textSecondary"
            className={classes.cartItemOption}
          >
            {renderItemOption(e)?.join('\n')}
          </Typography>
        )}
        <Box marginTop={1} overflow="hidden">
          {e?.comboCart?.map((c) => {
            return (
              <Box key={c.key} display="flex" marginTop={1}>
                <ImgFallback
                  className={classes.cartItemImg}
                  src={serverUrl + c.pic}
                  alt={c.name}
                  itemName={c.name}
                />
                <Box marginLeft={1} flex={1} overflow="hidden">
                  <Typography
                    variant="body1"
                    component="h6"
                    color="textPrimary"
                    className={classes.cartItemName}
                    title={c.name}
                  >
                    {t(c.id, { defaultValue: c.name, ns: 'dish' })}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    className={classes.cartItemOption}
                  >
                    {renderItemOption(c)?.join('\n')}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
        <Box
          marginTop={2}
          paddingLeft={11}
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
        >
          {isRedeemItem && isPointFreeRedeem ? (
            <RedeemPoint points={redeemPoints} />
          ) : (
            <Typography
              variant="body1"
              component="span"
              className={classes.cartItemPrice}
              style={{ visibility: `${isShowPrice ? 'visible' : 'hidden'}` }}
            >
              <span
                className={
                  discountedUnitPrice !== null
                    ? classes.cartItemOriginalPriceDiscounted
                    : undefined
                }
              >
                ${(e.realPrice ?? e.price)?.toFixed(2)}
              </span>
              {discountedUnitPrice !== null && (
                <span className={classes.cartItemDiscountedPrice}>
                  ${discountedUnitPrice.toFixed(2)}
                </span>
              )}
              {discountedUnitPrice === null && isShowBenefitPrice && (
                <VipPriceWithImg
                  style={{ marginLeft: 8 }}
                  benefitPrice={`$${e.realBenefitPrice?.toFixed(2)}`}
                />
              )}
            </Typography>
          )}
          {!!e.count && (
            <DishItemCount
              count={e.count}
              width={106}
              onChange={(v) =>
                handleChangeCount(
                  sourceCartKey,
                  Math.max(0, sourceCartCount + v - e.count),
                  e.tempHotPotId
                )
              }
              max={disableAddOnly ? e.count : countMax}
              min={disableAddOnly ? 0 : undefined}
              isInShoppingCart={true}
            />
          )}
        </Box>
      </Box>
    </Paper>
  ) : (
    <Paper key={e.key} className={classes.cartItem}>
      {(overLimitItem || dishOrderCurRemainingTimeStr) && (
        <div className={classes.warnWrapper}>
          {overLimitItem && (
            <div className={classes.warnContext}>
              <Typography variant="body2" color={'error'}>
                <div className={classes.warnText}>
                  <span>{t('ShoppingCart.overLimitItem')}</span>
                  <span>
                    ({overLimitItem.count}/{overLimitItem.limitNum})
                  </span>
                </div>
              </Typography>
            </div>
          )}
          {dishOrderCurRemainingTimeStr && (
            <div className={classes.dishOrderRemainingTime}>
              {t('Order.dish_order_left_time', {
                time: dishOrderCurRemainingTimeStr,
              })}
            </div>
          )}
        </div>
      )}

      <Box display="flex" padding={1}>
        <Box className={classes.iconWrapper}>
          {showCombinationIcon && (
            <StarIcon fontSize="small" className={classes.combinationIcon} />
          )}
          <ImgFallback
            className={classes.cartItemImg}
            src={isBenefitCard ? BenefitDish : serverUrl + e.pic}
            alt={e.name}
            onClick={handleEditItem(editItem)}
            itemName={e.name}
          />
        </Box>
        <Box marginLeft={1} flex={1} overflow="hidden">
          <Typography
            variant="body1"
            component="h6"
            color="textPrimary"
            className={classes.cartItemName}
            onClick={handleEditItem(editItem)}
          >
            {t(e.id, { defaultValue: e.name, ns: 'dish' })}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            className={classes.cartItemOption}
            onClick={handleEditItem(editItem)}
          >
            {renderItemOption(e, e.itemPrices?.length === 1)?.join('\n')}
          </Typography>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            {isRedeemItem && isPointFreeRedeem ? (
              <RedeemPoint points={redeemPoints} />
            ) : (
              <Typography
                variant="body1"
                component="h6"
                className={classes.cartItemPrice}
                style={{ visibility: `${isShowPrice ? 'visible' : 'hidden'}` }}
              >
                <span
                  className={
                    discountedUnitPrice !== null
                      ? classes.cartItemOriginalPriceDiscounted
                      : undefined
                  }
                >
                  ${(e.realPrice ?? e.price)?.toFixed(2)}
                </span>
                {discountedUnitPrice !== null && (
                  <span className={classes.cartItemDiscountedPrice}>
                    ${discountedUnitPrice.toFixed(2)}
                  </span>
                )}
                {discountedUnitPrice === null && isShowBenefitPrice && (
                  <VipPriceWithImg
                    style={{ marginLeft: 8 }}
                    benefitPrice={`$${e.realBenefitPrice?.toFixed(2)}`}
                  />
                )}
              </Typography>
            )}

            <Box alignSelf="flex-end">
              <DishItemCount
                count={e.count}
                disabled={disabled}
                width={106}
                onChange={(v) =>
                  handleChangeCount(
                    sourceCartKey,
                    Math.max(0, sourceCartCount + v - e.count)
                  )
                }
                max={disableAddOnly ? e.count : countMax}
                min={disableAddOnly ? 0 : isDisabledCounter ? e.count : 0}
                isInShoppingCart={true}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default CartItem
