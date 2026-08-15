import React, {
  lazy,
  Suspense,
  useMemo,
  useContext,
  useState,
  useRef,
} from 'react'
import { alpha, makeStyles } from '@material-ui/core/styles'
import { AppBar, Toolbar, InputAdornment } from '@material-ui/core'
import {
  SearchRounded as SearchIcon,
  ClearRounded as ClearIcon,
  ArrowDropDown,
  SyncAlt,
} from '@material-ui/icons'
import { Space } from 'antd'
import PickSize from '@/components/PickSize'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'
import BuffetSelect from '@/components/BuffetSelect'
import LoadingOverlay from '../common/LoadingOverlay'
import { useBoolean, useSetState, useDebounce } from 'ahooks'
import { getStorageValue } from '@/utils/storage'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSystemConfig from '@/hooks/useSystemConfig'
import GlobalStorageContext from '@/context/GlobalStorageContext'
import MENUSIFU from '@/assets/image/menusifu.png'
import { serverUrl } from '@/utils/env_var'
import TABLEICON from '@/assets/image/tableIcon.svg'
import CLOCKPNG from '@/assets/image/clock.png'
import GROUPICON from '@/assets/image/group.svg'
import SEARCH from '@/assets/image/search.png'
import classNames from 'classnames'
import ServerButton from '@/components/ServerButton'
import CRMLogin from '@/components/CRMLogin'
import RedeemDiscountTip from '@/components/RedeemDiscountTip'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import LanguageChange from '@/components/LanguageChange'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import useCountDown from '@/hooks/useCountDown'
import SearchInput from '@/components/common/SearchInput'
import ShoppingCartButton from '../ShoppingCart/ShoppingCartButton'
import BatteryWifi from '../BatteryWifi'
import MenuClassify from '@/pages/SetupOrder/components/MenuClassify'

const AdminLogin = lazy(() => import('../AdminLogin'))
const AdminSettings = lazy(() => import('../AdminSettings'))
const ShoppingCart = lazy(() => import('../ShoppingCart'))

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  AppBar: {
    color: theme.palette.common.white,
    boxShadow: 'none',
  },
  Toolbar: {
    paddingTop: 24,
    paddingBottom: 16,
    fontSize: 18,
    justifyContent: 'space-between',
  },
  leftTool: {
    display: 'flex',
  },
  rightTool: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 10,
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 0,
  },
  timeLeft: {
    display: 'flex',
    alignItems: 'center',
    background:
      'linear-gradient(90deg, rgba(57, 9, 6, 0.64) -7%, rgba(1, 0, 0, 0.64) 60%, rgba(0, 0, 0, 0.64) 100%)',
    // width: 180,
    padding: '0px 5px',
    height: 32,
    borderRadius: 4,
    opacity: 1,
    // backdropFilter:blur(4),
    fontSize: '1rem',
  },
  clockIcon: {
    width: 15,
    height: 15,
    margin: '0px 4px 0px 0px',
  },
  companyInfo: {
    display: 'flex',
    alignItems: 'center',
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
  searchIconOut: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    background: '#ffffff',
  },
  searchIconIn: {
    width: 20,
    height: 20,
  },
  beforeBorder: {
    position: 'relative',
    alignItems: 'center',
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
  tableInfo: {
    position: 'relative',
    padding: '0 8px',
    display: 'flex',
  },
  tableIcon: {
    marginRight: '8px',
  },
  tableText: {
    marginRight: '8px',
  },
  switchBuffet: {
    padding: '2px 16px 0',
  },
  menuButton: {
    marginRight: theme.spacing(1),
  },
  search: {
    position: 'relative',
    width: 180,
  },
  searchIcon: {
    marginLeft: 9,
    marginTop: 2,
    '& > .MuiSvgIcon-root': {
      fontSize: 20,
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  clearIcon: {
    margin: '1px 8px 0 0',
    width: 20,
    cursor: 'pointer',
    '& > .MuiSvgIcon-root': {
      fontSize: 20,
    },
  },
  inputRoot: {
    width: '100%',
    color: 'inherit',
    fontSize: 14,
    border: '1px solid transparent',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.1),
  },
  inputFocus: {
    borderColor: theme.palette.common.white,
  },
  inputInput: {
    height: 16,
    padding: theme.spacing(1),
    transition: theme.transitions.create('width'),
  },
  rightButton: {
    marginRight: '16px',
  },
  serverBtn: {
    borderRadius: '20px',
  },
  switchBuffetTip: {
    fontSize: '18px',
    padding: '12px 18px',
    margin: '-12px 0 -12px 10px',
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '10px',
    position: 'relative',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      left: '-9px',
      width: 0,
      height: 0,
      borderTop: '10px solid transparent',
      borderBottom: '10px solid transparent',
      borderRight: '10px solid rgba(0, 0, 0, 0.8)',
    },
  },
}))

export default function TopBar(props) {
  const { onSearch } = props
  const classes = useStyles()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [searchVisible, setSearchVisible] = useState(false)
  const [orders] = useGlobalState('Orders')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, { wait: 500 })
  const [isOnlyOneFloor] = useGlobalState('isOnlyOneFloor')
  const { getFinalConfigById } = useSystemConfig()
  const isNeedSelectGuest = getFinalConfigById(11)?.open
  const canChangeCategroyBeforeOrder = getFinalConfigById(85)?.open
  const { isBrandModeOpen } = useClassifyOrderMode()
  const [menuClassify] = useGlobalState('selectedMenuClassify')
  const isBrandMode = useMemo(() => {
    return isBrandModeOpen && !menuClassify
  }, [isBrandModeOpen, menuClassify])
  const searchRef = useRef()
  const { needOrderIntervalPermission } = useCheckDishBeforeOrder()
  const intervalPermission = needOrderIntervalPermission(orders)
  const intervalSeconds = useMemo(() => {
    return intervalPermission.leftMin
  }, [intervalPermission])
  const { remainingTime } = useCountDown(intervalSeconds)
  const isOrdered = useMemo(() => {
    return !!orders?.[0]?.id
  }, [orders])

  const [adminLogin, setAdminLogin] = useSetState({
    open: false,
    permission: null,
    next: () => {},
  })

  const [
    openAdminSetting,
    { setTrue: setOpenAdminSetting, setFalse: setCloseAdminSetting },
  ] = useBoolean()

  const [
    openShoppingCart,
    { setTrue: setOpenShoppingCart, setFalse: setCloseShoppingCart },
  ] = useBoolean()
  const [
    openBuffetSelect,
    { setTrue: setOpenBuffetSelect, setFalse: setCloseBuffetSelect },
  ] = useBoolean()

  const tableInfo = getStorageValue('emenu_table', {})
  const { currentArea, currentTable } = tableInfo
  const displayTable = useMemo(() => {
    const floorName = isOnlyOneFloor ? '' : `${currentArea?.name} - `
    if (currentArea?.id && currentTable?.id) {
      return `${floorName}${currentTable?.name}`
    }
    return ''
  }, [currentArea, currentTable])

  const storageInfo = useContext(GlobalStorageContext)

  const companyInfo = useMemo(() => {
    return storageInfo?.companyInfo
  }, [storageInfo])

  const logoUrl = useMemo(
    () => (companyInfo.logo ? serverUrl + companyInfo.logo : ''),
    [companyInfo]
  )

  const [
    openPickSize,
    { setTrue: setOpenPickSize, setFalse: setClosePickSize },
  ] = useBoolean()

  const handleSearch = (event) => {
    const value = event.target.value
    const filteredValue =
      value?.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s]/g, '') ?? ''
    searchRef.current.value = filteredValue
    setSearch(filteredValue)
  }

  const handleClear = () => {
    searchRef.current.value = ''
    setSearch('')
    setSearchVisible(false)
  }

  useEffect(() => {
    onSearch(debouncedSearch)
  }, [i18n.language, debouncedSearch, onSearch])

  const closeShoppingCart = (_, reason) => {
    if (reason !== 'escapeKeyDown') {
      setCloseShoppingCart()
    }
  }

  const closeAdminLogin = () => setAdminLogin({ open: false })

  const handleSelectTable = () => {
    setAdminLogin({
      open: true,
      permission: 'tablePermission',
      next: () => {
        closeAdminLogin()
        setOpenAdminSetting()
      },
    })
  }

  const switchBuffet = () => {
    if (canChangeCategroyBeforeOrder && !isOrdered) {
      setOpenBuffetSelect()
      return
    }
    setAdminLogin({
      open: true,
      permission: 'buffet',
      next: () => {
        closeAdminLogin()
        setOpenBuffetSelect()
      },
    })
  }

  const handleOpenPartySize = () => {
    const isShowMealTime = getFinalConfigById(15)?.open
    if (isShowMealTime) {
      setOpenPickSize()
      return
    }
    setAdminLogin({
      open: true,
      permission: 'showPartySize',
      next: () => {
        closeAdminLogin()
        setOpenPickSize()
      },
    })
  }

  const [countTime] = useGlobalState('countTime')
  const [restCountTime] = useGlobalState('restCountTime')
  const isShowMealTime = getFinalConfigById(16)?.open
  const isShowMealTimeInverted = getFinalConfigById(16)?.inverted
  const orderTimeStr = useMemo(() => {
    const time = isShowMealTimeInverted ? restCountTime : countTime
    if (typeof time !== 'number') {
      return ''
    }
    return t(
      isShowMealTimeInverted
        ? 'TopBar.order_rest_time'
        : 'TopBar.order_duration_time',
      { minutes: time }
    )
  }, [countTime, restCountTime, isShowMealTimeInverted, t])

  const [
    openMenuClassify,
    { setTrue: setOpenMenuClassify, setFalse: setCloseMenuClassify },
  ] = useBoolean()

  return (
    <>
      <AppBar position="static" color="transparent" className={classes.AppBar}>
        <Toolbar className={classes.Toolbar}>
          <div className={classes.leftTool}>
            <div className={classes.companyInfo} onClick={() => navigate('/')}>
              <img
                className={classes.companyInfoImg}
                src={logoUrl || MENUSIFU}
                alt=""
              />
              {/*<span className={classes.companyInfoName}>*/}
              {/*  {companyInfo?.name}*/}
              {/*</span>*/}
            </div>
            {displayTable && (
              <div
                className={classNames(classes.beforeBorder, classes.tableInfo)}
                onClick={handleSelectTable}
              >
                <img src={TABLEICON} alt="icon" className={classes.tableIcon} />
                <div className={classes.tableText}>{displayTable}</div>
                <ArrowDropDown />
              </div>
            )}
            {isNeedSelectGuest && !isBrandMode && (
              <div
                className={classNames(classes.beforeBorder, classes.tableInfo)}
                onClick={handleOpenPartySize}
              >
                <img src={GROUPICON} alt="icon" className={classes.tableIcon} />
                <div className={classes.tableText}>
                  {getStorageValue('emenu_partySize')}
                </div>
                <ArrowDropDown />
              </div>
            )}
            {menuClassify && !isOrdered && (
              <div className={classes.beforeBorder}>
                <div
                  onClick={setOpenMenuClassify}
                  className={classes.switchBuffet}
                >
                  <SyncAlt fontSize="small" />
                </div>
                {!isOrdered && (
                  <div className={classes.switchBuffetTip}>
                    {t('TopBar.classifyChangeTip')}
                  </div>
                )}
              </div>
            )}
            {isBrandMode && (
              <div className={classes.beforeBorder}>
                <div onClick={switchBuffet} className={classes.switchBuffet}>
                  <SyncAlt fontSize="small" />
                </div>
                {!isOrdered && (
                  <div className={classes.switchBuffetTip}>
                    {t('TopBar.brandChangeTip')}
                  </div>
                )}
              </div>
            )}
          </div>
          {!searchVisible && search.length === 0 && (
            <div className={classes.center}>
              {isShowMealTime && orderTimeStr && (
                <div className={classes.timeLeft}>
                  <img
                    src={CLOCKPNG}
                    alt="icon"
                    className={classes.clockIcon}
                  />
                  {orderTimeStr}
                </div>
              )}
              {remainingTime && (
                <div className={classes.timeLeft}>
                  {/* {search.length} */}
                  <img
                    src={CLOCKPNG}
                    alt="icon"
                    className={classes.clockIcon}
                  />
                  {t('ShoppingCart.order_again', { value: remainingTime })}
                </div>
              )}
            </div>
          )}
          <div className={classes.rightTool}>
            <Space size={16}>
              {!searchVisible && search.length === 0 ? (
                <div
                  className={classes.searchIconOut}
                  onClick={() => {
                    setSearchVisible(true)
                  }}
                >
                  <img className={classes.searchIconIn} src={SEARCH} alt="" />
                </div>
              ) : (
                <div className={classes.search}>
                  <SearchInput
                    inputRef={searchRef}
                    defaultValue={search}
                    onInput={handleSearch}
                    autoFocus={true}
                    onBlur={() => {
                      setSearchVisible(false)
                    }}
                    placeholder={t('TopBar.search')}
                    autoComplete="off"
                    classes={{
                      root: classes.inputRoot,
                      focused: classes.inputFocus,
                      input: classes.inputInput,
                    }}
                    startAdornment={
                      <InputAdornment
                        position="start"
                        className={classes.searchIcon}
                      >
                        <SearchIcon />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment
                        position="end"
                        className={classes.clearIcon}
                      >
                        {search ? <ClearIcon onClick={handleClear} /> : <></>}
                      </InputAdornment>
                    }
                  />
                </div>
              )}

              <ServerButton />
              <LanguageChange />
              <ShoppingCartButton onClick={setOpenShoppingCart} />
              <CRMLogin />
              <BatteryWifi />
            </Space>
          </div>
        </Toolbar>
      </AppBar>
      <MenuClassify
        open={openMenuClassify}
        onCancel={setCloseMenuClassify}
        onclose={setCloseMenuClassify}
        isInOrder={true}
      />
      <BuffetSelect
        open={openBuffetSelect}
        onCancel={setCloseBuffetSelect}
        onSubmit={setCloseBuffetSelect}
        isInOrder={true}
      />
      <PickSize
        sizes={15}
        open={openPickSize}
        onCancel={setClosePickSize}
        onSubmit={setClosePickSize}
        name={companyInfo?.name}
        selectedNum={getStorageValue('emenu_partySize')}
      />
      <RedeemDiscountTip openShoppingCart={openShoppingCart} />
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
        {/*<LanguageSetting*/}
        {/*  isOpen={openSettingLanguage}*/}
        {/*  handleClose={setCloseSettingLanguage}*/}
        {/*/>*/}
        <ShoppingCart
          isOpen={openShoppingCart}
          handleClose={closeShoppingCart}
        />
      </Suspense>
    </>
  )
}
