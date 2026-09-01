import { Dialog } from '@material-ui/core'
import styles from './SuccessDialog.module.less'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import OptionList from '../DishDialog/OptionList'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { nanoid } from 'nanoid'
import { isEqual } from 'lodash-es'

const SuccessDialog = (props) => {
  const { open, onClose, rewardDishList } = props
  const { t } = useTranslation()

  const optionItem = useMemo(() => {
    return {
      options: rewardDishList.map((item) => {
        return {
          ...item,
          itemPrices: [],
          optionList: [],
        }
      }),
      type: 'combo',
      max: 1,
    }
  }, [rewardDishList])

  const [cart, setCart] = useGlobalState('Cart')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])

  const handleChangeCart = (originalData) => {
    const data = {
      ...originalData,
      discount: originalData.price ?? 0,
      discountID: null,
      discountName: 'Discount(100%)',
      discountRate: 100,
      discountRateType: 2,
      discountReason: 'Lottery Discount',
      options: [],
      optionList: [],
      itemPrices: [],
      comboList: [],
      realBenefitPrice: 0,
      realPrice: 0,
      isLotteryDish: true,
    }
    const newCart = [...cart]
    let idx = newCart?.findIndex((e) => {
      // * 查找购物车中id, priceItem, options, instructions都一样的项
      return (
        e.id === data.id &&
        isEqual(e.priceItem, data.priceItem) &&
        isEqual(e.options, data.options) &&
        e.instructions === data.instructions
      )
    })
    let dishKey = undefined
    if (idx > -1) {
      const { count, ...rest } = newCart[idx]
      dishKey = newCart[idx].key
      const newCount = count + data.count
      newCart[idx] = {
        ...rest,
        count: newCount,
        itemMax: newCount,
      }
    } else {
      dishKey = nanoid()
      newCart.push({
        key: dishKey,
        ...data,
        itemMax: 1,
      })
    }
    setCart(newCart)
    setStoragedCart(newCart)
  }

  return (
    <Dialog open={open}>
      <div className={styles.successDialog}>
        <div className={styles.title}>{t('lottery.successDialog.title')}</div>
        <div className={styles.subTitle}>
          {t('lottery.successDialog.subTitle')}
        </div>
        <div className={styles.dishList}>
          <OptionList
            optionItem={optionItem}
            changeOptions={(_, selected) => {
              selected.forEach((item) => {
                handleChangeCart(item)
              })
              onClose()
            }}
          />
        </div>
      </div>
    </Dialog>
  )
}

export default SuccessDialog
