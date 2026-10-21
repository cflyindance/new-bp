import assert from 'node:assert/strict';
import {buildCurrentSystemMenuGroups} from '../src/config/nav-blueprint-current-tree';
const groups=buildCurrentSystemMenuGroups();
const clock=groups.find(g=>g.moduleId==='team')!.tree.children.find(n=>n.resource.title==='员工打卡')!;
assert.deepEqual(clock.children.map(n=>n.resource.title),['打卡管理','考勤记录','规则设置']);
assert.deepEqual(clock.children.map(n=>n.resource.path),['/team/clock-in/live','/team/clock-in/records','/team/clock-in/rules']);
for(const group of groups){const walk=(n:any)=>{const ids=n.children.map((c:any)=>`${c.resource.title}|${c.resource.path??''}`);assert.equal(new Set(ids).size,ids.length,`duplicate children ${n.resource.key}`);n.children.forEach(walk);};walk(group.tree);}
console.log('PASS unique current menu siblings and clock routes');
import {compactBrandMenuRows} from '../src/config/brand-menu-presentation';
const store=groups.find(g=>g.moduleId==='store-mgmt')!;
const choices:any[]=[];
const collect=(n:any,d=1)=>{const r=n.resource;choices.push({key:r.key,title:r.title,parent:r.parentKey,level:d,kind:r.seq!=null?'setting':'menu',isPage:!r.seq&&!r.groupKey&&r.customL2MountKind==='page'});n.children.forEach((c:any)=>collect(c,d+1));};collect(store.tree);
const before=JSON.stringify(choices),rows=compactBrandMenuRows(choices);
assert.equal(rows.filter(c=>c.title==='门店档案').length,1);
assert.equal(rows.filter(c=>c.title==='营业时间').length,1);
assert.equal(rows.find(c=>c.title==='营业时段')!.level,3);
assert.equal(JSON.stringify(choices),before,'presentation must preserve raw grant identities');
console.log('PASS compact store rows preserve all raw grant keys');
