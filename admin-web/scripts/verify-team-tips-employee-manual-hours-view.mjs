import fs from 'node:fs'; import assert from 'node:assert/strict';
const template = fs.readFileSync('src/team/tips/templates/employee-reconciliation.html','utf8');
const program = fs.readFileSync('src/team/tips/programs/employee-reconciliation.js.txt','utf8');
for (const label of ['手动工时','混合工时']) assert.ok(template.includes(`<option value="${label}">${label}</option>`));
assert.ok(template.includes('employeeDetailManualHours'));
for (const token of ['hourLines','hasPunchException','workHourSource','attendanceNote','manualHourDetails']) assert.ok(program.includes(token), token);
assert.ok(program.includes('个小费池 / '));
assert.ok(program.includes("attendance.hasPunchException && attendance.status === '混合工时'"), 'abnormal secondary badge must be limited to mixed hours');
console.log('Employee manual-hours view verification passed.');
