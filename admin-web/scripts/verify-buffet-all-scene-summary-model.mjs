import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');

for (const marker of [
  'function buffetAllSceneCombos(draft)',
  'function buffetAllSceneSummaryRows(draft)',
  'function buffetSummaryResult(draft, row, combo)',
  'function buffetSummaryDifferenceKey(row)',
  'function buffetSummaryResultSignature(row)',
  'function filterBuffetSummaryRows(rows,state)',
  'function buffetSummaryPageData(draft,state)',
  'effectiveMemberProtection',
  '该成员未设置保护',
  '禁止下单',
  'not_applicable',
]) assert.ok(flow.includes(marker), `缺少全部场景汇总模型：${marker}`);

assert.match(flow, /partyRangeId:draft\.subject === "party_size"/);
assert.match(flow, /roundRangeId:combo\.period === "multi_round"/);
assert.match(flow, /peers\.length>1&&signatures\.length>1/);
assert.match(flow, /pageSize:20/);

console.log('verify-buffet-all-scene-summary-model: PASS');
