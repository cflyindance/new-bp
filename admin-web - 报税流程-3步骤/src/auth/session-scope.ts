/**
 * 登录会话的数据范围（品牌 / 区域 / 门店）与组织层级（单店 / 连锁）。
 */
import { getAuthenticatedEmail } from "./login";
import { getStaffLoginAccountByEmail, type StaffLoginAccount } from "../permissions/staff-account-store";
import { getRbacSnapshot } from "../permissions/rbac-store";
import {
  applyDefaultLayoutPresetForOrgTier,
  readSidebarNavLayoutPreset,
  type SidebarNavLayoutPreset,
} from "../config/sidebar-nav-order";

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

/** 单店账号默认锁定的演示门店 */
export const DEFAULT_LOCKED_STORE_ID = "shanghai-ljz";

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

export const DEMO_SCOPE_STORES: ScopeOption[] = [
  { value: "", labelZh: "全部门店", labelEn: "All stores" },
  { value: "flagship-nyc", labelZh: "旗舰店 · NYC", labelEn: "Flagship · NYC" },
  { value: "branch-la", labelZh: "分店 · LA", labelEn: "Branch · LA" },
  { value: "shanghai-ljz", labelZh: "上海陆家嘴店", labelEn: "Shanghai Lujiazui" },
  { value: "guangzhou-tzh", labelZh: "广州天河店", labelEn: "Guangzhou Tianhe" },
];

/** 单店组织层级下侧栏默认隐藏的连锁向一级模块 */
export const STORE_TIER_HIDDEN_NAV_MODULE_IDS: readonly string[] = [
  "brand-mgmt",
  "permission-mgmt",
  "asset-center",
  "log-management",
  "capital-turnover",
];

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
  try {
    sessionStorage.setItem(SCOPE_FILTER_STORAGE_KEYS.brand, state.brand);
    sessionStorage.setItem(SCOPE_FILTER_STORAGE_KEYS.region, state.region);
    sessionStorage.setItem(SCOPE_FILTER_STORAGE_KEYS.store, state.store);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent("menusifu:scope-filter-change", {
      detail: { ...state },
    }),
  );
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

export function shouldShowBrandScopeFilter(): boolean {
  return isChainScopeMode();
}

export function shouldShowRegionScopeFilter(): boolean {
  return isChainScopeMode();
}

export function isStoreScopeLocked(): boolean {
  return !isChainScopeMode();
}

/** 门店版布局 + 单店账号：锁定为当前门店 */
export function ensureScopeFiltersForSession(): void {
  if (isChainScopeMode()) return;
  const cur = readScopeFilters();
  if (cur.store === DEFAULT_LOCKED_STORE_ID && !cur.brand && !cur.region) return;
  writeScopeFilters({ brand: "", region: "", store: DEFAULT_LOCKED_STORE_ID });
}

/** 切换门店版/连锁版布局时同步顶栏 scope */
export function ensureScopeFiltersForLayoutPreset(preset: SidebarNavLayoutPreset): void {
  if (preset === "chain") {
    if (getAccountOrgTier() !== "store") return;
    const cur = readScopeFilters();
    if (cur.brand || cur.region) return;
    if (cur.store === DEFAULT_LOCKED_STORE_ID) {
      writeScopeFilters({ brand: "", region: "", store: "" });
    }
    return;
  }
  ensureScopeFiltersForSession();
}

export function ensureScopeFiltersForOrgTier(tier: AccountOrgTier = getAccountOrgTier()): void {
  if (tier === "chain") return;
  ensureScopeFiltersForSession();
}

export function syncSessionForAuthenticatedUser(): void {
  applyDefaultLayoutPresetForOrgTier(getAccountOrgTier());
  ensureScopeFiltersForSession();
}

export function isStoreTierHiddenNavModule(moduleId: string): boolean {
  if (getAccountOrgTier() !== "store") return false;
  /** 连锁版布局：单店账号亦展示品牌管理（连锁视角导航） */
  if (readSidebarNavLayoutPreset() === "chain" && moduleId === "brand-mgmt") return false;
  return STORE_TIER_HIDDEN_NAV_MODULE_IDS.includes(moduleId);
}

export function formatScopeFilterLabel(
  state: ScopeFilterState = readScopeFilters(),
  locale: "zh" | "en" = "zh",
): string {
  const find = (opts: ScopeOption[], value: string) => opts.find((o) => o.value === value);

  if (isStoreScopeLocked()) {
    const store = find(DEMO_SCOPE_STORES, state.store || DEFAULT_LOCKED_STORE_ID);
    return scopeOptionLabel(store, locale) || (locale === "en" ? "Current store" : "当前门店");
  }

  const parts: string[] = [];
  const brand = find(DEMO_SCOPE_BRANDS, state.brand);
  const region = find(DEMO_SCOPE_REGIONS, state.region);
  const store = find(DEMO_SCOPE_STORES, state.store);

  if (state.brand && brand) parts.push(scopeOptionLabel(brand, locale));
  if (state.region && region) parts.push(scopeOptionLabel(region, locale));
  if (state.store && store) parts.push(scopeOptionLabel(store, locale));

  if (parts.length === 0) {
    return locale === "en" ? "All brands · All regions · All stores" : "全部品牌 · 全部区域 · 全部门店";
  }
  return parts.join(locale === "en" ? " · " : " · ");
}

export function defaultLayoutPresetForOrgTier(tier: AccountOrgTier): SidebarNavLayoutPreset {
  return tier === "chain" ? "chain" : "store";
}

export type { StaffLoginAccount };
