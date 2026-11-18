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
import { MERCHANT_SERVICE_CENTER_PATH } from './app-routes';
import { packageOnSale } from './service-package-availability';
import { serviceEntitlementData } from './service-entitlement-data';
import { entitlementApplies, serviceAccess, type ServiceAccess } from './service-entitlement-domain';
import { currentServiceAccess } from './service-entitlement-runtime';
import { resolveCurrentSubscriptionContext } from './subscription-service-runtime';
import { canManageServiceEntitlements, changeServiceEntitlement, recordServiceEntitlement } from './service-entitlement-store';
import {renderEntitlementOverview,bindEntitlementOverview} from './service-entitlement-overview';
import { entitlementDisableImpact } from './service-entitlement-impact';


const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const date=(v?:string)=>v?new Date(v).toLocaleString('zh-CN'):'长期有效';
const money=(v:number,currency='CNY')=>new Intl.NumberFormat('zh-CN',{style:'currency',currency}).format(v/100);
const interval=(v:string)=>({month:'月',quarter:'季',year:'年','one-time':'一次性'}[v]??v);
const price=(p:ServicePackage)=>p.commercial?.chargeType==='free'?'免费':`${money(p.priceMinor,p.currency)} / ${p.commercial?.billingUnit==='store'?'门店':'品牌'} / ${interval(p.billingInterval)}`;
const kindLabel=(k:ServiceEntitlementKind)=>({free:'免费开通',trial:'开始试用',paid:'正式开通',gift:'赠送'})[k];
const btn=(name:string,attrs:string,primary=false)=>`<button type="button" class="ba-btn ${primary?'ba-primary':''}" ${attrs}>${name}</button>`;

export function renderBrandServiceEntitlements(brandId:string,options:{readOnly?:boolean;embedded?:boolean;cards?:boolean}={}):string {
  const mayManage=(action:'create'|'extend'|'disable'='create')=>!options.readOnly&&canManageServiceEntitlements(action);
  if(!mCanVisit(MERCHANT_SUBSCRIPTIONS_PATH))return '<p>暂无商家订阅查看权限。</p>';
  return renderEntitlementOverview(brandId,!!options.embedded,mayManage,options.cards);
}

let activeDialog:HTMLDialogElement|null=null;
function openDialog(title:string,body:string,action:string,submit:(data:FormData)=>void,onSaved:()=>void):HTMLDialogElement {
  activeDialog?.close();activeDialog?.remove();
  const d=document.createElement('dialog');activeDialog=d;d.className='ba ba-modal ba-admin-dialog';d.setAttribute('aria-label',title);d.setAttribute('data-service-gate','');if(document.querySelector('[data-rights-drawer][open]'))d.dataset.rightsDrawerChild='';
  d.innerHTML=`<form><header class="ba-dialog-header"><h2>${esc(title)}</h2>${btn('×','data-ent-close aria-label="关闭"')}</header><section class="ba-dialog-body">${body}<p class="ba-error" role="alert" data-ent-error></p></section><footer class="ba-footer"><span class="ba-muted">取消不写入</span><div class="ba-actions">${btn('取消','data-ent-close')}<button type="submit" class="ba-btn ba-primary">${esc(action)}</button></div></footer></form>`;
  const close=()=>{if(d.open)d.close();d.remove();window.removeEventListener('hashchange',close);if(activeDialog===d)activeDialog=null;};
  d.querySelectorAll('[data-ent-close]').forEach(b=>b.addEventListener('click',close));
  d.addEventListener('close',close,{once:true});d.addEventListener('cancel',e=>{e.preventDefault();close();});
  d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  d.querySelector('form')!.onsubmit=e=>{e.preventDefault();try{submit(new FormData(e.currentTarget as HTMLFormElement));close();onSaved();showAppToast('服务权益已更新',{variant:'success'});}catch(err){d.querySelector('[data-ent-error]')!.textContent=(err as Error).message;}};
  document.body.append(d);d.showModal();window.addEventListener('hashchange',close);return d;
}
export function openServiceEntitlement(brandId:string,packageId:string,kind:ServiceEntitlementKind,source:'m-platform'|'merchant',onSaved:()=>void,preset?:MerchantSubscription):void {
  const pkg=readSubscriptionServiceSnapshot().packages.find(p=>p.id===packageId);
  if(!pkg?.commercial)return;
  const stores=getMerchantStores(brandId),now=Date.now();
  const defaultDate=new Date(now+30*86400000);defaultDate.setMinutes(defaultDate.getMinutes()-defaultDate.getTimezoneOffset());
  const body=`<p class="ba-note" style="margin-bottom:18px">${esc(pkg.name)} · ${esc(price(pkg))}<br>${kind==='trial'?`确认后立即开始${pkg.commercial.trialDays}天试用；同一品牌仅一次，不自动扣费。`:'仅记录外部开通或运营赠送，不发起在线支付。'}</p><label class="ba-field">适用门店范围<select name="scopeMode"><option value="all">全部品牌门店（含后续新增）</option><option value="selected">指定门店</option></select></label><fieldset class="brand-entitlement-store-scope" data-scope-stores hidden><legend>指定门店</legend><div class="brand-entitlement-store-options">${stores.map(s=>`<label><input type="checkbox" name="storeIds" value="${esc(s.storeId)}"><span><strong>${esc(s.name)}</strong><small>${esc(s.storeId)}</small></span></label>`).join('')||'<p class="ba-muted">暂无可选门店</p>'}</div></fieldset>${kind==='paid'?`<label class="ba-field" style="margin-top:16px">成交单价（${esc(pkg.currency)} / ${pkg.commercial.billingUnit==='store'?'门店':'品牌'} / ${interval(pkg.billingInterval)}）<input type="number" name="price" min="0.01" step="0.01" value="${(pkg.priceMinor/100).toFixed(2)}" required></label>`:''}${['paid','gift'].includes(kind)?`<label class="ba-field" style="margin-top:16px">到期时间<input type="datetime-local" name="endAt" value="${defaultDate.toISOString().slice(0,16)}" required><small class="block text-muted-foreground">按当前设备时区输入，保存精确UTC时刻。</small></label><label class="ba-field" style="margin-top:16px">${kind==='gift'?'赠送原因':'外部合同 / 开通记录编号'}<input name="reference" maxlength="200" required></label>`:kind==='trial'?`<p class="ba-muted" style="margin-top:16px">预计结束：${new Date(now+pkg.commercial.trialDays*86400000).toLocaleString('zh-CN')}</p>`:''}`;
  const d=openDialog(`${kindLabel(kind)} · ${pkg.name}`,body,kind==='trial'?'确认开始试用':'确认'+kindLabel(kind),data=>{
    const raw=String(data.get('endAt')??'');
    recordServiceEntitlement({brandId,packageId,kind,scopeMode:String(data.get('scopeMode')) as 'all'|'selected',storeIds:data.getAll('storeIds').map(String),priceMinor:Math.round(Number(data.get('price'))*100),endAt:raw?new Date(raw).toISOString():undefined,reference:String(data.get('reference')??'')},source);
  },onSaved);
  if (preset) {
    const scope = d.querySelector<HTMLSelectElement>('[name=scopeMode]')!;
    scope.value = preset.scopeMode ?? 'all';
    d.querySelector<HTMLElement>('[data-scope-stores]')!.hidden = scope.value !== 'selected';
    d.querySelectorAll<HTMLInputElement>('[name=storeIds]').forEach(input => { input.checked = !!preset.storeIds?.includes(input.value); });
    const notice = document.createElement('p'); notice.className = 'ba-note';
    notice.textContent = '确认后从办理时新建权益记录，保留原记录及到期空档。请核对适用门店、成交价和开通依据。';
    d.querySelector('.ba-dialog-body')!.prepend(notice);
  }
  d.querySelector('select')!.onchange=e=>{d.querySelector<HTMLElement>('[data-scope-stores]')!.hidden=(e.target as HTMLSelectElement).value!=='selected';};
}

export function openServiceEntitlementChange(id:string,operation:'extend'|'disable',onSaved:()=>void):void {
  const snapshot=readSubscriptionServiceSnapshot(),grant=snapshot.subscriptions.find(g=>g.id===id);
  if(!grant?.entitlementKind || !canManageServiceEntitlements(operation))return;
  const brandStores=getMerchantStores(grant.subjectId),stores=brandStores.map(s=>s.storeId),previewAt=Date.now();
  const token=JSON.stringify({snapshot,stores}),impact=entitlementDisableImpact(snapshot,id,stores,previewAt);
  const gift=grant.entitlementKind==='gift',extend=operation==='extend';
  const title=extend?(gift?'延长赠送':'续期服务权益'):'停用提醒';
  const scoped=grant.scopeMode==='selected'?brandStores.filter(store=>grant.storeIds?.includes(store.storeId)):brandStores;
  const storeCards=scoped.map(store=>`<li><strong>${esc(store.name)}</strong><small>${esc(store.storeId)}</small></li>`).join('');
  const packageName=snapshot.packages.find(pkg=>pkg.id===grant.packageId)?.name??'服务权益';
  const body=extend?`<p class="ba-note">仅延长当前记录的期限，保留成交价及开通依据；价格或合同变化时请办理新开通。</p><label class="ba-field">新的到期时间<input type="datetime-local" name="value" required></label>${gift?'<label class="ba-field">延长赠送原因<textarea name="reason" required maxlength="200"></textarea></label>':''}`:`<p class="brand-modal-warning"><strong>本条权益将立即停止，历史记录保留</strong><br>其他有效权益继续提供重叠页面。实际失去 ${impact.lost}，其他订阅保留 ${impact.retained}。</p>
    <h3>权益适用门店（${scoped.length} 家）</h3><ul class="brand-log-objects">${storeCards||'<li>暂无适用门店</li>'}</ul>
    <label class="ba-field">停用原因 *<textarea name="value" required maxlength="200" placeholder="填写停用原因"></textarea></label>`;
  const modal=openDialog(title,body,extend?(gift?'确认延长赠送':'确认续期'):'确认停用',data=>{
    const latest=readSubscriptionServiceSnapshot(),currentStores=getMerchantStores(grant.subjectId).map(s=>s.storeId);
    const boundaries=snapshot.subscriptions.flatMap(g=>[g.startAt,g.endAt]).filter((s):s is string=>!!s).map(Date.parse);
    if(Date.now()-previewAt>=300000||boundaries.some(t=>previewAt<t&&t<=Date.now())||JSON.stringify({snapshot:latest,stores:currentStores})!==token)throw Error('权益或状态已变化，请关闭弹框后重新查看影响。');
    const raw=String(data.get('value')??'');
    changeServiceEntitlement(id,operation,extend?new Date(raw).toISOString():raw,String(data.get('reason')??''));
  },onSaved);
  if(!extend){
    modal.classList.add('brand-design-modal','brand-form-modal');
    const header=modal.querySelector('header')!,heading=header.querySelector('h2')!;
    const subtitle=document.createElement('small');subtitle.textContent=packageName;
    const titleBlock=document.createElement('div');titleBlock.append(heading,subtitle);
    const close=header.querySelector('[data-ent-close]')!;
    const submit=modal.querySelector<HTMLButtonElement>('[type=submit]')!;
    header.replaceChildren(close,titleBlock,submit);
    modal.querySelector('footer')!.remove();
    submit.classList.replace('ba-primary','ba-danger');
    const reason=modal.querySelector<HTMLTextAreaElement>('textarea')!;
    const sync=()=>submit.disabled=!reason.value.trim();
    reason.addEventListener('input',sync);sync();
  }

}

export function bindBrandServiceEntitlements(onMount:()=>void):void {
  const root=document.querySelector<HTMLElement>('[data-brand-entitlements]');if(!root)return;
  bindEntitlementOverview();
  const demoVersion=readSubscriptionServiceSnapshot().entitlementDemoVersion;
  if(demoVersion!==1)void ensurePublishedSubscriptionMenuTree().then(()=>{if(document.contains(root)&&readSubscriptionServiceSnapshot().entitlementDemoVersion===1)onMount();}).catch(()=>{});
  root.querySelectorAll<HTMLButtonElement>('[data-ent-menu]').forEach(b=>b.onclick=()=>{void openServiceMenuPreview(b.dataset.entMenu!);});
  root.querySelectorAll<HTMLButtonElement>('[data-ent-new]').forEach(b=>b.onclick=()=>openServiceEntitlement(root.dataset.brandEntitlements!,b.dataset.pkg!,b.dataset.entNew as ServiceEntitlementKind,'m-platform',onMount));
  root.querySelectorAll<HTMLButtonElement>('[data-ent-extend],[data-ent-disable]').forEach(b=>b.onclick=()=>{
    const extend=!!b.dataset.entExtend,id=b.dataset.entExtend??b.dataset.entDisable!;
    openServiceEntitlementChange(id,extend?'extend':'disable',onMount);
  });
}

export function canViewMerchantServiceCenter(): boolean {
  const principal = currentBrandPrincipal();
  return !!principal?.account.enabled && principal.account.admin && resolveCurrentSubscriptionContext()?.brandId === principal.merchantId;
}

function renderMerchantServiceCard(access: ServiceAccess, canTrial: boolean, period = access.grant): string {
  const pkg = access.package;
  return `<section class="ba-card"><div class="ba-section-title"><h3>${esc(pkg.name)}</h3><span class="ba-tag">${esc(access.label)}</span></div>
    <p class="text-xl font-semibold">${esc(price(pkg))}</p><p class="ba-muted mt-2">${esc(pkg.description ?? '')}</p>
    ${period ? `<p class="ba-muted mt-2">有效期 ${esc(date(period.startAt))} 至 ${esc(date(period.endAt))}</p>` : ''}
    <div class="ba-actions mt-4">${access.canTrial && canTrial ? btn(`免费试用${pkg.commercial!.trialDays}天`, `data-service-trial="${esc(pkg.id)}"`, true) : ''}${btn('联系服务商开通 / 续期', 'data-service-contact')}</div>
  </section>`;
}

export function renderMerchantServiceCenter(path: string): string {
  if (!canViewMerchantServiceCenter()) return '';
  const context = resolveCurrentSubscriptionContext()!;
  const { snapshot, catalog } = serviceEntitlementData();
  const opened = path.split('?')[0] === `${MERCHANT_SERVICE_CENTER_PATH}/opened`;
  const knownGrants = snapshot.subscriptions
    .filter(grant => !grant.id.startsWith('sub-demo-') && grant.entitlementKind && entitlementApplies(grant, context))
    .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
  const rows = snapshot.packages.filter(pkg => {
    if (opened) return knownGrants.some(grant => grant.packageId === pkg.id);
    if (!packageOnSale(pkg) || pkg.commercial?.chargeType !== 'paid' || pkg.commercial.visibilityScope !== 'all-merchants') return false;
    const release = snapshot.releases.find(item => item.id === pkg.activeReleaseId && item.packageId === pkg.id);
    return release?.routeNodeIds.some(id => catalog.some(node => node.id === id && node.paidMenu));
  });
  return `<section class="ba rounded-xl border border-border bg-card p-6" data-service-gate>
    <h2 class="text-xl font-semibold">服务与订阅</h2>
    <nav aria-label="服务与订阅" class="my-5 flex gap-4 border-b border-border pb-3">
      <button type="button" data-merchant-service-tab="available" class="${opened ? '' : 'font-semibold text-primary'}" aria-pressed="${!opened}">可开通服务</button>
      <button type="button" data-merchant-service-tab="opened" class="${opened ? 'font-semibold text-primary' : ''}" aria-pressed="${opened}">已开通服务</button>
    </nav>
    <div class="space-y-4">${rows.length ? rows.map(pkg => {
      const access = serviceAccess(snapshot, pkg, context);
      return renderMerchantServiceCard(access, !opened, access.grant ?? (opened ? knownGrants.find(grant => grant.packageId === pkg.id) : undefined));
    }).join('') : `<p class="ba-muted py-8 text-center">${opened ? '当前品牌暂无开通记录' : '暂无可开通服务'}</p>`}</div>
  </section>`;
}

export function renderServiceGate(path:string):string|null {
  const rights=currentServiceAccess(path);if(!rights.length||rights.some(r=>r.usable))return null;
  const context=resolveCurrentSubscriptionContext(),principal=currentBrandPrincipal();
  return `<section class="ba rounded-xl border border-border bg-card p-6 md:p-10" data-service-gate><div class="mb-6"><span class="ba-tag">服务未获得有效使用权益</span><h2 class="mt-4 text-xl font-semibold">开通服务后使用当前功能</h2><p class="ba-muted mt-3">菜单已展示，业务数据与操作尚未开放。${context?.brandId?'到期不删除原数据，免费服务继续按原授权使用。':'请先选择具体品牌或门店，不能跨品牌推断服务权益。'}</p></div>${rights.map(r => renderMerchantServiceCard(r, !!principal?.account.admin && context?.brandId === principal.merchantId)).join('')}<p class="ba-muted mt-5">${principal?.account.admin?'服务有效后，员工仍需相应角色权限。':'请联系品牌管理员处理服务开通与试用。'}</p></section>`;
}
export function renderServiceTrialNotice(path:string):string {
  const r=currentServiceAccess(path).find(r=>r.usable);
  if(r?.grant?.entitlementKind!=='trial')return '';
  const remaining=Math.max(0,Math.ceil((Date.parse(r.grant.endAt!)-Date.now())/86400000));
  return `<div class="ba-note text-sm" data-service-notice>${esc(r.package.name)} · 试用剩余${remaining}天 · ${date(r.grant.endAt)}结束${btn('联系服务商开通','data-service-contact')}</div>`;
}
export function bindServiceGate(onMount:()=>void):void {
  document.querySelectorAll<HTMLButtonElement>('[data-merchant-service-tab]').forEach(button => {
    button.onclick = () => {
      const suffix = button.dataset.merchantServiceTab === 'opened' ? '/opened' : '';
      location.hash = `#${MERCHANT_SERVICE_CENTER_PATH}${suffix}`;
    };
  });
  // Labels only: visibility and role gates were already applied by the navigation.
  document.querySelectorAll<HTMLAnchorElement>('#app a[href^="#/"]').forEach(anchor=>{
    if(anchor.closest('[data-service-gate]')||anchor.querySelector('[data-service-menu-state]'))return;
    const rights=currentServiceAccess(anchor.hash.slice(1));if(!rights.length)return;
    const active=rights.find(r=>r.usable), label=active?.label??rights[0].label;
    const menuPath=anchor.hash.slice(1).split('?')[0];
    if(active&&label==='正式生效'&&/^\/team(?:\/|$)/.test(menuPath)&&anchor.closest('nav, aside'))return;
    const tag=document.createElement('span');tag.dataset.serviceMenuState='';tag.className='ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground';
    tag.textContent=active?label:'◇ '+label;anchor.append(tag);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-service-trial]').forEach(b=>b.onclick=()=>{const p=currentBrandPrincipal();if(p?.account.admin)openServiceEntitlement(p.merchantId,b.dataset.serviceTrial!,'trial','merchant',onMount);});
  document.querySelectorAll<HTMLButtonElement>('[data-service-contact]').forEach(b=>b.onclick=()=>showAppToast('请联系服务商确认价格、有效期及适用门店；由服务商记录外部开通结果。'));
}
