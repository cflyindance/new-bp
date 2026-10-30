import {getMerchantById, getStoreById} from './enterprise-merchant-store';
import {readSubscriptionServiceSnapshot} from './subscription-service-store';
import {subscriptionStatusLabel, type SubscriptionServiceSnapshot} from './subscription-service-domain';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** Direct, non-disabled subscriptions only; one subject may have multiple periods. */
export function packageSubscriptionSubjects(snapshot:SubscriptionServiceSnapshot, packageId:string) {
  const groups=new Map<string, typeof snapshot.subscriptions>();
  for(const s of snapshot.subscriptions){
    if(s.packageId!==packageId||s.disabledAt||(s.subjectType!=='brand'&&s.subjectType!=='store'))continue;
    const key=`${s.subjectType}:${s.subjectId}`;
    groups.set(key,[...(groups.get(key)??[]),s]);
  }
  return [...groups.values()];
}

let active:HTMLDialogElement|undefined;
export function openPackageSubjects(packageId:string):void {
  const snapshot=readSubscriptionServiceSnapshot(),pkg=snapshot.packages.find(p=>p.id===packageId);
  if(!pkg)return;
  active?.close();
  const trigger=document.activeElement as HTMLElement|null,d=document.createElement('dialog');active=d;
  d.className='ba ba-modal ba-admin-dialog ba-store-effective';d.dataset.packageSubjects='';d.setAttribute('aria-label',`${pkg.name} · 订阅主体`);
  const groups=packageSubscriptionSubjects(snapshot,packageId);
  const date=(v?:string)=>{if(!v)return '长期';const at=new Date(v);return Number.isFinite(at.getTime())?at.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'—';};
  const rows=groups.map(periods=>{
    const s=periods[0]!,brand=s.subjectType==='brand',entity=brand?getMerchantById(s.subjectId):getStoreById(s.subjectId);
    const name=entity?.name??'主体已移除',id=brand?(getMerchantById(s.subjectId)?.bid??s.subjectId):s.subjectId;
    return `<tr><td>${esc(name)}<div class="ba-muted">${esc(id)}</div></td><td>${brand?'品牌':'门店'}</td><td>${periods.map(p=>`<div style="margin:8px 0">${esc(subscriptionStatusLabel(p,pkg.status))}<div class="ba-muted">${esc(date(p.startAt))} 至 ${esc(date(p.endAt))}</div></div>`).join('')}</td></tr>`;
  }).join('');
  d.innerHTML=`<div class="ba-dialog-inner"><header class="ba-dialog-header"><h2>${esc(pkg.name)} · 订阅主体（${groups.length}）</h2><button type="button" class="ba-btn" data-subject-close aria-label="关闭">×</button></header><section class="ba-dialog-body"><div class="ba-table-wrap"><table class="ba-table"><thead><tr><th>主体名称 / BID / MID</th><th>主体类型</th><th>状态 / 有效期</th></tr></thead><tbody>${rows||'<tr><td colspan="3" class="ba-empty">暂无订阅主体</td></tr>'}</tbody></table></div></section><footer class="ba-footer" style="justify-content:flex-end"><button type="button" class="ba-btn" data-subject-close>关闭</button></footer></div>`;
  const close=()=>{if(d.open)d.close();d.remove();window.removeEventListener('hashchange',close);if(active===d)active=undefined;if(trigger?.isConnected)trigger.focus();};
  d.querySelectorAll('[data-subject-close]').forEach(b=>b.addEventListener('click',close));
  d.addEventListener('cancel',e=>{e.preventDefault();close()});d.addEventListener('close',close,{once:true});
  d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
  document.body.append(d);d.showModal();window.addEventListener('hashchange',close);
}
