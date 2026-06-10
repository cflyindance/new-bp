/**
 * 前厅 · 菜单下单限制业务页：hash 子路由 Tab，集中维护下单限制与命中后授权。
 */

import {
  renderDishComboRulesHtml,
  renderDishMutexRulesHtml,
} from "./module-settings-dish-rules-ui";
import {
  ensureGuestMenuOrderIntervalToggleMigrated,
  GUEST_MENU_ORDER_INTERVAL_SEQ,
  renderGuestMenuOrderIntervalPanelHtml,
} from "./module-settings-guest-menu-order-interval-ui";
import {
  GUEST_MENU_INTERVAL_ALLOW_CART_SEQ,
  readGuestMenuOrderIntervalEnabled,
  renderGuestMenuIntervalAllowCartPanelHtml,
} from "./module-settings-guest-menu-interval-allow-cart-ui";
import {
  ensureGuestOrderPlaceIntervalToggleMigrated,
  GUEST_ORDER_PLACE_INTERVAL_SEQ,
  renderGuestOrderPlaceIntervalPanelHtml,
} from "./module-settings-guest-order-place-interval-ui";
import {
  GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ,
  readGuestOrderPlaceIntervalEnabled,
  renderGuestOrderIntervalAllowCartPanelHtml,
} from "./module-settings-guest-order-interval-allow-cart-ui";
import {
  MEMBER_POINTS_ONLY_ORDER_SEQ,
  renderMemberPointsToggleFieldLinesPanelHtml,
} from "./module-settings-member-points-rewards-ui";
import {
  POINTS_DISH_AUTH_ORDER_SEQ,
  renderPointsDishAuthOrderPanelHtml,
} from "./module-settings-points-dish-auth-order-ui";
import {
  ensureRuleHitPasswordAuthToggleMigrated,
  RULE_HIT_PASSWORD_AUTH_SEQ,
  renderRuleHitPasswordAuthPanelHtml,
} from "./module-settings-rule-hit-password-auth-ui";
import {
  getDefaultModuleSettingToggleOn,
  moduleSettingToggleStorageKey,
} from "./module-settings-toggle-ui";
import {
  ensureViewonlyDishRuleToggleMigrated,
  VIEWONLY_DISH_AUTH_SEQ,
  VIEWONLY_DISH_CART_SEQ,
  renderViewonlyDishRulePanelHtml,
} from "./module-settings-viewonly-dish-rules-ui";

export const MENU_ORDER_LIMITS_BASE = "/operations/queue-call/menu-order-limits";

export const MENU_ORDER_LIMIT_DISH_MUTEX_SEQ = 597;
export const MENU_ORDER_LIMIT_DISH_COMBO_SEQ = 598;
export const MENU_ORDER_LIMIT_DISH_MUTEX_STORAGE_ID = "597-mutex-rules";
export const MENU_ORDER_LIMIT_DISH_COMBO_STORAGE_ID = "598-combo-rules";

export type MenuOrderLimitTabId =
  | "quantity"
  | "mutex"
  | "combo"
  | "interval"
  | "auth"
  | "points";

const MENU_ORDER_LIMIT_DISH_RULE_SEQS = [
  MENU_ORDER_LIMIT_DISH_MUTEX_SEQ,
  MENU_ORDER_LIMIT_DISH_COMBO_SEQ,
] as const;

/** 自「下单规则与授权」迁入本页的 seq */
export const MENU_ORDER_LIMIT_MIGRATED_SETTING_SEQS = [
  GUEST_ORDER_PLACE_INTERVAL_SEQ,
  GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ,
  GUEST_MENU_ORDER_INTERVAL_SEQ,
  GUEST_MENU_INTERVAL_ALLOW_CART_SEQ,
  RULE_HIT_PASSWORD_AUTH_SEQ,
  VIEWONLY_DISH_CART_SEQ,
  VIEWONLY_DISH_AUTH_SEQ,
  POINTS_DISH_AUTH_ORDER_SEQ,
  MEMBER_POINTS_ONLY_ORDER_SEQ,
] as const;

const TAB_ITEMS: { id: MenuOrderLimitTabId; label: string; hint: string }[] = [
  {
    id: "quantity",
    label: "数量与频次限制",
    hint: "用餐时长、下单次数、每轮数量上限等",
  },
  {
    id: "mutex",
    label: "每轮菜品互斥",
    hint: "同轮不可同时下单的菜品组合",
  },
  {
    id: "combo",
    label: "每轮菜品组合",
    hint: "下单某菜后须再包含指定菜品",
  },
  {
    id: "interval",
    label: "下单时间间隔",
    hint: "订单/菜品提交间隔与间隔内加购",
  },
  {
    id: "auth",
    label: "命中后授权",
    hint: "统一弹授权、可看不可点行为",
  },
  {
    id: "points",
    label: "积分菜限制",
    hint: "积分菜授权与纯积分单兑换",
  },
];

const DISH_RULE_META: Record<
  typeof MENU_ORDER_LIMIT_DISH_MUTEX_SEQ | typeof MENU_ORDER_LIMIT_DISH_COMBO_SEQ,
  { title: string; sceneDesc: string; tabId: MenuOrderLimitTabId }
> = {
  [MENU_ORDER_LIMIT_DISH_MUTEX_SEQ]: {
    title: "每轮菜品互斥下单",
    tabId: "mutex",
    sceneDesc: "开启后，同一轮下单中：已点「下单菜品」后，不可再点「不可再下单菜品」。可配置多条规则。",
  },
  [MENU_ORDER_LIMIT_DISH_COMBO_SEQ]: {
    title: "每轮菜品组合下单",
    tabId: "combo",
    sceneDesc: "开启后，同一轮下单中：点了「下单菜品」后，订单须再包含指定数量的必选菜品。可配置多条规则。",
  },
};

type SettingMeta = { seq: number; title: string; sceneDesc: string; hasToggle: boolean };

const INTERVAL_SETTINGS: SettingMeta[] = [
  {
    seq: GUEST_ORDER_PLACE_INTERVAL_SEQ,
    title: "订单下单时间间隔",
    sceneDesc:
      "开启后，在选定产线（eMenu、SDI）配置两次订单提交的最小时间间隔（秒）；小于间隔时需服务员授权。",
    hasToggle: true,
  },
  {
    seq: GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ,
    title: "间隔时间内允许加购（订单）",
    sceneDesc:
      "须先开启「订单下单时间间隔」。配置订单间隔内是否允许加购，以及加购时触发服务员授权的条件（每次加购 / 累计菜品数阈值）。",
    hasToggle: false,
  },
  {
    seq: GUEST_MENU_ORDER_INTERVAL_SEQ,
    title: "菜品下单时间间隔",
    sceneDesc:
      "开启后，在选定产线（eMenu、SDI）按菜品或菜品集配置最小下单时间间隔（分钟）；小于间隔时需服务员授权。",
    hasToggle: true,
  },
  {
    seq: GUEST_MENU_INTERVAL_ALLOW_CART_SEQ,
    title: "间隔时间内允许加购（菜品）",
    sceneDesc:
      "须先开启「菜品下单时间间隔」。配置菜品间隔内是否允许加入购物车，以及加购时触发服务员授权的条件（每次加购 / 累计菜品数阈值）。",
    hasToggle: false,
  },
];

const AUTH_SETTINGS: SettingMeta[] = [
  {
    seq: RULE_HIT_PASSWORD_AUTH_SEQ,
    title: "命中任意规则后,弹出密码授权",
    sceneDesc: "开启后在所选产线（eMenu）食客下单命中任意限制规则时弹出服务员密码授权。",
    hasToggle: true,
  },
  {
    seq: VIEWONLY_DISH_CART_SEQ,
    title: "允许可看不可点的菜添加至购物车",
    sceneDesc: "设置是否允许可看不可点的菜添加至购物车，关闭时需密码授权。",
    hasToggle: true,
  },
  {
    seq: VIEWONLY_DISH_AUTH_SEQ,
    title: "可看不可点的菜弹出服务员授权",
    sceneDesc: "设置可看不可点的菜是否弹出服务员授权。",
    hasToggle: true,
  },
];

const POINTS_SETTINGS: SettingMeta[] = [
  {
    seq: POINTS_DISH_AUTH_ORDER_SEQ,
    title: "需要权限下单的积分菜",
    sceneDesc: "开启后，在选定产线（eMenu）兑换积分菜须服务员输入密码授权。",
    hasToggle: true,
  },
  {
    seq: MEMBER_POINTS_ONLY_ORDER_SEQ,
    title: "订单仅有积分商品可以兑换",
    sceneDesc: "开启后，在选定产线允许订单仅含积分商品时直接下单兑换。",
    hasToggle: true,
  },
];

const SEQ_TO_TAB: Record<number, MenuOrderLimitTabId> = {
  [MENU_ORDER_LIMIT_DISH_MUTEX_SEQ]: "mutex",
  [MENU_ORDER_LIMIT_DISH_COMBO_SEQ]: "combo",
  [GUEST_ORDER_PLACE_INTERVAL_SEQ]: "interval",
  [GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ]: "interval",
  [GUEST_MENU_ORDER_INTERVAL_SEQ]: "interval",
  [GUEST_MENU_INTERVAL_ALLOW_CART_SEQ]: "interval",
  [RULE_HIT_PASSWORD_AUTH_SEQ]: "auth",
  [VIEWONLY_DISH_CART_SEQ]: "auth",
  [VIEWONLY_DISH_AUTH_SEQ]: "auth",
  [POINTS_DISH_AUTH_ORDER_SEQ]: "points",
  [MEMBER_POINTS_ONLY_ORDER_SEQ]: "points",
};

const TAB_BADGE_TOGGLE_SEQS: Record<MenuOrderLimitTabId, readonly number[]> = {
  quantity: [],
  mutex: [MENU_ORDER_LIMIT_DISH_MUTEX_SEQ],
  combo: [MENU_ORDER_LIMIT_DISH_COMBO_SEQ],
  interval: [GUEST_ORDER_PLACE_INTERVAL_SEQ, GUEST_MENU_ORDER_INTERVAL_SEQ],
  auth: [RULE_HIT_PASSWORD_AUTH_SEQ, VIEWONLY_DISH_CART_SEQ, VIEWONLY_DISH_AUTH_SEQ],
  points: [POINTS_DISH_AUTH_ORDER_SEQ, MEMBER_POINTS_ONLY_ORDER_SEQ],
};

const TOGGLE_TRACK_ON = "bg-primary border-primary shadow-sm";
const TOGGLE_TRACK_OFF =
  "bg-neutral-300 border-neutral-400/80 shadow-inner dark:bg-neutral-600 dark:border-neutral-500";
const TOGGLE_KNOB =
  "bg-white shadow-md ring-1 ring-black/10 dark:bg-neutral-100 dark:ring-white/15";

const TAB_LINK_BASE =
  "flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const TAB_LINK_ACTIVE = "bg-background text-foreground shadow-sm";
const TAB_LINK_INACTIVE = "text-muted-foreground hover:bg-background/60 hover:text-foreground";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isMenuOrderLimitsPath(path: string): boolean {
  return path === MENU_ORDER_LIMITS_BASE || path.startsWith(`${MENU_ORDER_LIMITS_BASE}/`);
}

export function resolveMenuOrderLimitTabFromPath(path: string): MenuOrderLimitTabId {
  if (path === `${MENU_ORDER_LIMITS_BASE}/mutex` || path.startsWith(`${MENU_ORDER_LIMITS_BASE}/mutex/`)) {
    return "mutex";
  }
  if (path === `${MENU_ORDER_LIMITS_BASE}/combo` || path.startsWith(`${MENU_ORDER_LIMITS_BASE}/combo/`)) {
    return "combo";
  }
  if (
    path === `${MENU_ORDER_LIMITS_BASE}/interval` ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/interval/`)
  ) {
    return "interval";
  }
  if (path === `${MENU_ORDER_LIMITS_BASE}/auth` || path.startsWith(`${MENU_ORDER_LIMITS_BASE}/auth/`)) {
    return "auth";
  }
  if (
    path === `${MENU_ORDER_LIMITS_BASE}/points` ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/points/`)
  ) {
    return "points";
  }
  return "quantity";
}

export function getMenuOrderLimitTabHref(tab: MenuOrderLimitTabId): string {
  if (tab === "quantity") return MENU_ORDER_LIMITS_BASE;
  return `${MENU_ORDER_LIMITS_BASE}/${tab}`;
}

export function getMenuOrderLimitTabForSeq(seq: number): MenuOrderLimitTabId | null {
  return SEQ_TO_TAB[seq] ?? null;
}

function readToggleOn(seq: number): boolean {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(seq));
    if (raw === null) return getDefaultModuleSettingToggleOn(seq);
    return raw === "1";
  } catch {
    return getDefaultModuleSettingToggleOn(seq);
  }
}

function toggleOffLabelClass(on: boolean): string {
  return on ? "text-xs text-muted-foreground" : "text-xs font-medium text-foreground";
}

function toggleOnLabelClass(on: boolean): string {
  return on ? "text-xs font-medium text-foreground" : "text-xs text-muted-foreground";
}

function renderToggleSwitch(seq: number, title: string): string {
  const on = readToggleOn(seq);
  const trackClass = on ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF;
  const knobClass = on ? "translate-x-5" : "translate-x-0.5";
  const stateHint = on ? "已开启" : "已关闭";
  return `
    <div class="flex shrink-0 items-center gap-2" data-module-setting-toggle-group>
      <span data-toggle-off-label class="${toggleOffLabelClass(on)}">关</span>
      <button
        type="button"
        role="switch"
        class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${trackClass}"
        data-module-setting-toggle="${seq}"
        aria-checked="${on ? "true" : "false"}"
        aria-label="${escapeHtml(title)}"
        title="${escapeHtml(stateHint)}"
      >
        <span
          class="pointer-events-none block size-5 ${knobClass} ${TOGGLE_KNOB} rounded-full transition-transform duration-200"
          aria-hidden="true"
        ></span>
      </button>
      <span data-toggle-on-label class="${toggleOnLabelClass(on)}">开</span>
    </div>`;
}

function renderSettingTitleBlock(meta: SettingMeta): string {
  return `
    <h3 class="text-sm font-semibold text-card-foreground">${escapeHtml(meta.title)}</h3>
    <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">${escapeHtml(meta.sceneDesc)}</p>`;
}

function renderSettingBodyHtml(meta: SettingMeta): string {
  const on = readToggleOn(meta.seq);
  switch (meta.seq) {
    case GUEST_ORDER_PLACE_INTERVAL_SEQ:
      ensureGuestOrderPlaceIntervalToggleMigrated();
      return renderGuestOrderPlaceIntervalPanelHtml(on);
    case GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ:
      return renderGuestOrderIntervalAllowCartPanelHtml(readGuestOrderPlaceIntervalEnabled());
    case GUEST_MENU_ORDER_INTERVAL_SEQ:
      ensureGuestMenuOrderIntervalToggleMigrated();
      return renderGuestMenuOrderIntervalPanelHtml(on);
    case GUEST_MENU_INTERVAL_ALLOW_CART_SEQ:
      return renderGuestMenuIntervalAllowCartPanelHtml(readGuestMenuOrderIntervalEnabled());
    case RULE_HIT_PASSWORD_AUTH_SEQ:
      ensureRuleHitPasswordAuthToggleMigrated();
      return renderRuleHitPasswordAuthPanelHtml(on);
    case VIEWONLY_DISH_CART_SEQ:
    case VIEWONLY_DISH_AUTH_SEQ:
      ensureViewonlyDishRuleToggleMigrated(meta.seq);
      return renderViewonlyDishRulePanelHtml(meta.seq, on);
    case POINTS_DISH_AUTH_ORDER_SEQ:
      return renderPointsDishAuthOrderPanelHtml(meta.seq, on);
    case MEMBER_POINTS_ONLY_ORDER_SEQ:
      return renderMemberPointsToggleFieldLinesPanelHtml(meta.seq, on);
    default:
      return "";
  }
}

function renderSettingListRow(meta: SettingMeta): string {
  const body = renderSettingBodyHtml(meta);
  if (meta.hasToggle) {
    return `
      <li class="list-none" data-module-setting-row-seq="${meta.seq}">
        <div class="border-b border-border px-4 py-3 last:border-b-0">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1">${renderSettingTitleBlock(meta)}</div>
            <div class="shrink-0 pt-0.5">${renderToggleSwitch(meta.seq, meta.title)}</div>
          </div>
          ${body}
        </div>
      </li>`;
  }

  return `
    <li class="list-none" data-module-setting-row-seq="${meta.seq}">
      <div class="border-b border-border px-4 py-3 last:border-b-0">
        ${renderSettingTitleBlock(meta)}
        <div data-menu-order-limit-setting-body="${meta.seq}">${body}</div>
      </div>
    </li>`;
}

function renderTabStatusBadge(tabId: MenuOrderLimitTabId): string {
  if (tabId === "quantity") return "";
  const seqs = TAB_BADGE_TOGGLE_SEQS[tabId];
  if (!seqs.some((seq) => readToggleOn(seq))) return "";
  return `<span class="mt-0.5 inline-flex rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-medium text-primary">已开启</span>`;
}

function renderTabBar(activeTab: MenuOrderLimitTabId): string {
  const tabs = TAB_ITEMS.map((tab) => {
    const isActive = tab.id === activeTab;
    const linkClass = `${TAB_LINK_BASE} ${isActive ? TAB_LINK_ACTIVE : TAB_LINK_INACTIVE}`;
    const href = getMenuOrderLimitTabHref(tab.id);
    return `
      <a
        href="#${href}"
        role="tab"
        id="menu-order-limit-tab-${escapeHtml(tab.id)}"
        class="${linkClass}"
        data-menu-order-limit-tab="${escapeHtml(tab.id)}"
        aria-selected="${isActive ? "true" : "false"}"
        aria-controls="menu-order-limit-panel-${escapeHtml(tab.id)}"
        ${isActive ? 'aria-current="page"' : ""}
      >
        <span class="font-medium leading-tight">${escapeHtml(tab.label)}</span>
        <span class="text-xs text-muted-foreground leading-snug">${escapeHtml(tab.hint)}</span>
        <span data-menu-order-limit-tab-badge>${renderTabStatusBadge(tab.id)}</span>
      </a>`;
  }).join("");

  return `
    <nav
      class="shrink-0 rounded-xl border border-border bg-muted/40 p-1"
      role="tablist"
      aria-label="菜单下单限制类型"
      data-menu-order-limit-tablist
    >
      <div class="-mx-0.5 flex gap-1 overflow-x-auto pb-px scroll-smooth [scrollbar-width:thin] sm:flex-wrap">${tabs}</div>
    </nav>`;
}

function renderQuantityPanel(iframeSrc: string, activeTab: MenuOrderLimitTabId): string {
  if (activeTab !== "quantity") return "";
  return `
    <section
      id="menu-order-limit-panel-quantity"
      role="tabpanel"
      aria-labelledby="menu-order-limit-tab-quantity"
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      data-menu-order-limit-panel="quantity"
    >
      <iframe
        title="数量与频次限制规则设计器"
        class="block min-h-0 w-full flex-1 border-0"
        src="${escapeHtml(iframeSrc)}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </section>`;
}

function renderDishRuleTabPanel(
  seq: typeof MENU_ORDER_LIMIT_DISH_MUTEX_SEQ | typeof MENU_ORDER_LIMIT_DISH_COMBO_SEQ,
  activeTab: MenuOrderLimitTabId,
): string {
  const meta = DISH_RULE_META[seq];
  if (activeTab !== meta.tabId) return "";

  const on = readToggleOn(seq);
  const panelHidden = on ? "" : "hidden";
  const rulesHtml =
    seq === MENU_ORDER_LIMIT_DISH_MUTEX_SEQ
      ? renderDishMutexRulesHtml(seq, MENU_ORDER_LIMIT_DISH_MUTEX_STORAGE_ID)
      : renderDishComboRulesHtml(seq, MENU_ORDER_LIMIT_DISH_COMBO_STORAGE_ID);

  return `
    <section
      id="menu-order-limit-panel-${escapeHtml(meta.tabId)}"
      role="tabpanel"
      aria-labelledby="menu-order-limit-tab-${escapeHtml(meta.tabId)}"
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      data-menu-order-limit-panel="${escapeHtml(meta.tabId)}"
    >
      <div class="shrink-0 border-b border-border px-4 py-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-semibold text-card-foreground">${escapeHtml(meta.title)}</h2>
            <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">${escapeHtml(meta.sceneDesc)}</p>
          </div>
          <div class="shrink-0 pt-0.5">${renderToggleSwitch(seq, meta.title)}</div>
        </div>
      </div>
      <div
        class="min-h-0 flex-1 overflow-y-auto px-4 py-4 ${panelHidden}"
        data-nested-panel="${seq}"
        ${on ? "" : 'aria-hidden="true"'}
      >
        ${on ? rulesHtml : `<p class="m-0 text-sm text-muted-foreground">请先开启上方开关以配置规则。</p>`}
      </div>
    </section>`;
}

function renderSettingsListTabPanel(
  tabId: MenuOrderLimitTabId,
  activeTab: MenuOrderLimitTabId,
  settings: SettingMeta[],
  panelTitle: string,
  panelDesc: string,
): string {
  if (activeTab !== tabId) return "";
  const rows = settings.map((meta) => renderSettingListRow(meta)).join("");
  return `
    <section
      id="menu-order-limit-panel-${escapeHtml(tabId)}"
      role="tabpanel"
      aria-labelledby="menu-order-limit-tab-${escapeHtml(tabId)}"
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      data-menu-order-limit-panel="${escapeHtml(tabId)}"
    >
      <div class="shrink-0 border-b border-border px-4 py-3">
        <h2 class="text-base font-semibold text-card-foreground">${escapeHtml(panelTitle)}</h2>
        <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">${escapeHtml(panelDesc)}</p>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <ul class="m-0 list-none p-0">${rows}</ul>
      </div>
    </section>`;
}

export function isMenuOrderLimitDishRuleSeq(seq: number): boolean {
  return (MENU_ORDER_LIMIT_DISH_RULE_SEQS as readonly number[]).includes(seq);
}

export function isMenuOrderLimitPageSettingSeq(seq: number): boolean {
  return (
    isMenuOrderLimitDishRuleSeq(seq) ||
    (MENU_ORDER_LIMIT_MIGRATED_SETTING_SEQS as readonly number[]).includes(seq)
  );
}

export function refreshMenuOrderLimitTabBadges(): void {
  document.querySelectorAll<HTMLElement>("[data-menu-order-limit-tab-badge]").forEach((badgeHost) => {
    const link = badgeHost.closest<HTMLElement>("[data-menu-order-limit-tab]");
    const tab = link?.getAttribute("data-menu-order-limit-tab") as MenuOrderLimitTabId | null;
    if (!tab || tab === "quantity") return;
    badgeHost.innerHTML = renderTabStatusBadge(tab);
  });
}

const MENU_ORDER_LIMIT_TAB_ORDER: MenuOrderLimitTabId[] = [
  "quantity",
  "mutex",
  "combo",
  "interval",
  "auth",
  "points",
];

/** 绑定 Tab 点击与键盘切换；由 main 传入路由跳转（replaceHashPath + mount）。 */
export function bindFohMenuOrderLimitsUi(remountToTab: (tab: MenuOrderLimitTabId) => void): void {
  const root = document.querySelector<HTMLElement>("[data-foh-menu-order-limits-root]");
  if (!root || root.getAttribute("data-foh-menu-limits-bound") === "1") return;
  root.setAttribute("data-foh-menu-limits-bound", "1");

  const navigate = (tab: MenuOrderLimitTabId): void => {
    const path = location.hash.slice(1) || "/dashboard/overview";
    if (resolveMenuOrderLimitTabFromPath(path) === tab) return;
    remountToTab(tab);
  };

  root.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("[data-menu-order-limit-tab]");
    if (!link || !root.contains(link)) return;
    const tab = link.getAttribute("data-menu-order-limit-tab") as MenuOrderLimitTabId | null;
    if (!tab) return;
    e.preventDefault();
    navigate(tab);
  });

  root.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const tablist = root.querySelector<HTMLElement>("[data-menu-order-limit-tablist]");
    if (!tablist?.contains(e.target as Node)) return;
    const path = location.hash.slice(1) || "/dashboard/overview";
    const current = resolveMenuOrderLimitTabFromPath(path);
    const idx = MENU_ORDER_LIMIT_TAB_ORDER.indexOf(current);
    if (idx < 0) return;
    const nextIdx = e.key === "ArrowRight" ? idx + 1 : idx - 1;
    const nextTab = MENU_ORDER_LIMIT_TAB_ORDER[nextIdx];
    if (!nextTab) return;
    e.preventDefault();
    navigate(nextTab);
  });
}

export function renderFohMenuOrderLimitsPanel(iframeSrc: string, path: string): string {
  const activeTab = resolveMenuOrderLimitTabFromPath(path);

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-foh-menu-order-limits-root>
      <p class="m-0 shrink-0 text-sm leading-relaxed text-muted-foreground">
        集中配置食客端下单限制：含<strong class="font-medium text-foreground">数量与频次</strong>规则设计器、
        轮次<strong class="font-medium text-foreground">互斥/组合</strong>、
        <strong class="font-medium text-foreground">时间间隔</strong>、
        命中后<strong class="font-medium text-foreground">授权</strong>与
        <strong class="font-medium text-foreground">积分菜</strong>相关限制。
        「可看不可点」规则主数据请在<strong class="font-medium text-foreground">数量与频次</strong>设计器中维护。
      </p>

      ${renderTabBar(activeTab)}

      <div class="flex min-h-[min(72vh,720px)] flex-1 flex-col" data-menu-order-limit-panels>
        ${renderQuantityPanel(iframeSrc, activeTab)}
        ${renderDishRuleTabPanel(MENU_ORDER_LIMIT_DISH_MUTEX_SEQ, activeTab)}
        ${renderDishRuleTabPanel(MENU_ORDER_LIMIT_DISH_COMBO_SEQ, activeTab)}
        ${renderSettingsListTabPanel(
          "interval",
          activeTab,
          INTERVAL_SETTINGS,
          "下单时间间隔",
          "配置订单级与菜品级提交间隔，以及间隔内是否允许加购及授权触发条件。",
        )}
        ${renderSettingsListTabPanel(
          "auth",
          activeTab,
          AUTH_SETTINGS,
          "命中后授权",
          "配置限制命中后的统一授权方式，以及「可看不可点」菜品在购物车中的行为。",
        )}
        ${renderSettingsListTabPanel(
          "points",
          activeTab,
          POINTS_SETTINGS,
          "积分菜限制",
          "配置积分菜兑换授权与纯积分订单是否允许直接下单。",
        )}
      </div>
    </div>`;
}
