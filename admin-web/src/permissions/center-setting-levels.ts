import type {Catalog} from './center-catalog';
import type {Access,Resource} from './center-domain';
export const settingPageGate=(page:string)=>`setting-page:${page}`;
export const settingCategoryGate=(page:string,id:string)=>`setting-category:${page}:${id}`;
/** Neutral ceilings preserve old item decisions; an absent ceiling never grants an item. */
export function registerSettingLevels(c:Catalog):void {
  for(const page of [...c.resources.values()].filter(r=>r.type==='page')){
    const groups=c.sections?.get(page.key)??c.groups.get(page.key)??[];
    if(!groups.some(g=>g.keys.some(k=>c.resources.get(k)?.type==='setting')))continue;
    const gate=settingPageGate(page.key);page.settingPageGate=gate;page.ceilingKeys=[...(page.ceilingKeys??[]),gate];
    c.resources.set(gate,{key:gate,title:page.title,type:'setting',parent:page.parent,path:page.path,defaultAccess:'edit',compatibilityOnly:true});
    for(const item of c.resources.values())if(item.parent===page.key&&!item.compatibilityOnly)item.ceilingKeys=[...new Set([...(item.ceilingKeys??[]),gate])];
    for(const group of groups){
      const items=group.keys.map(k=>c.resources.get(k)).filter((r):r is Resource=>!!r);if(!items.some(r=>r.type==='setting'))continue;
      const key=settingCategoryGate(page.key,group.id);
      c.resources.set(key,{key,title:group.title,type:'setting',parent:gate,path:page.path,defaultAccess:'edit',ceilingKeys:[gate],compatibilityOnly:true});
      for(const item of items)item.ceilingKeys=[...new Set([...(item.ceilingKeys??[]),gate,key])];
    }
  }
}
export function assertSettingChoice(c:Catalog,resource:Resource,value:Access|'inherit',effective:(key:string)=>Access):void {
  if(value==='edit'&&resource.ceilingKeys?.some(k=>effective(k)!=='edit'))throw Error('上级权限限制，不能配置可编辑');
}
