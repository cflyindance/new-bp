import { resolvePromotionDisplayName } from '@/utils/PromotionCenterIntegration/resolvePromotionDisplayName';

export const createPromotionPresentation = ({
  promotion,
  ruleText,
  source,
  language,
  origin = 'local',
  ...rest
}) => ({
  ...rest,
  promotion,
  ruleText,
  displayName: resolvePromotionDisplayName({
    source,
    language,
    origin,
    promotion,
    ruleText,
  }),
});
