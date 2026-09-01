import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { serverUrl } from '@/utils/env_var'
import poster from '@/assets/image/landing-bg.jpg'
import GlobalStorageContext from '@/context/GlobalStorageContext'
import styles from './index.module.less'
import { useNavigate } from 'react-router-dom'
import useIsMemberLogin from '@/hooks/useIsMemberLogin'
import { useGlobalState } from '@/hooks/useGlobalState'
import CRMLogin from '@/components/CRMLogin'
import useSystemConfig from '@/hooks/useSystemConfig'
import PolicyToast from '@/components/PolicyToast'
import { useBoolean, useUnmount, useMemoizedFn } from 'ahooks'
import PickSize from '@/components/PickSize'
import BuffetSelect from '@/components/BuffetSelect'
import { setStorageValue } from '@/utils/storage'
import MENUSIFU from '@/assets/image/menusifu.png'
import LanguageChange from '@/components/LanguageChange'
import MenuClassify from './components/MenuClassify'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import BatteryWifi from '@/components/BatteryWifi'
import PosterSwiper from './components/PosterSwiper'
import PemiumMemberPoster from '@/components/CRMLogin/PemiumMemberPoster'
import { nanoid } from 'nanoid'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { isPreOrderMemberLoginShown } from '@/utils/memberLoginEntryPolicy'
import { isCrmNeedAuthLogin, isNeedLoginCRM } from '@/constants/systemConfig'

const SetupOrder = () => {
  const navigate = useNavigate()
  const storageInfo = useContext(GlobalStorageContext)
  const companyInfo = useMemo(() => {
    return storageInfo?.companyInfo
  }, [storageInfo])
  const videoPoster = useMemo(
    () =>
      companyInfo.coverImage ? serverUrl + companyInfo.coverImage : poster,
    [companyInfo]
  )
  const logoUrl = useMemo(
    () => (companyInfo.logo ? serverUrl + companyInfo.logo : ''),
    [companyInfo]
  )
  const { getFinalConfigById } = useSystemConfig()
  const isSelectGuest = getFinalConfigById(11)?.open
  const shouldShowPreOrderMemberLogin = isPreOrderMemberLoginShown({
    isRequired: getFinalConfigById(isNeedLoginCRM.id)?.open,
    isPreOrderLoginHidden: getFinalConfigById(isCrmNeedAuthLogin.id)?.open,
  })
  const pemiumMemberPosterConfig = getFinalConfigById(86)
  const { isMenuClassifyMode, isPureBrandMode, isBrandModeOpen } =
    useClassifyOrderMode()
  const [, setMenuClassify] = useGlobalState('selectedMenuClassify')

  // 流程相关
  const [step, setStep] = useState(0)

  // 海报相关
  const posterAdsAfterStartOrderConfig = getFinalConfigById(84)
  useLayoutEffect(() => {
    if (
      posterAdsAfterStartOrderConfig?.open &&
      posterAdsAfterStartOrderConfig?.posterAds?.length > 0
    ) {
      setOpenPosterSwiper()
      return
    }
    setStep(1)
  }, [posterAdsAfterStartOrderConfig?.open])
  const handleClosePosterSwiper = () => {
    setClosePosterSwiper()
    setStep(1)
  }

  // 会员登陆相关
  const { isLogin, crmStatus } = useIsMemberLogin()
  const isLoginRef = useRef(isLogin)
  useEffect(() => {
    isLoginRef.current = isLogin
  }, [isLogin])
  const [, setOpen] = useGlobalState('open')
  useEffect(() => {
    setOpen(false)
  }, [])
  const [, setLoginCrmFnObj] = useGlobalState('loginCrmFnObj')
  const [, setMemberInfo] = useGlobalState('memberInfo')
  useLayoutEffect(() => {
    if (step === 1) {
      if (crmStatus && shouldShowPreOrderMemberLogin) {
        setOpen(true)
        setLoginCrmFnObj({
          onLoginSuccess: () => {},
          onCloseLoginModal: ({ isNewMember }) => setStep(isNewMember ? 2 : 4),
        })
        return
      }
      setStep(4)
    }
  }, [
    step,
    crmStatus,
    setOpen,
    setLoginCrmFnObj,
    setStep,
    shouldShowPreOrderMemberLogin,
  ])

  const [isOpenPrivilege] = useGlobalState('isOpenPrivilege')

  useLayoutEffect(() => {
    if (step === 2) {
      if (
        isOpenPrivilege &&
        pemiumMemberPosterConfig?.open &&
        isLoginRef.current
      ) {
        setOpenPemiumMemberPoster()
        return
      }
      setStep(4)
    }
  }, [isOpenPrivilege, step, pemiumMemberPosterConfig])

  const onCancelPemiumMemberPoster = () => {
    setClosePemiumMemberPoster()
    setStep(4)
  }

  const [privilegeItem] = useGlobalState('privilegeItem')
  const [privilege] = useGlobalState('privilege')
  const privilegeCardPrice = useMemo(() => {
    return privilege?.paymentOptions?.[0]?.price
  }, [privilege])
  const [, setCart] = useGlobalState('Cart')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])

  useEffect(() => {
    setCart((prev) => prev.filter((each) => each.id !== privilegeItem.id))
    setStoragedCart((prev) =>
      prev.filter((each) => each.id !== privilegeItem.id)
    )
  }, [privilegeItem])

  const onJoinPemiumMemberPoster = () => {
    const dish = {
      ...privilegeItem,
      count: 1,
      key: nanoid(),
      price: privilegeCardPrice,
      taxExempt: false,
      privilegeId: privilege._id,
      taxSnapshot: true,
      expiration: JSON.stringify(privilege?.paymentOptions?.[0]?.expiration),
    }
    setCart((prev) => [...prev, dish])
    setClosePemiumMemberPoster()
    setStep(4)
  }

  // 点单须知相关
  const [isPolicyShow, setIsPolicyShow] = useState(false)
  const tipMessage = getFinalConfigById(4)
  const hasPolicy = useMemo(() => {
    return tipMessage?.orderTipTitle && tipMessage?.orderTipContent
  }, [tipMessage])
  useLayoutEffect(() => {
    if (step === 4) {
      if (hasPolicy) {
        setIsPolicyShow(true)
        return
      }
      setStep(5)
    }
  }, [step, hasPolicy, setIsPolicyShow, setStep])

  const handleClosePolicy = () => {
    setIsPolicyShow(false)
    setStep(5)
  }

  const [
    openPosterSwiper,
    { setTrue: setOpenPosterSwiper, setFalse: setClosePosterSwiper },
  ] = useBoolean(false)

  const [
    openPemiumMemberPoster,
    {
      setTrue: setOpenPemiumMemberPoster,
      setFalse: setClosePemiumMemberPoster,
    },
  ] = useBoolean(false)

  // 普通模式选人数/菜单分类模式选分类/品类模式选品类
  const [
    openPickSize,
    { setTrue: setOpenPickSize, setFalse: setClosePickSize },
  ] = useBoolean()
  const [
    openBuffetSelect,
    { setTrue: setOpenBuffetSelect, setFalse: setCloseBuffetSelect },
  ] = useBoolean()
  const [
    openMenuClassify,
    { setTrue: setOpenMenuClassify, setFalse: setCloseMenuClassify },
  ] = useBoolean()
  // 是否需要选择人数 - 未开启品类+品牌
  const isNeedSelectGuest = useMemo(() => {
    return isSelectGuest && !isBrandModeOpen && !isMenuClassifyMode
  }, [isSelectGuest, isBrandModeOpen, isMenuClassifyMode])
  const handleStartOrder = useMemoizedFn(() => {
    navigate('/order')
  })
  useLayoutEffect(() => {
    if (step === 5) {
      // 纯品类模式
      if (isPureBrandMode) {
        setOpenBuffetSelect()
        return
      }
      // 分类模式开启
      if (isMenuClassifyMode) {
        setOpenMenuClassify()
        return
      }
      // 非品类模式下 不需要选择人数
      if (!isNeedSelectGuest) {
        setStorageValue('emenu_partySize', 1)
        handleStartOrder()
        return
      }
      setOpenPickSize()
    }
  }, [
    step,
    isPureBrandMode,
    isMenuClassifyMode,
    isNeedSelectGuest,
    setStorageValue,
    handleStartOrder,
    setOpenBuffetSelect,
    setOpenMenuClassify,
    setOpenPickSize,
  ])

  const handleBack = () => {
    // 后退时清楚已登陆的会员信息
    setMemberInfo({})
    navigate('/')
  }

  useUnmount(() => {
    setLoginCrmFnObj({
      onLoginSuccess: () => {},
      onCloseLoginModal: () => {},
    })
  })

  const onCancelSelect = () => {
    setCloseBuffetSelect()
    setClosePickSize()
    setCloseMenuClassify()
    setMenuClassify(null)
    handleBack()
  }

  return (
    <>
      <div className={styles.setupOrder}>
        <header className={styles.setupHeader}>
          <div className={styles.companyInfo} onClick={handleBack}>
            <img
              className={styles.companyImg}
              src={logoUrl || MENUSIFU}
              alt=""
            />
            <div className={styles.companyName}>{companyInfo?.name}</div>
          </div>
          <div className={styles.right}>
            <LanguageChange />
            <BatteryWifi />
          </div>
        </header>
        <video
          loop
          muted
          playsInline
          className={styles.videoImg}
          poster={videoPoster}
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <CRMLogin isShowIcon={false} isShowMask={false} />
      <PemiumMemberPoster
        price={privilegeCardPrice}
        posterSrc={pemiumMemberPosterConfig?.pemiumMemberPoster?.[0]}
        open={openPemiumMemberPoster}
        onCancel={onCancelPemiumMemberPoster}
        onJoin={onJoinPemiumMemberPoster}
      />
      <PolicyToast open={isPolicyShow} onSubmit={handleClosePolicy} />
      <PickSize
        open={openPickSize}
        sizes={15}
        name={companyInfo?.name}
        onCancel={onCancelSelect}
        onSubmit={handleStartOrder}
        isShowMask={false}
      />
      <MenuClassify
        setOpenPickSize={setOpenPickSize}
        open={openMenuClassify}
        onCancel={onCancelSelect}
        onclose={setCloseMenuClassify}
        onSubmitBuffet={handleStartOrder}
        isShowMask={false}
      />
      <BuffetSelect
        open={openBuffetSelect}
        onCancel={onCancelSelect}
        onSubmit={handleStartOrder}
        isShowMask={false}
      />
      <PosterSwiper
        open={openPosterSwiper}
        onClose={handleClosePosterSwiper}
        list={posterAdsAfterStartOrderConfig?.posterAds || []}
      />
    </>
  )
}

export default SetupOrder
