import { useMemo } from 'react'
import useSystemConfig from '@/hooks/useSystemConfig'
import MenuClassifyItem from './MenuClassifyItem'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useMount } from 'ahooks'

const configId = 52

const MenuClassifySetting = () => {
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()
  const menuClassifySetting = getGlobalConfig(52)

  const allMenuClassify = useMemo(() => {
    return menuClassifySetting?.menuClassifySetting || []
  }, [menuClassifySetting])
  const { runGetMenus, treeData } = useSetMenus()

  useMount(() => {
    runGetMenus()
  })

  const noBuffetTreeData = useMemo(() => {
    return treeData.filter((each) => each.name !== 'ALL_YOU_CAN_EAT')
  }, [treeData])

  const updateData = (newItem) => {
    const newMenuClassify = allMenuClassify.map((each) => {
      return each.id === newItem.id ? newItem : each
    })
    const newVal = {
      ...menuClassifySetting,
      menuClassifySetting: newMenuClassify,
    }
    changeGlobalConfig(configId, newVal)
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {allMenuClassify?.map((item, idx) => {
        return (
          <MenuClassifyItem
            key={idx}
            item={item}
            noBuffetTreeData={noBuffetTreeData}
            updateData={updateData}
            otherMenuClassify={allMenuClassify.filter(
              (each) => each.id !== item.id
            )}
          />
        )
      })}
    </div>
  )
}

export default MenuClassifySetting
