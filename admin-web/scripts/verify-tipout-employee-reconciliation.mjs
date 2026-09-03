import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const helperPath = path.join(root, 'dist/TipOut/tipout-summary-ui.js');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(helperPath, 'utf8'), context);
const ui = context.window.TipOutSummaryUi;

assert.equal(ui.isParticipatingEmployeeRecord({ before: 0, deducted: 0, received: 0, after: 0, hours: 0 }), false);
assert.equal(ui.isParticipatingEmployeeRecord({ before: 0, deducted: 0, received: 0, after: 0, hours: 4 }), true);
assert.equal(ui.isParticipatingEmployeeRecord({ before: 1, deducted: 0, received: 0, after: 0, hours: 0 }), true);
assert.equal(ui.resolveRequiresAttendance([]), true);
assert.equal(ui.resolveRequiresAttendance([{ clockin: 'noclock' }, { clockin: 'noclock' }]), false);
assert.equal(ui.resolveRequiresAttendance([{ clockin: 'noclock' }, { clockin: 'clock' }]), true);

const rows = [
  {
    dateKey: '2026-01-01', allocated: true, requiresAttendance: true,
    employeeResults: [
      { employeeId: 'roster:a', name: 'Alex', role: 'Server', before: 20, deducted: 3, received: 5, after: 22, hours: 8, clockStatus: '已打卡' },
      { employeeId: 'roster:b', name: 'Alex', role: 'Server', before: 10, deducted: 1, received: 2, after: 11, hours: 0, clockStatus: '未打卡' }
    ]
  },
  {
    dateKey: '2026-01-02', allocated: false, requiresAttendance: false,
    employeeResults: [
      { employeeId: 'roster:a', name: 'Alex', role: 'Server', before: 12, deducted: 2, received: 4, after: 14, hours: 6, clockStatus: '未打卡' },
      { employeeId: 'roster:zero', name: 'Zero', role: 'Host', before: 0, deducted: 0, received: 0, after: 0, hours: 0, clockStatus: '未打卡' }
    ]
  }
];
const aggregates = JSON.parse(JSON.stringify(ui.aggregateEmployeeDailyDatasets(rows)));
assert.equal(aggregates.length, 2);
assert.deepEqual(aggregates.map((row) => row.employeeId), ['roster:a', 'roster:b']);
assert.deepEqual(aggregates[0], {
  employeeId: 'roster:a', name: 'Alex', role: 'Server', shifts: 2, hours: 14,
  before: 32, deducted: 5, received: 9, after: 36, status: '待补录',
  missingAttendanceDays: 0, pendingAllocationDays: 1,
  dailyRows: [
    { dateKey: '2026-01-01', allocated: true, requiresAttendance: true, employeeId: 'roster:a', name: 'Alex', role: 'Server', before: 20, deducted: 3, received: 5, after: 22, hours: 8, clockStatus: '已打卡' },
    { dateKey: '2026-01-02', allocated: false, requiresAttendance: false, employeeId: 'roster:a', name: 'Alex', role: 'Server', before: 12, deducted: 2, received: 4, after: 14, hours: 6, clockStatus: '未打卡' }
  ]
});
assert.equal(aggregates[1].status, '待补录');
assert.equal(aggregates[1].missingAttendanceDays, 1);

assert.equal(ui.resolveSummaryView({ tipoutSummaryUiState: { activeView: 'date' } }, 'employee'), 'date');
assert.equal(ui.resolveSummaryView({ tipoutSummaryUiState: {} }, 'employee'), 'date');
assert.equal(ui.resolveSummaryView(null, 'employee'), 'employee');
assert.equal(ui.resolveSummaryView(null, 'unknown'), 'date');

const detailUrl = ui.buildEmployeeReconciliationDetailUrl({
  employeeId: 'roster:a/b', store: 'Downtown LA', dateStart: '2026-01-01', dateEnd: '2026-01-02'
});
assert.equal(detailUrl, 'employee-reconciliation-detail.html?employeeId=roster%3Aa%2Fb&store=Downtown%20LA&start=2026-01-01&end=2026-01-02&from=summary&return=history');

const snapshot = ui.buildEmployeeReconciliationSnapshot({
  employeeId: 'roster:a', name: 'Alex', role: 'Server', store: 'Downtown LA',
  dateStart: '2026-01-01', dateEnd: '2026-01-02', createdAt: 123,
  dailyRows: aggregates[0].dailyRows, summary: aggregates[0], status: '待补录'
});
assert.equal(ui.readEmployeeReconciliationSnapshot(JSON.stringify(snapshot), {
  employeeId: 'roster:a', store: 'Downtown LA', dateStart: '2026-01-01', dateEnd: '2026-01-02'
}).employeeId, 'roster:a');
assert.equal(ui.readEmployeeReconciliationSnapshot(JSON.stringify(snapshot), {
  employeeId: 'roster:b', store: 'Downtown LA', dateStart: '2026-01-01', dateEnd: '2026-01-02'
}), null);
assert.equal(ui.readEmployeeReconciliationSnapshot('{bad json', {
  employeeId: 'roster:a', store: 'Downtown LA', dateStart: '2026-01-01', dateEnd: '2026-01-02'
}), null);

const legacyState = ui.buildSummaryHistoryState({
  dateStart: '2026-01-01', dateEnd: '2026-01-02', store: 'Downtown LA',
  roles: ['Server'], employees: ['Alex'], scrollY: 320, returnDate: '2026-01-02'
});
assert.equal(legacyState.tipoutSummaryUiState.activeView, 'date');
assert.equal(legacyState.tipoutSummaryUiState.returnDate, '2026-01-02');
assert.equal(legacyState.tipoutSummaryUiState.scrollY, 320);

const indexPath = path.join(root, 'dist/TipOut/index.html');
const cssPath = path.join(root, 'dist/TipOut/prototype-fidelity.css');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

for (const id of [
  'summaryViewSwitch', 'dateTaskTab', 'employeeReconciliationTab',
  'dateTaskPanel', 'employeeReconciliationPanel', 'employeeReconciliationList',
  'employeeReconciliationEmpty'
]) assert.match(indexHtml, new RegExp(`id="${id}"`));
assert.match(indexHtml, /function buildDailyDataset\(\)/);
assert.match(indexHtml, /function setSummaryView\(view\)/);
assert.match(indexHtml, /function renderEmployeeReconciliationList\(dailyRows\)/);
assert.match(indexHtml, /function openEmployeeReconciliationDetail\(employeeId\)/);
assert.match(indexHtml, /data-employee-id/);
assert.match(indexHtml, /sessionStorage\.setItem\(TipOutSummaryUi\.EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY/);
assert.match(css, /\.tipout-view-switch/);
assert.match(css, /\.tipout-employee-row/);
assert.match(css, /\.tipout-employee-status/);
const indexInlineScripts = [...indexHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1].trim())
  .filter(Boolean);
assert.ok(indexInlineScripts.length > 0);
indexInlineScripts.forEach((source) => new vm.Script(source));

const detailPath = path.join(root, 'dist/TipOut/employee-reconciliation-detail.html');
assert.equal(fs.existsSync(detailPath), true);
const detailHtml = fs.readFileSync(detailPath, 'utf8');
for (const id of [
  'employeeDetailName', 'employeeDetailRole', 'employeeDetailStore', 'employeeDetailRange',
  'employeeDetailShifts', 'employeeDetailHours', 'employeeDetailBefore',
  'employeeDetailDeducted', 'employeeDetailReceived', 'employeeDetailAfter',
  'employeeDetailNotice', 'employeeDetailRows', 'employeeDetailEmpty'
]) assert.match(detailHtml, new RegExp(`id="${id}"`));
assert.match(detailHtml, /TipOutSummaryUi\.readEmployeeReconciliationSnapshot/);
assert.match(detailHtml, /function renderEmployeeReconciliationDetail\(snapshot\)/);
assert.match(detailHtml, /function returnToEmployeeReconciliation\(\)/);
assert.match(detailHtml, /history\.back\(\)/);
assert.match(detailHtml, /index\.html\?view=employee/);
assert.doesNotMatch(detailHtml, /saveAllocatedDates|doAllocateTips|genDailyTip|runLegacyDayPipeline/);
const detailInlineScripts = [...detailHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1].trim())
  .filter(Boolean);
assert.ok(detailInlineScripts.length > 0);
detailInlineScripts.forEach((source) => new vm.Script(source));

console.log('TipOut employee reconciliation verification passed.');
