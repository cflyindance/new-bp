/**
 * 员工数据范围（门店访问）校验与 M 平台门店元数据。
 * 功能权限（RBAC）与数据范围（Scope）分离：切门店只改 scope，不重算权限。
 */
import type { ChainDataPerspective } from "../auth/merchant-scope-context";
import type { ScopeFilterState, ScopeOption } from "../auth/session-scope";
import {
  DEFAULT_DEMO_BRAND_ID,
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

/** 当前 access 下允许访问的门店 ID 列表（M 平台 storeId / BID） */
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
  if (isScopeFilterAllowed(access, normalizedScope)) return normalizedScope;

  const allowed = getAllowedStoreIds(access);
  if (access.mode === "all") {
    return { brand: "", region: "", store: "" };
  }
  if (allowed.length === 1) {
    const sid = allowed[0]!;
    const meta = storeMeta(sid);
    return { brand: meta?.brand ?? "", region: meta?.region ?? "", store: sid };
  }
  if (allowed.length > 1) {
    return { brand: "", region: "", store: "" };
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

/** RBAC 员工授权页 · 门店多选列表 */
export function getStaffStorePickerOptions(): ScopeOption[] {
  return buildDemoScopeStoreOptions().filter((o) => o.value);
}
