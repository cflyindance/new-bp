import './management-list-filters.css';
import {getMerchants,getEnterpriseStoreList,getGroupsForSelect,getMerchantStores,getStoreCapability,getMerchantById} from './enterprise-merchant-store';
import {brandRawMenuKeys,brandMenuChoices,readBrandAccess} from './brand-access-store';
import {brandOnboardingProgress} from './brand-service-lifecycle';
import {serviceStatus} from './brand-service-policy';
type Kind='brand'|'store';
export type ManagementFilter=Record<string,string>;
const key=(kind:Kind)=>`menusifu:management-filters:v1:${kind}`;
export function savedManagementFilter(kind:Kind):ManagementFilter {try{const value=JSON.parse(sessionStorage.getItem(key(kind))??'{}');return value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).filter((entry):entry is [string,string]=>typeof entry[1]==='string')):{}}catch{return {}}}
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const brands=()=>getMerchants({allEnterprises:true,excludeLinkedStoreTenants:true});
function hasBrandPages(id:string){const keys=brandRawMenuKeys(id);return brandMenuChoices().some(c=>c.isPage&&keys.has(c.key));}
function hasStorePages(id:string){const keys=new Set(getStoreCapability(id)?.enabledKeys??[]);return brandMenuChoices().some(c=>c.isPage&&keys.has(c.key));}
export function filteredManagementBrands(f:ManagementFilter){
 const q=(f.query??'').trim().toLowerCase();
 return brands().filter(m=>(!f.status||serviceStatus(m.status)===f.status)&&(!f.groupId||m.groupId===f.groupId)&&(!q||[m.name,m.bid,m.code,m.primaryAdminEmail,...readBrandAccess(m.merchantId).accounts.map(a=>a.email)].join(' ').toLowerCase().includes(q))&&(!f.progress||brandOnboardingProgress(m.merchantId)===f.progress)&&(!f.menu||(hasBrandPages(m.merchantId)?'yes':'no')===f.menu)&&(!f.stores||(getMerchantStores(m.merchantId).length?'yes':'no')===f.stores)&&(!f.from||m.createdAt.slice(0,10)>=f.from)&&(!f.to||m.createdAt.slice(0,10)<=f.to));
}
export function filteredManagementStores(f:ManagementFilter){return getEnterpriseStoreList({allEnterprises:true,groupId:f.groupId,merchantId:f.merchantId,status:f.status as never,query:f.query}).filter(r=>(!f.mode||(getStoreCapability(r.store.storeId)?.menuMode==='inherit'?'inherit':'independent')===f.mode)&&(!f.menu||(hasStorePages(r.store.storeId)?'yes':'no')===f.menu)&&(!f.brandStatus||serviceStatus(getMerchantById(r.merchantId)!.status)===f.brandStatus));}
const states:[string,string][]=[['onboarding','待启用'],['active','已启用'],['suspended','已暂停'],['closed','已关闭']];
function field(name:string,title:string,options:[string,string][],f:ManagementFilter){return `<label data-filter-field="${name}" class="flex flex-col gap-1"><span class="text-xs text-muted-foreground">${title}</span><select name="${name}" class="h-9 rounded-md border border-input bg-background px-2 text-sm"><option value="">全部</option>${options.map(([v,t])=>`<option value="${esc(v)}" ${f[name]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;}
const input=(name:string,title:string,type:string,f:ManagementFilter,placeholder='')=>`<label data-filter-field="${name}" class="flex flex-col gap-1"><span class="text-xs text-muted-foreground">${title}</span><input name="${name}" type="${type}" value="${esc(f[name]??'')}" placeholder="${placeholder}" class="h-9 rounded-md border border-input bg-background px-3 text-sm"></label>`;
export function renderManagementFilters(kind:Kind){
 const f=savedManagementFilter(kind),store=kind==='store';
 const group=field('groupId','所属集团',getGroupsForSelect({allEnterprises:true}).map(g=>[g.groupId,g.name]),f);
 const brand=store?field('merchantId','所属品牌',brands().filter(m=>!f.groupId||m.groupId===f.groupId).map(m=>[m.merchantId,m.name]),f):'';
 const status=field('status',store?'门店状态':'服务状态',store?[['open','营业中'],['preparing','筹备中'],['closed','停业'],['archived','已归档']]:states,f);
 const search=input('query','搜索','search',f,store?'门店 / MID / 地址 / 邮编 / 品牌 / BID / 集团':'品牌名称 / BID / 编码 / 管理员账号');
 const actions='<button type="submit" class="ba-btn ba-primary">查询</button><button type="button" class="ba-btn" data-filter-reset>重置</button>';
 const menu=field('menu',store?'生效菜单':'品牌菜单',store?[['no','无生效菜单'],['yes','有生效菜单']]:[['no','未配置'],['yes','已配置']],f);
 const primary=store
  ?group+brand+status+field('brandStatus','所属品牌服务状态',states,f)
  :group+status+field('progress','开通进度',['待开通管理员','待配置品牌菜单','待首次登录','已首次登录','初始化已完成'].map(s=>[s,s]),f)+menu+field('stores','品牌门店',[['no','无门店'],['yes','有门店']],f);
 const secondary=store
  ?field('mode','菜单配置方式',[['inherit','继承品牌菜单'],['independent','独立配置']],f)+menu
  :input('from','创建时间起','date',f)+input('to','创建时间止','date',f);
 return '<form data-management-filters="'+kind+'" class="management-filters"><div class="management-filter-primary">'+primary+
  '</div><div class="management-filter-secondary">'+secondary+search+'<div class="management-filter-actions">'+actions+'</div></div>'+
  '<p data-filter-error role="alert" class="text-sm text-destructive" hidden></p></form>';
}
export function bindManagementFilters(kind:Kind,render:(f:ManagementFilter)=>void){
 const form=document.querySelector<HTMLFormElement>(`[data-management-filters="${kind}"]`);if(!form)return;
 const value=(name:string)=>(form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement)?.value??'';
 const collect=()=>Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,String(v)]));
 const save=(f:ManagementFilter)=>{try{sessionStorage.setItem(key(kind),JSON.stringify(f))}catch{}};
 const apply=()=>{const f=collect(),error=form.querySelector<HTMLElement>('[data-filter-error]')!;error.hidden=true;if(f.from&&f.to&&f.from>f.to){error.textContent='创建时间起不能晚于结束时间';error.hidden=false;return;}save(f);render(f);};
 const updateBrands=()=>{const select=form.elements.namedItem('merchantId') as HTMLSelectElement;if(!select)return;const old=select.value;select.innerHTML='<option value="">全部</option>'+brands().filter(m=>(!value('groupId')||m.groupId===value('groupId'))).map(m=>`<option value="${esc(m.merchantId)}">${esc(m.name)}</option>`).join('');select.value=[...select.options].some(o=>o.value===old)?old:'';};
 form.onsubmit=e=>{e.preventDefault();apply();};
 form.querySelector('[data-filter-reset]')!.addEventListener('click',()=>{form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('input,select').forEach(el=>el.value='');updateBrands();apply();});
 form.querySelectorAll('select').forEach(el=>el.addEventListener('change',()=>{if(el.name==='groupId')updateBrands();apply();}));
 updateBrands();render(collect());
}
