import styles from './SpecialMenu.module.less'
import { useSetMenus } from '@/hooks/useSetMenus'
import SettingItem from '@/components/ConfigCommon/SettingItem'
import { useMount } from 'ahooks'
import { useMemo } from 'react'
import useSystemConfig from '@/hooks/useSystemConfig'
import { Button, Card, Input } from 'antd'
import { Box } from '@material-ui/core'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import { filterMenuById } from '@/utils/filterMenu'
import { useTranslation } from 'react-i18next'
import message from '@/components/Message'
import { nanoid } from 'nanoid'

const SpecialMenu = () => {
  const { treeData, runGetMenus } = useSetMenus()
  const { changeGlobalConfig, configList, getFinalConfigById } =
    useSystemConfig()
  const { t } = useTranslation()

  useMount(() => {
    runGetMenus()
  })

  const globalConfig = useMemo(() => {
    return configList?.globalConfig
  }, [configList])

  const valueObj = getFinalConfigById(55)

  const specialMenuList = useMemo(() => {
    return valueObj?.specialMenu
  }, [valueObj])

  const handleConfigChange = (typeName, val, key) => {
    if (key === 'open' && val) {
      const isBrandOpen = getFinalConfigById(13)?.open
      if (!isBrandOpen) {
        message.warn(t('validate.openBrandModeFirst'))
        return
      }
    }
    const configInfo = globalConfig?.find((each) => each.key === typeName)
    const oldValue = configInfo?.value
    const configId = configInfo?.id
    const newValue = {
      ...oldValue,
      [key]: val,
    }
    changeGlobalConfig(configId, newValue)
  }

  const operateMenuItem = (newData) => {
    handleConfigChange('specialMenu', newData, 'specialMenu')
  }

  const addSpecialMenuItem = () => {
    const newSpecialMenuList = [
      ...specialMenuList,
      { name: '', id: nanoid(), dishes: [] },
    ]
    operateMenuItem(newSpecialMenuList)
  }

  const removeSpecialMenuItem = (id) => {
    const newSpecialMenuList = specialMenuList.filter((each) => each.id !== id)
    operateMenuItem(newSpecialMenuList)
  }

  const editSpecialMenuItem = (id, value, key) => {
    const newSpecialMenuList = specialMenuList.map((each) => {
      return each.id === id ? { ...each, [key]: value } : each
    })
    operateMenuItem(newSpecialMenuList)
  }

  return (
    <div className={styles.specialMenuWrapper}>
      <SettingItem
        typeName="specialMenu"
        valueObj={valueObj}
        handleConfigChange={handleConfigChange}
        hidden
      />
      {valueObj?.open ? (
        <Card
          title={t('SystemSetting.specialMenu_setting')}
          extra={
            <Button type="link" size="small" onClick={addSpecialMenuItem}>
              {t('SystemSetting.add')}
            </Button>
          }
        >
          {valueObj?.specialMenu?.map((each, idx) => {
            return (
              <Card
                key={each.id}
                type="inner"
                title={
                  <Box display="flex" alignItems="center">
                    <Input
                      onChange={(e) =>
                        editSpecialMenuItem(each.id, e.target.value, 'name')
                      }
                      value={each.name}
                      addonBefore={t('SystemSetting.specialMenu_name')}
                      size="small"
                      style={{
                        width: 220,
                        marginRight: 12,
                      }}
                    />
                  </Box>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => removeSpecialMenuItem(each.id)}
                  >
                    {t('SystemSetting.delete')}
                  </Button>
                }
                style={{
                  marginBottom: 24,
                }}
              >
                <TreeSelectDish
                  onChange={(value) =>
                    editSpecialMenuItem(each.id, value, 'dishes')
                  }
                  treeData={filterMenuById(
                    treeData,
                    valueObj?.specialMenu,
                    idx,
                    'dishes'
                  )}
                  value={each.dishes}
                />
              </Card>
            )
          })}
        </Card>
      ) : null}
    </div>
  )
}

export default SpecialMenu
