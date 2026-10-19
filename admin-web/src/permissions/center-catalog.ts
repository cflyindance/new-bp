import { MENU_ORDER_OTHER_SETTINGS_PATH, MENU_ORDER_OTHER_SETTINGS_SECTIONS } from '../config/menu-order-other-settings-navigation';
import { settingsCategoryItems, settingsCategoryViewGroups } from '../config/settings-category-model';
import * as navigation from "../config/navigation";
import { MODULE_SETTINGS_BY_PATH, groupCatalogItemsByCategory } from "../config/module-settings-catalog";
import { t, type MessageKey } from "../i18n";
import type { Resource } from "./center-domain";
import { additionalPageActions } from './center-actions';
import { FINANCE_REGISTER_AUDIT_PAGES } from '../config/finance-register-audit-pages';
import { visibilityEntries,contentKey,fieldKey,actionVisibilityDependencies } from './center-visibility';
import { registerPageSections,registerBreaksPages } from './center-page-sections';
import { registerClockPages } from './center-clock-pages';
import { registerEmployeePages } from './center-employee-pages';
import { registerScheduleAuthorization } from './center-authorization';
import { registerTipsPages } from './center-tips-pages';
import { STORE_INFORMATION_SETTINGS_PATH, storeInformationItemPath } from '../config/store-information-navigation';

export interface MenuNode { id: string; title: string; key?: string; children: MenuNode[] }
export interface SettingGroup { id: string; title: string; section: string; keys: string[] }
export interface Catalog { tree: MenuNode[]; resources: Map<string, Resource>; groups: Map<string, SettingGroup[]>; sections?: Map<string,SettingGroup[]> }
/** Shared directory only: retain the distinct original permission keys and routes. */
export function groupStoreManagementMenus(tree: MenuNode[]): MenuNode[] {
  const ids = ['group-store-list','brand-store-list'];
  const entries = ids.flatMap(id => { const node=tree.find(n=>n.id===id);return node?[{...node,title:id==='group-store-list'?'集团视角':'品牌视角'}]:[]; });
  if(entries.length<2)return tree;
  const first=tree.findIndex(n=>ids.includes(n.id));
  const result=tree.filter(n=>!ids.includes(n.id));
  result.splice(first,0,{id:'store-management-directory',title:'门店管理',children:entries});
  return result;
}
type InputNode = { id?: string; title: string; path: string; children?: InputNode[]; sidebarChildren?: InputNode[] };
const lists = navigation as unknown as Record<string, InputNode[]>;
const moduleLists: Record<string,string[]> = { marketing:['MARKETING_SHEET_SUBNAV'],promotions:['PROMOTIONS_MGMT_SUBNAV'],members:['MEMBERS_SHEET_SUBNAV','MEMBERS_SHEET_SETTINGS_SUBNAV'],'gift-cards':['GIFT_CARDS_SHEET_SUBNAV'],'reports-finance':['REPORTS_SHEET_SUBNAV'],'finance-center':['FINANCE_SHEET_SUBNAV','FINANCE_SHEET_SETTINGS_SUBNAV'],'print-templates':['PRINT_SHEET_SUBNAV'],reservations:['RESERVATIONS_SHEET_SUBNAV'] };
const childLists: Record<string,string> = { 'pcm-brand-products':'BRAND_PRODUCTS_SUBNAV','pcm-brand-menu':'BRAND_MENU_SUBNAV','pcm-store-mgmt':'STORE_MENU_SUBNAV','team-tips':'TIPS_MANAGEMENT_SUBNAV','team-reports':'TEAM_REPORTS_SUBNAV','dm-hardware':'DEVICE_MANAGEMENT_HARDWARE_SUBNAV' };
export const pageKey = (path: string) => `page:${path}`;
export const navigationKey = (moduleId: string, id: string) => `navigation:${moduleId}:${id}`;
export const actionKey = (path: string, id: string) => `action:${path}:${id}`;
export const settingKey = (path: string, seq: number) => `setting:${path}:${seq}`;
export const auditedActions: Record<string, [string,string][]> = {
  '/permissions/staff':[['save','保存员工授权']],
};
const label = (s: string) => s.length > 2 && s.endsWith('设置') ? s.slice(0,-2) : s;
export function buildCenterCatalog(): Catalog {
  const resources = new Map<string, Resource>(), groups = new Map<string, SettingGroup[]>();
  const convert = (item: InputNode, parent: string, moduleId: string): MenuNode => {
    // Clock views and breaks/overtime subpages retain their existing permission keys.
    const children = ['/team/clock-in', '/team/breaks-overtime'].includes(item.path) ? [] : item.sidebarChildren ?? item.children ?? (item.id==='fin-register-audit' ? FINANCE_REGISTER_AUDIT_PAGES.map(p=>({title:p.title,path:p.path})) : lists[childLists[item.id ?? '']]) ?? [];
    const id=item.id ?? item.path;
    const key=children.length ? navigationKey(moduleId,id) : pageKey(item.path);
    if(resources.has(key))throw Error(`重复的菜单权限：${key}`);
    resources.set(key,{key,title:item.title,type:children.length?'navigation':'page',parent,path:item.path});
    const node: MenuNode = { id,title:item.title,key,children:children.map(c => convert(c,key,moduleId)) };
    if (children.length && !resources.has(pageKey(item.path)) && (additionalPageActions[item.path]?.length || auditedActions[item.path]?.length)) {
      const legacyKey=pageKey(item.path);
      resources.set(legacyKey,{key:legacyKey,title:`${item.title}操作权限`,type:'page',parent:key,path:item.path});
      node.children.unshift({id:`${node.id}-actions`,title:'操作权限',key:legacyKey,children:[]});
    }
    return node;
  };
  const tree = navigation.NAV_MODULES.map(m => {
    const key = `module:${m.id}`;
    const title=m.id==='group-store-list'?`${m.title} · 集团视角`:m.id==='brand-store-list'?`${m.title} · 品牌视角`:m.title;
    resources.set(key,{key,title,type:'module'});
    const children = moduleLists[m.id]?.flatMap(k => lists[k] ?? []) ?? m.children;
    return {id:m.id,title:m.title,key,children:children.map(c => convert(c,key,m.id))};
  });
  for (const hub of Object.values(MODULE_SETTINGS_BY_PATH)) {
    const key = pageKey(hub.settingsPath);
    if (!resources.has(key)) {
      const owner = navigation.NAV_MODULES.find(m => hub.settingsPath.startsWith(m.path+'/') || m.matchPrefixes?.some(p => hub.settingsPath.startsWith(p+'/')));
      if (!owner) throw Error(`设置菜单未找到所属模块：${hub.settingsPath}`);
      resources.set(key,{key,title:'设置',type:'page',parent:`module:${owner.id}`,path:hub.settingsPath});
      tree.find(m=>m.id===owner.id)?.children.push({id:key,title:'设置',key,children:[]});
    }
    // Retain every stored setting resource even when a current business view filters it out.
    for(const item of hub.items){const k=settingKey(hub.settingsPath,item.seq);resources.set(k,{key:k,title:item.title,type:'setting',parent:key,path:hub.settingsPath,seq:item.seq});}
    const items = settingsCategoryItems(hub);
    const grouped = hub.settingsPath === STORE_INFORMATION_SETTINGS_PATH ? groupCatalogItemsByCategory(items,hub.groupOrder) : settingsCategoryViewGroups(hub,hub.settingsPath,groupCatalogItemsByCategory(items,hub.groupOrder));
    const order = hub.groupNavSections?.flatMap(s=>s.groupKeys) ?? hub.groupOrder ?? grouped.map(g=>g.groupKey);
    const ordered = [...new Set([...order,...grouped.map(g=>g.groupKey)])].flatMap(id => {
      const group = grouped.find(g=>g.groupKey===id); if (!group) return [];
      const section = hub.groupNavSections?.find(s=>s.groupKeys.includes(id));
      const keys = group.items.map(item => {
        const k=settingKey(hub.settingsPath,item.seq);
        resources.set(k,{key:k,title:item.title,type:'setting',parent:key,path:hub.settingsPath,seq:item.seq});return k;
      });
      return [{id,title:label(group.groupTitle),section:section ? t(section.labelKey as MessageKey) : '',keys}];
    });
    if(hub.settingsPath===STORE_INFORMATION_SETTINGS_PATH){
      // Share source grouping with the real pages; never rename stored grant keys.
      for(const item of hub.items){
        const resource=resources.get(settingKey(hub.settingsPath,item.seq))!;
        resource.path=storeInformationItemPath(item);
        resource.parent=pageKey(resource.path);
      }
      for(const child of navigation.NAV_MODULES.find(m=>m.id==='store-mgmt')!.children){
        const target=pageKey(child.path);
        const viewGroups=settingsCategoryViewGroups(hub,child.path,groupCatalogItemsByCategory(items,hub.groupOrder));
        groups.set(target,viewGroups.map(g=>({id:g.groupKey,title:label(g.groupTitle),section:'',keys:g.items.map(item=>settingKey(hub.settingsPath,item.seq))})));
      }
      const profile=resources.get(settingKey(hub.settingsPath,417))!;
      profile.title='门店档案';
      profile.relatedGrantKeys=[settingKey(hub.settingsPath,433)];
      groups.set(pageKey('/stores/profile'),[{id:'store-profile',title:'门店档案',section:'',keys:[profile.key]}]);
    }else groups.set(key,ordered);
    if(hub.settingsPath==='/orders/settings'){
      for(const [seq,path,title] of [[446,'/orders/discounts','折扣管理'],[447,'/orders/surcharges','附加费与服务费']] as const){
        const field=resources.get(settingKey(hub.settingsPath,seq))!;
        field.parent=pageKey(path);field.path=path;
        groups.set(pageKey(path),[{id:`order-preset-${seq}`,title,section:'',keys:[field.key]}]);
      }
    }
  }
  const registered = new Map<string, [string,string][]>();
  for(const [path,actions] of Object.entries(auditedActions))registered.set(path,[...actions]);
  for(const [path,actions] of Object.entries(additionalPageActions))registered.set(path,[...(registered.get(path)??[]),...actions.map(a=>[a.id,a.title] as [string,string])]);
  for (const [path,actions] of registered) {
    if (!resources.has(pageKey(path))) throw Error(`操作权限对应的菜单不存在：${path}`);
    for(const [id,title] of actions) { const key=actionKey(path,id);if(resources.has(key))throw Error(`重复的操作权限：${key}`);const help=additionalPageActions[path]?.find(a=>a.id===id)?.help;resources.set(key,{key,title,type:'action',parent:pageKey(path),path,...(help?{help}:{})}); }
  }
  for(const [path,entries] of Object.entries(visibilityEntries)){
    if(!resources.has(pageKey(path)))throw Error(`内容权限缺少页面：${path}`);
    for(const entry of entries){
      const key=(entry.kind==='field'?fieldKey:contentKey)(path,entry.id);
      if(resources.has(key))throw Error(`重复内容权限：${key}`);
      resources.set(key,{key,title:entry.title,type:entry.kind,parent:entry.parentId?contentKey(path,entry.parentId):pageKey(path),path,previewValue:entry.previewValue});
    }
  }
  for(const [key,requires] of Object.entries(actionVisibilityDependencies)){
    const action=resources.get(key);if(!action||action.type!=='action')throw Error(`内容关联缺少操作：${key}`);
    for(const dependency of requires)if(!['content','field'].includes(resources.get(dependency)?.type??''))throw Error(`操作关联缺少内容：${dependency}`);
    action.requires=[...new Set(requires)];
  }
  registerTipsPages(tree,resources);
  registerScheduleAuthorization(resources,tree,groups);
  const sections=registerPageSections(resources);
  const otherPage=pageKey(MENU_ORDER_OTHER_SETTINGS_PATH);
  if(!resources.has(otherPage))throw Error('菜单下单规则其他设置页面不存在');
  sections.set(otherPage,MENU_ORDER_OTHER_SETTINGS_SECTIONS.map(category=>({
    id:category.key,title:category.title,section:'',keys:category.settings.map(item=>{
      const key=settingKey('/operations/queue-call/menu-order-limits',item.seq);
      if(resources.has(key))throw Error(`重复其他设置权限：${key}`);
      resources.set(key,{key,title:item.title,type:'setting',parent:otherPage,path:MENU_ORDER_OTHER_SETTINGS_PATH,seq:item.seq});
      return key;
    }),
  })));
  registerBreaksPages(tree,resources,sections);
  registerClockPages(tree,resources,sections);
  registerEmployeePages(tree,resources);
  for(const r of resources.values())if(r.parent&&!resources.has(r.parent))throw Error(`权限缺少父级：${r.key}`);
  return {tree:groupStoreManagementMenus(tree),resources,groups,sections};
}
