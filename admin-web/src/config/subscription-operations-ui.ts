import { subscriptionOperationPolicy, type SubscriptionImpactPreview, type SubscriptionOperation, type SubscriptionPackageState } from "./subscription-operations-domain";
import type { MerchantSubscription, SubscriptionServiceSnapshot } from "./subscription-service-domain";

const labels: Record<SubscriptionOperation, string> = {
  edit: "编辑",
  activate: "立即生效",
  extend: "续期",
  "adjust-end": "调整到期时间",
  disable: "停用",
  cancel: "撤销",
  reopen: "重新开通",
  detail: "查看详情",
  audit: "操作记录",
};

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export function packageStateLabel(state: SubscriptionPackageState): string {
  return ({ running: "运行中", off: "服务包已下架", disabled: "服务包已停用", unpublished: "服务包未发布", missing: "服务包缺失" } as const)[state];
}

export function renderPackageStateBadge(state: SubscriptionPackageState): string {
  if (state === "running") return "";
  return `<span class="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">${esc(packageStateLabel(state))}</span>`;
}

function operationButton(operation: SubscriptionOperation, subscriptionId: string, disabledReason = "", primary = false): string {
  const dangerous = operation === "disable" || operation === "cancel";
  const classes = primary ? "h-9 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800" : `w-full rounded-md px-3 py-2 text-left text-xs font-semibold hover:bg-muted ${dangerous ? "text-rose-700" : "text-foreground"}`;
  return `<button type="button" aria-label="${labels[operation]}" data-sub-operation="${operation}" data-subscription-id="${esc(subscriptionId)}" ${disabledReason ? `disabled title="${esc(disabledReason)}"` : ""} class="${classes} disabled:cursor-not-allowed disabled:opacity-45">${labels[operation]}</button>`;
}

export function renderSubscriptionRowOperations(snapshot: SubscriptionServiceSnapshot, subscription: MerchantSubscription, now = new Date()): string {
  if (subscription.entitlementKind) return `<button type="button" class="text-xs font-semibold text-primary hover:underline" data-sub-brand-rights="${esc(subscription.subjectId)}">查看品牌服务权益</button>`;
  const policy = subscriptionOperationPolicy(snapshot, subscription, now);
  const primary = policy.primary ? operationButton(policy.primary, subscription.id, policy.disabled[policy.primary], true) : "";
  const more = policy.allowed.filter((operation) => operation !== policy.primary).map((operation) => operationButton(operation, subscription.id)).join("");
  const unavailable = Object.entries(policy.disabled).filter(([operation]) => operation !== policy.primary && !policy.allowed.includes(operation as SubscriptionOperation)).map(([operation, reason]) => operationButton(operation as SubscriptionOperation, subscription.id, reason)).join("");
  return `${primary}<details><summary class="flex h-9 cursor-pointer list-none items-center rounded-lg border border-border px-3 text-xs font-semibold">更多</summary><div data-sub-operations-menu class="ml-auto mt-1 w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg">${more}${unavailable}</div></details>`;
}

export function renderImpactCards(preview: SubscriptionImpactPreview): string {
  const cards: Array<[number, string]> = [
    [preview.directSubjectCount, "直接主体"],
    [preview.inheritedStoreCount, "继承门店"],
    [preview.providedRouteCount, "服务菜单"],
    [preview.lostRouteCount, "实际失去"],
    [preview.retainedRouteCount, "其他订阅保留"],
    [preview.gainedRouteCount, "新增菜单"],
    [preview.alreadyCoveredRouteCount, "原已覆盖"],
  ];
  return `<div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">${cards.map(([value, label]) => `<div class="rounded-xl bg-muted p-3"><p class="text-xl font-semibold">${value}</p><p class="text-xs text-muted-foreground">${label}</p></div>`).join("")}</div>`;
}
