import i18n from '@/assets/i18n/i18n';

const getLanguageBtnDisplayText = (displayLangs, i18nKey, fallbackKey) => {
  if (!displayLangs?.length) {
    return i18n.t(fallbackKey);
  }

  return displayLangs
    .map((lang) => i18n.getFixedT(lang)(i18nKey))
    .join('/');
};

export default getLanguageBtnDisplayText;
