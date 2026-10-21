import { installBrandAccessRuntime } from '../auth/brand-access-runtime';
import { centerKeysForRaw } from './brand-menu-catalog';
export { centerKeysForRaw } from './brand-menu-catalog';
import { buildCenterCatalog, actionKey, pageKey, settingKey, type Catalog } from '../permissions/center-catalog';
import { additionalPageActions } from '../permissions/center-actions';
import { type Resource, type Access, type Store } from '../permissions/center-domain';
import { buildPermissionResourceIndex } from './permission-registry';
import { buildMerchantServiceTreeIndex, brandStoreSelectableCeiling, resolveMerchantServiceProductLine } from './enterprise-merchant-services';
import { getEnterpriseMerchantSnapshot, getMerchantById, getMerchantCapability, getMerchantStores, getMerchantRegions, getStoreCapability } from './enterprise-merchant-store';
import { getAuthenticatedEmail } from '../auth/login';
import { readActiveImpersonation } from './enterprise-merchant-impersonate';
import { assertBrandVersion, brandAccountStores, resolveBrandAccess, type BrandAccessState, type BrandAccount } from './brand-access-domain';
import { validateCenterState } from '../permissions/center-persistence';
import type { UserSessionContext } from '../auth/session-permissions';
import { isNavHomePath } from './app-routes';
import { getModuleSettingsBasePath } from './module-settings-catalog';

export const BRAND_ACCESS_KEY = 'menusifu:brand-access:v1:';
export const brandAccessKey = (id: string) => BRAND_ACCESS_KEY + id;
export const brandIdentity=(id:string)=>{const merchant=getMerchantById(id);return merchant?{name:merchant.name,groupId:merchant.groupId,regions:getMerchantRegions(id)}:null;};
export function brandPrimaryAdminEmail(id:string):string {
  return readBrandAccess(id).accounts.find(a=>a.admin&&a.enabled)?.email??getMerchantById(id)?.primaryAdminEmail??'';
}
export const brandStores = (id: string): Store[] => getMerchantStores(id).map(s => ({id:s.storeId,title:s.name,brand:id,region:s.regionId}));

export function readBrandAccess(id: string): BrandAccessState {
  const raw = localStorage.getItem(brandAccessKey(id));
  if (!raw) return {schema:1,employeeAuthorization:'roles-only',merchantId:id,version:0,accounts:[],roles:[],employees:[],logs:[]};
  const state = JSON.parse(raw) as BrandAccessState;
  if (state.schema !== 1 || state.merchantId !== id || !Array.isArray(state.accounts) || !Array.isArray(state.roles) || !Array.isArray(state.employees)) throw Error('品牌账号数据无法读取，原数据已保留。');
  return state;
}

export function brandRawMenuKeys(id: string): Set<string> {
  const cap = getMerchantCapability(id);
  if (!cap) return new Set();
  if(cap.menuGrantMode==='explicit')return new Set(cap.services.filter(s=>s.enabled).map(s=>s.nodeKey??s.serviceId));
  return new Set(cap.productLineIds.flatMap(pl => [...brandStoreSelectableCeiling(cap, resolveMerchantServiceProductLine([pl]))]));
}


export function brandCatalog(id: string): {catalog: Catalog; ceiling: Set<string>} {
  const catalog = buildCenterCatalog();
  const derived=centerKeysForRaw(brandRawMenuKeys(id),catalog);
  const manifest=getMerchantCapability(id)?.menuResourceKeys;
  return {catalog,ceiling:manifest?new Set([...derived].filter(k=>manifest.includes(k))):derived};
}

export interface MenuChoice {key:string;title:string;parent?:string;path?:string;level:number;kind:'menu'|'setting';isPage?:boolean}
export function brandMenuChoices(productLines: string[] = ['pos']): MenuChoice[] {
  const choices = new Map<string,MenuChoice>();
  for (const pl of productLines) {
    const index = buildMerchantServiceTreeIndex(resolveMerchantServiceProductLine([pl]));
    const visit = (node: typeof index.groups[number]['tree'],depth=1) => {
      const r=node.resource;
      if (r.actionId) return;
      const title=r.title;
      choices.set(r.key,{key:r.key,title,parent:r.parentKey,path:r.path,level:depth,kind:r.seq!=null?'setting':'menu',isPage:r.seq==null&&!r.groupKey&&(r.customL3MountKind==='page'||r.customL2MountKind==='page'||r.level===2&&r.customL2MountKind!=='features')});
      node.children.forEach(child=>visit(child,depth+1));
    };
    index.groups.forEach(g=>visit(g.tree));
  }
  return [...choices.values()];
}

type Principal={merchantId:string;account:BrandAccount;state:BrandAccessState};
let principalBusy=false;
let principalTick:Principal|null|undefined;
let principalIdentity='';
export function currentBrandPrincipal(): Principal | null {
  if(principalBusy)return null;
  const impersonation=readActiveImpersonation();
  const identity=`${getAuthenticatedEmail()??''}:${impersonation?.sessionId??''}`;
  if(identity!==principalIdentity){principalIdentity=identity;principalTick=undefined;runtimeTick=undefined;}
  if(principalTick!==undefined)return principalTick;
  principalBusy=true;
  try { principalTick=resolveBrandPrincipal();queueMicrotask(()=>{principalTick=undefined;runtimeTick=undefined;});return principalTick; }
  finally {principalBusy=false;}
}
function resolveBrandPrincipal(): Principal | null {
  const impersonation=readActiveImpersonation();
  const email=(impersonation?.impersonatedAsEmail??getAuthenticatedEmail()??'').toLowerCase();
  if (!email) return null;
  const snap=getEnterpriseMerchantSnapshot();
  for (const merchant of snap.merchants) {
    if (impersonation && merchant.merchantId!==impersonation.merchantId) continue;
    const state=readBrandAccess(merchant.merchantId);
    const explicit=state.accounts.find(a=>a.email.toLowerCase()===email);
    const active=merchant.status==='active'||merchant.status==='onboarding';
    if (explicit) return {merchantId:merchant.merchantId,account:active?explicit:{...explicit,enabled:false},state};
    // Preserve existing primary Admins. New brands require explicit account provisioning.
    if (!merchant.accountProvisioningRequired && merchant.primaryAdminEmail?.toLowerCase()===email) return {merchantId:merchant.merchantId,state,account:{id:`admin:${merchant.merchantId}`,name:'品牌 Admin',email,enabled:active,admin:true,password:''}};
  }
  return null;
}

export function authorizeBrandManagement(id:string,source:'m-platform'|'merchant'): string {
  const principal=currentBrandPrincipal();
  if (source==='merchant' && (!principal || principal.merchantId!==id || !principal.account.admin || !principal.account.enabled)) throw Error('仅当前品牌 Admin 可以管理所属门店与账号。');
  if (source==='m-platform' && !location.hash.startsWith('#/m-platform/')) throw Error('请从 M 平台进入品牌管理。');
  return source==='merchant' ? principal!.account.email : getAuthenticatedEmail()??'M 平台运营';
}

export function saveBrandAccess(next:BrandAccessState,expected:number,actor:string,action:string):BrandAccessState {
  const current=readBrandAccess(next.merchantId);
  assertBrandVersion(current.version,expected);
  const {catalog,ceiling}=brandCatalog(next.merchantId);
  validateCenterState(next,catalog.resources);
  const stores=new Set(brandStores(next.merchantId).map(s=>s.id));
  const emails=new Set<string>();
  const merchant=getMerchantById(next.merchantId);
  const legacyAdmin=!merchant?.accountProvisioningRequired && !!merchant?.primaryAdminEmail && !next.accounts.some(a=>a.email.toLowerCase()===merchant.primaryAdminEmail!.toLowerCase());
  if(next.accounts.length && !next.accounts.some(a=>a.admin&&a.enabled) && !legacyAdmin)throw Error('必须保留至少一名已启用的品牌 Admin。');
  for (const account of next.accounts) {
    if (!account.name.trim() || account.name.length>30 || !/^[^\s@]+@menusifu\.(cn|com)$/i.test(account.email)) throw Error('请填写姓名及有效的 Menusifu 邮箱。');
    if (emails.has(account.email.toLowerCase())) throw Error('品牌账号邮箱重复。');
    emails.add(account.email.toLowerCase());
    if (account.password.length<6) throw Error('账号密码至少 6 位。');
    for (const m of getEnterpriseMerchantSnapshot().merchants) {
      if (m.merchantId===next.merchantId) continue;
      if (m.primaryAdminEmail?.toLowerCase()===account.email.toLowerCase() || readBrandAccess(m.merchantId).accounts.some(a=>a.email.toLowerCase()===account.email.toLowerCase())) throw Error('该邮箱已属于其他品牌，请使用独立账号。');
    }
  }
  for (const role of next.roles) {
    const old=current.roles.find(r=>r.id===role.id);
    for (const [key,value] of Object.entries(role.grants)) if (value!=='hidden' && !ceiling.has(key) && old?.grants[key]!==value) throw Error('角色不能新增品牌未开通的权限。');
  }
  for (const employee of next.employees) for (const b of employee.bindings) if (b.scope.mode!=='stores' || b.scope.ids.some(id=>!stores.has(id))) throw Error('角色生效范围必须为当前品牌所属门店。');
  for (const role of current.roles) if (!next.roles.some(r=>r.id===role.id) && next.employees.some(e=>e.bindings.some(b=>b.roleId===role.id))) throw Error('角色仍被账号使用，不能删除。');
  const saved=structuredClone(next);
  saved.version=expected+1;
  saved.logs=[{id:crypto.randomUUID(),at:new Date().toISOString(),actor,objectId:next.merchantId,action,before:JSON.stringify({roles:current.roles.map(r=>({id:r.id,name:r.name,grants:r.grants})),accounts:current.accounts.map(({password,...a})=>a),employees:current.employees}),after:JSON.stringify({roles:next.roles.map(r=>({id:r.id,name:r.name,grants:r.grants})),accounts:next.accounts.map(({password,...a})=>a),employees:next.employees})},...current.logs];
  localStorage.setItem(brandAccessKey(saved.merchantId),JSON.stringify(saved));
  window.dispatchEvent(new CustomEvent('menusifu:brand-access-changed'));
  return saved;
}

export function validateBrandLogin(email:string,password:string):string|null|undefined {
  for (const merchant of getEnterpriseMerchantSnapshot().merchants) {
    const state=readBrandAccess(merchant.merchantId);
    const account=state.accounts.find(a=>a.email.toLowerCase()===email.trim().toLowerCase());
    if (account) {
      if (!account.enabled) return '该账号已停用，请联系品牌 Admin。';
      if (merchant.status!=='active' && merchant.status!=='onboarding') return '该品牌当前状态不允许登录。';
      return account.password===password ? null : '密码不正确';
    }
    if (merchant.accountProvisioningRequired && merchant.primaryAdminEmail?.toLowerCase()===email.trim().toLowerCase()) return '请先在品牌详情开通登录账号。';
  }
  return undefined;
}

interface Runtime {p:Principal;catalog:Catalog;ceiling:Set<string>;all:Store[];storeIds:string[];caps:Map<string,Set<string>>;brandPerspective:boolean;values:Map<string,Access>;session?:UserSessionContext;paths:Map<string,boolean>}
let runtimeTick:Runtime|undefined;
function brandRuntime():Runtime|undefined {
  const p=currentBrandPrincipal();
  if (!p) return undefined;
  if(runtimeTick)return runtimeTick;
  const {catalog,ceiling}=brandCatalog(p.merchantId);
  const all=brandStores(p.merchantId);
  const perspective=localStorage.getItem('sidebar-nav-layout-preset-v1')==='store' ? 'store' : sessionStorage.getItem('menusifu:chain-data-perspective-v1')??'brand';
  const store=sessionStorage.getItem('header-scope-filter-store') || sessionStorage.getItem('menusifu:chain-anchor-store-v1');
  const storeIds=store ? [store] : brandAccountStores(p.state,p.account,all);
  const caps=new Map(all.map(s=>[s.id,centerKeysForRaw(new Set(getStoreCapability(s.id)?.enabledKeys??[]),catalog)]));
  return runtimeTick={p,catalog,ceiling,all,storeIds,caps,brandPerspective:perspective!=='store',values:new Map(),paths:new Map()};
}
export function currentBrandAccess(key:string):Access|undefined {
  const ctx=brandRuntime();if(!ctx)return undefined;
  if(ctx.values.has(key))return ctx.values.get(key);
  const {p,catalog,ceiling,all,storeIds,caps,brandPerspective}=ctx;
  const value=resolveBrandAccess(p.state,p.account,storeIds,key,all,catalog.resources,ceiling,caps,brandPerspective);
  ctx.values.set(key,value);return value;
}
export function buildBrandSessionContext():UserSessionContext|null {
  const runtime=brandRuntime();if(!runtime)return null;
  if(runtime.session)return runtime.session;
  const {p,catalog}=runtime;
  const selection:UserSessionContext['permissionSnapshot']={};
  for(const node of buildPermissionResourceIndex().byKey.values()){
    const key=node.level===1?`module:${node.moduleId}`:node.level===2&&node.path?pageKey(node.path):node.level===4&&node.path&&node.seq!=null?settingKey(node.path,node.seq):'';
    const value=key&&catalog.resources.has(key)?currentBrandAccess(key):'hidden';
    selection[node.key]={enabled:value!=='hidden',display:value!=='hidden',l4EditMode:value==='edit'?'editable':'display-only'};
  }
  // The brand's store management is an administrative entry, not a business-menu grant.
  selection['brand-store-list']={enabled:p.account.enabled,display:p.account.enabled};
  return runtime.session={employeeId:p.account.id,employeeName:p.account.name,email:p.account.email,orgTier:'chain',roleIds:p.account.admin?['brand-admin']:p.state.employees.find(e=>e.id===p.account.id)?.bindings.map(b=>b.roleId)??['brand-unassigned'],storeAccess:{mode:'stores',ids:brandAccountStores(p.state,p.account,runtime.all)},permissionSnapshot:selection,builtAt:new Date().toISOString()};
}

export function isBrandPathAllowed(path:string):boolean {
  const runtime=brandRuntime();
  if (!runtime) return true;
  const {p,catalog}=runtime;
  path=path.split('?')[0]!;
  if (isNavHomePath(path) || path==='/login' || path==='/onboarding') return true;
  if (path.startsWith('/brand-stores/')) return p.account.enabled && (p.account.admin || path==='/brand-stores/list' || path==='/brand-stores/overview');
  if(runtime.paths.has(path))return runtime.paths.get(path)!;
  const pages=[...catalog.resources.values()].filter(r=>r.type==='page' && r.path && (path===r.path || path.startsWith(r.path+'/'))).sort((a,b)=>b.path!.length-a.path!.length);
  const allowed=!!pages[0] && currentBrandAccess(pages[0].key)!=='hidden';
  runtime.paths.set(path,allowed);return allowed;
}

export function brandStoresForPath(ids:string[],path:string):string[] {
  const ctx=brandRuntime();if(!ctx)return ids;
  const {p,catalog,all,ceiling,caps}=ctx;
  if(p.account.admin)return ids;
  const pages=[...catalog.resources.values()].filter(r=>r.type==='page'&&r.path&&(path===r.path||path.startsWith(r.path+'/'))).sort((a,b)=>b.path!.length-a.path!.length);
  if(path.startsWith('/brand-stores/'))return ids;
  if(!pages[0])return [];
  return ids.filter(id=>resolveBrandAccess(p.state,p.account,[id],pages[0]!.key,all,catalog.resources,ceiling,caps,false)!=='hidden');
}

export function applyBrandOperationAccess(path:string):void {
  if (!currentBrandPrincipal()) return;
  for (const [registered,actions] of Object.entries(additionalPageActions)) {
    if (path!==registered && !path.startsWith(registered+'/')) continue;
    for (const action of actions) {
      const value=currentBrandAccess(actionKey(registered,action.id));
      if (value==='edit') continue;
      for (const attr of [action.control,...(action.relatedControls??[])]) {
        if (!/^data-[\w-]+$/.test(attr)) continue;
        document.querySelectorAll<HTMLElement>(`[${attr}]`).forEach(el=>{el.setAttribute('disabled','');el.setAttribute('aria-disabled','true');el.title='暂无操作权限';});
      }
    }
  }
}

let runtimeGuardsBound=false;
export function bindBrandRuntimeGuards():void {
  if(runtimeGuardsBound)return;runtimeGuardsBound=true;
  const guard=(event:Event)=>{
    if(!currentBrandPrincipal())return;
    const target=event.target instanceof Element?event.target:null;if(!target)return;
    const path=location.hash.replace(/^#/,'').split('?')[0]||'/home';
    let denied=false;
    const row=target.closest('[data-module-setting-row-seq]');
    const toggle=target.closest('[data-module-setting-toggle]');
    const seq=Number(toggle?.getAttribute('data-module-setting-toggle')??row?.getAttribute('data-module-setting-row-seq'));
    const base=getModuleSettingsBasePath(path);
    if(base && Number.isFinite(seq) && seq>0 && currentBrandAccess(settingKey(base,seq))!=='edit')denied=true;
    for(const [registered,actions] of Object.entries(additionalPageActions)){
      if(path!==registered&&!path.startsWith(registered+'/'))continue;
      for(const action of actions){
        const attributes=[action.control,...action.relatedControls??[],...(action.relatedSources??[]).map(p=>p.control)].filter(a=>/^data-[\w-]+$/.test(a));
        if(attributes.some(attr=>target.closest(`[${attr}]`))&&currentBrandAccess(actionKey(registered,action.id))!=='edit')denied=true;
      }
    }
    if(denied){event.preventDefault();event.stopImmediatePropagation();}
  };
  document.addEventListener('click',guard,true);
  document.addEventListener('beforeinput',guard,true);
}

installBrandAccessRuntime({currentBrandPrincipal,buildBrandSessionContext,validateBrandLogin,isBrandPathAllowed,brandStoresForPath,brandStores,brandIdentity,brandPrimaryAdminEmail});
