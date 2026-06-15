/**
 * 当前登录用户的侧栏一级模块可见性（RBAC + 组织层级）。
 */
import { getAuthenticatedEmail } from "../auth/login";
import { isStoreTierHiddenNavModule } from "../auth/session-scope";
import { getStaffLoginAccountByEmail } from "./staff-account-store";
import {
  buildPermissionModuleGroups,
  type PermissionAccess,
} from "../config/permission-registry";
import { getEffectiveGrant, getRbacSnapshot } from "./rbac-store";
import type { NavModule } from "../config/navigation";

const ACCESS_RANK: Record<PermissionAccess, number> = {
  hidden: 0,
  view: 1,
  operate: 2,
};

function mergeStaffModuleGrants(roleIds: string[]): Record<string, PermissionAccess> {
  const { roles } = getRbacSnapshot();
  const merged: Record<string, PermissionAccess> = {};
  for (const g of buildPermissionModuleGroups()) {
    merged[g.moduleKey] = "hidden";
  }
  for (const roleId of roleIds) {
    const role = roles.find((r) => r.id === roleId);
    if (!role) continue;
    for (const g of buildPermissionModuleGroups()) {
      const eff = getEffectiveGrant(role.grants, g.moduleKey);
      if (ACCESS_RANK[eff] > ACCESS_RANK[merged[g.moduleKey] ?? "hidden"]) {
        merged[g.moduleKey] = eff;
      }
    }
  }
  return merged;
}

function getCurrentUserModuleGrants(): Record<string, PermissionAccess> | null {
  const email = getAuthenticatedEmail();
  if (!email) return null;

  const account = getStaffLoginAccountByEmail(email);
  if (!account) return null;

  const { staff } = getRbacSnapshot();
  const assignment = staff.find((s) => s.employeeId === account.employeeId);
  if (!assignment) return null;

  return mergeStaffModuleGrants(assignment.roleIds);
}

export function isNavModuleVisible(moduleId: string): boolean {
  if (isStoreTierHiddenNavModule(moduleId)) return false;

  const grants = getCurrentUserModuleGrants();
  if (!grants) return true;

  const access = grants[moduleId] ?? getEffectiveGrant(grants, moduleId);
  return access !== "hidden";
}

export function filterVisibleNavModules(modules: NavModule[]): NavModule[] {
  return modules.filter((m) => isNavModuleVisible(m.id));
}
