import { getGroups, getMerchantStores, getMerchants } from "./enterprise-merchant-store";
import {
  getSubscriptionRouteCatalog,
  hasOverlappingSubscription,
  resolveEffectiveRouteSources,
  type BillingInterval,
  type EffectiveSubscriptionContext,
  type MerchantSubscription,
  type ServicePackage,
  type ServicePackageDraft,
  type ServicePackageRelease,
  type SubscriptionServiceSnapshot,
  type SubscriptionSubjectType,
} from "./subscription-service-domain";
import { getPublishedSubscriptionMenuTree, getPublishedSubscriptionRouteCatalog } from "./subscription-published-menu-tree";

const STORAGE_KEY = "menusifu:subscription-service-packages-v1";
export const SUBSCRIPTION_SERVICE_CHANGE_EVENT = "menusifu:subscription-service-change";
const DEMO_OPERATOR = "hq.admin@menusifu.cn";

function nowIso(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedSnapshot(): SubscriptionServiceSnapshot {
  const now = nowIso();
  const catalog = getSubscriptionRouteCatalog();
  const basicRoutes = catalog.filter((node) => ["dashboard", "orders", "transactions", "product-center-main"].includes(node.moduleId)).map((node) => node.id);
  const growthRoutes = catalog.filter((node) => ["marketing", "promotions", "members", "reviews"].includes(node.moduleId)).map((node) => node.id);
  const packageBasic: ServicePackage = {
    id: "pkg-basic-99",
    code: "BASIC_99",
    name: "基础经营版",
    description: "覆盖商品、订单、支付与经营首页的基础能力。",
    priceMinor: 9900,
    currency: "CNY",
    billingInterval: "month",
    status: "published",
    activeReleaseId: "rel-basic-1",
    createdAt: now,
    updatedAt: now,
  };
  const packageGrowth: ServicePackage = {
    id: "pkg-growth-199",
    code: "GROWTH_199",
    name: "增长营销版",
    description: "覆盖营销、促销、会员与评价运营能力。",
    priceMinor: 19900,
    currency: "CNY",
    billingInterval: "month",
    status: "published",
    activeReleaseId: "rel-growth-1",
    createdAt: now,
    updatedAt: now,
  };
  const releases: ServicePackageRelease[] = [
    { id: "rel-basic-1", packageId: packageBasic.id, version: 1, routeBlueprintVersion: 1, name: packageBasic.name, description: packageBasic.description, priceMinor: packageBasic.priceMinor, currency: packageBasic.currency, billingInterval: packageBasic.billingInterval, routeNodeIds: basicRoutes, publishedAt: now, publishedBy: DEMO_OPERATOR },
    { id: "rel-growth-1", packageId: packageGrowth.id, version: 1, routeBlueprintVersion: 1, name: packageGrowth.name, description: packageGrowth.description, priceMinor: packageGrowth.priceMinor, currency: packageGrowth.currency, billingInterval: packageGrowth.billingInterval, routeNodeIds: growthRoutes, publishedAt: now, publishedBy: DEMO_OPERATOR },
  ];
  const groups = getGroups({ allEnterprises: true, status: "active" });
  const merchants = getMerchants({ allEnterprises: true }).filter((merchant) => merchant.status === "active");
  const firstMerchant = merchants[0];
  const firstStore = firstMerchant ? getMerchantStores(firstMerchant.merchantId)[0] : undefined;
  const subscriptions: MerchantSubscription[] = [];
  if (groups[0]) subscriptions.push({ id: "sub-demo-group", subjectType: "group", subjectId: groups[0].groupId, packageId: packageBasic.id, startAt: now, createdAt: now, createdBy: DEMO_OPERATOR, note: "演示集团基础包" });
  if (firstMerchant) subscriptions.push({ id: "sub-demo-brand", subjectType: "brand", subjectId: firstMerchant.merchantId, packageId: packageGrowth.id, startAt: now, createdAt: now, createdBy: DEMO_OPERATOR, note: "演示品牌增长包" });
  if (firstStore) subscriptions.push({ id: "sub-demo-store", subjectType: "store", subjectId: firstStore.storeId, packageId: packageGrowth.id, startAt: now, createdAt: now, createdBy: DEMO_OPERATOR, note: "演示门店增配" });
  return { schemaVersion: 1, routeBlueprintVersion: 1, packages: [packageBasic, packageGrowth], drafts: [], releases, subscriptions, audit: [] };
}

function normalizeSnapshot(value: Partial<SubscriptionServiceSnapshot> | null): SubscriptionServiceSnapshot {
  if (!value || value.schemaVersion !== 1) return seedSnapshot();
  return {
    schemaVersion: 1,
    routeBlueprintVersion: Number(value.routeBlueprintVersion) || 1,
    packages: Array.isArray(value.packages) ? value.packages : [],
    drafts: Array.isArray(value.drafts) ? value.drafts : [],
    releases: Array.isArray(value.releases) ? value.releases : [],
    subscriptions: Array.isArray(value.subscriptions) ? value.subscriptions : [],
    audit: Array.isArray(value.audit) ? value.audit : [],
  };
}

export function readSubscriptionServiceSnapshot(): SubscriptionServiceSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeSnapshot(JSON.parse(raw) as SubscriptionServiceSnapshot);
  } catch {
    /* fall through */
  }
  const seeded = seedSnapshot();
  writeSnapshot(seeded, false);
  return seeded;
}

function writeSnapshot(snapshot: SubscriptionServiceSnapshot, notify = true): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  if (notify) window.dispatchEvent(new CustomEvent(SUBSCRIPTION_SERVICE_CHANGE_EVENT));
}

function appendAudit(snapshot: SubscriptionServiceSnapshot, action: string, objectType: "package" | "subscription", objectId: string, detail: string, actor = DEMO_OPERATOR): void {
  snapshot.audit.unshift({ id: id("audit"), action, objectType, objectId, detail, at: nowIso(), actor });
  snapshot.audit = snapshot.audit.slice(0, 300);
}

export function createServicePackage(input: { code: string; name: string; description?: string; priceMinor: number; currency?: string; billingInterval?: BillingInterval }): ServicePackage {
  const snapshot = readSubscriptionServiceSnapshot();
  const code = input.code.trim().toUpperCase();
  if (!code || snapshot.packages.some((item) => item.code === code)) throw new Error("服务包编码不能为空且必须唯一");
  if (!input.name.trim()) throw new Error("服务包名称不能为空");
  const at = nowIso();
  const pkg: ServicePackage = { id: id("pkg"), code, name: input.name.trim(), description: input.description?.trim(), priceMinor: Math.max(0, Math.round(input.priceMinor)), currency: input.currency ?? "CNY", billingInterval: input.billingInterval ?? "month", status: "unpublished", createdAt: at, updatedAt: at };
  snapshot.packages.unshift(pkg);
  snapshot.drafts.push({ packageId: pkg.id, routeBlueprintVersion: snapshot.routeBlueprintVersion, revision: 1, name: pkg.name, description: pkg.description, priceMinor: pkg.priceMinor, currency: pkg.currency, billingInterval: pkg.billingInterval, routeNodeIds: [], updatedAt: at });
  appendAudit(snapshot, "package.create", "package", pkg.id, `创建服务包「${pkg.name}」`);
  writeSnapshot(snapshot);
  return pkg;
}

export function createServicePackageFromWizard(input: {
  code: string;
  name: string;
  description?: string;
  priceMinor: number;
  currency?: string;
  billingInterval?: BillingInterval;
  routeNodeIds: string[];
  publish: boolean;
}): ServicePackage {
  const snapshot = readSubscriptionServiceSnapshot();
  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  if (!code || snapshot.packages.some((item) => item.code.trim().toUpperCase() === code)) throw new Error("服务包编码不能为空且必须唯一");
  if (!name) throw new Error("服务包名称不能为空");
  if (!Number.isFinite(input.priceMinor) || input.priceMinor < 0) throw new Error("服务包价格必须是非负数字");
  const publishedTree = getPublishedSubscriptionMenuTree();
  if (!publishedTree) throw new Error("请先发布菜单路由配置，再创建服务包");
  const validIds = new Set(getPublishedSubscriptionRouteCatalog().map((item) => item.id));
  const routeNodeIds = [...new Set(input.routeNodeIds.filter((routeId) => validIds.has(routeId)))];
  if (!routeNodeIds.length) throw new Error("请至少选择一个菜单路由");

  const at = nowIso();
  const packageId = id("pkg");
  const releaseId = input.publish ? id("rel") : undefined;
  const currency = input.currency ?? "CNY";
  const billingInterval = input.billingInterval ?? "month";
  const priceMinor = Math.round(input.priceMinor);
  const pkg: ServicePackage = {
    id: packageId,
    code,
    name,
    description: input.description?.trim(),
    priceMinor,
    currency,
    billingInterval,
    status: input.publish ? "published" : "unpublished",
    activeReleaseId: releaseId,
    createdAt: at,
    updatedAt: at,
  };
  snapshot.routeBlueprintVersion = publishedTree.blueprintVersion;
  snapshot.packages.unshift(pkg);
  snapshot.drafts.push({
    packageId,
    baseReleaseId: releaseId,
    routeBlueprintVersion: publishedTree.blueprintVersion,
    revision: input.publish ? 2 : 1,
    name,
    description: pkg.description,
    priceMinor,
    currency,
    billingInterval,
    routeNodeIds,
    updatedAt: at,
  });
  if (releaseId) snapshot.releases.push({
    id: releaseId,
    packageId,
    version: 1,
    routeBlueprintVersion: publishedTree.blueprintVersion,
    name,
    description: pkg.description,
    priceMinor,
    currency,
    billingInterval,
    routeNodeIds,
    publishedAt: at,
    publishedBy: DEMO_OPERATOR,
  });
  appendAudit(snapshot, input.publish ? "package.create.publish" : "package.create", "package", packageId, input.publish ? `创建并发布服务包「${name}」v1` : `创建服务包「${name}」`);
  writeSnapshot(snapshot);
  return structuredClone(pkg);
}

export function getOrCreatePackageDraft(packageId: string): ServicePackageDraft {
  const snapshot = readSubscriptionServiceSnapshot();
  const existing = snapshot.drafts.find((item) => item.packageId === packageId);
  if (existing) return structuredClone(existing);
  const pkg = snapshot.packages.find((item) => item.id === packageId);
  if (!pkg) throw new Error("服务包不存在");
  const release = snapshot.releases.find((item) => item.id === pkg.activeReleaseId);
  const draft: ServicePackageDraft = { packageId, baseReleaseId: release?.id, routeBlueprintVersion: getPublishedSubscriptionMenuTree()?.blueprintVersion ?? snapshot.routeBlueprintVersion, revision: 1, name: release?.name ?? pkg.name, description: release?.description ?? pkg.description, priceMinor: release?.priceMinor ?? pkg.priceMinor, currency: release?.currency ?? pkg.currency, billingInterval: release?.billingInterval ?? pkg.billingInterval, routeNodeIds: [...(release?.routeNodeIds ?? [])], updatedAt: nowIso() };
  snapshot.drafts.push(draft);
  writeSnapshot(snapshot);
  return structuredClone(draft);
}

export function savePackageDraft(input: ServicePackageDraft): ServicePackageDraft {
  const snapshot = readSubscriptionServiceSnapshot();
  const current = snapshot.drafts.find((item) => item.packageId === input.packageId);
  if (current && current.revision !== input.revision) throw new Error("草稿已被其他操作更新，请重新打开后再保存");
  if (!input.name.trim()) throw new Error("服务包名称不能为空");
  const publishedTree = getPublishedSubscriptionMenuTree();
  if (!publishedTree) throw new Error("请先发布菜单路由配置，再保存服务包");
  const validIds = new Set(getPublishedSubscriptionRouteCatalog().map((item) => item.id));
  const next: ServicePackageDraft = { ...input, name: input.name.trim(), description: input.description?.trim(), priceMinor: Math.max(0, Math.round(input.priceMinor)), routeBlueprintVersion: publishedTree.blueprintVersion, routeNodeIds: [...new Set(input.routeNodeIds.filter((routeId) => validIds.has(routeId)))], revision: (current?.revision ?? 0) + 1, updatedAt: nowIso() };
  snapshot.routeBlueprintVersion = publishedTree.blueprintVersion;
  snapshot.drafts = snapshot.drafts.filter((item) => item.packageId !== input.packageId);
  snapshot.drafts.push(next);
  appendAudit(snapshot, "package.draft.save", "package", input.packageId, `保存草稿「${next.name}」`);
  writeSnapshot(snapshot);
  return structuredClone(next);
}

export function publishServicePackage(packageId: string, expectedRevision: number): ServicePackageRelease {
  const snapshot = readSubscriptionServiceSnapshot();
  const pkg = snapshot.packages.find((item) => item.id === packageId);
  const draft = snapshot.drafts.find((item) => item.packageId === packageId);
  if (!pkg || !draft) throw new Error("服务包或草稿不存在");
  if (draft.revision !== expectedRevision) throw new Error("草稿版本已变化，请重新确认发布");
  const publishedTree = getPublishedSubscriptionMenuTree();
  if (!publishedTree) throw new Error("请先发布菜单路由配置，再发布服务包");
  if (draft.routeBlueprintVersion !== publishedTree.blueprintVersion) throw new Error("菜单路由蓝图已更新，请重新保存服务包后再发布");
  if (!draft.routeNodeIds.length) throw new Error("请至少选择一个菜单路由");
  const version = Math.max(0, ...snapshot.releases.filter((item) => item.packageId === packageId).map((item) => item.version)) + 1;
  const release: ServicePackageRelease = { id: id("rel"), packageId, version, routeBlueprintVersion: snapshot.routeBlueprintVersion, name: draft.name, description: draft.description, priceMinor: draft.priceMinor, currency: draft.currency, billingInterval: draft.billingInterval, routeNodeIds: [...draft.routeNodeIds], publishedAt: nowIso(), publishedBy: DEMO_OPERATOR };
  snapshot.releases.push(release);
  Object.assign(pkg, { name: release.name, description: release.description, priceMinor: release.priceMinor, currency: release.currency, billingInterval: release.billingInterval, status: "published", activeReleaseId: release.id, updatedAt: nowIso() });
  Object.assign(draft, { baseReleaseId: release.id, revision: draft.revision + 1, updatedAt: nowIso() });
  appendAudit(snapshot, "package.publish", "package", packageId, `发布「${pkg.name}」v${version}，包含 ${release.routeNodeIds.length} 个菜单`);
  writeSnapshot(snapshot);
  return release;
}

export function rollbackServicePackage(packageId: string, releaseId: string): void {
  const snapshot = readSubscriptionServiceSnapshot();
  const pkg = snapshot.packages.find((item) => item.id === packageId);
  const release = snapshot.releases.find((item) => item.id === releaseId && item.packageId === packageId);
  if (!pkg || !release) throw new Error("历史版本不存在");
  Object.assign(pkg, { name: release.name, description: release.description, priceMinor: release.priceMinor, currency: release.currency, billingInterval: release.billingInterval, activeReleaseId: release.id, status: "published", updatedAt: nowIso() });
  snapshot.drafts = snapshot.drafts.filter((item) => item.packageId !== packageId);
  snapshot.drafts.push({ packageId, baseReleaseId: release.id, routeBlueprintVersion: snapshot.routeBlueprintVersion, revision: 1, name: release.name, description: release.description, priceMinor: release.priceMinor, currency: release.currency, billingInterval: release.billingInterval, routeNodeIds: [...release.routeNodeIds], updatedAt: nowIso() });
  appendAudit(snapshot, "package.rollback", "package", packageId, `回滚「${pkg.name}」至 v${release.version}`);
  writeSnapshot(snapshot);
}

export function disableServicePackage(packageId: string): void {
  const snapshot = readSubscriptionServiceSnapshot();
  const pkg = snapshot.packages.find((item) => item.id === packageId);
  if (!pkg) return;
  pkg.status = "disabled";
  pkg.updatedAt = nowIso();
  appendAudit(snapshot, "package.disable", "package", packageId, `停用服务包「${pkg.name}」`);
  writeSnapshot(snapshot);
}

export function createMerchantSubscription(input: { subjectType: SubscriptionSubjectType; subjectId: string; packageId: string; startAt: string; endAt?: string; note?: string }): MerchantSubscription {
  const snapshot = readSubscriptionServiceSnapshot();
  const pkg = snapshot.packages.find((item) => item.id === input.packageId);
  if (!pkg || pkg.status !== "published") throw new Error("只能开通已发布的服务包");
  if (!input.subjectId) throw new Error("请选择开通主体");
  if (!Number.isFinite(new Date(input.startAt).getTime())) throw new Error("生效时间无效");
  if (input.endAt && new Date(input.endAt).getTime() <= new Date(input.startAt).getTime()) throw new Error("到期时间必须晚于生效时间");
  if (hasOverlappingSubscription(snapshot.subscriptions, input)) throw new Error("该主体已存在有效期重叠的相同服务包");
  const subscription: MerchantSubscription = { id: id("sub"), ...input, endAt: input.endAt || undefined, note: input.note?.trim(), createdAt: nowIso(), createdBy: DEMO_OPERATOR };
  snapshot.subscriptions.unshift(subscription);
  appendAudit(snapshot, "subscription.create", "subscription", subscription.id, `开通 ${pkg.name} 至 ${input.subjectType}:${input.subjectId}`);
  writeSnapshot(snapshot);
  return subscription;
}

export function extendMerchantSubscription(subscriptionId: string, endAt?: string): void {
  const snapshot = readSubscriptionServiceSnapshot();
  const subscription = snapshot.subscriptions.find((item) => item.id === subscriptionId);
  if (!subscription || subscription.disabledAt) throw new Error("订阅不存在或已停用");
  if (endAt && new Date(endAt).getTime() <= new Date(subscription.startAt).getTime()) throw new Error("到期时间必须晚于生效时间");
  const candidate = { ...subscription, endAt: endAt || undefined };
  if (hasOverlappingSubscription(snapshot.subscriptions, candidate, subscriptionId)) throw new Error("续期后将与另一条订阅重叠");
  subscription.endAt = endAt || undefined;
  appendAudit(snapshot, "subscription.extend", "subscription", subscriptionId, `续期至 ${endAt || "长期有效"}`);
  writeSnapshot(snapshot);
}

export function disableMerchantSubscription(subscriptionId: string, reason: string): void {
  const snapshot = readSubscriptionServiceSnapshot();
  const subscription = snapshot.subscriptions.find((item) => item.id === subscriptionId);
  if (!subscription || subscription.disabledAt) return;
  subscription.disabledAt = nowIso();
  subscription.disabledBy = DEMO_OPERATOR;
  subscription.disableReason = reason.trim() || "运营人员手动停用";
  appendAudit(snapshot, "subscription.disable", "subscription", subscriptionId, subscription.disableReason);
  writeSnapshot(snapshot);
}

export function getEffectiveSubscriptionRoutes(context: EffectiveSubscriptionContext): Set<string> {
  return new Set(resolveEffectiveRouteSources(readSubscriptionServiceSnapshot(), context).map((item) => item.routeNodeId));
}

export function hasConfiguredSubscriptionForContext(context: EffectiveSubscriptionContext): boolean {
  const ids = new Set([context.groupId, context.brandId, context.storeId].filter((item): item is string => Boolean(item)));
  return readSubscriptionServiceSnapshot().subscriptions.some((item) => ids.has(item.subjectId) && !item.disabledAt);
}
