import {lifecycleActions,lifecycleBadges,bindLifecycleActions} from './service-package-lifecycle-ui';
import {packageOnSale} from './service-package-lifecycle-domain';
import {openSubscriptionSubjectInfo} from './subscription-subject-info';
import {renderListFilters,bindListFilters,matchesPackage,matchesSubscription,subscriptionRemaining,subscriptionMethod,subscriptionBrand,packageCharge} from './subscription-list-filters';
import {packageSubscriptionSubjects,openPackageSubjects} from './service-package-subject-preview';
import {subscriptionAgreedPrice} from './subscription-agreed-price';
import {openServiceMenuPreview} from './service-entitlement-menu-preview';
import {renderServicePackageEditor,bindServicePackageEditor} from './service-package-detail-editor';
import {openSubscriptionBrandRights,renderSubscriptionBrandRightsPage,bindSubscriptionBrandRightsPage,restoreSubscriptionListScroll} from './subscription-brand-rights-page';
import {parseSubscriptionBrandRightsPath} from './subscription-service-scope';
import { getMerchantById, getMerchantStores, getMerchants, getStoreById } from "./enterprise-merchant-store";
import { resolveEffectiveRouteSources, subscriptionStatusLabel, type BillingInterval, type SubscriptionSubjectType } from "./subscription-service-domain";
import { buildSubscriptionImpactPreview, subscriptionOperationPolicy, type SubscriptionImpactPreview } from "./subscription-operations-domain";
import { bindSubscriptionMoreMenus, renderImpactCards, renderPackageStateBadge, renderSubscriptionRowOperations } from "./subscription-operations-ui";
import { SUBSCRIPTION_SERVICE_CREATE_PATH, SUBSCRIPTION_SERVICE_ROUTE_PREFIX, isMerchantSubscriptionsPath, isSubscriptionServiceCreatePath, isSubscriptionServicePath } from "./subscription-service-scope";
import { bindSubscriptionServiceCreateWizard, consumeSubscriptionWizardFeedback, renderSubscriptionServiceCreateWizard } from "./subscription-service-create-wizard-ui";
import { ensurePublishedSubscriptionMenuTree, getPublishedSubscriptionMenuTree } from "./subscription-published-menu-tree";
import { initializeSubscriptionMenuTreeIndeterminate } from "./subscription-menu-tree-ui";
import {
  createMerchantSubscription,
  createMerchantSubscriptionFromExisting,
  activateMerchantSubscriptionNow,
  adjustMerchantSubscriptionEnd,
  cancelScheduledMerchantSubscription,
  disableMerchantSubscription,
  disableServicePackage,
  extendMerchantSubscription,
  getSubscriptionAuditEntries,
  readSubscriptionServiceSnapshot,
  updateScheduledMerchantSubscription,
} from "./subscription-service-store";

type ModalState =
  | { kind: "create-subscription" }
  | { kind: "publish"; packageId: string; revision: number }
  | { kind: "disable-package"; packageId: string }
  | { kind: "extend-subscription"; subscriptionId: string }
  | { kind: "disable-subscription"; subscriptionId: string }
  | { kind: "edit-subscription"; subscriptionId: string }
  | { kind: "activate-subscription"; subscriptionId: string }
  | { kind: "adjust-subscription"; subscriptionId: string }
  | { kind: "cancel-subscription"; subscriptionId: string }
  | { kind: "reopen-subscription"; subscriptionId: string }
  | { kind: "subscription-detail"; subscriptionId: string }
  | { kind: "subscription-audit"; subscriptionId: string }
  | null;

let modalState: ModalState = null;
let feedback = "";
let subscriptionType: SubscriptionSubjectType = "brand";
let createSubscriptionDraft: { subjectId: string; packageId: string; startAt: string; endAt: string; note: string } | null = null;
let createSubscriptionError = "";
let createSubscriptionSubmitting = false;
let subscriptionDialogKeydownBound = false;
let activeSubscriptionMount: (() => void) | null = null;
let previousBodyOverflow = "";
let subscriptionModalBackgroundLocked = false;
let activeImpactPreview: SubscriptionImpactPreview | null = null;
let operationReason = "";

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
        <div><h2 class="text-2xl font-semibold tracking-tight text-card-foreground">${esc(title)}</h2>${description ? `<p class="mt-1 max-w-3xl text-sm text-muted-foreground">${esc(description)}</p>` : ""}</div>
        ${action ? `<div class="flex flex-wrap items-center gap-2">${action}</div>` : ""}
      </div>
      ${feedback ? `<div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800" role="status">${esc(feedback)}</div>` : ""}
    </div>`;
}

function renderPackageList(): string {
  feedback = consumeSubscriptionWizardFeedback() || feedback;
  const snapshot = readSubscriptionServiceSnapshot();
  const catalogCount = getPublishedSubscriptionMenuTree()?.selectableNodeCount ?? 0;
  const rows = snapshot.packages.filter(pkg=>matchesPackage(pkg)).map((pkg) => {
    const release = snapshot.releases.find((item) => item.id === pkg.activeReleaseId);
    const subscribers = packageSubscriptionSubjects(snapshot,pkg.id).length;
    return `<tr class="border-b border-border/70 last:border-0 hover:bg-muted/30">
      <td class="px-5 py-4"><div class="font-semibold text-foreground">${esc(pkg.name)}</div></td>
      <td class="px-4 py-4 text-sm">${packageCharge(pkg)==='free'?'免费':'收费'}</td><td class="px-4 py-4"><div class="font-semibold">${packageCharge(pkg)==='free'?'免费':money(pkg.priceMinor, pkg.currency)}</div>${packageCharge(pkg)==='free'?'':`<div class="text-xs text-muted-foreground">/${pkg.commercial?.billingUnit==='store'?'门店':pkg.commercial?.billingUnit==='brand'?'品牌':'单位未记录'}/${intervalLabel(pkg.billingInterval)}</div>`}</td><td class="px-4 py-4 text-sm">${pkg.commercial?.trialEnabled?`可试用${pkg.commercial.trialDays}天`:'不支持试用'}</td>
      <td class="px-4 py-4 text-sm"><button type="button" data-ent-menu="${esc(pkg.id)}" aria-haspopup="dialog" aria-label="${esc(pkg.name)}菜单能力" class="text-primary hover:underline focus-visible:outline focus-visible:outline-2"><span class="font-semibold">${release?.routeNodeIds.length ?? 0}</span> / ${catalogCount} 个菜单</button></td>
      <td class="px-4 py-4 text-sm"><button type="button" data-package-subjects-open="${esc(pkg.id)}" aria-haspopup="dialog" aria-label="${esc(pkg.name)}订阅主体" class="text-primary hover:underline focus-visible:outline focus-visible:outline-2"><span class="font-semibold">${subscribers}</span> 个主体</button></td>
      <td class="px-4 py-4">${lifecycleBadges(pkg)}</td><td class="px-4 py-4 text-xs whitespace-nowrap">${esc(Number.isFinite(Date.parse(pkg.updatedAt))?new Date(pkg.updatedAt).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'—')}</td>
      <td class="px-5 py-4 text-right"><a href="#${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}/${encodeURIComponent(pkg.id)}" class="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:bg-muted">编辑与版本</a> ${lifecycleActions(pkg)}</td>
    </tr>`;
  }).join("");
  return `${renderHeader("服务包管理", "", `<a href="#${SUBSCRIPTION_SERVICE_CREATE_PATH}" class="inline-flex h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">＋ 创建服务包</a>`)}
    <div class="min-h-0 flex-1 overflow-auto bg-muted/20 p-5 lg:p-7">
      <div class="mx-auto max-w-[100rem]">${renderListFilters('packages',snapshot.packages)}<div class="overflow-auto rounded-2xl border border-border bg-card shadow-sm">
        <div class="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 class="font-semibold">服务包目录</h3></div><div class="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">${snapshot.packages.length} 个服务包</div></div>
        <table class="w-full min-w-[1200px] text-left"><thead class="bg-muted/50 text-xs text-muted-foreground"><tr><th class="px-5 py-3 font-medium">服务包</th><th class="px-4 py-3 font-medium">收费类型</th><th class="px-4 py-3 font-medium">标准价格</th><th class="px-4 py-3 font-medium">试用政策</th><th class="px-4 py-3 font-medium">菜单能力</th><th class="px-4 py-3 font-medium">订阅主体</th><th class="px-4 py-3 font-medium">发布状态</th><th class="px-4 py-3 font-medium">更新时间</th><th class="px-5 py-3">操作</th></tr></thead><tbody>${rows || `<tr><td colspan="9" class="p-12 text-center text-sm text-muted-foreground">没有符合条件的服务包</td></tr>`}</tbody></table>
      </div>
    </div></div>${renderModal()}</section>`;
}

function renderPackageDetail(packageId:string):string {return renderServicePackageEditor(packageId)||renderHeader('服务包不存在','未找到服务包。');}

function subjectOptions(type: SubscriptionSubjectType): Array<{ id: string; label: string }> {
  if (type === "brand") return getMerchants({ allEnterprises: true }).filter((item) => item.status !== "closed").map((item) => ({ id: item.merchantId, label: `${item.name} · ${item.code}` }));
  return getMerchants({ allEnterprises: true }).flatMap((merchant) => getMerchantStores(merchant.merchantId).map((store) => ({ id: store.storeId, label: `${store.name} · ${merchant.name}` })));
}

function subjectTypeLabel(type: unknown): "品牌" | "门店" | "未知" {
  if (type === "brand") return "品牌";
  if (type === "store") return "门店";
  return "未知";
}

function subjectLabel(type: unknown, id: string): string {
  if (type === "brand") return getMerchantById(id)?.name ?? id;
  if (type === "store") return getStoreById(id)?.name ?? id;
  return "未知主体";
}

function renderSubscriptions(): string {
  const snapshot = readSubscriptionServiceSnapshot();
  const publishedPackages = snapshot.packages.filter((item) => packageOnSale(item));
  const rows = snapshot.subscriptions.filter(s=>matchesSubscription(s,snapshot.packages.find(p=>p.id===s.packageId))).map((subscription) => {
    const pkg = snapshot.packages.find(item=>item.id===subscription.packageId);
    const rawStatus=subscriptionStatusLabel(subscription,pkg?.status),status=subscription.entitlementKind==='trial'&&rawStatus==='已到期'?'试用已结束':rawStatus;
    const label=subjectLabel(subscription.subjectType,subscription.subjectId),typeLabel=subjectTypeLabel(subscription.subjectType);
    const publicId=subscription.subjectType==='brand'?(getMerchantById(subscription.subjectId)?.bid??subscription.subjectId):subscription.subjectId;
    const formatDate=(value?:string)=>{if(!value)return '长期';const at=new Date(value);return Number.isFinite(at.getTime())?at.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'—';};
    const source=subscriptionMethod(subscription);
    const packageName=pkg?`<button type="button" data-ent-menu="${esc(pkg.id)}" aria-haspopup="dialog" class="text-left font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">${esc(pkg.name)}</button>`:'未知服务包';
    const agreed=subscriptionAgreedPrice(subscription);
    const policy=subscriptionOperationPolicy(snapshot,subscription);
    const actions=renderSubscriptionRowOperations(snapshot,subscription);
    return `<tr class="border-b border-border/70 last:border-0 hover:bg-muted/30" data-subscription-row="${esc(subscription.id)}"><td class="px-4 py-4 text-sm"><button type="button" data-subject-info="${esc(subscription.subjectId)}" data-subject-type="${esc(subscription.subjectType)}" aria-haspopup="dialog" class="text-left font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">${esc(label)}</button>${subscription.subjectType==='store'?`<div class="mt-1 text-xs text-muted-foreground">${esc(subscriptionBrand(subscription)?.name??'所属品牌未记录')}</div>`:''}<div class="mt-1 font-mono text-[11px] text-muted-foreground">${esc(publicId)}</div></td><td class="px-4 py-4"><span class="inline-flex rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold">${typeLabel}</span></td><td class="px-4 py-4 text-sm">${packageName}</td><td class="px-4 py-4 text-sm whitespace-nowrap" data-subscription-method>${source}</td><td class="px-4 py-4 text-sm whitespace-nowrap" data-subscription-price><div>${esc(agreed.amount)}</div>${agreed.basis?`<div class="mt-1 text-xs text-muted-foreground">${esc(agreed.basis)}</div>`:""}</td><td class="px-4 py-4 text-xs leading-5 whitespace-nowrap"><div>${esc(formatDate(subscription.startAt))}</div><div class="text-muted-foreground">至 ${esc(formatDate(subscription.endAt))}</div></td><td class="px-4 py-4 text-sm whitespace-nowrap" data-subscription-remaining>${esc(subscriptionRemaining(subscription,pkg))}</td><td class="px-4 py-4" data-subscription-status>${statusBadge(status)}${renderPackageStateBadge(policy.packageState)}</td><td class="px-4 py-4 text-right"><div class="flex items-center justify-end gap-2 whitespace-nowrap">${actions}</div></td></tr>`;
  }).join('');
  return `${renderHeader("商家订阅", "", `<button type="button" data-sub-open-create class="inline-flex h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">＋ 新增商家</button>`)}
    <div class="min-h-0 flex-1 overflow-auto bg-muted/20 p-5 lg:p-7"><div class="mx-auto max-w-[100rem]">${renderListFilters('subscriptions',snapshot.packages)}<div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><div><h3 class="font-semibold">订阅明细</h3></div><div class="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">品牌 / 门店</div></div><div class="overflow-auto"><table class="w-full min-w-[1120px] text-left"><thead class="bg-muted/50 text-xs text-muted-foreground"><tr><th class="px-4 py-3 font-medium">主体</th><th class="px-4 py-3 font-medium">主体类型</th><th class="px-4 py-3 font-medium">服务包</th><th class="px-4 py-3 font-medium">开通方式</th><th class="px-4 py-3 font-medium">成交单价</th><th class="px-4 py-3 font-medium">有效期</th><th class="px-4 py-3 font-medium">剩余天数</th><th class="px-4 py-3 font-medium">订阅状态</th><th class="px-4 py-3 text-right font-medium">操作</th></tr></thead><tbody>${rows || `<tr><td colspan="9" class="p-12 text-center text-sm text-muted-foreground">没有符合条件的订阅记录</td></tr>`}</tbody></table></div></div></div></div>${renderModal()}</section>`;
}

function resetCreateSubscriptionDraft(): void {
  subscriptionType = "brand";
  const subjects = subjectOptions(subscriptionType);
  const firstPackage = readSubscriptionServiceSnapshot().packages.find((item) => packageOnSale(item));
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
    publishedPackages = readSubscriptionServiceSnapshot().packages.filter((item) => packageOnSale(item));
  } catch (error) { readError = error instanceof Error ? error.message : "读取开通数据失败，请关闭后重试"; }
  const disabled = createSubscriptionSubmitting || Boolean(readError) || !options.length || !publishedPackages.length;
  return `<div class="fixed inset-0 z-[190] grid place-items-center bg-slate-950/45 p-4" data-sub-modal-backdrop role="presentation"><form data-sub-create-subscription role="dialog" aria-modal="true" aria-labelledby="create-subscription-title" class="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"><div class="flex items-start justify-between gap-4"><div><p class="text-[11px] font-bold uppercase tracking-[.16em] text-emerald-700">MANUAL ENTITLEMENT</p><h3 id="create-subscription-title" class="mt-1 text-xl font-semibold">开通服务</h3><p class="mt-1 text-xs leading-5 text-muted-foreground">选择品牌或门店及需要开通的服务包。</p></div><button type="button" data-sub-modal-close ${createSubscriptionSubmitting ? "disabled" : ""} class="grid size-9 place-items-center rounded-lg border border-border text-lg hover:bg-muted disabled:opacity-40" aria-label="关闭开通服务弹窗">×</button></div>${createSubscriptionError || readError ? `<div data-sub-create-error class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert" aria-live="assertive">${esc(createSubscriptionError || readError)}</div>` : ""}<label class="mt-5 block text-xs font-semibold text-muted-foreground">主体层级<select name="subjectType" data-sub-subject-type autofocus class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"><option value="brand" ${subscriptionType === "brand" ? "selected" : ""}>品牌</option><option value="store" ${subscriptionType === "store" ? "selected" : ""}>门店</option></select></label><label class="mt-4 block text-xs font-semibold text-muted-foreground">开通主体<select name="subjectId" required class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">${options.map((item) => `<option value="${esc(item.id)}" ${draft.subjectId === item.id ? "selected" : ""}>${esc(item.label)}</option>`).join("")}</select>${options.length ? "" : `<span class="mt-1 block text-xs text-amber-700">暂无可选主体</span>`}</label><label class="mt-4 block text-xs font-semibold text-muted-foreground">服务包<select name="packageId" required class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">${publishedPackages.map((pkg) => `<option value="${esc(pkg.id)}" ${draft.packageId === pkg.id ? "selected" : ""}>${esc(pkg.name)} · ${money(pkg.priceMinor, pkg.currency)}/${intervalLabel(pkg.billingInterval)}</option>`).join("")}</select>${publishedPackages.length ? "" : `<span class="mt-1 block text-xs text-amber-700">暂无已发布服务包</span>`}</label><div class="mt-4 grid grid-cols-2 gap-3"><label class="text-xs font-semibold text-muted-foreground">生效日期<input name="startAt" type="date" required value="${esc(draft.startAt)}" class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"></label><label class="text-xs font-semibold text-muted-foreground">到期日期<input name="endAt" type="date" value="${esc(draft.endAt)}" class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"></label></div><label class="mt-4 block text-xs font-semibold text-muted-foreground">备注<textarea name="note" rows="3" class="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="合同号、开通原因等">${esc(draft.note)}</textarea></label><div class="mt-6 flex justify-end gap-2"><button type="button" data-sub-modal-close ${createSubscriptionSubmitting ? "disabled" : ""} class="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-40">取消</button><button type="submit" ${disabled ? "disabled" : ""} class="h-10 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">${createSubscriptionSubmitting ? "开通中…" : "确认开通"}</button></div></form></div>`;
}

function renderModal(): string {
  if (!modalState) return "";
  const modal = modalState;
  if (modal.kind === "create-subscription") return renderCreateSubscriptionModal();
  const snapshot = readSubscriptionServiceSnapshot();
  if ("subscriptionId" in modal) {
    const subscription = snapshot.subscriptions.find((item) => item.id === modal.subscriptionId);
    const pkg = snapshot.packages.find((item) => item.id === subscription?.packageId);
    if (!subscription) return `<div class="fixed inset-0 z-[190] grid place-items-center bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" class="w-full max-w-md rounded-2xl bg-card p-6"><h3 class="text-lg font-semibold">订阅不存在</h3><button type="button" data-sub-modal-close class="mt-5 h-10 rounded-lg border border-border px-4">关闭</button></div></div>`;
    const dateValue = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().slice(0, 10) : "";
    const close = `<button type="button" data-sub-modal-close class="h-10 rounded-lg border border-border px-4 text-sm font-semibold">取消</button>`;
    if (modal.kind === "subscription-detail") return `<div class="fixed inset-0 z-[190] flex justify-end bg-slate-950/35"><aside role="dialog" aria-modal="true" aria-labelledby="subscription-detail-title" class="h-full w-full max-w-xl overflow-auto bg-card p-6 shadow-2xl"><div class="flex items-start justify-between"><div><p class="text-xs font-bold text-emerald-700">SUBSCRIPTION DETAIL</p><h3 id="subscription-detail-title" class="mt-1 text-xl font-semibold">订阅详情</h3></div><button type="button" data-sub-modal-close aria-label="关闭">×</button></div><dl class="mt-6 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-4 text-sm"><dt class="text-muted-foreground">主体</dt><dd>${esc(subjectLabel(subscription.subjectType,subscription.subjectId))}（${subjectTypeLabel(subscription.subjectType)}）</dd><dt class="text-muted-foreground">服务包</dt><dd>${esc(pkg?.name??'服务包缺失')}</dd><dt class="text-muted-foreground">有效期</dt><dd>${esc(new Date(subscription.startAt).toLocaleString('zh-CN'))} 至 ${esc(subscription.endAt?new Date(subscription.endAt).toLocaleString('zh-CN'):'长期')}</dd><dt class="text-muted-foreground">备注</dt><dd>${esc(subscription.note||'—')}</dd><dt class="text-muted-foreground">停用／撤销原因</dt><dd>${esc(subscription.disableReason||subscription.cancelReason||'—')}</dd><dt class="text-muted-foreground">创建信息</dt><dd>${esc(subscription.createdBy)} · ${esc(new Date(subscription.createdAt).toLocaleString('zh-CN'))}</dd></dl><div class="mt-8 flex justify-end">${close}</div></aside></div>`;
    if (modal.kind === "subscription-audit") {
      const entries=getSubscriptionAuditEntries(subscription.id);
      return `<div class="fixed inset-0 z-[190] flex justify-end bg-slate-950/35"><aside role="dialog" aria-modal="true" aria-labelledby="subscription-audit-title" class="h-full w-full max-w-xl overflow-auto bg-card p-6 shadow-2xl"><div class="flex items-start justify-between"><div><p class="text-xs font-bold text-emerald-700">AUDIT LOG</p><h3 id="subscription-audit-title" class="mt-1 text-xl font-semibold">操作记录</h3></div><button type="button" data-sub-modal-close aria-label="关闭">×</button></div><ol class="mt-6 space-y-3">${entries.map(entry=>`<li class="rounded-xl border border-border p-4"><div class="flex justify-between gap-3"><strong class="text-sm">${esc(entry.action)}</strong><time class="text-xs text-muted-foreground">${esc(new Date(entry.at).toLocaleString('zh-CN'))}</time></div><p class="mt-2 text-sm">${esc(entry.detail)}</p><p class="mt-1 text-xs text-muted-foreground">${esc(entry.actor)}</p></li>`).join('')||'<li class="text-sm text-muted-foreground">暂无操作记录</li>'}</ol><div class="mt-8 flex justify-end">${close}</div></aside></div>`;
    }
    if (modal.kind === "edit-subscription") {
      const policy=subscriptionOperationPolicy(snapshot,subscription),limited=policy.limitedEdit;
      const packageOptions=snapshot.packages.filter(item=>packageOnSale(item)||item.id===subscription.packageId);
      return `<div class="fixed inset-0 z-[190] flex justify-end bg-slate-950/35"><form data-sub-edit-form data-subscription-id="${esc(subscription.id)}" role="dialog" aria-modal="true" aria-labelledby="subscription-edit-title" class="h-full w-full max-w-2xl overflow-auto bg-card p-6 shadow-2xl"><p class="text-xs font-bold text-emerald-700">SCHEDULED SUBSCRIPTION</p><h3 id="subscription-edit-title" class="mt-1 text-xl font-semibold">编辑待生效订阅</h3>${limited?'<p class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">服务包已下架，只能修改到期时间和备注；其他成交承诺已锁定。</p>':''}<div class="mt-6 grid grid-cols-2 gap-4"><label class="text-xs font-semibold">主体类型<select name="subjectType" ${limited?'disabled':''} class="mt-2 h-10 w-full rounded-lg border border-border px-3"><option value="brand" ${subscription.subjectType==='brand'?'selected':''}>品牌</option><option value="store" ${subscription.subjectType==='store'?'selected':''}>门店</option></select></label><label class="text-xs font-semibold">主体 ID<input name="subjectId" value="${esc(subscription.subjectId)}" ${limited?'readonly':''} class="mt-2 h-10 w-full rounded-lg border border-border px-3"></label><label class="text-xs font-semibold">服务包<select name="packageId" ${limited?'disabled':''} class="mt-2 h-10 w-full rounded-lg border border-border px-3">${packageOptions.map(item=>`<option value="${esc(item.id)}" ${item.id===subscription.packageId?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label><label class="text-xs font-semibold">生效日期<input name="startAt" type="date" value="${dateValue(subscription.startAt)}" ${limited?'readonly':''} class="mt-2 h-10 w-full rounded-lg border border-border px-3"></label><label class="text-xs font-semibold">到期日期<input name="endAt" type="date" value="${dateValue(subscription.endAt)}" class="mt-2 h-10 w-full rounded-lg border border-border px-3"></label><label class="col-span-2 text-xs font-semibold">备注<textarea name="note" maxlength="500" class="mt-2 w-full rounded-lg border border-border p-3">${esc(subscription.note)}</textarea></label></div><div class="mt-6 flex justify-end gap-2">${close}<button type="submit" class="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white">保存</button></div></form></div>`;
    }
    if (modal.kind === "reopen-subscription") return `<div class="fixed inset-0 z-[190] grid place-items-center bg-slate-950/45 p-4"><form data-sub-reopen-form data-subscription-id="${esc(subscription.id)}" role="dialog" aria-modal="true" aria-labelledby="subscription-reopen-title" class="w-full max-w-md rounded-2xl bg-card p-6"><h3 id="subscription-reopen-title" class="text-xl font-semibold">重新开通</h3><p class="mt-2 text-sm text-muted-foreground">将创建新的订阅记录，原记录和审计永久保留。</p><label class="mt-5 block text-xs font-semibold">生效日期<input name="startAt" required type="date" value="${new Date().toISOString().slice(0,10)}" class="mt-2 h-10 w-full rounded-lg border border-border px-3"></label><label class="mt-4 block text-xs font-semibold">到期日期<input name="endAt" type="date" class="mt-2 h-10 w-full rounded-lg border border-border px-3"></label><label class="mt-4 block text-xs font-semibold">备注<textarea name="note" class="mt-2 w-full rounded-lg border border-border p-3">${esc(subscription.note)}</textarea></label><div class="mt-6 flex justify-end gap-2">${close}<button type="submit" class="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white">创建新订阅</button></div></form></div>`;
    if (modal.kind === "adjust-subscription") return `<div class="fixed inset-0 z-[190] grid place-items-center bg-slate-950/45 p-4"><form data-sub-adjust-form data-subscription-id="${esc(subscription.id)}" role="dialog" aria-modal="true" aria-labelledby="subscription-adjust-title" class="w-full max-w-lg rounded-2xl bg-card p-6"><h3 id="subscription-adjust-title" class="text-xl font-semibold">调整到期时间</h3><p class="mt-2 text-sm text-muted-foreground">只能缩短到未来时间；需要填写原因并确认能力影响。</p><label class="mt-5 block text-xs font-semibold">新的到期日期<input name="endAt" required type="date" value="${dateValue(activeImpactPreview?.proposedEndAt)}" class="mt-2 h-10 w-full rounded-lg border border-border px-3"></label><label class="mt-4 block text-xs font-semibold">调整原因<textarea name="reason" required maxlength="200" class="mt-2 w-full rounded-lg border border-border p-3">${esc(operationReason)}</textarea></label>${activeImpactPreview?renderImpactCards(activeImpactPreview):'<p class="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">填写日期和原因后先预览影响。</p>'}<div class="mt-6 flex justify-end gap-2">${close}<button type="submit" class="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white">${activeImpactPreview?'确认调整':'预览影响'}</button></div></form></div>`;
    if (modal.kind === "activate-subscription" || modal.kind === "cancel-subscription" || modal.kind === "disable-subscription") {
      const title=modal.kind==='activate-subscription'?'立即生效':modal.kind==='cancel-subscription'?'撤销待生效订阅':'停用订阅';
      const needsReason=modal.kind!=='activate-subscription';
      return `<div class="fixed inset-0 z-[190] grid place-items-center bg-slate-950/45 p-4"><form data-sub-risk-form data-operation="${modal.kind}" data-subscription-id="${esc(subscription.id)}" role="dialog" aria-modal="true" aria-labelledby="subscription-risk-title" class="w-full max-w-lg rounded-2xl bg-card p-6"><h3 id="subscription-risk-title" class="text-xl font-semibold">${title}</h3><p class="mt-2 text-sm text-muted-foreground">${modal.kind==='cancel-subscription'?'记录不会删除，原定未来能力不会生效。':modal.kind==='disable-subscription'?'订阅将立即退出能力计算并永久保留审计。':'订阅将从当前时间开始参与能力计算。'}</p>${activeImpactPreview?renderImpactCards(activeImpactPreview):''}${needsReason?'<label class="mt-4 block text-xs font-semibold">原因<textarea name="reason" required maxlength="200" class="mt-2 w-full rounded-lg border border-border p-3"></textarea></label>':''}<div class="mt-6 flex justify-end gap-2">${close}<button type="submit" class="h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white">确认${title}</button></div></form></div>`;
    }
  }
  if (modal.kind === "publish") {
    const draft = snapshot.drafts.find((item) => item.packageId === modal.packageId);
    const pkg = snapshot.packages.find((item) => item.id === modal.packageId);
    const current = snapshot.releases.find((item) => item.id === pkg?.activeReleaseId);
    const added = draft?.routeNodeIds.filter((item) => !current?.routeNodeIds.includes(item)).length ?? 0;
    const removed = current?.routeNodeIds.filter((item) => !draft?.routeNodeIds.includes(item)).length ?? 0;
    const affected = snapshot.subscriptions.filter((item) => item.packageId === modal.packageId && !item.disabledAt).length;
    return `<div class="fixed inset-0 z-[180] grid place-items-center bg-slate-950/45 p-4"><div class="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"><p class="text-[11px] font-bold uppercase tracking-[.16em] text-emerald-700">PUBLISH IMPACT</p><h3 class="mt-1 text-xl font-semibold">确认发布「${esc(pkg?.name)}」</h3><div class="mt-5 grid grid-cols-3 gap-3"><div class="rounded-xl bg-emerald-50 p-4"><p class="text-2xl font-semibold text-emerald-800">+${added}</p><p class="text-xs text-emerald-700">新增菜单</p></div><div class="rounded-xl bg-rose-50 p-4"><p class="text-2xl font-semibold text-rose-800">-${removed}</p><p class="text-xs text-rose-700">移除菜单</p></div><div class="rounded-xl bg-slate-100 p-4"><p class="text-2xl font-semibold">${affected}</p><p class="text-xs text-slate-600">受影响主体</p></div></div><p class="mt-4 text-sm leading-6 text-muted-foreground">发布会刷新服务菜单能力。标准价与试用政策不覆盖已有成交价和试用期限；启用权益控制后，未开通品牌的相关菜单将显示锁定说明。</p><div class="mt-6 flex justify-end gap-2"><button type="button" data-sub-modal-close class="h-10 rounded-lg border border-border px-4 text-sm font-semibold">取消</button><button type="button" data-sub-confirm-publish data-package-id="${esc(modal.packageId)}" data-revision="${modal.revision}" class="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white">确认发布</button></div></div></div>`;
  }
  if (modal.kind === "extend-subscription") return `<div class="fixed inset-0 z-[180] grid place-items-center bg-slate-950/45 p-4"><form data-sub-extend-form data-subscription-id="${esc(modal.subscriptionId)}" class="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"><h3 class="text-xl font-semibold">续期订阅</h3><label class="mt-5 block text-xs font-semibold text-muted-foreground">新的到期日期<input name="endAt" type="date" class="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"></label><p class="mt-2 text-xs text-muted-foreground">留空表示长期有效。</p><div class="mt-6 flex justify-end gap-2"><button type="button" data-sub-modal-close class="h-10 rounded-lg border border-border px-4 text-sm font-semibold">取消</button><button type="submit" class="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white">确认续期</button></div></form></div>`;
  return `<div class="fixed inset-0 z-[180] grid place-items-center bg-slate-950/45 p-4"><form data-sub-disable-form data-kind="package" data-object-id="${esc(modal.packageId)}" class="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"><h3 class="text-xl font-semibold">确认停用</h3><p class="mt-2 text-sm leading-6 text-muted-foreground">所有有效和预约订阅将停止提供菜单能力，恢复后仍在有效期内的订阅会自动恢复。</p><div class="mt-6 flex justify-end gap-2"><button type="button" data-sub-modal-close class="h-10 rounded-lg border border-border px-4 text-sm font-semibold">取消</button><button type="submit" class="h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white">确认停用</button></div></form></div>`;
}

export function renderSubscriptionServicePage(path: string): string {
  if (isSubscriptionServiceCreatePath(path)) return renderSubscriptionServiceCreateWizard();
  const rightsBrand=parseSubscriptionBrandRightsPath(path);if(rightsBrand)return renderSubscriptionBrandRightsPage(rightsBrand);
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
  activeImpactPreview = null;
  operationReason = "";
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
  bindListFilters(onMount);
  bindLifecycleActions(document,onMount);
  document.querySelectorAll<HTMLButtonElement>("[data-subject-info]").forEach(button=>button.addEventListener("click",()=>openSubscriptionSubjectInfo(button.dataset.subjectType!,button.dataset.subjectInfo!)));
  bindSubscriptionDialogKeyboard();
  void ensurePublishedSubscriptionMenuTree().then((changed) => { if (changed) onMount(); });
  if (isSubscriptionServiceCreatePath(location.hash.slice(1))) {
    bindSubscriptionServiceCreateWizard(onMount);
    return;
  }
  if(document.querySelector('[data-subscription-brand-rights-page]')){bindSubscriptionBrandRightsPage();return;}
  restoreSubscriptionListScroll();
  if(document.querySelector('[data-spe-editor]')){bindServicePackageEditor(onMount);return;}
  document.querySelectorAll<HTMLButtonElement>("[data-ent-menu]").forEach(button=>button.addEventListener("click",()=>{void openServiceMenuPreview(button.dataset.entMenu!);}));
  document.querySelectorAll<HTMLButtonElement>("[data-sub-brand-rights]").forEach(button=>button.addEventListener("click",()=>openSubscriptionBrandRights(button.dataset.subBrandRights!)));
  document.querySelectorAll<HTMLButtonElement>("[data-package-subjects-open]").forEach(button=>button.addEventListener("click",()=>openPackageSubjects(button.dataset.packageSubjectsOpen!)));
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
  bindSubscriptionMoreMenus(document);
  document.querySelectorAll<HTMLButtonElement>("[data-sub-operation]").forEach((button) => button.addEventListener("click", () => {
    if(button.getAttribute("aria-disabled")==="true")return;
    const subscriptionId=button.dataset.subscriptionId!,operation=button.dataset.subOperation!;
    activeImpactPreview=null;operationReason="";
    const snapshot=readSubscriptionServiceSnapshot(),subscription=snapshot.subscriptions.find(item=>item.id===subscriptionId);
    if(!subscription)return;
    const inherited=subscription.subjectType==='brand'?getMerchantStores(subscription.subjectId).map(store=>store.storeId):[];
    if(operation==='activate'||operation==='disable'||operation==='cancel')activeImpactPreview=buildSubscriptionImpactPreview(snapshot,subscriptionId,operation==='activate'?'activate':operation==='disable'?'disable':'cancel',new Date(),undefined,inherited);
    const kind=({edit:'edit-subscription',activate:'activate-subscription',extend:'extend-subscription','adjust-end':'adjust-subscription',disable:'disable-subscription',cancel:'cancel-subscription',reopen:'reopen-subscription',detail:'subscription-detail',audit:'subscription-audit'} as const)[operation];
    if(kind){modalState={kind,subscriptionId} as ModalState;refresh(onMount);}
  }));
  document.querySelector<HTMLFormElement>("[data-sub-edit-form]")?.addEventListener("submit",event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement,data=new FormData(form),snapshot=readSubscriptionServiceSnapshot(),current=snapshot.subscriptions.find(item=>item.id===form.dataset.subscriptionId);if(!current)return;try{const iso=(name:string,fallback?:string)=>{const raw=String(data.get(name)??'');return raw?new Date(`${raw}T00:00:00`).toISOString():fallback;};updateScheduledMerchantSubscription({id:current.id,subjectType:String(data.get('subjectType')??current.subjectType) as SubscriptionSubjectType,subjectId:String(data.get('subjectId')??current.subjectId),packageId:String(data.get('packageId')??current.packageId),startAt:iso('startAt',current.startAt)!,endAt:iso('endAt'),note:String(data.get('note')??''),agreedPriceMinor:current.agreedPriceMinor,agreedCurrency:current.agreedCurrency,agreedBillingInterval:current.agreedBillingInterval});modalState=null;refresh(onMount,'待生效订阅已更新');}catch(error){refresh(onMount,error instanceof Error?error.message:'保存失败');}});
  document.querySelector<HTMLFormElement>("[data-sub-risk-form]")?.addEventListener("submit",event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement,data=new FormData(form),operation=form.dataset.operation!,reason=String(data.get('reason')??'');try{if(!activeImpactPreview)throw Error('影响预览已失效，请关闭后重试。');if(operation==='activate-subscription')activateMerchantSubscriptionNow(form.dataset.subscriptionId!,activeImpactPreview);else if(operation==='cancel-subscription')cancelScheduledMerchantSubscription(form.dataset.subscriptionId!,reason,activeImpactPreview);else disableMerchantSubscription(form.dataset.subscriptionId!,reason,activeImpactPreview);modalState=null;activeImpactPreview=null;refresh(onMount,operation==='activate-subscription'?'订阅已立即生效':operation==='cancel-subscription'?'订阅已撤销':'订阅已停用');}catch(error){refresh(onMount,error instanceof Error?error.message:'操作失败');}});
  document.querySelector<HTMLFormElement>("[data-sub-adjust-form]")?.addEventListener("submit",event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement,data=new FormData(form),raw=String(data.get('endAt')??''),endAt=raw?new Date(`${raw}T23:59:59`).toISOString():'',reason=String(data.get('reason')??'');try{if(!activeImpactPreview){const snapshot=readSubscriptionServiceSnapshot(),subscription=snapshot.subscriptions.find(item=>item.id===form.dataset.subscriptionId),inherited=subscription?.subjectType==='brand'?getMerchantStores(subscription.subjectId).map(store=>store.storeId):[];operationReason=reason;activeImpactPreview=buildSubscriptionImpactPreview(snapshot,form.dataset.subscriptionId!,'adjust-end',new Date(),endAt,inherited);refresh(onMount);return;}adjustMerchantSubscriptionEnd(form.dataset.subscriptionId!,endAt,reason,activeImpactPreview);modalState=null;activeImpactPreview=null;operationReason='';refresh(onMount,'到期时间已调整');}catch(error){refresh(onMount,error instanceof Error?error.message:'调整失败');}});
  document.querySelector<HTMLFormElement>("[data-sub-reopen-form]")?.addEventListener("submit",event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement,data=new FormData(form),date=(name:string)=>{const raw=String(data.get(name)??'');return raw?new Date(`${raw}T00:00:00`).toISOString():undefined;};try{createMerchantSubscriptionFromExisting(form.dataset.subscriptionId!,{startAt:date('startAt')!,endAt:date('endAt'),note:String(data.get('note')??'')});modalState=null;refresh(onMount,'已创建新的订阅记录');}catch(error){refresh(onMount,error instanceof Error?error.message:'重新开通失败');}});
  document.querySelectorAll<HTMLButtonElement>("[data-sub-extend]").forEach((button) => button.addEventListener("click", () => { modalState = { kind: "extend-subscription", subscriptionId: button.dataset.subscriptionId! }; refresh(onMount); }));
  document.querySelector<HTMLFormElement>("[data-sub-extend-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form); try { const raw = String(data.get("endAt") ?? ""); extendMerchantSubscription(form.dataset.subscriptionId!, raw ? new Date(`${raw}T00:00:00`).toISOString() : undefined); modalState = null; refresh(onMount, "订阅有效期已更新"); } catch (error) { refresh(onMount, error instanceof Error ? error.message : "续期失败"); } });
  document.querySelectorAll<HTMLButtonElement>("[data-sub-disable]").forEach((button) => button.addEventListener("click", () => { modalState = { kind: "disable-subscription", subscriptionId: button.dataset.subscriptionId! }; refresh(onMount); }));
  document.querySelector<HTMLFormElement>("[data-sub-disable-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; try { disableServicePackage(form.dataset.objectId!,String(new FormData(form).get("reason")??"")); modalState = null; refresh(onMount, "服务包已停用并刷新相关菜单能力"); } catch (error) { refresh(onMount, error instanceof Error ? error.message : "停用失败"); } });
}

export function getSubscriptionCapabilitySummary(context: { groupId?: string; brandId?: string; storeId?: string }): { routeCount: number; packageCount: number; sources: ReturnType<typeof resolveEffectiveRouteSources> } {
  const snapshot = readSubscriptionServiceSnapshot();
  const sources = resolveEffectiveRouteSources(snapshot, context);
  return { routeCount: new Set(sources.map((item) => item.routeNodeId)).size, packageCount: new Set(sources.map((item) => item.packageId)).size, sources };
}
