import type { PlatformPresetNodeSelection } from "../config/platform-preset-store";
import type { RbacRole } from "./rbac-types";

export interface RbacStoreApi {
  getRbacSnapshot: () => {
    roles: RbacRole[];
    staff: import("./rbac-types").StaffAssignment[];
    changelog: import("./rbac-types").PermissionChangeLogEntry[];
  };
  getRoleById: (id: string) => RbacRole | undefined;
  upsertRole: (role: RbacRole, logDetail: string, actor?: string) => void;
  deleteRole: (id: string) => boolean;
  ensureStaffRecord: (employeeId: string, employeeName: string) => import("./rbac-types").StaffAssignment;
  updateStaffAssignments: (
    staff: import("./rbac-types").StaffAssignment[],
    options?: import("./rbac-store-factory").UpdateStaffAssignmentsOptions,
  ) => import("./rbac-store-factory").UpdateStaffAssignmentsResult;
  countRoleStats: (role: RbacRole) => { enabled: number; total: number; enabledL1: number };
  getRbacPresetIndex: () => ReturnType<typeof import("../config/platform-preset-tree").buildPlatformPresetIndex>;
  normalizeRoleSelection: (
    selection: Record<string, PlatformPresetNodeSelection>,
  ) => Record<string, PlatformPresetNodeSelection>;
  cascadeRbacEnableSelection: (
    selection: Record<string, PlatformPresetNodeSelection>,
    key: string,
    enabled: boolean,
  ) => Record<string, PlatformPresetNodeSelection>;
  getModuleGroups: () => ReturnType<
    typeof import("../config/permission-registry").buildPermissionModuleGroups
  >;
  getPermissionIndex: () => ReturnType<
    typeof import("../config/permission-registry").buildPermissionResourceIndex
  >;
}
