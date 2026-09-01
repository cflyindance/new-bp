import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'
import { t } from 'i18next'
import {
  getCommonItemNameByLanguage,
  getItemSizeNameByLanguage,
} from '@/utils/itemSizeName'
import {
  formatSeasoningSnapshotLabel,
  isSeasoningNoteOption,
} from '@/utils/seasoningGuest'

const useTranslateOptions = () => {
  const { i18n } = useTranslation()
  const [itemSizeLanguageList] = useGlobalState('itemSizeLanguageList')
  const [modifierActionList] = useGlobalState('modifierActionList')

  // 获取当前语言
  const currentLanguage = i18n.language //当前语种

  const getCommonItemName = (nameDict) => {
    return getCommonItemNameByLanguage(nameDict, currentLanguage)
  }

  const getItemSizeName = (sizeId) => {
    return getItemSizeNameByLanguage(
      sizeId,
      itemSizeLanguageList,
      currentLanguage
    )
  }

  const getModifierActionName = (modifierActionId) => {
    for (let modifierAction of modifierActionList) {
      if (modifierAction.id === modifierActionId) {
        return (
          getCommonItemName(modifierAction.fieldDisplayNameGroups) ||
          modifierAction.name
        )
      }
    }
  }

  const renderItemOption = (dish, ignoreSize = false, options = {}) => {
    const includeSeasoning = options.includeSeasoning !== false
    const sizeStr = ignoreSize
      ? undefined
      : getItemSizeName(dish.priceItem?.sizeId) ||
        dish.priceItem?.size ||
        dish.size
    let prevOption = null
    let optionsStrList = []
    dish.options?.forEach((s) =>
      s?.forEach((o) => {
        if (o.qtyVoid || isSeasoningNoteOption(o)) {
          return
        }
        let modifierActionStr = ''
        if (o.modifierActionId) {
          modifierActionStr = getModifierActionName(o.modifierActionId)
        }
        let optionStr = ''
        if (o.optionType === 'GLOBAL' && o.fieldDisplayNameGroups?.length > 0) {
          optionStr =
            getCommonItemName(o.fieldDisplayNameGroups) ||
            o.name ||
            o.displayText ||
            o.subOptionName
        } else {
          if (o.parent?.type === 'combo') {
            optionStr = t(o.id || '', { defaultValue: o.name, ns: 'dish' })
          } else {
            optionStr = t(o.id || '', {
              defaultValue:
                o.name || o.label || o.displayText || o.subOptionName,
              ns: 'option',
            })
          }
        }
        let str = [modifierActionStr, optionStr].filter(Boolean).join(' ')

        if (!(dish.key > 0)) {
          str = Array(o.count ?? 1)
            .fill(str)
            .join()
        }

        if (
          prevOption &&
          (prevOption.parent
            ? prevOption.parent.id === o.parent?.id
            : prevOption.optionType === o.optionType)
        ) {
          optionsStrList[optionsStrList.length - 1] =
            optionsStrList[optionsStrList.length - 1] + ',' + str
        } else {
          optionsStrList.push(str)
        }
        prevOption = o
      })
    )

    return [
      sizeStr,
      ...optionsStrList,
      dish.instructions,
      ...(includeSeasoning && Array.isArray(dish.seasoningSnapshots)
        ? dish.seasoningSnapshots.map((snap) =>
            formatSeasoningSnapshotLabel(snap)
          )
        : []),
    ].filter(Boolean)
  }

  return { getItemSizeName, renderItemOption }
}

export default useTranslateOptions
