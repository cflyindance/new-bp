import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, Grid, Zoom } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { roundToPrecision } from '@/utils/number'
import LeftPanel from './LeftPanel'
// import { useGlobalState } from '@/hooks/useGlobalState'
import RightPanel from './RightPanel'
import BuffetViewOnlyModal from '@/components/BuffetViewOnlyModal'
import useSystemConfig from '@/hooks/useSystemConfig'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useTranslation } from 'react-i18next'
import Toast from '../Toast'
import { cloneDeep } from 'lodash-es'
import {
  selectTerminalSeasoning,
  buildOrderSeasoningSnapshots,
} from '@/utils/seasoningGuest'
const useStyles = makeStyles(() => ({
  paper: ({ hasOption }) => ({
    borderRadius: 20,
    maxWidth: hasOption ? 900 : 500,
  }),
  container: {
    backgroundColor: 'rgba(33, 34, 57, 0.05)',
  },
  LeftPanel: {
    // flex: '1 1 400px',
    maxWidth: '100%',
  },
  RightPanel: {
    // flex: '1 1 500px',
    maxWidth: '100%',
  },
}))

const ZoomRightTop = React.forwardRef((props, ref) => {
  return <Zoom ref={ref} style={{ transformOrigin: 'right top' }} {...props} />
})
ZoomRightTop.displayName = 'ZoomRightTop'
const ZoomCenter = React.forwardRef((props, ref) => {
  return (
    <Zoom
      ref={ref}
      style={{ transformOrigin: 'calc(24% + 160px) 390px' }}
      {...props}
    />
  )
})
ZoomCenter.displayName = 'ZoomCenter'

export default function DishDialog({
  data,
  isSubDish = false,
  comboItem = false,
  mode = 'add',
  hidePrice = false,
  open,
  onClose,
  onSubmit,
  onRemove,
  combo,
  isShowDisplayNote,
  showPermissionModal,
  isNeedPasswordAuth,
  entrySource = 'add',
  seasoningGroups = [],
}) {
  const { getFinalConfigById } = useSystemConfig()
  const isOpenSpecialDishPermission = getFinalConfigById(36)?.open //是否开启可见不可点的操作按钮
  const isSpecialDishServePermission = getFinalConfigById(49)?.open //是否开启可见不可点的操作按钮
  const id = useMemo(() => {
    return data.id
  }, [data])
  const buffetViewOnly = useMemo(() => {
    return data.buffetViewOnly || false
  }, [data])
  const isSpecialDish = useMemo(() => {
    return data.isSpecial || false
  }, [data])
  const itemMax = useMemo(() => data.itemMax, [data])
  const pricesList = useMemo(() => data.itemPrices ?? [], [data])
  const optionsList = useMemo(() => {
    return data.optionList || []
  }, [data])
  const hasOption = useMemo(() => {
    return pricesList.length > 1 || optionsList.length > 0
  }, [pricesList, optionsList])

  const fixedSelection = useMemo(() => {
    return data.comboType === 'FIXED_SELECTION'
  }, [data])
  const isCombo = useMemo(() => {
    return comboItem && !!data.combo
  }, [comboItem, data])

  const [count, setCount] = useState()
  const [priceItem, setPriceItem] = useState()
  const [options, setOptions] = useState()
  const [instructions, setInstructions] = useState()
  const [needAnimate, setNeedAnimate] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [seasoningSelections, setSeasoningSelections] = useState([])

  const showSeasoning =
    entrySource === 'detail' && seasoningGroups?.length > 0
  const needsWideLayout = hasOption || showSeasoning
  const classes = useStyles({ hasOption: needsWideLayout })

  const onToggleSeasoning = (choice) => {
    setSeasoningSelections((prev) => selectTerminalSeasoning(prev, choice))
  }

  const isValid = useMemo(() => {
    let valid = count > (mode === 'edit' ? -1 : 0)
    optionsList?.forEach((e, i) => {
      const optionsCount =
        options?.[i]?.reduce((acc, cur) => acc + cur.count, 0) ?? 0
      if (optionsCount < e?.min) {
        valid = false
      }
    })
    return valid
  }, [count, mode, optionsList, options])

  const realMainPrice = useMemo(() => {
    return priceItem?.price ?? data.price
  }, [data.price, priceItem])

  const realSubPrice = useMemo(() => {
    return roundToPrecision(
      optionsList?.reduce((acc, cur, idx) => {
        const group = options?.[idx]
        if (group?.length) {
          // 调味本身价格
          acc += cur?.price ?? 0
          // 调味时计算子调味价格，套餐时根据价格计算规则决定
          acc += group?.reduce((a, c) => {
            let actualAddPrice = c.price ?? 0
            // 子菜有详情时，需要使用子菜总价
            if (cur?.type === 'combo' && c.isSubDishHasDetail) {
              const subPrice = (c?.realSubPrice ?? 0) * c.count
              const havePriceCount = c.count - (c?.freeQuantity ?? 0)
              const mainPrice =
                havePriceCount > 0
                  ? (c?.realMainPrice ?? 0) * havePriceCount
                  : 0
              return a + mainPrice + subPrice
            }
            return (
              a +
              actualAddPrice * ((c?.count ?? 0) - (c?.freeQuantityCount ?? 0))
            )
          }, 0)
        }
        return acc
      }, 0)
    )
  }, [options, optionsList])

  const realPrice = useMemo(() => {
    return roundToPrecision(realMainPrice + realSubPrice)
  }, [realMainPrice, realSubPrice])

  // 计算复杂菜的权益价, 有权益价取权益价，没权益价取原价
  const realMainBenefitPrice = useMemo(() => {
    let mainDishBenefitPrice = 0
    if (priceItem) {
      mainDishBenefitPrice = priceItem?.benefitPrice ?? priceItem?.price
    } else {
      mainDishBenefitPrice = data.benefitPrice ?? data.price
    }
    return mainDishBenefitPrice
  }, [combo, priceItem, data])

  const realSubBenefitPrice = useMemo(() => {
    return roundToPrecision(
      optionsList?.reduce((acc, cur, idx) => {
        const group = options?.[idx]
        if (group?.length) {
          // 调味本身价格
          acc += cur?.benefitPrice ?? cur?.price ?? 0
          // 调味时计算子调味价格，套餐时根据价格计算规则决定
          acc += group?.reduce((a, c) => {
            let actualAddPrice = c.benefitPrice ?? c?.price ?? 0
            // 子菜有详情时，需要使用子菜总价
            if (cur?.type === 'combo' && c.isSubDishHasDetail) {
              const subBenefitPrice =
                (c?.realSubBenefitPrice ?? c?.realSubPrice ?? 0) * c.count
              const havePriceCount = c.count - (c?.freeQuantityCount ?? 0)
              const mainBenefitPrice =
                havePriceCount > 0
                  ? (c?.realMainBenefitPrice ?? c?.realMainPrice ?? 0) *
                    havePriceCount
                  : 0
              return a + mainBenefitPrice + subBenefitPrice
            }
            return (
              a +
              actualAddPrice * ((c?.count ?? 0) - (c?.freeQuantityCount ?? 0))
            )
          }, 0)
        }
        return acc
      }, 0)
    )
  }, [optionsList, options])

  // 计算复杂菜的权益价, 有权益价取权益价，没权益价取原价
  const benefitPrice = useMemo(() => {
    return roundToPrecision(realMainBenefitPrice + realSubBenefitPrice)
  }, [realMainBenefitPrice, realSubBenefitPrice])

  const changePrice = (selected) => {
    setPriceItem(selected)
  }
  const changeOptions = (groupIdx, selected) => {
    setOptions((prev) => {
      const newOptions = [...prev]
      newOptions[groupIdx] = selected
      return newOptions
    })
  }
  const handleClickOption = (groupIdx, item) => {
    setOptions((prev) => {
      const newOptions = [...prev]
      // 支持取消选中
      if (newOptions[groupIdx]?.some((o) => o.id === item.id)) {
        newOptions[groupIdx] = newOptions[groupIdx]?.filter(
          (o) => o.id !== item.id
        )
      } else {
        newOptions[groupIdx] = [...(newOptions[groupIdx] ?? []), item]
      }
      return newOptions
    })
  }

  const addToCart = (params) => {
    onSubmit(params)
    setNeedAnimate(true)
    onClose()
  }

  const handleSubmit = () => {
    const paramsItem = {
      id,
      count,
      priceItem,
      options,
      instructions,
      // 复杂菜的整体原价
      realPrice,
      // 复杂菜的整体会员价
      realBenefitPrice: benefitPrice,
      // 复杂菜的主菜的会员价
      benefitPrice: data.benefitPrice,
      // 复杂菜的主菜的原价
      realMainPrice: realMainPrice,
      // 复杂菜的子菜的原价
      realSubPrice: realSubPrice,
      // 复杂菜的子菜的会员价
      realSubBenefitPrice: realSubBenefitPrice,
      // 复杂菜的主菜的会员价
      realMainBenefitPrice: realMainBenefitPrice,
    }
    if (entrySource === 'detail') {
      const seasoningSnapshots = buildOrderSeasoningSnapshots(
        seasoningSelections,
        seasoningGroups
      )
      paramsItem.seasoningSnapshots = seasoningSnapshots
      const seasoningExtra = seasoningSnapshots.reduce(
        (sum, s) => sum + (s.transactionPrice || 0),
        0
      )
      paramsItem.realPrice = roundToPrecision(
        (paramsItem.realPrice || 0) + seasoningExtra
      )
    }
    // if(!isNeedCheckDishAuth){addToCart(paramsItem);return}
    if (buffetViewOnly || isSpecialDish) {
      if (isOpenSpecialDishPermission) {
        addToCart(paramsItem)
      } else if (isSpecialDishServePermission) {
        showPermissionModal(() => {
          // setIsNeedCheckDishAuth(false);
          addToCart(paramsItem)
        })
      }
      return
    }
    addToCart(paramsItem)
  }

  const handleRemove = () => {
    onRemove(data)
    onClose()
  }

  const initData = useCallback(() => {
    setCount(mode === 'edit' ? data.count : 1)
    setPriceItem(
      mode === 'edit'
        ? data.priceItem
        : (pricesList?.find((e) => e.default) ?? pricesList?.[0])
    )
    if (mode === 'edit') {
      setOptions(data.options || [])
    } else if (fixedSelection) {
      // 固定套餐模式，默认选择非缺货/多个详细价格/包含调味的子菜
      const fixedOptions = optionsList
        // 不再默认加入option
        ?.filter((optionCate) => optionCate.type !== 'option')
        ?.map((g) =>
          g?.options
            ?.filter(
              (e) =>
                !e.outOfStock &&
                e.type !== 'option' &&
                !(e.itemPrices?.length > 1 || e.optionList?.length > 0)
            )
            ?.map((e) => ({ ...e, count: 1, parent: g }))
        )
      setOptions(fixedOptions)
    } else {
      let haveDefaultOption = false
      let haveDefaultSelectedOption = false
      const options = optionsList?.map((g) =>
        g?.options
          ?.filter((e) => {
            if (e.preSelected || e.defaultSelected) {
              haveDefaultOption = true
              if (e.defaultSelected) {
                haveDefaultSelectedOption = true
              }
              return true
            }
            return false
          })
          ?.map((e) => {
            if (haveDefaultSelectedOption) {
              const count = e.defaultQuantity ?? 1
              let freeQuantity = g.freeQuantity ?? 0
              let defaultOptions = []
              for (let i = 0; i < count; i++) {
                defaultOptions.push({
                  ...e,
                  count: 1,
                  freeQuantityCount: freeQuantity > 0 ? 1 : 0,
                  isSubOption: g.type === 'option' && !e.onlyFirstLevel,
                  parent: g,
                })
                freeQuantity = freeQuantity > 0 ? freeQuantity - 1 : 0
              }
              return defaultOptions
            } else {
              // 子菜有详情价
              if (e.itemPrices?.length > 0) {
                const data = { ...e, count: 1, parent: g }
                let priceItem = e.itemPrices.find(
                  (priceInfo) => priceInfo.default
                )
                if (!priceItem) {
                  priceItem = cloneDeep(e.itemPrices).sort(
                    (a, b) => a.price - b.price
                  )[0]
                }
                // 子菜不支持会员价 默认取原价
                data.benefitPrice =
                  data.price =
                  data.realBenefitPrice =
                  data.realPrice =
                  data.realMainPrice =
                  data.realMainBenefitPrice =
                    priceItem.price
                data.priceItem = priceItem
                return data
              }
              // 子菜有option
              if (e.optionList?.length > 0) {
                const data = { ...e, count: 1, parent: g }
                // 子菜不支持会员价 默认取原价
                data.benefitPrice =
                  data.realBenefitPrice =
                  data.realPrice =
                  data.realMainPrice =
                  data.realMainBenefitPrice =
                    data.price
                return data
              }
              return { ...e, count: 1, parent: g }
            }
          })
          ?.flat()
      )
      if (haveDefaultOption) {
        setOptions(options)
      } else {
        setOptions([])
      }
    }
    setInstructions(mode === 'edit' ? data.instructions : '')
    setSeasoningSelections([])
  }, [data, fixedSelection, mode, optionsList, pricesList])

  useEffect(() => {
    if (open) {
      initData()
    }
  }, [open])

  const handleClose = () => {
    onClose()
  }

  const { t } = useTranslation()

  const [orders] = useGlobalState('Orders')
  const { needRestTimeAlertPermission, needDurationPermission } =
    useCheckDishBeforeOrder()

  const checkDish = useCallback(() => {
    if (isSubDish) {
      return true
    }
    const restTimeAlertPermission = needRestTimeAlertPermission(orders)
    const durationPermission = needDurationPermission(orders)
    if (
      durationPermission.needPermission &&
      restTimeAlertPermission.leftMin === 0
    ) {
      Toast.error(
        t('checkDish.permission_noMealTime', {
          val: restTimeAlertPermission.leftMin,
        })
      )
      return false
    }
    if (
      !durationPermission.needPermission &&
      restTimeAlertPermission.needPermission
    ) {
      Toast.error(
        t('checkDish.permission_orderRestTimeAlert', {
          val: restTimeAlertPermission.leftMin,
        })
      )
      return false
    }

    return true
  }, [orders, t, needRestTimeAlertPermission, isSubDish])

  return (
    <>
      <Dialog
        classes={{
          paper: classes.paper,
        }}
        TransitionComponent={isCombo ? ZoomCenter : ZoomRightTop}
        TransitionProps={{
          // appear: false,
          enter: false,
          exit: true,
          timeout: {
            enter: 0,
            exit: needAnimate ? 500 : 0,
          },
          onExited: () => {
            setNeedAnimate(false)
          },
        }}
        scroll="body"
        open={open}
        onClose={handleClose}
      >
        {needsWideLayout ? (
          <Grid
            container
            spacing={0}
            wrap="nowrap"
            className={classes.container}
          >
            <Grid item className={classes.LeftPanel}>
              <LeftPanel
                {...{
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
                  handleSubmit,
                  handleRemove,
                  isShowDisplayNote,
                  itemMax,
                  checkDish,
                  isNeedPasswordAuth,
                  isSubDish,
                  hidePrice,
                  sideBySide: true,
                }}
              />
            </Grid>
            <Grid item className={classes.RightPanel} style={{ flex: 1, minWidth: 0 }}>
              <RightPanel
                {...{
                  data,
                  pricesList,
                  fixedSelection,
                  isCombo,
                  optionsList,
                  priceItem,
                  options,
                  instructions,
                  changePrice,
                  changeOptions,
                  handleClickOption,
                  setInstructions,
                  combo,
                  isShowDisplayNote,
                  checkDish,
                  count,
                  hidePrice,
                  showSeasoning,
                  seasoningGroups,
                  seasoningSelections,
                  onToggleSeasoning,
                }}
              />
            </Grid>
          </Grid>
        ) : (
          <LeftPanel
            {...{
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
              checkDish,
              isNeedPasswordAuth,
              isSubDish,
              hidePrice,
            }}
          />
        )}
      </Dialog>
      <BuffetViewOnlyModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  )
}
