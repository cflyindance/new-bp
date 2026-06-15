/**
 * 平台预设 — L2/L3 白名单（勾选才展示）
 */
import { PLATFORM_PRESET_DEFAULT_L1 } from "./feature-registry";
import {
  buildPresetNavTree,
  collectDescendantExcludeIds,
  type PresetNavL2Node,
  type PresetNavModuleNode,
} from "./feature-presets-nav-tree";
import { NAV_MODULES } from "./navigation";
import type { BusinessProductLineVariant } from "./feature-presets-variants";
import { getVirtualL2NodesForModule } from "./feature-presets-tertiary-registry";

export interface PresetSubtreeSelection {
  l2Includes?: string[];
  l3Includes?: string[];
  l2Excludes?: string[];
  l3Excludes?: string[];
}

export interface PresetSubtreeIncludeState {
  l2Enabled: Set<string>;
  l3Enabled: Set<string>;
}

/** 业态×产线变体种子：L1 启用模块下的全部 L2/L3 默认勾选（含系统设置/权限管理） */
export function computeDefaultSubtreeIncludes(l1ModuleIds: Iterable<string>): {
  l2Includes: string[];
  l3Includes: string[];
} {
  const l1 = new Set(l1ModuleIds);
  for (const id of PLATFORM_PRESET_DEFAULT_L1) l1.add(id);
  const l2 = new Set<string>();
  const l3 = new Set<string>();
  for (const mod of buildPresetNavTree()) {
    if (!l1.has(mod.moduleId)) continue;
    const desc = collectDescendantExcludeIds(mod);
    for (const id of desc.l2) l2.add(id);
    for (const id of desc.l3) l3.add(id);
  }
  return {
    l2Includes: [...l2].sort(),
    l3Includes: [...l3].sort(),
  };
}

function l2UnderEnabledL1(mod: PresetNavModuleNode, l1Enabled: Set<string>): PresetNavL2Node[] {
  if (!l1Enabled.has(mod.moduleId)) return [];
  return mod.children;
}

/** 从持久化数据还原编辑器勾选态（优先 l2Includes/l3Includes，兼容旧 l2Excludes/l3Excludes） */
export function resolvePresetSubtreeIncludeState(
  l1Enabled: Set<string>,
  selection: PresetSubtreeSelection,
): PresetSubtreeIncludeState {
  const tree = buildPresetNavTree();
  const l2Enabled = new Set<string>();
  const l3Enabled = new Set<string>();

  if (selection.l2Includes !== undefined) {
    for (const id of selection.l2Includes) l2Enabled.add(id);
  } else {
    for (const mod of tree) {
      for (const child of l2UnderEnabledL1(mod, l1Enabled)) {
        if (!(selection.l2Excludes ?? []).includes(child.id)) l2Enabled.add(child.id);
      }
    }
  }

  if (selection.l3Includes !== undefined) {
    for (const id of selection.l3Includes) l3Enabled.add(id);
  } else {
    for (const mod of tree) {
      if (!l1Enabled.has(mod.moduleId)) continue;
      for (const child of mod.children) {
        if ((selection.l2Excludes ?? []).includes(child.id)) continue;
        for (const group of child.groups) {
          for (const leaf of group.leaves) {
            if (leaf.level === "l2") continue;
            if (!(selection.l3Excludes ?? []).includes(leaf.id)) l3Enabled.add(leaf.id);
          }
        }
      }
    }
  }

  return { l2Enabled, l3Enabled };
}

export function exportPresetSubtreeIncludes(state: PresetSubtreeIncludeState): {
  l2Includes: string[];
  l3Includes: string[];
  l2Excludes: string[];
  l3Excludes: string[];
} {
  return {
    l2Includes: [...state.l2Enabled].sort(),
    l3Includes: [...state.l3Enabled].sort(),
    l2Excludes: [],
    l3Excludes: [],
  };
}

export function collectDescendantIdsForL2(l2: PresetNavL2Node): string[] {
  const ids: string[] = [];
  for (const group of l2.groups) {
    ids.push(...collectLeafIdsForGroup(group));
  }
  return ids;
}

export function collectLeafIdsForGroup(group: { leaves: { id: string; level: string }[] }): string[] {
  return group.leaves.filter((leaf) => leaf.level !== "l2").map((leaf) => leaf.id);
}

export function isL2VisibleInSelection(
  l2: PresetNavL2Node,
  moduleId: string,
  l1Enabled: Set<string>,
  l2Enabled: Set<string>,
  l3Enabled: Set<string>,
): boolean {
  if (!l1Enabled.has(moduleId)) return false;
  if (!l2Enabled.has(l2.id)) return false;
  const leaves = l2.groups.flatMap((g) => g.leaves).filter((x) => x.level !== "l2");
  if (leaves.length === 0) return true;
  return leaves.some((leaf) => l3Enabled.has(leaf.id));
}

export function isLeafVisibleInSelection(leafId: string, l3Enabled: Set<string>): boolean {
  return l3Enabled.has(leafId);
}

function collectVariantEnabledL1Ids(variant: Pick<BusinessProductLineVariant, "features" | "excludes" | "includes">): Set<string> {
  const enabled = new Set<string>();
  for (const entry of variant.features ?? []) enabled.add(entry.featureId);
  for (const id of variant.excludes ?? []) enabled.delete(id);
  for (const id of variant.includes ?? []) enabled.add(id);
  return enabled;
}

/** 变体 L2 白名单中是否已有某一级模块下的主导航二级入口（NAV_MODULES.children；不含设置树虚拟 L2） */
let moduleNavL2WhitelistIndex: Map<string, readonly string[]> | null = null;

function getModuleNavL2WhitelistIndex(): Map<string, readonly string[]> {
  if (moduleNavL2WhitelistIndex) return moduleNavL2WhitelistIndex;
  const index = new Map<string, string[]>();
  for (const mod of NAV_MODULES) {
    if (mod.children.length > 0) index.set(mod.id, mod.children.map((c) => c.id));
  }
  moduleNavL2WhitelistIndex = index;
  return index;
}

export function moduleHasL2WhitelistEntry(moduleId: string, l2Includes: ReadonlySet<string> | Iterable<string>): boolean {
  const set = l2Includes instanceof Set ? l2Includes : new Set(l2Includes);
  const candidates = getModuleNavL2WhitelistIndex().get(moduleId);
  if (!candidates) return false;
  for (const id of candidates) {
    if (set.has(id)) return true;
  }
  return false;
}

/**
 * 将 L2/L3 白名单与已启用 L1 对齐：覆盖层缺省、为空或某 L1 下无 L2 条目时，补全导航树默认子树。
 */
export function reconcileVariantSubtreeIncludes(variant: BusinessProductLineVariant): BusinessProductLineVariant {
  const l1Enabled = collectVariantEnabledL1Ids(variant);
  if (l1Enabled.size === 0) {
    return {
      ...variant,
      l2Includes: variant.l2Includes ?? [],
      l3Includes: variant.l3Includes ?? [],
    };
  }

  const l2Block = new Set(variant.l2Excludes ?? []);
  const l3Block = new Set(variant.l3Excludes ?? []);

  // 编辑页/API 显式保存的白名单：尊重逐项勾选；空数组视为恢复默认子树
  if (variant.l2Includes !== undefined || variant.l3Includes !== undefined) {
    const l2Set = new Set(variant.l2Includes ?? []);
    const l3Set = new Set(variant.l3Includes ?? []);
    for (const id of [...l2Set]) {
      if (l2Block.has(id)) l2Set.delete(id);
    }
    for (const id of [...l3Set]) {
      if (l3Block.has(id)) l3Set.delete(id);
    }

    if (l2Set.size === 0 && l3Set.size === 0) {
      const defaults = computeDefaultSubtreeIncludes(l1Enabled);
      for (const id of defaults.l2Includes) {
        if (!l2Block.has(id)) l2Set.add(id);
      }
      for (const id of defaults.l3Includes) {
        if (!l3Block.has(id)) l3Set.add(id);
      }
    } else {
      for (const mod of buildPresetNavTree()) {
        if (!l1Enabled.has(mod.moduleId)) continue;
        const desc = collectDescendantExcludeIds(mod);
        const moduleNavL2 =
          NAV_MODULES.find((m) => m.id === mod.moduleId)?.children.map((c) => c.id) ?? [];
        const virtualL2Ids = getVirtualL2NodesForModule(mod.moduleId).map((e) => e.l2FeatureId);
        const allModuleL2Ids = [...moduleNavL2, ...virtualL2Ids];
        const hasAnyModuleEntry =
          allModuleL2Ids.some((id) => l2Set.has(id)) || desc.l3.some((id) => l3Set.has(id));
        if (!hasAnyModuleEntry) continue;
        const navL2InSet = moduleNavL2.filter((id) => l2Set.has(id));
        const virtualL2InSet = virtualL2Ids.some((id) => l2Set.has(id));
        const virtualOnlyForModule = virtualL2InSet && navL2InSet.length === 0 && moduleNavL2.length > 0;
        if (!virtualOnlyForModule) continue;
        for (const id of desc.l2) {
          if (!l2Block.has(id)) l2Set.add(id);
        }
        for (const id of desc.l3) {
          if (!l3Block.has(id)) l3Set.add(id);
        }
      }
    }

    return {
      ...variant,
      l2Includes: [...l2Set].sort(),
      l3Includes: [...l3Set].sort(),
    };
  }

  const defaults = computeDefaultSubtreeIncludes(l1Enabled);
  const l2Set = new Set(variant.l2Includes?.length ? variant.l2Includes : defaults.l2Includes);
  const l3Set = new Set(variant.l3Includes?.length ? variant.l3Includes : defaults.l3Includes);

  for (const id of [...l2Set]) {
    if (l2Block.has(id)) l2Set.delete(id);
  }
  for (const id of [...l3Set]) {
    if (l3Block.has(id)) l3Set.delete(id);
  }

  for (const mod of buildPresetNavTree()) {
    if (!l1Enabled.has(mod.moduleId)) continue;
    if (moduleHasL2WhitelistEntry(mod.moduleId, l2Set)) continue;
    const desc = collectDescendantExcludeIds(mod);
    for (const id of desc.l2) {
      if (!l2Block.has(id)) l2Set.add(id);
    }
    for (const id of desc.l3) {
      if (!l3Block.has(id)) l3Set.add(id);
    }
  }

  return {
    ...variant,
    l2Includes: [...l2Set].sort(),
    l3Includes: [...l3Set].sort(),
  };
}
