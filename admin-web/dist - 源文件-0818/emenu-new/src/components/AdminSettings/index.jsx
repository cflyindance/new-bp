import {
  Box,
  makeStyles,
  Button,
  Dialog,
  CircularProgress,
} from '@material-ui/core'
import { ArrowBackIosRounded } from '@material-ui/icons'
import { useEffect, useState, memo, useMemo, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useRequest } from 'ahooks'
import { getStorageValue, setStorageValue } from '@/utils/storage'
import AsideNav from './AsideNav'
import ChooseTable from './ChooseTable'
import SettingMenuDisplay from './SettingMenuDisplay'
import SettingOrderLimit from './SettingOrderLimit'
import { useGlobalState } from '@/hooks/useGlobalState'
import { isEqual } from 'lodash-es'
import { useDispatch, useSelector } from 'react-redux'
import LanguageChange from '../LanguageChange'
import GlobalStorageContext from '@/context/GlobalStorageContext'
import { effects, actions } from '@/store/slices/system.slice'

const MemoChooseTable = memo(ChooseTable)

const useStyles = makeStyles((theme) => ({
  body: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    [theme.breakpoints.up('sm')]: {
      display: 'grid',
      gridTemplateColumns: '232px 1fr',
      gridTemplateRows: '72px 1fr 99px',
      gridTemplateAreas: `
        "header header"
        "aside main"
        "aside footer"
      `,
    },
  },
  header: {
    gridArea: 'header',
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.common.white,
  },
  rightButton: {
    marginRight: theme.spacing(2),
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
  },
  invalidDevice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
  },
}))

function AdminSettings({ isOpen, handleClose }) {
  const dispatch = useDispatch()
  const classes = useStyles()
  const { t } = useTranslation()
  const [allOrders, setAllOrders] = useState([])
  const [activeArea, setActiveArea] = useState(-1)
  const [activeSetting, setActiveSetting] = useState(-1)
  const [, setIsAdminSettingOpen] = useGlobalState('isAdminSettingOpen')
  const [isOnlyOneFloor, setIsOnlyOneFloor] = useGlobalState('isOnlyOneFloor')
  const { isNewSocket } = useContext(GlobalStorageContext)
  const { areas } = useSelector((state) => state.system)

  const setAreas = (newAreas) => {
    dispatch(actions.setAreas(newAreas))
  }

  useEffect(() => {
    if (!isOpen) {
      cancelPollingArea()
      return
    }
    // true -> 新sc
    if (isNewSocket) {
      cancelPollingArea()
      dispatch(effects.fetchAreas())
      return
    }
    // false -> 旧ws
    if (isNewSocket === false) {
      isOpen && runPollingArea()
      return
    }
    // null -> 不处理
  }, [isNewSocket, isOpen])

  const { deviceBindInfo } = useSelector((state) => state.systemConfigSlice)

  const otherDeviceBindTableIds = useMemo(() => {
    const otherDeviceBindInfo = deviceBindInfo?.filter(
      (device) => device?.value?.deviceId !== window.deviceUuId
    )
    return otherDeviceBindInfo
      ?.map((device) => device.value?.tableId?.split('-')[1])
      ?.filter(Boolean)
  }, [deviceBindInfo])

  const currentDeviceBindAreaTable = useMemo(() => {
    if (!window.deviceUuId) return null
    const currentDeviceBindInfo = deviceBindInfo?.find(
      (device) => device?.value?.deviceId === window.deviceUuId
    )
    if (!currentDeviceBindInfo) return null
    const areaTableId = currentDeviceBindInfo?.value?.tableId
    if (!areaTableId) return null
    return {
      areaId: Number(areaTableId.split('-')[0]),
      tableId: Number(areaTableId.split('-')[1]),
    }
  }, [deviceBindInfo])

  // 根据绑定信息展示 区域和桌子
  const filterAreas = useMemo(() => {
    // 当前设备有绑定信息 - 只展示绑定区域和桌子
    if (currentDeviceBindAreaTable) {
      return areas
        .filter((area) => area.id === currentDeviceBindAreaTable.areaId)
        ?.map((area) => {
          return {
            ...area,
            tables: area.tables?.filter(
              (table) => table.id === currentDeviceBindAreaTable.tableId
            ),
          }
        })
    }
    // 当前设备无绑定信息, 有其他设备绑定信息, 其他被绑定的桌子禁止选择
    if (otherDeviceBindTableIds?.length) {
      return areas?.map((area) => {
        return {
          ...area,
          tables: area.tables?.map((table) => {
            return {
              ...table,
              isBound: otherDeviceBindTableIds.includes(String(table.id)),
            }
          }),
        }
      })
    }
    // 没有任何绑定信息
    return areas
  }, [currentDeviceBindAreaTable, areas, otherDeviceBindTableIds])

  useEffect(() => {
    setIsAdminSettingOpen(isOpen)
  }, [isOpen])

  useEffect(() => {
    if (activeSetting === -1 && activeArea === -1 && filterAreas?.length) {
      const tableInfo = getStorageValue('emenu_table', {})
      const areaIdx = filterAreas?.findIndex(
        (e) => e.id === tableInfo?.currentArea?.id
      )
      setActiveArea(areaIdx !== -1 ? areaIdx : 0)
    }
  }, [activeSetting, activeArea, filterAreas])

  // 并且检查currentOrder是否还存在
  useEffect(() => {
    if (!isOpen) return
    const isOneFloor = areas?.length === 1
    if (isOneFloor !== isOnlyOneFloor) {
      setIsOnlyOneFloor(isOneFloor)
    }
    const beforeFlatOrder = []
    areas.forEach((each) => {
      if (each.tables?.length) {
        each.tables.forEach((table) => {
          if (table.orders?.length) {
            beforeFlatOrder.push(table.orders)
          }
        })
      }
    })
    const afterFlatOrder = beforeFlatOrder.flat()
    if (isEqual(allOrders, afterFlatOrder)) return
    setAllOrders(afterFlatOrder)
    const tableInfo = getStorageValue('emenu_table', {})
    const currentOrderExist = afterFlatOrder
      ?.flat()
      ?.find((order) => order?.id === tableInfo?.currentOrder?.id)
    if (!currentOrderExist) {
      setStorageValue('emenu_table', {
        ...tableInfo,
        currentOrder: {},
      })
    }
  }, [areas, isOnlyOneFloor, allOrders, isOpen])

  // 轮询桌子状态
  const { run: runPollingArea, cancel: cancelPollingArea } = useRequest(
    () => {
      dispatch(effects.fetchAreas())
    },
    {
      manual: true,
      pollingInterval: 1000 * 60 * 5,
      pollingWhenHidden: true,
    }
  )

  useEffect(() => {
    if (!isOpen) {
      setActiveArea(-1)
      setActiveSetting(-1)
    }
  }, [isOpen])

  const renderTop = (
    <Box component="header" className={classes.header}>
      <Button
        size="large"
        startIcon={<ArrowBackIosRounded />}
        onClick={handleClose}
      >
        {t('AdminSetting.btn_back')}
      </Button>
      <Box marginLeft="auto">
        <LanguageChange />
      </Box>
    </Box>
  )

  const renderRight =
    activeArea > -1 ? (
      <MemoChooseTable
        areas={filterAreas}
        setAreas={setAreas}
        activeArea={activeArea}
        handleClose={handleClose}
        allOrders={allOrders}
      />
    ) : activeSetting === 0 ? (
      window.deviceUuId ? (
        <SettingMenuDisplay handleClose={handleClose} />
      ) : (
        <div className={classes.invalidDevice}>
          {t('SystemSetting.invalidDevice')}
        </div>
      )
    ) : activeSetting === 1 ? (
      window.deviceUuId ? (
        <SettingOrderLimit handleClose={handleClose} />
      ) : (
        <div className={classes.invalidDevice}>
          {t('SystemSetting.invalidDevice')}
        </div>
      )
    ) : (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width="100%"
      >
        <CircularProgress />
      </Box>
    )

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className={classes.root}
      fullScreen
    >
      <style>
        {`.lotteryDialog {
          display: none;
        }`}
      </style>
      <Box className={classes.body}>
        {renderTop}
        <AsideNav
          areas={filterAreas}
          activeArea={activeArea}
          setActiveArea={setActiveArea}
          activeSetting={activeSetting}
          setActiveSetting={setActiveSetting}
        />
        {renderRight}
      </Box>
    </Dialog>
  )
}

export default AdminSettings
