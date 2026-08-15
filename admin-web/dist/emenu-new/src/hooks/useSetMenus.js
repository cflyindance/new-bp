import { useMemo, useRef, useState, useEffect } from 'react'
import { useRequest } from 'ahooks'
import {
  getMenus,
  transformMenus,
  getRestaurantHour,
  filterMenuByHour,
  fetchItemSizeList,
  fetchModifierAction,
} from '@/services/menus'
import { useGlobalState } from './useGlobalState'
import { useTranslation } from 'react-i18next'
import { useSnackbar } from 'notistack'
import { isEqual } from 'lodash-es'
import useSystemConfig from '@/hooks/useSystemConfig'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import { getSystemTime } from '@/services/system'
import dayjs from 'dayjs'
import useTranslateOptions from './useTranslateOptions'
import { META_ITEM_CATEGORY, META_ITEM_GROUP } from '@/constants'

export function useSetMenus() {
  const { t } = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const [menuSource, setMenuSource] = useGlobalState('Menu_Source', [])
  const [, setItemSizeLanguageList] = useGlobalState('itemSizeLanguageList')
  const [, setModifierActionList] = useGlobalState('modifierActionList')
  const [, setMenuInit] = useGlobalState('menuInit')
  const [allMenus, setAllMenus] = useGlobalState('All_Menus', [])
  const [tempAllMenu, setTempAllMenu] = useGlobalState('Temp_Menus', [])
  const [currentBuffetInfo] = useGlobalState('currentBuffetInfo')
  const [currentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const [apiVersions, setApiVersions] = useGlobalState('apiVersions')
  const [allComboSectionList, setAllComboSectionList] = useGlobalState(
    'Menu_Source_Combo_Section_List',
    []
  )
  // 用于优化 减少轮询时 re-render
  const [tempGroup, setTempGroup] = useState([])
  const { getFinalConfigById } = useSystemConfig()
  const showMenus = getFinalConfigById(9) || []
  // 新增了菜单分类模式 要进行区分 - 品类模式
  const { isPureBrandMode, isMixMode, isPureMenuClassifyMode } =
    useClassifyOrderMode()
  const isBrandModeOpen = useMemo(() => {
    if (isPureBrandMode) return true
    return isMixMode && currentBuffetInfo?.length > 0
  }, [isPureBrandMode, isMixMode, currentBuffetInfo])
  const brandMeuSetting = getFinalConfigById(13)?.brandMeuSetting
  // 区分后 - 菜单分类模式
  const [menuClassify] = useGlobalState('selectedMenuClassify')
  const isMenuClassifyOpen = useMemo(() => {
    if (isPureMenuClassifyMode) return true
    return isMixMode && menuClassify
  }, [isPureMenuClassifyMode, isMixMode, menuClassify])
  const menuClassifySetting = getFinalConfigById(52)?.menuClassifySetting
  // 后台大小图配置
  const { type, smallDishList, largeDishList } = getFinalConfigById(26) || {}
  // 特殊菜单模式
  const { specialMenu } = getFinalConfigById(55) || {}
  // 下单的 特殊菜单
  const currentOrderSpecialMenu = useMemo(() => {
    return specialMenu?.filter((each) => currentSpecialMenu?.includes(each.id))
  }, [specialMenu, currentSpecialMenu])
  const [orders] = useGlobalState('Orders')
  const isShowPotAfterOrderConfig = getFinalConfigById(83)?.open
  const isShowPotAfterOrder = useMemo(() => {
    if (
      !isShowPotAfterOrderConfig &&
      orders?.[0]?.cart?.some((each) => each.comboCart?.length > 0)
    )
      return false
    return true
  }, [isShowPotAfterOrderConfig, orders])

  // 工具函数：转换菜单的large状态
  const transformMenuWithLargeStatus = (menus) => {
    return menus?.map((group) => ({
      ...group,
      list: group?.list?.map((cate) => ({
        ...cate,
        list: cate?.list?.map((dish) => {
          let showLarge
          if (type === 'large') {
            showLarge = !smallDishList.includes(dish.id)
          } else if (type === 'small') {
            showLarge = !!largeDishList.includes(dish.id)
          } else {
            showLarge = dish.large
          }
          return {
            ...dish,
            showLarge,
          }
        }),
      })),
    }))
  }

  // 工具函数：过滤空菜单
  const filterEmptyMenus = (menu, deep = 1) => {
    return menu?.filter((item) => {
      item.list = filterEmptyMenus(item.list, deep + 1)
      if (deep === 1 || deep === 2) return item?.list?.length
      return item.buffetOrderDish || item.buffetViewOnly
    })
  }

  useEffect(() => {
    // 重置菜单的展示large状态
    let newMenus = transformMenuWithLargeStatus(tempAllMenu)

    // 展示菜单过滤
    if (showMenus?.length) {
      newMenus = newMenus.filter((g) => showMenus.includes(g.id))
    }

    // 品牌品类模式处理
    if (isBrandModeOpen && currentBuffetInfo?.length) {
      const allOrderDish = currentBuffetInfo.reduce((pre, cur) => {
        return pre.concat(cur.orderDishes)
      }, [])
      // 将特殊菜单处理为可下单的菜
      if (currentOrderSpecialMenu?.length) {
        currentOrderSpecialMenu.forEach((each) => {
          const { dishes } = each
          allOrderDish.push(...dishes)
        })
      }
      // 只可看不可下单的菜, 如果一个只可看的菜被配置到特殊菜中，将会变为可下单菜
      const buffetViewOnlyDish = currentBuffetInfo.reduce((pre, cur) => {
        return pre.concat(cur.viewOnlyDishIds)
      }, [])
      // 剔除夸品类可下单的菜
      const invalidDishes = buffetViewOnlyDish.filter(
        (each) => !allOrderDish.includes(each)
      )

      newMenus = newMenus.map((group) => ({
        ...group,
        list: group.list.map((category) => ({
          ...category,
          list: category.list.map((dish) => {
            let buffetViewOnlyBrand = []
            if (currentOrderSpecialMenu?.length) {
              buffetViewOnlyBrand = currentOrderSpecialMenu
                .filter((each) => each.dishes.includes(dish.id))
                ?.map((each) => ({ typeBItem: each.name }))
            }
            if (brandMeuSetting?.length && buffetViewOnlyBrand?.length <= 0) {
              buffetViewOnlyBrand = brandMeuSetting
                .filter((each) => each.orderDishes?.includes(dish.id))
                .reduce((pre, cur) => {
                  return pre.concat({
                    itemName: cur.itemName,
                    typeAItem: cur.typeAItem,
                    typeBItem: cur.typeBItem,
                  })
                }, [])
            }
            return {
              ...dish,
              buffetOrderDish: [
                ...allOrderDish,
                ...buffetViewOnlyDish,
              ].includes(dish.id),
              buffetViewOnly: invalidDishes.includes(dish.id),
              buffetViewOnlyBrand,
            }
          }),
        })),
      }))

      // 过滤没有配置菜的组类
      newMenus = filterEmptyMenus(newMenus)
    }

    // 品牌分类模式
    if (isMenuClassifyOpen && menuClassify) {
      const currentMenuClassify = menuClassifySetting.find(
        (each) => each.id === menuClassify
      )
      const {
        viewDishType = 0,
        allowedOrderDish,
        viewOnlyViaMenu = [],
        viewOnlyViaDish = [],
      } = currentMenuClassify

      const viewOnlyDishViaMenu = menuClassifySetting
        .filter((each) => viewOnlyViaMenu.includes(each.id))
        ?.reduce((pre, cur) => {
          return pre.concat(cur.allowedOrderDish)
        }, [])

      const invalidDishes =
        viewDishType === 0 ? viewOnlyDishViaMenu : viewOnlyViaDish

      newMenus = newMenus.map((group) => ({
        ...group,
        list: group.list.map((category) => ({
          ...category,
          list: category.list.map((dish) => ({
            ...dish,
            buffetOrderDish: allowedOrderDish?.includes(dish.id),
            buffetViewOnly: invalidDishes.includes(dish.id),
            buffetViewOnlyBrand: menuClassifySetting
              .filter((each) => each.allowedOrderDish?.includes(dish.id))
              .reduce((pre, cur) => {
                return pre.concat({
                  typeBItem: cur.name,
                })
              }, []),
          })),
        })),
      }))
      // 过滤没有配置菜的组类
      newMenus = filterEmptyMenus(newMenus)
    }

    if (!isShowPotAfterOrder) {
      newMenus = newMenus.map((group) => ({
        ...group,
        list: group.list.map((category) => ({
          ...category,
          list: category.list.map((dish) => {
            const isPotDish = !!dish?.isSpecialCombo
            return {
              ...dish,
              hidden: dish.hidden || isPotDish,
              hiddenByPot: isPotDish,
            }
          }),
        })),
      }))
    }

    // 对比更新状态
    if (!isEqual(allMenus, newMenus)) {
      setAllMenus(newMenus)
    }
  }, [
    tempAllMenu,
    showMenus,
    isBrandModeOpen,
    isMenuClassifyOpen,
    menuClassify,
    currentBuffetInfo,
    currentOrderSpecialMenu,
    brandMeuSetting,
    menuClassifySetting,
    type,
    smallDishList,
    largeDishList,
    isShowPotAfterOrder,
  ])

  // 可以售卖的菜品, 用于对比购物车菜品是否可以下单
  const saleItems = useRef([])
  saleItems.current = useMemo(
    () => allMenus.map((g) => g.list?.map((c) => c.list) ?? []).flat(2),
    [allMenus]
  )

  const { getItemSizeName } = useTranslateOptions()

  // 全部菜品
  const allMenuItem = useMemo(() => {
    return menuSource.map((g) => g.list?.map((c) => c.list) ?? []).flat(2)
  }, [menuSource])

  // 设备/系统配置用 的树结构
  const [treeData, treeDataWithComboSection] = useMemo(() => {
    const visibleGroup = menuSource?.filter((g) => !g.hidden)
    const groupList = []
    const groupListWithComboSection = []
    visibleGroup?.forEach((g) => {
      const visibleCategory = g.list?.filter(
        (c) => !c.hidden || c.name === META_ITEM_CATEGORY
      )
      const categoryList = []
      const categoryListWithComboSection = []
      visibleCategory?.forEach((c) => {
        const dishDataWithComboSection = c.list?.map((d) => ({
          title: t(d.id, { defaultValue: d.name, ns: 'dish' }),
          extraTitle:
            d.itemPrices?.length === 1
              ? getItemSizeName(d.itemPrices[0].sizeId) || d.itemPrices[0].size
              : '',
          key: d.id,
          value: d.id,
          withoutAttr:
            !d.isSpecialCombo &&
            !(
              (() => {
                if (!d.itemPrices?.length) return []

                let allList = []

                for (const price of d.itemPrices) {
                  if (price.type === 'DINE_IN') {
                    return d.itemPrices.filter((p) => p.type === 'DINE_IN')
                  }
                  if (price.type === 'ALL') {
                    allList.push(price)
                  }
                }

                return allList
              })().length > 1 ||
              d.comboSections?.length > 0 ||
              d.options?.length > 0
            ),
          isComboSection:
            allComboSectionList?.some((each) => each.saleItemId === d.id) &&
            d.itemPrices?.length > 0 &&
            d.itemPrices.every((item) => item.type.toUpperCase() === 'ALL'),
        }))
        const dishData =
          c.name === META_ITEM_CATEGORY
            ? []
            : dishDataWithComboSection?.filter((d) => !d.isComboSection)
        const defaultCategoryData = {
          title: t(c.id, { defaultValue: c.name, ns: 'category' }),
          key: c.id,
          value: c.id,
          checkable: true,
        }
        categoryList.push({
          ...defaultCategoryData,
          children: dishData,
        })
        categoryListWithComboSection.push({
          ...defaultCategoryData,
          children: dishDataWithComboSection,
        })
      })
      const defaultGroupData = {
        name: g.name,
        title: t(g.id, { defaultValue: g.name, ns: 'group' }),
        key: g.id,
        value: g.id,
        checkable: true,
      }
      if (g.name !== META_ITEM_GROUP) {
        groupList.push({
          ...defaultGroupData,
          children: categoryList,
        })
      }
      groupListWithComboSection.push({
        ...defaultGroupData,
        children: categoryListWithComboSection,
      })
    })
    return [groupList, groupListWithComboSection]
  }, [menuSource, t, allComboSectionList])

  const getOpenHour = async () => {
    try {
      const res = await getRestaurantHour()
      return res?.hours
    } catch (e) {
      enqueueSnackbar(`Get hour error: ${e?.message}`, { variant: 'error' })
    }
  }

  /* PIT-4648 Emenu套餐子菜detail需要支持中文
   * 通过fetchItemSizeList方法获取对应的多语言数据并存下来
   * 其余的业务逻辑抄的kiosk
   */
  const getItemSizeLanguageList = async () => {
    try {
      const res = await fetchItemSizeList()
      if (
        res &&
        Array.isArray(res?.data?.itemSizeList) &&
        res?.data?.itemSizeList.length > 0
      ) {
        setItemSizeLanguageList(res?.data?.itemSizeList || [])
      }
    } catch (e) {
      console.warn(e?.message)
    }
  }

  const getModifierActionList = async () => {
    try {
      const res = await fetchModifierAction()
      if (
        res &&
        Array.isArray(res?.modifierAction) &&
        res?.modifierAction?.length > 0
      ) {
        setModifierActionList(res?.modifierAction || [])
      }
    } catch (e) {
      console.warn(e?.message)
    }
  }

  const fetchSystemTime = async () => {
    try {
      const res = await getSystemTime()
      return res?.data?.systemtime || dayjs().format('YYYY-MM-DD hh:mm:ss')
    } catch (e) {
      console.log(e)
      return dayjs().format('YYYY-MM-DD hh:mm:ss')
    }
  }

  const fetchMenuSource = async (data = {}, polling) => {
    let menuVersion = apiVersions.menuVersion
    const isPolling = polling === 'polling'
    if (!tempAllMenu?.length || !isPolling) {
      menuVersion = undefined
    }
    return await getMenus({
      ...data,
      params: {
        ...data.params,
        menuVersion,
      },
    })
  }

  const {
    runAsync: runGetMenus,
    loading: getMenusLoading,
    error: getMenusError,
  } = useRequest(fetchMenuSource, {
    manual: true,
    throttleWait: 500,
    onSuccess: async (res, params) => {
      const isInPolling = params?.[1] === 'polling'
      if (isInPolling) {
        // 只有当 API 返回 menuVersion 字段时才进行版本比较
        if (res?.menuVersion) {
          const menuVersion = apiVersions.menuVersion
          // menuVersion 一致则接口会返回menus = null, 此时不处理接口新数据
          if (menuVersion === res?.menuVersion) {
            return
          }
          setApiVersions({
            ...apiVersions,
            menuVersion: res.menuVersion,
          })
        }
      }
      try {
        // 记录源数据
        setMenuSource(transformMenus(res.menus, { injectI18n: true }))
        setAllComboSectionList(res.menus?.[0]?.comboSectionSaleItemDTOList)
        getItemSizeLanguageList()
        getModifierActionList()
        const hours = await getOpenHour()
        // 获取 pos时间
        const posSystemTime = await fetchSystemTime()
        // 按照营业时间过滤menu
        const afterFilterGroup = filterMenuByHour({
          menus: res.menus,
          hours,
          systemTime: posSystemTime,
        })
        res.menus[0] = {
          ...res.menus[0],
          menuGroups: afterFilterGroup,
        }
        if (
          isInPolling &&
          isEqual(tempGroup, afterFilterGroup) &&
          tempAllMenu.length > 0
        )
          return
        setTempGroup(afterFilterGroup)
        const groups = transformMenus(res.menus, { injectI18n: false })
        // 根据营业时间过滤后的menu
        setTempAllMenu(groups)
      } catch (e) {
        enqueueSnackbar(`Get menu error: ${e?.message}`, { variant: 'error' })
      }
    },
    onFinally: () => {
      setMenuInit(true)
    },
    // onFinally: (params, result, error) => {
    //   const [successCallback, errorCallback] = params
    //   if (result && !error) {
    //     successCallback?.()
    //   } else if (!result && error) {
    //     errorCallback?.()
    //   }
    //   setMenuInit(true)
    // },
  })

  return {
    allMenus,
    setAllMenus,
    saleItems,
    treeData,
    treeDataWithComboSection,
    runGetMenus,
    getMenusLoading,
    getMenusError,
    menuSource,
    allMenuItem,
  }
}
