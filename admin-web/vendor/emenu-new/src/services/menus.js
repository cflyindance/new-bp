import { getI18n } from 'react-i18next'
import { daysOfWeek } from '@/constants/week'
import { isEmpty, isNil, omitBy } from 'lodash-es'
import { htmlDecode } from '@/utils/decode'
import request from '@/utils/request'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import setOptions from '@/utils/setOptions'
import afterResolveOption from '@/utils/resolveOption'
import { transformLanguageCode } from '@/locales/resources'
import { META_ITEM_GROUP } from '@/constants'
import { resolveConfiguredStrikethroughPrice } from '@/services/strikethroughPriceBridge'

dayjs.extend(isBetween)

const allowedTextTags = [
  'CONTAIN_ALCOHOL',
  'RAW_OR_UNDERCOOKED',
  'COLD',
  'HOT',
  'VEGGIE',
  'SHELLFISH',
]

const formatStrikethDiscount = (strikethroughPrice, price) =>
  `${Math.abs(
    ((strikethroughPrice - price) / strikethroughPrice) * 100
  ).toFixed(0)}% OFF`

export function getMenus({ params = {}, axiosConfig = {} } = {}) {
  // const i18n = getI18n()
  return request({
    url: '/menu/menu',
    params: {
      // lang: i18n.language,
      product: 'EMENU',
      showInactive: false,
      showDeleted: false,
      ...params,
    },
    method: 'get',
    ...axiosConfig,
  })
}
export function fetchItemSizeList() {
  // 获取菜规格size的多语言列表
  return request({
    url: `${
      import.meta.env.DEV
        ? `${import.meta.env.VITE_SERVER_URL}webapp`
        : '/kpos/webapp'
    }/itemSizes`,
    method: 'get',
  })
}
export function fetchModifierAction() {
  // 获取全局调味指示多语言列表
  return request({
    url: '/modifier/action/list',
    method: 'get',
  })
}
export function getRestaurantHour(params = {}) {
  // const i18n = getI18n()
  return request({
    url: '/hours/list',
    method: 'get',
    params: params,
  })
}

function transformItem(item, saleItems) {
  if (!item) {
    return void 0
  }
  const configuredStrikethroughPrice = resolveConfiguredStrikethroughPrice(item.id)
  if (configuredStrikethroughPrice.hasOverride) {
    item = {
      ...item,
      strikethroughPrice: configuredStrikethroughPrice.value,
    }
  }
  const preItemPrices = (() => {
    if (!item.itemPrices?.length) return []

    let allList = []

    for (const price of item.itemPrices) {
      if (price.type === 'DINE_IN') {
        return item.itemPrices.filter((p) => p.type === 'DINE_IN')
      }
      if (price.type === 'ALL') {
        allList.push(price)
      }
    }

    return allList
  })()

  const itemPrices = preItemPrices
    ?.map((e) => ({ ...e, default: e.sizeId === item.defaultItemSizeId }))
    ?.sort((a, b) => a.price - b.price)
  const defaultPrice = item.addPrice ?? item.price
  // 普通价格和详细价格过滤后都是空的菜不显示
  const hidden =
    item.hiddenItem ||
    (!item.marketPriceItem && isNil(defaultPrice) && isEmpty(itemPrices))
  const taxIds = item.taxIds
  const taxFreeMinQty = item.taxFreeMinQty
  const categoryId = item.categoryId
  const preSelected = item.preSelected // 是否预选 - 对于comboSections下comboSectionSaleItems适用
  const properties = item.properties?.filter((i) => !(i.type === 3)) // 去除商品中心统计标签

  // 菜品增加SPECIAL_COMBO属性/标签区分普通套餐和锅底套餐
  if (properties?.some((i) => i.name === 'SPECIAL_COMBO')) {
    let result = {
      isSpecialCombo: true,
      id: item.id,
      hidden,
      name: htmlDecode(item.name),
      itemName: item.name,
      desc: item.description,
      pic: item.thumbPath,
      price: itemPrices?.length === 1 ? itemPrices?.[0]?.price : defaultPrice,
      itemPrices,
      taxIds,
      taxFreeMinQty,
      categoryId,
      preSelected,
      outOfStock: item.outOfStock,
      hotpotPriceRule: item.comboSections?.[0]?.priceRule,
      sectionId: item.comboSections?.[0]?.id,
      count: item.comboSections?.[0]?.maxNumOfSelectionAllowed,
      freeQuantity:
        item.comboSections?.[0]?.priceRule === 'FIXED_PRICE'
          ? Number.MAX_SAFE_INTEGER
          : item.comboSections?.[0]?.priceRule === 'FIXED_UNTIL_MAX'
            ? (item.comboSections?.[0]?.maxNumOfSelectionAllowed ?? 0)
            : item.comboSections?.[0]?.freeQuantity,
      // comboType: item.comboType,
      comboList: item.comboSections?.[0]?.comboSectionSaleItems
        ?.map((i) => {
          const e = saleItems?.find((s) => s.id === i.saleItemId)
          return e ? transformItem({ ...e, ...i }, saleItems) : null
        })
        .filter(Boolean),
      properties: properties,
      benefitPrice:
        itemPrices?.length >= 1
          ? itemPrices?.[0]?.benefitPrice
          : item.benefitPrice,
      itemNumber: item.itemNumber,
      repeatable: item.comboSections?.[0]?.allowRepeatedItems,
      mergeDisplay: item.comboSections?.[0]?.mergeDisplay,
    }

    if (
      item.strikethroughPrice !== undefined &&
      item.strikethroughPrice !== null
    ) {
      result.strikethroughPrice = item.strikethroughPrice //划线价
      result.strikethDiscount = formatStrikethDiscount(
        item.strikethroughPrice,
        result.price
      ) //划线价和售价计算折扣
    }
    return result
  } else {
    const saleItem = {
      id: item.id,
      hidden,
      name: htmlDecode(item.name),
      itemName: item.name,
      desc: item.description,
      pic: item.thumbPath,
      price:
        itemPrices?.length === 1
          ? itemPrices?.[0]?.price
          : item.marketPriceItem
            ? defaultPrice || 0
            : defaultPrice,
      marketPriceItem: item.marketPriceItem,
      itemPrices,
      taxIds,
      taxFreeMinQty,
      preSelected,
      categoryId,
      outOfStock: item.outOfStock,
      large:
        itemPrices?.length > 1 ||
        item.comboSections?.length > 0 ||
        item.options?.length > 0,
      comboType: item.comboType,
      optionList: [],
      benefitPrice:
        itemPrices?.length >= 1
          ? itemPrices?.[0]?.benefitPrice
          : item.benefitPrice,
      itemNumber: item.itemNumber,
      addLimit: item.addLimit,
    }

    if (properties?.length) {
      let textTags = []
      let badgeTags = []
      let isNew = false
      let spicy = false
      let isRecommend = false
      properties.forEach((data) => {
        if (data.name === 'SPECIAL_COMBO') {
          return
        }
        if (data.name === 'NEW') {
          isNew = true
          badgeTags.push(data)
        } else if (data.name === 'RECOMMENDED') {
          isRecommend = true
        } else if (data.name === 'SPICY') {
          spicy = true
        } else {
          if (data.hasOwnProperty('type')) {
            if (data.type === 1) {
              textTags.push(data)
            } else if (data.type === 2) {
              badgeTags.push(data)
            }
          } else {
            if (allowedTextTags.includes(data.name)) {
              textTags.push(data)
            }
          }
        }
      })
      saleItem.textTags = textTags
      saleItem.badgeTags = badgeTags
      saleItem.isNew = isNew
      saleItem.spicy = spicy
      saleItem.isRecommend = isRecommend
      saleItem.properties = properties
    }

    if (
      item.strikethroughPrice !== undefined &&
      item.strikethroughPrice !== null
    ) {
      saleItem.strikethroughPrice = item.strikethroughPrice //划线价
      saleItem.strikethDiscount = formatStrikethDiscount(
        item.strikethroughPrice,
        saleItem.price
      ) //划线价和售价计算折扣
    }

    if (item.comboSections) {
      saleItem.optionList = [
        ...saleItem.optionList,
        ...(item?.comboSections?.map((e) =>
          omitBy(
            {
              sort: e?.sectionSequence,
              type: 'combo',
              id: e.id,
              label: e.name,
              required: e?.minNumOfSelectionAllowed > 0,
              min: e?.minNumOfSelectionAllowed,
              max:
                e?.priceRule === 'FIXED_UNTIL_MAX'
                  ? undefined
                  : e?.maxNumOfSelectionAllowed,
              repeatable: e?.allowRepeatedItems,
              priceRule: e?.priceRule,
              freeQuantity:
                e?.priceRule === 'FIXED_PRICE'
                  ? Number.MAX_SAFE_INTEGER
                  : e?.priceRule === 'FIXED_UNTIL_MAX'
                    ? (e?.maxNumOfSelectionAllowed ?? 0)
                    : e?.freeQuantity,
              mergeDisplay: e?.mergeDisplay,
              options: e?.comboSectionSaleItems
                ?.map((i) => {
                  const e = saleItems?.find((s) => s.id === i.saleItemId)
                  return e ? transformItem({ ...e, ...i }, saleItems) : null
                })
                ?.filter(Boolean),
            },
            isNil
          )
        ) || []),
      ].sort((a, b) => a.sort - b.sort)
    }
    if (item.options) {
      saleItem.optionList = [
        ...saleItem.optionList,
        ...(item.options?.map((e) =>
          omitBy(
            {
              type: 'option',
              id: e.id,
              label: e.name,
              price: e.price,
              strikethroughPrice: e.strikethroughPrice,
              required: e?.min > 0,
              benefitPrice: e?.benefitPrice,
              min: e?.min,
              max:
                e?.max ??
                (e?.numOfItemOptionAllowed > 0
                  ? e?.numOfItemOptionAllowed
                  : undefined),
              freeQuantity: e?.freeQuantity,
              options: e?.subOptions?.map((s) => ({
                id: s.id,
                strikethroughPrice: s.strikethroughPrice,
                name: s.name,
                price: s.addPrice ?? s.price,
                pic: s.thumbPath || '',
                count: 1,
                benefitPrice: s?.benefitPrice,
                defaultSelected: s?.defaultSelected,
                defaultQuantity: s?.defaultQuantity,
                addLimit: s?.addLimit,
              })),
            },
            isNil
          )
        ) || []),
      ]
    }
    return omitBy(saleItem, isNil)
  }
}

export function addI18nResources(menuGroups) {
  const i18n = getI18n()
  const saleItems = []
  const addResourceIfChanged = (language, namespace, key, value) => {
    if (value == null) return
    const resourceKey = String(key)
    const nextValue = value
    const currentValue = i18n.getResource(language, namespace, resourceKey)
    if (currentValue === nextValue) return
    i18n.addResources(language, namespace, {
      [resourceKey]: nextValue,
    })
  }
  const addTranslation = (item, ns) => {
    item.fieldDisplayNameGroups
      ?.find((i) => i.fieldName === 'name')
      ?.fieldDisplayNames.forEach((e) => {
        addResourceIfChanged(
          transformLanguageCode(e.languageCode),
          ns,
          item.id,
          htmlDecode(e.name || item.name)
        )
      })
  }
  const addDishDescTranslation = (item) => {
    const { chineseDescription = '', description = '' } = item
    addResourceIfChanged('en', 'description', item.id, description)
    addResourceIfChanged(
      'zh',
      'description',
      item.id,
      chineseDescription || description
    )
  }
  menuGroups.forEach((g) => {
    addTranslation(g, 'group')
    g.menuCategories?.forEach((c) => {
      addTranslation(c, 'category')
      c.saleItems?.forEach((s) => {
        addTranslation(s, 'dish')
        addDishDescTranslation(s)
        saleItems.push(s)
        s.options?.forEach((o) => {
          addTranslation(o, 'option')
          o.subOptions?.forEach((so) => {
            addTranslation(so, 'option')
          })
        })
        s.comboSections?.forEach((o) => {
          addTranslation(o, 'comboSection')
        })
      })
    })
  })
  return saleItems
}

const collectSaleItems = (menuGroups = []) => {
  const saleItems = []
  menuGroups.forEach((g) => {
    g.menuCategories?.forEach((c) => {
      c.saleItems?.forEach((s) => {
        saleItems.push(s)
      })
    })
  })
  return saleItems
}

const countDayOfWeek = (singleHourInfo) => {
  const { fromDayOfWeek, toDayOfWeek } = singleHourInfo
  const fromDay = Math.min(daysOfWeek[fromDayOfWeek], daysOfWeek[toDayOfWeek])
  const endDay = Math.max(daysOfWeek[fromDayOfWeek], daysOfWeek[toDayOfWeek])
  return new Array(endDay - fromDay + 1)
    .fill(1)
    .map((_, index) => fromDay + index)
}

const isInTimePeriod = ({ menuHours, todayNum, systemTime }) => {
  const currentTime = dayjs(systemTime)
  const currentDate = currentTime.format('YYYY/MM/DD')

  const openDay = menuHours?.find((each) => {
    if (!each.daysInWeek.includes(todayNum)) {
      return false
    }

    let startTime = dayjs(`${currentDate} ${each.from}`)
    let endTime = dayjs(`${currentDate} ${each.to}`)

    if (endTime.isBefore(startTime, 'minute')) {
      if (currentTime.isBefore(startTime, 'minute')) {
        startTime = startTime.subtract(1, 'day')
      } else {
        endTime = endTime.add(1, 'day')
      }
    }
    return currentTime.isBetween(startTime, endTime, 'minute', '[]')
  })
  return !!openDay
}

export function filterMenuByHour({ menus, hours, systemTime }) {
  const hourWithDay = hours.map((each) => {
    return {
      ...each,
      daysInWeek:
        !each.fromDayOfWeek || !each.toDayOfWeek
          ? [0, 1, 2, 3, 4, 5, 6]
          : countDayOfWeek(each),
    }
  })
  const menuGroups = menus?.[0]?.menuGroups || []
  return menuGroups.filter((each) => {
    if (each.name === META_ITEM_GROUP) {
      return true
    }
    const menuHours = hourWithDay?.filter((hourInfo) =>
      each?.restaurantHourIds?.includes(hourInfo?.id)
    )
    // 周日 -> 6 周一 -> 0
    const resolveDayNum = dayjs(systemTime).day() - 1
    const todayNum = resolveDayNum < 0 ? 6 : resolveDayNum
    return isInTimePeriod({ menuHours, todayNum, systemTime })
  })
}

export function transformMenus(menus, options = {}) {
  const { injectI18n = true } = options
  const menuGroups = menus?.[0]?.menuGroups
  // 给菜加类 option
  const menuGroupsWithOptions = setOptions(menuGroups)
  // 增加多语言
  const saleItems = injectI18n
    ? addI18nResources(menuGroupsWithOptions)
    : collectSaleItems(menuGroupsWithOptions)
  const data = menuGroupsWithOptions?.map((g) => ({
    id: g.id,
    hidden: false,
    expand: true,
    name: htmlDecode(g.name),
    restaurantHourIds: g.restaurantHourIds,
    list:
      g?.menuCategories?.map((c) => ({
        id: c.id,
        hidden: c.hiddenCategory,
        name: htmlDecode(c.name),
        icon: c.thumbPath,
        // taxIds: c.taxIds,
        list:
          c.saleItems?.map((i) =>
            transformItem(
              {
                ...i,
                taxIds: i.taxIds ?? c.taxIds,
                taxFreeMinQty:
                  i.qtyQualifyingForZeroRated ?? c.qtyQualifyingForZeroRated,
              },
              saleItems
            )
          ) ?? [],
      })) ?? [],
  }))
  // console.log(`🚀 ~ transformMenus ~ data`, data)
  return afterResolveOption(data)
}
