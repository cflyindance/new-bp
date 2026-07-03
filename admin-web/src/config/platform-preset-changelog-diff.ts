/**
 * 平台预设 · 发布前后勾选差异（变更记录明细）
 */
import type { ProductLineId } from "./platform-preset-catalog";
import type { PlatformPresetNodeSelection } from "./platform-preset-store";
import { buildPlatformPresetIndex, type PlatformPresetNodeLevel, type PlatformPresetTreeOptions } from "./platform-preset-tree";

const LEVEL_LABEL: Record<PlatformPresetNodeLevel, string> = {
  1: "一级导航",
  2: "二级导航",
  3: "三级分组",
  4: "设置项",
};

export interface PresetChangeItem {
  key: string;
  level: PlatformPresetNodeLevel;
  levelLabel: string;
  title: string;
  /** 祖先路径 + 当前节点，如「前厅管理中心 / 设置 / 登录与主界面 / 跳过选桌」 */
  pathLabel: string;
}

export interface PresetSelectionDiff {
  enabledAdded: PresetChangeItem[];
  enabledRemoved: PresetChangeItem[];
  displayAdded: PresetChangeItem[];
  displayRemoved: PresetChangeItem[];
}

function pickZh(title: string, titleEn?: string): string {
  return title?.trim() ? title : (titleEn ?? "");
}

function formatChangeItem(
  key: string,
  index: ReturnType<typeof buildPlatformPresetIndex>,
): PresetChangeItem | null {
  const node = index.byKey.get(key);
  if (!node) return null;
  const ancestors = index.getAncestorKeys(key);
  const pathParts = ancestors
    .map((k) => index.byKey.get(k))
    .filter((n): n is NonNullable<typeof n> => n != null)
    .map((n) => pickZh(n.title, n.titleEn));
  pathParts.push(pickZh(node.title, node.titleEn));
  return {
    key,
    level: node.level,
    levelLabel: LEVEL_LABEL[node.level],
    title: pickZh(node.title, node.titleEn),
    pathLabel: pathParts.join(" / "),
  };
}

/** 对比两次 selection，产出新增/删除启用变更（按编辑树全量键） */
export function diffPresetSelections(
  previous: Record<string, PlatformPresetNodeSelection> | undefined,
  next: Record<string, PlatformPresetNodeSelection>,
  productLineId: ProductLineId,
  treeOptions?: PlatformPresetTreeOptions,
): PresetSelectionDiff {
  const index = buildPlatformPresetIndex(productLineId, treeOptions);
  const out: PresetSelectionDiff = {
    enabledAdded: [],
    enabledRemoved: [],
    displayAdded: [],
    displayRemoved: [],
  };

  for (const node of index.flat) {
    const key = node.key;
    const prev = previous?.[key];
    const cur = next[key] ?? { enabled: false, display: false };

    const wasEnabled = prev?.enabled === true;
    const isEnabled = cur.enabled === true;

    if (!wasEnabled && isEnabled) {
      const item = formatChangeItem(key, index);
      if (item) out.enabledAdded.push(item);
    } else if (wasEnabled && !isEnabled) {
      const item = formatChangeItem(key, index);
      if (item) out.enabledRemoved.push(item);
    }
  }

  const byPath = (a: PresetChangeItem, b: PresetChangeItem) =>
    a.pathLabel.localeCompare(b.pathLabel, "zh-CN") || a.level - b.level;

  out.enabledAdded.sort(byPath);
  out.enabledRemoved.sort(byPath);
  out.displayAdded.sort(byPath);
  out.displayRemoved.sort(byPath);

  return out;
}

export function buildPresetChangelogSummary(diff: PresetSelectionDiff, enabledL1: number): string {
  const parts: string[] = [];
  if (diff.enabledAdded.length) parts.push(`新增启用 ${diff.enabledAdded.length} 项`);
  if (diff.enabledRemoved.length) parts.push(`取消启用 ${diff.enabledRemoved.length} 项`);
  const detail = parts.length ? parts.join("；") : "无节点变更";
  return `发布，当前启用 ${enabledL1} 个一级导航；${detail}`;
}

export function hasPresetSelectionDiff(diff: PresetSelectionDiff): boolean {
  return (
    diff.enabledAdded.length > 0 ||
    diff.enabledRemoved.length > 0 ||
    diff.displayAdded.length > 0 ||
    diff.displayRemoved.length > 0
  );
}
