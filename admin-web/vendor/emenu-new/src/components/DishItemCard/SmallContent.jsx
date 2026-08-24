import { useTranslation } from 'react-i18next'
import React, { useMemo, memo, useCallback } from 'react'
import { Badge, Button, IconButton } from '@material-ui/core'
import SoldOutFlag from '@/components/DishItemCard/SoldOutFlag'
import ImgFallback from '@/components/common/ImgFallback'
import { serverUrl } from '@/utils/env_var'
import TextTags from '@/components/TextTag'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import { AddCircleRounded } from '@material-ui/icons'
import DishItemCount from '@/components/DishItemCount'
import { useGlobalState } from '@/hooks/useGlobalState'
import RedeemPoint from '@/components/RedeemPoint'
import Toast from '@/components/Toast'
import ImgTag from '@/components/ImgTag'
import styles from './SmallContent.module.less'
import classNames from 'classnames'
import useCheckOrderBenefit from '@/hooks/useCheckOrderBenefit'
import useSystemConfig from '@/hooks/useSystemConfig'
import useRafCountDown from '@/hooks/useRafCountDown'
import StarIcon from '@material-ui/icons/Star'
import CornerBadge from '../common/CornerBadge'
import {
  getDishItemRedeemPoints,
  resolveCrmIntegrationPointItemEntryAction,
  shouldGrayCrmIntegrationPointItemAddButton,
} from '@/utils/crmIntegrationRewards'

const SmallContent = ({
  classes,
  id,
  name,
  pic,
  outOfStock,
  displayMode,
  count,
  changeCount,
  setDisable,
  buffetViewOnly = false,
  itemMax,
  benefitPrice,
  itemNumber,
  large,
  setTrue,
  openAsDetail,
  showSeasoningDetailBtn = false,
  showPrice,
  isHasBenefitPrice,
  isDisplayDishDetails,
  isShowDisplayNote,
  rewardRule,
  actualBenefitPrice,
  allImgLabel,
  allTextLabel,
  allBadgeLabel,
  checkDish,
  isNeedPermissionToRedeem,
  showPermissionModal,
  isSpecial = false,
  strikethroughPrice, //划线价
  strikethDiscount, //划线价的折扣
  isOpenSpecialDishPermission = true, //可见不可点的配置
  isSpecialDishServePermission = true, //弹出服务员授权
  menuTitleFontSize,
  isNeedPasswordAuth,
  queueCount,
  addButtonRef,
  isShowPrice,
  marketPriceItem,
  dishOrderInterval,
  crmIntegrationPointItem = false,
  crmIntegrationPoints,
  crmIntegrationPointItemDisabled = false,
  crmIntegrationPointItemPending = false,
  crmIntegrationPointItemGlobalLocked = false,
  onCrmIntegrationPointItemBeforeAdd,
}) => {
  const { t } = useTranslation()
  const [cart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const [memberInfo] = useGlobalState('memberInfo')
  const [, setLoginOpen] = useGlobalState('open')
  const [, setOrderAdminPermission] = useGlobalState('orderAdminPermission')
  const { isCartRedeem, isOrderRedeem } = useCheckOrderBenefit()
  const [isNeedCheckDishAuth, setIsNeedCheckDishAuth] = useGlobalState(
    'isNeedCheckDishAuth'
  )
  const { getFinalConfigById } = useSystemConfig()
  const isDisplayDishCode = getFinalConfigById(66)?.open
  const displayTextLabels = useMemo(
    () => [
      ...(strikethDiscount !== undefined && strikethDiscount != null
        ? [{ id: 'striketh-discount', name: strikethDiscount }]
        : []),
      ...allTextLabel,
    ],
    [allTextLabel, strikethDiscount]
  )
  const hasStrikethroughPrice =
    !marketPriceItem &&
    strikethroughPrice !== undefined &&
    strikethroughPrice != null
  const showStrikethroughOnPrimary =
    hasStrikethroughPrice && isHasBenefitPrice
  const showStrikethroughOnSecondary =
    hasStrikethroughPrice && !isHasBenefitPrice
  const hasBenefitAndStrikethroughPrice =
    isHasBenefitPrice && hasStrikethroughPrice

  // crm 是否登陆
  const isCRMLogin = useMemo(() => {
    return Object.keys(memberInfo).length > 0
  }, [memberInfo])
  const isCrmIntegrationPointItemVisualDisabled =
    crmIntegrationPointItemDisabled ||
    shouldGrayCrmIntegrationPointItemAddButton({
      crmIntegrationPointItem,
      isLoggedIn: isCRMLogin,
      crmIntegrationPointItemGlobalLocked,
    })

  // 积分是否满足兑换
  const isPointEnough = useMemo(() => {
    if (!memberInfo || !rewardRule) return false
    return memberInfo.pointBalance >= rewardRule.redeemRule.parameters.points
  }, [memberInfo, rewardRule])

  // 是否不能选redeem
  const isDisableRedeem = useMemo(() => {
    if (!rewardRule) return false
    // 未登录, 积分不足, 购物车/订单 已选, 不能选择
    return !!(!isCRMLogin || !isPointEnough || isCartRedeem || isOrderRedeem)
  }, [rewardRule, isCRMLogin, isPointEnough, isCartRedeem, isOrderRedeem])
  const isDisableCrmIntegrationPointItem =
    crmIntegrationPointItem &&
    (crmIntegrationPointItemDisabled || crmIntegrationPointItemPending)
  const redeemPoints = getDishItemRedeemPoints({
    rewardRule,
    crmIntegrationPointItem,
    crmIntegrationPoints,
  })

  const defaultMsg = t('Order.place_order_with_server')

  const isShowDetail = useMemo(() => {
    return large || isDisplayDishDetails || isShowDisplayNote
  }, [large, isDisplayDishDetails, isShowDisplayNote])

  const disabled = useMemo(() => {
    if (!isShowDetail) return outOfStock
    return outOfStock
  }, [isShowDetail, outOfStock])

  const handleShowRedeemStatus = () => {
    // 非积分兑换菜不展示信息
    if (!rewardRule) return
    if (!isCRMLogin) {
      Toast.info(t('crm.loginFirst'))
      setLoginOpen(true)
      return
    }
    const isHasRedeemItem = isCartRedeem || isOrderRedeem
    if (isHasRedeemItem) return Toast.info(t('crm.upperLimit'))
    if (!isPointEnough) return Toast.info(t('crm.noEnoughPoint'))
  }

  const handleClickSmallDish = (event, isNeedCheckDishStatus = true) => {
    event?.stopPropagation()
    if (crmIntegrationPointItem) {
      const isHardBlocked =
        outOfStock || displayMode || crmIntegrationPointItemPending
      const precheckPassed =
        !isHardBlocked && onCrmIntegrationPointItemBeforeAdd?.() === true
      const crmIntegrationPointItemAction =
        resolveCrmIntegrationPointItemEntryAction({
          crmIntegrationPointItem,
          outOfStock,
          displayMode,
          pending: crmIntegrationPointItemPending,
          disabled: crmIntegrationPointItemDisabled,
          isShowDetail,
          count,
          itemMax,
          precheckPassed,
        })

      if (crmIntegrationPointItemAction === 'detail') return setTrue()
      if (crmIntegrationPointItemAction === 'increment') {
        changeCount(count + 1)
      }
      return
    }

    if (rewardRule) {
      handleShowRedeemStatus()
      if (isDisableRedeem) return
      if (
        (!isShowDetail && isNeedPermissionToRedeem) ||
        (isSpecial && isOpenSpecialDishPermission)
      ) {
        showPermissionModal(() => changeCount(count + 1))
        return
      }
    }
    if (!disabled && !isDisableRedeem) {
      if (isNeedCheckDishStatus) {
        if (!checkDishStatus()) return
      }
      if (outOfStock || displayMode) return
      if (itemMax && count >= itemMax) return
      if (isShowDetail) {
        setDisable(
          ((buffetViewOnly || isSpecial) &&
            !isOpenSpecialDishPermission &&
            !isSpecialDishServePermission) ||
            marketPriceItem
        )
        return setTrue()
      }
      if (marketPriceItem) return
      if (isSpecial || buffetViewOnly) {
        if (isOpenSpecialDishPermission) {
          changeCount(count + 1)
        } else if (isSpecialDishServePermission) {
          showPermissionModal(() => changeCount(count + 1))
        }
      } else {
        if (!outOfStock && (buffetViewOnly || isSpecial)) return
        changeCount(count + 1)
      }
    }
  }

  const checkDishStatus = useCallback(() => {
    if (!isNeedCheckDishAuth) return true
    const checkDishRes = checkDish({ cart, id, orders })
    if (!checkDishRes) return true
    const { text, ...val } = checkDishRes
    const type = text.split('_')[1]
    const typeMap = {
      orderQuantity: 'quantity', // 购物车中菜品数量
      orderInterval: 'sendOrderTime', // 订单下单间隔
      dishOrderInterval: 'sendDishOrderTime', // 菜品下单间隔
      dishCollectionOrderInterval: 'sendDishCollectionOrderTime', // 菜品集下单间隔
      orderTimes: 'times', // 下单次数
      singleDishLimit: 'dishLimit', // 单个菜品
      orderDuration: 'duration', // 用餐时长
      dishSetLimit: 'dishSetLimit', // 订单菜品集
      dishSetLimitPerRound: 'dishSetLimitPerRound', // 每轮购物车菜品集
      dishSetLimitPerRoundType: 'dishSetLimitPerRoundType', // 每轮购物车菜品集种类
      dishSetLimitPerRoundPieceSame: 'dishSetLimitPerRoundPieceSame', // 每轮购物车菜品集相同菜品
      orderRestTimeAlert: 'restTimeAlert', // 剩余时长
      mutexDish: 'mutexDish', // 互斥菜品
    }
    Toast.error(t(text, val))
    if (!isNeedPasswordAuth) return false
    if (typeMap[type] === typeMap.orderRestTimeAlert) {
      return false
    }
    setOrderAdminPermission({
      open: true,
      permission: typeMap[type],
      next: () => {
        handleClickSmallDish(undefined, false)
        setIsNeedCheckDishAuth(false)
      },
    })
    return false
  }, [
    checkDish,
    cart,
    id,
    orders,
    t,
    setOrderAdminPermission,
    isNeedCheckDishAuth,
    isNeedPasswordAuth,
  ])

  const { remainingTimeStr: dishOrderCurRemainingTimeStr } = useRafCountDown(
    dishOrderInterval?.leftMin > 0 ? dishOrderInterval : null,
    500
  )

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
          item.dishA?.find((each) => each === id) &&
          item.dishB?.length &&
          item.dishBCount > 0
        ) {
          return true
        }
      }
    }
    return false
  }, [combinationDishConfig, id])

  return (
    <div className={styles.smallContent} onClick={handleClickSmallDish}>
      <div className={styles.imageArea}>
        {allBadgeLabel.map((badge, idx) => (
          <CornerBadge key={idx} text={badge.name} />
        ))}
        {outOfStock && <SoldOutFlag size="small" />}
        {!rewardRule &&
          !crmIntegrationPointItem &&
          dishOrderCurRemainingTimeStr && (
            <div className={styles.dishOrderRemainingTime}>
              {t('Order.dish_order_left_time', {
                time: dishOrderCurRemainingTimeStr,
              })}
            </div>
          )}
        {/* todo特殊类的菜是否需要显示呼叫服务员下单
        {!outOfStock && (buffetViewOnly ||(isSpecial&& !isOpenSpecialDishPermission)) && (
         */}
        {!outOfStock && (buffetViewOnly || isSpecial || marketPriceItem) && (
          <SoldOutFlag
            isBuffetView={true}
            size="small"
            content={defaultMsg}
            // content={(viewOnlyBrand || defaultMsg) + isOpenSpecialDishPermission + isSpecialDishServePermission}
            variant="maskText"
          />
        )}
        <ImgFallback
          className={styles.smallImage}
          src={serverUrl + pic}
          alt={name}
          itemName={name}
        />
      </div>
      <div className={styles.contentOuterWrapper}>
        <div
          className={classNames({
            [styles.contentArea]: true,
            // [styles.disabledContent]: disabled,
          })}
        >
          <div className={styles.nameRow}>
            <span
              className={styles.dishNameText}
              style={{ fontSize: menuTitleFontSize }}
            >
              {itemNumber && isDisplayDishCode ? `${itemNumber}.` : null}
              {t(id, { defaultValue: name, ns: 'dish' })}
            </span>
            <ImgTag allImgLabel={allImgLabel} />
          </div>
          {(showCombinationIcon || displayTextLabels.length > 0) && (
            <div className={styles.textTagsWrapper}>
              {showCombinationIcon && (
                <StarIcon fontSize="small" className={styles.combinationIcon} />
              )}
              <div className={styles.textTagsContainer}>
                <TextTags allTextLabel={displayTextLabels} />
              </div>
            </div>
          )}
          <div className={styles.priceOperationRow}>
            {redeemPoints !== null ? (
              <RedeemPoint points={redeemPoints} />
            ) : isShowPrice ? (
              <div className={styles.pricePart}>
                <div
                  data-primary-price-line
                  className={styles.primaryPriceLine}
                >
                  <span className={styles.price}>{showPrice}</span>
                  {showStrikethroughOnPrimary && (
                      <span className={styles.decoration}>
                        ${strikethroughPrice.toFixed(2)}
                      </span>
                    )}
                </div>
                {!marketPriceItem && isHasBenefitPrice && (
                  <div data-member-price-line className={styles.memberPriceLine}>
                    <VipPriceWithImg
                      style={{ fontSize: '1rem' }}
                      benefitPrice={
                        benefitPrice
                          ? `$${benefitPrice.toFixed(2)}`
                          : actualBenefitPrice
                      }
                    />
                  </div>
                )}
                {showStrikethroughOnSecondary && (
                  <div
                    data-secondary-strikethrough-line
                    className={styles.secondaryStrikethroughLine}
                  >
                    <span className={styles.decoration}>
                      ${strikethroughPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
            <div className={styles.counterPart}>
              {showSeasoningDetailBtn ? (
                <Button
                  size="small"
                  className={styles.seasoningDetailBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (outOfStock || displayMode) return
                    if (!checkDishStatus()) return
                    // Match add path: buffetViewOnly without dish-dialog entry blocks add
                    if (
                      buffetViewOnly &&
                      !isShowDetail &&
                      !isOpenSpecialDishPermission &&
                      !isSpecialDishServePermission
                    ) {
                      return
                    }
                    setDisable(
                      ((buffetViewOnly || isSpecial) &&
                        !isOpenSpecialDishPermission &&
                        !isSpecialDishServePermission) ||
                        marketPriceItem
                    )
                    openAsDetail?.()
                  }}
                >
                  Detail
                </Button>
              ) : null}
              {displayMode ? null : disabled ||
                crmIntegrationPointItemPending ? (
                <IconButton disabled className={classes.addIcon}>
                  <AddCircleRounded style={{ fontSize: 32 }} />
                </IconButton>
              ) : isDisableRedeem ? (
                <IconButton
                  className={classNames(
                    classes.addIcon,
                    classes.crmIntegrationDisabledAddIcon
                  )}
                  onClick={handleShowRedeemStatus}
                >
                  <AddCircleRounded style={{ fontSize: 32 }} />
                </IconButton>
              ) : isShowDetail || isNeedPermissionToRedeem ? (
                <IconButton
                  color="primary"
                  disabled={
                    (!crmIntegrationPointItem && count >= itemMax) ||
                    disabled ||
                    isDisableRedeem ||
                    crmIntegrationPointItemPending ||
                    ((buffetViewOnly || isSpecial) &&
                      !isOpenSpecialDishPermission &&
                      !isSpecialDishServePermission) ||
                    marketPriceItem
                  }
                  className={classNames(classes.addIcon, {
                    [classes.crmIntegrationDisabledAddIcon]:
                      isCrmIntegrationPointItemVisualDisabled,
                  })}
                  onClick={handleClickSmallDish}
                  ref={addButtonRef}
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
              ) : (
                <DishItemCount
                  count={count}
                  width={106}
                  compactBadgeMode={hasBenefitAndStrikethroughPrice}
                  disableBtn={
                    isCrmIntegrationPointItemVisualDisabled ||
                    (!outOfStock &&
                      (buffetViewOnly || isSpecial) &&
                      !isOpenSpecialDishPermission &&
                      !isSpecialDishServePermission) ||
                    isDisableCrmIntegrationPointItem ||
                    count >= itemMax ||
                    (isSpecial && !isOpenSpecialDishPermission) ||
                    marketPriceItem
                  }
                  disableBtnClassName={
                    isCrmIntegrationPointItemVisualDisabled
                      ? classes.crmIntegrationDisabledAddIcon
                      : undefined
                  }
                  buffetViewOnly={buffetViewOnly}
                  onChange={changeCount}
                  max={itemMax}
                  isSpecial={isSpecial}
                  showPermissionModal={showPermissionModal}
                  isOpenSpecialDishPermission={isOpenSpecialDishPermission}
                  isSpecialDishServePermission={isSpecialDishServePermission}
                  isContinueAddFn={
                    crmIntegrationPointItem
                      ? onCrmIntegrationPointItemBeforeAdd
                      : checkDishStatus
                  }
                  queueCount={queueCount}
                  addButtonRef={addButtonRef}
                  canClickDisableBtn={
                    crmIntegrationPointItem && !crmIntegrationPointItemPending
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(SmallContent)
