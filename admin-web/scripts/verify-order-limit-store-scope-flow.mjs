import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

const stepTwo = source.match(/function renderStepTwo\(draft\)[\s\S]*?(?=\n\s*function renderRangeRows)/)?.[0];
assert.ok(stepTwo, "商品配置渲染函数应存在");
assert.match(stepTwo, /data-config-store-select/, "商品配置应使用门店下拉");
assert.doesNotMatch(stepTwo, /data-participating-store/, "商品配置不应继续展示参与门店表格");
assert.doesNotMatch(stepTwo, /data-store-tab/, "商品配置不应继续展示门店标签");
assert.match(stepTwo, /请选择配置门店/, "新建规则应提供未选择门店占位状态");

const stepFive = source.match(/function renderStepFive\(draft\)[\s\S]*?(?=\n\s*function renderScopeRow)/)?.[0];
assert.ok(stepFive, "生效范围渲染函数应存在");
assert.match(stepFive, /data-effective-store/, "生效范围应渲染门店选择表格");
assert.match(stepFive, /store\.address/, "生效门店表格应展示地址");
assert.match(stepFive, /已添加[\s\S]*未添加|未添加[\s\S]*已添加/, "生效门店表格应展示商品状态");
assert.match(stepFive, /disabled/, "未添加门店应禁止勾选");

const inputHandler = source.match(/function handleEditorInput\(event\)[\s\S]*?(?=\n\s*function mountEditor)/)?.[0];
assert.ok(inputHandler, "编辑器输入处理函数应存在");
assert.match(inputHandler, /data-config-store-select/, "门店下拉应切换当前配置门店");
assert.match(inputHandler, /data-effective-store/, "第 5 步门店勾选应更新生效集合");

assert.match(source, /authoringDraft/, "正式规则应保存完整后台编辑快照");
assert.match(source, /rule\.authoringDraft[\s\S]{0,240}rule\.editorDraft/, "编辑正式规则应优先读取后台编辑快照");
assert.match(source, /function normalizeDeploymentSelection\(draft/, "应统一归一化生效与排除门店集合");
assert.match(source, /order-limit-publish-confirm\.html\?draftId=/, "第 7 步应直接进入发布确认页");

const storesFlow = source.match(/function mountStores\(\)[\s\S]*?(?=\n\s*function validateDeployStores)/)?.[0];
assert.ok(storesFlow, "旧门店页面入口应保留兼容处理");
assert.doesNotMatch(storesFlow, /<table|data-deploy-store/, "旧门店页面不应继续渲染选择表格");
assert.match(storesFlow, /highestStep[\s\S]{0,300}currentStep/, "旧门店页面应按已解锁步骤安全重定向");

assert.match(css, /\.olf-config-store-select/, "应提供商品配置门店下拉样式");
assert.match(css, /\.olf-effective-stores/, "应提供第 5 步生效门店表格样式");

console.log("Menu order limit store scope flow verification passed");
