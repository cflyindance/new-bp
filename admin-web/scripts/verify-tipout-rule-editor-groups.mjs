import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';import {execFileSync} from 'node:child_process';
const html=fs.readFileSync('src/team/tips/templates/rule-editor.html','utf8');
const ids=['ruleSectionBasic','poolSettingsGroup','sharedPoolRulesSection','allocationModeSection','allocationRulesGroup','legacyReceiversSection','allocationScopeSection','dailyParticipationSection','employeeDistributionMethodSection','distributionSection','workHoursConfigPanel','contributorRulesGroup','deductRulesSection'];
let last=-1;for(const id of ids){const at=html.indexOf('id="'+id+'"');assert.ok(at>last,'section order: '+id);assert.equal(html.split('id="'+id+'"').length-1,1);last=at;}
assert.match(html,/id="contributorRulesGroup"[^>]*aria-labelledby="contributorRulesTitle"/);
assert.match(html,/接收员工的打卡要求不决定贡献资格/);
const before=execFileSync('git',['show','916bcdcf:admin-web/src/team/tips/templates/rule-editor.html'],{encoding:'utf8'});
for(const id of [...before.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]))assert.ok(html.includes('id="'+id+'"'),'preserve existing ID '+id);
const js=fs.readFileSync('src/team/tips/programs/rule-editor.js.txt','utf8');let mode='legacy_pool',surcharge=false;const group={style:{}};
const ctx={document:{getElementById:()=>group,querySelector:()=>({value:mode})},isSurchargePoolKind:()=>surcharge};vm.createContext(ctx);
vm.runInContext(js.slice(js.indexOf('    function syncContributorGroupVisibility('),js.indexOf('    function updateDeductRulesVisibility(')),ctx);
ctx.syncContributorGroupVisibility();assert.equal(group.style.display,'');mode='order_tip_then_residual';ctx.syncContributorGroupVisibility();assert.equal(group.style.display,'none');mode='legacy_pool';surcharge=true;ctx.syncContributorGroupVisibility();assert.equal(group.style.display,'none');
console.log('PASS rule editor groups: basic, pool settings, receivers, scope with clock requirement, method with hours settings, contributions, separate contributions; IDs unique');
