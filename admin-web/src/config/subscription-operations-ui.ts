import { subscriptionOperationPolicy, type SubscriptionImpactPreview, type SubscriptionOperation, type SubscriptionPackageState } from "./subscription-operations-domain";
import type { MerchantSubscription, SubscriptionServiceSnapshot } from "./subscription-service-domain";
import "./package-action-feedback.css";

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
  if (primary) return `<button type="button" aria-label="${labels[operation]}" data-sub-operation="${operation}" data-subscription-id="${esc(subscriptionId)}" ${disabledReason ? `disabled title="${esc(disabledReason)}"` : ""} class="${classes} disabled:cursor-not-allowed disabled:opacity-45">${labels[operation]}</button>`;
  const reasonId = `subscription-${encodeURIComponent(subscriptionId)}-${operation}-reason`;
  return `<button type="button" role="menuitem" tabindex="-1" aria-label="${labels[operation]}" data-sub-operation="${operation}" data-subscription-id="${esc(subscriptionId)}" data-package-action="${dangerous ? "disable" : "subscription"}" ${disabledReason ? `aria-disabled="true" aria-describedby="${esc(reasonId)}"` : ""} class="${classes}${disabledReason ? " cursor-not-allowed opacity-45" : ""}">${labels[operation]}${disabledReason ? `<span id="${esc(reasonId)}" data-sub-disabled-reason class="mt-1 block whitespace-normal text-[11px] font-normal leading-4 text-muted-foreground">${esc(disabledReason)}</span>` : ""}</button>`;
}

export function renderSubscriptionRowOperations(snapshot: SubscriptionServiceSnapshot, subscription: MerchantSubscription, now = new Date()): string {
  if (subscription.entitlementKind) return `<button type="button" class="text-xs font-semibold text-primary hover:underline" data-sub-brand-rights="${esc(subscription.subjectId)}">查看品牌服务权益</button>`;
  const policy = subscriptionOperationPolicy(snapshot, subscription, now);
  const primary = policy.primary ? operationButton(policy.primary, subscription.id, policy.disabled[policy.primary], true) : "";
  const more = policy.allowed.filter((operation) => operation !== policy.primary).map((operation) => operationButton(operation, subscription.id)).join("");
  const unavailable = Object.entries(policy.disabled).filter(([operation]) => operation !== policy.primary && !policy.allowed.includes(operation as SubscriptionOperation)).map(([operation, reason]) => operationButton(operation as SubscriptionOperation, subscription.id, reason)).join("");
  const menuId = `subscription-operations-${encodeURIComponent(subscription.id)}`;
  return `${primary}<button type="button" class="ba-btn package-more" data-sub-more="${esc(subscription.id)}" aria-haspopup="menu" aria-controls="${esc(menuId)}" aria-expanded="false">更多 <span aria-hidden="true">⌄</span></button><div id="${esc(menuId)}" popover="auto" class="package-menu" data-sub-operations-menu="${esc(subscription.id)}" role="menu" aria-label="订阅更多操作">${more}${unavailable}</div>`;
}

let subscriptionMenuEventsBound = false;

function closeSubscriptionMoreMenus(): void {
  document.querySelectorAll<HTMLElement>("[data-sub-operations-menu]:popover-open").forEach((menu) => menu.hidePopover());
}

export function bindSubscriptionMoreMenus(root: ParentNode): void {
  if (!subscriptionMenuEventsBound) {
    subscriptionMenuEventsBound = true;
    window.addEventListener("resize", closeSubscriptionMoreMenus);
    window.addEventListener("hashchange", closeSubscriptionMoreMenus);
    document.addEventListener("scroll", (event) => {
      if (event.target instanceof Element && event.target.closest('[data-sub-operations-menu]')) return;
      closeSubscriptionMoreMenus();
    }, true);
  }

  root.querySelectorAll<HTMLButtonElement>("[data-sub-more]").forEach((trigger) => {
    const menuId = trigger.getAttribute("aria-controls");
    const menu = menuId ? document.getElementById(menuId) : null;
    if (!menu) return;
    const items = [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];

    menu.ontoggle = () => trigger.setAttribute("aria-expanded", String(menu.matches(":popover-open")));

    const open = (focusLast = false) => {
      if (!trigger.isConnected || !menu.isConnected) return;
      const rect = trigger.getBoundingClientRect();
      menu.style.left = `${Math.max(12, Math.min(window.innerWidth - 182, rect.right - 170))}px`;
      menu.style.top = "12px";
      menu.style.maxHeight = `${Math.max(44, window.innerHeight - 24)}px`;
      menu.style.visibility = "hidden";
      menu.showPopover();
      const height = menu.offsetHeight;
      const below = window.innerHeight - rect.bottom - 12;
      const top = below >= height ? rect.bottom + 6 : Math.max(12, rect.top - height - 6);
      menu.style.top = `${top}px`;
      menu.style.maxHeight = `${Math.max(44, window.innerHeight - top - 12)}px`;
      menu.style.visibility = "";
      (focusLast ? items.at(-1) : items[0])?.focus({ preventScroll: true });
    };

    let pointerOpen = false;
    trigger.onpointerdown = () => { pointerOpen = menu.matches(":popover-open"); };
    trigger.onclick = () => {
      const shouldClose = pointerOpen || menu.matches(":popover-open");
      pointerOpen = false;
      if (shouldClose) menu.hidePopover();
      else open();
    };
    trigger.onkeydown = (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      open(event.key === "ArrowUp");
    };
    menu.onkeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        menu.hidePopover();
        if (trigger.isConnected) trigger.focus({ preventScroll: true });
        return;
      }
      if (event.key === "Tab") {
        menu.hidePopover();
        if (trigger.isConnected) trigger.focus({ preventScroll: true });
        return;
      }
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === "Home"
        ? items[0]
        : event.key === "End"
          ? items.at(-1)
          : items[(Math.max(index, 0) + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length];
      target?.focus({ preventScroll: true });
    };
    items.forEach((item) => item.addEventListener("click", (event) => {
      if (item.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      menu.hidePopover();
    }));
  });
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
