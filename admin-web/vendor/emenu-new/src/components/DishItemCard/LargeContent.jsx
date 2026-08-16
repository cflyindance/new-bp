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
import ImgTag from '@/components/ImgTag'
import Toast from '@/components/Toast'
import { useGlobalState } from '@/hooks/useGlobalState'
import styles from './LargeContent.module.less'
import classNames from 'classnames'
import useSystemConfig from '@/hooks/useSystemConfig'
import useRafCountDown from '@/hooks/useRafCountDown'
import StarIcon from '@material-ui/icons/Star'
import CornerBadge from '../common/CornerBadge'

const LargeContent = (props) => {
  const {
    classes,
    id,
    name,
    pic,
    outOfStock,
    displayMode,
    count,
    buffetViewOnly,
    itemNumber,
    large,
    setOpenModal,
    setTrue,
    openAsDetail,
    showSeasoningDetailBtn = false,
    setDisable,
    itemMax,
    changeCount,
    showPrice,
    actualBenefitPrice,
    isHasBenefitPrice,
    isDisplayDishDetails,
    isShowDisplayNote,
    allImgLabel,
    allTextLabel,
    allBadgeLabel,
    checkDish,
    strikethDiscount, //划线优惠折扣
    strikethroughPrice, //划线价格
    isOpenSpecialDishPermission,
    isSpecialDishServePermission = true, //弹出服务员授权
    isSpecial = false,
    showPermissionModal,
    menuTitleFontSize,
    isNeedPasswordAuth,
    queueCount,
    addButtonRef,
    isShowPrice,
    marketPriceItem, // 时令菜
    dishOrderInterval,
  } = props
  const { t } = useTranslation()
  const [cart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const [, setOrderAdminPermission] = useGlobalState('orderAdminPermission')
  const [isNeedCheckDishAuth, setIsNeedCheckDishAuth] = useGlobalState(
    'isNeedCheckDishAuth'
  )
  const { getFinalConfigById } = useSystemConfig()
  const isDisplayDishCode = getFinalConfigById(66)?.open

  const defaultMsg = t('Order.place_order_with_server')

  const isShowDetail = useMemo(() => {
    return large || isDisplayDishDetails || isShowDisplayNote
  }, [large, isDisplayDishDetails, isShowDisplayNote])

  const isDisabled = useMemo(() => {
    if (!isShowDetail) return outOfStock || buffetViewOnly
    return outOfStock
  }, [outOfStock, buffetViewOnly, isShowDetail])

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
        handleOpenDialog(null, false)
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

  const handleOpenDialog = (event, isNeedCheckDishStatus = true) => {
    event?.stopPropagation()
    if (!isDisabled) {
      if (isNeedCheckDishStatus) {
        if (!checkDishStatus()) return
      }
      if (outOfStock || displayMode) return
      if (itemMax && count >= itemMax) return
      if (isShowDetail) {
        setDisable(
          !outOfStock &&
            (((buffetViewOnly || isSpecial) &&
              !isOpenSpecialDishPermission &&
              !isSpecialDishServePermission) ||
              marketPriceItem)
        )
        setTrue()
        return
      }
      if (marketPriceItem) return
      if (buffetViewOnly) return setOpenModal(true)
      // 是否时可看不可点
      if (isSpecial) {
        // 允许可看不可点加购
        if (isOpenSpecialDishPermission) {
          if (count < itemMax) {
            changeCount(count + 1)
          }
          return
        }
        if (isSpecialDishServePermission) {
          showPermissionModal(() => {
            if (count < itemMax) {
              changeCount(count + 1)
            }
          })
        }
        return
      }
      changeCount(count + 1)
    }
  }

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
    <div className={styles.largeContent} onClick={handleOpenDialog}>
      <div className={styles.imageArea}>
        {allBadgeLabel.map((badge, idx) => (
          <CornerBadge key={idx} text={badge.name} />
        ))}
        {outOfStock && <SoldOutFlag size="large" />}
        {dishOrderCurRemainingTimeStr && (
          <div className={styles.dishOrderRemainingTime}>
            {t('Order.dish_order_left_time', {
              time: dishOrderCurRemainingTimeStr,
            })}
          </div>
        )}
        {!outOfStock && (buffetViewOnly || isSpecial || marketPriceItem) && (
          <>
            <SoldOutFlag
              size="large"
              content={defaultMsg}
              isBuffetView={true}
              variant="maskText"
            />
          </>
        )}
        <ImgFallback
          className={styles.largeImage}
          src={serverUrl + pic}
          alt={name}
          itemName={name}
        />
      </div>
      <div className={styles.contentOuterWrapper}>
        <div
          className={classNames({
            [styles.contentArea]: true,
            [styles.disabledContent]: isDisabled,
          })}
        >
          <div className={styles.leftContent}>
            <div className={styles.nameRow}>
              <span
                className={styles.dishName}
                style={{ fontSize: menuTitleFontSize }}
              >
                {itemNumber && isDisplayDishCode ? `${itemNumber}.` : null}
                {t(id, { defaultValue: name, ns: 'dish' })}
              </span>
              <ImgTag allImgLabel={allImgLabel} />
            </div>
            <div className={styles.textTagsWrapper}>
              {showCombinationIcon && (
                <StarIcon fontSize="small" className={styles.combinationIcon} />
              )}
              <div className={styles.textTagsContainer}>
                <TextTags allTextLabel={allTextLabel} />
              </div>
            </div>
            <div className={styles.descText}>
              {t(id, { ns: 'description' })}
            </div>
          </div>
          <div className={styles.rightPrice}>
            <div
              className={styles.priceText}
              style={{ visibility: `${isShowPrice ? 'visible' : 'hidden'}` }}
            >
              <div>{showPrice}</div>
              {!marketPriceItem && isHasBenefitPrice && (
                <VipPriceWithImg
                  style={{ marginTop: 4, fontSize: '1rem' }}
                  benefitPrice={actualBenefitPrice}
                />
              )}
              {!marketPriceItem &&
                strikethroughPrice !== undefined &&
                strikethroughPrice != null && (
                  <div className={styles.striketh}>
                    {strikethDiscount}
                    <span className={styles.decoration}>
                      ${strikethroughPrice.toFixed(2)}
                    </span>
                  </div>
                )}
            </div>

            <div className={styles.addActions}>
              {showSeasoningDetailBtn ? (
                <Button
                  size="small"
                  className={styles.seasoningDetailBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    openAsDetail?.()
                  }}
                >
                  Detail
                </Button>
              ) : null}
              {displayMode ? null : isDisabled || isShowDetail ? (
                <IconButton
                  color="primary"
                  disabled={
                    ((isDisabled ||
                      (!outOfStock && (buffetViewOnly || isSpecial))) &&
                      !isOpenSpecialDishPermission &&
                      !isSpecialDishServePermission) ||
                    count >= itemMax ||
                    marketPriceItem
                  }
                  className={classes.addIcon}
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
                  disableBtn={
                    count >= itemMax ||
                    (isSpecial && !isOpenSpecialDishPermission) ||
                    marketPriceItem
                  }
                  count={count}
                  width={106}
                  onChange={(v) => {
                    changeCount(v)
                  }}
                  max={itemMax}
                  isContinueAddFn={checkDishStatus}
                  isOpenSpecialDishPermission={isOpenSpecialDishPermission}
                  isSpecialDishServePermission={isSpecialDishServePermission}
                  isSpecial={isSpecial}
                  showPermissionModal={showPermissionModal}
                  queueCount={queueCount}
                  addButtonRef={addButtonRef}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(LargeContent)
