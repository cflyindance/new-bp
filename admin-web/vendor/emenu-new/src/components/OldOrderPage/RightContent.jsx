import { lazy, memo, Suspense, useCallback, useMemo, useState } from 'react'
import { Box, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'
import MenuNotFound from '../common/MenuNotFound'
import CategoryLabel from '../common/CategoryLabel'
import DishItemCard from '../DishItemCard'
import CrmIntegrationRewardCard from '@/components/CrmIntegrationRewardCard'
import OrderBaseContent from '../OrderBaseContent'
import OrderMiniContent from '../OrderMiniContent'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import LoadingOverlay from '../common/LoadingOverlay'
import { useEmenuViewport } from '@/context/EmenuViewportContext'
const FeedbackToast = lazy(() => import('../common/FeedbackToast'))

const useStyles = makeStyles((theme) => ({
  RightContent: {
    marginLeft: 188,
    width: '100%',
    overflow: 'hidden',
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
    },
  },
}))

const MemoDishItemCard = memo(DishItemCard)

function RightContent(props) {
  const viewport = useEmenuViewport()
  const {
    menus,
    listGap,
    onCrmIntegrationRewardClick,
    onCrmIntegrationBenefitSelect,
    crmIntegrationBenefitDisabledOverride,
    onCrmIntegrationPointItemChange,
    onCrmIntegrationPointItemBeforeAdd,
    crmIntegrationPointItemGlobalLocked,
    selectedCrmIntegrationBenefitId,
  } = props
  const [active] = useGlobalState('Active_Menu')
  const [groupIdx, categoryIdx] = active
  const category = useMemo(() => {
    return menus?.[groupIdx]?.list?.[categoryIdx]
  }, [menus, groupIdx, categoryIdx])
  const classes = useStyles()
  const { t: t_category } = useTranslation('category')
  const { t } = useTranslation()

  const {
    needQuantityPermission,
    needOrderIntervalPermission,
    needDishOrderIntervalPermission,
    needTimesPermission,
    needOrderDishPermission,
    needOrderDishSetPermission,
    needDurationPermission,
    needOrderDishEveryonePermission,
    needOrderDishOncePermission,
    needDishSetPermission,
    needRestTimeAlertPermission,
    needDishLimitPerRoundPermission,
    needMutexDishPermission,
  } = useCheckDishBeforeOrder()

  const checkDish = useCallback(
    ({ cart, id, orders }) => {
      const dishOrderIntervalPermission = needDishOrderIntervalPermission(
        id,
        orders
      )
      if (dishOrderIntervalPermission.needPermission) {
        if (dishOrderIntervalPermission.isDishCollection) {
          return {
            text: 'checkDish.permission_dishCollectionOrderInterval',
            val: t('checkDish.permission_dishCollectionOrderInterval_time', {
              minutes: Math.floor(dishOrderIntervalPermission.leftMin / 60),
              seconds: Math.floor(dishOrderIntervalPermission.leftMin % 60),
            }),
          }
        } else {
          return {
            text: 'checkDish.permission_dishOrderInterval',
            val: t('checkDish.permission_dishOrderInterval_time', {
              minutes: Math.floor(dishOrderIntervalPermission.leftMin / 60),
              seconds: Math.floor(dishOrderIntervalPermission.leftMin % 60),
            }),
          }
        }
      }

      const dishLimitPerRoundPermission = needDishLimitPerRoundPermission(
        cart,
        id
      )
      if (dishLimitPerRoundPermission.needPermission) {
        if (dishLimitPerRoundPermission.isDishLimit) {
          if (dishLimitPerRoundPermission.isDishCollection) {
            if (dishLimitPerRoundPermission.isDishType) {
              return {
                text: 'checkDish.permission_dishSetLimitPerRoundType',
                val: dishLimitPerRoundPermission.limitNum,
              }
            } else if (dishLimitPerRoundPermission.isDishPieceSame) {
              return {
                text: 'checkDish.permission_dishSetLimitPerRoundPieceSame',
                val: dishLimitPerRoundPermission.limitNum,
              }
            } else {
              return {
                text: 'checkDish.permission_dishSetLimitPerRound',
                val: dishLimitPerRoundPermission.limitNum,
              }
            }
          } else {
            return {
              text: 'checkDish.permission_singleDishLimit',
              val: dishLimitPerRoundPermission.limitNum,
            }
          }
        } else {
          return {
            text: 'checkDish.permission_orderQuantity',
            val: dishLimitPerRoundPermission.maxLimit,
          }
        }
      }

      const mutexDishPermission = needMutexDishPermission(cart, id)
      if (mutexDishPermission.needPermission) {
        return {
          text: 'checkDish.permission_mutexDish',
          dishA: t(mutexDishPermission.mutexId, { ns: 'dish' }),
          dishB: t(id, { ns: 'dish' }),
        }
      }

      const quantityPermission = needQuantityPermission(cart, id)
      if (quantityPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderQuantity',
          val: quantityPermission.maxLimit,
        }
      }

      const intervalPermission = needOrderIntervalPermission(orders)
      if (intervalPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderInterval',
          val: t('checkDish.permission_orderInterval_time', {
            minutes: Math.floor(intervalPermission.leftMin / 60),
            seconds: Math.floor(intervalPermission.leftMin % 60),
          }),
        }
      }
      const timesPermission = needTimesPermission(orders)
      if (timesPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderTimes',
          val: timesPermission.maxTimes,
        }
      }
      const orderDishPermission = needOrderDishPermission(cart, id, orders)
      if (orderDishPermission.needPermission) {
        return {
          text: 'checkDish.permission_singleDishLimit',
          val: orderDishPermission.limitNum,
        }
      }
      const orderDishSetPermission = needOrderDishSetPermission(
        cart,
        id,
        orders
      )
      if (orderDishSetPermission.needPermission) {
        return {
          text: 'checkDish.permission_dishSetLimit',
          val: orderDishSetPermission.limitNum,
        }
      }
      const durationPermission = needDurationPermission(orders)
      if (durationPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderDuration',
          val: durationPermission.durationMin,
        }
      }
      const restTimeAlertPermission = needRestTimeAlertPermission(orders)
      if (restTimeAlertPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderRestTimeAlert',
          val: restTimeAlertPermission.leftMin,
        }
      }
      const dishSetPermission = needDishSetPermission(cart, id, orders)
      if (dishSetPermission.needPermission) {
        return {
          text: 'checkDish.permission_dishSetLimit',
          val: dishSetPermission.limitNum,
        }
      }
      const orderDishEveryOnePermission = needOrderDishEveryonePermission(
        cart,
        id,
        orders
      )
      if (orderDishEveryOnePermission.needPermission) {
        return {
          text: 'checkDish.permission_singleDishLimit',
          val: orderDishEveryOnePermission.limitNum,
        }
      }
      const orderDishOncePermission = needOrderDishOncePermission(cart, id)
      if (orderDishOncePermission.needPermission) {
        return {
          text: 'checkDish.permission_singleDishLimit',
          val: orderDishOncePermission.limitNum,
        }
      }

      return null
    },
    [
      needQuantityPermission,
      needOrderIntervalPermission,
      needDishOrderIntervalPermission,
      needTimesPermission,
      needOrderDishEveryonePermission,
      needOrderDishOncePermission,
      needOrderDishPermission,
      needOrderDishSetPermission,
      needDurationPermission,
      needDishLimitPerRoundPermission,
      needMutexDishPermission,
    ]
  )

  const list = useMemo(() => {
    return category?.list
      ?.filter((d) => !d.hidden)
      ?.sort((a, b) => ~~b.showLarge - ~~a.showLarge)
  }, [category])

  const [feedbackToastStatus, setFeedbackToastStatus] = useState({
    open: false,
    loading: false,
    error: null,
    data: null,
    onClose: () => {},
  })

  return (
    <>
      <Grid
        item
        sm
        className={classes.RightContent}
        style={{ marginLeft: viewport.collapsedSidebar ? 0 : 188 }}
      >
        <Box color="common.white">
          {list?.length > 0 ? (
            // !如果类下所有的非隐藏菜都是 Special Combo，则展示特色锅底页面
            list.every((c) => c?.comboList?.length) ? (
              <OrderBaseContent
                listGap={listGap}
                list={list?.filter((c) => c?.comboList?.length)}
                setFeedbackToastStatus={setFeedbackToastStatus}
                // setMenus={setMenus}
                // changeMenu={setActive}
              />
            ) : category.name === 'Mini Pots' ? (
              // 迷你锅页面
              <OrderMiniContent list={list} />
            ) : (
              // 普通菜类页面
              <>
                <CategoryLabel
                  fontSize={24}
                  dotSize={32}
                  text={t_category(category.id)}
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${viewport.columns}, minmax(0, 1fr))`,
                    gap: viewport.gap,
                  }}
                >
                  {list?.map((d) => {
                    const key =
                      d.crmIntegrationPointItemKey ||
                      (d.rewardRule
                        ? `${d.rewardRule.redeemRule.parameters.points}${d.id}`
                        : d.id)
                    return (
                      <div
                        key={key}
                        style={{
                          gridColumn: `span ${d.showLarge ? 2 : 1}`,
                          height: '100%',
                        }}
                      >
                        {d.crmIntegrationReward ? (
                          <CrmIntegrationRewardCard
                            benefit={d}
                            onClick={onCrmIntegrationRewardClick}
                            onSelect={onCrmIntegrationBenefitSelect}
                            disabledOverride={
                              crmIntegrationBenefitDisabledOverride
                            }
                          />
                        ) : (
                          <MemoDishItemCard
                            {...d}
                            checkDish={checkDish}
                            onCrmIntegrationPointItemChange={
                              onCrmIntegrationPointItemChange
                            }
                            onCrmIntegrationPointItemBeforeAdd={
                              onCrmIntegrationPointItemBeforeAdd
                            }
                            crmIntegrationPointItemGlobalLocked={
                              d.crmIntegrationPointItem &&
                              crmIntegrationPointItemGlobalLocked
                            }
                            crmIntegrationPointItemDisabled={
                              d.crmIntegrationPointItem &&
                              (crmIntegrationBenefitDisabledOverride === true ||
                                (!!selectedCrmIntegrationBenefitId &&
                                  selectedCrmIntegrationBenefitId !==
                                    d.crmIntegrationBenefit?.id))
                            }
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )
          ) : (
            <MenuNotFound />
          )}
        </Box>
      </Grid>
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <FeedbackToast {...feedbackToastStatus} />
      </Suspense>
    </>
  )
}

export default memo(RightContent)
