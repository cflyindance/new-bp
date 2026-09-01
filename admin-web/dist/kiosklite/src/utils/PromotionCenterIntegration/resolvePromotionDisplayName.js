const VALID_DISPLAY_SOURCES = new Set([0, 1, 2]);

export const normalizePromotionDisplaySource = (source) => {
  const normalized = Number(source);
  return VALID_DISPLAY_SOURCES.has(normalized) ? normalized : 0;
};

export const isChinesePromotionLanguage = (language) => {
  if (typeof language !== 'string') return false;
  const normalized = language.toLowerCase().replace(/_/g, '-');
  return normalized === 'zh' || normalized.startsWith('zh-');
};

const normalizeCandidate = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export const resolvePromotionDisplayName = ({
  source,
  language,
  origin,
  promotion,
  ruleText,
}) => {
  const normalizedSource = normalizePromotionDisplaySource(source);
  if (normalizedSource === 0) return ruleText;

  let candidate = '';
  if (origin === 'local') {
    const languageKey = isChinesePromotionLanguage(language) ? 'zh' : 'en';
    const field =
      normalizedSource === 1
        ? promotion?.activityTitle
        : promotion?.activityTag;
    candidate = normalizeCandidate(field?.[languageKey]);
  } else if (origin === 'cloud') {
    candidate = normalizeCandidate(promotion?.promotionName);
  }

  return candidate || ruleText;
};
