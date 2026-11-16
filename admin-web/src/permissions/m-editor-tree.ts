import type { Catalog, MenuNode } from './center-catalog';
import type { Resource } from './center-domain';
import { M_MODULES, M_PAGES, M_RESOURCES, mModuleKey, mPageKey, mActionKey, type MAccess } from './m-platform-catalog';
import { buildMNavigationTree, type MNavigationEntry } from './m-platform-navigation';

export interface MEditorCatalog extends Catalog { grantKeys: Map<string, string | undefined> }

/** Presentation identities are distinct from persisted grants, including shared route aliases. */
export function buildMEditorCatalog(): MEditorCatalog {
  const resources = new Map<string, Resource>(), grantKeys = new Map<string, string | undefined>();
  for (const module of M_MODULES) {
    const key=mModuleKey(module.id);
    resources.set(key,{key,title:module.title,type:'module'});
    for(const page of module.pages){
      const pageKey=mPageKey(page.id);
      resources.set(pageKey,{key:pageKey,title:page.title,type:'page',parent:key,path:page.path});
      for(const action of page.actions){
        const key=mActionKey(page.id,action.id);
        resources.set(key,{key,title:action.title,type:'action',parent:pageKey});
      }
    }
  }
  function convert(node:MNavigationEntry,parent?:string):MenuNode {
    const canonical=node.resourceKey?resources.get(node.resourceKey):undefined;
    const alias=!!node.path&&canonical?.path!==node.path;
    const key=alias?'m:view:'+node.path:node.resourceKey??'m:directory:'+node.id;
    if(!node.resourceKey) {
      resources.set(key,{key,title:node.title,type:'navigation',parent});
      grantKeys.set(key,undefined);
    } else if(alias) {
      resources.set(key,{...canonical!,key,title:node.title,parent:parent??canonical!.parent,path:node.path});
      grantKeys.set(key,node.resourceKey);
      const page=M_PAGES.find(p=>mPageKey(p.id)===node.resourceKey)!;
      for(const action of page.actions){
        const actionKey=key+':action:'+action.id;
        resources.set(actionKey,{key:actionKey,title:action.title,type:'action',parent:key});
        grantKeys.set(actionKey,mActionKey(page.id,action.id));
      }
    } else if(canonical) {
      // Visual parent only; effective authorization still uses M_RESOURCES.
      resources.set(key,{...canonical,parent:parent??canonical.parent});
    }
    return {id:node.resourceKey&&!node.path?node.resourceKey:node.id,key,title:node.title,children:node.children.map(child=>convert(child,key))};
  }
  const tree=buildMNavigationTree().map(node=>convert(node));
  const displayed=new Set<string>();
  const visit=(nodes:MenuNode[])=>{for(const node of nodes){if(node.key)displayed.add(node.key);visit(node.children);}};
  visit(tree);
  for(const resource of resources.values())if(resource.type==='page'&&!displayed.has(resource.key))resource.compatibilityOnly=true;
  return {tree,resources,groups:new Map(),grantKeys};
}

export function mEditorGrantKey(catalog:MEditorCatalog,key:string):string|undefined {
  return catalog.grantKeys.has(key)?catalog.grantKeys.get(key):M_RESOURCES.has(key)?key:undefined;
}

export function mEditorValue(catalog:MEditorCatalog,key:string,value:(key:string)=>MAccess):MAccess {
  const target=mEditorGrantKey(catalog,key);
  if(target)return value(target);
  return [...catalog.resources.values()].some(r=>r.parent===key&&r.type!=='action'&&mEditorValue(catalog,r.key,value)!=='hidden')?'read':'hidden';
}
