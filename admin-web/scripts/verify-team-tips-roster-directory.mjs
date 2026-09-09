import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const rows = [
  { id: 'busser-1', name: 'Carlos Lopez', role: 'Busser', store: '上海陆家嘴店' },
  { id: 'runner-1', name: 'Daniel Ortiz', role: 'Runner', store: '上海陆家嘴店' },
  { id: 'host-1', name: 'Rachel Scott', role: 'Host', store: '上海陆家嘴店' },
  { id: 'other-store', name: 'Other Host', role: 'Host', store: '广州天河店' }
];
const memory = { 'tipout-employees-roster-v1': JSON.stringify(rows) };
const context = {
  localStorage: {
    getItem: key => memory[key] ?? null,
    setItem: (key, value) => { memory[key] = String(value); }
  },
  CustomEvent: function CustomEvent(type) { this.type = type; },
  dispatchEvent() {}
};
context.window = context;
vm.runInNewContext(fs.readFileSync('src/team/tips/legacy/tipout-roster-directory.js.txt', 'utf8'), context);

const directory = context.TipOutRosterDirectory;
assert.equal(directory.canonicalRosterStoreName('Golden Dragon Chinese Kitchen - Dallas, TX 75231'), '上海陆家嘴店');
assert.deepEqual(Array.from(directory.listEmployees('Golden Dragon Chinese Kitchen - Dallas, TX 75231'), employee => employee.id), ['busser-1', 'runner-1', 'host-1']);

const validRule = { store: 'Golden Dragon Chinese Kitchen - Dallas, TX 75231', receivers: [
  { roles: ['Busser'] }, { roles: ['Runner'] }, { roles: ['Host'] }
] };
assert.deepEqual(Array.from(directory.resolveReceiverEmployees(validRule).employees, employee => employee.id), ['busser-1', 'runner-1', 'host-1']);
assert.equal(directory.validateRuleReferences(validRule).length, 0);

const missingRole = { ...validRule, receivers: [{ roles: ['Deleted Role'] }] };
assert.ok(directory.validateRuleReferences(missingRole).some(issue => issue.code === 'missing-role'));
const missingEmployee = { ...validRule, receivers: [{ roles: ['Busser'], employeeRefs: [{ employeeId: 'deleted-employee' }] }] };
assert.ok(directory.validateRuleReferences(missingEmployee).some(issue => issue.code === 'missing-employee'));

const rosterScope = fs.readFileSync('src/config/team-employee-roster-scope.ts', 'utf8');
for (const token of ['roster-tipout-golden-busser-carlos-lopez', 'roster-tipout-golden-runner-daniel-ortiz', 'roster-tipout-golden-host-rachel-scott']) {
  assert.ok(rosterScope.includes(token), `default receiver employee missing: ${token}`);
}

const distribution = fs.readFileSync('src/team/tips/programs/distribution.js.txt', 'utf8');
assert.ok(distribution.includes('validateRuleReferences(rule, selectedStore)'), 'allocation must validate roster references');
assert.ok(distribution.includes('resolveReceiverEmployees(rule, rawStore)'), 'reconciliation must resolve receiver employees from rules');
const editor = fs.readFileSync('src/team/tips/programs/rule-editor.js.txt', 'utf8');
assert.ok(editor.includes('TipOutRosterDirectory.listRoles()'), 'rule editor roles must use the shared directory');
assert.ok(editor.includes('TipOutRosterDirectory.listEmployees(getRuleEditorStoreName())'), 'rule editor employees must use the shared directory');

console.log('TipOut roster directory verification passed.');
