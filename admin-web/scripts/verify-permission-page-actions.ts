import './verify-permission-payroll-pages';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {additionalPageActions} from '../src/permissions/center-actions';
for(const action of additionalPageActions['/team/payroll-report']) {
  assert(readFileSync(action.source,'utf8').includes(action.control),`Missing source: ${action.control}`);
}
assert(!additionalPageActions['/team/reports/payroll']);
assert.match(readFileSync('src/permissions/center-ui.ts','utf8'),/dialog\.addEventListener\('keydown',[\s\S]*?Escape[\s\S]*?stopPropagation\(\)/);
console.log('PASS source-backed payroll actions and dialog draft protection');
