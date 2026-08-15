import { Dialog, Button, IconButton } from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import styles from './OperateSubDishModal.module.less'
import React, { useMemo, useState, useEffect } from 'react'
import ImgFallback from '@/components/common/ImgFallback'
import { serverUrl } from '@/utils/env_var'
import ManualCounter from '@/components/ManualCounter'
import { ArrowBackIosRounded } from '@material-ui/icons'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import { roundToPrecision } from '@/utils/number'
import useTranslateOptions from '@/hooks/useTranslateOptions'

const OperateSubDishModal = (props) => {
  const {
    open,
    onClose,
    subDishInfo,
    selectedSubDish,
    setNewSelected,
    freeQuantity,
  } = props
  const { t } = useTranslation(['translation', 'dish', 'option'])
  const [subDishList, setSubDishList] = useState([])
  const memoSubDishList = useMemo(() => {
    return selectedSubDish.filter((subDish) => subDish.id === subDishInfo.id)
  }, [subDishInfo, selectedSubDish])

  useEffect(() => {
    const newSubDishList = selectedSubDish.reduce((acc, subDish, index) => {
      if (subDish.id === subDishInfo.id) {
        acc.push({ ...subDish, _index: index })
      }
      return acc
    }, [])
    setSubDishList(newSubDishList)
  }, [subDishInfo, selectedSubDish, setSubDishList])

  const handleChangeSubDishNum = (item, num, i) => {
    const newSubDishList = subDishList.map((each, idx) => {
      return idx === i ? { ...item, count: num } : each
    })
    setSubDishList(newSubDishList)
  }

  const handleConfirmSubDish = () => {
    let newSelectedSubDish = [...selectedSubDish]
    subDishList.forEach((s) => {
      const { _index, ...newItem } = s
      newSelectedSubDish[_index] = newItem
    })
    newSelectedSubDish = newSelectedSubDish.filter((s) => s.count > 0)
    if (freeQuantity > 0) {
      let freeQuantityCount = freeQuantity
      newSelectedSubDish = newSelectedSubDish.map((item) => {
        const tmpFreeQuantityCount = freeQuantityCount - item.count
        const newItem = {
          ...item,
          count: item.count,
          freeQuantityCount:
            tmpFreeQuantityCount >= 0 ? item.count : freeQuantityCount,
        }
        freeQuantityCount = tmpFreeQuantityCount > 0 ? tmpFreeQuantityCount : 0
        return newItem
      })
    }
    setNewSelected(newSelectedSubDish)
    onClose()
  }

  const { renderItemOption } = useTranslateOptions()

  return (
    <Dialog open={open} onClose={onClose}>
      <div className={styles.subDishModal}>
        <IconButton className={styles.backIcon} onClick={onClose}>
          <ArrowBackIosRounded />
        </IconButton>
        <div className={styles.subDishName}>{t('subDish.title')}</div>
        <div className={styles.subDishList}>
          {subDishList.map((e, i) => {
            const realShowPrice = roundToPrecision(
              (e.freeQuantityCount > 0 && e.count <= e.freeQuantityCount
                ? 0
                : (e.realMainPrice ?? 0)) + (e.realSubPrice ?? 0)
            )?.toFixed(2)

            const realShowBenefitPrice = roundToPrecision(
              (e.freeQuantityCount > 0 && e.count <= e.freeQuantityCount
                ? 0
                : (e.realMainBenefitPrice ?? e.realMainPrice ?? 0)) +
                (e.realSubBenefitPrice ?? e.realSubPrice ?? 0)
            )?.toFixed(2)

            return (
              <div className={styles.subDishItem} key={i}>
                <div className={styles.basic}>
                  <ImgFallback
                    src={serverUrl + e.pic}
                    className={styles.pic}
                    itemName={e.name}
                  />
                  <div className={styles.info}>
                    <div className={styles.infoTitle}>
                      {t(e.id, { defaultValue: e.name, ns: 'dish' })}
                    </div>
                    <div className={styles.desc}>
                      {renderItemOption(e)?.join(', ')}
                    </div>
                    <div className={styles.price}>
                      <div className={styles.originPrice}>${realShowPrice}</div>
                      <div>
                        {realShowBenefitPrice !== realShowPrice && (
                          <VipPriceWithImg
                            benefitPrice={
                              realShowBenefitPrice
                                ? `$${realShowBenefitPrice}`
                                : null
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <ManualCounter
                  max={memoSubDishList[i]?.count}
                  value={e.count}
                  onClickAdd={() => handleChangeSubDishNum(e, e.count + 1, i)}
                  onClickReduce={() =>
                    handleChangeSubDishNum(e, e.count - 1, i)
                  }
                />
              </div>
            )
          })}
        </div>

        <Button
          fullWidth
          variant="contained"
          color="primary"
          className={styles.submit}
          onClick={handleConfirmSubDish}
        >
          {t('ChooseLicense.confirm')}
        </Button>
      </div>
    </Dialog>
  )
}

export default OperateSubDishModal
