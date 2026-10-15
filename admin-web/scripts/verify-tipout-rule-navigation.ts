import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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
const handler=program.match(/    function openSummaryRuleEntry\(\) \{[\s\S]*?\n    \}/)![0];
for(const rules of [[],[{id:'r1'}]]) {
  let saved=false;
  const window={location:{href:''},ruleData:{getRules:()=>rules}};
  vm.runInNewContext(handler+';openSummaryRuleEntry();',{window,captureSummaryUiState:()=>{saved=true;}});
  assert.equal(window.location.href,'rules.html');
  assert.equal(saved,true);
}
assert.match(fs.readFileSync('src/team/tips/templates/distribution.html','utf8'),/id="summaryRuleEntryBtn"[^>]*>规则管理</);
console.log('Tip rules navigation, existing permission keys and empty/nonempty shortcut passed');
