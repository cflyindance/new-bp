import { buildCurrentSystemMenuGroups } from './nav-blueprint-current-tree';
import { DEFAULT_NAV_BLUEPRINT_ID, getPublishedNavBlueprint } from './nav-blueprint-store';
import { buildNavBlueprintIndexFromSnapshot } from './nav-blueprint-tree';
import { buildCenterCatalog, pageKey, settingKey } from '../permissions/center-catalog';
import { buildPermissionResourceIndex } from './permission-registry';

/** Map current route identities to the shared permission catalog without changing stored keys. */
export function centerKeysForRaw(raw: Set<string>, catalog = buildCenterCatalog()): Set<string> {
  const allowed = new Set<string>();
  const registry = buildPermissionResourceIndex();
  const resources = new Map(registry.byKey);
  const visitCurrent=(tree:ReturnType<typeof buildCurrentSystemMenuGroups>[number]['tree'])=>{resources.set(tree.resource.key,tree.resource);tree.children.forEach(visitCurrent);};buildCurrentSystemMenuGroups().forEach(group=>visitCurrent(group.tree));
  const blueprint=getPublishedNavBlueprint(DEFAULT_NAV_BLUEPRINT_ID);
  if(blueprint){const index=buildNavBlueprintIndexFromSnapshot(blueprint);const visit=(tree:typeof index.groups[number]['tree'])=>{resources.set(tree.resource.key,tree.resource);tree.children.forEach(visit);};index.groups.forEach(g=>visit(g.tree));}
  for (const node of resources.values()) {
    if (!raw.has(node.key)) continue;
    const key = catalog.resources.has(node.key)?node.key:node.level === 1 ? `module:${node.moduleId}` : node.path && node.seq != null ? settingKey(node.path,node.seq) : node.path && !node.groupKey ? pageKey(node.path) : '';
    if (catalog.resources.has(key)) allowed.add(key);
  }
  // Some deep menu routes share an L2 ancestor in the legacy registry.
  for (const resource of catalog.resources.values()) {
    if (allowed.has(resource.key)) continue;
    if (resource.path && resource.type !== 'setting') {
      const exact=[...resources.values()].filter(n=>n.level>1&&n.seq==null&&!n.groupKey&&n.path===resource.path);
      const candidates=exact.length?exact:[...registry.byKey.values()].filter(n=>n.level===2&&n.path&&resource.path!.startsWith(n.path+'/')).sort((a,b)=>b.path!.length-a.path!.length);
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
