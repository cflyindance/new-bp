import {
  alpha,
  Box,
  Button,
  CircularProgress,
  makeStyles,
} from '@material-ui/core'
import { AutorenewRounded, InfoOutlined } from '@material-ui/icons'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { isEmpty, isEqual } from 'lodash-es'
import { useBoolean, useMount, useRequest } from 'ahooks'
import { fetchTable } from '@/services/tables'
import { listStaff } from '@/services/system'
import ChooseOrderDialog from './ChooseOrderDialog'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import { useDispatch, useSelector } from 'react-redux'
import { effects } from '@/store/slices/systemConfig.slice'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
import sortTableName from '@/utils/sortTableName'
import useSystemConfig from '@/hooks/useSystemConfig'
import useCheckBuffetDish from '@/hooks/checkBuffetDish'
import { SWITCH_NEW_ORDER } from '@/constants/order'
import dayjs from 'dayjs'
import { getStorageValue, setStorageValue } from '@/utils/storage'
import filterTableBySchedule from '@/utils/filterTableBySchedule'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { useLocalStorageState } from 'bhooks'

const useStyles = makeStyles((theme) => ({
  main: {
    gridArea: 'main',
    overflowY: 'auto',
    backgroundColor: '#EDEFF2',
  },
  tableGrid: {
    padding: theme.spacing(4),
    display: 'grid',
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
    gridTemplateRows: 'repeat(auto-fill, minmax(88px, 1fr))',
    justifyItems: 'center',
    gap: theme.spacing(4, 5),
  },
  tableItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    height: 88,
    padding: theme.spacing(1),
    fontSize: 22,
    lineHeight: '30px',
    borderRadius: 5,
    boxShadow: 'none',
    backgroundColor: theme.palette.common.white,
    '&$tableItemDisabled': {
      backgroundColor: alpha(theme.palette.common.white, 0.2),
    },
  },
  tableNotEmpty: {
    paddingTop: 0,
    borderTopWidth: theme.spacing(1),
    borderTopStyle: 'solid',
    borderTopColor: theme.palette.primary.main,
  },
  noHover: {
    '&:hover': {
      backgroundColor: '#fff',
      boxShadow: 'none',
      color: '#000',
    },
  },
  tableItemDisabled: {},
  tableItemSelected: {
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: '#fff',
    },
  },
  footer: {
    gridArea: 'footer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(3, 5),
  },
  btnClear: {
    // backgroundColor: '#fff',
    // border: '2px solid #e0e0e0',
    marginRight: theme.spacing(3),
  },
  btnCommon: {
    flex: 1,
    height: 51,
    fontWeight: 600,
    borderRadius: 5,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
    '&:not(:first-child)': {
      marginLeft: theme.spacing(2),
    },
    '&:disabled': {
      opacity: 0.5,
      color: theme.palette.common.white,
      backgroundColor: theme.palette.primary.main,
    },
  },
  emptyBox: {
    width: '100%',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#96272F',
  },
}))

function ChooseTable(props) {
  const { areas, setAreas, activeArea, handleClose, allOrders } = props
  const classes = useStyles()
  const { t } = useTranslation()
  const [active, setActive] = useState({})
  const { runFetchOrder } = useFetchOrder()
  const [, setCart] = useGlobalState('Cart')
  const [, setInstructions] = useGlobalState('instructions')
  const [, setComboCart] = useGlobalState('ComboCart')
  const [, setSelectedSpecialComboId] = useGlobalState('selectedSpecialComboId')
  const [, setMenuClassify] = useGlobalState('selectedMenuClassify')
  const { getFinalConfigById } = useSystemConfig()
  const { isBrandModeOpen, isMenuClassifyMode } = useClassifyOrderMode()
  const { checkBuffetDish, checkMenuClassify } = useCheckBuffetDish()
  const [, setMemberInfo] = useGlobalState('memberInfo')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const [, setStoragedLottery] = useLocalStorageState('emenu_lottery', {
    defaultValue: { count: 0 },
    listenStorageChange: true,
  })
  const [tableInfo, setTableInfo] = useLocalStorage('emenu_table', {})
  const [, setStaffList] = useLocalStorage('emenu_staff', [])
  const [chooseOrderOpen, { setTrue, setFalse }] = useBoolean()
  const navigate = useNavigate()
  const [, setCurrentBuffetInfo] = useGlobalState('currentBuffetInfo')
  const [, setCurrentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const dispatch = useDispatch()
  const { configList } = useSelector((state) => state.systemConfigSlice)
  const isScheduleOpen = getFinalConfigById(30)?.open
  const scheduleSetting = getFinalConfigById(30)?.scheduleSetting
  const currentOrder = useMemo(() => tableInfo?.currentOrder, [tableInfo])
  const currentTable = useMemo(() => tableInfo?.currentTable, [tableInfo])
  const activeOrderCount = useMemo(() => active?.orders?.length, [active])
  var userInfo = getStorageValue('emenu_user')
  const isShowSwitchTable = getFinalConfigById(73)?.open
  const [, setOrders] = useGlobalState('Orders')
  const [enterTableLoading, setEnterTableLoading] = useState(false)

  const tempConfigListRef = useRef(null)
  useEffect(() => {
    tempConfigListRef.current = configList
  }, [configList])

  // 保存设备信息
  const changeTableName = (tableName, tableId) => {
    if (!window.deviceUuId) return
    const { deviceConfig, globalConfig } =
      tempConfigListRef.current || configList
    const newDeviceConfig = deviceConfig.map((device) => {
      if (device.deviceId === window.deviceUuId) {
        return {
          ...device,
          tableName,
          tableId,
        }
      }
      return device
    })
    const newConfigList = {
      globalConfig,
      deviceConfig: newDeviceConfig,
    }
    dispatch(effects.setConfig(newConfigList))
  }

  const { run, loading } = useRequest(fetchTable, {
    manual: true,
    onSuccess: (res, params) => {
      setActive(res?.table)
      let newAreas = [...areas]
      const tables = newAreas[activeArea]?.tables?.map((e) =>
        e?.id === params[0] ? res?.table : e
      )
      newAreas[activeArea] = {
        ...areas[activeArea],
        tables,
      }
      setAreas(newAreas)
    },
  })

  useRequest(listStaff, {
    onSuccess: (res) => {
      setStaffList(res.staff)
    },
  })

  const clickTable = (t) => () => {
    setActive(t)
    run(t.id)
  }

  const saveInfo = async (order) => {
    setTableInfo((info) => ({
      ...info,
      currentArea: {
        id: areas[activeArea]?.id,
        name: areas[activeArea]?.name,
      },
      currentTable: active,
      currentOrder: order,
    }))
    const tableName = `${areas[activeArea]?.name}-${active.name}`
    const tableId = `${areas[activeArea]?.id}-${active.id}`
    await dispatch(effects.fetchConfig({}))
    setTimeout(() => {
      changeTableName(tableName, tableId)
    }, 50)
  }

  const handleClearCart = () => {
    dispatch(crmIntegrationValidationActions.resetCrmIntegrationValidation())
    setCart([])
    setStoragedCart([])
    setSelectedSpecialComboId(0)
    setComboCart([])
    setInstructions('')
    setStoragedLottery((prev) => ({ ...prev, count: 0 }))
    handleClose()
    navigate('/')
  }
  const handleEnterTable = async () => {
    setEnterTableLoading(true)
    if (activeOrderCount > 0) {
      setTrue()
    } else {
      dispatch(crmIntegrationValidationActions.resetCrmIntegrationValidation())
      // 换桌时清空member info
      setMemberInfo({})
      //清空之前选的锅底
      setComboCart([])
      setSelectedSpecialComboId(0)
      // 换桌时清除购物车未下单菜品
      setCart([])
      setStoragedCart([])
      setInstructions('')
      setStoragedLottery((prev) => ({ ...prev, count: 0 }))
      setCurrentBuffetInfo((prev) => (isEqual(prev, []) ? prev : []))
      setCurrentSpecialMenu(null)
      setMenuClassify(null)
      await saveInfo({})
      setOrders([])
      handleClose()
      navigate(isShowSwitchTable ? '/setup' : '/')
    }
    setEnterTableLoading(false)
  }
  // 弹窗切换订单
  const changeAndEnter = async (order) => {
    dispatch(crmIntegrationValidationActions.resetCrmIntegrationValidation())
    // 开新单
    if (Object.keys(order || {})?.length === 0) {
      order.switchOrderType = SWITCH_NEW_ORDER
      // 记录时间, 用于 start 时可以直接进入后续开单
      order.switchOrderTime = dayjs().valueOf()
    }
    if (order && Object.hasOwnProperty.call(order, 'serverId') && !userInfo) {
      // 当选择之前的订单继续下单的时候，判断本地有没有服务员的用户信息，没有的话就存一下
      const emenu_staff = getStorageValue('emenu_staff')
      let areaIdx = emenu_staff?.findIndex((e) => e.id === order?.serverId)

      if (areaIdx > -1) {
        userInfo = {
          roles: emenu_staff[areaIdx].user.roles,
          rules: emenu_staff[areaIdx].user.functions,
        }
        setStorageValue('emenu_user', userInfo)
      }
    }
    // 换桌时清空member info
    setMemberInfo({})
    // 换桌时清除购物车未下单菜品
    setCart([])
    setStoragedCart([])
    setSelectedSpecialComboId(0)
    setComboCart([])
    setInstructions('')
    setStoragedLottery((prev) => ({ ...prev, count: 0 }))
    setCurrentBuffetInfo((prev) => (isEqual(prev, []) ? prev : []))
    setCurrentSpecialMenu(null)
    setMenuClassify(null)
    await saveInfo(order)
    setOrders([])
    if (order?.id) {
      await runFetchOrder()
    }
    let path = order?.id ? '/order' : isShowSwitchTable ? '/setup' : '/'
    if (order?.isParentOrder) {
      path = '/'
    } else if ((isBrandModeOpen || isMenuClassifyMode) && order.id) {
      // 开启品类/分类模式后，需要检查是否已下单品类/分类
      const isOrderBuffet = isBrandModeOpen && (await checkBuffetDish(order.id))
      const orderedMenuClassify =
        isMenuClassifyMode && (await checkMenuClassify(order.id))
      path =
        isOrderBuffet || orderedMenuClassify
          ? '/order'
          : isShowSwitchTable
            ? '/setup'
            : '/'
    }
    setFalse()
    handleClose()
    navigate(path)
  }

  useMount(() => {
    if (currentTable?.id) {
      setActive(currentTable)
      run(currentTable?.id)
    }
  })

  const showOrders = useMemo(() => {
    if (!active?.orders) {
      return []
    }
    const { id, orders } = active
    // 通过table list接口所有table的订单集合筛选出当前table
    const tableOrders = allOrders?.filter((each) => each.tableId === id)
    if (isEqual(tableOrders, orders)) return orders
    // 做个校验 其实可以不用??
    return orders.filter((each) =>
      tableOrders?.find((order) => order.id === each.id)
    )
  }, [active, allOrders])

  const afterSortTable = useMemo(() => {
    if (areas?.[activeArea]?.tables?.length > 0) {
      return sortTableName(areas?.[activeArea]?.tables)
    }
    return []
  }, [areas, activeArea])

  const validTableList = useMemo(() => {
    if (!isScheduleOpen) return afterSortTable
    // 当前用户绑定的所有桌子
    const userValidTable = scheduleSetting
      ?.filter(
        (schedule) =>
          schedule.selectedStaff.includes(userInfo?.userId) &&
          filterTableBySchedule(schedule)
      )
      ?.map((schedule) => schedule.selectedArea)
      ?.flat()
    // 当前楼层过滤
    return afterSortTable?.filter((each) => {
      return userValidTable?.includes(each.id)
    })
  }, [isScheduleOpen, scheduleSetting, afterSortTable, userInfo?.userId])

  return (
    <>
      <Box component="main" className={classes.main}>
        {validTableList?.length > 0 ? (
          <Box className={classes.tableGrid}>
            {validTableList?.map((e) => (
              <Button
                sx={{
                  '&:hover': { backgroundColor: 'transparent' },
                }}
                key={e.id}
                variant="contained"
                color={`${isEqual(e.id, active?.id) ? 'primary' : 'default'}`}
                classes={{
                  root: `${classes.tableItem} ${
                    e?.orders?.length > 0 ? classes.tableNotEmpty : ''
                  }`,
                  disabled: classes.tableItemDisabled,
                  contained: classes.noHover,
                  containedPrimary: classes.tableItemSelected,
                }}
                disabled={e.status === 'disabled' || e.isBound}
                onClick={clickTable(e)}
              >
                {e.name}
              </Button>
            ))}
          </Box>
        ) : (
          <div className={classes.emptyBox}>{t('schedule.emptyTable')}</div>
        )}
      </Box>
      <Box component="footer" className={classes.footer}>
        <Box>
          {activeOrderCount > 0 && (
            <Box display="flex" alignItems="center" color="primary.main">
              <InfoOutlined />
              <Box component="span" marginLeft={1}>
                {t('AdminSetting.using_tip', { count: activeOrderCount })}
              </Box>
            </Box>
          )}
        </Box>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<AutorenewRounded />}
            className={`${classes.btnCommon} ${classes.btnClear}`}
            onClick={handleClearCart}
          >
            {t('AdminSetting.btn_clear')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="large"
            className={classes.btnCommon}
            disabled={isEmpty(active) || enterTableLoading}
            onClick={handleEnterTable}
            startIcon={
              enterTableLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {t('AdminSetting.btn_enter')}
          </Button>
        </Box>
      </Box>
      <ChooseOrderDialog
        open={chooseOrderOpen}
        currentOrder={currentOrder}
        orders={showOrders}
        onClose={setFalse}
        onEnter={changeAndEnter}
      />
      <LoadingOverlay loading={loading} />
    </>
  )
}

export default memo(ChooseTable)
