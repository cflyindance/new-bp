import { getGroups, getMerchantById, getMerchantStores, getMerchants, getStoreById } from "./enterprise-merchant-store";
import { resolveEffectiveRouteSources, subscriptionStatusLabel, type BillingInterval, type ServicePackageDraft, type SubscriptionSubjectType } from "./subscription-service-domain";
import { SUBSCRIPTION_SERVICE_CREATE_PATH, SUBSCRIPTION_SERVICE_ROUTE_PREFIX, isMerchantSubscriptionsPath, isSubscriptionServiceCreatePath, isSubscriptionServicePath } from "./subscription-service-scope";
import { bindSubscriptionServiceCreateWizard, consumeSubscriptionWizardFeedback, renderSubscriptionServiceCreateWizard } from "./subscription-service-create-wizard-ui";
import { ensurePublishedSubscriptionMenuTree, flattenSubscriptionMenuTree, getPublishedSubscriptionMenuTree } from "./subscription-published-menu-tree";
import { initializeSubscriptionMenuTreeIndeterminate, readSubscriptionMenuTreeToggle, renderSubscriptionMenuTree } from "./subscription-menu-tree-ui";
import {
  createMerchantSubscription,
  disableMerchantSubscription,
  disableServicePackage,
  extendMerchantSubscription,
  getOrCreatePackageDraft,
  publishServicePackage,
  readSubscriptionServiceSnapshot,
  rollbackServicePackage,
  savePackageDraft,
} from "./subscription-service-store";

type ModalState =
  | { kind: "create-subscription" }
  | { kind: "publish"; packageId: string; revision: number }
  | { kind: "disable-package"; packageId: string }
  | { kind: "extend-subscription"; subscriptionId: string }
  | { kind: "disable-subscription"; subscriptionId: string }
  | null;

let modalState: ModalState = null;
let feedback = "";
let routeSearch = "";
let subscriptionType: SubscriptionSubjectType = "brand";
let createSubscriptionDraft: { subjectId: string; packageId: string; startAt: string; endAt: string; note: string } | null = null;
let createSubscriptionError = "";
let createSubscriptionSubmitting = false;
let subscriptionDialogKeydownBound = false;
let activeSubscriptionMount: (() => void) | null = null;
let previousBodyOverflow = "";
let subscriptionModalBackgroundLocked = false;

function esc(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function money(minor: number, currency: string): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency, minimumFractionDigits: 0 }).format(minor / 100);
}

function intervalLabel(value: BillingInterval): string {
  return ({ month: "月", quarter: "季度", year: "年", "one-time": "一次性" } as const)[value];
}

function statusBadge(status: string): string {
  const classes = status === "published" || status === "生效中" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "disabled" || status.includes("停用") || status === "已到期" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700";
  const text = ({ published: "已发布", unpublished: "未发布", disabled: "已停用" } as Record<string, string>)[status] ?? status;
  return `<span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}">${esc(text)}</span>`;
}

function renderHeader(title: string, description: string, action = ""): string {
  return `<section class="flex min-h-0 flex-1 flex-col overflow-hidden" data-subscription-service-page>
    <div class="shrink-0 border-b border-border bg-card px-5 py-5 lg:px-7">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div><p class="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">ENTITLEMENT CONTROL</p><h2 class="mt-1 text-2xl font-semibold tracking-tight text-card-foreground">${esc(title)}</h2><p class="mt-1 max-w-3xl text-sm text-muted-foreground">${esc(description)}</p></div>
        ${action ? `<div class="flex flex-wrap items-center gap-2">${action}</div>` : ""}
      </div>
      ${feedback ? `<div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800" role="status">${esc(feedback)}</div>` : ""}
    </div>`;
}

function renderPackageList(): string {
  feedback = consumeSubscriptionWizardFeedback() || feedback;
  const snapshot = readSubscriptionServiceSnapshot();
  const catalogCount = getPublishedSubscriptionMenuTree()?.selectableNodeCount ?? 0;
  const rows = snapshot.packages.map((pkg) => {
    const release = snapshot.releases.find((item) => item.id === pkg.activeReleaseId);
    const subscribers = snapshot.subscriptions.filter((item) => item.packageId === pkg.id && !item.disabledAt).length;
    return `<tr class="border-b border-border/70 last:border-0 hover:bg-muted/30">
      <td class="px-5 py-4"><div class="font-semibold text-foreground">${esc(pkg.name)}</div><div class="mt-1 font-mono text-[11px] text-muted-foreground">${esc(pkg.code)}</div></td>
      <td class="px-4 py-4"><div class="font-semibold">${money(pkg.priceMinor, pkg.currency)}</div><div class="text-xs text-muted-foreground">/${intervalLabel(pkg.billingInterval)}</div></td>
      <td class="px-4 py-4 text-sm"><span class="font-semibold">${release?.routeNodeIds.length ?? 0}</span><span class="text-muted-foreground"> / ${catalogCount} 个菜单</span></td>
      <td class="px-4 py-4 text-sm"><span class="font-semibold">${subscribers}</span><span class="text-muted-foreground"> 个主体</span></td>
      <td class="px-4 py-4">${statusBadge(pkg.status)}</td>
      <td class="px-5 py-4 text-right"><a href="#${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}/${encodeURIComponent(pkg.id)}" class="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:bg-muted">配置与版本</a></td>
    </tr>`;
  }).join("");
  return `${renderHeader("订阅服务包", "把统一菜单路由组合成可发布、可回滚的服务能力产品。", `<a href="#${SUBSCRIPTION_SERVICE_CREATE_PATH}" class="inline-flex h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">＋ 创建服务包</a>`)}
    <div class="min-h-0 flex-1 overflow-auto bg-muted/20 p-5 lg:p-7">
      <div class="mx-auto max-w-[86rem] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div class="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 class="font-semibold">服务包目录</h3><p class="mt-1 text-xs text-muted-foreground">发布新版本后，所有有效订阅统一跟随。</p></div><div class="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">${snapshot.packages.length} 个服务包</div></div>
        <table class="w-full min-w-[820px] text-left"><thead class="bg-muted/50 text-xs text-muted-foreground"><tr><th class="px-5 py-3 font-medium">服务包</th><th class="px-4 py-3 font-medium">展示价格</th><th class="px-4 py-3 font-medium">菜单能力</th><th class="px-4 py-3 font-medium">订阅主体</th><th class="px-4 py-3 font-medium">状态</th><th class="px-5 py-3"></th></tr></thead><tbody>${rows || `<tr><td colspan="6" class="p-12 text-center text-sm text-muted-foreground">暂无服务包</td></tr>`}</tbody></table>
      </div>
    </div>${renderModal()}</section>`;
}

function renderRouteTree(draft: ServicePackageDraft): string {
  const tree = getPublishedSubscriptionMenuTree();
  const validIds = new Set(tree ? flattenSubscriptionMenuTree(tree.roots).filter((node) => node.selectable).map((node) => node.routeNodeId) : []);
  const invalidIds = draft.routeNodeIds.filter((id) => !validIds.has(id));
  return `${invalidIds.length ? `<div class="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>${invalidIds.length} 项已失效菜单</strong><p class="mt-1 text-xs">${invalidIds.map(esc).join("、")}</p><p class="mt-1 text-xs">保存草稿后将自动移除这些失效能力，已发布版本保持不变。</p></div>` : ""}${renderSubscriptionMenuTree({ tree, selectedIds: draft.routeNodeIds.filter((id) => validIds.has(id)), query: routeSearch })}`;
}

function renderPackageDetail(packageId: string): string {
  const snapshot = readSubscriptionServiceSnapshot();
  const pkg = snapshot.packages.find((item) => item.id === packageId);
  if (!pkg) return `${renderHeader("服务包不存在", "该服务包可能已被移除。", `<a href="#${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}" class="rounded-lg border px-4 py-2 text-sm">返回列表</a>`)}<div class="p-10 text-sm text-muted-foreground">未找到服务包。</div></section>`;
  const draft = getOrCreatePackageDraft(packageId);
  const releases = snapshot.releases.filter((item) => item.packageId === packageId).sort((a, b) => b.version - a.version);
  const subscriberCount = snapshot.subscriptions.filter((item) => item.packageId === packageId && !item.disabledAt).length;
  return `${renderHeader(pkg.name, `${pkg.code} · 当前 ${pkg.status === "published" ? `v${releases.find((item) => item.id === pkg.activeReleaseId)?.version ?? 0}` : "尚未发布"}`, `<a href="#${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}" class="h-10 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">返回列表</a>`)}
    <div class="min-h-0 flex-1 overflow-auto bg-muted/20 p-5 lg:p-7"><form data-sub-package-form data-package-id="${esc(pkg.id)}" data-revision="${draft.revision}" class="mx-auto grid max-w-[92rem] gap-5 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
      <aside class="space-y-4"><div class="rounded-2xl border border-border bg-card p-5 shadow-sm"><div class="flex items-center justify-between"><h3 class="font-semibold">产品定义</h3>${statusBadge(pkg.status)}</div><label class="mt-5 block text-xs font-semibold text-muted-foreground">名称<input name="name" value="${esc(draft.name)}" class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-600"></label><label class="mt-4 block text-xs font-semibold text-muted-foreground">说明<textarea name="description" rows="4" class="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600">${esc(draft.description)}</textarea></label><div class="mt-4 grid grid-cols-[1fr_110px] gap-3"><label class="text-xs font-semibold text-muted-foreground">价格（元）<input name="price" type="number" min="0" step="0.01" value="${(draft.priceMinor / 100).toFixed(2)}" class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"></label><label class="text-xs font-semibold text-muted-foreground">周期<select name="billingInterval" class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm">${(["month", "quarter", "year", "one-time"] as BillingInterval[]).map((value) => `<option value="${value}" ${draft.billingInterval === value ? "selected" : ""}>${intervalLabel(value)}</option>`).join("")}</select></label></div><button type="submit" class="mt-5 h-10 w-full rounded-lg border border-border bg-background text-sm font-semibold hover:bg-muted">保存草稿</button></div>
      <div class="rounded-2xl border border-border bg-slate-950 p-5 text-white shadow-sm"><p class="text-xs font-semibold uppercase tracking-[.15em] text-emerald-300">发布影响</p><div class="mt-4 grid grid-cols-2 gap-4"><div><p class="text-3xl font-semibold">${draft.routeNodeIds.length}</p><p class="text-xs text-slate-400">菜单节点</p></div><div><p class="text-3xl font-semibold">${subscriberCount}</p><p class="text-xs text-slate-400">订阅主体</p></div></div><button type="button" data-sub-publish data-package-id="${esc(pkg.id)}" data-revision="${draft.revision}" class="mt-5 h-10 w-full rounded-lg bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400">校验并发布</button>${pkg.status !== "disabled" ? `<button type="button" data-sub-disable-package data-package-id="${esc(pkg.id)}" class="mt-2 h-9 w-full rounded-lg border border-white/20 text-xs font-semibold text-white/80 hover:bg-white/10">停用服务包</button>` : ""}</div></aside>
      <main class="min-w-0 rounded-2xl border border-border bg-card shadow-sm"><div class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 p-4 backdrop-blur"><div><h3 class="font-semibold">菜单路由能力</h3><p class="text-xs text-muted-foreground">只选择页面路由；页面内操作继续由角色权限控制。</p></div><input data-sub-route-search value="${esc(routeSearch)}" placeholder="搜索菜单或路径" class="h-9 w-64 rounded-lg border border-border bg-background px-3 text-sm"></div><div class="space-y-3 p-4">${renderRouteTree(draft) || `<div class="p-10 text-center text-sm text-muted-foreground">没有匹配的菜单</div>`}</div></main>
      <aside class="space-y-4"><div class="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 class="font-semibold">版本历史</h3><div class="mt-4 space-y-3">${releases.map((release) => `<div class="rounded-xl border ${release.id === pkg.activeReleaseId ? "border-emerald-300 bg-emerald-50/60" : "border-border"} p-3"><div class="flex items-center justify-between"><strong class="text-sm">v${release.version}</strong>${release.id === pkg.activeReleaseId ? `<span class="text-[10px] font-bold text-emerald-700">当前</span>` : `<button type="button" data-sub-rollback data-package-id="${esc(pkg.id)}" data-release-id="${esc(release.id)}" class="text-xs font-semibold text-emerald-700">回滚</button>`}</div><p class="mt-1 text-xs text-muted-foreground">${release.routeNodeIds.length} 个菜单 · ${new Date(release.publishedAt).toLocaleString("zh-CN")}</p></div>`).join("") || `<p class="text-sm text-muted-foreground">发布后将在此保留不可变版本。</p>`}</div></div><div class="rounded-2xl border border-border bg-card p-5 text-sm shadow-sm"><h3 class="font-semibold">规则边界</h3><ul class="mt-3 space-y-2 text-xs leading-5 text-muted-foreground"><li>• 发布后所有有效订阅统一更新</li><li>• 多个服务包的菜单能力取并集</li><li>• 下级订阅只能增加上级能力</li><li>• 价格仅展示，不触发在线扣款</li></ul></div></aside>
    </form></div>${renderModal()}</section>`;
}

function subjectOptions(type: SubscriptionSubjectType): Array<{ id: string; label: string }> {
  if (type === "group") return getGroups({ allEnterprises: true, status: "active" }).map((item) => ({ id: item.groupId, label: `${item.name} · ${item.code}` }));
  if (type === "brand") return getMerchants({ allEnterprises: true }).filter((item) => item.status !== "closed").map((item) => ({ id: item.merchantId, label: `${item.name} · ${item.code}` }));
  return getMerchants({ allEnterprises: true }).flatMap((merchant) => getMerchantStores(merchant.merchantId).map((store) => ({ id: store.storeId, label: `${store.name} · ${merchant.name}` })));
}

function subjectTypeLabel(type: unknown): "集团" | "品牌" | "门店" | "未知" {
  if (type === "group") return "集团";
  if (type === "brand") return "品牌";
  if (type === "store") return "门店";
  return "未知";
}

function subjectLabel(type: unknown, id: string): string {
  if (type === "group") return getGroups({ allEnterprises: true }).find((item) => item.groupId === id)?.name ?? id;
  if (type === "brand") return getMerchantById(id)?.name ?? id;
  if (type === "store") return getStoreById(id)?.name ?? id;
  return "未知主体";
}

function renderSubscriptions(): string {
  const snapshot = readSubscriptionServiceSnapshot();
  const publishedPackages = snapshot.packages.filter((item) => item.status === "published");
  const rows = snapshot.subscriptions.map((subscription) => {
    const pkg = snapshot.packages.find((item) => item.id === subscription.packageId);
    const status = subscriptionStatusLabel(subscription, pkg?.status);
    const typeLabel = subjectTypeLabel(subscription.subjectType);
    const label = subjectLabel(subscription.subjectType, subscription.subjectId);
    const subjectIdLine = label === subscription.subjectId ? "" : `<div class="mt-1 font-mono text-[10px] text-muted-foreground">${esc(subscription.subjectId)}</div>`;
    return `<tr class="border-b border-border/70 last:border-0"><td class="px-4 py-4"><div class="font-semibold">${esc(label)}</div>${subjectIdLine}</td><td class="px-4 py-4"><span class="inline-flex rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold">${typeLabel}</span></td><td class="px-4 py-4"><div class="font-semibold">${esc(pkg?.name ?? "未知服务包")}</div><div class="mt-1 font-mono text-[10px] text-muted-foreground">${esc(pkg?.code)}</div></td><td class="px-4 py-4 text-xs leading-5"><div>${new Date(subscription.startAt).toLocaleDateString("zh-CN")}</div><div class="text-muted-foreground">至 ${subscription.endAt ? new Date(subscription.endAt).toLocaleDateString("zh-CN") : "长期"}</div></td><td class="px-4 py-4">${statusBadge(status)}</td><td class="px-4 py-4 text-right">${!subscription.disabledAt ? `<button type="button" data-sub-extend data-subscription-id="${esc(subscription.id)}" class="mr-2 text-xs font-semibold text-emerald-700">续期</button><button type="button" data-sub-disable data-subscription-id="${esc(subscription.id)}" class="text-xs font-semibold text-rose-700">停用</button>` : ""}</td></tr>`;
  }).join("");
  return `${renderHeader("商家订阅", "在集团、品牌与门店层级开通服务包；下级自动继承上级能力并可继续增配。", `<button type="button" data-sub-open-create class="inline-flex h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">＋ 新增商家</button>`)}
    <div class="min-h-0 flex-1 overflow-auto bg-muted/20 p-5 lg:p-7"><div class="mx-auto max-w-[92rem] overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><div><h3 class="font-semibold">订阅明细</h3><p class="mt-1 text-xs text-muted-foreground">${snapshot.subscriptions.length} 条记录 · 状态按生效与到期时间实时计算</p></div><div class="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">集团 → 品牌 → 门店</div></div><div class="overflow-auto"><table class="w-full min-w-[880px] text-left"><thead class="bg-muted/50 text-xs text-muted-foreground"><tr><th class="px-4 py-3 font-medium">主体</th><th class="px-4 py-3 font-medium">主体类型</th><th class="px-4 py-3 font-medium">服务包</th><th class="px-4 py-3 font-medium">有效期</th><th class="px-4 py-3 font-medium">状态</th><th class="px-4 py-3 text-right font-medium">操作</th></tr></thead><tbody>${rows || `<tr><td colspan="6" class="p-12 text-center text-sm text-muted-foreground">暂无订阅记录</td></tr>`}</tbody></table></div></div></div>${renderModal()}</section>`;
}

function resetCreateSubscriptionDraft(): void {
  subscriptionType = "brand";
  const subjects = subjectOptions(subscriptionType);
  const firstPackage = readSubscriptionServiceSnapshot().packages.find((item) => item.status === "published");
  createSubscriptionDraft = { subjectId: subjects[0]?.id ?? "", packageId: firstPackage?.id ?? "", startAt: new Date().toISOString().slice(0, 10), endAt: "", note: "" };
  createSubscriptionError = "";
  createSubscriptionSubmitting = false;
}

function syncCreateSubscriptionDraft(): void {
  const form = document.querySelector<HTMLFormElement>("[data-sub-create-subscription]");
  if (!form || !createSubscriptionDraft) return;
  const data = new FormData(form);
  createSubscriptionDraft = { subjectId: String(data.get("subjectId") ?? ""), packageId: String(data.get("packageId") ?? ""), startAt: String(data.get("startAt") ?? ""), endAt: String(data.get("endAt") ?? ""), note: String(data.get("note") ?? "") };
}

function renderCreateSubscriptionModal(): string {
  const draft = createSubscriptionDraft;
  if (!draft) return "";
  let options: Array<{ id: string; label: string }> = [];
  let publishedPackages: ReturnType<typeof readSubscriptionServiceSnapshot>["packages"] = [];
  let readError = "";
  try {
    options = subjectOptions(subscriptionType);
    publishedPackages = readSubscriptionServiceSnapshot().packages.filter((item) => item.status === "published");
  } catch (error) { readError = error instanceof Error ? error.message : "读取开通数据失败，请关闭后重试"; }
  const disabled = createSubscriptionSubmitting || Boolean(readError) || !options.length || !publishedPackages.length;
  return `<div class="fixed inset-0 z-[190] grid place-items-center bg-slate-950/45 p-4" data-sub-modal-backdrop role="presentation"><form data-sub-create-subscription role="dialog" aria-modal="true" aria-labelledby="create-subscription-title" class="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"><div class="flex items-start justify-between gap-4"><div><p class="text-[11px] font-bold uppercase tracking-[.16em] text-emerald-700">MANUAL ENTITLEMENT</p><h3 id="create-subscription-title" class="mt-1 text-xl font-semibold">开通服务</h3><p class="mt-1 text-xs leading-5 text-muted-foreground">保留集团、品牌、门店层级，按需选择服务包。</p></div><button type="button" data-sub-modal-close ${createSubscriptionSubmitting ? "disabled" : ""} class="grid size-9 place-items-center rounded-lg border border-border text-lg hover:bg-muted disabled:opacity-40" aria-label="关闭开通服务弹窗">×</button></div>${createSubscriptionError || readError ? `<div data-sub-create-error class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert" aria-live="assertive">${esc(createSubscriptionError || readError)}</div>` : ""}<label class="mt-5 block text-xs font-semibold text-muted-foreground">主体层级<select name="subjectType" data-sub-subject-type autofocus class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"><option value="group" ${subscriptionType === "group" ? "selected" : ""}>集团</option><option value="brand" ${subscriptionType === "brand" ? "selected" : ""}>品牌</option><option value="store" ${subscriptionType === "store" ? "selected" : ""}>门店</option></select></label><label class="mt-4 block text-xs font-semibold text-muted-foreground">开通主体<select name="subjectId" required class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">${options.map((item) => `<option value="${esc(item.id)}" ${draft.subjectId === item.id ? "selected" : ""}>${esc(item.label)}</option>`).join("")}</select>${options.length ? "" : `<span class="mt-1 block text-xs text-amber-700">暂无可选主体</span>`}</label><label class="mt-4 block text-xs font-semibold text-muted-foreground">服务包<select name="packageId" required class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">${publishedPackages.map((pkg) => `<option value="${esc(pkg.id)}" ${draft.packageId === pkg.id ? "selected" : ""}>${esc(pkg.name)} · ${money(pkg.priceMinor, pkg.currency)}/${intervalLabel(pkg.billingInterval)}</option>`).join("")}</select>${publishedPackages.length ? "" : `<span class="mt-1 block text-xs text-amber-700">暂无已发布服务包</span>`}</label><div class="mt-4 grid grid-cols-2 gap-3"><label class="text-xs font-semibold text-muted-foreground">生效日期<input name="startAt" type="date" required value="${esc(draft.startAt)}" class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"></label><label class="text-xs font-semibold text-muted-foreground">到期日期<input name="endAt" type="date" value="${esc(draft.endAt)}" class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"></label></div><label class="mt-4 block text-xs font-semibold text-muted-foreground">备注<textarea name="note" rows="3" class="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="合同号、开通原因等">${esc(draft.note)}</textarea></label><div class="mt-6 flex justify-end gap-2"><button type="button" data-sub-modal-close ${createSubscriptionSubmitting ? "disabled" : ""} class="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-40">取消</button><button type="submit" ${disabled ? "disabled" : ""} class="h-10 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">${createSubscriptionSubmitting ? "开通中…" : "确认开通"}</button></div></form></div>`;
}

function renderModal(): string {
  if (!modalState) return "";
  const modal = modalState;
  if (modal.kind === "create-subscription") return renderCreateSubscriptionModal();
  const snapshot = readSubscriptionServiceSnapshot();
  if (modal.kind === "publish") {
    const draft = snapshot.drafts.find((item) => item.packageId === modal.packageId);
    const pkg = snapshot.packages.find((item) => item.id === modal.packageId);
    const current = snapshot.releases.find((item) => item.id === pkg?.activeReleaseId);
    const added = draft?.routeNodeIds.filter((item) => !current?.routeNodeIds.includes(item)).length ?? 0;
    const removed = current?.routeNodeIds.filter((item) => !draft?.routeNodeIds.includes(item)).length ?? 0;
    const affected = snapshot.subscriptions.filter((item) => item.packageId === modal.packageId && !item.disabledAt).length;
    return `<div class="fixed inset-0 z-[180] grid place-items-center bg-slate-950/45 p-4"><div class="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"><p class="text-[11px] font-bold uppercase tracking-[.16em] text-emerald-700">PUBLISH IMPACT</p><h3 class="mt-1 text-xl font-semibold">确认发布「${esc(pkg?.name)}」</h3><div class="mt-5 grid grid-cols-3 gap-3"><div class="rounded-xl bg-emerald-50 p-4"><p class="text-2xl font-semibold text-emerald-800">+${added}</p><p class="text-xs text-emerald-700">新增菜单</p></div><div class="rounded-xl bg-rose-50 p-4"><p class="text-2xl font-semibold text-rose-800">-${removed}</p><p class="text-xs text-rose-700">移除菜单</p></div><div class="rounded-xl bg-slate-100 p-4"><p class="text-2xl font-semibold">${affected}</p><p class="text-xs text-slate-600">受影响主体</p></div></div><p class="mt-4 text-sm leading-6 text-muted-foreground">发布会让全部有效订阅立即切换到新版本，并刷新菜单能力。</p><div class="mt-6 flex justify-end gap-2"><button type="button" data-sub-modal-close class="h-10 rounded-lg border border-border px-4 text-sm font-semibold">取消</button><button type="button" data-sub-confirm-publish data-package-id="${esc(modal.packageId)}" data-revision="${modal.revision}" class="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white">确认发布</button></div></div></div>`;
  }
  if (modal.kind === "extend-subscription") return `<div class="fixed inset-0 z-[180] grid place-items-center bg-slate-950/45 p-4"><form data-sub-extend-form data-subscription-id="${esc(modal.subscriptionId)}" class="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"><h3 class="text-xl font-semibold">续期订阅</h3><label class="mt-5 block text-xs font-semibold text-muted-foreground">新的到期日期<input name="endAt" type="date" class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"></label><p class="mt-2 text-xs text-muted-foreground">留空表示长期有效。</p><div class="mt-6 flex justify-end gap-2"><button type="button" data-sub-modal-close class="h-10 rounded-lg border border-border px-4 text-sm font-semibold">取消</button><button type="submit" class="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white">确认续期</button></div></form></div>`;
  const isPackage = modal.kind === "disable-package";
  const objectId = isPackage ? modal.packageId : modal.subscriptionId;
  return `<div class="fixed inset-0 z-[180] grid place-items-center bg-slate-950/45 p-4"><form data-sub-disable-form data-kind="${isPackage ? "package" : "subscription"}" data-object-id="${esc(objectId)}" class="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"><h3 class="text-xl font-semibold">确认停用</h3><p class="mt-2 text-sm leading-6 text-muted-foreground">${isPackage ? "所有有效和预约订阅将停止提供菜单能力，重新发布后仍在有效期内的订阅会自动恢复。" : "该订阅将立即退出能力并集；此操作会保留审计记录。"}</p>${isPackage ? "" : `<label class="mt-4 block text-xs font-semibold text-muted-foreground">停用原因<textarea name="reason" required rows="3" class="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"></textarea></label>`}<div class="mt-6 flex justify-end gap-2"><button type="button" data-sub-modal-close class="h-10 rounded-lg border border-border px-4 text-sm font-semibold">取消</button><button type="submit" class="h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white">确认停用</button></div></form></div>`;
}

export function renderSubscriptionServicePage(path: string): string {
  if (isSubscriptionServiceCreatePath(path)) return renderSubscriptionServiceCreateWizard();
  if (isMerchantSubscriptionsPath(path)) return renderSubscriptions();
  const packageId = isSubscriptionServicePath(path) ? decodeURIComponent(path.slice(SUBSCRIPTION_SERVICE_ROUTE_PREFIX.length).replace(/^\//, "")) : "";
  return packageId ? renderPackageDetail(packageId) : renderPackageList();
}

function refresh(onMount: () => void, message = ""): void {
  feedback = message;
  onMount();
  if (message) window.setTimeout(() => { feedback = ""; }, 2600);
}

function restoreSubscriptionModalBackground(): void {
  if (!subscriptionModalBackgroundLocked) return;
  document.querySelectorAll<HTMLElement>("[data-subscription-service-page] > :not([data-sub-modal-backdrop])").forEach((element) => { element.inert = false; });
  document.body.style.overflow = previousBodyOverflow;
  subscriptionModalBackgroundLocked = false;
}

function closeSubscriptionModal(onMount: () => void): void {
  if (modalState?.kind === "create-subscription" && createSubscriptionSubmitting) return;
  const restoreFocus = modalState?.kind === "create-subscription";
  modalState = null;
  createSubscriptionDraft = null;
  createSubscriptionError = "";
  createSubscriptionSubmitting = false;
  restoreSubscriptionModalBackground();
  refresh(onMount);
  if (restoreFocus) queueMicrotask(() => document.querySelector<HTMLButtonElement>("[data-sub-open-create]")?.focus());
}

function bindSubscriptionDialogKeyboard(): void {
  if (subscriptionDialogKeydownBound) return;
  subscriptionDialogKeydownBound = true;
  document.addEventListener("keydown", (event) => {
    if (!modalState || !activeSubscriptionMount) return;
    if (event.key === "Escape") { if (!createSubscriptionSubmitting) { event.preventDefault(); closeSubscriptionModal(activeSubscriptionMount); } return; }
    if (event.key !== "Tab") return;
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    if (!dialog) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>("button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
    if (!focusable.length) return;
    const first = focusable[0]!; const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

export function bindSubscriptionServicePage(onMount: () => void): void {
  activeSubscriptionMount = onMount;
  bindSubscriptionDialogKeyboard();
  void ensurePublishedSubscriptionMenuTree().then((changed) => { if (changed) onMount(); });
  if (isSubscriptionServiceCreatePath(location.hash.slice(1))) {
    bindSubscriptionServiceCreateWizard(onMount);
    return;
  }
  initializeSubscriptionMenuTreeIndeterminate();
  const createModalOpen = modalState?.kind === "create-subscription";
  document.querySelectorAll<HTMLElement>("[data-subscription-service-page] > :not([data-sub-modal-backdrop])").forEach((element) => { element.inert = createModalOpen; });
  if (createModalOpen) {
    if (!subscriptionModalBackgroundLocked) { previousBodyOverflow = document.body.style.overflow; subscriptionModalBackgroundLocked = true; }
    document.body.style.overflow = "hidden";
    queueMicrotask(() => document.querySelector<HTMLSelectElement>("[data-sub-create-subscription] [name=subjectType]")?.focus());
  } else restoreSubscriptionModalBackground();
  document.querySelector<HTMLButtonElement>("[data-sub-open-create]")?.addEventListener("click", () => { resetCreateSubscriptionDraft(); modalState = { kind: "create-subscription" }; refresh(onMount); });
  document.querySelector<HTMLElement>("[data-sub-modal-backdrop]")?.addEventListener("click", (event) => { if (event.target === event.currentTarget) closeSubscriptionModal(onMount); });
  document.querySelectorAll<HTMLButtonElement>("[data-sub-modal-close]").forEach((button) => button.addEventListener("click", () => closeSubscriptionModal(onMount)));
  document.querySelector<HTMLInputElement>("[data-sub-route-search]")?.addEventListener("input", (event) => { routeSearch = (event.currentTarget as HTMLInputElement).value; refresh(onMount); });
  document.querySelector<HTMLFormElement>("[data-sub-package-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement; const packageId = form.dataset.packageId!; const data = new FormData(form); const current = getOrCreatePackageDraft(packageId);
    try { savePackageDraft({ ...current, revision: Number(form.dataset.revision), name: String(data.get("name") ?? ""), description: String(data.get("description") ?? ""), priceMinor: Math.round(Number(data.get("price") ?? 0) * 100), billingInterval: String(data.get("billingInterval") ?? "month") as BillingInterval }); refresh(onMount, "草稿已保存，尚未影响商家"); } catch (error) { refresh(onMount, error instanceof Error ? error.message : "保存失败"); }
  });
  document.querySelectorAll<HTMLInputElement>("[data-sub-tree-select-ids]").forEach((input) => input.addEventListener("change", () => {
    const form = document.querySelector<HTMLFormElement>("[data-sub-package-form]"); if (!form) return; const draft = getOrCreatePackageDraft(form.dataset.packageId!); const selected = new Set(draft.routeNodeIds); const toggle = readSubscriptionMenuTreeToggle(input); toggle.routeNodeIds.forEach((id) => toggle.checked ? selected.add(id) : selected.delete(id)); draft.routeNodeIds = [...selected]; try { savePackageDraft({ ...draft, revision: Number(form.dataset.revision) }); refresh(onMount); } catch (error) { refresh(onMount, error instanceof Error ? error.message : "更新失败"); }
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-sub-publish]").forEach((button) => button.addEventListener("click", () => { modalState = { kind: "publish", packageId: button.dataset.packageId!, revision: Number(button.dataset.revision) }; refresh(onMount); }));
  document.querySelector<HTMLButtonElement>("[data-sub-confirm-publish]")?.addEventListener("click", (event) => { const button = event.currentTarget as HTMLButtonElement; try { const release = publishServicePackage(button.dataset.packageId!, Number(button.dataset.revision)); modalState = null; refresh(onMount, `已发布 v${release.version}，所有有效订阅已更新`); } catch (error) { modalState = null; refresh(onMount, error instanceof Error ? error.message : "发布失败"); } });
  document.querySelectorAll<HTMLButtonElement>("[data-sub-disable-package]").forEach((button) => button.addEventListener("click", () => { modalState = { kind: "disable-package", packageId: button.dataset.packageId! }; refresh(onMount); }));
  document.querySelectorAll<HTMLButtonElement>("[data-sub-rollback]").forEach((button) => button.addEventListener("click", () => { try { rollbackServicePackage(button.dataset.packageId!, button.dataset.releaseId!); refresh(onMount, "已统一回滚到所选版本"); } catch (error) { refresh(onMount, error instanceof Error ? error.message : "回滚失败"); } }));
  document.querySelector<HTMLSelectElement>("[data-sub-subject-type]")?.addEventListener("change", (event) => { syncCreateSubscriptionDraft(); subscriptionType = (event.currentTarget as HTMLSelectElement).value as SubscriptionSubjectType; if (createSubscriptionDraft) createSubscriptionDraft.subjectId = subjectOptions(subscriptionType)[0]?.id ?? ""; createSubscriptionError = ""; refresh(onMount); });
  document.querySelector<HTMLFormElement>("[data-sub-create-subscription]")?.addEventListener("input", () => { if (createSubscriptionError) { createSubscriptionError = ""; document.querySelector("[data-sub-create-error]")?.remove(); } });
  document.querySelector<HTMLFormElement>("[data-sub-create-subscription]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (createSubscriptionSubmitting) return;
    syncCreateSubscriptionDraft();
    if (!createSubscriptionDraft) return;
    createSubscriptionSubmitting = true;
    createSubscriptionError = "";
    const draft = createSubscriptionDraft;
    try {
      createMerchantSubscription({ subjectType: subscriptionType, subjectId: draft.subjectId, packageId: draft.packageId, startAt: new Date(`${draft.startAt}T00:00:00`).toISOString(), endAt: draft.endAt ? new Date(`${draft.endAt}T00:00:00`).toISOString() : undefined, note: draft.note });
      modalState = null; createSubscriptionDraft = null; createSubscriptionSubmitting = false; restoreSubscriptionModalBackground(); refresh(onMount, "服务已开通，菜单能力立即按层级继承"); queueMicrotask(() => document.querySelector<HTMLButtonElement>("[data-sub-open-create]")?.focus());
    } catch (error) { createSubscriptionSubmitting = false; createSubscriptionError = error instanceof Error ? error.message : "开通失败"; refresh(onMount); }
  });
  document.querySelectorAll<HTMLButtonElement>("[data-sub-extend]").forEach((button) => button.addEventListener("click", () => { modalState = { kind: "extend-subscription", subscriptionId: button.dataset.subscriptionId! }; refresh(onMount); }));
  document.querySelector<HTMLFormElement>("[data-sub-extend-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form); try { const raw = String(data.get("endAt") ?? ""); extendMerchantSubscription(form.dataset.subscriptionId!, raw ? new Date(`${raw}T00:00:00`).toISOString() : undefined); modalState = null; refresh(onMount, "订阅有效期已更新"); } catch (error) { refresh(onMount, error instanceof Error ? error.message : "续期失败"); } });
  document.querySelectorAll<HTMLButtonElement>("[data-sub-disable]").forEach((button) => button.addEventListener("click", () => { modalState = { kind: "disable-subscription", subscriptionId: button.dataset.subscriptionId! }; refresh(onMount); }));
  document.querySelector<HTMLFormElement>("[data-sub-disable-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const objectId = form.dataset.objectId!; try { if (form.dataset.kind === "package") disableServicePackage(objectId); else disableMerchantSubscription(objectId, String(new FormData(form).get("reason") ?? "")); modalState = null; refresh(onMount, "已停用并刷新相关菜单能力"); } catch (error) { refresh(onMount, error instanceof Error ? error.message : "停用失败"); } });
}

export function getSubscriptionCapabilitySummary(context: { groupId?: string; brandId?: string; storeId?: string }): { routeCount: number; packageCount: number; sources: ReturnType<typeof resolveEffectiveRouteSources> } {
  const snapshot = readSubscriptionServiceSnapshot();
  const sources = resolveEffectiveRouteSources(snapshot, context);
  return { routeCount: new Set(sources.map((item) => item.routeNodeId)).size, packageCount: new Set(sources.map((item) => item.packageId)).size, sources };
}
