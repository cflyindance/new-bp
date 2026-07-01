/**
 * M 平台 · 导航蓝图存储（企业级菜单路由配置）
 */
import { getCatalogItemBySeq, getSettingNodeKeyBySeq } from "./nav-setting-registry";
import { buildNavPresetItemRegistry } from "./nav-preset-item-registry";
import { getAuthenticatedEmail } from "../auth/login";
import type { PlatformPresetNodeSelection } from "./platform-preset-node-selection";
import {
  syncNodeDisplayWithEnabled,
  syncSelectionDisplayWithEnabled,
} from "./platform-preset-node-selection";

export const DEFAULT_NAV_BLUEPRINT_ID = "system-default";

/** 运行时生效的导航树来源 */
export type NavBlueprintNavigationSource = "system" | "custom";

export type NavBlueprintCustomLevel = 1 | 2 | 3;

/** L1 创建时的配置方式（用于列表标签） */
export type NavBlueprintL1MountKind = "page" | "features" | "manual-l2";

/** L2 创建时的配置方式（用于列表标签） */
export type NavBlueprintL2MountKind = "page" | "features" | "manual-l3";

/** L3 创建时的配置方式（用于列表标签） */
export type NavBlueprintL3MountKind = "page" | "features" | "manual-l4";

/** 【页面】类一级在二级列展示的虚拟节点 key 后缀 */
export const CUSTOM_L1_MOUNTED_PAGE_L2_SUFFIX = ":mounted-page";

/** 【页面】类二级在三级列展示的虚拟节点 key 后缀 */
export const CUSTOM_L2_MOUNTED_PAGE_L3_SUFFIX = ":mounted-page-l3";

export function customL1MountedPageL2Key(l1Id: string): string {
  return `${l1Id}${CUSTOM_L1_MOUNTED_PAGE_L2_SUFFIX}`;
}

export function isCustomL1MountedPageL2Key(key: string): boolean {
  return key.endsWith(CUSTOM_L1_MOUNTED_PAGE_L2_SUFFIX);
}

export function customL2MountedPageL3Key(l2Id: string): string {
  return `${l2Id}${CUSTOM_L2_MOUNTED_PAGE_L3_SUFFIX}`;
}

export function isCustomL2MountedPageL3Key(key: string): boolean {
  return key.endsWith(CUSTOM_L2_MOUNTED_PAGE_L3_SUFFIX);
}

export interface NavBlueprintCustomNode {
  id: string;
  level: NavBlueprintCustomLevel;
  label: string;
  labelEn?: string;
  /** L1/L2 路由 */
  route?: string;
  /** L1 展示方式 */
  subNavPlacement?: "sheet" | "sidebar" | "tabs";
  /** L1 默认子路由 */
  defaultChildRoute?: string;
  /** L1 创建配置方式（page / features 用于列表标签） */
  l1MountKind?: NavBlueprintL1MountKind;
  /** L2 创建配置方式（page / features 用于列表标签） */
  l2MountKind?: NavBlueprintL2MountKind;
  /** L3 创建配置方式（page / features 用于列表标签） */
  l3MountKind?: NavBlueprintL3MountKind;
  /** 父级：L2/L3 挂载的 L1 moduleKey 或 L2 resource key */
  parentKey: string | null;
  /** L2 是否为设置 Hub */
  isSettingsHub?: boolean;
  settingsPath?: string;
  /** L3 分组键 */
  groupKey?: string;
  sortOrder: number;
  createdAt: string;
}

export interface NavBlueprintSnapshot {
  blueprintId: string;
  version: number;
  publishedAt: string;
  /** 默认使用的导航树：系统预设 or 自定义 */
  navigationSource: NavBlueprintNavigationSource;
  customNodes: NavBlueprintCustomNode[];
  /** 系统预设模块 · seq → L3 resource key */
  systemSeqAssignments: Record<number, string>;
  /** 系统预设模块 · L1～L4 结构启用态 */
  systemStructureSelection: Record<string, PlatformPresetNodeSelection>;
  /** 自定义模块 · seq → L3 resource key */
  customSeqAssignments: Record<number, string>;
  /** 自定义模块 · L1～L4 结构启用态 */
  customStructureSelection: Record<string, PlatformPresetNodeSelection>;
  /** @deprecated 读取时迁移至 system* / custom* 字段 */
  seqAssignments?: Record<number, string>;
  /** @deprecated 读取时迁移至 system* / custom* 字段 */
  structureSelection?: Record<string, PlatformPresetNodeSelection>;
}

interface NavBlueprintStore {
  snapshots: Record<string, NavBlueprintSnapshot>;
  drafts: Record<string, NavBlueprintSnapshot>;
  changelog: NavBlueprintChangeLogEntry[];
}

export interface NavBlueprintChangeLogEntry {
  id: string;
  blueprintId: string;
  version: number;
  at: string;
  actor: string;
  summary: string;
}

const STORAGE_KEY = "menusifu:enterprise-nav-blueprint-v1";

let memoryStore: NavBlueprintStore | null = null;
let storeRevision = 0;

function emptyStore(): NavBlueprintStore {
  return { snapshots: {}, drafts: {}, changelog: [] };
}

function readStore(): NavBlueprintStore {
  if (memoryStore) return memoryStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryStore = emptyStore();
      return memoryStore;
    }
    const parsed = JSON.parse(raw) as NavBlueprintStore;
    memoryStore = {
      snapshots: parsed.snapshots ?? {},
      drafts: parsed.drafts ?? {},
      changelog: parsed.changelog ?? [],
    };
    return memoryStore;
  } catch {
    memoryStore = emptyStore();
    return memoryStore;
  }
}

function writeStore(store: NavBlueprintStore): void {
  memoryStore = store;
  storeRevision += 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getNavBlueprintStoreRevision(): number {
  return storeRevision;
}

/** 创建自定义节点后，用于四列矩阵聚焦到新节点 */
export interface NavBlueprintCustomFocus {
  blueprintId: string;
  l1Key: string;
  l2Key?: string;
  l3Key?: string;
}

let pendingCustomFocus: NavBlueprintCustomFocus | null = null;

export function setNavBlueprintCustomFocus(focus: NavBlueprintCustomFocus): void {
  pendingCustomFocus = focus;
}

export function consumeNavBlueprintCustomFocus(blueprintId: string): NavBlueprintCustomFocus | null {
  if (pendingCustomFocus?.blueprintId !== blueprintId) return null;
  const focus = pendingCustomFocus;
  pendingCustomFocus = null;
  return focus;
}

function commitCustomNavigationCreate(
  draft: NavBlueprintSnapshot,
  focus: Pick<NavBlueprintCustomFocus, "l1Key" | "l2Key" | "l3Key">,
): void {
  draft.navigationSource = "custom";
  writeNavBlueprintDraft(draft);
  setNavBlueprintCustomFocus({ blueprintId: draft.blueprintId, ...focus });
}

function isCustomPresetKey(key: string): boolean {
  return key.startsWith("custom-") || key.includes(":custom-");
}

function isCustomL3Assignment(l3Key: string): boolean {
  return l3Key.includes("custom-");
}

function splitLegacySnapshot(raw: NavBlueprintSnapshot): NavBlueprintSnapshot {
  if (raw.systemStructureSelection && raw.customStructureSelection) {
    return {
      ...raw,
      navigationSource: raw.navigationSource ?? "system",
      systemSeqAssignments: raw.systemSeqAssignments ?? {},
      systemStructureSelection: raw.systemStructureSelection ?? {},
      customSeqAssignments: raw.customSeqAssignments ?? {},
      customStructureSelection: raw.customStructureSelection ?? {},
    };
  }

  const legacySelection = raw.structureSelection ?? {};
  const legacySeq = raw.seqAssignments ?? {};
  const systemStructureSelection: Record<string, PlatformPresetNodeSelection> = {};
  const customStructureSelection: Record<string, PlatformPresetNodeSelection> = {};
  const systemSeqAssignments: Record<number, string> = {};
  const customSeqAssignments: Record<number, string> = {};

  for (const [key, sel] of Object.entries(legacySelection)) {
    if (isCustomPresetKey(key)) customStructureSelection[key] = sel;
    else systemStructureSelection[key] = sel;
  }
  for (const [seqStr, l3Key] of Object.entries(legacySeq)) {
    const seq = Number(seqStr);
    if (isCustomL3Assignment(l3Key)) customSeqAssignments[seq] = l3Key;
    else systemSeqAssignments[seq] = l3Key;
  }

  return {
    blueprintId: raw.blueprintId,
    version: raw.version,
    publishedAt: raw.publishedAt,
    navigationSource: raw.navigationSource ?? "system",
    customNodes: raw.customNodes ?? [],
    systemSeqAssignments,
    systemStructureSelection,
    customSeqAssignments,
    customStructureSelection,
  };
}

export function normalizeBlueprintSnapshot(raw: NavBlueprintSnapshot): NavBlueprintSnapshot {
  const split = splitLegacySnapshot(raw);
  return {
    ...split,
    customNodes: split.customNodes ?? [],
    systemSeqAssignments: split.systemSeqAssignments ?? {},
    systemStructureSelection: split.systemStructureSelection ?? {},
    customSeqAssignments: split.customSeqAssignments ?? {},
    customStructureSelection: split.customStructureSelection ?? {},
  };
}

/** 按当前 navigationSource 取生效的结构与 seq 归属（发布 / 同步用） */
export function resolveActiveBlueprintModules(snapshot: NavBlueprintSnapshot): {
  structureSelection: Record<string, PlatformPresetNodeSelection>;
  seqAssignments: Record<number, string>;
  customNodes: NavBlueprintCustomNode[];
} {
  const normalized = normalizeBlueprintSnapshot(snapshot);
  if (normalized.navigationSource === "custom") {
    return {
      structureSelection: normalized.customStructureSelection,
      seqAssignments: normalized.customSeqAssignments,
      customNodes: normalized.customNodes,
    };
  }
  return {
    structureSelection: normalized.systemStructureSelection,
    seqAssignments: normalized.systemSeqAssignments,
    customNodes: [],
  };
}

function emptyBlueprint(blueprintId: string): NavBlueprintSnapshot {
  return {
    blueprintId,
    version: 0,
    publishedAt: "",
    navigationSource: "system",
    customNodes: [],
    systemSeqAssignments: {},
    systemStructureSelection: {},
    customSeqAssignments: {},
    customStructureSelection: {},
  };
}

export function getPublishedNavBlueprint(blueprintId: string): NavBlueprintSnapshot | undefined {
  const snap = readStore().snapshots[blueprintId];
  return snap ? normalizeBlueprintSnapshot(structuredClone(snap)) : undefined;
}

export function getNavBlueprintDraft(blueprintId: string): NavBlueprintSnapshot {
  const store = readStore();
  const draft = store.drafts[blueprintId];
  if (draft) return normalizeBlueprintSnapshot(structuredClone(draft));
  const published = store.snapshots[blueprintId];
  if (published) return normalizeBlueprintSnapshot(structuredClone(published));
  return emptyBlueprint(blueprintId);
}

export function setNavBlueprintNavigationSource(
  blueprintId: string,
  source: NavBlueprintNavigationSource,
): NavBlueprintSnapshot {
  const draft = getNavBlueprintDraft(blueprintId);
  draft.navigationSource = source;
  writeNavBlueprintDraft(draft);
  return draft;
}

export function writeNavBlueprintDraft(snapshot: NavBlueprintSnapshot): void {
  const store = readStore();
  store.drafts[snapshot.blueprintId] = normalizeBlueprintSnapshot(structuredClone(snapshot));
  writeStore(store);
}

export function publishNavBlueprint(snapshot: NavBlueprintSnapshot): NavBlueprintSnapshot {
  const store = readStore();
  const nextVersion = (store.snapshots[snapshot.blueprintId]?.version ?? 0) + 1;
  const actor = getAuthenticatedEmail() ?? "system";
  const normalized = normalizeBlueprintSnapshot(snapshot);
  const published: NavBlueprintSnapshot = {
    ...structuredClone(normalized),
    version: nextVersion,
    publishedAt: new Date().toISOString(),
    systemStructureSelection: syncSelectionDisplayWithEnabled(normalized.systemStructureSelection),
    customStructureSelection: syncSelectionDisplayWithEnabled(normalized.customStructureSelection),
  };
  store.snapshots[snapshot.blueprintId] = published;
  delete store.drafts[snapshot.blueprintId];
  store.changelog.unshift({
    id: `nb-${Date.now()}`,
    blueprintId: snapshot.blueprintId,
    version: nextVersion,
    at: published.publishedAt,
    actor,
    summary: `发布导航蓝图 v${nextVersion}（来源 ${published.navigationSource === "custom" ? "自定义" : "系统"} · 自定义节点 ${published.customNodes.length} 个）`,
  });
  store.changelog = store.changelog.slice(0, 100);
  writeStore(store);
  return published;
}

export function restoreNavBlueprintSystemDefault(blueprintId: string): NavBlueprintSnapshot {
  const draft = getNavBlueprintDraft(blueprintId);
  draft.systemSeqAssignments = {};
  draft.systemStructureSelection = {};
  writeNavBlueprintDraft(draft);
  return draft;
}

export function restoreNavBlueprintCustomTree(blueprintId: string): NavBlueprintSnapshot {
  const draft = getNavBlueprintDraft(blueprintId);
  draft.customNodes = [];
  draft.customSeqAssignments = {};
  draft.customStructureSelection = {};
  writeNavBlueprintDraft(draft);
  return draft;
}

export function addNavBlueprintCustomNode(
  blueprintId: string,
  node: Omit<NavBlueprintCustomNode, "id" | "createdAt" | "sortOrder"> & { sortOrder?: number },
): NavBlueprintCustomNode {
  const draft = getNavBlueprintDraft(blueprintId);
  const entry: NavBlueprintCustomNode = {
    ...node,
    id: `custom-${node.level}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sortOrder: node.sortOrder ?? draft.customNodes.length,
    createdAt: new Date().toISOString(),
  };
  draft.customNodes.push(entry);
  writeNavBlueprintDraft(draft);
  return entry;
}

export interface NavBlueprintL2CreateInput {
  label: string;
  labelEn?: string;
  route: string;
  isSettingsHub?: boolean;
  settingsPath?: string;
  l2MountKind?: NavBlueprintL2MountKind;
}

export interface NavBlueprintL1CreateInput {
  label: string;
  labelEn?: string;
  route: string;
  defaultChildRoute?: string;
  subNavPlacement?: "sheet" | "sidebar" | "tabs";
  l2Children: NavBlueprintL2CreateInput[];
  l1MountKind?: NavBlueprintL1MountKind;
  /** 设置 Hub 下预选的 seq（自动创建 L3 分组并写入 seqAssignments） */
  settingsSeqs?: number[];
}

/** 一次创建 custom L1 及下属 L2，并启用 structureSelection */
export function createNavBlueprintL1WithChildren(
  blueprintId: string,
  input: NavBlueprintL1CreateInput,
): NavBlueprintCustomNode {
  const draft = getNavBlueprintDraft(blueprintId);
  const ts = Date.now();
  const l1Id = `custom-1-${ts}`;

  const l1Node: NavBlueprintCustomNode = {
    id: l1Id,
    level: 1,
    label: input.label.trim(),
    labelEn: input.labelEn?.trim() || undefined,
    route: input.route,
    defaultChildRoute: input.defaultChildRoute,
    subNavPlacement: input.subNavPlacement ?? "sheet",
    l1MountKind: input.l1MountKind,
    parentKey: null,
    sortOrder: draft.customNodes.filter((n) => n.level === 1).length,
    createdAt: new Date().toISOString(),
  };

  const l2Nodes: NavBlueprintCustomNode[] = input.l2Children.map((child, idx) => ({
    id: `custom-2-${ts}-${idx}`,
    level: 2,
    label: child.label.trim(),
    labelEn: child.labelEn?.trim() || undefined,
    route: child.route,
    parentKey: l1Id,
    isSettingsHub: child.isSettingsHub,
    settingsPath: child.settingsPath,
    l2MountKind: child.l2MountKind,
    sortOrder: idx,
    createdAt: new Date().toISOString(),
  }));

  const settingsHubL2 = l2Nodes.find((n) => n.isSettingsHub);
  const l3Nodes: NavBlueprintCustomNode[] = [];
  const seqAssignments = { ...draft.customSeqAssignments };

  if (settingsHubL2 && input.settingsSeqs?.length) {
    const grouped = new Map<string, { groupKey: string; groupTitle: string; seqs: number[] }>();
    for (const seq of input.settingsSeqs) {
      const item = getCatalogItemBySeq(seq);
      if (!item) continue;
      const bucket = grouped.get(item.groupKey) ?? {
        groupKey: item.groupKey,
        groupTitle: item.groupTitle,
        seqs: [],
      };
      bucket.seqs.push(seq);
      grouped.set(item.groupKey, bucket);
    }

    let l3Idx = 0;
    for (const group of grouped.values()) {
      const l3Id = `custom-3-${ts}-${l3Idx}`;
      l3Nodes.push({
        id: l3Id,
        level: 3,
        label: group.groupTitle,
        groupKey: group.groupKey,
        parentKey: settingsHubL2.id,
        settingsPath: settingsHubL2.settingsPath ?? settingsHubL2.route,
        sortOrder: l3Idx,
        createdAt: new Date().toISOString(),
      });
      const l3Key = `${settingsHubL2.id}:${group.groupKey}`;
      for (const seq of group.seqs) {
        seqAssignments[seq] = l3Key;
      }
      l3Idx += 1;
    }
  }

  let selection = { ...draft.customStructureSelection };
  selection = ensureStructureSelectionKey(selection, l1Id, true);
  for (const l2 of l2Nodes) {
    selection = ensureStructureSelectionKey(selection, l2.id, true);
  }
  for (const l3 of l3Nodes) {
    const l3Key = `${l3.parentKey}:${l3.groupKey ?? l3.id}`;
    selection = ensureStructureSelectionKey(selection, l3Key, true);
  }
  if (input.settingsSeqs?.length) {
    for (const seq of input.settingsSeqs) {
      const l4Key = getSettingNodeKeyBySeq(seq);
      if (l4Key) selection = ensureStructureSelectionKey(selection, l4Key, true);
    }
  }

  draft.customNodes.push(l1Node, ...l2Nodes, ...l3Nodes);
  draft.customSeqAssignments = seqAssignments;
  draft.customStructureSelection = selection;
  commitCustomNavigationCreate(draft, {
    l1Key: l1Id,
    l2Key: l2Nodes[0]?.id,
    l3Key: l3Nodes[0] ? `${l3Nodes[0].parentKey}:${l3Nodes[0].groupKey}` : undefined,
  });
  return l1Node;
}

/** 更新 custom L1 及其下属 L2/L3（先移除旧子树再按新配置重建） */
export function updateNavBlueprintL1WithChildren(
  blueprintId: string,
  l1Id: string,
  input: NavBlueprintL1CreateInput,
): NavBlueprintCustomNode | undefined {
  const draft = getNavBlueprintDraft(blueprintId);
  const l1Idx = draft.customNodes.findIndex((n) => n.id === l1Id && n.level === 1);
  if (l1Idx < 0) return undefined;

  const subtreeIds = collectCustomSubtreeIds(draft.customNodes, l1Id);
  const childRemoveIds = new Set([...subtreeIds].filter((id) => id !== l1Id));
  const removedNodes = draft.customNodes.filter((n) => childRemoveIds.has(n.id));

  const removedL3Keys = new Set<string>();
  for (const n of removedNodes) {
    if (n.level === 3 && n.parentKey) {
      removedL3Keys.add(`${n.parentKey}:${n.groupKey ?? n.id}`);
    }
  }
  for (const [seq, l3Key] of Object.entries(draft.customSeqAssignments)) {
    if (removedL3Keys.has(l3Key)) {
      delete draft.customSeqAssignments[Number(seq)];
    }
  }

  purgeCustomStructureSelectionForRemovedNodes(draft, removedNodes, childRemoveIds);
  draft.customNodes = draft.customNodes.filter((n) => !childRemoveIds.has(n.id));

  const existingL1 = draft.customNodes.find((n) => n.id === l1Id);
  if (!existingL1) return undefined;

  const ts = Date.now();
  const l1Node: NavBlueprintCustomNode = {
    ...existingL1,
    label: input.label.trim(),
    labelEn: input.labelEn?.trim() || undefined,
    route: input.route,
    defaultChildRoute: input.defaultChildRoute,
    subNavPlacement: input.subNavPlacement ?? existingL1.subNavPlacement ?? "sheet",
    l1MountKind: input.l1MountKind,
  };

  const l1UpdateIdx = draft.customNodes.findIndex((n) => n.id === l1Id);
  draft.customNodes[l1UpdateIdx] = l1Node;

  const l2Nodes: NavBlueprintCustomNode[] = input.l2Children.map((child, idx) => ({
    id: `custom-2-${ts}-${idx}`,
    level: 2,
    label: child.label.trim(),
    labelEn: child.labelEn?.trim() || undefined,
    route: child.route,
    parentKey: l1Id,
    isSettingsHub: child.isSettingsHub,
    settingsPath: child.settingsPath,
    l2MountKind: child.l2MountKind,
    sortOrder: idx,
    createdAt: new Date().toISOString(),
  }));

  const settingsHubL2 = l2Nodes.find((n) => n.isSettingsHub);
  const l3Nodes: NavBlueprintCustomNode[] = [];
  const seqAssignments = { ...draft.customSeqAssignments };

  if (settingsHubL2 && input.settingsSeqs?.length) {
    const grouped = new Map<string, { groupKey: string; groupTitle: string; seqs: number[] }>();
    for (const seq of input.settingsSeqs) {
      const item = getCatalogItemBySeq(seq);
      if (!item) continue;
      const bucket = grouped.get(item.groupKey) ?? {
        groupKey: item.groupKey,
        groupTitle: item.groupTitle,
        seqs: [],
      };
      bucket.seqs.push(seq);
      grouped.set(item.groupKey, bucket);
    }

    let l3Idx = 0;
    for (const group of grouped.values()) {
      const l3Id = `custom-3-${ts}-${l3Idx}`;
      l3Nodes.push({
        id: l3Id,
        level: 3,
        label: group.groupTitle,
        groupKey: group.groupKey,
        parentKey: settingsHubL2.id,
        settingsPath: settingsHubL2.settingsPath ?? settingsHubL2.route,
        sortOrder: l3Idx,
        createdAt: new Date().toISOString(),
      });
      const l3Key = `${settingsHubL2.id}:${group.groupKey}`;
      for (const seq of group.seqs) {
        seqAssignments[seq] = l3Key;
      }
      l3Idx += 1;
    }
  }

  let selection = { ...draft.customStructureSelection };
  selection = ensureStructureSelectionKey(selection, l1Id, true);
  for (const l2 of l2Nodes) {
    selection = ensureStructureSelectionKey(selection, l2.id, true);
  }
  for (const l3 of l3Nodes) {
    const l3Key = `${l3.parentKey}:${l3.groupKey ?? l3.id}`;
    selection = ensureStructureSelectionKey(selection, l3Key, true);
  }
  if (input.settingsSeqs?.length) {
    for (const seq of input.settingsSeqs) {
      const l4Key = getSettingNodeKeyBySeq(seq);
      if (l4Key) selection = ensureStructureSelectionKey(selection, l4Key, true);
    }
  }

  draft.customNodes.push(...l2Nodes, ...l3Nodes);
  draft.customSeqAssignments = seqAssignments;
  draft.customStructureSelection = selection;
  commitCustomNavigationCreate(draft, {
    l1Key: l1Id,
    l2Key: l2Nodes[0]?.id,
    l3Key: l3Nodes[0] ? `${l3Nodes[0].parentKey}:${l3Nodes[0].groupKey}` : undefined,
  });
  return l1Node;
}

export function getNavBlueprintCustomSubtreeIds(blueprintId: string, rootId: string): Set<string> {
  const draft = getNavBlueprintDraft(blueprintId);
  return collectCustomSubtreeIds(draft.customNodes, rootId);
}

function isPresetLandingPath(path: string): boolean {
  return buildNavPresetItemRegistry().some((e) => e.landingPath === path);
}

export function resolveCustomL3MountTagKind(
  l3: NavBlueprintCustomNode,
): "page" | "features" | undefined {
  const kind = resolveCustomL3MountKind(l3);
  if (kind === "page") return "page";
  if (kind === "features") return "features";
  return undefined;
}

/** 推断 custom L3 配置方式（兼容未写入 l3MountKind 的旧数据） */
export function resolveCustomL3MountKind(l3: NavBlueprintCustomNode): NavBlueprintL3MountKind {
  if (l3.l3MountKind) return l3.l3MountKind;
  if (l3.route && isPresetLandingPath(l3.route)) return "features";
  if (l3.route && !l3.settingsPath) return "page";
  if (l3.route) return "page";
  return "manual-l4";
}

export function resolveCustomL2MountTagKind(
  l2: NavBlueprintCustomNode,
): "page" | "features" | undefined {
  const kind = resolveCustomL2MountKind(l2);
  if (kind === "page") return "page";
  if (kind === "features") return "features";
  if (kind === "manual-l3" && l2.isSettingsHub) return "features";
  return undefined;
}

/** 推断 custom L2 配置方式（兼容未写入 l2MountKind 的旧数据） */
export function resolveCustomL2MountKind(l2: NavBlueprintCustomNode): NavBlueprintL2MountKind {
  if (l2.l2MountKind) return l2.l2MountKind;
  if (l2.isSettingsHub || isPresetLandingPath(l2.route ?? "")) return "features";
  if (l2.route?.startsWith("/custom/l2-")) return "manual-l3";
  if (l2.route) return "page";
  return "manual-l3";
}

/** 推断 custom L1 配置方式（兼容未写入 l1MountKind 的旧数据） */
export function resolveCustomL1MountKind(
  l1: NavBlueprintCustomNode,
  l2Children: NavBlueprintCustomNode[],
): NavBlueprintL1MountKind {
  if (l1.l1MountKind) return l1.l1MountKind;
  if (l2Children.length === 0) {
    if (l1.route?.startsWith("/custom/l1-")) return "manual-l2";
    return "page";
  }
  const featureL2 = l2Children.filter((l2) => !l2.isSettingsHub);
  if (featureL2.some((l2) => isPresetLandingPath(l2.route ?? ""))) return "features";
  return "manual-l2";
}

/** 仅「手动配置二级导航」类 L1 允许在树中继续新增二级 */
export function canCreateCustomL2UnderL1(blueprintId: string, l1NodeId: string): boolean {
  const l1 = getNavBlueprintCustomL1Node(blueprintId, l1NodeId);
  if (!l1) return false;
  const draft = getNavBlueprintDraft(blueprintId);
  const l2Children = draft.customNodes.filter((n) => n.level === 2 && n.parentKey === l1NodeId);
  return resolveCustomL1MountKind(l1, l2Children) === "manual-l2";
}

export function customL2CreationBlockedReason(blueprintId: string, l1NodeId: string): string | null {
  const l1 = getNavBlueprintCustomL1Node(blueprintId, l1NodeId);
  if (!l1) return "未找到该一级导航。";
  const draft = getNavBlueprintDraft(blueprintId);
  const l2Children = draft.customNodes.filter((n) => n.level === 2 && n.parentKey === l1NodeId);
  const kind = resolveCustomL1MountKind(l1, l2Children);
  if (kind === "manual-l2") return null;
  if (kind === "page") {
    return "该一级导航为「页面」挂载，不支持新增二级导航。请先将配置方式改为「手动配置二级导航」，或选择采用该方式的一级入口。";
  }
  return "该一级导航为「设置/功能」挂载，不支持新增二级导航。请先将配置方式改为「手动配置二级导航」，或选择采用该方式的一级入口。";
}

/** 仅「手动配置二级导航」类 L1 允许在树中继续新增三级分组 */
export function canCreateCustomL3UnderL1(blueprintId: string, l1NodeId: string): boolean {
  return canCreateCustomL2UnderL1(blueprintId, l1NodeId);
}

export function customL3CreationBlockedReason(blueprintId: string, l1NodeId: string): string | null {
  const l1 = getNavBlueprintCustomL1Node(blueprintId, l1NodeId);
  if (!l1) return "未找到该一级导航。";
  const draft = getNavBlueprintDraft(blueprintId);
  const l2Children = draft.customNodes.filter((n) => n.level === 2 && n.parentKey === l1NodeId);
  const kind = resolveCustomL1MountKind(l1, l2Children);
  if (kind === "manual-l2") return null;
  if (kind === "page") {
    return "该一级导航为「页面」挂载，不支持新增三级分组。请先将配置方式改为「手动配置二级导航」，或选择采用该方式的一级入口。";
  }
  return "该一级导航为「设置/功能」挂载，不支持新增三级分组。请先将配置方式改为「手动配置二级导航」，或选择采用该方式的一级入口。";
}

/** 【页面】/【设置】直达类二级（叶子入口）不展示「+ 三级分组」；仅手动配置三级类或设置 Hub 展示 */
export function shouldShowCustomL3ToolbarForL2(l2: NavBlueprintCustomNode): boolean {
  if (isCustomL1MountedPageL2Key(l2.id)) return false;
  const kind = resolveCustomL2MountKind(l2);
  if (kind === "page") return false;
  if (kind === "features" && !l2.isSettingsHub) return false;
  return kind === "manual-l3" || Boolean(l2.isSettingsHub);
}

/** 是否允许在指定二级下新增三级分组 */
export function canCreateCustomL3UnderL2(blueprintId: string, l2NodeId: string): boolean {
  if (isCustomL1MountedPageL2Key(l2NodeId)) return false;
  const draft = getNavBlueprintDraft(blueprintId);
  const l2 = draft.customNodes.find((n) => n.id === l2NodeId && n.level === 2);
  if (!l2?.parentKey) return false;
  const l1 = getNavBlueprintCustomL1Node(blueprintId, l2.parentKey);
  if (!l1) return false;
  const l2Siblings = draft.customNodes.filter((n) => n.level === 2 && n.parentKey === l2.parentKey);
  if (resolveCustomL1MountKind(l1, l2Siblings) !== "manual-l2") return false;
  return shouldShowCustomL3ToolbarForL2(l2);
}

export function customL3CreationBlockedReasonForL2(blueprintId: string, l2NodeId: string): string | null {
  if (isCustomL1MountedPageL2Key(l2NodeId)) {
    return "该二级为一级挂载页面的只读展示项，不支持新增三级分组。";
  }
  const draft = getNavBlueprintDraft(blueprintId);
  const l2 = draft.customNodes.find((n) => n.id === l2NodeId && n.level === 2);
  if (!l2) return "未找到该二级导航。";
  if (l2.parentKey) {
    const l1Blocked = customL3CreationBlockedReason(blueprintId, l2.parentKey);
    if (l1Blocked) return l1Blocked;
  }
  const kind = resolveCustomL2MountKind(l2);
  if (kind === "page") {
    return "该二级导航为「页面」直达挂载，不支持新增三级分组。请选择「手动配置三级导航」类二级入口。";
  }
  if (kind === "features" && !l2.isSettingsHub) {
    return "该二级导航为「设置/功能」直达挂载，不支持新增三级分组。请选择「手动配置三级导航」类二级入口。";
  }
  if (!canCreateCustomL3UnderL2(blueprintId, l2NodeId)) {
    return "当前二级入口不支持新增三级分组。";
  }
  return null;
}

export interface CustomStructureToolbarView {
  showAddL2: boolean;
  showAddL3: boolean;
  enableAddL2: boolean;
  enableAddL3: boolean;
  addL2Title: string;
  addL3Title: string;
}

/** 自定义树工具栏：手动配置二级类 L1 在一级选中时仅展示新增二级，二级选中时仅展示新增三级 */
export function resolveCustomStructureToolbarView(
  blueprintId: string,
  activeL1: string,
  activeL2: string,
): CustomStructureToolbarView {
  const disabledL2Title = "仅配置方式为「手动配置二级导航」的一级入口支持新增二级";
  const disabledL3Title = "仅配置方式为「手动配置二级导航」的一级入口支持新增三级分组";
  const directL2L3Title = "「页面」「设置/功能」直达类二级不支持新增三级分组，请选择「手动配置三级导航」类二级";

  if (!activeL1) {
    return {
      showAddL2: true,
      showAddL3: true,
      enableAddL2: false,
      enableAddL3: false,
      addL2Title: disabledL2Title,
      addL3Title: disabledL3Title,
    };
  }

  if (!canCreateCustomL2UnderL1(blueprintId, activeL1)) {
    return {
      showAddL2: false,
      showAddL3: false,
      enableAddL2: false,
      enableAddL3: false,
      addL2Title: disabledL2Title,
      addL3Title: disabledL3Title,
    };
  }

  if (!activeL2) {
    return {
      showAddL2: true,
      showAddL3: false,
      enableAddL2: true,
      enableAddL3: false,
      addL2Title: "在当前选中的一级导航下新增二级",
      addL3Title: disabledL3Title,
    };
  }

  const draft = getNavBlueprintDraft(blueprintId);
  const l2 = draft.customNodes.find((n) => n.id === activeL2 && n.level === 2);
  const showL3 = l2 ? shouldShowCustomL3ToolbarForL2(l2) : false;
  const canAddL3UnderL2 = showL3 && canCreateCustomL3UnderL2(blueprintId, activeL2);

  return {
    showAddL2: false,
    showAddL3: showL3,
    enableAddL2: false,
    enableAddL3: canAddL3UnderL2,
    addL2Title: disabledL2Title,
    addL3Title: canAddL3UnderL2
      ? "在当前选中的二级导航下新增三级分组"
      : directL2L3Title,
  };
}

/** 在已有 custom L1 下新增 L2（可选设置项预选） */
export function createNavBlueprintL2UnderL1(
  blueprintId: string,
  parentL1Key: string,
  input: NavBlueprintL2CreateInput & { settingsSeqs?: number[] },
): NavBlueprintCustomNode {
  const blocked = customL2CreationBlockedReason(blueprintId, parentL1Key);
  if (blocked) throw new Error(blocked);

  const draft = getNavBlueprintDraft(blueprintId);
  const ts = Date.now();
  const sortOrder = draft.customNodes.filter((n) => n.level === 2 && n.parentKey === parentL1Key).length;

  const l2Node: NavBlueprintCustomNode = {
    id: `custom-2-${ts}`,
    level: 2,
    label: input.label.trim(),
    labelEn: input.labelEn?.trim() || undefined,
    route: input.route,
    parentKey: parentL1Key,
    isSettingsHub: input.isSettingsHub,
    settingsPath: input.settingsPath,
    l2MountKind: input.l2MountKind,
    sortOrder,
    createdAt: new Date().toISOString(),
  };

  const l3Nodes: NavBlueprintCustomNode[] = [];
  const seqAssignments = { ...draft.customSeqAssignments };

  if (l2Node.isSettingsHub && input.settingsSeqs?.length) {
    const grouped = new Map<string, { groupKey: string; groupTitle: string; seqs: number[] }>();
    for (const seq of input.settingsSeqs) {
      const item = getCatalogItemBySeq(seq);
      if (!item) continue;
      const bucket = grouped.get(item.groupKey) ?? {
        groupKey: item.groupKey,
        groupTitle: item.groupTitle,
        seqs: [],
      };
      bucket.seqs.push(seq);
      grouped.set(item.groupKey, bucket);
    }
    let l3Idx = 0;
    for (const group of grouped.values()) {
      l3Nodes.push({
        id: `custom-3-${ts}-${l3Idx}`,
        level: 3,
        label: group.groupTitle,
        groupKey: group.groupKey,
        parentKey: l2Node.id,
        settingsPath: l2Node.settingsPath ?? l2Node.route,
        sortOrder: l3Idx,
        createdAt: new Date().toISOString(),
      });
      const l3Key = `${l2Node.id}:${group.groupKey}`;
      for (const seq of group.seqs) seqAssignments[seq] = l3Key;
      l3Idx += 1;
    }
  }

  let selection = { ...draft.customStructureSelection };
  selection = ensureStructureSelectionKey(selection, l2Node.id, true);
  for (const l3 of l3Nodes) {
    selection = ensureStructureSelectionKey(selection, `${l3.parentKey}:${l3.groupKey ?? l3.id}`, true);
  }
  if (input.settingsSeqs?.length) {
    for (const seq of input.settingsSeqs) {
      const l4Key = getSettingNodeKeyBySeq(seq);
      if (l4Key) selection = ensureStructureSelectionKey(selection, l4Key, true);
    }
  }

  draft.customNodes.push(l2Node, ...l3Nodes);
  draft.customSeqAssignments = seqAssignments;
  draft.customStructureSelection = selection;
  commitCustomNavigationCreate(draft, {
    l1Key: parentL1Key,
    l2Key: l2Node.id,
    l3Key: l3Nodes[0] ? `${l3Nodes[0].parentKey}:${l3Nodes[0].groupKey}` : undefined,
  });
  return l2Node;
}

export interface NavBlueprintL3CreateInput {
  label: string;
  labelEn?: string;
  groupKey: string;
  settingsPath: string;
  settingsSeqs?: number[];
  l3MountKind?: NavBlueprintL3MountKind;
  route?: string;
}

/** 在已有 L2（设置 Hub）下新增 L3 分组，可选预选设置项归属 */
export function createNavBlueprintL3UnderL2(
  blueprintId: string,
  parentL2Key: string,
  input: NavBlueprintL3CreateInput,
): NavBlueprintCustomNode {
  const draft = getNavBlueprintDraft(blueprintId);
  const sortOrder = draft.customNodes.filter((n) => n.level === 3 && n.parentKey === parentL2Key).length;
  const ts = Date.now();

  const l3Node: NavBlueprintCustomNode = {
    id: `custom-3-${ts}`,
    level: 3,
    label: input.label.trim(),
    labelEn: input.labelEn?.trim() || undefined,
    groupKey: input.groupKey.trim(),
    parentKey: parentL2Key,
    settingsPath: input.settingsPath,
    route: input.route,
    l3MountKind: input.l3MountKind,
    sortOrder,
    createdAt: new Date().toISOString(),
  };

  const seqAssignments = { ...draft.customSeqAssignments };
  const l3Key = `${parentL2Key}:${l3Node.groupKey}`;
  if (input.settingsSeqs?.length) {
    for (const seq of input.settingsSeqs) {
      seqAssignments[seq] = l3Key;
    }
  }

  let selection = { ...draft.customStructureSelection };
  selection = ensureStructureSelectionKey(selection, l3Key, true);
  if (input.settingsSeqs?.length) {
    for (const seq of input.settingsSeqs) {
      const l4Key = getSettingNodeKeyBySeq(seq);
      if (l4Key) selection = ensureStructureSelectionKey(selection, l4Key, true);
    }
  }

  draft.customNodes.push(l3Node);
  draft.customSeqAssignments = seqAssignments;
  draft.customStructureSelection = selection;
  const parentL2 = draft.customNodes.find((n) => n.id === parentL2Key);
  commitCustomNavigationCreate(draft, {
    l1Key: parentL2?.parentKey ?? parentL2Key,
    l2Key: parentL2Key,
    l3Key,
  });
  return l3Node;
}

export function getOccupiedRoutesFromBlueprint(
  blueprintId: string,
  excludeNodeIds?: Set<string>,
): Set<string> {
  const draft = getNavBlueprintDraft(blueprintId);
  const paths = new Set<string>();
  for (const n of draft.customNodes) {
    if (excludeNodeIds?.has(n.id)) continue;
    if (n.route) paths.add(n.route);
    if (n.settingsPath) paths.add(n.settingsPath);
  }
  return paths;
}

function collectCustomSubtreeIds(nodes: NavBlueprintCustomNode[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const n of nodes) {
      if (n.parentKey && ids.has(n.parentKey) && !ids.has(n.id)) {
        ids.add(n.id);
        expanded = true;
      }
    }
  }
  return ids;
}

function purgeCustomStructureSelectionForRemovedNodes(
  draft: NavBlueprintSnapshot,
  removedNodes: NavBlueprintCustomNode[],
  removeIds: Set<string>,
): void {
  const keysToDelete = new Set<string>();
  for (const n of removedNodes) {
    if (n.level === 1 || n.level === 2) keysToDelete.add(n.id);
    if (n.level === 3 && n.parentKey) keysToDelete.add(`${n.parentKey}:${n.groupKey ?? n.id}`);
  }
  for (const n of removedNodes) {
    if (n.level !== 2) continue;
    for (const key of Object.keys(draft.customStructureSelection)) {
      if (key.startsWith(`${n.id}:`)) keysToDelete.add(key);
    }
  }
  for (const key of keysToDelete) {
    delete draft.customStructureSelection[key];
  }
  for (const key of Object.keys(draft.customStructureSelection)) {
    if (removeIds.has(key)) delete draft.customStructureSelection[key];
  }
}

export function updateNavBlueprintCustomNode(
  blueprintId: string,
  nodeId: string,
  patch: Partial<
    Pick<
      NavBlueprintCustomNode,
      "label" | "labelEn" | "route" | "defaultChildRoute" | "settingsPath" | "groupKey"
    >
  >,
): void {
  const draft = getNavBlueprintDraft(blueprintId);
  const idx = draft.customNodes.findIndex((n) => n.id === nodeId);
  if (idx < 0) return;
  draft.customNodes[idx] = { ...draft.customNodes[idx]!, ...patch };
  writeNavBlueprintDraft(draft);
}

export function removeNavBlueprintCustomNode(blueprintId: string, nodeId: string): void {
  const draft = getNavBlueprintDraft(blueprintId);
  const removeIds = collectCustomSubtreeIds(draft.customNodes, nodeId);
  const removedNodes = draft.customNodes.filter((n) => removeIds.has(n.id));

  const removedL3Keys = new Set<string>();
  for (const n of removedNodes) {
    if (n.level === 3 && n.parentKey) {
      removedL3Keys.add(`${n.parentKey}:${n.groupKey ?? n.id}`);
    }
  }

  draft.customNodes = draft.customNodes.filter((n) => !removeIds.has(n.id));

  for (const [seq, l3Key] of Object.entries(draft.customSeqAssignments)) {
    if (removedL3Keys.has(l3Key) || [...removeIds].some((id) => l3Key.includes(id))) {
      delete draft.customSeqAssignments[Number(seq)];
    }
  }

  purgeCustomStructureSelectionForRemovedNodes(draft, removedNodes, removeIds);
  writeNavBlueprintDraft(draft);
}

export function getNavBlueprintCustomL1Node(
  blueprintId: string,
  l1NodeId: string,
): NavBlueprintCustomNode | undefined {
  const draft = getNavBlueprintDraft(blueprintId);
  const node = draft.customNodes.find((n) => n.id === l1NodeId && n.level === 1);
  return node ? { ...node } : undefined;
}

export function assignSeqToL3(
  blueprintId: string,
  seq: number,
  l3Key: string,
  module: "system" | "custom" = "system",
): void {
  const draft = getNavBlueprintDraft(blueprintId);
  if (module === "custom") draft.customSeqAssignments[seq] = l3Key;
  else draft.systemSeqAssignments[seq] = l3Key;
  writeNavBlueprintDraft(draft);
}

export function unassignSeq(
  blueprintId: string,
  seq: number,
  module: "system" | "custom" = "system",
): void {
  const draft = getNavBlueprintDraft(blueprintId);
  if (module === "custom") delete draft.customSeqAssignments[seq];
  else delete draft.systemSeqAssignments[seq];
  writeNavBlueprintDraft(draft);
}

export function countAssignedSeqs(blueprint: NavBlueprintSnapshot): number {
  const n = normalizeBlueprintSnapshot(blueprint);
  return Object.keys(n.systemSeqAssignments).length + Object.keys(n.customSeqAssignments).length;
}

export function countSystemAssignedSeqs(blueprint: NavBlueprintSnapshot): number {
  return Object.keys(normalizeBlueprintSnapshot(blueprint).systemSeqAssignments).length;
}

export function countCustomAssignedSeqs(blueprint: NavBlueprintSnapshot): number {
  return Object.keys(normalizeBlueprintSnapshot(blueprint).customSeqAssignments).length;
}

export function getNavBlueprintChangelog(blueprintId: string): NavBlueprintChangeLogEntry[] {
  return readStore().changelog.filter((e) => e.blueprintId === blueprintId);
}

/** 默认全启用 selection 占位（发布前由树构建器填充） */
export function ensureStructureSelectionKey(
  selection: Record<string, PlatformPresetNodeSelection>,
  key: string,
  enabled = true,
): Record<string, PlatformPresetNodeSelection> {
  if (selection[key]) return selection;
  return { ...selection, [key]: syncNodeDisplayWithEnabled(undefined, enabled) };
}
