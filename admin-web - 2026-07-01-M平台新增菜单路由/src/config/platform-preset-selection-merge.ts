/**
 * 平台预设 · 多业态 × 多产线 selection 并集合并
 */
import type { PlatformPresetNodeSelection } from "./platform-preset-store";

function mergeNodeSelection(
  a: PlatformPresetNodeSelection | undefined,
  b: PlatformPresetNodeSelection,
): PlatformPresetNodeSelection {
  const enabled = a?.enabled || b.enabled;
  return { enabled, display: enabled };
}

/** 多组 selection 并集：节点启用取 OR；展示与启用一致 */
export function mergePresetSelections(
  selections: Record<string, PlatformPresetNodeSelection>[],
): Record<string, PlatformPresetNodeSelection> {
  const merged: Record<string, PlatformPresetNodeSelection> = {};
  for (const sel of selections) {
    for (const [key, node] of Object.entries(sel)) {
      merged[key] = mergeNodeSelection(merged[key], node);
    }
  }
  return merged;
}
