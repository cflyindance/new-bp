import {operationObjects,type OperationEntry} from './operation-log';
const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const labels:Record<string,string>={
 name:'名称',title:'页面名称',titleEn:'英文名称',module:'维护模块',status:'启用状态',path:'路径地址',url:'应用入口地址',
 projects:'项目',pages:'页面',directories:'目录',assignments:'页面归属',menu:'菜单',children:'下级菜单',routing:'页面配置',
 microName:'微应用标识',microUrl:'应用入口地址',microRoute:'微应用路由',microAppConfig:'微应用配置',externalConfig:'外部链接配置',
 parentId:'父级目录',directoryId:'所属目录',projectId:'所属项目',pageId:'所属页面',parent:'父级目录',parentKey:'父级菜单',targetKey:'关联菜单',
 type:'页面类型',key:'菜单标识',icon:'图标',display:'是否显示',disabled:'是否禁用',extraInfo:'扩展信息',
 i18nInfo:'菜单展示名称',i18nKey:'多语言标识','zh-CN':'简体中文','zh-HK':'繁体中文','en-US':'English',
 accessControl:'权限控制',bool:'启用权限控制',permission:'权限配置',rule:'权限满足规则',value:'权限名称',serviceName:'服务名称',
 iframe:'隔离沙箱',keepAlive:'保持应用状态',defaultPage:'默认页面',routeType:'路由模式',target:'打开方式',features:'窗口设置',
 source:'来源',description:'说明',updatedBy:'修改人',firstname:'名字',lastname:'姓氏',timestamp:'修改时间',createdDate:'创建时间',
 '顺序':'显示顺序','配置':'配置内容','项目配置':'项目配置','页面配置':'页面配置'
};
const hidden=new Set(['id','_id','version','userId']);
const enums:Record<string,Record<string,string>>={status:{active:'启用',disabled:'停用',draft:'未发布',published:'已发布'},type:{inner:'项目内页面','micro-app':'微应用',iframe:'内嵌页面',external:'外部链接',link:'链接菜单'},rule:{some:'任一权限',every:'全部权限'},routeType:{hash:'哈希路由',history:'路径路由'},target:{_blank:'新窗口',_self:'当前窗口'}};
function keyOf(field:string):string{return field.replace(/\[[^\]]*\]/g,'').split('.').at(-1)??field;}
function objects(e:OperationEntry,side:'before'|'after'){
 return [...operationObjects(e[side]),...operationObjects(e[side==='before'?'after':'before']),...e.objects];
}
function reference(value:string,e:OperationEntry,side:'before'|'after'):string {
 return objects(e,side).find(o=>o.id===value)?.path??'关联对象（记录未包含名称）';
}
export function operationFieldLabel(field:string,e:OperationEntry):string {
 const parts=field.replace(/\[[^\]]*\]/g,'').split('.').filter(Boolean),key=keyOf(field);
 const ids=[...field.matchAll(/\[([^\]]*)\]/g)].map(m=>m[1]);
 const name=ids.map(id=>objects(e,'after').find(o=>o.id===id)?.path).filter(Boolean).at(-1);
 let label=labels[key]??(/[\u4e00-\u9fff]/.test(key)?key:'其他配置');
 if(hidden.has(key))label='系统标识';
 if(key==='name')label=parts.includes('projects')?'项目名称':parts.includes('microAppConfig')?'微应用标识':e.scope==='menu'?'菜单名称':'名称';
 const parent=parts.length>1?labels[parts.at(-2)!]:undefined;
 return [e.objects.length>1?name:undefined,parent&&parent!==label&&!['项目','页面','菜单','目录'].includes(parent)?parent:undefined,label].filter(Boolean).join(' · ');
}
export function renderOperationValue(value:unknown,e:OperationEntry,field:string,side:'before'|'after'):string {
 const key=keyOf(field);
 if(hidden.has(key))return '<span class="text-muted-foreground">系统自动管理</span>';
 if(value===null||value===undefined||value==='')return '<span class="text-muted-foreground">未设置</span>';
 if(typeof value==='boolean')return value?'是':'否';
 if(typeof value==='string'){
  if(value==='[已隐藏]')return '敏感信息已隐藏';
  if(['parentId','directoryId','projectId','pageId','parentKey','targetKey'].includes(key))return esc(reference(value,e,side));
  if(key==='顺序')return esc(reference(value,e,side));
  if((value.startsWith('{')||value.startsWith('['))&&key==='extraInfo'){try{return renderOperationValue(JSON.parse(value),e,field,side);}catch{return esc(value);}}
  return `<span class="whitespace-pre-wrap break-all">${esc(enums[key]?.[value]??value)}</span>`;
 }
 if(typeof value==='number')return esc(value);
 if(Array.isArray(value))return value.length?`<ol class="list-decimal space-y-2 pl-5">${value.map(v=>`<li>${renderOperationValue(v,e,field,side)}</li>`).join('')}</ol>`:'<span class="text-muted-foreground">无</span>';
 if(typeof value==='object'){
  const entries=Object.entries(value).filter(([k])=>!hidden.has(k));
  return entries.length?`<dl class="space-y-3">${entries.map(([k,v])=>`<div><dt class="mb-1 text-muted-foreground">${esc(labels[k]??k)}</dt><dd class="break-all">${renderOperationValue(v,e,`${field}.${k}`,side)}</dd></div>`).join('')}</dl>`:'<span class="text-muted-foreground">无可展示内容</span>';
 }
 return esc(value);
}
export function renderOperationChanges(e:OperationEntry):string {
 return e.changes.map(c=>{
  const added=c.before===null||c.before===undefined,removed=c.after===null||c.after===undefined;
  const kind=added&&!removed?'新增内容':removed&&!added?'删除内容':'';
  return `<tr class="border-t align-top" data-log-change><td class="break-words p-4"><p class="font-medium">${esc(operationFieldLabel(c.field,e))}</p>${kind?`<p class="mt-2 text-muted-foreground">${kind}</p>`:''}</td><td class="p-4">${added?'<span class="text-muted-foreground">原无此内容</span>':renderOperationValue(c.before,e,c.field,'before')}</td><td class="p-4">${removed?'<span class="text-muted-foreground">已删除</span>':renderOperationValue(c.after,e,c.field,'after')}</td></tr>`;
 }).join('')||'<tr><td colspan="3" class="p-4 text-muted-foreground">无字段变化</td></tr>';
}
