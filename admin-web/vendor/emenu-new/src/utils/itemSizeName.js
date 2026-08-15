import { transformLanguageCode } from '@/locales/resources'

export function getCommonItemNameByLanguage(nameDict, currentLanguage) {
  if (nameDict != undefined) {
    for (let nameGroup of nameDict) {
      if (nameGroup.fieldName === 'name') {
        for (let displayName of nameGroup.fieldDisplayNames || []) {
          if (
            transformLanguageCode(
              displayName.languageCode
            )?.toLocaleLowerCase() ===
            String(currentLanguage || 'en').toLocaleLowerCase()
          ) {
            return displayName.name
          }
        }
      }
    }
  }
  return ''
}

export function getItemSizeNameByLanguage(
  sizeId,
  itemSizeLanguageList,
  currentLanguage
) {
  for (let itemSize of itemSizeLanguageList || []) {
    if (String(itemSize.id) === String(sizeId)) {
      return (
        getCommonItemNameByLanguage(
          itemSize.fieldDisplayNameGroups,
          currentLanguage
        ) || itemSize.name
      )
    }
  }
  return ''
}
