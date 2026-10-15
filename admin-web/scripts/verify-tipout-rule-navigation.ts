import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NAV_MODULES, navModuleChildrenAsSheetSubnav} from '../src/config/navigation';
import {buildCenterCatalog, pageKey, navigationKey} from '../src/permissions/center-catalog';
const team = NAV_MODULES.find(m=>m.id==='team')!;
const tips = navModuleChildrenAsSheetSubnav(team).find(n=>n.id==='team-tips')!;
assert.deepEqual(tips.sidebarChildren?.map(n=>[n.title,n.path]),[
  ['小费分配','/team/tips/distribution'], ['分配规则','/team/tips/rules'],
]);
const catalog=buildCenterCatalog();
for(const path of ['/team/tips/distribution','/team/tips/rules','/team/tips/details']) {
  assert.equal(catalog.resources.get(pageKey(path))?.parent,navigationKey('team','team-tips'),'retain existing permission parent');
}
const program=fs.readFileSync('src/team/tips/programs/distribution.js.txt','utf8');
assert.doesNotMatch(program,/openSummaryRuleEntry/);
for (const file of ['src/team/tips/templates/distribution.html','dist/TipOut/index.html']) {
  assert.doesNotMatch(fs.readFileSync(file,'utf8'),/summaryRuleEntryBtn|openSummaryRuleEntry/);
}
for (const file of ['src/team/tips/templates/rules.html','dist/TipOut/rules.html']) {
  assert.doesNotMatch(fs.readFileSync(file,'utf8'),/返回小费分配/);
}
console.log('Tip sidebar navigation, permission keys and removed page shortcuts passed');
