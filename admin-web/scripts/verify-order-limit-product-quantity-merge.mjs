import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

const steps = source.match(/var steps = \[[\s\S]*?\n\s*\];/)?.[0] ?? "";
assert.match(steps, /规则类型[\s\S]*场景配置[\s\S]*限购数量[\s\S]*超限授权[\s\S]*生效范围[\s\S]*确认发布/);
assert.doesNotMatch(steps, /商品配置/, "独立商品配置步骤应被移除");

const stepOne = source.match(/function renderStepOne\(draft\)[\s\S]*?(?=\n\s*function renderChecks)/)?.[0] ?? "";
assert.match(stepOne, /data-field="name"/, "规则名称应迁入规则类型");
assert.match(stepOne, /data-field="description"/, "规则描述应迁入规则类型");
assert.doesNotMatch(source, /填写规则信息，并确定限额如何计算与累计|添加商品后按门店、人数、轮次和产线展开完整规则|区间必须从 1 连续覆盖到“及以上”|每个区间配置的是人均上限/, "已确认移除的页面说明文案不应继续展示");

const renderer = source.match(/function renderEditorContent\(\)[\s\S]*?(?=\n\s*function renderEditorNav)/)?.[0] ?? "";
assert.match(renderer, /currentStep === 2\) return renderStepThree/);
assert.match(renderer, /currentStep === 3\) return renderStepFour/);
assert.match(renderer, /currentStep === 4\) return renderStepSix/);
assert.match(renderer, /currentStep === 5\) return renderStepFive/);
assert.doesNotMatch(renderer, /renderStepTwo/, "渲染映射不得保留独立商品配置步骤");
assert.match(source, /function syncNextButtonState[\s\S]*?validateAll\(draft\)[\s\S]*?validateStep\(editorState\.currentStep, draft\)[\s\S]*?nextButton\.disabled = !!error[\s\S]*?nextButton\.title = error/, "下一步应按当前步骤校验结果实时禁用并通过 title 提示原因");
assert.match(source, /addEventListener\("input", syncNextButtonState\)[\s\S]*?addEventListener\("change", syncNextButtonState\)/, "输入和变更后应实时刷新下一步状态");

const mergedStep = source.match(/function renderStepFour\(draft\)[\s\S]*?(?=\n\s*function renderStepFive)/)?.[0] ?? "";
assert.match(mergedStep, /data-product-add-open/, "限购数量页应提供全局添加商品入口");
assert.equal((mergedStep.match(/data-product-add-open/g) || []).length, 1, "限购数量页仅应保留顶部一个添加商品按钮");
assert.match(mergedStep, /renderLimitRuleList/, "限购数量页应展示完整商品规则列表");
assert.doesNotMatch(mergedStep, /data-limit-store-select/, "合并页不应保留单一门店下拉");
assert.match(source, /data-limit-rule-store/, "完整规则列表应支持门店筛选");
assert.match(source, /data-limit-rule-party/, "完整规则列表应支持人数筛选");
assert.match(source, /data-limit-rule-round/, "多轮规则应支持轮次筛选");
assert.match(source, /data-limit-rule-line/, "完整规则列表应支持产线筛选");
assert.match(source, /data-limit-rule-status/, "完整规则列表应支持数量配置状态筛选");
assert.match(source, /state\.status === "configured"[\s\S]*?row\.configured[\s\S]*?state\.status === "unconfigured"[\s\S]*?!row\.configured/, "状态筛选应区分已配置与未配置，0 仍属于已配置");
assert.match(source, /data-limit-rule-search/, "完整规则列表应支持菜单搜索");
assert.match(source, /data-limit-rule-filter-reset[\s\S]*?limitRuleList\.query = ""[\s\S]*?limitRuleList\.status = ""[\s\S]*?limitRuleList\.page = 1/, "完整规则列表应支持一键重置所有筛选");
assert.match(source, /pageSize:\s*20/, "完整规则列表默认每页应展示 20 条");
assert.match(source, /data-limit-rule-page-size[\s\S]*?100 条\/页/, "完整规则列表应支持每页 100 条");

assert.doesNotMatch(source, /data-product-add-store-id/, "门店区块不应重复提供添加商品入口");
assert.doesNotMatch(mergedStep, /renderMergedStoreSection|renderSceneDisplayToggle/, "主区不应继续渲染场景矩阵或组合平铺");
assert.match(source, /function limitRuleListRows/, "应按完整场景展开商品规则");
assert.match(source, /roundLabel:\s*draft\.period === "multi_round" \? formatRange\([\s\S]*?\) : periodLabel\(draft\.period\)/, "非多轮规则应展示“每轮”或“与轮次无关”");
assert.match(source, /data-limit-rule-batch-apply/, "完整规则列表应支持批量填写");
assert.match(source, /data-limit-rule-batch-delete/, "完整规则列表应支持批量删除");
assert.match(source, /function requestLimitRuleBatchDeletion[\s\S]*?productRowIds[\s\S]*?configuredProducts[\s\S]*?确认批量删除商品/, "批量删除应按商品去重并汇总确认已配置商品");
const limitRuleListRenderer = source.match(/function renderLimitRuleList\(draft\)[\s\S]*?(?=\n\s*function renderStepFour)/)?.[0] ?? "";
assert.doesNotMatch(limitRuleListRenderer, /data-limit-rule-select-page|data-limit-rule-clear|选择本页|清空选择/, "完整规则列表不应提供选择本页或清空选择");
assert.match(source, /data-merged-product-remove/, "规则行应提供商品移除入口");
assert.match(source, /data-limit-store-id[\s\S]*data-limit-line-id/, "数量输入应携带门店和产线上下文");
assert.match(source, /selectedRowIds/, "批量选择应按规则行保存");

assert.match(source, /function rowHasConfiguredLimits/, "应检测被移除商品是否已有数量");
assert.match(source, /其中 " \+ configured\.length \+ " 个商品已配置限购数量/, "弹层取消商品应汇总提示已配置数量");
assert.match(source, /if \(!rowHasConfiguredLimits\(draft, row\)\) \{ applyMergedProductRemoval/, "未填数量的矩阵行应直接移除");
assert.match(source, /openDialog\([\s\S]*?确认移除商品/, "已填数量的矩阵行应使用自定义确认框");

assert.match(source, /productQuantityMergedVersion/, "旧草稿步骤索引应执行一次性兼容迁移");
assert.match(source, /shouldAppendOpenRange[\s\S]*?event\.type === "change"[\s\S]*?rangeIndex === ranges\.length - 1[\s\S]*?ranges\.push\(\{ min: range\.max \+ 1, max: null \}\)/, "最后一个及以上区间填写结束值并失焦后应自动补全下一开放区间");
assert.match(source, /storeConfigs/, "编辑权威应继续使用原 storeConfigs");
assert.doesNotMatch(source, /quantityTemplate|storeBindings|productOverrides/, "本次不得引入解耦字段");

assert.match(css, /\.olf-limit-rule-list/, "应提供完整商品规则列表样式");
assert.match(css, /\.olf-limit-rule-table/, "应提供完整商品规则表格样式");
assert.match(css, /\.olf-step-nav\s*\{[\s\S]*?position:\s*sticky[\s\S]*?grid-template-columns:\s*repeat\(6/, "步骤导航应在顶部横向吸附展示");
assert.match(css, /repeat\(6,\s*minmax/, "移动端步骤导航应调整为 6 步");

console.log("Menu order limit product and quantity merge verification passed");
