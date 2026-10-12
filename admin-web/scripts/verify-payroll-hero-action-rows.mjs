import assert from 'node:assert/strict';
import fs from 'node:fs';
for (const file of ['dist/TipOut/payroll.html','src/team/payroll/payroll-template.html']) {
  const html=fs.readFileSync(file,'utf8');
  const hero=html.split('<div class="payroll-employee-hero-actions payroll-employee-hero-actions--rows">')[1]?.split('<div class="payroll-employee-metrics">')[0];
  assert.ok(hero, file);
  const rows=[...hero.matchAll(/<div class="payroll-employee-action-row">([\s\S]*?)<\/div>/g)].map(m=>[...m[1].matchAll(/data-action="([^"]+)"/g)].map(a=>a[1]));
  assert.deepEqual(rows,[['refresh-employee-data','open-employee-picker','toggle-employee-more-menu','preview-employees-detail','preview-adp-report','open-employee-identity-edit']]);
  assert.match(hero,/id="payroll-employee-more-menu" role="menu" hidden/);
  assert.equal((hero.match(/role="menuitem"/g)||[]).length,3);
  assert.ok(!html.includes('class="btn payroll-workspace-action-btn" data-action="preview-employees-detail"'));
}
console.log('Payroll employee actions: update, switch and more menu passed');
