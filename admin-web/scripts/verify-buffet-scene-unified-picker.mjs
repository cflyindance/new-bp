import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const window = { __BUFFET_SCENE_PICKER_TEST__: {} };
vm.runInNewContext(
  fs.readFileSync('dist/Configuration center/assets/brand-menu-structure-picker.js', 'utf8'),
  { window, Object, JSON, Array, String, Number, Math },
);

const source = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');
const start = source.indexOf('  function scenePickerInitialState(');
const end = source.indexOf('  function handleSceneProductAction(', start);
assert.ok(start > 0 && end > start, '场景选择器辅助函数可提取');
vm.runInNewContext(source.slice(start, end), {
  window,
  MenuPicker: window.BrandMenuStructurePicker,
  stores: [],
  activeStoreId: () => 'store-a',
  cloneValue: value => JSON.parse(JSON.stringify(value)),
  esc: value => String(value),
  icon: () => '',
  Object, JSON, Array, String, Number, Math,
});

const api = window.__BUFFET_SCENE_PICKER_TEST__.api;
const dishDraft = { targetType: 'dish' };
const dishState = api.scenePickerInitialState(dishDraft, [
  { productLineId: 'kiosk', dishId: 'd:g-hotpot:c-hotpot-base:d-pot-single' },
]);
assert.equal(dishState.leafLevel, 'dish');
assert.deepEqual(Array.from(dishState.initialKeys), ['d:g-hotpot:c-hotpot-base:d-pot-single']);
assert.equal(window.BrandMenuStructurePicker.isNodeSelected(dishState.byLine, 'kiosk', dishState.initialKeys[0]), true);

const withoutExisting = window.BrandMenuStructurePicker.setNodeSelected(
  dishState.byLine,
  'kiosk',
  dishState.initialKeys[0],
  false,
);
const emptySelection = api.scenePickerSelection(dishDraft, withoutExisting);
assert.equal(emptySelection.length, 0, '已有商品允许取消勾选');
assert.deepEqual(Array.from(api.scenePickerDiff(dishState.initialKeys, emptySelection).removedKeys), Array.from(dishState.initialKeys));

const withNewDish = window.BrandMenuStructurePicker.setNodeSelected(
  dishState.byLine,
  'kiosk',
  'd:g-hotpot:c-hotpot-base:d-pot-yinyang',
  true,
);
const dishSelection = api.scenePickerSelection(dishDraft, withNewDish);
assert.deepEqual(Array.from(dishSelection, item => item.dishId), ['d-pot-single', 'd-pot-yinyang']);
assert.equal(dishSelection[1].categoryId, 'c-hotpot-base');
const preservedSelection = api.scenePickerSelection(dishDraft, withNewDish, dishState.initialEntries);
assert.equal(preservedSelection[0].dishId, 'd:g-hotpot:c-hotpot-base:d-pot-single', '保留对象沿用原场景标识与额度 key');

const categoryDraft = { targetType: 'category' };
const categoryState = api.scenePickerInitialState(categoryDraft, [
  { productLineId: 'kiosk', categoryId: 'c-hotpot-base' },
]);
assert.equal(categoryState.leafLevel, 'category');
assert.deepEqual(Array.from(categoryState.initialKeys), ['c:g-hotpot:c-hotpot-base']);
const withNewCategory = window.BrandMenuStructurePicker.setNodeSelected(
  categoryState.byLine,
  'kiosk',
  'c:g-hotpot:c-hotpot-meat',
  true,
);
const categorySelection = api.scenePickerSelection(categoryDraft, withNewCategory);
assert.deepEqual(Array.from(categorySelection, item => item.categoryId), ['c-hotpot-base', 'c-hotpot-meat']);
assert.equal(categorySelection[1].name, '肉类');

const values = { targetLimits: { oldKey: { configured: true, value: 2 } }, tableTargetCaps: { oldKey: { configured: true, value: 3 } } };
api.removeSceneTargetValues(values, ['oldKey']);
assert.equal(values.targetLimits.oldKey, undefined);
assert.equal(values.tableTargetCaps.oldKey, undefined);

assert.match(source, /statesByStoreId: \{\}/, '场景商品选择器按门店保存临时状态');
assert.match(source, /dirtyStoreIds: \[\]/, '场景商品选择器只提交发生变化的门店');
assert.match(source, /data-scene-product-store/, '选择器支持在参与门店间切换');
assert.match(source, /pickerContainer\.dirtyStoreIds\.map/, '确认时应用全部已修改门店');

console.log('verify-buffet-scene-unified-picker: PASS');
