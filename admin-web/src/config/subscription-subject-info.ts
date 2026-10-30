import {getMerchantById,getMerchantStores,getStoreById,getMerchantStatusLabel,getStoreStatusLabel} from './enterprise-merchant-store';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const date=(v?:string)=>{if(!v)return '—';const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'—';};
let active:HTMLDialogElement|undefined;

/** Current subject facts only; does not navigate, provision or alter subscriptions. */
export function openSubscriptionSubjectInfo(type:string,id:string):void {
 if(type!=='brand'&&type!=='store')return;
 active?.close();
 const trigger=document.activeElement as HTMLElement|null,isBrand=type==='brand',brand=isBrand?getMerchantById(id):undefined,store=!isBrand?getStoreById(id):undefined;
 const owner=store?getMerchantById(store.merchantId):undefined,entity=brand??store;
 const fields:Array<[string,unknown]>=brand?[
  ['品牌名称',brand.name],['BID',brand.bid??id],['品牌类型',brand.orgType==='chain'?'连锁':'单店'],['服务状态',getMerchantStatusLabel(brand.status)],
  ['联系人',brand.contactName],['联系电话',brand.contactPhone],['主管理员',brand.primaryAdminEmail],['品牌门店',`${getMerchantStores(id).length} 家`],['创建时间',date(brand.createdAt)],['时区',brand.timezone],
 ]:store?[
  ['门店名称',store.name],['MID',store.storeId],['所属品牌',owner?.name],['品牌BID',owner?.bid],['门店状态',getStoreStatusLabel(store.status)],['地址',store.address],['邮编',store.postalCode],['开业时间',date(store.openedAt)],['关联时间',date(store.mountedAt)],
 ]:[[isBrand?'BID／记录ID':'MID',id]];
 const d=document.createElement('dialog');active=d;d.className='ba ba-modal ba-admin-dialog ba-store-effective';d.dataset.subscriptionSubjectInfo='';d.style.maxWidth='760px';d.setAttribute('aria-label',`${isBrand?'品牌':'门店'}基本信息`);
 d.innerHTML=`<div class="ba-dialog-inner"><header class="ba-dialog-header"><h2>${isBrand?'品牌':'门店'}基本信息</h2><button type="button" class="ba-btn" data-subject-info-close aria-label="关闭">×</button></header><section class="ba-dialog-body">${!entity?'<p class="ba-note">主体不存在或已移除，无法读取基本信息。</p>':''}<dl style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:24px;padding:8px 0">${fields.map(([label,value])=>`<div><dt class="ba-muted" style="margin-bottom:8px">${esc(label)}</dt><dd style="margin:0;overflow-wrap:anywhere">${esc(value===undefined||value===null||value===''?'—':value)}</dd></div>`).join('')}</dl></section><footer class="ba-footer" style="justify-content:flex-end"><button type="button" class="ba-btn" data-subject-info-close>关闭</button></footer></div>`;
 const close=()=>{if(d.open)d.close();d.remove();window.removeEventListener('hashchange',close);if(active===d)active=undefined;if(trigger?.isConnected)trigger.focus();};
 d.querySelectorAll('[data-subject-info-close]').forEach(b=>b.addEventListener('click',close));
 d.addEventListener('cancel',e=>{e.preventDefault();close()});d.addEventListener('close',close,{once:true});
 d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
 document.body.append(d);d.showModal();window.addEventListener('hashchange',close);
}
