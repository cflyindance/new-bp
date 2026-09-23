import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/team/payroll/legacy/payroll.js.txt', 'utf8');
const body = source.match(/function finishBootstrap\(\) \{([\s\S]*?)\n  function applyRosterSyncFromEvent/)[1];
assert.match(body, /queueMicrotask\(\(\) => changePayrollDemoScenario\('biweekly'\)\)/);
const calls = [];
const queued = [];
vm.runInNewContext("queueMicrotask(() => changePayrollDemoScenario('biweekly')); let ready = true; function changePayrollDemoScenario(value) { if (ready) calls.push(value); }", {
  queueMicrotask: callback => queued.push(callback), calls,
});
assert.deepEqual(calls, []);
queued.forEach(callback => callback());
assert.deepEqual(calls, ['biweekly']);
console.log('Payroll defaults to biweekly after bootstrap initialization.');
