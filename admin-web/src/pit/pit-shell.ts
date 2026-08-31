import { enterPitShell, exitPitShell } from "../shell/app-shell-mode";
import { isPitApiError } from "./pit-api-error";
import { pitApi } from "./pit-api";
import { bindPitLoginPage, renderPitLoginPage } from "./pit-login-page";
import {
  canAccessPitRoute,
  matchPitRoute,
  normalizePitPath,
  PIT_DEFAULT_PATH,
  type PitRouteId,
} from "./pit-routes";
import { clearPitSession, getPitSession, setPitSession } from "./pit-session";
import { bindPitSetupPage, renderPitSetupPage } from "./pit-setup-page";
import type { PitRole, PitUser } from "./pit-types";

type NavItem = { route: PitRouteId; path: string; label: string; eyebrow: string };

const BASE_NAV: readonly NavItem[] = [
  { route: "dashboard", path: "/pit/dashboard", label: "工作台", eyebrow: "01" },
  { route: "requirements", path: "/pit/requirements", label: "需求列表", eyebrow: "02" },
  { route: "exports", path: "/pit/exports", label: "导出记录", eyebrow: "03" },
];

const PAGE_COPY: Record<PitRouteId, { title: string; description: string }> = {
  dashboard: { title: "需求运营工作台", description: "聚合评审、设计、排期与交付节奏。" },
  requirements: { title: "需求列表", description: "按产品线、状态、优先级与负责人管理需求。" },
  "requirement-new": { title: "新建需求", description: "记录一条可评审、可追踪的完整需求。" },
  "requirement-detail": { title: "需求详情", description: "查看需求信息、状态和完整操作时间线。" },
  imports: { title: "首次导入", description: "预检并一次性导入历史需求工作簿。" },
  exports: { title: "导出记录", description: "生成、下载并追踪需求清单导出任务。" },
  dictionaries: { title: "字典配置", description: "管理产品线、来源、类别、问题分类与业态。" },
  users: { title: "用户与权限", description: "管理 PIT 本地账号、角色与会话。" },
  "audit-log": { title: "操作审计", description: "查询关键对象的操作记录和前后差异。" },
  trash: { title: "回收站", description: "查看和恢复已软删除的需求。" },
  backups: { title: "备份管理", description: "检查本地备份状态并创建恢复点。" },
};

let shellEventController: AbortController | null = null;
let activeShellEpoch = 0;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function currentPitPath(): string {
  return normalizePitPath(location.hash.slice(1) || PIT_DEFAULT_PATH);
}

function roleLabel(role: PitRole): string {
  if (role === "admin") return "管理员";
  if (role === "editor") return "编辑者";
  return "只读者";
}

function renderOfflineBanner(offline: boolean, message = ""): string {
  return `<div data-pit-offline-banner role="status" class="${offline ? "flex" : "hidden"} shrink-0 items-center justify-between gap-4 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/70 dark:text-amber-100 sm:px-6"><div class="flex min-w-0 items-center gap-2.5"><span class="relative flex size-2.5 shrink-0"><span class="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-45"></span><span class="relative inline-flex size-2.5 rounded-full bg-amber-600"></span></span><span class="truncate">${escapeHtml(message || "PIT 服务连接中断，已展示内容保持只读。")}</span></div><button type="button" data-pit-retry class="shrink-0 rounded-lg border border-amber-400/70 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:bg-slate-950/40 dark:hover:bg-slate-950">重试连接</button></div>`;
}

function renderLoading(): string {
  return `${renderOfflineBanner(false)}<div class="grid min-h-0 flex-1 place-items-center p-8"><div class="text-center"><div class="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-950 shadow-xl shadow-slate-950/15 dark:bg-amber-400"><span class="font-mono text-sm font-bold tracking-[0.14em] text-amber-300 dark:text-slate-950">PIT</span></div><div class="mx-auto mt-6 h-1 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div class="h-full w-1/2 animate-pulse rounded-full bg-amber-500"></div></div><p class="mt-4 text-sm text-slate-500 dark:text-slate-400">正在连接本地需求池…</p></div></div>`;
}

function renderAuthState(content: string, offline = false, message = ""): string {
  return `${renderOfflineBanner(offline, message)}<div class="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_15%_10%,rgba(245,158,11,.10),transparent_30%),linear-gradient(to_bottom_right,rgba(248,250,252,.86),rgba(241,245,249,.96))] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(245,158,11,.08),transparent_28%),linear-gradient(to_bottom_right,#020617,#0f172a)]">${content}</div>`;
}

function navItems(role: PitRole): NavItem[] {
  return [
    ...BASE_NAV,
    ...(canAccessPitRoute("imports", role) ? [{ route: "imports" as const, path: "/pit/imports", label: "首次导入", eyebrow: "04" }] : []),
    ...(canAccessPitRoute("dictionaries", role) ? [{ route: "dictionaries" as const, path: "/pit/dictionaries", label: "字典配置", eyebrow: "05" }] : []),
    ...(canAccessPitRoute("users", role) ? [{ route: "users" as const, path: "/pit/users", label: "用户与权限", eyebrow: "06" }] : []),
    ...(canAccessPitRoute("audit-log", role) ? [{ route: "audit-log" as const, path: "/pit/audit-log", label: "操作审计", eyebrow: "07" }] : []),
    ...(canAccessPitRoute("trash", role) ? [{ route: "trash" as const, path: "/pit/trash", label: "回收站", eyebrow: "08" }] : []),
    ...(canAccessPitRoute("backups", role) ? [{ route: "backups" as const, path: "/pit/backups", label: "备份管理", eyebrow: "09" }] : []),
  ];
}

function navIcon(route: PitRouteId): string {
  const common = 'class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  if (route === "dashboard") return `<svg ${common}><path d="M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z"/></svg>`;
  if (route === "requirements" || route === "requirement-new" || route === "requirement-detail") return `<svg ${common}><path d="M8 6h11M8 12h11M8 18h7"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>`;
  if (route === "exports") return `<svg ${common}><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/></svg>`;
  if (route === "imports") return `<svg ${common}><path d="M12 16V4m0 0 4 4m-4-4L8 8"/><path d="M5 20h14"/></svg>`;
  if (route === "users") return `<svg ${common}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.2c2.2.5 3.5 2.8 2.6 4.9M17 14c2.3.8 4 3.1 4 6"/></svg>`;
  if (route === "backups") return `<svg ${common}><path d="M4 7h16v13H4zM7 4h10v3M8 11h8M8 15h5"/></svg>`;
  return `<svg ${common}><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>`;
}

function renderNavLink(item: NavItem, activeRoute: PitRouteId, mobile = false): string {
  const active = item.route === activeRoute || (item.route === "requirements" && (activeRoute === "requirement-new" || activeRoute === "requirement-detail"));
  return `<a href="#${item.path}" data-pit-nav-route="${item.route}" class="group flex items-center gap-3 rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${mobile ? "min-w-max px-3 py-2" : "px-3 py-2.5"} ${active ? "bg-amber-400 text-slate-950 shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"}" ${active ? 'aria-current="page"' : ""}><span class="${active ? "text-slate-950" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"}">${navIcon(item.route)}</span><span>${escapeHtml(item.label)}</span>${mobile ? "" : `<span class="ml-auto font-mono text-[10px] ${active ? "text-slate-800/60" : "text-slate-400/70"}">${item.eyebrow}</span>`}</a>`;
}

function renderPageOutlet(route: PitRouteId, requirementId?: string): string {
  const copy = PAGE_COPY[route];
  return `<section data-pit-page-outlet data-pit-route="${route}" class="mx-auto w-full max-w-[94rem] animate-fade-in p-4 sm:p-6 lg:p-8"><div class="relative min-h-[28rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,.04)] dark:border-slate-700 dark:bg-slate-900 sm:p-9"><div class="absolute right-0 top-0 h-28 w-28 border-b border-l border-amber-400/25 bg-[linear-gradient(135deg,transparent_49%,rgba(245,158,11,.12)_50%)]" aria-hidden="true"></div><p class="font-mono text-[11px] uppercase tracking-[0.24em] text-amber-700 dark:text-amber-400">PIT / ${escapeHtml(route.replace(/-/g, " "))}</p><h2 class="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">${escapeHtml(copy.title)}</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">${escapeHtml(copy.description)}</p>${requirementId ? `<p class="mt-5 inline-flex rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">ID ${escapeHtml(requirementId)}</p>` : ""}<div class="mt-12 grid gap-4 md:grid-cols-3" aria-hidden="true">${[["信息结构已就绪", "w-1/2"], ["API 契约已连接", "w-2/3"], ["业务视图下一阶段启用", "w-1/2"]].map(([label, width], index) => `<div class="rounded-xl border border-dashed border-slate-200 p-4 dark:border-slate-700"><span class="font-mono text-[10px] text-amber-700 dark:text-amber-400">0${index + 1}</span><div class="mt-4 h-2 ${width} rounded bg-slate-100 dark:bg-slate-800"></div><p class="mt-4 text-xs text-slate-400">${label}</p></div>`).join("")}</div></div></section>`;
}

function renderWorkspace(path: string, user: PitUser, offline = false, message = ""): string {
  const matched = matchPitRoute(path);
  const items = navItems(user.role);
  return `${renderOfflineBanner(offline, message)}<div class="flex min-h-0 flex-1">
    <aside class="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex lg:w-72">
      <div class="flex items-center gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800"><span class="grid size-11 place-items-center rounded-xl bg-slate-950 font-mono text-sm font-bold tracking-[0.14em] text-amber-300 dark:bg-amber-400 dark:text-slate-950">PIT</span><div><p class="font-semibold tracking-tight text-slate-950 dark:text-white">需求池</p><p class="text-xs text-slate-500">Requirement operations</p></div></div>
      <nav data-pit-navigation class="min-h-0 flex-1 overflow-y-auto p-3" aria-label="PIT 主导航"><p class="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Lifecycle desk</p><div class="space-y-1">${items.map((item) => renderNavLink(item, matched.id)).join("")}</div></nav>
      <div class="border-t border-slate-200 p-4 dark:border-slate-800"><button type="button" data-pit-exit class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white"><span>返回商家后台</span><span aria-hidden="true">↗</span></button><p class="mt-3 px-3 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">LAN server · local data</p></div>
    </aside>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header class="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6"><div class="min-w-0"><p class="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Product intake &amp; tracking</p><h1 class="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-white">${escapeHtml(PAGE_COPY[matched.id].title)}</h1></div><div class="flex shrink-0 items-center gap-2"><button type="button" data-pit-theme-toggle class="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="切换深浅主题"><svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></button><div class="relative" data-pit-user-menu><button type="button" data-pit-user-menu-toggle class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-left hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800" aria-haspopup="menu" aria-expanded="false"><span class="grid size-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-amber-300 dark:bg-amber-400 dark:text-slate-950">${escapeHtml(user.displayName.slice(0, 1).toUpperCase())}</span><span class="hidden sm:block"><span class="block max-w-28 truncate text-xs font-semibold text-slate-900 dark:text-white">${escapeHtml(user.displayName)}</span><span class="block text-[10px] text-slate-500">${roleLabel(user.role)}</span></span></button><div data-pit-user-menu-panel role="menu" class="absolute right-0 top-12 z-30 hidden w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"><div class="border-b border-slate-100 px-2.5 py-2 dark:border-slate-800"><p class="truncate text-xs font-semibold text-slate-900 dark:text-white">${escapeHtml(user.username)}</p><p class="mt-0.5 text-[10px] text-slate-500">PIT ${roleLabel(user.role)}</p></div><button type="button" data-pit-logout role="menuitem" class="mt-1 w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">退出登录</button></div></div></div></header>
      <nav data-pit-navigation class="shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950 md:hidden" aria-label="PIT 移动导航"><div class="flex min-w-max gap-1">${items.map((item) => renderNavLink(item, matched.id, true)).join("")}</div></nav>
      <main class="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">${renderPageOutlet(matched.id, matched.requirementId)}</main>
    </div>
  </div>`;
}

function bindRetry(root: HTMLElement, retry: () => void): void {
  root.querySelector<HTMLButtonElement>("[data-pit-retry]")?.addEventListener("click", retry);
}

function bindWorkspace(root: HTMLElement, onMount: () => void, render: (html: string) => void, isActive: () => boolean): void {
  root.querySelector<HTMLButtonElement>("[data-pit-theme-toggle]")?.addEventListener("click", () => document.documentElement.classList.toggle("dark"));
  const menu = root.querySelector<HTMLElement>("[data-pit-user-menu]");
  const toggle = root.querySelector<HTMLButtonElement>("[data-pit-user-menu-toggle]");
  const panel = root.querySelector<HTMLElement>("[data-pit-user-menu-panel]");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    panel?.classList.toggle("hidden", !open);
  });
  root.querySelector<HTMLButtonElement>("[data-pit-exit]")?.addEventListener("click", () => {
    exitPitShell();
    location.hash = "#/";
    onMount();
  });
  root.querySelector<HTMLButtonElement>("[data-pit-logout]")?.addEventListener("click", async () => {
    if (!isActive()) return;
    try {
      await pitApi.logout();
      if (!isActive()) return;
      clearPitSession();
      onMount();
    } catch (error) {
      if (!isActive()) return;
      if (isPitApiError(error) && error.status === 401) {
        clearPitSession();
        onMount();
      } else {
        const session = getPitSession();
        if (session.user) render(renderWorkspace(currentPitPath(), session.user, true, isPitApiError(error) ? error.message : "退出失败。"));
      }
    }
  });
}

function renderAuthenticated(root: HTMLElement, onMount: () => void, render: (html: string) => void, isActive: () => boolean): void {
  if (!isActive()) return;
  const user = getPitSession().user;
  if (!user) return;
  const path = currentPitPath();
  const matched = matchPitRoute(path);
  if (!canAccessPitRoute(matched.id, user.role)) {
    location.hash = `#${PIT_DEFAULT_PATH}`;
    onMount();
    return;
  }
  render(renderWorkspace(path, user));
  bindWorkspace(root, onMount, render, isActive);
}

export function mountPitShell(_onMount: () => void, path: string): string {
  enterPitShell();
  const epoch = ++activeShellEpoch;
  return `<div data-pit-shell data-pit-epoch="${epoch}" data-pit-path="${escapeHtml(path)}" class="relative flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100"><div data-pit-shell-surface class="flex min-h-0 flex-1 flex-col">${renderLoading()}</div></div>`;
}

export function bindPitShell(onMount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-pit-shell]");
  const surface = root?.querySelector<HTMLElement>("[data-pit-shell-surface]");
  if (!root || !surface || root.dataset.pitShellBound === "1") return;
  const shellRoot = root;
  const shellSurface = surface;
  shellRoot.dataset.pitShellBound = "1";
  shellEventController?.abort();
  const eventController = new AbortController();
  shellEventController = eventController;
  const signal = eventController.signal;
  const lifecycleRoot = document.getElementById("app") ?? document.body;
  const lifecycleObserver = new MutationObserver(() => {
    if (!shellRoot.isConnected) eventController.abort();
  });
  lifecycleObserver.observe(lifecycleRoot, { childList: true, subtree: true });
  signal.addEventListener("abort", () => lifecycleObserver.disconnect(), { once: true });
  const shellEpoch = Number(shellRoot.dataset.pitEpoch);
  const isActive = (): boolean => !signal.aborted
    && shellEpoch === activeShellEpoch
    && shellRoot.isConnected
    && shellSurface.isConnected;
  const render = (html: string): void => {
    if (isActive()) shellSurface.innerHTML = html;
  };
  let bootstrapAttempt = 0;

  const showLogin = (message = "", offline = false): void => {
    if (!isActive()) return;
    render(renderAuthState(renderPitLoginPage(message), offline, message));
    bindRetry(shellRoot, bootstrap);
    bindPitLoginPage(shellRoot, {
      onAuthenticated: () => renderAuthenticated(shellRoot, onMount, render, isActive),
      onOffline: (offlineMessage) => showLogin(offlineMessage, true),
      isActive,
    });
  };

  const showSetup = (message = "", offline = false): void => {
    if (!isActive()) return;
    render(renderAuthState(renderPitSetupPage(message), offline, message));
    bindRetry(shellRoot, bootstrap);
    bindPitSetupPage(shellRoot, {
      onAuthenticated: () => renderAuthenticated(shellRoot, onMount, render, isActive),
      onOffline: (offlineMessage) => showSetup(offlineMessage, true),
      isActive,
    });
  };

  async function bootstrap(): Promise<void> {
    const attempt = ++bootstrapAttempt;
    const isCurrentAttempt = (): boolean => isActive() && attempt === bootstrapAttempt;
    render(renderLoading());
    try {
      const setup = await pitApi.setupStatus();
      if (!isCurrentAttempt()) return;
      if (setup.needsBootstrap) {
        clearPitSession();
        showSetup();
        return;
      }
      try {
        const auth = await pitApi.me();
        if (!isCurrentAttempt()) return;
        setPitSession(auth);
        renderAuthenticated(shellRoot, onMount, render, isActive);
      } catch (error) {
        if (!isCurrentAttempt()) return;
        if (isPitApiError(error) && error.status === 401) showLogin();
        else if (getPitSession().user) {
          render(renderWorkspace(currentPitPath(), getPitSession().user!, true, isPitApiError(error) ? error.message : "PIT 服务连接中断。"));
          bindRetry(shellRoot, bootstrap);
          bindWorkspace(shellRoot, onMount, render, isActive);
        } else showLogin(isPitApiError(error) ? error.message : "PIT 服务连接中断。", true);
      }
    } catch (error) {
      if (!isCurrentAttempt()) return;
      const message = isPitApiError(error) ? error.message : "无法连接 PIT 服务。";
      if (getPitSession().user) {
        render(renderWorkspace(currentPitPath(), getPitSession().user!, true, message));
        bindRetry(shellRoot, bootstrap);
        bindWorkspace(shellRoot, onMount, render, isActive);
      } else showLogin(message, true);
    }
  }

  window.addEventListener("pit:unauthorized", () => {
    if (!isActive()) return;
    clearPitSession();
    showLogin();
  }, { signal });
  window.addEventListener("pit:forbidden", () => {
    if (!isActive()) return;
    void pitApi.me().then((auth) => {
      if (!isActive()) return;
      setPitSession(auth);
      renderAuthenticated(shellRoot, onMount, render, isActive);
    }).catch((error) => {
      if (!isActive()) return;
      if (isPitApiError(error) && error.status === 401) {
        clearPitSession();
        showLogin();
      }
    });
  }, { signal });

  void bootstrap();
}
