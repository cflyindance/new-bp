/**
 * 平台预设 · 节点勾选状态（无 store 依赖，避免循环引用）
 */
export type RbacL4EditMode = "editable" | "display-only";

export interface PlatformPresetNodeSelection {
  enabled: boolean;
  /** @deprecated 与 enabled 同步；勾选即展示，未勾选即不展示 */
  display?: boolean;
  /** RBAC L4：勾选=展示；可选「可编辑」，未勾选可编辑时为只读展示 */
  l4EditMode?: RbacL4EditMode;
}

/** 勾选即展示：display 始终与 enabled 一致 */
export function syncNodeDisplayWithEnabled(
  node: PlatformPresetNodeSelection | undefined,
  enabled: boolean,
): PlatformPresetNodeSelection {
  return { ...node, enabled, display: enabled };
}

export function syncSelectionDisplayWithEnabled(
  selection: Record<string, PlatformPresetNodeSelection>,
): Record<string, PlatformPresetNodeSelection> {
  const next: Record<string, PlatformPresetNodeSelection> = {};
  for (const [key, node] of Object.entries(selection)) {
    next[key] = syncNodeDisplayWithEnabled(node, node.enabled);
  }
  return next;
}
