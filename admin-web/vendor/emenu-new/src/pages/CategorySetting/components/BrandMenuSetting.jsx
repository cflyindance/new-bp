import { useMemo, useState } from 'react'
import { Checkbox, Empty, Modal, message } from 'antd'
import { useTranslation } from 'react-i18next'
import useSystemConfig from '@/hooks/useSystemConfig'
import BrandMenuSettingItem from './BrandMenuSettingItem'
import styles from './BrandMenuSetting.module.less'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useMount } from 'ahooks'
import { copyBrandMenuSetting, getIsBrandMenuConfigured } from './brandMenuCopy'

const configId = 13

const BrandMenuSetting = () => {
  const { t } = useTranslation()
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()
  const { runGetMenus, treeData } = useSetMenus()
  const [copySourceName, setCopySourceName] = useState(null)
  const [copyTargetNames, setCopyTargetNames] = useState([])

  useMount(() => {
    runGetMenus()
  })

  const brandSetting = getGlobalConfig(13)

  const brandMeuSetting = useMemo(() => {
    return brandSetting?.brandMeuSetting || []
  }, [brandSetting])

  const handleTempSave = (idx, key, newValue) => {
    const currentValue = {
      ...brandSetting,
      brandMeuSetting: brandMeuSetting.map((each, i) => {
        return i !== idx
          ? each
          : {
              ...each,
              [key]: newValue,
            }
      }),
    }
    changeGlobalConfig(configId, currentValue)
  }

  const handleOpenCopy = (itemName) => {
    const source = brandMeuSetting.find((item) => item.itemName === itemName)
    if (!getIsBrandMenuConfigured(source)) {
      return message.warn(t('SystemSetting.configureCurrentCategory'))
    }

    setCopySourceName(itemName)
    setCopyTargetNames([])
  }

  const handleCloseCopy = () => {
    setCopySourceName(null)
    setCopyTargetNames([])
  }

  const handleCopyOverwrite = () => {
    const source = brandMeuSetting.find(
      (item) => item.itemName === copySourceName
    )
    if (!source || !getIsBrandMenuConfigured(source)) {
      message.warn(t('SystemSetting.configureCurrentCategory'))
      handleCloseCopy()
      return
    }
    if (!copyTargetNames.length) return

    const targetNameSet = new Set(copyTargetNames)
    if (!brandMeuSetting.some((item) => targetNameSet.has(item.itemName))) {
      handleCloseCopy()
      return
    }
    const validItemNames = brandMeuSetting.map((each) => each.itemName)
    const currentValue = {
      ...brandSetting,
      brandMeuSetting: brandMeuSetting.map((each) => {
        return targetNameSet.has(each.itemName)
          ? copyBrandMenuSetting(source, each, validItemNames)
          : each
      }),
    }

    changeGlobalConfig(configId, currentValue)
    message.success(t('SystemSetting.copyMenuSettingSuccess'))
    handleCloseCopy()
  }

  return (
    <>
      <div className={styles.brandMenuStettingWrapper}>
        {brandMeuSetting.map((item, idx) => {
          return (
            <BrandMenuSettingItem
              allSettingItem={brandMeuSetting}
              otherTypes={brandMeuSetting.filter(
                (each) => each.itemName !== item.itemName
              )}
              handleTempSave={handleTempSave}
              handleCopy={handleOpenCopy}
              isConfigured={getIsBrandMenuConfigured(item)}
              treeData={treeData}
              item={item}
              key={idx}
              i={idx}
            />
          )
        })}
      </div>
      <Modal
        title={t('SystemSetting.copyMenuSettingTitle', {
          name: copySourceName || '',
        })}
        open={copySourceName !== null}
        onCancel={handleCloseCopy}
        onOk={handleCopyOverwrite}
        okText={t('SystemSetting.copyAndOverwrite')}
        cancelText={t('AdminSetting.btn_cancel')}
        okButtonProps={{ disabled: !copyTargetNames.length }}
        destroyOnClose
        width={560}
      >
        <div className={styles.copyDescription}>
          {t('SystemSetting.copyMenuSettingDescription')}
        </div>
        <div className={styles.copyTargetTitle}>
          {t('SystemSetting.copyTargetCategory')}
        </div>
        {brandMeuSetting.length > 1 ? (
          <Checkbox.Group
            className={styles.copyTargetList}
            value={copyTargetNames}
            onChange={setCopyTargetNames}
          >
            {brandMeuSetting.map((item) => {
              if (item.itemName === copySourceName) return null

              return (
                <Checkbox
                  className={styles.copyTargetItem}
                  value={item.itemName}
                  key={item.itemName}
                >
                  <span className={styles.copyTargetName}>{item.itemName}</span>
                  <span className={styles.configurationStatus}>
                    {t(
                      getIsBrandMenuConfigured(item)
                        ? 'SystemSetting.configured'
                        : 'SystemSetting.unconfigured'
                    )}
                  </span>
                </Checkbox>
              )
            })}
          </Checkbox.Group>
        ) : (
          <Empty description={t('SystemSetting.noCopyTargetCategory')} />
        )}
      </Modal>
    </>
  )
}

export default BrandMenuSetting
