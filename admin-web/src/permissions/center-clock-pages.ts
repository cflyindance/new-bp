import {TEAM_CLOCK_IN_TABS,TEAM_CLOCK_IN_SETTING_GROUPS,TEAM_CLOCK_IN_SETTING_SEQS} from '../config/team-clock-in-navigation';
import {getTeamEmbeddedSettingItems} from '../config/module-settings-catalog';
import type {Resource} from './center-domain';
import type {MenuNode,SettingGroup} from './center-catalog';
export const CLOCK_PATH='/team/clock-in';
export const CLOCK_ROOT=`page:${CLOCK_PATH}`;
export const clockViewKey=(view:string)=>`${CLOCK_ROOT}:${view}`;
/** Preserve the old entry key and actions, but do not grant newly introduced views. */
export function registerClockPages(tree:MenuNode[],resources:Map<string,Resource>,sections:Map<string,SettingGroup[]>):void {
  const find=(nodes:MenuNode[]):MenuNode|undefined=>{for(const n of nodes){if(n.key===CLOCK_ROOT)return n;const found=find(n.children);if(found)return found;}};
  const node=find(tree),root=resources.get(CLOCK_ROOT);
  if(!node||!root)throw Error('员工打卡入口不存在');
  root.type='navigation';
  node.children=TEAM_CLOCK_IN_TABS.map(tab=>{
    const key=clockViewKey(tab.key);if(resources.has(key))throw Error(`重复打卡页面：${key}`);
    resources.set(key,{key,title:tab.label,type:'page',parent:CLOCK_ROOT,path:CLOCK_PATH,viewId:tab.key});
    return {id:`clock-view-${tab.key}`,title:tab.label,key,children:[]};
  });
  for(const id of ['adjust-clock','break']){
    const action=resources.get(`action:${CLOCK_PATH}:${id}`);if(!action)throw Error(`打卡操作不存在：${id}`);
    action.parent=clockViewKey('live');
  }
  const items=getTeamEmbeddedSettingItems(TEAM_CLOCK_IN_SETTING_SEQS),rules=clockViewKey('rules');
  const groups:SettingGroup[]=TEAM_CLOCK_IN_SETTING_GROUPS.map(g=>({id:g.key,title:g.title,section:'',keys:g.seqs.map(seq=>{
    const item=items.find(i=>i.seq===seq);if(!item)throw Error(`打卡设置不存在：${seq}`);
    const key=`setting:${CLOCK_PATH}:${seq}`;
    if(resources.has(key))throw Error(`重复打卡设置：${key}`);
    resources.set(key,{key,title:item.title,type:'setting',parent:rules,path:CLOCK_PATH,seq});return key;
  })}));
  const late=`setting:${CLOCK_PATH}:late-grace`;
  if(resources.has(late))throw Error(`重复打卡设置：${late}`);
  resources.set(late,{key:late,title:'迟到宽限分钟数',type:'setting',parent:rules,path:CLOCK_PATH,help:'对应后台未来版本标记项；配置/预览不表示生产功能已启用。'});
  groups[0].keys.unshift(late);sections.set(rules,groups);
}
