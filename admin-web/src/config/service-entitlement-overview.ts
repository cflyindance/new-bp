import { bindBrandMoreActions, renderBrandMoreActions } from './brand-more-actions';
import { bindStoreBusinessStatusFilter,storeBusinessStatusFilter } from './store-business-status-filter';
import './service-entitlement-filters.css';
import basicIcon from './rights-basic.png';
import marketingIcon from './rights-marketing.png';
import growthIcon from './rights-growth.png';
import loyaltyIcon from './rights-loyalty.png';
import {packageOnSale} from './service-package-lifecycle-domain';
import {openEntitlementDrawer,closeDetachedEntitlementDrawer} from './service-entitlement-drawer';
import {renderEntitlementAudit,bindEntitlementAudit} from './service-entitlement-audit-ui';
import {getMerchantStores,getStoreOperatingStatus} from './enterprise-merchant-store';
import {serviceAccess,grantActive} from './service-entitlement-domain';
import {subscriptionAgreedPrice} from './subscription-agreed-price';
import {readSubscriptionServiceSnapshot} from './subscription-service-store';
import {SUBSCRIPTION_SERVICE_ROUTE_PREFIX} from './subscription-service-scope';
import type {MerchantSubscription,ServicePackage} from './subscription-service-domain';

const serviceIcons: Record<string,string> = {
 DEMO_ENT_BASIC:basicIcon, DEMO_ENT_MARKETING:marketingIcon,
 DEMO_ENT_GROWTH:growthIcon, DEMO_ENT_LOYALTY:loyaltyIcon,
};
const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const date=(v?:string,empty='长期')=>{if(!v)return empty;const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'—';};
const button=(label:string,attrs:string,style="")=>`<button type="button" class="ba-btn ${style}" ${attrs}>${label}</button>`;
const referenceLabel = (g: MerchantSubscription): string =>
  g.entitlementKind === 'paid' ? '开通依据' : g.entitlementKind === 'gift' ? '赠送原因' : '开通说明';
const method=(g:MerchantSubscription)=>({free:'免费开通',trial:'试用',paid:'付费开通',gift:'赠送'})[g.entitlementKind!]??'标准订阅';
const status=(g:MerchantSubscription)=>g.disabledAt?'已停用':!Number.isFinite(Date.parse(g.startAt))||(g.endAt&&!Number.isFinite(Date.parse(g.endAt)))?'日期异常':g.endAt&&Date.parse(g.endAt)<=Date.now()?g.entitlementKind==='trial'?'试用已结束':'已到期':Date.parse(g.startAt)>Date.now()?'待生效':'生效中';
const current=(g:MerchantSubscription)=>!g.disabledAt&&Number.isFinite(Date.parse(g.startAt))&&(!g.endAt||Date.parse(g.endAt)>Date.now());

export function renderEntitlementOverview(brandId:string,embedded:boolean,mayManage:(action?:'create'|'extend'|'disable')=>boolean,cards=false):string {
 const snapshot=readSubscriptionServiceSnapshot(),stores=getMerchantStores(brandId);
 const grants=snapshot.subscriptions.filter(g=>g.subjectType==='brand'&&g.subjectId===brandId&&g.entitlementKind&&!g.id.startsWith('sub-demo-'));
 const audits=snapshot.audit.filter(a=>a.objectType==='subscription'&&grants.some(g=>g.id===a.objectId));
 const packages:ServicePackage[]=snapshot.packages.filter(p=>p.commercial||grants.some(g=>g.packageId===p.id));
 for(const id of new Set(grants.map(g=>g.packageId)))if(!packages.some(p=>p.id===id))packages.push({id,code:'',name:'服务已移除',status:'disabled',priceMinor:0,currency:'CNY',billingInterval:'month',createdAt:'',updatedAt:''});
 const grantScope=(g:MerchantSubscription)=>g.scopeMode==='selected'?`<button type="button" class="text-primary hover:underline" data-rights-stores="${esc(g.packageId)}" data-rights-grant="${esc(g.id)}">指定 ${new Set(g.storeIds??[]).size} 家门店</button>`:`<button type="button" class="text-primary hover:underline" data-rights-stores="${esc(g.packageId)}" data-rights-grant="${esc(g.id)}">全部门店（含新增）</button>`;
 const recordCells=(g:MerchantSubscription, card=false)=>{
  const price=subscriptionAgreedPrice(g),trialFree=g.entitlementKind==='trial'&&g.agreedPriceMinor===0,recordStatus=status(g);
  const basis = (style = '') => g.reference || g.disableReason
    ? button(g.disabledAt && g.disableReason ? '查看停用原因' : '查看' + referenceLabel(g),
      `data-rights-basis="${esc(g.id)}" aria-haspopup="dialog"`, style) : '';
  const extend = grantActive(g) && snapshot.packages.some(p => p.id === g.packageId && packageOnSale(p))
    && mayManage('extend') && ['paid','gift'].includes(g.entitlementKind!)
    ? button(g.entitlementKind === 'gift' ? '延长赠送' : '续期', `data-ent-extend="${esc(g.id)}"`, card ? 'rights-record-extend' : '') : '';
  const disable = !g.disabledAt && mayManage('disable') ? button('停用', `data-ent-disable="${esc(g.id)}"`) : '';
  const more = (items: string, size: string) => items
    ? `<div class="rights-more-${size}">${renderBrandMoreActions('更多权益操作', items)}</div>` : '';
  const recordActions = card
    ? extend + basis('rights-text-action rights-basis-wide') + more(disable, 'wide') + more(basis() + disable, 'narrow')
    : basis() + extend + disable;
  return `<td data-rights-method>${method(g)}</td><td data-rights-metric="适用门店">${grantScope(g)}</td><td data-rights-metric="有效期">${date(g.startAt,'—')}<div class="ba-muted">至 ${date(g.endAt)}</div></td><td data-rights-metric="成交单价">${trialFree?'免费试用':esc(price.amount)}${!trialFree&&price.basis?`<div class="ba-muted">${esc(price.basis)}</div>`:''}</td><td data-rights-row-status><span class="ba-tag" data-tone="${recordStatus==='已停用'?'stopped':recordStatus==='日期异常'?'warning':'neutral'}">${recordStatus}</span></td><td data-rights-record-actions><div class="ba-actions">${recordActions}</div></td>`;
 };
 const historyTable=(list:MerchantSubscription[])=>`<div class="ba-table-wrap"><table class="rights-history-table"><thead><tr><th scope="col">开通方式</th><th scope="col">适用门店</th><th scope="col">有效期</th><th scope="col">成交单价</th><th scope="col">权益状态</th><th scope="col">操作</th></tr></thead><tbody>${list.map(g=>`<tr data-rights-record="${esc(g.id)}">${recordCells(g)}</tr>`).join('')}</tbody></table></div>`;
 const rows=packages.map((pkg,index)=>{
  const related=grants.filter(g=>g.packageId===pkg.id),live=related.filter(current),history=related.filter(g=>!current(g));
  const result=serviceAccess(snapshot,pkg,{brandId}),covered=stores.filter(s=>serviceAccess(snapshot,pkg,{brandId,storeId:s.storeId}).usable);
  let state=result.usable?(result.grant?.entitlementKind==='trial'?'试用中':'生效中'):covered.length?'部分门店可用':result.label==='仅指定门店可用'?'无可用门店':result.label;
  if(state==='未开通'&&live.some(g=>Date.parse(g.startAt)>Date.now()))state='待生效';
  if(state==='未开通'&&related.length){const latest=[...related].sort((a,b)=>Date.parse(b.disabledAt??b.endAt??b.startAt)-Date.parse(a.disabledAt??a.endAt??a.startAt))[0]!;state=status(latest);if(state==='生效中')state='无可用门店';}
  const actions=mayManage()&&packageOnSale(pkg)&&pkg.commercial?(pkg.commercial.chargeType==='free'?button('免费开通',`data-ent-new="free" data-pkg="${esc(pkg.id)}"`,'rights-service-primary'):`${button('付费开通',`data-ent-new="paid" data-pkg="${esc(pkg.id)}"`,'rights-service-primary')}${button('赠送',`data-ent-new="gift" data-pkg="${esc(pkg.id)}"`,'rights-service-secondary')}${result.canTrial?button('开始试用',`data-ent-new="trial" data-pkg="${esc(pkg.id)}"`):''}`):'';
  const exists=snapshot.packages.some(p=>p.id===pkg.id);

  const historyButton = history.length ? button(`历史权益（${history.length}）`, 'data-rights-history-open aria-haspopup="dialog"', cards ? 'rights-text-action' : '') : '';
  const groupActions = `<div data-rights-group-actions class="ba-actions">${cards ? actions + historyButton : historyButton + actions}</div>`;
  const nameCell=`<td data-rights-group-name rowspan="${Math.max(1,live.length)}" style="vertical-align:top;min-width:200px">${cards&&serviceIcons[pkg.code]?`<span class="brand-rights-icon"><img src="${serviceIcons[pkg.code]}" alt=""></span>`:''}<span class="brand-rights-name">${exists?`<button type="button" class="text-primary font-semibold hover:underline" data-ent-menu="${esc(pkg.id)}" aria-haspopup="dialog">${esc(pkg.name)}</button>`:`<strong>${esc(pkg.name)}</strong>`}${['部分门店可用','服务已停用','无可用门店','日期异常'].includes(state)&&!cards?`<div class="ba-muted" style="margin-top:6px">${esc(state)}</div>`:''}${cards?`<small>${esc(live.length===1?method(live[0]!):live.length?`共 ${live.length} 条权益`:state)}</small></span><span class="brand-rights-status" data-tone="${['生效中','试用中','部分门店可用'].includes(state)?'active':state==='待生效'?'pending':'neutral'}">${esc(state)}</span>${actions || historyButton ? groupActions : ''}`:'</span>'}</td>`;
  const dataScope=(g:MerchantSubscription)=>g.scopeMode==='selected'?[...new Set(g.storeIds??[])]:stores.map(s=>s.storeId);
  const mainRows=live.length?live.map((g,i)=>`<tr data-rights-current-row data-rights-record="${esc(g.id)}" data-row-stores="${esc(JSON.stringify(dataScope(g)))}">${i===0?nameCell:''}${recordCells(g,cards)}</tr>`).join(''):`<tr data-rights-current-row data-row-stores="[]">${nameCell}<td data-rights-method>—</td><td data-rights-metric="适用门店">—</td><td data-rights-metric="有效期">—</td><td data-rights-metric="成交单价">—</td><td data-rights-row-status><span class="ba-tag">${related.length?'无当前权益':'未开通'}</span></td><td data-rights-record-actions></td></tr>`;
  return `<tbody data-rights-service="${esc(pkg.id)}" data-title="${esc(pkg.name.toLowerCase())}" data-state="${esc(state)}">${mainRows}${cards ? '' : `<tr data-rights-controls hidden><td colspan="7">${groupActions}</td></tr>`}${history.length?`<tr data-rights-detail hidden id="rights-${index}"><td colspan="7"><div data-rights-detail-content>${historyTable(history)}</div></td></tr>`:''}</tbody>`;
 }).join('');
 return `<section class="ba" data-brand-entitlements="${esc(brandId)}"${cards?' data-rights-cards':''}>${embedded||cards?'':`<header class="ba-head"><h2>品牌服务权益</h2><a class="ba-btn" href="#${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}">服务包管理</a></header>`}<div class="ba-tabs" style="position:sticky;top:0;z-index:5;background:var(--color-background)" role="tablist" aria-label="服务权益视图">${cards?'<h2>品牌服务权益</h2>':''}<button type="button" role="tab" id="rights-services-tab" aria-controls="rights-services-panel" aria-selected="true" tabindex="0" data-rights-tab="services" class="active">服务权益</button>${cards?'<button class="ba-btn" type="button" data-rights-audit-open aria-haspopup="dialog">权益变更记录</button>':`<button type="button" role="tab" id="rights-audit-tab" aria-controls="rights-audit-panel" aria-selected="false" tabindex="-1" data-rights-tab="audit">变更记录（${audits.length}）</button>`}</div><div data-rights-panel="services" id="rights-services-panel" role="tabpanel" aria-labelledby="rights-services-tab"><div class="rights-filter-toolbar" data-rights-filters><input class="rights-filter-search" type="search" data-rights-query aria-label="搜索服务名称" placeholder="搜索服务名称"><select aria-label="权益状态" data-rights-status><option value="">权益状态</option>${['生效中','试用中','部分门店可用','待生效','未开通','已到期','试用已结束','已停用','服务已停用','无可用门店','日期异常'].map(t=>`<option>${t}</option>`).join('')}</select><select aria-label="适用门店" data-rights-store><option value="">适用门店</option>${stores.map(s=>`<option value="${esc(s.storeId)}">${esc(s.name)}</option>`).join('')}</select><button type="button" class="ba-btn rights-filter-reset" data-rights-reset><span aria-hidden="true">⟳</span> 重置</button></div><div class="ba-table-wrap"><table data-rights-current-table style="min-width:1200px"><thead><tr><th>服务名称</th><th>开通方式</th><th>适用门店</th><th>有效期</th><th>成交单价</th><th>权益状态</th><th>操作</th></tr></thead>${rows}</table><p class="ba-empty" data-rights-empty${packages.length?' hidden':''}>没有符合条件的服务</p></div></div>${cards?`<dialog class="ba ba-modal brand-design-modal brand-rights-audit-modal" data-rights-audit-dialog aria-label="权益变更记录"><div class="ba-dialog-inner"><header class="ba-dialog-header"><button type="button" class="ba-btn" data-rights-audit-close aria-label="关闭权益变更记录">×</button><h2>权益变更记录</h2></header><div class="ba-dialog-body">${renderEntitlementAudit(audits,true)}</div></div></dialog>`:`<div data-rights-panel="audit" id="rights-audit-panel" role="tabpanel" aria-labelledby="rights-audit-tab" hidden>${renderEntitlementAudit(audits)}</div>`}</section>`;
}

const views=new Map<string,{q:string;state:string;store:string;tab:'services'|'audit';scroll:{services:number;audit:number}}>();
let scopeDialog:HTMLDialogElement|undefined;
let basisDialog:HTMLDialogElement|undefined;
export function bindEntitlementOverview():void {
 const root=document.querySelector<HTMLElement>('[data-brand-entitlements]');if(!root)return;
 closeDetachedEntitlementDrawer(root);
 const auditDialog=root.querySelector<HTMLDialogElement>('[data-rights-audit-dialog]');
 const auditTrigger=root.querySelector<HTMLButtonElement>('[data-rights-audit-open]');
 auditTrigger?.addEventListener('click',()=>auditDialog?.showModal());
 auditDialog?.querySelector('[data-rights-audit-close]')?.addEventListener('click',()=>auditDialog.close());
 auditDialog?.addEventListener('close',()=>auditTrigger?.focus());
 bindEntitlementAudit(root);
 bindBrandMoreActions(root);
 const key=root.dataset.brandEntitlements!,viewKey=root.hasAttribute('data-rights-cards')?key+':cards':key,view=views.get(viewKey)??{q:'',state:'',store:'',tab:'services' as const,scroll:{services:0,audit:0}};views.set(viewKey,view);
 const scrollHost=(()=>{let n=root.parentElement;while(n){if(['auto','scroll'].includes(getComputedStyle(n).overflowY))return n;n=n.parentElement;}return document.scrollingElement as HTMLElement;})();
 const tabs=[...root.querySelectorAll<HTMLButtonElement>('[data-rights-tab]')];
 const activate=(tab:'services'|'audit',save=true)=>{root.dataset.activeRightsTab=tab;if(save)view.scroll[view.tab]=scrollHost.scrollTop;view.tab=tab;tabs.forEach(b=>{const active=b.dataset.rightsTab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});root.querySelectorAll<HTMLElement>('[data-rights-panel]').forEach(panel=>panel.hidden=panel.dataset.rightsPanel!==tab);requestAnimationFrame(()=>{if(root.isConnected)scrollHost.scrollTop=view.scroll[tab];});};
 tabs.forEach((b,index)=>{b.onclick=()=>activate(b.dataset.rightsTab as 'services'|'audit');b.onkeydown=e=>{let next=index;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();tabs[next]!.focus();activate(tabs[next]!.dataset.rightsTab as 'services'|'audit');};});
 activate(view.tab,false);
 root.querySelector<HTMLInputElement>('[data-rights-query]')!.value=view.q;root.querySelector<HTMLSelectElement>('[data-rights-status]')!.value=view.state;root.querySelector<HTMLSelectElement>('[data-rights-store]')!.value=view.store;
 root.querySelectorAll<HTMLButtonElement>('[data-rights-history-open]').forEach(b=>b.onclick=()=>openEntitlementDrawer(root,b));
 const filter=()=>{const q=root.querySelector<HTMLInputElement>('[data-rights-query]')!.value.trim().toLowerCase(),state=root.querySelector<HTMLSelectElement>('[data-rights-status]')!.value,store=root.querySelector<HTMLSelectElement>('[data-rights-store]')!.value;view.q=q;view.state=state;view.store=store;let count=0;
  root.querySelectorAll<HTMLElement>('[data-rights-service]').forEach(group=>{const rows=[...group.querySelectorAll<HTMLTableRowElement>('[data-rights-current-row]')],visible=rows.filter(row=>!store||JSON.parse(row.dataset.rowStores??'[]').includes(store));rows.forEach(row=>row.hidden=!visible.includes(row));group.hidden=!!((q&&!group.dataset.title?.includes(q))||(state&&group.dataset.state!==state)||!visible.length);if(group.hidden)return;count++;
   const name=group.querySelector<HTMLTableCellElement>('[data-rights-group-name]')!,actions=group.querySelector<HTMLElement>('[data-rights-group-actions]')!;name.rowSpan=visible.length;visible[0]!.prepend(name);if(actions&&!name.contains(actions))visible[0]!.querySelector('[data-rights-record-actions]')!.append(actions);
  });root.querySelector<HTMLElement>('[data-rights-empty]')!.hidden=count>0;
 };
 filter();
 root.querySelector('[data-rights-query]')?.addEventListener('input',filter);root.querySelectorAll('[data-rights-status],[data-rights-store]').forEach(el=>el.addEventListener('change',filter));
 root.querySelector('[data-rights-reset]')?.addEventListener('click',()=>{
  root.querySelector<HTMLInputElement>('[data-rights-query]')!.value='';
  root.querySelectorAll<HTMLSelectElement>('[data-rights-status],[data-rights-store]').forEach(control=>control.value='');
  filter();
 });
 root.querySelectorAll<HTMLButtonElement>('[data-rights-basis]').forEach(b=>b.onclick=()=>{
  basisDialog?.close();const g=readSubscriptionServiceSnapshot().subscriptions.find(g=>g.id===b.dataset.rightsBasis&&g.subjectType==='brand'&&g.subjectId===key);if(!g)return;
  const d=document.createElement('dialog');basisDialog=d;d.className='ba ba-modal ba-admin-dialog';d.style.maxWidth='640px';d.dataset.rightsBasisDialog='';const stopped=!!(g.disabledAt&&g.disableReason),title=stopped?'停用原因':referenceLabel(g);d.setAttribute('aria-label',title);if(b.closest('[data-rights-drawer]'))d.dataset.rightsDrawerChild='';
  d.innerHTML=`<div class="ba-dialog-inner"><header class="ba-dialog-header"><h2>${title}</h2><button type="button" class="ba-btn" data-basis-close aria-label="关闭">×</button></header><section class="ba-dialog-body"><dl>${g.reference?`<dt class="ba-muted">${referenceLabel(g)}</dt><dd style="margin:8px 0 18px;white-space:pre-wrap;overflow-wrap:anywhere">${esc(g.reference)}</dd>`:''}${g.disableReason?`<dt class="ba-muted">停用原因</dt><dd style="margin:8px 0;white-space:pre-wrap;overflow-wrap:anywhere">${esc(g.disableReason)}</dd>`:''}${!g.reference&&!g.disableReason?'<p>未记录说明</p>':''}</dl></section><footer class="ba-footer" style="justify-content:flex-end"><button type="button" class="ba-btn" data-basis-close>关闭</button></footer></div>`;
  let closed=false;const observer=new MutationObserver(()=>{if(!root.isConnected)close();});const close=()=>{if(closed)return;closed=true;observer.disconnect();if(d.open)d.close();d.remove();window.removeEventListener('hashchange',close);if(basisDialog===d)basisDialog=undefined;if(b.isConnected)b.focus({preventScroll:true});};d.querySelectorAll('[data-basis-close]').forEach(el=>el.addEventListener('click',close));d.addEventListener('cancel',e=>{e.preventDefault();close();});d.addEventListener('close',close,{once:true});d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});document.body.append(d);d.showModal();observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',close);
 });
 root.querySelectorAll<HTMLButtonElement>('[data-rights-stores]').forEach(b=>b.onclick=()=>{
  scopeDialog?.close();const stores=getMerchantStores(root.dataset.brandEntitlements!),snapshot=readSubscriptionServiceSnapshot(),grants=snapshot.subscriptions.filter(g=>g.subjectType==='brand'&&g.subjectId===root.dataset.brandEntitlements&&g.packageId===b.dataset.rightsStores&&g.entitlementKind);
  const selected=b.dataset.rightsGrant?grants.filter(g=>g.id===b.dataset.rightsGrant):grants.filter(current).filter(g=>grantActive(g)||!grants.some(g=>current(g)&&grantActive(g)));
  const all=selected.some(g=>g.scopeMode!=='selected'),ids=all?stores.map(s=>s.storeId):[...new Set(selected.flatMap(g=>g.storeIds??[]))];
  const storesById = new Map(stores.map(store => [store.storeId, store]));
  const rows = ids.map(id => {
    const store = storesById.get(id);
    const status = store ? getStoreOperatingStatus(store) : undefined;
    const state = status?.status ?? 'unknown';
    const label = state === 'open' ? '营业中' : state === 'terminated' ? '关店' : status?.label ?? '营业情况未知';
    return `<tr data-operating-status="${state}">
      <td><div class="brand-store-identity"><div><strong>${esc(store?.name ?? '门店已移除或不属于当前品牌')}</strong><small class="ba-muted">${esc(id)}</small></div></div></td>
      <td class="brand-store-address">${esc(store?.address?.trim() || '—')}</td>
      <td>${esc(store?.postalCode?.trim() || '—')}</td>
      <td><span class="ba-tag ba-create-store-status" data-status="${state}">${esc(label)}</span></td>
    </tr>`;
  }).join('');

  const d = document.createElement('dialog');
  scopeDialog = d;
  d.className = 'ba ba-modal brand-design-modal brand-rights-store-modal';
  d.setAttribute('aria-label', '适用门店');
  d.dataset.rightsStoreDialog = '';
  if (b.closest('[data-rights-drawer]')) d.dataset.rightsDrawerChild = '';
  d.innerHTML = `<div class="ba-dialog-inner">
    <header class="ba-dialog-header">
      <button type="button" class="ba-btn" data-close aria-label="关闭">×</button>
      <h2>适用门店</h2>
    </header>
    <section class="ba-dialog-body"><div class="brand-modal-card">
      <div class="brand-rights-store-toolbar">
        <span>${all ? '全部品牌门店（含新增）' : '指定门店'} <span class="ba-muted">· ${ids.length} 家</span></span>
        ${storeBusinessStatusFilter('', true)}
      </div>
      <div class="ba-table-wrap brand-store-table"><table>
        <thead><tr><th scope="col">门店名称 / MID</th><th scope="col">地址</th><th scope="col">邮编</th><th scope="col">营业状态</th></tr></thead>
        <tbody>${rows}<tr data-operating-empty ${rows ? 'hidden' : ''}><td class="ba-empty" colspan="4">${rows ? '没有符合营业状态的门店' : '暂无适用门店'}</td></tr></tbody>
      </table></div>
    </div></section>
  </div>`;
  bindStoreBusinessStatusFilter(d);
  const close=()=>{if(d.open)d.close();d.remove();window.removeEventListener('hashchange',close);if(scopeDialog===d)scopeDialog=undefined;const trigger=b.closest('[data-brand-more]')?.querySelector<HTMLButtonElement>('[data-brand-more-trigger]')??b;if(trigger.isConnected)trigger.focus();};d.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',close));d.addEventListener('cancel',e=>{e.preventDefault();close()});d.addEventListener('close',close,{once:true});d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});document.body.append(d);d.showModal();window.addEventListener('hashchange',close);
 });
}
