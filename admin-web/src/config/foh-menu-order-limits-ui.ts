import { MENU_ORDER_OTHER_SETTINGS_PATH, MENU_ORDER_OTHER_SETTINGS_SECTIONS as OTHER_SETTINGS_SECTIONS } from './menu-order-other-settings-navigation';
import { renderSettingsCategoryLayout, bindSettingsCategoryLayouts } from './settings-category-layout';
type SettingMeta = { seq: number; title: string; sceneDesc: string };
/**
 * 前厅 · 菜单下单限制业务页：独立 hash 子路由，集中维护下单限制与命中后授权。
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
import { bindRuleIframeFullscreen, releaseRuleIframeFullscreen } from "./rule-iframe-fullscreen";

export const MENU_ORDER_LIMITS_BASE = "/operations/queue-call/menu-order-limits";

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

function renderQuantityPanel(iframeSrc: string, activeTab: MenuOrderLimitTabId): string {
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
      aria-label="每轮菜品互斥/组合"
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
  const sections = OTHER_SETTINGS_SECTIONS.map((section) => {
    const rows = section.settings.map((meta) => renderSettingListRow(meta)).join("");
    return `
      <section id="menu-order-other-${section.key}" class="rounded-xl border border-border bg-card px-4 py-4 shadow-sm" data-menu-order-other-category="${section.key}">
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
      role="region"
      aria-label="其他设置"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
      data-menu-order-limit-panel="other"
    >
      ${renderSettingsCategoryLayout(MENU_ORDER_OTHER_SETTINGS_PATH, OTHER_SETTINGS_SECTIONS.map(section=>({...section,targetId:`menu-order-other-${section.key}`})), sections)}
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

/** Bind the existing business controls; navigation lives in the shared sidebar. */
export function bindFohMenuOrderLimitsUi(): void {
  const root = document.querySelector<HTMLElement>("[data-foh-menu-order-limits-root]");
  if (!root || root.getAttribute("data-foh-menu-limits-bound") === "1") return;
  root.setAttribute("data-foh-menu-limits-bound", "1");
  bindModuleSettingSceneDescHelp(root);
  bindSettingsCategoryLayouts(root);
  bindDishRoundUnifiedWorkspace(root);
  bindOrderLimitFullscreenFlow(root);
}

export function renderFohMenuOrderLimitsPanel(iframeSrc: string, path: string): string {
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
