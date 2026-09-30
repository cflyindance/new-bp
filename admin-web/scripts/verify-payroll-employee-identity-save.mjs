import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../src/team/payroll/legacy/payroll.js.txt', import.meta.url), 'utf8');
function extract(name, next) {
  const start = source.indexOf(`function ${name}(`);
  return source.slice(source.lastIndexOf('async ', start) === start - 6 ? start - 6 : start, source.indexOf(`  function ${next}(`, start));
}
const emp = { id: 'e', adpFile: 'old', declarationPreference: null, segments: ['saved-attendance'], adjustments: { tips: 5 } };
const draft = { ...emp, adpFile: 'new', ssn: '', hireDate: '01/01/2025', declarationPreference: { defaultFamilyId: 'zh', defaultLocaleCode: 'zh-CN', defaultPrintMode: 'employee-only' }, segments: ['unsaved-attendance'] };
let saved = 0, hidden = 0, failed = false, confirmedVersion = '';
const state = { periodId: 'p', employeeId: 'e', workspaceDraft: draft, workspaceEntrySnapshot: JSON.stringify(emp) };
const button = { disabled: false, textContent: 'Confirm' };
const context = {
  state, employeeEditModalState: {},
  $: () => button, readFormIntoDraft() {}, getEmployee: () => emp, getPeriod: () => ({ id: 'p' }),
  cloneData: structuredClone, getDraftAsEmployeeShape: () => draft,
  hideEmployeeEditModal() { hidden++; }, renderManageForm() {}, syncDerived() {}, updateUnifiedRosterFromEmployee() {}, appendAudit() {},
  saveState() { saved++; }, showNotification() {}, T: x => x,
  buildEmployeeSnapshot: JSON.stringify,
  PayrollDeclarationBridge: {
    async saveEmployeePreference() { if (failed) throw Error('offline'); },
    async resolve() { return { status: 'ready', primary: { versionId: 'fresh' }, printMode: 'employee-only' }; },
    async confirm(input) { confirmedVersion = input.primaryVersionId; return { snapshotId: 's' }; },
  },
  commitDraftToEmployee() {}, buildDetailExportPayload: () => ({ summary: {} }), buildDeclarationVariables: () => ({}), finalizeConfirmEmployeeSave() {},
};
const save = vm.runInNewContext(`(${extract('confirmEmployeeEditModal', 'setAdpExportMenuOpen').trim()})`, context);
await save();
assert.equal(saved, 1, 'Modal Confirm must persist without payroll confirmation');
assert.equal(emp.declarationPreference.defaultFamilyId, 'zh');
assert.deepEqual(emp.segments, ['saved-attendance'], 'Identity save must not commit pending attendance');
assert.equal(JSON.parse(state.workspaceEntrySnapshot).adpFile, 'new');
assert.deepEqual(JSON.parse(state.workspaceEntrySnapshot).segments, ['saved-attendance']);
assert.equal(hidden, 1);
failed = true; draft.adpFile = 'failed-change';
await save();
assert.equal(emp.adpFile, 'new', 'Failed preference save must leave committed employee intact');
assert.equal(hidden, 1, 'Failure keeps modal open');
assert.equal(button.disabled, false);
failed = false;
emp.declarationPresentation = { status: 'ready', primary: { versionId: 'stale' } };
const confirm = vm.runInNewContext(`(${extract('applyConfirmEmployeeSave', 'confirmEmployee').trim()})`, context);
await confirm(0);
assert.equal(confirmedVersion, 'fresh', 'Payroll confirmation must resolve the current version, not cached presentation');
context.PayrollDeclarationBridge.resolve = async () => ({ status: 'frozen', primary: { versionId: 'retired-history' } });
confirmedVersion = '';
await confirm(0);
assert.equal(confirmedVersion, '', 'Frozen historical statements are not submitted as current published versions');
console.log('Employee identity immediate save and fresh declaration confirmation passed');
