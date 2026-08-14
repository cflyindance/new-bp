import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

for (const field of ["participatingStoreIds", "activeStoreId", "storeConfigs", "deployExcludedStoreIds"]) {
  assert.match(source, new RegExp(`${field}:`), `草稿应包含 ${field}`);
}

assert.match(source, /function createEmptyStoreConfig\(\)/, "应提供独立门店配置工厂");
assert.match(source, /function normalizeStoreDraft\(draft\)/, "应提供历史门店模型迁移函数");
assert.match(source, /function activeStoreConfig\(draft\)/, "应统一取得当前门店配置");
assert.match(source, /function addedStoreIds\(draft\)/, "应统一计算已添加商品门店");
assert.match(source, /legacyCompatibilityFallback/, "无历史发布门店时应保存兼容回退");

const stepTwo = source.match(/function renderStepTwo\(draft\)[\s\S]*?(?=\n\s*function renderRangeRows)/)?.[0];
assert.ok(stepTwo, "应能定位商品配置渲染函数");
assert.match(stepTwo, /data-participating-store/, "商品配置应渲染参与门店选择");
assert.match(stepTwo, /data-store-tab/, "商品配置应渲染门店 Tab");
assert.match(stepTwo, /商品状态|已添加|未添加/, "参与门店表格应展示商品状态");
assert.match(stepTwo, /store\.address/, "参与门店表格应展示明确地址");

const stepFour = source.match(/function renderStepFour\(draft\)[\s\S]*?(?=\n\s*function renderStepFive)/)?.[0];
assert.ok(stepFour, "应能定位数量配置渲染函数");
assert.match(stepFour, /data-limit-store-tab/, "数量配置应提供门店 Tab");
assert.match(stepFour, /activeStoreConfig\(draft\)/, "数量配置应读取当前门店矩阵");

const storesFlow = source.match(/function mountStores\(\)[\s\S]*?(?=\n\s*function publishDraft)/)?.[0];
assert.ok(storesFlow, "应能定位后置门店页");
assert.match(storesFlow, /store\.address/, "后置门店页应展示地址");
assert.match(storesFlow, /已添加|未添加/, "后置门店页应展示商品状态");
assert.match(storesFlow, /disabled/, "未添加门店应禁止勾选");
assert.match(storesFlow, /deployExcludedStoreIds/, "后置门店页应持久记录主动取消");

assert.match(source, /function clearAllStoreLimits\(draft\)/, "规则级场景变化应统一清空全部门店数量");
assert.match(source, /function buildPublishedDraft\(draft\)/, "正式发布应构建裁剪后的门店快照");
assert.match(source, /deployStoreIds[\s\S]{0,500}storeConfigs/, "正式快照应按最终发布门店裁剪配置");

assert.match(css, /\.olf-participating-stores/, "应提供参与门店表格样式");
assert.match(css, /\.olf-store-status\.is-added/, "应提供已添加状态样式");
assert.match(css, /\.olf-store-status\.is-missing/, "应提供未添加状态样式");

assert.match(source, /deployExcludedStoreIds[\s\S]{0,500}participatingStoreIds/, "主动取消发布应在商品暂时移除时继续保留");
assert.match(source, /stores\.some\(function \(store\) \{ return store\.id === storeId; \}\)/, "历史失效门店不应进入当前可配置或可发布范围");

console.log("Menu order limit store-specific configuration verification passed");
