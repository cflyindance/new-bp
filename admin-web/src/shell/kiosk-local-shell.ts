/** Kiosk 本地配置后台：沿用 eMenu 本地后台的独立壳层与视觉语言。 */
import { t } from "../i18n";
import { BUILD_STAMP } from "../generated/build-stamp";
import { mountDemoSwitchFab } from "./demo-switch-control";
import { bindViewSwitchControl } from "./view-switch-control";
import { bindKioskLocalSessionBridge } from "./kiosk-local-session-bridge";
import {
  KIOSK_EMBED_DESIGN_HEIGHT,
  KIOSK_EMBED_DESIGN_WIDTH,
  bindKioskEmbedViewportFit,
} from "./kiosk-local-embed-fit";
import { bindEmenuHostIpControl, renderEmenuHostIpControl } from "./emenu-local-host-control-ui";
import { withEmbedLanguageParam } from "./embed-ui-locale";
import { bindUiLocaleControl, renderUiLocaleControl } from "./ui-locale-control";
import {
  KIOSK_LOCAL_NAV_ITEMS,
  getActiveKioskLocalNavItem,
  normalizeKioskLocalPath,
  type KioskLocalIcon,
  type KioskLocalNavItem,
} from "./kiosk-local-routes";

/** 本地 dist/kiosklite/.embed-build；挂在 /kpos/kiosklite 以便 API 基址走同源 /kpos 代理 */
function kioskIframeSrc(): string {
  return withEmbedLanguageParam(`./kpos/kiosklite/index.html?embedded=1&v=${BUILD_STAMP}`);
}

/** 对应主机配置页 #/configApp；业务数据经 /kpos 代理到 POS */
function kioskSettingsIframeSrc(): string {
  return withEmbedLanguageParam(`./kpos/kiosklite/index.html?embedded=1&v=${BUILD_STAMP}#/configApp`);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderIcon(kind: KioskLocalIcon, className = "size-5"): string {
  const attrs = `class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  if (kind === "service") return `<svg ${attrs}><path d="M4 7h16M7 3v4m10-4v4M5 11h6v8H5zm10 0h4v4h-4z"/></svg>`;
  if (kind === "fee") return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5c-.8-.7-1.9-1-3.2-1-1.7 0-2.8.8-2.8 2s1 1.8 3 2.1 3 1 3 2.3-1.2 2.1-3 2.1c-1.4 0-2.7-.4-3.6-1.2M12 5.5v13"/></svg>`;
  if (kind === "brand") return `<svg ${attrs}><path d="M4 20V7l8-4 8 4v13M8 20v-6h8v6M8 9h.01M12 9h.01M16 9h.01"/></svg>`;
  if (kind === "promotion") return `<svg ${attrs}><path d="m4 12 8-8h6l2 2v6l-8 8Z"/><circle cx="16" cy="8" r="1"/><path d="m8 15 5-5"/></svg>`;
  if (kind === "device") return `<svg ${attrs}><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M9 6h6M10 18h4"/></svg>`;
  if (kind === "screen") return `<svg ${attrs}><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 12l3-3 3 3 2-2 2 2"/></svg>`;
  if (kind === "tag") return `<svg ${attrs}><path d="M20 13 13 20 4 11V4h7Z"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>`;
  if (kind === "logo") return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="m8 15 4-8 4 8M9.5 12h5"/></svg>`;
  if (kind === "image") return `<svg ${attrs}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 17 5-5 3 3 2-2 4 4"/></svg>`;
  if (kind === "kiosk") return `<svg ${attrs}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5M9 20h6"/></svg>`;
  if (kind === "settings") return `<svg ${attrs}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
  return `<svg ${attrs}><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/></svg>`;
}

function renderNavLink(item: KioskLocalNavItem, active: boolean, mobile = false): string {
  const state = active ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/10" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground";
  return `<a href="#${item.path}" data-kiosk-local-nav="${escapeHtml(item.id)}" class="group flex min-h-11 items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mobile ? "min-w-max px-3.5" : "w-full px-3"} ${state}" ${active ? 'aria-current="page"' : ""}><span class="flex size-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}">${renderIcon(item.icon, "size-[18px]")}</span><span class="truncate">${escapeHtml(t(item.titleKey))}</span></a>`;
}

function renderSidebar(path: string): string {
  const active = getActiveKioskLocalNavItem(path);
  return `<aside class="hidden h-full w-60 shrink-0 flex-col border-r border-border/80 bg-card md:flex lg:w-64"><div class="border-b border-border/80 px-5 py-5"><div class="flex items-center gap-3"><span class="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold tracking-tight text-white shadow-sm dark:bg-slate-100 dark:text-slate-950">KS</span><div class="min-w-0"><p class="truncate text-base font-semibold tracking-tight text-foreground">Kiosk</p><p class="truncate text-xs text-muted-foreground">${escapeHtml(t("shell.kioskLocalTitle"))}</p></div></div></div><nav class="min-h-0 flex-1 overflow-y-auto p-3" aria-label="${escapeHtml(t("shell.kioskLocalNavAria"))}"><p class="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">${escapeHtml(t("shell.kioskLocalWorkspace"))}</p><div class="space-y-1">${KIOSK_LOCAL_NAV_ITEMS.map((item) => renderNavLink(item, item.id === active.id)).join("")}</div></nav><div class="border-t border-border/80 px-5 py-4"><p class="text-xs text-muted-foreground">${escapeHtml(t("shell.kioskLocalRuntime"))}</p></div></aside>`;
}

function renderMobileNav(path: string): string {
  const active = getActiveKioskLocalNavItem(path);
  return `<nav class="overflow-x-auto border-b border-border/70 px-3 py-2 md:hidden" aria-label="${escapeHtml(t("shell.kioskLocalNavAria"))}"><div class="flex min-w-max gap-1">${KIOSK_LOCAL_NAV_ITEMS.map((item) => renderNavLink(item, item.id === active.id, true)).join("")}</div></nav>`;
}

function renderPlaceholder(item: KioskLocalNavItem): string {
  return `<section data-kiosk-local-placeholder="${escapeHtml(item.id)}" class="relative flex min-h-[26rem] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-card px-6 py-12 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10" aria-labelledby="kiosk-local-placeholder-title"><div class="pointer-events-none absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true"></div><div class="relative mx-auto flex max-w-xl flex-col items-center text-center"><div class="relative mb-8 flex h-36 w-52 items-center justify-center" aria-hidden="true"><div class="absolute left-2 top-6 h-24 w-36 rounded-2xl border border-border bg-muted/70"></div><div class="absolute right-2 top-1 h-28 w-40 rounded-2xl border border-border bg-background shadow-sm"></div><div class="absolute right-7 top-6 grid h-16 w-28 grid-cols-3 gap-2 rounded-xl border border-border/80 bg-card p-3"><span class="rounded-md bg-primary/15"></span><span class="rounded-md bg-muted"></span><span class="rounded-md bg-muted"></span><span class="rounded-md bg-muted"></span><span class="rounded-md bg-primary/10"></span><span class="rounded-md bg-muted"></span></div><span class="absolute bottom-0 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">${renderIcon(item.icon, "size-7")}</span></div><span class="mb-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold tracking-wide text-primary">${escapeHtml(t("shell.kioskLocalComingSoon"))}</span><h2 id="kiosk-local-placeholder-title" class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">${escapeHtml(t(item.titleKey))}</h2><p class="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">${escapeHtml(t(item.descriptionKey))}</p></div></section>`;
}

function renderKioskAspectFrame(options: {
  frameAttr: string;
  ariaLabel: string;
  iframeTitle: string;
  src: string;
}): string {
  const { frameAttr, ariaLabel, iframeTitle, src } = options;
  return `<section ${frameAttr} class="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden" aria-label="${escapeHtml(ariaLabel)}"><div data-kiosk-embed-stage class="relative aspect-video w-full max-h-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] [max-width:min(100%,calc((100dvh-11rem)*16/9))]"><iframe data-kiosk-embed-iframe title="${escapeHtml(iframeTitle)}" class="absolute left-0 top-0 block border-0" style="width:${KIOSK_EMBED_DESIGN_WIDTH}px;height:${KIOSK_EMBED_DESIGN_HEIGHT}px;transform-origin:top left" src="${escapeHtml(src)}" referrerpolicy="no-referrer-when-downgrade" allow="clipboard-read; clipboard-write; fullscreen"></iframe></div></section>`;
}

function renderKioskIframePage(): string {
  return renderKioskAspectFrame({
    frameAttr: 'data-kiosk-local-kiosk-frame',
    ariaLabel: t("shell.kioskLocalKiosk"),
    iframeTitle: t("shell.kioskLocalKiosk"),
    src: kioskIframeSrc(),
  });
}

function renderKioskSettingsIframePage(): string {
  return renderKioskAspectFrame({
    frameAttr: 'data-kiosk-local-kiosk-settings-frame',
    ariaLabel: t("shell.kioskLocalKioskSettings"),
    iframeTitle: t("shell.kioskLocalKioskSettings"),
    src: kioskSettingsIframeSrc(),
  });
}

function renderMain(path: string): string {
  const active = getActiveKioskLocalNavItem(path);
  const body =
    active.id === "kiosk"
      ? renderKioskIframePage()
      : active.id === "kiosk-settings"
        ? renderKioskSettingsIframePage()
        : renderPlaceholder(active);
  return `<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"><header class="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-card/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"><div class="min-w-0"><p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">${escapeHtml(t("shell.kioskLocalKicker"))}</p><h1 id="main-content" tabindex="-1" class="truncate text-xl font-semibold tracking-tight text-foreground">${escapeHtml(t(active.titleKey))}</h1></div><div class="flex shrink-0 items-center gap-2">${renderEmenuHostIpControl()}${renderUiLocaleControl()}<button type="button" id="theme-toggle" class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="${escapeHtml(t("header.themeToggle"))}"><svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></button></div></header>${renderMobileNav(path)}<main class="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/35 p-3 sm:p-5 lg:p-7"><div class="mx-auto flex min-h-0 w-full max-w-[88rem] flex-1 flex-col animate-fade-in">${body}</div></main></div>`;
}

export function mountKioskLocalShell(_onMount: () => void, path: string): string {
  const normalized = normalizeKioskLocalPath(path);
  return `<div class="relative h-dvh min-h-0 w-full overflow-hidden bg-muted/35" data-kiosk-local-shell><div class="flex h-full min-h-0 w-full">${renderSidebar(normalized)}${renderMain(normalized)}</div></div>`;
}

export function bindKioskLocalShell(onMount: () => void): void {
  document.getElementById("theme-toggle")?.addEventListener("click", () => document.documentElement.classList.toggle("dark"));
  mountDemoSwitchFab({ showVersionSwitch: false });
  bindViewSwitchControl(onMount);
  bindEmenuHostIpControl();
  bindKioskLocalSessionBridge();
  bindKioskEmbedViewportFit();
  bindUiLocaleControl(() => {
    onMount();
  });
}
