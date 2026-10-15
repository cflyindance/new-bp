/**
 * 云产品入口：仅提供侧栏产品归属标签，不弹出路由配置提示。
 * 一级按 NAV_MODULES id；二级按 child id / 路由前缀。
 */
import { t } from "../i18n";

/** 一级导航打「云产品」标签 */
export const CLOUD_PRODUCT_NAV_MODULE_IDS = [
  "product-center-main",
  "waitlist",
  "promotions",
  "members",
  "reviews",
  "reservations",
  "reports-finance",
  "gift-cards",
] as const;

/** 一级导航打「部分-云产品」标签（仅部分二级为云产品） */
export const PARTIAL_CLOUD_PRODUCT_NAV_MODULE_IDS = [
  "marketing",
  "print-templates",
  "notifications",
] as const;

/** 一级导航打「非MVP版本」标签 */
export const NON_MVP_NAV_MODULE_IDS = [
  "group-store-list",
  "brand-store-list",
  "inventory-ordering",
  "device-management",
  "asset-center",
  "log-management",
] as const;

/** 二级导航打「非MVP版本」标签 */
export const NON_MVP_NAV_CHILD_IDS = [
  "team-training",
  "team-settings",
  "set-locale-display",
  "set-data-backup",
  "set-connections",
  "set-advanced",
  "set-platform-preset",
] as const;

/** 二级导航打「云产品」标签（侧滑 / 可折叠树） */
export const CLOUD_PRODUCT_NAV_CHILD_IDS = [
  "promo-campaigns",
  "pt-decoration",
  "mkt-campaigns",
  "mkt-manual",
  "mkt-screensaver",
  "notif-templates",
  "notif-scene-config",
  "notif-quota",
  "team-tips",
  "team-tax-payroll",
  "team-reports",
] as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isCloudProductNavModule(moduleId: string): boolean {
  return (CLOUD_PRODUCT_NAV_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function isPartialCloudProductNavModule(moduleId: string): boolean {
  return (PARTIAL_CLOUD_PRODUCT_NAV_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function isNonMvpNavModule(moduleId: string): boolean {
  return (NON_MVP_NAV_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function isNonMvpNavChild(childId: string): boolean {
  return (NON_MVP_NAV_CHILD_IDS as readonly string[]).includes(childId);
}

export function isCloudProductNavChild(childId: string): boolean {
  return (CLOUD_PRODUCT_NAV_CHILD_IDS as readonly string[]).includes(childId);
}

/** 侧栏「云产品」小标签 HTML */
export function renderCloudProductBadgeHtml(): string {
  return `<span class="ml-1 shrink-0 rounded bg-sky-500/15 px-1 py-px text-[10px] font-medium leading-none text-sky-700 dark:bg-sky-400/20 dark:text-sky-300" data-cloud-product-badge>${escapeHtml(t("badge.cloudProduct"))}</span>`;
}

/** 侧栏「部分-云产品」小标签 HTML */
export function renderPartialCloudProductBadgeHtml(): string {
  return `<span class="ml-1 shrink-0 rounded bg-amber-500/15 px-1 py-px text-[10px] font-medium leading-none text-amber-800 dark:bg-amber-400/20 dark:text-amber-200" data-cloud-product-badge="partial">${escapeHtml(t("badge.cloudProductPartial"))}</span>`;
}

/** 侧栏「非MVP版本」小标签 HTML */
export function renderNonMvpBadgeHtml(): string {
  return `<span class="ml-1 shrink-0 rounded bg-rose-500/15 px-1 py-px text-[10px] font-medium leading-none text-rose-700 dark:bg-rose-400/20 dark:text-rose-300" data-non-mvp-badge>${escapeHtml(t("badge.nonMvp"))}</span>`;
}

export function cloudProductBadgeForNavModule(moduleId: string): string {
  if (isCloudProductNavModule(moduleId)) return renderCloudProductBadgeHtml();
  if (isPartialCloudProductNavModule(moduleId)) return renderPartialCloudProductBadgeHtml();
  if (isNonMvpNavModule(moduleId)) return renderNonMvpBadgeHtml();
  return "";
}

export function cloudProductBadgeForNavChild(childId: string): string {
  if (isCloudProductNavChild(childId)) return renderCloudProductBadgeHtml();
  if (isNonMvpNavChild(childId)) return renderNonMvpBadgeHtml();
  return "";
}
