/**
 * 顶栏视角切换：门店版 / 连锁版 / M 平台
 */
import { t } from "../i18n";
import {
  ensureScopeFiltersForLayoutPreset,
} from "../auth/session-scope";
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

const M_PLATFORM_PRESET_PATH = "/m-platform/platform-preset";

export type ViewSwitchMode = SidebarNavLayoutPreset | "m-platform";

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

function labelForMode(mode: ViewSwitchMode): string {
  if (mode === "m-platform") return t("shell.mPlatform");
  if (mode === "chain") return t("shell.navLayoutChain");
  return t("shell.navLayoutStore");
}

function hintForMode(mode: ViewSwitchMode): string {
  if (mode === "m-platform") return t("shell.mPlatformHint");
  if (mode === "chain") return t("shell.navLayoutChainHint");
  return t("shell.navLayoutStoreHint");
}

const CHEVRON_ICON = `<svg class="size-3.5 shrink-0 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

const CHECK_ICON = `<svg class="size-4 shrink-0 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

function renderMenuItem(mode: ViewSwitchMode, current: ViewSwitchMode): string {
  const active = mode === current;
  const label = escapeHtml(labelForMode(mode));
  const hint = escapeHtml(hintForMode(mode));
  const presetAttr =
    mode === "m-platform" ? 'data-view-switch-option="m-platform"' : `data-view-switch-option="${mode}"`;
  return `
    <button
      type="button"
      role="menuitem"
      ${presetAttr}
      class="flex w-full min-h-9 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-accent/60 font-medium text-accent-foreground" : "text-foreground"}"
      title="${hint}"
      aria-current="${active ? "true" : "false"}"
    >
      <span class="flex size-4 shrink-0 items-center justify-center">${active ? CHECK_ICON : ""}</span>
      <span class="min-w-0 flex-1 truncate">${label}</span>
    </button>`;
}

export function renderViewSwitchControl(): string {
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
        class="absolute right-0 top-full z-50 mt-1.5 hidden w-44 origin-top-right rounded-lg border border-border bg-card py-1.5 shadow-lg animate-fade-in"
        aria-label="${escapeHtml(t("shell.viewSwitchMenuAria"))}"
      >
        <div class="px-1.5">
          ${renderMenuItem("store", current)}
          ${renderMenuItem("chain", current)}
          ${renderMenuItem("m-platform", current)}
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

function applyViewSwitchMode(mode: ViewSwitchMode, onMount: () => void): void {
  if (mode === "m-platform") {
    if (isMPlatformShellMode()) return;
    enterMPlatformShell();
    location.hash = `#${M_PLATFORM_PRESET_PATH}`;
    onMount();
    return;
  }

  if (isMPlatformShellMode()) {
    exitMPlatformShell();
    location.hash = "#/nav-home";
    if (readSidebarNavLayoutPreset() === mode) {
      onMount();
      return;
    }
  } else if (readSidebarNavLayoutPreset() === mode) {
    return;
  }

  markSidebarNavLayoutPresetManual();
  writeSidebarNavLayoutPreset(mode);
  ensureScopeFiltersForLayoutPreset(mode);
  onMount();
}

export function bindViewSwitchControl(onMount: () => void): void {
  document.querySelectorAll<HTMLElement>("[data-view-switch-root]").forEach((root) => {
    if (root.dataset.viewSwitchBound === "1") return;
    root.dataset.viewSwitchBound = "1";

    const toggle = root.querySelector<HTMLButtonElement>("[data-view-switch-toggle]");
    toggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setViewSwitchOpen(root, open);
    });

    root.querySelectorAll<HTMLButtonElement>("[data-view-switch-option]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const raw = btn.getAttribute("data-view-switch-option");
        if (raw !== "store" && raw !== "chain" && raw !== "m-platform") return;
        setViewSwitchOpen(root, false);
        applyViewSwitchMode(raw, onMount);
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
