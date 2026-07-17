/**
 * 定制化功能 · 与 MerchantCapabilitySnapshot 双向同步（P2）
 */
import type { MerchantCapabilitySnapshot, MerchantServiceSubscription } from "./enterprise-merchant-types";
import { getEnterpriseMerchantSnapshot } from "./enterprise-merchant-store";
import { listCustomFeatureRegistryEntries } from "./feature-registry";
import {
  listWhitelistEntries,
  listWhitelistedMidsForMerchant,
  grantMidsToWhitelist,
  revokeMidsFromWhitelist,
} from "./custom-feature-whitelist-store";
import { readActiveEnterpriseId } from "./enterprise-merchant-enterprise-context";

export const CUSTOM_FEATURE_SERVICE_PREFIX = "custom:";

export function customFeatureServiceId(featureKey: string): string {
  return `${CUSTOM_FEATURE_SERVICE_PREFIX}${featureKey}`;
}

export function parseCustomFeatureServiceId(serviceId: string): string | null {
  if (!serviceId.startsWith(CUSTOM_FEATURE_SERVICE_PREFIX)) return null;
  return serviceId.slice(CUSTOM_FEATURE_SERVICE_PREFIX.length);
}

export function isCustomFeatureServiceId(serviceId: string): boolean {
  return serviceId.startsWith(CUSTOM_FEATURE_SERVICE_PREFIX);
}

function findMerchantIdForMid(mid: string): string | null {
  const snap = getEnterpriseMerchantSnapshot();
  const store = snap.stores.find((s) => s.storeId === mid);
  return store?.merchantId ?? null;
}

/**
 * 将白名单开通状态写入商家能力快照（services）
 * storeScope=stores + scopeIds=mids
 */
export function syncWhitelistToMerchantCapabilities(
  merchantId: string,
  enterpriseId = readActiveEnterpriseId(),
): { updated: number } {
  const snap = getEnterpriseMerchantSnapshot();
  const cap = snap.capabilities.find((c) => c.merchantId === merchantId);
  if (!cap) return { updated: 0 };

  let updated = 0;
  const features = listCustomFeatureRegistryEntries();
  const otherServices = (cap.services ?? []).filter((s) => !isCustomFeatureServiceId(s.serviceId));

  const customServices: MerchantServiceSubscription[] = [];
  for (const f of features) {
    const mids = listWhitelistedMidsForMerchant(f.featureKey, merchantId, enterpriseId);
    if (mids.length === 0) continue;
    customServices.push({
      serviceId: customFeatureServiceId(f.featureKey),
      enabled: true,
      nodeKey: f.navNodeKeys[0],
      billingType: "included",
      storeScope: "stores",
      scopeIds: mids,
    });
    updated += 1;
  }

  cap.services = [...otherServices, ...customServices];
  // 触发持久化：复用 store 写入
  try {
    const raw = localStorage.getItem("menusifu:enterprise-merchants-v1");
    if (raw) {
      const parsed = JSON.parse(raw) as { capabilities?: MerchantCapabilitySnapshot[] };
      const caps = parsed.capabilities ?? [];
      const idx = caps.findIndex((c) => c.merchantId === merchantId);
      if (idx >= 0) {
        caps[idx] = { ...cap, services: [...cap.services] };
        parsed.capabilities = caps;
        localStorage.setItem("menusifu:enterprise-merchants-v1", JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent("menusifu:enterprise-merchant-snapshot-changed"));
      }
    }
  } catch {
    /* ignore */
  }

  return { updated };
}

/**
 * 从能力快照回写白名单（以 services 中 custom:* 为准）
 */
export function syncMerchantCapabilitiesToWhitelist(input: {
  merchantId: string;
  operatorEmail: string;
  enterpriseId?: string;
}): { granted: number; revoked: number; errors: string[] } {
  const enterpriseId = input.enterpriseId ?? readActiveEnterpriseId();
  const snap = getEnterpriseMerchantSnapshot();
  const cap = snap.capabilities.find((c) => c.merchantId === input.merchantId);
  const result = { granted: 0, revoked: 0, errors: [] as string[] };
  if (!cap) {
    result.errors.push("未找到商家能力快照");
    return result;
  }

  for (const f of listCustomFeatureRegistryEntries()) {
    const serviceId = customFeatureServiceId(f.featureKey);
    const svc = (cap.services ?? []).find((s) => s.serviceId === serviceId && s.enabled);
    const desiredMids =
      svc && svc.storeScope === "stores" && Array.isArray(svc.scopeIds)
        ? svc.scopeIds.filter(Boolean)
        : svc && svc.storeScope === "all"
          ? snap.stores.filter((s) => s.merchantId === input.merchantId).map((s) => s.storeId)
          : [];

    const current = new Set(listWhitelistedMidsForMerchant(f.featureKey, input.merchantId, enterpriseId));
    const desired = new Set(desiredMids);

    const toGrant = [...desired].filter((m) => !current.has(m));
    const toRevoke = [...current].filter((m) => !desired.has(m));

    if (toGrant.length) {
      const r = grantMidsToWhitelist({
        featureKey: f.featureKey,
        merchantId: input.merchantId,
        mids: toGrant,
        operatorEmail: input.operatorEmail,
        note: "自能力快照同步",
        enterpriseId,
        skipCapabilitySync: true,
      });
      if (r.ok) result.granted += toGrant.length;
      else result.errors.push(r.error);
    }
    if (toRevoke.length) {
      const r = revokeMidsFromWhitelist({
        featureKey: f.featureKey,
        merchantId: input.merchantId,
        mids: toRevoke,
        operatorEmail: input.operatorEmail,
        enterpriseId,
        skipCapabilitySync: true,
      });
      if (r.ok) result.revoked += toRevoke.length;
      else result.errors.push(r.error);
    }
  }

  return result;
}

export function listCustomFeatureServicesFromCapability(
  merchantId: string,
): Array<{ featureKey: string; mids: string[]; enabled: boolean }> {
  const cap = getEnterpriseMerchantSnapshot().capabilities.find((c) => c.merchantId === merchantId);
  if (!cap) return [];
  const out: Array<{ featureKey: string; mids: string[]; enabled: boolean }> = [];
  for (const s of cap.services ?? []) {
    const key = parseCustomFeatureServiceId(s.serviceId);
    if (!key) continue;
    out.push({
      featureKey: key,
      enabled: s.enabled,
      mids: s.storeScope === "stores" ? [...(s.scopeIds ?? [])] : [],
    });
  }
  return out;
}

export function describeCapabilitySyncStatus(merchantId: string, enterpriseId = readActiveEnterpriseId()): {
  featureKey: string;
  whitelistMids: string[];
  capabilityMids: string[];
  inSync: boolean;
}[] {
  const fromCap = listCustomFeatureServicesFromCapability(merchantId);
  const capMap = new Map(fromCap.map((c) => [c.featureKey, c]));
  return listCustomFeatureRegistryEntries().map((f) => {
    const whitelistMids = listWhitelistedMidsForMerchant(f.featureKey, merchantId, enterpriseId).sort();
    const capabilityMids = [...(capMap.get(f.featureKey)?.mids ?? [])].sort();
    const inSync =
      whitelistMids.length === capabilityMids.length &&
      whitelistMids.every((m, i) => m === capabilityMids[i]);
    return { featureKey: f.featureKey, whitelistMids, capabilityMids, inSync };
  });
}

/** 供调试：根据 MID 反查品牌 */
export function resolveMerchantIdByMid(mid: string): string | null {
  return findMerchantIdForMid(mid);
}

export function listEnterpriseWhitelistOverview(enterpriseId = readActiveEnterpriseId()) {
  void listWhitelistEntries(enterpriseId);
  const snap = getEnterpriseMerchantSnapshot();
  const rows: Array<{
    featureKey: string;
    displayName: string;
    merchantId: string;
    merchantName: string;
    mid: string;
    storeName: string;
  }> = [];

  for (const f of listCustomFeatureRegistryEntries()) {
    const entry = listWhitelistEntries(enterpriseId).find((e) => e.featureKey === f.featureKey);
    if (!entry) continue;
    for (const mid of entry.allowedMids) {
      const store = snap.stores.find((s) => s.storeId === mid);
      if (!store) continue;
      const merchant = snap.merchants.find((m) => m.merchantId === store.merchantId);
      rows.push({
        featureKey: f.featureKey,
        displayName: f.displayName,
        merchantId: store.merchantId,
        merchantName: merchant?.name ?? store.merchantId,
        mid,
        storeName: store.name,
      });
    }
  }
  return rows;
}
