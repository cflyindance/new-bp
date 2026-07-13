/**
 * M 平台 · 入驻品牌 · 演示数据与查询
 */
import { PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES } from "./platform-preset-catalog";
import { FOH_LINE_NAV_ORDER, fohLineNavLabel } from "./foh-settings-line-scope";
import type { ProductLineId } from "./platform-preset-catalog";
import {
  seedMerchantPresetsFromEnterprise,
  syncEnterprisePresetsToMerchant,
  type EnterpriseToMerchantSyncResult,
} from "./platform-preset-enterprise-sync";
import { markPlatformPresetOnboardingComplete } from "./platform-preset-onboarding";
import {
  migrateLegacyMerchantServices,
  serviceSelectionsToSubscriptions,
} from "./enterprise-merchant-services";
import { formatBid, generateNextBid, generateNextMid, isMidFormat, migrateLegacyStoreIdToMid, normalizeBid } from "./enterprise-merchant-bid";
import {
  type CreateMerchantInput,
  type EnterpriseGroup,
  type CreateGroupInput,
  type UpdateGroupInput,
  type GroupFilter,
  type EnterpriseMerchant,
  type EnterpriseMerchantSnapshot,
  type MerchantCapabilitySnapshot,
  type MerchantChangeLogEntry,
  type MerchantFilter,
  type MerchantOrgBrand,
  type MerchantOrgRegion,
  type MerchantOrgStore,
  type MerchantOrgStoreStatus,
  type MerchantStatus,
  type MerchantImpersonationLog,
  type MerchantProvisioningRequest,
  type PosStoreProvisioningRequest,
  type MerchantReportSummary,
  type MerchantSlaMetrics,
  type MerchantTodoItem,
  type MountMerchantStoreInput,
  type RenewMerchantContractInput,
  type SubmitPosStoreRequestInput,
  type SubmitProvisioningRequestInput,
  type UpdateMerchantCapabilityInput,
  type CrmContractStatus,
  type MerchantLicenseStatus,
  type MerchantOrgType,
  type EnterpriseTenant,
  type EnterpriseStoreListFilter,
  type EnterpriseStoreListRow,
} from "./enterprise-merchant-types";
import {
  DEFAULT_ENTERPRISE_ID,
  DEMO_ENTERPRISES,
  readActiveEnterpriseId,
} from "./enterprise-merchant-enterprise-context";

const SNAPSHOT_CHANGED_EVENT = "menusifu:enterprise-merchant-snapshot-changed";

let cachedSnapshot: EnterpriseMerchantSnapshot | null = null;
let snapshotReadDepth = 0;
const deferredChainBrandOrgSyncGroupIds = new Set<string>();

function notifyChainBrandOrgSync(groupId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("menusifu:chain-brand-org-changed", {
      detail: { groupId },
    }),
  );
}

function deferChainBrandOrgSync(groupId: string): void {
  deferredChainBrandOrgSyncGroupIds.add(groupId);
}

function flushDeferredChainBrandOrgSyncs(): void {
  if (typeof window === "undefined" || deferredChainBrandOrgSyncGroupIds.size === 0) return;
  const groupIds = [...deferredChainBrandOrgSyncGroupIds];
  deferredChainBrandOrgSyncGroupIds.clear();
  queueMicrotask(() => {
    for (const groupId of groupIds) notifyChainBrandOrgSync(groupId);
  });
}

function notifyChainBrandOrgSyncForMerchant(merchantId: string): void {
  const merchant = cachedSnapshot?.merchants.find((m) => m.merchantId === merchantId)
    ?? readSnapshot().merchants.find((m) => m.merchantId === merchantId);
  if (merchant?.groupId) notifyChainBrandOrgSync(merchant.groupId);
}

const STORAGE_KEY = "menusifu:enterprise-merchants-v1";
const DEMO_ENTERPRISE_ID = DEFAULT_ENTERPRISE_ID;
const NA_ENTERPRISE_ID = "enterprise-na-partner";
const DEMO_OPERATOR = "hq.admin@menusifu.cn";
const CLOSING_COOLDOWN_DAYS = 30;

/** 米聚 Enterprise 默认集团 */
export const DEFAULT_MIJU_GROUP_ID = "group-miju-holdings";

function nowIso(): string {
  return new Date().toISOString();
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugCode(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 24);
}

function activeEnterpriseId(): string {
  return readActiveEnterpriseId();
}

function resolveGroupEnterpriseId(enterpriseId?: string): string {
  return enterpriseId ?? activeEnterpriseId();
}

function buildMijuDefaultGroup(): EnterpriseGroup {
  const t = "2025-08-01T00:00:00.000Z";
  return {
    groupId: DEFAULT_MIJU_GROUP_ID,
    enterpriseId: DEMO_ENTERPRISE_ID,
    name: "米聚集团",
    code: "miju-holdings",
    description: "米聚餐饮集团默认组织",
    status: "active",
    createdAt: t,
    updatedAt: nowIso(),
  };
}

function buildSeedGroups(): EnterpriseGroup[] {
  const t = "2025-08-01T00:00:00.000Z";
  const miju = DEMO_ENTERPRISE_ID;
  return [
    buildMijuDefaultGroup(),
    {
      groupId: "group-zhangji-holdings",
      enterpriseId: miju,
      name: "张记餐饮集团",
      code: "zhangji-holdings",
      description: "张记火锅及旗下门店品牌",
      status: "active",
      createdAt: t,
      updatedAt: nowIso(),
    },
    {
      groupId: "group-tea-holdings",
      enterpriseId: miju,
      name: "茶语集团",
      code: "tea-holdings",
      description: "茶饮连锁品牌组合",
      status: "active",
      createdAt: t,
      updatedAt: nowIso(),
    },
    {
      groupId: "group-menusifu-cn",
      enterpriseId: miju,
      name: "MenuSifu 中国演示集团",
      code: "menusifu-cn-demo",
      description: "国内演示与到期场景品牌",
      status: "active",
      createdAt: t,
      updatedAt: nowIso(),
    },
    {
      groupId: "group-sakura-holdings",
      enterpriseId: NA_ENTERPRISE_ID,
      name: "Sakura Holdings",
      code: "sakura-holdings",
      description: "北美日料连锁",
      status: "active",
      createdAt: t,
      updatedAt: nowIso(),
    },
    {
      groupId: "group-burger-holdings",
      enterpriseId: NA_ENTERPRISE_ID,
      name: "Burger Co. Holdings",
      code: "burger-holdings",
      status: "active",
      createdAt: t,
      updatedAt: nowIso(),
    },
  ];
}

function ensureMijuDefaultGroup(snapshot: EnterpriseMerchantSnapshot): boolean {
  const existing = snapshot.groups.find((g) => g.groupId === DEFAULT_MIJU_GROUP_ID);
  if (existing) {
    if (existing.enterpriseId !== DEMO_ENTERPRISE_ID) {
      existing.enterpriseId = DEMO_ENTERPRISE_ID;
      existing.updatedAt = nowIso();
      return true;
    }
    return false;
  }
  snapshot.groups.unshift(buildMijuDefaultGroup());
  return true;
}

const BRANDS_PER_GROUP = 5;

type GroupBrandFillerSpec = {
  merchantId: string;
  name: string;
  code: string;
  orgType?: MerchantOrgType;
};

/** 各集团种子品牌（与已有 curated 品牌合并后凑满 BRANDS_PER_GROUP） */
const GROUP_BRAND_FILLERS: Record<string, GroupBrandFillerSpec[]> = {
  [DEFAULT_MIJU_GROUP_ID]: [
    { merchantId: "merchant-miju-select", name: "米聚甄选", code: "miju-select", orgType: "chain" },
    { merchantId: "merchant-miju-bistro", name: "米聚小馆", code: "miju-bistro", orgType: "single-store" },
    { merchantId: "merchant-miju-tea", name: "米聚茶语", code: "miju-tea", orgType: "single-store" },
    { merchantId: "merchant-miju-express", name: "米聚快餐", code: "miju-express", orgType: "chain" },
    { merchantId: "merchant-miju-bakery", name: "米聚烘焙", code: "miju-bakery", orgType: "single-store" },
  ],
  "group-zhangji-holdings": [
    { merchantId: "merchant-zhangji-skewers", name: "张记串串", code: "zhangji-skewers", orgType: "chain" },
  ],
  "group-tea-holdings": [
    { merchantId: "merchant-tea-fresh", name: "茶语鲜果", code: "tea-fresh", orgType: "single-store" },
    { merchantId: "merchant-tea-light", name: "茶语轻食", code: "tea-light", orgType: "single-store" },
    { merchantId: "merchant-tea-coffee", name: "茶语咖啡", code: "tea-coffee", orgType: "single-store" },
    { merchantId: "merchant-tea-lab", name: "茶语工坊", code: "tea-lab", orgType: "chain" },
  ],
  "group-menusifu-cn": [
    { merchantId: "merchant-menusifu-cn-2", name: "米聚智餐", code: "menusifu-cn-2", orgType: "single-store" },
    { merchantId: "merchant-smart-kitchen", name: "智餐云厨", code: "smart-kitchen", orgType: "chain" },
  ],
  "group-sakura-holdings": [
    { merchantId: "merchant-sakura-ramen", name: "Sakura Ramen", code: "sakura-ramen", orgType: "chain" },
    { merchantId: "merchant-sakura-bento", name: "Sakura Bento", code: "sakura-bento", orgType: "single-store" },
    { merchantId: "merchant-sakura-izakaya", name: "Sakura Izakaya", code: "sakura-izakaya", orgType: "chain" },
    { merchantId: "merchant-sakura-express", name: "Sakura Express", code: "sakura-express", orgType: "single-store" },
  ],
  "group-burger-holdings": [
    { merchantId: "merchant-burger-east", name: "Burger Co. East", code: "burger-east", orgType: "chain" },
    { merchantId: "merchant-burger-south", name: "Burger Co. South", code: "burger-south", orgType: "chain" },
    { merchantId: "merchant-burger-downtown", name: "Burger Co. Downtown", code: "burger-downtown", orgType: "single-store" },
    { merchantId: "merchant-burger-airport", name: "Burger Co. Airport", code: "burger-airport", orgType: "single-store" },
  ],
};

function buildSyntheticMerchant(group: EnterpriseGroup, spec: GroupBrandFillerSpec): EnterpriseMerchant {
  const t = "2025-08-01T00:00:00.000Z";
  const isNa = group.enterpriseId === NA_ENTERPRISE_ID;
  return {
    merchantId: spec.merchantId,
    enterpriseId: group.enterpriseId,
    groupId: group.groupId,
    name: spec.name,
    code: spec.code,
    orgType: spec.orgType ?? (isNa ? "chain" : "single-store"),
    status: "active",
    timezone: isNa ? "America/New_York" : "Asia/Shanghai",
    locale: isNa ? "en-US" : "zh-CN",
    contactName: isNa ? "Demo Manager" : "品牌负责人",
    primaryAdminEmail: `${spec.code}@${isNa ? "menusifu.com" : "menusifu.cn"}`,
    contractExpiresAt: "2027-12-31",
    contractStatus: "active",
    licenseAutoSuspend: true,
    createdAt: t,
    updatedAt: nowIso(),
    activatedAt: t,
  };
}

function assignSeedMerchantBids(merchants: EnterpriseMerchant[]): number {
  let seq = 1;
  const used = new Set<string>();
  for (const m of merchants) {
    if (m.bid) used.add(normalizeBid(m.bid));
  }
  for (const m of merchants) {
    if (m.bid) {
      const n = parseInt(normalizeBid(m.bid).slice(1), 10);
      if (!Number.isNaN(n) && n >= seq) seq = n + 1;
      continue;
    }
    while (used.has(formatBid(seq))) seq++;
    m.bid = formatBid(seq);
    used.add(m.bid);
    seq++;
  }
  return seq;
}

function appendGroupBrandFillers(baseMerchants: EnterpriseMerchant[]): EnterpriseMerchant[] {
  const groups = buildSeedGroups();
  const result = [...baseMerchants];
  const knownIds = new Set(result.map((m) => m.merchantId));

  for (const group of groups) {
    const fillers = GROUP_BRAND_FILLERS[group.groupId] ?? [];
    for (const spec of fillers) {
      if (result.filter((m) => m.groupId === group.groupId).length >= BRANDS_PER_GROUP) break;
      if (knownIds.has(spec.merchantId)) continue;
      result.push(buildSyntheticMerchant(group, spec));
      knownIds.add(spec.merchantId);
    }
    let autoIdx = 1;
    while (result.filter((m) => m.groupId === group.groupId).length < BRANDS_PER_GROUP) {
      const code = `${group.code}-demo-${autoIdx}`;
      const spec: GroupBrandFillerSpec = {
        merchantId: `merchant-seed-${group.code}-${autoIdx}`,
        name: `${group.name.replace(/集团|Holdings/g, "").trim()}演示${autoIdx}`,
        code,
      };
      if (!knownIds.has(spec.merchantId)) {
        result.push(buildSyntheticMerchant(group, spec));
        knownIds.add(spec.merchantId);
      }
      autoIdx++;
    }
  }

  assignSeedMerchantBids(result);
  return result;
}

function buildSeedMerchants(): EnterpriseMerchant[] {
  return appendGroupBrandFillers(buildCuratedSeedMerchants());
}

function mergeSeedMerchants(snapshot: EnterpriseMerchantSnapshot): boolean {
  const seedMerchants = buildSeedMerchants();
  let changed = false;
  for (const seed of seedMerchants) {
    if (snapshot.merchants.some((m) => m.merchantId === seed.merchantId)) continue;
    snapshot.merchants.push({ ...seed, updatedAt: nowIso() });
    if (!snapshot.slaMetrics.some((s) => s.merchantId === seed.merchantId)) {
      snapshot.slaMetrics.push(buildDefaultSlaMetrics(seed.merchantId));
    }
    changed = true;
  }
  if (changed) {
    const nextSeq = assignSeedMerchantBids(snapshot.merchants);
    if ((snapshot.bidSeq ?? 0) < nextSeq) snapshot.bidSeq = nextSeq;
  }
  return changed;
}

function merchantIdsForEnterprise(snapshot: EnterpriseMerchantSnapshot, enterpriseId: string): Set<string> {
  return new Set(snapshot.merchants.filter((m) => m.enterpriseId === enterpriseId).map((m) => m.merchantId));
}

function computeLicenseStatus(merchant: EnterpriseMerchant): MerchantLicenseStatus {
  if (merchant.status === "suspended" && merchant.suspendedReason?.includes("License")) return "suspended";
  if (!merchant.contractExpiresAt) return "active";
  const exp = new Date(merchant.contractExpiresAt).getTime();
  const now = Date.now();
  if (exp < now) return "expired";
  if (exp <= now + 30 * 24 * 60 * 60 * 1000) return "expiring";
  return "active";
}

function enrichLicenseFields(snapshot: EnterpriseMerchantSnapshot): void {
  for (const merchant of snapshot.merchants) {
    merchant.licenseStatus = computeLicenseStatus(merchant);
    if (merchant.licenseAutoSuspend === undefined) merchant.licenseAutoSuspend = true;
  }
}

function processLicenseExpiry(snapshot: EnterpriseMerchantSnapshot): boolean {
  let changed = false;
  const now = Date.now();
  for (const merchant of snapshot.merchants) {
    merchant.licenseStatus = computeLicenseStatus(merchant);
    if (merchant.licenseAutoSuspend === false || !merchant.contractExpiresAt) continue;
    if (merchant.status !== "active") continue;
    const exp = new Date(merchant.contractExpiresAt).getTime();
    if (exp >= now) continue;
    merchant.status = "suspended";
    merchant.suspendedReason = "License / 合同到期自动暂停";
    merchant.licenseStatus = "suspended";
    merchant.updatedAt = nowIso();
    appendChangelog(snapshot, {
      enterpriseId: merchant.enterpriseId,
      merchantId: merchant.merchantId,
      action: "license.expired",
      operatorEmail: "system@menusifu.cn",
      detail: `合同已于 ${new Date(merchant.contractExpiresAt).toLocaleDateString("zh-CN")} 到期，系统自动暂停`,
    });
    changed = true;
  }
  return changed;
}

function buildDefaultSlaMetrics(merchantId: string, seed = merchantId.length): MerchantSlaMetrics {
  const base = 97 + (seed % 30) / 10;
  return {
    merchantId,
    uptimePct: Math.min(99.95, base),
    openTickets: seed % 5,
    p1Tickets: seed % 2,
    avgResponseMin: 12 + (seed % 20),
    monthOrders: 800 + seed * 137,
    lastIncidentAt: seed % 3 === 0 ? "2026-06-10T08:00:00.000Z" : undefined,
  };
}

function buildCuratedSeedMerchants(): EnterpriseMerchant[] {
  const t = "2025-08-01T00:00:00.000Z";
  const miju = DEMO_ENTERPRISE_ID;
  return [
    {
      merchantId: "merchant-zhangji",
      enterpriseId: miju,
      groupId: "group-zhangji-holdings",
      bid: "B00000001",
      name: "张记火锅",
      code: "zhangji-hotpot",
      orgType: "chain",
      status: "active",
      timezone: "Asia/Shanghai",
      locale: "zh-CN",
      contactName: "张经理",
      contactPhone: "13800001111",
      contractExpiresAt: "2027-12-31",
      crmContractId: "CRM-MJ-2025-001",
      crmAccountId: "ACC-ZHANGJI",
      contractStatus: "active",
      crmLastSyncedAt: "2026-06-01T00:00:00.000Z",
      licenseAutoSuspend: true,
      primaryAdminEmail: "zhangji.admin@menusifu.cn",
      createdAt: t,
      updatedAt: nowIso(),
      activatedAt: "2025-09-01T00:00:00.000Z",
    },
    {
      merchantId: "merchant-tea-one",
      enterpriseId: miju,
      groupId: "group-tea-holdings",
      bid: "B00000002",
      name: "茶语一家",
      code: "tea-one",
      orgType: "single-store",
      status: "active",
      timezone: "Asia/Shanghai",
      locale: "zh-CN",
      contactName: "李店长",
      contactPhone: "13900002222",
      contractExpiresAt: "2026-06-30",
      crmContractId: "CRM-MJ-2026-014",
      crmAccountId: "ACC-TEA-ONE",
      contractStatus: "renewal",
      crmLastSyncedAt: "2026-06-15T00:00:00.000Z",
      licenseAutoSuspend: true,
      primaryAdminEmail: "tea.one@menusifu.cn",
      address: "杭州市西湖区文三路",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: nowIso(),
      activatedAt: "2026-01-20T00:00:00.000Z",
    },
    {
      merchantId: "merchant-menusifu-na",
      enterpriseId: miju,
      groupId: "group-menusifu-cn",
      bid: "B00000003",
      name: "MenuSifu NA Demo",
      code: "menusifu-na-demo",
      orgType: "chain",
      status: "onboarding",
      timezone: "America/New_York",
      locale: "en-US",
      contactName: "Alex Chen",
      contactPhone: "+1-212-555-0100",
      contractExpiresAt: "2026-12-31",
      crmContractId: "CRM-MJ-2026-NA",
      crmAccountId: "ACC-NA-DEMO",
      contractStatus: "signed",
      licenseAutoSuspend: true,
      primaryAdminEmail: "na.demo@menusifu.cn",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: nowIso(),
    },
    {
      merchantId: "merchant-expired-demo",
      enterpriseId: miju,
      groupId: "group-menusifu-cn",
      bid: "B00000004",
      name: "湘味小厨（到期演示）",
      code: "xiangwei-expired",
      orgType: "single-store",
      status: "active",
      timezone: "Asia/Shanghai",
      locale: "zh-CN",
      contactName: "陈老板",
      contractExpiresAt: "2026-05-15",
      crmContractId: "CRM-MJ-2024-099",
      crmAccountId: "ACC-XIANGWEI",
      contractStatus: "expired",
      licenseAutoSuspend: true,
      primaryAdminEmail: "xiangwei.admin@menusifu.cn",
      address: "长沙市岳麓区",
      createdAt: "2024-06-01T00:00:00.000Z",
      updatedAt: nowIso(),
      activatedAt: "2024-07-01T00:00:00.000Z",
    },
    {
      merchantId: "merchant-sakura-sushi",
      enterpriseId: NA_ENTERPRISE_ID,
      groupId: "group-sakura-holdings",
      bid: "B00000005",
      name: "Sakura Sushi Group",
      code: "sakura-sushi",
      orgType: "chain",
      status: "active",
      timezone: "America/Los_Angeles",
      locale: "en-US",
      contactName: "Ken Tanaka",
      contractExpiresAt: "2026-06-20",
      crmContractId: "SF-2024-8891",
      crmAccountId: "ACC-SAKURA",
      contractStatus: "expired",
      licenseAutoSuspend: true,
      primaryAdminEmail: "sakura.admin@menusifu.com",
      createdAt: "2024-03-01T00:00:00.000Z",
      updatedAt: nowIso(),
      activatedAt: "2024-04-01T00:00:00.000Z",
    },
    {
      merchantId: "merchant-burger-co",
      enterpriseId: NA_ENTERPRISE_ID,
      groupId: "group-burger-holdings",
      bid: "B00000006",
      name: "Burger Co. West",
      code: "burger-co",
      orgType: "chain",
      status: "active",
      timezone: "America/Chicago",
      locale: "en-US",
      contactName: "Mike Johnson",
      contractExpiresAt: "2027-03-31",
      crmContractId: "SF-2025-1202",
      crmAccountId: "ACC-BURGER",
      contractStatus: "active",
      crmLastSyncedAt: "2026-06-01T00:00:00.000Z",
      licenseAutoSuspend: true,
      primaryAdminEmail: "burger.admin@menusifu.com",
      createdAt: "2025-01-10T00:00:00.000Z",
      updatedAt: nowIso(),
      activatedAt: "2025-02-01T00:00:00.000Z",
    },
    {
      merchantId: "merchant-store-sh-ljz",
      enterpriseId: miju,
      groupId: "group-zhangji-holdings",
      bid: "B00000007",
      name: "张记火锅",
      code: "sh-ljz",
      orgType: "single-store",
      status: "active",
      timezone: "Asia/Shanghai",
      locale: "zh-CN",
      address: "上海市浦东新区陆家嘴环路",
      contactName: "王店长",
      primaryAdminEmail: "sh.ljz@zhangji.cn",
      createdAt: "2020-06-01T00:00:00.000Z",
      updatedAt: nowIso(),
      activatedAt: "2020-06-01T00:00:00.000Z",
    },
    {
      merchantId: "merchant-store-gz-tzh",
      enterpriseId: miju,
      groupId: "group-zhangji-holdings",
      bid: "B00000008",
      name: "张记火锅",
      code: "gz-tzh",
      orgType: "single-store",
      status: "active",
      timezone: "Asia/Shanghai",
      locale: "zh-CN",
      address: "广州市天河区体育西路",
      contactName: "陈店长",
      primaryAdminEmail: "gz.tzh@zhangji.cn",
      createdAt: "2021-03-15T00:00:00.000Z",
      updatedAt: nowIso(),
      activatedAt: "2021-03-15T00:00:00.000Z",
    },
    {
      merchantId: "merchant-store-na-nyc",
      enterpriseId: miju,
      groupId: "group-menusifu-cn",
      bid: "B00000009",
      name: "MenuSifu NA",
      code: "nyc-flag",
      orgType: "single-store",
      status: "active",
      timezone: "America/New_York",
      locale: "en-US",
      address: "New York, NY",
      contactName: "Alex Chen",
      primaryAdminEmail: "nyc@menusifu-na.cn",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: nowIso(),
      activatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      merchantId: "merchant-store-hz-bj",
      enterpriseId: miju,
      groupId: "group-zhangji-holdings",
      bid: "B00000011",
      name: "杭城小笼",
      code: "hangcheng-xiaolong",
      orgType: "single-store",
      status: "active",
      timezone: "Asia/Shanghai",
      locale: "zh-CN",
      address: "杭州市滨江区网商路",
      contactName: "孙经理",
      primaryAdminEmail: "hz.bj@partner.cn",
      createdAt: "2026-06-19T08:00:00.000Z",
      updatedAt: nowIso(),
      activatedAt: "2026-06-19T08:00:00.000Z",
    },
  ];
}

function buildSeedSnapshot(): EnterpriseMerchantSnapshot {
  const enterprises: EnterpriseTenant[] = [...DEMO_ENTERPRISES];
  const groups = buildSeedGroups();
  const merchants = buildSeedMerchants();
  const bidSeq = assignSeedMerchantBids(merchants);
  const miju = DEMO_ENTERPRISE_ID;

  const brands: MerchantOrgBrand[] = [
    { brandId: "brand-zhangji", merchantId: "merchant-zhangji", name: "张记火锅", code: "zhangji", status: "active" },
    { brandId: "brand-zhangji-noodle", merchantId: "merchant-zhangji", name: "张记小面", code: "zhangji-noodle", status: "active" },
    { brandId: "brand-zhangji-skewers", merchantId: "merchant-zhangji-skewers", name: "张记串串", code: "zhangji-skewers", status: "active" },
    { brandId: "brand-hz-bj", merchantId: "merchant-store-hz-bj", name: "杭城小笼", code: "hangcheng-xiaolong", status: "active" },
    { brandId: "brand-tea-one", merchantId: "merchant-tea-one", name: "茶语一家", code: "tea-one", status: "active" },
    { brandId: "brand-menusifu-na", merchantId: "merchant-menusifu-na", name: "MenuSifu NA", code: "menusifu-na", status: "active" },
    { brandId: "brand-xiangwei", merchantId: "merchant-expired-demo", name: "湘味小厨", code: "xiangwei", status: "active" },
    { brandId: "brand-sakura", merchantId: "merchant-sakura-sushi", name: "Sakura Sushi", code: "sakura", status: "active" },
    { brandId: "brand-burger", merchantId: "merchant-burger-co", name: "Burger Co.", code: "burger", status: "active" },
  ];

  const regions: MerchantOrgRegion[] = [
    { regionId: "region-zj-east", merchantId: "merchant-zhangji", brandId: "brand-zhangji", name: "华东大区", code: "east-cn" },
    { regionId: "region-zj-south", merchantId: "merchant-zhangji", brandId: "brand-zhangji", name: "华南大区", code: "south-cn" },
    { regionId: "region-zj-skewers-west", merchantId: "merchant-zhangji-skewers", brandId: "brand-zhangji-skewers", name: "西南大区", code: "west-cn" },
    { regionId: "region-hz-bj-default", merchantId: "merchant-store-hz-bj", brandId: "brand-hz-bj", name: "默认区域", code: "default" },
    { regionId: "region-tea-default", merchantId: "merchant-tea-one", brandId: "brand-tea-one", name: "默认区域", code: "default" },
    { regionId: "region-na-east", merchantId: "merchant-menusifu-na", brandId: "brand-menusifu-na", name: "美国东海岸", code: "us-east" },
    { regionId: "region-na-west", merchantId: "merchant-menusifu-na", brandId: "brand-menusifu-na", name: "美国西海岸", code: "us-west" },
    { regionId: "region-xiangwei", merchantId: "merchant-expired-demo", brandId: "brand-xiangwei", name: "默认区域", code: "default" },
    { regionId: "region-sakura-west", merchantId: "merchant-sakura-sushi", brandId: "brand-sakura", name: "US West", code: "us-west" },
    { regionId: "region-burger-mw", merchantId: "merchant-burger-co", brandId: "brand-burger", name: "Midwest", code: "midwest" },
  ];

  const stores: MerchantOrgStore[] = [
    {
      storeId: "M00000001",
      merchantId: "merchant-zhangji",
      linkedMerchantId: "merchant-store-sh-ljz",
      brandId: "brand-zhangji",
      regionId: "region-zj-east",
      name: "上海陆家嘴店",
      code: "sh-ljz",
      status: "open",
      address: "上海市浦东新区陆家嘴环路",
      openedAt: "2020-06-01",
      mountedAt: "2020-06-01T00:00:00.000Z",
    },
    {
      storeId: "M00000002",
      merchantId: "merchant-zhangji",
      linkedMerchantId: "merchant-store-gz-tzh",
      brandId: "brand-zhangji",
      regionId: "region-zj-south",
      name: "广州天河店",
      code: "gz-tzh",
      status: "open",
      address: "广州市天河区体育西路",
      openedAt: "2021-03-15",
      mountedAt: "2021-03-15T00:00:00.000Z",
    },
    {
      storeId: "M00000003",
      merchantId: "merchant-tea-one",
      linkedMerchantId: "merchant-tea-one",
      brandId: "brand-tea-one",
      regionId: "region-tea-default",
      name: "茶语一家",
      code: "tea-one",
      status: "open",
      address: "杭州市西湖区文三路",
      openedAt: "2026-01-20",
      mountedAt: "2026-01-20T00:00:00.000Z",
    },
    {
      storeId: "M00000004",
      merchantId: "merchant-menusifu-na",
      linkedMerchantId: "merchant-store-na-nyc",
      brandId: "brand-menusifu-na",
      regionId: "region-na-east",
      name: "Flagship · NYC",
      code: "nyc-flag",
      status: "open",
      address: "New York, NY",
      openedAt: "2024-01-01",
      mountedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      storeId: "M00000005",
      merchantId: "merchant-expired-demo",
      linkedMerchantId: "merchant-expired-demo",
      brandId: "brand-xiangwei",
      regionId: "region-xiangwei",
      name: "湘味小厨（到期演示）",
      code: "xiangwei-expired",
      status: "open",
      address: "长沙市岳麓区",
      mountedAt: "2024-07-01T00:00:00.000Z",
    },
    {
      storeId: "M00000006",
      merchantId: "merchant-sakura-sushi",
      linkedMerchantId: "merchant-sakura-sushi",
      brandId: "brand-sakura",
      regionId: "region-sakura-west",
      name: "Sakura Sushi Group",
      code: "sakura-sushi",
      status: "open",
      address: "Los Angeles, CA",
      mountedAt: "2024-04-01T00:00:00.000Z",
    },
    {
      storeId: "M00000007",
      merchantId: "merchant-burger-co",
      linkedMerchantId: "merchant-burger-co",
      brandId: "brand-burger",
      regionId: "region-burger-mw",
      name: "Burger Co. · Chicago",
      code: "burger-chi",
      status: "open",
      address: "Chicago, IL",
      mountedAt: "2025-02-01T00:00:00.000Z",
    },
    {
      storeId: "M00000008",
      merchantId: "merchant-zhangji-skewers",
      linkedMerchantId: "merchant-zhangji-skewers",
      brandId: "brand-zhangji-skewers",
      regionId: "region-zj-skewers-west",
      name: "成都春熙店",
      code: "cd-cx",
      status: "open",
      address: "成都市锦江区春熙路",
      openedAt: "2022-05-01",
      mountedAt: "2022-05-01T00:00:00.000Z",
    },
    {
      storeId: "M00000009",
      merchantId: "merchant-zhangji-skewers",
      linkedMerchantId: "merchant-zhangji-skewers",
      brandId: "brand-zhangji-skewers",
      regionId: "region-zj-skewers-west",
      name: "重庆解放碑店",
      code: "cq-jfb",
      status: "open",
      address: "重庆市渝中区解放碑",
      openedAt: "2023-08-15",
      mountedAt: "2023-08-15T00:00:00.000Z",
    },
  ];

  const capabilities: MerchantCapabilitySnapshot[] = [
    {
      merchantId: "merchant-zhangji",
      businessTypeIds: ["hotpot", "full-service"],
      productLineIds: ["pos", "kiosk", "emenu"],
      presetCombos: [
        { businessTypeId: "hotpot", productLineId: "pos", version: 1 },
        { businessTypeId: "hotpot", productLineId: "kiosk", version: 1 },
      ],
      services: [
        { serviceId: "svc-advanced-report", enabled: true, storeScope: "all" },
        { serviceId: "svc-member-plus", enabled: true, storeScope: "all" },
        { serviceId: "svc-hardware-monitor", enabled: true, storeScope: "all" },
        { serviceId: "svc-delivery-hub", enabled: false, storeScope: "all" },
        { serviceId: "svc-api-open", enabled: false, storeScope: "all" },
      ],
      syncedPresetAt: "2026-06-01T00:00:00.000Z",
    },
    {
      merchantId: "merchant-zhangji-skewers",
      businessTypeIds: ["skewers", "full-service"],
      productLineIds: ["pos", "kiosk", "emenu"],
      presetCombos: [
        { businessTypeId: "skewers", productLineId: "pos", version: 1 },
        { businessTypeId: "skewers", productLineId: "emenu", version: 1 },
      ],
      services: [
        { serviceId: "svc-advanced-report", enabled: true, storeScope: "all" },
        { serviceId: "svc-member-plus", enabled: true, storeScope: "all" },
        { serviceId: "svc-hardware-monitor", enabled: false, storeScope: "all" },
        { serviceId: "svc-delivery-hub", enabled: true, storeScope: "all" },
        { serviceId: "svc-api-open", enabled: false, storeScope: "all" },
      ],
      syncedPresetAt: "2026-06-01T00:00:00.000Z",
    },
    {
      merchantId: "merchant-store-hz-bj",
      businessTypeIds: ["dim-sum", "full-service"],
      productLineIds: ["pos"],
      presetCombos: [{ businessTypeId: "dim-sum", productLineId: "pos", version: 1 }],
      services: [
        { serviceId: "svc-member-plus", enabled: true, storeScope: "all" },
        { serviceId: "svc-advanced-report", enabled: false, storeScope: "all" },
        { serviceId: "svc-hardware-monitor", enabled: false, storeScope: "all" },
        { serviceId: "svc-delivery-hub", enabled: false, storeScope: "all" },
        { serviceId: "svc-api-open", enabled: false, storeScope: "all" },
      ],
      syncedPresetAt: "2026-06-19T08:00:00.000Z",
    },
    {
      merchantId: "merchant-tea-one",
      businessTypeIds: ["tea-drinks"],
      productLineIds: ["pos", "emenu"],
      presetCombos: [{ businessTypeId: "tea-drinks", productLineId: "pos", version: 1 }],
      services: [
        { serviceId: "svc-member-plus", enabled: true, storeScope: "all" },
        { serviceId: "svc-advanced-report", enabled: false, storeScope: "all" },
        { serviceId: "svc-delivery-hub", enabled: true, storeScope: "all" },
        { serviceId: "svc-hardware-monitor", enabled: false, storeScope: "all" },
        { serviceId: "svc-api-open", enabled: false, storeScope: "all" },
      ],
      syncedPresetAt: "2026-01-20T00:00:00.000Z",
    },
    {
      merchantId: "merchant-menusifu-na",
      businessTypeIds: ["full-service", "western"],
      productLineIds: ["pos", "kiosk"],
      presetCombos: [{ businessTypeId: "full-service", productLineId: "pos", version: 1 }],
      services: [
        { serviceId: "svc-hardware-monitor", enabled: true, storeScope: "all" },
        { serviceId: "svc-api-open", enabled: true, storeScope: "all" },
        { serviceId: "svc-advanced-report", enabled: false, storeScope: "all" },
        { serviceId: "svc-member-plus", enabled: false, storeScope: "all" },
        { serviceId: "svc-delivery-hub", enabled: false, storeScope: "all" },
      ],
    },
    {
      merchantId: "merchant-expired-demo",
      businessTypeIds: ["full-service"],
      productLineIds: ["pos"],
      presetCombos: [{ businessTypeId: "full-service", productLineId: "pos", version: 1 }],
      services: [{ serviceId: "svc-advanced-report", enabled: false, storeScope: "all" }],
    },
    {
      merchantId: "merchant-sakura-sushi",
      businessTypeIds: ["full-service", "western"],
      productLineIds: ["pos", "kiosk"],
      presetCombos: [{ businessTypeId: "full-service", productLineId: "pos", version: 1 }],
      services: [
        { serviceId: "svc-hardware-monitor", enabled: true, storeScope: "all" },
        { serviceId: "svc-api-open", enabled: true, storeScope: "all" },
      ],
      syncedPresetAt: "2026-05-01T00:00:00.000Z",
    },
    {
      merchantId: "merchant-burger-co",
      businessTypeIds: ["western"],
      productLineIds: ["pos", "kiosk"],
      presetCombos: [{ businessTypeId: "western", productLineId: "pos", version: 1 }],
      services: [
        { serviceId: "svc-delivery-hub", enabled: true, storeScope: "all" },
        { serviceId: "svc-member-plus", enabled: true, storeScope: "all" },
      ],
      syncedPresetAt: "2026-06-01T00:00:00.000Z",
    },
  ];

  const changelog: MerchantChangeLogEntry[] = [
    {
      id: "mcl-001",
      merchantId: "merchant-zhangji",
      action: "status.active",
      operatorEmail: DEMO_OPERATOR,
      detail: "品牌开通完成，状态变更为在营",
      at: "2025-09-01T10:00:00.000Z",
    },
    {
      id: "mcl-002",
      merchantId: "merchant-tea-one",
      action: "merchant.create",
      operatorEmail: DEMO_OPERATOR,
      detail: "M 平台代开通单店品牌",
      at: "2026-01-15T09:00:00.000Z",
    },
    {
      id: "mcl-003",
      merchantId: "merchant-menusifu-na",
      action: "status.onboarding",
      operatorEmail: DEMO_OPERATOR,
      detail: "创建品牌，待完成 onboarding",
      at: "2026-03-01T14:00:00.000Z",
    },
  ];

  const posStoreRequests: PosStoreProvisioningRequest[] = [
    {
      requestId: "pos-req-001",
      enterpriseId: miju,
      storeName: "深圳南山科技园店",
      address: "深圳市南山区科技园南路",
      contactName: "赵店长",
      contactPhone: "13700005555",
      posDeviceId: "POS-SZ-NS-001",
      posLocation: "深圳南山 · 1号收银台",
      applicantNote: "本地 POS 首次联网申请开通",
      status: "pending",
      createdAt: "2026-06-24T09:00:00.000Z",
      updatedAt: "2026-06-24T09:00:00.000Z",
    },
    {
      requestId: "pos-req-002",
      enterpriseId: miju,
      brandName: "杭城小笼",
      storeName: "杭州滨江店",
      address: "杭州市滨江区网商路",
      contactName: "孙经理",
      posDeviceId: "POS-HZ-BJ-002",
      status: "approved",
      createdBid: "B00000011",
      createdMerchantId: "merchant-store-hz-bj",
      createdAt: "2026-06-18T10:00:00.000Z",
      updatedAt: "2026-06-19T08:00:00.000Z",
      resolvedAt: "2026-06-19T08:00:00.000Z",
      resolvedBy: DEMO_OPERATOR,
    },
  ];

  const requests: MerchantProvisioningRequest[] = [
    {
      requestId: "mreq-001",
      enterpriseId: miju,
      merchantName: "杭城小笼",
      orgType: "single-store",
      contactName: "王老板",
      contactPhone: "13700003333",
      primaryAdminEmail: "hangcheng.admin@menusifu.cn",
      applicantEmail: "sales.wang@partner.cn",
      applicantOrg: "华东渠道部",
      notes: "意向开通 POS + 会员，首店杭州滨江",
      status: "pending",
      createdAt: "2026-06-20T08:00:00.000Z",
      updatedAt: "2026-06-20T08:00:00.000Z",
    },
    {
      requestId: "mreq-002",
      enterpriseId: miju,
      merchantName: "蜀味烧烤",
      orgType: "chain",
      contactName: "刘总",
      contactPhone: "13600004444",
      primaryAdminEmail: "shuwwei.admin@menusifu.cn",
      applicantEmail: "channel.liu@partner.cn",
      applicantOrg: "西南大区",
      notes: "计划 8 店连锁，需 Kiosk 产线",
      status: "pending",
      createdAt: "2026-06-22T11:30:00.000Z",
      updatedAt: "2026-06-22T11:30:00.000Z",
    },
  ];

  const slaMetrics = merchants.map((m) => buildDefaultSlaMetrics(m.merchantId));
  enrichLicenseFields({ enterprises, groups, merchants, brands, regions, stores, capabilities, changelog, requests, posStoreRequests, bidSeq, midSeq: 8, impersonationLogs: [], slaMetrics });

  return { enterprises, groups, merchants, brands, regions, stores, capabilities, changelog, requests, posStoreRequests, bidSeq, midSeq: 8, impersonationLogs: [], slaMetrics };
}

function normalizeSnapshot(raw: EnterpriseMerchantSnapshot): EnterpriseMerchantSnapshot {
  return {
    enterprises: raw.enterprises ?? [],
    groups: raw.groups ?? [],
    merchants: raw.merchants ?? [],
    brands: raw.brands ?? [],
    regions: raw.regions ?? [],
    stores: raw.stores ?? [],
    capabilities: raw.capabilities ?? [],
    changelog: raw.changelog ?? [],
    requests: raw.requests ?? [],
    posStoreRequests: raw.posStoreRequests ?? [],
    bidSeq: raw.bidSeq ?? (raw as { midSeq?: number }).midSeq,
    midSeq: raw.midSeq,
    impersonationLogs: raw.impersonationLogs ?? [],
    slaMetrics: raw.slaMetrics ?? [],
  };
}

function migrateLegacyBidFields(snapshot: EnterpriseMerchantSnapshot): boolean {
  let changed = false;
  const rawSnap = snapshot as EnterpriseMerchantSnapshot & { midSeq?: number };
  if (snapshot.bidSeq == null && rawSnap.midSeq != null) {
    snapshot.bidSeq = rawSnap.midSeq;
    changed = true;
  }
  for (const merchant of snapshot.merchants) {
    const legacyMid = (merchant as { mid?: string }).mid;
    if (legacyMid && !merchant.bid) {
      merchant.bid = normalizeBid(legacyMid);
      delete (merchant as { mid?: string }).mid;
      changed = true;
    } else if (merchant.bid?.startsWith("M")) {
      merchant.bid = normalizeBid(merchant.bid);
      changed = true;
    }
  }
  for (const request of snapshot.posStoreRequests) {
    const legacyCreated = (request as { createdMid?: string }).createdMid;
    if (legacyCreated && !request.createdBid) {
      request.createdBid = normalizeBid(legacyCreated);
      changed = true;
    } else if (request.createdBid?.startsWith("M")) {
      request.createdBid = normalizeBid(request.createdBid);
      changed = true;
    }
  }
  return changed;
}

function migrateStoreIdsToMidFormat(snapshot: EnterpriseMerchantSnapshot): boolean {
  let changed = false;
  if (snapshot.midSeq == null) {
    snapshot.midSeq = 8;
    changed = true;
  }
  for (const store of snapshot.stores) {
    if (isMidFormat(store.storeId)) continue;
    const next = migrateLegacyStoreIdToMid(store.storeId, snapshot);
    if (next !== store.storeId) {
      store.storeId = next;
      changed = true;
    }
  }
  return changed;
}

function ensureDefaultGroupForEnterprise(snapshot: EnterpriseMerchantSnapshot, enterpriseId: string): EnterpriseGroup {
  if (enterpriseId === DEMO_ENTERPRISE_ID) {
    const mijuGroup = snapshot.groups.find((g) => g.groupId === DEFAULT_MIJU_GROUP_ID && g.enterpriseId === enterpriseId);
    if (mijuGroup) return mijuGroup;
  }
  const existing = snapshot.groups.find((g) => g.enterpriseId === enterpriseId && g.status === "active");
  if (existing) return existing;
  const group: EnterpriseGroup = {
    groupId: genId("group"),
    enterpriseId,
    name: "默认集团",
    code: `default-${enterpriseId}`,
    description: "系统自动创建的默认集团",
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  snapshot.groups.push(group);
  return group;
}

function mergeSeedGroups(snapshot: EnterpriseMerchantSnapshot): boolean {
  const seedGroups = buildSeedGroups();
  let changed = false;
  for (const seed of seedGroups) {
    if (snapshot.groups.some((g) => g.groupId === seed.groupId)) continue;
    snapshot.groups.push({ ...seed, updatedAt: nowIso() });
    changed = true;
  }
  return changed;
}

function migrateGroups(snapshot: EnterpriseMerchantSnapshot): boolean {
  let changed = ensureMijuDefaultGroup(snapshot);
  if (!snapshot.groups.length) {
    snapshot.groups = buildSeedGroups();
    changed = true;
  } else if (mergeSeedGroups(snapshot)) {
    changed = true;
  }
  for (const merchant of snapshot.merchants) {
    if (merchant.groupId) continue;
    const group = ensureDefaultGroupForEnterprise(snapshot, merchant.enterpriseId);
    merchant.groupId = group.groupId;
    changed = true;
  }
  if (changed) {
    const enterpriseIds = new Set(snapshot.merchants.map((m) => m.enterpriseId));
    for (const enterpriseId of enterpriseIds) {
      for (const group of snapshot.groups.filter((g) => g.enterpriseId === enterpriseId)) {
        deferChainBrandOrgSync(group.groupId);
      }
    }
  }
  return changed;
}

function findExternalOrgMount(snapshot: EnterpriseMerchantSnapshot, linkedMerchantId: string): MerchantOrgStore | undefined {
  return snapshot.stores.find(
    (s) => s.linkedMerchantId === linkedMerchantId && s.merchantId !== linkedMerchantId,
  );
}

function linkedStoreTenantIds(snapshot: EnterpriseMerchantSnapshot): Set<string> {
  return new Set(
    snapshot.stores
      .filter((s) => s.linkedMerchantId && s.merchantId !== s.linkedMerchantId)
      .map((s) => s.linkedMerchantId),
  );
}

/** 演示种子：曾用门店/地址名作品牌名，迁移为认知中的品牌名 */
const SEED_BRAND_NAME_OVERRIDES: Record<string, string> = {
  "merchant-store-hz-bj": "杭城小笼",
  "merchant-menusifu-cn-2": "米聚智餐",
};

function migrateBrandDisplayNames(snapshot: EnterpriseMerchantSnapshot): boolean {
  let changed = false;
  for (const [merchantId, name] of Object.entries(SEED_BRAND_NAME_OVERRIDES)) {
    const merchant = snapshot.merchants.find((m) => m.merchantId === merchantId);
    if (!merchant || merchant.name === name) continue;
    merchant.name = name;
    merchant.updatedAt = nowIso();
    changed = true;
  }
  for (const merchant of snapshot.merchants) {
    const mount = findExternalOrgMount(snapshot, merchant.merchantId);
    if (!mount) continue;
    const org = snapshot.merchants.find((m) => m.merchantId === mount.merchantId);
    if (!org || merchant.name === org.name) continue;
    merchant.name = org.name;
    merchant.updatedAt = nowIso();
    for (const brand of snapshot.brands.filter((b) => b.merchantId === merchant.merchantId)) {
      if (brand.name !== org.name) brand.name = org.name;
    }
    changed = true;
  }
  return changed;
}

function ensureSingleStoreSelfMount(snapshot: EnterpriseMerchantSnapshot, merchant: EnterpriseMerchant): void {
  if (merchant.orgType !== "single-store" || !merchant.bid) return;
  const existing = snapshot.stores.find(
    (s) => s.merchantId === merchant.merchantId && s.linkedMerchantId === merchant.merchantId,
  );
  if (existing) {
    if (!isMidFormat(existing.storeId)) {
      existing.storeId = migrateLegacyStoreIdToMid(existing.storeId, snapshot);
    }
    existing.name = merchant.name;
    existing.address = merchant.address ?? existing.address;
    return;
  }
  const brands = snapshot.brands.filter((b) => b.merchantId === merchant.merchantId && b.status === "active");
  const brandId = brands[0]?.brandId;
  if (!brandId) return;
  const regionId = snapshot.regions.find((r) => r.merchantId === merchant.merchantId && r.brandId === brandId)?.regionId;
  if (!regionId) return;
  snapshot.stores.push({
    storeId: generateNextMid(snapshot),
    merchantId: merchant.merchantId,
    linkedMerchantId: merchant.merchantId,
    brandId,
    regionId,
    name: merchant.name,
    code: merchant.code,
    status: "open",
    address: merchant.address,
    mountedAt: nowIso(),
  });
}

function bootstrapLinkedStoreMerchant(
  snapshot: EnterpriseMerchantSnapshot,
  orgMerchant: EnterpriseMerchant,
  store: MerchantOrgStore,
): EnterpriseMerchant {
  const bid = generateNextBid(snapshot);
  const merchantId = genId("merchant");
  const linked: EnterpriseMerchant = {
    merchantId,
    enterpriseId: orgMerchant.enterpriseId,
    groupId: orgMerchant.groupId,
    bid,
    name: orgMerchant.name.trim(),
    code: slugCode(orgMerchant.code || orgMerchant.name) || merchantId,
    orgType: "single-store",
    status: "active",
    timezone: orgMerchant.timezone,
    locale: orgMerchant.locale,
    address: store.address,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    activatedAt: nowIso(),
  };
  snapshot.merchants.push(linked);
  const brandId = genId("brand");
  snapshot.brands.push({
    brandId,
    merchantId,
    name: linked.name,
    code: `${linked.code}-brand`,
    status: "active",
  });
  const regionId = genId("region");
  snapshot.regions.push({
    regionId,
    merchantId,
    brandId,
    name: "默认区域",
    code: "default",
  });
  snapshot.capabilities.push({
    merchantId,
    businessTypeIds: ["full-service"],
    productLineIds: ["pos"],
    presetCombos: [{ businessTypeId: "full-service", productLineId: "pos", version: 1 }],
    services: [],
  });
  store.linkedMerchantId = merchantId;
  if (!isMidFormat(store.storeId)) {
    store.storeId = generateNextMid(snapshot);
  }
  return linked;
}

function migrateOrgMidSchema(snapshot: EnterpriseMerchantSnapshot): boolean {
  let changed = false;
  if (!snapshot.posStoreRequests.length) {
    snapshot.posStoreRequests = buildSeedSnapshot().posStoreRequests;
    changed = true;
  }
  if (snapshot.bidSeq == null) {
    snapshot.bidSeq = 20;
    changed = true;
  }
  for (const merchant of snapshot.merchants) {
    if (!merchant.bid) {
      merchant.bid = generateNextBid(snapshot);
      changed = true;
    }
  }
  for (const store of snapshot.stores) {
    if (store.linkedMerchantId && isMidFormat(store.storeId)) continue;
    const orgMerchant = snapshot.merchants.find((m) => m.merchantId === store.merchantId);
    if (!orgMerchant) continue;
    if (store.linkedMerchantId && !isMidFormat(store.storeId)) {
      store.storeId = migrateLegacyStoreIdToMid(store.storeId, snapshot);
      changed = true;
      continue;
    }
    if (orgMerchant.orgType === "single-store") {
      store.linkedMerchantId = orgMerchant.merchantId;
      if (!isMidFormat(store.storeId)) {
        store.storeId = migrateLegacyStoreIdToMid(store.storeId, snapshot);
      }
      store.name = orgMerchant.name;
      changed = true;
      continue;
    }
    if (!store.linkedMerchantId || !isMidFormat(store.storeId)) {
      bootstrapLinkedStoreMerchant(snapshot, orgMerchant, store);
      changed = true;
    }
  }
  for (const merchant of snapshot.merchants) {
    if (merchant.orgType === "single-store") {
      const before = snapshot.stores.length;
      ensureSingleStoreSelfMount(snapshot, merchant);
      if (snapshot.stores.length !== before) changed = true;
    }
  }
  return changed;
}

function needsOrgMidMigration(snapshot: EnterpriseMerchantSnapshot): boolean {
  if (snapshot.merchants.some((m) => !m.bid)) return true;
  if (snapshot.stores.some((s) => !s.linkedMerchantId || !isMidFormat(s.storeId))) return true;
  return false;
}

function resolveStoreLinkedMerchantId(
  snapshot: EnterpriseMerchantSnapshot,
  store: MerchantOrgStore,
): string | undefined {
  if (store.linkedMerchantId) return store.linkedMerchantId;
  const orgMerchant = snapshot.merchants.find((m) => m.merchantId === store.merchantId);
  if (orgMerchant?.orgType === "single-store") {
    return orgMerchant.merchantId;
  }
  const name = store.name.trim().toLowerCase();
  const address = (store.address ?? "").trim().toLowerCase();
  const byName = snapshot.merchants.find((m) => {
    if (m.orgType !== "single-store") return false;
    if (m.name.trim().toLowerCase() !== name) return false;
    const ma = (m.address ?? "").trim().toLowerCase();
    return !address || !ma || ma === address;
  });
  return byName?.merchantId;
}

function normalizeOrgStoreLinks(snapshot: EnterpriseMerchantSnapshot): boolean {
  let changed = false;
  for (const store of snapshot.stores) {
    const linked = resolveStoreLinkedMerchantId(snapshot, store);
    if (linked && store.linkedMerchantId !== linked) {
      store.linkedMerchantId = linked;
      changed = true;
    }
    if (!isMidFormat(store.storeId)) {
      const next = migrateLegacyStoreIdToMid(store.storeId, snapshot);
      if (next !== store.storeId) {
        store.storeId = next;
        changed = true;
      }
    }
    const linkedMerchant = linked ? snapshot.merchants.find((m) => m.merchantId === linked) : undefined;
    const orgMount = linked ? findExternalOrgMount(snapshot, linked) : undefined;
    if (linkedMerchant && !orgMount && store.name !== linkedMerchant.name) {
      store.name = linkedMerchant.name;
      changed = true;
    }
    if (linkedMerchant?.address && !store.address) {
      store.address = linkedMerchant.address;
      changed = true;
    }
  }
  return changed;
}

function storeDedupeKey(snapshot: EnterpriseMerchantSnapshot, store: MerchantOrgStore): string {
  const linked = resolveStoreLinkedMerchantId(snapshot, store);
  if (linked) return `${store.merchantId}::${linked}`;
  const name = store.name.trim().toLowerCase();
  const address = (store.address ?? "").trim().toLowerCase();
  return `${store.merchantId}::${name}::${address}`;
}

function isGeneratedStoreId(storeId: string): boolean {
  return /^store-[a-z0-9]+-[a-z0-9]+$/.test(storeId);
}

function pickPreferredStore(a: MerchantOrgStore, b: MerchantOrgStore): MerchantOrgStore {
  const aMid = isMidFormat(a.storeId);
  const bMid = isMidFormat(b.storeId);
  if (aMid !== bMid) return aMid ? a : b;
  const aGen = isGeneratedStoreId(a.storeId);
  const bGen = isGeneratedStoreId(b.storeId);
  if (aGen !== bGen) return aGen ? b : a;
  if (a.mountedAt && b.mountedAt && a.mountedAt !== b.mountedAt) {
    return a.mountedAt >= b.mountedAt ? a : b;
  }
  return a.storeId.localeCompare(b.storeId) <= 0 ? a : b;
}

/** 同一组织下按挂载品牌 / 名称+地址去重，保留 MID 门店记录 */
function dedupeMerchantOrgStores(snapshot: EnterpriseMerchantSnapshot): boolean {
  normalizeOrgStoreLinks(snapshot);
  const keepIds = new Set<string>();
  const groups = new Map<string, MerchantOrgStore[]>();

  for (const store of snapshot.stores) {
    const key = storeDedupeKey(snapshot, store);
    const list = groups.get(key) ?? [];
    list.push(store);
    groups.set(key, list);
  }

  for (const group of groups.values()) {
    const preferred = group.reduce(pickPreferredStore);
    keepIds.add(preferred.storeId);
  }

  const before = snapshot.stores.length;
  snapshot.stores = snapshot.stores.filter((s) => keepIds.has(s.storeId));
  return snapshot.stores.length !== before;
}

function dedupeStoresList(
  snapshot: EnterpriseMerchantSnapshot,
  stores: MerchantOrgStore[],
): MerchantOrgStore[] {
  const groups = new Map<string, MerchantOrgStore>();
  for (const store of stores) {
    const key = storeDedupeKey(snapshot, store);
    const existing = groups.get(key);
    groups.set(key, existing ? pickPreferredStore(existing, store) : store);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

function migrateSnapshotP3(snapshot: EnterpriseMerchantSnapshot): boolean {
  let changed = false;
  const seed = buildSeedSnapshot();
  if (!snapshot.enterprises.length) {
    snapshot.enterprises = seed.enterprises;
    changed = true;
  }
  for (const seedMerchant of seed.merchants) {
    if (!snapshot.merchants.some((m) => m.merchantId === seedMerchant.merchantId)) {
      snapshot.merchants.push({ ...seedMerchant });
      changed = true;
    }
  }
  for (const b of seed.brands) {
    if (!snapshot.brands.some((x) => x.brandId === b.brandId)) {
      snapshot.brands.push(b);
      changed = true;
    }
  }
  for (const r of seed.regions) {
    if (!snapshot.regions.some((x) => x.regionId === r.regionId)) {
      snapshot.regions.push(r);
      changed = true;
    }
  }
  for (const s of seed.stores) {
    if (snapshot.stores.some((x) => x.storeId === s.storeId)) continue;
    if (
      snapshot.stores.some(
        (x) => x.merchantId === s.merchantId && x.linkedMerchantId === s.linkedMerchantId,
      )
    ) {
      continue;
    }
    snapshot.stores.push(s);
    changed = true;
  }
  for (const cap of seed.capabilities) {
    if (!snapshot.capabilities.some((c) => c.merchantId === cap.merchantId)) {
      snapshot.capabilities.push(cap);
      changed = true;
    }
  }
  for (const merchant of snapshot.merchants) {
    if (merchant.licenseAutoSuspend === undefined) {
      merchant.licenseAutoSuspend = true;
      changed = true;
    }
    if (!merchant.crmContractId && seed.merchants.find((m) => m.merchantId === merchant.merchantId)?.crmContractId) {
      Object.assign(merchant, {
        crmContractId: seed.merchants.find((m) => m.merchantId === merchant.merchantId)?.crmContractId,
        crmAccountId: seed.merchants.find((m) => m.merchantId === merchant.merchantId)?.crmAccountId,
        contractStatus: seed.merchants.find((m) => m.merchantId === merchant.merchantId)?.contractStatus,
      });
      changed = true;
    }
  }
  for (const request of snapshot.requests) {
    if (!request.enterpriseId) {
      request.enterpriseId = DEMO_ENTERPRISE_ID;
      changed = true;
    }
  }
  for (const merchant of snapshot.merchants) {
    if (!snapshot.slaMetrics.some((s) => s.merchantId === merchant.merchantId)) {
      snapshot.slaMetrics.push(buildDefaultSlaMetrics(merchant.merchantId));
      changed = true;
    }
  }
  enrichLicenseFields(snapshot);
  return changed;
}

function addDaysIso(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function processClosingCooldowns(snapshot: EnterpriseMerchantSnapshot): boolean {
  let changed = false;
  const now = Date.now();
  for (const merchant of snapshot.merchants) {
    if (merchant.status !== "closing" || !merchant.closingEndsAt) continue;
    if (new Date(merchant.closingEndsAt).getTime() > now) continue;
    merchant.status = "closed";
    merchant.closedAt = nowIso();
    merchant.closingStartedAt = undefined;
    merchant.closingEndsAt = undefined;
    merchant.updatedAt = nowIso();
    appendChangelog(snapshot, {
      merchantId: merchant.merchantId,
      action: "status.closed",
      operatorEmail: "system@menusifu.cn",
      detail: `冷静期结束，品牌已自动归档关闭`,
    });
    changed = true;
  }
  return changed;
}

function readSnapshot(): EnterpriseMerchantSnapshot {
  if (snapshotReadDepth > 0 && cachedSnapshot) {
    return cachedSnapshot;
  }
  snapshotReadDepth += 1;
  try {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = normalizeSnapshot(JSON.parse(raw) as EnterpriseMerchantSnapshot);
        let changed = migrateGroups(parsed);
        if (mergeSeedMerchants(parsed)) changed = true;
        if (parsed.merchants.length) {
          changed = migrateLegacyBidFields(parsed) || changed;
          if (migrateStoreIdsToMidFormat(parsed)) changed = true;
          if (migrateSnapshotP3(parsed)) changed = true;
          if (!parsed.requests.length) {
            parsed.requests = buildSeedSnapshot().requests;
            changed = true;
          }
          if (processClosingCooldowns(parsed)) changed = true;
          if (processLicenseExpiry(parsed)) changed = true;
          if (dedupeMerchantOrgStores(parsed)) changed = true;
          if (needsOrgMidMigration(parsed)) {
            if (migrateOrgMidSchema(parsed)) changed = true;
          }
          if (dedupeMerchantOrgStores(parsed)) changed = true;
          if (migrateBrandDisplayNames(parsed)) changed = true;
          enrichLicenseFields(parsed);
          if (changed) writeSnapshot(parsed);
          cachedSnapshot = parsed;
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    const seed = buildSeedSnapshot();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {
      /* ignore */
    }
    for (const group of seed.groups) {
      deferChainBrandOrgSync(group.groupId);
    }
    cachedSnapshot = seed;
    return seed;
  } finally {
    snapshotReadDepth -= 1;
    if (snapshotReadDepth === 0) {
      flushDeferredChainBrandOrgSyncs();
    }
  }
}

function writeSnapshot(snapshot: EnterpriseMerchantSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
  cachedSnapshot = snapshot;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SNAPSHOT_CHANGED_EVENT));
  }
}

function appendChangelog(
  snapshot: EnterpriseMerchantSnapshot,
  entry: Omit<MerchantChangeLogEntry, "id" | "at">,
): void {
  const merchant = snapshot.merchants.find((m) => m.merchantId === entry.merchantId);
  snapshot.changelog.unshift({
    ...entry,
    enterpriseId: entry.enterpriseId ?? merchant?.enterpriseId ?? activeEnterpriseId(),
    id: genId("mcl"),
    at: nowIso(),
  });
}

export function getEnterpriseMerchantSnapshot(): EnterpriseMerchantSnapshot {
  return readSnapshot();
}

export function getMerchants(filter: MerchantFilter = {}): EnterpriseMerchant[] {
  const snap = readSnapshot();
  const all = filter.allEnterprises === true;
  const eid = activeEnterpriseId();
  const linkedTenants = filter.excludeLinkedStoreTenants ? linkedStoreTenantIds(snap) : null;
  return snap.merchants.filter((m) => {
    if (linkedTenants?.has(m.merchantId)) return false;
    if (!all && m.enterpriseId !== eid) return false;
    if (filter.status && m.status !== filter.status) return false;
    if (filter.orgType && m.orgType !== filter.orgType) return false;
    if (filter.groupId && m.groupId !== filter.groupId) return false;
    if (filter.query) {
      const q = filter.query.trim().toLowerCase();
      const hay = [m.name, m.code, m.bid, m.merchantId, m.primaryAdminEmail, m.contactName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getMerchantById(merchantId: string): EnterpriseMerchant | undefined {
  return readSnapshot().merchants.find((m) => m.merchantId === merchantId);
}

export function getGroups(filter: GroupFilter = {}): EnterpriseGroup[] {
  const all = filter.allEnterprises === true;
  const eid = all ? undefined : resolveGroupEnterpriseId(filter.enterpriseId);
  return readSnapshot()
    .groups.filter((g) => {
      if (!all && g.enterpriseId !== eid) return false;
      if (filter.status && g.status !== filter.status) return false;
      if (filter.query) {
        const q = filter.query.trim().toLowerCase();
        const hay = [g.name, g.code, g.groupId, g.description].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!all && eid === DEMO_ENTERPRISE_ID) {
        if (a.groupId === DEFAULT_MIJU_GROUP_ID) return -1;
        if (b.groupId === DEFAULT_MIJU_GROUP_ID) return 1;
      }
      return a.name.localeCompare(b.name, "zh-CN");
    });
}

export function getGroupById(groupId: string, enterpriseId?: string): EnterpriseGroup | undefined {
  const eid = resolveGroupEnterpriseId(enterpriseId);
  const group = readSnapshot().groups.find((g) => g.groupId === groupId);
  if (!group || group.enterpriseId !== eid) return undefined;
  return group;
}

export function getGroupName(groupId: string | undefined): string {
  if (!groupId) return "—";
  const group = readSnapshot().groups.find((g) => g.groupId === groupId);
  return group?.name ?? groupId;
}

export function countMerchantsForGroup(groupId: string, enterpriseId?: string): number {
  const snap = readSnapshot();
  const group = snap.groups.find((g) => g.groupId === groupId);
  const eid = group?.enterpriseId ?? resolveGroupEnterpriseId(enterpriseId);
  return snap.merchants.filter((m) => m.enterpriseId === eid && m.groupId === groupId).length;
}

export function createGroup(
  input: CreateGroupInput,
  operatorEmail = DEMO_OPERATOR,
  enterpriseId?: string,
): EnterpriseGroup {
  const snap = readSnapshot();
  const eid = resolveGroupEnterpriseId(enterpriseId);
  const groupId = genId("group");
  const code = input.code?.trim() || slugCode(input.name) || groupId;
  const group: EnterpriseGroup = {
    groupId,
    enterpriseId: eid,
    name: input.name.trim(),
    code,
    description: input.description?.trim() || undefined,
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  snap.groups.push(group);
  appendChangelog(snap, {
    merchantId: "enterprise",
    action: "group.create",
    operatorEmail,
    detail: `创建集团「${group.name}」（${group.code}）`,
  });
  writeSnapshot(snap);
  notifyChainBrandOrgSync(group.groupId);
  return group;
}

export function updateGroup(
  groupId: string,
  input: UpdateGroupInput,
  operatorEmail = DEMO_OPERATOR,
  enterpriseId?: string,
): EnterpriseGroup | null {
  const snap = readSnapshot();
  const eid = resolveGroupEnterpriseId(enterpriseId);
  const group = snap.groups.find((g) => g.groupId === groupId && g.enterpriseId === eid);
  if (!group) return null;
  const name = input.name.trim();
  if (!name) return null;
  group.name = name;
  group.description = input.description?.trim() || undefined;
  if (input.status) group.status = input.status;
  group.updatedAt = nowIso();
  appendChangelog(snap, {
    merchantId: "enterprise",
    action: "group.update",
    operatorEmail,
    detail: `更新集团「${group.name}」（${group.code}）`,
  });
  writeSnapshot(snap);
  notifyChainBrandOrgSync(group.groupId);
  return group;
}

export function deleteGroup(
  groupId: string,
  operatorEmail = DEMO_OPERATOR,
  enterpriseId?: string,
): { ok: true } | { ok: false; reason: string } {
  const snap = readSnapshot();
  const eid = resolveGroupEnterpriseId(enterpriseId);
  const group = snap.groups.find((g) => g.groupId === groupId && g.enterpriseId === eid);
  if (!group) return { ok: false, reason: "集团不存在" };
  const brandCount = countMerchantsForGroup(groupId);
  if (brandCount > 0) {
    return { ok: false, reason: `该集团下仍有 ${brandCount} 个品牌，请先迁移或删除品牌后再删除集团` };
  }
  snap.groups = snap.groups.filter((g) => g.groupId !== groupId);
  appendChangelog(snap, {
    merchantId: "enterprise",
    action: "group.delete",
    operatorEmail,
    detail: `删除集团「${group.name}」（${group.code}）`,
  });
  writeSnapshot(snap);
  notifyChainBrandOrgSync(groupId);
  return { ok: true };
}

export function getGroupsForSelect(filter: Pick<GroupFilter, "allEnterprises" | "enterpriseId"> = {}): { groupId: string; name: string }[] {
  return getGroups({ status: "active", ...filter }).map((g) => ({ groupId: g.groupId, name: g.name }));
}

export function getMerchantBrands(merchantId: string): MerchantOrgBrand[] {
  return readSnapshot().brands.filter((b) => b.merchantId === merchantId);
}

export function getMerchantRegions(merchantId: string): MerchantOrgRegion[] {
  return readSnapshot().regions.filter((r) => r.merchantId === merchantId);
}

export function getMerchantStores(merchantId: string): MerchantOrgStore[] {
  const snap = readSnapshot();
  const stores = snap.stores.filter((s) => s.merchantId === merchantId);
  return dedupeStoresList(snap, stores);
}

export function getMerchantCapability(merchantId: string): MerchantCapabilitySnapshot | undefined {
  const cap = readSnapshot().capabilities.find((c) => c.merchantId === merchantId);
  if (!cap) return undefined;
  return { ...cap, services: migrateLegacyMerchantServices(cap.services) };
}

export function getMerchantChangelog(merchantId?: string): MerchantChangeLogEntry[] {
  const snap = readSnapshot();
  const eid = activeEnterpriseId();
  const ids = merchantIdsForEnterprise(snap, eid);
  let logs = snap.changelog.filter((l) => l.enterpriseId === eid || ids.has(l.merchantId) || l.merchantId === "enterprise");
  if (!merchantId) return logs;
  return logs.filter((l) => l.merchantId === merchantId);
}

export function countStoresForMerchant(merchantId: string): number {
  return getMerchantStores(merchantId).length;
}

export function getEnterpriseStoreList(filter: EnterpriseStoreListFilter = {}): EnterpriseStoreListRow[] {
  const snap = readSnapshot();
  const all = filter.allEnterprises === true;
  const eid = activeEnterpriseId();
  const enterpriseNameById = new Map(snap.enterprises.map((e) => [e.enterpriseId, e.name]));
  const groupNameById = new Map(snap.groups.map((g) => [g.groupId, g.name]));
  const merchants = snap.merchants.filter((m) => {
    if (!all && m.enterpriseId !== eid) return false;
    if (filter.groupId && m.groupId !== filter.groupId) return false;
    if (filter.merchantId && m.merchantId !== filter.merchantId) return false;
    return true;
  });
  const regionNameById = new Map(
    snap.regions.map((r) => [`${r.merchantId}:${r.regionId}`, r.name] as const),
  );
  const merchantNameById = new Map(snap.merchants.map((m) => [m.merchantId, m.name] as const));
  const rows: EnterpriseStoreListRow[] = [];

  for (const merchant of merchants) {
    for (const store of getMerchantStores(merchant.merchantId)) {
      if (filter.status && store.status !== filter.status) continue;
      if (filter.query) {
        const q = filter.query.trim().toLowerCase();
        const regionName = regionNameById.get(`${merchant.merchantId}:${store.regionId}`);
        const linkedName = merchantNameById.get(store.linkedMerchantId);
        const hay = [
          store.name,
          store.code,
          store.storeId,
          store.address,
          merchant.name,
          merchant.bid,
          groupNameById.get(merchant.groupId),
          regionName,
          linkedName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }
      rows.push({
        store,
        enterpriseId: merchant.enterpriseId,
        enterpriseName: enterpriseNameById.get(merchant.enterpriseId) ?? merchant.enterpriseId,
        groupId: merchant.groupId,
        groupName: groupNameById.get(merchant.groupId) ?? merchant.groupId,
        merchantId: merchant.merchantId,
        merchantName: merchant.name,
        merchantBid: merchant.bid,
        regionName: regionNameById.get(`${merchant.merchantId}:${store.regionId}`),
        linkedMerchantName:
          store.linkedMerchantId && store.linkedMerchantId !== merchant.merchantId
            ? merchantNameById.get(store.linkedMerchantId)
            : undefined,
      });
    }
  }

  return rows.sort(
    (a, b) =>
      a.groupName.localeCompare(b.groupName, "zh-CN") ||
      a.merchantName.localeCompare(b.merchantName, "zh-CN") ||
      a.store.name.localeCompare(b.store.name, "zh-CN"),
  );
}

export function getMerchantOverviewStats(): {
  total: number;
  active: number;
  onboarding: number;
  suspended: number;
  draft: number;
  closed: number;
  storeCount: number;
  expiringSoon: number;
} {
  const snap = readSnapshot();
  const eid = activeEnterpriseId();
  const merchants = snap.merchants.filter((m) => m.enterpriseId === eid);
  const ids = merchantIdsForEnterprise(snap, eid);
  const in30Days = Date.now() + 30 * 24 * 60 * 60 * 1000;
  return {
    total: merchants.length,
    active: merchants.filter((m) => m.status === "active").length,
    onboarding: merchants.filter((m) => m.status === "onboarding" || m.status === "draft").length,
    suspended: merchants.filter((m) => m.status === "suspended").length,
    draft: merchants.filter((m) => m.status === "draft").length,
    closed: merchants.filter((m) => m.status === "closed" || m.status === "closing").length,
    storeCount: snap.stores.filter((s) => ids.has(s.merchantId)).length,
    expiringSoon: merchants.filter((m) => {
      if (!m.contractExpiresAt) return false;
      const exp = new Date(m.contractExpiresAt).getTime();
      return exp > Date.now() && exp <= in30Days;
    }).length,
  };
}

export function getMerchantStatusLabel(status: MerchantStatus): string {
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

export function getMerchantOrgTypeLabel(orgType: EnterpriseMerchant["orgType"]): string {
  return orgType === "chain" ? "连锁" : "单店";
}

export function getStoreStatusLabel(status: MerchantOrgStore["status"]): string {
  const map: Record<MerchantOrgStore["status"], string> = {
    preparing: "筹备中",
    open: "营业中",
    closed: "停业",
    archived: "已归档",
  };
  return map[status] ?? status;
}

export function statusBadgeClass(status: MerchantStatus): string {
  if (status === "active") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (status === "suspended" || status === "closing") return "bg-destructive/15 text-destructive";
  if (status === "onboarding" || status === "draft") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

export function businessTypeLabel(id: string): string {
  return PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.find((b) => b.id === id)?.label ?? id;
}

export function productLineLabel(id: string): string {
  return fohLineNavLabel(id);
}

export function getBusinessTypeOptions(): { id: string; label: string }[] {
  return PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.map((b) => ({ id: b.id, label: b.label }));
}

export function getProductLineOptions(): { id: string; label: string }[] {
  return FOH_LINE_NAV_ORDER.map((pl) => ({ id: pl.id, label: pl.label }));
}

export function updateMerchantStatus(merchantId: string, status: MerchantStatus, operatorEmail = DEMO_OPERATOR): EnterpriseMerchant | null {
  const snap = readSnapshot();
  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (!merchant) return null;
  const prev = merchant.status;
  merchant.status = status;
  merchant.updatedAt = nowIso();
  if (status === "active" && !merchant.activatedAt) merchant.activatedAt = nowIso();
  appendChangelog(snap, {
    merchantId,
    action: `status.${status}`,
    operatorEmail,
    detail: `状态由「${getMerchantStatusLabel(prev)}」变更为「${getMerchantStatusLabel(status)}」`,
  });
  writeSnapshot(snap);
  return merchant;
}

export function createMerchant(input: CreateMerchantInput, operatorEmail = DEMO_OPERATOR): EnterpriseMerchant {
  const snap = readSnapshot();
  const merchantId = genId("merchant");
  const bid = input.bid ?? generateNextBid(snap);
  const code = input.code.trim() || slugCode(input.name) || merchantId;
  const status: MerchantStatus = input.activateImmediately ? "active" : "onboarding";
  const group =
    getGroupById(input.groupId) ??
    ensureDefaultGroupForEnterprise(snap, activeEnterpriseId());
  const merchant: EnterpriseMerchant = {
    merchantId,
    enterpriseId: activeEnterpriseId(),
    groupId: group.groupId,
    bid,
    name: input.name.trim(),
    code,
    orgType: input.orgType,
    status,
    timezone: input.timezone,
    locale: "zh-CN",
    address: input.firstStoreAddress?.trim(),
    contactName: input.contactName.trim(),
    contactPhone: input.contactPhone?.trim(),
    primaryAdminEmail: input.primaryAdminEmail.trim(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    activatedAt: status === "active" ? nowIso() : undefined,
  };

  const brandId = genId("brand");
  snap.brands.push({
    brandId,
    merchantId,
    name: input.name.trim(),
    code: `${code}-brand`,
    status: "active",
  });
  const regionId = genId("region");
  snap.regions.push({
    regionId,
    merchantId,
    brandId,
    name: "默认区域",
    code: "default",
  });

  if (input.orgType === "single-store" || input.firstStoreName) {
    snap.stores.push({
      storeId: generateNextMid(snap),
      merchantId,
      linkedMerchantId: merchantId,
      brandId,
      regionId,
      name: input.firstStoreName?.trim() || input.name.trim(),
      code: `${code}-main`,
      status: "preparing",
      address: input.firstStoreAddress?.trim(),
      mountedAt: nowIso(),
    });
  }

  const presetCombos = input.businessTypeIds.flatMap((bt) =>
    input.productLineIds.map((pl) => ({
      businessTypeId: bt,
      productLineId: pl,
      version: 1,
    })),
  );

  snap.capabilities.push({
    merchantId,
    businessTypeIds: [...input.businessTypeIds],
    productLineIds: [...input.productLineIds],
    presetCombos,
    services: [
      { serviceId: "svc-hardware-monitor", enabled: true, storeScope: "all" },
      { serviceId: "svc-advanced-report", enabled: false, storeScope: "all" },
      { serviceId: "svc-member-plus", enabled: false, storeScope: "all" },
      { serviceId: "svc-delivery-hub", enabled: false, storeScope: "all" },
      { serviceId: "svc-api-open", enabled: false, storeScope: "all" },
    ],
  });

  snap.merchants.push(merchant);
  appendChangelog(snap, {
    merchantId,
    action: "merchant.create",
    operatorEmail,
    detail: `M 平台代开通品牌「${merchant.name}」（${getMerchantOrgTypeLabel(merchant.orgType)} · BID ${bid} · 集团 ${group.name}）`,
  });
  writeSnapshot(snap);
  notifyChainBrandOrgSyncForMerchant(merchantId);
  if (status === "active" || input.activateImmediately) {
    syncMerchantCapabilityPresets(merchantId, true);
    const refreshed = readSnapshot();
    const cap = refreshed.capabilities.find((c) => c.merchantId === merchantId);
    if (cap) cap.syncedPresetAt = nowIso();
    writeSnapshot(refreshed);
  }
  if (input.sendInviteEmail && status === "onboarding") {
    sendOnboardingInvite(merchantId, operatorEmail);
  }
  return merchant;
}

export function getMerchantStoreIdSet(merchantId: string): Set<string> {
  return new Set(getMerchantStores(merchantId).map((s) => s.storeId));
}

export function getMerchantsForSelect(): { merchantId: string; name: string }[] {
  const eid = activeEnterpriseId();
  return readSnapshot()
    .merchants.filter((m) => m.enterpriseId === eid)
    .map((m) => ({ merchantId: m.merchantId, name: m.name }));
}

function resolveBrandAndRegion(
  snap: EnterpriseMerchantSnapshot,
  merchantId: string,
  brandId?: string,
  regionId?: string,
): { brandId: string; regionId: string } | null {
  const brands = snap.brands.filter((b) => b.merchantId === merchantId && b.status === "active");
  const resolvedBrandId = brandId ?? brands[0]?.brandId;
  if (!resolvedBrandId) return null;
  const regions = snap.regions.filter((r) => r.merchantId === merchantId && r.brandId === resolvedBrandId);
  const resolvedRegionId = regionId ?? regions[0]?.regionId;
  if (!resolvedRegionId) return null;
  return { brandId: resolvedBrandId, regionId: resolvedRegionId };
}

export function listMountableMerchantsForOrg(orgMerchantId: string): EnterpriseMerchant[] {
  const snap = readSnapshot();
  const org = snap.merchants.find((m) => m.merchantId === orgMerchantId);
  if (!org) return [];
  const mountedIds = new Set(
    snap.stores.filter((s) => s.merchantId === orgMerchantId).map((s) => s.linkedMerchantId),
  );
  return snap.merchants.filter((m) => {
    if (m.enterpriseId !== org.enterpriseId) return false;
    if (m.merchantId === orgMerchantId) return false;
    if (!m.bid) return false;
    if (m.orgType === "chain") return false;
    if (mountedIds.has(m.merchantId)) return false;
    if (findExternalOrgMount(snap, m.merchantId)) return false;
    if (!["active", "onboarding"].includes(m.status)) return false;
    return true;
  });
}

export function mountMerchantToOrg(input: MountMerchantStoreInput, operatorEmail = DEMO_OPERATOR): MerchantOrgStore | null {
  const snap = readSnapshot();
  const org = snap.merchants.find((m) => m.merchantId === input.orgMerchantId);
  const linked = snap.merchants.find((m) => m.merchantId === input.linkedMerchantId);
  if (!org || !linked?.bid) return null;
  if (org.enterpriseId !== linked.enterpriseId) return null;
  if (input.orgMerchantId === input.linkedMerchantId) return null;
  if (linked.orgType === "chain") return null;
  if (findExternalOrgMount(snap, input.linkedMerchantId)) return null;
  if (snap.stores.some((s) => s.merchantId === input.orgMerchantId && s.linkedMerchantId === input.linkedMerchantId)) {
    return null;
  }

  const resolved = resolveBrandAndRegion(snap, input.orgMerchantId, input.brandId, input.regionId);
  if (!resolved) return null;

  const linkedSelfStore = snap.stores.find(
    (s) => s.merchantId === linked.merchantId && s.linkedMerchantId === linked.merchantId,
  );
  const storeId =
    linkedSelfStore && isMidFormat(linkedSelfStore.storeId)
      ? linkedSelfStore.storeId
      : generateNextMid(snap);

  const store: MerchantOrgStore = {
    storeId,
    merchantId: input.orgMerchantId,
    linkedMerchantId: input.linkedMerchantId,
    brandId: resolved.brandId,
    regionId: resolved.regionId,
    name: linked.name,
    code: linked.code,
    status: input.status ?? "preparing",
    address: linked.address,
    mountedAt: nowIso(),
  };
  snap.stores.push(store);
  appendChangelog(snap, {
    merchantId: input.orgMerchantId,
    action: "org.store.mount",
    operatorEmail,
    detail: `挂载门店「${linked.name}」（MID ${storeId} · 品牌 BID ${linked.bid}）到组织`,
  });
  org.updatedAt = nowIso();
  writeSnapshot(snap);
  notifyChainBrandOrgSyncForMerchant(input.orgMerchantId);
  notifyChainBrandOrgSyncForMerchant(input.linkedMerchantId);
  return store;
}

export function updateMerchantStoreStatus(
  storeId: string,
  status: MerchantOrgStoreStatus,
  operatorEmail = DEMO_OPERATOR,
): MerchantOrgStore | null {
  const snap = readSnapshot();
  const store = snap.stores.find((s) => s.storeId === storeId);
  if (!store) return null;
  const prev = store.status;
  store.status = status;
  appendChangelog(snap, {
    merchantId: store.merchantId,
    action: "org.store.status",
    operatorEmail,
    detail: `门店「${store.name}」状态：${getStoreStatusLabel(prev)} → ${getStoreStatusLabel(status)}`,
  });
  const merchant = snap.merchants.find((m) => m.merchantId === store.merchantId);
  if (merchant) merchant.updatedAt = nowIso();
  writeSnapshot(snap);
  notifyChainBrandOrgSyncForMerchant(store.merchantId);
  notifyChainBrandOrgSyncForMerchant(store.linkedMerchantId);
  return store;
}

export function syncMerchantCapabilityPresets(
  merchantId: string,
  force = false,
): EnterpriseToMerchantSyncResult {
  const cap = getMerchantCapability(merchantId);
  if (!cap || cap.presetCombos.length === 0) return { updated: 0, skipped: 0 };
  seedMerchantPresetsFromEnterprise(
    cap.businessTypeIds,
    cap.productLineIds as ProductLineId[],
  );
  const targets = cap.presetCombos.map((c) => ({
    businessTypeId: c.businessTypeId,
    productLineId: c.productLineId as ProductLineId,
  }));
  return syncEnterprisePresetsToMerchant({ targets, force });
}

export function saveMerchantCapability(
  merchantId: string,
  input: UpdateMerchantCapabilityInput,
  operatorEmail = DEMO_OPERATOR,
): { capability: MerchantCapabilitySnapshot; syncResult?: EnterpriseToMerchantSyncResult } {
  const snap = readSnapshot();
  let cap = snap.capabilities.find((c) => c.merchantId === merchantId);
  if (!cap) {
    cap = {
      merchantId,
      businessTypeIds: [],
      productLineIds: [],
      presetCombos: [],
      services: [],
    };
    snap.capabilities.push(cap);
  }

  cap.businessTypeIds = [...input.businessTypeIds];
  cap.productLineIds = [...input.productLineIds];
  cap.presetCombos = input.businessTypeIds.flatMap((bt) =>
    input.productLineIds.map((pl) => ({
      businessTypeId: bt,
      productLineId: pl,
      version: 1,
    })),
  );

  if (input.includedSelection && input.paidSelection) {
    cap.services = serviceSelectionsToSubscriptions(input.includedSelection, input.paidSelection);
  } else if (input.services?.length) {
    cap.services = input.services.map((s) => ({
      serviceId: s.serviceId,
      nodeKey: s.nodeKey ?? s.serviceId,
      enabled: s.enabled,
      billingType: s.billingType,
      storeScope: "all" as const,
    }));
  }

  const includedCount = cap.services.filter((s) => s.enabled && (s.billingType ?? "included") === "included").length;
  const paidCount = cap.services.filter((s) => s.enabled && s.billingType === "paid").length;

  let syncResult: EnterpriseToMerchantSyncResult | undefined;
  if (input.syncToMerchant !== false && cap.presetCombos.length > 0) {
    syncResult = syncMerchantCapabilityPresets(merchantId, input.forceSync ?? false);
    cap.syncedPresetAt = nowIso();
  }

  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (merchant) merchant.updatedAt = nowIso();

  appendChangelog(snap, {
    merchantId,
    action: "capability.update",
    operatorEmail,
    detail: `更新能力与服务（业态 ${input.businessTypeIds.length} · 产线 ${input.productLineIds.length} · 基础服务 ${includedCount} · 增值 ${paidCount}）${
      syncResult ? `；平台预设同步：更新 ${syncResult.updated} · 跳过 ${syncResult.skipped}` : ""
    }`,
  });
  writeSnapshot(snap);
  return { capability: cap, syncResult };
}

export function recordMerchantPresetSyncOnly(
  merchantId: string,
  result: EnterpriseToMerchantSyncResult,
  operatorEmail = DEMO_OPERATOR,
): void {
  const snap = readSnapshot();
  const cap = snap.capabilities.find((c) => c.merchantId === merchantId);
  if (cap) cap.syncedPresetAt = nowIso();
  appendChangelog(snap, {
    merchantId,
    action: "capability.sync",
    operatorEmail,
    detail: `强制重新同步平台预设：更新 ${result.updated} · 跳过 ${result.skipped}`,
  });
  writeSnapshot(snap);
}

export function buildOnboardingInvitePreview(merchant: EnterpriseMerchant): string {
  const loginUrl = `${location.origin}${location.pathname}#/onboarding`;
  return [
    `收件人：${merchant.primaryAdminEmail ?? "—"}`,
    `主题：【MenuSifu】${merchant.name} 品牌开通邀请`,
    "",
    `您好 ${merchant.contactName ?? ""}，`,
    "",
    `企业运营已为「${merchant.name}」创建品牌账号，请使用企业邮箱登录并完成业态产线引导：`,
    loginUrl,
    "",
    `品牌编码：${merchant.code}`,
    `时区：${merchant.timezone}`,
    "",
    "— MenuSifu Enterprise",
  ].join("\n");
}

export function sendOnboardingInvite(merchantId: string, operatorEmail = DEMO_OPERATOR): string | null {
  const snap = readSnapshot();
  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (!merchant) return null;
  if (merchant.status !== "onboarding" && merchant.status !== "draft") return null;
  merchant.onboardingInviteSentAt = nowIso();
  merchant.updatedAt = nowIso();
  const preview = buildOnboardingInvitePreview(merchant);
  appendChangelog(snap, {
    merchantId,
    action: "onboarding.invite",
    operatorEmail,
    detail: `发送 onboarding 邀请邮件至 ${merchant.primaryAdminEmail ?? "—"}`,
  });
  writeSnapshot(snap);
  return preview;
}

export function completeMerchantOnboarding(merchantId: string, operatorEmail = DEMO_OPERATOR): EnterpriseMerchant | null {
  const snap = readSnapshot();
  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (!merchant || merchant.status !== "onboarding") return null;
  merchant.status = "active";
  merchant.onboardingCompletedAt = nowIso();
  merchant.updatedAt = nowIso();
  if (!merchant.activatedAt) merchant.activatedAt = nowIso();
  if (merchant.primaryAdminEmail) markPlatformPresetOnboardingComplete(merchant.primaryAdminEmail);
  syncMerchantCapabilityPresets(merchantId, false);
  const cap = snap.capabilities.find((c) => c.merchantId === merchantId);
  if (cap) cap.syncedPresetAt = nowIso();
  appendChangelog(snap, {
    merchantId,
    action: "onboarding.complete",
    operatorEmail,
    detail: "M 平台代完成 onboarding，品牌变更为在营",
  });
  writeSnapshot(snap);
  return merchant;
}

export function getClosingDaysRemaining(merchant: EnterpriseMerchant): number | null {
  if (merchant.status !== "closing" || !merchant.closingEndsAt) return null;
  const ms = new Date(merchant.closingEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function initiateMerchantClosing(merchantId: string, operatorEmail = DEMO_OPERATOR): EnterpriseMerchant | null {
  const snap = readSnapshot();
  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (!merchant || (merchant.status !== "active" && merchant.status !== "suspended")) return null;
  const started = nowIso();
  merchant.status = "closing";
  merchant.closingStartedAt = started;
  merchant.closingEndsAt = addDaysIso(new Date(), CLOSING_COOLDOWN_DAYS);
  merchant.updatedAt = nowIso();
  appendChangelog(snap, {
    merchantId,
    action: "status.closing",
    operatorEmail,
    detail: `发起关闭流程，${CLOSING_COOLDOWN_DAYS} 天冷静期至 ${new Date(merchant.closingEndsAt).toLocaleDateString("zh-CN")}`,
  });
  writeSnapshot(snap);
  return merchant;
}

export function cancelMerchantClosing(merchantId: string, operatorEmail = DEMO_OPERATOR): EnterpriseMerchant | null {
  const snap = readSnapshot();
  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (!merchant || merchant.status !== "closing") return null;
  merchant.status = "active";
  merchant.closingStartedAt = undefined;
  merchant.closingEndsAt = undefined;
  merchant.updatedAt = nowIso();
  appendChangelog(snap, {
    merchantId,
    action: "status.closing.cancel",
    operatorEmail,
    detail: "取消关闭流程，恢复在营",
  });
  writeSnapshot(snap);
  return merchant;
}

export function finalizeMerchantClosing(merchantId: string, operatorEmail = DEMO_OPERATOR): EnterpriseMerchant | null {
  const snap = readSnapshot();
  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (!merchant || (merchant.status !== "closing" && merchant.status !== "suspended")) return null;
  merchant.status = "closed";
  merchant.closedAt = nowIso();
  merchant.closingStartedAt = undefined;
  merchant.closingEndsAt = undefined;
  merchant.updatedAt = nowIso();
  appendChangelog(snap, {
    merchantId,
    action: "status.closed",
    operatorEmail,
    detail: operatorEmail === "system@menusifu.cn" ? "冷静期结束，品牌已归档关闭" : "品牌已关闭并归档",
  });
  writeSnapshot(snap);
  return merchant;
}

export function getProvisioningRequests(status?: MerchantProvisioningRequest["status"]): MerchantProvisioningRequest[] {
  const eid = activeEnterpriseId();
  const requests = readSnapshot().requests.filter((r) => r.enterpriseId === eid);
  if (!status) return [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return requests.filter((r) => r.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function submitProvisioningRequest(
  input: SubmitProvisioningRequestInput,
  applicantEmail = DEMO_OPERATOR,
): MerchantProvisioningRequest {
  const snap = readSnapshot();
  const request: MerchantProvisioningRequest = {
    requestId: genId("mreq"),
    enterpriseId: activeEnterpriseId(),
    merchantName: input.merchantName.trim(),
    orgType: input.orgType,
    contactName: input.contactName.trim(),
    contactPhone: input.contactPhone?.trim(),
    primaryAdminEmail: input.primaryAdminEmail.trim(),
    applicantEmail: input.applicantEmail.trim() || applicantEmail,
    applicantOrg: input.applicantOrg?.trim(),
    notes: input.notes?.trim(),
    status: "pending",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  snap.requests.unshift(request);
  appendChangelog(snap, {
    merchantId: "enterprise",
    action: "request.submit",
    operatorEmail: request.applicantEmail,
    detail: `提交开通申请：${request.merchantName}`,
  });
  writeSnapshot(snap);
  return request;
}

export function approveProvisioningRequest(requestId: string, operatorEmail = DEMO_OPERATOR): EnterpriseMerchant | null {
  const snap = readSnapshot();
  const request = snap.requests.find((r) => r.requestId === requestId);
  if (!request || request.status !== "pending") return null;
  const merchant = createMerchant(
    {
      name: request.merchantName,
      code: slugCode(request.merchantName),
      groupId: ensureDefaultGroupForEnterprise(snap, request.enterpriseId).groupId,
      orgType: request.orgType,
      timezone: "Asia/Shanghai",
      contactName: request.contactName,
      contactPhone: request.contactPhone,
      primaryAdminEmail: request.primaryAdminEmail,
      businessTypeIds: ["hotpot"],
      productLineIds: ["pos"],
      firstStoreName: request.orgType === "single-store" ? `${request.merchantName} · 总店` : undefined,
      sendInviteEmail: true,
    },
    operatorEmail,
  );
  const refreshed = readSnapshot();
  const req = refreshed.requests.find((r) => r.requestId === requestId);
  if (req) {
    req.status = "approved";
    req.updatedAt = nowIso();
    req.resolvedAt = nowIso();
    req.resolvedBy = operatorEmail;
    req.createdMerchantId = merchant.merchantId;
    writeSnapshot(refreshed);
  }
  return merchant;
}

export function rejectProvisioningRequest(
  requestId: string,
  reason: string,
  operatorEmail = DEMO_OPERATOR,
): MerchantProvisioningRequest | null {
  const snap = readSnapshot();
  const request = snap.requests.find((r) => r.requestId === requestId);
  if (!request || request.status !== "pending") return null;
  request.status = "rejected";
  request.rejectReason = reason.trim() || "未说明原因";
  request.updatedAt = nowIso();
  request.resolvedAt = nowIso();
  request.resolvedBy = operatorEmail;
  appendChangelog(snap, {
    merchantId: "enterprise",
    action: "request.reject",
    operatorEmail,
    detail: `驳回开通申请「${request.merchantName}」：${request.rejectReason}`,
  });
  writeSnapshot(snap);
  return request;
}

export function getPosStoreRequests(status?: PosStoreProvisioningRequest["status"]): PosStoreProvisioningRequest[] {
  const eid = activeEnterpriseId();
  const requests = readSnapshot().posStoreRequests.filter((r) => r.enterpriseId === eid);
  if (!status) return [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return requests.filter((r) => r.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function submitPosStoreRequest(
  input: SubmitPosStoreRequestInput,
  operatorEmail = DEMO_OPERATOR,
): PosStoreProvisioningRequest {
  const snap = readSnapshot();
  const request: PosStoreProvisioningRequest = {
    requestId: genId("pos-req"),
    enterpriseId: activeEnterpriseId(),
    brandName: input.brandName?.trim(),
    storeName: input.storeName.trim(),
    address: input.address?.trim(),
    contactName: input.contactName?.trim(),
    contactPhone: input.contactPhone?.trim(),
    posDeviceId: input.posDeviceId?.trim(),
    posLocation: input.posLocation?.trim(),
    applicantNote: input.applicantNote?.trim(),
    status: "pending",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  snap.posStoreRequests.unshift(request);
  appendChangelog(snap, {
    merchantId: "enterprise",
    action: "pos-store.submit",
    operatorEmail,
    detail: `本地 POS 提交门店申请：${request.storeName}`,
  });
  writeSnapshot(snap);
  return request;
}

export function approvePosStoreRequest(requestId: string, operatorEmail = DEMO_OPERATOR): EnterpriseMerchant | null {
  const snap = readSnapshot();
  const request = snap.posStoreRequests.find((r) => r.requestId === requestId);
  if (!request || request.status !== "pending") return null;
  const bid = generateNextBid(snap);
  writeSnapshot(snap);
  const merchant = createMerchant(
    {
      name: request.brandName?.trim() || request.storeName,
      code: slugCode(request.brandName?.trim() || request.storeName),
      groupId: ensureDefaultGroupForEnterprise(snap, request.enterpriseId).groupId,
      orgType: "single-store",
      timezone: "Asia/Shanghai",
      contactName: request.contactName ?? "门店管理员",
      contactPhone: request.contactPhone,
      primaryAdminEmail: `${slugCode(request.storeName)}.admin@pos.menusifu.cn`,
      businessTypeIds: ["full-service"],
      productLineIds: ["pos"],
      bid,
      firstStoreAddress: request.address,
      activateImmediately: true,
      sendInviteEmail: false,
    },
    operatorEmail,
  );
  const refreshed = readSnapshot();
  const linked = refreshed.merchants.find((m) => m.merchantId === merchant.merchantId);
  if (linked) linked.address = request.address;
  const req = refreshed.posStoreRequests.find((r) => r.requestId === requestId);
  if (req) {
    req.status = "approved";
    req.updatedAt = nowIso();
    req.resolvedAt = nowIso();
    req.resolvedBy = operatorEmail;
    req.createdBid = bid;
    req.createdMerchantId = merchant.merchantId;
  }
  appendChangelog(refreshed, {
    merchantId: merchant.merchantId,
    action: "pos-store.approve",
    operatorEmail,
    detail: `POS 门店申请通过，分配 BID ${bid}`,
  });
  writeSnapshot(refreshed);
  return merchant;
}

export function rejectPosStoreRequest(
  requestId: string,
  reason: string,
  operatorEmail = DEMO_OPERATOR,
): PosStoreProvisioningRequest | null {
  const snap = readSnapshot();
  const request = snap.posStoreRequests.find((r) => r.requestId === requestId);
  if (!request || request.status !== "pending") return null;
  request.status = "rejected";
  request.rejectReason = reason.trim() || "未说明原因";
  request.updatedAt = nowIso();
  request.resolvedAt = nowIso();
  request.resolvedBy = operatorEmail;
  appendChangelog(snap, {
    merchantId: "enterprise",
    action: "pos-store.reject",
    operatorEmail,
    detail: `驳回 POS 门店申请「${request.storeName}」：${request.rejectReason}`,
  });
  writeSnapshot(snap);
  return request;
}

export function getMerchantByBid(bid: string): EnterpriseMerchant | undefined {
  const normalized = normalizeBid(bid);
  return readSnapshot().merchants.find((m) => m.bid && normalizeBid(m.bid) === normalized);
}

/** @deprecated 使用 getMerchantByBid */
export const getMerchantByMid = getMerchantByBid;

export function getMerchantTodos(): MerchantTodoItem[] {
  const snap = readSnapshot();
  const eid = activeEnterpriseId();
  const merchants = snap.merchants.filter((m) => m.enterpriseId === eid);
  const todos: MerchantTodoItem[] = [];
  for (const request of snap.requests.filter((r) => r.status === "pending" && r.enterpriseId === eid)) {
    todos.push({
      id: `todo-req-${request.requestId}`,
      kind: "request",
      title: `待审核开通申请：${request.merchantName}`,
      detail: `${request.applicantOrg ?? request.applicantEmail} · ${request.orgType === "chain" ? "连锁" : "单店"}`,
      href: "/m-platform/merchants/requests",
      requestId: request.requestId,
      priority: "high",
      at: request.createdAt,
    });
  }
  for (const request of snap.posStoreRequests.filter((r) => r.status === "pending" && r.enterpriseId === eid)) {
    todos.push({
      id: `todo-pos-${request.requestId}`,
      kind: "request",
      title: `待审核 POS 门店：${request.storeName}`,
      detail: `${request.posDeviceId ?? "本地 POS"} · ${request.address ?? "—"}`,
      href: "/m-platform/merchants/requests",
      requestId: request.requestId,
      priority: "high",
      at: request.createdAt,
    });
  }
  for (const merchant of merchants) {
    if (merchant.status === "onboarding" || merchant.status === "draft") {
      todos.push({
        id: `todo-ob-${merchant.merchantId}`,
        kind: "onboarding",
        title: `onboarding 未完成：${merchant.name}`,
        detail: merchant.onboardingInviteSentAt
          ? `已发邀请 · ${merchant.primaryAdminEmail ?? "—"}`
          : `待发送邀请 · ${merchant.primaryAdminEmail ?? "—"}`,
        href: `/m-platform/merchants/${encodeURIComponent(merchant.merchantId)}`,
        merchantId: merchant.merchantId,
        priority: "normal",
        at: merchant.updatedAt,
      });
    }
    if (merchant.contractExpiresAt) {
      const exp = new Date(merchant.contractExpiresAt).getTime();
      const in30 = Date.now() + 30 * 24 * 60 * 60 * 1000;
      if (exp > Date.now() && exp <= in30) {
        todos.push({
          id: `todo-contract-${merchant.merchantId}`,
          kind: "contract",
          title: `合同即将到期：${merchant.name}`,
          detail: `到期日 ${new Date(merchant.contractExpiresAt).toLocaleDateString("zh-CN")}`,
          href: `/m-platform/merchants/${encodeURIComponent(merchant.merchantId)}`,
          merchantId: merchant.merchantId,
          priority: "normal",
          at: merchant.contractExpiresAt,
        });
      }
    }
    if (merchant.status === "closing") {
      const days = getClosingDaysRemaining(merchant);
      todos.push({
        id: `todo-closing-${merchant.merchantId}`,
        kind: "closing",
        title: `关闭冷静期中：${merchant.name}`,
        detail: days !== null ? `剩余约 ${days} 天` : "等待归档",
        href: `/m-platform/merchants/${encodeURIComponent(merchant.merchantId)}`,
        merchantId: merchant.merchantId,
        priority: "high",
        at: merchant.closingEndsAt,
      });
    }
    if (
      merchant.status === "suspended" &&
      merchant.suspendedReason?.includes("License")
    ) {
      todos.push({
        id: `todo-license-${merchant.merchantId}`,
        kind: "license",
        title: `License 已暂停：${merchant.name}`,
        detail: merchant.contractExpiresAt
          ? `合同已于 ${new Date(merchant.contractExpiresAt).toLocaleDateString("zh-CN")} 到期`
          : "合同已到期",
        href: `/m-platform/merchants/${encodeURIComponent(merchant.merchantId)}`,
        merchantId: merchant.merchantId,
        priority: "high",
        at: merchant.contractExpiresAt,
      });
    }
  }
  return todos.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
    return (b.at ?? "").localeCompare(a.at ?? "");
  });
}

export function appendImpersonationLogStart(session: {
  sessionId: string;
  merchantId: string;
  merchantName: string;
  operatorEmail: string;
}): void {
  const snap = readSnapshot();
  const log: MerchantImpersonationLog = {
    id: session.sessionId,
    merchantId: session.merchantId,
    merchantName: session.merchantName,
    operatorEmail: session.operatorEmail,
    startedAt: nowIso(),
  };
  snap.impersonationLogs.unshift(log);
  appendChangelog(snap, {
    merchantId: session.merchantId,
    action: "impersonate.start",
    operatorEmail: session.operatorEmail,
    detail: `代登录商家后台（会话 ${session.sessionId}）`,
  });
  writeSnapshot(snap);
}

export function appendImpersonationLogEnd(sessionId: string, reason: "manual" | "timeout"): void {
  const snap = readSnapshot();
  const log = snap.impersonationLogs.find((l) => l.id === sessionId);
  if (log) {
    log.endedAt = nowIso();
    log.endedReason = reason;
    appendChangelog(snap, {
      merchantId: log.merchantId,
      action: "impersonate.end",
      operatorEmail: log.operatorEmail,
      detail: `退出代管（${reason === "manual" ? "手动" : "超时"}）`,
    });
    writeSnapshot(snap);
  }
}

export function getImpersonationLogs(merchantId?: string): MerchantImpersonationLog[] {
  const logs = readSnapshot().impersonationLogs;
  if (!merchantId) return logs;
  return logs.filter((l) => l.merchantId === merchantId);
}

export function getLicenseStatusLabel(status?: MerchantLicenseStatus): string {
  const map: Record<MerchantLicenseStatus, string> = {
    active: "有效",
    expiring: "即将到期",
    expired: "已到期",
    suspended: "已暂停（License）",
  };
  return status ? (map[status] ?? status) : "—";
}

export function getContractStatusLabel(status?: CrmContractStatus): string {
  const map: Record<CrmContractStatus, string> = {
    draft: "草稿",
    signed: "已签约",
    active: "执行中",
    renewal: "续签中",
    expired: "已过期",
  };
  return status ? (map[status] ?? status) : "—";
}

export function licenseStatusBadgeClass(status?: MerchantLicenseStatus): string {
  if (status === "expired" || status === "suspended") return "bg-destructive/15 text-destructive";
  if (status === "expiring") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
}

const CRM_MOCK_UPDATES: Record<
  string,
  { contractExpiresAt: string; contractStatus: CrmContractStatus; crmContractId: string; crmAccountId: string }
> = {
  "merchant-zhangji": {
    contractExpiresAt: "2028-06-30",
    contractStatus: "active",
    crmContractId: "CRM-MJ-2025-001-R1",
    crmAccountId: "ACC-ZHANGJI",
  },
  "merchant-tea-one": {
    contractExpiresAt: "2027-06-30",
    contractStatus: "active",
    crmContractId: "CRM-MJ-2026-014-R1",
    crmAccountId: "ACC-TEA-ONE",
  },
  "merchant-sakura-sushi": {
    contractExpiresAt: "2027-06-30",
    contractStatus: "renewal",
    crmContractId: "SF-2024-8891-R1",
    crmAccountId: "ACC-SAKURA",
  },
};

export function syncMerchantFromCrm(merchantId: string, operatorEmail = DEMO_OPERATOR): EnterpriseMerchant | null {
  const snap = readSnapshot();
  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (!merchant) return null;
  const mock = CRM_MOCK_UPDATES[merchantId] ?? {
    contractExpiresAt: merchant.contractExpiresAt ?? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    contractStatus: "active" as CrmContractStatus,
    crmContractId: merchant.crmContractId ?? `CRM-${merchant.code.toUpperCase()}`,
    crmAccountId: merchant.crmAccountId ?? `ACC-${merchant.code.toUpperCase()}`,
  };
  merchant.crmContractId = mock.crmContractId;
  merchant.crmAccountId = mock.crmAccountId;
  merchant.contractExpiresAt = mock.contractExpiresAt;
  merchant.contractStatus = mock.contractStatus;
  merchant.crmLastSyncedAt = nowIso();
  merchant.licenseStatus = computeLicenseStatus(merchant);
  merchant.updatedAt = nowIso();
  appendChangelog(snap, {
    merchantId,
    action: "crm.sync",
    operatorEmail,
    detail: `从 CRM 同步合同 ${mock.crmContractId}，到期 ${mock.contractExpiresAt}`,
  });
  writeSnapshot(snap);
  return merchant;
}

export function renewMerchantContract(
  merchantId: string,
  input: RenewMerchantContractInput,
  operatorEmail = DEMO_OPERATOR,
): EnterpriseMerchant | null {
  const snap = readSnapshot();
  const merchant = snap.merchants.find((m) => m.merchantId === merchantId);
  if (!merchant) return null;
  merchant.contractExpiresAt = input.contractExpiresAt;
  if (input.crmContractId) merchant.crmContractId = input.crmContractId;
  if (input.contractStatus) merchant.contractStatus = input.contractStatus;
  else merchant.contractStatus = "active";
  merchant.crmLastSyncedAt = nowIso();
  merchant.licenseStatus = computeLicenseStatus(merchant);
  if (input.restoreActive !== false && merchant.status === "suspended" && merchant.suspendedReason?.includes("License")) {
    merchant.status = "active";
    merchant.suspendedReason = undefined;
  }
  merchant.updatedAt = nowIso();
  appendChangelog(snap, {
    merchantId,
    action: "crm.renew",
    operatorEmail,
    detail: `合同续期至 ${input.contractExpiresAt}`,
  });
  writeSnapshot(snap);
  return merchant;
}

export function getMerchantSlaMetrics(): MerchantSlaMetrics[] {
  const snap = readSnapshot();
  const ids = merchantIdsForEnterprise(snap, activeEnterpriseId());
  return snap.slaMetrics.filter((s) => ids.has(s.merchantId));
}

export function getMerchantReportSummary(): MerchantReportSummary {
  const merchants = getMerchants();
  const sla = getMerchantSlaMetrics();
  enrichLicenseFields(readSnapshot());
  return {
    merchantCount: merchants.length,
    activeCount: merchants.filter((m) => m.status === "active").length,
    avgUptimePct: sla.length ? sla.reduce((sum, s) => sum + s.uptimePct, 0) / sla.length : 0,
    openTickets: sla.reduce((sum, s) => sum + s.openTickets, 0),
    p1Tickets: sla.reduce((sum, s) => sum + s.p1Tickets, 0),
    licenseExpiredCount: merchants.filter((m) => m.licenseStatus === "expired" || m.licenseStatus === "suspended").length,
    licenseExpiringCount: merchants.filter((m) => m.licenseStatus === "expiring").length,
  };
}

export const MERCHANT_RESERVED_PATH_SEGMENTS = new Set([
  "overview",
  "groups",
  "new",
  "org-tree",
  "stores",
  "change-log",
  "requests",
  "reports",
]);
