/**
 * 员工数据范围（门店访问）校验与演示门店元数据。
 * 功能权限（RBAC）与数据范围（Scope）分离：切门店只改 scope，不重算权限。
 */
import type { ScopeFilterState, ScopeOption } from "../auth/session-scope";

export type StaffStoreAccessMode = "all" | "brands" | "regions" | "stores";

export interface StaffStoreAccess {
  mode: StaffStoreAccessMode;
  ids: string[];
}

/** 演示门店 → 品牌 / 区域映射 */
export const DEMO_STORE_SCOPE_META: Record<string, { brand: string; region: string }> = {
  "flagship-nyc": { brand: "menusifu-na", region: "us-east" },
  "branch-la": { brand: "menusifu-na", region: "us-west" },
  "shanghai-ljz": { brand: "miju", region: "east-cn" },
  "guangzhou-tzh": { brand: "miju", region: "south-cn" },
};

const ALL_DEMO_STORE_IDS = Object.keys(DEMO_STORE_SCOPE_META);

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
    return sessionStorage.getItem(SCOPE_STORE_SESSION_KEY) || "shanghai-ljz";
  } catch {
    return "shanghai-ljz";
  }
}

export function inferDefaultStaffStoreAccess(employeeId: string): StaffStoreAccess {
  if (readLayoutPresetFromStorage() === "store") {
    return { mode: "stores", ids: [readScopeStoreFromSession()] };
  }
  if (employeeId === "hq001") return { mode: "all", ids: [] };
  return { mode: "stores", ids: ["shanghai-ljz"] };
}

export function normalizeStaffStoreAccess(
  access?: Partial<StaffStoreAccess> | null,
  fallback?: StaffStoreAccess,
): StaffStoreAccess {
  const fb = fallback ?? { mode: "stores", ids: ["shanghai-ljz"] };
  if (!access) return fb;
  const mode = access.mode;
  if (mode !== "all" && mode !== "brands" && mode !== "regions" && mode !== "stores") {
    return fb;
  }
  if (mode === "all") return { mode: "all", ids: [] };
  const ids = Array.isArray(access.ids) ? access.ids.filter(Boolean) : [];
  if (ids.length === 0) return fb;
  return { mode, ids };
}

function storeMeta(storeId: string): { brand: string; region: string } | undefined {
  return DEMO_STORE_SCOPE_META[storeId];
}

/** 当前 access 下允许访问的演示门店 ID 列表 */
export function getAllowedStoreIds(access: StaffStoreAccess): string[] {
  if (access.mode === "all") return [...ALL_DEMO_STORE_IDS];
  if (access.mode === "stores") {
    return access.ids.filter((id) => ALL_DEMO_STORE_IDS.includes(id));
  }
  if (access.mode === "brands") {
    return ALL_DEMO_STORE_IDS.filter((id) => access.ids.includes(storeMeta(id)?.brand ?? ""));
  }
  return ALL_DEMO_STORE_IDS.filter((id) => access.ids.includes(storeMeta(id)?.region ?? ""));
}

export function isStoreIdAllowed(access: StaffStoreAccess, storeId: string): boolean {
  if (!storeId) return access.mode === "all";
  if (access.mode === "all") return true;
  if (access.mode === "stores") return access.ids.includes(storeId);
  const meta = storeMeta(storeId);
  if (!meta) return false;
  if (access.mode === "brands") return access.ids.includes(meta.brand);
  return access.ids.includes(meta.region);
}

export function isScopeFilterAllowed(access: StaffStoreAccess, scope: ScopeFilterState): boolean {
  if (access.mode === "all") return true;
  if (scope.store) return isStoreIdAllowed(access, scope.store);
  if (scope.region) {
    if (access.mode === "regions" && access.ids.includes(scope.region)) return true;
    return getAllowedStoreIds(access).some((id) => storeMeta(id)?.region === scope.region);
  }
  if (scope.brand) {
    if (access.mode === "brands" && access.ids.includes(scope.brand)) return true;
    return getAllowedStoreIds(access).some((id) => storeMeta(id)?.brand === scope.brand);
  }
  return getAllowedStoreIds(access).length > 0;
}

/** 将 scope 收敛到员工可访问范围内 */
export function clampScopeToStoreAccess(
  access: StaffStoreAccess,
  scope: ScopeFilterState,
): ScopeFilterState {
  if (isScopeFilterAllowed(access, scope)) return scope;

  const allowed = getAllowedStoreIds(access);
  if (access.mode === "all") {
    return { brand: "", region: "", store: "" };
  }
  if (allowed.length === 1) {
    const sid = allowed[0];
    const meta = storeMeta(sid);
    return { brand: meta?.brand ?? "", region: meta?.region ?? "", store: sid };
  }
  if (allowed.length > 1) {
    return { brand: "", region: "", store: "" };
  }
  const sid = allowed[0] ?? "shanghai-ljz";
  const meta = storeMeta(sid);
  return { brand: meta?.brand ?? "", region: meta?.region ?? "", store: sid };
}

export function formatStaffStoreAccessLabel(access: StaffStoreAccess): string {
  if (access.mode === "all") return "全部门店";
  if (access.mode === "stores") {
    if (access.ids.length === 1) return `指定门店 · ${access.ids[0]}`;
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
      allowedBrands.add(meta.brand);
      allowedRegions.add(meta.region);
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
      ? stores.filter((o) => o.value && allowedStoreIds.has(o.value))
      : filterWithEmpty(stores, allowedStoreIds),
  };
}
