/**

 * 平台预设编辑 — 导航树（L1 → L2 → 三级 → 分组叶子）

 */

import { pick } from "../i18n";

import { resolveSettingsCatalogPathHit } from "./feature-presets-settings-tree";
import {
  getTertiaryItemsForL2,
  getTertiaryPathPrefixes,
  getTertiaryRegistryEntries,
  getVirtualL2NodesForModule,
  itemPathPrefixes,
  type TertiaryRegistryEntry,
} from "./feature-presets-tertiary-registry";

import { NAV_MODULES, type NavModule, type ProductCenterSidebarSubItem } from "./navigation";

import { FEATURE_REGISTRY_L1 } from "./feature-registry";



const SKIP_L1_EXCLUDE = new Set(["permission-mgmt", "settings"]);



export interface PresetNavLeaf {

  id: string;

  level: "l2" | "l3" | "l4";

  label: string;

  path?: string;

}



export interface PresetNavGroup {

  id: string;

  label: string;

  leaves: PresetNavLeaf[];

}



export interface PresetNavL2Node {

  id: string;

  label: string;

  /** 无三级时仅展示 L2 勾选 */

  groups: PresetNavGroup[];

}



export interface PresetNavModuleNode {

  moduleId: string;

  label: string;

  children: PresetNavL2Node[];

}



function labelOf(zh: string, en?: string): string {

  return pick(zh, en ?? zh);

}



function buildGroupsFromTertiary(items: ProductCenterSidebarSubItem[]): PresetNavGroup[] {

  const groups: PresetNavGroup[] = [];

  for (const item of items) {

    if (item.sidebarChildren?.length) {

      groups.push({

        id: item.id,

        label: labelOf(item.title, item.titleEn),

        leaves: item.sidebarChildren.map((c) => ({

          id: `l4:${c.path}`,

          level: "l4" as const,

          label: labelOf(c.title, c.titleEn),

          path: c.path,

        })),

      });

    } else {

      groups.push({

        id: `leaf:${item.id}`,

        label: labelOf(item.title, item.titleEn),

        leaves: [

          {

            id: item.id,

            level: "l3",

            label: labelOf(item.title, item.titleEn),

            path: item.path,

          },

        ],

      });

    }

  }

  return groups;

}



function buildL2Node(moduleId: string, child: NavModule["children"][number]): PresetNavL2Node {

  const tertiary = getTertiaryItemsForL2(moduleId, child.id);

  if (tertiary?.length) {

    return {

      id: child.id,

      label: labelOf(child.title, child.titleEn),

      groups: buildGroupsFromTertiary(tertiary),

    };

  }

  return {

    id: child.id,

    label: labelOf(child.title, child.titleEn),

    groups: [

      {

        id: `l2-only:${child.id}`,

        label: labelOf(child.title, child.titleEn),

        leaves: [{ id: child.id, level: "l2", label: labelOf(child.title, child.titleEn), path: child.path }],

      },

    ],

  };

}



function buildVirtualL2Node(entry: TertiaryRegistryEntry): PresetNavL2Node {

  return {

    id: entry.l2FeatureId,

    label: labelOf(entry.labelZh ?? entry.l2FeatureId, entry.labelEn),

    groups: buildGroupsFromTertiary(entry.items),

  };

}



function buildModuleNode(mod: NavModule): PresetNavModuleNode | null {

  if (SKIP_L1_EXCLUDE.has(mod.id)) return null;

  if (!FEATURE_REGISTRY_L1.some((m) => m.moduleId === mod.id)) return null;



  const navL2Ids = new Set(mod.children.map((c) => c.id));

  const children = mod.children.map((c) => buildL2Node(mod.id, c));



  for (const virtual of getVirtualL2NodesForModule(mod.id)) {

    if (navL2Ids.has(virtual.l2FeatureId)) continue;

    children.push(buildVirtualL2Node(virtual));

  }



  return {

    moduleId: mod.id,

    label: labelOf(mod.title, mod.titleEn),

    children,

  };

}



export function buildPresetNavTree(): PresetNavModuleNode[] {
  if (cachedPresetNavTree) return cachedPresetNavTree;
  cachedPresetNavTree = NAV_MODULES.map(buildModuleNode).filter((m): m is PresetNavModuleNode => m !== null);
  return cachedPresetNavTree;
}

let cachedPresetNavTree: PresetNavModuleNode[] | null = null;

/** 导航树结构变更后调用（单页应用内通常不变） */
export function invalidatePresetNavTreeCache(): void {
  cachedPresetNavTree = null;
}



export function collectDescendantExcludeIds(module: PresetNavModuleNode): {

  l2: string[];

  l3: string[];

} {

  const l2: string[] = [];

  const l3: string[] = [];

  for (const child of module.children) {

    l2.push(child.id);

    for (const group of child.groups) {

      for (const leaf of group.leaves) {

        if (leaf.level === "l2") continue;

        if (leaf.level === "l3" || leaf.level === "l4") l3.push(leaf.id);

      }

    }

  }

  return { l2, l3 };

}

/** 一级模块下全部 L2/L3（含系统设置/权限等预设树未列出的模块） */
export function collectModuleNavSubtreeIds(moduleId: string): { l2: string[]; l3: string[] } {
  const presetMod = buildPresetNavTree().find((m) => m.moduleId === moduleId);
  if (presetMod) return collectDescendantExcludeIds(presetMod);

  const navMod = NAV_MODULES.find((m) => m.id === moduleId);
  if (!navMod) return { l2: [], l3: [] };

  const l2 = new Set(navMod.children.map((c) => c.id));
  for (const entry of getVirtualL2NodesForModule(moduleId)) {
    l2.add(entry.l2FeatureId);
  }

  const l3 = new Set<string>();
  for (const l2Id of l2) {
    const tertiary = getTertiaryItemsForL2(moduleId, l2Id);
    if (!tertiary) continue;
    for (const item of tertiary) {
      if (item.sidebarChildren?.length) {
        for (const c of item.sidebarChildren) l3.add(`l4:${c.path}`);
      } else {
        l3.add(item.id);
      }
    }
  }

  return { l2: [...l2].sort(), l3: [...l3].sort() };
}

export function isModuleFullyExcluded(

  module: PresetNavModuleNode,

  excludes: Set<string>,

  l2Excludes: Set<string>,

  l3Excludes: Set<string>,

): boolean {

  if (excludes.has(module.moduleId)) return true;

  return module.children.every((c) => isL2FullyExcluded(c, excludes, l2Excludes, l3Excludes, module.moduleId));

}



export function isModuleFullyIncluded(module: PresetNavModuleNode, includes: Set<string>): boolean {

  return includes.has(module.moduleId);

}



export function isL2FullyExcluded(

  l2: PresetNavL2Node,

  excludes: Set<string>,

  l2Excludes: Set<string>,

  l3Excludes: Set<string>,

  moduleId: string,

): boolean {

  if (excludes.has(moduleId)) return true;

  if (l2Excludes.has(l2.id)) return true;

  const leaves = l2.groups.flatMap((g) => g.leaves).filter((x) => x.level !== "l2");

  if (leaves.length === 0) return l2Excludes.has(l2.id);

  return leaves.every((leaf) => l3Excludes.has(leaf.id));

}



/** 运行时 L3 可见性：L2 → 三级 subnav 与路径前缀 */

export interface PresetTertiaryScope {

  moduleId: string;

  l2FeatureId: string;

  items: ProductCenterSidebarSubItem[];

  pathPrefixes: string[];

}



export interface TertiaryPathHit {

  moduleId: string;

  l2FeatureId: string;

  itemId: string;

  l4Path?: string;

}



export function buildPresetTertiaryScopes(): PresetTertiaryScope[] {
  const byKey = new Map<string, PresetTertiaryScope>();

  for (const mod of NAV_MODULES) {
    for (const child of mod.children) {
      const items = getTertiaryItemsForL2(mod.id, child.id);
      if (!items?.length) continue;
      byKey.set(`${mod.id}:${child.id}`, {
        moduleId: mod.id,
        l2FeatureId: child.id,
        items,
        pathPrefixes: getTertiaryPathPrefixes(mod.id, child.id),
      });
    }
  }

  for (const entry of getTertiaryRegistryEntries()) {
    const key = `${entry.moduleId}:${entry.l2FeatureId}`;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      moduleId: entry.moduleId,
      l2FeatureId: entry.l2FeatureId,
      items: entry.items,
      pathPrefixes: entry.pathPrefixes,
    });
  }

  return [...byKey.values()];
}

export function resolveTertiaryPathHit(path: string): TertiaryPathHit | null {
  const settingsHit = resolveSettingsCatalogPathHit(path);
  if (settingsHit) return settingsHit;

  for (const scope of buildPresetTertiaryScopes()) {

    if (!scope.pathPrefixes.some((p) => path === p || path.startsWith(`${p}/`))) continue;



    const sortedItems = [...scope.items].sort((a, b) => {

      const al = itemPathPrefixes(a)[0]?.length ?? 0;

      const bl = itemPathPrefixes(b)[0]?.length ?? 0;

      return bl - al;

    });



    for (const item of sortedItems) {

      if (item.sidebarChildren?.length) {

        const sortedChildren = [...item.sidebarChildren].sort((a, b) => b.path.length - a.path.length);

        for (const c of sortedChildren) {

          if (path === c.path || path.startsWith(`${c.path}/`)) {

            return {

              moduleId: scope.moduleId,

              l2FeatureId: scope.l2FeatureId,

              itemId: item.id,

              l4Path: c.path,

            };

          }

        }

      }

      for (const prefix of itemPathPrefixes(item)) {

        if (path === prefix || path.startsWith(`${prefix}/`)) {

          return { moduleId: scope.moduleId, l2FeatureId: scope.l2FeatureId, itemId: item.id };

        }

      }

    }

  }

  return null;

}



export { itemPathPrefixes };


