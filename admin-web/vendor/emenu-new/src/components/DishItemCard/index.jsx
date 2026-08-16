import {
  Badge,
  Box,
  Card,
  CardActionArea,
  CardContent,
  IconButton,
  Typography,
} from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import { AddCircleRounded } from '@material-ui/icons'
import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useBoolean, useSafeState } from 'ahooks'
import { nanoid } from 'nanoid'
import { isEqual, isNil } from 'lodash-es'
import { serverUrl } from '@/utils/env_var'
import ImgFallback from '../common/ImgFallback'
import SoldOutFlag from './SoldOutFlag'
import DishDialog from '@/components/DishDialog'
import useSystemConfig from '@/hooks/useSystemConfig'
import useGetDishMax from '@/hooks/useGetDishMax'
import TextTags from '@/components/TextTag'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import useShowBenefitPrice from '@/hooks/useShowBenefitPrice'
import NormalItemContent from '@/components/DishItemCard/NormalItemContent'
import ImgTag from '@/components/ImgTag'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import { getStorageValue } from '@/utils/storage'
import Toast from '../Toast'
import CornerBadge from '../common/CornerBadge'
import useTranslateOptions from '@/hooks/useTranslateOptions'
import {
  getCrmIntegrationPointBenefitCartItems,
  getCrmIntegrationPointBenefitSubmittedItems,
  getCrmIntegrationPointItemCount,
  isCrmIntegrationRedemptionItemCartItem,
} from '@/utils/crmIntegrationCartValidation'
import {
  runCrmIntegrationPointItemPendingChange,
  shouldSetCrmIntegrationPointItemPending,
} from '@/utils/crmIntegrationRewards'

const useStyles = makeStyles((theme) => {
  const borderRadius = theme.shape.borderRadius * 2
  return {
    largeRoot: {
      position: 'relative',
      // overflow: 'visible',
      // marginBottom: 45,
      maxWidth: 'calc(100vw - 32px)',
      boxShadow: 'none',
      borderRadius,
      backgroundColor: 'transparent',
    },
    comboRoot: {
      position: 'relative',
      maxWidth: 'calc(100vw - 32px)',
      boxShadow: 'none',
      backgroundColor: 'transparent',
      marginBottom: theme.spacing(2),
    },
    root: {
      position: 'relative',
      maxWidth: 'calc(100vw - 32px)',
      borderRadius,
      backgroundColor: 'transparent',
    },
    largeContent: {
      position: 'relative',
      marginTop: -65,
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2),
      borderRadius,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      backgroundColor: alpha(theme.palette.common.white, 1),
      '&:last-child': {
        paddingBottom: theme.spacing(2),
      },
    },
    comboContent: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      marginLeft: 50,
      paddingLeft: 58,
      height: 170,
      borderRadius,
      boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
      backgroundColor: theme.palette.common.white,
      overflow: 'hidden',
      '&:last-child': {
        paddingBottom: theme.spacing(2),
      },
    },
    content: {
      backgroundColor: theme.palette.common.white,
      '&:last-child': {
        paddingBottom: 0,
        paddingRight: 0,
      },
    },
    smallBottomCounter: {
      padding: '12px 16px',
    },
    soldOutMask: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius,
      backgroundColor: alpha(theme.palette.common.black, 0.5),
    },
    soldOutFlag: {
      marginTop: -33,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontWeight: 600,
      borderWidth: 6,
      borderStyle: 'solid',
      borderRadius: '50%',
      transform: 'rotate(-20deg)',
      color: alpha(theme.palette.common.white, 0.8),
    },
    largeImage: {
      display: 'block',
      width: '100%',
      height: 287,
      objectFit: 'cover',
      borderRadius,
    },
    comboImageWrapper: {
      position: 'absolute',
      top: 35,
      width: 100,
      height: 100,
      borderRadius: '50%',
      filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.15))',
    },
    comboImage: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '50%',
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: theme.palette.secondary.main,
    },
    image: {
      display: 'block',
      width: '100%',
      height: 132,
      objectFit: 'cover',
    },
    largeTitle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontWeight: 700,
      lineHeight: '24px',
      letterSpacing: -1,
      '& > span': {
        display: 'inline-block',
        maxWidth: 'calc(100% - 50px)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      },
    },
    title: {
      maxHeight: 48,
      fontWeight: 700,
      lineHeight: '24px',
      letterSpacing: -1,
      marginBottom: 8,
      '& > span': {
        display: 'inline-box',
        maxWidth: 'calc(100% - 50px)',
        overflow: 'hidden',
        lineClamp: 2,
        boxOrient: 'vertical',
        wordBreak: 'break-word',
      },
    },
    desc: {
      color: '#4F4F4F',
      marginTop: 8,
      // maxHeight: 36,
      height: 51,
      lineHeight: '17px',
      display: 'box',
      overflow: 'hidden',
      lineClamp: 3,
      boxOrient: 'vertical',
    },
    comboDesc: {
      color: '#828282',
      // marginBottom: 8,
      // height: 20,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },
    price: {
      fontWeight: 700,
      color: '#4F4F4F',
      lineHeight: '26px',
    },
    count: {
      width: 30,
      height: 30,
      fontWeight: 700,
      lineHeight: '28px',
      textAlign: 'center',
      borderRadius: theme.shape.borderRadius * 0.5,
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
    },
    addIcon: {
      width: 32,
      height: 32,
      padding: 0,
      '&[disabled]': {
        color: '#e0e0e0',
      },
    },
    crmIntegrationDisabledAddIcon: {
      '&&': {
        color: '#e0e0e0',
      },
    },
    countBadge: {
      padding: 5,
      transform: 'scale(0.8) translate(50%, -50%)',
    },
    smallDishVipPrice: {
      display: 'flex',
      alignItems: 'center',
    },
    comboVipPrice: {
      display: 'flex',
      alignItems: 'center',
    },
  }
})

const ComboItemContent = ({
  classes,
  id,
  name,
  desc,
  price,
  itemPrices,
  taxIds,
  pic,
  outOfStock,
  optionList,
  displayMode,
  count,
  comboCart,
  changeCart,
  combo, // 选择的锅底套餐
  disabled,
  buffetViewOnly = false,
  benefitPrice,
  itemNumber,
  allImgLabel,
  allTextLabel,
  allBadgeLabel,
  isSpecial = false,
  strikethDiscount,
  strikethroughPrice,
  menuTitleFontSize,
  addLimit,
}) => {
  const { t } = useTranslation()
  const { t: gt } = useTranslation('dish')
  const [openDishDialog, { setTrue, setFalse }] = useBoolean()

  const globalCount = useMemo(() => {
    return comboCart.reduce((acc, cur) => acc + cur.count, 0)
  }, [comboCart])

  const isInFreeQuantity = useMemo(() => {
    if (combo) {
      const freeQuantity = combo?.freeQuantity ?? 0
      if (freeQuantity > 0) {
        if (globalCount < freeQuantity) {
          return true
        } else {
          const needShowPrice =
            count <= 0 ||
            comboCart.some((e) => e.id === id && e.count > e.freeQuantityCount)
          return !needShowPrice
        }
      } else {
        return false
      }
    }
    return false
  }, [combo, comboCart, globalCount, count, id])

  const { showPrice, actualBenefitPrice, isHasBenefitPrice, isShowPrice } =
    useShowBenefitPrice({
      price,
      itemPrices,
      benefitPrice,
      optionList,
      isInFreeQuantity,
    })

  const isHidePrice = useMemo(() => {
    if (combo.isSpecialCombo && isInFreeQuantity) {
      return true
    }
    return false
  }, [combo, isInFreeQuantity])

  const isDisabled = useMemo(() => {
    return disabled || buffetViewOnly || outOfStock || count >= addLimit
  }, [disabled, buffetViewOnly, outOfStock, addLimit, count])

  const hasOption = useMemo(() => {
    return itemPrices?.length > 1 || optionList?.length > 0
  }, [itemPrices, optionList])
  const { getFinalConfigById } = useSystemConfig()
  const isOpenSpecialDishPermission = getFinalConfigById(36)?.open
  const isDisplayDishCode = getFinalConfigById(66)?.open
  const [, setOrderAdminPermission] = useGlobalState('orderAdminPermission')
  const [isNeedCheckDishAuth, setIsNeedCheckDishAuth] = useGlobalState(
    'isNeedCheckDishAuth'
  )

  const [cart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const {
    needOrderDishPermission,
    needOrderDishSetPermission,
    needOrderDishEveryonePermission,
    needDishSetPermission,
  } = useCheckDishBeforeOrder()
  const showPermissionModal = (next) => {
    setOrderAdminPermission({
      open: true,
      permission: 'errorMsg',
      next,
    })
  }
  const checkDishPermission = () => {
    if (!isNeedCheckDishAuth) return true

    const orderDishPermission = needOrderDishPermission(cart, combo?.id, orders)
    if (orderDishPermission.needPermission) {
      Toast.error(
        t('checkDish.permission_singleDishLimit', {
          val: orderDishPermission.limitNum,
        })
      )
      if (!isNeedCheckDishAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'dishLimit',
        next: () => {
          setIsNeedCheckDishAuth(false)
        },
      })
      return false
    }

    const orderDishSetPermission = needOrderDishSetPermission(
      cart,
      combo?.id,
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
          setIsNeedCheckDishAuth(false)
        },
      })
      return false
    }

    const dishSetPermission = needDishSetPermission(cart, combo?.id, orders)
    if (dishSetPermission.needPermission) {
      Toast.error(
        t('checkDish.permission_dishSetLimit', {
          val: dishSetPermission.limitNum,
        })
      )
      if (!isNeedCheckDishAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'dishLimit',
        next: () => {
          setIsNeedCheckDishAuth(false)
        },
      })
      return false
    }

    const orderDishEveryonePermission = needOrderDishEveryonePermission(
      cart,
      combo?.id,
      orders
    )
    if (orderDishEveryonePermission.needPermission) {
      Toast.error(
        t('checkDish.permission_singleDishLimit', {
          val: orderDishEveryonePermission.limitNum,
        })
      )
      if (!isNeedCheckDishAuth) return false
      setOrderAdminPermission({
        open: true,
        permission: 'dishLimitEveryone',
        next: () => {
          setIsNeedCheckDishAuth(false)
        },
      })

      return false
    }
    return true
  }
  const handleOpenDialog = () => {
    // 禁用状态
    if (isDisabled) return
    // 检查权限
    if (!checkDishPermission()) return
    // 有option时展开弹窗
    if (hasOption) return setTrue()
    // 纯展示模式可以打开弹窗 但是不能加入到cart
    if (displayMode) return
    // 无option时直接加入到cart

    // 开启可看不可见时候 火锅菜需要输入密码才可以加入
    if (isSpecial && !isOpenSpecialDishPermission) {
      showPermissionModal(() => {
        const data = {
          id,
          count: 1,
          options: [],
          benefitPrice,
          realPrice: price,
          realBenefitPrice: benefitPrice || price,
        }
        changeCart(data)
      })
      return
    }
    const data = {
      id,
      count: 1,
      options: [],
      priceItem: itemPrices?.length === 1 ? itemPrices[0] : undefined,
      benefitPrice,
      realPrice: price,
      realBenefitPrice: benefitPrice || price,
    }
    changeCart(data)
  }

  const countMax = useMemo(() => {
    const DishPerm = needOrderDishPermission(cart, combo?.id, orders)
    const orderDishSetPerm = needOrderDishSetPermission(cart, combo?.id, orders)
    const onePerm = needOrderDishEveryonePermission(cart, combo?.id, orders)
    const dishSetPerm = needDishSetPermission(cart, combo?.id, orders)
    const num = Math.min(
      DishPerm?.maxCartNum ?? 99,
      onePerm?.maxCartNum ?? 99,
      dishSetPerm?.maxCartNum ?? 99,
      orderDishSetPerm?.maxCartNum ?? 99
    )
    return num
  }, [
    orders,
    cart,
    combo?.id,
    isNeedCheckDishAuth,
    needOrderDishPermission,
    needOrderDishEveryonePermission,
    needDishSetPermission,
    needOrderDishSetPermission,
  ])

  const remainFreeQuantity = useMemo(() => {
    const remainFreeQuantity = (combo?.freeQuantity ?? 0) - globalCount
    return remainFreeQuantity > 0 ? remainFreeQuantity : 0
  }, [combo, globalCount])

  const { getItemSizeName } = useTranslateOptions()

  const dishName = useMemo(() => {
    let dishName = gt(id, { defaultValue: name })
    if (itemPrices?.length === 1 && !isNil(combo?.mergeDisplay)) {
      const sizeItem = itemPrices[0]
      const sizeName = getItemSizeName(sizeItem.sizeId) || sizeItem.size
      dishName = `${dishName} (${sizeName})`
    }
    return dishName
  }, [t, id, name, itemPrices])

  return (
    <>
      <Card className={classes.comboRoot}>
        <CardContent
          className={classes.comboContent}
          onClick={handleOpenDialog}
        >
          {allBadgeLabel.map((badge, idx) => (
            <CornerBadge key={idx} text={badge.name} />
          ))}
          <CardActionArea disabled={isDisabled}>
            <Typography
              gutterBottom
              variant="h6"
              component="h3"
              className={classes.title}
              style={{
                opacity: isDisabled ? 0.5 : 1,
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  maxWidth: 'calc(100% - 75px)',
                  fontSize: menuTitleFontSize,
                }}
              >
                {itemNumber && isDisplayDishCode ? `${itemNumber}.` : null}
                {dishName}
              </span>
              <ImgTag allImgLabel={allImgLabel} />
            </Typography>
          </CardActionArea>
          <TextTags
            allTextLabel={allTextLabel}
            wrapperStyle={{ marginTop: 0 }}
          />
          <CardActionArea disabled={isDisabled}>
            <Typography
              variant="body2"
              component="p"
              className={classes.comboDesc}
              style={{ opacity: isDisabled ? 0.5 : 1, marginTop: 8 }}
            >
              {gt(id, { ns: 'description' })}
            </Typography>
          </CardActionArea>
          <Box display="flex" justifyContent="space-between" mt="auto">
            <div
              className={classes.comboVipPrice}
              style={{ visibility: `${isShowPrice ? 'visible' : 'hidden'}` }}
            >
              {/* 划线折扣 */}
              {strikethDiscount !== undefined && strikethDiscount != null && (
                <Typography
                  style={{ marginRight: '5px', color: '#96272f' }}
                  variant="body1"
                  component="h4"
                  className={classes.price}
                >
                  {strikethDiscount}
                </Typography>
              )}

              <Typography
                variant="body1"
                component="h4"
                className={classes.price}
              >
                {isHidePrice ? null : showPrice}
              </Typography>

              {/* 划线价的内容 */}
              {strikethroughPrice !== undefined &&
                strikethroughPrice != null && (
                  <span
                    style={{
                      textDecoration: 'line-through',
                      color: 'gray',
                      fontSize: '0.8rem',
                      marginLeft: '5px',
                    }}
                  >
                    ${strikethroughPrice.toFixed(2)}
                  </span>
                )}
              {isHasBenefitPrice && !isHidePrice && (
                <VipPriceWithImg
                  style={{ marginLeft: 4 }}
                  benefitPrice={actualBenefitPrice}
                />
              )}
            </div>
            {!displayMode && (
              <IconButton
                color="primary"
                className={classes.addIcon}
                disabled={isDisabled || 1 > countMax}
              >
                <Badge
                  badgeContent={count}
                  color="secondary"
                  overlap="rectangular"
                  classes={{ badge: classes.countBadge }}
                >
                  <AddCircleRounded style={{ fontSize: 32 }} />
                </Badge>
              </IconButton>
            )}
          </Box>
        </CardContent>
        <CardActionArea
          className={classes.comboImageWrapper}
          disabled={isDisabled}
          onClick={handleOpenDialog}
        >
          {outOfStock && <SoldOutFlag size="tiny" />}
          {!outOfStock && buffetViewOnly && (
            <SoldOutFlag
              size="tiny"
              content="not_in_brand"
              variant="maskText"
            />
          )}
          <ImgFallback
            className={classes.comboImage}
            src={serverUrl + pic}
            alt={name}
            itemName={name}
          />
        </CardActionArea>
      </Card>
      <DishDialog
        data={{
          id,
          name,
          desc,
          price,
          itemPrices,
          taxIds,
          pic,
          optionList,
          combo,
          benefitPrice,
          isSpecial,
          isOpenSpecialDishPermission,
          freeQuantity: remainFreeQuantity,
          mergeDisplay: combo?.mergeDisplay,
        }}
        comboItem
        open={openDishDialog}
        onSubmit={(data) => {
          changeCart(data)
        }}
        onClose={setFalse}
        showPermissionModal={showPermissionModal}
        combo={combo}
      />
    </>
  )
}

function DishItemCard(props) {
  const classes = useStyles()
  const [crmIntegrationPointItemPending, setCrmIntegrationPointItemPending] =
    useSafeState(false)
  const { getFinalConfigById } = useSystemConfig()
  const {
    needOrderDishPermission,
    needOrderDishSetPermission,
    needOrderDishEveryonePermission,
    needDishSetPermission,
    needDishOrderIntervalPermission,
    needDishLimitPerRoundPermission,
    needMutexDishPermission,
    needQuantityPermission,
  } = useCheckDishBeforeOrder()
  const [orders] = useGlobalState('Orders')
  const customMenuTitle = getFinalConfigById(53)
  const isCustomMenuTitle = customMenuTitle?.open
  const menuTitleFontSize = useMemo(() => {
    return isCustomMenuTitle ? customMenuTitle.menuTitleFontSize : '1.25rem'
  }, [isCustomMenuTitle])
  const isDisplayMode = getFinalConfigById(10)?.open
  const labelsSetting = getFinalConfigById(31)?.labelsSetting
  const isNeedPasswordAuth = getFinalConfigById(54)?.open
  const hideSoldOutDish = getFinalConfigById(78)?.open
  const {
    id,
    isRecommend = false,
    spicy = false,
    checkDish,
    textTags = [],
    badgeTags = [],
  } = props

  const allImgLabel = useMemo(() => {
    const defaultImgLabel = [{ isRecommend }, { spicy }]
    return labelsSetting?.length
      ? labelsSetting
          .filter(
            (customLabel) =>
              customLabel.type === 'picture' && customLabel.dishIds.includes(id)
          )
          .concat(defaultImgLabel)
          .slice(0, 2) // 最多两个icon
      : defaultImgLabel
  }, [labelsSetting, id, isRecommend, spicy])

  const allTextLabel = useMemo(() => {
    return labelsSetting?.length
      ? labelsSetting
          .filter(
            (customLabel) =>
              customLabel.type === 'text' && customLabel.dishIds.includes(id)
          )
          .concat(textTags)
      : textTags
  }, [labelsSetting, id, textTags])

  const allBadgeLabel = useMemo(() => {
    return badgeTags.slice(0, 1)
  }, [badgeTags])

  const dishMax = useGetDishMax(props.id)
  const [cart, setCart] = useGlobalState('Cart')
  const [storagedCart, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const [comboCart, setComboCart] = useGlobalState('ComboCart')
  const [addToCartQueue, setAddToCartQueue] = useGlobalState('addToCartQueue')
  const [memberInfo] = useGlobalState('memberInfo')
  const memberInfoRef = useRef(memberInfo)
  memberInfoRef.current = memberInfo
  const [, setCurrentBuffetInfo] = useGlobalState('currentBuffetInfo', [])

  const smallItems = useMemo(() => {
    if (props.crmIntegrationPointItem) {
      return cart.filter(
        (item) =>
          !item.large &&
          item.crmIntegrationPointItemKey === props.crmIntegrationPointItemKey
      )
    }

    return cart.filter((e) => {
      const isSameId = !e.large && e.id === props.id
      if (props.rewardRule) {
        return isSameId && e.rewardRule
      }
      return (
        isSameId &&
        !e.rewardRule &&
        !e.crmIntegrationPointItemKey &&
        !e.isLotteryDish
      )
    })
  }, [
    cart,
    props.crmIntegrationPointItem,
    props.crmIntegrationPointItemKey,
    props.id,
    props.rewardRule,
  ])

  const crmIntegrationPointItemCount = useMemo(
    () =>
      props.crmIntegrationPointItem
        ? getCrmIntegrationPointItemCount(
            cart,
            props.crmIntegrationPointItemKey
          )
        : 0,
    [cart, props.crmIntegrationPointItem, props.crmIntegrationPointItemKey]
  )

  const smallCount = useMemo(
    () =>
      props.crmIntegrationPointItem
        ? crmIntegrationPointItemCount
        : smallItems?.reduce((acc, cur) => acc + cur.count, 0) || 0,
    [crmIntegrationPointItemCount, props.crmIntegrationPointItem, smallItems]
  )

  const largeCount = useMemo(
    () =>
      props.crmIntegrationPointItem
        ? crmIntegrationPointItemCount
        : cart
            .filter(
              (item) =>
                item.large &&
                item.id === props.id &&
                !item.crmIntegrationPointItemKey
            )
            .reduce((acc, cur) => acc + cur.count, 0),
    [
      cart,
      crmIntegrationPointItemCount,
      props.crmIntegrationPointItem,
      props.id,
    ]
  )

  const submittedItems = useMemo(
    () =>
      (Array.isArray(orders) ? orders : []).flatMap((order) =>
        Array.isArray(order?.cart) ? order.cart : []
      ),
    [orders]
  )
  const pendingBenefitItems = useMemo(
    () =>
      props.crmIntegrationPointItem
        ? getCrmIntegrationPointBenefitCartItems(
            cart,
            props.crmIntegrationBenefit
          )
        : [],
    [cart, props.crmIntegrationBenefit, props.crmIntegrationPointItem]
  )
  const submittedBenefitItems = useMemo(
    () =>
      props.crmIntegrationPointItem
        ? getCrmIntegrationPointBenefitSubmittedItems(
            submittedItems,
            props.crmIntegrationBenefit
          )
        : [],
    [props.crmIntegrationBenefit, props.crmIntegrationPointItem, submittedItems]
  )
  const selectedTotal = useMemo(
    () =>
      [...pendingBenefitItems, ...submittedBenefitItems].reduce(
        (total, item) => total + Number(item?.count || 0),
        0
      ),
    [pendingBenefitItems, submittedBenefitItems]
  )
  const remainingSelectable = Number.isFinite(props.crmIntegrationMaxSelectable)
    ? Math.max(props.crmIntegrationMaxSelectable - selectedTotal, 0)
    : Infinity
  const currentPointItemCount = props.large ? largeCount : smallCount
  const itemMax = props.crmIntegrationPointItem
    ? Number.isFinite(remainingSelectable)
      ? currentPointItemCount + remainingSelectable
      : 99
    : props.rewardRule
      ? 1
      : dishMax

  const comboCount = useMemo(
    () =>
      comboCart
        .filter((e) => e.comboItem && e.id === props.id)
        .reduce((acc, cur) => acc + cur.count, 0),
    [comboCart, props.id]
  )

  const addButtonRef = useRef(null)
  const queueCount = useMemo(() => {
    const keyList = smallItems.map((e) => e.key).filter(Boolean)
    return addToCartQueue
      .filter((_) => keyList.includes(_.dishKey))
      .reduce((acc, cur) => acc + cur.count, 0)
  }, [smallItems, addToCartQueue])

  const handleChangeCount = (value) => {
    const newCart = [...cart]
    const sameDish = (e) => {
      const isSameId = e.id === props.id
      if (props.rewardRule) {
        return isSameId && e.rewardRule
      }
      return isSameId && !e.rewardRule && !e.crmIntegrationPointItemKey
    }
    // 优先改「加号」行（无 seasoningSnapshots）；没有时再改 Detail 行，避免 count 卡死或重复加行
    let idx = newCart?.findIndex(
      (e) => sameDish(e) && !Object.prototype.hasOwnProperty.call(e, 'seasoningSnapshots')
    )
    if (idx < 0) {
      idx = newCart?.findIndex(sameDish)
    }
    let originalCount = 0
    let dishKey = undefined
    if (idx > -1) {
      if (value > 0) {
        originalCount = newCart[idx].count
        dishKey = newCart[idx].key
        newCart[idx] = {
          ...newCart[idx],
          count: value,
        }
      } else {
        newCart.splice(idx, 1)
      }
    } else {
      if (value > 0) {
        dishKey = nanoid()
        newCart.push({
          ...props,
          key: dishKey,
          count: value,
          realBenefitPrice: props?.benefitPrice,
        })
      }
    }
    const count = value - originalCount

    if (count > 0) {
      const addButtonRect = addButtonRef.current?.getBoundingClientRect?.()
      if (addButtonRect) {
        setAddToCartQueue((prev) => [
          ...prev,
          { key: nanoid(), count, addButtonRect, dishKey },
        ])
      }
    }
    setCart(newCart)
    setStoragedCart(newCart)
  }

  const handleChangeCart = (data) => {
    const newCart = [...cart]
    let idx = newCart?.findIndex((e) => {
      // * 查找购物车中id, priceItem, options, instructions, seasoningSnapshots都一样的项
      return (
        e.id === data.id &&
        !e.crmIntegrationPointItemKey &&
        isEqual(e.priceItem, data.priceItem) &&
        isEqual(e.options, data.options) &&
        e.instructions === data.instructions &&
        isEqual(e.seasoningSnapshots, data.seasoningSnapshots)
      )
    })
    let dishKey = undefined
    if (idx > -1) {
      const { count, ...rest } = newCart[idx]
      dishKey = newCart[idx].key
      newCart[idx] = {
        ...rest,
        count: count + data.count,
      }
    } else {
      dishKey = nanoid()
      newCart.push({
        key: dishKey,
        ...props,
        ...data,
      })
    }
    if (data.count > 0) {
      const addButtonRect = addButtonRef.current?.getBoundingClientRect?.()
      if (addButtonRect) {
        setAddToCartQueue((prev) => [
          ...prev,
          { key: nanoid(), count: data.count, addButtonRect, dishKey },
        ])
      }
    }
    setCart(newCart)
    setStoragedCart(newCart)
  }

  const handleChangeCombo = (data) => {
    const dishKey = nanoid()
    let newCart = [
      ...comboCart,
      {
        key: dishKey,
        ...props,
        ...data,
      },
    ]

    if (props.combo?.freeQuantity > 0) {
      let freeQuantityCount = props.combo?.freeQuantity
      newCart = newCart.map((item) => {
        const tmpFreeQuantityCount = freeQuantityCount - item.count
        const newItem = {
          ...item,
          count: item.count,
          freeQuantityCount:
            tmpFreeQuantityCount >= 0 ? item.count : freeQuantityCount,
        }
        freeQuantityCount = tmpFreeQuantityCount > 0 ? tmpFreeQuantityCount : 0
        return newItem
      })
    }

    if (data.count > 0) {
      const addButtonRect = addButtonRef.current?.getBoundingClientRect?.()
      if (addButtonRect) {
        setAddToCartQueue((prev) => [
          ...prev,
          { key: nanoid(), count: data.count, addButtonRect, dishKey },
        ])
      }
    }
    setComboCart(newCart)
  }

  // 初始化加载Storage保存的购物车数据
  useEffect(() => {
    if (storagedCart.length) {
      const isCRMLogin = Object.keys(memberInfoRef.current || {}).length > 0
      const needClearRedeemItem = !isCRMLogin
      const currentCart = needClearRedeemItem
        ? storagedCart.filter(
            (each) =>
              !each.rewardRule && !isCrmIntegrationRedemptionItemCartItem(each)
          )
        : storagedCart
      if (!isEqual(currentCart, storagedCart)) {
        setStoragedCart(currentCart)
      }
      setCart((prev) => (isEqual(prev, currentCart) ? prev : currentCart))
      const currentBuffetInfo = currentCart.filter((each) => each.isBuffetItem)
      if (currentBuffetInfo.length) {
        setCurrentBuffetInfo((prev) =>
          isEqual(prev, currentBuffetInfo) ? prev : currentBuffetInfo
        )
      }
    }
  }, [setCart, storagedCart, setCurrentBuffetInfo])

  // 锅底是否可以重复选
  const isComboRepeatDisabled = useMemo(() => {
    if (!props.combo || !comboCart.length || props.combo.repeatable)
      return false
    return comboCart.find((each) => each.id === props.id)
  }, [props, comboCart])

  /* PIT-3134 判断是不是菜单下单限制配置的需要权限的菜品
   * 需要权限才能下单的菜，数据存在：getFinalConfigById(1)
   * isSpecial字段传到组件和toast弹窗
   * 品类模式的参数是:buffetViewOnly
   * 只加了关于isSpecial的判断，并在处理显示和关闭时候，都是直接用的品类那边的业务逻辑，没有做额外开发
   */
  const isSpecialPermission = getFinalConfigById(1)
  const isBrandOpen = getFinalConfigById(13)?.open
  const isMenuClassifyOpen = getFinalConfigById(52)?.open

  const isSpecial = useMemo(() => {
    if (isBrandOpen || isMenuClassifyOpen) return false
    if (
      Array.isArray(isSpecialPermission) &&
      isSpecialPermission.length > 0 &&
      isSpecialPermission.indexOf(props.id) > -1
    ) {
      return true
    }
    return false
  }, [isSpecialPermission, props.id, isBrandOpen, isMenuClassifyOpen])

  const orderId = useMemo(() => orders?.[0]?.id, [orders])
  const orderNums = useMemo(() => orders?.[0]?.numOfGuests, [orders])

  const currentPartySize = useMemo(() => {
    if (!orderId) return getStorageValue('emenu_partySize')
    return orderNums
  }, [orderId, orderNums])

  const countMax = useMemo(() => {
    const DishPerm = needOrderDishPermission(cart, id, orders)
    const orderDishSetPerm = needOrderDishSetPermission(cart, id, orders)
    const onePerm = needOrderDishEveryonePermission(cart, id, orders)
    const dishSetPerm = needDishSetPermission(cart, id, orders)
    const dishLimitPerRoundPerm = needDishLimitPerRoundPermission(cart, id)
    const mutexDishPerm = needMutexDishPermission(cart, id)
    const quantityPerm = needQuantityPermission(cart, id)

    const num = Math.min(
      itemMax,
      dishSetPerm?.maxCartNum ?? 99,
      onePerm?.maxCartNum ?? 99,
      DishPerm?.maxCartNum ?? 99,
      dishLimitPerRoundPerm?.maxCartNum ?? 99,
      mutexDishPerm?.maxCartNum ?? 99,
      orderDishSetPerm?.maxCartNum ?? 99,
      quantityPerm?.maxCartNum ?? 99
    )
    return num
  }, [
    itemMax,
    orders,
    cart,
    currentPartySize,
    needDishLimitPerRoundPermission,
    needMutexDishPermission,
    needQuantityPermission,
  ])

  const dishOrderInterval = useMemo(() => {
    const dishOrderIntervalPermission = needDishOrderIntervalPermission(
      id,
      orders
    )
    return dishOrderIntervalPermission
  }, [id, orders, needDishOrderIntervalPermission])

  /* 火锅锅底 */
  if (props.comboItem) {
    if (hideSoldOutDish && props.outOfStock) {
      return null
    }

    return (
      <ComboItemContent
        classes={classes}
        {...props}
        displayMode={isDisplayMode}
        count={props.combo ? comboCount : largeCount}
        disabled={
          comboCart.length >= props.combo?.count || isComboRepeatDisabled
        }
        comboCart={comboCart}
        changeCart={(v) =>
          props.combo ? handleChangeCombo(v) : handleChangeCart(v)
        }
        isSpecial={isSpecial}
        allImgLabel={allImgLabel}
        allTextLabel={allTextLabel}
        allBadgeLabel={allBadgeLabel}
        menuTitleFontSize={menuTitleFontSize}
      />
    )
  }

  /* 大小图菜 */
  return (
    <NormalItemContent
      classes={classes}
      {...props}
      displayMode={isDisplayMode}
      count={props.large ? largeCount : smallCount}
      crmIntegrationPointItemPending={crmIntegrationPointItemPending}
      onCrmIntegrationPointItemBeforeAdd={() =>
        props.onCrmIntegrationPointItemBeforeAdd?.({
          benefit: props.crmIntegrationBenefit,
          item: props,
        }) === true
      }
      changeCount={(count) => {
        if (!props.crmIntegrationPointItem) {
          return handleChangeCount(count)
        }
        const shouldSetPending = shouldSetCrmIntegrationPointItemPending({
          currentCount: currentPointItemCount,
          nextCount: count,
        })
        return runCrmIntegrationPointItemPendingChange({
          shouldSetPending,
          onPendingChange: setCrmIntegrationPointItemPending,
          onChange: () =>
            props.onCrmIntegrationPointItemChange?.({
              benefit: props.crmIntegrationBenefit,
              item: props,
              count,
              entryValidated: shouldSetPending,
            }),
        })
      }}
      itemMax={countMax}
      dishOrderInterval={dishOrderInterval}
      changeCart={(detailData) => {
        if (!props.crmIntegrationPointItem) {
          return handleChangeCart(detailData)
        }
        return runCrmIntegrationPointItemPendingChange({
          shouldSetPending: shouldSetCrmIntegrationPointItemPending({
            isDetailSubmit: true,
          }),
          onPendingChange: setCrmIntegrationPointItemPending,
          onChange: () =>
            props.onCrmIntegrationPointItemChange?.({
              benefit: props.crmIntegrationBenefit,
              item: props,
              detailData,
              entryValidated: true,
            }),
        })
      }}
      allImgLabel={allImgLabel}
      allTextLabel={allTextLabel}
      allBadgeLabel={allBadgeLabel}
      isSpecial={isSpecial}
      checkDish={checkDish}
      menuTitleFontSize={menuTitleFontSize}
      isNeedPasswordAuth={isNeedPasswordAuth}
      queueCount={queueCount}
      addButtonRef={addButtonRef}
    />
  )
}

export default DishItemCard
