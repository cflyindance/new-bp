/**
 * M 平台 · 企业级权限 RBAC 存储
 */
import {
  createEnterpriseSeedRoles,
  createEnterpriseSeedStaff,
  createRbacStore,
  getModuleGroups,
  getPermissionIndex,
  normalizeRoleSelection as normalizeRoleSelectionFn,
  cascadeRbacEnableSelection as cascadeRbacEnableSelectionFn,
} from "./rbac-store-factory";
import { inferDefaultStaffStoreAccess, normalizeStaffStoreAccess } from "./store-access";
import type { StaffAssignment } from "./rbac-types";

const enterpriseRbac = createRbacStore({
  storageKey: "menusifu:enterprise-rbac-v1",
  seeds: () => ({
    roles: createEnterpriseSeedRoles(),
    staff: createEnterpriseSeedStaff(),
    changelog: [],
  }),
});

export const getEnterpriseRbacSnapshot = enterpriseRbac.getRbacSnapshot;
export const saveEnterpriseRbacSnapshot = enterpriseRbac.saveRbacSnapshot;
export const getEnterpriseRoleById = enterpriseRbac.getRoleById;
export const getEnterpriseStaffAssignmentByEmployeeId = enterpriseRbac.getStaffAssignmentByEmployeeId;
export const upsertEnterpriseRole = enterpriseRbac.upsertRole;
export const deleteEnterpriseRole = enterpriseRbac.deleteRole;
export const ensureEnterpriseStaffRecord = enterpriseRbac.ensureStaffRecord;
export const updateEnterpriseStaffAssignments = enterpriseRbac.updateStaffAssignments;
export const mergeEnterpriseRoleSelections = enterpriseRbac.mergeRoleSelections;
export const countEnterpriseRoleStats = enterpriseRbac.countRoleStats;
export const getEnterpriseRbacPresetIndex = enterpriseRbac.getRbacPresetIndex;
export const resolveEnterpriseRoleL4SettingAccess = enterpriseRbac.resolveRoleL4SettingAccess;
export const resolveEnterpriseSnapshotL4SettingAccess = enterpriseRbac.resolveSnapshotL4SettingAccess;

export function normalizeEnterpriseRoleSelection(
  selection: Parameters<typeof normalizeRoleSelectionFn>[0],
): ReturnType<typeof normalizeRoleSelectionFn> {
  return enterpriseRbac.normalizeRoleSelection(selection);
}

export function cascadeEnterpriseRbacEnableSelection(
  selection: Parameters<typeof cascadeRbacEnableSelectionFn>[0],
  key: string,
  enabled: boolean,
): ReturnType<typeof cascadeRbacEnableSelectionFn> {
  return enterpriseRbac.cascadeRbacEnableSelection(selection, key, enabled);
}

export function normalizeEnterpriseStaffAssignment(raw: StaffAssignment): StaffAssignment {
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

export { getModuleGroups as getEnterpriseModuleGroups, getPermissionIndex as getEnterprisePermissionIndex };
