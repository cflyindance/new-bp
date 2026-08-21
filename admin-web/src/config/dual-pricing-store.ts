/**
 * Dual Pricing 内存 store（P0 demo）。
 * 后续可替换为 GET/POST /api/dual-pricing/*，UI 调用面保持不变。
 */
import { cloneDpSeedStores, cloneDpSeedTasks } from "./dual-pricing-seed";
import {
  isDpRetryableTask,
  type DpPosStatus,
  type DpStoreSnapshot,
  type DpTask,
  type DpUpstreamStatus,
} from "./dual-pricing-types";

export type ListDpStoresQuery = {
  /** 精确匹配门店 ID（下拉选择） */
  storeId?: string;
  storeName?: string;
  mid?: string;
};

export type ListDpTasksQuery = {
  storeId?: string;
  mid?: string;
  type?: DpTask["type"];
  upstreamStatus?: DpUpstreamStatus;
  posStatus?: DpPosStatus;
};

export type RetryDpTaskResult =
  | { ok: true; task: DpTask }
  | { ok: false; reason: string };

let stores: DpStoreSnapshot[] = cloneDpSeedStores();
let tasks: DpTask[] = cloneDpSeedTasks();

/** 演示：强制 list 抛错，供异常态 UI */
let mockListError = false;

function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function norm(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function matchesFuzzy(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle);
}

export function resetDualPricingStore(): void {
  stores = cloneDpSeedStores();
  tasks = cloneDpSeedTasks();
  mockListError = false;
}

export function setDualPricingMockListError(enabled: boolean): void {
  mockListError = enabled;
}

export function getDualPricingMockListError(): boolean {
  return mockListError;
}

export function getDpStore(storeId: string): DpStoreSnapshot | undefined {
  return stores.find((s) => s.storeId === storeId);
}

export function isStoreLockedBySfdc(storeId: string): boolean {
  return getDpStore(storeId)?.lockedBySfdc === true;
}

/** 任一匹配 mid 的门店锁定（设置页按当前 MID / 演示门店查询时可用） */
export function isMidLockedBySfdc(mid: string): boolean {
  const m = mid.trim();
  if (!m) return false;
  return stores.some((s) => s.mid === m && s.lockedBySfdc);
}

export function listDpStores(query: ListDpStoresQuery = {}): DpStoreSnapshot[] {
  if (mockListError) {
    throw new Error("Dual Pricing 门店列表加载失败（模拟）");
  }
  const storeId = (query.storeId ?? "").trim();
  const nameQ = norm(query.storeName);
  const midQ = norm(query.mid);
  return stores.filter((s) => {
    if (storeId && s.storeId !== storeId) return false;
    if (nameQ && !matchesFuzzy(s.storeName, nameQ)) return false;
    if (midQ && !matchesFuzzy(s.mid, midQ)) return false;
    return true;
  });
}

/** 下拉选项用：返回全部门店（不受当前筛选影响） */
export function listDpStoreOptions(): DpStoreSnapshot[] {
  if (mockListError) {
    throw new Error("Dual Pricing 门店列表加载失败（模拟）");
  }
  return stores.slice();
}

export function listDpTasks(query: ListDpTasksQuery = {}): DpTask[] {
  if (mockListError) {
    throw new Error("Dual Pricing 任务列表加载失败（模拟）");
  }
  const storeId = (query.storeId ?? "").trim();
  const midQ = norm(query.mid);
  return tasks
    .filter((t) => {
      if (storeId && t.storeId !== storeId) return false;
      if (midQ && !matchesFuzzy(t.mid, midQ)) return false;
      if (query.type && t.type !== query.type) return false;
      if (query.upstreamStatus && t.upstreamStatus !== query.upstreamStatus) return false;
      if (query.posStatus && t.posStatus !== query.posStatus) return false;
      return true;
    })
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

export function getDpTask(taskId: string): DpTask | undefined {
  return tasks.find((t) => t.taskId === taskId);
}

/**
 * 手动「更新」：仅上游同步失败 / POS 下发失败可点。
 * Demo：重做当前失败层并走到 POS 下发成功，便于联调 Snapshot 回写。
 */
export function retryDpTask(taskId: string): RetryDpTaskResult {
  const idx = tasks.findIndex((t) => t.taskId === taskId);
  if (idx < 0) return { ok: false, reason: "任务不存在" };

  const current = tasks[idx]!;
  if (!isDpRetryableTask(current)) {
    return { ok: false, reason: "当前状态不可重试" };
  }

  const stamp = nowStamp();
  const next: DpTask = {
    ...current,
    manualRetryCount: current.manualRetryCount + 1,
    lastError: null,
    upstreamStatus: "received",
    posStatus: "ok",
    deploymentJobId: current.deploymentJobId ?? `dep-dp-retry-${taskId}`,
    updatedAt: stamp,
  };

  tasks[idx] = next;
  applySnapshotAfterDispatchOk(next, stamp);
  return { ok: true, task: next };
}

function applySnapshotAfterDispatchOk(task: DpTask, stamp: string): void {
  const storeIdx = stores.findIndex((s) => s.storeId === task.storeId);
  if (storeIdx < 0) return;
  const prev = stores[storeIdx]!;

  if (task.type === "open") {
    stores[storeIdx] = {
      ...prev,
      rate: task.rate,
      receiptUnpaidDisplay: "Card Price",
      sourceCaseId: task.caseNumber,
      lockedBySfdc: true,
      updatedAt: stamp,
    };
    return;
  }

  // close：清空生效态并解锁
  stores[storeIdx] = {
    ...prev,
    rate: null,
    receiptUnpaidDisplay: null,
    sourceCaseId: task.caseNumber,
    lockedBySfdc: false,
    updatedAt: stamp,
  };
}
