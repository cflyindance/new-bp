/**
 * 一级导航排序偏好 — 系统预设顺序 / 用户自定义拖动顺序
 */
import { getAuthenticatedEmail } from "../auth/login";
import { NAV_MODULES, type NavModule } from "./navigation";
import { loadTenantProfile } from "./tenant-profile-storage";

export type NavOrderMode = "system" | "custom";

export interface NavOrderPreferences {
  mode: NavOrderMode;
  /** 自定义模式下可见 L1 moduleId 顺序 */
  customOrder: string[];
}

const STORAGE_KEY = "bplant-nav-order-preferences-v1";

function storageScopeKey(): string {
  const tenantId = loadTenantProfile()?.tenantId ?? "default";
  const email = getAuthenticatedEmail() ?? "anonymous";
  return `${tenantId}:${email}`;
}

function readAll(): Record<string, NavOrderPreferences> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, NavOrderPreferences>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, NavOrderPreferences>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadNavOrderPreferences(): NavOrderPreferences {
  const saved = readAll()[storageScopeKey()];
  if (!saved) return { mode: "system", customOrder: [] };
  return {
    mode: saved.mode === "custom" ? "custom" : "system",
    customOrder: Array.isArray(saved.customOrder) ? [...saved.customOrder] : [],
  };
}

export function saveNavOrderPreferences(prefs: NavOrderPreferences): void {
  const all = readAll();
  all[storageScopeKey()] = {
    mode: prefs.mode === "custom" ? "custom" : "system",
    customOrder: [...prefs.customOrder],
  };
  writeAll(all);
}

/** 将 customOrder 与当前可见模块对齐：保留已知顺序，新增模块追加在末尾 */
export function normalizeCustomNavOrder(visibleModuleIds: string[], customOrder: string[]): string[] {
  const visible = new Set(visibleModuleIds);
  const ordered: string[] = [];
  const used = new Set<string>();

  for (const id of customOrder) {
    if (!visible.has(id) || used.has(id)) continue;
    ordered.push(id);
    used.add(id);
  }
  for (const id of visibleModuleIds) {
    if (!used.has(id)) ordered.push(id);
  }
  return ordered;
}

/** 系统顺序 = NAV_MODULES 中可见项的原始顺序 */
export function sortNavModulesByPreferences(modules: NavModule[], prefs: NavOrderPreferences): NavModule[] {
  if (prefs.mode !== "custom" || prefs.customOrder.length === 0) return modules;

  const byId = new Map(modules.map((m) => [m.id, m]));
  const order = normalizeCustomNavOrder(
    modules.map((m) => m.id),
    prefs.customOrder,
  );
  return order.map((id) => byId.get(id)).filter((m): m is NavModule => m !== undefined);
}

/** 从当前 NAV_MODULES 可见子集生成初始自定义顺序 */
export function buildInitialCustomOrderFromVisible(visibleModules: NavModule[]): string[] {
  const visibleIds = new Set(visibleModules.map((m) => m.id));
  const fromNav = NAV_MODULES.map((m) => m.id).filter((id) => visibleIds.has(id));
  return fromNav;
}

export function setNavOrderMode(mode: NavOrderMode, visibleModules: NavModule[]): NavOrderPreferences {
  const current = loadNavOrderPreferences();
  if (mode === "system") {
    const next = { mode: "system" as const, customOrder: current.customOrder };
    saveNavOrderPreferences(next);
    return next;
  }
  const customOrder =
    current.customOrder.length > 0
      ? normalizeCustomNavOrder(
          visibleModules.map((m) => m.id),
          current.customOrder,
        )
      : buildInitialCustomOrderFromVisible(visibleModules);
  const next = { mode: "custom" as const, customOrder };
  saveNavOrderPreferences(next);
  return next;
}

export function saveCustomNavOrderFromDom(navTree: HTMLElement): void {
  const ids = [...navTree.querySelectorAll<HTMLElement>("[data-nav-drag-row]")]
    .map((el) => el.getAttribute("data-nav-drag-row"))
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;
  const current = loadNavOrderPreferences();
  saveNavOrderPreferences({ mode: "custom", customOrder: ids });
}
