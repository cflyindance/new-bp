import { useMemo, useState } from 'react'
import { useMount } from 'ahooks'
import { Tabs } from 'antd'
import { useSetMenus } from '@/hooks/useSetMenus'
import RestrictDish from './RestrictDish'
import DelaySendDish from './DelaySendDish'
import LimitRestrict from './LimitRestrict'
import styles from './MenuConfig.module.less'
import { useTranslation } from 'react-i18next'

const MenuConfig = () => {
  const { t } = useTranslation()
  const [activeKey, setActiveKey] = useState('restrictDish')

  const { treeData: allMenuTree, runGetMenus } = useSetMenus()

  const treeData = useMemo(() => {
    return allMenuTree.filter((group) => group.name !== 'ALL_YOU_CAN_EAT')
  }, [allMenuTree])

  useMount(() => {
    runGetMenus()
  })

  const handleChangeTabs = (key) => {
    setActiveKey(key)
  }

  return (
    <div className={styles.menuConfigWrapper}>
      <header className={styles.menuConfigHeader}>
        <Tabs
          onChange={handleChangeTabs}
          activeKey={activeKey}
          items={[
            {
              label: t('SystemSetting.orderLimit'),
              key: 'restrictDish',
            },
            {
              label: t('SystemSetting.sendDelay'),
              key: 'delaySendDish',
            },
            {
              label: t('SystemSetting.quantityLimit'),
              key: 'limitRestrict',
            },
          ]}
        />
      </header>
      <main className={styles.menuConfigMain}>
        <div className={styles.menuConfigInner}>
          {activeKey === 'restrictDish' && <RestrictDish treeData={treeData} />}
          {activeKey === 'delaySendDish' && (
            <DelaySendDish treeData={treeData} />
          )}
          {activeKey === 'limitRestrict' && (
            <LimitRestrict treeData={treeData} />
          )}
        </div>
      </main>
    </div>
  )
}

export default MenuConfig
