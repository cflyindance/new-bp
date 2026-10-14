import * as navigation from "../config/navigation";
import { MODULE_SETTINGS_BY_PATH, groupCatalogItemsByCategory } from "../config/module-settings-catalog";
import { normalizeFohCatalogItemsForGrouping } from "../config/foh-settings-group-keys";
import { FINANCE_SETTINGS_PATH, normalizeFinanceCatalogItemsForGrouping } from "../config/finance-settings-group-keys";
import { ORDER_SETTINGS_PATH, normalizeOrderCatalogItemsForGrouping } from "../config/order-settings-group-keys";
import { t, type MessageKey } from "../i18n";
import type { Resource } from "./center-domain";
import { additionalPageActions } from './center-actions';
import { FINANCE_REGISTER_AUDIT_PAGES } from '../config/finance-register-audit-pages';

export interface MenuNode { id: string; title: string; key?: string; children: MenuNode[] }
export interface SettingGroup { id: string; title: string; section: string; keys: string[] }
export interface Catalog { tree: MenuNode[]; resources: Map<string, Resource>; groups: Map<string, SettingGroup[]> }
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
  '/brand-products/seasoning-mgmt/seasoning':[['create-option','新增 Option'],['edit-option','编辑 Option'],['toggle-option','启用 / 停用 Option'],['manage-category','分类管理'],['batch-config','批量配置'],['edit-product','编辑商品调味'],['delete-product','删除商品调味']],
  '/permissions/roles':[['create','新增角色'],['edit','编辑权限'],['delete','删除角色']],
  '/permissions/staff':[['save','保存员工授权']],
};
const label = (s: string) => s.length > 2 && s.endsWith('设置') ? s.slice(0,-2) : s;
export function buildCenterCatalog(): Catalog {
  const resources = new Map<string, Resource>(), groups = new Map<string, SettingGroup[]>();
  const convert = (item: InputNode, parent: string, moduleId: string): MenuNode => {
    const children = item.sidebarChildren ?? item.children ?? (item.id==='fin-register-audit' ? FINANCE_REGISTER_AUDIT_PAGES.map(p=>({title:p.title,path:p.path})) : lists[childLists[item.id ?? '']]) ?? [];
    const id=item.id ?? item.path;
    const key=children.length ? navigationKey(moduleId,id) : pageKey(item.path);
    if(resources.has(key))throw Error(`重复的菜单权限：${key}`);
    resources.set(key,{key,title:item.title,type:children.length?'navigation':'page',parent,path:item.path});
    const node: MenuNode = { id,title:item.title,key,children:children.map(c => convert(c,key,moduleId)) };
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
    const items = hub.settingsPath === '/operations/queue-call/settings' ? normalizeFohCatalogItemsForGrouping(hub.items) : hub.settingsPath === FINANCE_SETTINGS_PATH ? normalizeFinanceCatalogItemsForGrouping(hub.items) : hub.settingsPath === ORDER_SETTINGS_PATH ? normalizeOrderCatalogItemsForGrouping(hub.items) : hub.items;
    const grouped = groupCatalogItemsByCategory(items,hub.groupOrder);
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
    groups.set(key,ordered);
  }
  const registered = new Map<string, [string,string][]>();
  for(const [path,actions] of Object.entries(auditedActions))registered.set(path,[...actions]);
  for(const [path,actions] of Object.entries(additionalPageActions))registered.set(path,[...(registered.get(path)??[]),...actions.map(a=>[a.id,a.title] as [string,string])]);
  for (const [path,actions] of registered) {
    if (!resources.has(pageKey(path))) throw Error(`操作权限对应的菜单不存在：${path}`);
    for(const [id,title] of actions) { const key=actionKey(path,id);if(resources.has(key))throw Error(`重复的操作权限：${key}`);resources.set(key,{key,title,type:'action',parent:pageKey(path),path}); }
  }
  return {tree:groupStoreManagementMenus(tree),resources,groups};
}
