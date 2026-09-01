import React, { useMemo } from 'react'
import {
  Box,
  // Button,
  // Dialog,
  // DialogActions,
  // DialogContent,
  // DialogTitle,
  Divider,
  Paper,
  Typography,
} from '@material-ui/core'
import { alpha, makeStyles, withStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'
import { serverUrl } from '@/utils/env_var'
import ImgFallback from '../common/ImgFallback'
import EmptyCart from './EmptyCart'
import CartBenefit from '@/components/CRMLogin/CartBenefit'
import BenefitDish from '@/assets/image/benefitDish.png'
import CallerServerCheckout from './CallerServerCheckout'
import RedeemPoint from '@/components/RedeemPoint'
import CrmDiscount from '@/components/CrmDiscount'
import useCheckOrderBenefit from '@/hooks/useCheckOrderBenefit'
import useCountOrderInfo from '@/hooks/useCountOrderInfo'
import RED_VOUCHER from '@/assets/image/red_voucher.png'
import useTranslateOptions from '@/hooks/useTranslateOptions'
import dayjs from 'dayjs'
import useSystemConfig from '@/hooks/useSystemConfig'
import { getDiscountedUnitPrice } from '@/utils/cartItemDiscount'
import { roundToPrecision } from '@/utils/number'
import { getDishItemRedeemPoints } from '@/utils/crmIntegrationRewards'

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
  },
  cartItemList: {
    height: 'calc(100vh - 345px)',
    overflowY: 'auto',
    margin: theme.spacing(1, -1),
    padding: theme.spacing(0, 1),
    paddingBottom: 105,
    '&::-webkit-scrollbar': {
      width: 5,
      height: 5,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A200,
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.primary.light,
    },
  },
  cartItem: {
    margin: theme.spacing(2, 0),
    borderRadius: 15,
    boxShadow: '-4px 4px 8px rgba(0, 0, 0, 0.04)',
    position: 'relative',
  },
  cartItemName: {
    marginBottom: 2,
    fontWeight: 600,
    fontSize: 18,
    letterSpacing: -0.4,
    lineHeight: '21px',
  },
  cartItemOption: {
    marginBottom: 4,
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
  sentVoucherItem: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
  },
  cartItemPrice: {
    fontWeight: 700,
    lineHeight: '19px',
    color: '#4F4F4F',
  },
  cartItemOriginalPriceDiscounted: {
    textDecoration: 'line-through',
    color: '#828282',
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
    padding: '1px 3px',
    fontWeight: 700,
    lineHeight: '28px',
    textAlign: 'center',
    borderRadius: theme.shape.borderRadius * 0.5,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
  cartInstructions: {
    fontSize: 14,
    fontWeight: 500,
    wordBreak: 'break-word',
    lineHeight: '17px',
    color: '#828282',
  },
  cartItemRightBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cartItemSendToKitchen_already: {
    backgroundColor: 'rgba(97, 97, 97, 0.2)',
    padding: '1px 3px',
    lineHeight: '28px',
    borderRadius: '5px',
    color: '#616161',
  },
  cartItemSendToKitchen_wait: {
    backgroundColor: 'rgba(249, 129, 12, 0.2)',
    padding: '1px 3px',
    lineHeight: '28px',
    borderRadius: '5px',
    color: '#F9810C',
  },
  priceLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    fontSize: 16,
    lineHeight: 1.2,
    color: '#4F4F4F',
    '&:last-child': {
      marginBottom: 0,
      fontWeight: 700,
    },
  },
  sumInfo: {
    backgroundColor: '#fff',
  },
  paper: {
    width: 368,
    // height: 200,
    backgroundColor: '#F4F4F5',
  },
  title: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop: theme.spacing(4),
    '& > .MuiTypography-root': {
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1.2,
      letterSpacing: -0.4,
    },
  },
  optionNote: {
    width: '100%',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(2, 3, 3),
  },
  cancel: {
    width: 300,
    borderRadius: 7,
    height: 60,
    fontWeight: 500,
    fontSize: 20,
    lineHeight: 1.2,
    border: '1px solid #96272F',
    background: '#96272F',
    color: '#ffffff',
  },
}))

const TimeDivider = withStyles({
  text: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '17px',
    color: '#828282',
  },
  border: {
    flex: 1,
    marginLeft: 4,
    borderTop: '1px solid #F4F4F5',
  },
})(({ classes, children }) => (
  <Box display="flex" alignItems="center">
    <span className={classes.text}>{children}</span>
    <div className={classes.border} />
  </Box>
))

function SentOrders() {
  const classes = useStyles()
  const { t } = useTranslation(['translation', 'dish'])
  const [orders] = useGlobalState('Orders')
  const [privilegeItem] = useGlobalState('privilegeItem')
  const [redeemDiscountOpen] = useGlobalState('redeemDiscountOpen')
  const { isCartRedeem, isOrderRedeem } = useCheckOrderBenefit()
  const { subtotal, tax, orderDiscount, charge } = useCountOrderInfo()
  const { renderItemOption } = useTranslateOptions()
  const giftItemOrderDiscountAmount = useMemo(() => {
    return roundToPrecision(
      orders.reduce((orderTotal, order) => {
        if (!Array.isArray(order?.discountList)) return orderTotal

        return (
          orderTotal +
          order.discountList.reduce((discountTotal, discount) => {
            if (discount?.isReward !== true) return discountTotal
            return discountTotal + Number(discount?.amount || 0)
          }, 0)
        )
      }, 0)
    )
  }, [orders])
  const displaySubtotal = useMemo(
    () => roundToPrecision(subtotal + giftItemOrderDiscountAmount),
    [subtotal, giftItemOrderDiscountAmount]
  )
  const displayTotal = useMemo(
    () => roundToPrecision(displaySubtotal + tax + charge - orderDiscount),
    [displaySubtotal, tax, charge, orderDiscount]
  )
  const isHasRedeemItem = useMemo(() => {
    return isCartRedeem || isOrderRedeem
  }, [isCartRedeem, isOrderRedeem])

  const { getFinalConfigById } = useSystemConfig()
  const isDisplayZeroPrice = getFinalConfigById(65)?.open
  const isDisplayCartOrderPrice = getFinalConfigById(82)?.open
  const isShowSendToKitchenStatus = getFinalConfigById(74)?.open

  function cartItem(e, isCombo, order) {
    const isBenefitCard = e.id === privilegeItem.id
    const discountedUnitPrice = getDiscountedUnitPrice(e)
    const isVoucher = e?.rewardRule?.rewardType === 'voucher'
    const isCrmIntegrationPointItem = !!(
      e.crmIntegrationPointItem || e.crmIntegrationPointItemKey
    )
    const orderRewards = Array.isArray(order?.orderRewards)
      ? order.orderRewards
      : []
    const orderReward = e.rewardItem
      ? orderRewards.find(
          (reward) => String(reward?.itemId ?? '') === String(e.id ?? '')
        ) || (orderRewards.length === 1 ? orderRewards[0] : null)
      : null
    const rewardDiscounts = [
      ...(Array.isArray(e.discountList) ? e.discountList : []),
      ...(Array.isArray(order?.discountList) ? order.discountList : []),
    ].filter((discount) => discount?.isReward === true)
    const rewardDiscountPoints = rewardDiscounts.reduce((points, discount) => {
      if (points) return points
      const explicitPoints = Number(
        discount?.point ??
          discount?.points ??
          discount?.requiredPoints ??
          discount?.extraInfo?.point ??
          discount?.extraInfo?.points ??
          discount?.extraInfo?.requiredPoints ??
          0
      )
      if (explicitPoints > 0) return explicitPoints
      const matched = String(discount?.name || '').match(
        /(\d+(?:\.\d+)?)\s*(积分|pts?\.?|points?)/i
      )
      const namePoints = Number(matched?.[1] || 0)
      return namePoints > 0 ? namePoints : points
    }, null)
    const redeemPoints =
      Number(
        getDishItemRedeemPoints({
          rewardRule: e.rewardRule,
          crmIntegrationPointItem: isCrmIntegrationPointItem,
          crmIntegrationPoints: e.crmIntegrationPoints,
        }) ||
          orderReward?.point ||
          orderReward?.points ||
          rewardDiscountPoints ||
          0
      ) || null
    const isRedeemItem =
      !!e.rewardRule || isCrmIntegrationPointItem || !!redeemPoints
    const isPointFreeRedeem =
      !isVoucher &&
      redeemPoints > 0 &&
      (e.price === 0 || e.price === e.discount || discountedUnitPrice === 0)
    const isShowPrice = isDisplayZeroPrice ? true : (e.realPrice ?? e.price) > 0
    return isCombo ? (
      <Paper key={e.key ?? e.id} className={classes.cartItem}>
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
              </Typography>
            )}
            <div className={classes.cartItemRightBottom}>
              {isShowSendToKitchenStatus &&
                (e.sendToKitchenTime ? (
                  <Typography
                    variant="body1"
                    component="span"
                    className={classes.cartItemSendToKitchen_already}
                  >
                    {t('ShoppingCart.sendToKitchen_already')}
                  </Typography>
                ) : (
                  <Typography
                    variant="body1"
                    component="span"
                    className={classes.cartItemSendToKitchen_wait}
                  >
                    {t('ShoppingCart.sendToKitchen_wait')}
                  </Typography>
                ))}
              {!!e.count && (
                <Typography
                  variant="body1"
                  color="primary"
                  component="span"
                  className={classes.cartItemCount}
                >
                  {e.count}
                </Typography>
              )}
            </div>
          </Box>
        </Box>
      </Paper>
    ) : (
      <Paper key={e.key} className={classes.cartItem}>
        <Box display="flex" padding={1}>
          <ImgFallback
            className={classes.cartItemImg}
            src={isBenefitCard ? BenefitDish : serverUrl + e.pic}
            alt={e.name}
            itemName={e.name}
          />
          {isVoucher && (
            <img
              className={classes.sentVoucherItem}
              src={RED_VOUCHER}
              alt="VOUCHER"
            />
          )}
          <Box marginLeft={1} flex={1} overflow="hidden">
            <Typography
              variant="body1"
              component="h6"
              color="textPrimary"
              className={classes.cartItemName}
            >
              {t(e.id, { defaultValue: e.name, ns: 'dish' })}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              className={classes.cartItemOption}
            >
              {renderItemOption(e)?.join('\n')}
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
                  component="span"
                  className={classes.cartItemPrice}
                  style={{
                    visibility: `${isShowPrice ? 'visible' : 'hidden'}`,
                  }}
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
                </Typography>
              )}
              <div className={classes.cartItemRightBottom}>
                {isShowSendToKitchenStatus &&
                  (e.sendToKitchenTime ? (
                    <Typography
                      variant="body1"
                      component="span"
                      className={classes.cartItemSendToKitchen_already}
                    >
                      {t('ShoppingCart.sendToKitchen_already')}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body1"
                      component="span"
                      className={classes.cartItemSendToKitchen_wait}
                    >
                      {t('ShoppingCart.sendToKitchen_wait')}
                    </Typography>
                  ))}
                {!!e.count && (
                  <Typography
                    variant="body1"
                    color="primary"
                    component="span"
                    className={classes.cartItemCount}
                  >
                    {e.count}
                  </Typography>
                )}
              </div>
            </Box>
          </Box>
        </Box>
      </Paper>
    )
  }

  const resolveCartDishes = (cart, time) => {
    const validCart = cart?.filter((item) => item.count > 0)
    return validCart
      .reduce((pre, cur) => {
        const key = cur.createdOn || time
        const existingGroup = pre.find((group) => group.createdOn === key)
        if (existingGroup) {
          existingGroup.dishes.push(cur)
        } else {
          pre.push({ createdOn: key, dishes: [cur] })
        }
        return pre
      }, [])
      ?.sort((a, b) => dayjs(b.createdOn) - dayjs(a.createdOn))
  }
  return (
    <React.Fragment>
      <Box className={classes.root}>
        {orders.length ? (
          <>
            <Box className={classes.cartItemList}>
              {orders
                .slice()
                // .reverse()
                .map((o, i) => (
                  <Box key={o.id} marginTop={i === 0 ? 0 : 3}>
                    {resolveCartDishes(o?.cart, o?.time)?.map((e) => {
                      return (
                        <div key={e.createdOn}>
                          <TimeDivider>
                            {t('ShoppingCart.order_time', {
                              val: new Date(e.createdOn),
                              formatParams: {
                                val: {
                                  // year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: 'numeric',
                                  hour12: true,
                                },
                              },
                            })}
                          </TimeDivider>
                          {e.dishes.map((d) => {
                            return cartItem(d, !!d.comboCart, o)
                          })}
                        </div>
                      )
                    })}
                    <Typography className={classes.cartInstructions}>
                      {o.instructions}
                    </Typography>
                  </Box>
                ))}
            </Box>
            <Box
              position="absolute"
              left={0}
              right={0}
              bottom={0}
              padding={3}
              paddingTop={0}
              className={classes.sumInfo}
            >
              {!redeemDiscountOpen && <CartBenefit />}
              {!redeemDiscountOpen && !isHasRedeemItem && (
                <CrmDiscount orders={orders} />
              )}
              <Divider />
              <Box marginTop={3}>
                {isDisplayCartOrderPrice && (
                  <>
                    <Box className={classes.priceLine}>
                      <span>{t('ShoppingCart.sent_subtotal')}</span>
                      <span>${displaySubtotal.toFixed(2)}</span>
                    </Box>
                    <Box className={classes.priceLine}>
                      <span>{t('ShoppingCart.sent_tax')}</span>
                      <span>${tax.toFixed(2)}</span>
                    </Box>
                    {charge > 0 && (
                      <Box
                        className={classes.priceLine}
                        // onClick={() => {
                        //   chargeInfo?.description && setTrue()
                        // }}
                      >
                        <span>
                          {t('ShoppingCart.sent_add_service')}
                          {/* {chargeInfo?.description ? (
                            <img src={QUESTIONMARK}></img>
                          ) : (
                            ''
                          )} */}
                        </span>
                        <span>${charge.toFixed(2)}</span>
                      </Box>
                    )}
                    {orderDiscount > 0 && (
                      <Box className={classes.priceLine}>
                        <span>{t('ShoppingCart.discount')}</span>
                        <span>${orderDiscount.toFixed(2)}</span>
                      </Box>
                    )}
                    <Box className={classes.priceLine}>
                      <span>{t('ShoppingCart.sent_total')}</span>
                      <span>${displayTotal.toFixed(2)}</span>
                    </Box>
                  </>
                )}
                {!redeemDiscountOpen && <CallerServerCheckout />}
              </Box>
            </Box>
          </>
        ) : (
          <EmptyCart />
        )}
      </Box>
      {/* <Dialog
        classes={{
          paper: classes.paper,
        }}
        onClose={() => {
          setFalse()
        }}
        open={open}
      >
        <DialogTitle className={classes.title}>
          <Box component="strong" marginLeft={1}>
            {t('ShoppingCart.service_dialog_title')}
          </Box>
        </DialogTitle>
        <DialogContent className={classes.optionNote}>
          {chargeInfo?.description}
        </DialogContent>
        <DialogActions className={classes.actions}>
          <Button
            variant="contained"
            size="large"
            className={classes.cancel}
            onClick={() => {
              setFalse()
            }}
          >
            {t('ShoppingCart.service_dialog_closeBtn')}
          </Button>
        </DialogActions>
      </Dialog> */}
    </React.Fragment>
  )
}

export default SentOrders
