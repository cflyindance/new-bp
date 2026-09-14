import assert from 'node:assert/strict';
import fs from 'node:fs';

const summaryTemplate = fs.readFileSync('src/team/tips/templates/distribution.html', 'utf8');
const detailTemplate = fs.readFileSync('src/team/tips/templates/details.html', 'utf8');
const summaryProgram = fs.readFileSync('src/team/tips/programs/distribution.js.txt', 'utf8');
const detailProgram = fs.readFileSync('src/team/tips/programs/details.js.txt', 'utf8');
const exportProgram = fs.readFileSync('src/team/tips/legacy/export.js.txt', 'utf8');
const manualHours = fs.readFileSync('src/team/tips/legacy/tipout-manual-hours-store.js.txt', 'utf8');

assert.match(summaryTemplate, /<th>发放状态<\/th>/);
assert.match(summaryTemplate, /id="datePayoutStatusFilter"/);
for (const option of ['pending-allocation', 'pending-payout', 'paid', 'not-required', 'error']) {
  assert.match(summaryTemplate, new RegExp(`value="${option}"`));
}
for (const id of ['confirmPayoutModal', 'confirmPayoutStore', 'confirmPayoutDate', 'confirmPayoutAmount', 'confirmPayoutEmployees', 'submitConfirmPayoutBtn']) {
  assert.match(summaryTemplate, new RegExp(`id="${id}"`));
}
assert.match(summaryProgram, /function payoutViewForRow\(row\)/);
assert.match(summaryProgram, /function handleDatePayoutStatusChange\(value\)/);
assert.match(summaryProgram, /payoutViewForRow\(row\)\.key === dateSummaryFilters\.payoutStatus/);
assert.match(summaryProgram, /async function openConfirmPayoutModal\(dateKey, event\)/);
assert.match(summaryProgram, /async function submitConfirmPayout\(\)/);
assert.match(summaryProgram, /TipOutDateState\.confirmPayout\(payoutDraft\)/);
assert.match(summaryProgram, /所选范围均已发放，未执行任何变更/);
assert.match(summaryProgram, /canceledCount > 0 && window\.TipOutPayrollBridge/);

assert.match(detailTemplate, /id="updateTipDataBtn"/);
assert.match(detailProgram, /function renderPaidDetailState\(state\)/);
assert.match(detailProgram, /state\.payoutStatus === 'error'/);
assert.match(detailProgram, /actionBar\.style\.display = 'none'/);
assert.match(detailProgram, /updateButton\.style\.display = 'none'/);
assert.match(detailProgram, /以下内容来自确认发放时保存的快照/);
assert.match(detailProgram, /TipOutDateState\.assertDateWritable\(store, dateKey\)/);
assert.match(manualHours, /TipOutDateState\.assertDateWritable\(normalized\.store, normalized\.dateKey\)/);
assert.match(exportProgram, /function assertPaidExportSnapshotsAvailable\(\)/);
assert.match(exportProgram, /发放快照不可用/);

console.log('Tip payout UI verification passed.');
