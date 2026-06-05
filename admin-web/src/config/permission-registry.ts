/**
 * B 端 RBAC 权限资源注册表（由 navigation.ts + module-settings-catalog.ts 派生）
 */
import { NAV_MODULES, PRODUCT_CENTER_DEEP_NAV, type NavModule } from "./navigation";
import {
  getModuleSettingsCatalog,
  groupCatalogItemsByCategory,
  type ModuleSettingCatalogItem,
} from "./module-settings-catalog";

/** 对某导航/功能的访问级别 */
export type PermissionAccess = "hidden" | "view" | "operate";

export type PermissionLevel = 1 | 2 | 3 | 4;

export interface PermissionResource {
  /** 全局唯一键，持久化在角色 grants 中（稀疏存储，未设则继承父级） */
  key: string;
  parentKey?: string;
  level: PermissionLevel;
  moduleId: string;
  moduleTitle: string;
  moduleTitleEn?: string;
  /** 展示标题 */
  title: string;
  titleEn?: string;
  /** L2：滑层子入口 path */
  path?: string;
  /** L3：设置分组 slug */
  groupKey?: string;
  /** L4：设置项 seq */
  seq?: number;
  /** L2 兼容字段 */
  featureId?: string;
  featureTitle?: string;
  featureTitleEn?: string;
  /** L3 业务页标准操作 id（非 settings） */
  actionId?: string;
  chainOnly?: boolean;
}

export interface PermissionTreeNode {
  resource: PermissionResource;
  children: PermissionTreeNode[];
}

export interface PermissionModuleGroup {
  moduleId: string;
  moduleTitle: string;
  moduleTitleEn?: string;
  /** L1 资源键 */
  moduleKey: string;
  tree: PermissionTreeNode;
}

const RBAC_EXCLUDED_MODULE_IDS = new Set(["permission-mgmt"]);

/** 门店安全策略等不走角色矩阵的 settings path 前缀 */
const RBAC_EXCLUDED_SETTINGS_PATHS = new Set(["/permissions/store-security"]);

const ACCESS_RANK: Record<PermissionAccess, number> = {
  hidden: 0,
  view: 1,
  operate: 2,
};

/** 页面内标准操作（非 settings 类 L2 下挂载为 L3） */
export const PERMISSION_ACTION_PRESETS = [
  { id: "create", title: "新建", titleEn: "Create" },
  { id: "edit", title: "编辑", titleEn: "Edit" },
  { id: "delete", title: "删除", titleEn: "Delete" },
  { id: "export", title: "导出", titleEn: "Export" },
  { id: "approve", title: "审核", titleEn: "Approve" },
] as const;

function moduleKey(moduleId: string): string {
  return moduleId;
}

function featureKey(moduleId: string, featureId: string): string {
  return `${moduleId}:${featureId}`;
}

function groupKeyOf(moduleId: string, featureId: string, groupKey: string): string {
  return `${moduleId}:${featureId}:${groupKey}`;
}

function settingKey(moduleId: string, featureId: string, groupKey: string, seq: number): string {
  return `${moduleId}:${featureId}:${groupKey}:s${seq}`;
}

function actionKey(moduleId: string, featureId: string, actionId: string): string {
  return `${moduleId}:${featureId}:${actionId}`;
}

function isExcludedSettingsPath(path: string): boolean {
  for (const p of RBAC_EXCLUDED_SETTINGS_PATHS) {
    if (path === p || path.startsWith(`${p}/`)) return true;
  }
  return false;
}

function appendSettingChildren(
  parent: PermissionTreeNode,
  moduleId: string,
  featureId: string,
  featurePath: string,
): void {
  if (isExcludedSettingsPath(featurePath)) return;
  const catalog = getModuleSettingsCatalog(featurePath);
  if (!catalog?.items.length) return;

  const groups = groupCatalogItemsByCategory(catalog.items, catalog.groupOrder);
  for (const group of groups) {
    const gKey = groupKeyOf(moduleId, featureId, group.groupKey);
    const groupNode: PermissionTreeNode = {
      resource: {
        key: gKey,
        parentKey: parent.resource.key,
        level: 3,
        moduleId,
        moduleTitle: parent.resource.moduleTitle,
        moduleTitleEn: parent.resource.moduleTitleEn,
        title: group.groupTitle,
        groupKey: group.groupKey,
        featureId,
        path: featurePath,
      },
      children: [],
    };
    for (const item of group.items) {
      groupNode.children.push({
        resource: {
          key: settingKey(moduleId, featureId, group.groupKey, item.seq),
          parentKey: gKey,
          level: 4,
          moduleId,
          moduleTitle: parent.resource.moduleTitle,
          moduleTitleEn: parent.resource.moduleTitleEn,
          title: item.title,
          groupKey: group.groupKey,
          seq: item.seq,
          featureId,
          path: featurePath,
        },
        children: [],
      });
    }
    parent.children.push(groupNode);
  }
}

function appendActionChildren(parent: PermissionTreeNode, moduleId: string, featureId: string): void {
  for (const preset of PERMISSION_ACTION_PRESETS) {
    parent.children.push({
      resource: {
        key: actionKey(moduleId, featureId, preset.id),
        parentKey: parent.resource.key,
        level: 3,
        moduleId,
        moduleTitle: parent.resource.moduleTitle,
        moduleTitleEn: parent.resource.moduleTitleEn,
        title: preset.title,
        titleEn: preset.titleEn,
        actionId: preset.id,
        featureId,
        path: parent.resource.path,
      },
      children: [],
    });
  }
}

function buildFeatureNode(
  mod: NavModule,
  item: { id: string; title: string; titleEn?: string; path: string; chainOnly?: boolean },
): PermissionTreeNode {
  const mKey = moduleKey(mod.id);
  const node: PermissionTreeNode = {
    resource: {
      key: featureKey(mod.id, item.id),
      parentKey: mKey,
      level: 2,
      moduleId: mod.id,
      moduleTitle: mod.title,
      moduleTitleEn: mod.titleEn,
      title: item.title,
      titleEn: item.titleEn,
      featureId: item.id,
      featureTitle: item.title,
      featureTitleEn: item.titleEn,
      path: item.path,
      chainOnly: item.chainOnly,
    },
    children: [],
  };

  const catalog = getModuleSettingsCatalog(item.path);
  if (catalog?.items.length) {
    appendSettingChildren(node, mod.id, item.id, item.path);
  } else {
    appendActionChildren(node, mod.id, item.id);
  }
  return node;
}

/** 从 NAV_MODULES + settings catalog 构建四级权限树 */
export function buildPermissionModuleGroups(): PermissionModuleGroup[] {
  const groups: PermissionModuleGroup[] = [];

  for (const mod of NAV_MODULES) {
    if (RBAC_EXCLUDED_MODULE_IDS.has(mod.id)) continue;

    const mKey = moduleKey(mod.id);
    const moduleNode: PermissionTreeNode = {
      resource: {
        key: mKey,
        level: 1,
        moduleId: mod.id,
        moduleTitle: mod.title,
        moduleTitleEn: mod.titleEn,
        title: mod.title,
        titleEn: mod.titleEn,
        path: mod.path,
      },
      children: [],
    };

    for (const child of mod.children) {
      moduleNode.children.push(buildFeatureNode(mod, child));
    }

    if (mod.id === "product-center-main") {
      for (const deep of PRODUCT_CENTER_DEEP_NAV) {
        if (moduleNode.children.some((c) => c.resource.featureId === deep.id)) continue;
        moduleNode.children.push(buildFeatureNode(mod, deep));
      }
    }

    groups.push({
      moduleId: mod.id,
      moduleTitle: mod.title,
      moduleTitleEn: mod.titleEn,
      moduleKey: mKey,
      tree: moduleNode,
    });
  }

  return groups;
}

export function flattenPermissionTree(groups = buildPermissionModuleGroups()): PermissionResource[] {
  const out: PermissionResource[] = [];
  function walk(node: PermissionTreeNode): void {
    out.push(node.resource);
    for (const child of node.children) walk(child);
  }
  for (const g of groups) walk(g.tree);
  return out;
}

/** @deprecated 兼容旧调用方 */
export function flattenPermissionResources(groups = buildPermissionModuleGroups()): PermissionResource[] {
  return flattenPermissionTree(groups);
}

export interface PermissionResourceIndex {
  byKey: Map<string, PermissionResource>;
  getAncestorChain: (key: string) => PermissionResource[];
  getDescendantKeys: (key: string) => string[];
}

export function buildPermissionResourceIndex(
  groups = buildPermissionModuleGroups(),
): PermissionResourceIndex {
  const flat = flattenPermissionTree(groups);
  const byKey = new Map(flat.map((r) => [r.key, r]));
  const childrenOf = new Map<string, string[]>();

  for (const r of flat) {
    if (!r.parentKey) continue;
    const list = childrenOf.get(r.parentKey) ?? [];
    list.push(r.key);
    childrenOf.set(r.parentKey, list);
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

  function getAncestorChain(key: string): PermissionResource[] {
    const chain: PermissionResource[] = [];
    let current = byKey.get(key);
    while (current) {
      chain.unshift(current);
      current = current.parentKey ? byKey.get(current.parentKey) : undefined;
    }
    return chain;
  }

  return { byKey, getAncestorChain, getDescendantKeys };
}

export function parsePermissionAccess(value: string | undefined): PermissionAccess {
  if (value === "view" || value === "operate") return value;
  return "hidden";
}

/** 子级不得高于父级 */
export function capGrant(parent: PermissionAccess, child: PermissionAccess): PermissionAccess {
  if (parent === "hidden") return "hidden";
  if (parent === "view") return child === "operate" ? "view" : child;
  return child;
}

/** 多角色并集 */
export function maxAccess(a: PermissionAccess, b: PermissionAccess): PermissionAccess {
  return ACCESS_RANK[a] >= ACCESS_RANK[b] ? a : b;
}

/**
 * 解析有效权限（稀疏 grants + 继承封顶）。
 * 链上每一层：显式值优先，否则继承上一层有效值；再经 capGrant 向下封顶。
 */
export function resolveEffectiveGrant(
  grants: Record<string, PermissionAccess>,
  key: string,
  index: PermissionResourceIndex,
): PermissionAccess {
  const chain = index.getAncestorChain(key);
  if (!chain.length) return "hidden";

  let effective: PermissionAccess = "hidden";
  for (const node of chain) {
    const explicit = grants[node.key];
    const nodeVal = explicit ?? effective;
    effective = capGrant(effective, nodeVal);
  }
  return effective;
}

/** 是否对某键做了显式覆盖（非继承） */
export function isExplicitGrant(grants: Record<string, PermissionAccess>, key: string): boolean {
  return grants[key] !== undefined;
}

/** 合并多角色 grants（并集取高，再按树封顶） */
export function mergeRoleGrantsUnion(
  roleGrants: Record<string, PermissionAccess>[],
  index: PermissionResourceIndex,
): Record<string, PermissionAccess> {
  const merged: Record<string, PermissionAccess> = {};
  for (const key of index.byKey.keys()) {
    let best: PermissionAccess = "hidden";
    for (const grants of roleGrants) {
      best = maxAccess(best, resolveEffectiveGrant(grants, key, index));
    }
    merged[key] = best;
  }
  return merged;
}
