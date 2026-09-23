import assert from 'node:assert/strict';
import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/team/payroll/payroll-polish.css', import.meta.url), 'utf8');
assert.match(css, /:host \.payroll-schedule-dialog\s*,\s*:host #payroll-schedule-week-dialog\s*\{[^}]*margin:\s*auto\s*;/, 'Schedule dialogs must override reset margins to center in the viewport');
console.log('Payroll dialog centering contract passed');
