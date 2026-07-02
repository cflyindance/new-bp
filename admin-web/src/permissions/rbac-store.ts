/**
 * 商家后台 · 权限 RBAC 存储（localStorage 演示）
 */
import { parsePermissionAccess, type PermissionAccess } from "../config/permission-registry";
import {
  createMerchantSeedRoles,
  createMerchantSeedStaff,
  createRbacStore,
  getModuleGroups,
  getPermissionIndex,
  normalizeRoleSelection as normalizeRoleSelectionFn,
  cascadeRbacEnableSelection as cascadeRbacEnableSelectionFn,
} from "./rbac-store-factory";
import { inferDefaultStaffStoreAccess, normalizeStaffStoreAccess } from "./store-access";
import type {
  PermissionChangeLogEntry,
  RbacRole,
  RbacStoreSnapshot,
  ResolvedL4SettingAccess,
  StaffAssignment,
} from "./rbac-types";

export type {
  RbacRole,
  StaffAssignment,
  PermissionChangeLogEntry,
  RbacStoreSnapshot,
  ResolvedL4SettingAccess,
  StaffStoreAccess,
  StaffStoreAccessMode,
} from "./rbac-types";

const merchantRbac = createRbacStore({
  storageKey: "menusifu:rbac-v3",
  legacyStorageKeys: ["menusifu:rbac-v1", "menusifu:rbac-v2"],
  seeds: () => ({
    roles: createMerchantSeedRoles(),
    staff: createMerchantSeedStaff(),
    changelog: [],
  }),
});

export const getRbacSnapshot = merchantRbac.getRbacSnapshot;
export const saveRbacSnapshot = merchantRbac.saveRbacSnapshot;
export const getRoleById = merchantRbac.getRoleById;
export const getStaffAssignmentByEmployeeId = merchantRbac.getStaffAssignmentByEmployeeId;
export const upsertRole = merchantRbac.upsertRole;
export const deleteRole = merchantRbac.deleteRole;
export const ensureStaffRecord = merchantRbac.ensureStaffRecord;
export const updateStaffAssignments = merchantRbac.updateStaffAssignments;
export const mergeRoleSelections = merchantRbac.mergeRoleSelections;
export const countRoleStats = merchantRbac.countRoleStats;
export const getRbacPresetIndex = merchantRbac.getRbacPresetIndex;
export const resolveRoleL4SettingAccess = merchantRbac.resolveRoleL4SettingAccess;
export const resolveSnapshotL4SettingAccess = merchantRbac.resolveSnapshotL4SettingAccess;

export function normalizeRoleSelection(
  selection: Parameters<typeof normalizeRoleSelectionFn>[0],
): ReturnType<typeof normalizeRoleSelectionFn> {
  return merchantRbac.normalizeRoleSelection(selection);
}

export function cascadeRbacEnableSelection(
  selection: Parameters<typeof cascadeRbacEnableSelectionFn>[0],
  key: string,
  enabled: boolean,
): ReturnType<typeof cascadeRbacEnableSelectionFn> {
  return merchantRbac.cascadeRbacEnableSelection(selection, key, enabled);
}

export function normalizeStaffAssignment(raw: StaffAssignment): StaffAssignment {
  return {
    employeeId: raw.employeeId,
    employeeName: raw.employeeName,
    roleIds: [...(raw.roleIds ?? [])],
    storeAccess: normalizeStaffStoreAccess(
      raw.storeAccess,
      inferDefaultStaffStoreAccess(raw.employeeId),
    ),
  };
}

export function mergeRoleGrants(
  base: Record<string, PermissionAccess>,
  key: string,
  access: PermissionAccess,
): Record<string, PermissionAccess> {
  return { ...base, [key]: parsePermissionAccess(access) };
}

export function removeRoleGrant(
  base: Record<string, PermissionAccess>,
  key: string,
): Record<string, PermissionAccess> {
  const next = { ...base };
  delete next[key];
  return next;
}

export { getModuleGroups, getPermissionIndex };
