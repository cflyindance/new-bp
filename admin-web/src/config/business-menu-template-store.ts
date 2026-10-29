import {brandMenuChoices,type MenuChoice} from './brand-menu-choices';
import {currentMAccess} from '../permissions/m-platform-store';
import {mActionKey,mPageKey} from '../permissions/m-platform-catalog';
import {mCanVisit} from '../permissions/m-platform-runtime';
export const TEMPLATE_PATH='/m-platform/platform-preset',TEMPLATE_STORAGE='menusifu:business-menu-templates-v1';
export const DIMENSIONS={category:{general:'通用',tea:'茶饮',chinese:'中餐',hotpot:'火锅',western:'西餐'},mode:{dining:'正餐',fast:'快餐',delivery:'外卖专营'},org:{single:'单店',chain:'连锁'}} as const;
export interface TemplateDraft {name:string;category:string;mode:string;org:string;keys:string[]}
export interface TemplateRelease extends TemplateDraft {version:number;at:string}
export interface BusinessMenuTemplate {id:string;revision:number;enabled:boolean;draft:TemplateDraft;releases:TemplateRelease[]}
const common=['/stores/profile','/stores/hours','/dashboard/overview','/brand-products/products','/menu/store-menu','/menu/store-products','/orders/all','/finance/register-audit/payments','/print-templates/decoration','/reports/revenue','/reports/sales/orders','/team/roles-employees/employees','/team/roles-employees/roles'];
/** Preserve exact selections and ancestors only; never grant siblings implicitly. */
export function templateKeysWithParents(keys:string[],choices:MenuChoice[]):string[]{
 const byKey=new Map(choices.map(c=>[c.key,c])),out=new Set<string>();
 for(const key of keys){let node=byKey.get(key);const seen=new Set<string>();while(node&&!seen.has(node.key)){seen.add(node.key);out.add(node.key);node=node.parent?byKey.get(node.parent):undefined;}}
 return [...out];
}
function defaults(choices:MenuChoice[]):BusinessMenuTemplate[]{
 const combos=[['tea','fast','茶饮快餐'],['chinese','dining','中餐正餐'],['chinese','fast','中式快餐'],['hotpot','dining','火锅正餐'],['general','fast','通用快餐'],['general','delivery','外卖专营']];
 return combos.flatMap(([category,mode,label])=>['single','chain'].map(org=>{
  const paths=new Set([...common,...(category==='tea'?['/menu/product-recipe','/menu/store-seasoning']:['/operations/kitchen-kds/display','/operations/kitchen-kds/workflow']),...(mode==='dining'?['/operations/reservations/waitlist','/operations/reservations/rsv','/operations/queue-call/tables','/operations/queue-call/floor-plan','/team/shift-scheduling/schedule']:mode==='fast'?['/operations/queue-call/settings']:['/operations/waitlist']),...(org==='chain'?['/brand/overview','/brand/list','/brand-stores/list','/brand-stores/overview']:[])]);
  const exact=choices.filter(c=>c.isPage&&c.path&&paths.has(c.path)).map(c=>c.key);
  // Explicit named pages from the current route catalog complete the baseline;
  // this is a finite page selection, not a recursive module-wide grant.
  const names=new Set(['商品','订单列表','交易记录','付款记录','销售概览',...(mode==='dining'?['桌台','预订','等位']:['叫号']),...(org==='chain'?['品牌总览','门店列表']:[])]);
  const pages=choices.filter(c=>c.isPage&&names.has(c.title)&&!c.path?.startsWith('/group-stores')).map(c=>c.key);
  const draft={name:label+' · '+(org==='chain'?'连锁':'单店'),category,mode,org,keys:templateKeysWithParents([...exact,...pages],choices)};
  return {id:`bt-${category}-${mode}-${org}`,revision:1,enabled:true,draft,releases:[{...draft,version:1,at:new Date().toISOString()}]};
 }));
}
export function readBusinessMenuTemplates(choices:MenuChoice[]):BusinessMenuTemplate[]{
 const raw=localStorage.getItem(TEMPLATE_STORAGE);if(raw){const value=JSON.parse(raw);if(!Array.isArray(value))throw Error('业态模板数据异常，请联系管理员处理。');return value;}
 const rows=defaults(choices);if(rows.some(r=>r.draft.keys.length))localStorage.setItem(TEMPLATE_STORAGE,JSON.stringify(rows));return rows;
}
export function canManageBusinessTemplates(publish=false):boolean{return location.hash.startsWith('#'+TEMPLATE_PATH)&&mCanVisit(TEMPLATE_PATH)&&currentMAccess(mPageKey('presets'))==='edit'&&(!publish||currentMAccess(mActionKey('presets','publish'))==='edit');}
export function saveBusinessMenuTemplate(id:string|undefined,draft:TemplateDraft,choices:MenuChoice[],expected?:number,publish=false):BusinessMenuTemplate {
 if(!canManageBusinessTemplates(publish))throw Error('暂无业态菜单模板编辑或发布权限。');
  choices=brandMenuChoices();
 if(!draft.name.trim()||draft.name.trim().length>60)throw Error('模板名称须为1至60字。');
 if(!Object.hasOwn(DIMENSIONS.category,draft.category)||!Object.hasOwn(DIMENSIONS.mode,draft.mode)||!Object.hasOwn(DIMENSIONS.org,draft.org))throw Error('请选择有效的品类、服务方式和组织模式。');
 const known=new Set(choices.map(c=>c.key));if(draft.keys.some(k=>!known.has(k)))throw Error('菜单目录已变化，包含失效节点，请重新核对。');
 const keys=templateKeysWithParents(draft.keys,choices);if(publish&&!choices.some(c=>c.isPage&&keys.includes(c.key)))throw Error('发布模板至少需要一个页面。');
 const rows=readBusinessMenuTemplates(choices),old=id?rows.find(t=>t.id===id):undefined;
 if(id&&(!old||old.revision!==expected))throw Error('模板已更新，请重新打开后编辑。');
 const value={...draft,name:draft.name.trim(),keys},row:BusinessMenuTemplate=old??{id:'bt-'+crypto.randomUUID(),revision:0,enabled:true,draft:value,releases:[]};row.revision++;row.draft=value;
 if(publish)row.releases.push({...structuredClone(value),version:(row.releases.at(-1)?.version??0)+1,at:new Date().toISOString()});
 if(!old)rows.push(row);localStorage.setItem(TEMPLATE_STORAGE,JSON.stringify(rows));return row;
}
export function setBusinessTemplateEnabled(id:string,enabled:boolean,choices:MenuChoice[],expected:number):void{
 if(!canManageBusinessTemplates(true))throw Error('暂无模板发布权限。');const rows=readBusinessMenuTemplates(choices),row=rows.find(t=>t.id===id);if(!row)throw Error('模板不存在。');if(row.revision!==expected)throw Error('模板已更新，请重新打开后操作。');row.enabled=enabled;row.revision++;localStorage.setItem(TEMPLATE_STORAGE,JSON.stringify(rows));
}
export function planTemplateSelection(before:string[],templateKeys:string[],choices:MenuChoice[],allowed:Set<string>|undefined,mode:'replace'|'add'){
 const known=new Set(choices.map(c=>c.key)),valid=new Set(choices.filter(c=>!allowed||allowed.has(c.key)).map(c=>c.key));
 const matched=templateKeys.filter(k=>valid.has(k)),keys=templateKeysWithParents(matched,choices).filter(k=>valid.has(k));
 const next=[...new Set([...(mode==='add'?before:[]),...keys])];
 return {next,added:next.filter(k=>!before.includes(k)),removed:before.filter(k=>!next.includes(k)),missing:templateKeys.filter(k=>!known.has(k)),blocked:templateKeys.filter(k=>known.has(k)&&!valid.has(k)),baseline:keys};
}
