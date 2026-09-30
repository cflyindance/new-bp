import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/team/payroll/payroll-legacy-runtime.ts', 'utf8');
const body = source.split('  getDeclarationEmployees: () => {')[1].split('\n  },')[0];
const roster = [
  { id: 'roster-seed-1', name: 'No employee number', store: 'A' },
  { id: 'roster-seed-2', name: 'No payroll records', store: 'A', adpFile: '802' },
  { id: 'roster-seed-1', name: 'Other store', store: 'B' },
];
const employees = [{ id: 'emp-seed-1', name: 'Existing', store: 'A', adpFile: '' }];
const context = { structuredClone, state: { data: { employees: { period: employees } } }, getUnifiedRoster: () => roster };
const read = () => vm.runInNewContext(`(() => {${body}\n})()`, context);
assert.deepEqual(read().map(e => [e.id, e.store]), [['emp-seed-1', 'A'], ['emp-seed-2', 'A'], ['emp-seed-1', 'B']]);
assert.deepEqual(read().map(e => e.id), read().map(e => e.id), 'identity survives reopening');
roster.reverse();
assert.equal(read().find(e => e.name === 'No payroll records').id, 'emp-seed-2', 'identity must not depend on list order');
const dialog = fs.readFileSync('src/team/payroll/payroll-declaration-assignment-dialog.ts', 'utf8');
assert.ok(!dialog.includes('员工数据不完整'));
assert.ok(dialog.includes('family.languageDisplayName} · 已应用'));
assert.ok(!dialog.includes('cell.textContent = row.unavailableReason'), 'template column must remain a template');
console.log('Roster assignment identity and template display passed');
