/**
 * 顶栏视角切换：门店版 / 连锁版（集团总部·品牌多门店）/ M 平台
 */
import { t } from "../i18n";
import {
  ensureScopeFiltersForLayoutPreset,
  isViewSwitchRestricted,
} from "../auth/session-scope";
import {
  canUseChainDataPerspective,
  clearChainDataPerspectiveState,
  resolveChainDataPerspective,
  resolveDefaultAnchorBrandId,
  writeChainDataPerspective,
  type ChainDataPerspective,
} from "../auth/merchant-scope-context";
import { syncAllActiveMPlatformGroups } from "../config/merchant-chain-brand-sync";
import {
  markSidebarNavLayoutPresetManual,
  readSidebarNavLayoutPreset,
  writeSidebarNavLayoutPreset,
  type SidebarNavLayoutPreset,
} from "../config/sidebar-nav-order";
import {
  enterMPlatformShell,
  exitMPlatformShell,
  isMPlatformShellMode,
} from "./app-shell-mode";

import { shouldShowGroupHqViewSwitchOption, shouldShowMPlatformViewSwitchOption } from "../config/product-version";
import { APP_NAV_HOME_PATH } from "../config/app-routes";
import { NAV_BLUEPRINT_ROUTE_PREFIX } from "../config/nav-blueprint-ui";

export type ViewSwitchMode = SidebarNavLayoutPreset | "m-platform";
export type ChainViewSwitchPerspective = "group-hq" | "brand";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCurrentViewSwitchMode(): ViewSwitchMode {
  if (isMPlatformShellMode()) return "m-platform";
  return readSidebarNavLayoutPreset();
}

function labelForChainPerspective(perspective: ChainDataPerspective): string {
  if (perspective === "brand") return t("shell.perspectiveBrand");
  if (perspective === "group-hq") return t("shell.perspectiveGroupHq");
  return t("shell.navLayoutStore");
}

function hintForChainPerspective(perspective: ChainDataPerspective): string {
  if (perspective === "brand") return t("shell.perspectiveBrandHint");
  if (perspective === "group-hq") return t("shell.perspectiveGroupHqHint");
  return t("shell.navLayoutStoreHint");
}

function labelForMode(mode: ViewSwitchMode): string {
  if (mode === "m-platform") return t("shell.mPlatform");
  if (mode === "chain") return labelForChainPerspective(resolveChainDataPerspective());
  return t("shell.navLayoutStore");
}

function hintForMode(mode: ViewSwitchMode): string {
  if (mode === "m-platform") return t("shell.mPlatformHint");
  if (mode === "chain") return hintForChainPerspective(resolveChainDataPerspective());
  return t("shell.navLayoutStoreHint");
}

const CHEVRON_ICON = `<svg class="size-3.5 shrink-0 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

const CHECK_ICON = `<svg class="size-4 shrink-0 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

function isChainPerspectiveActive(perspective: ChainViewSwitchPerspective): boolean {
  return getCurrentViewSwitchMode() === "chain" && resolveChainDataPerspective() === perspective;
}

function renderStoreMenuItem(current: ViewSwitchMode): string {
  const active = current === "store";
  return `
    <button
      type="button"
      role="menuitem"
      data-view-switch-option="store"
      class="flex w-full min-h-9 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-accent/60 font-medium text-accent-foreground" : "text-foreground"}"
      title="${escapeHtml(t("shell.navLayoutStoreHint"))}"
      aria-current="${active ? "true" : "false"}"
    >
      <span class="flex size-4 shrink-0 items-center justify-center">${active ? CHECK_ICON : ""}</span>
      <span class="min-w-0 flex-1 truncate">${escapeHtml(t("shell.navLayoutStore"))}</span>
    </button>`;
}

function renderChainPerspectiveItem(perspective: ChainViewSwitchPerspective): string {
  const allowed = canUseChainDataPerspective(perspective);
  const active = allowed && isChainPerspectiveActive(perspective);
  const label = escapeHtml(labelForChainPerspective(perspective));
  const hint = escapeHtml(
    allowed ? hintForChainPerspective(perspective) : t("shell.perspectiveRestrictedHint"),
  );
  const disabledAttrs = allowed ? "" : ' disabled aria-disabled="true"';
  const disabledClass = allowed ? "" : " cursor-not-allowed opacity-50";
  return `
    <button
      type="button"
      role="menuitem"
      data-view-switch-chain-perspective="${perspective}"
      class="flex w-full min-h-9 items-center gap-2 rounded-md px-2.5 py-2 pl-6 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-accent/60 font-medium text-accent-foreground" : "text-foreground"}${disabledClass}"
      title="${hint}"
      aria-current="${active ? "true" : "false"}"${disabledAttrs}
    >
      <span class="flex size-4 shrink-0 items-center justify-center">${active ? CHECK_ICON : ""}</span>
      <span class="min-w-0 flex-1 truncate">${label}</span>
    </button>`;
}

function renderMPlatformMenuItem(current: ViewSwitchMode): string {
  const active = current === "m-platform";
  return `
    <button
      type="button"
      role="menuitem"
      data-view-switch-option="m-platform"
      class="flex w-full min-h-9 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-accent/60 font-medium text-accent-foreground" : "text-foreground"}"
      title="${escapeHtml(t("shell.mPlatformHint"))}"
      aria-current="${active ? "true" : "false"}"
    >
      <span class="flex size-4 shrink-0 items-center justify-center">${active ? CHECK_ICON : ""}</span>
      <span class="min-w-0 flex-1 truncate">${escapeHtml(t("shell.mPlatform"))}</span>
    </button>`;
}

export function renderViewSwitchControl(): string {
  if (isViewSwitchRestricted()) {
    const label = escapeHtml(labelForChainPerspective("brand"));
    const hint = escapeHtml(t("shell.impersonationViewLocked"));
    const lockedBadge =
      "inline-flex h-8 sm:h-9 items-center rounded px-2 sm:px-2.5 text-xs sm:text-sm font-medium bg-amber-500/15 text-amber-950 dark:text-amber-100";
    return `
    <div class="relative shrink-0" data-view-switch-root data-view-switch-locked="1">
      <div
        class="flex items-center gap-0.5 rounded-md border border-amber-500/30 bg-background p-0.5"
        role="group"
        aria-label="${escapeHtml(t("shell.viewSwitchAria"))}"
        title="${hint}"
      >
        <span class="${lockedBadge}">${label}</span>
      </div>
    </div>`;
  }

  const current = getCurrentViewSwitchMode();
  const currentLabel = escapeHtml(labelForMode(current));
  const currentHint = escapeHtml(hintForMode(current));
  const toggleBtn =
    "inline-flex h-8 sm:h-9 items-center gap-1 rounded px-2 sm:px-2.5 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";
  const currentBadge =
    "inline-flex h-8 sm:h-9 items-center rounded px-2 sm:px-2.5 text-xs sm:text-sm font-medium bg-primary text-primary-foreground shadow-sm";

  return `
    <div class="relative shrink-0" data-view-switch-root>
      <div
        class="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5"
        role="group"
        aria-label="${escapeHtml(t("shell.viewSwitchAria"))}"
      >
        <button
          type="button"
          data-view-switch-toggle
          class="${toggleBtn}"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="view-switch-menu"
          title="${escapeHtml(t("shell.viewSwitchHint"))}"
        >
          <span>${escapeHtml(t("shell.viewSwitch"))}</span>
          ${CHEVRON_ICON}
        </button>
        <span class="${currentBadge}" title="${currentHint}" data-view-switch-current>${currentLabel}</span>
      </div>
      <div
        id="view-switch-menu"
        role="menu"
        data-view-switch-menu
        class="absolute right-0 top-full z-50 mt-1.5 hidden w-52 origin-top-right rounded-lg border border-border bg-card py-1.5 shadow-lg animate-fade-in"
        aria-label="${escapeHtml(t("shell.viewSwitchMenuAria"))}"
      >
        <div class="px-1.5">
          ${renderStoreMenuItem(current)}
          <div class="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">${escapeHtml(t("shell.navLayoutChain"))}</div>
          ${shouldShowGroupHqViewSwitchOption() ? renderChainPerspectiveItem("group-hq") : ""}
          ${renderChainPerspectiveItem("brand")}
          ${shouldShowMPlatformViewSwitchOption() ? `<div class="my-1 h-px bg-border" aria-hidden="true"></div>
          ${renderMPlatformMenuItem(current)}` : ""}
        </div>
      </div>
    </div>`;
}

function setViewSwitchOpen(root: HTMLElement, open: boolean): void {
  const toggle = root.querySelector<HTMLButtonElement>("[data-view-switch-toggle]");
  const menu = root.querySelector<HTMLElement>("[data-view-switch-menu]");
  if (!toggle || !menu) return;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  menu.classList.toggle("hidden", !open);
}

function applyChainPerspective(perspective: ChainViewSwitchPerspective, onMount: () => void): void {
  if (isViewSwitchRestricted()) return;
  if (perspective === "group-hq" && !shouldShowGroupHqViewSwitchOption()) return;

  if (isMPlatformShellMode()) {
    exitMPlatformShell();
    location.hash = "#/nav-home";
  }

  markSidebarNavLayoutPresetManual();
  writeSidebarNavLayoutPreset("chain");

  const brandId = perspective === "brand" ? resolveDefaultAnchorBrandId() ?? undefined : undefined;
  writeChainDataPerspective(perspective, brandId ? { brandId } : undefined);
  ensureScopeFiltersForLayoutPreset("chain");
  syncAllActiveMPlatformGroups();
  onMount();
}

function applyViewSwitchMode(mode: ViewSwitchMode, onMount: () => void): void {
  if (isViewSwitchRestricted()) return;

  if (mode === "m-platform") {
    if (!shouldShowMPlatformViewSwitchOption()) return;
    if (isMPlatformShellMode()) return;
    enterMPlatformShell();
    location.hash = `#${NAV_BLUEPRINT_ROUTE_PREFIX}`;
    onMount();
    return;
  }

  if (mode === "chain") {
    applyChainPerspective("group-hq", onMount);
    return;
  }

  if (isMPlatformShellMode()) {
    exitMPlatformShell();
    location.hash = "#/nav-home";
  }

  if (readSidebarNavLayoutPreset() === "store") return;

  markSidebarNavLayoutPresetManual();
  writeSidebarNavLayoutPreset("store");
  clearChainDataPerspectiveState();
  ensureScopeFiltersForLayoutPreset("store");
  onMount();
}

/** MVP 下若当前为集团总部视角，自动切至品牌多门店（或门店版） */
export function ensureMvpGroupHqViewSwitchHidden(onMount: () => void): boolean {
  if (shouldShowGroupHqViewSwitchOption()) return false;
  if (readSidebarNavLayoutPreset() !== "chain") return false;
  if (resolveChainDataPerspective() !== "group-hq") return false;

  if (canUseChainDataPerspective("brand")) {
    applyChainPerspective("brand", onMount);
  } else {
    applyViewSwitchMode("store", onMount);
  }
  return true;
}

/** MVP 下若当前在 M 平台视角，自动退回商家后台 */
export function ensureMvpMPlatformViewSwitchHidden(onMount: () => void): boolean {
  if (shouldShowMPlatformViewSwitchOption()) return false;
  if (!isMPlatformShellMode()) return false;

  exitMPlatformShell();
  location.hash = `#${APP_NAV_HOME_PATH}`;
  onMount();
  return true;
}

export function bindViewSwitchControl(onMount: () => void): void {
  document.querySelectorAll<HTMLElement>("[data-view-switch-root]").forEach((root) => {
    if (root.dataset.viewSwitchBound === "1") return;
    root.dataset.viewSwitchBound = "1";

    const toggle = root.querySelector<HTMLButtonElement>("[data-view-switch-toggle]");
    toggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll<HTMLElement>("[data-version-switch-root]").forEach((versionRoot) => {
        const versionToggle = versionRoot.querySelector<HTMLButtonElement>("[data-version-switch-toggle]");
        const versionMenu = versionRoot.querySelector<HTMLElement>("[data-version-switch-menu]");
        if (!versionToggle || !versionMenu) return;
        versionToggle.setAttribute("aria-expanded", "false");
        versionMenu.classList.add("hidden");
      });
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setViewSwitchOpen(root, open);
    });

    root.querySelectorAll<HTMLButtonElement>("[data-view-switch-option]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const raw = btn.getAttribute("data-view-switch-option");
        if (raw !== "store" && raw !== "m-platform") return;
        if (raw === "m-platform" && !shouldShowMPlatformViewSwitchOption()) return;
        setViewSwitchOpen(root, false);
        applyViewSwitchMode(raw, onMount);
      });
    });

    root.querySelectorAll<HTMLButtonElement>("[data-view-switch-chain-perspective]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const raw = btn.getAttribute("data-view-switch-chain-perspective");
        if (raw !== "group-hq" && raw !== "brand") return;
        if (raw === "group-hq" && !shouldShowGroupHqViewSwitchOption()) return;
        if (!canUseChainDataPerspective(raw)) return;
        setViewSwitchOpen(root, false);
        applyChainPerspective(raw, onMount);
      });
    });
  });

  if (!document.documentElement.dataset.viewSwitchDismissBound) {
    document.documentElement.dataset.viewSwitchDismissBound = "1";
    document.addEventListener(
      "click",
      (e) => {
        document.querySelectorAll<HTMLElement>("[data-view-switch-root]").forEach((root) => {
          if (root.contains(e.target as Node)) return;
          setViewSwitchOpen(root, false);
        });
      },
      true,
    );
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      document.querySelectorAll<HTMLElement>("[data-view-switch-root]").forEach((root) => setViewSwitchOpen(root, false));
    });
  }
}
