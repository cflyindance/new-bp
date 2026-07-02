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
import { exitMPlatformShell } from "./app-shell-mode";
import { bindViewSwitchControl, renderViewSwitchControl } from "./view-switch-control";

export const M_PLATFORM_PRESET_PATH = "/m-platform/platform-preset";

export { NAV_BLUEPRINT_ROUTE_PREFIX } from "../config/nav-blueprint-ui";

export function isMPlatformContentPath(path: string): boolean {
  return isMPlatformPresetPath(path) || isNavBlueprintPath(path);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMPlatformSidebar(path: string): string {
  const presetActive = isMPlatformPresetPath(path);
  const blueprintActive = isNavBlueprintPath(path);
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
            <a href="#${M_PLATFORM_PRESET_PATH}" class="${linkClass(presetActive)}">${escapeHtml(t("shell.mPlatformNavPreset"))}</a>
          </li>
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
        ${renderViewSwitchControl()}
      </div>
    </header>`;
}

function renderMPlatformContent(path: string): string {
  if (isNavBlueprintPath(path)) return renderNavBlueprintPage(path);
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
  return `
    <div class="relative h-dvh min-h-0 w-full overflow-hidden">
      <div class="flex h-full min-h-0 w-full">
        ${renderMPlatformSidebar(path)}
        ${renderMPlatformMain(path)}
      </div>
    </div>`;
}

export function bindMPlatformShell(onMount: () => void): void {
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

  bindViewSwitchControl(onMount);

  const path = location.hash.slice(1) || NAV_BLUEPRINT_ROUTE_PREFIX;
  bindNavBlueprint(onMount);
  if (!isNavBlueprintPath(path)) {
    bindPlatformPreset(onMount, ENTERPRISE_PLATFORM_PRESET_SCOPE);
  }
}
