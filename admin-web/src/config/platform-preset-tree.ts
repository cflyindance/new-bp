/**
 * 平台预设 · 四级功能树（只读派生自 permission-registry 或已发布导航蓝图）
 *
 * 产线 scope（fohSeqAppliesToLine）仅用于运行时设置页过滤，不在此处裁剪树结构。
 * 企业/商家配置预设编辑页：快照 blueprintVersion 与已发布导航蓝图版本一致时展示蓝图树，
 * 否则回退系统 registry 全量树。
 */
import {
  buildPermissionModuleGroups,
  stripPermissionActionL3Nodes,
  buildPermissionResourceIndex,
  type PermissionTreeNode,
} from "./permission-registry";
import { fohSeqAppliesToLine } from "./foh-settings-line-scope";
import type { ProductLineId } from "./platform-preset-catalog";
import { filterRbacPermissionModuleGroups, filterMatrixNavModuleGroups, getRbacNavVisibilityCacheKey } from "../permissions/nav-access";
import {
  DEFAULT_NAV_BLUEPRINT_ID,
  getPublishedNavBlueprint,
  type NavBlueprintSnapshot,
} from "./nav-blueprint-store";
import { buildNavBlueprintGroups } from "./nav-blueprint-tree";
import { applyCatalogNavOrderToL2Tree } from "./module-settings-subnav";

export type PlatformPresetNodeLevel = 1 | 2 | 3 | 4;

export interface PlatformPresetFlatNode {
  key: string;
  parentKey?: string;
  level: PlatformPresetNodeLevel;
  moduleId: string;
  title: string;
  titleEn?: string;
  path?: string;
  groupKey?: string;
  seq?: number;
}

export interface PlatformPresetModuleTree {
  moduleId: string;
  moduleTitle: string;
  moduleTitleEn?: string;
  moduleKey: string;
  tree: PermissionTreeNode;
}

/** 前厅 L4 是否适用于当前产线（供编辑页标注；运行时过滤见 platform-preset-settings-filter） */
export function platformPresetSettingAppliesToLine(seq: number, productLineId: ProductLineId): boolean {
  return fohSeqAppliesToLine(seq, productLineId);
}

export function invalidatePlatformPresetTreeCache(): void {
  indexCache.clear();
  rbacIndexCache.clear();
  presetEditorIndexCache.clear();
}

function mapGroupsToPresetTrees(
  groups: ReturnType<typeof buildPermissionModuleGroups>,
): PlatformPresetModuleTree[] {
  return groups.map((g) => ({
    moduleId: g.moduleId,
    moduleTitle: g.moduleTitle,
    moduleTitleEn: g.moduleTitleEn,
    moduleKey: g.moduleKey,
    tree: g.tree,
  }));
}

function applyCatalogNavOrderToGroups(groups: ReturnType<typeof buildPermissionModuleGroups>): void {
  for (const g of groups) {
    for (const l2 of g.tree.children) {
      if (l2.children.length) applyCatalogNavOrderToL2Tree(l2);
    }
  }
}

/** 从导航蓝图构建四级树 */
export function buildPlatformPresetModuleGroupsFromBlueprint(
  blueprint: NavBlueprintSnapshot,
): PlatformPresetModuleTree[] {
  const groups = buildNavBlueprintGroups(blueprint);
  stripPermissionActionL3Nodes(groups);
  applyCatalogNavOrderToGroups(groups);
  return mapGroupsToPresetTrees(groups);
}

function buildPlatformPresetModuleGroupsFromRegistry(): PlatformPresetModuleTree[] {
  const groups = buildPermissionModuleGroups();
  stripPermissionActionL3Nodes(groups);
  applyCatalogNavOrderToGroups(groups);
  return mapGroupsToPresetTrees(groups);
}

export interface PlatformPresetTreeOptions {
  /** 快照已绑定蓝图且版本与已发布蓝图一致时使用 */
  useSyncedBlueprint?: boolean;
  /** 预设快照上记录的 blueprintVersion，须与已发布蓝图版本一致 */
  syncedBlueprintVersion?: number;
}

function resolveSyncedBlueprint(options?: PlatformPresetTreeOptions): NavBlueprintSnapshot | undefined {
  if (!options?.useSyncedBlueprint) return undefined;
  const published = getPublishedNavBlueprint(DEFAULT_NAV_BLUEPRINT_ID);
  if (!published || published.version <= 0) return undefined;
  if (
    options.syncedBlueprintVersion != null &&
    options.syncedBlueprintVersion !== published.version
  ) {
    return undefined;
  }
  return published;
}

/** 根据快照解析是否使用已发布导航蓝图树（企业/商家共用） */
export function resolvePlatformPresetTreeOptions(
  _scope: "merchant" | "enterprise",
  snapshot?: Pick<{ blueprintVersion?: number }, "blueprintVersion">,
): PlatformPresetTreeOptions {
  if (!snapshot?.blueprintVersion || snapshot.blueprintVersion <= 0) return {};
  return {
    useSyncedBlueprint: true,
    syncedBlueprintVersion: snapshot.blueprintVersion,
  };
}

export function resolvePlatformPresetTreeOptionsFromSnapshot(
  snapshot?: Pick<{ blueprintVersion?: number }, "blueprintVersion">,
): PlatformPresetTreeOptions {
  return resolvePlatformPresetTreeOptions("merchant", snapshot);
}

/** 配置预设编辑页 · 导航结构来源说明 */
export function describePlatformPresetTreeSource(
  snapshot?: Pick<{ blueprintVersion?: number }, "blueprintVersion">,
): { usingBlueprint: boolean; hint: string } {
  const treeOptions = resolvePlatformPresetTreeOptionsFromSnapshot(snapshot);
  const published = getPublishedNavBlueprint(DEFAULT_NAV_BLUEPRINT_ID);
  const boundVersion = snapshot?.blueprintVersion;

  if (treeOptions.useSyncedBlueprint && published) {
    const sourceLabel =
      published.navigationSource === "custom" ? "自定义导航蓝图" : "系统默认导航蓝图";
    return {
      usingBlueprint: true,
      hint: `导航结构：已同步导航蓝图 v${published.version}（${sourceLabel}）。`,
    };
  }

  if (boundVersion && boundVersion > 0 && published && published.version > boundVersion) {
    return {
      usingBlueprint: false,
      hint: `导航结构：系统默认（快照绑定蓝图 v${boundVersion}，当前已发布 v${published.version}，请同步企业默认）。`,
    };
  }

  if (boundVersion && boundVersion > 0 && (!published || published.version <= 0)) {
    return {
      usingBlueprint: false,
      hint: `导航结构：系统默认（绑定的导航蓝图 v${boundVersion} 未发布或已失效）。`,
    };
  }

  if (boundVersion && boundVersion > 0) {
    return {
      usingBlueprint: false,
      hint: `导航结构：系统默认（蓝图 v${boundVersion} 与当前发布版本不一致）。`,
    };
  }

  return {
    usingBlueprint: false,
    hint: "导航结构：系统默认（尚未绑定导航蓝图，同步企业预设后将展示蓝图结构）。",
  };
}

function treeOptionsCacheKey(productLineId: ProductLineId, options?: PlatformPresetTreeOptions): string {
  if (!options?.useSyncedBlueprint) return `${productLineId}:system`;
  return `${productLineId}:blueprint:${options.syncedBlueprintVersion ?? "any"}`;
}

/** 构建四级树（permission 键作为 preset 节点键；与 catalog 全量一致，不按产线裁剪） */
export function buildPlatformPresetModuleGroups(
  _productLineId: ProductLineId,
  options?: PlatformPresetTreeOptions,
): PlatformPresetModuleTree[] {
  const blueprint = resolveSyncedBlueprint(options);
  if (blueprint) return buildPlatformPresetModuleGroupsFromBlueprint(blueprint);
  return buildPlatformPresetModuleGroupsFromRegistry();
}

export function flattenPlatformPresetTree(
  groups = buildPlatformPresetModuleGroups("pos"),
): PlatformPresetFlatNode[] {
  const out: PlatformPresetFlatNode[] = [];
  function walk(node: PermissionTreeNode): void {
    out.push({
      key: node.resource.key,
      parentKey: node.resource.parentKey,
      level: node.resource.level as PlatformPresetNodeLevel,
      moduleId: node.resource.moduleId,
      title: node.resource.title,
      titleEn: node.resource.titleEn,
      path: node.resource.path,
      groupKey: node.resource.groupKey,
      seq: node.resource.seq,
    });
    for (const child of node.children) walk(child);
  }
  for (const g of groups) walk(g.tree);
  return out;
}

const indexCache = new Map<string, PlatformPresetIndex>();

type PlatformPresetIndex = {
  groups: ReturnType<typeof buildPlatformPresetModuleGroups>;
  flat: ReturnType<typeof flattenPlatformPresetTree>;
  byKey: Map<string, ReturnType<typeof flattenPlatformPresetTree>[number]>;
  getDescendantKeys: (key: string) => string[];
  getAncestorKeys: (key: string) => string[];
};

function buildPlatformPresetIndexFromPresetGroups(
  presetGroups: PlatformPresetModuleTree[],
): PlatformPresetIndex {
  const flat = flattenPlatformPresetTree(presetGroups);
  const byKey = new Map(flat.map((n) => [n.key, n]));
  const childrenOf = new Map<string, string[]>();

  for (const n of flat) {
    if (!n.parentKey) continue;
    const list = childrenOf.get(n.parentKey) ?? [];
    list.push(n.key);
    childrenOf.set(n.parentKey, list);
  }

  function getDescendantKeys(key: string): string[] {
    const out: string[] = [];
    const stack = [...(childrenOf.get(key) ?? [])];
    while (stack.length) {
      const k = stack.pop()!;
      out.push(k);
      stack.push(...(childrenOf.get(k) ?? []));
    }
    return out;
  }

  function getAncestorKeys(key: string): string[] {
    const chain: string[] = [];
    let current = byKey.get(key);
    while (current?.parentKey) {
      chain.unshift(current.parentKey);
      current = byKey.get(current.parentKey);
    }
    return chain;
  }

  return { groups: presetGroups, flat, byKey, getDescendantKeys, getAncestorKeys };
}

function buildPlatformPresetIndexUncached(
  productLineId: ProductLineId,
  options?: PlatformPresetTreeOptions,
): PlatformPresetIndex {
  const groups = buildPlatformPresetModuleGroups(productLineId, options);
  return buildPlatformPresetIndexFromPresetGroups(groups);
}

/** RBAC 角色矩阵：按门店版/连锁版与数据视角过滤一级导航（避免「门店列表」等重复项） */
export function buildRbacPlatformPresetIndex(productLineId: ProductLineId = "pos"): PlatformPresetIndex {
  const cacheKey = `rbac:${productLineId}:${getRbacNavVisibilityCacheKey()}`;
  const cached = rbacIndexCache.get(cacheKey);
  if (cached) return cached;

  let groups = buildPermissionModuleGroups();
  groups = filterRbacPermissionModuleGroups(groups);
  stripPermissionActionL3Nodes(groups);
  applyCatalogNavOrderToGroups(groups);
  const built = buildPlatformPresetIndexFromPresetGroups(mapGroupsToPresetTrees(groups));
  rbacIndexCache.set(cacheKey, built);
  return built;
}

const rbacIndexCache = new Map<string, PlatformPresetIndex>();
const presetEditorIndexCache = new Map<string, PlatformPresetIndex>();

/** 平台预设 · 配置预设编辑页：按视角过滤一级导航（避免「门店列表」等重复项） */
export function buildPresetEditorPlatformPresetIndex(
  productLineId: ProductLineId,
  options?: PlatformPresetTreeOptions,
): PlatformPresetIndex {
  const cacheKey = `editor:${treeOptionsCacheKey(productLineId, options)}:${getRbacNavVisibilityCacheKey()}`;
  const cached = presetEditorIndexCache.get(cacheKey);
  if (cached) return cached;

  let groups = buildPlatformPresetModuleGroups(productLineId, options);
  groups = filterMatrixNavModuleGroups(groups);
  const built = buildPlatformPresetIndexFromPresetGroups(groups);
  presetEditorIndexCache.set(cacheKey, built);
  return built;
}

export function buildPlatformPresetIndex(
  productLineId: ProductLineId,
  options?: PlatformPresetTreeOptions,
) {
  const cacheKey = treeOptionsCacheKey(productLineId, options);
  const cached = indexCache.get(cacheKey);
  if (cached) return cached;
  const built = buildPlatformPresetIndexUncached(productLineId, options);
  indexCache.set(cacheKey, built);
  return built;
}

/** 全产线 L4 节点总数（用于校验脚本） */
export function getPlatformPresetTreeStats(): {
  moduleCount: number;
  l2Count: number;
  l3Count: number;
  l4Count: number;
} {
  const index = buildPermissionResourceIndex();
  const flat = [...index.byKey.values()];
  return {
    moduleCount: flat.filter((r) => r.level === 1).length,
    l2Count: flat.filter((r) => r.level === 2).length,
    l3Count: flat.filter((r) => r.level === 3).length,
    l4Count: flat.filter((r) => r.level === 4).length,
  };
}
