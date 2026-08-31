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

const fidelityCssPath = path.join(root, 'dist/TipOut/prototype-fidelity.css');
assert.equal(fs.existsSync(fidelityCssPath), true);
const fidelityCss = fs.readFileSync(fidelityCssPath, 'utf8');
assert.match(
  fidelityCss,
  /\.tipout-page-rules \.tipout-table-wrap:has\(\.tipout-rule-more\[aria-expanded="true"\]\)\s*\{[^}]*padding-bottom:\s*92px/s,
);
assert.match(
  fidelityCss,
  /\.tipout-page-summary \.filter-bar--index\s*\{[^}]*flex-wrap:\s*nowrap/s,
);
assert.match(
  fidelityCss,
  /\.tipout-fidelity \.mobile-menu-btn\s*\{[^}]*white-space:\s*nowrap/s,
);

const pageContracts = [
  ['index.html', 'tipout-page-summary'],
  ['detail.html', 'tipout-page-detail'],
  ['rules.html', 'tipout-page-rules'],
  ['rule-add.html', 'tipout-page-rule-editor'],
];
for (const [fileName, pageClass] of pageContracts) {
  const html = fs.readFileSync(path.join(root, 'dist/TipOut', fileName), 'utf8');
  assert.match(html, /href="prototype-fidelity\.css"/);
  assert.match(html, new RegExp('<body class="[^"]*tipout-fidelity[^"]*' + pageClass));
  assert.match(html, /class="tipout-breadcrumb"/);
  assert.doesNotMatch(html, /class="page-tabs"/);
}

assert.deepEqual(
  JSON.parse(JSON.stringify(ui.summarizeDailyResults([
    { before: 10, deducted: 2, received: 4, after: 12 },
    { before: 20, deducted: 1, received: 3, after: 22 },
  ]))),
  { before: 30, deducted: 3, received: 7, after: 34 },
);
assert.equal(
  ui.buildDetailUrl({ date: '2026-08-02', store: 'Downtown LA', fromSummary: true }),
  'detail.html?date=2026-08-02&store=Downtown%20LA&from=summary&return=history',
);
assert.equal(ui.countPendingDates(['2026-08-01', '2026-08-02'], ['2026-08-02']), 1);
const historyState = ui.buildSummaryHistoryState({
  dateStart: '2026-08-01', dateEnd: '2026-08-07', store: 'Downtown LA',
  roles: ['Server'], employees: ['Olivia Martin'], scrollY: 420, returnDate: '2026-08-02',
});
assert.equal(historyState.tipoutSummaryUiState.returnDate, '2026-08-02');
assert.equal(ui.readSummaryHistoryState(historyState).scrollY, 420);

const indexHtml = fs.readFileSync(path.join(root, 'dist/TipOut/index.html'), 'utf8');
assert.match(
  indexHtml,
  /id="summaryRuleEntryBtn"[^>]*onclick="openSummaryRuleEntry\(\)"[^>]*>新建\/查看规则<\/button>/,
);
assert.match(
  indexHtml,
  /id="summaryRuleEntryBtn"[\s\S]*?toggleExportMenu\(\)[\s\S]*?id="allocateBtn"/,
);
assert.match(indexHtml, /function openSummaryRuleEntry\(\)/);
assert.match(indexHtml, /ruleData\.getRules\(\)/);
assert.match(indexHtml, /rule-add\.html\?poolKind=tip/);
assert.match(indexHtml, /window\.location\.href = hasRules \? 'rules\.html' : 'rule-add\.html\?poolKind=tip'/);
const ruleEntryStart = indexHtml.indexOf('function openSummaryRuleEntry()');
const ruleEntryEnd = indexHtml.indexOf('function hasTipRules()', ruleEntryStart);
assert.ok(ruleEntryStart >= 0 && ruleEntryEnd > ruleEntryStart);
const ruleEntrySource = indexHtml.slice(ruleEntryStart, ruleEntryEnd);
function runSummaryRuleEntry(getRules) {
  const location = { href: '' };
  const data = { getRules };
  const ruleEntryContext = { window: { ruleData: data, location }, ruleData: data };
  vm.runInNewContext(ruleEntrySource, ruleEntryContext);
  ruleEntryContext.openSummaryRuleEntry();
  return location.href;
}
assert.equal(runSummaryRuleEntry(() => []), 'rule-add.html?poolKind=tip');
assert.equal(runSummaryRuleEntry(() => [{ id: 1 }]), 'rules.html');
assert.equal(runSummaryRuleEntry(() => { throw new Error('unavailable'); }), 'rule-add.html?poolKind=tip');
for (const id of ['summaryBefore', 'summaryDeducted', 'summaryReceived', 'summaryAfter', 'pendingDateCount']) {
  assert.match(indexHtml, new RegExp('id="' + id + '"'));
}
assert.match(indexHtml, /<table[^>]*class="[^"]*tipout-summary-table/);
assert.match(indexHtml, /<tbody id="dailySummaryList"/);
assert.match(indexHtml, /function renderSummaryOverview\(dailyRows, allocatedDates\)/);
assert.match(indexHtml, /function activateDailySummaryRow\(event, dateKey\)/);
assert.doesNotMatch(indexHtml, /type="checkbox"[^>]*data-date/);
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
for (const id of ['detailWorkspace', 'detailMain', 'detailContextRail', 'detailActionBar']) {
  assert.match(detailHtml, new RegExp('id="' + id + '"'));
}
assert.match(detailHtml, /function renderDetailContextRail\(rules, dateKey, store\)/);
assert.match(detailHtml, /params\.from === 'summary' && params\.return === 'history' && history\.length > 1/);
assert.match(detailHtml, /class="[^"]*tipout-detail-context-bar/);
assert.match(detailHtml, /class="[^"]*tipout-sticky-actions/);
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
for (const id of ['ruleCount', 'tipPoolCount', 'surchargePoolCount', 'rulesTableBody']) {
  assert.match(rulesHtml, new RegExp('id="' + id + '"'));
}
assert.match(rulesHtml, /function renderRuleMetrics\(rules\)/);
assert.match(rulesHtml, /<table[^>]*class="[^"]*tipout-rules-table/);
assert.match(rulesHtml, /role="menu"/);
assert.doesNotMatch(rulesHtml, /生效中|待补录|需处理|规则版本|生效日期/);
assert.match(rulesHtml, /document\.getElementById\('ruleCount'\)\.textContent = String\(list\.length\)/);
assert.match(rulesHtml, /rule\.poolKind !== 'surcharge'/);
assert.match(rulesHtml, /rule\.poolKind === 'surcharge'/);
assert.match(rulesHtml, /renderRuleMetrics\(rules\)/);
assert.match(rulesHtml, /data-rule-id/);
assert.match(rulesHtml, /id="storeFilter"[^>]*onchange="renderRulesTable\(\)"/);
assert.match(rulesHtml, /id="poolTypeModal"/);
assert.match(rulesHtml, /name="poolType" value="tip"/);
assert.match(rulesHtml, /name="poolType" value="surcharge"/);
assert.match(rulesHtml, /function confirmPoolTypeSelection\(\)/);
assert.match(rulesHtml, /function buildRuleAddUrl\(poolType\)/);
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
assert.match(rulesHtml, /event\.key !== 'Escape'/);
assert.match(rulesHtml, /if \(firstAction\) firstAction\.focus\(\)/);
assert.match(rulesHtml, /openButton\.focus\(\)/);
assert.doesNotMatch(rulesHtml, /规则版本|生效日期|停用规则|启用规则/);
const rulesInlineScripts = [...rulesHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter((source) => source.trim());
assert.ok(rulesInlineScripts.length > 0);
rulesInlineScripts.forEach((source) => new vm.Script(source));

const editorHtml = fs.readFileSync(path.join(root, 'dist/TipOut/rule-add.html'), 'utf8');
const commonJs = fs.readFileSync(path.join(root, 'dist/TipOut/common.js'), 'utf8');
for (const id of [
  'ruleSectionBasic', 'sharedPoolRulesSection', 'allocationModeSection',
  'deductRulesSection', 'legacyReceiversSection', 'orderTipClaimsSection',
  'orderResidualSection', 'distributionSection',
]) assert.match(editorHtml, new RegExp('id="' + id + '"'));
for (const id of ['ruleEditorWorkspace', 'ruleEditorMain', 'ruleEditorContextRail', 'ruleEditorActions']) {
  assert.match(editorHtml, new RegExp('id="' + id + '"'));
}
for (const field of [
  'poolRules', 'deductRoles', 'deductEmployees', 'deductConfig', 'receivers',
  'tipClaims', 'residual', 'distribution', 'clockin', 'workHoursConfig',
]) assert.match(editorHtml, new RegExp(field));
assert.doesNotMatch(editorHtml, /class="tipout-rule-section-nav"/);
assert.match(editorHtml, /function syncRuleEditorContext\(\)/);
assert.match(editorHtml, /class="[^"]*tipout-form-card/);
assert.match(editorHtml, /function onAllocationModeChange\(skipEnsureClaimRow\)/);
for (const handler of ['collectFormData', 'submitRule', 'cancelRule']) {
  assert.match(editorHtml, new RegExp('function ' + handler + '\\('));
}
for (const handler of ['openDrawer', 'closeDrawer']) {
  assert.match(commonJs, new RegExp('function ' + handler + '\\('));
}
assert.doesNotMatch(editorHtml, /effectiveDate|ruleVersion|saveDraft|auditLog|ruleStatus/);
const editorInlineScripts = [...editorHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter((source) => source.trim());
assert.ok(editorInlineScripts.length > 0);
editorInlineScripts.forEach((source) => new vm.Script(source));
