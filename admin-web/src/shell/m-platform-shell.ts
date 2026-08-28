/**
 * M 平台 · 精简 Shell（企业级配置）
 */
import { t } from "../i18n";
import {
  ENTERPRISE_PLATFORM_PRESET_SCOPE,
  getPresetScopeForPath,
  isMPlatformPresetPath,
} from "../config/platform-preset-scope";
import {
  bindPlatformPreset,
  findPlatformPresetPageTitle,
  renderPlatformPresetPage,
} from "../config/platform-preset-ui";
import {
  bindNavBlueprint,
  findNavBlueprintPageTitle,
  isNavBlueprintPath,
  renderNavBlueprintPage,
  NAV_BLUEPRINT_ROUTE_PREFIX,
} from "../config/nav-blueprint-ui";
import {
  ENTERPRISE_RBAC_SCOPE,
  findRbacPageTitle,
  isMPlatformPermissionsPath,
  rbacHref,
} from "../permissions/rbac-scope";
import { bindPermissionsRbac, renderPermissionsRbacPage } from "../permissions/rbac-ui";
import { bindStaffAccountsPage, renderStaffAccountsPage } from "../permissions/staff-accounts-ui";
import {
  findSubscriptionAdminPageTitle,
  isAnySubscriptionAdminPath,
  isMerchantSubscriptionsPath,
  isSubscriptionServiceCreatePath,
  isSubscriptionServicePath,
  MERCHANT_SUBSCRIPTIONS_PATH,
  SUBSCRIPTION_SERVICE_ROUTE_PREFIX,
} from "../config/subscription-service-scope";
import { bindSubscriptionServicePage, renderSubscriptionServicePage } from "../config/subscription-service-ui";
import {
  ENTERPRISE_HARDWARE_ROUTE_PREFIX,
  findHardwarePageTitle,
  hardwareHref,
  isEnterpriseDeviceDetailPath,
  isEnterpriseDevicesByTypePath,
  isMPlatformHardwarePath,
} from "../config/enterprise-hardware-scope";
import { bindEnterpriseHardware, renderEnterpriseHardwarePage } from "../config/enterprise-hardware-ui";
import {
  ENTERPRISE_MERCHANT_ROUTE_PREFIX,
  findMerchantPageTitle,
  isGroupMgmtPath,
  isMPlatformMerchantPath,
  merchantHref,
  parseMerchantDetailPath,
} from "../config/enterprise-merchant-scope";
import { bindEnterpriseMerchant, renderEnterpriseMerchantPage } from "../config/enterprise-merchant-ui";
import { consumeMPlatformEntryNoticePending, exitMPlatformShell } from "./app-shell-mode";
import { showMPlatformEntryNoticeDialog } from "./m-platform-entry-notice-dialog";
import { bindViewSwitchControl } from "./view-switch-control";
import { mountDemoSwitchFab } from "./demo-switch-control";

export const M_PLATFORM_PRESET_PATH = "/m-platform/platform-preset";
export const M_PLATFORM_PERMISSIONS_PATH = "/m-platform/permissions/overview";
const M_PLATFORM_PERMISSIONS_NAV_EXPANDED_KEY = "menusifu:m-platform-permissions-nav-expanded";
const M_PLATFORM_PERMISSIONS_SUBNAV_ID = "m-platform-permissions-subnav";
const M_PLATFORM_HARDWARE_NAV_EXPANDED_KEY = "menusifu:m-platform-hardware-nav-expanded";
const M_PLATFORM_HARDWARE_SUBNAV_ID = "m-platform-hardware-subnav";
const M_PLATFORM_MERCHANTS_NAV_EXPANDED_KEY = "menusifu:m-platform-merchants-nav-expanded";
const M_PLATFORM_MERCHANTS_SUBNAV_ID = "m-platform-merchants-subnav";

export { NAV_BLUEPRINT_ROUTE_PREFIX } from "../config/nav-blueprint-ui";

export function isMPlatformContentPath(path: string): boolean {
  return (
    isMPlatformPresetPath(path) ||
    isNavBlueprintPath(path) ||
    isMPlatformPermissionsPath(path) ||
    isMPlatformHardwarePath(path) ||
    isMPlatformMerchantPath(path)
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readPermissionsNavExpanded(path: string): boolean {
  try {
    const stored = sessionStorage.getItem(M_PLATFORM_PERMISSIONS_NAV_EXPANDED_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    /* ignore */
  }
  return isMPlatformPermissionsPath(path) && !isAnySubscriptionAdminPath(path);
}

function readHardwareNavExpanded(path: string): boolean {
  try {
    const stored = sessionStorage.getItem(M_PLATFORM_HARDWARE_NAV_EXPANDED_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    /* ignore */
  }
  return isMPlatformHardwarePath(path);
}

function readMerchantsNavExpanded(path: string): boolean {
  try {
    const stored = sessionStorage.getItem(M_PLATFORM_MERCHANTS_NAV_EXPANDED_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    /* ignore */
  }
  return isMPlatformMerchantPath(path);
}

function renderMerchantsNav(path: string): string {
  const merchantsActive = isMPlatformMerchantPath(path);
  const expanded = readMerchantsNavExpanded(path);
  const l1Class = merchantsActive
    ? "flex min-h-10 w-full items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
    : "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/60";

  const subLinkClass = (subpath: string) => {
    const full = subpath ? `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}${subpath}` : ENTERPRISE_MERCHANT_ROUTE_PREFIX;
    const active =
      path === full ||
      (subpath === "/overview" && path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/overview`) ||
      (subpath === "/groups" && isGroupMgmtPath(path)) ||
      (subpath === "/stores" && path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/stores`) ||
      (subpath === "" &&
        (path === ENTERPRISE_MERCHANT_ROUTE_PREFIX ||
          !!parseMerchantDetailPath(path) ||
          path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/new`));
    return active
      ? "flex min-h-9 items-center rounded-lg bg-primary/10 pl-6 pr-3 py-1.5 text-sm font-medium text-primary"
      : "flex min-h-9 items-center rounded-lg pl-6 pr-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/60";
  };

  const items = [
    { sub: "/overview", label: t("shell.mPlatformNavMerchantOverview") },
    { sub: "/groups", label: t("shell.mPlatformNavMerchantGroups") },
    { sub: "", label: t("shell.mPlatformNavMerchantList") },
    { sub: "/stores", label: t("shell.mPlatformNavMerchantStores") },
    { sub: "/org-tree", label: t("shell.mPlatformNavMerchantOrgTree") },
    { sub: "/requests", label: t("shell.mPlatformNavMerchantRequests") },
    { sub: "/reports", label: t("shell.mPlatformNavMerchantReports") },
    { sub: "/change-log", label: t("shell.mPlatformNavMerchantChangelog") },
  ];

  return `
    <li>
      <button
        type="button"
        data-m-platform-merchants-toggle
        class="${l1Class}"
        aria-expanded="${expanded ? "true" : "false"}"
        aria-controls="${M_PLATFORM_MERCHANTS_SUBNAV_ID}"
        aria-label="${escapeHtml(t("shell.mPlatformNavMerchantsToggle"))}"
      >
        <span class="min-w-0 flex-1 truncate text-left">${escapeHtml(t("shell.mPlatformNavMerchants"))}</span>
        <span
          data-m-platform-merchants-chevron
          class="shrink-0 text-xs text-muted-foreground transition-transform duration-200 ${expanded ? "" : "-rotate-90"}"
          aria-hidden="true"
        >▼</span>
      </button>
      <ul
        id="${M_PLATFORM_MERCHANTS_SUBNAV_ID}"
        class="mt-0.5 space-y-0.5 ${expanded ? "" : "hidden"}"
        role="list"
        ${expanded ? "" : 'aria-hidden="true"'}
      >
        ${items
          .map(
            (item) => `<li>
          <a href="${merchantHref(item.sub)}" class="${subLinkClass(item.sub)}" tabindex="${expanded ? "0" : "-1"}">${escapeHtml(item.label)}</a>
        </li>`,
          )
          .join("")}
      </ul>
    </li>`;
}

function renderHardwareNav(path: string): string {
  const hardwareActive = isMPlatformHardwarePath(path);
  const expanded = readHardwareNavExpanded(path);
  const l1Class = hardwareActive
    ? "flex min-h-10 w-full items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
    : "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/60";

  const subLinkClass = (subpath: string) => {
    const full = `${ENTERPRISE_HARDWARE_ROUTE_PREFIX}${subpath}`;
    const active =
      path === full ||
      (subpath === "/overview" &&
        (path === ENTERPRISE_HARDWARE_ROUTE_PREFIX || path === `${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/overview`)) ||
      (subpath === "/devices" &&
        (path === full || isEnterpriseDevicesByTypePath(path) || isEnterpriseDeviceDetailPath(path)));
    return active
      ? "flex min-h-9 items-center rounded-lg bg-primary/10 pl-6 pr-3 py-1.5 text-sm font-medium text-primary"
      : "flex min-h-9 items-center rounded-lg pl-6 pr-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/60";
  };

  const items = [
    { sub: "/overview", label: t("shell.mPlatformNavHwOverview") },
    { sub: "/devices", label: t("shell.mPlatformNavHwDevices") },
    { sub: "/alerts", label: t("shell.mPlatformNavHwAlerts") },
  ];

  return `
    <li>
      <button
        type="button"
        data-m-platform-hardware-toggle
        class="${l1Class}"
        aria-expanded="${expanded ? "true" : "false"}"
        aria-controls="${M_PLATFORM_HARDWARE_SUBNAV_ID}"
        aria-label="${escapeHtml(t("shell.mPlatformNavHardwareToggle"))}"
      >
        <span class="min-w-0 flex-1 truncate text-left">${escapeHtml(t("shell.mPlatformNavHardware"))}</span>
        <span
          data-m-platform-hardware-chevron
          class="shrink-0 text-xs text-muted-foreground transition-transform duration-200 ${expanded ? "" : "-rotate-90"}"
          aria-hidden="true"
        >▼</span>
      </button>
      <ul
        id="${M_PLATFORM_HARDWARE_SUBNAV_ID}"
        class="mt-0.5 space-y-0.5 ${expanded ? "" : "hidden"}"
        role="list"
        ${expanded ? "" : 'aria-hidden="true"'}
      >
        ${items
          .map(
            (item) => `<li>
          <a href="${hardwareHref(item.sub)}" class="${subLinkClass(item.sub)}" tabindex="${expanded ? "0" : "-1"}">${escapeHtml(item.label)}</a>
        </li>`,
          )
          .join("")}
      </ul>
    </li>`;
}

function renderPermissionsNav(path: string): string {
  const prefix = ENTERPRISE_RBAC_SCOPE.routePrefix;
  const permissionsActive = isMPlatformPermissionsPath(path) && !isAnySubscriptionAdminPath(path);
  const expanded = readPermissionsNavExpanded(path);
  const l1Class = permissionsActive
    ? "flex min-h-10 w-full items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
    : "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/60";

  const subLinkClass = (subpath: string) => {
    const full = `${prefix}${subpath}`;
    const active = path === full || (subpath === "/overview" && path === prefix);
    return active
      ? "flex min-h-9 items-center rounded-lg bg-primary/10 pl-6 pr-3 py-1.5 text-sm font-medium text-primary"
      : "flex min-h-9 items-center rounded-lg pl-6 pr-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/60";
  };

  const items = [
    { sub: "/overview", label: t("shell.mPlatformNavPermOverview") },
    { sub: "/roles", label: t("shell.mPlatformNavPermRoles") },
    { sub: "/staff", label: t("shell.mPlatformNavPermStaff") },
    { sub: "/staff-accounts", label: t("shell.mPlatformNavPermAccounts") },
    { sub: "/change-log", label: t("shell.mPlatformNavPermChangelog") },
  ];

  return `
    <li>
      <button
        type="button"
        data-m-platform-permissions-toggle
        class="${l1Class}"
        aria-expanded="${expanded ? "true" : "false"}"
        aria-controls="${M_PLATFORM_PERMISSIONS_SUBNAV_ID}"
        aria-label="${escapeHtml(t("shell.mPlatformNavPermissionsToggle"))}"
      >
        <span class="min-w-0 flex-1 truncate text-left">${escapeHtml(t("shell.mPlatformNavPermissions"))}</span>
        <span
          data-m-platform-permissions-chevron
          class="shrink-0 text-xs text-muted-foreground transition-transform duration-200 ${expanded ? "" : "-rotate-90"}"
          aria-hidden="true"
        >▼</span>
      </button>
      <ul
        id="${M_PLATFORM_PERMISSIONS_SUBNAV_ID}"
        class="mt-0.5 space-y-0.5 ${expanded ? "" : "hidden"}"
        role="list"
        ${expanded ? "" : 'aria-hidden="true"'}
      >
        ${items
          .map(
            (item) => `<li>
          <a href="${rbacHref(ENTERPRISE_RBAC_SCOPE, item.sub)}" class="${subLinkClass(item.sub)}" tabindex="${expanded ? "0" : "-1"}">${escapeHtml(item.label)}</a>
        </li>`,
          )
          .join("")}
      </ul>
    </li>`;
}

export function renderMPlatformSidebar(path: string): string {
  const presetActive = isMPlatformPresetPath(path);
  const blueprintActive = isNavBlueprintPath(path);
  const subscriptionServiceActive = isSubscriptionServicePath(path);
  const merchantSubscriptionsActive = isMerchantSubscriptionsPath(path);
  const linkClass = (active: boolean) =>
    active
      ? "flex min-h-10 items-center rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
      : "flex min-h-10 items-center rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/60";

  return `
    <aside class="flex w-full min-h-0 shrink-0 flex-col border-r border-border bg-card sm:w-56 lg:w-64">
      <div class="border-b border-border px-4 py-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">${escapeHtml(t("shell.mPlatformKicker"))}</p>
        <p class="mt-1 text-sm font-semibold text-card-foreground">${escapeHtml(t("shell.mPlatformTitle"))}</p>
      </div>
      <nav class="min-h-0 flex-1 overflow-y-auto p-3" aria-label="${escapeHtml(t("shell.mPlatformNavAria"))}">
        <ul class="space-y-0.5" role="list">
          <li>
            <a href="#${NAV_BLUEPRINT_ROUTE_PREFIX}" class="${linkClass(blueprintActive)}">${escapeHtml(t("shell.mPlatformNavBlueprint"))}</a>
          </li>
          <li>
            <a href="#${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}" class="${linkClass(subscriptionServiceActive)}">服务包管理</a>
          </li>
          <li>
            <a href="#${MERCHANT_SUBSCRIPTIONS_PATH}" class="${linkClass(merchantSubscriptionsActive)}">商家订阅</a>
          </li>
          <li>
            <a href="#${M_PLATFORM_PRESET_PATH}" class="${linkClass(presetActive)}">${escapeHtml(t("shell.mPlatformNavPreset"))}</a>
          </li>
          ${renderPermissionsNav(path)}
          ${renderMerchantsNav(path)}
          ${renderHardwareNav(path)}
        </ul>
      </nav>
      <div class="border-t border-border p-3">
        <button
          type="button"
          data-exit-m-platform
          class="flex w-full min-h-10 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >${escapeHtml(t("shell.mPlatformBackToMerchant"))}</button>
      </div>
    </aside>`;
}

function resolveMPlatformPageTitle(path: string): { title: string; module: string } {
  return (
    findNavBlueprintPageTitle(path) ??
    findSubscriptionAdminPageTitle(path) ??
    findRbacPageTitle(path, ENTERPRISE_RBAC_SCOPE) ??
    findHardwarePageTitle(path) ??
    findMerchantPageTitle(path) ??
    findPlatformPresetPageTitle(path, getPresetScopeForPath(path)) ?? {
      title: t("shell.mPlatformTitle"),
      module: t("shell.mPlatformKicker"),
    }
  );
}

function renderMPlatformHeader(path: string): string {
  const titleInfo = resolveMPlatformPageTitle(path);
  const title = titleInfo.title;
  const kicker = titleInfo.module;

  return `
    <header class="z-40 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:flex-nowrap sm:gap-4 sm:py-0">
      <div class="min-w-0">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">${escapeHtml(kicker)}</p>
        <h1 id="main-content" tabindex="-1" class="truncate text-lg font-semibold tracking-tight text-card-foreground">${escapeHtml(title)}</h1>
      </div>
      <div class="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
        <button
          type="button"
          data-exit-m-platform
          class="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:h-10"
        >${escapeHtml(t("shell.mPlatformBackToMerchant"))}</button>
        <button type="button" id="theme-toggle" class="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:size-11" aria-label="${escapeHtml(t("header.themeToggle"))}">
          <svg class="size-5 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          <svg class="size-5 hidden dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        </button>
      </div>
    </header>`;
}

function renderMPlatformContent(path: string): string {
  if (isNavBlueprintPath(path)) return renderNavBlueprintPage(path);
  if (isAnySubscriptionAdminPath(path)) return renderSubscriptionServicePage(path);
  if (isMPlatformPermissionsPath(path)) {
    if (path === `${ENTERPRISE_RBAC_SCOPE.routePrefix}/staff-accounts`) {
      return renderStaffAccountsPage(ENTERPRISE_RBAC_SCOPE);
    }
    return renderPermissionsRbacPage(path, ENTERPRISE_RBAC_SCOPE);
  }
  if (isMPlatformHardwarePath(path)) {
    return renderEnterpriseHardwarePage(path);
  }
  if (isMPlatformMerchantPath(path)) {
    return renderEnterpriseMerchantPage(path);
  }
  return renderPlatformPresetPage(path, ENTERPRISE_PLATFORM_PRESET_SCOPE);
}

function renderMPlatformMain(path: string): string {
  return `
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      ${renderMPlatformHeader(path)}
      <main class="min-h-0 flex-1 flex flex-col overflow-hidden p-4 md:p-6 animate-fade-in">
        <div class="mx-auto flex w-full min-h-0 flex-1 flex-col max-w-[90rem]">
          <div role="tabpanel" class="min-h-0 flex-1 flex flex-col overflow-hidden">
            ${renderMPlatformContent(path)}
          </div>
        </div>
      </main>
    </div>`;
}

export function mountMPlatformShell(_onMount: () => void, path: string): string {
  if (isSubscriptionServiceCreatePath(path)) {
    return `<div class="relative h-dvh min-h-0 w-full overflow-hidden">${renderSubscriptionServicePage(path)}</div>`;
  }
  return `
    <div class="relative h-dvh min-h-0 w-full overflow-hidden">
      <div class="flex h-full min-h-0 w-full">
        ${renderMPlatformSidebar(path)}
        ${renderMPlatformMain(path)}
      </div>
    </div>`;
}

export function bindMPlatformShell(onMount: () => void): void {
  const currentPath = location.hash.slice(1) || NAV_BLUEPRINT_ROUTE_PREFIX;
  if (isSubscriptionServiceCreatePath(currentPath)) {
    bindSubscriptionServicePage(onMount);
    return;
  }
  if (consumeMPlatformEntryNoticePending()) {
    showMPlatformEntryNoticeDialog();
  }

  document.querySelectorAll<HTMLElement>("[data-exit-m-platform]").forEach((btn) => {
    btn.addEventListener("click", () => {
      exitMPlatformShell();
      location.hash = "#/nav-home";
      onMount();
    });
  });

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    const dark = document.documentElement.classList.contains("dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0f172a" : "#f8fafc");
  });

  mountDemoSwitchFab({ showVersionSwitch: false });
  bindViewSwitchControl(onMount);

  document.querySelectorAll<HTMLButtonElement>("[data-m-platform-merchants-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const next = !expanded;
      try {
        sessionStorage.setItem(M_PLATFORM_MERCHANTS_NAV_EXPANDED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      btn.setAttribute("aria-expanded", next ? "true" : "false");
      const list = document.getElementById(M_PLATFORM_MERCHANTS_SUBNAV_ID);
      const chevron = btn.querySelector<HTMLElement>("[data-m-platform-merchants-chevron]");
      if (list) {
        list.classList.toggle("hidden", !next);
        if (next) list.removeAttribute("aria-hidden");
        else list.setAttribute("aria-hidden", "true");
        list.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
          link.tabIndex = next ? 0 : -1;
        });
      }
      chevron?.classList.toggle("-rotate-90", !next);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-m-platform-hardware-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const next = !expanded;
      try {
        sessionStorage.setItem(M_PLATFORM_HARDWARE_NAV_EXPANDED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      btn.setAttribute("aria-expanded", next ? "true" : "false");
      const list = document.getElementById(M_PLATFORM_HARDWARE_SUBNAV_ID);
      const chevron = btn.querySelector<HTMLElement>("[data-m-platform-hardware-chevron]");
      if (list) {
        list.classList.toggle("hidden", !next);
        if (next) list.removeAttribute("aria-hidden");
        else list.setAttribute("aria-hidden", "true");
        list.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
          link.tabIndex = next ? 0 : -1;
        });
      }
      chevron?.classList.toggle("-rotate-90", !next);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-m-platform-permissions-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const next = !expanded;
      try {
        sessionStorage.setItem(M_PLATFORM_PERMISSIONS_NAV_EXPANDED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      btn.setAttribute("aria-expanded", next ? "true" : "false");
      const list = document.getElementById(M_PLATFORM_PERMISSIONS_SUBNAV_ID);
      const chevron = btn.querySelector<HTMLElement>("[data-m-platform-permissions-chevron]");
      if (list) {
        list.classList.toggle("hidden", !next);
        if (next) list.removeAttribute("aria-hidden");
        else list.setAttribute("aria-hidden", "true");
        list.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
          link.tabIndex = next ? 0 : -1;
        });
      }
      chevron?.classList.toggle("-rotate-90", !next);
    });
  });

  const path = currentPath;
  bindNavBlueprint(onMount);
  if (isAnySubscriptionAdminPath(path)) {
    bindSubscriptionServicePage(onMount);
  } else if (isMPlatformPermissionsPath(path)) {
    if (path === `${ENTERPRISE_RBAC_SCOPE.routePrefix}/staff-accounts`) {
      bindStaffAccountsPage(ENTERPRISE_RBAC_SCOPE);
    } else {
      bindPermissionsRbac(ENTERPRISE_RBAC_SCOPE);
    }
  } else if (isMPlatformHardwarePath(path)) {
    bindEnterpriseHardware(onMount);
  } else if (isMPlatformMerchantPath(path)) {
    bindEnterpriseMerchant(onMount);
  } else if (!isNavBlueprintPath(path)) {
    bindPlatformPreset(onMount, ENTERPRISE_PLATFORM_PRESET_SCOPE);
  }
}
