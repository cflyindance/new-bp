import { BREAKS_OVERTIME_NAV_GROUPS } from '../config/team-breaks-overtime-navigation';
import type { Resource } from './center-domain';
import type { SettingGroup } from './center-catalog';

const path='/team/breaks-overtime',page=`page:${path}`;
export const BREAKS_PERMISSION_SETTINGS=[
  {key:`setting:${path}:paid-break-minutes`,title:'带薪休息时长(分钟)',source:'src/main.ts',control:'329-paid-break-minutes',section:'break-rules'},
  {key:`setting:${path}:convert-excess`,title:'带薪休息超时部分转为无薪',source:'src/config/team-breaks-overtime-ui.ts',control:'data-break-convert-excess',section:'break-rules'},
  {key:`setting:${path}:block-early`,title:'禁止提前结束休息',source:'src/config/team-breaks-overtime-ui.ts',control:'data-break-block-early',section:'break-rules'},
  {key:`setting:${path}:week-start`,title:'工作周开始于',source:'src/config/team-breaks-overtime-ui.ts',control:'data-overtime-week-start',section:'work-week'},
] as const;
/** Separate page context: never copy legacy team-settings grants or business values. */
export function registerPageSections(resources:Map<string,Resource>):Map<string,SettingGroup[]> {
  if(!resources.has(page))throw Error('休息与加班页面不存在');
  for(const s of BREAKS_PERMISSION_SETTINGS){if(resources.has(s.key))throw Error(`重复分类设置：${s.key}`);resources.set(s.key,{key:s.key,title:s.title,type:'setting',parent:page,path});}
  const objectKeys:Record<string,string[]>={
    'custom-breaks':[`content:${path}:object-manage-break`,`action:${path}:manage-break`],
    'overtime-rules':[`content:${path}:object-manage-overtime`,`action:${path}:manage-overtime`],
  };
  const sections=BREAKS_OVERTIME_NAV_GROUPS.flatMap(g=>g.items.map(i=>({id:i.key,title:i.title,section:g.label,keys:[...(objectKeys[i.key]??[]),...BREAKS_PERMISSION_SETTINGS.filter(s=>s.section===i.key).map(s=>s.key)]})));
  for(const g of sections)for(const key of g.keys)if(!resources.has(key))throw Error(`分类缺少权限：${key}`);
  return new Map([[page,sections]]);
}
