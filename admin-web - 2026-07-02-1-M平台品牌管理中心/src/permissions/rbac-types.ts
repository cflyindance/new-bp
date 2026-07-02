import type { PlatformPresetNodeSelection } from "../config/platform-preset-store";
import type { PermissionAccess } from "../config/permission-registry";
import type { StaffStoreAccess } from "./store-access";

export type { StaffStoreAccess, StaffStoreAccessMode } from "./store-access";

export interface RbacRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  /** 与平台预设一致：导航节点启用/展示 */
  selection: Record<string, PlatformPresetNodeSelection>;
  updatedAt: string;
  /** @deprecated v2 稀疏 grants，加载时迁移为 selection */
  grants?: Record<string, PermissionAccess>;
}

export interface StaffAssignment {
  employeeId: string;
  employeeName: string;
  roleIds: string[];
  /** 数据范围：可访问门店/租户；与功能权限（selection）分离 */
  storeAccess: StaffStoreAccess;
}

export interface PermissionChangeLogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface RbacStoreSnapshot {
  roles: RbacRole[];
  staff: StaffAssignment[];
  changelog: PermissionChangeLogEntry[];
}

export type ResolvedL4SettingAccess = "editable" | "display-only" | "denied";
