import { buildCenterCatalog, pageKey, settingKey } from '../permissions/center-catalog';
import { buildPermissionResourceIndex } from './permission-registry';

/** Map current route identities to the shared permission catalog without changing stored keys. */
export function centerKeysForRaw(raw: Set<string>, catalog = buildCenterCatalog()): Set<string> {
  const allowed = new Set<string>();
  const registry = buildPermissionResourceIndex();
  for (const node of registry.byKey.values()) {
    if (!raw.has(node.key)) continue;
    const key = node.level === 1 ? `module:${node.moduleId}` : node.level === 2 && node.path ? pageKey(node.path) : node.level === 4 && node.path && node.seq != null ? settingKey(node.path,node.seq) : '';
    if (catalog.resources.has(key)) allowed.add(key);
  }
  // Some deep menu routes share an L2 ancestor in the legacy registry.
  for (const resource of catalog.resources.values()) {
    if (allowed.has(resource.key)) continue;
    if (resource.path && resource.type !== 'setting') {
      const candidates = [...registry.byKey.values()].filter(n => n.level === 2 && n.path && (resource.path === n.path || resource.path!.startsWith(n.path + '/'))).sort((a,b) => b.path!.length-a.path!.length);
      if (candidates[0] && raw.has(candidates[0].key)) allowed.add(resource.key);
    }
  }
  // Containers required for navigation are structural; they never enable sibling pages.
  for (const key of [...allowed]) {
    let parent = catalog.resources.get(key)?.parent;
    const seen = new Set<string>();
    while (parent && !seen.has(parent)) {seen.add(parent);allowed.add(parent);parent=catalog.resources.get(parent)?.parent;}
  }
  return allowed;
}
