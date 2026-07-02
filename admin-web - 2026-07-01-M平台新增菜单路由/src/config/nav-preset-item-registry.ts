/**
 * 菜单路由 · 平台预设「分组内功能/设置」注册表（只读，派生 permission-registry L4）
 *
 * 对应平台预设配置页第四列：三级分组下的功能/设置项（含 seq 设置页与 L3 标准操作等叶子节点）。
 */
import { getModuleSettingsItemHref } from "./module-settings-catalog";
import { getCatalogItemBySeq } from "./nav-setting-registry";
import {
  buildPermissionModuleGroups,
  type PermissionTreeNode,
} from "./permission-registry";

export interface NavPresetItemRegistryEntry {
  /** permission 树节点 key（与平台预设 selection 键一致） */
  key: string;
  title: string;
  titleEn?: string;
  seq?: number;
  /** 点击后进入的展示页路径 */
  landingPath: string;
  moduleId: string;
  moduleTitle: string;
  l2Title: string;
  l3Title: string;
  settingsPath?: string;
  groupKey?: string;
  /** 功能场景描述（来自 module-settings-catalog.sceneDesc，辅以 feature） */
  description?: string;
}

let cachedItems: NavPresetItemRegistryEntry[] | null = null;

function resolveLandingPath(node: PermissionTreeNode): string {
  const path = node.resource.path;
  if (node.resource.seq != null && path) {
    const item = getCatalogItemBySeq(node.resource.seq);
    if (item) return getModuleSettingsItemHref(path, item);
  }
  return path ?? "/";
}

function isPlaceholderText(text: string): boolean {
  const t = text.trim();
  return !t || t === "（未填写）";
}

function resolveItemDescription(seq?: number): string | undefined {
  if (seq == null) return undefined;
  const item = getCatalogItemBySeq(seq);
  if (!item) return undefined;
  if (!isPlaceholderText(item.sceneDesc)) return item.sceneDesc.trim();
  if (!isPlaceholderText(item.feature)) return item.feature.trim();
  return undefined;
}

export function buildNavPresetItemRegistry(): NavPresetItemRegistryEntry[] {
  if (cachedItems) return cachedItems;

  const out: NavPresetItemRegistryEntry[] = [];
  const seen = new Set<string>();

  for (const g of buildPermissionModuleGroups()) {
    for (const l2 of g.tree.children) {
      for (const l3 of l2.children) {
        for (const l4 of l3.children) {
          if (l4.resource.level !== 4) continue;
          if (seen.has(l4.resource.key)) continue;
          seen.add(l4.resource.key);
          out.push({
            key: l4.resource.key,
            title: l4.resource.title,
            titleEn: l4.resource.titleEn,
            seq: l4.resource.seq,
            landingPath: resolveLandingPath(l4),
            moduleId: g.moduleId,
            moduleTitle: g.moduleTitle,
            l2Title: l2.resource.featureTitle ?? l2.resource.title,
            l3Title: l3.resource.title,
            settingsPath: l4.resource.path,
            groupKey: l4.resource.groupKey,
            description: resolveItemDescription(l4.resource.seq),
          });
        }
      }
    }
  }

  cachedItems = out;
  return out;
}

export function getNavPresetItemRegistryEntry(key: string): NavPresetItemRegistryEntry | undefined {
  return buildNavPresetItemRegistry().find((e) => e.key === key);
}

export function searchNavPresetItemRegistry(query: string): NavPresetItemRegistryEntry[] {
  const q = query.trim().toLowerCase();
  const all = buildNavPresetItemRegistry();
  if (!q) return all;
  return all.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      (e.titleEn?.toLowerCase().includes(q) ?? false) ||
      e.moduleTitle.toLowerCase().includes(q) ||
      e.l2Title.toLowerCase().includes(q) ||
      e.l3Title.toLowerCase().includes(q) ||
      e.landingPath.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q) ?? false) ||
      (e.seq != null && String(e.seq).includes(q)),
  );
}

/** 按 一级 · 二级 · 三级分组 分组展示 */
export function groupNavPresetItemEntries(
  entries: NavPresetItemRegistryEntry[],
): Map<string, NavPresetItemRegistryEntry[]> {
  const map = new Map<string, NavPresetItemRegistryEntry[]>();
  for (const e of entries) {
    const key = `${e.moduleTitle} · ${e.l2Title} · ${e.l3Title}`;
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}
