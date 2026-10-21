import assert from 'node:assert/strict';
import { assertBrandVersion, brandAccountStores, resolveBrandAccess, updateMenuKeys, type BrandAccessState } from '../src/config/brand-access-domain';
import type { Resource } from '../src/permissions/center-domain';

const resources=new Map<string,Resource>([
  ['module:orders',{key:'module:orders',title:'订单',type:'module'}],
  ['page:orders',{key:'page:orders',title:'订单列表',type:'page',parent:'module:orders'}],
  ['module:reports',{key:'module:reports',title:'报表',type:'module'}],
  ['page:reports',{key:'page:reports',title:'报表',type:'page',parent:'module:reports'}],
]);
const stores=['A','B','C'].map(id=>({id,title:id,brand:'brand',region:'region'}));
const account={id:'user',name:'测试员工',email:'user@menusifu.cn',password:'local-test',enabled:true,admin:false};
const state:BrandAccessState={schema:1,merchantId:'brand',version:0,accounts:[account],roles:[
  {id:'manager',name:'店长',description:'',system:false,grants:{'module:orders':'read','page:orders':'read'}},
  {id:'finance',name:'财务',description:'',system:false,grants:{'module:reports':'read','page:reports':'read'}},
],employees:[{id:'user',name:'测试员工',email:account.email,status:'enabled',overrides:{},bindings:[
  {id:'one',roleId:'manager',scope:{mode:'stores',ids:['A','B']}},
  {id:'two',roleId:'finance',scope:{mode:'stores',ids:['C']}},
]}],logs:[]};
const brand=new Set(resources.keys());
const ceilings=new Map(stores.map(s=>[s.id,new Set(brand)]));
const access=(storeIds:string[],key:string,admin=false,brandPerspective=false)=>resolveBrandAccess(state,{...account,admin},storeIds,key,stores,resources,brand,ceilings,brandPerspective);
assert.equal(access(['A'],'page:orders'),'read');
assert.equal(access(['B'],'page:orders'),'read');
assert.equal(access(['C'],'page:orders'),'hidden','店长角色不得泄漏到财务角色门店');
assert.equal(access(['A'],'page:reports'),'hidden');
assert.equal(access(['C'],'page:reports'),'read');
assert.equal(access(['A','C'],'page:orders'),'hidden','聚合操作必须全部目标店授权');
assert.equal(access(['foreign'],'page:orders',true),'hidden');
ceilings.set('A',new Set());
assert.equal(access(['A'],'page:orders'),'hidden','门店关闭高于角色授权');
assert.equal(access(['A'],'page:orders',true),'hidden','Admin 在门店业务视角不得绕过门店开通');
assert.equal(access(['A'],'page:orders',true,true),'read','Admin 品牌管理视角保持品牌菜单可见');
brand.delete('page:reports');
assert.equal(access(['C'],'page:reports',true,true),'hidden','Admin 不能超出品牌上限');
assert.deepEqual(brandAccountStores(state,{...account,admin:true},[...stores,{id:'D',title:'D',brand:'brand',region:''}]),['A','B','C','D']);
assert.deepEqual(brandAccountStores(state,{...account,enabled:false},stores),[]);
assert.deepEqual(updateMenuKeys(['old'],['new'],'add',new Set(['old','new'])),['new','old']);
assert.deepEqual(updateMenuKeys(['old'],['new'],'replace',new Set(['new'])),['new']);
assert.throws(()=>assertBrandVersion(2,1),/其他窗口/);
assert.doesNotThrow(()=>assertBrandVersion(2,2));
console.log('PASS: brand/store ceiling, split-role store binding, Admin scope, aggregate denial, batch add/replace, version conflict (17 assertions)');
