import type { MerchantSubscription, ServicePackage } from './subscription-service-domain';
import { packageOnSale } from './service-package-availability';

export type EntitlementRowAction = 'paid' | 'gift' | 'free' | 'extend' | 'disable';

/** The source and dates determine the operation, never the transaction amount. */
export function entitlementRowPolicy(grant: MerchantSubscription, pkg: ServicePackage | undefined, now = Date.now()): { primary?: EntitlementRowAction; label?: string; canDisable: boolean; unavailable?: string } {
  const start = Date.parse(grant.startAt), end = grant.endAt ? Date.parse(grant.endAt) : Infinity;
  if (!grant.entitlementKind || grant.subjectType !== 'brand' || !Number.isFinite(start) || Number.isNaN(end) || end <= start) return { canDisable: false, unavailable: '记录日期或主体异常，请核对资料。' };
  const live = !grant.disabledAt && start <= now && now < end;
  const canDisable = !grant.disabledAt && now < end;
  if (!pkg?.commercial || !packageOnSale(pkg)) return { canDisable, unavailable: '服务包未上架、已停用或缺失，不能开通或延长。' };
  if (live && ['paid', 'gift'].includes(grant.entitlementKind)) return { primary: 'extend', label: grant.entitlementKind === 'gift' ? '延长赠送' : '续期', canDisable };
  if (grant.entitlementKind === 'trial') return { primary: 'paid', label: '付费开通', canDisable };
  if (grant.disabledAt || end <= now) {
    const kind = grant.entitlementKind;
    return { primary: kind, label: kind === 'gift' ? '再次赠送' : kind === 'paid' ? '再次开通' : '免费开通', canDisable: false };
  }
  return { canDisable };
}
