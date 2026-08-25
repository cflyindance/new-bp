import React, {
  useRef,
  useMemo,
  lazy,
  Suspense,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { Space } from 'antd'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, makeStyles, IconButton, Paper } from '@material-ui/core'
import { Autorenew, ArrowDropDown } from '@material-ui/icons'
import { useBoolean, useMount, useSetState } from 'ahooks'
import { getStorageValue } from '@/utils/storage'
import { serverUrl } from '@/utils/env_var'
import MENUSIFU from '@/assets/image/menusifu.png'
import TABLEICON from '@/assets/image/tableIcon.svg'
import CLEARICON from '@/assets/image/clear.png'
import SHARP from '@/assets/image/sharp.svg'
import poster from '@/assets/image/landing-bg.jpg'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import GlobalStorageContext from '@/context/GlobalStorageContext'
import UpdatePrompt from '@/components/common/UpdatePrompt'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useGlobalState } from '@/hooks/useGlobalState'
import ServerButton from '@/components/ServerButton'
import { fetchTable } from '@/services/tables'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import ChooseOrderDialog from '@/components/AdminSettings/ChooseOrderDialog'
import useGetUserId from '@/hooks/useGetUserId'
import useCheckBuffetDish from '@/hooks/checkBuffetDish'
import { SWITCH_NEW_ORDER } from '@/constants/order'
import dayjs from 'dayjs'
import { errorMessage } from '@/constants/websocket'
import Toast from '@/components/Toast'
import isOrderCrmDiscount from '@/utils/isOrderCrmDiscount'
import LanguageChange from '@/components/LanguageChange'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import { isEqual } from 'lodash-es'
import PoweredBy from '@/components/PoweredBy'
import { KeepAlive } from 'react-activation'
import BatteryWifi from '@/components/BatteryWifi'
import { useDispatch } from 'react-redux'
import { effects } from '@/store/slices/system.slice'
import EnvironmentDialog from './EnvironmentDialog'
import {
  getRuntimeEnv,
  getRuntimeEnvLabel,
  RUNTIME_ENV,
  setRuntimeEnv as saveRuntimeEnv,
} from '@/utils/runtimeEnv'
import { isCrmIntegrationRedemptionItemCartItem } from '@/utils/crmIntegrationCartValidation'
import useDurationBilling from '@/hooks/useDurationBilling'
import TimingBar from '@/components/DurationBilling/TimingBar'
import EndTimingDialog from '@/components/DurationBilling/EndTimingDialog'
import { isKtvDurationBillingTable } from '@/utils/durationBilling'

const AdminLogin = lazy(() => import('@/components/AdminLogin'))
const AdminSettings = lazy(() => import('@/components/AdminSettings'))
const VERSION_CLICK_LIMIT = 10
const VERSION_CLICK_WINDOW = 5 * 1000

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#1A2241',
    position: 'relative',
    isolation: 'isolate',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  landingHeader: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px',
    fontSize: '18px',
    color: '#fff',
  },
  leftNavsBox: {
    display: 'flex',
    alignItems: 'center',
  },
  leftNavs: {
    display: 'flex',
    alignItems: 'center',
  },
  companyInfo: {
    display: 'flex',
    alignItems: 'center',
    paddingRight: '16px',
  },
  companyInfoImg: {
    maxWidth: 32,
    maxHeight: 32,
    marginRight: '8px',
  },
  companyInfoName: {
    letterSpacing: '-0.32px',
    width: 'auto',
    maxWidth: '9rem',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tableInfo: {
    position: 'relative',
    padding: '0 16px',
    display: 'flex',
    '&:before': {
      position: 'absolute',
      content: '""',
      top: 7,
      left: 0,
      width: 2,
      height: 15,
      zIndex: 0,
      backgroundColor: '#E3C18A',
    },
  },
  tableIcon: {
    marginRight: '8px',
  },
  clearIcon: { marginRight: '8px', height: 20 },
  tableText: {
    marginRight: '8px',
  },
  orderNumberText: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    padding: '0 16px',
    '&:before': {
      position: 'absolute',
      content: '""',
      top: 7,
      left: 0,
      width: 2,
      height: 15,
      zIndex: 0,
      backgroundColor: '#E3C18A',
    },
  },
  rightBtns: {},
  main: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'brightness(0.8)',
  },
  video_loaded: {
    filter: 'brightness(1)',
  },
  backgroundOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none',
  },
  logoName: {
    transform: 'translateY(-16%)',
    marginLeft: 0,
    marginBottom: theme.spacing(4),
    '&> img': {
      width: 400,
      maxWidth: '96%',
    },
  },
  startBtn: {
    fontSize: theme.spacing(5),
    fontWeight: 'bold',
    color: theme.palette.common.white,
    cursor: 'pointer',
    borderRadius: '50%',
    border: '3px solid #fff',
    padding: 16,
    position: 'relative',
  },
  startBtn_text_hidden: {
    paddingTop: '100%',
    minWidth: 134,
    height: 0,
    visibility: 'hidden',
    wordBreak: 'break-all',
    whiteSpace: 'nowrap',
  },
  startBtn_text_visible: {
    position: 'absolute',
  },
  landingFooter: {
    bottom: 0,
    top: 'auto',
    fontSize: '14px',
    paddingRight: 24,
  },
  deviceId: {
    marginLeft: 16,
  },
  poweredBy: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  rightVersionInfo: {
    display: 'flex',
  },
  versionText: {
    marginRight: 16,
    cursor: 'pointer',
    userSelect: 'none',
  },
  envTag: {
    display: 'inline-block',
    minWidth: 38,
    height: 20,
    lineHeight: '20px',
    textAlign: 'center',
    marginLeft: 8,
    padding: '0 8px',
    borderRadius: 4,
    color: theme.palette.common.white,
    backgroundColor: theme.palette.primary.main,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0,
    verticalAlign: 'baseline',
  },
  confirmTable_title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.palette.common.white,
    lineHeight: 1.2,
  },
  confirmTable_table: {
    fontSize: 100,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.palette.common.white,
    marginTop: 20,
    lineHeight: 1.2,
  },
  confirmTable_btn: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 20,
  },
  confirmTable_btn_start: {
    minWidth: 200,
    height: 80,
    fontSize: 30,
    fontWeight: 'bold',
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.common.white,
  },
  confirmTable_btn_switch: {
    minWidth: 200,
    height: 80,
    fontSize: 30,
    fontWeight: 'bold',
    marginLeft: 50,
  },
  splitOrder_paper: {
    width: 460,
    padding: '24px 24px 30px',
    borderRadius: 20,
  },
  splitOrder_paper_title: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  splitOrder_paper_desc: {
    fontSize: 16,
    marginTop: 12,
  },
  splitOrder_paper_btn_retry: {
    marginTop: 24,
    width: '100%',
    height: 56,
    fontSize: 18,
  },
}))

/**
 * 视频背景组件
 */
const VideoBackground = ({ className, displayMode, ...props }) => {
  const classes = useStyles()
  const videoRef = useRef()

  useEffect(() => {
    // keep alive 需要异步拿ref
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play()
      }
    }, 0)

    return () => {
      if (videoRef.current) {
        videoRef.current.pause()
        requestAnimationFrame(() => {
          if (videoRef.current) {
            // 异步设置currentTime，避免跳转页面之前视频闪烁到第一帧
            videoRef.current.currentTime = 0
          }
        })
      }
    }
  }, [])

  const [isError, setIsError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const isFullscreen = displayMode === 'fullscreen'

  return (
    <KeepAlive cacheKey={props.src} when={!isError}>
      <video
        loop
        muted
        playsInline
        autoPlay
        ref={videoRef}
        className={`${className} ${isPlaying ? classes.video_loaded : ''}`}
        style={{ objectFit: isFullscreen ? 'fill' : 'contain' }}
        {...props}
        onPlay={() => {
          setIsPlaying(true)
        }}
        onError={() => {
          setIsError(true)
        }}
      >
        Your browser does not support the video tag.
      </video>
    </KeepAlive>
  )
}

export default function Landing() {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [endTimingDialogOpen, setEndTimingDialogOpen] = useState(false)
  const [durationBillingEndAt, setDurationBillingEndAt] = useState(null)
  const [runtimeEnv, setRuntimeEnvState] = useState(getRuntimeEnv())
  const classes = useStyles()
  const dispatch = useDispatch()
  const { getFinalConfigById } = useSystemConfig()
  const restrictNewOrder = getFinalConfigById(8)?.open
  const { isBrandModeOpen, isMenuClassifyMode } = useClassifyOrderMode()
  const isWaiterClear = getFinalConfigById(45)?.open
  const isShowConfirmTable = getFinalConfigById(64)?.open
  const homePageSetting = getFinalConfigById(60)
  const isHidePoweredBy = homePageSetting?.hidePoweredBy
  const isHideStartButton = homePageSetting?.hideStartButton
  const homepageVideoConfig = getFinalConfigById(58)
  const [isOnlyOneFloor] = useGlobalState('isOnlyOneFloor')
  const { runFetchOrder } = useFetchOrder()
  const [chooseOrderOpen, { setTrue, setFalse }] = useBoolean()
  const [
    environmentDialogOpen,
    { setTrue: openEnvironmentDialog, setFalse: closeEnvironmentDialog },
  ] = useBoolean()
  const { getStaffByTimeAndTable } = useGetUserId()
  const [, setSelectedDiscountRule] = useGlobalState('selectedDiscountRule')
  const isShowSwitchTable = getFinalConfigById(73)?.open
  const [, setCart] = useGlobalState('Cart')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const [, setCurrentBuffetInfo] = useGlobalState('currentBuffetInfo')
  const [, setCurrentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const [, setMenuClassify] = useGlobalState('selectedMenuClassify')
  const [, setMemberInfo] = useGlobalState('memberInfo')
  const [privilegeItem] = useGlobalState('privilegeItem')

  // 回到首页时清空折扣规则
  useMount(() => {
    setSelectedDiscountRule(null)
  })

  const { t } = useTranslation()
  const [adminLogin, setAdminLogin] = useSetState({
    open: false,
    permission: '',
    next: () => {},
  })
  const [
    openAdminSetting,
    { setTrue: setOpenAdminSetting, setFalse: setCloseAdminSetting },
  ] = useBoolean()
  const storageInfo = useContext(GlobalStorageContext)
  const { checkBuffetDish, checkMenuClassify } = useCheckBuffetDish()
  const [, setTableInfo] = useLocalStorage('emenu_table', {})
  const tableInfo = getStorageValue('emenu_table', {})
  const { currentArea, currentTable } = tableInfo
  const waiterInfo = getStorageValue('emenu_user', {})
  const {
    durationBilling,
    status: durationBillingStatus,
    startTiming,
    endTiming,
    refresh: refreshDurationBilling,
    refreshRule: refreshDurationBillingRule,
    ruleError: durationBillingRuleError,
  } = useDurationBilling()

  const { orderId, orderNumber, order } = useMemo(() => {
    const order = tableInfo?.currentOrder
    return {
      orderId: order?.id,
      orderNumber: order?.orderNumber,
      order: order,
    }
  }, [tableInfo])

  const renderStartButtonLabel = () => {
    const label =
      durationBillingStatus === 'idle' &&
      isKtvDurationBillingTable(currentTable)
        ? t('DurationBilling.startTiming')
        : t(orderId ? 'Landing.continue_order' : 'Landing.start_new_order')
    const labelParts =
      label.match(/^(开始|继续)(点单)$/) ||
      label.match(/^(Start|Continue) (Order)$/) ||
      label.match(/^(开单)(计时)$/) ||
      label.match(/^(Start) (timing)$/)

    if (!labelParts) return label

    return (
      <>
        {labelParts[1]}
        <br />
        {labelParts[2]}
      </>
    )
  }

  useEffect(() => {
    refreshDurationBilling()
    void refreshDurationBillingRule()
  }, [currentTable?.id, orderId, refreshDurationBilling, refreshDurationBillingRule])

  useEffect(() => {
    if (durationBillingRuleError) Toast.error(durationBillingRuleError)
  }, [durationBillingRuleError])

  useEffect(() => {
    if (!orderId) {
      const currentCart = (prev) => {
        const nextCart = prev.filter(
          (each) =>
            !each.isBuffetItem &&
            (!privilegeItem?.id || each.id !== privilegeItem.id) &&
            !each.rewardRule &&
            !each.crmIntegrationPointItem &&
            !each.crmIntegrationVoucherItem &&
            !isCrmIntegrationRedemptionItemCartItem(each)
        )
        return nextCart.length === prev.length ? prev : nextCart
      }
      setCart(currentCart)
      setStoragedCart(currentCart)
      setMemberInfo((prev) => (isEqual(prev, {}) ? prev : {}))
      setCurrentBuffetInfo((prev) => (isEqual(prev, []) ? prev : []))
      setCurrentSpecialMenu(null)
      setMenuClassify(null)
    }
  }, [orderId, privilegeItem?.id])

  const isParentOrder = useMemo(() => {
    return order?.subOrderGroups?.length > 0
  }, [order])

  const displayTable = useMemo(() => {
    const floorName = isOnlyOneFloor ? '' : `${currentArea?.name} - `
    if (currentArea?.id && currentTable?.id) {
      return `${floorName}${currentTable?.name}`
    }
    return ''
  }, [currentArea, currentTable])

  const companyInfo = useMemo(() => {
    return storageInfo?.companyInfo
  }, [storageInfo])
  const logoUrl = useMemo(
    () => (companyInfo.logo ? serverUrl + companyInfo.logo : ''),
    [companyInfo]
  )
  const videoPoster = useMemo(
    () =>
      companyInfo.coverImage ? serverUrl + companyInfo.coverImage : poster,
    [companyInfo]
  )

  const navigate = useNavigate()
  const closeAdminLogin = () =>
    setAdminLogin({ open: false, permission: '', next: () => {} })
  const versionClickRef = useRef({ count: 0, startTime: 0 })

  const gotoSetup = (immediate) => {
    if (!immediate && isShowSwitchTable) {
      openAdminLogin()
    } else {
      navigate('/setup')
    }
  }

  const handleOpenClear = () => {
    setAdminLogin({
      open: true,
      permission: 'tableClear',
      next: runFetchOrder,
    })
  }

  const openAdminLogin = () =>
    setAdminLogin({
      open: true,
      permission: 'tablePermission',
      next: () => {
        dispatch(effects.fetchAreas())
        setOpenAdminSetting()
      },
    })

  const handleStartTiming = async () => {
    try {
      setLoading(true)
      const session = await startTiming({
        ruleSnapshot: await refreshDurationBillingRule(),
        tableSnapshot: currentTable,
        orderId,
        previousOrder: orders?.[0],
        userId: waiterInfo?.userId,
      })
      if (!session) {
        Toast.error(t('DurationBilling.startFailed'))
        return
      }
      await runFetchOrder()
      navigate('/order')
      Toast.success(t('DurationBilling.startSuccess'))
    } catch {
      Toast.error(t('DurationBilling.startFailed'))
    } finally {
      setLoading(false)
    }
  }

  const orderSubtotal = useMemo(
    () => orders.reduce((total, item) => total + Number(item?.totalPrice || 0), 0),
    [orders]
  )

  const handleOpenEndTiming = () => {
    setDurationBillingEndAt(Date.now())
    setEndTimingDialogOpen(true)
  }

  const handleCancelEndTiming = () => {
    setEndTimingDialogOpen(false)
    setDurationBillingEndAt(null)
  }

  const handleAuthorizeEndTiming = () => {
    setEndTimingDialogOpen(false)
    setAdminLogin({
      open: true,
      permission: 'durationBillingEnd',
      next: async (staff) => {
        try {
          const ended = await endTiming(staff?.userId, durationBillingEndAt)
          if (!ended) {
            Toast.error(t('DurationBilling.endFailed'))
            return
          }
          await runFetchOrder()
          setDurationBillingEndAt(null)
          Toast.success(t('DurationBilling.endSuccess'))
        } catch {
          Toast.error(t('DurationBilling.endFailed'))
        }
      },
    })
  }

  // 点击 Start
  const handleStartButton = async () => {
    if (displayTable && isKtvDurationBillingTable(currentTable)) {
      if (durationBillingStatus === 'timing') {
        navigate('/order')
        return
      }
      await handleStartTiming()
      return
    }
    // 已选桌
    if (displayTable) {
      setLoading(true)
      // 切桌时 - 品类模式未选品类/分类模式未选分类
      if (orderId && (isBrandModeOpen || isMenuClassifyMode)) {
        // 是否下单品类
        const isOrderBrand = isBrandModeOpen && (await checkBuffetDish(orderId))
        // 是否下单分类
        const isOrderMenuClassify =
          isMenuClassifyMode && (await checkMenuClassify(orderId))
        if (!isOrderBrand && !isOrderMenuClassify) {
          // pos提前开单 && 没有选择品类 && 没有选分类 && 限制提前开单 则需要输入密码后选择品类
          if (restrictNewOrder) {
            setAdminLogin({
              open: true,
              permission: 'startOrder',
              next: () => gotoSetup(true),
            })
            setLoading(false)
            return
          }
          gotoSetup(true)
          setLoading(false)
          return
        }
      }
      // 请求接口 检查主机连接状态
      // 同时检查是否已pos开emenu单
      try {
        const { id } = currentTable
        const res = await fetchTable(id)
        setLoading(false)
        if (res) {
          // 解决 切桌时，开新订单，会进入前序订单的问题
          // 是否需要检查提前开单的时间
          const isNeedCheckTime =
            tableInfo?.currentOrder?.switchOrderType === SWITCH_NEW_ORDER
          if (!orderId) {
            let currentTableOrders = res.table?.orders?.filter(
              // 兑换过crm 折扣后的订单 不能再被操作
              (order) =>
                order.productLine === 'EMENU' && !isOrderCrmDiscount(order)
            )
            // 切桌新订单, 需要检查当前桌订单创建时间, 只能进入后续新单
            if (isNeedCheckTime) {
              const switchOrderTime = tableInfo?.currentOrder?.switchOrderTime
              currentTableOrders = currentTableOrders.filter(
                (each) => dayjs(each.createTime).valueOf() > switchOrderTime
              )
            }

            // 已下过单 直接选单， 跳过后续逻辑
            if (currentTableOrders?.length > 0) {
              if (!isEqual(orders, currentTableOrders)) {
                setOrders(currentTableOrders)
              }
              setTrue()
              // }
              return
            }

            const staffs = getStaffByTimeAndTable()
            // 限制下新订单/当前桌排班交叉
            if (
              (restrictNewOrder || staffs?.length > 1) &&
              !isShowSwitchTable
            ) {
              setAdminLogin({
                open: true,
                permission: 'startOrder',
                next: gotoSetup,
              })
              return
            }
            gotoSetup()
            return
          }
          // 已有订单情况下 直接进入订单，不再需要选人数/展示点单须知
          navigate('/order')
        }
      } catch (error) {
        setLoading(false)
        Toast.error(errorMessage[error?.code])
      }
    } else {
      // 未选桌
      openAdminLogin()
    }
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleVersionClick = () => {
    const now = Date.now()
    const clickInfo = versionClickRef.current

    if (
      !clickInfo.startTime ||
      now - clickInfo.startTime > VERSION_CLICK_WINDOW
    ) {
      clickInfo.count = 1
      clickInfo.startTime = now
      return
    }

    clickInfo.count += 1
    if (clickInfo.count >= VERSION_CLICK_LIMIT) {
      clickInfo.count = 0
      clickInfo.startTime = 0
      openEnvironmentDialog()
    }
  }

  const handleConfirmEnvironment = (env) => {
    saveRuntimeEnv(env)
    setRuntimeEnvState(env)
    window.location.reload()
  }

  const handleSelectOrder = async (order) => {
    const { id } = order
    setTableInfo({
      ...tableInfo,
      currentOrder: {
        id,
      },
    })

    // 修复点击新增后，无法正常跳转点单页面问题
    if (id) {
      await runFetchOrder()
      if (order?.isParentOrder) {
        navigate('/')
      } else if (isBrandModeOpen || isMenuClassifyMode) {
        const isOrderBrand = isBrandModeOpen && (await checkBuffetDish(id))
        const isOrderMenuClassify =
          isMenuClassifyMode && (await checkMenuClassify(orderId))
        if (isOrderBrand || isOrderMenuClassify) {
          navigate('/order')
        } else {
          gotoSetup(true)
        }
      } else {
        navigate('/order')
      }
    } else {
      gotoSetup(true)
    }
    setFalse()
  }

  const confirmTableVisible = useMemo(() => {
    return isShowConfirmTable && displayTable && !orderNumber
  }, [isShowConfirmTable, displayTable, orderNumber])

  const { homepageVideoConfigUrl, homepageVideoConfigDisplayMode } =
    useMemo(() => {
      let homepageVideoConfigUrl = ''
      let homepageVideoConfigDisplayMode = 'fullscreen'
      if (homepageVideoConfig) {
        const { open, homepageVideo, displayMode } = homepageVideoConfig
        if (open) {
          const url = homepageVideo?.[0]?.url
          if (url) {
            homepageVideoConfigUrl = serverUrl + url
            homepageVideoConfigDisplayMode = displayMode || 'fullscreen'
          }
        }
      }
      return {
        homepageVideoConfigUrl,
        homepageVideoConfigDisplayMode,
      }
    }, [homepageVideoConfig])

  const deviceId = useMemo(() => {
    if (window.deviceUuId) {
      const start = window.deviceUuId.slice(0, 4)
      const end = window.deviceUuId.slice(-4)
      return `${start}****${end}`
    }
    return '-'
  }, [window.deviceUuId])

  const refreshOrder = useCallback(async () => {
    setLoading(true)
    try {
      await runFetchOrder()
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  return (
    <div className={classes.root}>
      <header className={classes.landingHeader}>
        <div className={classes.leftNavsBox}>
          <div className={classes.leftNavs} onClick={openAdminLogin}>
            <div className={classes.companyInfo}>
              <img
                className={classes.companyInfoImg}
                src={logoUrl || MENUSIFU}
                alt=""
              />
              <span className={classes.companyInfoName}>
                {companyInfo?.name}
              </span>
            </div>
            {displayTable && (
              <div className={classes.tableInfo}>
                <img src={TABLEICON} alt="icon" className={classes.tableIcon} />
                <div className={classes.tableText}>{displayTable}</div>
                <ArrowDropDown />
              </div>
            )}
            {orderNumber && (
              <div className={classes.orderNumberText}>
                <img src={SHARP} alt="icon" className={classes.tableIcon} />
                <span> {orderNumber}</span>
              </div>
            )}
          </div>
          <div className={classes.midNavs} onClick={handleOpenClear}>
            {isWaiterClear && (orderNumber || orders?.length > 0) && (
              <div className={classes.orderNumberText}>
                <img src={CLEARICON} alt="icon" className={classes.clearIcon} />
                <span> {t('Landing.clear')}</span>
              </div>
            )}
          </div>
        </div>
        <Space size={16}>
          <ServerButton />
          <IconButton onClick={handleReload}>
            <Autorenew />
          </IconButton>
          <LanguageChange />
          <BatteryWifi />
        </Space>
      </header>
      {durationBillingStatus === 'timing' && (
        <TimingBar
          session={durationBilling}
          onEnd={waiterInfo?.userId ? handleOpenEndTiming : undefined}
        />
      )}
      <VideoBackground
        className={classes.video}
        poster={videoPoster}
        src={homepageVideoConfigUrl}
        displayMode={homepageVideoConfigDisplayMode}
      />
      <div className={classes.backgroundOverlay} aria-hidden="true" />
      <main
        className={classes.main}
        {...(!confirmTableVisible && isHideStartButton
          ? { onClick: handleStartButton }
          : {})}
      >
        {confirmTableVisible ? (
          <div>
            <div className={classes.confirmTable_title}>
              {t('Landing.current_table')}
            </div>
            <div className={classes.confirmTable_table}>{displayTable}</div>
            <div className={classes.confirmTable_btn}>
              <Button
                variant="contained"
                className={classes.confirmTable_btn_start}
                onClick={handleStartButton}
              >
                {t('Landing.start_order')}
              </Button>
              <Button
                variant="contained"
                color="primary"
                className={classes.confirmTable_btn_switch}
                onClick={openAdminLogin}
              >
                {t('Landing.switch_table')}
              </Button>
            </div>
          </div>
        ) : isParentOrder ? (
          <>
            <Paper className={classes.splitOrder_paper}>
              <div className={classes.splitOrder_paper_title}>
                {t('Landing.split_order_paper_title')}
              </div>
              <div className={classes.splitOrder_paper_desc}>
                <Trans t={t} i18nKey="Landing.split_order_paper_desc" />
              </div>
              <Button
                className={classes.splitOrder_paper_btn_retry}
                variant="contained"
                color="primary"
                onClick={refreshOrder}
              >
                {t('Landing.split_order_paper_btn_retry')}
              </Button>
            </Paper>
          </>
        ) : (
          !isHideStartButton && (
            <Button className={classes.startBtn} onClick={handleStartButton}>
              <span className={classes.startBtn_text_visible}>
                {renderStartButtonLabel()}
              </span>
              <span className={classes.startBtn_text_hidden}>
                {renderStartButtonLabel()}
              </span>
            </Button>
          )
        )}
      </main>
      <footer className={`${classes.landingHeader} ${classes.landingFooter}`}>
        <div>
          <span>{t('SystemSetting.deviceName')}: </span>
          <span>{window.deviceName || '-'}</span>
          <span className={classes.deviceId}>
            {t('SystemSetting.deviceId')}: {deviceId}
          </span>
        </div>
        {!isHidePoweredBy && (
          <div className={classes.poweredBy}>
            <PoweredBy />
          </div>
        )}
        <div className={classes.rightVersionInfo}>
          <div className={classes.versionText} onClick={handleVersionClick}>
            <span>{t('SystemSetting.version')}: </span>
            <span>E-V{getStorageValue('new-version')?.version || '-'}</span>
            {runtimeEnv !== RUNTIME_ENV.PROD && (
              <span className={classes.envTag}>
                {getRuntimeEnvLabel(runtimeEnv)}
              </span>
            )}
          </div>
          <div>
            <span>License: </span>
            <span>{getStorageValue('emenu_auth')?.instanceName || '-'}</span>
          </div>
        </div>
      </footer>
      <UpdatePrompt />
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <AdminLogin
          isOpen={adminLogin.open}
          handleClose={closeAdminLogin}
          next={adminLogin.next}
          permission={adminLogin.permission}
        />
        <AdminSettings
          isOpen={openAdminSetting}
          handleClose={setCloseAdminSetting}
        />
      </Suspense>
      <LoadingOverlay loading={loading} />
      <ChooseOrderDialog
        open={chooseOrderOpen}
        currentOrder={null}
        orders={orders}
        onClose={setFalse}
        onEnter={(order) => handleSelectOrder(order)}
      />
      <EnvironmentDialog
        open={environmentDialogOpen}
        value={runtimeEnv}
        onCancel={closeEnvironmentDialog}
        onConfirm={handleConfirmEnvironment}
      />
      <EndTimingDialog
        open={endTimingDialogOpen}
        tableName={displayTable}
        session={durationBilling}
        endedAt={durationBillingEndAt}
        orderSubtotal={orderSubtotal}
        onCancel={handleCancelEndTiming}
        onConfirm={handleAuthorizeEndTiming}
      />
    </div>
  )
}
