/** Shared browser contract. Business modules own activity eligibility and participation. */
export type ActivityType = 'promotion' | 'points';
export type ClickAction = {type:'none'} | {type:'activity';activityType:ActivityType;activityId:string;scope:string} | {type:'external';title:string;url:string;scope:string};
export interface ActivityRecord {id:string;scope:string;type:ActivityType;name:string;status:'published'|'disabled'|'draft';startAt?:number;endAt?:number;storeIds:string[];description?:string;requiresBusinessCheck?:boolean}
export interface ActivityProvider {
  list(scope:string,type:ActivityType):Promise<ActivityRecord[]>;
  get(scope:string,type:ActivityType,id:string):Promise<ActivityRecord|null>;
  check?(record:ActivityRecord,options:{runtime?:boolean;storeIds?:string[];startAt?:number;endAt?:number;now?:number}):Promise<{available:boolean;reason?:string}>;
  participate?(activity:ActivityRecord,context:{scope:string;storeId:string;source:{adId:string;slotId:string;assetId:string}}):Promise<{outcome:'opened'|'completed'|'cancelled'}>;
}
export interface ActivityContext {scope:string;canWrite:boolean;storeIds:string[];externalOrigins:string[];provider:ActivityProvider;supportedActions?:(slot:ActionSlot)=>Array<ClickAction['type']>}
export interface ActionSlot {id:string;productLine:string;code:string}
export const CATALOG_PREFIX='menusifu:ad-activity-catalog:v1:';
export const EVENT_PREFIX='menusifu:ad-activity-events:v1:';
export const NONE:ClickAction={type:'none'};
export function canConfigureActions(pageAccess:'edit'|'read'|'hidden'|undefined,snapshot:{enabled?:boolean;display?:boolean;l4EditMode?:string}|undefined,demo=false):boolean {
  if(pageAccess!==undefined)return pageAccess==='edit';
  if(snapshot)return snapshot.enabled===true&&snapshot.display!==false&&snapshot.l4EditMode==='editable';
  return demo;
}
// Platform integration policy, never an M-platform merchant-editable capability checkbox.
const CAPABILITIES:Record<string,readonly string[]>={Kiosk:['screensaver','home'],eMenu:['screensaver','home']};
export function capabilities(slot:ActionSlot|undefined,context?:ActivityContext):Array<ClickAction['type']> {
  if(slot&&context?.supportedActions){try{const supported=context.supportedActions(slot);return Array.isArray(supported)?['none',...supported.filter((value,index,all)=>value!=='none'&&['activity','external'].includes(value)&&all.indexOf(value)===index)]:['none'];}catch{return ['none'];}}
  return slot&&CAPABILITIES[slot.productLine]?.includes(slot.code)?['none','activity','external']:['none'];
}
export function normalizeAction(raw:unknown):ClickAction {
  if(raw===undefined||raw===null)return {type:'none'};
  if(typeof raw!=='object')throw Error('点击行为格式无效，请重新配置');
  const a=raw as Record<string,unknown>;
  if(a.type==='none')return {type:'none'};
  const scope=typeof a.scope==='string'?a.scope.trim():'';
  if(!scope)throw Error('请选择明确品牌后配置活动');
  if(a.type==='activity'&&['promotion','points'].includes(String(a.activityType))&&typeof a.activityId==='string'&&a.activityId.trim())return {type:'activity',scope,activityType:a.activityType as ActivityType,activityId:a.activityId.trim()};
  if(a.type==='external'&&typeof a.title==='string'&&a.title.trim()&&a.title.trim().length<=80&&typeof a.url==='string')return {type:'external',scope,title:a.title.trim(),url:a.url.trim()};
  throw Error('请完整填写点击行为与活动信息');
}
export function safeExternalUrl(value:string,origins:string[]):string {
  let url:URL;try{url=new URL(value);}catch{throw Error('请输入完整的 HTTPS 活动链接');}
  if(url.protocol!=='https:'||url.username||url.password)throw Error('仅支持不含账号密码的 HTTPS 活动链接');
  if(!origins.some(origin=>{try{return new URL(origin).origin===origin&&origin===url.origin;}catch{return false;}}))throw Error('该活动域名尚未登记，请联系平台管理员');
  return url.href;
}
function assertRecord(record:ActivityRecord,scope:string,type:ActivityType,id?:string):void {
  if(!record||record.scope!==scope||record.type!==type||typeof record.id!=='string'||!record.id.trim()||id!==undefined&&record.id!==id||typeof record.name!=='string'||!record.name.trim()||!Array.isArray(record.storeIds)||record.storeIds.some(store=>typeof store!=='string'||!store))throw Error('活动归属或数据异常，请刷新后重试');
  for(const key of ['startAt','endAt'] as const)if(record[key]!==undefined&&!Number.isFinite(record[key]))throw Error('活动时间信息无效');
  if(record.startAt!==undefined&&record.endAt!==undefined&&record.endAt<=record.startAt)throw Error('活动有效期无效');
}
export function localCatalogProvider(storage:Pick<Storage,'getItem'>):ActivityProvider {
  function read(scope:string):ActivityRecord[]{
    const raw=storage.getItem(CATALOG_PREFIX+encodeURIComponent(scope));if(!raw)return [];
    let value;try{value=JSON.parse(raw);}catch{throw Error('活动目录无法读取，请重试');}
    if(value?.schema!==1||value.scope!==scope||!Array.isArray(value.activities))throw Error('活动目录归属或版本无效');
    return value.activities;
  }
  return {async list(scope,type){return read(scope).filter(a=>a.type===type).map(a=>{assertRecord(a,scope,type);return structuredClone(a);});},async get(scope,type,id){const a=read(scope).find(a=>a.id===id&&a.type===type);if(a)assertRecord(a,scope,type,id);return a?structuredClone(a):null;}};
}
export async function getActivity(context:ActivityContext,type:ActivityType,id:string):Promise<ActivityRecord> {
  if(!context.scope)throw Error('品牌上下文不可用，请从营销广告入口进入');
  const record=await context.provider.get(context.scope,type,id);if(!record)throw Error('活动已删除或不可访问');assertRecord(record,context.scope,type,id);return record;
}
export async function listActivities(context:ActivityContext,type:ActivityType):Promise<ActivityRecord[]> {
  if(!context.scope)throw Error('品牌上下文不可用，请从营销广告入口进入');
  const rows=await context.provider.list(context.scope,type),ids=new Set<string>();
  if(!Array.isArray(rows))throw Error('活动列表格式无效');
  for(const row of rows){assertRecord(row,context.scope,type);if(ids.has(row.id))throw Error('活动目录存在重复标识');ids.add(row.id);}
  return rows;
}
export function activityState(record:ActivityRecord,now=Date.now()):string {
  if(record.status!=='published')return record.status==='disabled'?'已停用':'未发布';
  if(record.endAt!==undefined&&now>=record.endAt)return '已结束';
  return record.startAt!==undefined&&now<record.startAt?'未开始':'进行中';
}
export async function validateAction(raw:unknown,slot:ActionSlot,context:ActivityContext,options:{runtime?:boolean;storeIds?:string[];startAt?:number;endAt?:number;now?:number}={}):Promise<ClickAction> {
  const action=normalizeAction(raw);if(action.type==='none')return action;
  if(!capabilities(slot,context).includes(action.type))throw Error('该渠道或位置暂不支持此点击行为，请改为不跳转');
  if(!context.scope||action.scope!==context.scope)throw Error('活动所属品牌与当前品牌不一致，请重新选择');
  if(action.type==='external')return {...action,url:safeExternalUrl(action.url,context.externalOrigins)};
  const record=await getActivity(context,action.activityType,action.activityId),now=options.now??Date.now(),state=activityState(record,now);
  if(record.status!=='published'||state==='已结束'||options.runtime&&state!=='进行中')throw Error('活动'+state+'，请更换活动');
  if(options.storeIds?.some(id=>record.storeIds.length&&!record.storeIds.includes(id)))throw Error('所选门店不在活动适用范围内，请调整门店或活动');
  if(options.startAt!==undefined&&record.startAt!==undefined&&options.startAt<record.startAt||options.endAt!==undefined&&record.endAt!==undefined&&options.endAt>record.endAt)throw Error('广告生效时间超出活动有效期，请调整排期');
  if(record.requiresBusinessCheck&&!context.provider.check)throw Error('活动的星期、时段及生效类型校验尚未接入');
  if(context.provider.check){const result=await context.provider.check(record,options);if(!result?.available)throw Error(result?.reason||'活动当前不可用于该广告');}
  return action;
}
export function actionLabel(raw:unknown):string {try{const a=normalizeAction(raw);return a.type==='none'?'不跳转':a.type==='external'?'外部活动 · '+a.title:a.activityType==='promotion'?'促销活动':'积分兑换活动';}catch{return '点击行为待完善';}}
export interface ActionTheme {id?:string;interactionScope?:string;adSlot:ActionSlot;adSlotAssets?:Record<string,Array<{clickAction?:unknown;assetId?:string}>>;lastDistributePrefs?:{stores?:Array<{mid:string}>;startDate?:string;startTime?:string;endDate?:string;endTime?:string}}
export function hasActions(theme:ActionTheme):boolean {return Object.values(theme.adSlotAssets??{}).some(list=>list.some(a=>normalizeAction(a.clickAction).type!=='none'));}
export async function validateThemeActions(theme:ActionTheme,context:ActivityContext,phase:'content'|'publish'='content'):Promise<void> {
  if(theme.interactionScope&&theme.interactionScope!==context.scope)throw Error('广告活动所属品牌已变化，请重新打开广告');
  if(!hasActions(theme))return;
  if(!context.canWrite)throw Error('暂无活动广告编辑或发布权限');
  if(theme.interactionScope!==context.scope)throw Error('广告活动所属品牌已变化，请重新打开广告');
  const prefs=theme.lastDistributePrefs??{},start=Date.parse((prefs.startDate??'')+'T'+(prefs.startTime??'')),end=Date.parse((prefs.endDate??'')+'T'+(prefs.endTime??''));
  for(const list of Object.values(theme.adSlotAssets??{}))for(const item of list)await validateAction(item.clickAction,theme.adSlot,context,phase==='publish'?{storeIds:(prefs.stores??[]).map(s=>s.mid),startAt:Number.isFinite(start)?start:undefined,endAt:Number.isFinite(end)?end:undefined}:{});
}
export async function resolveThemeAssets(theme:ActionTheme,context:ActivityContext,storeId:string,now=Date.now()):Promise<{items:Array<{clickAction?:unknown;assetId?:string}>;clear:boolean}> {
  if(theme.interactionScope&&theme.interactionScope!==context.scope)return {items:[],clear:true};
  const items=[];
  for(const list of Object.values(theme.adSlotAssets??{}))for(const item of list){try{if(normalizeAction(item.clickAction).type!=='none'&&theme.interactionScope!==context.scope)continue;await validateAction(item.clickAction,theme.adSlot,context,{runtime:true,storeIds:[storeId],now});items.push(item);}catch{/* An invalid activity never becomes a broken clickable ad. */}}
  return {items,clear:items.length===0};
}
export function recordEvent(storage:Pick<Storage,'getItem'|'setItem'>,context:ActivityContext,event:{type:'exposure'|'click'|'participation';adId:string;assetId:string;slotId:string;activityId?:string;channel?:string;positionCode?:string;storeId?:string},preview=false):void {
  if(preview||!context.scope)return;
  const key=EVENT_PREFIX+encodeURIComponent(context.scope);
  try{const old=JSON.parse(storage.getItem(key)??'[]');storage.setItem(key,JSON.stringify([...(Array.isArray(old)?old:[]).slice(-499),{type:event.type,adId:event.adId,assetId:event.assetId,slotId:event.slotId,activityId:event.activityId,channel:event.channel,positionCode:event.positionCode,storeId:event.storeId,at:Date.now()}]));}catch{/* Telemetry failure must not interrupt ordering. */}
}
let context:ActivityContext|undefined;
let resolver:(()=>ActivityContext)|undefined;
export function setContext(next:ActivityContext):void {context={...next,storeIds:[...next.storeIds],externalOrigins:[...next.externalOrigins]};if(typeof window!=='undefined')window.dispatchEvent(new Event('ad-activity-context'));}
export function setContextResolver(next:()=>ActivityContext):void {resolver=next;if(typeof window!=='undefined')window.dispatchEvent(new Event('ad-activity-context'));}
export function getContext():ActivityContext {
  return resolver?.()??context??{scope:'',canWrite:false,storeIds:[],externalOrigins:[],provider:localCatalogProvider(localStorage)};
}
