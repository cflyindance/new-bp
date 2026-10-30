import {packageOnSale} from './service-package-lifecycle-domain';
import {getMerchantById,getMerchants,getStoreById} from './enterprise-merchant-store';
import {subscriptionStatusLabel,type ServicePackage,type MerchantSubscription} from './subscription-service-domain';

export type ListFilter=Record<string,string>;
let packages:ListFilter={},subscriptions:ListFilter={};
const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const subscriptionMethod=(s:MerchantSubscription)=>s.entitlementKind?({free:'免费开通',trial:'试用',paid:'付费开通',gift:'赠送'})[s.entitlementKind]:'标准订阅';
export const packageCharge=(p:ServicePackage)=>p.commercial?.chargeType??(p.priceMinor===0?'free':'paid');
export const subscriptionBrand=(s:MerchantSubscription)=>s.subjectType==='brand'?getMerchantById(s.subjectId):s.subjectType==='store'?getMerchantById(getStoreById(s.subjectId)?.merchantId??''):undefined;
export function subscriptionRemaining(s:MerchantSubscription,p:ServicePackage|undefined,now=Date.now()):string {
 if(!Number.isFinite(Date.parse(s.startAt))||(s.endAt&&!Number.isFinite(Date.parse(s.endAt))))return '—';
 const status=subscriptionStatusLabel(s,p?.status,new Date(now));
 if(status==='已停用'||status==='服务包已停用'||status==='待生效')return status;
 if(!s.endAt)return '长期';
 const diff=Date.parse(s.endAt)-now;
 if(!Number.isFinite(diff))return '—';
 if(diff<=0)return '已到期';
 return diff<86400000?'今日到期':`剩余${Math.ceil(diff/86400000)}天`;
}
export function matchesPackage(p:ServicePackage,f:ListFilter=packages):boolean {
 return (!f.q||p.name.toLocaleLowerCase().includes(f.q.trim().toLocaleLowerCase()))&&(!f.status||(f.status==='published'?!!p.activeReleaseId:!p.activeReleaseId))&&(!f.sale||(f.sale==='on'?packageOnSale(p):f.sale==='disabled'?p.status==='disabled':p.status==='published'&&p.saleStatus==='off'))&&(!f.charge||packageCharge(p)===f.charge)&&(!f.trial||(f.trial==='yes')===!!p.commercial?.trialEnabled);
}
export function matchesSubscription(s:MerchantSubscription,p:ServicePackage|undefined,f:ListFilter=subscriptions,now=Date.now()):boolean {
 if(s.subjectType!=='brand'&&s.subjectType!=='store')return false;
 const brand=subscriptionBrand(s),store=s.subjectType==='store'?getStoreById(s.subjectId):undefined;
 const hay=[brand?.name,brand?.bid,store?.name,s.subjectId].join(' ').toLocaleLowerCase();
 const end=s.endAt?Date.parse(s.endAt):Infinity;
 const expiry=!f.expiry||(f.expiry==='long'?!s.endAt:f.expiry==='expired'?Number.isFinite(end)&&end<=now:Number.isFinite(end)&&end>now&&end<=now+Number(f.expiry)*86400000);
 return (!f.q||hay.includes(f.q.trim().toLocaleLowerCase()))&&(!f.brand||brand?.merchantId===f.brand)&&(!f.type||s.subjectType===f.type)&&(!f.package||p?.id===f.package)&&(!f.status||subscriptionStatusLabel(s,p?.status,new Date(now))===f.status)&&(!f.method||subscriptionMethod(s)===f.method)&&expiry;
}
const select=(f:ListFilter,name:string,title:string,options:Array<[string,string]>)=>`<label class="min-w-0 text-xs text-muted-foreground">${title}<select name="${name}" class="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"><option value="">全部</option>${options.map(([v,t])=>`<option value="${esc(v)}"${f[name]===v?' selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
const input=(f:ListFilter,placeholder:string)=>`<label class="min-w-0 flex-1 text-xs text-muted-foreground">搜索<input name="q" value="${esc(f.q)}" placeholder="${placeholder}" type="search" class="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"></label>`;
const buttons='<div class="flex shrink-0 items-end gap-2"><button type="submit" class="h-10 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white">查询</button><button type="reset" class="h-10 rounded-lg border border-border bg-background px-5 text-sm">重置</button></div>';
export function renderListFilters(kind:'packages'|'subscriptions',list:ServicePackage[]):string {
 const f=kind==='packages'?packages:subscriptions;
 const formClass='mb-5 rounded-xl border border-border bg-card p-4';
 if(kind==='packages')return `<form data-service-list-filter="packages" class="${formClass}"><div class="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_1fr_1fr_1fr_1fr_auto]">${input(f,'服务包名称')}${select(f,'status','发布状态',[['unpublished','未发布'],['published','已发布']])}${select(f,'sale','服务状态',[['on','已上架'],['off','已下架'],['disabled','已停用']])}${select(f,'charge','收费类型',[['free','免费'],['paid','收费']])}${select(f,'trial','是否支持试用',[['yes','支持试用'],['no','不支持试用']])}${buttons}</div></form>`;
 const brands=getMerchants({allEnterprises:true}).map(b=>[b.merchantId,b.name] as [string,string]);
 return `<form data-service-list-filter="subscriptions" class="${formClass}"><div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">${select(f,'brand','所属品牌',brands)}${select(f,'type','主体类型',[['brand','品牌'],['store','门店']])}${select(f,'package','服务包',list.map(p=>[p.id,p.name]))}${select(f,'status','订阅状态',['待生效','生效中','已到期','已停用','服务包已停用'].map(t=>[t,t]))}</div><div class="mt-3 grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_minmax(260px,2fr)_auto]">${select(f,'method','开通方式',['标准订阅','免费开通','试用','付费开通','赠送'].map(t=>[t,t]))}${select(f,'expiry','到期范围',[['7','未来7天'],['30','未来30天'],['expired','已到期'],['long','长期有效']])}${input(f,'品牌名称 / 门店名称 / BID / MID')}${buttons}</div></form>`;
}
export function bindListFilters(onMount:()=>void):void {
 const form=document.querySelector<HTMLFormElement>('[data-service-list-filter]');if(!form)return;
 const set=(value:ListFilter)=>{if(form.dataset.serviceListFilter==='packages')packages=value;else subscriptions=value;onMount();};
 form.addEventListener('submit',e=>{e.preventDefault();set(Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,String(v).trim()])));});
 form.addEventListener('reset',e=>{e.preventDefault();set({});});
}
