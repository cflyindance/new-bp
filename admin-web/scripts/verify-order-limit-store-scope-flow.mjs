import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

const stepTwo = source.match(/function renderStepTwo\(draft\)[\s\S]*?(?=\n\s*function renderSelectedPreviewDialog|function renderProductAddDialog|function renderRangeRows)/)?.[0];
assert.ok(stepTwo, "商品配置渲染函数应存在");
assert.doesNotMatch(stepTwo, /data-config-store-select/, "商品配置主区不应继续展示门店下拉");
assert.match(source, /data-product-add-store-select/, "添加商品弹层应使用门店下拉");
assert.doesNotMatch(stepTwo, /data-participating-store/, "商品配置不应继续展示参与门店表格");
assert.doesNotMatch(stepTwo, /data-store-tab/, "商品配置不应继续展示门店标签");
assert.match(source, /请选择参与门店/, "新建规则应提供未选择参与门店占位状态");
assert.match(stepTwo, /data-product-add-open/, "商品配置主区应提供添加商品入口");

const stepFive = source.match(/function renderStepFive\(draft\)[\s\S]*?(?=\n\s*function renderScopeRow)/)?.[0];
assert.ok(stepFive, "生效范围渲染函数应存在");
assert.match(stepFive, /data-effective-store/, "生效范围应渲染门店选择表格");
assert.match(stepFive, /store\.address/, "生效门店表格应展示地址");
assert.match(stepFive, /已添加[\s\S]*未添加|未添加[\s\S]*已添加/, "生效门店表格应展示商品状态");
assert.match(stepFive, /disabled/, "未添加门店应禁止勾选");
assert.match(source, /data-business-hour-slot-toggle/, "活动时段应支持多选营业时段");
assert.match(source, /data-business-hour-dropdown-toggle/, "活动时段应提供多选下拉触发");
assert.match(source, /data-business-hour-slot-remove/, "已选活动时段应支持标签移除");
assert.match(source, /data-business-hour-setup-mode/, "应提供时间设置模式（全时段/分别设置）");
assert.match(source, /data-business-hour-slot-mode/, "每个营业时段应可独立选择时间范围模式");
assert.match(source, /data-business-hour-slot-from/, "指定时间应提供开始时间");
assert.match(source, /data-business-hour-slot-to/, "指定时间应提供结束时间");
assert.match(source, /function effectiveBusinessHourSlots\(/, "应提供按设置模式解析的有效时段");
assert.match(source, /businessHourSetupMode/, "草稿应持久化时间设置模式");
assert.match(source, /businessHourDropdownOpen/, "编辑器应维护活动时段下拉开合状态");
assert.match(stepFive, /renderBusinessHourSlotsSection/, "活动时段应调用多时段渲染");
assert.match(stepFive, /活动时段/, "生效范围应提供活动时段区块");
assert.match(stepFive, /有效日期/, "生效范围应提供有效日期区块");
assert.doesNotMatch(stepFive, /有效日期与营业时段/, "活动时段应从原合并标题中拆出");
assert.match(stepFive, /活动周期/, "生效范围应提供活动周期");
assert.match(stepFive, /有效日期[\s\S]*活动周期[\s\S]*活动时段[\s\S]*会员范围[\s\S]*生效门店/, "生效范围区块顺序应为有效日期→活动周期→活动时段→会员范围→生效门店");
assert.doesNotMatch(stepFive, /儿童计入有效人数|childCountPolicy/, "儿童计入有效人数应迁出第 5 步");
assert.match(source, /draft\.subject === ["']party_size["'][\s\S]{0,240}儿童计入有效人数/, "儿童计入有效人数应仅在按人数限购时于第 1 步展示");
assert.match(source, /var calcText = subjectLabel/, "复核页应汇总计算方式文案");
assert.match(source, /party_size["'] \? " · 儿童人数"/, "按人数限购时复核页应展示儿童人数口径");
assert.match(source, /esc\(calcText\)/, "复核页计算方式应使用汇总文案");
assert.match(stepFive, /renderChoice\(["']activityCycle["']/, "活动周期应为每天/每周/每月三选一");
assert.match(stepFive, /daysOfMonth/, "每月模式应提供日期多选");
assert.doesNotMatch(stepFive, /生效星期/, "活动周期应替换原生效星期标题");

assert.match(source, /function businessHourBounds\(/, "应提供营业时段边界");
assert.match(source, /function formatBusinessHourTimeLabel\(/, "应提供营业时段时间文案");
assert.match(source, /function formatActivityCycleLabel\(/, "应提供活动周期文案");
assert.match(source, /businessHourSlots/, "草稿应持久化多营业时段配置");
assert.match(source, /activityCycle/, "草稿应持久化活动周期");
assert.match(source, /请至少选择一个活动时段/, "第 5 步应校验至少选择一个活动时段");
assert.match(source, /指定时间须在所选营业时段内/, "第 5 步应校验指定时间落在营业时段内");
assert.match(source, /请至少选择一个生效日期/, "每月模式应校验至少选一日");

const inputHandler = source.match(/function handleEditorInput\(event\)[\s\S]*?(?=\n\s*function mountEditor)/)?.[0];
assert.ok(inputHandler, "编辑器输入处理函数应存在");
assert.match(inputHandler, /data-product-add-store-select/, "添加商品弹层门店下拉应切换当前配置门店");
assert.match(inputHandler, /data-effective-store/, "第 5 步门店勾选应更新生效集合");

assert.match(source, /authoringDraft/, "正式规则应保存完整后台编辑快照");
assert.match(source, /rule\.authoringDraft[\s\S]{0,240}rule\.editorDraft/, "编辑正式规则应优先读取后台编辑快照");
assert.match(source, /function normalizeDeploymentSelection\(draft/, "应统一归一化生效与排除门店集合");
assert.match(source, /order-limit-publish-confirm\.html\?draftId=/, "第 7 步应直接进入发布确认页");

const storesFlow = source.match(/function mountStores\(\)[\s\S]*?(?=\n\s*function validateDeployStores)/)?.[0];
assert.ok(storesFlow, "旧门店页面入口应保留兼容处理");
assert.doesNotMatch(storesFlow, /<table|data-deploy-store/, "旧门店页面不应继续渲染选择表格");
assert.match(storesFlow, /highestStep[\s\S]{0,300}currentStep/, "旧门店页面应按已解锁步骤安全重定向");

assert.match(css, /\.olf-product-add-dialog|\.olf-config-store-select/, "应提供商品配置门店下拉或添加商品弹层样式");
assert.match(css, /\.olf-effective-stores/, "应提供第 5 步生效门店表格样式");
assert.match(css, /\.olf-business-hour-time-mode/, "应提供营业时段时间范围样式");
assert.match(css, /\.olf-business-hour-slots/, "应提供多营业时段列表样式");
assert.match(css, /\.olf-bh-dropdown/, "应提供活动时段多选下拉样式");
assert.match(css, /\.olf-bh-tag/, "应提供已选活动时段标签样式");
assert.match(css, /\.olf-month-day-grid/, "应提供每月日期勾选网格样式");

console.log("Menu order limit store scope flow verification passed");
