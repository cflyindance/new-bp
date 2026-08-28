import { type BillingInterval } from "./subscription-service-domain";
import { SUBSCRIPTION_SERVICE_CREATE_PATH, SUBSCRIPTION_SERVICE_ROUTE_PREFIX } from "./subscription-service-scope";
import { createServicePackageFromWizard, readSubscriptionServiceSnapshot } from "./subscription-service-store";
import { flattenSubscriptionMenuTree, getPublishedSubscriptionMenuTree } from "./subscription-published-menu-tree";
import { initializeSubscriptionMenuTreeIndeterminate, readSubscriptionMenuTreeToggle, renderSubscriptionMenuTree } from "./subscription-menu-tree-ui";

type WizardStep = 1 | 2 | 3;

interface WizardDraft {
  name: string;
  code: string;
  description: string;
  price: string;
  billingInterval: BillingInterval;
  routeNodeIds: string[];
}

const emptyDraft = (): WizardDraft => ({ name: "", code: "", description: "", price: "0", billingInterval: "month", routeNodeIds: [] });
let draft = emptyDraft();
let step: WizardStep = 1;
let search = "";
let errorMessage = "";
let showExitConfirm = false;
let submitting = false;
let historyGuardReady = false;
let navigationGuardBound = false;
let activeOnMount: (() => void) | null = null;

function esc(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hasChanges(): boolean {
  return Boolean(draft.name.trim() || draft.code.trim() || draft.description.trim() || draft.price !== "0" || draft.billingInterval !== "month" || draft.routeNodeIds.length);
}

function intervalLabel(value: BillingInterval): string {
  return ({ month: "月", quarter: "季度", year: "年", "one-time": "一次性" } as const)[value];
}

function money(): string {
  const value = Number(draft.price);
  return Number.isFinite(value) ? new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(value) : "—";
}

function renderSteps(): string {
  const items = ["产品定义", "菜单路由能力", "确认并保存"];
  return `<ol class="grid w-full max-w-3xl grid-cols-3" aria-label="创建服务包步骤">${items.map((label, index) => {
    const number = index + 1;
    const active = number === step;
    const complete = number < step;
    return `<li class="relative flex flex-col items-center text-center ${index ? "before:absolute before:right-1/2 before:top-4 before:h-px before:w-full before:bg-border" : ""}">
      <span class="relative z-10 grid size-8 place-items-center rounded-full border text-xs font-bold ${active ? "border-emerald-700 bg-emerald-700 text-white shadow-[0_0_0_5px_rgba(4,120,87,.12)]" : complete ? "border-emerald-700 bg-emerald-50 text-emerald-700" : "border-border bg-background text-muted-foreground"}">${complete ? "✓" : number}</span>
      <span class="mt-2 text-xs font-semibold ${active ? "text-foreground" : "text-muted-foreground"}">${label}</span>
    </li>`;
  }).join("")}</ol>`;
}

function renderProductStep(): string {
  return `<div class="mx-auto w-full max-w-4xl">
    <div class="mb-7"><p class="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">STEP 01</p><h2 class="mt-2 text-3xl font-semibold tracking-tight">定义服务产品</h2><p class="mt-2 text-sm text-muted-foreground">设置商家看到的名称、价格和计费方式，保存后仍可继续调整。</p></div>
    <form data-wizard-product-form class="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div class="grid gap-6 md:grid-cols-2">
        <label class="text-sm font-semibold">服务包名称<span class="ml-1 text-rose-600">*</span><input name="name" value="${esc(draft.name)}" maxlength="60" autofocus placeholder="例如：高级经营版" class="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"></label>
        <label class="text-sm font-semibold">唯一编码<span class="ml-1 text-rose-600">*</span><input name="code" value="${esc(draft.code)}" maxlength="40" placeholder="例如：PRO_299" class="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm uppercase outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"><span class="mt-1.5 block text-xs font-normal text-muted-foreground">保存时自动转换为大写，创建后不可重复。</span></label>
        <label class="text-sm font-semibold">展示价格（元）<input name="price" type="number" min="0" step="0.01" value="${esc(draft.price)}" class="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"></label>
        <label class="text-sm font-semibold">计费周期<select name="billingInterval" class="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-600">${(["month", "quarter", "year", "one-time"] as BillingInterval[]).map((value) => `<option value="${value}" ${draft.billingInterval === value ? "selected" : ""}>${intervalLabel(value)}</option>`).join("")}</select></label>
      </div>
      <label class="mt-6 block text-sm font-semibold">服务包说明<textarea name="description" rows="5" maxlength="300" placeholder="说明该服务包适合的业态和包含的核心能力" class="mt-2 w-full rounded-lg border border-border bg-background px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15">${esc(draft.description)}</textarea></label>
    </form>
  </div>`;
}

function renderRouteStep(): string {
  const tree = getPublishedSubscriptionMenuTree();
  const selected = new Set(draft.routeNodeIds);
  return `<div class="mx-auto w-full max-w-6xl"><div class="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p class="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">STEP 02</p><h2 class="mt-2 text-3xl font-semibold tracking-tight">选择菜单路由能力</h2><p class="mt-2 text-sm text-muted-foreground">服务包控制页面入口，页面内操作继续由角色权限控制。</p></div><div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><strong class="text-xl">${selected.size}</strong> 个菜单已选择</div></div>
    <div class="sticky top-0 z-10 mb-4 rounded-xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur"><input data-wizard-route-search value="${esc(search)}" placeholder="搜索菜单名称或路由路径" class="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-emerald-600"></div>
    ${renderSubscriptionMenuTree({ tree, selectedIds: draft.routeNodeIds, query: search })}</div>`;
}

function renderConfirmStep(): string {
  const tree = getPublishedSubscriptionMenuTree();
  const selected = new Set(draft.routeNodeIds);
  const modules = new Map<string, string[]>();
  for (const root of tree?.roots ?? []) {
    const names = flattenSubscriptionMenuTree([root]).filter((node) => node.selectable && selected.has(node.routeNodeId)).map((node) => node.title);
    if (names.length) modules.set(root.title, names);
  }
  return `<div class="mx-auto w-full max-w-5xl"><div class="mb-7"><p class="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">STEP 03</p><h2 class="mt-2 text-3xl font-semibold tracking-tight">确认服务包内容</h2><p class="mt-2 text-sm text-muted-foreground">确认后可保存为未发布草稿，或直接创建并发布 v1。</p></div>
    <div class="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <section class="rounded-2xl border border-border bg-card p-6 shadow-sm"><p class="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">产品定义</p><h3 class="mt-3 text-2xl font-semibold">${esc(draft.name)}</h3><p class="mt-1 font-mono text-xs text-muted-foreground">${esc(draft.code.trim().toUpperCase())}</p><div class="mt-6 grid grid-cols-2 gap-4"><div class="rounded-xl bg-muted/50 p-4"><p class="text-xs text-muted-foreground">展示价格</p><p class="mt-1 text-xl font-semibold">${esc(money())}</p></div><div class="rounded-xl bg-muted/50 p-4"><p class="text-xs text-muted-foreground">计费周期</p><p class="mt-1 text-xl font-semibold">${intervalLabel(draft.billingInterval)}</p></div></div><p class="mt-5 text-sm leading-6 text-muted-foreground">${esc(draft.description || "未填写服务包说明")}</p></section>
      <section class="rounded-2xl border border-border bg-card p-6 shadow-sm"><div class="flex items-center justify-between"><div><p class="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">菜单路由能力</p><h3 class="mt-2 text-lg font-semibold">共 ${selected.size} 个菜单</h3></div><button type="button" data-wizard-go-step="2" class="text-sm font-semibold text-emerald-700 hover:underline">返回调整</button></div><div class="mt-5 space-y-3">${[...modules.entries()].map(([title, names]) => `<div class="rounded-xl border border-border p-4"><div class="flex items-center justify-between gap-3"><strong class="text-sm">${esc(title)}</strong><span class="text-xs text-muted-foreground">${names.length} 项</span></div><p class="mt-2 text-xs leading-5 text-muted-foreground">${names.map(esc).join("、")}</p></div>`).join("")}</div></section>
    </div></div>`;
}

function renderExitConfirm(): string {
  if (!showExitConfirm) return "";
  return `<div class="fixed inset-0 z-[240] grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true"><div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"><h3 class="text-xl font-semibold">放弃创建服务包？</h3><p class="mt-2 text-sm leading-6 text-muted-foreground">当前填写的产品信息和菜单选择不会保存。</p><div class="mt-6 flex justify-end gap-2"><button type="button" data-wizard-continue class="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">继续编辑</button><button type="button" data-wizard-discard class="h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800">放弃</button></div></div></div>`;
}

export function renderSubscriptionServiceCreateWizard(): string {
  const content = step === 1 ? renderProductStep() : step === 2 ? renderRouteStep() : renderConfirmStep();
  return `<div class="flex h-dvh min-h-0 flex-col overflow-hidden bg-muted/20 text-foreground" data-subscription-create-wizard>
    <header class="shrink-0 border-b border-border bg-card px-5 py-4 shadow-sm"><div class="mx-auto flex max-w-[96rem] items-center gap-5"><button type="button" data-wizard-exit class="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-lg hover:bg-muted" aria-label="返回服务包列表">←</button><div class="min-w-0 shrink-0"><p class="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">ENTITLEMENT BUILDER</p><h1 class="truncate text-lg font-semibold">创建服务包</h1></div><div class="ml-auto flex w-full max-w-3xl justify-end">${renderSteps()}</div></div></header>
    <main class="min-h-0 flex-1 overflow-auto px-5 py-8 md:px-8">${errorMessage ? `<div class="mx-auto mb-5 max-w-5xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">${esc(errorMessage)}</div>` : ""}${content}</main>
    <footer class="shrink-0 border-t border-border bg-card px-5 py-4"><div class="mx-auto flex max-w-[96rem] items-center justify-between gap-3"><button type="button" data-wizard-exit class="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">取消</button><div class="flex items-center gap-2">${step > 1 ? `<button type="button" data-wizard-prev class="h-10 rounded-lg border border-border px-5 text-sm font-semibold hover:bg-muted">上一步</button>` : ""}${step < 3 ? `<button type="button" data-wizard-next class="h-10 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">下一步</button>` : `<button type="button" data-wizard-submit="save" ${submitting ? "disabled" : ""} class="h-10 rounded-lg border border-emerald-700 px-5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">保存</button><button type="button" data-wizard-submit="publish" ${submitting ? "disabled" : ""} class="h-10 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50">保存并发布</button>`}</div></div></footer>${renderExitConfirm()}
  </div>`;
}

function syncProductForm(): void {
  const form = document.querySelector<HTMLFormElement>("[data-wizard-product-form]");
  if (!form) return;
  const data = new FormData(form);
  draft.name = String(data.get("name") ?? "");
  draft.code = String(data.get("code") ?? "");
  draft.description = String(data.get("description") ?? "");
  draft.price = String(data.get("price") ?? "");
  draft.billingInterval = String(data.get("billingInterval") ?? "month") as BillingInterval;
}

function validateProduct(): string {
  if (!draft.name.trim()) return "请输入服务包名称";
  const code = draft.code.trim().toUpperCase();
  if (!code) return "请输入服务包唯一编码";
  if (readSubscriptionServiceSnapshot().packages.some((item) => item.code.trim().toUpperCase() === code)) return "服务包编码已存在，请更换后重试";
  const price = Number(draft.price);
  if (!Number.isFinite(price) || price < 0) return "展示价格必须是非负数字";
  return "";
}

function resetWizard(): void {
  draft = emptyDraft(); step = 1; search = ""; errorMessage = ""; showExitConfirm = false; submitting = false; historyGuardReady = false;
}

function leaveWizard(onMount: () => void): void {
  resetWizard();
  location.hash = `#${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}`;
  onMount();
}

function requestExit(onMount: () => void): void {
  syncProductForm();
  if (!hasChanges()) return leaveWizard(onMount);
  showExitConfirm = true;
  onMount();
}

export function bindSubscriptionServiceCreateWizard(onMount: () => void): void {
  activeOnMount = onMount;
  if (!navigationGuardBound) {
    window.addEventListener("popstate", () => { if (activeOnMount) handleSubscriptionWizardHistoryBack(activeOnMount); });
    window.addEventListener("beforeunload", (event) => { if (location.hash.slice(1) === SUBSCRIPTION_SERVICE_CREATE_PATH && hasChanges()) event.preventDefault(); });
    navigationGuardBound = true;
  }
  if (!historyGuardReady) {
    history.pushState({ subscriptionWizardGuard: true }, "", location.href);
    historyGuardReady = true;
  }
  initializeSubscriptionMenuTreeIndeterminate();
  document.querySelectorAll<HTMLButtonElement>("[data-wizard-exit]").forEach((button) => button.addEventListener("click", () => requestExit(onMount)));
  document.querySelector<HTMLButtonElement>("[data-wizard-continue]")?.addEventListener("click", () => { showExitConfirm = false; onMount(); });
  document.querySelector<HTMLButtonElement>("[data-wizard-discard]")?.addEventListener("click", () => leaveWizard(onMount));
  document.querySelector<HTMLButtonElement>("[data-wizard-prev]")?.addEventListener("click", () => { errorMessage = ""; step = Math.max(1, step - 1) as WizardStep; onMount(); });
  document.querySelector<HTMLButtonElement>("[data-wizard-next]")?.addEventListener("click", () => {
    if (step === 1) { syncProductForm(); errorMessage = validateProduct(); if (errorMessage) return onMount(); }
    if (step === 2 && !getPublishedSubscriptionMenuTree()) { errorMessage = "请先发布菜单路由配置，再继续创建服务包"; return onMount(); }
    if (step === 2 && !draft.routeNodeIds.length) { errorMessage = "请至少选择一个菜单路由"; return onMount(); }
    errorMessage = ""; step = Math.min(3, step + 1) as WizardStep; onMount();
  });
  document.querySelector<HTMLButtonElement>("[data-wizard-go-step]")?.addEventListener("click", (event) => { step = Number((event.currentTarget as HTMLElement).dataset.wizardGoStep) as WizardStep; onMount(); });
  document.querySelector<HTMLInputElement>("[data-wizard-route-search]")?.addEventListener("input", (event) => { search = (event.currentTarget as HTMLInputElement).value; onMount(); });
  document.querySelectorAll<HTMLInputElement>("[data-sub-tree-select-ids]").forEach((input) => input.addEventListener("change", () => {
    const selected = new Set(draft.routeNodeIds); const toggle = readSubscriptionMenuTreeToggle(input); toggle.routeNodeIds.forEach((id) => toggle.checked ? selected.add(id) : selected.delete(id)); draft.routeNodeIds = [...selected]; errorMessage = ""; onMount();
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-wizard-submit]").forEach((button) => button.addEventListener("click", () => {
    if (submitting) return;
    errorMessage = validateProduct() || (!draft.routeNodeIds.length ? "请至少选择一个菜单路由" : "");
    if (errorMessage) return onMount();
    submitting = true; onMount();
    try {
      createServicePackageFromWizard({ name: draft.name, code: draft.code, description: draft.description, priceMinor: Math.round(Number(draft.price) * 100), billingInterval: draft.billingInterval, routeNodeIds: draft.routeNodeIds, publish: button.dataset.wizardSubmit === "publish" });
      feedbackAfterCreate = button.dataset.wizardSubmit === "publish" ? "服务包已创建并发布 v1" : "服务包已保存为未发布草稿";
      leaveWizard(onMount);
    } catch (error) { submitting = false; errorMessage = error instanceof Error ? error.message : "保存失败，请重试"; onMount(); }
  }));
}

export let feedbackAfterCreate = "";
export function consumeSubscriptionWizardFeedback(): string {
  const value = feedbackAfterCreate; feedbackAfterCreate = ""; return value;
}

export function isSubscriptionWizardDirty(): boolean { return hasChanges(); }
export function handleSubscriptionWizardHistoryBack(onMount: () => void): void {
  if (location.hash.slice(1) !== SUBSCRIPTION_SERVICE_CREATE_PATH || !historyGuardReady) return;
  history.pushState({ subscriptionWizardGuard: true }, "", location.href);
  requestExit(onMount);
}
