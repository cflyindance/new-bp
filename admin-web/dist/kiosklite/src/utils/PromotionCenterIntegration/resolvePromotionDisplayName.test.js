import { describe, expect, test } from 'vitest';

import {
  isChinesePromotionLanguage,
  normalizePromotionDisplaySource,
  resolvePromotionDisplayName,
} from './resolvePromotionDisplayName';

const localPromotion = {
  activityTitle: { zh: ' 中文标题 ', en: ' English Title ' },
  activityTag: { zh: ' 中文标签 ', en: ' English Tag ' },
};

describe('normalizePromotionDisplaySource', () => {
  test.each([
    [0, 0],
    ['0', 0],
    [1, 1],
    [' 1 ', 1],
    [2, 2],
    ['2', 2],
    [undefined, 0],
    [null, 0],
    ['', 0],
    [false, 0],
    [[], 0],
    ['invalid', 0],
    [3, 0],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizePromotionDisplaySource(input)).toBe(expected);
  });
});

describe('isChinesePromotionLanguage', () => {
  test.each(['zh', 'zh_cn', 'zh-CN', 'zh-TW', 'ZH-HK'])(
    'treats %s as Chinese',
    (language) => {
      expect(isChinesePromotionLanguage(language)).toBe(true);
    }
  );

  test.each(['en', 'fr', 'ja', 'ko', undefined])(
    'treats %s as non-Chinese',
    (language) => {
      expect(isChinesePromotionLanguage(language)).toBe(false);
    }
  );
});

describe('resolvePromotionDisplayName', () => {
  test('returns rule text for source 0', () => {
    expect(
      resolvePromotionDisplayName({
        source: 0,
        language: 'zh_cn',
        origin: 'local',
        promotion: localPromotion,
        ruleText: '规则文案',
      })
    ).toBe('规则文案');
  });

  test.each([
    [1, 'zh_cn', '中文标题'],
    [1, 'zh-TW', '中文标题'],
    [1, 'en', 'English Title'],
    [1, 'fr', 'English Title'],
    [2, 'zh_cn', '中文标签'],
    [2, 'en', 'English Tag'],
    [2, 'ja', 'English Tag'],
  ])(
    'selects local source %s for language %s',
    (source, language, expected) => {
      expect(
        resolvePromotionDisplayName({
          source,
          language,
          origin: 'local',
          promotion: localPromotion,
          ruleText: '规则文案',
        })
      ).toBe(expected);
    }
  );

  test.each([1, 2])('uses cloud promotionName for source %s', (source) => {
    expect(
      resolvePromotionDisplayName({
        source,
        language: 'zh_cn',
        origin: 'cloud',
        promotion: { promotionName: ' Cloud Promotion ' },
        ruleText: '规则文案',
      })
    ).toBe('Cloud Promotion');
  });

  test.each([
    [{}, 1],
    [{ activityTitle: null }, 1],
    [{ activityTitle: { zh: '   ' } }, 1],
    [{ activityTitle: { zh: 123 } }, 1],
    [{ activityTag: { en: null } }, 2],
  ])('falls back for malformed local data %#', (promotion, source) => {
    expect(
      resolvePromotionDisplayName({
        source,
        language: source === 2 ? 'en' : 'zh_cn',
        origin: 'local',
        promotion,
        ruleText: '规则文案',
      })
    ).toBe('规则文案');
  });

  test('falls back for a blank cloud promotionName', () => {
    expect(
      resolvePromotionDisplayName({
        source: 2,
        language: 'en',
        origin: 'cloud',
        promotion: { promotionName: '   ' },
        ruleText: 'Rule text',
      })
    ).toBe('Rule text');
  });

  test('preserves array rule text when falling back', () => {
    const ruleText = ['第一档', '第二档'];
    expect(
      resolvePromotionDisplayName({
        source: 1,
        language: 'zh_cn',
        origin: 'local',
        promotion: {},
        ruleText,
      })
    ).toBe(ruleText);
  });

  test('falls back for an invalid origin', () => {
    expect(
      resolvePromotionDisplayName({
        source: 1,
        language: 'zh_cn',
        origin: 'unknown',
        promotion: localPromotion,
        ruleText: '规则文案',
      })
    ).toBe('规则文案');
  });
});
