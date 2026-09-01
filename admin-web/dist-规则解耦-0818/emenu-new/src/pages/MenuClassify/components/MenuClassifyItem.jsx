import styles from './MenuClassifyItem.module.less'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import { useTranslation } from 'react-i18next'
import { Radio, Select } from 'antd'
import { useMemo } from 'react'

const { Group } = Radio

const MenuClassifyItem = (props) => {
  const { t } = useTranslation()
  const { item, noBuffetTreeData, updateData, otherMenuClassify } = props

  const options = useMemo(
    () =>
      otherMenuClassify.map((g) => ({
        label: g.name,
        value: g.id,
      })),
    [otherMenuClassify]
  )

  const handleChangeDishType = (e) => {
    const newItem = {
      ...item,
      viewDishType: e.target.value,
    }
    updateData(newItem)
  }

  const handleChangeAllowedOrderDish = (newValue) => {
    const newItem = {
      ...item,
      allowedOrderDish: newValue,
    }
    updateData(newItem)
  }

  const handleChangeViewOnlyViaDish = (newValue) => {
    const newItem = {
      ...item,
      viewOnlyViaDish: newValue,
    }
    updateData(newItem)
  }

  const handleChangeViewOnlyViaMenu = (newValue) => {
    const newItem = {
      ...item,
      viewOnlyViaMenu: newValue,
    }
    updateData(newItem)
  }

  return (
    <div className={styles.itemWrapper}>
      <div className={styles.title}>{item.name}</div>
      <div className={styles.selectItem}>
        <div className={styles.subTitle}>{t('SystemSetting.orderDishes')}</div>
        <TreeSelectDish
          onChange={handleChangeAllowedOrderDish}
          treeData={noBuffetTreeData}
          value={item.allowedOrderDish || []}
        />
      </div>
      <div className={styles.selectItem}>
        <div className={styles.subTitle}>
          {t('SystemSetting.viewOnlyDishes')}
        </div>
        <div className={styles.typeRadio}>
          <Group onChange={handleChangeDishType} value={item.viewDishType ?? 0}>
            <Radio value={1}> {t('SystemSetting.configById')}</Radio>
            <Radio value={0}> {t('SystemSetting.configByCate')}</Radio>
          </Group>
        </div>
        {item.viewDishType === 1 ? (
          <TreeSelectDish
            onChange={handleChangeViewOnlyViaDish}
            treeData={noBuffetTreeData}
            value={item.viewOnlyViaDish || []}
          />
        ) : (
          <Select
            allowClear
            showArrow
            showSearch={false}
            value={item.viewOnlyViaMenu || []}
            mode="multiple"
            options={options}
            listHeight={300}
            dropdownStyle={{ padding: 0 }}
            getPopupContainer={(node) => node.parentNode}
            onChange={handleChangeViewOnlyViaMenu}
          />
        )}
      </div>
    </div>
  )
}

export default MenuClassifyItem
