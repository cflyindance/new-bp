import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/assets/i18n/i18n', () => ({
  default: {
    language: 'en',
    changeLanguage(language) {
      this.language = language;
      return Promise.resolve();
    },
  },
}));

import i18n from '@/assets/i18n/i18n';
import {
  getPromotionCenterActivityRuleText,
  getPromotionCenterTextFromTextObject,
} from './getPromotionCenterDisplayText';

const t = (key, params) => (params?.value ? `${key}:${params.value}` : key);
const activityRule = [
  { text: { i18nKey: 'first-rule', params: { value: 1 } } },
  { text: { i18nKey: 'second-rule', params: { value: 2 } } },
];

describe('getPromotionCenterActivityRuleText', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  test('keeps rule text for source 0', () => {
    expect(
      getPromotionCenterActivityRuleText({
        t,
        activityRule,
        type: 'orderItemGiftItem',
        promotionName: 'Cloud name',
        selfConfig: { configMap: { id_64: 0 } },
      })
    ).toBe('first-rule:1');
  });

  test.each([1, 2])('uses cloud promotion name for source %s', (source) => {
    expect(
      getPromotionCenterActivityRuleText({
        t,
        activityRule,
        type: 'orderItemGiftItem',
        promotionName: ' Cloud name ',
        selfConfig: { configMap: { id_64: source } },
      })
    ).toBe('Cloud name');
  });

  test('preserves tier arrays when falling back', () => {
    expect(
      getPromotionCenterActivityRuleText({
        t,
        activityRule,
        type: 'totalAmountQuantityDiscount',
        promotionName: '   ',
        selfConfig: { configMap: { id_64: 2 } },
      })
    ).toEqual(['first-rule:1', 'second-rule:2']);
  });
});

describe('getPromotionCenterTextFromTextObject', () => {
  test('always returns transactional rule text', () => {
    expect(
      getPromotionCenterTextFromTextObject({
        t,
        text: { i18nKey: 'next-tier', params: { value: 3 } },
        promotionName: 'Must not replace conditions',
        selfConfig: { configMap: { id_64: 2 } },
      })
    ).toBe('next-tier:3');
  });
});
