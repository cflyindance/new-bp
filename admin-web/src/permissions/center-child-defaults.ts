import type {Access, Resource, Role} from './center-domain';

/** An opt-in catalog snapshot preserves existing absences/denials; only future additions default to read. */
export function withinResource(resources:Map<string,Resource>,key:string,parent:string):boolean {
  if(resources.get(key)?.ceilingKeys?.includes(parent))return true;
  const seen=new Set<string>();let current=resources.get(key);
  while(current&&!seen.has(current.key)){if(current.key===parent)return true;seen.add(current.key);current=current.parent?resources.get(current.parent):undefined;}
  return false;
}
export function readonlyChildDefault(role:Role,resource:Resource,resources:Map<string,Resource>):Access|undefined {
  if(!role.readonlyChildren)return undefined;
  let target=resource;
  if(resource.compatibilityOnly){
    const page=resources.get(resource.key.replace(/^(page-mode:|setting-page:)/,''));
    if(page)target=page;
    else if(!resource.key.startsWith('setting-category:'))return undefined;
  }
  for(const [parent,known] of Object.entries(role.readonlyChildren??{})){
    if(!Array.isArray(known))continue;
    if(known.includes(target.key)||target.key===parent||!withinResource(resources,target.key,parent))continue;
    return resource.type==='action'?'hidden':'read';
  }
  return undefined;
}
