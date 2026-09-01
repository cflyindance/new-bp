import { langCodeMap } from '@/constants/mockData';

export const getSingleItemLanguageName = (nameDict, lang = 'en') => {
  if (nameDict && nameDict.length) {
    for (let nameGroup of nameDict) {
      if (nameGroup.fieldName == 'name') {
        for (let displayName of nameGroup.fieldDisplayNames) {
          if (displayName.languageCode == langCodeMap[lang]) {
            return displayName.name;
          }
        }
      }
    }
  }
  return '';
};

/**
 * 根据菜单名称双语展示配置，拼接菜单接口中的多语言名称
 */
const getMenuDisplayName = (nameDict, currentLang, menuNameConfig) => {
  if (!menuNameConfig?.status) {
    return getSingleItemLanguageName(nameDict, currentLang);
  }

  const displayLangs = menuNameConfig.displayLangs || [];

  if (!displayLangs.length) {
    return getSingleItemLanguageName(nameDict, currentLang);
  }

  if (displayLangs.length === 1) {
    return getSingleItemLanguageName(nameDict, displayLangs[0]);
  }

  const primary =
    menuNameConfig.primaryLang && displayLangs.includes(menuNameConfig.primaryLang)
      ? menuNameConfig.primaryLang
      : displayLangs[0];
  const secondary = displayLangs.find((lang) => lang !== primary);

  const primaryName = getSingleItemLanguageName(nameDict, primary);
  const secondaryName = secondary
    ? getSingleItemLanguageName(nameDict, secondary)
    : '';

  if (primaryName && secondaryName) {
    return `${primaryName} / ${secondaryName}`;
  }

  return (
    primaryName ||
    secondaryName ||
    getSingleItemLanguageName(nameDict, currentLang)
  );
};

export default getMenuDisplayName;
