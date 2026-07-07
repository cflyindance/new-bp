/**
 * 菜单路由 · 设置项注册表（只读，派生 module-settings-catalog）
 */
import {
  listAllModuleSettingCatalogEntries,
  type ModuleSettingCatalogItem,
} from "./module-settings-catalog";
import { buildPermissionModuleGroups, type PermissionTreeNode } from "./permission-registry";

export interface NavSettingRegistryEntry {
  seq: number;
  title: string;
  moduleName: string;
  groupKey: string;
  groupTitle: string;
  settingsPath: string;
  hubTitle: string;
  /** 是否已在蓝图中归属到其他 L3 */
  assignedL3Key?: string;
}

let cachedSettings: NavSettingRegistryEntry[] | null = null;

function walkTree(node: PermissionTreeNode, visit: (n: PermissionTreeNode) => void): void {
  visit(node);
  for (const c of node.children) walkTree(c, visit);
}

export function getSettingNodeKeyBySeq(seq: number): string | undefined {
  let key: string | undefined;
  for (const g of buildPermissionModuleGroups()) {
    walkTree(g.tree, (n) => {
      if (n.resource.level === 4 && n.resource.seq === seq) key = n.resource.key;
    });
  }
  return key;
}

export function buildNavSettingRegistry(
  seqAssignments: Record<number, string> = {},
): NavSettingRegistryEntry[] {
  const rows = listAllModuleSettingCatalogEntries();
  return rows.map(({ hubTitle, settingsPath, item }) => ({
    seq: item.seq,
    title: item.title,
    moduleName: item.moduleName,
    groupKey: item.groupKey,
    groupTitle: item.groupTitle,
    settingsPath,
    hubTitle,
    assignedL3Key: seqAssignments[item.seq],
  }));
}

export function getNavSettingRegistry(seqAssignments?: Record<number, string>): NavSettingRegistryEntry[] {
  if (!seqAssignments && cachedSettings) return cachedSettings;
  const list = buildNavSettingRegistry(seqAssignments);
  if (!seqAssignments) cachedSettings = list;
  return list;
}

export function searchNavSettingRegistry(
  query: string,
  seqAssignments: Record<number, string> = {},
  settingsPathFilter?: string,
): NavSettingRegistryEntry[] {
  const q = query.trim().toLowerCase();
  return getNavSettingRegistry(seqAssignments).filter((e) => {
    if (settingsPathFilter && e.settingsPath !== settingsPathFilter) return false;
    if (!q) return true;
    return (
      String(e.seq).includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.moduleName.toLowerCase().includes(q) ||
      e.groupTitle.toLowerCase().includes(q) ||
      e.hubTitle.toLowerCase().includes(q)
    );
  });
}

export function groupNavSettingEntries(
  entries: NavSettingRegistryEntry[],
): Map<string, NavSettingRegistryEntry[]> {
  const map = new Map<string, NavSettingRegistryEntry[]>();
  for (const e of entries) {
    const key = `${e.hubTitle} · ${e.groupTitle}`;
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}

export function groupSelectedSeqsByL3(
  seqs: number[],
): Map<string, { groupKey: string; groupTitle: string; seqs: number[] }> {
  const registry = getNavSettingRegistry();
  const byKey = new Map<string, { groupKey: string; groupTitle: string; seqs: number[] }>();
  for (const seq of seqs) {
    const entry = registry.find((e) => e.seq === seq);
    if (!entry) continue;
    const bucket = byKey.get(entry.groupKey) ?? {
      groupKey: entry.groupKey,
      groupTitle: entry.groupTitle,
      seqs: [],
    };
    bucket.seqs.push(seq);
    byKey.set(entry.groupKey, bucket);
  }
  return byKey;
}

export interface NavSettingCatalogGroupOption {
  groupKey: string;
  groupTitle: string;
  seqs: number[];
}

/** 某设置 Hub 路径下的系统三级分组目录（去重） */
export function listCatalogGroupsForSettingsPath(settingsPath: string): NavSettingCatalogGroupOption[] {
  const map = new Map<string, NavSettingCatalogGroupOption>();
  for (const { settingsPath: path, item } of listAllModuleSettingCatalogEntries()) {
    if (path !== settingsPath) continue;
    const bucket = map.get(item.groupKey) ?? {
      groupKey: item.groupKey,
      groupTitle: item.groupTitle,
      seqs: [],
    };
    bucket.seqs.push(item.seq);
    map.set(item.groupKey, bucket);
  }
  return [...map.values()].sort((a, b) => a.groupTitle.localeCompare(b.groupTitle, "zh-CN"));
}

export function getCatalogItemBySeq(seq: number): ModuleSettingCatalogItem | undefined {
  return listAllModuleSettingCatalogEntries().find((r) => r.item.seq === seq)?.item;
}
