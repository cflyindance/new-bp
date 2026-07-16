/**
 * 配置变更缓冲：按页面分桶（批量保存）+ 全局 FIFO（即时下发页）
 */
import type { DeploymentConfigChange } from "./deployment-types";
import { listAllModuleSettingCatalogEntries } from "./module-settings-catalog";

const pendingChanges: DeploymentConfigChange[] = [];
const pageBuckets = new Map<string, Map<string, DeploymentConfigChange>>();

let titleBySeqCache: Map<number, string> | null = null;

function ensureSettingTitleCache(): Map<number, string> {
  if (!titleBySeqCache) {
    titleBySeqCache = new Map();
    for (const { item } of listAllModuleSettingCatalogEntries()) {
      titleBySeqCache.set(item.seq, item.title);
    }
  }
  return titleBySeqCache;
}

/** 按设置项序号取可读标题 */
export function getSettingTitleBySeq(seq: number): string {
  return ensureSettingTitleCache().get(seq) ?? `设置项 #${seq}`;
}

/** 将任意配置值格式化为下发记录可读文案 */
export function formatConfigDisplayValue(value: unknown): string {
  if (value == null) return "（未设置）";
  if (typeof value === "boolean") return value ? "开启" : "关闭";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (value === "1") return "开启";
    if (value === "0") return "关闭";
    if (value === "") return "（空）";
    return value.length > 120 ? `${value.slice(0, 117)}…` : value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "（空）";
    const preview = value
      .slice(0, 3)
      .map((item) =>
        typeof item === "object" && item && "name" in item
          ? String((item as { name: unknown }).name)
          : String(item),
      )
      .join("、");
    return value.length > 3 ? `${preview} 等 ${value.length} 项` : preview;
  }
  if (typeof value === "object") {
    const json = JSON.stringify(value);
    return json.length > 120 ? `${json.slice(0, 117)}…` : json;
  }
  return String(value);
}

function changeDedupeKey(change: DeploymentConfigChange): string {
  return change.fieldKey ?? change.label;
}

function upsertChange(
  store: Map<string, DeploymentConfigChange>,
  change: DeploymentConfigChange,
): void {
  if (change.before === change.after) return;
  const key = changeDedupeKey(change);
  const existing = store.get(key);
  if (existing) {
    const merged: DeploymentConfigChange = { ...change, before: existing.before };
    if (merged.before === merged.after) {
      store.delete(key);
      return;
    }
    store.set(key, merged);
    return;
  }
  store.set(key, { ...change });
}

/** 记录一次配置变更（无实际差异或重复则忽略）— 即时下发页 */
export function recordDeploymentConfigChange(change: DeploymentConfigChange): void {
  if (change.before === change.after) return;
  const dup = pendingChanges.some(
    (c) =>
      c.fieldKey === change.fieldKey && c.label === change.label && c.after === change.after,
  );
  if (dup) return;
  pendingChanges.push({ ...change });
}

/** 按页面记录变更（批量保存页） */
export function recordPageConfigChange(pageKey: string, change: DeploymentConfigChange): void {
  if (change.before === change.after) return;
  let bucket = pageBuckets.get(pageKey);
  if (!bucket) {
    bucket = new Map();
    pageBuckets.set(pageKey, bucket);
  }
  upsertChange(bucket, change);
}

export function isPageDirty(pageKey: string): boolean {
  const bucket = pageBuckets.get(pageKey);
  return (bucket?.size ?? 0) > 0;
}

export function getPageChangeCount(pageKey: string): number {
  return pageBuckets.get(pageKey)?.size ?? 0;
}

/** 取出下一条待下发的配置变更（即时下发页） */
export function consumeNextConfigChange(): DeploymentConfigChange | undefined {
  return pendingChanges.shift();
}

/** 取出页面全部待下发变更 */
export function consumePageConfigChanges(pageKey: string): DeploymentConfigChange[] {
  const bucket = pageBuckets.get(pageKey);
  if (!bucket || bucket.size === 0) return [];
  const changes = [...bucket.values()];
  pageBuckets.delete(pageKey);
  return changes;
}

export function clearPageConfigChanges(pageKey: string): void {
  pageBuckets.delete(pageKey);
}

export function peekPageConfigChanges(pageKey: string): DeploymentConfigChange[] {
  const bucket = pageBuckets.get(pageKey);
  if (!bucket) return [];
  return [...bucket.values()];
}
