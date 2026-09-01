import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kioskRoot = join(root, 'dist', 'kiosklite');
const read = (...parts) =>
  readFileSync(join(kioskRoot, ...parts), 'utf8');

const localeNames = [
  'En.json',
  'ZH-CN.json',
  'ZH-traditional.json',
  'Jan.json',
  'Korean.json',
  'French.json',
  'Spanish.json',
  'Russian.json',
  'Thai.json',
  'Vietnamese.json',
];
const requiredLocaleKeys = [
  'promotion-center-activity-name-2',
  'activityTitle',
  'activityTag',
  'promotionLanguageZh',
  'promotionLanguageEn',
  'activityTitleZhTip',
  'activityTitleEnTip',
  'activityTagZhTip',
  'activityTagEnTip',
];

for (const localeName of localeNames) {
  const locale = JSON.parse(
    read('src', 'assets', 'i18n', 'locale', localeName)
  );
  for (const key of requiredLocaleKeys) {
    assert.equal(
      typeof locale[key],
      'string',
      `${localeName} must define ${key}`
    );
    assert.ok(locale[key].trim(), `${localeName}.${key} must not be blank`);
  }
}

const serviceItem = read(
  'src',
  'container',
  'configApp',
  'serviceSetting',
  'serviceItem',
  'index.js'
);
assert.match(
  serviceItem,
  /'promotion-center-activity-name': 3/,
  'display source setting must render three options'
);

const addActivity = read(
  'src',
  'container',
  'configApp',
  'Promotion',
  'components',
  'AddActivity.js'
);
for (const fieldPath of [
  "['activityTitle', 'zh']",
  "['activityTitle', 'en']",
  "['activityTag', 'zh']",
  "['activityTag', 'en']",
]) {
  assert.ok(
    addActivity.includes(fieldPath),
    `AddActivity must render ${fieldPath}`
  );
}

const dealList = read('src', 'component', 'PromotionDealList', 'index.js');
assert.ok(
  dealList.includes('createPromotionPresentation'),
  'PromotionDealList must use the presentation model'
);
assert.ok(
  dealList.includes('displayName') && dealList.includes('ruleText'),
  'PromotionDealList must keep names separate from conditions'
);

const tags = read('src', 'component', 'PromotionTagsWrap', 'index.js');
assert.ok(
  tags.includes('resolvePromotionDisplayName'),
  'PromotionTagsWrap must resolve local promotion names'
);

const mutual = read('src', 'container', 'app', 'CrmPromotionMutual.js');
assert.ok(
  mutual.includes('resolvePromotionDisplayName'),
  'promotion conflict messages must resolve local promotion names'
);

const cloudDisplay = read(
  'src',
  'utils',
  'PromotionCenterIntegration',
  'getPromotionCenterDisplayText.js'
);
const transactionalFunction = cloudDisplay.slice(
  cloudDisplay.indexOf('export const getPromotionCenterTextFromTextObject')
);
assert.ok(
  !transactionalFunction.includes('resolvePromotionDisplayName'),
  'transactional text must not be replaced by an activity name'
);

console.log('Kiosk promotion title/label verification passed.');
