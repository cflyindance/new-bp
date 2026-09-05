import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/team/payroll/payroll-page.css', import.meta.url), 'utf8');
const match = css.match(/#payrollExportConfirmModal\.modal-overlay\.show\s*\{[^}]*z-index:\s*(\d+)/);

assert.ok(match, 'ADP export confirmation modal must define an explicit visible-state z-index');
assert.ok(Number(match[1]) > 1100, 'ADP export confirmation modal must render above the ADP report preview modal');

console.log('Payroll ADP export modal layering verification passed.');
