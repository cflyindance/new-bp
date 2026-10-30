import {getMerchantById,getMerchantStores,getStoreById} from './enterprise-merchant-store';
import type {ServicePackage,ServicePackageDraft,SubscriptionServiceSnapshot} from './subscription-service-domain';
export const packageOnSale=(p:ServicePackage)=>p.status==='published'&&p.saleStatus!=='off';
export function canDeletePackage(s:SubscriptionServiceSnapshot,id:string){return s.packages.some(p=>p.id===id&&p.status==='unpublished'&&!p.activeReleaseId)&&!s.releases.some(r=>r.packageId===id)&&!s.subscriptions.some(g=>g.packageId===id);}
export function packageChangeToken(s:SubscriptionServiceSnapshot,id:string){return JSON.stringify([s.packages.find(p=>p.id===id),s.drafts.find(d=>d.packageId===id),s.subscriptions.filter(g=>g.packageId===id),s.releases.filter(r=>r.packageId===id)]);}
/** Existing contracts freeze commercial dimensions, not standard price or trial policy. */
export function validatePackageTerms(s:SubscriptionServiceSnapshot,id:string,next:Pick<ServicePackageDraft,'currency'|'billingInterval'|'commercial'>){
 const p=s.packages.find(p=>p.id===id);if(!p)throw Error('服务包不存在。');
 if(!s.subscriptions.some(g=>g.packageId===id))return;
 if(p.currency!==next.currency||p.billingInterval!==next.billingInterval||p.commercial?.chargeType!==next.commercial?.chargeType||p.commercial?.billingUnit!==next.commercial?.billingUnit)throw Error('该服务包已有订阅记录，不能修改收费类型、币种、计费单位或周期；请新建服务包。');
}
export function packageImpact(s:SubscriptionServiceSnapshot,id:string,now=Date.now()){
 const records=s.subscriptions.filter(g=>g.packageId===id&&!g.disabledAt&&(g.subjectType==='brand'||g.subjectType==='store')&&Number.isFinite(Date.parse(g.startAt))&&(!g.endAt||Date.parse(g.endAt)>now));
 const brands=new Set<string>(),stores=new Set<string>();
 const subjects=records.map(g=>{if(g.subjectType==='brand'){brands.add(g.subjectId);const candidates=getMerchantStores(g.subjectId);candidates.filter(st=>g.scopeMode!=='selected'||g.storeIds?.includes(st.storeId)).forEach(st=>stores.add(st.storeId));return {id:getMerchantById(g.subjectId)?.bid??g.subjectId,name:getMerchantById(g.subjectId)?.name??'品牌已移除',type:'品牌',state:Date.parse(g.startAt)>now?'待生效':'有效'};}stores.add(g.subjectId);const store=getStoreById(g.subjectId);if(store)brands.add(store.merchantId);return {id:g.subjectId,name:store?.name??'门店已移除',type:'门店',state:Date.parse(g.startAt)>now?'待生效':'有效'};});
 for(const id of stores){if(!subjects.some(s=>s.id===id&&s.type==='门店'))subjects.push({id,name:getStoreById(id)?.name??'门店已移除',type:'门店',state:'品牌权益覆盖'});}
 return {records:records.length,brands:brands.size,stores:stores.size,subjects:[...new Map(subjects.map(x=>[x.type+':'+x.id+':'+x.state,x])).values()]};
}
