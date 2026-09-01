import { useMemo, useState } from 'react'
import SettingItem from './SettingItem'
import styles from './OrderSetting.module.less'
import { radioOptions } from '@/constants/limitConfig'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useMount } from 'ahooks'
import { searchRewardRule } from '@/services/crm'
import getRewardItemByRules from '@/utils/getRewardItemByRules'
import { defaultVisContent } from '@/constants/limitConfig'

import { useGlobalState } from '@/hooks/useGlobalState'

const OrderSetting = (props) => {
  const { limitConfig, handleSetConfig, orderSList } = props
  const {
    treeData: allMenuTree,
    treeDataWithComboSection,
    runGetMenus,
  } = useSetMenus()

  const treeData = useMemo(() => {
    return allMenuTree.filter((each) => each.name !== 'ALL_YOU_CAN_EAT')
  }, [allMenuTree])

  const [crmRewardRules, setCrmRewardRules] = useState([])
  const [specialComboDishs, setSpecialComboDishs] = useState([])
  const [menuSource] = useGlobalState('Menu_Source', [])
  useMount(() => {
    runGetMenus()
    const specialComboDishs = checkForSpecialComboDishs(menuSource)
    setSpecialComboDishs(specialComboDishs)
    getRewardRule()
  })

  const checkForSpecialComboDishs = (data) => {
    // 用于存储去重后的 comboList 项
    let result = []
    // 递归遍历 list 里的每一项
    for (const item of data) {
      // 如果当前项有嵌套的 list
      if (Array.isArray(item.list) && item.list.length > 0) {
        // 递归检查内部的 list
        for (const fItem of item.list) {
          for (const subItem of fItem.list) {
            if (subItem.isSpecialCombo) {
              if (
                Array.isArray(subItem?.comboList) &&
                subItem?.comboList?.length > 0
              ) {
                // 遍历 comboList，去重并返回 { label, value } 格式
                for (const combo of subItem.comboList) {
                  if (result.indexOf(combo.id) === -1) {
                    result.push(combo.id)
                  }
                }
              }
            }
          }
        }
      }
    }
    // 将去重后的结果转换为数组
    let tempResult = filterTreeData(treeDataWithComboSection, result)
    return tempResult
  }

  // 过滤树结构数据，只保留火锅菜子菜的数据
  function filterTreeData(tree, validValues) {
    function filterNode(node) {
      // 检查当前节点的值是否在有效值列表中
      const isCurrentValid = validValues.includes(node.value)
      // 递归过滤子节点
      if (node.children) {
        node.children = node.children
          .map((child) => filterNode(child)) // 递归过滤子节点
          .filter(Boolean) // 过滤掉无效的子节点
      }
      // 如果当前节点有效或有有效的子节点，则保留该节点
      return isCurrentValid || (node.children && node.children.length > 0)
        ? {
            ...node,
            title: node.extraTitle
              ? `${node.title} (${node.extraTitle})`
              : node.title,
          }
        : null
    }
    // 对树的每个根节点进行过滤
    return tree.map((rootNode) => filterNode(rootNode)).filter(Boolean)
  }

  const getRewardRule = async () => {
    try {
      const res = await searchRewardRule()
      if (res?.length > 0) {
        setCrmRewardRules(res)
      }
    } catch (e) {
      console.warn(e?.message)
    }
  }

  const crmFreeItem = useMemo(() => {
    if (crmRewardRules.length > 0) {
      const freeItemRule = crmRewardRules.filter(
        (each) => each.redeemRule.strategy === 'byFreeItem'
      )
      const noHiddenItem = treeData
        .map((g) => g.children?.map((c) => c.children) ?? [])
        .flat(2)
        .map((each) => ({
          ...each,
          hidden: false,
          id: each.value,
          name: each.title,
        }))
      const items = getRewardItemByRules(freeItemRule, noHiddenItem)
        .map((rule) => rule.items)
        .flat()
        ?.map((item) => {
          return {
            ...item,
            // 积分兑换菜品，只能兑换主菜，无法兑换子菜
            optionList: [],
            comboList: [],
            itemPrices: [],
            price: 0,
            // 混合模式下展示小图
            large: false,
            showLarge: false,
            itemMax: 1,
            benefitPrice: undefined,
            realBenefitPrice: undefined,
            label: item.name,
            value: item.id,
          }
        })
      return items
    }
    return []
  }, [crmRewardRules, treeData])

  const getConfigValue = (typeName) => {
    return limitConfig?.find((each) => each.key === typeName)?.value
  }

  const handleConfigChange = (typeName, val, key) => {
    const configId = limitConfig?.find((each) => each.key === typeName)?.id
    const oldValue = limitConfig?.find((each) => each.id === configId)?.value
    const newValue = {
      ...oldValue,
      [key]: val,
    }
    handleSetConfig(configId, newValue)
  }

  return (
    <div className={styles.orderSettingWrapper}>
      {orderSList.map((typeName, idx) => {
        return (
          <SettingItem
            typeName={typeName}
            key={idx}
            valueObj={getConfigValue(typeName)}
            handleConfigChange={handleConfigChange}
            hidden={
              defaultVisContent.includes(typeName)
                ? false
                : !getConfigValue(typeName)?.open
            }
            radioOptions={radioOptions[typeName]}
            treeData={treeData}
            specialComboDishs={specialComboDishs}
            crmFreeItem={crmFreeItem}
          />
        )
      })}
    </div>
  )
}

export default OrderSetting
