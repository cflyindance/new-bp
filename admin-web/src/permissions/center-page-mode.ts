import type {Catalog} from './center-catalog';
import {roleAccess,type Access,type Role} from './center-domain';
import {pagePolicy,applyPageAuthorization,applyPageResourceGrant} from './center-page-policy';
import {applySubmenuVisibility} from './center-submenu-visibility';

function target(c:Catalog,key:string){
  const page=c.resources.get(key),policy=pagePolicy(c,key);
  const row=key==='page:/operations/queue-call/buffet-rules'||!page?.settingPageGate?policy.row:undefined;
  return {page,row,setting:!row?(page?.settingPageGate?c.resources.get(page.settingPageGate):policy.setting):undefined};
}
/** Only pages without an existing page-wide control need an additional ceiling. Defaults retain old access. */
export function registerPageModes(c:Catalog):void {
  for(const page of [...c.resources.values()].filter(r=>r.type==='page'&&!r.compatibilityOnly)){
    const t=target(c,page.key);if(t.row||t.setting)continue;
    const gate='page-mode:'+page.key;page.settingPageGate=gate;
    c.resources.set(gate,{key:gate,title:page.title,type:'setting',parent:page.parent,path:page.path,defaultAccess:'edit',compatibilityOnly:true});
    page.ceilingKeys=[...new Set([...(page.ceilingKeys??[]),gate])];
    for(const r of c.resources.values()){
      let parent=r.parent;const seen=new Set<string>();
      while(parent&&!seen.has(parent)){seen.add(parent);if(parent===page.key){r.ceilingKeys=[...new Set([...(r.ceilingKeys??[]),gate])];break;}parent=c.resources.get(parent)?.parent;}
    }
  }
}
export function pageMode(c:Catalog,key:string,value:(key:string)=>Access):Access {
  if(value(key)==='hidden')return 'hidden';
  const t=target(c,key);
  if(t.row)return value(t.row.contentKey)==='hidden'?'hidden':t.row.editKeys.every(k=>value(k)==='edit')?'edit':'read';
  return t.setting?value(t.setting.key):'read';
}
export function applySubmenuMode(c:Catalog,role:Role,parent:string,key:string,mode:Access):boolean {
  if(!['hidden','read','edit'].includes(mode))throw Error('子导航状态无效');
  const t=target(c,key),page=t.page;
  if(!page||page.parent!==parent||page.compatibilityOnly||!['page','navigation','module'].includes(page.type))throw Error('请选择当前目录的子导航');
  if(page.type!=='page'){
    if(mode==='edit')throw Error('目录不支持编辑权限');
    return applySubmenuVisibility(c,role,parent,key,mode);
  }
  if(mode!=='hidden'&&roleAccess(role,parent,c.resources)==='hidden')throw Error('上级导航不可见，不能开启子导航');
  const effective=(k:string)=>roleAccess(role,k,c.resources);
  if(pageMode(c,key,effective)===mode)return false;
  const candidate={...role,grants:{...role.grants}};
  if(t.row)applyPageAuthorization(c,key,candidate.grants,t.row,mode);
  else if(t.setting)applyPageResourceGrant(c,key,candidate.grants,t.setting,mode);
  else throw Error('页面缺少授权控制');
  if(mode!=='hidden'&&roleAccess(candidate,key,c.resources)==='hidden')applySubmenuVisibility(c,candidate,parent,key,'read');
  if(pageMode(c,key,k=>roleAccess(candidate,k,c.resources))!==mode)throw Error('页面仍受权限限制，请从左侧菜单调整');
  role.grants=candidate.grants;return true;
}
