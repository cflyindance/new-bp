import { describe, expect, test } from 'vitest';

import { createPromotionPresentation } from './promotionPresentation';

describe('createPromotionPresentation', () => {
  test('keeps the promotion and separates name from rule text', () => {
    const promotion = {
      id: 'promo-1',
      activityTitle: { zh: '中文标题', en: 'English title' },
      activityTag: { zh: '中文标签', en: 'English tag' },
    };
    const presentation = createPromotionPresentation({
      promotion,
      ruleText: '买二赠一',
      source: 1,
      language: 'zh_cn',
      promotionType: 'orderItemGiftItem',
    });

    expect(presentation.promotion).toBe(promotion);
    expect(presentation.displayName).toBe('中文标题');
    expect(presentation.ruleText).toBe('买二赠一');
    expect(presentation.promotionType).toBe('orderItemGiftItem');
  });

  test('preserves tier arrays', () => {
    const ruleText = ['满 10 减 1', '满 20 减 3'];
    const presentation = createPromotionPresentation({
      promotion: {},
      ruleText,
      source: 2,
      language: 'en',
    });

    expect(presentation.displayName).toBe(ruleText);
    expect(presentation.ruleText).toBe(ruleText);
  });
});
