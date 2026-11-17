import {
  renderOrderSettingsCards,
  bindOrderSettingsCards,
} from "./order-settings-cards";
/**
 * 前厅 · 菜单下单限制业务页：独立 hash 子路由，集中维护下单限制与命中后授权。
 */

import {
  renderDishRoundUnifiedWorkspaceHtml,
  bindDishRoundUnifiedWorkspace,
} from "./module-settings-dish-rules-ui";
import { GUEST_MENU_ORDER_INTERVAL_SEQ } from "./module-settings-guest-menu-order-interval-ui";
import { GUEST_MENU_INTERVAL_ALLOW_CART_SEQ } from "./module-settings-guest-menu-interval-allow-cart-ui";
import { GUEST_ORDER_PLACE_INTERVAL_SEQ } from "./module-settings-guest-order-place-interval-ui";
import { GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ } from "./module-settings-guest-order-interval-allow-cart-ui";
import { MEMBER_POINTS_ONLY_ORDER_SEQ } from "./module-settings-member-points-rewards-ui";
import { POINTS_DISH_AUTH_ORDER_SEQ } from "./module-settings-points-dish-auth-order-ui";
import { RULE_HIT_PASSWORD_AUTH_SEQ } from "./module-settings-rule-hit-password-auth-ui";
import {
  VIEWONLY_DISH_AUTH_SEQ,
  VIEWONLY_DISH_CART_SEQ,
} from "./module-settings-viewonly-dish-rules-ui";
import { bindModuleSettingSceneDescHelp } from "./module-settings-scene-desc-help-ui";
import {
  bindRuleIframeFullscreen,
  releaseRuleIframeFullscreen,
} from "./rule-iframe-fullscreen";

export const MENU_ORDER_LIMITS_BASE =
  "/operations/queue-call/menu-order-limits";

export const MENU_ORDER_LIMIT_DISH_MUTEX_SEQ = 597;
export const MENU_ORDER_LIMIT_DISH_COMBO_SEQ = 598;
export const MENU_ORDER_LIMIT_DISH_MUTEX_STORAGE_ID = "597-mutex-rules";
export const MENU_ORDER_LIMIT_DISH_COMBO_STORAGE_ID = "598-combo-rules";

export type MenuOrderLimitTabId = "quantity" | "dish-round" | "other";

const ORDER_LIMIT_FULLSCREEN_PAGES = new Set([
  "order-limit-rule-editor.html",
  "order-limit-store-select.html",
  "order-limit-publish-confirm.html",
]);
const ORDER_LIMIT_LIST_PAGE = "order-limit.html";
let menuOrderLimitFullscreenTeardown: (() => void) | null = null;

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

export function releaseFohMenuOrderLimitsFullscreen(): void {
  menuOrderLimitFullscreenTeardown?.();
  menuOrderLimitFullscreenTeardown = null;
  releaseRuleIframeFullscreen();
}

function bindOrderLimitFullscreenFlow(root: HTMLElement): void {
  menuOrderLimitFullscreenTeardown?.();
  menuOrderLimitFullscreenTeardown = bindRuleIframeFullscreen(root, {
    frameSelector: "[data-menu-order-limit-frame]",
    fullscreenPages: ORDER_LIMIT_FULLSCREEN_PAGES,
    listPage: ORDER_LIMIT_LIST_PAGE,
  });
}

export function isMenuOrderLimitsPath(path: string): boolean {
  return (
    path === MENU_ORDER_LIMITS_BASE ||
    path.startsWith(`${MENU_ORDER_LIMITS_BASE}/`)
  );
}

export function resolveMenuOrderLimitTabFromPath(
  path: string,
): MenuOrderLimitTabId {
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

export function getMenuOrderLimitTabForSeq(
  seq: number,
): MenuOrderLimitTabId | null {
  return SEQ_TO_TAB[seq] ?? null;
}

function renderQuantityPanel(
  iframeSrc: string,
  activeTab: MenuOrderLimitTabId,
): string {
  if (activeTab !== "quantity") return "";
  return `
    <section
      id="menu-order-limit-panel-quantity"
      role="region"
      aria-label="数量与频次限制"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
      data-menu-order-limit-panel="quantity"
    >
      <iframe
        title="数量与频次限制规则设计器"
        class="block min-h-0 w-full flex-1 border-0"
        src="${escapeHtml(iframeSrc)}"
        data-menu-order-limit-frame
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
      role="region"
      aria-label="菜品搭配"
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

function renderOtherSettingsTabPanel(activeTab: MenuOrderLimitTabId): string {
  if (activeTab !== "other") return "";
  return `<section id="menu-order-limit-panel-other" aria-label="下单设置" class="flex min-h-0 flex-1 flex-col overflow-hidden" data-menu-order-limit-panel="other">${renderOrderSettingsCards()}</section>`;
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

/** Bind the existing business controls; navigation lives in the shared sidebar. */
export function bindFohMenuOrderLimitsUi(): void {
  const root = document.querySelector<HTMLElement>(
    "[data-foh-menu-order-limits-root]",
  );
  if (!root || root.getAttribute("data-foh-menu-limits-bound") === "1") return;
  root.setAttribute("data-foh-menu-limits-bound", "1");
  bindOrderSettingsCards(root);
  bindModuleSettingSceneDescHelp(root);
  bindDishRoundUnifiedWorkspace(root);
  bindOrderLimitFullscreenFlow(root);
}

export function renderFohMenuOrderLimitsPanel(
  iframeSrc: string,
  path: string,
): string {
  const activeTab = resolveMenuOrderLimitTabFromPath(path);

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-foh-menu-order-limits-root>


      <div class="flex min-h-[min(72vh,720px)] flex-1 flex-col" data-menu-order-limit-panels>
        ${renderQuantityPanel(iframeSrc, activeTab)}
        ${renderDishRoundTabPanel(activeTab)}
        ${renderOtherSettingsTabPanel(activeTab)}
      </div>
    </div>`;
}
