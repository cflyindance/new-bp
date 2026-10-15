import assert from 'node:assert/strict';
import fs from 'node:fs';
import { NAV_MODULES, navModuleChildrenAsSheetSubnav } from '../src/config/navigation';
import { buildCenterCatalog, pageKey, navigationKey } from '../src/permissions/center-catalog';
import { payrollViewFromPath } from '../src/team/payroll/payroll-navigation';
const team = NAV_MODULES.find(m => m.id === 'team')!;
const payroll = navModuleChildrenAsSheetSubnav(team).find(n => n.id === 'team-tax-payroll')!;
const paths = ['/team/payroll-report', '/team/payroll-report/schedule-settings', '/team/payroll-report/declaration-settings'];
assert.deepEqual(payroll.sidebarChildren?.map(n => [n.title, n.path]), paths.map((path,i) => [['薪资报表','发薪周期设置','员工声明设置'][i],path]));
const catalog = buildCenterCatalog();
paths.forEach((path,i) => {
  assert.equal(catalog.resources.get(pageKey(path))?.parent, navigationKey('team','team-tax-payroll'));
  assert.equal(payrollViewFromPath(`#${path}/`), ['report','schedule','declarations'][i]);
});
const mount = fs.readFileSync('src/main.ts','utf8');
assert.match(mount,/payrollRoot\.replaceWith\(retainedPayrollRoot\)/);
assert.match(mount,/activePayrollPage\.setPath\(location.hash\)/);
const page = fs.readFileSync('src/team/payroll-page.ts','utf8');
assert.doesNotMatch(fs.readFileSync('src/team/payroll/payroll-declaration-settings.ts','utf8'), /企业声明模板库|维护员工确认时使用的已审核语言版本|<p>薪资管理<\/p>/);
assert.doesNotMatch(fs.readFileSync('src/team/payroll/payroll-schedule-controller.ts','utf8'), /payroll-schedule-current|示例规则 ·|实际规则只读|全部规则与历史/);
assert.match(page,/routeMode: true/);
assert.match(page,/container.closest<HTMLElement>\("\[data-team-payroll-scroll\]"\)/);
for (const file of ['payroll-declaration-settings.ts','payroll-schedule-controller.ts']) {
  const source = fs.readFileSync(`src/team/payroll/${file}`,'utf8');
  assert.doesNotMatch(source, /返回薪资管理/);
  assert.match(source, /<header class="[^"]*payroll-settings-heading[^"]*">[\s\S]*?<div class="payroll-workspace-actions"><button type="button" class="btn btn-primary payroll-workspace-action-btn" data-(?:declaration-new|add)[\s\S]*?<\/header>/);
}
console.log('Payroll child navigation, routes, permission parent and runtime retention passed');
