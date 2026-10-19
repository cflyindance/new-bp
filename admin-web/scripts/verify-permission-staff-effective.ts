import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {effectiveMenuView} from '../src/permissions/center-effective-menu';
import {buildCenterCatalog,type Catalog,type MenuNode} from '../src/permissions/center-catalog';
import {resolveAccess,type Access,type CenterState,type Resource} from '../src/permissions/center-domain';
import {renderPermissionEditor} from '../src/permissions/center-editor';

const resources=new Map<string,Resource>([
 ['m',{key:'m',title:'模块',type:'module'}],
 ['a',{key:'a',title:'只读页',type:'page',parent:'m'}],
 ['b',{key:'b',title:'编辑页',type:'page',parent:'m'}],
 ['deny',{key:'deny',title:'拒绝页',type:'page',parent:'m'}],
 ['empty',{key:'empty',title:'空模块',type:'module'}],
 ['x',{key:'x',title:'无权限子页',type:'page',parent:'empty'}],
]);
const tree:MenuNode[]=[{id:'directory',title:'组织目录',children:[{id:'m',key:'m',title:'模块',children:['a','b','deny'].map(key=>({id:key,key,title:resources.get(key)!.title,children:[]}))}]},{id:'empty',key:'empty',title:'空模块',children:[{id:'x',key:'x',title:'无权限子页',children:[]}]}];
const c:Catalog={resources,tree,groups:new Map()};
const stores=[{id:'s1',title:'门店1',brand:'brand',region:'region'},{id:'s2',title:'门店2',brand:'other',region:'region'}];
const state:CenterState={schema:1,version:1,employeeAuthorization:'roles-only',logs:[],roles:[{id:'r1',name:'R1',description:'',system:false,grants:{m:'read',a:'read'}},{id:'r2',name:'R2',description:'',system:false,grants:{m:'read',b:'read',empty:'read'}}],employees:[{id:'e',name:'员工',email:'e@example.com',status:'enabled',overrides:{},bindings:[{id:'b1',roleId:'r1',scope:{mode:'stores',ids:['s1']}},{id:'b2',roleId:'r2',scope:{mode:'brands',ids:['brand']}}]}]};
const value=(store:string)=>(key:string)=>resolveAccess(state,'e',store,key,stores,resources);
const keys=(nodes:MenuNode[]):string[]=>nodes.flatMap(n=>[...(n.key?[n.key]:[]),...keys(n.children)]);
const before=JSON.stringify({state,tree});
const view=effectiveMenuView(c,value('s1'),'deny');
assert.deepEqual(keys(view.tree),['m','a','b']);assert.equal(view.page,'a');
assert.equal(effectiveMenuView(c,value('s1'),'b').page,'b');
assert.deepEqual(effectiveMenuView(c,value('s2'),'b'),{tree:[],page:''});
state.roles[0].grants.m='hidden';state.roles[1].grants.m='hidden';
assert.equal(effectiveMenuView(c,value('s1'),'a').page,'');
state.roles[0].grants.m='read';state.roles[1].grants.m='read';
assert.equal(JSON.stringify({state,tree}),before,'Viewing must not change grants or catalog');
const options={catalog:c,page:'deny',group:'',preview:false,readonly:true,staff:false,effectiveOnly:true,value:value('s1'),own:()=> 'inherit' as const,search:''};
const html=renderPermissionEditor(options);
assert.match(html,/<h2>只读页<\/h2>/);assert(!html.includes('拒绝页'));assert(!html.includes('空模块'));
assert.doesNotMatch(html,/data-grant=|data-authorization=|data-category-grant=/);
const moduleHtml=renderPermissionEditor({...options,page:'m'});assert(!moduleHtml.includes('拒绝页'),'Child menu table must be filtered too');
assert(!renderPermissionEditor({...options,search:'拒绝页'}).includes('data-page='),'Search must not restore denied menus');
assert(renderPermissionEditor({...options,search:'模块'}).includes('data-page="a"'),'Parent search retains allowed children');
assert(renderPermissionEditor({...options,effectiveOnly:false,readonly:false}).includes('data-page="deny"'),'Role editor retains full catalog');
const empty=renderPermissionEditor({...options,value:value('s2')});assert(empty.includes('该员工在当前门店暂无可访问菜单'));assert(!empty.includes('data-page='));
// Explicit read/edit callback values both remain visible; denied parent still prunes its subtree.
const editValue=(key:string):Access=>key==='a'?'edit':key==='m'?'read':'hidden';
assert.deepEqual(keys(effectiveMenuView(c,editValue,'').tree),['m','a']);
assert.deepEqual(keys(effectiveMenuView(c,key=>key==='a'?'edit':'hidden','').tree),[]);
const real=buildCenterCatalog();
const realBefore=JSON.stringify([...real.resources]);
const realView=effectiveMenuView(real,()=> 'hidden','');assert.equal(realView.page,'');assert.deepEqual(realView.tree,[]);
assert.equal(JSON.stringify([...real.resources]),realBefore);
const full=structuredClone(state);
full.roles=[{id:'full',name:'完整角色',description:'',system:false,grants:Object.fromEntries([...real.resources.values()].map(r=>[r.key,r.type==='action'||r.type==='setting'?'edit':'read']))}];
full.employees[0].bindings=[{id:'full',roleId:'full',scope:{mode:'stores',ids:['s1']}}];
const realValue=(key:string)=>resolveAccess(full,'e','s1',key,stores,real.resources);
const deniedPage=[...real.resources.values()].find(r=>r.type==='page'&&realValue(r.key)!=='hidden')!;
full.roles[0].grants[deniedPage.key]='hidden';
const realProjection=effectiveMenuView(real,realValue,deniedPage.key);
assert(!keys(realProjection.tree).includes(deniedPage.key));assert.notEqual(realProjection.page,deniedPage.key);
for(const key of keys(realProjection.tree))assert.notEqual(realValue(key),'hidden',key);
const projectionKeys=new Set(keys(realProjection.tree));
const realHtml=renderPermissionEditor({...options,catalog:real,page:deniedPage.key,value:realValue});
for(const match of realHtml.matchAll(/data-page="([^"]+)"/g))assert(projectionKeys.has(match[1]),match[1]);
assert.doesNotMatch(realHtml,/data-grant=|data-authorization=|data-category-grant=/);
// Opening, switching store, and restoring the store reuse the projection without changing state.
const fullBefore=JSON.stringify(full);
assert.equal(effectiveMenuView(real,key=>resolveAccess(full,'e','s2',key,stores,real.resources),realProjection.page).page,'');
assert.equal(effectiveMenuView(real,realValue,'').page,realProjection.page);
assert.equal(JSON.stringify(full),fullBefore);
const ui=readFileSync('src/permissions/center-ui.ts','utf8');assert(ui.includes('effectiveOnly:!!employeeId'));assert(ui.includes('effectiveMenuView(catalog,value,selectedPage)'));
console.log('PASS staff effective menus: role union, scope/store switch, denied ancestors, pruning, fallback, empty/search, readonly and unchanged role editor');
