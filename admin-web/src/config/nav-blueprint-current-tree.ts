import { NAV_MODULES, navModuleChildrenAsSheetSubnav } from './navigation';
import { buildCenterCatalog, type MenuNode } from '../permissions/center-catalog';
import { buildPermissionModuleGroups, type PermissionModuleGroup, type PermissionTreeNode, type PermissionResource } from './permission-registry';
import {getUiLocale} from '../i18n';

let cachedSystemMenu:{locale:string;groups:PermissionModuleGroup[]}|undefined;

/** Current business navigation, with stable legacy setting identities retained. */
export function buildCurrentSystemMenuGroups(): PermissionModuleGroup[] {
  const locale=getUiLocale();
  if(cachedSystemMenu?.locale!==locale)cachedSystemMenu={locale,groups:buildSystemMenuGroups()};
  // Blueprint builders modify their working tree. Never expose the cached source.
  return structuredClone(cachedSystemMenu.groups);
}
function buildSystemMenuGroups(): PermissionModuleGroup[] {
  const catalog=buildCenterCatalog(),legacy=buildPermissionModuleGroups();
  const pool:PermissionResource[]=[];
  const collect=(node:PermissionTreeNode)=>{pool.push(node.resource);node.children.forEach(collect);};
  legacy.forEach(group=>collect(group.tree));
  const used=new Set<string>();
  const roots=catalog.tree.flatMap(node=>node.key?[node]:node.children);
  const result=roots.map(root=>{
    const moduleId=root.key!.replace(/^module:/,''),old=legacy.find(group=>group.moduleId===moduleId);
    const moduleTitle=catalog.resources.get(root.key!)?.title??root.title;
    const make=(node:MenuNode,parent:string|undefined,depth:number):PermissionTreeNode=>{
      const resource=node.key?catalog.resources.get(node.key):undefined;
      const path=resource?.viewId&&resource.path==='/team/clock-in'?`${resource.path}/${resource.viewId}`:resource?.path;
      const prior=depth===1?old?.tree.resource:pool.find(item=>item.moduleId===moduleId&&item.path===path&&!item.seq&&!item.actionId&&!item.groupKey&&!used.has(item.key));
      const key=prior?.key??(depth===1?moduleId:`${moduleId}:${node.id}`);
      used.add(key);
      const entry:PermissionTreeNode={resource:{...(prior??{}),key,parentKey:parent,level:Math.min(depth,4) as 1|2|3|4,moduleId,moduleTitle,title:depth===1?moduleTitle:node.title,path,featureId:prior?.featureId??node.id,customL2MountKind:resource?.type==='page'?'page':'features',customL3MountKind:resource?.type==='page'?'page':undefined},children:[]};
      entry.children=node.children.filter(child=>!child.id.endsWith('-actions')&&catalog.resources.get(child.key??'')?.type!=='action').map(child=>make(child,key,depth+1));
      if(!node.children.length&&node.key){
        for(const group of catalog.groups.get(node.key)??[]){
          const settings=group.keys.flatMap(setting=>{const r=catalog.resources.get(setting);if(r?.type!=='setting'||r.seq==null)return [];const raw=pool.find(item=>item.seq===r.seq&&!used.has(item.key));if(!raw)return [];used.add(raw.key);return [{resource:{...raw,parentKey:'',title:r.title},children:[]} as PermissionTreeNode];});
          if(!settings.length)continue;
          const groupKey=`${key}:view:${group.id}`;
          const groupNode:PermissionTreeNode={resource:{key:groupKey,parentKey:key,level:3,moduleId,moduleTitle,title:group.title,groupKey:group.id},children:settings};
          settings.forEach(setting=>setting.resource.parentKey=groupKey);
          entry.children.push(groupNode);
        }
      }
      return entry;
    };
    return {moduleId,moduleTitle,moduleKey:old?.moduleKey??moduleId,tree:make(root,undefined,1)};
  });
  // The navigation catalog intentionally models some view permissions as content.
  // Route structure must still contain every actual navigable child, without creating new grants.
  for(const module of NAV_MODULES){
    if(['marketing','promotions','members','gift-cards','reports-finance','finance-center','print-templates','reservations'].includes(module.id))continue;
    const group=result.find(g=>g.moduleId===module.id);if(!group)continue;
    const index:PermissionTreeNode[]=[];const collect=(node:PermissionTreeNode)=>{index.push(node);node.children.forEach(collect);};collect(group.tree);
    const visit=(item:ReturnType<typeof navModuleChildrenAsSheetSubnav>[number],parent:PermissionTreeNode)=>{
      let node=index.find(n=>n.resource.path===item.path&&n.resource.title===item.title);
      if(!node){const key=`${module.id}:route:${item.path}`;node={resource:{key,parentKey:parent.resource.key,level:Math.min(parent.resource.level+1,4) as 1|2|3|4,moduleId:module.id,moduleTitle:group.moduleTitle,title:item.title,path:item.path,customL3MountKind:'page',customL2MountKind:'page'},children:[]};parent.children.push(node);index.push(node);}
      const children=item.sidebarChildren??[];children.forEach(child=>visit({...child,id:child.id??child.path},node!));
      const ordered=children.flatMap(child=>node!.children.filter(n=>n.resource.path===child.path&&n.resource.title===child.title));node.children=[...ordered,...node.children.filter(n=>!ordered.includes(n))];
    };
    const navigation=navModuleChildrenAsSheetSubnav(module);navigation.forEach(item=>visit(item,group.tree));
    const ordered=navigation.flatMap(item=>group.tree.children.filter(n=>n.resource.path===item.path&&n.resource.title===item.title));group.tree.children=[...ordered,...group.tree.children.filter(n=>!ordered.includes(n))];
  }
  return result;

}
