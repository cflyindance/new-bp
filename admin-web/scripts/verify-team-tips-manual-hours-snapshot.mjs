import fs from 'node:fs'; import assert from 'node:assert/strict';
const distribution = fs.readFileSync('src/team/tips/programs/distribution.js.txt','utf8');
const summary = fs.readFileSync('src/team/tips/legacy/tipout-summary-ui.js.txt','utf8');
assert.ok(distribution.includes('listForEmployee(dateKey, emp.name)'));
assert.ok(distribution.includes('manualHourEntries'));
assert.ok(summary.includes('row.manualHourEntries.map'));
console.log('Manual hours snapshot verification passed.');
