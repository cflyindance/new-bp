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
assert.match(stepTwo, /data-config-store-select/, "商品配置应使用单选门店下拉");
assert.match(stepTwo, /stores\.map/, "商品配置门店下拉应展示全部门店");
assert.match(stepTwo, /请选择参与门店/, "商品配置门店下拉应使用参与门店占位文案");
assert.match(stepTwo, /olf-config-store-select[\s\S]{0,240}>参与门店</, "商品配置门店字段应命名为参与门店");
assert.doesNotMatch(stepTwo, /data-participating-store|data-store-tab|商品状态/, "商品配置不应保留参与门店表格或门店 Tab");

const stepFour = source.match(/function renderStepFour\(draft\)[\s\S]*?(?=\n\s*function renderStepFive)/)?.[0];
assert.ok(stepFour, "应能定位数量配置渲染函数");
assert.match(stepFour, /data-limit-store-select/, "数量配置应提供参与门店单选下拉");
assert.doesNotMatch(stepFour, /data-limit-store-tab/, "数量配置不应继续渲染门店 Tab");
assert.match(stepFour, /configuredStores\.map/, "数量配置门店下拉应只从已添加商品门店生成选项");
assert.match(stepFour, /暂无参与门店/, "数量配置应提供无参与门店安全空态");
assert.match(stepFour, /previousActiveStoreId[\s\S]{0,500}clearBatchSelection/, "自动归一化切换门店时应清空批量状态");
assert.match(stepFour, /activeStoreConfig\(draft\)/, "数量配置应读取当前门店矩阵");

const activeDimensionNormalizer = source.match(/function normalizeActiveDimensions\(draft, requireAddedStore\)[\s\S]*?(?=\n\s*function changeChoice)/)?.[0];
assert.ok(activeDimensionNormalizer, "应能定位活动维度归一化函数");
assert.match(activeDimensionNormalizer, /requireAddedStore[\s\S]{0,500}!added\.length[\s\S]{0,500}activeStoreId = ""[\s\S]{0,500}activeLineId = ""/, "无参与门店时应清空活动门店和产线");

const inputHandler = source.match(/function handleEditorInput\(event\)[\s\S]*?(?=\n\s*function mountEditor)/)?.[0];
assert.ok(inputHandler, "应能定位编辑器输入处理函数");
assert.match(inputHandler, /data-limit-store-select[\s\S]{0,900}addedStoreIds\(draft\)[\s\S]{0,900}clearBatchSelection\(\)[\s\S]{0,900}activeStoreId[\s\S]{0,900}normalizeActiveDimensions[\s\S]{0,900}renderEditor/, "数量配置门店下拉应校验参与门店并安全切换矩阵");

const stepFive = source.match(/function renderStepFive\(draft\)[\s\S]*?(?=\n\s*function renderStepSix)/)?.[0];
assert.ok(stepFive, "应能定位生效范围渲染函数");
assert.match(stepFive, /data-effective-store/, "生效范围应提供门店勾选");
assert.match(stepFive, /store\.address/, "生效范围应展示地址");
assert.match(stepFive, /已添加|未添加/, "生效范围应展示商品状态");
assert.match(stepFive, /disabled/, "未添加门店应禁止勾选");

const storesFlow = source.match(/function mountStores\(\)[\s\S]*?(?=\n\s*function validateDeployStores)/)?.[0];
assert.ok(storesFlow, "应能定位历史后置门店路由");
assert.match(storesFlow, /currentStep = 5/, "历史后置门店路由应安全回到生效范围");
assert.match(storesFlow, /order-limit-rule-editor\.html/, "历史后置门店路由应重定向到编辑器");
assert.doesNotMatch(storesFlow, /data-deploy-store|olf-publish-store-table/, "历史后置门店路由不应再渲染重复选择页");

assert.match(source, /function clearAllStoreLimits\(draft\)/, "规则级场景变化应统一清空全部门店数量");
assert.match(source, /function buildPublishedDraft\(draft\)/, "正式发布应构建裁剪后的门店快照");
assert.match(source, /deployStoreIds[\s\S]{0,500}storeConfigs/, "正式快照应按最终发布门店裁剪配置");

assert.match(css, /\.olf-config-store-select/, "应提供商品配置门店下拉样式");
assert.match(css, /\.olf-limit-store-select/, "应提供数量配置门店下拉样式");
assert.match(css, /\.olf-effective-stores/, "应提供生效范围门店表格样式");
assert.match(css, /\.olf-store-status\.is-added/, "应提供已添加状态样式");
assert.match(css, /\.olf-store-status\.is-missing/, "应提供未添加状态样式");

assert.match(source, /deployExcludedStoreIds[\s\S]{0,500}participatingStoreIds/, "主动取消发布应在商品暂时移除时继续保留");
assert.match(source, /stores\.some\(function \(store\) \{ return store\.id === storeId; \}\)/, "历史失效门店不应进入当前可配置或可发布范围");

console.log("Menu order limit store-specific configuration verification passed");
