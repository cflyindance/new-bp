import { scopeMatches, type CenterState, type Resource, type Store } from './center-domain';

/** Read-only compatibility view. Save normally to persist the version marker. */
export function migrateNavigationPermissions(state:CenterState,resources:Map<string,Resource>,stores:Store[]):CenterState {
  if(state.navigationVersion===1)return state;
  if(state.navigationVersion!==undefined)throw Error('导航权限数据版本无法读取；原数据已保留');
  const next=structuredClone(state);
  const navigation=[...resources.values()].filter(r=>r.type==='navigation'&&!r.compatibilityOnly);
  // The old model had no intermediate gates. Neutral read gates preserve ALL old
  // results; leaf/action/setting grants and the original module gate remain intact.
  for(const role of next.roles)for(const resource of navigation)role.grants[resource.key]??='read';
  for(const employee of next.employees)for(const [storeId,overrides] of Object.entries(employee.overrides)){
    const store=stores.find(s=>s.id===storeId);
    const roles=store ? employee.bindings.filter(b=>scopeMatches(b.scope,store)).flatMap(b=>{
      const role=next.roles.find(r=>r.id===b.roleId);return role?[role]:[];
    }) : [];
    for(const [key,value] of Object.entries(overrides)){
      if(value==='hidden')continue;
      let parent=resources.get(key)?.parent;
      const seen=new Set<string>();
      while(parent&&!seen.has(parent)){
        seen.add(parent);
        const resource=resources.get(parent);if(!resource)break;
        // Preserve standalone personal allowances without adding redundant
        // exceptions where an applicable legacy role already supplies the gate.
        if(resource.type==='navigation'&&!resource.compatibilityOnly&&!roles.some(r=>r.grants[parent!]==='read'))overrides[parent]??='read';
        parent=resource.parent;
      }
    }
  }
  next.navigationVersion=1;
  return next;
}
