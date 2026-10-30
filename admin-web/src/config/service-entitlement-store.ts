import { currentBrandPrincipal, isBrandPathAllowed } from './brand-access-store';
import { getMerchantById, getMerchantStores } from './enterprise-merchant-store';
import { getAuthenticatedEmail } from '../auth/login';
import { currentMAccess } from '../permissions/m-platform-store';
import { mActionKey, mPageKey } from '../permissions/m-platform-catalog';
import { mCanVisit } from '../permissions/m-platform-runtime';
import { getPublishedSubscriptionRouteCatalog } from './subscription-published-menu-tree';
import { MERCHANT_SUBSCRIPTIONS_PATH } from './subscription-service-scope';
import { readSubscriptionServiceSnapshot, writeSubscriptionServiceSnapshot } from './subscription-service-store';
import type { MerchantSubscription, ServiceEntitlementKind, SubscriptionServiceSnapshot } from './subscription-service-domain';
import { grantActive, validateCommercialPolicy } from './service-entitlement-domain';

export function canManageServiceEntitlements(action: 'create'|'extend'|'disable' = 'create'): boolean {
  const path = location.hash.slice(1);
  return path.startsWith('/m-platform/') && mCanVisit(path) && mCanVisit(MERCHANT_SUBSCRIPTIONS_PATH) &&
    currentMAccess(mActionKey('subscriptions',action)) === 'edit' &&
    (path.startsWith(MERCHANT_SUBSCRIPTIONS_PATH) || currentMAccess(mPageKey('brands')) === 'edit');
}

function actorFor(brandId: string, source: 'm-platform'|'merchant', action: 'create'|'extend'|'disable' = 'create'): string {
  if (!getMerchantById(brandId)) throw Error('品牌不存在。');
  if (source === 'm-platform') {
    if (!canManageServiceEntitlements(action)) throw Error('暂无品牌服务权益操作权限。');
    return getAuthenticatedEmail() ?? 'M平台运营';
  }
  const principal = currentBrandPrincipal();
  if (location.hash.startsWith('#/m-platform/') || !principal?.account.enabled || !principal.account.admin || principal.merchantId !== brandId) throw Error('只有当前品牌已启用的Admin可开始试用。');
  return principal.account.email;
}

function commit(snapshot: SubscriptionServiceSnapshot, grant: MerchantSubscription, action: string, detail: string, actor: string, previous?: {endAt?:string}): void {
  const pkg=snapshot.packages.find(p=>p.id===grant.packageId),stores=getMerchantStores(grant.subjectId);
  const entitlementChange={serviceName:pkg?.name??'服务已移除',kind:grant.entitlementKind,scope:grant.scopeMode==='selected'?(grant.storeIds??[]).map(id=>stores.find(s=>s.storeId===id)?.name??'门店资料未记录').join('、'):'全部门店（含新增）',startAt:grant.startAt,endAt:grant.endAt,previousEndRecorded:!!previous,previousEndAt:previous?.endAt,priceMinor:grant.agreedPriceMinor,currency:grant.agreedCurrency,reference:grant.reference,reason:grant.disableReason};
  snapshot.audit.unshift({entitlementChange,id:`ent-audit-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,objectType:'subscription',objectId:grant.id,action,detail,actor,at:new Date().toISOString()});
  writeSubscriptionServiceSnapshot(snapshot);
}

export interface RecordEntitlementInput {
  brandId: string;
  packageId: string;
  kind: ServiceEntitlementKind;
  scopeMode: 'all'|'selected';
  storeIds?: string[];
  endAt?: string;
  priceMinor?: number;
  reference?: string;
}

export function recordServiceEntitlement(input: RecordEntitlementInput, source: 'm-platform'|'merchant'): MerchantSubscription {
  const actor = actorFor(input.brandId, source);
  if (source === 'merchant' && input.kind !== 'trial') throw Error('正式开通、赠送及免费开通由服务商记录。');
  const snapshot = readSubscriptionServiceSnapshot(), pkg = snapshot.packages.find(p=>p.id===input.packageId);
  if (!pkg?.commercial || pkg.status !== 'published' || !pkg.activeReleaseId) throw Error('请选择已发布且启用权益控制的服务。');
  validateCommercialPolicy(pkg.commercial,pkg.priceMinor);
  if (!['free','trial','paid','gift'].includes(input.kind) || !['all','selected'].includes(input.scopeMode)) throw Error('权益来源或范围无效。');
  if (source === 'merchant') {
    const release = snapshot.releases.find(r=>r.id===pkg.activeReleaseId);
    const nodes = getPublishedSubscriptionRouteCatalog().filter(n=>release?.routeNodeIds.includes(n.id));
    if (!nodes.some(n=>isBrandPathAllowed(n.path))) throw Error('当前账号没有该服务的已展示菜单权限。');
  }
  const available = new Set(getMerchantStores(input.brandId).map(s=>s.storeId));
  const stores = [...new Set(input.storeIds ?? [])];
  if (input.scopeMode === 'selected' && (!stores.length || stores.some(id=>!available.has(id)))) throw Error('请至少选择一家当前品牌所属门店，不能选择其他品牌门店。');
  const now = new Date(), related = snapshot.subscriptions.filter(s=>s.subjectType==='brand'&&s.subjectId===input.brandId&&s.packageId===pkg.id&&!s.id.startsWith('sub-demo-'));
  let endAt = input.endAt, price = input.priceMinor ?? pkg.priceMinor;
  if (input.kind === 'trial') {
    if (!pkg.commercial.trialEnabled || related.some(s=>s.entitlementKind==='trial')) throw Error('该品牌已使用试用资格或服务不支持试用。');
    if (related.some(s=>grantActive(s))) throw Error('当前已有有效权益，无需重复试用。');
    endAt = new Date(now.getTime()+pkg.commercial.trialDays*86400000).toISOString(); price=0;
  } else if (input.kind === 'free') {
    if (pkg.commercial.chargeType !== 'free') throw Error('收费服务请使用正式开通或赠送。');
    price=0;endAt=undefined;
  } else {
    if (!input.reference?.trim()) throw Error('请填写外部开通依据或赠送原因。');
    if (!endAt || !Number.isFinite(Date.parse(endAt)) || Date.parse(endAt)<=now.getTime()) throw Error('到期时间必须晚于当前时间。');
    if (input.kind === 'gift') price=0;
    else if (pkg.commercial.chargeType !== 'paid' || !Number.isSafeInteger(price) || price<=0) throw Error('收费服务成交价必须大于0，赠送请使用赠送操作。');
  }
  if (input.kind !== 'trial' && related.some(s=>s.entitlementKind===input.kind&&grantActive(s)&&s.scopeMode===input.scopeMode&&(input.scopeMode==='all'||JSON.stringify([...(s.storeIds??[])].sort())===JSON.stringify([...stores].sort())))) throw Error('相同范围已有有效权益，请使用续期或先停用原记录。');
  const grant: MerchantSubscription = {id:`ent-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,subjectType:'brand',subjectId:input.brandId,packageId:pkg.id,startAt:now.toISOString(),endAt,createdAt:now.toISOString(),createdBy:actor,entitlementKind:input.kind,scopeMode:input.scopeMode,storeIds:input.scopeMode==='selected'?stores:[],agreedPriceMinor:price,agreedCurrency:pkg.currency,agreedBillingInterval:pkg.billingInterval,agreedBillingUnit:pkg.commercial.billingUnit,releaseId:pkg.activeReleaseId,reference:input.reference?.trim()};
  snapshot.subscriptions.unshift(grant);
  commit(snapshot,grant,'entitlement.create',`${getMerchantById(input.brandId)!.name} · ${pkg.name} · ${ {free:'免费开通',trial:'开始试用',paid:'正式开通',gift:'赠送'}[input.kind]} · ${input.scopeMode==='all'?'全部品牌门店（含新增）':getMerchantStores(input.brandId).filter(s=>stores.includes(s.storeId)).map(s=>s.name).join('、')} · ${endAt?new Date(endAt).toLocaleString('zh-CN'):'长期有效'}${input.reference?' · '+input.reference:''}`,actor);
  return grant;
}

export function changeServiceEntitlement(id: string, operation: 'disable'|'extend', value: string): void {
  const snapshot = readSubscriptionServiceSnapshot(), grant=snapshot.subscriptions.find(s=>s.id===id);
  if (!grant || !grant.entitlementKind || grant.subjectType!=='brand') throw Error('权益记录不存在。');
  const actor=actorFor(grant.subjectId,'m-platform',operation==='disable'?'disable':'extend');
  if (grant.disabledAt) throw Error('权益已停用，不能修改。');
  const pkg=snapshot.packages.find(p=>p.id===grant.packageId);
  const previous={endAt:grant.endAt};
  if (operation==='disable') {
    if (!value.trim()) throw Error('请填写停用原因。');
    grant.disabledAt=new Date().toISOString();grant.disabledBy=actor;grant.disableReason=value.trim();
  } else {
    if (grant.entitlementKind==='trial'||grant.entitlementKind==='free') throw Error('试用及长期免费权益不支持续期，请按规则正式开通。');
    if (!Number.isFinite(Date.parse(value)) || Date.parse(value)<=Math.max(Date.now(),Date.parse(grant.endAt??''))) throw Error('新的到期时间必须晚于当前时间和原到期时间。');
    grant.endAt=value;
  }
  commit(snapshot,grant,`entitlement.${operation}`,`${getMerchantById(grant.subjectId)?.name??grant.subjectId} · ${pkg?.name??grant.packageId} · ${operation==='disable'?'停用：':'续期至：'}${value}`,actor,previous);
}
