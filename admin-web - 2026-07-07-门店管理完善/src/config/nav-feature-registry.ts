/**
 * 菜单路由 · L2 功能点注册表（只读，派生 permission-registry）
 */
import { buildPermissionModuleGroups, type PermissionTreeNode } from "./permission-registry";

export interface NavFeatureRegistryEntry {
  key: string;
  featureId: string;
  moduleId: string;
  groupId: string;
  groupTitle: string;
  title: string;
  titleEn?: string;
  path?: string;
}

let cachedFeatures: NavFeatureRegistryEntry[] | null = null;

function walkTree(node: PermissionTreeNode, visit: (n: PermissionTreeNode) => void): void {
  visit(node);
  for (const c of node.children) walkTree(c, visit);
}

export function buildNavFeatureRegistry(): NavFeatureRegistryEntry[] {
  if (cachedFeatures) return cachedFeatures;

  const out: NavFeatureRegistryEntry[] = [];
  const seen = new Set<string>();

  for (const g of buildPermissionModuleGroups()) {
    walkTree(g.tree, (n) => {
      if (n.resource.level !== 2) return;
      if (!n.resource.path && !n.resource.featureId) return;
      if (seen.has(n.resource.key)) return;
      seen.add(n.resource.key);
      out.push({
        key: n.resource.key,
        featureId: n.resource.featureId ?? n.resource.key,
        moduleId: g.moduleId,
        groupId: g.moduleId,
        groupTitle: g.moduleTitle,
        title: n.resource.featureTitle ?? n.resource.title,
        titleEn: n.resource.featureTitleEn ?? n.resource.titleEn,
        path: n.resource.path,
      });
    });
  }

  cachedFeatures = out;
  return out;
}

export function getNavFeatureRegistryEntry(key: string): NavFeatureRegistryEntry | undefined {
  return buildNavFeatureRegistry().find((f) => f.key === key);
}

export function searchNavFeatureRegistry(query: string): NavFeatureRegistryEntry[] {
  const q = query.trim().toLowerCase();
  const all = buildNavFeatureRegistry();
  if (!q) return all;
  return all.filter(
    (f) =>
      f.title.toLowerCase().includes(q) ||
      (f.titleEn?.toLowerCase().includes(q) ?? false) ||
      (f.path?.toLowerCase().includes(q) ?? false) ||
      f.groupTitle.toLowerCase().includes(q),
  );
}

export function groupNavFeatureEntries(entries: NavFeatureRegistryEntry[]): Map<string, NavFeatureRegistryEntry[]> {
  const map = new Map<string, NavFeatureRegistryEntry[]>();
  for (const e of entries) {
    const list = map.get(e.groupTitle) ?? [];
    list.push(e);
    map.set(e.groupTitle, list);
  }
  return map;
}
