import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "dist/Configuration center/assets/order-limit-flow.js"), "utf8");

for (const marker of [
  "data-product-add-open",
  "data-product-search-target",
  "data-selected-preview-open",
  "data-limit-rule-select-all",
  "data-limit-rule-batch-apply",
  "data-limit-rule-batch-delete",
  "data-limit-rule-search",
]) {
  assert.ok(source.includes(marker), `共享商品配置缺少 ${marker}`);
}

assert.match(source, /function storeConfigFor\(draft, storeId, create\)/);
assert.match(source, /draft\.storeConfigs\[storeId\]/);
assert.match(source, /function addedStoreIds\(draft\)/);
assert.match(source, /draft\.deployStoreIds = added\.filter/);
assert.match(source, /deployExcludedStoreIds/, "取消生效应使用排除集合而非删除门店作者态");

assert.match(source, /function matchingProductSearchResults\(query\)/);
assert.match(source, /MenuPicker\.listAllDishes\(\)/, "搜索范围应包含当前门店产线商品目录");
assert.match(source, /categoryKey/, "按商品搜索时应保留所属分类信息");
assert.match(source, /确认批量删除商品/);
assert.match(source, /确认移除商品/);

const listRenderer = source.match(/function renderLimitRuleList\(draft\)[\s\S]*?(?=\n  function syncLimitRuleSelectAllState)/)?.[0] ?? "";
assert.match(listRenderer, /isBuffetProfile\(\) \? ""/, "自助餐数量列表应隐藏人数筛选");
assert.match(listRenderer, /quantityColumnLabel\(draft\)/);
assert.doesNotMatch(listRenderer, /设为不限制|设为禁止|实际限额/);

console.log("verify-buffet-rule-product-configuration: OK");
