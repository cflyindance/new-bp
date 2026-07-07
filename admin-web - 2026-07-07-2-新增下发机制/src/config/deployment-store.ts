/**
 * 模拟下发 · localStorage 存储
 */
import { getAuthenticatedEmail } from "../auth/login";
import { resolveChainBrandContext } from "./merchant-chain-brand-sync";
import {
  formatDeploymentDomainLabel,
  getDeploymentConfigDomain,
  resolveDomainsForPath,
} from "./deployment-config-domains";
import {
  inferScopeLevelFromStoreCount,
  listMockDevicesForStore,
  listMockStoresByIds,
} from "./deployment-mock-devices";
import { ensureDeploymentSeedData } from "./deployment-seed";
import { startDeploymentSimulation } from "./deployment-simulator";
import type {
  CreateDeploymentInput,
  DeploymentBatch,
  DeploymentItem,
  DeploymentListFilter,
  DeploymentTarget,
  StoreConfigCursor,
} from "./deployment-types";

const BATCHES_KEY = "menusifu:deployment-batches-v1";
const CURSOR_KEY = "menusifu:deployment-cursor-v1";

let memoryBatches: DeploymentBatch[] | null = null;
let memoryCursors: Record<string, StoreConfigCursor> | null = null;

function readBatchesRaw(): DeploymentBatch[] {
  if (memoryBatches) return memoryBatches;
  try {
    const raw = localStorage.getItem(BATCHES_KEY);
    if (!raw) {
      memoryBatches = [];
      return memoryBatches;
    }
    memoryBatches = JSON.parse(raw) as DeploymentBatch[];
    return memoryBatches;
  } catch {
    memoryBatches = [];
    return memoryBatches;
  }
}

function writeBatchesRaw(batches: DeploymentBatch[]): void {
  memoryBatches = batches;
  try {
    localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("menusifu:deployment-updated"));
}

function readCursorsRaw(): Record<string, StoreConfigCursor> {
  if (memoryCursors) return memoryCursors;
  try {
    const raw = localStorage.getItem(CURSOR_KEY);
    memoryCursors = raw ? (JSON.parse(raw) as Record<string, StoreConfigCursor>) : {};
    return memoryCursors;
  } catch {
    memoryCursors = {};
    return memoryCursors;
  }
}

function writeCursorsRaw(cursors: Record<string, StoreConfigCursor>): void {
  memoryCursors = cursors;
  try {
    localStorage.setItem(CURSOR_KEY, JSON.stringify(cursors));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("menusifu:deployment-cursor-changed"));
}

function newId(prefix: string): string {
  const ts = new Date();
  const stamp = [
    ts.getFullYear(),
    String(ts.getMonth() + 1).padStart(2, "0"),
    String(ts.getDate()).padStart(2, "0"),
    String(ts.getHours()).padStart(2, "0"),
    String(ts.getMinutes()).padStart(2, "0"),
    String(ts.getSeconds()).padStart(2, "0"),
  ].join("");
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${stamp}-${rand}`;
}

function rollupBatchCounts(batch: DeploymentBatch): void {
  batch.successCount = batch.items.filter((i) => i.status === "success").length;
  batch.failedCount = batch.items.filter((i) => ["failed", "timeout"].includes(i.status)).length;
  batch.pendingCount = batch.items.filter((i) => ["pending", "pushing"].includes(i.status)).length;
  batch.totalItems = batch.items.length;

  if (batch.pendingCount > 0) {
    if (batch.status !== "pending") batch.status = "in_progress";
  } else if (batch.failedCount === 0) {
    batch.status = "success";
  } else if (batch.successCount === 0) {
    batch.status = "failed";
  } else {
    batch.status = "partial_success";
  }
}

export function ensureDeploymentStoreReady(): void {
  const batches = readBatchesRaw();
  if (batches.length === 0) {
    ensureDeploymentSeedData();
  }
}

export function listDeploymentBatches(filter?: DeploymentListFilter): DeploymentBatch[] {
  ensureDeploymentStoreReady();
  let rows = [...readBatchesRaw()].sort(
    (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime(),
  );
  if (filter?.domainKey) {
    rows = rows.filter((b) =>
      b.items.some((i) => i.domainKey === filter.domainKey) ||
      Object.keys(b.configVersions).includes(filter.domainKey!),
    );
  }
  if (filter?.status) {
    rows = rows.filter((b) => b.status === filter.status);
  }
  if (filter?.storeId) {
    rows = rows.filter((b) => b.storeIds.includes(filter.storeId!));
  }
  if (filter?.keyword?.trim()) {
    const kw = filter.keyword.trim().toLowerCase();
    rows = rows.filter(
      (b) =>
        b.id.toLowerCase().includes(kw) ||
        b.originNav.l2Title.toLowerCase().includes(kw) ||
        b.triggeredBy.toLowerCase().includes(kw) ||
        b.items.some((i) => i.domainDisplayName.toLowerCase().includes(kw)),
    );
  }
  return rows;
}

export function getDeploymentBatch(id: string): DeploymentBatch | undefined {
  ensureDeploymentStoreReady();
  return readBatchesRaw().find((b) => b.id === id);
}

export function saveDeploymentBatch(batch: DeploymentBatch): void {
  const batches = readBatchesRaw();
  const idx = batches.findIndex((b) => b.id === batch.id);
  if (idx >= 0) batches[idx] = batch;
  else batches.unshift(batch);
  writeBatchesRaw(batches);
}

export function getStoreConfigCursor(storeId: string): StoreConfigCursor {
  const all = readCursorsRaw();
  if (!all[storeId]) {
    all[storeId] = { storeId, domains: {} };
    writeCursorsRaw(all);
  }
  return all[storeId];
}

export function bumpCloudVersion(storeId: string, domainKey: string): number {
  const all = readCursorsRaw();
  const cursor = all[storeId] ?? { storeId, domains: {} };
  const cur = cursor.domains[domainKey] ?? { cloudVersion: 0, deployedVersion: 0 };
  cur.cloudVersion += 1;
  cursor.domains[domainKey] = cur;
  all[storeId] = cursor;
  writeCursorsRaw(all);
  return cur.cloudVersion;
}

export function markDomainDeployed(storeId: string, domainKey: string, version: number): void {
  const all = readCursorsRaw();
  const cursor = all[storeId] ?? { storeId, domains: {} };
  const cur = cursor.domains[domainKey] ?? { cloudVersion: version, deployedVersion: 0 };
  cur.deployedVersion = version;
  cur.cloudVersion = Math.max(cur.cloudVersion, version);
  cur.lastDeployedAt = new Date().toISOString();
  cursor.domains[domainKey] = cur;
  all[storeId] = cursor;
  writeCursorsRaw(all);
}

function buildTargets(storeId: string, productLines: string[]): DeploymentTarget[] {
  return listMockDevicesForStore(storeId, productLines).map((d) => ({
    id: newId("TGT"),
    productLine: d.productLine,
    deviceId: d.deviceId,
    deviceName: d.deviceName,
    status: "pending" as const,
  }));
}

export function createDeploymentBatch(input: CreateDeploymentInput): DeploymentBatch {
  ensureDeploymentStoreReady();
  const stores = listMockStoresByIds(input.storeIds);
  const merchantId = resolveChainBrandContext()?.anchorMerchantId ?? "demo-merchant";
  const configVersions: Record<string, number> = {};

  const items: DeploymentItem[] = [];
  for (const store of stores) {
    for (const domainKey of input.domainKeys) {
      const domain = getDeploymentConfigDomain(domainKey);
      if (!domain) continue;
      const version = bumpCloudVersion(store.storeId, domainKey);
      configVersions[domainKey] = version;
      items.push({
        id: newId("ITM"),
        storeId: store.storeId,
        storeName: store.storeName,
        domainKey,
        domainDisplayName: domain.displayName,
        configVersion: version,
        productLines: [...domain.productLines],
        status: "pending",
        retryCount: 0,
        targets: buildTargets(store.storeId, domain.productLines),
      });
    }
  }

  const batch: DeploymentBatch = {
    id: newId("DEP"),
    merchantId,
    isMock: true,
    triggeredBy: getAuthenticatedEmail() ?? "demo@menusifu.com",
    triggeredAt: new Date().toISOString(),
    triggerSource: input.triggerSource ?? "manual",
    scopeLevel: inferScopeLevelFromStoreCount(stores.length, input.scopeLevel),
    brandId: input.brandId,
    brandName: input.brandName,
    storeIds: input.storeIds,
    configVersions,
    originNav: input.originNav,
    status: "pending",
    totalItems: items.length,
    successCount: 0,
    failedCount: 0,
    pendingCount: items.length,
    items,
    simulatorMeta: {
      progressPercent: 0,
      currentPhase: "creating",
    },
  };

  saveDeploymentBatch(batch);
  startDeploymentSimulation(batch.id);
  window.dispatchEvent(
    new CustomEvent("menusifu:deployment-created", { detail: { batchId: batch.id } }),
  );
  return batch;
}

export function createDeploymentFromPath(
  path: string,
  storeIds: string[],
  scopeLevel: CreateDeploymentInput["scopeLevel"],
  brandId?: string,
  brandName?: string,
  originNav?: CreateDeploymentInput["originNav"],
  triggerSource: CreateDeploymentInput["triggerSource"] = "manual",
): DeploymentBatch {
  const domains = resolveDomainsForPath(path);
  const domainKeys =
    domains.length > 0 ? domains.map((d) => d.domainKey) : ["module.settings"];
  return createDeploymentBatch({
    domainKeys,
    storeIds,
    originNav: originNav ?? {
      l1Key: "unknown",
      l1Title: "商家后台",
      l2Key: path,
      l2Title: formatDeploymentDomainLabel(domainKeys[0] ?? "module.settings"),
      pagePath: path,
    },
    scopeLevel,
    brandId,
    brandName,
    triggerSource,
  });
}

export function retryDeploymentFailedItems(batchId: string): DeploymentBatch | undefined {
  const batch = getDeploymentBatch(batchId);
  if (!batch) return undefined;

  for (const item of batch.items) {
    if (!["failed", "timeout"].includes(item.status)) continue;
    item.status = "pending";
    item.errorCode = undefined;
    item.errorMessage = undefined;
    item.retryCount += 1;
    for (const target of item.targets) {
      if (["failed", "offline", "pending"].includes(target.status)) {
        target.status = "pending";
        target.errorDetail = undefined;
        target.ackedAt = undefined;
      }
    }
  }

  batch.status = "in_progress";
  batch.simulatorMeta = {
    progressPercent: batch.simulatorMeta?.progressPercent ?? 0,
    currentPhase: "pushing",
    startedAt: new Date().toISOString(),
  };
  rollupBatchCounts(batch);
  saveDeploymentBatch(batch);
  startDeploymentSimulation(batch.id, { onlyFailed: true, reducedFailureRate: true });
  return batch;
}

export function clearAllDeploymentBatches(): void {
  writeBatchesRaw([]);
  writeCursorsRaw({});
  memoryBatches = [];
  memoryCursors = {};
}

export function seedDeploymentDemoData(): void {
  clearAllDeploymentBatches();
  ensureDeploymentSeedData();
}

export { rollupBatchCounts };
