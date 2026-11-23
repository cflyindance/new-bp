import type {Catalog,MenuNode} from './center-catalog';
import {authorizationRows,authorizationSelection,applyAuthorization,type AuthorizationRow} from './center-authorization';
import {configuredAccess,roleAccess,type Access,type Role,type Resource} from './center-domain';
import {readonlyChildDefault,withinResource} from './center-child-defaults';
import {applySubmenuMode,pageMode} from './center-page-mode';
import {pagePolicy} from './center-page-policy';
import {applyResourceGrant} from './center-employee-pages';
import {settingCategoryGate} from './center-setting-levels';

export interface RoleTreeNode {id:string;title:string;kind:'directory'|'page'|'content'|'setting'|'action'|'object'|'group';key?:string;page?:string;authorization?:AuthorizationRow;children:RoleTreeNode[]}
export interface RoleTreeState {category:string;search:string;onlyGranted:boolean;onlyChanged:boolean;collapsed:Set<string>;selected:Set<string>}
export const createRoleTreeState=():RoleTreeState=>({category:'',search:'',onlyGranted:false,onlyChanged:false,collapsed:new Set(),selected:new Set()});
export function buildRoleTree(c:Catalog):RoleTreeNode[] {
  const feature=(r:Resource,page:string):RoleTreeNode=>({id:r.key,key:r.key,title:r.title,kind:r.type==='action'?'action':r.type==='setting'?'setting':'content',page,children:[]});
  const menu=(m:MenuNode):RoleTreeNode=>{
    const r=m.key?c.resources.get(m.key):undefined;
    const n:RoleTreeNode={id:m.key??m.id,key:r?.key,title:m.title,kind:r?.type==='page'?'page':r?'directory':'group',page:r?.type==='page'?r.key:undefined,children:m.children.map(menu)};
    if(r?.type!=='page')return n;
    const rows=authorizationRows(c,r.key),primary=pagePolicy(c,r.key).row;
    const consumed=new Set(rows.flatMap(a=>[a.contentKey,...(a.additionalContentKeys??[]),...a.editKeys]));
    const byKey=new Map<string,RoleTreeNode>();
    for(const a of rows){
      if(a===primary||a.contentKey===primary?.contentKey){
        for(const k of [a.contentKey,...(a.additionalContentKeys??[])]){const content=c.resources.get(k);if(content)byKey.set(k,feature(content,r.key));}
      }else byKey.set(a.contentKey,{id:'authorization:'+a.contentKey,key:a.contentKey,title:a.title,kind:a.mode==='visibility'?'action':'object',page:r.key,authorization:a,children:[]});
    }
    for(const item of c.resources.values())if(item.parent===r.key&&!item.compatibilityOnly&&!consumed.has(item.key)&&!['page','navigation','module'].includes(item.type))byKey.set(item.key,feature(item,r.key));
    // Field permissions stay beneath their owning content.
    for(const item of c.resources.values())if(item.type==='field'&&!item.compatibilityOnly&&byKey.has(item.parent??''))byKey.get(item.parent!)!.children.push(feature(item,r.key));
    const used=new Set<string>();
    for(const group of c.sections?.get(r.key)??c.groups.get(r.key)??[]){
      const children=group.keys.flatMap(k=>{const item=byKey.get(k);if(!item||used.has(k))return [];used.add(k);return [item];});
      if(!children.length)continue;
      const gate=c.resources.get(settingCategoryGate(r.key,group.id));
      // Standalone pages already have a page ceiling; their neutral internal category is not another UI layer.
      if(gate?.defaultAccess==='edit'&&!gate.inheritFrom)n.children.push(...children);
      else n.children.push({id:'category:'+r.key+':'+group.id,key:gate?.key,title:group.title,kind:gate?'setting':'group',page:r.key,children});
    }
    n.children.push(...[...byKey].filter(([key])=>!used.has(key)).map(([,item])=>item));
    return n;
  };
  return c.tree.map(menu);
}
export function flattenRoleTree(nodes:RoleTreeNode[]):RoleTreeNode[]{return nodes.flatMap(n=>[n,...flattenRoleTree(n.children)]);}
export function roleSelectionTargets(nodes:RoleTreeNode[]):RoleTreeNode[]{
  return [...new Map(flattenRoleTree(nodes).filter(n=>n.key&&n.kind!=='action'&&n.kind!=='group').map(n=>[n.id,n])).values()];
}
export function roleSelectionState(nodes:RoleTreeNode[],selected:Set<string>):{checked:boolean;indeterminate:boolean;selectedCount:number;total:number} {
  const targets=roleSelectionTargets(nodes),leaves=targets.filter(n=>!roleSelectionTargets(n.children).length);
  const count=leaves.filter(n=>selected.has(n.id)).length;
  return {checked:leaves.length>0&&count===leaves.length,indeterminate:count>0&&count<leaves.length,selectedCount:targets.filter(n=>selected.has(n.id)).length,total:targets.length};
}
/** Selection only: branch changes cascade; ancestors derive all/partial state without writing grants. */
export function toggleRoleSelection(tree:RoleTreeNode[],range:RoleTreeNode[],selected:Set<string>,checked:boolean):void {
  for(const n of roleSelectionTargets(range))checked?selected.add(n.id):selected.delete(n.id);
  for(const n of flattenRoleTree(tree).reverse())if(n.key&&n.kind!=='action'&&n.kind!=='group'){
    const children=roleSelectionTargets(n.children);
    if(children.length)children.every(child=>selected.has(child.id))?selected.add(n.id):selected.delete(n.id);
  }
}
export function roleTreePath(tree:RoleTreeNode[],id:string,path:string[]=[]):string {
  for(const n of tree){if(n.id===id)return [...path,n.title].join(' / ');const found=roleTreePath(n.children,id,[...path,n.title]);if(found)return found;}return '';
}
export function treeSelection(c:Catalog,role:Role,n:RoleTreeNode):Access {
  const own=(k:string)=>role.grants[k]??(c.resources.has(k)?readonlyChildDefault(role,c.resources.get(k)!,c.resources):undefined);
  if(n.authorization){const a=authorizationSelection(n.authorization,k=>own(k)??'hidden');return a==='mixed'||a==='inherit'?'hidden':n.kind==='action'&&a==='read'?'edit':a;}
  if(!n.key)return 'hidden';
  if(n.kind==='page'){
    // Read raw configuration separately from ancestor/effective ceilings.
    return pageMode(c,n.key,k=>{const r=c.resources.get(k);if(!r)return 'hidden';const v=configuredAccess(r,c.resources,own);if(v!==undefined)return v;const gate=r.settingPageGate?own(r.settingPageGate):undefined;return gate==='read'||gate==='edit'?'read':'hidden';});
  }
  const r=c.resources.get(n.key)!;
  return configuredAccess(r,c.resources,own)??'hidden';
}
export function treeEffective(c:Catalog,role:Role,n:RoleTreeNode):Access {
  const value=(k:string)=>roleAccess(role,k,c.resources);
  if(n.kind==='page'&&n.key)return pageMode(c,n.key,value);
  if(n.authorization){const a=n.authorization;if(value(a.contentKey)==='hidden')return 'hidden';const editable=a.editKeys.every(k=>value(k)==='edit');return n.kind==='action'?(editable?'edit':'hidden'):editable?'edit':'read';}
  return n.key?value(n.key):'hidden';
}
export function treeRestriction(c:Catalog,role:Role,n:RoleTreeNode):string {
  if(!n.key)return '';
  const value=(k:string)=>roleAccess(role,k,c.resources),r=c.resources.get(n.key)!;
  if(r.legacyGateKey&&value(r.legacyGateKey)==='hidden')return '受历史门禁限制';
  let parent=r.parent;const seen=new Set<string>();
  while(parent&&!seen.has(parent)){seen.add(parent);const p=c.resources.get(parent);if(!p)break;
    if(value(parent)==='hidden'&&!(p.type==='page'&&treeSelection(c,role,{id:p.key,key:p.key,title:p.title,kind:'page',children:[]})!=='hidden'))return '受上级不可见限制';parent=p.parent;
  }
  const ownContents=new Set(n.authorization?[n.authorization.contentKey,...(n.authorization.additionalContentKeys??[])]:[]);
  const required=[...(r.requires??[]),...(n.authorization?.editKeys.flatMap(k=>c.resources.get(k)?.requires??[])??[])].filter(k=>!ownContents.has(k));
  if(required.some(k=>value(k)==='hidden'))return '所需内容不可见';
  if(r.ceilingKeys?.some(k=>value(k)==='hidden'))return '受上级不可见限制';
  if(n.kind==='page'&&treeSelection(c,role,n)!=='hidden'&&treeEffective(c,role,n)==='hidden')return '页面内容尚未授权';
  if(treeSelection(c,role,n)!==treeEffective(c,role,n))return '受页面或上级只读限制';
  return '';
}
export function treeChanged(c:Catalog,role:Role,original:Role,n:RoleTreeNode):boolean {
  const keys=[n.key,...(n.authorization?[n.authorization.contentKey,...n.authorization.editKeys,...(n.authorization.additionalContentKeys??[])]:[])].filter((k):k is string=>!!k);
  const signature=(r:Role)=>JSON.stringify([keys.map(k=>[k,r.grants[k],!!r.defaultedGrants?.includes(k)]),n.key?r.readonlyChildren?.[n.key]:null]);
  return signature(role)!==signature(original)||treeSelection(c,role,n)!==treeSelection(c,original,n);
}
/** Initialize only absent entries. Explicit choices, legacy denies and operations are never promoted. */
function activateChildDefaults(c:Catalog,role:Role,parent:string):void {
  if(!role.readonlyChildren?.[parent]){
    role.readonlyChildren={...role.readonlyChildren,[parent]:[...c.resources.keys()].filter(k=>withinResource(c.resources,k,parent))};
  }
  for(const r of c.resources.values())if(r.key!==parent&&withinResource(c.resources,r.key,parent)&&!r.compatibilityOnly&&role.grants[r.key]===undefined){
    role.grants[r.key]=r.type==='action'?'hidden':'read';
    role.defaultedGrants=[...new Set([...(role.defaultedGrants??[]),r.key])];
    if(r.type==='page'&&r.settingPageGate&&role.grants[r.settingPageGate]===undefined)role.grants[r.settingPageGate]='read';
    // Settings with explicit inheritance markers keep that choice.
    if(r.type==='setting'&&r.parentChoiceKey&&role.grants[r.parentChoiceKey]==='read')delete role.grants[r.key];
  }
}
export function applyTreeChoice(c:Catalog,role:Role,n:RoleTreeNode,choice:Access):boolean {
  if(!n.key||!c.resources.has(n.key)||!['hidden','read','edit'].includes(choice))throw Error('请选择有效的权限项');
  if(n.kind==='group'||(n.kind==='directory'||n.kind==='content')&&choice==='edit')throw Error('该项目仅支持不可见／可见');
  if(n.kind==='action'&&choice==='read')throw Error('操作仅支持禁止／允许');
  if(choice!=='hidden'&&treeRestriction(c,role,n).includes('不可见'))throw Error('请先开启上级目录或所需内容');
  if(choice!=='hidden'&&treeRestriction(c,role,n).includes('不可见'))throw Error('请先将上级目录及所需内容设为可见');
  const before=JSON.stringify(role),candidate=structuredClone(role),r=c.resources.get(n.key)!;
  if(n.authorization){applyAuthorization(candidate.grants,n.authorization,n.kind==='action'&&choice==='edit'?'read':choice);}
  else if(n.kind==='page'){
    const parent=r.parent;
    if(!parent)throw Error('页面缺少上级目录');
    // Parent gate protects current effect; hidden parents do not destroy saved child decisions.
    if(choice!=='hidden'&&roleAccess(role,parent,c.resources)==='hidden')throw Error('请先将上级目录设为可见');
    if(r.settingPageGate){
      candidate.grants[r.key]=choice==='hidden'?'hidden':'read';
      // A page ceiling is not a bulk edit of its categories or existing fields.
      if(choice!=='hidden')candidate.grants[r.settingPageGate]=choice;
    }else applySubmenuMode(c,candidate,parent,r.key,choice);
  }else if(n.kind==='directory')applyResourceGrant(candidate.grants,r,choice);
  else applyResourceGrant(candidate.grants,r,choice);
  if((n.kind==='directory'||n.kind==='page'||n.kind==='setting'&&n.children.length)&&choice!=='hidden')activateChildDefaults(c,candidate,r.key);
  const manuallySet=new Set([r.key,...(r.relatedGrantKeys??[]),...(n.authorization?[n.authorization.contentKey,...n.authorization.editKeys,...(n.authorization.additionalContentKeys??[])]:[])]);
  if(candidate.defaultedGrants)candidate.defaultedGrants=candidate.defaultedGrants.filter(k=>!manuallySet.has(k));
  const after=JSON.stringify(candidate);if(before===after)return false;
  role.grants=candidate.grants;role.readonlyChildren=candidate.readonlyChildren;role.defaultedGrants=candidate.defaultedGrants;return true;
}
/** Atomic bulk operation; action nodes are deliberately excluded. */
export function applyTreeBatch(c:Catalog,role:Role,nodes:RoleTreeNode[],choice:Access):boolean {
  if(!nodes.length)throw Error('请先勾选要修改的项目');
  if(nodes.some(n=>n.kind==='action'))throw Error('独立操作请逐项授权');
  const candidate=structuredClone(role),before=JSON.stringify(role);
  for(const n of nodes){if(choice==='edit'&&n.kind!=='page'&&n.kind!=='setting'&&n.kind!=='object')continue;applyTreeChoice(c,candidate,n,choice);}
  if(before===JSON.stringify(candidate))return false;
  role.grants=candidate.grants;role.readonlyChildren=candidate.readonlyChildren;role.defaultedGrants=candidate.defaultedGrants;return true;
}
