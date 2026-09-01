import { useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { useGlobalState } from './useGlobalState'
// import { useSetMenus } from './useSetMenus'
import { useTranslation } from 'react-i18next'
import { roundToPrecision } from '@/utils/number'
import { isEqual, pick, reduce, sortBy } from 'lodash-es'
import deepRemoveUndefined from '@/utils/deepRemoveUndefined'

export function useCheckCart(saleItems) {
  const { t } = useTranslation()
  // const { saleItems } = useSetMenus()
  const [cart, setCart] = useGlobalState('Cart')
  const [comboCart, setComboCart] = useGlobalState('ComboCart')
  const [privilegeItem] = useGlobalState('privilegeItem')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const [cartChangeInfo, setCartChangeInfo] = useState({
    open: false,
    data: [],
  })

  const checkChangedCart = () => {
    const changedItems = []
    // 需要检测变化的属性，已按优先级排序
    const includeKeys = [
      'hidden',
      'outOfStock',
      'itemPrices',
      'optionList',
      'price',
      'name',
    ]

    const checkCart = (cart) => {
      cart
        .filter(
          (each) =>
            each.id !== privilegeItem.id &&
            !each.isBuffetItem &&
            !each.isLotteryDish
        ) // 不检查 会员权益，品类模式主菜，抽奖奖励菜
        .forEach((e) => {
          const oldItem = pick(e, includeKeys)
          const newItem = pick(
            saleItems.current?.find((s) => s.id === e.id),
            includeKeys
          )
          console.log(`🚀 ~ cart.forEach ~ old`, oldItem)
          console.log(`🚀 ~ cart.forEach ~ new`, newItem)
          const changedKeys = reduce(
            oldItem,
            (result, value, key) =>
              isEqual(
                deepRemoveUndefined(value),
                deepRemoveUndefined(newItem[key])
              ) ||
              (key === 'hidden' && newItem.hiddenByPot)
                ? result
                : result.concat(key),
            []
          )
          if (changedKeys?.length) {
            changedItems.push({
              key: e.key,
              id: e.id,
              name: t(e.id, { defaultValue: e.name, ns: 'dish' }),
              pic: e.pic,
              changedKeys: sortBy(changedKeys, (v) => includeKeys.indexOf(v)),
            })
          }
        })
    }
    checkCart(comboCart)
    checkCart(cart)
    if (changedItems.length > 0) {
      console.log(`🚀 ~ cart changedItems`, changedItems)
      setCartChangeInfo({
        open: true,
        data: changedItems,
      })
    }
  }

  const closeCartChangeToast = (data) => {
    setCartChangeInfo({
      ...cartChangeInfo,
      open: false,
    })
    const handleCart = (cart) => {
      const _cart = [...cart]
      data.forEach((e) => {
        console.log(`🚀 ~ data.forEach ~ e`, e)
        let idx = _cart?.findIndex((c) => c?.key === e?.key)
        const newItem = saleItems.current?.find((s) => s.id === e.id)
        if (idx > -1) {
          // 售罄/选项变化的直接从购物车删除
          if (
            e.changedKeys?.some((i) =>
              ['hidden', 'outOfStock', 'itemPrices', 'optionList'].includes(i)
            )
          ) {
            _cart.splice(idx, 1)
          } else {
            // 价格变化的替换价格，并计算新的realPrice
            if (e.changedKeys.includes('price')) {
              const orgPrice = _cart[idx].price
              const newPrice = newItem.price
              _cart[idx].price = newPrice
              const orgRealPrice = _cart[idx].realPrice
              if (orgRealPrice > 0) {
                const diff = newPrice - orgPrice
                _cart[idx].realPrice = roundToPrecision(orgRealPrice + diff)
              }
            }
            // 菜名变化的直接替换新菜名
            if (e.changedKeys.includes('name')) {
              _cart[idx].name = newItem.name
            }
          }
        }
      })
      return _cart
    }
    const newComboCart = handleCart(comboCart)
    const newCart = handleCart(cart)
    setComboCart(newComboCart)
    setCart(newCart)
    setStoragedCart(newCart)
  }

  return {
    cartChangeInfo,
    checkChangedCart,
    closeCartChangeToast,
  }
}
