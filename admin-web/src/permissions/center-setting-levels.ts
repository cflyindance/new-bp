import type {Catalog} from './center-catalog';
import type {Access,Resource} from './center-domain';
import {hasModuleSettingsCategorySidebar} from '../config/settings-category-navigation';
import {FOH_PERMISSION_PAGES} from './center-foh-pages';
export const settingPageGate=(page:string)=>`setting-page:${page}`;
export const settingCategoryGate=(page:string,id:string)=>`setting-category:${page}:${id}`;
export const settingParentChoice=(key:string)=>`setting-parent-choice:${key}`;
/** Settings inherit only inside an already accessible page; explicit local decisions survive. */
export function registerSettingLevels(c:Catalog):void {
  for(const page of [...c.resources.values()].filter(r=>r.type==='page')){
    const groups=c.sections?.get(page.key)??c.groups.get(page.key)??[];
    if(!groups.some(g=>g.keys.some(k=>c.resources.get(k)?.type==='setting')))continue;
    const gate=settingPageGate(page.key);page.settingPageGate=gate;page.ceilingKeys=[...(page.ceilingKeys??[]),gate];
    const pageGate:Resource={key:gate,title:page.title,type:'setting',parent:page.parent,path:page.path,defaultAccess:'edit',compatibilityOnly:true};c.resources.set(gate,pageGate);
    const standalone=!!page.path&&!hasModuleSettingsCategorySidebar(page.path);
    for(const item of c.resources.values())if(item.parent===page.key&&!item.compatibilityOnly)item.ceilingKeys=[...new Set([...(item.ceilingKeys??[]),gate])];
    for(const group of groups){
      const items=group.keys.map(k=>c.resources.get(k)).filter((r):r is Resource=>!!r);if(!items.some(r=>r.type==='setting'))continue;
      const key=settingCategoryGate(page.key,group.id);
      c.resources.set(key,standalone?{key,title:group.title,type:'setting',parent:page.parent,path:page.path,defaultAccess:'edit',compatibilityOnly:true}:{key,title:group.title,type:'setting',parent:gate,path:page.path,inheritFrom:gate,ceilingKeys:[gate],compatibilityOnly:true});
      if(standalone){pageGate.relatedGrantKeys=[...(pageGate.relatedGrantKeys??[]),key];pageGate.aggregateRelatedGrants=true;}
      const source=standalone?gate:key,ceilings=standalone?[gate]:[gate,key];
      for(const item of items){item.ceilingKeys=[...new Set([...(item.ceilingKeys??[]),...ceilings])];if(item.type==='setting'){
        item.inheritFrom=source;
        for(const relatedKey of item.relatedGrantKeys??[]){const related=c.resources.get(relatedKey);if(related?.type==='setting'){related.inheritFrom=source;related.ceilingKeys=ceilings;}}
      }}
    }
  }
  for(const r of [...c.resources.values()])if(r.inheritFrom){
    const key=settingParentChoice(r.key);r.parentChoiceKey=key;
    c.resources.set(key,{key,title:`${r.title}继承选择`,type:'setting',compatibilityOnly:true});
  }
}
export function applySettingParentChoice(c:Catalog,grants:Record<string,Access>,resource:Resource):void {
  if(!resource.inheritFrom||!resource.parentChoiceKey)throw Error('该权限不支持继承父级');
  for(const key of [resource.key,...(resource.relatedGrantKeys??[])]){delete grants[key];const r=c.resources.get(key);if(r?.parentChoiceKey)grants[r.parentChoiceKey]='read';}
}
export function assertSettingChoice(c:Catalog,resource:Resource,value:Access|'inherit',effective:(key:string)=>Access):void {
  const parent=resource.parent?c.resources.get(resource.parent):undefined;
  if(value!=='hidden'&&parent?.type==='page'&&FOH_PERMISSION_PAGES.includes(parent.path??'')&&effective(parent.key)==='hidden')throw Error('页面不可见，不能开启局部权限');
  if(value==='edit'&&resource.ceilingKeys?.some(k=>effective(k)!=='edit'))throw Error('上级权限限制，不能配置可编辑');
}
