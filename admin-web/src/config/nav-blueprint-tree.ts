/**
 * 导航蓝图 · 四级树索引（系统默认 + 自定义节点 + seq 重归属）
 */
import { getModuleSettingsCatalog } from "./module-settings-catalog";
import { applyCatalogNavOrderToL2Tree } from "./module-settings-subnav";
import {
  buildPermissionModuleGroups,
  stripPermissionActionL3Nodes,
  type PermissionModuleGroup,
  type PermissionTreeNode,
} from "./permission-registry";
import type { PermissionModuleGroupLike } from "./permission-four-column-nav";
import type { FourColumnTreeIndex } from "./permission-four-column-ui";
import {
  getNavBlueprintDraft,
  normalizeBlueprintSnapshot,
  resolveCustomL1MountKind,
  resolveCustomL2MountKind,
  resolveCustomL2MountTagKind,
  resolveCustomL3MountTagKind,
  customL1MountedPageL2Key,
  customL2MountedPageL3Key,
  isCustomL1MountedPageL2Key,
  type NavBlueprintCustomNode,
  type NavBlueprintSnapshot,
} from "./nav-blueprint-store";
import { resolveNavRouteTitleByPath } from "./nav-route-registry";

export type NavBlueprintTreeModule = "system" | "custom" | "active";

function cloneGroups(groups: PermissionModuleGroup[]): PermissionModuleGroup[] {
  return structuredClone(groups);
}

function walkTree(node: PermissionTreeNode, visit: (n: PermissionTreeNode) => void): void {
  visit(node);
  for (const c of node.children) walkTree(c, visit);
}

function findNodeByKey(groups: PermissionModuleGroup[], key: string): PermissionTreeNode | undefined {
  for (const g of groups) {
    let found: PermissionTreeNode | undefined;
    walkTree(g.tree, (n) => {
      if (n.resource.key === key) found = n;
    });
    if (found) return found;
  }
  return undefined;
}

function customL1ModuleKey(node: NavBlueprintCustomNode): string {
  return node.id;
}

function customL3Key(node: NavBlueprintCustomNode): string {
  return `${node.parentKey}:${node.groupKey ?? node.id}`;
}

function injectCustomNodes(
  groups: PermissionModuleGroup[],
  customNodes: NavBlueprintCustomNode[],
): void {
  const l1Nodes = customNodes.filter((n) => n.level === 1).sort((a, b) => a.sortOrder - b.sortOrder);
  const l2Nodes = customNodes.filter((n) => n.level === 2).sort((a, b) => a.sortOrder - b.sortOrder);
  const l3Nodes = customNodes.filter((n) => n.level === 3).sort((a, b) => a.sortOrder - b.sortOrder);

  for (const l1 of l1Nodes) {
    const mKey = customL1ModuleKey(l1);
    const l2ChildrenForL1 = l2Nodes.filter((n) => n.parentKey === l1.id);
    const l1Kind = resolveCustomL1MountKind(l1, l2ChildrenForL1);
    const mountKind = l1Kind === "page" || l1Kind === "features" ? l1Kind : undefined;
    groups.push({
      moduleId: l1.id,
      moduleTitle: l1.label,
      moduleTitleEn: l1.labelEn,
      moduleKey: mKey,
      customL1MountKind: mountKind,
      tree: {
        resource: {
          key: mKey,
          level: 1,
          moduleId: l1.id,
          moduleTitle: l1.label,
          moduleTitleEn: l1.labelEn,
          title: l1.label,
          titleEn: l1.labelEn,
          path: l1.route,
        },
        children: [],
      },
    });
  }

  for (const l2 of l2Nodes) {
    if (!l2.parentKey) continue;
    const parentGroup = groups.find((g) => g.moduleKey === l2.parentKey);
    if (!parentGroup) continue;
    const l2Key = l2.id;
    const mountTag = resolveCustomL2MountTagKind(l2);
    const node: PermissionTreeNode = {
      resource: {
        key: l2Key,
        parentKey: parentGroup.moduleKey,
        level: 2,
        moduleId: parentGroup.moduleId,
        moduleTitle: parentGroup.moduleTitle,
        moduleTitleEn: parentGroup.moduleTitleEn,
        title: l2.label,
        titleEn: l2.labelEn,
        featureId: l2.id,
        featureTitle: l2.label,
        path: l2.route,
        customL2MountKind: mountTag,
      },
      children: [],
    };
    parentGroup.tree.children.push(node);
  }

  for (const g of groups) {
    const l1 = l1Nodes.find((n) => n.id === g.moduleId);
    if (!l1?.route) continue;
    const l2ChildrenForL1 = l2Nodes.filter((n) => n.parentKey === l1.id);
    if (resolveCustomL1MountKind(l1, l2ChildrenForL1) !== "page") continue;
    if (g.tree.children.length > 0) continue;

    const pageTitle = resolveNavRouteTitleByPath(l1.route) ?? l1.route;
    g.tree.children.push({
      resource: {
        key: customL1MountedPageL2Key(l1.id),
        parentKey: g.moduleKey,
        level: 2,
        moduleId: g.moduleId,
        moduleTitle: g.moduleTitle,
        moduleTitleEn: g.moduleTitleEn,
        title: pageTitle,
        featureTitle: pageTitle,
        path: l1.route,
        customL2MountKind: "page",
        chainOnly: true,
      },
      children: [],
    });
  }

  for (const l3 of l3Nodes) {
    if (!l3.parentKey) continue;
    const parentL2 = findNodeByKey(groups, l3.parentKey);
    if (!parentL2) continue;
    const gKey = l3.groupKey ?? l3.id;
    const l3Key = customL3Key(l3);
    const mountTag = resolveCustomL3MountTagKind(l3);
    parentL2.children.push({
      resource: {
        key: l3Key,
        parentKey: parentL2.resource.key,
        level: 3,
        moduleId: parentL2.resource.moduleId,
        moduleTitle: parentL2.resource.moduleTitle,
        moduleTitleEn: parentL2.resource.moduleTitleEn,
        title: l3.label,
        titleEn: l3.labelEn,
        groupKey: gKey,
        featureId: parentL2.resource.featureId,
        path: l3.settingsPath ?? l3.route ?? parentL2.resource.path,
        customL3MountKind: mountTag,
      },
      children: [],
    });
  }

  for (const l2 of l2Nodes) {
    if (isCustomL1MountedPageL2Key(l2.id)) continue;
    const parentL2 = findNodeByKey(groups, l2.id);
    if (!parentL2 || parentL2.children.length > 0) continue;
    if (resolveCustomL2MountKind(l2) !== "page" || !l2.route) continue;

    const pageTitle = resolveNavRouteTitleByPath(l2.route) ?? l2.route;
    parentL2.children.push({
      resource: {
        key: customL2MountedPageL3Key(l2.id),
        parentKey: parentL2.resource.key,
        level: 3,
        moduleId: parentL2.resource.moduleId,
        moduleTitle: parentL2.resource.moduleTitle,
        moduleTitleEn: parentL2.resource.moduleTitleEn,
        title: pageTitle,
        groupKey: `${l2.id}-mounted-page`,
        featureId: parentL2.resource.featureId,
        path: l2.route,
        customL3MountKind: "page",
        chainOnly: true,
      },
      children: [],
    });
  }
}

interface L4Entry {
  node: PermissionTreeNode;
  defaultL3Key: string;
  seq: number;
}

function collectL4Entries(groups: PermissionModuleGroup[]): L4Entry[] {
  const entries: L4Entry[] = [];
  for (const g of groups) {
    walkTree(g.tree, (n) => {
      if (n.resource.level === 4 && n.resource.seq != null && n.resource.parentKey) {
        entries.push({
          node: structuredClone(n),
          defaultL3Key: n.resource.parentKey,
          seq: n.resource.seq,
        });
      }
    });
  }
  return entries;
}

function stripL4Children(groups: PermissionModuleGroup[]): void {
  for (const g of groups) {
    walkTree(g.tree, (n) => {
      if (n.resource.level === 3) {
        n.children = n.children.filter((c) => c.resource.level !== 4);
      }
    });
  }
}

function applySeqAssignments(
  groups: PermissionModuleGroup[],
  seqAssignments: Record<number, string>,
  l4Pool?: L4Entry[],
): void {
  const entries = l4Pool ?? collectL4Entries(groups);
  stripL4Children(groups);

  for (const entry of entries) {
    const targetL3 = seqAssignments[entry.seq] ?? entry.defaultL3Key;
    const parent = findNodeByKey(groups, targetL3);
    if (!parent) continue;
    const child = structuredClone(entry.node);
    child.resource.parentKey = targetL3;
    parent.children.push(child);
  }
}

function buildIndexFromGroups(groups: PermissionModuleGroupLike[]): FourColumnTreeIndex {
  const childrenOf = new Map<string, string[]>();

  function walk(node: PermissionTreeNode): void {
    for (const c of node.children) {
      const list = childrenOf.get(node.resource.key) ?? [];
      list.push(c.resource.key);
      childrenOf.set(node.resource.key, list);
      walk(c);
    }
  }

  for (const g of groups) walk(g.tree);

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

  return { groups, getDescendantKeys };
}

function systemL4Pool(): L4Entry[] {
  return collectL4Entries(cloneGroups(buildPermissionModuleGroups()));
}

/** 按 module-settings-catalog 侧栏顺序排列各 L2 下 L3（含 groupNavSections 分段顺序） */
function applyCatalogNavOrderToSystemGroups(groups: PermissionModuleGroup[]): void {
  for (const g of groups) {
    for (const l2 of g.tree.children) {
      if (!l2.children.length) continue;
      applyCatalogNavOrderToL2Tree(l2);
    }
  }
}

/** 系统预设导航树（不含自定义节点、不含页面操作按钮 L3） */
export function buildSystemNavBlueprintGroups(snapshot: NavBlueprintSnapshot): PermissionModuleGroup[] {
  const normalized = normalizeBlueprintSnapshot(snapshot);
  const groups = cloneGroups(buildPermissionModuleGroups());
  stripPermissionActionL3Nodes(groups);
  applySeqAssignments(groups, normalized.systemSeqAssignments);
  applyCatalogNavOrderToSystemGroups(groups);
  return groups;
}

/** 自定义导航树（仅 customNodes） */
export function buildCustomNavBlueprintGroups(snapshot: NavBlueprintSnapshot): PermissionModuleGroup[] {
  const normalized = normalizeBlueprintSnapshot(snapshot);
  const groups: PermissionModuleGroup[] = [];
  injectCustomNodes(groups, normalized.customNodes);
  applySeqAssignments(groups, normalized.customSeqAssignments, systemL4Pool());
  return groups;
}

function resolveTreeModule(snapshot: NavBlueprintSnapshot, module: NavBlueprintTreeModule): NavBlueprintTreeModule {
  if (module === "active") return normalizeBlueprintSnapshot(snapshot).navigationSource;
  return module;
}

export function buildNavBlueprintGroupsForModule(
  snapshot: NavBlueprintSnapshot,
  module: NavBlueprintTreeModule = "active",
): PermissionModuleGroup[] {
  const resolved = resolveTreeModule(snapshot, module);
  if (resolved === "custom") return buildCustomNavBlueprintGroups(snapshot);
  return buildSystemNavBlueprintGroups(snapshot);
}

export function buildNavBlueprintGroups(snapshot: NavBlueprintSnapshot): PermissionModuleGroup[] {
  return buildNavBlueprintGroupsForModule(snapshot, "active");
}

function seqAssignmentsForModule(snapshot: NavBlueprintSnapshot, module: NavBlueprintTreeModule): Record<number, string> {
  const normalized = normalizeBlueprintSnapshot(snapshot);
  const resolved = resolveTreeModule(snapshot, module);
  return resolved === "custom" ? normalized.customSeqAssignments : normalized.systemSeqAssignments;
}

export function buildNavBlueprintIndex(
  blueprintId: string,
  module: NavBlueprintTreeModule = "active",
): FourColumnTreeIndex {
  const snapshot = getNavBlueprintDraft(blueprintId);
  const groups = buildNavBlueprintGroupsForModule(snapshot, module);
  return buildIndexFromGroups(groups);
}

export function buildNavBlueprintIndexFromSnapshot(
  snapshot: NavBlueprintSnapshot,
  module: NavBlueprintTreeModule = "active",
): FourColumnTreeIndex {
  const groups = buildNavBlueprintGroupsForModule(snapshot, module);
  return buildIndexFromGroups(groups);
}

export function isSeqAssignedToL3(
  snapshot: NavBlueprintSnapshot,
  seq: number,
  l3Key: string,
  defaultL3Key: string,
  module: NavBlueprintTreeModule = "active",
): boolean {
  const assignments = seqAssignmentsForModule(snapshot, module);
  const assigned = assignments[seq];
  if (assigned) return assigned === l3Key;
  return defaultL3Key === l3Key;
}

export function countCustomNodes(snapshot: NavBlueprintSnapshot): number {
  return snapshot.customNodes.length;
}

export function getDefaultL3KeyForSeq(seq: number): string | undefined {
  const groups = buildPermissionModuleGroups();
  let result: string | undefined;
  for (const g of groups) {
    walkTree(g.tree, (n) => {
      if (n.resource.level === 4 && n.resource.seq === seq && n.resource.parentKey) {
        result = n.resource.parentKey;
      }
    });
  }
  return result;
}

export function findNavBlueprintTreeNode(
  snapshot: NavBlueprintSnapshot,
  key: string,
  module: NavBlueprintTreeModule = "active",
): PermissionTreeNode | undefined {
  const groups = buildNavBlueprintGroupsForModule(snapshot, module);
  return findNodeByKey(groups, key);
}

/** 解析 L2 是否为设置 Hub，并返回 settingsPath */
export function resolveNavBlueprintL2SettingsHub(
  snapshot: NavBlueprintSnapshot,
  parentL2Key: string,
  module: NavBlueprintTreeModule = "custom",
): { settingsPath: string; parentLabel: string } | null {
  const custom = snapshot.customNodes.find((n) => n.level === 2 && n.id === parentL2Key);
  if (custom) {
    if (!custom.isSettingsHub) return null;
    const settingsPath = custom.settingsPath ?? custom.route;
    if (!settingsPath) return null;
    return { settingsPath, parentLabel: custom.label };
  }

  const node = findNavBlueprintTreeNode(snapshot, parentL2Key, module);
  if (!node || node.resource.level !== 2) return null;
  const path = node.resource.path;
  if (!path) return null;

  const hasL3Groups = node.children.some((c) => c.resource.level === 3 && c.resource.groupKey);
  const catalog = getModuleSettingsCatalog(path);
  if (!hasL3Groups && !catalog?.items.length) return null;

  return { settingsPath: path, parentLabel: node.resource.title ?? "" };
}

/** 某 L2 下已占用的 groupKey（含系统默认与自定义 L3） */
export function getOccupiedL3GroupKeysUnderL2(
  snapshot: NavBlueprintSnapshot,
  parentL2Key: string,
  module: NavBlueprintTreeModule = "custom",
): Set<string> {
  const keys = new Set<string>();
  const node = findNavBlueprintTreeNode(snapshot, parentL2Key, module);
  if (!node) return keys;
  for (const c of node.children) {
    if (c.resource.level === 3 && c.resource.groupKey) keys.add(c.resource.groupKey);
  }
  return keys;
}
