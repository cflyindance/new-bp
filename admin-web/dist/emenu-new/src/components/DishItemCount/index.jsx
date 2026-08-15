import React, { useCallback, useEffect, useState, memo } from 'react'
import { IconButton, Paper, InputBase } from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import AddCircleRoundedIcon from '@material-ui/icons/AddCircleRounded'
import RemoveRoundedIcon from '@material-ui/icons/RemoveRounded'
import useFocusScroll from '@/hooks/useFocusScroll'

const useStyles = makeStyles((theme) => ({
  counterWrapper: () => ({
    padding: '0',
  }),
  addIcon: ({ size }) => ({
    float: 'right',
    padding: 1,
    '& .MuiSvgIcon-root': {
      width: size === 'small' ? 24 : 32,
      height: size === 'small' ? 24 : 32,
    },
  }),
  countRoot: ({ width }) => ({
    display: 'flex',
    alignItems: 'center',
    width: width ?? 'auto',
    minWidth: width ?? 'none',
    borderRadius: theme.shape.borderRadius * 2,
    borderColor: alpha(theme.palette.primary.main, 0.1),
  }),
  countInputRoot: {
    flex: 1,
  },
  countInput: ({ size, fontWeight, fontSize }) => ({
    padding: 0,
    marginLeft: -1,
    height: size === 'small' ? 24 : 32,
    fontSize: fontSize ?? (size === 'small' ? 16 : 20),
    lineHeight: size === 'small' ? '26px' : '24px',
    fontWeight: fontWeight ?? 700,
    textAlign: 'center',
  }),
  minusButton: ({ size }) => ({
    padding: size === 'small' ? 0 : 4,
    '& .MuiSvgIcon-root': {
      width: 24,
      height: 24,
    },
  }),
  addButton: ({ size }) => ({
    padding: 0,
    '& .MuiSvgIcon-root': {
      width: size === 'small' ? 24 : 32,
      height: size === 'small' ? 24 : 32,
    },
  }),
  disableBtn: {
    color: 'rgba(0, 0, 0, 0.26)',
    backgroundColor: 'transparent',
  },
}))

function DishItemCount({
  count,
  size = 'large',
  width,
  fontSize,
  fontWeight,
  min = 0,
  max = 99,
  disableBtn,
  disabled = false,
  buffetViewOnly = false,
  onChange,
  isContinueAddFn = null,
  showPermissionModal, //特殊菜时候的权限提示
  isOpenSpecialDishPermission = true, //可见不可点的配置
  isSpecialDishServePermission = true, //可见不可点的配置
  isSpecial = false, //判断是不是特殊菜
  isInShoppingCart = false, // 是否在购物车中
  queueCount = 0,
  addButtonRef,
  canClickDisableBtn,
  disableBtnClassName,
  isDeltaCount = false,
}) {
  const classes = useStyles({ size, width, fontSize, fontWeight })
  const [value, setValue] = useState(count)
  const [focusTop] = useFocusScroll()

  const increase = useCallback(
    (event) => {
      event.stopPropagation()
      let isContinue = true
      if (isContinueAddFn) isContinue = isContinueAddFn()
      if (!isContinue) return
      // 判断是不是特殊菜
      if (buffetViewOnly || isSpecial) {
        // if ((buffetViewOnly || isSpecial) && (!isOpenSpecialDishPermission && isSpecialDishServePermission)) {
        // 可看不可点打开
        if (isOpenSpecialDishPermission) {
          if (count < max) {
            setValue(count + 1)
          }
          // 可看不可点关闭，授权弹框打开
        } else if (isSpecialDishServePermission) {
          showPermissionModal(() => {
            if (count < max) {
              setValue(count + 1)
            }
          })
        }
      } else {
        if (count < max) {
          setValue(count + 1)
        }
      }
    },
    [count, max, isContinueAddFn]
  )

  const decrease = useCallback(
    (event) => {
      event.stopPropagation()
      if (count > min) {
        setValue(count - 1)
      }
    },
    [count, min]
  )

  const handleClick = (event) => {
    event.target.setSelectionRange(0, event?.target?.value?.length)
  }

  const handleChange = (event) => {
    event.stopPropagation()
    if (/^[0-9]*$/.test(event.target.value)) {
      const newCount = event.target.value ? parseInt(event.target.value, 10) : 0
      if (newCount >= min && newCount <= max) {
        setValue(newCount)
      } else {
        return false
      }
      newCount === 0 && focusTop()
    } else {
      return false
    }
  }

  useEffect(() => {
    setValue(count)
  }, [count])

  useEffect(() => {
    if (value !== null && value !== undefined && value !== count) {
      onChange(isDeltaCount ? value - count : value)
    }
  }, [value, isDeltaCount])

  return (
    <>
      {value === 0 ? (
        <IconButton
          color="primary"
          className={`${classes.addIcon} ${
            canClickDisableBtn && (disabled || disableBtn)
              ? `${classes.disableBtn} ${disableBtnClassName ?? ''}`
              : ''
          }`}
          disabled={!canClickDisableBtn && (disabled || disableBtn)}
          onClick={increase}
          ref={isInShoppingCart ? undefined : addButtonRef}
        >
          <AddCircleRoundedIcon />
        </IconButton>
      ) : (
        <Paper variant="outlined" className={classes.countRoot}>
          <IconButton
            disabled={count <= min || count <= queueCount}
            className={classes.minusButton}
            // style={{ padding: 4 }}
            onClick={decrease}
          >
            <RemoveRoundedIcon />
          </IconButton>
          <InputBase
            style={{ color: '#333' }}
            classes={{
              root: classes.countInputRoot,
              input: classes.countInput,
            }}
            value={value}
            disabled={true} // disabled
            // ![EMENU-787](https://devtickets.atlassian.net/browse/EMENU-787) iPad中文键盘长按会触发deleteCompositionText变成''
            // inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            onClick={handleClick}
            onChange={handleChange}
          />
          <IconButton
            color="primary"
            disabled={
              !canClickDisableBtn && (value >= max || disabled || disableBtn)
            }
            className={`${classes.addButton} ${
              canClickDisableBtn && (value >= max || disabled || disableBtn)
                ? `${classes.disableBtn} ${disableBtnClassName ?? ''}`
                : ''
            }`}
            // style={{ padding: 0 }}
            onClick={increase}
            ref={isInShoppingCart ? undefined : addButtonRef}
          >
            <AddCircleRoundedIcon />
          </IconButton>
        </Paper>
      )}
    </>
  )
}

export default memo(DishItemCount)
