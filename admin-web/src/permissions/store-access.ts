/**
 * 员工数据范围（门店访问）校验与 M 平台门店元数据。
 * 功能权限（RBAC）与数据范围（Scope）分离：切门店只改 scope，不重算权限。
 */
import type { ChainDataPerspective } from "../auth/merchant-scope-context";
import type { ScopeFilterState, ScopeOption } from "../auth/session-scope";
import { getEnterpriseMerchantSnapshot } from "../config/enterprise-merchant-store";
import {
  DEFAULT_DEMO_STORE_ID,
  buildDemoScopeStoreOptions,
  getMPlatformStoreScopeMeta,
  listMPlatformStoreScopeEntries,
  migrateLegacyBrandId,
  migrateLegacyRegionId,
  migrateLegacyStoreId,
} from "./m-platform-store-scope";

export type StaffStoreAccessMode = "all" | "brands" | "regions" | "stores";

export interface StaffStoreAccess {
  mode: StaffStoreAccessMode;
  ids: string[];
}

/** @deprecated 使用 getMPlatformStoreScopeMeta；保留空对象避免旧引用报错 */
export const DEMO_STORE_SCOPE_META: Record<string, { brand: string; region: string }> = {};

const SCOPE_STORE_SESSION_KEY = "header-scope-filter-store";
const SIDEBAR_LAYOUT_PRESET_KEY = "sidebar-nav-layout-preset-v1";

function readLayoutPresetFromStorage(): "store" | "chain" {
  try {
    return localStorage.getItem(SIDEBAR_LAYOUT_PRESET_KEY) === "chain" ? "chain" : "store";
  } catch {
    return "store";
  }
}

function readScopeStoreFromSession(): string {
  try {
    const raw = sessionStorage.getItem(SCOPE_STORE_SESSION_KEY);
    return migrateLegacyStoreId(raw || DEFAULT_DEMO_STORE_ID);
  } catch {
    return DEFAULT_DEMO_STORE_ID;
  }
}

function allMPlatformStoreIds(): string[] {
  return listMPlatformStoreScopeEntries().map((e) => e.storeId);
}

function migrateAccessIds(access: StaffStoreAccess): StaffStoreAccess {
  if (access.mode === "all") return { mode: "all", ids: [] };
  const migrate = (id: string): string => {
    if (access.mode === "stores") return migrateLegacyStoreId(id);
    if (access.mode === "brands") return migrateLegacyBrandId(id);
    if (access.mode === "regions") return migrateLegacyRegionId(id);
    return id;
  };
  return { mode: access.mode, ids: access.ids.map(migrate).filter(Boolean) };
}

export function inferDefaultStaffStoreAccess(employeeId: string): StaffStoreAccess {
  if (readLayoutPresetFromStorage() === "store") {
    return { mode: "stores", ids: [readScopeStoreFromSession()] };
  }
  if (employeeId === "hq001" || employeeId === "zj-hq001") {
    return { mode: "all", ids: [] };
  }
  if (employeeId === "zj-brand-ops") {
    return { mode: "brands", ids: ["merchant-zhangji", "merchant-zhangji-skewers"] };
  }
  if (employeeId === "zj-brand-single") {
    return { mode: "brands", ids: ["merchant-zhangji"] };
  }
  return { mode: "stores", ids: [DEFAULT_DEMO_STORE_ID] };
}

export function normalizeStaffStoreAccess(
  access?: Partial<StaffStoreAccess> | null,
  fallback?: StaffStoreAccess,
): StaffStoreAccess {
  const fb = migrateAccessIds(fallback ?? { mode: "stores", ids: [DEFAULT_DEMO_STORE_ID] });
  if (!access) return fb;
  const mode = access.mode;
  if (mode !== "all" && mode !== "brands" && mode !== "regions" && mode !== "stores") {
    return fb;
  }
  if (mode === "all") return { mode: "all", ids: [] };
  const ids = Array.isArray(access.ids) ? access.ids.filter(Boolean) : [];
  if (ids.length === 0) return fb;
  return migrateAccessIds({ mode, ids });
}

function storeMeta(storeId: string): { brand: string; region: string } | undefined {
  const meta = getMPlatformStoreScopeMeta(storeId);
  if (!meta) return undefined;
  return { brand: meta.brand, region: meta.region };
}

/** 当前 access 下允许访问的门店 ID 列表（M 平台 storeId / MID） */
export function getAllowedStoreIds(access: StaffStoreAccess): string[] {
  const allIds = allMPlatformStoreIds();
  if (access.mode === "all") return allIds;
  if (access.mode === "stores") {
    return access.ids.filter((id) => allIds.includes(migrateLegacyStoreId(id)));
  }
  if (access.mode === "brands") {
    const brandIds = new Set(access.ids.map(migrateLegacyBrandId));
    return allIds.filter((id) => {
      const meta = storeMeta(id);
      return meta ? brandIds.has(meta.brand) : false;
    });
  }
  const regionIds = new Set(access.ids.map(migrateLegacyRegionId));
  return allIds.filter((id) => {
    const meta = storeMeta(id);
    return meta ? regionIds.has(meta.region) : false;
  });
}

export function isStoreIdAllowed(access: StaffStoreAccess, storeId: string): boolean {
  if (!storeId) return access.mode === "all";
  const normalized = migrateLegacyStoreId(storeId);
  if (access.mode === "all") return true;
  if (access.mode === "stores") return access.ids.map(migrateLegacyStoreId).includes(normalized);
  const meta = storeMeta(normalized);
  if (!meta) return false;
  if (access.mode === "brands") {
    return access.ids.map(migrateLegacyBrandId).includes(meta.brand);
  }
  return access.ids.map(migrateLegacyRegionId).includes(meta.region);
}

export function isScopeFilterAllowed(access: StaffStoreAccess, scope: ScopeFilterState): boolean {
  if (access.mode === "all") return true;
  const brand = scope.brand ? migrateLegacyBrandId(scope.brand) : "";
  const region = scope.region ? migrateLegacyRegionId(scope.region) : "";
  const store = scope.store ? migrateLegacyStoreId(scope.store) : "";
  if (store) return isStoreIdAllowed(access, store);
  if (region) {
    if (access.mode === "regions" && access.ids.map(migrateLegacyRegionId).includes(region)) return true;
    return getAllowedStoreIds(access).some((id) => storeMeta(id)?.region === region);
  }
  if (brand) {
    if (access.mode === "brands" && access.ids.map(migrateLegacyBrandId).includes(brand)) return true;
    return getAllowedStoreIds(access).some((id) => storeMeta(id)?.brand === brand);
  }
  return getAllowedStoreIds(access).length > 0;
}

/** 将 scope 收敛到员工可访问范围内 */
export function clampScopeToStoreAccess(
  access: StaffStoreAccess,
  scope: ScopeFilterState,
): ScopeFilterState {
  const normalizedScope: ScopeFilterState = {
    brand: scope.brand ? migrateLegacyBrandId(scope.brand) : "",
    region: scope.region ? migrateLegacyRegionId(scope.region) : "",
    store: scope.store ? migrateLegacyStoreId(scope.store) : "",
  };
  if (isScopeFilterAllowed(access, normalizedScope)) {
    /** 顶栏门店仅支持单选，不允许「全部门店」空值 */
    if (normalizedScope.store) return normalizedScope;
    const allowed = getAllowedStoreIds(access);
    const sid = allowed[0] ?? DEFAULT_DEMO_STORE_ID;
    const meta = storeMeta(sid);
    return {
      brand: normalizedScope.brand || meta?.brand || "",
      region: normalizedScope.region || meta?.region || "",
      store: sid,
    };
  }

  const allowed = getAllowedStoreIds(access);
  if (allowed.length === 1) {
    const sid = allowed[0]!;
    const meta = storeMeta(sid);
    return { brand: meta?.brand ?? "", region: meta?.region ?? "", store: sid };
  }
  if (allowed.length > 1) {
    const preferred =
      normalizedScope.store && allowed.includes(normalizedScope.store)
        ? normalizedScope.store
        : allowed[0]!;
    const meta = storeMeta(preferred);
    return {
      brand: normalizedScope.brand || meta?.brand || "",
      region: normalizedScope.region || meta?.region || "",
      store: preferred,
    };
  }
  const sid = allowed[0] ?? DEFAULT_DEMO_STORE_ID;
  const meta = storeMeta(sid);
  return { brand: meta?.brand ?? "", region: meta?.region ?? "", store: sid };
}

export function formatStaffStoreAccessLabel(access: StaffStoreAccess): string {
  if (access.mode === "all") return "全部门店";
  if (access.mode === "stores") {
    if (access.ids.length === 1) {
      const label = getMPlatformStoreScopeMeta(access.ids[0]!)?.name ?? access.ids[0];
      return `指定门店 · ${label}`;
    }
    return `指定门店 · ${access.ids.length} 家`;
  }
  if (access.mode === "brands") return `指定品牌 · ${access.ids.length} 个`;
  return `指定区域 · ${access.ids.length} 个`;
}

export function filterScopeOptionsForAccess(
  access: StaffStoreAccess,
  brands: ScopeOption[],
  regions: ScopeOption[],
  stores: ScopeOption[],
): { brands: ScopeOption[]; regions: ScopeOption[]; stores: ScopeOption[] } {
  if (access.mode === "all") {
    return { brands, regions, stores };
  }

  const allowedStoreIds = new Set(getAllowedStoreIds(access));
  const allowedBrands = new Set<string>();
  const allowedRegions = new Set<string>();
  for (const sid of allowedStoreIds) {
    const meta = storeMeta(sid);
    if (meta) {
      if (meta.brand) allowedBrands.add(meta.brand);
      if (meta.region) allowedRegions.add(meta.region);
    }
  }

  const filterWithEmpty = (opts: ScopeOption[], allowed: Set<string>): ScopeOption[] => {
    const empty = opts.filter((o) => !o.value);
    const matched = opts.filter((o) => o.value && allowed.has(o.value));
    if (allowed.size > 1) return [...empty, ...matched];
    return matched.length ? matched : empty;
  };

  const singleStoreLocked =
    access.mode === "stores" && access.ids.length === 1 && allowedStoreIds.size === 1;

  return {
    brands: filterWithEmpty(brands, allowedBrands),
    regions: filterWithEmpty(regions, allowedRegions),
    stores: singleStoreLocked
      ? stores.filter((o) => o.value && allowedStoreIds.has(migrateLegacyStoreId(o.value)))
      : filterWithEmpty(stores, allowedStoreIds),
  };
}

const PERSPECTIVE_RANK: Record<ChainDataPerspective, number> = {
  store: 0,
  brand: 1,
  "group-hq": 2,
};

/** 员工 storeAccess 允许的最高数据视角 */
export function maxChainDataPerspectiveForAccess(access: StaffStoreAccess): ChainDataPerspective {
  if (access.mode === "all") return "group-hq";
  if (access.mode === "brands" || access.mode === "regions") return "brand";
  return "store";
}

export function clampChainDataPerspectiveForAccess(
  access: StaffStoreAccess,
  perspective: ChainDataPerspective,
): ChainDataPerspective {
  const max = maxChainDataPerspectiveForAccess(access);
  return PERSPECTIVE_RANK[perspective] <= PERSPECTIVE_RANK[max] ? perspective : max;
}

function filterPickerOptionsByCeiling(
  targetMode: StaffStoreAccessMode,
  ceiling: StaffStoreAccess | undefined,
  options: ScopeOption[],
): ScopeOption[] {
  if (!ceiling || ceiling.mode === "all") return options;

  if (ceiling.mode === targetMode) {
    const allowed = new Set(
      ceiling.ids.map((id) => {
        if (targetMode === "stores") return migrateLegacyStoreId(id);
        if (targetMode === "brands") return migrateLegacyBrandId(id);
        if (targetMode === "regions") return migrateLegacyRegionId(id);
        return id;
      }),
    );
    return options.filter((o) => allowed.has(o.value));
  }

  if (targetMode === "brands") {
    const allowedBrands = new Set<string>();
    for (const sid of getAllowedStoreIds(ceiling)) {
      const meta = storeMeta(sid);
      if (meta?.brand) allowedBrands.add(meta.brand);
    }
    return options.filter((o) => allowedBrands.has(o.value));
  }

  if (targetMode === "regions") {
    const allowedRegions = new Set<string>();
    for (const sid of getAllowedStoreIds(ceiling)) {
      const meta = storeMeta(sid);
      if (meta?.region) allowedRegions.add(meta.region);
    }
    return options.filter((o) => allowedRegions.has(o.value));
  }

  const allowedStores = new Set(getAllowedStoreIds(ceiling).map(migrateLegacyStoreId));
  return options.filter((o) => allowedStores.has(migrateLegacyStoreId(o.value)));
}

/** 员工 storeAccess 下可访问的品牌 merchantId 列表 */
export function getAuthorizedBrandIds(access: StaffStoreAccess): string[] {
  if (access.mode === "all") {
    const seen = new Set<string>();
    for (const entry of listMPlatformStoreScopeEntries()) {
      seen.add(entry.merchantId);
    }
    return Array.from(seen);
  }
  if (access.mode === "brands") {
    return access.ids.map(migrateLegacyBrandId);
  }
  const brandSet = new Set<string>();
  for (const storeId of getAllowedStoreIds(access)) {
    const meta = storeMeta(storeId);
    if (meta?.brand) brandSet.add(meta.brand);
  }
  return Array.from(brandSet);
}

export function countAuthorizedBrands(access: StaffStoreAccess): number {
  return getAuthorizedBrandIds(access).length;
}

function buildStaffBrandPickerOptions(): ScopeOption[] {
  const snap = getEnterpriseMerchantSnapshot();
  return snap.merchants
    .filter((m) => m.groupId)
    .map((m) => ({ value: m.merchantId, labelZh: m.name, labelEn: m.name }))
    .sort((a, b) => a.labelZh.localeCompare(b.labelZh, "zh-CN"));
}

function buildStaffRegionPickerOptions(): ScopeOption[] {
  const regions = new Set<string>();
  for (const entry of listMPlatformStoreScopeEntries()) {
    if (entry.regionName) regions.add(entry.regionName);
  }
  return Array.from(regions)
    .sort((a, b) => a.localeCompare(b, "zh-CN"))
    .map((r) => ({ value: r, labelZh: r, labelEn: r }));
}

/** RBAC 员工授权页 · 品牌多选列表（受授权人 storeAccess 天花板约束） */
export function getStaffBrandPickerOptions(ceiling?: StaffStoreAccess): ScopeOption[] {
  return filterPickerOptionsByCeiling("brands", ceiling, buildStaffBrandPickerOptions());
}

/** RBAC 员工授权页 · 区域多选列表（受授权人 storeAccess 天花板约束） */
export function getStaffRegionPickerOptions(ceiling?: StaffStoreAccess): ScopeOption[] {
  return filterPickerOptionsByCeiling("regions", ceiling, buildStaffRegionPickerOptions());
}

/** RBAC 员工授权页 · 门店多选列表（受授权人 storeAccess 天花板约束） */
export function getStaffStorePickerOptions(ceiling?: StaffStoreAccess): ScopeOption[] {
  const base = buildDemoScopeStoreOptions().filter((o) => o.value);
  return filterPickerOptionsByCeiling("stores", ceiling, base);
}

export interface GrantScopeResult {
  ok: boolean;
  reason?: string;
}

export function isStaffStoreAccessEqual(a: StaffStoreAccess, b: StaffStoreAccess): boolean {
  if (a.mode !== b.mode) return false;
  if (a.mode === "all") return true;
  const sortIds = (ids: string[]) => [...ids].sort().join("\0");
  return sortIds(a.ids) === sortIds(b.ids);
}

/** 合并多个角色的默认数据范围（取并集；任一角色为 all 则结果为 all） */
export function mergeRoleDefaultStoreAccess(
  roleDefaults: StaffStoreAccess[],
  fallback: StaffStoreAccess,
): StaffStoreAccess {
  const defaults = roleDefaults;
  if (defaults.length === 0) return fallback;
  if (defaults.some((d) => d.mode === "all")) return { mode: "all", ids: [] };

  const modes = new Set(defaults.map((d) => d.mode));
  if (modes.size === 1) {
    const mode = defaults[0]!.mode;
    const ids = new Set<string>();
    for (const d of defaults) {
      for (const id of d.ids) ids.add(id);
    }
    if (ids.size === 0) return fallback;
    return normalizeStaffStoreAccess({ mode, ids: Array.from(ids) }, fallback);
  }

  const unionStoreIds = new Set<string>();
  for (const d of defaults) {
    for (const sid of getAllowedStoreIds(d)) unionStoreIds.add(sid);
  }
  if (unionStoreIds.size === 0) return fallback;
  return { mode: "stores", ids: Array.from(unionStoreIds) };
}

/**
 * 保存员工授权时校验：被授权人 storeAccess 必须是授权人的子集。
 */
export function canGrantScope(
  grantorAccess: StaffStoreAccess,
  granteeAccess: StaffStoreAccess,
): GrantScopeResult {
  const grantor = normalizeStaffStoreAccess(grantorAccess, { mode: "all", ids: [] });
  const grantee = normalizeStaffStoreAccess(granteeAccess, granteeAccess);

  const grantorStores = new Set(getAllowedStoreIds(grantor));
  const granteeStores = getAllowedStoreIds(grantee);
  for (const storeId of granteeStores) {
    if (!grantorStores.has(storeId)) {
      const label = getMPlatformStoreScopeMeta(storeId)?.name ?? storeId;
      return { ok: false, reason: `门店「${label}」超出授权人可见范围` };
    }
  }

  const grantorMax = maxChainDataPerspectiveForAccess(grantor);
  const granteeMax = maxChainDataPerspectiveForAccess(grantee);
  if (PERSPECTIVE_RANK[granteeMax] > PERSPECTIVE_RANK[grantorMax]) {
    return { ok: false, reason: "被授权人的数据范围视角不能高于授权人" };
  }

  if (grantee.mode === "brands") {
    const grantorBrands = new Set(getAuthorizedBrandIds(grantor).map(migrateLegacyBrandId));
    for (const brandId of grantee.ids.map(migrateLegacyBrandId)) {
      if (!grantorBrands.has(brandId)) {
        return { ok: false, reason: `品牌「${brandId}」超出授权人可见范围` };
      }
    }
  }

  if (grantee.mode === "regions") {
    const grantorRegions = new Set<string>();
    for (const storeId of grantorStores) {
      const meta = storeMeta(storeId);
      if (meta?.region) grantorRegions.add(meta.region);
    }
    for (const regionId of grantee.ids.map(migrateLegacyRegionId)) {
      if (!grantorRegions.has(regionId)) {
        return { ok: false, reason: `区域「${regionId}」超出授权人可见范围` };
      }
    }
  }

  if (grantee.mode === "stores") {
    for (const storeId of grantee.ids.map(migrateLegacyStoreId)) {
      if (!grantorStores.has(storeId)) {
        const label = getMPlatformStoreScopeMeta(storeId)?.name ?? storeId;
        return { ok: false, reason: `门店「${label}」超出授权人可见范围` };
      }
    }
  }

  if (grantee.mode === "all" && grantor.mode !== "all") {
    return { ok: false, reason: "授权人无法授予「全部门店」范围" };
  }

  return { ok: true };
}

export function validateStaffAssignmentsGrant(
  grantorAccess: StaffStoreAccess,
  staff: { employeeName: string; storeAccess: StaffStoreAccess }[],
): GrantScopeResult {
  for (const row of staff) {
    const result = canGrantScope(grantorAccess, row.storeAccess);
    if (!result.ok) {
      return { ok: false, reason: `员工「${row.employeeName}」：${result.reason}` };
    }
  }
  return { ok: true };
}
