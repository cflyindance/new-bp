import './brand-access-ui.css';
import { openServiceMenuPreview } from './service-entitlement-menu-preview';
import { currentBrandPrincipal } from './brand-access-store';
import { getMerchantById, getMerchantStores } from './enterprise-merchant-store';
import { showAppToast } from '../ui/app-toast';
import { mCanVisit } from '../permissions/m-platform-runtime';
import { MERCHANT_SUBSCRIPTIONS_PATH, SUBSCRIPTION_SERVICE_ROUTE_PREFIX } from './subscription-service-scope';
import { readSubscriptionServiceSnapshot } from './subscription-service-store';
import { ensurePublishedSubscriptionMenuTree } from './subscription-published-menu-tree';
import type { MerchantSubscription, ServiceEntitlementKind, ServicePackage } from './subscription-service-domain';
import { serviceAccess } from './service-entitlement-domain';
import { currentServiceAccess } from './service-entitlement-runtime';
import { resolveCurrentSubscriptionContext } from './subscription-service-runtime';
import { canManageServiceEntitlements, changeServiceEntitlement, recordServiceEntitlement } from './service-entitlement-store';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const date=(v?:string)=>v?new Date(v).toLocaleString('zh-CN'):'长期有效';
const money=(v:number,currency='CNY')=>new Intl.NumberFormat('zh-CN',{style:'currency',currency}).format(v/100);
const interval=(v:string)=>({month:'月',quarter:'季',year:'年','one-time':'一次性'}[v]??v);
const price=(p:ServicePackage)=>p.commercial?.chargeType==='free'?'免费':`${money(p.priceMinor,p.currency)} / ${p.commercial?.billingUnit==='store'?'门店':'品牌'} / ${interval(p.billingInterval)}`;
const kindLabel=(k:ServiceEntitlementKind)=>({free:'免费开通',trial:'开始试用',paid:'正式开通',gift:'赠送'})[k];
const btn=(name:string,attrs:string,primary=false)=>`<button type="button" class="ba-btn ${primary?'ba-primary':''}" ${attrs}>${name}</button>`;

export function renderBrandServiceEntitlements(brandId:string,options:{readOnly?:boolean;embedded?:boolean}={}):string {
  const mayManage=(action:'create'|'extend'|'disable'='create')=>!options.readOnly&&canManageServiceEntitlements(action);
  if(!mCanVisit(MERCHANT_SUBSCRIPTIONS_PATH))return '<p>暂无商家订阅查看权限。</p>';
  const snapshot=readSubscriptionServiceSnapshot(),stores=getMerchantStores(brandId);
  const packages=snapshot.packages.filter(p=>p.commercial);
  const rows=packages.map(pkg=>{
    const result=serviceAccess(snapshot,pkg,{brandId});
    const grant=result.grant;
    const related=snapshot.subscriptions.filter(s=>s.subjectType==='brand'&&s.subjectId===brandId&&s.packageId===pkg.id);
    return `<tr><td><strong>${esc(pkg.name)}</strong><small class="block text-muted-foreground">${esc(pkg.code)}</small></td><td>${esc(price(pkg))}</td><td><span class="ba-tag ${result.usable?'active':''}">${result.label}</span>${grant?`<small class="block text-muted-foreground">${date(grant.startAt)} 至 ${date(grant.endAt)}</small>`:''}${!grant&&related.some(s=>s.scopeMode==='selected')?'<small class="block text-muted-foreground">各指定门店请查看下方权益明细</small>':''}</td><td><div class="ba-actions">${pkg.commercial?.chargeType==='paid'?btn('查看菜单',`data-ent-menu="${esc(pkg.id)}"`):''}${mayManage()&&pkg.status==='published'?`${pkg.commercial!.chargeType==='free'?btn('免费开通',`data-ent-new="free" data-pkg="${esc(pkg.id)}"`):`${result.canTrial?btn('开始试用',`data-ent-new="trial" data-pkg="${esc(pkg.id)}"`):''}${btn('正式开通',`data-ent-new="paid" data-pkg="${esc(pkg.id)}"`)}${btn('赠送',`data-ent-new="gift" data-pkg="${esc(pkg.id)}"`)}`}`:''}</div></td></tr>`;
  }).join('');
  const grants=snapshot.subscriptions.filter(s=>s.subjectType==='brand'&&s.subjectId===brandId&&s.entitlementKind);
  const grantRows=grants.map(g=>{
    const pkg=packages.find(p=>p.id===g.packageId);
    const status=g.disabledAt?'已停用':g.endAt&&Date.parse(g.endAt)<=Date.now()?g.entitlementKind==='trial'?'试用已结束':'已到期':Date.parse(g.startAt)>Date.now()?'待生效':'生效中';
    return `<tr><td>${esc(pkg?.name??g.packageId)}<small class="block text-muted-foreground">${kindLabel(g.entitlementKind!)}</small></td><td>${g.scopeMode==='selected'?g.storeIds?.map(id=>esc(stores.find(s=>s.storeId===id)?.name??id)).join('、'):'全部品牌门店（含新增）'}</td><td>${date(g.startAt)}<small class="block text-muted-foreground">至 ${date(g.endAt)}</small></td><td>${money(g.agreedPriceMinor??0,g.agreedCurrency??'CNY')}<small class="block text-muted-foreground">/${g.agreedBillingUnit==='store'?'门店':'品牌'}/${interval(g.agreedBillingInterval??'month')} · 开通时快照</small></td><td>${status}<small class="block text-muted-foreground">${esc(g.reference??g.disableReason??'')}</small></td><td><div class="ba-actions">${!g.disabledAt&&mayManage('extend')&&['paid','gift'].includes(g.entitlementKind!)?btn('续期',`data-ent-extend="${esc(g.id)}"`):''}${!g.disabledAt&&mayManage('disable')?btn('停用',`data-ent-disable="${esc(g.id)}"`):''}</div></td></tr>`;
  }).join('');
  return `<section class="ba" data-brand-entitlements="${esc(brandId)}">${options.embedded?"":`<header class="ba-head"><div><h2>品牌服务权益</h2><p class="ba-muted">菜单展示与使用权益分别管理，员工角色仍受品牌与门店菜单上限约束。</p></div><a class="ba-btn" href="#${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}">服务包管理</a></header>`}<p class="ba-note" style="margin-bottom:18px">正式开通记录外部合同结果，不发起扣款。试用须明确开始，到期停止业务操作；菜单、数据和员工原授权记录保留。</p><div class="ba-table-wrap"><table><thead><tr><th>服务</th><th>标准价格</th><th>品牌范围状态</th><th>操作</th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="ba-empty">暂无启用权益控制的服务，请在服务包管理中创建或明确启用并发布。</td></tr>'}</tbody></table></div><h3 style="margin:24px 0 14px">权益明细 · ${grants.length} 条</h3><div class="ba-table-wrap"><table><thead><tr><th>服务 / 来源</th><th>适用门店</th><th>有效期</th><th>成交单价</th><th>状态 / 依据</th><th>操作</th></tr></thead><tbody>${grantRows||'<tr><td colspan="6" class="ba-empty">暂无权益记录；勾选展示菜单不会自动开通。</td></tr>'}</tbody></table></div><details style="margin-top:20px" data-service-entitlement-browse><summary>服务变更记录</summary>${snapshot.audit.filter(a=>grants.some(g=>g.id===a.objectId)).slice(0,20).map(a=>`<p class="ba-muted" style="padding:10px 0">${date(a.at)} · ${esc(a.actor)}<br>${esc(a.detail)}</p>`).join('')||'<p class="ba-empty">暂无变更记录</p>'}</details></section>`;
}

let activeDialog:HTMLDialogElement|null=null;
function openDialog(title:string,body:string,action:string,submit:(data:FormData)=>void,onSaved:()=>void):HTMLDialogElement {
  activeDialog?.close();activeDialog?.remove();
  const d=document.createElement('dialog');activeDialog=d;d.className='ba ba-modal ba-admin-dialog';d.setAttribute('aria-label',title);d.setAttribute('data-service-gate','');
  d.innerHTML=`<form><header class="ba-dialog-header"><h2>${esc(title)}</h2>${btn('×','data-ent-close aria-label="关闭"')}</header><section class="ba-dialog-body">${body}<p class="ba-error" role="alert" data-ent-error></p></section><footer class="ba-footer"><span class="ba-muted">取消不写入</span><div class="ba-actions">${btn('取消','data-ent-close')}<button type="submit" class="ba-btn ba-primary">${esc(action)}</button></div></footer></form>`;
  const close=()=>{if(d.open)d.close();d.remove();window.removeEventListener('hashchange',close);if(activeDialog===d)activeDialog=null;};
  d.querySelectorAll('[data-ent-close]').forEach(b=>b.addEventListener('click',close));
  d.addEventListener('close',close,{once:true});d.addEventListener('cancel',e=>{e.preventDefault();close();});
  d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  d.querySelector('form')!.onsubmit=e=>{e.preventDefault();try{submit(new FormData(e.currentTarget as HTMLFormElement));close();onSaved();showAppToast('服务权益已更新',{variant:'success'});}catch(err){d.querySelector('[data-ent-error]')!.textContent=(err as Error).message;}};
  document.body.append(d);d.showModal();window.addEventListener('hashchange',close);return d;
}
export function openServiceEntitlement(brandId:string,packageId:string,kind:ServiceEntitlementKind,source:'m-platform'|'merchant',onSaved:()=>void):void {
  const pkg=readSubscriptionServiceSnapshot().packages.find(p=>p.id===packageId);
  if(!pkg?.commercial)return;
  const stores=getMerchantStores(brandId),now=Date.now();
  const defaultDate=new Date(now+30*86400000);defaultDate.setMinutes(defaultDate.getMinutes()-defaultDate.getTimezoneOffset());
  const body=`<p class="ba-note" style="margin-bottom:18px">${esc(pkg.name)} · ${esc(price(pkg))}<br>${kind==='trial'?`确认后立即开始${pkg.commercial.trialDays}天试用；同一品牌仅一次，不自动扣费。`:'仅记录外部开通或运营赠送，不发起在线支付。'}</p><label class="ba-field">适用门店范围<select name="scopeMode"><option value="all">全部品牌门店（含后续新增）</option><option value="selected">指定门店</option></select></label><div class="ba-checks" data-scope-stores hidden>${stores.map(s=>`<label><input type="checkbox" name="storeIds" value="${esc(s.storeId)}">${esc(s.name)}</label>`).join('')}</div>${kind==='paid'?`<label class="ba-field" style="margin-top:16px">成交单价（${esc(pkg.currency)} / ${pkg.commercial.billingUnit==='store'?'门店':'品牌'} / ${interval(pkg.billingInterval)}）<input type="number" name="price" min="0.01" step="0.01" value="${(pkg.priceMinor/100).toFixed(2)}" required></label>`:''}${['paid','gift'].includes(kind)?`<label class="ba-field" style="margin-top:16px">到期时间<input type="datetime-local" name="endAt" value="${defaultDate.toISOString().slice(0,16)}" required><small class="block text-muted-foreground">按当前设备时区输入，保存精确UTC时刻。</small></label><label class="ba-field" style="margin-top:16px">${kind==='gift'?'赠送原因':'外部合同 / 开通记录编号'}<input name="reference" maxlength="200" required></label>`:kind==='trial'?`<p class="ba-muted" style="margin-top:16px">预计结束：${new Date(now+pkg.commercial.trialDays*86400000).toLocaleString('zh-CN')}</p>`:''}`;
  const d=openDialog(`${kindLabel(kind)} · ${pkg.name}`,body,kind==='trial'?'确认开始试用':'确认'+kindLabel(kind),data=>{
    const raw=String(data.get('endAt')??'');
    recordServiceEntitlement({brandId,packageId,kind,scopeMode:String(data.get('scopeMode')) as 'all'|'selected',storeIds:data.getAll('storeIds').map(String),priceMinor:Math.round(Number(data.get('price'))*100),endAt:raw?new Date(raw).toISOString():undefined,reference:String(data.get('reference')??'')},source);
  },onSaved);
  d.querySelector('select')!.onchange=e=>{d.querySelector<HTMLElement>('[data-scope-stores]')!.hidden=(e.target as HTMLSelectElement).value!=='selected';};
}

export function bindBrandServiceEntitlements(onMount:()=>void):void {
  const root=document.querySelector<HTMLElement>('[data-brand-entitlements]');if(!root)return;
  const demoVersion=readSubscriptionServiceSnapshot().entitlementDemoVersion;
  if(demoVersion!==1)void ensurePublishedSubscriptionMenuTree().then(()=>{if(document.contains(root)&&readSubscriptionServiceSnapshot().entitlementDemoVersion===1)onMount();}).catch(()=>{});
  root.querySelectorAll<HTMLButtonElement>('[data-ent-menu]').forEach(b=>b.onclick=()=>{void openServiceMenuPreview(b.dataset.entMenu!);});
  root.querySelectorAll<HTMLButtonElement>('[data-ent-new]').forEach(b=>b.onclick=()=>openServiceEntitlement(root.dataset.brandEntitlements!,b.dataset.pkg!,b.dataset.entNew as ServiceEntitlementKind,'m-platform',onMount));
  root.querySelectorAll<HTMLButtonElement>('[data-ent-extend],[data-ent-disable]').forEach(b=>b.onclick=()=>{
    const extend=!!b.dataset.entExtend,id=b.dataset.entExtend??b.dataset.entDisable!;
    const body=extend?'<label class="ba-field">新的到期时间<input type="datetime-local" name="value" required></label>':'<label class="ba-field">停用原因<textarea name="value" required maxlength="200"></textarea></label>';
    openDialog(extend?'续期服务权益':'停用服务权益',body,extend?'确认续期':'确认停用',data=>changeServiceEntitlement(id,extend?'extend':'disable',extend?new Date(String(data.get('value'))).toISOString():String(data.get('value'))),onMount);
  });
}

export function renderServiceGate(path:string):string|null {
  const rights=currentServiceAccess(path);if(!rights.length||rights.some(r=>r.usable))return null;
  const context=resolveCurrentSubscriptionContext(),principal=currentBrandPrincipal();
  return `<section class="ba rounded-xl border border-border bg-card p-6 md:p-10" data-service-gate><div class="mb-6"><span class="ba-tag">服务未获得有效使用权益</span><h2 class="mt-4 text-xl font-semibold">开通服务后使用当前功能</h2><p class="ba-muted mt-3">菜单已展示，业务数据与操作尚未开放。${context?.brandId?'到期不删除原数据，免费服务继续按原授权使用。':'请先选择具体品牌或门店，不能跨品牌推断服务权益。'}</p></div>${rights.map(r=>`<section class="ba-card"><div class="ba-section-title"><h3>${esc(r.package.name)}</h3><span class="ba-tag">${r.label}</span></div><p class="text-xl font-semibold">${esc(price(r.package))}</p><p class="ba-muted mt-2">${esc(r.package.description??'')}</p><div class="ba-actions mt-4">${r.canTrial&&principal?.account.admin&&context?.brandId===principal.merchantId?btn(`免费试用${r.package.commercial!.trialDays}天`,`data-service-trial="${esc(r.package.id)}"`,true):''}${btn('联系服务商开通 / 续期','data-service-contact')}</div></section>`).join('')}<p class="ba-muted mt-5">${principal?.account.admin?'服务有效后，员工仍需相应角色权限。':'请联系品牌管理员处理服务开通与试用。'}</p></section>`;
}
export function renderServiceTrialNotice(path:string):string {
  const r=currentServiceAccess(path).find(r=>r.usable);
  if(r?.grant?.entitlementKind!=='trial')return '';
  const remaining=Math.max(0,Math.ceil((Date.parse(r.grant.endAt!)-Date.now())/86400000));
  return `<div class="ba-note text-sm" data-service-notice>${esc(r.package.name)} · 试用剩余${remaining}天 · ${date(r.grant.endAt)}结束${btn('联系服务商开通','data-service-contact')}</div>`;
}
export function bindServiceGate(onMount:()=>void):void {
  // Labels only: visibility and role gates were already applied by the navigation.
  document.querySelectorAll<HTMLAnchorElement>('#app a[href^="#/"]').forEach(anchor=>{
    if(anchor.closest('[data-service-gate]')||anchor.querySelector('[data-service-menu-state]'))return;
    const rights=currentServiceAccess(anchor.hash.slice(1));if(!rights.length)return;
    const active=rights.find(r=>r.usable), label=active?.label??rights[0].label;
    const tag=document.createElement('span');tag.dataset.serviceMenuState='';tag.className='ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground';
    tag.textContent=active?label:'◇ '+label;anchor.append(tag);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-service-trial]').forEach(b=>b.onclick=()=>{const p=currentBrandPrincipal();if(p?.account.admin)openServiceEntitlement(p.merchantId,b.dataset.serviceTrial!,'trial','merchant',onMount);});
  document.querySelectorAll<HTMLButtonElement>('[data-service-contact]').forEach(b=>b.onclick=()=>showAppToast('请联系服务商确认价格、有效期及适用门店；由服务商记录外部开通结果。'));
}
