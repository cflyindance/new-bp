import assert from 'node:assert/strict';
import fs from 'node:fs';
for (const file of ['dist/TipOut/payroll.html','src/team/payroll/payroll-template.html']) {
  const html=fs.readFileSync(file,'utf8');
  const hero=html.split('<div class="payroll-employee-hero-actions payroll-employee-hero-actions--rows">')[1]?.split('<div class="payroll-employee-metrics">')[0];
  assert.ok(hero, file);
  const rows=[...hero.matchAll(/<div class="payroll-employee-action-row">([\s\S]*?)<\/div>/g)].map(m=>[...m[1].matchAll(/data-action="([^"]+)"/g)].map(a=>a[1]));
  assert.deepEqual(rows,[['open-employee-identity-edit','open-employee-picker'],['refresh-employee-data','preview-employees-detail']]);
  assert.equal((hero.match(/class="btn btn-sm payroll-hero-btn"/g)||[]).length,4);
  assert.ok(!html.includes('class="btn payroll-workspace-action-btn" data-action="preview-employees-detail"'));
}
console.log('Payroll two-row employee actions passed');
