import {currentMAccess} from '../permissions/m-platform-store';
import {mPageKey,mActionKey} from '../permissions/m-platform-catalog';
import {packageOnSale,canDeletePackage,packageChangeToken,validatePackageTerms} from './service-package-lifecycle-domain';
import {seedBasicMenuDemo} from './subscription-basic-menu-demo';
import {seedGrowthMenuDemo} from './subscription-growth-menu-demo';
import { validateCommercialPolicy } from './service-entitlement-domain';
import { seedServiceEntitlementDemo } from './service-entitlement-demo';
import { getMerchantStores, getMerchants } from "./enterprise-merchant-store";
import {
  getSubscriptionRouteCatalog,
  hasOverlappingSubscription,
  resolveEffectiveRouteSources,
  subscriptionLifecycle,
  type BillingInterval,
  type EffectiveSubscriptionContext,
  type MerchantSubscription,
  type ServicePackage,
  type ServicePackageDraft,
  type ServicePackageRelease,
  type SubscriptionServiceSnapshot,
  type SubscriptionSubjectType,
} from "./subscription-service-domain";
import { assertSubscriptionImpactPreview, subscriptionOperationPolicy, type SubscriptionImpactPreview } from "./subscription-operations-domain";
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
  const merchants = getMerchants({ allEnterprises: true }).filter((merchant) => merchant.status === "active");
  const firstMerchant = merchants[0];
  const firstStore = firstMerchant ? getMerchantStores(firstMerchant.merchantId)[0] : undefined;
  const subscriptions: MerchantSubscription[] = [];
  if (firstMerchant) subscriptions.push({ id: "sub-demo-brand-basic", subjectType: "brand", subjectId: firstMerchant.merchantId, packageId: packageBasic.id, startAt: now, createdAt: now, createdBy: DEMO_OPERATOR, note: "演示品牌基础包" });
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
    protectedRoutes: Array.isArray(value.protectedRoutes) ? value.protectedRoutes : [],
    entitlementDemoVersion:value.entitlementDemoVersion,
  };
}

export function readSubscriptionServiceSnapshot(): SubscriptionServiceSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const snapshot=normalizeSnapshot(JSON.parse(raw) as SubscriptionServiceSnapshot);
      const entChanged=appendEntitlementDemo(snapshot),growthChanged=appendGrowthDemo(snapshot),basicChanged=appendBasicDemo(snapshot);
      if(entChanged||growthChanged||basicChanged)writeSubscriptionServiceSnapshot(snapshot,false);
      return snapshot;
    }
  } catch {
    /* fall through */
  }
  const seeded = seedSnapshot();
  appendEntitlementDemo(seeded);
  appendGrowthDemo(seeded);
  appendBasicDemo(seeded);
  writeSubscriptionServiceSnapshot(seeded, false);
  return seeded;
}

function appendBasicDemo(snapshot:SubscriptionServiceSnapshot):boolean {
 const tree=getPublishedSubscriptionMenuTree();return tree?.source==='menu-document'?seedBasicMenuDemo(snapshot,getPublishedSubscriptionRouteCatalog(),tree.blueprintVersion):false;
}

function appendGrowthDemo(snapshot:SubscriptionServiceSnapshot):boolean {
 const tree=getPublishedSubscriptionMenuTree();return tree?.source==='menu-document'?seedGrowthMenuDemo(snapshot,getPublishedSubscriptionRouteCatalog(),tree.blueprintVersion):false;
}

function appendEntitlementDemo(snapshot:SubscriptionServiceSnapshot):boolean {
  if(snapshot.entitlementDemoVersion===1||getPublishedSubscriptionMenuTree()?.source!=='menu-document')return false;
  const demoIds=new Set(['merchant-zhangji','merchant-tea-one','merchant-menusifu-na','merchant-sakura-sushi','merchant-burger-co']);
  return seedServiceEntitlementDemo(snapshot,getPublishedSubscriptionRouteCatalog(),getMerchants({allEnterprises:true}).filter(m=>demoIds.has(m.merchantId)).map(m=>({id:m.merchantId,stores:getMerchantStores(m.merchantId).map(s=>s.storeId)})));
}

export function writeSubscriptionServiceSnapshot(snapshot: SubscriptionServiceSnapshot, notify = true): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  if (notify) window.dispatchEvent(new CustomEvent(SUBSCRIPTION_SERVICE_CHANGE_EVENT));
}

function appendAudit(snapshot: SubscriptionServiceSnapshot, action: string, objectType: "package" | "subscription", objectId: string, detail: string, actor = DEMO_OPERATOR): void {
  snapshot.audit.unshift({ id: id("audit"), action, objectType, objectId, detail, at: nowIso(), actor });
  snapshot.audit = snapshot.audit.slice(0, 300);
}

export function createServicePackage(input: { code: string; name: string; description?: string; priceMinor: number; currency?: string; billingInterval?: BillingInterval; commercial?: import("./subscription-service-domain").ServiceCommercialPolicy }): ServicePackage {
  validateCommercialPolicy(input.commercial, input.priceMinor);
  const snapshot = readSubscriptionServiceSnapshot();
  const code = input.code.trim().toUpperCase();
  if (!code || snapshot.packages.some((item) => item.code === code)) throw new Error("服务包编码不能为空且必须唯一");
  if (!input.name.trim()) throw new Error("服务包名称不能为空");
  const at = nowIso();
  const pkg: ServicePackage = { id: id("pkg"), code, name: input.name.trim(), description: input.description?.trim(), priceMinor: Math.max(0, Math.round(input.priceMinor)), currency: input.currency ?? "CNY", billingInterval: input.billingInterval ?? "month", commercial: input.commercial, status: "unpublished", createdAt: at, updatedAt: at };
  snapshot.packages.unshift(pkg);
  snapshot.drafts.push({ packageId: pkg.id, routeBlueprintVersion: snapshot.routeBlueprintVersion, revision: 1, name: pkg.name, description: pkg.description, priceMinor: pkg.priceMinor, currency: pkg.currency, billingInterval: pkg.billingInterval, commercial: pkg.commercial, routeNodeIds: [], updatedAt: at });
  appendAudit(snapshot, "package.create", "package", pkg.id, `创建服务包「${pkg.name}」`);
  writeSubscriptionServiceSnapshot(snapshot);
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
  commercial?: import("./subscription-service-domain").ServiceCommercialPolicy;
  publish: boolean;
}): ServicePackage {
  validateCommercialPolicy(input.commercial, input.priceMinor);
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
    commercial: input.commercial,
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
    commercial: input.commercial,
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
    commercial: input.commercial,
    routeNodeIds,
    publishedAt: at,
    publishedBy: DEMO_OPERATOR,
  });
  appendAudit(snapshot, input.publish ? "package.create.publish" : "package.create", "package", packageId, input.publish ? `创建并发布服务包「${name}」v1` : `创建服务包「${name}」`);
  if (input.publish) protectCommercialRoutes(snapshot, pkg.id, routeNodeIds, input.commercial);
  writeSubscriptionServiceSnapshot(snapshot);
  return structuredClone(pkg);
}

export function getOrCreatePackageDraft(packageId: string): ServicePackageDraft {
  const snapshot = readSubscriptionServiceSnapshot();
  const existing = snapshot.drafts.find((item) => item.packageId === packageId);
  if (existing) return structuredClone(existing);
  const pkg = snapshot.packages.find((item) => item.id === packageId);
  if (!pkg) throw new Error("服务包不存在");
  const release = snapshot.releases.find((item) => item.id === pkg.activeReleaseId);
  const draft: ServicePackageDraft = { packageId, baseReleaseId: release?.id, routeBlueprintVersion: getPublishedSubscriptionMenuTree()?.blueprintVersion ?? snapshot.routeBlueprintVersion, revision: 1, name: release?.name ?? pkg.name, description: release?.description ?? pkg.description, priceMinor: release?.priceMinor ?? pkg.priceMinor, currency: release?.currency ?? pkg.currency, billingInterval: release?.billingInterval ?? pkg.billingInterval, commercial: release?.commercial ?? pkg.commercial, routeNodeIds: [...(release?.routeNodeIds ?? [])], updatedAt: nowIso() };
  snapshot.drafts.push(draft);
  writeSubscriptionServiceSnapshot(snapshot);
  return structuredClone(draft);
}

export function savePackageDraft(input: ServicePackageDraft): ServicePackageDraft {
  requirePackageWrite();
  validateCommercialPolicy(input.commercial, input.priceMinor);
  const snapshot = readSubscriptionServiceSnapshot();
  validatePackageTerms(snapshot,input.packageId,input);
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
  writeSubscriptionServiceSnapshot(snapshot);
  return structuredClone(next);
}

export function publishServicePackage(packageId: string, expectedRevision: number): ServicePackageRelease {
  requirePackageWrite("publish");
  const snapshot = readSubscriptionServiceSnapshot();
  const pkg = snapshot.packages.find((item) => item.id === packageId);
  const draft = snapshot.drafts.find((item) => item.packageId === packageId);
  if (!pkg || !draft) throw new Error("服务包或草稿不存在");
  validatePackageTerms(snapshot,packageId,draft);
  validateCommercialPolicy(draft.commercial, draft.priceMinor);
  if (pkg.commercial && !draft.commercial) throw Error("已启用的权益控制不能通过清除草稿取消。");
  if (draft.revision !== expectedRevision) throw new Error("草稿版本已变化，请重新确认发布");
  const publishedTree = getPublishedSubscriptionMenuTree();
  if (!publishedTree) throw new Error("请先发布菜单路由配置，再发布服务包");
  if (draft.routeBlueprintVersion !== publishedTree.blueprintVersion) throw new Error("菜单路由蓝图已更新，请重新保存服务包后再发布");
  if (!draft.routeNodeIds.length) throw new Error("请至少选择一个菜单路由");
  const version = Math.max(0, ...snapshot.releases.filter((item) => item.packageId === packageId).map((item) => item.version)) + 1;
  const release: ServicePackageRelease = { id: id("rel"), packageId, version, routeBlueprintVersion: snapshot.routeBlueprintVersion, name: draft.name, description: draft.description, priceMinor: draft.priceMinor, currency: draft.currency, billingInterval: draft.billingInterval, commercial: draft.commercial, routeNodeIds: [...draft.routeNodeIds], publishedAt: nowIso(), publishedBy: DEMO_OPERATOR };
  snapshot.releases.push(release);
  protectCommercialRoutes(snapshot, pkg.id, release.routeNodeIds, release.commercial);
  Object.assign(pkg, { name: release.name, description: release.description, priceMinor: release.priceMinor, currency: release.currency, billingInterval: release.billingInterval, commercial: release.commercial ?? pkg.commercial, status: pkg.status==='disabled'?'disabled':'published', activeReleaseId: release.id, updatedAt: nowIso() });
  Object.assign(draft, { baseReleaseId: release.id, revision: draft.revision + 1, updatedAt: nowIso() });
  appendAudit(snapshot, "package.publish", "package", packageId, `发布「${pkg.name}」v${version}，包含 ${release.routeNodeIds.length} 个菜单`);
  writeSubscriptionServiceSnapshot(snapshot);
  return release;
}

export function rollbackServicePackage(packageId: string, releaseId: string): void {
  requirePackageWrite("rollback");
  const snapshot = readSubscriptionServiceSnapshot();
  const pkg = snapshot.packages.find((item) => item.id === packageId);
  const release = snapshot.releases.find((item) => item.id === releaseId && item.packageId === packageId);
  if (!pkg || !release) throw new Error("历史版本不存在");
  validatePackageTerms(snapshot,packageId,{...release,commercial:release.commercial??pkg.commercial});
  validateCommercialPolicy(release.commercial??pkg.commercial,release.priceMinor);
  Object.assign(pkg, { name: release.name, description: release.description, priceMinor: release.priceMinor, currency: release.currency, billingInterval: release.billingInterval, commercial: release.commercial ?? pkg.commercial, activeReleaseId: release.id, status: pkg.status==='disabled'?'disabled':'published', updatedAt: nowIso() });
  snapshot.drafts = snapshot.drafts.filter((item) => item.packageId !== packageId);
  snapshot.drafts.push({ packageId, baseReleaseId: release.id, routeBlueprintVersion: snapshot.routeBlueprintVersion, revision: 1, name: release.name, description: release.description, priceMinor: release.priceMinor, currency: release.currency, billingInterval: release.billingInterval, commercial: release.commercial ?? pkg.commercial, routeNodeIds: [...release.routeNodeIds], updatedAt: nowIso() });
  protectCommercialRoutes(snapshot, pkg.id, release.routeNodeIds, pkg.commercial);
  appendAudit(snapshot, "package.rollback", "package", packageId, `回滚「${pkg.name}」至 v${release.version}`);
  writeSubscriptionServiceSnapshot(snapshot);
}

function requirePackageWrite(action?:string){if(currentMAccess(mPageKey('services'))!=='edit'||action&&currentMAccess(mActionKey('services',action))!=='edit')throw Error('暂无服务包操作权限。');}
export function changePackageLifecycle(packageId:string,operation:'off'|'on'|'disable'|'restore'|'delete',reason='',expected?:string):void{
 if(!['off','on','disable','restore','delete'].includes(operation))throw Error('服务包操作无效。');
 requirePackageWrite(operation==='off'||operation==='on'?'shelf':operation);
 const snapshot=readSubscriptionServiceSnapshot(),pkg=snapshot.packages.find(p=>p.id===packageId);if(!pkg)throw Error('服务包不存在。');
 if(expected!==undefined&&expected!==packageChangeToken(snapshot,packageId))throw Error('服务包或订阅已变化，请关闭后重新预览影响。');
 if(operation==='delete'){
  if(!canDeletePackage(snapshot,packageId))throw Error('仅从未发布且没有任何订阅记录的草稿可以删除。');
  snapshot.packages=snapshot.packages.filter(p=>p.id!==packageId);snapshot.drafts=snapshot.drafts.filter(d=>d.packageId!==packageId);
 }else if(operation==='disable'){
  if(pkg.status!=='published'||!pkg.activeReleaseId)throw Error('仅已发布且运行中的服务包可以停用。');
  if(!reason.trim())throw Error('请填写停用原因。');if(reason.trim().length>200)throw Error('停用原因不能超过200字。');
  pkg.status='disabled';pkg.saleStatus='off';pkg.disabledReason=reason.trim();
 }else if(operation==='restore'){
  if(pkg.status!=='disabled'||!pkg.activeReleaseId)throw Error('仅已停用且有发布版本的服务包可以恢复。');
  pkg.status='published';pkg.saleStatus='off';
 }else{
  if(pkg.status!=='published'||!pkg.activeReleaseId)throw Error('仅运行中的已发布服务包可以上下架。');
  if(operation==='off'&&!packageOnSale(pkg)||operation==='on'&&packageOnSale(pkg))throw Error('上架状态已变化，请刷新列表。');
  pkg.saleStatus=operation;
 }
 pkg.updatedAt=nowIso();
 const verb={off:'下架',on:'重新上架',disable:'停用服务',restore:'恢复服务',delete:'删除草稿'}[operation];
 appendAudit(snapshot,'package.'+operation,'package',packageId,`${verb}「${pkg.name}」${reason.trim()?'：'+reason.trim():''}`);writeSubscriptionServiceSnapshot(snapshot);
}
export function disableServicePackage(packageId:string,reason:string=''):void{changePackageLifecycle(packageId,'disable',reason);}

function requireSubscriptionWrite(action:string):void {
  if(currentMAccess(mPageKey('subscriptions'))!=='edit'||currentMAccess(mActionKey('subscriptions',action))!=='edit')throw Error('暂无商家订阅操作权限。');
}

export function createMerchantSubscription(input: { subjectType: SubscriptionSubjectType; subjectId: string; packageId: string; startAt: string; endAt?: string; note?: string }): MerchantSubscription {
  requireSubscriptionWrite('create');
  if (input.subjectType !== "brand" && input.subjectType !== "store") throw Error("仅支持品牌或门店订阅。");
  const snapshot = readSubscriptionServiceSnapshot();
  const pkg = snapshot.packages.find((item) => item.id === input.packageId);
  if (!pkg || !packageOnSale(pkg)) throw new Error("只能开通已发布且上架运行中的服务包");
  if (pkg.commercial) throw Error("该服务已启用权益控制，请从品牌详情的服务权益页开通并记录价格、依据和门店范围。");
  if (!input.subjectId) throw new Error("请选择开通主体");
  if (!Number.isFinite(new Date(input.startAt).getTime())) throw new Error("生效时间无效");
  if (input.endAt && new Date(input.endAt).getTime() <= new Date(input.startAt).getTime()) throw new Error("到期时间必须晚于生效时间");
  if (hasOverlappingSubscription(snapshot.subscriptions, input)) throw new Error("该主体已存在有效期重叠的相同服务包");
  const subscription: MerchantSubscription = { id: id("sub"), ...input, endAt: input.endAt || undefined, note: input.note?.trim(), createdAt: nowIso(), createdBy: DEMO_OPERATOR };
  snapshot.subscriptions.unshift(subscription);
  appendAudit(snapshot, "subscription.create", "subscription", subscription.id, `开通 ${pkg.name} 至 ${input.subjectType}:${input.subjectId}`);
  writeSubscriptionServiceSnapshot(snapshot);
  return subscription;
}

export function extendMerchantSubscription(subscriptionId: string, endAt?: string): void {
  requireSubscriptionWrite('extend');
  const snapshot = readSubscriptionServiceSnapshot();
  const subscription = snapshot.subscriptions.find((item) => item.id === subscriptionId);
  if (subscription && subscription.subjectType !== "brand" && subscription.subjectType !== "store") throw Error("仅支持品牌或门店订阅。");
  if (!subscription || subscriptionLifecycle(subscription) !== "生效中") throw new Error("仅生效中的订阅可以续期");
  const pkg=snapshot.packages.find(p=>p.id===subscription.packageId);if(!pkg||!packageOnSale(pkg))throw Error('服务包已下架或停用，不能续期。');
  if (subscription.entitlementKind) throw Error("请从品牌服务权益页办理续期，试用不能通过续期重复获取。");
  if (!endAt || !Number.isFinite(Date.parse(endAt))) throw new Error("请选择新的到期时间");
  const now = Date.now(), next = Date.parse(endAt), previous = subscription.endAt ? Date.parse(subscription.endAt) : Number.NEGATIVE_INFINITY;
  if (next <= now || next <= previous) throw new Error("续期后的到期时间必须晚于当前时间和原到期时间");
  const candidate = { ...subscription, endAt: endAt || undefined };
  if (hasOverlappingSubscription(snapshot.subscriptions, candidate, subscriptionId)) throw new Error("续期后将与另一条订阅重叠");
  subscription.endAt = endAt;
  subscription.updatedAt = nowIso();
  appendAudit(snapshot, "subscription.extend", "subscription", subscriptionId, `续期至 ${endAt}`);
  writeSubscriptionServiceSnapshot(snapshot);
}

export function disableMerchantSubscription(subscriptionId: string, reason: string, preview: SubscriptionImpactPreview): void {
  requireSubscriptionWrite('disable');
  const snapshot = readSubscriptionServiceSnapshot();
  const subscription = snapshot.subscriptions.find((item) => item.id === subscriptionId);
  if (subscription && subscription.subjectType !== "brand" && subscription.subjectType !== "store") throw Error("仅支持品牌或门店订阅。");
  if (!subscription || subscriptionLifecycle(subscription) !== "生效中") throw Error("仅生效中的订阅可以停用");
  if (subscription.entitlementKind) throw Error("请从品牌服务权益页办理停用。");
  const normalizedReason = reason.trim();
  if (!normalizedReason || normalizedReason.length > 200) throw Error("停用原因需填写 1 至 200 字。");
  assertSubscriptionImpactPreview(snapshot, preview);
  subscription.disabledAt = nowIso();
  subscription.disabledBy = DEMO_OPERATOR;
  subscription.disableReason = normalizedReason;
  subscription.updatedAt = subscription.disabledAt;
  appendAudit(snapshot, "subscription.disable", "subscription", subscriptionId, subscription.disableReason);
  writeSubscriptionServiceSnapshot(snapshot);
}

export interface UpdateScheduledMerchantSubscriptionInput {
  id: string;
  subjectType: SubscriptionSubjectType;
  subjectId: string;
  packageId: string;
  startAt: string;
  endAt?: string;
  note?: string;
  agreedPriceMinor?: number;
  agreedCurrency?: string;
  agreedBillingInterval?: BillingInterval;
}

export function updateScheduledMerchantSubscription(input: UpdateScheduledMerchantSubscriptionInput): void {
  requireSubscriptionWrite('edit');
  const snapshot = readSubscriptionServiceSnapshot();
  const subscription = snapshot.subscriptions.find((item) => item.id === input.id);
  if (!subscription || subscriptionLifecycle(subscription) !== "待生效") throw Error("仅待生效订阅可以编辑。");
  if (subscription.entitlementKind) throw Error("请从品牌服务权益页办理变更。");
  const policy = subscriptionOperationPolicy(snapshot, subscription);
  const currentPackage = snapshot.packages.find((item) => item.id === subscription.packageId);
  const nextPackage = snapshot.packages.find((item) => item.id === input.packageId);
  if (!nextPackage) throw Error("服务包不存在。");
  if (policy.limitedEdit) {
    const locked = input.subjectType !== subscription.subjectType || input.subjectId !== subscription.subjectId || input.packageId !== subscription.packageId || input.startAt !== subscription.startAt || input.agreedPriceMinor !== subscription.agreedPriceMinor || input.agreedCurrency !== subscription.agreedCurrency || input.agreedBillingInterval !== subscription.agreedBillingInterval;
    if (locked) throw Error("服务包已下架，只能修改到期时间和备注。");
  } else if (!packageOnSale(nextPackage)) throw Error("请改选已发布且上架运行中的服务包。");
  if (!input.subjectId) throw Error("请选择开通主体。");
  if (!Number.isFinite(Date.parse(input.startAt)) || (input.endAt && Date.parse(input.endAt) <= Date.parse(input.startAt))) throw Error("到期时间必须晚于生效时间。");
  if (hasOverlappingSubscription(snapshot.subscriptions, input, input.id)) throw Error("该主体已存在有效期重叠的相同服务包。");
  Object.assign(subscription, { ...input, endAt: input.endAt || undefined, note: input.note?.trim(), updatedAt: nowIso() });
  appendAudit(snapshot, "subscription.update_scheduled", "subscription", subscription.id, `编辑待生效订阅；服务包 ${currentPackage?.name ?? subscription.packageId} → ${nextPackage.name}`);
  writeSubscriptionServiceSnapshot(snapshot);
}

export function activateMerchantSubscriptionNow(subscriptionId: string, preview: SubscriptionImpactPreview): void {
  requireSubscriptionWrite('activate');
  const snapshot = readSubscriptionServiceSnapshot();
  const subscription = snapshot.subscriptions.find((item) => item.id === subscriptionId);
  if (!subscription || subscriptionLifecycle(subscription) !== "待生效") throw Error("仅待生效订阅可以立即生效。");
  if (!subscriptionOperationPolicy(snapshot, subscription).allowed.includes("activate")) throw Error("当前服务包不可立即生效。");
  assertSubscriptionImpactPreview(snapshot, preview);
  const startAt = nowIso();
  const candidate = { ...subscription, startAt };
  if (hasOverlappingSubscription(snapshot.subscriptions, candidate, subscriptionId)) throw Error("立即生效后将与另一条订阅重叠。");
  subscription.startAt = startAt;
  subscription.updatedAt = startAt;
  appendAudit(snapshot, "subscription.activate_now", "subscription", subscriptionId, "立即生效");
  writeSubscriptionServiceSnapshot(snapshot);
}

export function adjustMerchantSubscriptionEnd(subscriptionId: string, endAt: string, reason: string, preview: SubscriptionImpactPreview): void {
  requireSubscriptionWrite('adjust-end');
  const snapshot = readSubscriptionServiceSnapshot();
  const subscription = snapshot.subscriptions.find((item) => item.id === subscriptionId);
  if (!subscription || subscriptionLifecycle(subscription) !== "生效中") throw Error("仅生效中的订阅可以调整到期时间。");
  if (subscription.entitlementKind) throw Error("请从品牌服务权益页办理变更。");
  const next = Date.parse(endAt), now = Date.now(), previous = subscription.endAt ? Date.parse(subscription.endAt) : undefined;
  if (!Number.isFinite(next) || next <= now || (previous !== undefined && next >= previous)) throw Error("新的到期时间必须晚于当前时间且早于原到期时间。");
  const normalizedReason = reason.trim();
  if (!normalizedReason || normalizedReason.length > 200) throw Error("调整原因需填写 1 至 200 字。");
  if (preview.proposedEndAt !== endAt) throw Error("订阅信息或状态已发生变化，请关闭弹窗后重新查看影响");
  assertSubscriptionImpactPreview(snapshot, preview);
  subscription.endAt = endAt;
  subscription.updatedAt = nowIso();
  appendAudit(snapshot, "subscription.adjust_end", "subscription", subscriptionId, `提前到期至 ${endAt}：${normalizedReason}`);
  writeSubscriptionServiceSnapshot(snapshot);
}

export function cancelScheduledMerchantSubscription(subscriptionId: string, reason: string, preview: SubscriptionImpactPreview): void {
  requireSubscriptionWrite('cancel');
  const snapshot = readSubscriptionServiceSnapshot();
  const subscription = snapshot.subscriptions.find((item) => item.id === subscriptionId);
  if (!subscription || subscriptionLifecycle(subscription) !== "待生效") throw Error("仅待生效订阅可以撤销。");
  if (subscription.entitlementKind) throw Error("请从品牌服务权益页办理变更。");
  const normalizedReason = reason.trim();
  if (!normalizedReason || normalizedReason.length > 200) throw Error("撤销原因需填写 1 至 200 字。");
  assertSubscriptionImpactPreview(snapshot, preview);
  subscription.cancelledAt = nowIso(); subscription.cancelledBy = DEMO_OPERATOR; subscription.cancelReason = normalizedReason; subscription.updatedAt = subscription.cancelledAt;
  appendAudit(snapshot, "subscription.cancel", "subscription", subscriptionId, normalizedReason);
  writeSubscriptionServiceSnapshot(snapshot);
}

export function createMerchantSubscriptionFromExisting(sourceId: string, input: Pick<UpdateScheduledMerchantSubscriptionInput, "startAt" | "endAt" | "note">): MerchantSubscription {
  requireSubscriptionWrite('create');
  const snapshot = readSubscriptionServiceSnapshot();
  const source = snapshot.subscriptions.find((item) => item.id === sourceId);
  if (!source || !["已到期", "已停用", "已作废"].includes(subscriptionLifecycle(source))) throw Error("仅历史订阅可以重新开通。");
  if (source.subjectType !== "brand" && source.subjectType !== "store") throw Error("仅支持品牌或门店订阅。");
  const created = createMerchantSubscription({ subjectType: source.subjectType, subjectId: source.subjectId, packageId: source.packageId, startAt: input.startAt, endAt: input.endAt, note: input.note ?? source.note });
  const latest = readSubscriptionServiceSnapshot();
  appendAudit(latest, "subscription.reopen", "subscription", created.id, `从 ${sourceId} 重新开通`);
  writeSubscriptionServiceSnapshot(latest);
  return created;
}

export function getSubscriptionAuditEntries(subscriptionId: string) {
  return readSubscriptionServiceSnapshot().audit.filter((entry) => entry.objectType === "subscription" && entry.objectId === subscriptionId);
}

export function getEffectiveSubscriptionRoutes(context: EffectiveSubscriptionContext): Set<string> {
  return new Set(resolveEffectiveRouteSources(readSubscriptionServiceSnapshot(), context).map((item) => item.routeNodeId));
}

export function hasConfiguredSubscriptionForContext(context: EffectiveSubscriptionContext): boolean {
  const snapshot = readSubscriptionServiceSnapshot();
  const ids = new Set([context.brandId, context.storeId].filter((item): item is string => Boolean(item)));
  return snapshot.subscriptions.some(
    (item) => (item.subjectType === "brand" || item.subjectType === "store") && ids.has(item.subjectId) && !item.disabledAt && !item.cancelledAt && !item.id.startsWith("sub-demo-") && !snapshot.packages.find(p=>p.id===item.packageId)?.commercial,
  );
}

function protectCommercialRoutes(snapshot: SubscriptionServiceSnapshot, packageId: string, ids: string[], policy?: import('./subscription-service-domain').ServiceCommercialPolicy): void {
  if (!policy) return;
  const catalog = getPublishedSubscriptionRouteCatalog();
  snapshot.protectedRoutes ??= [];
  for (const routeNodeId of ids) {
    const node = catalog.find(n=>n.id===routeNodeId);
    if (node && !snapshot.protectedRoutes.some(r=>r.packageId===packageId&&r.path===node.path)) snapshot.protectedRoutes.push({packageId,routeNodeId,path:node.path});
  }
}

export function getEffectiveLegacySubscriptionRoutes(context: EffectiveSubscriptionContext): Set<string> {
  const snapshot=readSubscriptionServiceSnapshot();
  const legacy={...snapshot,packages:snapshot.packages.filter(p=>!p.commercial)};
  return new Set(resolveEffectiveRouteSources(legacy,context).map(s=>s.routeNodeId));
}
