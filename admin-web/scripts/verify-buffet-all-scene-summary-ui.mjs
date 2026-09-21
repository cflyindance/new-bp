import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');
const css = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.css', 'utf8');

for (const marker of ['data-buffet-summary-open','data-buffet-summary-dialog','查看全部配置','全部场景商品配置','仅看额度存在差异的商品','进入配置']) assert.ok(flow.includes(marker), `缺少汇总界面：${marker}`);
for (const label of ['商品','产线','分类','门店','周期','计算方式','人数区间','轮次区间','限购结果','操作']) assert.ok(flow.includes(`<th>${label}</th>`), `缺少表格字段：${label}`);
for (const marker of ['data-buffet-summary-filter="storeId"','data-buffet-summary-filter="period"','data-buffet-summary-filter="partyRangeId"','data-buffet-summary-filter="roundRangeId"','data-buffet-summary-filter="lineId"','data-buffet-summary-filter="categoryIdentity"']) assert.ok(flow.includes(marker), `缺少筛选条件：${marker}`);
assert.ok(flow.includes('buffetSceneNameWithoutLineSuffix(row.categoryName,row.lineLabel)'), '汇总分类名称应移除产线后缀');
assert.ok(flow.includes('state.period==="order_lifetime"||!hasMultiRound'), '未启用分轮次时应禁用轮次筛选');
assert.match(css, /\.olf-buffet-summary-dialog/);
assert.match(css, /position:sticky/);

console.log('verify-buffet-all-scene-summary-ui: PASS');
