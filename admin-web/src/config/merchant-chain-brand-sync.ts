/**
 * M 平台 → 商家后台 · 连锁品牌组织同步
 */
import { readActiveImpersonation } from "./enterprise-merchant-impersonate";
import { getEnterpriseMerchantSnapshot } from "./enterprise-merchant-store";
import type {
  EnterpriseMerchant,
  EnterpriseMerchantSnapshot,
  MerchantOrgStore,
  MerchantOrgStoreStatus,
  MerchantOrgType,
  MerchantStatus,
} from "./enterprise-merchant-types";
import { getAuthenticatedEmail } from "../auth/login";
import { getStaffLoginAccountByEmail } from "../permissions/staff-account-store";
import { readSidebarNavLayoutPreset } from "./sidebar-nav-order";
import { isMPlatformShellMode } from "../shell/app-shell-mode";

const STORAGE_PREFIX = "menusifu:chain-brand-org-sync-v1:";

/** 连锁版布局演示：默认展示 M 平台张记餐饮集团数据 */
export const DEMO_CHAIN_BRAND_GROUP_ID = "group-zhangji-holdings";
export const DEMO_CHAIN_BRAND_ANCHOR_MERCHANT_ID = "merchant-zhangji";

/** 商家后台当前选中的集团（顶栏左侧切换） */
export const ACTIVE_MERCHANT_GROUP_KEY = "menusifu:merchant-active-group-v1";

export interface MerchantGroupOption {
  groupId: string;
  name: string;
  code: string;
}

function merchantOrgTypeLabel(orgType: MerchantOrgType): string {
  return orgType === "chain" ? "连锁" : "单店";
}

function merchantStatusLabel(status: MerchantStatus): string {
  const map: Record<MerchantStatus, string> = {
    draft: "草稿",
    onboarding: "待引导",
    active: "在营",
    suspended: "已暂停",
    closing: "关闭中",
    closed: "已关闭",
  };
  return map[status] ?? status;
}

function storeStatusLabel(status: MerchantOrgStoreStatus): string {
  const map: Record<MerchantOrgStoreStatus, string> = {
    preparing: "筹备中",
    open: "营业中",
    closed: "已打烊",
    archived: "已归档",
  };
  return map[status] ?? status;
}

export interface ChainStoreView {
  storeId: string;
  name: string;
  code: string;
  status: MerchantOrgStoreStatus;
  address?: string;
  regionName?: string;
  orgBrandName?: string;
  /** 挂载在连锁总部组织树下时，展示归属连锁品牌名 */
  hostedUnderChainName?: string;
}

export interface ChainBrandView {
  merchantId: string;
  bid?: string;
  name: string;
  code: string;
  orgType: MerchantOrgType;
  orgTypeLabel: string;
  status: MerchantStatus;
  statusLabel: string;
  stores: ChainStoreView[];
}

export interface ChainBrandOrgSnapshot {
  groupId: string;
  groupName: string;
  groupCode: string;
  groupDescription?: string;
  enterpriseId: string;
  syncedAt: string;
  source: "m-platform";
  brands: ChainBrandView[];
}

export interface ChainBrandContext {
  groupId: string;
  anchorMerchantId: string;
  anchorMerchantName: string;
  /** 顶栏切换为连锁版时的 M 平台演示数据流转 */
  demoFlow?: boolean;
}

function isChainLayoutDemoMode(): boolean {
  return !isMPlatformShellMode() && readSidebarNavLayoutPreset() === "chain";
}

function storageKey(groupId: string): string {
  return `${STORAGE_PREFIX}${groupId}`;
}

function enrichStoreView(
  snap: EnterpriseMerchantSnapshot,
  store: MerchantOrgStore,
  merchant: EnterpriseMerchant,
): ChainStoreView {
  const region = snap.regions.find((r) => r.regionId === store.regionId);
  const orgBrand = snap.brands.find((b) => b.brandId === store.brandId);
  const hostMerchant = snap.merchants.find((m) => m.merchantId === store.merchantId);
  return {
    storeId: store.storeId,
    name: store.name,
    code: store.code,
    status: store.status,
    address: store.address ?? merchant.address,
    regionName: region?.name,
    orgBrandName: orgBrand?.name,
    hostedUnderChainName:
      store.merchantId !== merchant.merchantId && hostMerchant?.orgType === "chain"
        ? hostMerchant.name
        : undefined,
  };
}

function collectStoresForBrand(snap: EnterpriseMerchantSnapshot, merchant: EnterpriseMerchant): ChainStoreView[] {
  const seen = new Set<string>();
  const out: ChainStoreView[] = [];

  const pushStore = (store: MerchantOrgStore) => {
    if (seen.has(store.storeId)) return;
    seen.add(store.storeId);
    out.push(enrichStoreView(snap, store, merchant));
  };

  for (const store of snap.stores) {
    if (store.linkedMerchantId === merchant.merchantId) {
      pushStore(store);
    }
  }

  if (merchant.orgType === "chain") {
    for (const store of snap.stores) {
      if (store.merchantId === merchant.merchantId) {
        pushStore(store);
      }
    }
  }

  return out.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function buildChainBrandOrgSnapshot(groupId: string): ChainBrandOrgSnapshot | null {
  const snap = getEnterpriseMerchantSnapshot();
  const group = snap.groups.find((g) => g.groupId === groupId);
  if (!group) return null;

  const brands = snap.merchants
    .filter((m) => m.groupId === groupId)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
    .map((m) => ({
      merchantId: m.merchantId,
      bid: m.bid,
      name: m.name,
      code: m.code,
      orgType: m.orgType,
      orgTypeLabel: merchantOrgTypeLabel(m.orgType),
      status: m.status,
      statusLabel: merchantStatusLabel(m.status),
      stores: collectStoresForBrand(snap, m),
    }));

  return {
    groupId: group.groupId,
    groupName: group.name,
    groupCode: group.code,
    groupDescription: group.description,
    enterpriseId: group.enterpriseId,
    syncedAt: new Date().toISOString(),
    source: "m-platform",
    brands,
  };
}

export function writeChainBrandOrgSnapshot(snapshot: ChainBrandOrgSnapshot): void {
  try {
    localStorage.setItem(storageKey(snapshot.groupId), JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function readChainBrandOrgSnapshot(groupId: string): ChainBrandOrgSnapshot | null {
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return null;
    return JSON.parse(raw) as ChainBrandOrgSnapshot;
  } catch {
    return null;
  }
}

/** 将指定集团的主数据同步到商家后台存储 */
export function syncChainBrandOrgForGroup(groupId: string): ChainBrandOrgSnapshot | null {
  const built = buildChainBrandOrgSnapshot(groupId);
  if (!built) return null;
  writeChainBrandOrgSnapshot(built);
  return built;
}

/** 按入驻品牌所属集团同步（M 平台写操作后调用） */
export function syncChainBrandOrgForMerchant(merchantId: string): ChainBrandOrgSnapshot | null {
  const snap = getEnterpriseMerchantSnapshot();
  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (!merchant?.groupId) return null;
  return syncChainBrandOrgForGroup(merchant.groupId);
}

/** 同步当前企业下全部集团 */
export function syncAllChainBrandOrgsForEnterprise(enterpriseId: string): void {
  const snap = getEnterpriseMerchantSnapshot();
  const groupIds = new Set(
    snap.groups.filter((g) => g.enterpriseId === enterpriseId && g.status === "active").map((g) => g.groupId),
  );
  for (const groupId of groupIds) {
    syncChainBrandOrgForGroup(groupId);
  }
}

export function findMerchantByAdminEmail(email: string): EnterpriseMerchant | undefined {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return undefined;
  return getEnterpriseMerchantSnapshot().merchants.find(
    (m) => m.primaryAdminEmail?.trim().toLowerCase() === normalized,
  );
}

function resolveGroupBrandContext(
  groupId: string,
  anchorMerchantId?: string,
): ChainBrandContext | null {
  const snap = getEnterpriseMerchantSnapshot();
  const group = snap.groups.find((g) => g.groupId === groupId);
  if (!group) return null;

  const anchor =
    (anchorMerchantId ? snap.merchants.find((m) => m.merchantId === anchorMerchantId) : undefined) ??
    snap.merchants.find((m) => m.groupId === groupId && m.orgType === "chain") ??
    snap.merchants.find((m) => m.groupId === groupId);
  if (!anchor) return null;

  return {
    groupId,
    anchorMerchantId: anchor.merchantId,
    anchorMerchantName: anchor.name,
  };
}

/** 列出 M 平台同步到本地的全部在营集团 */
export function listMPlatformGroupsForMerchantBackend(): MerchantGroupOption[] {
  const snap = getEnterpriseMerchantSnapshot();
  return snap.groups
    .filter((g) => g.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
    .map((g) => ({ groupId: g.groupId, name: g.name, code: g.code }));
}

export function readActiveMerchantGroupId(): string | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_MERCHANT_GROUP_KEY);
    if (!raw) return null;
    if (listMPlatformGroupsForMerchantBackend().some((g) => g.groupId === raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function clearActiveMerchantGroupOverride(): void {
  try {
    sessionStorage.removeItem(ACTIVE_MERCHANT_GROUP_KEY);
  } catch {
    /* ignore */
  }
}

/** 切换当前集团：同步 M 平台主数据并通知顶栏 scope 刷新 */
export function writeActiveMerchantGroupId(groupId: string): void {
  if (!listMPlatformGroupsForMerchantBackend().some((g) => g.groupId === groupId)) return;
  try {
    sessionStorage.setItem(ACTIVE_MERCHANT_GROUP_KEY, groupId);
  } catch {
    /* ignore */
  }
  syncChainBrandOrgForGroup(groupId);
  window.dispatchEvent(
    new CustomEvent("menusifu:merchant-group-change", {
      detail: { groupId },
    }),
  );
}

export function syncAllActiveMPlatformGroups(): void {
  for (const group of listMPlatformGroupsForMerchantBackend()) {
    syncChainBrandOrgForGroup(group.groupId);
  }
}

function resolveChainBrandContextFromSession(): ChainBrandContext | null {
  const email = getAuthenticatedEmail();
  if (email) {
    const account = getStaffLoginAccountByEmail(email);
    if (account?.groupId) {
      const fromAccount = resolveGroupBrandContext(account.groupId, account.anchorMerchantId);
      if (fromAccount) return fromAccount;
    }

    const merchant = findMerchantByAdminEmail(email);
    if (merchant?.groupId) {
      return resolveGroupBrandContext(merchant.groupId, merchant.merchantId);
    }

    if (account?.orgTier === "chain" && account.employeeId) {
      const snap = getEnterpriseMerchantSnapshot();
      const chainMerchant = snap.merchants.find(
        (m) => m.orgType === "chain" && m.primaryAdminEmail?.trim().toLowerCase() === email.trim().toLowerCase(),
      );
      if (chainMerchant?.groupId) {
        return resolveGroupBrandContext(chainMerchant.groupId, chainMerchant.merchantId);
      }
    }
  }

  if (isChainLayoutDemoMode()) {
    const demo = resolveGroupBrandContext(DEMO_CHAIN_BRAND_GROUP_ID, DEMO_CHAIN_BRAND_ANCHOR_MERCHANT_ID);
    if (demo) {
      return {
        ...demo,
        anchorMerchantName: "连锁版演示",
        demoFlow: true,
      };
    }
  }

  return null;
}

/** 解析商家后台当前应展示的集团上下文（代登录 / 顶栏切换 / 集团账号 / 连锁版演示） */
export function resolveChainBrandContext(): ChainBrandContext | null {
  const impersonation = readActiveImpersonation();
  if (impersonation) {
    const merchant = getEnterpriseMerchantSnapshot().merchants.find((m) => m.merchantId === impersonation.merchantId);
    if (merchant?.groupId) {
      return resolveGroupBrandContext(merchant.groupId, merchant.merchantId);
    }
  }

  const overrideGroupId = readActiveMerchantGroupId();
  if (overrideGroupId) {
    const fromOverride = resolveGroupBrandContext(overrideGroupId);
    if (fromOverride) return fromOverride;
  }

  return resolveChainBrandContextFromSession();
}

export function loadChainBrandOrgForContext(): ChainBrandOrgSnapshot | null {
  const ctx = resolveChainBrandContext();
  if (!ctx) return null;
  if (ctx.demoFlow) {
    return syncChainBrandOrgForGroup(ctx.groupId);
  }
  const cached = readChainBrandOrgSnapshot(ctx.groupId);
  if (cached) return cached;
  return syncChainBrandOrgForGroup(ctx.groupId);
}

export function formatChainStoreStatusLabel(status: MerchantOrgStoreStatus): string {
  return storeStatusLabel(status);
}

export function bindChainBrandOrgSyncListener(): void {
  if (typeof window === "undefined") return;
  const win = window as Window & { __menusifuChainBrandSyncBound?: boolean };
  if (win.__menusifuChainBrandSyncBound) return;
  win.__menusifuChainBrandSyncBound = true;
  window.addEventListener("menusifu:chain-brand-org-changed", (event) => {
    const groupId = (event as CustomEvent<{ groupId?: string }>).detail?.groupId;
    if (groupId) syncChainBrandOrgForGroup(groupId);
  });
}
