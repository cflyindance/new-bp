import {
  Box,
  ButtonBase,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { serverUrl } from '@/utils/env_var'
import ImgFallback from '../common/ImgFallback'
import DishItemCount from '../DishItemCount'
import SoldOutFlag from '../DishItemCard/SoldOutFlag'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import ManualCounter from '@/components/ManualCounter'
import DishDialog from '@/components/DishDialog/index'
import OperateSubDishModal from '@/components/DishDialog/OperateSubDishModal'
import useSystemConfig from '@/hooks/useSystemConfig'
import { cloneDeep, isNil } from 'lodash-es'
import useTranslateOptions from '@/hooks/useTranslateOptions'

const useStyles = makeStyles((theme) => ({
  optionLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    lineHeight: 1.2,
    fontWeight: 700,
    marginBottom: theme.spacing(2),
  },
  listItem: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius * 1.5,
    backgroundColor: alpha(theme.palette.common.white, 0.5),
    '&.active, &.active:hover': {
      backgroundColor: theme.palette.common.white,
      boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.2)',
    },
  },
  listIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.shape.borderRadius * 0.5,
  },
  listText: {
    margin: theme.spacing(0, 11, 0, 2),
    display: 'flex',
    flexFlow: 'column wrap',
    minHeight: 60,
    justifyContent: 'space-between',
  },
  listTextPrimary: {
    fontWeight: 500,
    fontSize: 16,
    color: '#4F4F4F',
  },
  listTextSecondary: {
    fontWeight: 500,
    fontSize: 14,
    color: '#828282',
  },
  listAction: {
    right: 12,
  },
  optionPaper: {
    // justifyContent: 'flex-start',
    flexDirection: 'column',
    padding: 10,
    width: '100%',
    height: '100%',
    minHeight: 46,
    cursor: 'pointer',
    borderRadius: 15,
    boxShadow: 'none',
    backgroundColor: alpha(theme.palette.common.white, 0.5),
    '&.active': {
      boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.2)',
      backgroundColor: theme.palette.common.white,
    },
    '&.disabled': {
      opacity: 0.5,
    },
    // '&:hover': {
    //   boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.2)',
    //   backgroundColor: alpha(theme.palette.common.white, 0.7),
    // },
  },
  optionPaperImage: {
    width: '100%',
    height: 112,
    marginBottom: 6,
    objectFit: 'cover',
    borderRadius: 10,
  },
  optionPaperText: {
    flex: 1,
    display: 'flex',
    flexFlow: 'column wrap',
    justifyContent: 'space-between',
    fontWeight: 500,
    color: '#4F4F4F',
  },
  addIcon: {
    width: 32,
    height: 32,
    padding: 0,
    '&[disabled]': {
      color: '#e0e0e0',
    },
  },
  countBadge: {
    padding: 5,
    transform: 'scale(0.8) translate(50%, -50%)',
  },
  subDishPriceWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  originPrice: {
    marginRight: 4,
  },
}))

function OptionList({
  fixedSelection,
  optionItem,
  optionIndex,
  options,
  changeOptions,
  hidePrice = false,
}) {
  const classes = useStyles()
  const { getFinalConfigById } = useSystemConfig()
  const { t } = useTranslation(['translation', 'dish', 'option'])
  const [selected, setSelected] = useState([])
  const [subDishOpen, setSubDishOpen] = useState(false)
  const [subDishInfo, setSubDishInfo] = useState({})
  const [removeSubDishOpen, setRemoveSubDishOpen] = useState(false)
  const displayDishNote = getFinalConfigById(28)
  const hideSoldOutDish = getFinalConfigById(78)?.open

  const { getItemSizeName } = useTranslateOptions()

  // 设置max默认值给加减组件使用
  const maxCount = optionItem.max ?? 99

  // 已选总数
  const selectedCount = useMemo(
    () => selected.reduce((acc, cur) => acc + cur.count, 0),
    [selected]
  )

  // 免费数量
  const freeQuantity = useMemo(() => {
    return optionItem.freeQuantity ?? 0
  }, [optionItem])

  const remainFreeQuantity = useMemo(() => {
    const remainFreeQuantity = freeQuantity - selectedCount
    return remainFreeQuantity > 0 ? remainFreeQuantity : 0
  }, [freeQuantity, selectedCount])

  const setNewSelected = (newSelected) => {
    setSelected(newSelected)
    changeOptions(optionIndex, newSelected)
  }

  const changeOptionCount = ({ item, value, isHasDetail = false }) => {
    let newSelected = [...selected]
    if (value > 0) {
      newSelected.push({
        ...item,
        count: value,
        isSubDishHasDetail: isHasDetail,
        isSubOption: !isHasDetail && !item?.onlyFirstLevel,
        parent: optionItem,
      })
    } else {
      let needRemove = Math.abs(value)

      for (let i = newSelected.length - 1; i >= 0 && needRemove > 0; i--) {
        const cur = newSelected[i]
        if (cur.id === item.id) {
          if (cur.count <= needRemove) {
            needRemove = needRemove - cur.count
            newSelected.splice(i, 1)
          } else {
            cur.count = cur.count - needRemove
            needRemove = 0
          }
        }
      }
    }
    if (freeQuantity > 0) {
      let freeQuantityCount = freeQuantity
      newSelected = newSelected.map((item) => {
        const tmpFreeQuantityCount = freeQuantityCount - item.count
        const newItem = {
          ...item,
          count: item.count,
          freeQuantityCount:
            tmpFreeQuantityCount >= 0 ? item.count : freeQuantityCount,
          parent: optionItem,
        }
        freeQuantityCount = tmpFreeQuantityCount > 0 ? tmpFreeQuantityCount : 0
        return newItem
      })
    }

    setNewSelected(newSelected)
  }
  // 编辑时设置已选项
  useEffect(() => {
    setSelected(options?.[optionIndex] ?? [])
  }, [options])

  const isHasMax = useMemo(() => {
    return (
      (optionItem?.repeatable || optionItem?.type === 'option') &&
      maxCount > 1 &&
      !fixedSelection
    )
  }, [optionItem?.repeatable, maxCount, fixedSelection])

  const itemMax = useCallback(
    (itemCount, itemAddLimit = Infinity, inEditModal = false) => {
      const globalMax = isHasMax
        ? maxCount - selectedCount + (inEditModal ? 0 : itemCount)
        : 1
      const itemMax = inEditModal ? itemAddLimit - itemCount : itemAddLimit
      return Math.min(globalMax, itemMax)
    },
    [isHasMax, maxCount, selectedCount]
  )

  // 套餐-子菜是否展示备注
  const countIsShowNote = (id) => {
    const isOpen = displayDishNote?.open
    if (!isOpen || !id) return false
    const openList = displayDishNote?.displayDishNote
    return openList.includes(id)
  }

  const isComboStyle = useMemo(() => {
    return (
      optionItem.type === 'combo' ||
      (!isNil(optionItem.min) &&
        !(optionItem.min === optionItem.max && optionItem.max === 1))
    )
  }, [optionItem])

  const isOptionStyle = useMemo(() => {
    return (
      optionItem.type === 'option' &&
      (isNil(optionItem.min) ||
        (optionItem.min === optionItem.max && optionItem.max === 1))
    )
  }, [optionItem])

  return (
    <>
      {isComboStyle && (
        <List disablePadding>
          {optionItem?.options?.map((e) => {
            if (hideSoldOutDish && e.outOfStock) {
              return null
            }
            const selectItemList = selected?.filter((o) => o.id === e.id)
            let name = ''
            if (optionItem.type === 'option') {
              name = t(e.id, { defaultValue: e.name, ns: 'option' })
            } else {
              name = t(e.id, { defaultValue: e.name, ns: 'dish' })
              if (
                e.itemPrices?.length === 1 &&
                !isNil(optionItem.mergeDisplay)
              ) {
                const sizeItem = e.itemPrices[0]
                const sizeName =
                  getItemSizeName(sizeItem.sizeId) || sizeItem.size
                name = `${name} (${sizeName})`
              }
            }

            // 是否子菜有详情
            const isSubDishHasDetail =
              e.itemPrices?.length > 1 ||
              e.optionList?.length > 0 ||
              countIsShowNote(e.id)
            let showPrice = '$0.00'
            let benefitPrice = null
            let strikethroughPrice = '0.00'

            if (
              e.price &&
              !(remainFreeQuantity > 0) &&
              (selectItemList.some(
                (item) => (item.freeQuantityCount ?? 0) < (item.count ?? 0)
              ) ||
                !selectItemList.length)
            ) {
              showPrice = `$${e.price?.toFixed(2)}`
              if (e.optionList?.length > 0) {
                showPrice = `${showPrice}+`
              }
            }
            if (typeof e.benefitPrice === 'number') {
              benefitPrice = `$${e.benefitPrice?.toFixed(2)}`
              if (e.optionList?.length > 0) {
                benefitPrice = `${benefitPrice}+`
              }
            }
            if (e.itemPrices?.length) {
              const minPriceInfo = cloneDeep(e.itemPrices).sort(
                (a, b) => a.price - b.price
              )[0]
              const minPrice = minPriceInfo?.price
              const minBenefitPrice =
                typeof minPriceInfo?.benefitPrice === 'number'
                  ? `$${minPriceInfo?.benefitPrice?.toFixed(2)}+`
                  : null
              if (
                !(remainFreeQuantity > 0) &&
                selectItemList.some(
                  (item) => (item.freeQuantityCount ?? 0) < (item.count ?? 0)
                )
              ) {
                showPrice = `$${minPrice?.toFixed(2)}+`
              }
              benefitPrice = minBenefitPrice
            }
            if (
              e.strikethroughPrice !== undefined &&
              e.strikethroughPrice !== null
            ) {
              strikethroughPrice = e.strikethroughPrice
              showPrice = `${showPrice} <span style="margin-left: 5px; font-size: 12px; text-decoration: line-through;">$${strikethroughPrice.toFixed(
                2
              )}</span>`
            }
            const itemCount = selectItemList?.reduce((pre, cur) => {
              return pre + (cur.count ?? 0)
            }, 0)
            let disabled =
              (selectedCount >= maxCount && !selectItemList?.length) ||
              e.outOfStock

            const changeCount = (deltaCount) => {
              changeOptionCount({
                item: {
                  ...e,
                  priceItem:
                    e.itemPrices?.length === 1 ? e.itemPrices[0] : undefined,
                },
                value: deltaCount,
              })
            }

            return (
              <ListItem
                key={e.id}
                selected={itemCount > 0}
                disabled={disabled}
                classes={{
                  root: classes.listItem,
                  selected: 'active',
                }}
              >
                <ListItemIcon>
                  <ImgFallback
                    src={serverUrl + e.pic}
                    className={classes.listIcon}
                    itemName={e.name}
                  />
                </ListItemIcon>
                <ListItemText
                  classes={{
                    root: classes.listText,
                    primary: classes.listTextPrimary,
                    secondary: classes.listTextSecondary,
                  }}
                  primary={name}
                  secondary={
                    hidePrice ? null : (
                      <div className={classes.subDishPriceWrapper}>
                        <span
                          className={classes.originPrice}
                          dangerouslySetInnerHTML={{ __html: showPrice }}
                        />
                        {benefitPrice && (
                          <VipPriceWithImg benefitPrice={benefitPrice} />
                        )}
                      </div>
                    )
                  }
                />
                <ListItemSecondaryAction
                  className={classes.listAction}
                  style={{ opacity: e.outOfStock ? 0.5 : 1 }}
                >
                  {e.outOfStock ? (
                    <SoldOutFlag variant="text" />
                  ) : isSubDishHasDetail ? (
                    <ManualCounter
                      max={itemMax(itemCount, e.addLimit)}
                      disabled={disabled}
                      value={itemCount}
                      onClickAdd={() => {
                        setSubDishInfo({
                          ...e,
                          itemMax: itemMax(itemCount, e.addLimit, true),
                          freeQuantity: remainFreeQuantity,
                          mergeDisplay: optionItem.mergeDisplay,
                        })
                        setSubDishOpen(true)
                      }}
                      onClickReduce={() => {
                        setRemoveSubDishOpen(true)
                        setSubDishInfo({ ...e })
                      }}
                    />
                  ) : (
                    <DishItemCount
                      count={itemCount}
                      isDeltaCount={true}
                      width={86}
                      fontSize={18}
                      fontWeight={400}
                      disabled={disabled}
                      max={itemMax(itemCount, e.addLimit)}
                      onChange={changeCount}
                    />
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            )
          })}
        </List>
      )}
      {isOptionStyle && (
        <Grid container spacing={2}>
          {optionItem?.options?.map((e, i, arr) => {
            if (hideSoldOutDish && e.outOfStock) {
              return null
            }
            const name = t(e.id, { defaultValue: e.name, ns: 'option' })
            const showPrice = e.price ? `$${e.price?.toFixed(2)}` : '$0.00'
            const benefitPrice =
              typeof e.benefitPrice === 'number'
                ? `$${e.benefitPrice?.toFixed(2)}`
                : null
            const space = arr.length < 3 ? 12 / arr.length : 4
            const isIncluded = selected.some((o) => o.id === e.id)
            const disabled =
              (selectedCount >= maxCount && !isIncluded) || e.outOfStock
            const changeCount = () =>
              changeOptionCount({ item: e, value: isIncluded ? -1 : 1 })

            return (
              <Grid key={e.id} item xs={space}>
                <ButtonBase
                  classes={{
                    root: `${classes.optionPaper} ${
                      isIncluded ? 'active' : ''
                    }`,
                    disabled: 'disabled',
                  }}
                  disabled={disabled}
                  onClick={changeCount}
                >
                  <Box
                    component="div"
                    display="flex"
                    alignItems="center"
                    className={classes.optionPaperText}
                  >
                    {name}
                    {!hidePrice && (
                      <Box fontSize={14} color="#828282">
                        {showPrice}
                        {e.strikethroughPrice !== undefined &&
                          e.strikethroughPrice != null && (
                            <span
                              style={{
                                marginLeft: '5px',
                                fontSize: '12px',
                                textDecoration: 'line-through',
                              }}
                            >
                              ${e.strikethroughPrice.toFixed(2)}
                            </span>
                          )}
                      </Box>
                    )}
                    {!hidePrice && benefitPrice && (
                      <VipPriceWithImg benefitPrice={benefitPrice} />
                    )}
                  </Box>
                  {e.outOfStock && (
                    <Box marginTop={1}>
                      <SoldOutFlag variant="text" />
                    </Box>
                  )}
                </ButtonBase>
              </Grid>
            )
          })}
        </Grid>
      )}
      <DishDialog
        data={subDishInfo}
        isSubDish={true}
        open={subDishOpen}
        onSubmit={(data) => {
          changeOptionCount({
            item: { ...subDishInfo, ...data },
            value: data.count,
            isHasDetail: true,
          })
        }}
        onClose={() => setSubDishOpen(false)}
        isShowDisplayNote={countIsShowNote(subDishInfo?.id)}
        hidePrice={hidePrice}
      />
      {/* removeSubDishOpen 为false时，不生成实例 */}
      {removeSubDishOpen && (
        <OperateSubDishModal
          selectedSubDish={selected}
          subDishInfo={subDishInfo}
          open={removeSubDishOpen}
          freeQuantity={freeQuantity}
          onClose={() => setRemoveSubDishOpen(false)}
          setNewSelected={setNewSelected}
        />
      )}
    </>
  )
}

export default OptionList
