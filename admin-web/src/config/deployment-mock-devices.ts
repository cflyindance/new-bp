/**
 * 模拟下发 · 演示门店与设备清单
 */
import { readScopeFilters } from "../auth/session-scope";
import { resolveChainDataPerspective } from "../auth/merchant-scope-context";
import { readChainAnchorBrandId, readChainAnchorStoreId } from "../auth/merchant-scope-context";
import { DEFAULT_DEMO_STORE_ID, buildDemoScopeStoreOptions } from "../permissions/m-platform-store-scope";
import { loadChainBrandOrgForContext } from "./merchant-chain-brand-sync";
import type { DeploymentScopeLevel, DeploymentScopeOption } from "./deployment-types";

export interface MockStoreRef {
  storeId: string;
  storeName: string;
  brandId?: string;
  brandName?: string;
}

export interface MockDeviceRef {
  deviceId: string;
  deviceName: string;
  productLine: string;
  storeId: string;
}

function demoStoreName(storeId: string): string {
  const opt = buildDemoScopeStoreOptions().find((o) => o.value === storeId);
  return opt?.labelZh ?? storeId;
}

export function listAllMockStores(): MockStoreRef[] {
  const snapshot = loadChainBrandOrgForContext();
  if (snapshot) {
    const out: MockStoreRef[] = [];
    for (const brand of snapshot.brands) {
      for (const store of brand.stores) {
        out.push({
          storeId: store.storeId,
          storeName: store.name,
          brandId: brand.merchantId,
          brandName: brand.name,
        });
      }
    }
    if (out.length > 0) return out;
  }
  return buildDemoScopeStoreOptions()
    .filter((o) => o.value)
    .map((o) => ({
      storeId: o.value,
      storeName: o.labelZh,
    }));
}

export function listMockStoresByIds(storeIds: string[]): MockStoreRef[] {
  const all = listAllMockStores();
  const set = new Set(storeIds);
  return all.filter((s) => set.has(s.storeId));
}

export function resolveCurrentAnchorStore(): MockStoreRef {
  const anchorId = readChainAnchorStoreId() || readScopeFilters().store || DEFAULT_DEMO_STORE_ID;
  const found = listAllMockStores().find((s) => s.storeId === anchorId);
  if (found) return found;
  return {
    storeId: anchorId || DEFAULT_DEMO_STORE_ID,
    storeName: demoStoreName(anchorId || DEFAULT_DEMO_STORE_ID),
  };
}

export function resolveCurrentBrandStores(): MockStoreRef[] {
  const snapshot = loadChainBrandOrgForContext();
  const brandId = readChainAnchorBrandId() || readScopeFilters().brand;
  if (snapshot && brandId) {
    const brand = snapshot.brands.find((b) => b.merchantId === brandId);
    if (brand) {
      return brand.stores.map((s) => ({
        storeId: s.storeId,
        storeName: s.name,
        brandId: brand.merchantId,
        brandName: brand.name,
      }));
    }
  }
  const current = resolveCurrentAnchorStore();
  return [current];
}

export function resolveDeploymentScopeOptions(): DeploymentScopeOption[] {
  const perspective = resolveChainDataPerspective();
  const current = resolveCurrentAnchorStore();
  const brandStores = resolveCurrentBrandStores();
  const snapshot = loadChainBrandOrgForContext();
  const brandId = readChainAnchorBrandId() || readScopeFilters().brand || snapshot?.brands[0]?.merchantId;
  const brandName =
    snapshot?.brands.find((b) => b.merchantId === brandId)?.name ?? brandStores[0]?.brandName;

  const options: DeploymentScopeOption[] = [
    {
      id: "current",
      label: `当前门店：${current.storeName}`,
      storeIds: [current.storeId],
      scopeLevel: "store",
      brandId,
      brandName,
    },
  ];

  if (perspective !== "store" && brandStores.length > 1) {
    options.push({
      id: "brand_all",
      label: `品牌下全部门店（${brandStores.length} 家）`,
      storeIds: brandStores.map((s) => s.storeId),
      scopeLevel: perspective === "group-hq" ? "group" : "brand",
      brandId,
      brandName,
    });
  } else if (perspective === "group-hq") {
    const all = listAllMockStores();
    if (all.length > 1) {
      options.push({
        id: "brand_all",
        label: `集团下全部门店（${all.length} 家）`,
        storeIds: all.map((s) => s.storeId),
        scopeLevel: "group",
        brandId,
        brandName,
      });
    }
  }

  return options;
}

export function listMockDevicesForStore(storeId: string, productLines: string[]): MockDeviceRef[] {
  const store = listAllMockStores().find((s) => s.storeId === storeId);
  const storeName = store?.storeName ?? storeId;
  const devices: MockDeviceRef[] = [];
  const shortName = storeName.replace(/店$/, "").slice(-6);

  for (const line of productLines) {
    if (line === "POS") {
      devices.push({
        deviceId: `${storeId}-pos-01`,
        deviceName: `${shortName}-POS-01`,
        productLine: line,
        storeId,
      });
      if (storeId.charCodeAt(storeId.length - 1) % 2 === 0) {
        devices.push({
          deviceId: `${storeId}-pos-02`,
          deviceName: `${shortName}-POS-02`,
          productLine: line,
          storeId,
        });
      }
    } else if (line === "Kiosk") {
      devices.push({
        deviceId: `${storeId}-kiosk-01`,
        deviceName: `${shortName}-Kiosk-01`,
        productLine: line,
        storeId,
      });
    } else if (line === "eMenu") {
      devices.push({
        deviceId: `${storeId}-emenu-01`,
        deviceName: `${shortName}-eMenu-01`,
        productLine: line,
        storeId,
      });
    } else {
      devices.push({
        deviceId: `${storeId}-${line.toLowerCase()}-01`,
        deviceName: `${shortName}-${line}-01`,
        productLine: line,
        storeId,
      });
    }
  }
  return devices;
}

export function countDevicesForStores(storeIds: string[], productLines: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const line of productLines) counts[line] = 0;
  for (const storeId of storeIds) {
    const devices = listMockDevicesForStore(storeId, productLines);
    for (const d of devices) {
      counts[d.productLine] = (counts[d.productLine] ?? 0) + 1;
    }
  }
  return counts;
}

export function inferScopeLevelFromStoreCount(
  storeCount: number,
  optionLevel: DeploymentScopeLevel,
): DeploymentScopeLevel {
  if (storeCount <= 1) return "store";
  return optionLevel;
}
