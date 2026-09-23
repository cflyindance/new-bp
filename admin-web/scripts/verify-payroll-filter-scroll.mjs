import assert from 'node:assert/strict';
import fs from 'node:fs';
const code=fs.readFileSync('src/team/payroll-page.ts','utf8');
const css=fs.readFileSync('src/team/payroll/payroll-polish.css','utf8');
assert.ok(code.includes('node.classList.contains("payroll-filter-popover")'));
assert.ok(code.indexOf('if (isFilterInteraction)') < code.indexOf('scrollOwner.scrollTop += event.deltaY'));
assert.match(css,/\.payroll-filter-options\s*\{[^}]*overscroll-behavior:\s*contain/);
console.log('Payroll filter scroll isolation passed');
