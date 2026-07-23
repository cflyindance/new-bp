/**
 * 配置变更缓冲：按页面分桶（批量保存）+ 全局 FIFO（即时下发页）
 */
import {
  collectionChangeHasDiff,
  mergeEntityChangeBlocks,
  withCollectionSummary,
} from "./collection-change-diff";
import type { ChangeDetailRow, DeploymentConfigChange } from "./deployment-types";
import { listAllModuleSettingCatalogEntries } from "./module-settings-catalog";

const pendingChanges: DeploymentConfigChange[] = [];
const pageBuckets = new Map<string, Map<string, DeploymentConfigChange>>();

const SUMMARY_MAX_ROWS = 2;
const DISPLAY_MAX_LEN = 120;
const OBJECT_EXPAND_DEPTH = 2;

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

function truncateDisplay(text: string): string {
  return text.length > DISPLAY_MAX_LEN ? `${text.slice(0, DISPLAY_MAX_LEN - 3)}…` : text;
}

/** 将对象 key 转为可读标签（禁止直接展示原始 JSON） */
export function humanizeConfigKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "字段";
  const known: Record<string, string> = {
    enabled: "启用",
    minutes: "分钟",
    guests: "人数",
    name: "名称",
    id: "标识",
    value: "值",
    label: "标签",
    type: "类型",
    mode: "模式",
    lines: "适用产线",
  };
  if (known[trimmed]) return known[trimmed];
  if (known[trimmed.toLowerCase()]) return known[trimmed.toLowerCase()]!;
  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

function formatPrimitiveDisplayValue(value: unknown): string {
  if (value == null) return "（未设置）";
  if (typeof value === "boolean") return value ? "开启" : "关闭";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (value === "1") return "开启";
    if (value === "0") return "关闭";
    if (value === "") return "（空）";
    return truncateDisplay(value);
  }
  return truncateDisplay(String(value));
}

function formatArrayDisplayValue(value: unknown[]): string {
  if (value.length === 0) return "（空）";
  const preview = value
    .slice(0, 3)
    .map((item) => {
      if (typeof item === "object" && item && "name" in item) {
        return String((item as { name: unknown }).name);
      }
      if (typeof item === "object" && item && "label" in item) {
        return String((item as { label: unknown }).label);
      }
      if (item == null || typeof item !== "object") return formatPrimitiveDisplayValue(item);
      return humanizeConfigKey(Object.keys(item as object)[0] ?? "项");
    })
    .join("、");
  return value.length > 3 ? `${preview} 等 ${value.length} 项` : preview;
}

function formatObjectDisplayValue(value: Record<string, unknown>, depth: number): string {
  const entries = Object.entries(value);
  if (entries.length === 0) return "（空）";
  const parts = entries.slice(0, 4).map(([key, child]) => {
    const label = humanizeConfigKey(key);
    if (depth <= 0 || child == null || typeof child !== "object") {
      return `${label}：${formatPrimitiveDisplayValue(child)}`;
    }
    if (Array.isArray(child)) return `${label}：${formatArrayDisplayValue(child)}`;
    return `${label}：${formatObjectDisplayValue(child as Record<string, unknown>, depth - 1)}`;
  });
  const body = parts.join("；");
  return entries.length > 4 ? `${body} 等 ${entries.length} 项` : body;
}

/** 将任意配置值格式化为下发记录可读文案（禁止 JSON 直出） */
export function formatConfigDisplayValue(value: unknown): string {
  if (value == null) return "（未设置）";
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return formatPrimitiveDisplayValue(value);
  }
  if (Array.isArray(value)) return formatArrayDisplayValue(value);
  if (typeof value === "object") {
    return formatObjectDisplayValue(value as Record<string, unknown>, OBJECT_EXPAND_DEPTH);
  }
  return truncateDisplay(String(value));
}

function pushDetailRow(
  rows: ChangeDetailRow[],
  key: string,
  label: string,
  before: string,
  after: string,
): void {
  if (before === after) return;
  rows.push({ key, label, before, after });
}

function expandValueToLeaves(
  value: unknown,
  prefixKey: string,
  prefixLabel: string,
  depth: number,
): Array<{ key: string; label: string; text: string }> {
  if (value == null || typeof value !== "object") {
    return [{ key: prefixKey || "value", label: prefixLabel || "配置值", text: formatConfigDisplayValue(value) }];
  }
  if (Array.isArray(value)) {
    if (value.every((item) => item == null || typeof item !== "object")) {
      return [{ key: prefixKey || "list", label: prefixLabel || "列表", text: formatArrayDisplayValue(value) }];
    }
    return value.flatMap((item, index) => {
      const name =
        typeof item === "object" && item && "name" in item
          ? String((item as { name: unknown }).name)
          : `第 ${index + 1} 项`;
      const childKey = `${prefixKey || "item"}[${index}]`;
      const childLabel = prefixLabel ? `${prefixLabel} · ${name}` : name;
      return expandValueToLeaves(item, childKey, childLabel, depth - 1);
    });
  }
  if (depth <= 0) {
    return [
      {
        key: prefixKey || "object",
        label: prefixLabel || "配置",
        text: formatObjectDisplayValue(value as Record<string, unknown>, 1),
      },
    ];
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return [{ key: prefixKey || "object", label: prefixLabel || "配置", text: "（空）" }];
  }
  return entries.flatMap(([key, child]) => {
    const childKey = prefixKey ? `${prefixKey}.${key}` : key;
    const childLabel = prefixLabel
      ? `${prefixLabel} · ${humanizeConfigKey(key)}`
      : humanizeConfigKey(key);
    return expandValueToLeaves(child, childKey, childLabel, depth - 1);
  });
}

/** 对比两个配置值，产出结构化差异行 */
export function buildChangeDetailRows(
  before: unknown,
  after: unknown,
  options?: { rootLabel?: string; rootKey?: string },
): ChangeDetailRow[] {
  const rootKey = options?.rootKey ?? "value";
  const rootLabel = options?.rootLabel ?? "配置值";
  const beforeLeaves = expandValueToLeaves(before, rootKey, rootLabel, OBJECT_EXPAND_DEPTH);
  const afterLeaves = expandValueToLeaves(after, rootKey, rootLabel, OBJECT_EXPAND_DEPTH);
  const keys = new Set([...beforeLeaves.map((r) => r.key), ...afterLeaves.map((r) => r.key)]);
  const beforeMap = new Map(beforeLeaves.map((r) => [r.key, r]));
  const afterMap = new Map(afterLeaves.map((r) => [r.key, r]));
  const rows: ChangeDetailRow[] = [];
  for (const key of keys) {
    const b = beforeMap.get(key);
    const a = afterMap.get(key);
    pushDetailRow(
      rows,
      key,
      a?.label ?? b?.label ?? rootLabel,
      b?.text ?? "—",
      a?.text ?? "—",
    );
  }
  if (rows.length === 0 && formatConfigDisplayValue(before) !== formatConfigDisplayValue(after)) {
    pushDetailRow(
      rows,
      rootKey,
      rootLabel,
      formatConfigDisplayValue(before),
      formatConfigDisplayValue(after),
    );
  }
  return rows;
}

/** 由 details 生成对称可读摘要（禁止两侧写成相同「N 项变更」） */
export function summarizeChangeDetails(details: ChangeDetailRow[]): { before: string; after: string } {
  const changed = details.filter((d) => d.before !== d.after);
  if (changed.length === 0) return { before: "—", after: "—" };
  const head = changed.slice(0, SUMMARY_MAX_ROWS);
  const before = head.map((d) => `${d.label}：${d.before}`).join("；");
  const after = head.map((d) => `${d.label}：${d.after}`).join("；");
  if (changed.length <= SUMMARY_MAX_ROWS) return { before, after };
  const suffix = ` 等 ${changed.length} 项`;
  return { before: `${before}${suffix}`, after: `${after}${suffix}` };
}

export function mergeChangeDetails(
  existing: ChangeDetailRow[] | undefined,
  incoming: ChangeDetailRow[] | undefined,
): ChangeDetailRow[] | undefined {
  if (!existing?.length && !incoming?.length) return undefined;
  if (!existing?.length) return incoming ? [...incoming] : undefined;
  if (!incoming?.length) return [...existing];

  const map = new Map<string, ChangeDetailRow>();
  for (const row of existing) map.set(row.key, { ...row });
  for (const row of incoming) {
    const prev = map.get(row.key);
    if (prev) {
      map.set(row.key, { ...row, before: prev.before });
    } else {
      map.set(row.key, { ...row });
    }
  }
  return [...map.values()].filter((row) => row.before !== row.after);
}

/** 是否存在实质差异（有 entities / details 时按结构化判断） */
export function changeHasDiff(change: DeploymentConfigChange): boolean {
  if (change.entities && change.entities.length > 0) {
    return collectionChangeHasDiff(change);
  }
  if (change.details && change.details.length > 0) {
    return change.details.some((row) => row.before !== row.after);
  }
  return change.before !== change.after;
}

function withRecalculatedSummary(change: DeploymentConfigChange): DeploymentConfigChange {
  if (change.entities?.length) {
    return withCollectionSummary(change);
  }
  if (!change.details?.length) return change;
  const summary = summarizeChangeDetails(change.details);
  return { ...change, before: summary.before, after: summary.after, details: change.details };
}

function changeDedupeKey(change: DeploymentConfigChange): string {
  return change.fieldKey ?? change.label;
}

function upsertChange(
  store: Map<string, DeploymentConfigChange>,
  change: DeploymentConfigChange,
): void {
  if (!changeHasDiff(change)) return;
  const key = changeDedupeKey(change);
  const existing = store.get(key);
  if (existing) {
    if (change.entities?.length || existing.entities?.length) {
      const mergedEntities = mergeEntityChangeBlocks(existing.entities, change.entities);
      let merged: DeploymentConfigChange = {
        ...change,
        before: existing.before,
        entities: mergedEntities,
        details: undefined,
        changeKind: "collection",
        groupPath: change.groupPath ?? existing.groupPath,
      };
      if (mergedEntities?.length) {
        merged = withRecalculatedSummary(merged);
      }
      if (!changeHasDiff(merged)) {
        store.delete(key);
        return;
      }
      store.set(key, merged);
      return;
    }
    const mergedDetails = mergeChangeDetails(existing.details, change.details);
    let merged: DeploymentConfigChange = {
      ...change,
      before: existing.before,
      details: mergedDetails,
      groupPath: change.groupPath ?? existing.groupPath,
    };
    if (mergedDetails?.length) {
      merged = withRecalculatedSummary(merged);
    }
    if (!changeHasDiff(merged)) {
      store.delete(key);
      return;
    }
    store.set(key, merged);
    return;
  }
  store.set(key, withRecalculatedSummary({ ...change }));
}

/**
 * 用完整集合 diff 覆盖页面桶中的同 fieldKey（适合每次相对 baseline 重算）
 */
export function replacePageConfigChange(pageKey: string, change: DeploymentConfigChange): void {
  let bucket = pageBuckets.get(pageKey);
  if (!bucket) {
    bucket = new Map();
    pageBuckets.set(pageKey, bucket);
  }
  const key = changeDedupeKey(change);
  if (!changeHasDiff(change)) {
    bucket.delete(key);
    if (bucket.size === 0) pageBuckets.delete(pageKey);
    return;
  }
  bucket.set(key, withRecalculatedSummary({ ...change }));
}

/** 记录一次配置变更（无实际差异或重复则忽略）— 即时下发页 */
export function recordDeploymentConfigChange(change: DeploymentConfigChange): void {
  const normalized = withRecalculatedSummary({ ...change });
  if (!changeHasDiff(normalized)) return;
  const dup = pendingChanges.some(
    (c) =>
      c.fieldKey === normalized.fieldKey &&
      c.label === normalized.label &&
      c.after === normalized.after,
  );
  if (dup) return;
  pendingChanges.push(normalized);
}

/** 按页面记录变更（批量保存页） */
export function recordPageConfigChange(pageKey: string, change: DeploymentConfigChange): void {
  if (!changeHasDiff(change)) return;
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
