const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('src/team/payroll/legacy/payroll-schedule-controls.js.txt', 'utf8');
const controls = source.slice(0, source.indexOf("\n  $all('[data-payroll-scenario]').forEach(button => button.addEventListener"));
for (const scenario of ['weekly', 'biweekly', 'semimonthly', 'monthly', 'custom', 'switch', 'transition']) {
  const state = { data: { actual: true }, periodId: 'actual', employeeId: 'real', employeeStoreFilter: 'A' };
  const elements = { '#payroll-store-filter': { value: 'A' }, '#payroll-store-trigger': { disabled: true }, '#payroll-demo-indicator': {} };
  const context = { state, payrollReady: true, remoteSaveTimer: null, structuredClone, clearTimeout,
    $: id => elements[id], $all: () => [], readFormIntoDraft() {},
    runAfterUnsavedWorkspaceConfirm: fn => fn(), buildSnapshot: () => structuredClone(state),
    markWorkspaceEntrySnapshot() {}, renderPeriods() {}, renderEmployees() {}, renderManageForm() {}, syncWorkspaceDirtyBaseline() {}, showView() {}, renderCustomFilterMenus() {},
    window: { TipOutGlobalScopeFilter: { readGlobalScopeFilter: () => ({ storeLabel: 'A' }) },
      createPayrollScheduleDemo: (kind, store) => ({ demo: true, kind, periods: [{ id: 'p', year: 2027, startDate: '2027-01-01', endDate: '2027-12-31' }], employees: { p: [{ id: 'e', store }] } }) },
  };
  vm.createContext(context);
  vm.runInContext(controls, context);
  context.changePayrollDemoScenario(scenario);
  context.changePayrollDemoScenario(scenario, 'B');
  assert.equal(state.data.kind, scenario);
  assert.equal(state.data.employees.p[0].store, 'B');
  assert.equal(state.employeeStoreFilter, 'B');
  assert.equal(elements['#payroll-store-trigger'].disabled, false);
  assert.equal(state.periodId, 'p');
  context.changePayrollDemoScenario('');
  assert.equal(state.data.actual, true);
  assert.equal(state.employeeStoreFilter, 'A');
  assert.equal(state.employeeId, 'real');
}
console.log('All seven demo scenarios allow store changes and restore actual data.');
