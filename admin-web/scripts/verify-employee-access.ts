import {mEmployeePermissionPages,employeeWorkbenchSurface} from '../src/permissions/employee-access-domain';
import type {MState} from '../src/permissions/m-platform-domain';
import assert from 'node:assert/strict';
import { employeeAccessRoute,providerEmployeeSummary,employeeMerchantPreviewAccess } from '../src/permissions/employee-access-domain';
import {createProviderDemoState} from '../src/permissions/provider-access-demo';
import {type Resource} from '../src/permissions/center-domain';
import {mPageForPath} from '../src/permissions/m-platform-catalog';
const resources=new Map<string,Resource>([
 ['module:orders',{key:'module:orders',title:'订单',type:'module'}],
 ['page:/orders/all',{key:'page:/orders/all',title:'全部订单',type:'page',parent:'module:orders'}],
]);
const state=createProviderDemoState(resources,{brandIds:['b1','b2'],storeIds:['s1','s2'],employees:[{id:'ent002',name:'周'},{id:'ent003',name:'吴'},{id:'ent004',name:'郑'}]});
assert.match(providerEmployeeSummary(state,'ent003'),/订单查看员 · 2 家门店/);
assert.match(providerEmployeeSummary(state,'ent002'),/1 个品牌/);
assert.match(providerEmployeeSummary(state,'ent001'),/全部品牌/);
assert.equal(providerEmployeeSummary(state,'missing'),'未配置');
for(const suffix of ['roles','roles/preview','merchant-access','']){
 const path='/m-platform/permissions/staff/ent003'+(suffix?'/'+suffix:'');
 assert.equal(employeeAccessRoute(path)?.id,'ent003');assert.equal(mPageForPath(path)?.id,'staff');
 assert.equal(employeeAccessRoute(path)?.preview,suffix==='roles/preview'||suffix==='');
}
assert.equal(employeeAccessRoute('/m-platform/permissions/staff/%E0/roles'),undefined);
assert.equal(employeeAccessRoute('/m-platform/permissions/staff/ent003/unrelated'),undefined);
const ceiling=new Set(resources.keys()),key='page:/orders/all';
const resolve=(target:{brandId:string;storeId?:string},brand=ceiling,store:Set<string>|undefined=ceiling,enabled=true)=>employeeMerchantPreviewAccess(state,'ent003',target,key,resources,brand,store,enabled);
assert.equal(resolve({brandId:'b1',storeId:'s1'}),'read');
assert.equal(resolve({brandId:'b1',storeId:'s3'}),'hidden');
assert.equal(resolve({brandId:'b1'}),'hidden','store binding cannot preview brand rights');
assert.equal(resolve({brandId:'b1',storeId:'s1'},new Set()),'hidden','brand entitlement gates preview');
assert.equal(resolve({brandId:'b1',storeId:'s1'},ceiling,new Set()),'hidden','store entitlement gates preview');
assert.equal(resolve({brandId:'b1',storeId:'s1'},ceiling,ceiling,false),'hidden','disabled account never has effective preview');
console.log('PASS: unified/legacy routes, separate summaries, employee scope and brand/store ceilings, disabled-account preview');

assert.equal(employeeWorkbenchSurface('#/m-platform/permissions/staff/ent003/merchant-access'),'merchant');
assert.equal(employeeWorkbenchSurface('/m-platform/permissions/staff/ent003/roles/preview?surface=merchant'),'merchant');
assert.equal(employeeWorkbenchSurface('/m-platform/permissions/staff/ent003/roles?surface=unknown'),'m');
const mSaved:MState={schema:1,revision:3,roles:[{id:'hardware-reader',name:'设备查看员',description:'',grants:{'m:module:hardware':'read','m:page:devices':'read','m:action:devices:export':'edit'}}],employees:[{id:'test',roleIds:['hardware-reader']}],logs:[]};
const original=JSON.stringify(mSaved),effective=mEmployeePermissionPages(mSaved,'test',true);
assert.equal(effective.find(p=>p.page.id==='devices')?.access,'read');
assert.equal(effective.find(p=>p.page.id==='devices')?.actions.find(a=>a.id==='export')?.allowed,true,'independent output action remains allowed on read-only page');
assert.equal(effective.find(p=>p.page.id==='staff')?.access,'hidden');
assert.equal(effective.find(p=>p.page.id==='staff')?.actions.every(a=>!a.allowed),true);
assert.equal(mEmployeePermissionPages(mSaved,'test',false).every(p=>p.access==='hidden'&&p.actions.every(a=>!a.allowed)),true);
assert.equal(mEmployeePermissionPages(mSaved,'missing',true).every(p=>p.access==='hidden'),true);
assert.equal(JSON.stringify(mSaved),original,'building the effective menu never modifies the saved snapshot');
console.log('PASS: workbench surfaces, menu access/action separation, disabled/unknown employee and immutable saved snapshot');
