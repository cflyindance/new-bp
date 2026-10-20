import {renderAuditDiff} from '../src/permissions/center-audit-diff';
import assert from 'node:assert/strict';
import {seedDemoBindings} from '../src/permissions/center-demo-bindings';
import {resolveAccess,type CenterState,type Employee,type Resource} from '../src/permissions/center-domain';
const roles=['store-manager','cashier','floor-staff'].map(id=>({id,name:id,description:'',system:true,grants:{module:'read' as const,page:'read' as const,blocked:'hidden' as const}}));
const make=(id:string,name:string,email:string,ids:string[]):Employee=>({id,name,email,status:'enabled',bindings:ids.map(roleId=>({id:id+roleId,roleId,scope:{mode:'stores',ids:['s1']}})),overrides:{}});
const original:CenterState={schema:1,version:5,employeeAuthorization:'roles-only',demoAuditSeedVersion:1,roles,employees:[make('e001','王小明','xiaoming.wang@menusifu.cn',['store-manager']),make('e002','李收银','cashier.li@menusifu.cn',['cashier']),make('e003','张楼面','floor.zhang@menusifu.cn',['floor-staff','cashier']),{...make('hq001','陈总部','hq@example.com',[]),migrationReview:true}],logs:[]};
const stores=[{id:'s1',title:'上海店',brand:'brand',region:'east'},{id:'s2',title:'广州店',brand:'brand',region:'south'},{id:'other',title:'其他品牌门店',brand:'other',region:'east'}];
const before=JSON.stringify(original),next=seedDemoBindings(original,stores,'s1');
assert.equal(JSON.stringify(original),before);assert.deepEqual(next.roles,original.roles);assert.equal(next.version,6);assert.equal(next.demoBindingsSeedVersion,1);
assert.deepEqual(next.employees[0].bindings[0].scope.ids,['s1']);assert.deepEqual(next.employees[1].bindings[0].scope.ids,['s1','s2']);assert.deepEqual(next.employees[2].bindings.map(b=>b.scope.ids),[['s1'],['s2']]);assert.deepEqual(next.employees[3],original.employees[3]);assert.equal(next.logs.length,2);assert(next.logs.every(l=>l.source==='demo'&&l.action.includes('演示')));
for(const l of next.logs)assert.deepEqual(JSON.parse(l.after),next.employees.find(e=>e.id===l.objectId));
assert.equal(seedDemoBindings(next,stores,'s1'),next);
for(const mutate of [(s:CenterState)=>{s.employees[1].name='用户改名'},(s:CenterState)=>{s.employees[1].bindings=[]},(s:CenterState)=>{s.employees[1].bindings[0].scope.ids=['other']},(s:CenterState)=>{s.employees[1].status='disabled'},(s:CenterState)=>{s.employees[1].migrationReview=true},(s:CenterState)=>{s.logs.push({id:'real',at:'',actor:'管理员',objectId:'e002',action:'更新员工授权',before:'{}',after:'{}'})},(s:CenterState)=>{s.logs.push({id:'real-role',at:'',actor:'管理员',objectId:'cashier',action:'更新角色权限',before:'{}',after:'{}'})}]){
 const s=structuredClone(original);mutate(s);const seeded=seedDemoBindings(s,stores,'s1');assert.deepEqual(seeded.employees[1],s.employees[1]);assert.deepEqual(seeded.logs.filter(l=>l.source!=='demo'),s.logs);
}
assert.deepEqual(seedDemoBindings(original,[stores[0]],'s1').employees[1],original.employees[1]);assert.deepEqual(seedDemoBindings(original,stores,'missing').employees,original.employees);
const resources=new Map<string,Resource>([['module',{key:'module',title:'模块',type:'module'}],['page',{key:'page',title:'页面',type:'page',parent:'module'}],['blocked',{key:'blocked',title:'拒绝页面',type:'page',parent:'module'}]]);
assert.equal(resolveAccess(next,'e002','s2','page',stores,resources),'read');assert.equal(resolveAccess(next,'e002','other','page',stores,resources),'hidden');assert.equal(resolveAccess(next,'e002','s2','blocked',stores,resources),'hidden');assert.equal(resolveAccess(next,'hq001','s1','page',stores,resources),'hidden');
for(const log of next.logs)assert(!renderAuditDiff(log,{state:next,stores,brands:[],resources}).includes('demoAuthorization'));

console.log('PASS: demo binding scenarios, strict pristine guard, real employee/role log protection, same-brand scope, no role grant changes, idempotence and deny gates');
