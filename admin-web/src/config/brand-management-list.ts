import './brand-management-list.css';
import {getMerchants,getMerchantStatusLabel,countStoresForMerchant} from './enterprise-merchant-store';
import {brandRawMenuKeys,brandMenuChoices,brandPrimaryAdminEmail} from './brand-access-store';
import {brandOnboardingProgress} from './brand-service-lifecycle';
import {serviceStatus} from './brand-service-policy';
import {merchantDetailHref} from './enterprise-merchant-scope';
import {canImpersonateMerchant} from './enterprise-merchant-impersonate';
import {filteredManagementBrands,savedManagementFilter,type ManagementFilter} from './management-list-filters';
import {currentMAccess} from '../permissions/m-platform-store';
import {mPageKey,mActionKey} from '../permissions/m-platform-catalog';

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const stages=['待开通管理员','待配置品牌菜单','待首次登录','已首次登录','初始化已完成'];
const icon=(paths:string)=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${paths}</svg>`;
const searchIcon=icon('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>');
const calendarIcon=icon('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>');
const buildingIcon='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M5 5.5 13 3v18l-8-2V5.5Zm10 2 4-1V20l-4 1V7.5Z"/><path d="M8 8h2v2H8zm0 4h2v2H8z" fill="white"/></svg>';
const resetIcon=icon('<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>');
const moreIcon='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';
const filterNames=['query','status','progress','from','to'];
export function readBrandListFilter():ManagementFilter {
  const saved=savedManagementFilter('brand');
  return Object.fromEntries(filterNames.map(k=>[k,saved[k]??'']));
}
function select(name:string,title:string,options:[string,string][],f:ManagementFilter):string {
  return `<label class="brand-filter-pill"><span class="sr-only">${title}</span><select name="${name}" aria-label="${title}"><option value="">${title}</option>${options.map(([value,label])=>`<option value="${esc(value)}" ${f[name]===value?'selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
}
function dateLabel(f:ManagementFilter):string {return f.from||f.to?`${f.from||'不限'} → ${f.to||'不限'}`:'创建时间起 → 创建时间止';}
export function renderBrandListFilters():string {
  const f=readBrandListFilter(),canCreate=currentMAccess(mPageKey('brands'))==='edit';
  return `<form class="brand-list-filters" data-brand-list-filter role="search"><h1 id="main-content" tabindex="-1" class="sr-only">品牌管理</h1>
    <div class="brand-list-toolbar"><label class="brand-list-search">${searchIcon}<span class="sr-only">搜索品牌</span><input type="search" name="query" value="${esc(f.query)}" placeholder="品牌名称/BID/编码/管理员账号" autocomplete="off"></label>
    ${canCreate?'<a class="brand-create-button" href="#/m-platform/merchants/new"><span aria-hidden="true">＋</span> 新增品牌</a>':'<button type="button" class="brand-create-button" disabled title="暂无品牌编辑权限"><span aria-hidden="true">＋</span> 新增品牌</button>'}</div>
    <div class="brand-list-filter-row">${select('status','服务状态',[['onboarding','待启用'],['active','已启用'],['suspended','已暂停'],['closed','已关闭']],f)}${select('progress','开通进度',stages.map(s=>[s,s]),f)}
    <div class="brand-date-anchor"><button type="button" class="brand-date-trigger" data-brand-date-toggle aria-expanded="false" aria-controls="brand-date-panel">${calendarIcon}<span data-brand-date-label>${esc(dateLabel(f))}</span></button>
    <section class="brand-date-panel" id="brand-date-panel" data-brand-date-panel hidden aria-label="筛选创建日期"><div class="brand-date-inputs"><label>开始日期<input type="date" name="from" value="${esc(f.from)}"></label><span aria-hidden="true">—</span><label>结束日期<input type="date" name="to" value="${esc(f.to)}"></label></div><p role="alert" data-brand-date-error hidden></p><div class="brand-date-actions"><button type="button" data-brand-date-clear>清除日期</button><button type="button" data-brand-date-apply>应用</button></div></section></div>
    <button type="button" class="brand-list-reset" data-brand-filter-reset>${resetIcon}<span>重置</span></button></div></form>`;
}
export function renderBrandManagementTable(merchants:ReturnType<typeof getMerchants>):string {
  const choices=brandMenuChoices(['pos','kiosk','emenu','sdi']);
  return `<table class="brand-management-table" data-enterprise-merchant-chain-list><colgroup><col class="brand-name-col"><col><col class="brand-progress-col"><col><col><col class="brand-admin-col"><col class="brand-date-col"><col class="brand-action-col"></colgroup><thead><tr><th scope="col">品牌名称 / BID</th><th scope="col">服务状态</th><th scope="col">开通进度</th><th scope="col">品牌菜单</th><th scope="col">关联门店</th><th scope="col">主管理员</th><th scope="col">创建日期</th><th scope="col" class="brand-action-cell">操作</th></tr></thead><tbody>${merchants.map((m,i)=>{
    const keys=brandRawMenuKeys(m.merchantId),pages=choices.filter(c=>c.isPage&&keys.has(c.key)).length,stores=countStoresForMerchant(m.merchantId),email=brandPrimaryAdminEmail(m.merchantId),stage=brandOnboardingProgress(m.merchantId),stageIndex=stages.indexOf(stage);
    return `<tr data-enterprise-merchant-row="${esc(m.merchantId)}"><td><a class="brand-name-link" href="${merchantDetailHref(m.merchantId)}"><span class="brand-avatar ${i%2?'brand-avatar-violet':''}">${buildingIcon}</span><span class="brand-name-text"><strong title="${esc(m.name)}">${esc(m.name)}</strong><small>${esc(m.bid??'—')}</small></span></a></td>
    <td><span class="brand-service-status" data-state="${serviceStatus(m.status)}"><i aria-hidden="true"></i>${esc(getMerchantStatusLabel(m.status))}</span></td>
    <td><div class="brand-progress" aria-label="开通进度：${esc(stage)}"><span>${esc(stage)}</span><span class="brand-progress-track" aria-hidden="true"><span style="width:${stageIndex<0?0:(stageIndex+1)*20}%"></span></span></div></td>
    <td><a class="brand-count ${pages?'':'brand-count-empty'}" href="${merchantDetailHref(m.merchantId,'capabilities')}" aria-label="查看${esc(m.name)}品牌菜单，${pages?pages+'个页面':'未配置'}">${pages||'未配置'}</a></td>
    <td><a class="brand-count ${stores?'':'brand-count-empty'}" href="${merchantDetailHref(m.merchantId,'org')}" aria-label="查看${esc(m.name)}关联门店，${stores}家">${stores}</a></td>
    <td><span class="brand-admin-email" title="${esc(email||'待开通')}">${esc(email||'待开通')}</span></td><td class="brand-created-date">${esc(m.createdAt?.slice(0,10)||'—')}</td>
    <td class="brand-action-cell"><button type="button" class="brand-row-more" data-brand-row-more="${esc(m.merchantId)}" aria-label="${esc(m.name)}的更多操作" aria-haspopup="menu" aria-expanded="false" aria-controls="brand-row-menu">${moreIcon}</button></td></tr>`;
  }).join('')||'<tr><td colspan="8"><div class="brand-list-empty">没有匹配的品牌<span>请调整搜索或筛选条件</span></div></td></tr>'}</tbody></table>`;
}
let activeEvents:AbortController|undefined;
export function bindBrandManagementList(render:(f:ManagementFilter)=>void):void {
  const root=document.querySelector<HTMLElement>('[data-enterprise-merchant-page="list"]');if(!root||root.dataset.brandListBound)return;
  activeEvents?.abort();const controller=activeEvents=new AbortController(),{signal}=controller;root.dataset.brandListBound='true';
  const form=root.querySelector<HTMLFormElement>('[data-brand-list-filter]')!,menu=root.querySelector<HTMLElement>('[data-brand-row-menu]')!,datePanel=form.querySelector<HTMLElement>('[data-brand-date-panel]')!,dateToggle=form.querySelector<HTMLButtonElement>('[data-brand-date-toggle]')!;
  const input=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement;
  let applied=readBrandListFilter(),timer:ReturnType<typeof setTimeout>|undefined,trigger:HTMLButtonElement|undefined;
  const closeMenu=(focus=false)=>{menu.hidden=true;trigger?.setAttribute('aria-expanded','false');if(focus&&trigger?.isConnected)trigger.focus();trigger=undefined;};
  const closeDate=(focus=false)=>{datePanel.hidden=true;dateToggle.setAttribute('aria-expanded','false');input('from').value=applied.from;input('to').value=applied.to;form.querySelector<HTMLElement>('[data-brand-date-error]')!.hidden=true;if(focus)dateToggle.focus();};
  const apply=(f:ManagementFilter)=>{clearTimeout(timer);closeMenu();applied={...f};try{sessionStorage.setItem('menusifu:management-filters:v1:brand',JSON.stringify(applied));}catch{}render(applied);form.querySelector('[data-brand-date-label]')!.textContent=dateLabel(applied);};
  const search=()=>apply({...applied,query:input('query').value});
  form.addEventListener('submit',e=>{e.preventDefault();search();},{signal});
  input('query').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,300);},{signal});
  ['status','progress'].forEach(name=>input(name).addEventListener('change',()=>apply({...applied,query:input('query').value,[name]:input(name).value}),{signal}));
  form.querySelector('[data-brand-filter-reset]')!.addEventListener('click',()=>{const f=Object.fromEntries(filterNames.map(k=>[k,'']));filterNames.forEach(k=>input(k).value='');apply(f);closeDate();},{signal});
  dateToggle.addEventListener('click',()=>{closeMenu();if(!datePanel.hidden){closeDate();return;}datePanel.hidden=false;dateToggle.setAttribute('aria-expanded','true');input('from').focus();},{signal});
  form.querySelector('[data-brand-date-clear]')!.addEventListener('click',()=>{apply({...applied,from:'',to:'',query:input('query').value});closeDate(true);},{signal});
  form.querySelector('[data-brand-date-apply]')!.addEventListener('click',()=>{const from=input('from').value,to=input('to').value;if(from&&to&&from>to){const error=form.querySelector<HTMLElement>('[data-brand-date-error]')!;error.hidden=false;error.textContent='开始日期不能晚于结束日期';return;}apply({...applied,from,to,query:input('query').value});closeDate(true);},{signal});
  root.addEventListener('click',e=>{
    const button=(e.target as Element).closest<HTMLButtonElement>('[data-brand-row-more]');if(!button)return;
    if(trigger===button&&!menu.hidden){closeMenu();return;}closeMenu();closeDate();
    const merchant=getMerchants({allEnterprises:true,excludeLinkedStoreTenants:true}).find(m=>m.merchantId===button.dataset.brandRowMore);if(!merchant)return;
    trigger=button;button.setAttribute('aria-expanded','true');menu.innerHTML=`<a role="menuitem" href="${merchantDetailHref(merchant.merchantId)}">查看详情</a>${canImpersonateMerchant(merchant)&&currentMAccess(mActionKey('brands','impersonate'))==='edit'?`<button type="button" role="menuitem" data-merchant-impersonate="${esc(merchant.merchantId)}">代登录</button>`:''}`;
    menu.hidden=false;const rect=button.getBoundingClientRect(),height=menu.offsetHeight;menu.style.left=Math.max(8,Math.min(innerWidth-176,rect.right-168))+'px';menu.style.top=(rect.bottom+height+8>innerHeight?Math.max(8,rect.top-height-6):rect.bottom+6)+'px';menu.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  },{signal});
  document.addEventListener('click',e=>{const target=e.target as Node;if(!menu.contains(target)&&!trigger?.contains(target))closeMenu();if(!datePanel.contains(target)&&!dateToggle.contains(target))closeDate();},{signal});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!menu.hidden){e.preventDefault();closeMenu(true);}else if(!datePanel.hidden){e.preventDefault();closeDate(true);}}else if(!menu.hidden&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();const items=[...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];const i=items.indexOf(document.activeElement as HTMLElement);items[(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}},{signal});
  root.querySelector('[data-enterprise-merchant-table]')!.addEventListener('scroll',()=>closeMenu(),{signal});
  window.addEventListener('resize',()=>{closeMenu();closeDate();},{signal});
  window.addEventListener('hashchange',()=>controller.abort(),{signal,once:true});signal.addEventListener('abort',()=>clearTimeout(timer));
  apply(applied);
}
