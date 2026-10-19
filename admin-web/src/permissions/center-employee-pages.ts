import type {MenuNode} from './center-catalog';
import type {Resource,Access} from './center-domain';
export const EMPLOYEE_BASE='/team/roles-employees';
export const EMPLOYEE_LEGACY='page:'+EMPLOYEE_BASE;
export const EMPLOYEE_NAV='navigation:team:team-roles';
/** Raw grant keys survive; only ownership and the visible menu change. */
export function registerEmployeePages(tree:MenuNode[],resources:Map<string,Resource>):void {
  const node=tree.find(n=>n.id==='team')?.children.find(n=>n.key===EMPLOYEE_NAV);
  const nav=resources.get(EMPLOYEE_NAV),legacy=resources.get(EMPLOYEE_LEGACY);
  if(!node||!nav||!legacy)throw Error('员工岗位权限目录缺失');
  node.children=node.children.filter(n=>n.key!==EMPLOYEE_LEGACY);
  // Do not silently bypass a previously hidden operation page.
  legacy.type='navigation';legacy.compatibilityOnly=true;legacy.parent=nav.parent;nav.legacyGateKey=legacy.key;
  for(const [suffix,ids] of [['employees',['object-manage-employee','manage-employee','save-employee']],['roles',['object-manage-role','manage-role']]] as const){
    const page='page:'+EMPLOYEE_BASE+'/'+suffix;if(resources.get(page)?.type!=='page')throw Error('缺少实际员工岗位页面');
    for(const id of ids){
      const key=(id.startsWith('object-')?'content:':'action:')+EMPLOYEE_BASE+':'+id;
      const resource=resources.get(key);if(!resource)throw Error('缺少员工岗位资源：'+key);
      resource.parent=page;
    }
  }
}
/** An explicit parent decision edits both gates; inheritance removes both exceptions. */
export function applyResourceGrant(grants:Record<string,Access>,resource:Resource,value:Access|'inherit'):void {
  if(resource.parentChoiceKey)delete grants[resource.parentChoiceKey];
  for(const key of [resource.key,...(resource.relatedGrantKeys??[]),...(resource.legacyGateKey?[resource.legacyGateKey]:[])])
    if(value==='inherit')delete grants[key];else grants[key]=value;
}
export function resourceOwn(resource:Resource,own:(key:string)=>Access|'inherit'):Access|'inherit'|'mixed' {
  const value=own(resource.key);
  if(resource.aggregateRelatedGrants){
    const values=[value,...(resource.relatedGrantKeys??[]).map(own)];
    if(values.every(v=>v==='inherit'))return 'inherit';
    if(values.some(v=>v==='inherit'))return 'mixed';
    return values.includes('hidden')?'hidden':values.includes('read')?'read':'edit';
  }
  if(resource.relatedGrantKeys?.some(key=>own(key)!==value))return 'mixed';
  if(!resource.legacyGateKey)return value;
  const legacy=own(resource.legacyGateKey);
  if(value==='hidden'||legacy==='hidden')return 'hidden';
  return value==='inherit'?legacy:value;
}
