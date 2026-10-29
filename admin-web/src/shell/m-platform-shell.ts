import { renderFutureVersionDiffBanner } from "./future-version-banner";
import { renderMCenter, bindMCenter } from '../permissions/m-platform-ui';
import { mCanVisit, mDenied, renderMNavigation, bindMNavigation, installMRuntimeGuards, applyMControlStates } from '../permissions/m-platform-runtime';
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
import { mPageForPath } from '../permissions/m-platform-catalog';
import { activityPageTitle, bindActivityPage, isActivityPath, renderActivityPage } from '../config/merchant-activity-ui';
import { deviceActivityPageTitle, bindDeviceActivityPage, isDeviceActivityPath, renderDeviceActivityPage } from '../config/device-activity-ui';
import {
  findSubscriptionAdminPageTitle,
  isAnySubscriptionAdminPath,
  isSubscriptionServiceCreatePath,
} from "../config/subscription-service-scope";
import { bindSubscriptionServicePage, renderSubscriptionServicePage } from "../config/subscription-service-ui";
import {
  findHardwarePageTitle,
  isMPlatformHardwarePath,
} from "../config/enterprise-hardware-scope";
import { bindEnterpriseHardware, renderEnterpriseHardwarePage } from "../config/enterprise-hardware-ui";
import {
  ENTERPRISE_MERCHANT_ROUTE_PREFIX,
  parseMerchantDetailPath,
  parseStoreDetailPath,
  findMerchantPageTitle,
  isMPlatformMerchantPath,
} from "../config/enterprise-merchant-scope";
import { bindEnterpriseMerchant, renderEnterpriseMerchantPage } from "../config/enterprise-merchant-ui";
import { bindViewSwitchControl } from "./view-switch-control";
import { mountDemoSwitchFab } from "./demo-switch-control";

export const M_PLATFORM_PRESET_PATH = "/m-platform/platform-preset";
export const M_PLATFORM_PERMISSIONS_PATH = "/m-platform/permissions/overview";
const isMPlatformPermissionsPath = (path: string) => path === "/m-platform/permissions" || path.startsWith("/m-platform/permissions/");

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

export function renderMPlatformSidebar(path: string): string {
  return `<aside class="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background"><header class="p-4 border-b border-border"><p class="text-xs text-muted-foreground">服务商管理后台</p><h1 class="mt-1 font-semibold">M 平台</h1></header>${renderMNavigation(path)}</aside>`;
}

function resolveMPlatformPageTitle(path: string): { title: string; module: string } {
  if (!mCanVisit(path)) return { title: "访问受限", module: "M 平台" };
  return (
    findNavBlueprintPageTitle(path) ??
    activityPageTitle(path) ??
    deviceActivityPageTitle(path) ??
    findSubscriptionAdminPageTitle(path) ??
    (isMPlatformPermissionsPath(path) ? { title: mPageForPath(path)?.title ?? "权限管理中心", module: "M 平台" } : null) ??
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
        <button type="button" id="theme-toggle" class="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:size-11" aria-label="${escapeHtml(t("header.themeToggle"))}">
          <svg class="size-5 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          <svg class="size-5 hidden dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        </button>
      </div>
    </header>`;
}

function renderMPlatformContent(path: string): string {
  if (!mCanVisit(path)) return mDenied();
  if (isDeviceActivityPath(path)) return renderDeviceActivityPage(path);
  if (isActivityPath(path)) return renderActivityPage(path);
  if (isNavBlueprintPath(path)) return renderNavBlueprintPage(path);
  if (isAnySubscriptionAdminPath(path)) return renderSubscriptionServicePage(path);
  if (isMPlatformPermissionsPath(path)) return renderMCenter(path);
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
          <div data-m-platform-content role="tabpanel" class="min-h-0 flex-1 flex flex-col overflow-hidden">
            ${renderMPlatformContent(path)}
          </div>
        </div>
      </main>
    </div>`;
}

function renderMPlatformShell(_onMount: () => void, path: string): string {
  if (/^\/m-platform\/merchants\/groups(?:\/|$|\?)/.test(path)) {
    path = ENTERPRISE_MERCHANT_ROUTE_PREFIX;
    history.replaceState(history.state, "", `${location.pathname}${location.search}#${path}`);
  }
  // 开通在外部平台完成；兼容旧申请书签，不开放申请审批页面。
  if (/^\/m-platform\/merchants\/requests(\/|$|\?)/.test(path)) {
    path = `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/overview`;
    history.replaceState(history.state, "", `${location.pathname}${location.search}#${path}`);
  }
  if (parseStoreDetailPath(path) && mCanVisit(path)) {
    return `<main class="relative flex h-full min-h-0 w-full flex-col overflow-hidden p-4 md:p-6" data-store-detail-full-page data-m-platform-content>${renderEnterpriseMerchantPage(path)}</main>`;
  }
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/new` && mCanVisit(path)) {
    return `<main class="relative flex h-full min-h-0 w-full flex-col overflow-hidden p-4 md:p-6" data-brand-create-full-page data-m-platform-content>${renderEnterpriseMerchantPage(path)}</main>`;
  }
  if (parseMerchantDetailPath(path) && mCanVisit(path)) {
    return `<main class="relative flex h-full min-h-0 w-full flex-col overflow-hidden p-4 md:p-6" data-brand-detail-full-page data-m-platform-content>${renderEnterpriseMerchantPage(path)}</main>`;
  }
  if (/^\/m-platform\/permissions\/(roles\/edit|staff)\/.+/.test(path) && mCanVisit(path)) {
    return `<div class="relative h-full min-h-0 w-full overflow-hidden">${renderMCenter(path)}</div>`;
  }
  if (isSubscriptionServiceCreatePath(path) && mCanVisit(path)) {
    return `<div class="relative h-full min-h-0 w-full overflow-hidden" data-m-platform-content>${renderSubscriptionServicePage(path)}</div>`;
  }
  return `
    <div class="relative h-full min-h-0 w-full overflow-hidden">
      <div class="flex h-full min-h-0 w-full">
        ${renderMPlatformSidebar(path)}
        ${renderMPlatformMain(path)}
      </div>
    </div>`;
}

export function mountMPlatformShell(onMount: () => void, path: string): string {
  return `<div class="relative flex h-dvh min-h-0 w-full flex-col overflow-hidden" data-m-platform-shell>
    ${isMPlatformMerchantPath(path) ? renderFutureVersionDiffBanner(true) : ""}
    <div class="flex min-h-0 min-w-0 flex-1 overflow-hidden">${renderMPlatformShell(onMount, path)}</div>
  </div>`;
}

export function bindMPlatformShell(onMount: () => void): void {
  const currentPath = location.hash.slice(1) || NAV_BLUEPRINT_ROUTE_PREFIX;
  installMRuntimeGuards();
  bindMNavigation();
  if (/^\/m-platform\/permissions\/(roles\/edit|staff)\/.+/.test(currentPath) && mCanVisit(currentPath)) { bindMCenter(onMount); return; }
  if (isSubscriptionServiceCreatePath(currentPath) && mCanVisit(currentPath)) {
    bindSubscriptionServicePage(onMount);
    applyMControlStates();
    return;
  }
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    const dark = document.documentElement.classList.contains("dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0f172a" : "#f8fafc");
  });

  mountDemoSwitchFab({ showVersionSwitch: false });
  bindViewSwitchControl(onMount);

  const path = currentPath;
  if (!mCanVisit(path)) return;
  bindNavBlueprint(onMount);
  if (isAnySubscriptionAdminPath(path)) {
    bindSubscriptionServicePage(onMount);
  } else if (isActivityPath(path)) {
    bindActivityPage(onMount);
  } else if (isDeviceActivityPath(path)) {
    bindDeviceActivityPage(onMount);
  } else if (isMPlatformPermissionsPath(path)) {
    bindMCenter(onMount);
  } else if (isMPlatformHardwarePath(path)) {
    bindEnterpriseHardware(onMount);
  } else if (isMPlatformMerchantPath(path)) {
    bindEnterpriseMerchant(onMount);
  } else if (!isNavBlueprintPath(path)) {
    bindPlatformPreset(onMount, ENTERPRISE_PLATFORM_PRESET_SCOPE);
  }
  applyMControlStates();
}
