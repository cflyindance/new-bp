import { M_MODULES, mModuleKey, mPageKey, type MModule, type MPage } from './m-platform-catalog';
import { MENU_ROUTING_PAGES } from '../config/menu-routing-navigation';

export function groupMNavigation(authorized: MModule[]): MModule[] {
  return authorized.map(module => ({ ...module, pages: [...module.pages] }));
}

/** Shared display inventory. Authorization continues to use M_MODULES/M_RESOURCES. */
export function buildMNavigationModules(authorized: MModule[]): MModule[] {
  const modules = groupMNavigation(authorized);
  const routing = modules.find(module => module.id === 'routing');
  if (routing) {
    const resource = routing.pages[0];
    modules.push({ id:'menu-config-nav', title:'菜单配置', pages: MENU_ROUTING_PAGES.filter(p=>p.view==='nav'||p.view==='menu-log').map(page=>({...resource,title:page.title,path:page.path})) });
    routing.pages = MENU_ROUTING_PAGES.filter(p=>p.view==='menu-root'||p.view==='registry').map(page=>({...resource,title:page.title,path:page.path}));
    modules.push({ id:'registry-nav', title:'页面注册中心', pages: MENU_ROUTING_PAGES.filter(p=>p.view==='projects'||p.view==='registry-log').map(page=>({...resource,title:page.title,path:page.path})) });
  }
  const presetIndex = modules.findIndex(module=>module.pages.some(p=>p.id==='presets'));
  if (presetIndex >= 0) {
    const resource = modules[presetIndex].pages.find(p=>p.id==='presets')!;
    modules.splice(presetIndex,0,
      {id:'business-menu-template-nav',title:'业态与菜单模板',pages:[{...resource,title:'业态与菜单模板',path:'/m-platform/business-menu-templates'}]},
      {id:'display-regions-nav',title:'广告位管理',pages:[{...resource,title:'广告位管理',path:'/m-platform/display-regions'}]});
  }
  const rolePages = modules.find(m=>m.id==='permissions')?.pages.filter(p=>['roles','provider-roles'].includes(p.id)) ?? [];
  rolePages.sort((a,b)=>Number(b.id==='roles')-Number(a.id==='roles'));
  if(rolePages.length)modules.push({id:'role-permissions-nav',title:'角色与权限',pages:rolePages});
  return modules;
}

export const M_NESTED_NAV_IDS = ['role-permissions-nav','registry-nav','menu-config-nav'];
export function mNavigationHasChildren(module: MModule): boolean {
  return module.id==='menu-config-nav'||module.id==='registry-nav'||module.id==='routing'||module.id==='activity-analysis'||
    (M_MODULES.find(original=>original.id===module.id)?.pages.length??module.pages.length)>1||module.id==='permissions';
}

export interface MNavigationEntry {
  id: string; title: string; resourceKey?: string; path?: string; children: MNavigationEntry[];
}

/** Includes all sidebar layers, without filtering by the role currently being edited. */
export function buildMNavigationTree(): MNavigationEntry[] {
  const modules = buildMNavigationModules(M_MODULES);
  const leaf = (page: MPage): MNavigationEntry => ({id:page.path,title:page.title,resourceKey:mPageKey(page.id),path:page.path,children:[]});
  function children(module: MModule): MNavigationEntry[] {
    const entries: MNavigationEntry[] = [];
    for (const page of module.pages) {
      const groupId = module.id==='permissions'&&['roles','provider-roles'].includes(page.id)?'role-permissions-nav':
        module.id==='routing'&&page.path.endsWith('/page-registry')?'registry-nav':
        module.id==='routing'&&page.path.endsWith('/menu')?'menu-config-nav':undefined;
      if (!groupId) { entries.push(leaf(page)); continue; }
      if(entries.some(n=>n.id===groupId))continue;
      const group = modules.find(m=>m.id===groupId)!;
      entries.push({id:group.id,title:group.title,children:group.pages.map(leaf)});
    }
    return entries;
  }
  return modules.filter(m=>!M_NESTED_NAV_IDS.includes(m.id)).map(module=>{
    if(!mNavigationHasChildren(module)&&!M_MODULES.some(m=>m.id===module.id))return leaf(module.pages[0]);
    return {id:module.id,title:module.title,resourceKey:mModuleKey(module.id),children:children(module)};
  });
}
