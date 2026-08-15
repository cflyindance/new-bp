/**
 * eMenu 本地配置后台：独立 Demo Shell 与一级导航页。
 */
import { t } from "../i18n";
import { BUILD_STAMP } from "../generated/build-stamp";
import { mountDemoSwitchFab } from "./demo-switch-control";
import { bindViewSwitchControl } from "./view-switch-control";
import { bindEmenuHostIpControl, renderEmenuHostIpControl } from "./emenu-local-host-control-ui";
import {
  bindSeasoningSettingsPage,
  renderSeasoningSettingsPage,
} from "../emenu-local/seasoning/seasoning-page";
import {
  EMENU_LOCAL_NAV_ITEMS,
  getActiveEmenuLocalNavItem,
  normalizeEmenuLocalPath,
  type EmenuLocalNavItem,
} from "./emenu-local-routes";

const EMENU_NEW_IFRAME_SRC = `./emenu-new/index.html?embedded=1&v=${BUILD_STAMP}`;
/** 与 eMenu 同一本地构建包，打开设置路由 */
const EMENU_SETTINGS_IFRAME_SRC = `./emenu-new/index.html?embedded=1&v=${BUILD_STAMP}#/setting`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderIcon(kind: EmenuLocalNavItem["icon"], className = "size-5"): string {
  const attrs = `class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  if (kind === "device") {
    return `<svg ${attrs}><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M9 6h6M10 18h4"/></svg>`;
  }
  if (kind === "global") {
    return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3Z"/></svg>`;
  }
  if (kind === "category") {
    return `<svg ${attrs}><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>`;
  }
  if (kind === "menu") {
    return `<svg ${attrs}><path d="M6 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1 2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>`;
  }
  if (kind === "emenu") {
    return `<svg ${attrs}><rect x="3" y="4" width="18" height="14" rx="2.5"/><path d="M8 20h8M12 18v2"/><path d="M8 9h8M8 12h5"/></svg>`;
  }
  if (kind === "settings") {
    return `<svg ${attrs}><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/></svg>`;
  }
  return `<svg ${attrs}><path d="M7.4 15.8c-2.4-2.4-2.6-6-.5-8.1s5.7-1.9 8.1.5 3.3 6.8 1.2 8.9-6.4 1.1-8.8-1.3Z"/><path d="m15.6 8.8 3.7-3.7M12.2 11.5l.01.01M9.6 9.8l.01.01M10.3 14.1l.01.01M14.2 14.2l.01.01"/></svg>`;
}

function renderNavLink(item: EmenuLocalNavItem, active: boolean, mobile = false): string {
  const stateClass = active
    ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/10"
    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground";
  const mobileClass = mobile
    ? "min-w-max px-3.5 shadow-none"
    : "w-full px-3";
  return `
    <a
      href="#${item.path}"
      data-emenu-local-nav="${escapeHtml(item.id)}"
      class="group flex min-h-11 items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mobileClass} ${stateClass}"
      ${active ? 'aria-current="page"' : ""}
    >
      <span class="flex size-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}">
        ${renderIcon(item.icon, "size-[18px]")}
      </span>
      <span class="truncate">${escapeHtml(t(item.titleKey))}</span>
    </a>`;
}

function renderSidebar(path: string): string {
  const active = getActiveEmenuLocalNavItem(path);
  return `
    <aside class="hidden h-full w-60 shrink-0 flex-col border-r border-border/80 bg-card md:flex lg:w-64">
      <div class="border-b border-border/80 px-5 py-5">
        <div class="flex items-center gap-3">
          <span class="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold tracking-tight text-white shadow-sm dark:bg-slate-100 dark:text-slate-950">eM</span>
          <div class="min-w-0">
            <p class="truncate text-base font-semibold tracking-tight text-foreground">eMenu</p>
            <p class="truncate text-xs text-muted-foreground">${escapeHtml(t("shell.emenuLocalTitle"))}</p>
          </div>
        </div>
      </div>
      <nav class="min-h-0 flex-1 overflow-y-auto p-3" aria-label="${escapeHtml(t("shell.emenuLocalNavAria"))}">
        <p class="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">${escapeHtml(t("shell.emenuLocalWorkspace"))}</p>
        <div class="space-y-1">
          ${EMENU_LOCAL_NAV_ITEMS.map((item) => renderNavLink(item, item.id === active.id)).join("")}
        </div>
      </nav>
      <div class="border-t border-border/80 px-5 py-4">
        <p class="text-xs text-muted-foreground">${escapeHtml(t("shell.emenuLocalRuntime"))}</p>
      </div>
    </aside>`;
}

function renderMobileNav(path: string): string {
  const active = getActiveEmenuLocalNavItem(path);
  return `
    <nav class="overflow-x-auto border-b border-border/70 px-3 py-2 md:hidden" aria-label="${escapeHtml(t("shell.emenuLocalNavAria"))}">
      <div class="flex min-w-max gap-1">
        ${EMENU_LOCAL_NAV_ITEMS.map((item) => renderNavLink(item, item.id === active.id, true)).join("")}
      </div>
    </nav>`;
}

function renderPlaceholder(item: EmenuLocalNavItem): string {
  return `
    <section
      data-emenu-local-placeholder="${escapeHtml(item.id)}"
      class="relative flex min-h-[26rem] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-card px-6 py-12 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10"
      aria-labelledby="emenu-local-placeholder-title"
    >
      <div class="pointer-events-none absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true"></div>
      <div class="relative mx-auto flex max-w-xl flex-col items-center text-center">
        <div class="relative mb-8 flex h-36 w-52 items-center justify-center" aria-hidden="true">
          <div class="absolute left-2 top-6 h-24 w-36 rounded-2xl border border-border bg-muted/70"></div>
          <div class="absolute right-2 top-1 h-28 w-40 rounded-2xl border border-border bg-background shadow-sm"></div>
          <div class="absolute right-7 top-6 grid h-16 w-28 grid-cols-3 gap-2 rounded-xl border border-border/80 bg-card p-3">
            <span class="rounded-md bg-primary/15"></span><span class="rounded-md bg-muted"></span><span class="rounded-md bg-muted"></span>
            <span class="rounded-md bg-muted"></span><span class="rounded-md bg-primary/10"></span><span class="rounded-md bg-muted"></span>
          </div>
          <span class="absolute bottom-0 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            ${renderIcon(item.icon, "size-7")}
          </span>
        </div>
        <span class="mb-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold tracking-wide text-primary">${escapeHtml(t("shell.emenuLocalComingSoon"))}</span>
        <h2 id="emenu-local-placeholder-title" class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">${escapeHtml(t(item.titleKey))}</h2>
        <p class="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">${escapeHtml(t(item.descriptionKey))}</p>
      </div>
    </section>`;
}

function renderEmenuIframePage(): string {
  return `
    <section
      data-emenu-local-emenu-frame
      class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      aria-label="${escapeHtml(t("shell.emenuLocalEmenu"))}"
    >
      <iframe
        title="${escapeHtml(t("shell.emenuLocalEmenu"))}"
        class="block h-full min-h-[36rem] w-full flex-1 border-0"
        src="${escapeHtml(EMENU_NEW_IFRAME_SRC)}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </section>`;
}

function renderEmenuSettingsIframePage(): string {
  return `
    <section
      data-emenu-local-emenu-settings-frame
      class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      aria-label="${escapeHtml(t("shell.emenuLocalEmenuSettings"))}"
    >
      <iframe
        title="${escapeHtml(t("shell.emenuLocalEmenuSettings"))}"
        class="block h-full min-h-[36rem] w-full flex-1 border-0"
        src="${escapeHtml(EMENU_SETTINGS_IFRAME_SRC)}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </section>`;
}

function renderMain(path: string): string {
  const active = getActiveEmenuLocalNavItem(path);
  const body =
    active.id === "seasoning-settings"
      ? renderSeasoningSettingsPage()
      : active.id === "emenu"
        ? renderEmenuIframePage()
        : active.id === "emenu-settings"
          ? renderEmenuSettingsIframePage()
          : renderPlaceholder(active);
  return `
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header class="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-card/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">eMenu · Local configuration</p>
          <h1 id="main-content" tabindex="-1" class="truncate text-xl font-semibold tracking-tight text-foreground">${escapeHtml(t(active.titleKey))}</h1>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          ${renderEmenuHostIpControl()}
          <button type="button" id="theme-toggle" class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="${escapeHtml(t("header.themeToggle"))}">
            <svg class="size-5 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            <svg class="hidden size-5 dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          </button>
        </div>
      </header>
      ${renderMobileNav(path)}
      <main class="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/35 p-3 sm:p-5 lg:p-7">
        <div class="mx-auto flex min-h-0 w-full max-w-[88rem] flex-1 flex-col animate-fade-in">
          ${body}
        </div>
      </main>
    </div>`;
}

export function mountEmenuLocalShell(_onMount: () => void, path: string): string {
  const normalized = normalizeEmenuLocalPath(path);
  return `
    <div class="relative h-dvh min-h-0 w-full overflow-hidden bg-muted/35" data-emenu-local-shell>
      <div class="flex h-full min-h-0 w-full">
        ${renderSidebar(normalized)}
        ${renderMain(normalized)}
      </div>
    </div>`;
}

export function bindEmenuLocalShell(onMount: () => void): void {
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    const dark = document.documentElement.classList.contains("dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0f172a" : "#f8fafc");
  });

  mountDemoSwitchFab({ showVersionSwitch: false });
  bindViewSwitchControl(onMount);
  bindSeasoningSettingsPage();
  bindEmenuHostIpControl();
}
