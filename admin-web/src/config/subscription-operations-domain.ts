import {
  resolveEffectiveRouteSources,
  subscriptionLifecycle,
  type MerchantSubscription,
  type ServicePackage,
  type SubscriptionLifecycle,
  type SubscriptionServiceSnapshot,
} from "./subscription-service-domain";

export type SubscriptionPackageState = "running" | "off" | "disabled" | "unpublished" | "missing";
export type SubscriptionOperation = "edit" | "activate" | "extend" | "adjust-end" | "disable" | "cancel" | "reopen" | "detail" | "audit";

export interface SubscriptionOperationPolicy {
  lifecycle: SubscriptionLifecycle;
  packageState: SubscriptionPackageState;
  primary?: SubscriptionOperation;
  allowed: SubscriptionOperation[];
  disabled: Partial<Record<SubscriptionOperation, string>>;
  limitedEdit: boolean;
}

export interface SubscriptionImpactPreview {
  subscriptionId: string;
  operation: "activate" | "adjust-end" | "disable" | "cancel";
  previewedAt: string;
  nextBoundaryAt?: string;
  expiresAt: string;
  snapshotToken: string;
  proposedEndAt?: string;
  inheritedStoreIds: string[];
  directSubjectCount: number;
  inheritedStoreCount: number;
  providedRouteCount: number;
  lostRouteCount: number;
  retainedRouteCount: number;
  gainedRouteCount: number;
  alreadyCoveredRouteCount: number;
}

export function subscriptionPackageState(pkg: ServicePackage | undefined): SubscriptionPackageState {
  if (!pkg) return "missing";
  if (pkg.status === "disabled") return "disabled";
  if (pkg.status !== "published" || !pkg.activeReleaseId) return "unpublished";
  return pkg.saleStatus === "off" ? "off" : "running";
}

export function subscriptionOperationPolicy(snapshot: SubscriptionServiceSnapshot, subscription: MerchantSubscription, now = new Date()): SubscriptionOperationPolicy {
  const lifecycle = subscriptionLifecycle(subscription, now);
  const packageState = subscriptionPackageState(snapshot.packages.find((item) => item.id === subscription.packageId));
  const base: SubscriptionOperation[] = ["detail", "audit"];
  const disabled: SubscriptionOperationPolicy["disabled"] = {};
  if (subscription.entitlementKind) return { lifecycle, packageState, allowed: base, disabled, limitedEdit: false };
  if (lifecycle === "待生效") {
    if (packageState === "running") return { lifecycle, packageState, primary: "edit", allowed: ["edit", "activate", "cancel", ...base], disabled, limitedEdit: false };
    if (packageState === "off") {
      disabled.activate = "服务包已下架，不能立即生效；订阅仍会在原开始时间自动生效。";
      return { lifecycle, packageState, primary: "edit", allowed: ["edit", "cancel", ...base], disabled, limitedEdit: true };
    }
    disabled.activate = "服务包当前不可用，不能立即生效。";
    return { lifecycle, packageState, primary: "edit", allowed: ["edit", "cancel", ...base], disabled, limitedEdit: false };
  }
  if (lifecycle === "生效中") {
    if (packageState === "running") return { lifecycle, packageState, primary: "extend", allowed: ["extend", "adjust-end", "disable", ...base], disabled, limitedEdit: false };
    if (packageState === "off") {
      disabled.extend = "服务包已下架，已有能力继续生效但不能续期。";
      return { lifecycle, packageState, primary: "disable", allowed: ["adjust-end", "disable", ...base], disabled, limitedEdit: false };
    }
    disabled.disable = "服务包已停用或不可用，订阅当前只读。";
    return { lifecycle, packageState, allowed: base, disabled, limitedEdit: false };
  }
  if (packageState === "running") return { lifecycle, packageState, primary: "reopen", allowed: ["reopen", ...base], disabled, limitedEdit: false };
  disabled.reopen = "仅运行中且已上架的服务包可以重新开通。";
  return { lifecycle, packageState, allowed: base, disabled, limitedEdit: false };
}

function stableToken(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(36);
}

function contextsFor(subscription: MerchantSubscription, inheritedStoreIds: string[]): Array<{ brandId?: string; storeId?: string }> {
  if (subscription.subjectType === "store") return [{ storeId: subscription.subjectId }];
  if (subscription.subjectType !== "brand") return [];
  return [{ brandId: subscription.subjectId }, ...inheritedStoreIds.map((storeId) => ({ brandId: subscription.subjectId, storeId }))];
}

function effectiveSets(snapshot: SubscriptionServiceSnapshot, contexts: Array<{ brandId?: string; storeId?: string }>, at: Date): Set<string>[] {
  return contexts.map((context) => new Set(resolveEffectiveRouteSources(snapshot, context, at).map((source) => source.routeNodeId)));
}

function changedSnapshot(snapshot: SubscriptionServiceSnapshot, subscriptionId: string, operation: SubscriptionImpactPreview["operation"], now: Date, proposedEndAt?: string): SubscriptionServiceSnapshot {
  const subscriptions = snapshot.subscriptions.map((item) => {
    if (item.id !== subscriptionId) return item;
    if (operation === "activate") return { ...item, startAt: now.toISOString() };
    if (operation === "disable") return { ...item, disabledAt: now.toISOString() };
    if (operation === "cancel") return { ...item, cancelledAt: now.toISOString() };
    if (operation === "adjust-end") return { ...item, endAt: proposedEndAt };
    return item;
  });
  return { ...snapshot, subscriptions };
}

export function buildSubscriptionImpactPreview(snapshot: SubscriptionServiceSnapshot, subscriptionId: string, operation: SubscriptionImpactPreview["operation"], now = new Date(), proposedEndAt?: string, inheritedStoreIds: string[] = []): SubscriptionImpactPreview {
  const subscription = snapshot.subscriptions.find((item) => item.id === subscriptionId);
  if (!subscription) throw new Error("订阅不存在。");
  const contexts = contextsFor(subscription, inheritedStoreIds);
  const before = effectiveSets(snapshot, contexts, now);
  const afterSnapshot = changedSnapshot(snapshot, subscriptionId, operation, now, proposedEndAt);
  const after = effectiveSets(afterSnapshot, contexts, now);
  const release = snapshot.releases.find((item) => item.id === snapshot.packages.find((item) => item.id === subscription.packageId)?.activeReleaseId);
  const provided = new Set(release?.routeNodeIds ?? []);
  const sum = (fn: (index: number) => number) => contexts.reduce((total, _, index) => total + fn(index), 0);
  const boundaries = snapshot.subscriptions.flatMap((item) => [item.startAt, item.endAt]).filter((value): value is string => Boolean(value)).map(Date.parse).filter((value) => Number.isFinite(value) && value > now.getTime()).sort((a, b) => a - b);
  const nextBoundary = boundaries[0];
  const expires = Math.min(now.getTime() + 300_000, nextBoundary ?? Number.POSITIVE_INFINITY);
  const dependency = {
    subscription,
    pkg: snapshot.packages.find((item) => item.id === subscription.packageId),
    release,
    related: snapshot.subscriptions.filter((item) => contexts.some((context) => item.subjectId === context.storeId || item.subjectId === context.brandId)),
    stores: contexts,
    operation,
    proposedEndAt,
    inheritedStoreIds,
  };
  return {
    subscriptionId,
    operation,
    previewedAt: now.toISOString(),
    nextBoundaryAt: nextBoundary ? new Date(nextBoundary).toISOString() : undefined,
    expiresAt: new Date(expires).toISOString(),
    snapshotToken: stableToken(dependency),
    proposedEndAt,
    inheritedStoreIds,
    directSubjectCount: 1,
    inheritedStoreCount: subscription.subjectType === "brand" ? Math.max(0, contexts.length - 1) : 0,
    providedRouteCount: provided.size * contexts.length,
    lostRouteCount: sum((index) => [...before[index]!].filter((route) => !after[index]!.has(route)).length),
    retainedRouteCount: sum((index) => [...provided].filter((route) => after[index]!.has(route)).length),
    gainedRouteCount: sum((index) => [...after[index]!].filter((route) => !before[index]!.has(route)).length),
    alreadyCoveredRouteCount: sum((index) => [...provided].filter((route) => before[index]!.has(route)).length),
  };
}

export function assertSubscriptionImpactPreview(snapshot: SubscriptionServiceSnapshot, preview: SubscriptionImpactPreview, now = new Date()): SubscriptionImpactPreview {
  if (now.getTime() >= Date.parse(preview.expiresAt)) throw new Error("订阅信息或状态已发生变化，请关闭弹窗后重新查看影响");
  const current = buildSubscriptionImpactPreview(snapshot, preview.subscriptionId, preview.operation, now, preview.proposedEndAt, preview.inheritedStoreIds);
  if (current.snapshotToken !== preview.snapshotToken) throw new Error("订阅信息或状态已发生变化，请关闭弹窗后重新查看影响");
  for (const key of ["providedRouteCount", "lostRouteCount", "retainedRouteCount", "gainedRouteCount", "alreadyCoveredRouteCount"] as const) {
    if (current[key] !== preview[key]) throw new Error("订阅信息或状态已发生变化，请关闭弹窗后重新查看影响");
  }
  return current;
}
