import { SELF_CONFIG } from '../constants/actionTypes'
import { selfConfigList } from '../constants/selfConfig'
import { compare } from '../utils'

const initState = {
  selfConfig: {},
}

export default function selfConfigMap(state = initState.selfConfig, action) {
  switch (action.type) {
    case SELF_CONFIG:
      return configMap(action.data)
    default:
      return state
  }
}

function configMap(list) {
  if (list?.configList?.length) {
    const originalLength = list.configList.length
    let configList = list.configList.filter((item) => item?.id)
    // 本地js和数据库对比
    let defectList = []
    selfConfigList.configList.forEach((item) => {
      let incld = configList.find((c) => c.id == item.id)
      if (!incld) {
        defectList.push(item)
      }
    })
    const hasInvalidConfigItems = originalLength !== configList.length
    // 配置项id缺失或存在无效项
    if (defectList.length || hasInvalidConfigItems) {
      configList = configList.concat(defectList)
      configList.sort(compare('id'))
      list.configList = configList
    }
  } else {
    list.configList = selfConfigList.configList
  }

  const obj = {}
  if (list?.configList?.length) {
    list.configList.forEach((item) => {
      obj['id_' + item.id] = item.value
    })
  }
  list.configMap = obj

  return list
}
