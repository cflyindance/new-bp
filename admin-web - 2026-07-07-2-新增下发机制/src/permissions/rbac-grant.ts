/**
 * 员工授权页 · 按数据视角过滤可下放角色与门店（P3）
 */
import type { ChainDataPerspective } from "../auth/merchant-scope-context";
import {
  isBrandDataPerspective,
  isGroupHqDataPerspective,
  isStoreDataPerspective,
  resolveDefaultAnchorBrandId,
} from "../auth/merchant-scope-context";
import { getUserSessionContext } from "../auth/session-permissions";
import {
  isChainScopeMode,
  isStoreLayoutPreset,
  readScopeFilters,
} from "../auth/session-scope";
import type { PlatformPresetNodeSelection } from "../config/platform-preset-store";
import type { RbacRole } from "./rbac-types";
import type { StaffAssignment } from "./rbac-types";
import {
  canGrantScope,
  getAllowedStoreIds,
  maxChainDataPerspectiveForAccess,
  type GrantScopeResult,
  type StaffStoreAccess,
  type StaffStoreAccessMode,
} from "./store-access";
import {
  getMPlatformStoreScopeMeta,
  migrateLegacyBrandId,
  migrateLegacyRegionId,
  migrateLegacyStoreId,
} from "./m-platform-store-scope";

export type StaffGrantTier = "full" | "group-hq" | "brand" | "store";

export interface StaffGrantUiContext {
  tier: StaffGrantTier;
  grantorAccess: StaffStoreAccess;
  grantorMaxPerspective: ChainDataPerspective;
  grantorPermissionSnapshot: Record<string, PlatformPresetNodeSelection>;
  anchoredBrandId: string | null;
  delegableStoreIds: string[];
  allowedStoreAccessModes: StaffStoreAccessMode[];
  hint: string | null;
}

const PERSPECTIVE_RANK: Record<ChainDataPerspective, number> = {
  store: 0,
  brand: 1,
  "group-hq": 2,
};

function resolveRoleMaxPerspective(role: RbacRole): ChainDataPerspective {
  if (role.maxPerspective) return role.maxPerspective;
  if (role.defaultStoreAccess) {
    return maxChainDataPerspectiveForAccess(role.defaultStoreAccess);
  }
  if (role.id === "hq-admin") return "group-hq";
  return "store";
}

function getDelegableStoreIds(
  grantorAccess: StaffStoreAccess,
  anchoredBrandId: string | null,
): string[] {
  let storeIds = getAllowedStoreIds(grantorAccess);
  if (anchoredBrandId) {
    const brand = migrateLegacyBrandId(anchoredBrandId);
    storeIds = storeIds.filter((storeId) => {
      const meta = getMPlatformStoreScopeMeta(storeId);
      return meta?.brand === brand;
    });
  }
  return storeIds;
}

/** 解析当前登录用户在员工授权页的放权上下文 */
export function resolveStaffGrantUiContext(isEnterpriseStaff: boolean): StaffGrantUiContext {
  const fullCtx: StaffGrantUiContext = {
    tier: "full",
    grantorAccess: { mode: "all", ids: [] },
    grantorMaxPerspective: "group-hq",
    grantorPermissionSnapshot: {},
    anchoredBrandId: null,
    delegableStoreIds: getAllowedStoreIds({ mode: "all", ids: [] }),
    allowedStoreAccessModes: ["all", "brands", "regions", "stores"],
    hint: null,
  };
  if (isEnterpriseStaff) return fullCtx;

  const session = getUserSessionContext();
  const grantorAccess = session?.storeAccess ?? { mode: "all", ids: [] };
  const grantorMaxPerspective = maxChainDataPerspectiveForAccess(grantorAccess);
  const grantorPermissionSnapshot = session?.permissionSnapshot ?? {};

  if (!isChainScopeMode() || isStoreLayoutPreset()) {
    const delegableStoreIds = getAllowedStoreIds(grantorAccess);
    return {
      tier: "store",
      grantorAccess,
      grantorMaxPerspective,
      grantorPermissionSnapshot,
      anchoredBrandId: null,
      delegableStoreIds,
      allowedStoreAccessModes: ["stores"],
      hint: "门店版布局：仅可为员工分配指定门店数据范围。",
    };
  }

  if (isGroupHqDataPerspective()) {
    return {
      tier: "group-hq",
      grantorAccess,
      grantorMaxPerspective,
      grantorPermissionSnapshot,
      anchoredBrandId: null,
      delegableStoreIds: getAllowedStoreIds(grantorAccess),
      allowedStoreAccessModes: ["all", "brands", "regions", "stores"],
      hint: null,
    };
  }

  if (isBrandDataPerspective()) {
    const scope = readScopeFilters();
    const anchoredBrandId =
      (scope.brand ? migrateLegacyBrandId(scope.brand) : null) ??
      (resolveDefaultAnchorBrandId() ? migrateLegacyBrandId(resolveDefaultAnchorBrandId()!) : null);
    const delegableStoreIds = getDelegableStoreIds(grantorAccess, anchoredBrandId);
    return {
      tier: "brand",
      grantorAccess,
      grantorMaxPerspective,
      grantorPermissionSnapshot,
      anchoredBrandId,
      delegableStoreIds,
      allowedStoreAccessModes: ["regions", "stores"],
      hint: anchoredBrandId
        ? "品牌多门店视角：仅可下放您有权限的角色，并为员工分配本品牌下门店/区域数据范围。"
        : "品牌多门店视角：仅可下放您有权限的角色，并为员工分配授权品牌范围内的门店/区域。",
    };
  }

  if (isStoreDataPerspective()) {
    const delegableStoreIds = getAllowedStoreIds(grantorAccess);
    return {
      tier: "store",
      grantorAccess,
      grantorMaxPerspective,
      grantorPermissionSnapshot,
      anchoredBrandId: null,
      delegableStoreIds,
      allowedStoreAccessModes: ["stores"],
      hint: "门店视角：仅可为员工分配您可见范围内的指定门店。",
    };
  }

  return fullCtx;
}

/** 角色功能权限是否为授权人权限子集，且视角不高于授权人 */
export function isRoleGrantableInContext(role: RbacRole, ctx: StaffGrantUiContext): boolean {
  if (ctx.tier === "full" || ctx.tier === "group-hq") return true;

  const roleMax = resolveRoleMaxPerspective(role);
  if (PERSPECTIVE_RANK[roleMax] > PERSPECTIVE_RANK[ctx.grantorMaxPerspective]) {
    return false;
  }

  if (ctx.tier === "brand" && role.id === "hq-admin") return false;

  for (const [key, node] of Object.entries(role.selection)) {
    if (!node?.enabled) continue;
    if (ctx.grantorPermissionSnapshot[key]?.enabled !== true) return false;
  }
  return true;
}

export function filterGrantableRoles(roles: RbacRole[], ctx: StaffGrantUiContext): RbacRole[] {
  return roles.filter((role) => isRoleGrantableInContext(role, ctx));
}

/** 品牌/门店视角下可管理的员工（数据范围与授权人可见门店有交集） */
export function isStaffManageableInGrantContext(
  staff: StaffAssignment,
  ctx: StaffGrantUiContext,
): boolean {
  if (ctx.tier === "full" || ctx.tier === "group-hq") return true;

  const staffStoreIds = getAllowedStoreIds(staff.storeAccess);
  if (staffStoreIds.length === 0) return true;

  const delegable = new Set(ctx.delegableStoreIds);
  return staffStoreIds.some((storeId) => delegable.has(storeId));
}

/** 当前视角下该行是否允许编辑（否则只读展示） */
export function isStaffRowGrantEditable(
  staff: StaffAssignment,
  ctx: StaffGrantUiContext,
): boolean {
  if (!isStaffManageableInGrantContext(staff, ctx)) return false;
  if (ctx.tier === "full" || ctx.tier === "group-hq") return true;
  return canGrantScope(ctx.grantorAccess, staff.storeAccess).ok;
}

export function filterPickerOptionsByDelegableStores<T extends { value: string }>(
  options: T[],
  delegableStoreIds: string[],
): T[] {
  const allowed = new Set(delegableStoreIds.map(migrateLegacyStoreId));
  return options.filter((o) => !o.value || allowed.has(migrateLegacyStoreId(o.value)));
}

export function filterRegionOptionsByDelegableStores<T extends { value: string }>(
  options: T[],
  delegableStoreIds: string[],
): T[] {
  const regions = new Set<string>();
  for (const storeId of delegableStoreIds) {
    const meta = getMPlatformStoreScopeMeta(storeId);
    if (meta?.region) regions.add(meta.region);
  }
  return options.filter((o) => !o.value || regions.has(migrateLegacyRegionId(o.value)));
}

export function validateStaffRoleGrant(
  roleIds: string[],
  roles: RbacRole[],
  ctx: StaffGrantUiContext,
): GrantScopeResult {
  if (ctx.tier === "full" || ctx.tier === "group-hq") return { ok: true };
  for (const roleId of roleIds) {
    const role = roles.find((r) => r.id === roleId);
    if (!role) continue;
    if (!isRoleGrantableInContext(role, ctx)) {
      return { ok: false, reason: `角色「${role.name}」超出您可下放的功能权限范围` };
    }
  }
  return { ok: true };
}

export function mergePreservedStaffRoleIds(
  prevRoleIds: string[],
  checkedGrantableRoleIds: string[],
  grantableRoleIds: Set<string>,
): string[] {
  const preserved = prevRoleIds.filter((id) => !grantableRoleIds.has(id));
  const merged = new Set([...preserved, ...checkedGrantableRoleIds]);
  return Array.from(merged);
}
