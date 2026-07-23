/**
 * 前厅 · 菜单下单限制业务页：hash 子路由 Tab，集中维护下单限制与命中后授权。
 */

import {
  renderDishRoundUnifiedWorkspaceHtml,
  bindDishRoundUnifiedWorkspace,
} from "./module-settings-dish-rules-ui";
import {
  ensureGuestMenuOrderIntervalToggleMigrated,
  GUEST_MENU_ORDER_INTERVAL_SEQ,
  renderGuestMenuOrderIntervalPanelHtml,
} from "./module-settings-guest-menu-order-interval-ui";
import {
  GUEST_MENU_INTERVAL_ALLOW_CART_SEQ,
  renderGuestMenuIntervalAllowCartPanelHtml,
} from "./module-settings-guest-menu-interval-allow-cart-ui";
import {
  ensureGuestOrderPlaceIntervalToggleMigrated,
  GUEST_ORDER_PLACE_INTERVAL_SEQ,
  renderGuestOrderPlaceIntervalPanelHtml,
} from "./module-settings-guest-order-place-interval-ui";
import {
  GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ,
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
  ensureViewonlyDishRuleToggleMigrated,
  VIEWONLY_DISH_AUTH_SEQ,
  VIEWONLY_DISH_CART_SEQ,
  renderViewonlyDishRulePanelHtml,
} from "./module-settings-viewonly-dish-rules-ui";
import { renderSettingTitleWithHelpHtml, bindModuleSettingSceneDescHelp } from "./module-settings-scene-desc-help-ui";

export const MENU_ORDER_LIMITS_BASE = "/operations/queue-call/menu-order-limits";

export const MENU_ORDER_LIMIT_DISH_MUTEX_SEQ = 597;
export const MENU_ORDER_LIMIT_DISH_COMBO_SEQ = 598;
export const MENU_ORDER_LIMIT_DISH_MUTEX_STORAGE_ID = "597-mutex-rules";
export const MENU_ORDER_LIMIT_DISH_COMBO_STORAGE_ID = "598-combo-rules";

export type MenuOrderLimitTabId = "quantity" | "dish-round" | "other";

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

const TAB_ITEMS: { id: MenuOrderLimitTabId; label: string }[] = [
  {
    id: "quantity",
    label: "数量与频次限制",
  },
  {
    id: "dish-round",
    label: "每轮菜品互斥/组合",
  },
  {
    id: "other",
    label: "其他设置",
  },
];

type SettingMeta = { seq: number; title: string; sceneDesc: string };

const INTERVAL_SETTINGS: SettingMeta[] = [
  {
    seq: GUEST_ORDER_PLACE_INTERVAL_SEQ,
    title: "订单下单时间间隔",
    sceneDesc:
      "按产线（POS、PayPad、POS GO、eMenu、SDI）分别配置两次订单提交的最小时间间隔（秒）；小于间隔时需服务员授权。",
  },
  {
    seq: GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ,
    title: "间隔时间内允许加购（订单）",
    sceneDesc:
      "各产线可分别设置间隔内是否允许加购及授权触发条件；选择「达到阈值需授权」时需填写累计加购菜品数。",
  },
  {
    seq: GUEST_MENU_ORDER_INTERVAL_SEQ,
    title: "菜品下单时间间隔",
    sceneDesc:
      "新增规则后，按产线选择适用商品并配置最小下单时间间隔（分钟）；小于间隔时需服务员授权。",
  },
  {
    seq: GUEST_MENU_INTERVAL_ALLOW_CART_SEQ,
    title: "间隔时间内允许加购（菜品）",
    sceneDesc:
      "各产线可分别设置间隔内是否允许加入购物车及授权触发条件；选择「达到阈值需授权」时需填写累计加购菜品数。",
  },
];

const AUTH_SETTINGS: SettingMeta[] = [
  {
    seq: RULE_HIT_PASSWORD_AUTH_SEQ,
    title: "命中任意规则后,弹出密码授权",
    sceneDesc: "勾选产线后，食客下单命中任意限制规则时须服务员输入密码授权。",
  },
  {
    seq: VIEWONLY_DISH_CART_SEQ,
    title: "允许可看不可点的菜添加至购物车",
    sceneDesc:
      "在所选产线（POS、PayPad、POS GO、eMenu、SDI）设置是否允许可看不可点的菜添加至购物车，关闭时需密码授权。",
  },
  {
    seq: VIEWONLY_DISH_AUTH_SEQ,
    title: "可看不可点的菜弹出服务员授权",
    sceneDesc:
      "在所选产线（POS、PayPad、POS GO、eMenu、SDI）设置可看不可点的菜是否弹出服务员授权。",
  },
];

const POINTS_SETTINGS: SettingMeta[] = [
  {
    seq: POINTS_DISH_AUTH_ORDER_SEQ,
    title: "需要权限下单的积分菜",
    sceneDesc: "勾选产线后，食客兑换积分菜须服务员输入密码授权。",
  },
  {
    seq: MEMBER_POINTS_ONLY_ORDER_SEQ,
    title: "订单仅有积分商品可以兑换",
    sceneDesc: "勾选产线允许订单仅含积分商品时直接下单兑换。",
  },
];

const SEQ_TO_TAB: Record<number, MenuOrderLimitTabId> = {
  [MENU_ORDER_LIMIT_DISH_MUTEX_SEQ]: "dish-round",
  [MENU_ORDER_LIMIT_DISH_COMBO_SEQ]: "dish-round",
  [GUEST_ORDER_PLACE_INTERVAL_SEQ]: "other",
  [GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ]: "other",
  [GUEST_MENU_ORDER_INTERVAL_SEQ]: "other",
  [GUEST_MENU_INTERVAL_ALLOW_CART_SEQ]: "other",
  [RULE_HIT_PASSWORD_AUTH_SEQ]: "other",
  [VIEWONLY_DISH_CART_SEQ]: "other",
  [VIEWONLY_DISH_AUTH_SEQ]: "other",
  [POINTS_DISH_AUTH_ORDER_SEQ]: "other",
  [MEMBER_POINTS_ONLY_ORDER_SEQ]: "other",
};

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
  if (
    path === `${MENU_ORDER_LIMITS_BASE}/dish-round` ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/dish-round/`) ||
    path === `${MENU_ORDER_LIMITS_BASE}/mutex` ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/mutex/`) ||
    path === `${MENU_ORDER_LIMITS_BASE}/combo` ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/combo/`)
  ) {
    return "dish-round";
  }
  if (
    path === `${MENU_ORDER_LIMITS_BASE}/other` ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/other/`) ||
    path === `${MENU_ORDER_LIMITS_BASE}/interval` ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/interval/`) ||
    path === `${MENU_ORDER_LIMITS_BASE}/auth` ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/auth/`) ||
    path === `${MENU_ORDER_LIMITS_BASE}/points` ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/points/`)
  ) {
    return "other";
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

function renderSettingTitleBlock(meta: SettingMeta): string {
  return renderSettingTitleWithHelpHtml({
    id: meta.seq,
    title: meta.title,
    sceneDesc: meta.sceneDesc,
    titleTag: "p",
    titleClass: "text-sm font-medium text-card-foreground",
  });
}

/** 其他设置规则默认开启、不展示总开关，配置面板始终展开可编辑。 */
function renderSettingBodyHtml(meta: SettingMeta): string {
  const on = true;
  switch (meta.seq) {
    case GUEST_ORDER_PLACE_INTERVAL_SEQ:
      ensureGuestOrderPlaceIntervalToggleMigrated();
      return renderGuestOrderPlaceIntervalPanelHtml(on);
    case GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ:
      return renderGuestOrderIntervalAllowCartPanelHtml(on);
    case GUEST_MENU_ORDER_INTERVAL_SEQ:
      ensureGuestMenuOrderIntervalToggleMigrated();
      return renderGuestMenuOrderIntervalPanelHtml(on);
    case GUEST_MENU_INTERVAL_ALLOW_CART_SEQ:
      return renderGuestMenuIntervalAllowCartPanelHtml(on);
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
  return `
    <li class="list-none py-4 first:pt-0 last:pb-0" data-module-setting-row-seq="${meta.seq}">
      ${renderSettingTitleBlock(meta)}
      <div data-menu-order-limit-setting-body="${meta.seq}">${body}</div>
    </li>`;
}

function renderTabBar(activeTab: MenuOrderLimitTabId): string {
  const tabs = TAB_ITEMS.map((tab) => {
    const isActive = tab.id === activeTab;
    const href = getMenuOrderLimitTabHref(tab.id);
    return `
      <a
        href="#${href}"
        role="tab"
        id="menu-order-limit-tab-${escapeHtml(tab.id)}"
        class="min-h-10 border-b-2 px-4 text-sm font-medium transition-colors ${
          isActive
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
        }"
        data-menu-order-limit-tab="${escapeHtml(tab.id)}"
        aria-selected="${isActive ? "true" : "false"}"
        aria-controls="menu-order-limit-panel-${escapeHtml(tab.id)}"
        ${isActive ? 'aria-current="page"' : ""}
      >${escapeHtml(tab.label)}</a>`;
  }).join("");

  return `
    <div
      class="flex shrink-0 gap-1 border-b border-border"
      role="tablist"
      aria-label="菜单下单限制类型"
      data-menu-order-limit-tablist
    >
      ${tabs}
    </div>`;
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

function renderDishRoundTabPanel(activeTab: MenuOrderLimitTabId): string {
  if (activeTab !== "dish-round") return "";
  return `
    <section
      id="menu-order-limit-panel-dish-round"
      role="tabpanel"
      aria-labelledby="menu-order-limit-tab-dish-round"
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      data-menu-order-limit-panel="dish-round"
    >
      ${renderDishRoundUnifiedWorkspaceHtml({
        mutexSeq: MENU_ORDER_LIMIT_DISH_MUTEX_SEQ,
        comboSeq: MENU_ORDER_LIMIT_DISH_COMBO_SEQ,
        mutexStorageId: MENU_ORDER_LIMIT_DISH_MUTEX_STORAGE_ID,
        comboStorageId: MENU_ORDER_LIMIT_DISH_COMBO_STORAGE_ID,
      })}
    </section>`;
}

type SettingsSection = { title: string; desc: string; settings: SettingMeta[] };

const OTHER_SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: "下单时间间隔",
    desc: "配置订单级与菜品级提交间隔，以及间隔内是否允许加购及授权触发条件。",
    settings: INTERVAL_SETTINGS,
  },
  {
    title: "命中后授权",
    desc: "配置限制命中后的统一授权方式，以及「可看不可点」菜品在购物车中的行为。",
    settings: AUTH_SETTINGS,
  },
  {
    title: "积分菜限制",
    desc: "配置积分菜兑换授权与纯积分订单是否允许直接下单。",
    settings: POINTS_SETTINGS,
  },
];

function renderOtherSettingsTabPanel(activeTab: MenuOrderLimitTabId): string {
  if (activeTab !== "other") return "";
  const sections = OTHER_SETTINGS_SECTIONS.map((section) => {
    const rows = section.settings.map((meta) => renderSettingListRow(meta)).join("");
    return `
      <section class="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
        <div class="min-w-0">
          <h3 class="m-0 text-sm font-semibold text-card-foreground">${escapeHtml(section.title)}</h3>
          <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">${escapeHtml(section.desc)}</p>
        </div>
        <ul class="m-0 mt-4 list-none divide-y divide-border p-0">${rows}</ul>
      </section>`;
  }).join("");

  return `
    <section
      id="menu-order-limit-panel-other"
      role="tabpanel"
      aria-labelledby="menu-order-limit-tab-other"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
      data-menu-order-limit-panel="other"
    >
      <div class="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-0.5">
        ${sections}
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
  /* Tab 对齐分类管理样式后仅展示名称，不再渲染状态徽标 */
}

const MENU_ORDER_LIMIT_TAB_ORDER: MenuOrderLimitTabId[] = ["quantity", "dish-round", "other"];

/** 绑定 Tab 点击与键盘切换；由 main 传入路由跳转（replaceHashPath + mount）。 */
export function bindFohMenuOrderLimitsUi(remountToTab: (tab: MenuOrderLimitTabId) => void): void {
  const root = document.querySelector<HTMLElement>("[data-foh-menu-order-limits-root]");
  if (!root || root.getAttribute("data-foh-menu-limits-bound") === "1") return;
  root.setAttribute("data-foh-menu-limits-bound", "1");
  bindModuleSettingSceneDescHelp(root);
  bindDishRoundUnifiedWorkspace(root);

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
      ${renderTabBar(activeTab)}

      <div class="flex min-h-[min(72vh,720px)] flex-1 flex-col" data-menu-order-limit-panels>
        ${renderQuantityPanel(iframeSrc, activeTab)}
        ${renderDishRoundTabPanel(activeTab)}
        ${renderOtherSettingsTabPanel(activeTab)}
      </div>
    </div>`;
}
