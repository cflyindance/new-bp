import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NAV_MODULES, navModuleChildrenAsSheetSubnav, groupRuleRestrictionsSubnav, getActiveNavModuleSheetSubPath } from '../src/config/navigation';

const module = NAV_MODULES.find(m => m.id === 'queue-call')!;
const raw = navModuleChildrenAsSheetSubnav(module);
const original = JSON.stringify(raw);
for (const [limits, buffet, count] of [[true,true,3],[true,false,2],[false,true,1],[false,false,0]] as const) {
  const input = raw.filter(i => (i.id !== 'qc-menu-order-limits' || limits) && (i.id !== 'foh-buffet-rules' || buffet));
  const output = groupRuleRestrictionsSubnav(input);
  assert.equal(output.some(i => i.id === 'foh-buffet-rules'), false);
  assert.equal(output.some(i => i.id === 'qc-menu-order-limits'), limits);
  assert.equal(output.find(i => i.id === 'qc-rule-restrictions')?.sidebarChildren?.length ?? 0, count);
  assert.equal(output.find(i => i.id === 'qc-menu-order-limits')?.sidebarChildren, undefined);
}
assert.equal(JSON.stringify(raw), original, 'input must remain unchanged');
const base = '/operations/queue-call/menu-order-limits';
const grouped = groupRuleRestrictionsSubnav(raw);
assert.deepEqual(grouped.find(i => i.id === 'qc-rule-restrictions')!.sidebarChildren!.map(i => i.title), ['每轮菜品互斥/组合','其他设置','自助餐规则']);
assert.equal(getActiveNavModuleSheetSubPath(base,module),base);
for (const path of [base+'/dish-round',base+'/other','/operations/queue-call/buffet-rules']) {
  assert.equal(getActiveNavModuleSheetSubPath(path,module),grouped.find(i=>i.id==='qc-rule-restrictions')!.path);
}
assert.equal(groupRuleRestrictionsSubnav([{...raw.find(i=>i.id==='qc-menu-order-limits')!, sidebarChildren:[]}]).some(i=>i.id==='qc-rule-restrictions'),false);
const ui=readFileSync(new URL('../src/config/foh-menu-order-limits-ui.ts',import.meta.url),'utf8');
assert.ok(!ui.includes('data-menu-order-limit-tablist'));
assert.ok(ui.includes('bindOrderLimitFullscreenFlow(root)'));
assert.ok(ui.includes('bindDishRoundUnifiedWorkspace(root)'));
console.log('rule restrictions navigation: PASS (visibility matrix, immutability, active paths, empty group and panel contract)');
