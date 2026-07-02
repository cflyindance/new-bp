/**
 * 当前登录用户的侧栏一级模块可见性（RBAC 会话快照 + 组织层级）。
 * 切门店只改数据 scope，不重算 permissionSnapshot。
 */
import { getUserSessionContext } from "../auth/session-permissions";
import { isStoreTierHiddenNavModule } from "../auth/session-scope";
import { buildPermissionModuleGroups } from "../config/permission-registry";
import { NAV_MODULES, type NavModule } from "../config/navigation";
import { readSidebarNavLayoutPreset } from "../config/sidebar-nav-order";

function getSessionModuleEnabled(): Record<string, boolean> | null {
  const ctx = getUserSessionContext();
  if (!ctx) return null;

  const merged: Record<string, boolean> = {};
  for (const g of buildPermissionModuleGroups()) {
    merged[g.moduleKey] = ctx.permissionSnapshot[g.moduleKey]?.enabled === true;
  }
  return merged;
}

export function isNavModuleVisible(moduleId: string): boolean {
  if (isStoreTierHiddenNavModule(moduleId)) return false;
  if (moduleId === "brand-mgmt" && readSidebarNavLayoutPreset() === "chain") return true;

  const enabledMap = getSessionModuleEnabled();
  if (!enabledMap) return true;

  return enabledMap[moduleId] === true;
}

export function filterVisibleNavModules(modules: NavModule[]): NavModule[] {
  const visible = modules.filter((m) => isNavModuleVisible(m.id));
  if (readSidebarNavLayoutPreset() !== "chain") return visible;
  if (visible.some((m) => m.id === "brand-mgmt")) return visible;
  const brand = NAV_MODULES.find((m) => m.id === "brand-mgmt");
  return brand ? [brand, ...visible] : visible;
}
