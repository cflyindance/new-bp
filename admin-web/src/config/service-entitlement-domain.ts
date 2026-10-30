import {packageOnSale} from './service-package-availability';
import type { EffectiveSubscriptionContext, MerchantSubscription, ServiceCommercialPolicy, ServicePackage, SubscriptionServiceSnapshot } from './subscription-service-domain';

export function validateCommercialPolicy(policy: ServiceCommercialPolicy | undefined, price: number): void {
  if (!Number.isSafeInteger(price) || price < 0) throw Error('价格须为有效的非负金额，最多两位小数。');
  if (!policy) return;
  if (!['free', 'paid'].includes(policy.chargeType) || !['brand', 'store'].includes(policy.billingUnit)) throw Error('收费类型或计费单位无效。');
  if (policy.chargeType === 'free' && price !== 0) throw Error('免费服务价格必须为0。');
  if (policy.chargeType === 'paid' && price <= 0) throw Error('收费服务价格必须大于0。');
  if (policy.trialEnabled && (policy.chargeType !== 'paid' || !Number.isInteger(policy.trialDays) || policy.trialDays < 1 || policy.trialDays > 90)) throw Error('收费服务的试用天数须为1至90的整数。');
}

export function entitlementApplies(grant: MerchantSubscription, context: EffectiveSubscriptionContext): boolean {
  const subject = grant.subjectType === 'brand' ? context.brandId : grant.subjectType === 'store' ? context.storeId : context.groupId;
  if (!subject || subject !== grant.subjectId) return false;
  // A brand-wide page must never aggregate permissions bought only for selected stores.
  if (grant.scopeMode === 'selected') return !!context.storeId && !!grant.storeIds?.includes(context.storeId);
  return true;
}

export function grantActive(grant: MerchantSubscription, now = Date.now()): boolean {
  const start = Date.parse(grant.startAt), end = grant.endAt ? Date.parse(grant.endAt) : Infinity;
  return !grant.disabledAt && Number.isFinite(start) && start <= now && now < end;
}

export interface ServiceAccess {
  usable: boolean;
  label: string;
  package: ServicePackage;
  grant?: MerchantSubscription;
  canTrial: boolean;
}

export function serviceAccess(snapshot: SubscriptionServiceSnapshot, pkg: ServicePackage, context: EffectiveSubscriptionContext, now = Date.now()): ServiceAccess {
  const grants = snapshot.subscriptions.filter(s => s.packageId === pkg.id && !!s.entitlementKind && !s.id.startsWith('sub-demo-'));
  const relevant = grants.filter(s => entitlementApplies(s, context));
  const valid = relevant.filter(s => grantActive(s, now));
  const usedTrial = grants.some(s => s.subjectType === 'brand' && s.subjectId === context.brandId && s.entitlementKind === 'trial');
  const base = {package: pkg, usable: false, canTrial: !!context.brandId && !!pkg.commercial?.trialEnabled && !usedTrial && packageOnSale(pkg)};
  if (pkg.status !== 'published' || !pkg.activeReleaseId) return {...base, canTrial: false, label: '服务已停用'};
  const grant = valid.find(s => s.entitlementKind === 'paid' || s.entitlementKind == null) ?? valid.find(s => s.entitlementKind !== 'trial') ?? valid[0];
  if (grant) return {...base, usable: true, canTrial: false, grant, label: grant.entitlementKind === 'trial' ? '试用中' : grant.entitlementKind === 'free' ? '免费生效' : grant.entitlementKind === 'gift' ? '赠送生效' : '正式生效'};
  const own = grants.filter(s => s.subjectType === 'brand' && s.subjectId === context.brandId || s.subjectType === 'store' && s.subjectId === context.storeId);
  if (own.some(s => grantActive(s, now))) return {...base, canTrial: false, label: context.storeId ? '不在适用门店' : '仅指定门店可用'};
  const latest = [...relevant].sort((a,b) => Date.parse(b.disabledAt ?? b.endAt ?? b.startAt) - Date.parse(a.disabledAt ?? a.endAt ?? a.startAt))[0];
  if (latest?.disabledAt) return {...base, label: '已停用'};
  if (latest?.endAt && Date.parse(latest.endAt) <= now) return {...base, label: latest.entitlementKind === 'trial' ? '试用已结束' : '已到期'};
  if (latest && Date.parse(latest.startAt) > now) return {...base, label: '待生效'};
  return {...base, label: '未开通'};
}

export function matchServicePackages(snapshot: SubscriptionServiceSnapshot, catalog: Array<{id:string;path:string}>, rawPath: string): ServicePackage[] {
  const path = rawPath.split('?')[0].replace(/\/$/, '') || '/';
  const routes = [...(snapshot.protectedRoutes ?? []), ...snapshot.packages.flatMap(pkg => {
    if (!pkg.commercial) return [];
    const release = snapshot.releases.find(r => r.id === pkg.activeReleaseId);
    return (release?.routeNodeIds ?? []).flatMap(id => {
      const node = catalog.find(n => n.id === id);
      return node ? [{packageId: pkg.id, routeNodeId: id, path: node.path}] : [];
    });
  })].filter(n => path === n.path || path.startsWith(n.path.replace(/\/$/, '') + '/'));
  const length = Math.max(0, ...routes.map(r => r.path.length));
  const ids = new Set(routes.filter(r => r.path.length === length).map(r => r.packageId));
  return snapshot.packages.filter(pkg => pkg.commercial && ids.has(pkg.id));
}

export function resolveServicePathAccess(snapshot: SubscriptionServiceSnapshot, catalog: Array<{id:string;path:string}>, path: string, context: EffectiveSubscriptionContext, now = Date.now()): ServiceAccess[] {
  const normalized=path.split('?')[0].replace(/\/$/,'');
  const matches=(route:string)=>normalized===route||normalized.startsWith(route.replace(/\/$/,'')+'/');
  const historicalLength=Math.max(0,...(snapshot.protectedRoutes??[]).filter(r=>matches(r.path)).map(r=>r.path.length));
  return matchServicePackages(snapshot, catalog, path).map(pkg => {
    const release=snapshot.releases.find(r=>r.id===pkg.activeReleaseId);
    const current=release?.routeNodeIds.some(id=>{
      const node=catalog.find(n=>n.id===id);
      const paths=node?[node.path]:(snapshot.protectedRoutes??[]).filter(r=>r.packageId===pkg.id&&r.routeNodeId===id).map(r=>r.path);
      return paths.some(route=>matches(route)&&route.length>=historicalLength);
    });
    return current?serviceAccess(snapshot,pkg,context,now):{package:pkg,usable:false,label:'该菜单已移出服务',canTrial:false};
  });
}
