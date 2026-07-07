import {
  buildPermissionModuleGroups,
  buildPermissionResourceIndex,
  flattenPermissionTree,
  parsePermissionAccess,
  resolveEffectiveGrant,
  type PermissionAccess,
} from "../config/permission-registry";
import { buildPlatformPresetIndex, buildRbacPlatformPresetIndex } from "../config/platform-preset-tree";
import type { PlatformPresetNodeSelection } from "../config/platform-preset-store";
import { cascadeEnableSelection } from "../config/platform-preset-store";
import {
  inferDefaultStaffStoreAccess,
  isStaffStoreAccessEqual,
  mergeRoleDefaultStoreAccess,
  normalizeStaffStoreAccess,
  validateStaffAssignmentsGrant,
  type StaffStoreAccess,
} from "./store-access";
import {
  applyStaffGrantMetadata,
  buildStaffGrantAuditEntries,
  type StaffGrantAuditContext,
} from "./rbac-audit";
import { DEFAULT_DEMO_STORE_ID } from "./m-platform-store-scope";
import type { ChainDataPerspective } from "../auth/merchant-scope-context";
import type {
  PermissionChangeLogEntry,
  RbacRole,
  RbacStoreSnapshot,
  ResolvedL4SettingAccess,
  StaffAssignment,
} from "./rbac-types";
import { filterRbacPermissionModuleGroups } from "./nav-access";

export type { RbacRole, StaffAssignment, PermissionChangeLogEntry, RbacStoreSnapshot, ResolvedL4SettingAccess };

export interface RbacStoreSeed {
  roles: RbacRole[];
  staff: StaffAssignment[];
  changelog: PermissionChangeLogEntry[];
}

export interface CreateRbacStoreOptions {
  storageKey: string;
  legacyStorageKeys?: string[];
  presetLine?: "pos";
  seeds: () => RbacStoreSeed;
}

const resourceIndex = buildPermissionResourceIndex();

function grantsToSelection(
  grants: Record<string, PermissionAccess>,
  presetLine: "pos",
): Record<string, PlatformPresetNodeSelection> {
  const index = buildPlatformPresetIndex(presetLine);
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

function migrateRoleToSelection(role: RbacRole, presetLine: "pos"): RbacRole {
  if (role.selection && Object.keys(role.selection).length > 0) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      selection: normalizeRoleSelection(role.selection, presetLine),
      updatedAt: role.updatedAt,
    };
  }
  const grants = role.grants ?? {};
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    selection: grantsToSelection(grants, presetLine),
    updatedAt: role.updatedAt,
  };
}

export function normalizeRoleSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
  presetLine: "pos" = "pos",
): Record<string, PlatformPresetNodeSelection> {
  const index = buildPlatformPresetIndex(presetLine);
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

export function cascadeRbacEnableSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
  key: string,
  enabled: boolean,
  presetLine: "pos" = "pos",
): Record<string, PlatformPresetNodeSelection> {
  let next = cascadeEnableSelection(selection, key, enabled, presetLine);
  const index = buildPlatformPresetIndex(presetLine);
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

function roleFromGrantsSeed(
  id: string,
  name: string,
  description: string,
  isSystem: boolean,
  grants: Record<string, PermissionAccess>,
  presetLine: "pos",
  extras?: { defaultStoreAccess?: StaffStoreAccess; maxPerspective?: ChainDataPerspective },
): RbacRole {
  return {
    id,
    name,
    description,
    isSystem,
    selection: grantsToSelection(grants, presetLine),
    updatedAt: new Date().toISOString(),
    ...extras,
  };
}

function defaultSparseGrants(access: PermissionAccess): Record<string, PermissionAccess> {
  const grants: Record<string, PermissionAccess> = {};
  for (const g of buildPermissionModuleGroups()) {
    grants[g.moduleKey] = access;
  }
  return grants;
}

export function createMerchantSeedRoles(): RbacRole[] {
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
    roleFromGrantsSeed(
      "store-manager",
      "店长",
      "门店全量管理，含财务与报表操作",
      true,
      all,
      "pos",
      { maxPerspective: "store" },
    ),
    roleFromGrantsSeed(
      "hq-admin",
      "总部管理员",
      "连锁总部：品牌/门店/权限/多店汇总",
      true,
      all,
      "pos",
      { defaultStoreAccess: { mode: "all", ids: [] }, maxPerspective: "group-hq" },
    ),
    roleFromGrantsSeed(
      "brand-ops-east",
      "华东品牌运营",
      "华东区域品牌管理：张记、茶语等品牌",
      false,
      all,
      "pos",
      {
        defaultStoreAccess: { mode: "brands", ids: ["merchant-zhangji", "merchant-tea-one"] },
        maxPerspective: "brand",
      },
    ),
    roleFromGrantsSeed(
      "cashier",
      "收银员",
      "订单、支付、前厅点单；设置类入口默认不启用",
      true,
      cashier,
      "pos",
      { maxPerspective: "store" },
    ),
    roleFromGrantsSeed("floor-staff", "楼面", "前厅与预约为主，财务模块启用", false, floorStaff, "pos", {
      maxPerspective: "store",
    }),
  ];
}

export function createEnterpriseSeedRoles(): RbacRole[] {
  const all = defaultSparseGrants("operate");

  const presetManager = defaultSparseGrants("hidden");
  for (const g of buildPermissionModuleGroups()) {
    if (
      g.moduleId === "permissions" ||
      g.moduleId === "system-settings" ||
      g.moduleId === "log-management"
    ) {
      presetManager[g.moduleKey] = "operate";
    }
  }

  const readonly = defaultSparseGrants("view");
  for (const g of buildPermissionModuleGroups()) {
    if (g.moduleId === "permissions") {
      readonly[g.moduleKey] = "hidden";
    }
  }

  return [
    roleFromGrantsSeed(
      "enterprise-admin",
      "企业管理员",
      "企业级全量管理：导航蓝图、平台预设、权限与下属商家策略",
      true,
      all,
      "pos",
    ),
    roleFromGrantsSeed(
      "preset-manager",
      "平台预设管理员",
      "维护企业级平台预设与同步下发；不含权限矩阵编辑",
      true,
      presetManager,
      "pos",
    ),
    roleFromGrantsSeed(
      "blueprint-editor",
      "导航蓝图编辑",
      "编排企业导航蓝图与结构发布",
      false,
      all,
      "pos",
    ),
    roleFromGrantsSeed(
      "enterprise-auditor",
      "企业审计只读",
      "查看配置与报表类入口，不可改设置值",
      false,
      readonly,
      "pos",
    ),
  ];
}

export function createMerchantSeedStaff(): StaffAssignment[] {
  return [
    {
      employeeId: "e001",
      employeeName: "王小明",
      roleIds: ["store-manager"],
      storeAccess: { mode: "stores", ids: [DEFAULT_DEMO_STORE_ID] },
    },
    {
      employeeId: "e002",
      employeeName: "李收银",
      roleIds: ["cashier"],
      storeAccess: { mode: "stores", ids: [DEFAULT_DEMO_STORE_ID] },
    },
    {
      employeeId: "e003",
      employeeName: "张楼面",
      roleIds: ["floor-staff", "cashier"],
      storeAccess: { mode: "stores", ids: [DEFAULT_DEMO_STORE_ID] },
    },
    {
      employeeId: "hq001",
      employeeName: "陈总部",
      roleIds: ["hq-admin"],
      storeAccess: { mode: "all", ids: [] },
    },
    {
      employeeId: "zj-brand-ops",
      employeeName: "李华东运营",
      roleIds: ["brand-ops-east"],
      storeAccess: { mode: "brands", ids: ["merchant-zhangji", "merchant-tea-one"] },
    },
    {
      employeeId: "zj-hq001",
      employeeName: "张集团管理员",
      roleIds: ["hq-admin"],
      storeAccess: { mode: "all", ids: [] },
    },
  ];
}

export function createEnterpriseSeedStaff(): StaffAssignment[] {
  return [
    {
      employeeId: "ent001",
      employeeName: "刘企业",
      roleIds: ["enterprise-admin"],
      storeAccess: { mode: "all", ids: [] },
    },
    {
      employeeId: "ent002",
      employeeName: "周预设",
      roleIds: ["preset-manager"],
      storeAccess: { mode: "all", ids: [] },
    },
    {
      employeeId: "ent003",
      employeeName: "吴蓝图",
      roleIds: ["blueprint-editor", "preset-manager"],
      storeAccess: { mode: "all", ids: [] },
    },
    {
      employeeId: "ent004",
      employeeName: "郑审计",
      roleIds: ["enterprise-auditor"],
      storeAccess: { mode: "all", ids: [] },
    },
  ];
}

function normalizeStaffAssignment(raw: StaffAssignment): StaffAssignment {
  return {
    employeeId: raw.employeeId,
    employeeName: raw.employeeName,
    roleIds: [...(raw.roleIds ?? [])],
    storeAccess: normalizeStaffStoreAccess(
      raw.storeAccess,
      inferDefaultStaffStoreAccess(raw.employeeId),
    ),
    grantedBy: raw.grantedBy,
    scopeCeiling: raw.scopeCeiling
      ? normalizeStaffStoreAccess(raw.scopeCeiling, { mode: "all", ids: [] })
      : undefined,
    maxPerspective: raw.maxPerspective,
    grantedAt: raw.grantedAt,
  };
}

export function resolveStaffStoreAccessOnSave(
  prev: StaffAssignment,
  nextRoleIds: string[],
  explicitAccess: StaffStoreAccess,
  roles: RbacRole[],
): StaffStoreAccess {
  const rolesChanged =
    [...prev.roleIds].sort().join(",") !== [...nextRoleIds].sort().join(",");
  const accessUnchanged = isStaffStoreAccessEqual(prev.storeAccess, explicitAccess);
  if (rolesChanged && accessUnchanged) {
    const roleDefaults = nextRoleIds
      .map((id) => roles.find((r) => r.id === id)?.defaultStoreAccess)
      .filter((d): d is StaffStoreAccess => d != null);
    return normalizeStaffStoreAccess(
      mergeRoleDefaultStoreAccess(roleDefaults, prev.storeAccess),
      prev.storeAccess,
    );
  }
  return normalizeStaffStoreAccess(explicitAccess, prev.storeAccess);
}

export type UpdateStaffAssignmentsResult = { ok: true } | { ok: false; message: string };

export interface UpdateStaffAssignmentsOptions {
  grantorAccess?: StaffStoreAccess;
  grantorEmployeeId?: string;
  grantorName?: string;
  perspective?: StaffGrantAuditContext["perspective"];
  /** 默认 true；企业级或系统初始化时可关闭 */
  validateGrant?: boolean;
}

function migrateLegacySnapshot(legacy: RbacStoreSnapshot, presetLine: "pos"): RbacStoreSnapshot {
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
    return { ...role, grants, selection: grantsToSelection(grants, presetLine) };
  });

  return { ...legacy, roles: roles.map((r) => migrateRoleToSelection(r, presetLine)) };
}

export interface RbacStoreApi {
  getRbacSnapshot: () => RbacStoreSnapshot;
  saveRbacSnapshot: (next: RbacStoreSnapshot) => void;
  getRoleById: (id: string) => RbacRole | undefined;
  getStaffAssignmentByEmployeeId: (employeeId: string) => StaffAssignment | undefined;
  upsertRole: (role: RbacRole, logDetail: string, actor?: string) => void;
  deleteRole: (id: string) => boolean;
  ensureStaffRecord: (employeeId: string, employeeName: string) => StaffAssignment;
  updateStaffAssignments: (
    staff: StaffAssignment[],
    options?: UpdateStaffAssignmentsOptions,
  ) => UpdateStaffAssignmentsResult;
  mergeRoleSelections: (roleIds: string[]) => Record<string, PlatformPresetNodeSelection>;
  countRoleStats: (role: RbacRole) => { enabled: number; total: number; enabledL1: number };
  getRbacPresetIndex: () => ReturnType<typeof buildPlatformPresetIndex>;
  normalizeRoleSelection: (selection: Record<string, PlatformPresetNodeSelection>) => Record<string, PlatformPresetNodeSelection>;
  cascadeRbacEnableSelection: (
    selection: Record<string, PlatformPresetNodeSelection>,
    key: string,
    enabled: boolean,
  ) => Record<string, PlatformPresetNodeSelection>;
  resolveRoleL4SettingAccess: (role: RbacRole, permissionKey: string) => ResolvedL4SettingAccess;
  resolveSnapshotL4SettingAccess: (
    snapshot: Record<string, PlatformPresetNodeSelection>,
    permissionKey: string,
  ) => ResolvedL4SettingAccess;
}

export function createRbacStore(options: CreateRbacStoreOptions): RbacStoreApi {
  const presetLine = options.presetLine ?? "pos";
  const legacyKeys = options.legacyStorageKeys ?? [];

  function loadSnapshot(): RbacStoreSnapshot {
    try {
      const raw = localStorage.getItem(options.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as RbacStoreSnapshot;
        if (parsed.roles?.length) {
          return {
            ...parsed,
            roles: parsed.roles.map((r) => migrateRoleToSelection(r, presetLine)),
            staff: (parsed.staff ?? options.seeds().staff).map(normalizeStaffAssignment),
          };
        }
      }
    } catch {
      /* ignore */
    }

    for (const legacyKey of legacyKeys) {
      try {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (!legacyRaw) continue;
        const legacy = JSON.parse(legacyRaw) as RbacStoreSnapshot;
        if (!legacy.roles?.length) continue;
        const migrated = migrateLegacySnapshot(legacy, presetLine);
        migrated.staff = (migrated.staff ?? options.seeds().staff).map(normalizeStaffAssignment);
        saveRbacSnapshot(migrated);
        return migrated;
      } catch {
        /* ignore */
      }
    }

    const seed = options.seeds();
    return {
      roles: seed.roles,
      staff: seed.staff.map(normalizeStaffAssignment),
      changelog: seed.changelog,
    };
  }

  let snapshot = loadSnapshot();

  function saveRbacSnapshot(next: RbacStoreSnapshot): void {
    snapshot = next;
    try {
      localStorage.setItem(options.storageKey, JSON.stringify(snapshot));
    } catch {
      /* ignore */
    }
  }

  return {
    getRbacSnapshot: () => snapshot,
    saveRbacSnapshot,
    getRoleById: (id) => snapshot.roles.find((r) => r.id === id),
    getStaffAssignmentByEmployeeId: (employeeId) => {
      const raw = snapshot.staff.find((s) => s.employeeId === employeeId);
      return raw ? normalizeStaffAssignment(raw) : undefined;
    },
    upsertRole: (role, logDetail, actor = "当前用户") => {
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
    },
    deleteRole: (id) => {
      const role = snapshot.roles.find((r) => r.id === id);
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
    },
    ensureStaffRecord: (employeeId, employeeName) => {
      const trimmedId = employeeId.trim();
      const trimmedName = employeeName.trim();
      const existing = snapshot.staff.find((s) => s.employeeId === trimmedId);
      if (existing) return normalizeStaffAssignment(existing);

      const row = normalizeStaffAssignment({
        employeeId: trimmedId,
        employeeName: trimmedName,
        roleIds: [],
        storeAccess: inferDefaultStaffStoreAccess(trimmedId),
      });
      saveRbacSnapshot({
        ...snapshot,
        staff: [...snapshot.staff, row],
        changelog: [
          {
            id: `log-${Date.now()}`,
            at: new Date().toISOString(),
            actor: "当前用户",
            action: "新增员工",
            detail: `新建员工「${trimmedName}」（${trimmedId}），待配置角色与数据范围`,
          },
          ...snapshot.changelog,
        ].slice(0, 200),
      });
      return row;
    },
    updateStaffAssignments: (staff, options) => {
      const prevStaff = snapshot.staff.map(normalizeStaffAssignment);
      const normalized = staff.map(normalizeStaffAssignment);
      if (options?.grantorAccess && options.validateGrant !== false) {
        const validation = validateStaffAssignmentsGrant(options.grantorAccess, normalized);
        if (!validation.ok) {
          return { ok: false, message: validation.reason ?? "授权范围校验失败" };
        }
      }

      const auditCtx: StaffGrantAuditContext = {
        grantorEmployeeId: options?.grantorEmployeeId,
        grantorName: options?.grantorName,
        actorName: options?.grantorName,
        perspective: options?.perspective,
        grantorAccess: options?.grantorAccess,
      };

      const withMetadata = normalized.map((row) => {
        const prev = prevStaff.find((p) => p.employeeId === row.employeeId);
        return applyStaffGrantMetadata(prev, row, auditCtx);
      });

      const auditEntries = buildStaffGrantAuditEntries(
        prevStaff,
        withMetadata,
        snapshot.roles,
        auditCtx,
      );

      saveRbacSnapshot({
        ...snapshot,
        staff: withMetadata,
        changelog:
          auditEntries.length > 0
            ? [...auditEntries, ...snapshot.changelog].slice(0, 200)
            : snapshot.changelog,
      });
      return { ok: true };
    },
    mergeRoleSelections: (roleIds) => {
      const index = buildPlatformPresetIndex(presetLine);
      const merged: Record<string, PlatformPresetNodeSelection> = {};

      for (const roleId of roleIds) {
        const role = snapshot.roles.find((r) => r.id === roleId);
        if (!role) continue;
        const sel = normalizeRoleSelection(role.selection, presetLine);
        for (const n of index.flat) {
          const cur = sel[n.key];
          if (!cur) continue;
          const prev = merged[n.key];
          if (!prev) {
            merged[n.key] = { ...cur };
            continue;
          }
          merged[n.key] = {
            enabled: prev.enabled || cur.enabled,
            display: prev.display !== false || cur.display !== false,
            l4EditMode:
              prev.l4EditMode === "editable" || cur.l4EditMode === "editable"
                ? "editable"
                : "display-only",
          };
        }
      }
      return merged;
    },
    countRoleStats: (role) => {
      const index = buildRbacPlatformPresetIndex(presetLine);
      const sel = normalizeRoleSelection(role.selection, presetLine);
      let enabled = 0;
      let enabledL1 = 0;
      for (const n of index.flat) {
        if (sel[n.key]?.enabled) {
          enabled++;
          if (n.level === 1) enabledL1++;
        }
      }
      return { enabled, total: index.flat.length, enabledL1 };
    },
    getRbacPresetIndex: () => buildRbacPlatformPresetIndex(presetLine),
    normalizeRoleSelection: (selection) => normalizeRoleSelection(selection, presetLine),
    cascadeRbacEnableSelection: (selection, key, enabled) =>
      cascadeRbacEnableSelection(selection, key, enabled, presetLine),
    resolveRoleL4SettingAccess: (role, permissionKey) => {
      const sel = normalizeRoleSelection(role.selection, presetLine)[permissionKey];
      if (!sel?.enabled) return "denied";
      return sel.l4EditMode ?? "display-only";
    },
    resolveSnapshotL4SettingAccess: (selectionSnapshot, permissionKey) => {
      const sel = selectionSnapshot[permissionKey];
      if (!sel?.enabled) return "denied";
      return sel.l4EditMode ?? "display-only";
    },
  };
}

export function getModuleGroups() {
  return filterRbacPermissionModuleGroups(buildPermissionModuleGroups());
}

export function getPermissionIndex() {
  return resourceIndex;
}
