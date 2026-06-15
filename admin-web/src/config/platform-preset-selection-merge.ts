/**
 * 平台预设 · 多业态 × 多产线 selection 并集合并
 */
import type { PlatformPresetNodeSelection } from "./platform-preset-store";

function mergeNodeSelection(
  a: PlatformPresetNodeSelection | undefined,
  b: PlatformPresetNodeSelection,
): PlatformPresetNodeSelection {
  if (!a) {
    return { enabled: b.enabled, display: b.display !== false };
  }
  const enabled = a.enabled || b.enabled;
  if (!enabled) {
    return { enabled: false, display: a.display !== false && b.display !== false };
  }
  const display =
    (a.enabled && a.display !== false) || (b.enabled && b.display !== false);
  return { enabled: true, display };
}

/** 多组 selection 并集：节点启用取 OR；L4 展示在已启用时取 OR */
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
