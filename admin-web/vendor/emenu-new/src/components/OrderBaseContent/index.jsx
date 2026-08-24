import React, {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { alpha, Box, Button, Divider, makeStyles } from '@material-ui/core'
import { InfoOutlined } from '@material-ui/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBoolean, useRequest, useSetState } from 'ahooks'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useSendKitchen } from '@/hooks/useSendKitchen'
import { roundToPrecision } from '@/utils/number'
import { serverUrl } from '@/utils/env_var'
import { listTaxes } from '@/services/system'
import {
  generateOrder,
  saveOrder,
  transformOrder,
  getChargeList,
  dealTimeAlert,
} from '@/services/orders'
import HOTPOT from '@/assets/image/hotpot.png'
import CategoryLabel from '../common/CategoryLabel'
import DishItemCount from '../DishItemCount'
import DishItemCard from '../DishItemCard'
import { useEmenuViewport } from '@/context/EmenuViewportContext'
import DishDialog from '../DishDialog'
import LoadingOverlay from '../common/LoadingOverlay'
import noImageDish from '@/assets/image/noimage-dish.png'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import useSystemConfig from '@/hooks/useSystemConfig'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import useCheckMemberStatus from '@/hooks/useCheckMemberStatus'
import useGetUserId from '@/hooks/useGetUserId'
import { nanoid } from 'nanoid'
import useSendMessage from '@/hooks/useSendMessage'
import { usePrintReceipt } from '@/hooks/usePrintReceipt'

const AdminLogin = lazy(() => import('../AdminLogin'))

const ReviewBaseToast = lazy(() => import('../common/ReviewBaseToast'))
const RevisePot = lazy(() => import('./components/RevisePot'))

const MemoDishItemCard = memo(DishItemCard)

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'grid',
    // marginRight: -12,
    gridTemplateRows: 'auto',
    gridTemplateColumns: 'calc(45% - 6px) calc(55% - 6px)',
    gridTemplateAreas: `
      "left right"
    `,
    columnGap: 12,
    overflowY: 'auto',
    [theme.breakpoints.down('sm')]: {
      gridTemplateRows: 'auto max-content',
      gridTemplateColumns: 'auto',
      gridTemplateAreas: `
        "left"
        "right"
      `,
    },
    '&::-webkit-scrollbar': {
      width: 0,
      height: 5,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A200,
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.primary.main,
    },
  },
  leftSection: {
    gridArea: 'left',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    // flexWrap: 'nowrap',
  },
  topRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  rightList: {
    gridArea: 'right',
    // paddingRight: 24,
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: 0,
      height: 5,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A200,
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.primary.main,
    },
  },
  comboBtnGroup: {
    display: 'flex',
    width: 340,
    // height: 48,
    // maxWidth: 'calc(100vw - 32px)',
    borderRadius: theme.shape.borderRadius * 1.5,
    backgroundColor: alpha(theme.palette.common.white, 0.1),
  },
  comboBtn: {
    flex: 1,
    fontSize: 16,
    fontWeight: 590,
    color: '#BDBDBD',
    borderRadius: theme.shape.borderRadius * 1.5,
    backgroundColor: 'transparent',
    // '&:hover': {
    //   color: '#333',
    //   backgroundColor: alpha(theme.palette.common.white, 0.7),
    // },
  },
  comboBtnText: {
    display: 'flex',
    flexFlow: 'column wrap',
    lineHeight: 1.2,
    wordBreak: 'break-word',
  },
  selectedBtn: {
    color: '#333',
    // marginInline: -1,
    backgroundColor: 'white',
    '&:hover': {
      color: '#333',
      backgroundColor: 'white',
    },
  },
  comboBtnDivider: {
    height: 24,
    alignSelf: 'center',
    backgroundColor: alpha(theme.palette.common.white, 0.1),
  },
  comboPicWrapper: {
    position: 'relative',
    width: 324,
    height: 324,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vw - 32px)',
    // overflow: 'hidden',
    // objectFit: 'cover',
    // borderRadius: '50%',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    // backgroundPositionX: 2,
    // filter: 'drop-shadow(5px 10px 20px rgba(0, 0, 0, 0.6))',
    // WebkitFilter: 'drop-shadow(5px 10px 20px rgba(0, 0, 0, 0.6))',
  },
  comboPic: {
    position: 'absolute',
    width: 274,
    height: 274,
    left: 'calc(50% - 274px/2)',
    top: 'calc(50% - 274px/2)',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#c8c1bd',
    borderRadius: '50%',
    overflow: 'hidden',
    // backgroundImage: `url(${HOTPOT})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  },
  comboPicItem: {
    '&-1': {
      width: '100%',
      height: '100%',
      fontSize: 40,
      lineHeight: 8,
      textAlign: 'center',
      borderRadius: 1000,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    },
    '&-2': {
      display: 'inline-block',
      width: '50%',
      height: '100%',
      fontSize: 40,
      lineHeight: 8,
      textAlign: 'center',
      backgroundSize: 'auto, cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      '&:first-child': {
        borderRight: '2px solid #c8c1bd',
      },
    },
    '&-3': {
      position: 'absolute',
      top: '-20%',
      right: '-20%',
      width: '70%',
      height: '70%',
      fontSize: 40,
      lineHeight: 5,
      textAlign: 'center',
      backgroundSize: 'auto, cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      borderWidth: 1.5,
      borderStyle: 'solid',
      borderColor: '#c8c1bd',
      transformOrigin: '0% 100%',
      '&:nth-child(2)': {
        // borderBottomWidth: 2,
        transform: 'rotate(0deg) skewY(30deg)',
      },
      '&:nth-child(3)': {
        // borderBottomWidth: 2,
        transform: 'rotate(120deg) skewY(30deg)',
      },
      '&:nth-child(1)': {
        // borderBottomWidth: 2,
        transform: 'rotate(240deg) skewY(30deg)',
      },
    },
    '&-4': {
      position: 'absolute',
      top: '-20%',
      right: '-20%',
      width: '70%',
      height: '70%',
      fontSize: 40,
      lineHeight: 5,
      textAlign: 'center',
      backgroundSize: 'auto, cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      borderWidth: 1.5,
      borderStyle: 'solid',
      borderColor: '#c8c1bd',
      transformOrigin: '0% 100%',
      '&:nth-child(2)': {
        transform: 'rotate(90deg)',
      },
      '&:nth-child(3)': {
        transform: 'rotate(180deg)',
      },
      '&:nth-child(4)': {
        transform: 'rotate(270deg) ',
      },
      '&:nth-child(1)': {
        transform: 'rotate(0deg)',
      },
    },
  },
  bottomBox: {
    width: '100%',
  },
  submitWrapper: {
    // width: 390,
    maxWidth: 'calc(100vw - 32px)',
    // marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    justifyContent: 'center',
    // [theme.breakpoints.down('xs')]: {
    //   marginTop: theme.spacing(5),
    // },
  },
  submitBtn: {
    height: 48,
    fontSize: 16,
    lineHeight: 1.2,
    flex: 1,
    padding: 0,
    fontWeight: 'bold',
  },
  editBtn: {
    height: 48,
    fontSize: 20,
    lineHeight: 1.2,
  },
  tipMsg: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginBottom: 8,
    width: '100%',
    overflow: 'hidden',
  },
  tipMsgItem: {
    flex: 1,
    padding: '4px 8px',
    height: 84,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'auto',
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
    '&:first-of-type': {
      //borderRight: '1px solid #E3C18A33',
    },
  },
  tipTitle: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    overflow: 'hidden',
    color: '#E3C18A',
    '&> .MuiSvgIcon-root': {
      fontSize: 12,
      marginRight: 2,
      verticalAlign: -1,
    },
  },
  tipContent: {
    width: '100%',
    wordBreak: 'break-word',
    color: '#fff',
  },
}))

/*
火锅菜特殊布局内容
*/
function OrderBaseContent(props) {
  const viewport = useEmenuViewport()
  const { list, listGap, updateList, setFeedbackToastStatus } = props
  const classes = useStyles()
  const navigate = useNavigate()
  const { t } = useTranslation(['translation', 'dish'])
  const { getFinalConfigById } = useSystemConfig()
  const tipMessage = getFinalConfigById(4)
  const sendHotPot = getFinalConfigById(21)
  const samePotDefaultAdded = getFinalConfigById(37)
  // const isOpenSpecialDishPermission = getFinalConfigById(36)?.open
  const isOpenDuration = getFinalConfigById(5)?.open
  const durationTime = getFinalConfigById(5)?.duration
  const isOpenAlert = getFinalConfigById(14)?.open
  const alertTime = getFinalConfigById(14)?.restTimeAlert
  const [cart, setCart] = useGlobalState('Cart')
  const [menuClassify] = useGlobalState('selectedMenuClassify')
  const [currentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const [currentBuffetInfo] = useGlobalState('currentBuffetInfo')
  const specialMenuInfo = getFinalConfigById(55)
  const customDishOrderMessagesConfig = getFinalConfigById(75)
  const [privilegeItem] = useGlobalState('privilegeItem')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const isAutoOrderHotPot = useMemo(() => {
    return sendHotPot?.hotPotOrderMethod === 'auto'
  }, [sendHotPot])

  const hasAllergy = useMemo(() => {
    return tipMessage?.hotPotFirstTitle && tipMessage?.hotPotFirstContent
  }, [tipMessage])

  const hasMulti = useMemo(() => {
    return tipMessage?.hotPotSecondTitle && tipMessage?.hotPotSecondContent
  }, [tipMessage])
  // 是否支持下单多份套餐
  const [multiCombo] = useLocalStorage('emenu_multiCombo', {
    multiple: false,
    min: 1,
    max: 5,
  })
  // 套餐份数，默认1，multiCombo开启时可修改
  const [count, setCount] = useState(1)
  const [samePotDefaultAddedMoney, setSamePotDefaultAddedMoney] = useState(0)
  const [samePotInfo, setSamePotInfo] = useState({
    dishId: '',
    num: 0,
  })
  const [selectedSpecialComboId, setSelectedSpecialComboId] = useGlobalState(
    'selectedSpecialComboId'
  )
  const [comboCart, setComboCart] = useGlobalState('ComboCart')
  const { allMenuItem } = useSetMenus()
  const [orders, setOrders] = useGlobalState('Orders')
  const [earningRule] = useGlobalState('earningRule')
  const [notCountAsGuestNumber] = useGlobalState('notCountAsGuestNumber')
  const [modifierActionList] = useGlobalState('modifierActionList')
  const { getUserId } = useGetUserId()
  const { runFetchOrder } = useFetchOrder()
  const { runSendKitchen } = useSendKitchen()
  const { runPrintReceipt } = usePrintReceipt()
  const [tableInfo, setTableInfo] = useLocalStorage('emenu_table', {})
  const [userInfo] = useLocalStorage('emenu_user')
  const [editItem, setEditItem] = useState()
  const [
    openDishDialog,
    { setTrue: setOpenDishDialog, setFalse: setCloseDishDialog },
  ] = useBoolean()
  const [openReview, { setTrue: setOpenReview, setFalse: setCloseReview }] =
    useBoolean()
  const [adminLogin, setAdminLogin] = useSetState({
    open: false,
    permission: '',
    next: () => {},
  })
  const [openRevise, setOpenRevise] = useState(false)

  const [memberInfo] = useGlobalState('memberInfo')
  const { isHasBenefit } = useCheckMemberStatus(memberInfo)

  const { currentTable } = tableInfo
  const orderId = useMemo(() => tableInfo?.currentOrder?.id, [tableInfo])
  const isSubOrder = useMemo(
    () => tableInfo?.currentOrder?.parentOrderId > 0,
    [tableInfo]
  )
  const selected = selectedSpecialComboId ?? 0
  const selectedCombo = useMemo(() => {
    return list?.[selected] ?? {}
  }, [list, selected])

  useEffect(() => {
    if (comboCart) {
      let samePotDefaultAddedMoney = checkIdSamePotDefaultAdded(comboCart)
      setSamePotDefaultAddedMoney(samePotDefaultAddedMoney)
      updateList?.({ selected, samePotDefaultAddedMoney })
    }
  }, [comboCart])

  // 使用 useEffect 来监听 comboCart 的变化
  useEffect(() => {
    if (comboCart) {
      let samePotDefaultAddedMoney = checkIdSamePotDefaultAdded(comboCart)
      setSamePotDefaultAddedMoney(samePotDefaultAddedMoney)
      updateList?.({ selected, samePotDefaultAddedMoney })
    }
  }, [comboCart])
  // 判断是不是有需要加收的id，并返回加收菜品的加收金额
  const checkIdSamePotDefaultAdded = (data) => {
    if (!data || !samePotDefaultAdded) return 0 //没设置加收项，或者没有锅底的时候，直接返回0
    let idCount = data.reduce((acc, item) => {
      //统计 data 中每个菜的出现次数
      acc[item.id] = (acc[item.id] || 0) + 1
      return acc
    }, {})
    // 计算锅底的一半数量
    let halfLength = Math.floor(selectedCombo.count / 2) || 999999
    // 查找是否有锅底出现次数超过一半的
    for (const id in idCount) {
      if (idCount[id] > halfLength) {
        // 在 samePotDefaultAdded 中查找该 id 对应的 charge 值
        const match = samePotDefaultAdded.find(
          (item) => item.dishes === parseInt(id)
        )
        if (match) {
          // 把要多收钱的菜信息放进去
          setSamePotInfo({ dishId: match.dishes, num: idCount[id] })
          return match.charge
        } else {
          return 0 //要是点了超过一半的菜，但是没加收，直接return
        }
      }
    }
    return 0 // 如果没有 dishes 超过一半，或者找不到对应的 charge 值，返回 0
  }
  // new 汤底
  const seasonalList = useMemo(
    () =>
      selectedCombo?.comboList?.filter(
        (i) => i.isNew && (i.price > -1 || i.itemPrices?.length)
      ) ?? [],
    [selectedCombo]
  )
  // 其他汤底
  const nonSpicyList = useMemo(
    () =>
      selectedCombo?.comboList?.filter(
        (i) => !i.isNew && (i.price > -1 || i.itemPrices?.length)
      ) ?? [],
    [selectedCombo]
  )

  const realMainPrice = useMemo(() => {
    return selectedCombo?.price
  }, [selectedCombo?.price])

  const realMainBenefitPrice = useMemo(() => {
    return selectedCombo?.benefitPrice ?? selectedCombo?.price
  }, [selectedCombo?.benefitPrice, selectedCombo?.price])

  const realSubPrice = useMemo(() => {
    return roundToPrecision(
      comboCart.reduce((acc, cur) => {
        const havePriceCount = cur.count - (cur.freeQuantityCount ?? 0)
        return (
          acc +
          (havePriceCount > 0
            ? (cur.realMainPrice ?? cur.realPrice ?? cur.price) * havePriceCount
            : 0) +
          (cur.realSubPrice ?? 0) * cur.count
        )
      }, 0)
    )
  }, [comboCart])

  const realSubBenefitPrice = useMemo(() => {
    return roundToPrecision(
      comboCart.reduce((acc, cur) => {
        const havePriceCount = cur.count - (cur.freeQuantityCount ?? 0)
        return (
          acc +
          (havePriceCount > 0
            ? (cur.realMainBenefitPrice ??
                cur.realMainPrice ??
                cur.realPrice ??
                cur.price) * havePriceCount
            : 0) +
          (cur.realSubBenefitPrice ?? cur.realSubPrice ?? 0) * cur.count
        )
      }, 0)
    )
  }, [comboCart])

  // 套餐总价
  const totalPrice = useMemo(
    () => roundToPrecision(realMainPrice + realSubPrice),
    [realMainPrice, realSubPrice]
  )

  // 套餐总会员价
  const totalBenefitPrice = useMemo(
    () => roundToPrecision(realMainBenefitPrice + realSubBenefitPrice),
    [realMainBenefitPrice, realSubBenefitPrice]
  )

  // 是否展示会员价
  const isShowBenefitPrice = useMemo(
    () => totalPrice !== totalBenefitPrice,
    [totalPrice, totalBenefitPrice]
  )

  const { run: runSaveMessage } = useSendMessage({
    onBeforeSend: () => {},
    onAfterSend: () => {},
  })

  const closeAdminLogin = () => setAdminLogin({ open: false })

  // 选择套餐
  const handleSelectCombo = (idx) => () => {
    console.log('🚀 select combo', list[idx])
    setSelectedSpecialComboId(idx)
    setComboCart([])
  }
  // 编辑已选汤底
  const handleEditItem = (item) => () => {
    setEditItem(item)
    setOpenDishDialog()
  }
  // 修改已选汤底
  const handleChangeCombo = (data) => {
    console.log('🚀 change combo', editItem, data)
    const newCart = [...comboCart]
      .map((e) => (e.key === editItem.key ? { ...editItem, ...data } : e))
      .filter((e) => e.count > 0)
    setComboCart(newCart)
  }
  // 删除已选汤底
  const handleRemoveCombo = (data) => {
    console.log('🚀 remove combo', data)
    const newCart = [...comboCart].filter((e) => e.key !== data.key)
    setComboCart(newCart)
  }
  // 套餐下单
  const handleSubmitCombo = (taxes) => {
    const {
      id,
      name,
      pic,
      price,
      sectionId,
      taxIds,
      taxFreeMinQty,
      categoryId,
      hotpotPriceRule,
      benefitPrice,
      mergeDisplay,
    } = selectedCombo
    const timeAlert = dealTimeAlert(
      { isOpenAlert, alertTime },
      { isOpenDuration, durationTime }
    )
    let buffetItemIdList = null
    if (currentBuffetInfo?.length > 0) {
      buffetItemIdList = []
      currentBuffetInfo.forEach((each) => {
        buffetItemIdList.push(
          ...(each.orderDishes || []),
          ...(each.viewOnlyDishIds || [])
        )
      })
      specialMenuInfo?.open &&
        specialMenuInfo?.specialMenu?.forEach((cur) => {
          if (currentSpecialMenu?.includes(cur.id)) {
            buffetItemIdList.push(...(cur.dishes || []))
          }
        })
    }

    const buffetCart = cart.filter((each) => each.isBuffetItem)
    const totalPriceWithbuffectCart = roundToPrecision(
      buffetCart.reduce(
        (acc, cur) => acc + (cur.realPrice ?? cur.price) * cur.count,
        totalPrice * count
      )
    )

    const totalBenefitPriceWithbuffectCart = roundToPrecision(
      buffetCart.reduce(
        (acc, cur) =>
          acc +
          (cur.realBenefitPrice ?? cur.realPrice ?? cur.price) * cur.count,
        totalBenefitPrice * count
      )
    )

    const data = {
      cart: [
        ...buffetCart,
        {
          id,
          name,
          pic,
          count,
          price,
          sectionId,
          taxIds,
          comboCart,
          realPrice: totalPrice,
          realMainPrice,
          realSubPrice,
          realMainBenefitPrice,
          realSubBenefitPrice,
          categoryId,
          taxFreeMinQty,
          hotpotPriceRule,
          benefitPrice,
          realBenefitPrice: roundToPrecision(totalBenefitPrice * count),
          mergeDisplay,
        },
      ],
      totalPrice: totalPriceWithbuffectCart,
      taxes,
      crmMemberId: memberInfo?.userId,
      isHasBenefit, // 是否有权益 - 有 -> 会员价下单
      totalBenefitPrice: totalBenefitPriceWithbuffectCart,
      earningRule,
      ...timeAlert,
      buffetItemIdList,
    }
    run(data)
  }

  // 数量限制和特殊菜品限制是否已通过（一次性）
  // const [oncePassed, setOncePassed] = useSetState({
  //   special: false,
  // })

  // 下单限制输入密码，每次下单命中多个规则只需要输入一次密码
  // const [isNeedPwd, setIsNeedPwd] = useState(true)

  const addButtonRef = useRef()
  const [, setAddToCartQueue] = useGlobalState('addToCartQueue')

  const doSubmit = async () => {
    if (!currentTable || !userInfo) {
      navigate('/')
      return false
    }
    // 非自动下单
    if (!isAutoOrderHotPot) {
      const {
        id,
        name,
        pic,
        price,
        sectionId,
        taxIds,
        taxFreeMinQty,
        categoryId,
        hotpotPriceRule,
        benefitPrice,
        mergeDisplay,
      } = selectedCombo
      const data = {
        id,
        name,
        pic,
        price,
        sectionId,
        taxIds,
        taxFreeMinQty,
        categoryId,
        hotpotPriceRule,
        count,
        realPrice: totalPrice,
        realMainPrice,
        realSubPrice,
        realMainBenefitPrice,
        realSubBenefitPrice,
        comboCart,
        benefitPrice,
        realBenefitPrice: totalBenefitPrice,
        tempHotPotId: nanoid(),
        mergeDisplay,
      }
      setCloseReview()
      const addButtonRect = addButtonRef.current?.getBoundingClientRect?.()
      if (addButtonRect) {
        setAddToCartQueue((prev) => [
          ...prev,
          { key: nanoid(), count: data.count, addButtonRect },
        ])
      }
      setCart([...cart, data])
      setStoragedCart([...cart, data])
      setComboCart([])
      setSelectedSpecialComboId(0)
      return
    }

    // !第一步：下单限制
    // const needDuration = needDurationPermission()
    // const needSpecial = needSpecialPermission()
    // console.log(`🚀 ~ orderId`, orderId)
    // console.log(`🚀 ~ needDuration`, needDuration)
    // console.log(`🚀 ~ needSpecial`, needSpecial)
    // console.log(`🚀 ~ savedPermission`, savedPermission)
    // console.log(`🚀 ~ oncePassed`, oncePassed)
    // if (needDuration && isNeedPwd) {
    //   setAdminLogin({
    //     open: true,
    //     permission: 'duration',
    //     next: () => {
    //       setIsNeedPwd(false)
    //       setSavedPermission((prev) => ({
    //         ...prev,
    //         [orderId]: {
    //           ...prev[orderId],
    //           durationPermitted: true,
    //         },
    //       }))
    //     },
    //   })
    //   return false
    // }
    // if (
    //   needSpecial &&
    //   isOpenSpecialDishPermission &&
    //   !oncePassed.special &&
    //   isNeedPwd
    // ) {
    //   setAdminLogin({
    //     open: true,
    //     permission: 'special',
    //     next: () => {
    //       setIsNeedPwd(false)
    //       setOncePassed({ special: true })
    //     },
    //   })
    //   return false
    // }
    setCloseReview()
    setFeedbackToastStatus(() => ({
      open: true,
      loading: true,
      data: { status: 'loading' },
      error: null,
      onClose: () =>
        setFeedbackToastStatus((prev) => ({
          ...prev,
          open: false,
        })),
    }))
    // 获取订单最新信息
    if (orderId) {
      await runFetchOrder()
    }
    // 获取税信息
    runListTaxes()
  }

  // 获取税信息
  const { run: runListTaxes } = useRequest(listTaxes, {
    manual: true,
    onSuccess: (res) => {
      const taxes = res.taxes ?? []
      // 提交订单
      handleSubmitCombo(taxes)
    },
  })

  // 提交订单
  const submitCombo = useCallback(
    async (data) => {
      const res = await getChargeList()
      const order = generateOrder({
        order: {
          ...data,
          chargeInfo: res.charge,
          menuClassify,
          currentSpecialMenu,
          notCountAsGuestNumber,
        },
        prevOrder: orders?.[0],
        userId: getUserId(),
      })
      return saveOrder({ order })
    },
    [orders, menuClassify, currentSpecialMenu, notCountAsGuestNumber]
  )
  const { run } = useRequest(submitCombo, {
    manual: true,
    onSuccess: async (result, [params]) => {
      setTableInfo((info) => ({
        ...info,
        currentOrder: result.order,
      }))
      const orders = [
        transformOrder({
          order: result.order,
          menuList: allMenuItem,
          modifierActionList: modifierActionList,
          memberCard: privilegeItem,
        }),
      ].filter(Boolean)
      setComboCart([])
      setOrders(orders)
      setStoragedCart((prev) => prev.filter((each) => !each.isBuffetItem))
      setCart((prev) => prev.filter((each) => !each.isBuffetItem))
      setSelectedSpecialComboId(0)
      setCount(1)
      // 发送消息给POS
      const newOrderId = result.order?.id
      console.log(
        `🚀 ~ OrderBaseContent ~ orderId, newOrderId`,
        orderId,
        newOrderId
      )
      const customDishOrderMessages =
        (customDishOrderMessagesConfig?.open &&
          customDishOrderMessagesConfig?.customDishOrderMessages) ||
        []
      const cart = params.cart || []
      const customDishOrderMessageList = []
      customDishOrderMessages.forEach((item) => {
        if (
          item.message &&
          item.dishes?.find((dishId) => cart.find((c) => c.id === dishId))
        ) {
          customDishOrderMessageList.push(item.message)
        }
      })
      const customDishOrderMessageContent =
        customDishOrderMessageList.join('\n')

      runSaveMessage({
        type: newOrderId === orderId ? 'editOrder' : 'newOrder',
        title: newOrderId === orderId ? 'Additional Order' : 'New Order',
        content: `${currentTable?.name ?? 'None'}${customDishOrderMessageContent ? `|${customDishOrderMessageContent}` : ''}`,
        tableId: currentTable?.id,
      })

      const asyncFn = async () => {
        // 延迟送厨
        await runSendKitchen(orders)
        // 打印小票
        await runPrintReceipt(orders)
      }
      asyncFn()
    },
    onFinally: (params, result, error) => {
      const data = error ? result : { status: 'ok', data: result }
      setFeedbackToastStatus((prev) => ({
        ...prev,
        loading: false,
        data: { status: 'loading', ...data },
        error: error,
      }))
      const t = setTimeout(() => {
        setFeedbackToastStatus((prev) => ({
          ...prev,
          open: false,
        }))
        clearTimeout(t)
      }, 3000)
    },
  })

  const renderRightList = (list, text) => (
    <Box marginTop={2} marginBottom={4}>
      <CategoryLabel fontSize={20} dotSize={23} text={t(`OrderBase.${text}`)} />
      {list.map((e, i) => (
        <MemoDishItemCard key={i} {...e} comboItem combo={selectedCombo} />
      ))}
    </Box>
  )

  useEffect(() => {
    if (
      comboCart.length > 0 &&
      selectedCombo?.count > 0 &&
      comboCart.length === selectedCombo?.count &&
      comboCart?.[0]?.combo?.id === selectedCombo?.id &&
      !isSubOrder
    ) {
      setOpenRevise(false)
      setOpenReview()
    }
  }, [comboCart, selectedCombo?.count, isSubOrder, setOpenReview])

  return (
    <Box
      className={classes.root}
      style={{ height: Math.max(160, viewport.layoutHeight - 20) }}
    >
      <Box className={classes.leftSection}>
        <div className={classes.topRow}>
          <CategoryLabel
            fontSize={32}
            dotSize={28}
            text={t('OrderBase.choose_pot')}
          />
          <Box className={classes.comboBtnGroup}>
            {list.length > 1 &&
              list.map((e, i) => (
                <React.Fragment key={i}>
                  <Button
                    classes={{
                      root: `${classes.comboBtn} ${
                        selected === i ? classes.selectedBtn : ''
                      }`,
                      label: classes.comboBtnText,
                    }}
                    onClick={handleSelectCombo(i)}
                  >
                    {t(e.id, { defaultValue: e.name, ns: 'dish' })}
                    <Box component="span" fontSize={14} color="#828282">
                      {e.price ? `$${e.price}` : null}
                      {e.strikethroughPrice !== undefined &&
                      e.strikethroughPrice !== null ? (
                        <span
                          style={{
                            marginLeft: '5px',
                            fontSize: '12px',
                            textDecoration: 'line-through',
                          }}
                        >
                          ${e.strikethroughPrice.toFixed(2)}
                        </span>
                      ) : null}
                    </Box>
                    {typeof e.benefitPrice === 'number' && (
                      <VipPriceWithImg
                        benefitPrice={
                          e.benefitPrice ? `$${e.benefitPrice}` : null
                        }
                      />
                    )}
                  </Button>
                  {i < list.length - 1 && (
                    <Divider
                      orientation="vertical"
                      classes={{ vertical: classes.comboBtnDivider }}
                    />
                  )}
                </React.Fragment>
              ))}
          </Box>
        </div>
        <Box
          className={classes.comboPicWrapper}
          style={{
            backgroundImage: `url(${
              selectedCombo?.pic ? serverUrl + selectedCombo?.pic : null
            })`,
          }}
        >
          <Box
            className={classes.comboPic}
            style={{
              backgroundImage: `url(${selectedCombo?.pic ? null : HOTPOT})`,
            }}
            ref={addButtonRef}
          >
            {Array.from({ length: selectedCombo?.count }, (_, i) => (
              <div
                key={i}
                className={`${classes.comboPicItem}-${selectedCombo?.count}`}
                style={{
                  cursor: comboCart?.[i] ? 'pointer' : 'default',
                  backgroundImage: comboCart?.[i]
                    ? `url(${
                        serverUrl + comboCart?.[i]?.pic
                      }), url(${noImageDish})`
                    : `none`,
                }}
                onClick={handleEditItem(comboCart?.[i])}
              ></div>
            ))}
          </Box>
        </Box>
        {editItem && (
          <DishDialog
            data={editItem}
            comboItem
            mode="edit"
            open={openDishDialog}
            onSubmit={handleChangeCombo}
            onRemove={handleRemoveCombo}
            onClose={setCloseDishDialog}
            combo={selectedCombo}
          />
        )}
        <div className={classes.bottomBox}>
          <Box height={48} marginBottom={1} className={classes.submitWrapper}>
            {comboCart.length > 0 && (
              <Button
                onClick={() => setOpenRevise(true)}
                variant="contained"
                className={classes.editBtn}
                color="primary"
                style={{
                  width: comboCart.length === selectedCombo?.count ? 146 : 390,
                  fontSize: 16,
                }}
              >
                {t('OrderBase.editBase')}
              </Button>
            )}
            {comboCart.length === selectedCombo?.count && !isSubOrder && (
              <>
                {multiCombo?.multiple && (
                  <Box>
                    <DishItemCount
                      count={count}
                      width={106}
                      min={multiCombo?.min}
                      max={multiCombo?.max}
                      onChange={(v) => setCount(v)}
                    />
                  </Box>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.submitBtn}
                  onClick={setOpenReview}
                >
                  {t(
                    isAutoOrderHotPot
                      ? 'OrderBase.continue'
                      : 'OrderBase.sendCart',
                    {
                      value: roundToPrecision(totalPrice * count),
                    }
                  )}
                  {isShowBenefitPrice && (
                    <VipPriceWithImg
                      imgType="white"
                      style={{ marginLeft: 8, fontSize: '1rem', color: '#fff' }}
                      benefitPrice={totalBenefitPrice}
                    />
                  )}
                </Button>
              </>
            )}
          </Box>
          {/*<Box>{warningBox}</Box>*/}
          {hasAllergy && (
            <div className={classes.tipMsg}>
              <div className={classes.tipMsgItem}>
                <div className={classes.tipTitle}>
                  <InfoOutlined fontSize="small" />
                  <span> {tipMessage?.hotPotFirstTitle}</span>
                </div>
                <div className={classes.tipContent}>
                  {tipMessage?.hotPotFirstContent}
                </div>
              </div>
              {hasMulti && (
                <div className={classes.tipMsgItem}>
                  <div className={classes.tipTitle}>
                    <InfoOutlined fontSize="small" />
                    <span> {tipMessage?.hotPotSecondTitle}</span>
                  </div>
                  <div className={classes.tipContent}>
                    {tipMessage?.hotPotSecondContent}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Box>
      <Box className={classes.rightList}>
        {/*{traditionalList.length > 0 &&*/}
        {/*    renderRightList(traditionalList, 'base_type_1')}*/}
        {seasonalList.length > 0 &&
          renderRightList(seasonalList, 'base_type_2')}
        {nonSpicyList.length > 0 &&
          renderRightList(nonSpicyList, 'base_type_3')}
      </Box>
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <ReviewBaseToast
          open={openReview}
          data={comboCart}
          samePotDefaultAddedMoney={samePotDefaultAddedMoney}
          samePotInfo={samePotInfo}
          onClose={setCloseReview}
          onSubmit={doSubmit}
          isAutoOrderHotPot={isAutoOrderHotPot}
          openReviseModal={() => setOpenRevise(true)}
        />
        <AdminLogin
          isOpen={adminLogin.open}
          handleClose={closeAdminLogin}
          permission={adminLogin.permission}
          next={adminLogin.next}
        />
        <RevisePot
          combo={selectedCombo}
          maxCount={selectedCombo?.count}
          potType={list[selected]}
          onClose={() => setOpenRevise(false)}
          open={openRevise}
          handleEditItem={handleEditItem}
        />
      </Suspense>
    </Box>
  )
}

export default OrderBaseContent
