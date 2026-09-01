import { Button, Select, Radio } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import styles from './BrandMenuSettingItem.module.less'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { filterMenuById } from '@/utils/filterMenu'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'

const { Group } = Radio

const BrandMenuSettingItem = (props) => {
  const { t } = useTranslation()
  const {
    item,
    treeData,
    otherTypes,
    handleTempSave,
    handleCopy,
    isConfigured,
    i,
    allSettingItem,
  } = props

  const allYouCanEat = useMemo(() => {
    return treeData
      .filter((each) => each.name === 'ALL_YOU_CAN_EAT')?.[0]
      ?.children?.flatMap((each) => each.children)
  }, [treeData])

  const noBuffetTreeData = useMemo(() => {
    return treeData.filter((each) => each.name !== 'ALL_YOU_CAN_EAT')
  }, [treeData])

  const options = useMemo(
    () =>
      otherTypes.map((g) => ({
        label: g.itemName,
        value: g.itemName,
      })),
    [otherTypes]
  )

  const handleChangeBuffet = (value) => {
    handleTempSave(i, 'buffetId', value)
  }

  const handleChangeOrderDishes = (newValue) => {
    handleTempSave(i, 'orderDishes', newValue)
  }

  const handleChangeOther = (newValue) => {
    handleTempSave(i, 'viewOnlyDishes', newValue)
  }

  const handleChangeDishType = (newValue) => {
    handleTempSave(i, 'dishType', newValue.target.value)
  }

  const handleChangeViewOnlyIds = (newValue) => {
    handleTempSave(i, 'viewOnlyIds', newValue)
  }

  return (
    <div className={styles.itemWrapper}>
      <div className={styles.titleWrapper}>
        <div className={styles.title}>{item.itemName}</div>
        <Button
          type="link"
          icon={<CopyOutlined />}
          className={`${styles.copyButton} ${
            !isConfigured ? styles.copyButtonDisabled : ''
          }`}
          onClick={() => handleCopy(item.itemName)}
        >
          {t('SystemSetting.copy')}
        </Button>
      </div>
      <TreeSelectDish
        onChange={handleChangeBuffet}
        treeData={filterMenuById(allYouCanEat, allSettingItem, i, 'buffetId')}
        value={item.buffetId}
        isMultiple={false}
      />
      <div className={styles.selectItem}>
        <div className={styles.subTitle}>{t('SystemSetting.orderDishes')}</div>
        <TreeSelectDish
          onChange={handleChangeOrderDishes}
          treeData={noBuffetTreeData}
          value={item.orderDishes}
        />
      </div>
      <div className={styles.selectItem}>
        <div className={styles.subTitle}>
          {t('SystemSetting.viewOnlyDishes')}
        </div>
        <div className={styles.typeRadio}>
          <Group onChange={handleChangeDishType} value={item.dishType ?? 0}>
            <Radio value={1}> {t('SystemSetting.configById')}</Radio>
            <Radio value={0}> {t('SystemSetting.configByCate')}</Radio>
          </Group>
        </div>
        {item.dishType === 1 ? (
          <TreeSelectDish
            onChange={handleChangeViewOnlyIds}
            treeData={noBuffetTreeData}
            value={item.viewOnlyIds || []}
          />
        ) : (
          <Select
            allowClear
            showArrow
            showSearch={false}
            value={item.viewOnlyDishes}
            mode="multiple"
            options={options}
            listHeight={300}
            dropdownStyle={{ padding: 0 }}
            getPopupContainer={(node) => node.parentNode}
            onChange={handleChangeOther}
          />
        )}
      </div>
    </div>
  )
}

export default BrandMenuSettingItem
