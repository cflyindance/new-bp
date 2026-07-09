/**

 * M 平台门店 Scope 元数据（品牌 merchantId / 区域名 / 门店 storeId）

 */

import { LEGACY_STORE_BID_TO_MID } from "../config/enterprise-merchant-bid";

import { getEnterpriseMerchantSnapshot } from "../config/enterprise-merchant-store";

import type { EnterpriseMerchant, EnterpriseMerchantSnapshot, MerchantOrgStore } from "../config/enterprise-merchant-types";

import type { ScopeOption } from "../auth/session-scope";



/** 演示默认单店：张记 · 上海陆家嘴店 */

export const DEFAULT_DEMO_STORE_ID = "M00000001";



/** 演示默认品牌：张记火锅 */

export const DEFAULT_DEMO_BRAND_ID = "merchant-zhangji";



export interface MPlatformStoreScopeEntry {

  storeId: string;

  merchantId: string;

  regionName: string;

  storeName: string;

  groupId: string;

}



/** 旧演示 ID → M 平台 storeId（MID） */

export const LEGACY_STORE_ID_MAP: Record<string, string> = {

  "shanghai-ljz": DEFAULT_DEMO_STORE_ID,

  "guangzhou-tzh": "M00000002",

  "flagship-nyc": "M00000004",

  "branch-la": "M00000004",

  ...LEGACY_STORE_BID_TO_MID,

};



/** 旧演示品牌 ID → M 平台 merchantId */

export const LEGACY_BRAND_ID_MAP: Record<string, string> = {

  miju: DEFAULT_DEMO_BRAND_ID,

  "menusifu-na": "merchant-menusifu-na",

};



/** 旧演示区域 ID → M 平台区域名称 */

export const LEGACY_REGION_ID_MAP: Record<string, string> = {

  "east-cn": "华东大区",

  "south-cn": "华南大区",

  "north-cn": "华北大区",

  "us-east": "美国东海岸",

  "us-west": "美国西海岸",

};



function pushStoreEntry(

  snap: EnterpriseMerchantSnapshot,

  merchant: EnterpriseMerchant,

  store: MerchantOrgStore,

  seen: Set<string>,

  out: MPlatformStoreScopeEntry[],

): void {

  if (seen.has(store.storeId)) return;

  seen.add(store.storeId);

  const region = snap.regions.find((r) => r.regionId === store.regionId);

  out.push({

    storeId: store.storeId,

    merchantId: merchant.merchantId,

    regionName: region?.name ?? "",

    storeName: store.name,

    groupId: merchant.groupId ?? "",

  });

}



function collectStoreEntriesFromSnapshot(snap: EnterpriseMerchantSnapshot): MPlatformStoreScopeEntry[] {

  const out: MPlatformStoreScopeEntry[] = [];

  const seen = new Set<string>();



  for (const merchant of snap.merchants) {

    if (!merchant.groupId) continue;



    for (const store of snap.stores) {

      if (store.linkedMerchantId === merchant.merchantId) {

        pushStoreEntry(snap, merchant, store, seen, out);

      }

    }



    if (merchant.orgType === "chain") {

      for (const store of snap.stores) {

        if (store.merchantId === merchant.merchantId) {

          pushStoreEntry(snap, merchant, store, seen, out);

        }

      }

    }

  }



  return out.sort((a, b) => a.storeName.localeCompare(b.storeName, "zh-CN"));

}



let cachedEntries: MPlatformStoreScopeEntry[] | null = null;



export function listMPlatformStoreScopeEntries(): MPlatformStoreScopeEntry[] {

  if (!cachedEntries) {

    cachedEntries = collectStoreEntriesFromSnapshot(getEnterpriseMerchantSnapshot());

  }

  return [...cachedEntries];

}



export function invalidateMPlatformStoreScopeCache(): void {

  cachedEntries = null;

}



export function getMPlatformStoreScopeMeta(

  storeId: string,

): { brand: string; region: string; name: string } | undefined {

  const normalized = migrateLegacyStoreId(storeId);

  const entry = listMPlatformStoreScopeEntries().find((e) => e.storeId === normalized);

  if (!entry) return undefined;

  return { brand: entry.merchantId, region: entry.regionName, name: entry.storeName };

}



export function migrateLegacyStoreId(storeId: string): string {

  return LEGACY_STORE_ID_MAP[storeId] ?? storeId;

}



export function migrateLegacyBrandId(brandId: string): string {

  return LEGACY_BRAND_ID_MAP[brandId] ?? brandId;

}



export function migrateLegacyRegionId(regionId: string): string {

  return LEGACY_REGION_ID_MAP[regionId] ?? regionId;

}



export function buildDemoScopeStoreOptions(): ScopeOption[] {

  const entries = listMPlatformStoreScopeEntries();

  if (!entries.length) {

    return [

      { value: DEFAULT_DEMO_STORE_ID, labelZh: "上海陆家嘴店", labelEn: "Shanghai Lujiazui" },

    ];

  }

  return entries.map((e) => ({ value: e.storeId, labelZh: e.storeName, labelEn: e.storeName }));

}



export function findDemoScopeStoreLabel(storeId: string, locale: "zh" | "en" = "zh"): string {

  const normalized = migrateLegacyStoreId(storeId);

  const opt = buildDemoScopeStoreOptions().find((o) => o.value === normalized);

  if (!opt) return normalized;

  return locale === "en" ? opt.labelEn : opt.labelZh;

}

if (typeof window !== "undefined") {
  window.addEventListener("menusifu:enterprise-merchant-snapshot-changed", () => {
    cachedEntries = null;
  });
}


