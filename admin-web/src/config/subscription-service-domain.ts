import { NAV_MODULES, type NavModule } from "./navigation";

export type ServicePackageStatus = "unpublished" | "published" | "disabled";
export type BillingInterval = "month" | "quarter" | "year" | "one-time";
export type SubscriptionSubjectType = "group" | "brand" | "store";

export interface ServicePackage {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceMinor: number;
  currency: string;
  billingInterval: BillingInterval;
  status: ServicePackageStatus;
  activeReleaseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePackageDraft {
  packageId: string;
  baseReleaseId?: string;
  routeBlueprintVersion: number;
  revision: number;
  name: string;
  description?: string;
  priceMinor: number;
  currency: string;
  billingInterval: BillingInterval;
  routeNodeIds: string[];
  updatedAt: string;
}

export interface ServicePackageRelease {
  id: string;
  packageId: string;
  version: number;
  routeBlueprintVersion: number;
  name: string;
  description?: string;
  priceMinor: number;
  currency: string;
  billingInterval: BillingInterval;
  routeNodeIds: string[];
  publishedAt: string;
  publishedBy: string;
}

export interface MerchantSubscription {
  id: string;
  subjectType: SubscriptionSubjectType;
  subjectId: string;
  packageId: string;
  startAt: string;
  endAt?: string;
  disabledAt?: string;
  disabledBy?: string;
  disableReason?: string;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface SubscriptionAuditEntry {
  id: string;
  action: string;
  objectType: "package" | "subscription";
  objectId: string;
  detail: string;
  at: string;
  actor: string;
}

export interface SubscriptionServiceSnapshot {
  schemaVersion: 1;
  routeBlueprintVersion: number;
  packages: ServicePackage[];
  drafts: ServicePackageDraft[];
  releases: ServicePackageRelease[];
  subscriptions: MerchantSubscription[];
  audit: SubscriptionAuditEntry[];
}

export interface RouteCatalogNode {
  id: string;
  title: string;
  path: string;
  moduleId: string;
  moduleTitle: string;
}

export interface EffectiveSubscriptionContext {
  groupId?: string;
  brandId?: string;
  storeId?: string;
}

export interface EffectiveRouteSource {
  routeNodeId: string;
  packageId: string;
  subscriptionId: string;
  subjectType: SubscriptionSubjectType;
  subjectId: string;
  inherited: boolean;
}

export function getSubscriptionRouteCatalog(modules: NavModule[] = NAV_MODULES): RouteCatalogNode[] {
  return modules.flatMap((module) =>
    module.children.map((child) => ({
      id: child.id,
      title: child.title,
      path: child.path,
      moduleId: module.id,
      moduleTitle: module.title,
    })),
  );
}

export function isSubscriptionActive(subscription: MerchantSubscription, now = new Date()): boolean {
  const at = now.getTime();
  const start = new Date(subscription.startAt).getTime();
  const end = subscription.endAt ? new Date(subscription.endAt).getTime() : Number.POSITIVE_INFINITY;
  return !subscription.disabledAt && Number.isFinite(start) && start <= at && at < end;
}

export function subscriptionStatusLabel(
  subscription: MerchantSubscription,
  packageStatus: ServicePackageStatus | undefined,
  now = new Date(),
): "待生效" | "生效中" | "已到期" | "已停用" | "服务包已停用" {
  if (subscription.disabledAt) return "已停用";
  if (packageStatus !== "published") return "服务包已停用";
  if (new Date(subscription.startAt).getTime() > now.getTime()) return "待生效";
  if (subscription.endAt && new Date(subscription.endAt).getTime() <= now.getTime()) return "已到期";
  return "生效中";
}

export function resolveEffectiveRouteSources(
  snapshot: SubscriptionServiceSnapshot,
  context: EffectiveSubscriptionContext,
  now = new Date(),
): EffectiveRouteSource[] {
  const subjects = new Map<string, SubscriptionSubjectType>();
  if (context.groupId) subjects.set(context.groupId, "group");
  if (context.brandId) subjects.set(context.brandId, "brand");
  if (context.storeId) subjects.set(context.storeId, "store");
  const directSubjectId = context.storeId ?? context.brandId ?? context.groupId;
  const results: EffectiveRouteSource[] = [];
  for (const subscription of snapshot.subscriptions) {
    const subjectType = subjects.get(subscription.subjectId);
    if (!subjectType || subjectType !== subscription.subjectType || !isSubscriptionActive(subscription, now)) continue;
    const pkg = snapshot.packages.find((item) => item.id === subscription.packageId);
    if (!pkg || pkg.status !== "published" || !pkg.activeReleaseId) continue;
    const release = snapshot.releases.find((item) => item.id === pkg.activeReleaseId);
    if (!release) continue;
    for (const routeNodeId of release.routeNodeIds) {
      results.push({
        routeNodeId,
        packageId: pkg.id,
        subscriptionId: subscription.id,
        subjectType,
        subjectId: subscription.subjectId,
        inherited: subscription.subjectId !== directSubjectId,
      });
    }
  }
  return results;
}

export function hasOverlappingSubscription(
  subscriptions: MerchantSubscription[],
  candidate: Pick<MerchantSubscription, "subjectType" | "subjectId" | "packageId" | "startAt" | "endAt">,
  ignoreId?: string,
): boolean {
  const start = new Date(candidate.startAt).getTime();
  const end = candidate.endAt ? new Date(candidate.endAt).getTime() : Number.POSITIVE_INFINITY;
  return subscriptions.some((item) => {
    if (item.id === ignoreId || item.disabledAt) return false;
    if (item.subjectType !== candidate.subjectType || item.subjectId !== candidate.subjectId || item.packageId !== candidate.packageId) return false;
    const itemStart = new Date(item.startAt).getTime();
    const itemEnd = item.endAt ? new Date(item.endAt).getTime() : Number.POSITIVE_INFINITY;
    return start < itemEnd && itemStart < end;
  });
}
