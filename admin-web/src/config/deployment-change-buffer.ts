/**
 * 配置变更缓冲：保存时写入，自动/手动下发时消费。
 */
import type { DeploymentConfigChange } from "./deployment-types";
import { listAllModuleSettingCatalogEntries } from "./module-settings-catalog";

const pendingChanges: DeploymentConfigChange[] = [];
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

/** 记录一次配置变更（无实际差异或重复则忽略） */
export function recordDeploymentConfigChange(change: DeploymentConfigChange): void {
  if (change.before === change.after) return;
  const dup = pendingChanges.some(
    (c) =>
      c.fieldKey === change.fieldKey && c.label === change.label && c.after === change.after,
  );
  if (dup) return;
  pendingChanges.push({ ...change });
}

/** 取出下一条待下发的配置变更 */
export function consumeNextConfigChange(): DeploymentConfigChange | undefined {
  return pendingChanges.shift();
}
