/**
 * 登录会话的数据范围（品牌 / 区域 / 门店）与组织层级（单店 / 连锁）。
 */
import { getAuthenticatedEmail } from "./login";
import { getStaffLoginAccountByEmail, type StaffLoginAccount } from "../permissions/staff-account-store";
import { getRbacSnapshot } from "../permissions/rbac-store";
import {
  clampScopeToStoreAccess,
  countAuthorizedBrands,
  filterScopeOptionsForAccess,
  getAllowedStoreIds,
  getAuthorizedBrandIds,
  type StaffStoreAccess,
} from "../permissions/store-access";
import {
  getMPlatformStoreScopeMeta,
  migrateLegacyBrandId,
  migrateLegacyRegionId,
  migrateLegacyStoreId,
} from "../permissions/m-platform-store-scope";
import {
  getUserSessionContext,
  refreshUserSessionContext,
} from "./session-permissions";
import {
  applyDefaultLayoutPresetForOrgTier,
  readSidebarNavLayoutPreset,
  type SidebarNavLayoutPreset,
} from "../config/sidebar-nav-order";
import { loadChainBrandOrgForContext, syncChainBrandOrgForGroup, clearActiveMerchantGroupOverride, syncAllActiveMPlatformGroups, listMPlatformGroupsForMerchantBackend, resolveChainBrandContext, type ChainBrandOrgSnapshot, type ChainBrandView, type ChainStoreView } from "../config/merchant-chain-brand-sync";
import { readActiveImpersonation } from "../config/enterprise-merchant-impersonate";
import { shouldShowBrandPerspectiveRegionScopeFilter } from "../config/product-version";
import { buildDemoScopeStoreOptions, DEFAULT_DEMO_STORE_ID } from "../permissions/m-platform-store-scope";
import { mergeEmployeeRosterStoresIntoScopeOptions } from "../config/team-employee-roster-scope";
import {
  clearChainDataPerspectiveState,
  ensureChainPerspectiveForCurrentLayout,
  getDefaultChainDataPerspective,
  isBrandDataPerspective,
  isGroupHqDataPerspective,
  isStoreDataPerspective,
  readChainAnchorBrandId,
  readChainAnchorStoreId,
  readStoredChainDataPerspective,
  resolveChainDataPerspective,
  resolveDefaultAnchorBrandId,
  writeChainDataPerspective,
  type ChainDataPerspective,
} from "./merchant-scope-context";

export type { ChainDataPerspective };
export {
  clearChainDataPerspectiveState,
  isBrandDataPerspective,
  isGroupHqDataPerspective,
  isStoreDataPerspective,
  resolveChainDataPerspective,
  writeChainDataPerspective,
};

export type AccountOrgTier = "store" | "chain";

export interface ScopeFilterState {
  brand: string;
  region: string;
  store: string;
}

export interface ScopeOption {
  value: string;
  labelZh: string;
  labelEn: string;
}

export const SCOPE_FILTER_STORAGE_KEYS = {
  brand: "header-scope-filter-brand",
  region: "header-scope-filter-region",
  store: "header-scope-filter-store",
} as const;

/** 单店账号默认锁定的演示门店（M 平台 MID） */
export const DEFAULT_LOCKED_STORE_ID = DEFAULT_DEMO_STORE_ID;

export const DEMO_SCOPE_BRANDS: ScopeOption[] = [
  { value: "", labelZh: "全部品牌", labelEn: "All brands" },
  { value: "miju", labelZh: "米聚餐饮集团", labelEn: "Miju Group" },
  { value: "menusifu-na", labelZh: "MenuSifu 北美", labelEn: "MenuSifu NA" },
];

export const DEMO_SCOPE_REGIONS: ScopeOption[] = [
  { value: "", labelZh: "全部区域", labelEn: "All regions" },
  { value: "east-cn", labelZh: "华东大区", labelEn: "East China" },
  { value: "south-cn", labelZh: "华南大区", labelEn: "South China" },
  { value: "north-cn", labelZh: "华北大区", labelEn: "North China" },
  { value: "us-west", labelZh: "美国西海岸", labelEn: "US West" },
  { value: "us-east", labelZh: "美国东海岸", labelEn: "US East" },
];

export const DEMO_SCOPE_STORES: ScopeOption[] = buildDemoScopeStoreOptions();

/** 门店版等非连锁 scope 下拉（随 M 平台快照刷新） */
export function getDemoScopeStores(): ScopeOption[] {
  return buildDemoScopeStoreOptions();
}

/** 单店组织层级下侧栏默认隐藏的连锁向一级模块 */
export const STORE_TIER_HIDDEN_NAV_MODULE_IDS: readonly string[] = [
  "brand-mgmt",
];

/** 门店数据视角下隐藏的一级模块 */
export const STORE_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS: readonly string[] = ["brand-mgmt"];

export const BRAND_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS: readonly string[] = ["brand-mgmt"];

/** 品牌多门店视角下才展示的一级模块 */
export const BRAND_PERSPECTIVE_ONLY_NAV_MODULE_IDS: readonly string[] = ["brand-store-list"];

/** 集团总部视角下才展示的一级模块 */
export const GROUP_HQ_PERSPECTIVE_ONLY_NAV_MODULE_IDS: readonly string[] = ["group-store-list"];

const CHAIN_ROLE_IDS = new Set(["hq-admin"]);

export function readScopeFilters(): ScopeFilterState {
  try {
    return {
      brand: sessionStorage.getItem(SCOPE_FILTER_STORAGE_KEYS.brand) ?? "",
      region: sessionStorage.getItem(SCOPE_FILTER_STORAGE_KEYS.region) ?? "",
      store: sessionStorage.getItem(SCOPE_FILTER_STORAGE_KEYS.store) ?? "",
    };
  } catch {
    return { brand: "", region: "", store: "" };
  }
}

export function writeScopeFilters(state: ScopeFilterState): void {
  const ctx = getUserSessionContext();
  const next = ctx ? clampScopeToStoreAccess(ctx.storeAccess, state) : state;
  try {
    sessionStorage.setItem(SCOPE_FILTER_STORAGE_KEYS.brand, next.brand);
    sessionStorage.setItem(SCOPE_FILTER_STORAGE_KEYS.region, next.region);
    sessionStorage.setItem(SCOPE_FILTER_STORAGE_KEYS.store, next.store);
  } catch {
    /* ignore */
  }
  syncScopeFilterMetaForEmbeddedPages(next);
  window.dispatchEvent(
    new CustomEvent("menusifu:scope-filter-change", {
      detail: { ...next },
    }),
  );
}

/** 供 TipOut 等内嵌页读取顶栏门店筛选（与 sessionStorage scope 同步） */
export function syncScopeFilterMetaForEmbeddedPages(
  state: ScopeFilterState = readScopeFilters(),
): void {
  if (typeof window === "undefined") return;
  const scoped = getScopedFilterOptions();
  const storeOpt = scoped.stores.find((o) => o.value === state.store);
  const brandOpt = scoped.brands.find((o) => o.value === state.brand);
  const regionOpt = scoped.regions.find((o) => o.value === state.region);
  const storeOptions = scoped.stores
    .filter((o) => !!o.value)
    .map((o) => ({
      value: o.value,
      labelZh: o.labelZh,
      labelEn: o.labelEn,
    }));
  const meta = {
    storeId: state.store,
    storeLabel: storeOpt ? storeOpt.labelZh : "",
    storeLabelEn: storeOpt ? storeOpt.labelEn : "",
    brandId: state.brand,
    brandLabel: brandOpt ? brandOpt.labelZh : "",
    regionId: state.region,
    regionLabel: regionOpt ? regionOpt.labelZh : "",
    /** 品牌多门店视角：内嵌页自行展示门店筛选 */
    usesInPageStorePicker: usesInPageStorePicker(),
    stores: storeOptions,
  };
  try {
    localStorage.setItem("menusifu-scope-filter-meta", JSON.stringify(meta));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("menusifu:scope-store-meta-updated", { detail: meta }));
}

function scopeOptionLabel(opt: ScopeOption | undefined, locale: "zh" | "en"): string {
  if (!opt) return "";
  return locale === "en" ? opt.labelEn : opt.labelZh;
}

export function resolveAccountOrgTier(email?: string | null): AccountOrgTier {
  const normalized = (email ?? getAuthenticatedEmail())?.trim().toLowerCase();
  if (!normalized) return "store";

  const account = getStaffLoginAccountByEmail(normalized);
  if (account?.orgTier === "chain" || account?.orgTier === "store") {
    return account.orgTier;
  }

  if (account) {
    const { staff, roles } = getRbacSnapshot();
    const assignment = staff.find((s) => s.employeeId === account.employeeId);
    if (assignment?.roleIds.some((id) => CHAIN_ROLE_IDS.has(id))) {
      return "chain";
    }
    if (assignment?.roleIds.some((id) => roles.find((r) => r.id === id)?.id === "store-manager")) {
      return "store";
    }
  }

  return "store";
}

export function getAccountOrgTier(): AccountOrgTier {
  return resolveAccountOrgTier(getAuthenticatedEmail());
}

export function isChainOrgTier(): boolean {
  return getAccountOrgTier() === "chain";
}

/** 顶栏展示品牌/区域/门店三级筛选：连锁账号，或手动选择连锁版布局 */
export function isChainScopeMode(): boolean {
  return isChainOrgTier() || readSidebarNavLayoutPreset() === "chain";
}

/** 品牌多门店视角：门店选择在页内而非顶栏 */
export function usesInPageStorePicker(): boolean {
  return isChainScopeMode() && isBrandDataPerspective();
}

/** 顶栏是否展示门店筛选（品牌多门店视角下隐藏，改由页内选择） */
export function shouldShowHeaderStoreScopeFilter(): boolean {
  return !usesInPageStorePicker();
}

export function shouldShowBrandScopeFilter(): boolean {
  if (!isChainScopeMode()) return false;
  if (isGroupHqDataPerspective()) return true;
  if (isBrandDataPerspective()) {
    const ctx = getUserSessionContext();
    if (!ctx) return false;
    return countAuthorizedBrands(ctx.storeAccess) > 1;
  }
  return false;
}

export function shouldShowRegionScopeFilter(): boolean {
  if (!isChainScopeMode()) return false;
  if (isBrandDataPerspective() && !shouldShowBrandPerspectiveRegionScopeFilter()) return false;
  return isGroupHqDataPerspective() || isBrandDataPerspective();
}

/** MVP + 品牌视角：隐藏区域筛选时清空已选区域 */
export function ensureMvpBrandPerspectiveRegionScopeCleared(): void {
  if (shouldShowBrandPerspectiveRegionScopeFilter()) return;
  if (!isChainScopeMode() || !isBrandDataPerspective()) return;
  const scope = readScopeFilters();
  if (!scope.region) return;
  writeScopeFilters({ ...scope, region: "" });
}

/** 品牌多门店视角：顶栏品牌为只读标签（仅授权单品牌时） */
export function shouldShowBrandScopeLockedLabel(): boolean {
  return isChainScopeMode() && isBrandDataPerspective() && !shouldShowBrandScopeFilter();
}

/** 连锁视角：顶栏左侧展示 M 平台集团切换（仅集团总部视角；代登录时锁定） */
export function shouldShowMerchantGroupSwitcher(): boolean {
  return canSwitchMerchantGroup();
}

/** 是否允许切换侧栏集团（仅集团总部视角、非代登录、连锁模式） */
export function canSwitchMerchantGroup(): boolean {
  if (!isChainScopeMode()) return false;
  if (readActiveImpersonation()) return false;
  if (!isGroupHqDataPerspective()) return false;
  return listMPlatformGroupsForMerchantBackend().length > 0;
}

/** 代管模式下禁止切换顶栏视角 */
export function isViewSwitchRestricted(): boolean {
  return readActiveImpersonation() != null;
}

export function resetScopeFiltersForGroupChange(): void {
  resetScopeFiltersForPerspectiveChange();
}

function resolveDefaultSingleStoreId(preferredStoreId = ""): string {
  const scoped = getScopedFilterOptions().stores.filter((o) => !!o.value);
  if (preferredStoreId && scoped.some((o) => o.value === preferredStoreId)) {
    return preferredStoreId;
  }
  const cur = preferredStoreId || readScopeFilters().store;
  if (cur && scoped.some((o) => o.value === cur)) return cur;
  const anchor = readChainAnchorStoreId();
  if (anchor && scoped.some((o) => o.value === anchor)) return anchor;
  return scoped[0]?.value || DEFAULT_LOCKED_STORE_ID;
}

/** 对外：解析当前可见门店列表中的默认门店 */
export function resolveDefaultScopedStoreId(preferredStoreId = ""): string {
  return resolveDefaultSingleStoreId(preferredStoreId);
}

/**
 * 品牌多门店视角：若尚未选店（或已选无效），写入默认门店。
 * 返回是否发生了写入。
 */
export function ensureInPageDefaultStoreSelected(): boolean {
  if (!usesInPageStorePicker()) return false;
  const stores = getScopedFilterOptions().stores.filter((o) => !!o.value);
  if (!stores.length) return false;
  const cur = readScopeFilters();
  const nextStore = resolveDefaultSingleStoreId(cur.store);
  if (!nextStore || cur.store === nextStore) return false;
  writeScopeFilters({ ...cur, store: nextStore });
  return true;
}

export function resetScopeFiltersForPerspectiveChange(): void {
  const perspective = resolveChainDataPerspective();
  if (perspective === "brand") {
    const brandId = resolveDefaultAnchorBrandId() ?? "";
    // 品牌多门店与其它视角一致：初始化即默认选中一家门店
    writeScopeFilters({ brand: brandId, region: "", store: resolveDefaultSingleStoreId() });
    return;
  }
  writeScopeFilters({ brand: "", region: "", store: resolveDefaultSingleStoreId() });
}

export function isStoreScopeLocked(): boolean {
  return !isChainScopeMode() || isStoreDataPerspective();
}

/** 门店版布局下当前模拟门店（顶栏 scope 锁定值） */
export function getLayoutContextStoreId(): string {
  const scope = readScopeFilters();
  return scope.store || DEFAULT_LOCKED_STORE_ID;
}

export function isStoreLayoutPreset(): boolean {
  return readSidebarNavLayoutPreset() === "store";
}

/** 门店版布局 + 单店账号：锁定为当前门店 */
export function ensureScopeFiltersForSession(): void {
  const ctx = getUserSessionContext();
  if (isChainScopeMode()) {
    if (ctx) {
      const cur = readScopeFilters();
      const clamped = clampScopeToStoreAccess(ctx.storeAccess, cur);
      // 品牌多门店也需默认选店，避免各页选择器初始化为空
      const nextStore = clamped.store || resolveDefaultSingleStoreId(clamped.store);
      const next = { ...clamped, store: nextStore };
      if (next.brand !== cur.brand || next.region !== cur.region || next.store !== cur.store) {
        writeScopeFilters(next);
      }
    } else {
      const cur = readScopeFilters();
      if (!cur.store) {
        writeScopeFilters({ ...cur, store: resolveDefaultSingleStoreId() });
      }
    }
    return;
  }
  const lockedStore =
    ctx?.storeAccess.mode === "stores" && ctx.storeAccess.ids.length === 1
      ? ctx.storeAccess.ids[0]
      : DEFAULT_LOCKED_STORE_ID;
  const cur = readScopeFilters();
  if (cur.store === lockedStore && !cur.brand && !cur.region) return;
  writeScopeFilters({ brand: "", region: "", store: lockedStore });
}

/** 切换门店版/连锁版布局时同步顶栏 scope */
export function ensureScopeFiltersForLayoutPreset(preset: SidebarNavLayoutPreset): void {
  if (preset === "chain") {
    syncAllActiveMPlatformGroups();
    ensureChainPerspectiveForCurrentLayout();
    resetScopeFiltersForPerspectiveChange();
    return;
  }
  clearChainDataPerspectiveState();
  const cur = readScopeFilters();
  const layoutStore = cur.store || DEFAULT_LOCKED_STORE_ID;
  if (cur.brand || cur.region || cur.store !== layoutStore) {
    writeScopeFilters({ brand: "", region: "", store: layoutStore });
  }
  ensureScopeFiltersForSession();
}

export function ensureScopeFiltersForOrgTier(tier: AccountOrgTier = getAccountOrgTier()): void {
  if (tier === "chain") return;
  ensureScopeFiltersForSession();
}

export function syncSessionForAuthenticatedUser(): void {
  clearActiveMerchantGroupOverride();
  clearChainDataPerspectiveState();
  refreshUserSessionContext();
  applyDefaultLayoutPresetForOrgTier(getAccountOrgTier());
  ensureChainPerspectiveForCurrentLayout();
  ensureScopeFiltersForSession();
  if (readSidebarNavLayoutPreset() === "chain") {
    syncAllActiveMPlatformGroups();
  }
  loadChainBrandOrgForContext();
}

/** 页面重绘时刷新会话（保留用户已选的数据视角与集团） */
export function refreshSessionOnMount(): void {
  refreshUserSessionContext();
  ensureScopeFiltersForSession();
  if (readSidebarNavLayoutPreset() === "chain") {
    syncAllActiveMPlatformGroups();
    if (!readStoredChainDataPerspective()) {
      ensureChainPerspectiveForCurrentLayout();
    }
  }
  loadChainBrandOrgForContext();
  syncScopeFilterMetaForEmbeddedPages();
}

function buildScopeOptionsFromChainSnapshot(snapshot: ChainBrandOrgSnapshot): {
  brands: ScopeOption[];
  regions: ScopeOption[];
  stores: ScopeOption[];
} {
  const brands: ScopeOption[] = [
    { value: "", labelZh: "全部品牌", labelEn: "All brands" },
    ...snapshot.brands.map((b) => ({ value: b.merchantId, labelZh: b.name, labelEn: b.name })),
  ];
  const regionMap = new Map<string, ScopeOption>();
  const stores: ScopeOption[] = [];
  for (const brand of snapshot.brands) {
    for (const store of brand.stores) {
      if (store.regionName) {
        const key = store.regionName;
        if (!regionMap.has(key)) {
          regionMap.set(key, { value: key, labelZh: store.regionName, labelEn: store.regionName });
        }
      }
      stores.push({ value: store.storeId, labelZh: store.name, labelEn: store.name });
    }
  }
  const regions: ScopeOption[] = [
    { value: "", labelZh: "全部区域", labelEn: "All regions" },
    ...Array.from(regionMap.values()),
  ];
  return { brands, regions, stores };
}

function cropScopeOptionsByPerspective(
  snapshot: ChainBrandOrgSnapshot,
  perspective: ChainDataPerspective,
): { brands: ScopeOption[]; regions: ScopeOption[]; stores: ScopeOption[] } {
  const base = buildScopeOptionsFromChainSnapshot(snapshot);

  if (perspective === "group-hq") return base;

  const anchorBrandId = resolveDefaultAnchorBrandId();
  const brand = anchorBrandId ? snapshot.brands.find((b) => b.merchantId === anchorBrandId) : snapshot.brands[0];
  if (!brand) return base;

  if (perspective === "brand") {
    const regionMap = new Map<string, ScopeOption>();
    const stores: ScopeOption[] = [];
    for (const store of brand.stores) {
      if (store.regionName) {
        const key = store.regionName;
        if (!regionMap.has(key)) {
          regionMap.set(key, { value: key, labelZh: store.regionName, labelEn: store.regionName });
        }
      }
      stores.push({ value: store.storeId, labelZh: store.name, labelEn: store.name });
    }
    return {
      brands: [{ value: brand.merchantId, labelZh: brand.name, labelEn: brand.name }],
      regions: [{ value: "", labelZh: "全部区域", labelEn: "All regions" }, ...Array.from(regionMap.values())],
      stores,
    };
  }

  const anchorStoreId = readChainAnchorStoreId();
  const store =
    (anchorStoreId ? brand.stores.find((s) => s.storeId === anchorStoreId) : undefined) ?? brand.stores[0];
  if (!store) {
    return {
      brands: [{ value: brand.merchantId, labelZh: brand.name, labelEn: brand.name }],
      regions: [],
      stores: [],
    };
  }
  return {
    brands: [{ value: brand.merchantId, labelZh: brand.name, labelEn: brand.name }],
    regions: store.regionName
      ? [{ value: store.regionName, labelZh: store.regionName, labelEn: store.regionName }]
      : [],
    stores: [{ value: store.storeId, labelZh: store.name, labelEn: store.name }],
  };
}

function buildBrandPerspectiveMultiBrandScopeOptions(
  snapshot: ChainBrandOrgSnapshot,
  access: StaffStoreAccess,
  filters: ScopeFilterState,
): { brands: ScopeOption[]; regions: ScopeOption[]; stores: ScopeOption[] } {
  const authorizedBrandIds = new Set(getAuthorizedBrandIds(access));
  const allowedStoreIds = new Set(getAllowedStoreIds(access));

  const brands: ScopeOption[] = [
    { value: "", labelZh: "全部品牌", labelEn: "All brands" },
    ...snapshot.brands
      .filter((b) => authorizedBrandIds.has(b.merchantId))
      .map((b) => ({ value: b.merchantId, labelZh: b.name, labelEn: b.name })),
  ];

  const activeBrandId = filters.brand ? migrateLegacyBrandId(filters.brand) : "";
  const relevantBrands = activeBrandId
    ? snapshot.brands.filter(
        (b) => b.merchantId === activeBrandId && authorizedBrandIds.has(b.merchantId),
      )
    : snapshot.brands.filter((b) => authorizedBrandIds.has(b.merchantId));

  const regionMap = new Map<string, ScopeOption>();
  const stores: ScopeOption[] = [];

  for (const brand of relevantBrands) {
    for (const store of brand.stores) {
      if (!allowedStoreIds.has(store.storeId)) continue;
      if (store.regionName) {
        const key = store.regionName;
        if (!regionMap.has(key)) {
          regionMap.set(key, { value: key, labelZh: store.regionName, labelEn: store.regionName });
        }
      }
      stores.push({ value: store.storeId, labelZh: store.name, labelEn: store.name });
    }
  }

  const regions: ScopeOption[] = [
    { value: "", labelZh: "全部区域", labelEn: "All regions" },
    ...Array.from(regionMap.values()),
  ];

  return { brands, regions, stores };
}

/** 顶栏 scope 下拉选项（按数据视角与员工 storeAccess 过滤） */
export function getScopedFilterOptions(): {
  brands: ScopeOption[];
  regions: ScopeOption[];
  stores: ScopeOption[];
} {
  const withRosterStores = (result: {
    brands: ScopeOption[];
    regions: ScopeOption[];
    stores: ScopeOption[];
  }) => ({
    ...result,
    stores: mergeEmployeeRosterStoresIntoScopeOptions(result.stores).filter((o) => !!o.value),
  });

  const chainOrg = isChainScopeMode() ? loadChainBrandOrgForContext() : null;
  const perspective = resolveChainDataPerspective();
  const base = chainOrg
    ? cropScopeOptionsByPerspective(chainOrg, perspective)
    : {
        brands: DEMO_SCOPE_BRANDS,
        regions: DEMO_SCOPE_REGIONS,
        stores: getDemoScopeStores(),
      };
  const ctx = getUserSessionContext();
  if (!ctx) return withRosterStores(base);

  if (
    perspective === "brand" &&
    countAuthorizedBrands(ctx.storeAccess) > 1 &&
    chainOrg
  ) {
    return withRosterStores(
      buildBrandPerspectiveMultiBrandScopeOptions(
        chainOrg,
        ctx.storeAccess,
        readScopeFilters(),
      ),
    );
  }

  return withRosterStores(filterScopeOptionsForAccess(ctx.storeAccess, base.brands, base.regions, base.stores));
}

/** 业务页统一数据范围（集团 / 视角 / 品牌·门店 ID） */
export interface EffectiveScope {
  groupId: string | null;
  perspective: ChainDataPerspective;
  brandIds: string[];
  storeIds: string[];
  regionName: string;
  isAggregated: boolean;
  filters: ScopeFilterState;
}

function normalizeScopeFilters(raw: ScopeFilterState): ScopeFilterState {
  return {
    brand: raw.brand ? migrateLegacyBrandId(raw.brand) : "",
    region: raw.region ? migrateLegacyRegionId(raw.region) : "",
    store: raw.store ? migrateLegacyStoreId(raw.store) : "",
  };
}

function collectIdsFromChainSnapshot(snapshot: ChainBrandOrgSnapshot): {
  brandIds: string[];
  storeIds: string[];
} {
  return {
    brandIds: snapshot.brands.map((b) => b.merchantId),
    storeIds: snapshot.brands.flatMap((b) => b.stores.map((s) => s.storeId)),
  };
}

function findStoreInChainSnapshot(
  snapshot: ChainBrandOrgSnapshot,
  storeId: string,
): { brand: ChainBrandView; store: ChainStoreView } | null {
  for (const brand of snapshot.brands) {
    const store = brand.stores.find((s) => s.storeId === storeId);
    if (store) return { brand, store };
  }
  return null;
}

function restrictBrandsToStores(
  snapshot: ChainBrandOrgSnapshot,
  brandIds: string[],
  storeIds: string[],
): string[] {
  const storeSet = new Set(storeIds);
  return brandIds.filter((bid) =>
    snapshot.brands.some((b) => b.merchantId === bid && b.stores.some((s) => storeSet.has(s.storeId))),
  );
}

/** 解析当前有效数据范围（供业务页过滤与聚合） */
export function resolveEffectiveScope(): EffectiveScope {
  const perspective = resolveChainDataPerspective();
  const filters = normalizeScopeFilters(readScopeFilters());
  const chainCtx = resolveChainBrandContext();
  const groupId = chainCtx?.groupId ?? null;
  const snapshot = loadChainBrandOrgForContext();

  let brandIds: string[] = [];
  let storeIds: string[] = [];

  if (snapshot) {
    ({ brandIds, storeIds } = collectIdsFromChainSnapshot(snapshot));
  } else if (!isChainScopeMode()) {
    const storeId = filters.store || getLayoutContextStoreId();
    storeIds = [storeId];
    const meta = getMPlatformStoreScopeMeta(storeId);
    if (meta?.brand) brandIds = [meta.brand];
  }

  if (perspective === "brand") {
    const anchorBrand =
      resolveDefaultAnchorBrandId() || filters.brand || chainCtx?.anchorMerchantId || brandIds[0] || "";
    if (anchorBrand) {
      brandIds = brandIds.filter((id) => id === anchorBrand);
      if (snapshot) {
        storeIds = storeIds.filter((sid) => findStoreInChainSnapshot(snapshot, sid)?.brand.merchantId === anchorBrand);
      }
    }
  } else if (perspective === "store") {
    const storeId =
      filters.store || readChainAnchorStoreId() || getLayoutContextStoreId() || DEFAULT_LOCKED_STORE_ID;
    storeIds = storeIds.filter((id) => id === storeId);
    if (snapshot) {
      const hit = findStoreInChainSnapshot(snapshot, storeId);
      brandIds = hit ? [hit.brand.merchantId] : brandIds;
    } else {
      const meta = getMPlatformStoreScopeMeta(storeId);
      if (meta?.brand) brandIds = [meta.brand];
    }
  }

  if (filters.brand && perspective === "group-hq") {
    brandIds = brandIds.filter((id) => id === filters.brand);
    if (snapshot) {
      storeIds = storeIds.filter(
        (sid) => findStoreInChainSnapshot(snapshot, sid)?.brand.merchantId === filters.brand,
      );
    }
  }
  if (filters.region) {
    if (snapshot) {
      storeIds = storeIds.filter((sid) => findStoreInChainSnapshot(snapshot, sid)?.store.regionName === filters.region);
      brandIds = restrictBrandsToStores(snapshot, brandIds, storeIds);
    }
  }
  if (filters.store && perspective !== "store") {
    storeIds = storeIds.filter((id) => id === filters.store);
    if (snapshot) {
      const hit = findStoreInChainSnapshot(snapshot, filters.store);
      if (hit) brandIds = [hit.brand.merchantId];
    }
  }

  const sessionCtx = getUserSessionContext();
  if (sessionCtx) {
    const allowed = new Set(getAllowedStoreIds(sessionCtx.storeAccess));
    storeIds = storeIds.filter((id) => allowed.has(id));
    if (snapshot) {
      brandIds = restrictBrandsToStores(snapshot, brandIds, storeIds);
    }
  }

  const isAggregated = storeIds.length > 1;

  return {
    groupId,
    perspective,
    brandIds,
    storeIds,
    regionName: filters.region,
    isAggregated,
    filters,
  };
}

/** 按有效范围裁剪连锁品牌组织快照 */
export function filterChainBrandSnapshotByEffectiveScope(
  snapshot: ChainBrandOrgSnapshot,
  scope: EffectiveScope = resolveEffectiveScope(),
): ChainBrandOrgSnapshot {
  const brandIdSet = new Set(scope.brandIds);
  const storeIdSet = new Set(scope.storeIds);
  const hasBrandFilter = scope.brandIds.length > 0;
  const hasStoreFilter = scope.storeIds.length > 0;

  const brands = snapshot.brands
    .filter((b) => !hasBrandFilter || brandIdSet.has(b.merchantId))
    .map((b) => ({
      ...b,
      stores: b.stores.filter((s) => {
        if (hasStoreFilter && !storeIdSet.has(s.storeId)) return false;
        if (scope.regionName && s.regionName !== scope.regionName) return false;
        return true;
      }),
    }))
    .filter((b) => b.stores.length > 0 || (!hasStoreFilter && (!hasBrandFilter || brandIdSet.has(b.merchantId))));

  return { ...snapshot, brands };
}

/** 监听顶栏 scope / 视角 / 集团切换并回调刷新 */
export function bindEffectiveScopeChangeListener(onRefresh: () => void): void {
  if (typeof window === "undefined") return;
  const win = window as Window & { __menusifuEffectiveScopeBound?: boolean };
  if (win.__menusifuEffectiveScopeBound) return;
  win.__menusifuEffectiveScopeBound = true;
  const refresh = () => onRefresh();
  window.addEventListener("menusifu:scope-filter-change", refresh);
  window.addEventListener("menusifu:scope-perspective-change", refresh);
  window.addEventListener("menusifu:merchant-group-change", refresh);
}

export function isStoreTierHiddenNavModule(moduleId: string): boolean {
  if (getAccountOrgTier() !== "store") return false;
  /** 连锁版 + 集团总部视角：单店演示账号可浏览品牌管理 */
  if (readSidebarNavLayoutPreset() === "chain" && moduleId === "brand-mgmt") {
    return !isGroupHqDataPerspective();
  }
  return STORE_TIER_HIDDEN_NAV_MODULE_IDS.includes(moduleId);
}

/** 品牌多门店视角下隐藏的侧栏模块 */
export function isBrandPerspectiveHiddenNavModule(moduleId: string): boolean {
  if (!isChainScopeMode() || !isBrandDataPerspective()) return false;
  return BRAND_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS.includes(moduleId);
}

/** 仅品牌多门店视角展示的侧栏模块 */
export function isBrandPerspectiveOnlyNavModule(moduleId: string): boolean {
  return BRAND_PERSPECTIVE_ONLY_NAV_MODULE_IDS.includes(moduleId);
}

/** 仅集团总部视角展示的侧栏模块 */
export function isGroupHqPerspectiveOnlyNavModule(moduleId: string): boolean {
  return GROUP_HQ_PERSPECTIVE_ONLY_NAV_MODULE_IDS.includes(moduleId);
}

/** 门店数据视角下隐藏的侧栏模块（连锁版布局内） */
export function isStorePerspectiveHiddenNavModule(moduleId: string): boolean {
  if (!isChainScopeMode() || !isStoreDataPerspective()) return false;
  return STORE_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS.includes(moduleId);
}

/** 当前视角下是否应隐藏该一级导航模块 */
export function isPerspectiveHiddenNavModule(moduleId: string): boolean {
  return (
    isStoreTierHiddenNavModule(moduleId) ||
    isBrandPerspectiveHiddenNavModule(moduleId) ||
    isStorePerspectiveHiddenNavModule(moduleId)
  );
}

export function formatScopeFilterLabel(
  state: ScopeFilterState = readScopeFilters(),
  locale: "zh" | "en" = "zh",
): string {
  const find = (opts: ScopeOption[], value: string) => opts.find((o) => o.value === value);
  const scoped = getScopedFilterOptions();

  if (isStoreScopeLocked()) {
    const store = find(scoped.stores, state.store || DEFAULT_LOCKED_STORE_ID);
    const storeLabel = scopeOptionLabel(store, locale) || (locale === "en" ? "Current store" : "当前门店");
    if (isStoreDataPerspective() && isChainScopeMode()) {
      return storeLabel;
    }
    return storeLabel;
  }

  if (isBrandDataPerspective()) {
    const brandId = resolveDefaultAnchorBrandId() ?? state.brand;
    const brand = find(scoped.brands, brandId);
    const parts: string[] = [];
    if (brand) parts.push(scopeOptionLabel(brand, locale));
    const region = find(scoped.regions, state.region);
    const storeId = state.store || resolveDefaultSingleStoreId();
    const store = find(scoped.stores, storeId);
    if (state.region && region) parts.push(scopeOptionLabel(region, locale));
    if (store) parts.push(scopeOptionLabel(store, locale));
    if (parts.length === 0) {
      return brand
        ? scopeOptionLabel(brand, locale)
        : locale === "en"
          ? "Brand"
          : "当前品牌";
    }
    return parts.join(locale === "en" ? " · " : " · ");
  }

  const parts: string[] = [];
  const brand = find(scoped.brands, state.brand);
  const region = find(scoped.regions, state.region);
  const storeId = state.store || resolveDefaultSingleStoreId();
  const store = find(scoped.stores, storeId);

  if (state.brand && brand) parts.push(scopeOptionLabel(brand, locale));
  if (state.region && region) parts.push(scopeOptionLabel(region, locale));
  if (store) parts.push(scopeOptionLabel(store, locale));

  if (parts.length === 0) {
    return locale === "en" ? "All brands · All regions" : "全部品牌 · 全部区域";
  }
  return parts.join(locale === "en" ? " · " : " · ");
}

export function defaultLayoutPresetForOrgTier(tier: AccountOrgTier): SidebarNavLayoutPreset {
  return tier === "chain" ? "chain" : "store";
}

export type { StaffLoginAccount };
