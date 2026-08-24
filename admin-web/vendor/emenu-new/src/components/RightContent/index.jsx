import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useDebounceFn, usePrevious } from 'ahooks'
import { VariableSizeList as List } from 'react-window'
import { Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import OrderBaseContent from '@/components/OrderBaseContent'
import CategoryLabel from '../common/CategoryLabel'
import DishItemCard from '../DishItemCard'
import CrmIntegrationRewardCard from '@/components/CrmIntegrationRewardCard'
import MenuNotFound from '../common/MenuNotFound'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import virtualListData from '@/utils/virtualListData'
import LoadingOverlay from '../common/LoadingOverlay'
import { useEmenuViewport } from '@/context/EmenuViewportContext'
const FeedbackToast = lazy(() => import('../common/FeedbackToast'))

const useStyles = makeStyles((theme) => ({
  RightContent: {
    marginLeft: 188,
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
    },
  },
  scrollBar: {
    overflowY: 'auto',
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
  },
}))

const MemoDishItemCard = memo(({ ...props }) => {
  const { t } = useTranslation()

  const {
    needQuantityPermission,
    needOrderIntervalPermission,
    needDishOrderIntervalPermission,
    needTimesPermission,
    needOrderDishPermission,
    needOrderDishSetPermission,
    needOrderDishEveryonePermission,
    needOrderDishOncePermission,
    needDurationPermission,
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

      const dishSetPermission = needDishSetPermission(cart, id, orders)
      if (dishSetPermission.needPermission) {
        return {
          text: 'checkDish.permission_dishSetLimit',
          val: dishSetPermission.limitNum,
        }
      }

      const orderDishEveryonePermission = needOrderDishEveryonePermission(
        cart,
        id,
        orders
      )
      if (orderDishEveryonePermission.needPermission) {
        return {
          text: 'checkDish.permission_singleDishLimit',
          val: orderDishEveryonePermission.limitNum,
        }
      }
      const orderDishOncePermission = needOrderDishOncePermission(cart, id)
      if (orderDishOncePermission.needPermission) {
        return {
          text: 'checkDish.permission_singleDishLimit',
          val: orderDishOncePermission.limitNum,
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

      return null
    },
    [
      needQuantityPermission,
      needOrderIntervalPermission,
      needDishOrderIntervalPermission,
      needTimesPermission,
      needOrderDishPermission,
      needOrderDishSetPermission,
      needOrderDishEveryonePermission,
      needOrderDishOncePermission,
      needDurationPermission,
      needDishLimitPerRoundPermission,
      needMutexDishPermission,
    ]
  )

  return <DishItemCard {...props} checkDish={checkDish} />
})
MemoDishItemCard.displayName = 'MemoDishItemCard'
export { MemoDishItemCard as DishItemCardWithOrderChecks }

function RightContent(props) {
  const classes = useStyles()
  const viewport = useEmenuViewport()
  const { t: t_category } = useTranslation('category')

  const {
    allCateList,
    listRef,
    setRightListCateId,
    keyword,
    listGap,
    rightListCateId,
    onCrmIntegrationRewardClick,
    onCrmIntegrationBenefitSelect,
    crmIntegrationBenefitDisabledOverride,
    onCrmIntegrationPointItemChange,
    onCrmIntegrationPointItemBeforeAdd,
    crmIntegrationPointItemGlobalLocked,
    selectedCrmIntegrationBenefitId,
  } = props
  const [rowSize, setRowSize] = useState([])
  const previousColumns = usePrevious(viewport.columns)

  const prevRowSize = usePrevious(rowSize)

  const [feedbackToastStatus, setFeedbackToastStatus] = useState({
    open: false,
    loading: false,
    error: null,
    data: null,
    onClose: () => {},
  })

  const cateListWithValidDish = useMemo(() => {
    return virtualListData(allCateList, viewport.columns)
  }, [allCateList, viewport.columns])

  useEffect(() => {
    if (cateListWithValidDish?.length) {
      const newRowSize = cateListWithValidDish.map((cate, i) => {
        const { type, isHotPot, isLargeRow } = cate
        if (type === 'cateText') {
          return {
            [i]: 48,
            cateId: cate.id,
          }
        }
        if (isHotPot) {
          return {
            [i]: Math.max(160, viewport.layoutHeight - 20),
            cateId: cate.id,
          }
        }
        if (type === 'cateList') {
          const standardHeight = isLargeRow ? 400 : 310
          return {
            [i]: standardHeight,
            cateId: cate.id,
          }
        }
        return {
          [i]: 0,
          cateId: cate.id,
        }
      })
      setRowSize(newRowSize)
    }
  }, [cateListWithValidDish, setRowSize])

  useEffect(() => {
    if (rowSize.length && listRef.current) {
      const isNeedResetHeight = rowSize.findIndex((each, i) => {
        const prevRowHeight = prevRowSize?.[i]?.[i]
        const prevRowCate = prevRowSize?.[i]?.cateId
        const currentRowHeight = each?.[i]
        const currentRowCate = each?.cateId
        return (
          currentRowHeight !== prevRowHeight || currentRowCate !== prevRowCate
        )
      })
      if (isNeedResetHeight !== -1) {
        listRef.current.resetAfterIndex(isNeedResetHeight)
      }
    }
  }, [prevRowSize, rowSize, listRef.current])

  useEffect(() => {
    if (
      previousColumns === undefined ||
      previousColumns === viewport.columns ||
      !rightListCateId ||
      !listRef.current
    )
      return
    const categoryIndex = cateListWithValidDish.findIndex(
      (item) => item.id === rightListCateId
    )
    if (categoryIndex >= 0) {
      listRef.current.resetAfterIndex(0, true)
      listRef.current.scrollToItem(categoryIndex, 'start')
    }
  }, [
    cateListWithValidDish,
    previousColumns,
    rightListCateId,
    viewport.columns,
  ])

  const updateList = useCallback((data, rowIndex) => {
    let isNeedUpdate = false //判断是不是重新刷页面数据
    cateListWithValidDish[rowIndex].list.forEach((item, index) => {
      if (
        index !== data.selected &&
        typeof item.origPrice === 'number' &&
        cateListWithValidDish[rowIndex].list[index].price !== item.origPrice
      ) {
        cateListWithValidDish[rowIndex].list[index].price = item.origPrice
        isNeedUpdate = true
      }
    })
    if (
      typeof cateListWithValidDish[rowIndex].list[data.selected]?.origPrice !==
      'number'
    )
      cateListWithValidDish[rowIndex].list[data.selected].origPrice =
        cateListWithValidDish[rowIndex].list[data.selected].price
    if (
      data.samePotDefaultAddedMoney === 0 &&
      cateListWithValidDish[rowIndex].list[data.selected].price !==
        cateListWithValidDish[rowIndex].list[data.selected].origPrice
    ) {
      cateListWithValidDish[rowIndex].list[data.selected].price =
        cateListWithValidDish[rowIndex].list[data.selected].origPrice
      isNeedUpdate = true
    } else if (
      cateListWithValidDish[rowIndex].list[data.selected].price !==
      cateListWithValidDish[rowIndex].list[data.selected].origPrice +
        data.samePotDefaultAddedMoney
    ) {
      cateListWithValidDish[rowIndex].list[data.selected].price =
        cateListWithValidDish[rowIndex].list[data.selected].origPrice +
        data.samePotDefaultAddedMoney
      isNeedUpdate = true
    }
    if (isNeedUpdate) {
      if (listRef.current) {
        listRef.current.resetAfterIndex(rowIndex) // 仅刷新当前布局
      }
    }
  })
  const rowRender = useCallback(
    ({ index: rowIndex, style }) => {
      const cate = cateListWithValidDish[rowIndex]
      const { list, id, isHotPot, type } = cate
      return (
        <div
          data-cateid={id}
          // eslint-disable-next-line react/no-unknown-property
          index={rowIndex}
          key={rowIndex}
          style={{ ...style, width: '100%' }}
        >
          {type === 'cateText' && (
            <CategoryLabel fontSize={24} dotSize={32} text={t_category(id)} />
          )}
          {isHotPot ? (
            <Grid item sm className={classes.HotPotContent}>
              <OrderBaseContent
                listGap={listGap}
                list={cate.list?.filter((c) => c?.comboList?.length)}
                updateList={(data) => updateList(data, rowIndex)} // 传递回调函数
                setFeedbackToastStatus={setFeedbackToastStatus}
              />
            </Grid>
          ) : (
            <div
              key={id}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${viewport.columns}, minmax(0, 1fr))`,
                gap: viewport.gap,
                paddingRight: viewport.padding,
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
                    style={{ gridColumn: `span ${d.showLarge ? 2 : 1}` }}
                  >
                    {d.crmIntegrationReward ? (
                      <CrmIntegrationRewardCard
                        benefit={d}
                        onClick={onCrmIntegrationRewardClick}
                        onSelect={onCrmIntegrationBenefitSelect}
                        disabledOverride={crmIntegrationBenefitDisabledOverride}
                      />
                    ) : (
                      <MemoDishItemCard
                        {...d}
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
          )}
        </div>
      )
    },
    [
      cateListWithValidDish,
      crmIntegrationBenefitDisabledOverride,
      crmIntegrationPointItemGlobalLocked,
      onCrmIntegrationPointItemChange,
      onCrmIntegrationPointItemBeforeAdd,
      onCrmIntegrationBenefitSelect,
      onCrmIntegrationRewardClick,
      selectedCrmIntegrationBenefitId,
      t_category,
    ]
  )

  const { run: onListScroll } = useDebounceFn(
    () => {
      // 无法通过ref 获取到dom
      requestAnimationFrame(() => {
        const cateList = document.querySelectorAll('div[data-cateid]')
        const cateItem = Array.from(cateList)?.find((item) => {
          let itemReact = item.getBoundingClientRect()
          return itemReact.y <= 300 && itemReact.y + itemReact.height > 300
        })
        if (cateItem) {
          const cateId = cateItem.getAttribute('data-cateid')
          if (cateId !== rightListCateId) {
            setRightListCateId(cateId)
          }
        }
      })
    },
    { wait: 300 }
  )

  const getItemSize = useCallback(
    (index) => {
      return rowSize[index]?.[index] || 500
    },
    [rowSize]
  )

  if (!rowSize?.length || !cateListWithValidDish.length)
    return <MenuNotFound search={keyword} />

  return (
    <>
      <Grid
        item
        sm
        className={classes.RightContent}
        style={{
          height: Math.max(160, viewport.layoutHeight - 20),
          marginLeft: viewport.collapsedSidebar ? 0 : 188,
        }}
      >
        <List
          className={classes.scrollBar}
          height={Math.max(160, viewport.layoutHeight - 20)}
          itemCount={cateListWithValidDish.length}
          itemSize={getItemSize}
          ref={listRef}
          onScroll={onListScroll}
          overscanCount={5}
        >
          {rowRender}
        </List>
      </Grid>
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <FeedbackToast {...feedbackToastStatus} />
      </Suspense>
    </>
  )
}

export default memo(RightContent)
