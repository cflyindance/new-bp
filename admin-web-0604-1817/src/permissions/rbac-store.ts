import {
  buildPermissionModuleGroups,
  flattenPermissionResources,
  parsePermissionAccess,
  type PermissionAccess,
} from "../config/permission-registry";

export interface RbacRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  /** resourceKey → 页面级访问；操作级为 `${key}:create` 等 */
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

const STORAGE_KEY = "menusifu:rbac-v1";

interface RbacStoreSnapshot {
  roles: RbacRole[];
  staff: StaffAssignment[];
  changelog: PermissionChangeLogEntry[];
}

function defaultGrants(access: PermissionAccess): Record<string, PermissionAccess> {
  const grants: Record<string, PermissionAccess> = {};
  for (const r of flattenPermissionResources()) {
    grants[r.key] = access;
  }
  return grants;
}

function seedRoles(): RbacRole[] {
  const all = defaultGrants("operate");
  const cashier = defaultGrants("hidden");
  const modulesCashier = [
    "orders",
    "transactions",
    "queue-call",
    "product-center-main",
  ] as const;
  for (const r of flattenPermissionResources()) {
    if (modulesCashier.includes(r.moduleId as (typeof modulesCashier)[number])) {
      if (r.featureId.includes("settings")) cashier[r.key] = "hidden";
      else if (r.path.includes("refund") || r.path.includes("void")) cashier[r.key] = "view";
      else cashier[r.key] = "operate";
    }
  }

  const manager = { ...defaultGrants("view") };
  for (const r of flattenPermissionResources()) {
    if (r.moduleId === "finance" || r.moduleId === "reports-finance") manager[r.key] = "operate";
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
      description: "订单、支付、前厅点单；敏感设置仅查看或不可见",
      isSystem: true,
      grants: cashier,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "floor-staff",
      name: "楼面",
      description: "前厅与预约为主，默认仅查看报表",
      isSystem: false,
      grants: manager,
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
  return {
    roles: seedRoles(),
    staff: seedStaff(),
    changelog: [
      {
        id: "log-1",
        at: "2026-06-01T10:00:00",
        actor: "系统",
        action: "初始化",
        detail: "预置角色：店长、收银员、楼面",
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

export function countRoleStats(role: RbacRole): { operate: number; view: number; hidden: number } {
  let operate = 0;
  let view = 0;
  let hidden = 0;
  for (const r of flattenPermissionResources()) {
    const a = parsePermissionAccess(role.grants[r.key]);
    if (a === "operate") operate++;
    else if (a === "view") view++;
    else hidden++;
  }
  return { operate, view, hidden };
}

export function getModuleGroups() {
  return buildPermissionModuleGroups();
}
