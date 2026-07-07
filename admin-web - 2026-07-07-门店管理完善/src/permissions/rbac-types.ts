import type { PlatformPresetNodeSelection } from "../config/platform-preset-store";
import type { PermissionAccess } from "../config/permission-registry";
import type { ChainDataPerspective } from "../auth/merchant-scope-context";
import type { StaffStoreAccess } from "./store-access";

export type { StaffStoreAccess, StaffStoreAccessMode } from "./store-access";
export type { ChainDataPerspective } from "../auth/merchant-scope-context";

export interface RbacRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  /** 与平台预设一致：导航节点启用/展示 */
  selection: Record<string, PlatformPresetNodeSelection>;
  updatedAt: string;
  /** 员工绑定该角色时的默认数据范围（保存员工授权时可覆盖） */
  defaultStoreAccess?: StaffStoreAccess;
  /** 该角色允许的最高数据视角 */
  maxPerspective?: ChainDataPerspective;
  /** @deprecated v2 稀疏 grants，加载时迁移为 selection */
  grants?: Record<string, PermissionAccess>;
}

export interface StaffAssignment {
  employeeId: string;
  employeeName: string;
  roleIds: string[];
  /** 数据范围：可访问门店/租户；与功能权限（selection）分离 */
  storeAccess: StaffStoreAccess;
  /** 最近一次授权操作人 employeeId */
  grantedBy?: string;
  /** 授权时记录的上限（授权人当时的 storeAccess） */
  scopeCeiling?: StaffStoreAccess;
  /** 该员工允许的最高数据视角 */
  maxPerspective?: ChainDataPerspective;
  /** 最近一次授权时间 */
  grantedAt?: string;
}

export interface StaffGrantChainMeta {
  grantorEmployeeId: string;
  grantorName?: string;
  granteeEmployeeId?: string;
  granteeName?: string;
  perspective?: ChainDataPerspective;
  roleIdsBefore?: string[];
  roleIdsAfter?: string[];
  storeAccessBefore?: StaffStoreAccess;
  storeAccessAfter?: StaffStoreAccess;
  scopeCeiling?: StaffStoreAccess;
}

export interface PermissionChangeLogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  /** 员工授权链审计（P4） */
  grantChain?: StaffGrantChainMeta;
}

export interface RbacStoreSnapshot {
  roles: RbacRole[];
  staff: StaffAssignment[];
  changelog: PermissionChangeLogEntry[];
}

export type ResolvedL4SettingAccess = "editable" | "display-only" | "denied";
