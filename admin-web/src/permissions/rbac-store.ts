import {
  buildPermissionModuleGroups,
  buildPermissionResourceIndex,
  flattenPermissionTree,
  parsePermissionAccess,
  resolveEffectiveGrant,
  type PermissionAccess,
} from "../config/permission-registry";
import { buildPlatformPresetIndex } from "../config/platform-preset-tree";
import type { PlatformPresetNodeSelection, RbacL4EditMode } from "../config/platform-preset-store";
import { cascadeEnableSelection } from "../config/platform-preset-store";

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
}

export interface PermissionChangeLogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

const STORAGE_KEY = "menusifu:rbac-v3";
const LEGACY_STORAGE_KEY = "menusifu:rbac-v1";
const V2_STORAGE_KEY = "menusifu:rbac-v2";

interface RbacStoreSnapshot {
  roles: RbacRole[];
  staff: StaffAssignment[];
  changelog: PermissionChangeLogEntry[];
}

const resourceIndex = buildPermissionResourceIndex();
const RBAC_PRESET_LINE = "pos" as const;

function grantsToSelection(grants: Record<string, PermissionAccess>): Record<string, PlatformPresetNodeSelection> {
  const index = buildPlatformPresetIndex(RBAC_PRESET_LINE);
  const selection: Record<string, PlatformPresetNodeSelection> = {};
  for (const n of index.flat) {
    const effective = resolveEffectiveGrant(grants, n.key, resourceIndex);
    if (n.level === 4) {
      selection[n.key] = {
        enabled: effective !== "hidden",
        l4EditMode: effective === "operate" ? "editable" : "display-only",
      };
    } else {
      selection[n.key] = { enabled: effective !== "hidden", display: true };
    }
  }
  return selection;
}

function defaultL4Selection(enabled: boolean): PlatformPresetNodeSelection {
  return { enabled, l4EditMode: "display-only" };
}

export function normalizeRoleSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
): Record<string, PlatformPresetNodeSelection> {
  const index = buildPlatformPresetIndex(RBAC_PRESET_LINE);
  const next = { ...selection };
  for (const n of index.flat) {
    if (!next[n.key]) {
      next[n.key] = n.level === 4 ? defaultL4Selection(false) : { enabled: false, display: true };
      continue;
    }
    if (n.level === 4) {
      next[n.key] = {
        ...next[n.key],
        l4EditMode: next[n.key].l4EditMode ?? "display-only",
      };
    }
  }
  return next;
}

/** RBAC 勾选级联：L4 勾选=展示，默认不可编辑（只读） */
export function cascadeRbacEnableSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
  key: string,
  enabled: boolean,
): Record<string, PlatformPresetNodeSelection> {
  let next = cascadeEnableSelection(selection, key, enabled, RBAC_PRESET_LINE);
  const index = buildPlatformPresetIndex(RBAC_PRESET_LINE);
  for (const k of [key, ...index.getDescendantKeys(key)]) {
    const node = index.byKey.get(k);
    if (node?.level !== 4) continue;
    next[k] = {
      ...next[k],
      enabled,
      l4EditMode: enabled ? (next[k]?.l4EditMode ?? "display-only") : (next[k]?.l4EditMode ?? "display-only"),
    };
  }
  return next;
}

function migrateRoleToSelection(role: RbacRole): RbacRole {
  if (role.selection && Object.keys(role.selection).length > 0) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      selection: normalizeRoleSelection(role.selection),
      updatedAt: role.updatedAt,
    };
  }
  const grants = role.grants ?? {};
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    selection: grantsToSelection(grants),
    updatedAt: role.updatedAt,
  };
}

function roleFromGrantsSeed(
  id: string,
  name: string,
  description: string,
  isSystem: boolean,
  grants: Record<string, PermissionAccess>,
): RbacRole {
  return {
    id,
    name,
    description,
    isSystem,
    selection: grantsToSelection(grants),
    updatedAt: new Date().toISOString(),
  };
}

function defaultSparseGrants(access: PermissionAccess): Record<string, PermissionAccess> {
  const grants: Record<string, PermissionAccess> = {};
  for (const g of buildPermissionModuleGroups()) {
    grants[g.moduleKey] = access;
  }
  return grants;
}

function seedRoles(): RbacRole[] {
  const all = defaultSparseGrants("operate");
  const flat = flattenPermissionTree();

  const cashier = defaultSparseGrants("hidden");
  const modulesCashier = ["orders", "transactions", "queue-call", "product-center-main"] as const;
  for (const g of buildPermissionModuleGroups()) {
    if (modulesCashier.includes(g.moduleId as (typeof modulesCashier)[number])) {
      cashier[g.moduleKey] = "operate";
    }
  }
  for (const r of flat) {
    if (!modulesCashier.includes(r.moduleId as (typeof modulesCashier)[number])) continue;
    if (r.level === 1) continue;
    if (r.level === 2) {
      if (r.path?.includes("settings") || r.featureId?.includes("settings")) {
        cashier[r.key] = "hidden";
      } else if (r.path?.includes("refund") || r.path?.includes("void")) {
        cashier[r.key] = "view";
      } else {
        cashier[r.key] = "operate";
      }
    }
  }

  const floorStaff: Record<string, PermissionAccess> = defaultSparseGrants("view");
  for (const g of buildPermissionModuleGroups()) {
    if (g.moduleId === "finance" || g.moduleId === "reports-finance") {
      floorStaff[g.moduleKey] = "operate";
    }
  }

  return [
    roleFromGrantsSeed("store-manager", "店长", "门店全量管理，含财务与报表操作", true, all),
    roleFromGrantsSeed("hq-admin", "总部管理员", "连锁总部：品牌/门店/权限/多店汇总", true, all),
    roleFromGrantsSeed(
      "cashier",
      "收银员",
      "订单、支付、前厅点单；设置类入口默认不启用",
      true,
      cashier,
    ),
    roleFromGrantsSeed("floor-staff", "楼面", "前厅与预约为主，财务模块启用", false, floorStaff),
  ];
}

function seedStaff(): StaffAssignment[] {
  return [
    { employeeId: "e001", employeeName: "王小明", roleIds: ["store-manager"] },
    { employeeId: "e002", employeeName: "李收银", roleIds: ["cashier"] },
    { employeeId: "e003", employeeName: "张楼面", roleIds: ["floor-staff", "cashier"] },
    { employeeId: "hq001", employeeName: "陈总部", roleIds: ["hq-admin"] },
  ];
}

function migrateLegacySnapshot(legacy: RbacStoreSnapshot): RbacStoreSnapshot {
  const flat = flattenPermissionTree();
  const l2Keys = new Set(flat.filter((r) => r.level === 2).map((r) => r.key));

  const roles = legacy.roles.map((role) => {
    const legacyGrants = role.grants ?? {};
    const grants: Record<string, PermissionAccess> = {};
    for (const [key, access] of Object.entries(legacyGrants)) {
      if (l2Keys.has(key)) grants[key] = parsePermissionAccess(access);
    }
    for (const g of buildPermissionModuleGroups()) {
      const l2InModule = flat.filter((r) => r.moduleId === g.moduleId && r.level === 2);
      const levels = l2InModule.map((r) => parsePermissionAccess(legacyGrants[r.key]));
      if (levels.some((a) => a === "operate")) grants[g.moduleKey] = "operate";
      else if (levels.some((a) => a === "view")) grants[g.moduleKey] = "view";
      else grants[g.moduleKey] = "hidden";
    }
    return { ...role, grants, selection: grantsToSelection(grants) };
  });

  return { ...legacy, roles: roles.map(migrateRoleToSelection) };
}

function loadSnapshot(): RbacStoreSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RbacStoreSnapshot;
      if (parsed.roles?.length) {
        return { ...parsed, roles: parsed.roles.map(migrateRoleToSelection) };
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const v2Raw = localStorage.getItem(V2_STORAGE_KEY);
    if (v2Raw) {
      const v2 = JSON.parse(v2Raw) as RbacStoreSnapshot;
      if (v2.roles?.length) {
        const migrated = { ...v2, roles: v2.roles.map(migrateRoleToSelection) };
        saveRbacSnapshot(migrated);
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as RbacStoreSnapshot;
      if (legacy.roles?.length) {
        const migrated = migrateLegacySnapshot(legacy);
        saveRbacSnapshot(migrated);
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }

  return {
    roles: seedRoles(),
    staff: seedStaff(),
    changelog: [
      {
        id: "log-1",
        at: "2026-06-01T10:00:00",
        actor: "系统",
        action: "初始化",
        detail: "预置角色：店长、收银员、楼面（四级权限树 v2）",
      },
    ],
  };
}

let snapshot = loadSnapshot();

export function getRbacSnapshot(): RbacStoreSnapshot {
  return snapshot;
}

export function saveRbacSnapshot(next: RbacStoreSnapshot): void {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function getRoleById(id: string): RbacRole | undefined {
  return snapshot.roles.find((r) => r.id === id);
}

export function upsertRole(role: RbacRole, logDetail: string, actor = "当前用户"): void {
  const idx = snapshot.roles.findIndex((r) => r.id === role.id);
  const roles = [...snapshot.roles];
  if (idx >= 0) roles[idx] = role;
  else roles.push(role);
  const changelog: PermissionChangeLogEntry[] = [
    {
      id: `log-${Date.now()}`,
      at: new Date().toISOString(),
      actor,
      action: idx >= 0 ? "更新角色" : "新建角色",
      detail: logDetail,
    },
    ...snapshot.changelog,
  ].slice(0, 200);
  saveRbacSnapshot({ ...snapshot, roles, changelog });
}

export function deleteRole(id: string): boolean {
  const role = getRoleById(id);
  if (!role || role.isSystem) return false;
  const used = snapshot.staff.some((s) => s.roleIds.includes(id));
  if (used) return false;
  saveRbacSnapshot({
    ...snapshot,
    roles: snapshot.roles.filter((r) => r.id !== id),
    changelog: [
      {
        id: `log-${Date.now()}`,
        at: new Date().toISOString(),
        actor: "当前用户",
        action: "删除角色",
        detail: `删除角色「${role.name}」`,
      },
      ...snapshot.changelog,
    ].slice(0, 200),
  });
  return true;
}

export function updateStaffAssignments(staff: StaffAssignment[]): void {
  saveRbacSnapshot({
    ...snapshot,
    staff,
    changelog: [
      {
        id: `log-${Date.now()}`,
        at: new Date().toISOString(),
        actor: "当前用户",
        action: "员工授权",
        detail: "更新员工角色绑定",
      },
      ...snapshot.changelog,
    ].slice(0, 200),
  });
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

export function countRoleStats(role: RbacRole): { enabled: number; total: number; enabledL1: number } {
  const index = buildPlatformPresetIndex(RBAC_PRESET_LINE);
  const sel = normalizeRoleSelection(role.selection);
  let enabled = 0;
  let enabledL1 = 0;
  for (const n of index.flat) {
    if (sel[n.key]?.enabled) {
      enabled++;
      if (n.level === 1) enabledL1++;
    }
  }
  return { enabled, total: index.flat.length, enabledL1 };
}

export function getRbacPresetIndex() {
  return buildPlatformPresetIndex(RBAC_PRESET_LINE);
}

export type ResolvedL4SettingAccess = "editable" | "display-only" | "denied";

export function resolveRoleL4SettingAccess(
  role: RbacRole,
  permissionKey: string,
): ResolvedL4SettingAccess {
  const sel = normalizeRoleSelection(role.selection)[permissionKey];
  if (!sel?.enabled) return "denied";
  return sel.l4EditMode ?? "display-only";
}

export function getModuleGroups() {
  return buildPermissionModuleGroups();
}

export function getPermissionIndex() {
  return resourceIndex;
}
