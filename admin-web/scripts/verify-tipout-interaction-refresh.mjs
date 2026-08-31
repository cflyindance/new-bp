import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const helperPath = path.join(root, 'dist/TipOut/tipout-summary-ui.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(helperPath, 'utf8'), context);
const ui = context.window.TipOutSummaryUi;

assert.deepEqual(
  JSON.parse(JSON.stringify(ui.summarizeDailyResults([
    { before: 10, deducted: 2, received: 4, after: 12 },
    { before: 20, deducted: 1, received: 3, after: 22 },
  ]))),
  { before: 30, deducted: 3, received: 7, after: 34 },
);
assert.equal(
  ui.buildDetailUrl({ date: '2026-08-02', store: 'Downtown LA', fromSummary: true }),
  'detail.html?date=2026-08-02&store=Downtown%20LA&from=summary',
);
const historyState = ui.buildSummaryHistoryState({
  dateStart: '2026-08-01', dateEnd: '2026-08-07', store: 'Downtown LA',
  roles: ['Server'], employees: ['Olivia Martin'], scrollY: 420, returnDate: '2026-08-02',
});
assert.equal(historyState.tipoutSummaryUiState.returnDate, '2026-08-02');
assert.equal(ui.readSummaryHistoryState(historyState).scrollY, 420);

const indexHtml = fs.readFileSync(path.join(root, 'dist/TipOut/index.html'), 'utf8');
assert.match(indexHtml, /id="dailySummaryList"/);
assert.match(indexHtml, /function getDailyEmployeeResults\(dateKey\)/);
assert.match(indexHtml, /function renderDailySummaryList\(\)/);
assert.match(indexHtml, /function openDailyDetail\(dateKey\)/);
assert.match(indexHtml, /TipOutSummaryUi\.summarizeDailyResults/);
assert.match(indexHtml, /data-date/);
assert.doesNotMatch(indexHtml, /id="dayTabs"/);
assert.doesNotMatch(indexHtml, /openDayAllocationStatusModal/);
assert.doesNotMatch(indexHtml, /id="employeeResults"/);
assert.match(indexHtml, /function captureSummaryUiState\(returnDate\)/);
assert.match(indexHtml, /history\.replaceState/);
assert.match(indexHtml, /fromSummary: true/);
assert.match(indexHtml, /function restoreSummaryUiState\(\)/);
assert.match(indexHtml, /window\.addEventListener\('pageshow'/);

const detailHtml = fs.readFileSync(path.join(root, 'dist/TipOut/detail.html'), 'utf8');
assert.match(detailHtml, /function returnToSummary\(\)/);
assert.match(detailHtml, /params\.from === 'summary'/);
assert.match(detailHtml, /返回汇总/);
assert.match(detailHtml, /还没有小费分配规则/);
assert.match(detailHtml, /href="rules\.html"[^>]*>新增小费分配规则/);
assert.match(detailHtml, /updateTipData\(\)/);
assert.match(detailHtml, /saveDetail\(\)/);
assert.match(detailHtml, /saveAndNext\(\)/);
assert.doesNotMatch(detailHtml, /allocatedDates\.has\(dateKey\)/);
assert.doesNotMatch(detailHtml, /该日期尚未完成小费分配/);

const rulesHtml = fs.readFileSync(path.join(root, 'dist/TipOut/rules.html'), 'utf8');
assert.match(rulesHtml, /tipout-rule-record/);
assert.match(rulesHtml, /ruleData\.buildRuleDescription/);
assert.match(rulesHtml, /deleteRule\(this\)/);
assert.match(rulesHtml, /copyRule\(this\)/);
assert.match(rulesHtml, /function toggleRuleActions\(button\)/);
assert.match(rulesHtml, /aria-haspopup="menu"/);
assert.match(rulesHtml, /rule-add\.html\?mode=edit&id=/);
assert.match(rulesHtml, /confirmAction\('确定要删除该规则吗？此操作不可恢复。'/);
assert.match(rulesHtml, /ruleData\.deleteRuleById\(id\)/);
assert.match(rulesHtml, /ruleData\.getNextRuleId\(\)/);
assert.match(rulesHtml, /ruleName = \(rule\.ruleName \|\| ''\) \+ ' \(副本\)'/);
assert.match(rulesHtml, /ruleData\.saveRules\(rules\)/);
assert.match(rulesHtml, /if \(!event\.target\.closest\('\.tipout-rule-actions'\)\) closeRuleActions\(\)/);
assert.doesNotMatch(rulesHtml, /id="rulesTable"|id="rulesTableBody"/);
assert.doesNotMatch(rulesHtml, /规则版本|生效日期|停用规则|启用规则/);
const rulesInlineScripts = [...rulesHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter((source) => source.trim());
assert.ok(rulesInlineScripts.length > 0);
rulesInlineScripts.forEach((source) => new vm.Script(source));

const editorHtml = fs.readFileSync(path.join(root, 'dist/TipOut/rule-add.html'), 'utf8');
for (const id of [
  'ruleSectionBasic', 'sharedPoolRulesSection', 'allocationModeSection',
  'deductRulesSection', 'legacyReceiversSection', 'orderTipClaimsSection',
  'orderResidualSection', 'distributionSection',
]) assert.match(editorHtml, new RegExp('id="' + id + '"'));
for (const field of [
  'poolRules', 'deductRoles', 'deductEmployees', 'deductConfig', 'receivers',
  'tipClaims', 'residual', 'distribution', 'clockin', 'workHoursConfig',
]) assert.match(editorHtml, new RegExp(field));
assert.match(editorHtml, /class="tipout-rule-section-nav"/);
assert.match(editorHtml, /function scrollToRuleSection\(id\)/);
assert.match(editorHtml, /function syncRuleSectionNavigator\(allocationMode\)/);
assert.match(editorHtml, /function onAllocationModeChange\(skipEnsureClaimRow\)/);
assert.match(editorHtml, /function collectFormData\(\)/);
assert.match(editorHtml, /function submitRule\(\)/);
assert.doesNotMatch(editorHtml, /effectiveDate|ruleVersion|saveDraft|auditLog/);
const editorInlineScripts = [...editorHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter((source) => source.trim());
assert.ok(editorInlineScripts.length > 0);
editorInlineScripts.forEach((source) => new vm.Script(source));
