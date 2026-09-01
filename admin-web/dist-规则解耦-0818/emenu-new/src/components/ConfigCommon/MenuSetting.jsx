import { useCallback, useEffect, useMemo } from 'react'
import { Select, Typography, Space, Switch, Input } from 'antd'
import message from '@/components/Message'
import { useTranslation } from 'react-i18next'
import { ExpandMoreRounded } from '@material-ui/icons'
import { Card } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import styles from './MenuSetting.module.less'
import { useSetMenus } from '@/hooks/useSetMenus'
import {
  DISPLAY_SETTING,
  homepageSetting,
  shopCartSetting,
} from '@/constants/systemConfig'
import DishListType from '@/components/ConfigCommon/DishListType'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import { META_ITEM_GROUP } from '@/constants'

const { Title } = Typography

// 设备和全局公用一个
const MenuSetting = (props) => {
  const {
    type,
    displayMenu,
    handleChangeMenu,
    handleSwitchChange,
    getItemConfig,
    handleChangeWholeValue,
  } = props
  const { t } = useTranslation()
  const { menuSource } = useSetMenus()

  // 初始menu group
  const original = useMemo(() => {
    return menuSource?.map((g) => g.id)
  }, [menuSource])

  useEffect(() => {
    if (!original?.length) return
    if (displayMenu?.length === 0) {
      handleChangeMenu(original)
    }
  }, [original, displayMenu])

  const { treeData } = useSetMenus()

  const menuItemList = useMemo(() => {
    return treeData.filter((group) => group.name !== 'ALL_YOU_CAN_EAT')
  }, [treeData])

  const menuItemListWithoutAttrs = useMemo(() => {
    const filterTreeData = (data) => {
      if (!Array.isArray(data)) return data

      return data
        .map((node) => {
          if (node.children) {
            const filteredChildren = filterTreeData(node.children)
            if (filteredChildren.length === 0) return null
            return {
              ...node,
              children: filteredChildren,
            }
          }
          // 只有最里层节点才检查 withoutAttr
          return node.withoutAttr === false ? null : node
        })
        .filter(Boolean)
    }
    return filterTreeData(menuItemList)
  }, [menuItemList])

  const options = useMemo(
    () => [
      {
        label: t('SettingMenuDisplay.all'),
        value: 'all',
      },
      ...(menuSource
        ?.filter(
          (group) =>
            group.name !== 'ALL_YOU_CAN_EAT' && group.name !== META_ITEM_GROUP
        )
        ?.map((g) => ({
          label: t(g.id, { ns: 'group' }),
          value: g.id,
        })) || []),
    ],
    [menuSource, t]
  )

  const onMenuChange = (val) => {
    const newMenus = val?.includes('all')
      ? menuSource
          .filter(
            (g) => g.name !== 'ALL_YOU_CAN_EAT' && g.name !== META_ITEM_GROUP
          )
          .map((g) => g.id)
      : val
    if (newMenus?.length === 0) {
      return message.warn(t('validate.show_group'))
    }
    handleChangeMenu(newMenus)
  }

  const handelValidateSwitch = (id, v, k) => {
    if (id === 13 && !v) {
      const isSpecialMenuOpen = getItemConfig(55)?.open
      if (isSpecialMenuOpen)
        return message.warn(t('validate.close_special_menu'))
    }
    if (id === 25 && !v) {
      const isShowGroupName = getItemConfig(24)?.open
      const isLazyLoading = getItemConfig(23)?.open
      if (!isLazyLoading) return message.warn(t('validate.open_lazy_loading'))
      if (!isShowGroupName) return message.warn(t('validate.only_close_one'))
    }
    if (id === 24 && !v) {
      const isShowCategoryName = getItemConfig(25)?.open
      if (!isShowCategoryName) return message.warn(t('validate.only_close_one'))
    }
    if (id === 23 && !v) {
      handleSwitchChange(25, true)
    }
    handleSwitchChange(id, v, k)
  }

  const getCardHead = useCallback(
    (id, key) => {
      const config = getItemConfig(id)
      if (id === homepageSetting.id) {
        return (
          <>
            <CardHead
              title={t(`displaySetting.homepageSetting_showStartButton`)}
              action={
                <Switch
                  checked={!config?.hideStartButton}
                  onChange={(v) =>
                    handelValidateSwitch(id, !v, 'hideStartButton')
                  }
                />
              }
            />
            <CardHead
              title={t(`displaySetting.homepageSetting_showPoweredBy`)}
              action={
                <Switch
                  checked={!config?.hidePoweredBy}
                  onChange={(v) =>
                    handelValidateSwitch(id, !v, 'hidePoweredBy')
                  }
                />
              }
            />
          </>
        )
      }
      if (id === shopCartSetting.id) {
        return (
          <CardHead
            title={t(`displaySetting.shopCartSetting_showPremiumMemberLogin`)}
            action={
              <Switch
                checked={config?.showPremiumMemberLogin}
                onChange={(v) =>
                  handelValidateSwitch(id, v, 'showPremiumMemberLogin')
                }
              />
            }
          />
        )
      }
      return (
        <CardHead
          title={t(`displaySetting.${key}_subtitle`)}
          action={
            <Switch
              checked={config?.open}
              onChange={(v) => handelValidateSwitch(id, v)}
            />
          }
        />
      )
    },
    [t, getItemConfig, handelValidateSwitch]
  )

  return (
    <div className={styles.menuSettingWrapper}>
      <Space direction="vertical" size={32}>
        {DISPLAY_SETTING.map((setting) => {
          const { id, key, isInDevice } = setting
          if (!isInDevice && type === 'device') return null
          if (key === 'displayMenu') {
            return (
              <div key={key}>
                <Title level={3}>{t(`displaySetting.${key}_title`)}</Title>
                <Select
                  mode="multiple"
                  size="large"
                  // defaultOpen
                  showArrow
                  showSearch={false}
                  listHeight={300}
                  suffixIcon={<ExpandMoreRounded />}
                  placeholder={t(`displaySetting.${key}_subtitle`)}
                  options={options}
                  style={{ width: '100%' }}
                  onChange={onMenuChange}
                  value={displayMenu}
                />
              </div>
            )
          }
          if (key === 'dishDisplay') {
            return (
              <DishListType
                key={key}
                value={getItemConfig(id)}
                handleChangeWholeValue={handleChangeWholeValue}
                menuItemList={menuItemList}
              />
            )
          }
          const checkedVal = getItemConfig(id)?.open
          return (
            <div key={key}>
              <Title level={3}> {t(`displaySetting.${key}_title`)}</Title>
              <div className={styles.menuDisplay}>
                <Card elevation={0}>
                  {getCardHead(id, key)}
                  {key === 'categoryMode' &&
                    checkedVal &&
                    getItemConfig(52)?.open && (
                      <div className={styles.subSetting}>
                        <Input
                          onChange={(e) =>
                            handleChangeWholeValue(id, {
                              ...getItemConfig(id),
                              categoryModeName: e.target.value,
                            })
                          }
                          style={{ width: 300 }}
                          defaultValue="自助餐"
                          value={getItemConfig(id)?.categoryModeName}
                          addonBefore={
                            <span>{t('displaySetting.menuClassifyAlias')}</span>
                          }
                        />
                      </div>
                    )}
                  {key === 'showDishDetail' && checkedVal && (
                    <div className={styles.subSetting}>
                      <div style={{ paddingBottom: 8 }}>
                        {t('displaySetting.selectShowDishDetailWithoutAttrs')}
                      </div>
                      <TreeSelectDish
                        onChange={(newValue) => {
                          handleChangeWholeValue(27, {
                            showDishDetail: newValue,
                          })
                        }}
                        value={getItemConfig(id)?.showDishDetail}
                        treeData={menuItemListWithoutAttrs}
                      />
                    </div>
                  )}
                  {key === 'displayDishNote' && checkedVal && (
                    <div className={styles.subSetting}>
                      <div style={{ paddingBottom: 8 }}>
                        {t('displaySetting.selectDisplayNoteItem')}
                      </div>
                      <TreeSelectDish
                        onChange={(newValue) => {
                          handleChangeWholeValue(28, {
                            displayDishNote: newValue,
                          })
                        }}
                        value={getItemConfig(id)?.displayDishNote}
                        treeData={menuItemList}
                      />
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )
        })}
      </Space>
    </div>
  )
}

export default MenuSetting
