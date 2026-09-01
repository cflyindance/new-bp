import { useSetMenus } from '@/hooks/useSetMenus'
import { makeStyles } from '@material-ui/core'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSelector } from 'react-redux'
import EmptyOrder from '../EmptyOrder'
import { EmenuProThemeProvider } from './components/EmenuProTheme'
import ShoppingCartButton from './dynamicComponents/ShoppingCartButton'
import HomeButton from './dynamicComponents/HomeButton'
import Page from './dynamicComponents/Page'
import Swiper from 'swiper'
import { Virtual } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/virtual'
import Container from './dynamicComponents/Container'
import AddToCartButton from './dynamicComponents/AddToCartButton'
import SoldOutFlag from './dynamicComponents/SoldOutFlag'
import Navigator from './dynamicComponents/Navigator'
import GlobalComponentsWrapper from './components/GlobalComponentsWrapper'
import ChangeLanguageButton from './dynamicComponents/ChangeLanguageButton'
import MemberLoginButton from './dynamicComponents/MemberLoginButton'
import SwitchBuffetButton from './dynamicComponents/SwitchBuffetButton'
import CallServerButton from './dynamicComponents/CallServerButton'
import CountDownAlert from './dynamicComponents/CountDownAlert'
import OrderIntervalAlert from './dynamicComponents/OrderIntervalAlert'
import { nanoid } from '@reduxjs/toolkit'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import SwitchTableButton from './dynamicComponents/SwitchTableButton'
import ChangePartySizeButton from './dynamicComponents/ChangePartySizeButton'
import { useGlobalState } from '@/hooks/useGlobalState'
import getRewardItemByRules from '@/utils/getRewardItemByRules'
import Poster from '@/components/Poster'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useTranslation } from 'react-i18next'
import { cloneDeep, isEqual } from 'lodash-es'
import SwiperProvider from './components/SwiperProvider'
import Video from './dynamicComponents/Video'
import Carousel from './dynamicComponents/Carousel'
import BatteryWifiInfo from './dynamicComponents/BatteryWifiInfo'
import Lottery from '@/components/Lottery'
import DishName from './dynamicComponents/DishName'
import SalePrice from './dynamicComponents/SalePrice'
import MemberPrice from './dynamicComponents/MemberPrice'
import MembershipPoints from './dynamicComponents/MembershipPoints'
import { META_ITEM_GROUP } from '@/constants'
import { useAliveController } from 'react-activation'
import async from 'async'

const preRenderQueue = async.priorityQueue(async (task) => await task(), 3)
preRenderQueue.pause()

const AdminLogin = lazy(() => import('@/components/AdminLogin'))

const PosterButtonText = () => {
  const { t } = useTranslation()
  return <>{t('button', { ns: 'Poster' })}</>
}

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexFlow: 'column',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#1A2241',
    position: 'relative',
  },
  globalLayer: {
    position: 'absolute',
    zIndex: 2,
  },
  swiper: {
    width: '100%',
    height: '100%',
  },
  openPoster: {
    position: 'absolute',
    top: 135,
    right: 0,
    maxWidth: 200,
    padding: '8px 16px',
    color: '#fff',
    background: '#96272f',
    borderRadius: '100px 0px 0px 100px',
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 3,
    display: 'box',
    lineClamp: 2,
    boxOrient: 'vertical',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
}))

const PREVIEW_PAGE_COUNT = 2
const CRM_POINT_ITEM_ID = 'crm-point-item'
const CRM_POINT_ITEM_GROUP_IDS = [CRM_POINT_ITEM_ID, 'crm-point-item-group']
const CRM_POINT_ITEM_CATEGORY_IDS = [
  CRM_POINT_ITEM_ID,
  'crm-point-item-category',
]

const EmenuProOrder = ({ crmIntegrationRedemption }) => {
  const classes = useStyles()

  const { allMenus, saleItems } = useSetMenus()
  const {
    handlePointItemBeforeAdd: handleCrmIntegrationPointItemBeforeAdd,
    handlePointItemChange: handleCrmIntegrationPointItemChange,
    pointItemGlobalLocked: crmIntegrationPointItemGlobalLocked,
    redeemMenu: crmIntegrationRedeemMenu,
  } = crmIntegrationRedemption || {}
  const [crmRewardRules] = useGlobalState('crmRewardRules')
  const [orderAdminPermission, setOrderAdminPermission] = useGlobalState(
    'orderAdminPermission'
  )

  const closeAdminLogin = () => {
    setOrderAdminPermission({
      open: false,
      permission: '',
      next: () => {},
    })
  }

  const { getFinalConfigById } = useSystemConfig()
  const posterInfo = getFinalConfigById(56)
  const lotteryConfig = getFinalConfigById(88)

  const [, setPosterConfig] = useGlobalState('poster')

  const isPosterOpen = useMemo(() => {
    return posterInfo?.open && posterInfo?.posterAds?.[0]
  }, [posterInfo])

  const isShowPosterButton = useMemo(() => {
    return isPosterOpen ? posterInfo?.displayButton : false
  }, [isPosterOpen])

  useEffect(() => {
    if (isPosterOpen) {
      setPosterConfig({
        open: true,
      })
    }
  }, [isPosterOpen])

  const noHiddenItem = useMemo(() => {
    return saleItems.current?.map((each) => ({
      ...each,
      hidden: false,
    }))
  }, [saleItems.current])

  const crmFreeItemList = useMemo(() => {
    if (crmRewardRules.length > 0) {
      const freeItemRule = crmRewardRules.filter(
        (each) => each.redeemRule.strategy === 'byFreeItem'
      )
      const ruleItems = getRewardItemByRules(freeItemRule, noHiddenItem)
      const items = ruleItems
        .map((rule) => rule.items)
        .flat()
        ?.map((item) => {
          let originalPrice = item.price ?? 0
          if (item.itemPrices) {
            originalPrice = cloneDeep(item.itemPrices).sort(
              (a, b) => a.price - b.price
            )?.[0]?.price
          }
          return {
            ...item,
            // 积分兑换菜品，只能兑换主菜，无法兑换子菜
            optionList: [],
            comboList: [],
            itemPrices: [],
            price: 0,
            // 混合模式下展示小图
            large: false,
            showLarge: false,
            itemMax: 1,
            benefitPrice: undefined,
            realBenefitPrice: undefined,
            freeItemOriginalPrice: originalPrice ?? 0,
            freeItemDiscount: originalPrice ?? 0,
          }
        })
      return items
    }
    return []
  }, [crmRewardRules, noHiddenItem])

  const crmIntegrationEmenuProRedeemMenu = useMemo(() => {
    if (!Object.keys(crmIntegrationRedeemMenu || {}).length) return {}
    const pointCategory = crmIntegrationRedeemMenu.list?.find(
      (category) => category.id === CRM_POINT_ITEM_ID
    )
    if (!pointCategory?.list?.length) return {}
    return {
      ...crmIntegrationRedeemMenu,
      id: CRM_POINT_ITEM_ID,
      list: [
        {
          ...pointCategory,
          id: CRM_POINT_ITEM_ID,
        },
      ],
    }
  }, [crmIntegrationRedeemMenu])

  const menuWithCrm = useMemo(() => {
    if (!allMenus.length) return []
    if (Object.keys(crmIntegrationEmenuProRedeemMenu)?.length) {
      return [crmIntegrationEmenuProRedeemMenu, ...allMenus]
    }
    return allMenus
  }, [allMenus, crmIntegrationEmenuProRedeemMenu])

  const baseMenu = useMemo(() => {
    return menuWithCrm.filter(
      (group) =>
        group.name !== 'ALL_YOU_CAN_EAT' &&
        group.name !== META_ITEM_GROUP &&
        !group.hidden
    )
  }, [menuWithCrm])

  const saleItemsWithCrmMap = useMemo(() => {
    const map = new Map()
    crmFreeItemList.forEach((item) => {
      map.set(item.id, item)
    })
    return map
  }, [crmFreeItemList])

  const crmIntegrationPointItemMap = useMemo(() => {
    const map = new Map()
    crmIntegrationEmenuProRedeemMenu.list?.forEach((category) => {
      category.list?.forEach((item) => {
        map.set(Number(item.id), item)
      })
    })
    return map
  }, [crmIntegrationEmenuProRedeemMenu])

  const [groupMap, setGroupMap] = useState(new Map())
  const [categoryMap, setCategoryMap] = useState(new Map())
  const [saleItemMap, setSaleItemMap] = useState(new Map())

  useEffect(() => {
    const _groupMap = new Map()
    const _categoryMap = new Map()
    const _saleItemMap = new Map()
    let isGroupMapChanged = false
    let isCategoryMapChanged = false
    let isSaleItemMapChanged = false
    baseMenu.forEach(({ list, ...group }) => {
      if (!isGroupMapChanged) {
        const oldGroup = groupMap.get(group.id)
        if (!isEqual(oldGroup, group)) {
          isGroupMapChanged = true
        }
      }
      _groupMap.set(group.id, group)
      list.forEach(({ list, ...category }) => {
        if (!isCategoryMapChanged) {
          const oldCategory = categoryMap.get(category.id)
          if (!isEqual(oldCategory, category)) {
            isCategoryMapChanged = true
          }
        }
        _categoryMap.set(category.id, category)
        list.forEach((saleItem) => {
          if (!isSaleItemMapChanged) {
            const oldSaleItem = saleItemMap.get(saleItem.id)
            if (!isEqual(oldSaleItem, saleItem)) {
              isSaleItemMapChanged = true
            }
          }
          _saleItemMap.set(saleItem.id, saleItem)
        })
      })
    })
    setGroupMap((prev) => {
      if (isGroupMapChanged || prev.size !== _groupMap.size) {
        return _groupMap
      }
      return prev
    })
    setCategoryMap((prev) => {
      if (isCategoryMapChanged || prev.size !== _categoryMap.size) {
        return _categoryMap
      }
      return prev
    })
    setSaleItemMap((prev) => {
      if (isSaleItemMapChanged || prev.size !== _saleItemMap.size) {
        return _saleItemMap
      }
      return prev
    })
  }, [baseMenu])

  const { emenuProConfig } = useSelector((state) => state.systemConfigSlice)
  const { pageList, categoryList } = useMemo(() => {
    if (!emenuProConfig?.globalData) {
      return { pageList: [], categoryList: [] }
    }
    const pageList = []
    const categoryList = []
    const { globalData } = emenuProConfig
    globalData.forEach((group) => {
      const isCrmPointGroup = CRM_POINT_ITEM_GROUP_IDS.includes(
        String(group.groupId)
      )
      const groupId = isCrmPointGroup
        ? CRM_POINT_ITEM_ID
        : Number(group.groupId)
      if (groupMap.has(groupId)) {
        group.children.forEach((category) => {
          const isCrmPointCategory = CRM_POINT_ITEM_CATEGORY_IDS.includes(
            String(category.categoryId)
          )
          const categoryId = isCrmPointCategory
            ? CRM_POINT_ITEM_ID
            : Number(category.categoryId)
          if (categoryMap.has(categoryId)) {
            let hasVisiblePage = false
            let pageIndexList = []
            category.pageData.forEach((page) => {
              if (page.props?.visible?.value === false) {
                return
              }
              hasVisiblePage = true
              pageList.push({
                ...page,
                isMembershipPointRedeemPage:
                  isCrmPointGroup && isCrmPointCategory,
              })
              pageIndexList.push(pageList.length - 1)
            })
            if (hasVisiblePage) {
              categoryList.push({ categoryId, pageIndexList })
            }
          }
        })
      }
    })

    categoryList.forEach(({ pageIndexList }) => {
      const firstPageIndex = pageIndexList[0]
      if (firstPageIndex >= 0) {
        const prevPageIndex = firstPageIndex - PREVIEW_PAGE_COUNT
        const nextPageIndex = firstPageIndex + PREVIEW_PAGE_COUNT
        if (prevPageIndex > 0 && pageList[prevPageIndex]) {
          pageList[prevPageIndex] = {
            ...pageList[prevPageIndex],
            needPreRender: true,
          }
        }
        if (nextPageIndex < pageList.length - 1 && pageList[nextPageIndex]) {
          pageList[nextPageIndex] = {
            ...pageList[nextPageIndex],
            needPreRender: true,
          }
        }
      }
    })

    return { pageList, categoryList }
  }, [emenuProConfig, groupMap, categoryMap])

  const { globalBlocks, viewportWidth, viewportHeight } = useMemo(
    () => emenuProConfig || {},
    [emenuProConfig]
  )

  const [swiper, setSwiper] = useState(null)
  const swiperRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!swiperRef.current || !pageList.length) {
      setLoading(false)
      return
    }
    setLoading(true)
    let rafTimer = null
    let timeoutTimer = null
    // 使用swiper core而不是swiper/react，因为swiper/react的性能不如swiper core
    // Virtual在swiper 模式下包含预加载，预渲染，dom缓存等，swiper/react没有
    // swiper/react的virtual模式缓存的是fiber对象，而不是dom对象，页面无法避免会白屏
    // 就算使用了keep alive缓存图片或者组件，由于fiber对象渲染成dom需要时间，页面还是会白屏
    const swiper = new Swiper(swiperRef.current, {
      direction: 'vertical',
      modules: [Virtual],
      virtual: {
        enabled: true,
        addSlidesBefore: PREVIEW_PAGE_COUNT - 1,
        addSlidesAfter: PREVIEW_PAGE_COUNT - 1,
      },
      threshold: 0,
      touchRatio: 1.2,
      on: {
        afterInit: () => {
          rafTimer = requestAnimationFrame(() => {
            timeoutTimer = setTimeout(() => setLoading(false), 100)
          })
        },
      },
      // 异步初始化，否则第二次进页面事件不会触发
      init: false,
    })
    setTimeout(() => {
      preRenderQueue.resume()
      swiper.init()
      setSwiper(swiper)
    }, 0)

    return () => {
      swiper.destroy()
      setSwiper(null)
      cancelAnimationFrame(rafTimer)
      clearTimeout(timeoutTimer)
    }
  }, [pageList])

  // swiper virtual需要key来更新swiper dom
  // 因为virtual会自己删除dom导致fiber报错，无法移除fiber对象
  const swiperKey = useMemo(() => nanoid(), [pageList])

  const registerPreRender = useCallback((fn, priority) => {
    preRenderQueue.push(fn, priority)

    return () => {
      preRenderQueue.remove((task) => task === fn)
    }
  }, [])
  const pageImageElementMapRef = useRef(new Map())
  const setPageImageElement = useCallback((containerId, imageEl) => {
    if (containerId) {
      if (imageEl) {
        pageImageElementMapRef.current.set(containerId, imageEl)
      } else {
        pageImageElementMapRef.current.delete(containerId)
      }
    }
  }, [])
  const getPageImageElement = useCallback(
    (containerId) => pageImageElementMapRef.current.get(containerId),
    []
  )

  const { drop } = useAliveController()

  useEffect(() => {
    return () => {
      preRenderQueue.remove(() => true)
      pageImageElementMapRef.current.clear()
      drop(/^Page-/)
    }
  }, [pageList])

  return (
    <>
      <div className={classes.root}>
        <EmenuProThemeProvider theme={{ viewportWidth, viewportHeight }}>
          <SwiperProvider swiper={swiper}>
            {pageList.length > 0 ? (
              <div
                className={`swiper ${classes.swiper}`}
                ref={swiperRef}
                key={swiperKey}
              >
                <div className="swiper-wrapper">
                  {pageList.map((component, index) => (
                    <div className="swiper-slide" key={component.id}>
                      {component.component === 'Container' && (
                        <Container
                          key={component.id}
                          containerId={component.id}
                          swiper={swiper}
                          index={index}
                          needPreRender={component.needPreRender}
                          registerPreRender={registerPreRender}
                          getPageImageElement={getPageImageElement}
                        >
                          {component.children.map((childComponent) => {
                            switch (childComponent.component) {
                              case 'Page':
                                return (
                                  <Page
                                    config={childComponent}
                                    key={childComponent.id}
                                    imgRef={(imgEl) => {
                                      setPageImageElement(component.id, imgEl)
                                    }}
                                  />
                                )
                              case 'AddToCartImageBtn':
                                return (
                                  <AddToCartButton
                                    config={childComponent}
                                    key={childComponent.id}
                                    saleItemMap={saleItemMap}
                                    saleItemsWithCrmMap={saleItemsWithCrmMap}
                                    crmIntegrationPointItemMap={
                                      crmIntegrationPointItemMap
                                    }
                                    isMembershipPointRedeemPage={
                                      component.isMembershipPointRedeemPage
                                    }
                                    onCrmIntegrationPointItemChange={
                                      handleCrmIntegrationPointItemChange
                                    }
                                    onCrmIntegrationPointItemBeforeAdd={
                                      handleCrmIntegrationPointItemBeforeAdd
                                    }
                                    crmIntegrationPointItemGlobalLocked={
                                      crmIntegrationPointItemGlobalLocked
                                    }
                                  />
                                )
                              case 'MembershipPoints':
                                return (
                                  <MembershipPoints
                                    config={childComponent}
                                    key={childComponent.id}
                                    crmIntegrationPointItemMap={
                                      crmIntegrationPointItemMap
                                    }
                                  />
                                )
                              case 'SoldOutImage':
                                return (
                                  <SoldOutFlag
                                    config={childComponent}
                                    key={childComponent.id}
                                    saleItemMap={saleItemMap}
                                  />
                                )
                              case 'Video':
                                return (
                                  <Video
                                    config={childComponent}
                                    key={childComponent.id}
                                    index={index}
                                  />
                                )
                              case 'Carousel':
                                return (
                                  <Carousel
                                    config={childComponent}
                                    key={childComponent.id}
                                    index={index}
                                  />
                                )
                              case 'DishName':
                                return (
                                  <DishName
                                    config={childComponent}
                                    key={childComponent.id}
                                    saleItemMap={saleItemMap}
                                  />
                                )
                              case 'SalePrice':
                                return (
                                  <SalePrice
                                    config={childComponent}
                                    key={childComponent.id}
                                    saleItemMap={saleItemMap}
                                  />
                                )
                              case 'MemberPrice':
                                return (
                                  <MemberPrice
                                    config={childComponent}
                                    key={childComponent.id}
                                    saleItemMap={saleItemMap}
                                  />
                                )
                              default:
                                return null
                            }
                          })}
                        </Container>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyOrder />
            )}
            <GlobalComponentsWrapper>
              {globalBlocks?.reduce(
                (preV, component, curI, array) => {
                  const { componentList, navigatorList, navigatorMenuMap } =
                    preV
                  switch (component.component) {
                    case 'ShoppingCart':
                      componentList.push(
                        <ShoppingCartButton
                          config={component}
                          key={component.id}
                        />
                      )
                      break
                    case 'Home':
                      componentList.push(
                        <HomeButton config={component} key={component.id} />
                      )
                      break
                    case 'ChangeLanguage':
                      componentList.push(
                        <ChangeLanguageButton
                          config={component}
                          key={component.id}
                        />
                      )
                      break
                    case 'MemberLogin':
                      componentList.push(
                        <MemberLoginButton
                          config={component}
                          key={component.id}
                        />
                      )
                      break
                    case 'SwitchBuffet':
                      componentList.push(
                        <SwitchBuffetButton
                          config={component}
                          key={component.id}
                        />
                      )
                      break
                    case 'CallServer':
                      componentList.push(
                        <CallServerButton
                          config={component}
                          key={component.id}
                        />
                      )
                      break
                    case 'CountDown':
                      componentList.push(
                        <CountDownAlert config={component} key={component.id} />
                      )
                      break
                    case 'OrderInterval':
                      componentList.push(
                        <OrderIntervalAlert
                          config={component}
                          key={component.id}
                        />
                      )
                      break
                    case 'SwitchTable':
                      componentList.push(
                        <SwitchTableButton
                          config={component}
                          key={component.id}
                        />
                      )
                      break
                    case 'ChangePartySize':
                      componentList.push(
                        <ChangePartySizeButton
                          config={component}
                          key={component.id}
                        />
                      )
                      break
                    case 'MenuList':
                      navigatorList.push({
                        index: componentList.length,
                        component,
                      })
                      break
                    case 'ExpandMenu':
                    case 'NarrowMenu':
                      navigatorMenuMap.set(component.id, component)
                      break
                    case 'BatteryWifi':
                      componentList.push(
                        <BatteryWifiInfo
                          config={component}
                          key={component.id}
                        />
                      )
                      break
                    default:
                      break
                  }
                  if (curI === array.length - 1) {
                    navigatorList.forEach(({ index, component }) => {
                      let expandMenuConfig = null
                      let narrowMenuConfig = null
                      const linkIds = component.props?.linkIds || []
                      linkIds.forEach((linkId) => {
                        const menuButton = navigatorMenuMap.get(linkId)
                        if (menuButton) {
                          switch (menuButton.component) {
                            case 'ExpandMenu':
                              expandMenuConfig = menuButton
                              break
                            case 'NarrowMenu':
                              narrowMenuConfig = menuButton
                              break
                            default:
                              break
                          }
                        }
                      })
                      componentList.splice(
                        index,
                        0,
                        <Navigator
                          key={component.id}
                          config={component}
                          categoryList={categoryList}
                          expandMenuConfig={expandMenuConfig}
                          narrowMenuConfig={narrowMenuConfig}
                        />
                      )
                    })
                    return componentList
                  } else {
                    return {
                      componentList,
                      navigatorList,
                      navigatorMenuMap,
                    }
                  }
                },
                {
                  componentList: [],
                  navigatorList: [],
                  navigatorMenuMap: new Map(),
                }
              )}
            </GlobalComponentsWrapper>
          </SwiperProvider>
        </EmenuProThemeProvider>
        {isShowPosterButton ? (
          <div
            onClick={() =>
              setPosterConfig({
                open: true,
              })
            }
            className={classes.openPoster}
          >
            <PosterButtonText />
          </div>
        ) : null}
      </div>
      <Poster />
      {lotteryConfig?.open ? <Lottery {...lotteryConfig} /> : null}
      <LoadingOverlay loading={loading} />
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <AdminLogin
          isOpen={orderAdminPermission.open}
          handleClose={closeAdminLogin}
          permission={orderAdminPermission.permission}
          next={orderAdminPermission.next}
        />
      </Suspense>
    </>
  )
}

export default EmenuProOrder
