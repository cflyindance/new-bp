import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');
const css = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.css', 'utf8');

assert.match(flow, /门店与商品数量[\s\S]*data-buffet-summary-open[\s\S]*data-buffet-summary-origin="outer"[\s\S]*查看全部配置[\s\S]*data-product-add-open/);
assert.ok(flow.includes('data-buffet-summary-origin", "scene"'), '单场景入口应标记 scene 来源');
assert.match(flow, /renderBuffetQuantityWorkbench\(draft\)\s*\+\s*renderBuffetAllSceneSummaryDialog\(draft\)/, '汇总弹窗应在第 2 步公共层渲染');
assert.ok(!/renderQuantitySceneDialog\(draft, config\)[\s\S]{0,900}renderBuffetAllSceneSummaryDialog\(draft\)/.test(flow), '汇总弹窗不得依赖单场景弹窗渲染');
assert.ok(flow.includes('buffetSummaryOrigin'), '应保存打开入口来源以恢复焦点');
assert.ok(flow.includes('暂无商品配置，请先添加商品'), '无商品时应展示规范空状态');
assert.ok(flow.includes('data.allRows.length'), '空商品与筛选无结果必须使用数据全集区分');
assert.match(css, /\.olf-section-actions\s*\{/);

console.log('verify-buffet-all-scene-summary-outer-entry: PASS');
