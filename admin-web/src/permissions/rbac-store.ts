import {
  buildPermissionModuleGroups,
  buildPermissionResourceIndex,
  flattenPermissionTree,
  parsePermissionAccess,
  resolveEffectiveGrant,
  type PermissionAccess,
} from "../config/permission-registry";

export interface RbacRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  /** 稀疏 resourceKey → 显式覆盖；未设则继承父级 */
  grants: Record<string, PermissionAccess>;
  updatedAt: string;
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

const STORAGE_KEY = "menusifu:rbac-v2";
const LEGACY_STORAGE_KEY = "menusifu:rbac-v1";

interface RbacStoreSnapshot {
  roles: RbacRole[];
  staff: StaffAssignment[];
  changelog: PermissionChangeLogEntry[];
}

const resourceIndex = buildPermissionResourceIndex();

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
    {
      id: "store-manager",
      name: "店长",
      description: "门店全量管理，含财务与报表操作",
      isSystem: true,
      grants: all,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cashier",
      name: "收银员",
      description: "订单、支付、前厅点单；设置类入口不可见或仅查看",
      isSystem: true,
      grants: cashier,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "floor-staff",
      name: "楼面",
      description: "前厅与预约为主，财务模块可操作",
      isSystem: false,
      grants: floorStaff,
      updatedAt: new Date().toISOString(),
    },
  ];
}

function seedStaff(): StaffAssignment[] {
  return [
    { employeeId: "e001", employeeName: "王小明", roleIds: ["store-manager"] },
    { employeeId: "e002", employeeName: "李收银", roleIds: ["cashier"] },
    { employeeId: "e003", employeeName: "张楼面", roleIds: ["floor-staff", "cashier"] },
  ];
}

function migrateLegacySnapshot(legacy: RbacStoreSnapshot): RbacStoreSnapshot {
  const flat = flattenPermissionTree();
  const l2Keys = new Set(flat.filter((r) => r.level === 2).map((r) => r.key));

  const roles = legacy.roles.map((role) => {
    const grants: Record<string, PermissionAccess> = {};
    for (const [key, access] of Object.entries(role.grants)) {
      if (l2Keys.has(key)) grants[key] = parsePermissionAccess(access);
    }
    for (const g of buildPermissionModuleGroups()) {
      const l2InModule = flat.filter((r) => r.moduleId === g.moduleId && r.level === 2);
      const levels = l2InModule.map((r) => parsePermissionAccess(role.grants[r.key]));
      if (levels.some((a) => a === "operate")) grants[g.moduleKey] = "operate";
      else if (levels.some((a) => a === "view")) grants[g.moduleKey] = "view";
      else grants[g.moduleKey] = "hidden";
    }
    return { ...role, grants };
  });

  return { ...legacy, roles };
}

function loadSnapshot(): RbacStoreSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RbacStoreSnapshot;
      if (parsed.roles?.length) return parsed;
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

export function countRoleStats(role: RbacRole): { operate: number; view: number; hidden: number } {
  let operate = 0;
  let view = 0;
  let hidden = 0;
  for (const key of resourceIndex.byKey.keys()) {
    const a = resolveEffectiveGrant(role.grants, key, resourceIndex);
    if (a === "operate") operate++;
    else if (a === "view") view++;
    else hidden++;
  }
  return { operate, view, hidden };
}

export function getModuleGroups() {
  return buildPermissionModuleGroups();
}

export function getPermissionIndex() {
  return resourceIndex;
}

export function getEffectiveGrant(
  grants: Record<string, PermissionAccess>,
  key: string,
): PermissionAccess {
  return resolveEffectiveGrant(grants, key, resourceIndex);
}
