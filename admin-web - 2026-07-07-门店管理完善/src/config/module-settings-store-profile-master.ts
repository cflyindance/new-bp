/**
 * 门店管理 · 餐馆基本信息只读主数据（seq 417 平台同步字段）。
 */
import { readChainAnchorStoreId } from "../auth/merchant-scope-context";
import { getEnterpriseMerchantSnapshot } from "./enterprise-merchant-store";
import type { EnterpriseMerchantSnapshot, MerchantOrgStore } from "./enterprise-merchant-types";
import { loadChainBrandOrgForContext, resolveChainBrandContext } from "./merchant-chain-brand-sync";

export interface StoreBasicProfileMaster {
  restaurantName: string;
  merchantNo: string;
  phone1: string;
  phone2: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  zip: string;
  versionCert: string;
  dealer: string;
  region: string;
}

type AddressParts = Pick<
  StoreBasicProfileMaster,
  "addressLine1" | "addressLine2" | "city" | "stateProvince" | "zip"
>;

const DEMO_ADDRESS_BY_STORE_ID: Record<string, AddressParts> = {
  M00000001: {
    addressLine1: "陆家嘴环路 88 号",
    addressLine2: "国金中心 L2",
    city: "上海",
    stateProvince: "上海市",
    zip: "200120",
  },
  M00000002: {
    addressLine1: "体育西路 189 号",
    addressLine2: "",
    city: "广州",
    stateProvince: "广东省",
    zip: "510620",
  },
  M00000003: {
    addressLine1: "文三路 478 号",
    addressLine2: "",
    city: "杭州",
    stateProvince: "浙江省",
    zip: "310012",
  },
  M00000004: {
    addressLine1: "123 Broadway",
    addressLine2: "Suite 400",
    city: "New York",
    stateProvince: "NY",
    zip: "10006",
  },
  M00000005: {
    addressLine1: "岳麓大道 58 号",
    addressLine2: "",
    city: "长沙",
    stateProvince: "湖南省",
    zip: "410013",
  },
  M00000006: {
    addressLine1: "Sunset Blvd 1200",
    addressLine2: "",
    city: "Los Angeles",
    stateProvince: "CA",
    zip: "90026",
  },
  M00000007: {
    addressLine1: "Michigan Ave 233",
    addressLine2: "",
    city: "Chicago",
    stateProvince: "IL",
    zip: "60601",
  },
};

const FALLBACK_MASTER: StoreBasicProfileMaster = {
  restaurantName: "演示餐馆",
  merchantNo: "M00000000",
  phone1: "400-000-0000",
  phone2: "",
  addressLine1: "示例路 1 号",
  addressLine2: "",
  city: "上海",
  stateProvince: "上海市",
  zip: "200000",
  versionCert: "POS v12.4 · License Active",
  dealer: "MenuSifu",
  region: "华东大区",
};

function resolveActiveStoreId(snap: EnterpriseMerchantSnapshot): string | null {
  const anchorStoreId = readChainAnchorStoreId();
  if (anchorStoreId && snap.stores.some((s) => s.storeId === anchorStoreId)) {
    return anchorStoreId;
  }

  const org = loadChainBrandOrgForContext();
  const ctx = resolveChainBrandContext();
  if (org && ctx) {
    const brand =
      org.brands.find((b) => b.merchantId === ctx.anchorMerchantId) ?? org.brands[0];
    const storeView = brand?.stores[0];
    if (storeView && snap.stores.some((s) => s.storeId === storeView.storeId)) {
      return storeView.storeId;
    }
  }

  return snap.stores[0]?.storeId ?? null;
}

function resolveAddressParts(store: MerchantOrgStore): AddressParts {
  const preset = DEMO_ADDRESS_BY_STORE_ID[store.storeId];
  if (preset) return preset;

  const raw = (store.address ?? "").trim();
  if (!raw) {
    return {
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateProvince: "",
      zip: "",
    };
  }

  const usMatch = raw.match(/^(.+),\s*([A-Z]{2})$/);
  if (usMatch) {
    return {
      addressLine1: raw,
      addressLine2: "",
      city: usMatch[1]!.trim(),
      stateProvince: usMatch[2]!.trim(),
      zip: "",
    };
  }

  return {
    addressLine1: raw,
    addressLine2: "",
    city: "",
    stateProvince: "",
    zip: "",
  };
}

function resolveContactPhones(
  snap: EnterpriseMerchantSnapshot,
  store: MerchantOrgStore,
): { phone1: string; phone2: string } {
  const linked = snap.merchants.find((m) => m.merchantId === store.linkedMerchantId);
  const host = snap.merchants.find((m) => m.merchantId === store.merchantId);
  const phone1 = linked?.contactPhone ?? host?.contactPhone ?? "";
  return { phone1, phone2: "" };
}

function buildMasterFromStore(
  snap: EnterpriseMerchantSnapshot,
  store: MerchantOrgStore,
): StoreBasicProfileMaster {
  const linked = snap.merchants.find((m) => m.merchantId === store.linkedMerchantId);
  const region = snap.regions.find((r) => r.regionId === store.regionId);
  const enterprise = snap.enterprises.find((e) => e.enterpriseId === linked?.enterpriseId);
  const address = resolveAddressParts(store);
  const phones = resolveContactPhones(snap, store);
  const merchantNo = store.storeId;
  const license = linked?.licenseStatus === "active" ? "License Active" : "License Demo";
  const versionCert = `${linked?.bid ?? store.storeId} · POS v12.4 · ${license}`;

  return {
    restaurantName: linked?.name ?? store.name,
    merchantNo,
    phone1: phones.phone1,
    phone2: phones.phone2,
    ...address,
    versionCert,
    dealer: enterprise?.name ?? "MenuSifu",
    region: region?.name ?? "",
  };
}

export function resolveStoreBasicProfileMaster(): StoreBasicProfileMaster {
  const snap = getEnterpriseMerchantSnapshot();
  const storeId = resolveActiveStoreId(snap);
  if (!storeId) return { ...FALLBACK_MASTER };

  const store = snap.stores.find((s) => s.storeId === storeId);
  if (!store) return { ...FALLBACK_MASTER };

  return buildMasterFromStore(snap, store);
}

export const STORE_BASIC_PROFILE_MASTER_FIELD_MAP: Record<string, keyof StoreBasicProfileMaster> = {
  "417-restaurant-name": "restaurantName",
  "417-merchant-no": "merchantNo",
  "417-phone-1": "phone1",
  "417-phone-2": "phone2",
  "417-address-line-1": "addressLine1",
  "417-address-line-2": "addressLine2",
  "417-city": "city",
  "417-state-province": "stateProvince",
  "417-zip": "zip",
  "417-version-cert": "versionCert",
  "417-dealer": "dealer",
  "417-region": "region",
};

export function isStoreBasicProfileReadOnlyFieldId(fieldId: string): boolean {
  return fieldId in STORE_BASIC_PROFILE_MASTER_FIELD_MAP;
}

export function readStoreBasicProfileMasterField(fieldId: string): string {
  const key = STORE_BASIC_PROFILE_MASTER_FIELD_MAP[fieldId];
  if (!key) return "";
  return resolveStoreBasicProfileMaster()[key];
}
