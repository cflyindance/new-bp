import type {Catalog,MenuNode,SettingGroup} from './center-catalog';
import type {Access,Resource} from './center-domain';
const base='/operations/queue-call/';
export const FOH_PERMISSION_PAGES=[
  'brand-menu/brands','brand-menu/settings','category-settings/age-category','category-settings/menu',
  'category-settings/special-menu','category-settings/settings','classification-settings/categories',
  'classification-settings/settings','buffet-rules','menu-order-limits/dish-round','menu-order-limits/other',
].map(p=>base+p);
/** Navigation ownership changes only; persisted resource keys and business routes remain stable. */
export function registerFohPages(tree:MenuNode[],resources:Map<string,Resource>,groups:Map<string,SettingGroup[]>,sections:Map<string,SettingGroup[]>):void {
  const root=tree.find(n=>n.id==='queue-call')!;
  const move=(key:string,path:string)=>{const r=resources.get(key);if(!r)throw Error(`前厅权限缺失：${key}`);r.parent=`page:${path}`;};
  for(const id of ['qc-brand-menu','qc-category-settings','qc-classification-settings','qc-menu-order-limits']){
    const node=root.children.find(n=>n.id===id)!;if(!node)throw Error(`前厅导航缺失：${id}`);
    const nav=resources.get(node.key!)!,legacy=resources.get(`page:${nav.path}`);
    node.children=node.children.filter(n=>n.key!==legacy?.key);
    if(legacy){legacy.compatibilityOnly=true;legacy.type='navigation';legacy.parent=nav.parent;nav.legacyGateKey=legacy.key;groups.delete(legacy.key);}
  }
  root.children=root.children.filter(n=>!n.key||!resources.get(n.key)?.compatibilityOnly);
  const limits=root.children.find(n=>n.id==='qc-menu-order-limits')!,buffet=root.children.find(n=>n.id==='foh-buffet-rules')!;
  root.children=root.children.filter(n=>n!==buffet);limits.children.unshift(buffet);resources.get(buffet.key!)!.parent=limits.key;
  for(const [path,ids] of [
    ['category-settings/age-category',['object-manage-age','object-manage-category','manage-age','manage-category']],
    ['category-settings/menu',['edit-menu','copy-menu']],
    ['classification-settings/categories',['object-manage-category','manage-category','edit-menu']],
  ] as const){
    const source=base+(path.startsWith('category-')?'category-settings':'classification-settings');
    for(const id of ids)move(`${id.startsWith('object-')?'content':'action'}:${source}:${id}`,base+path);
  }
  // The retired quantity-rule page is NOT the mutually-exclusive/combo business page.
  for(const r of resources.values())if(r.parent===`page:${base}menu-order-limits`)r.compatibilityOnly=true;
  for(const [seq,path] of [[547,'brand-menu/brands'],[530,'brand-menu/settings'],[531,'brand-menu/settings'],[601,'category-settings/settings'],[602,'classification-settings/settings']] as const){
    const key=`setting:${base}${seq>=601?'settings':'brand-menu'}:${seq}`;
    move(key,base+path);
    for(const list of groups.values())for(const group of list)group.keys=group.keys.filter(k=>k!==key);
    const page=`page:${base+path}`,list=sections.get(page)??[];
    list.push({id:`field-${seq}`,title:resources.get(key)!.title,section:'',keys:[key]});sections.set(page,list);
  }
  const addSetting=(path:string,id:string,title:string)=>{
    const key=`setting:${base+path}:${id}`,page=`page:${base+path}`;
    resources.set(key,{key,title,type:'setting',parent:page,path:base+path});
    const list=sections.get(page)??[];list.push({id,title,section:'',keys:[key]});sections.set(page,list);
  };
  addSetting('category-settings/settings','special-display','展示特殊品类');
  for(const [id,title] of [['mutex','每轮菜品互斥'],['combo','每轮菜品组合']])addSetting('menu-order-limits/dish-round',id,title);
  const special=`page:${base}category-settings/special-menu`,key=`action:${base}category-settings:manage-special`;
  resources.set(key,{key,title:'编辑特殊品类及菜单',type:'action',parent:special,path:base+'category-settings/special-menu'});
  // Empty lists left by relocated settings are not extra categories.
  for(const [page,list] of groups)groups.set(page,list.filter(g=>g.keys.length));
}
export function registerFohPageGates(c:Catalog):void {
  for(const path of FOH_PERMISSION_PAGES){
    const page=c.resources.get(`page:${path}`)!;
    // These pages have an explicit page ceiling: local hidden objects must not close the page gate.
    delete page.pageContentKeys;
    if(!page.settingPageGate){
      const gate=`setting-page:${page.key}`;page.settingPageGate=gate;page.ceilingKeys=[...(page.ceilingKeys??[]),gate];
      c.resources.set(gate,{key:gate,title:page.title,type:'setting',parent:page.parent,path,defaultAccess:'edit',compatibilityOnly:true});
      for(const r of c.resources.values())if(r.parent===page.key&&!r.compatibilityOnly)r.ceilingKeys=[...new Set([...(r.ceilingKeys??[]),gate])];
    }
    if(path.startsWith(base+'brand-menu/')){
      const gate=c.resources.get(page.settingPageGate!)!;
      for(const legacyKey of [`setting-page:page:${base}brand-menu`,`setting-category:page:${base}brand-menu:brand-menu-presentation`]){
        if(!c.resources.has(legacyKey))c.resources.set(legacyKey,{key:legacyKey,title:'历史店中店设置门控',type:'setting',defaultAccess:'edit',compatibilityOnly:true});
        const alias=`foh-legacy:${page.key}:${legacyKey}`;
        c.resources.set(alias,{key:alias,title:'历史门控兼容',type:'setting',inheritFrom:legacyKey,parent:page.parent,path,compatibilityOnly:true});
        gate.relatedGrantKeys=[...(gate.relatedGrantKeys??[]),alias];gate.aggregateRelatedGrants=true;
      }
    }
  }
}
/** Explicit page decisions establish defaults; hiding retains raw local choices. */
export function applyFohPageDefaults(c:Catalog,target:Record<string,Access>,resource:Resource,value:Access|'inherit'):void {
  if(!FOH_PERMISSION_PAGES.includes(resource.path??'')||!resource.key.startsWith('setting-page:'))return;
  const page=`page:${resource.path}`;
  if(value==='hidden')return;
  for(const r of c.resources.values())if(r.parent===page&&!r.compatibilityOnly&&['content','action'].includes(r.type)){
    if(value==='inherit')delete target[r.key];else target[r.key]=r.type==='action'?(value==='edit'?'edit':'hidden'):'read';
  }
}
