/**
 * 云产品入口：侧栏「云产品」标签 + 点击提示（通过路由配置接入）。
 * 一级按 NAV_MODULES id；二级按 child id / 路由前缀。
 */
import { t } from "../i18n";

interface CloudProductNotice {
  title: string;
  message: string;
}

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

/** 点击一级导航即提示的中心 */
const NAV_MODULE_NOTICES: Record<string, CloudProductNotice> = {
  "product-center-main": { title: "商品中心", message: "云产品-商品中心-通过路由配置" },
  members: { title: "会员中心", message: "云产品-会员中心-通过路由配置" },
  reviews: { title: "评价中心", message: "云产品-评价中心-通过路由配置" },
  reservations: { title: "预约等位中心", message: "云产品-云等位-通过路由配置" },
  "reports-finance": { title: "报表中心", message: "云产品-云报表-通过路由配置" },
  "gift-cards": { title: "礼品卡中心", message: "云产品-E-Card-通过路由配置" },
};

/** 点击二级入口才提示的页面（不含仅打标签的小费/薪资/员工报表） */
const NAV_PATH_NOTICES: Record<string, CloudProductNotice> = {
  "/promotions/campaigns": { title: "促销活动", message: "云产品-促销中心-通过路由配置" },
  "/print-templates/decoration": { title: "打印装修", message: "云产品-打印模板-通过路由配置" },
  "/marketing/campaigns": { title: "营销活动", message: "云产品-营销活动-通过路由配置" },
  "/marketing/manual": { title: "手动营销", message: "云产品-营销活动-通过路由配置" },
  "/marketing/screensaver": { title: "屏保", message: "云产品-云屏保-通过路由配置" },
  "/notifications/templates": { title: "消息模板", message: "云产品-消息中心-通过路由配置" },
  "/notifications/scene-config": { title: "消息配置", message: "云产品-消息中心-通过路由配置" },
  "/notifications/quota": { title: "消息额度", message: "云产品-消息中心-通过路由配置" },
};

let activeNotice: CloudProductNotice | null = null;
let clickDelegateBound = false;

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

function matchPathNotice(path: string): CloudProductNotice | null {
  for (const [prefix, notice] of Object.entries(NAV_PATH_NOTICES)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return notice;
  }
  return null;
}

function resolveNoticeFromClick(target: HTMLElement): CloudProductNotice | null {
  const link = target.closest<HTMLAnchorElement>('a[href^="#/"]');
  if (link) {
    const pathNotice = matchPathNotice(link.getAttribute("href")!.slice(1));
    if (pathNotice) return pathNotice;
  }
  const moduleRow = target.closest<HTMLElement>("[data-nav-module]");
  const moduleId = moduleRow?.getAttribute("data-nav-module") ?? "";
  return NAV_MODULE_NOTICES[moduleId] ?? null;
}

export function renderCloudProductRouteNoticeDialog(): string {
  if (!activeNotice) return "";
  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" data-cloud-product-notice-dialog role="dialog" aria-modal="true" aria-labelledby="cloud-product-notice-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-cloud-product-notice-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 id="cloud-product-notice-title" class="text-base font-semibold">${escapeHtml(activeNotice.title)}</h2>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">${escapeHtml(activeNotice.message)}</p>
        <div class="mt-5 flex justify-end">
          <button type="button" data-cloud-product-notice-close class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">知道了</button>
        </div>
      </div>
    </div>`;
}

export function bindCloudProductRouteNoticeUi(remount: () => void): void {
  if (!clickDelegateBound) {
    clickDelegateBound = true;
    // 捕获阶段仅记录待提示内容；重挂载延后到导航 / 滑层自身处理完成之后
    document.addEventListener(
      "click",
      (e) => {
        const target = e.target as HTMLElement | null;
        if (!target || target.closest("[data-cloud-product-notice-dialog]")) return;
        const notice = resolveNoticeFromClick(target);
        if (!notice) return;
        activeNotice = notice;
        setTimeout(remount, 0);
      },
      true,
    );
  }

  const dialog = document.querySelector<HTMLElement>("[data-cloud-product-notice-dialog]");
  if (!dialog || dialog.dataset.cloudProductNoticeBound === "1") return;
  dialog.dataset.cloudProductNoticeBound = "1";

  const close = () => {
    activeNotice = null;
    remount();
  };
  dialog.querySelector("[data-cloud-product-notice-backdrop]")?.addEventListener("click", close);
  dialog.querySelector("[data-cloud-product-notice-close]")?.addEventListener("click", close);
}
