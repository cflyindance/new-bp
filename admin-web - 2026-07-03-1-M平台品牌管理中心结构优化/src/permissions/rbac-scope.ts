/**
 * 权限管理中心 · 商家级 vs 企业级（M 平台）作用域
 */
import type { RbacStoreApi } from "./rbac-scope-types";
import * as merchantRbac from "./rbac-store";
import * as enterpriseRbac from "./enterprise-rbac-store";
import * as merchantStaffAccounts from "./staff-account-store";
import * as enterpriseStaffAccounts from "./enterprise-staff-account-store";

export type RbacScope = "merchant" | "enterprise";

export interface RbacScopeConfig {
  scope: RbacScope;
  routePrefix: string;
  moduleLabel: string;
  overviewIntro: string;
  rolesIntro: string;
  staffIntro: string;
  staffDataScopeColumn: string;
  staffAccountsIntro: string;
  staffAccountsDetail: string;
  saveStaffSuccessMessage: string;
  isEnterpriseStaff: boolean;
  rbac: RbacStoreApi;
  staffAccounts: typeof merchantStaffAccounts;
}

export const MERCHANT_RBAC_SCOPE: RbacScopeConfig = {
  scope: "merchant",
  routePrefix: "/permissions",
  moduleLabel: "权限管理中心",
  overviewIntro:
    "按 <strong class=\"text-card-foreground\">一级导航 → 二级导航 → 三级分组 → 功能设置</strong> 四级树配置角色权限；通过<strong class=\"text-card-foreground\">勾选导航功能</strong>启用或关闭访问（与平台预设 · 配置预设交互一致）。门店角色、员工登录账号与员工绑定在本区维护。",
  rolesIntro:
    "创建角色并按四级导航树勾选功能权限（与平台预设 · 配置预设一致）。员工登录账号在员工登录账号页维护。",
  staffIntro:
    "为员工分配角色（功能权限并集）与<strong>可访问门店</strong>（数据范围）。切换顶栏门店只改变数据查询范围，<strong>不会</strong>改变功能权限。登录邮箱与密码请在员工登录账号维护。",
  staffDataScopeColumn: "可访问门店（数据范围）",
  staffAccountsIntro:
    "维护员工登录<strong class=\"text-card-foreground\">本系统（B 端管理中心）</strong>的邮箱账号与密码。账号须为 Menusifu 企业邮箱；保存后立即生效。",
  staffAccountsDetail:
    "新建时可手动输入员工工号与姓名（将同步写入员工授权）；角色权限与门店范围请在员工授权中配置。",
  saveStaffSuccessMessage:
    "员工授权已保存（本地演示数据）。若修改了当前登录账号，请刷新页面或重新登录以同步顶栏门店选项。",
  isEnterpriseStaff: false,
  rbac: {
    getRbacSnapshot: merchantRbac.getRbacSnapshot,
    getRoleById: merchantRbac.getRoleById,
    upsertRole: merchantRbac.upsertRole,
    deleteRole: merchantRbac.deleteRole,
    ensureStaffRecord: merchantRbac.ensureStaffRecord,
    updateStaffAssignments: merchantRbac.updateStaffAssignments,
    countRoleStats: merchantRbac.countRoleStats,
    getRbacPresetIndex: merchantRbac.getRbacPresetIndex,
    normalizeRoleSelection: merchantRbac.normalizeRoleSelection,
    cascadeRbacEnableSelection: merchantRbac.cascadeRbacEnableSelection,
    getModuleGroups: merchantRbac.getModuleGroups,
    getPermissionIndex: merchantRbac.getPermissionIndex,
  },
  staffAccounts: merchantStaffAccounts,
};

export const ENTERPRISE_RBAC_SCOPE: RbacScopeConfig = {
  scope: "enterprise",
  routePrefix: "/m-platform/permissions",
  moduleLabel: "M 平台",
  overviewIntro:
    "企业级权限管理：按四级导航树为企业级员工配置角色功能权限；员工登录账号、角色绑定与变更记录与商家后台逻辑一致，数据独立存储。",
  rolesIntro:
    "创建企业级角色并按四级导航树勾选功能权限。企业级员工登录账号在员工登录账号页维护。",
  staffIntro:
    "为企业级员工分配角色（功能权限并集）与<strong>企业数据范围</strong>（可管辖的下属门店/租户）。功能权限与数据范围相互独立。",
  staffDataScopeColumn: "企业数据范围",
  staffAccountsIntro:
    "维护企业级员工登录<strong class=\"text-card-foreground\">M 平台</strong>的邮箱账号与密码。账号须为 Menusifu 企业邮箱；保存后立即生效。",
  staffAccountsDetail:
    "新建时可手动输入员工工号与姓名（将同步写入员工授权）；角色权限与企业数据范围请在员工授权中配置。",
  saveStaffSuccessMessage: "企业级员工授权已保存（本地演示数据）。",
  isEnterpriseStaff: true,
  rbac: {
    getRbacSnapshot: enterpriseRbac.getEnterpriseRbacSnapshot,
    getRoleById: enterpriseRbac.getEnterpriseRoleById,
    upsertRole: enterpriseRbac.upsertEnterpriseRole,
    deleteRole: enterpriseRbac.deleteEnterpriseRole,
    ensureStaffRecord: enterpriseRbac.ensureEnterpriseStaffRecord,
    updateStaffAssignments: enterpriseRbac.updateEnterpriseStaffAssignments,
    countRoleStats: enterpriseRbac.countEnterpriseRoleStats,
    getRbacPresetIndex: enterpriseRbac.getEnterpriseRbacPresetIndex,
    normalizeRoleSelection: enterpriseRbac.normalizeEnterpriseRoleSelection,
    cascadeRbacEnableSelection: enterpriseRbac.cascadeEnterpriseRbacEnableSelection,
    getModuleGroups: enterpriseRbac.getEnterpriseModuleGroups,
    getPermissionIndex: enterpriseRbac.getEnterprisePermissionIndex,
  },
  staffAccounts: enterpriseStaffAccounts,
};

export function isMPlatformPermissionsPath(path: string): boolean {
  return path === "/m-platform/permissions" || path.startsWith("/m-platform/permissions/");
}

export function isMerchantPermissionsPath(path: string): boolean {
  return (
    path === "/permissions/overview" ||
    path === "/permissions/roles" ||
    path.startsWith("/permissions/roles/") ||
    path === "/permissions/staff" ||
    path === "/permissions/staff-accounts" ||
    path === "/permissions/change-log"
  );
}

export function isAnyPermissionsRbacPath(path: string): boolean {
  return isMerchantPermissionsPath(path) || isMPlatformPermissionsPath(path);
}

export function getRbacScopeForPath(path: string): RbacScopeConfig {
  if (isMPlatformPermissionsPath(path)) return ENTERPRISE_RBAC_SCOPE;
  return MERCHANT_RBAC_SCOPE;
}

export function rbacHref(scope: RbacScopeConfig, subpath: string): string {
  const normalized = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `#${scope.routePrefix}${normalized}`;
}

export function stripRbacRoutePrefix(path: string, scope: RbacScopeConfig): string {
  if (path === scope.routePrefix) return "/overview";
  if (path.startsWith(`${scope.routePrefix}/`)) {
    return path.slice(scope.routePrefix.length);
  }
  return path;
}

export function findRbacPageTitle(
  path: string,
  scope: RbacScopeConfig,
): { title: string; module: string } | null {
  if (!path.startsWith(scope.routePrefix)) return null;
  const sub = stripRbacRoutePrefix(path, scope);
  if (sub === "/overview" || sub === "") return { title: "权限总览", module: scope.moduleLabel };
  if (sub === "/roles") return { title: "角色与权限", module: scope.moduleLabel };
  if (sub === "/staff") return { title: "员工授权", module: scope.moduleLabel };
  if (sub === "/staff-accounts") return { title: "员工登录账号", module: scope.moduleLabel };
  if (sub === "/change-log") return { title: "变更记录", module: scope.moduleLabel };
  if (sub === "/roles/new") return { title: "新建角色", module: scope.moduleLabel };
  if (sub.startsWith("/roles/edit/")) {
    const id = decodeURIComponent(sub.replace("/roles/edit/", ""));
    return { title: id ? `编辑角色 · ${id}` : "编辑角色", module: scope.moduleLabel };
  }
  return null;
}
