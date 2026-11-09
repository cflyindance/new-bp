/** Display region/content/publication contract. No browser state or UI dependencies. */
export const CONTENTS_PATH='/marketing/display-content/contents';
export const PLACEMENTS_PATH='/marketing/display-content/placements';
export const REGIONS_PATH='/m-platform/display-regions';
export const DISPLAY_TERMINALS=['Kiosk','eMenu','CDS','OO','SDI','取餐屏'] as const;
export type MediaKind='image'|'video';
export type Parameter='interval'|'idle'|'transition';
export interface TerminalBinding { minimumVersion:string; mediaKinds:MediaKind[] }
export interface DisplayRegion {id:string;name:string;code:string;scene:string;description:string;ratio:string;mediaKinds:MediaKind[];maxItems:number;parameters:Parameter[];bindings:Record<string,TerminalBinding>;enabled:boolean;builtin:boolean;generation:number}
export interface DisplayPlatform {schema:1;revision:number;regions:DisplayRegion[]}
export interface DisplayAsset {id:string;name:string;kind:MediaKind;url:string;variant:string}
export interface DisplayContent {id:string;name:string;regionId:string;assets:DisplayAsset[];settings:{interval?:number;idle?:number;transition?:string};version:number;updatedAt:number;legacyId?:string}
export interface PublicationSnapshot {contentId:string;name:string;version:number;regionCode:string;generation:number;assets:DisplayAsset[];settings:DisplayContent['settings']}
export interface DisplayPlacement {id:string;contentId:string;regionId:string;storeIds:string[];terminals:string[];startAt:number;endAt:number;timeZone:string;status:'draft'|'published'|'revoked';disabledTargets?:string[];snapshot?:PublicationSnapshot;publishedAt?:number;updatedAt:number}
export interface MerchantDisplayState {schema:1;scope:string;revision:number;contents:DisplayContent[];placements:DisplayPlacement[];legacyIds:string[]}
export interface DisplayContext {scope:string;storeIds:string[];canWrite:boolean}
export type RegionInput=Pick<DisplayRegion,'name'|'code'|'scene'|'description'|'ratio'|'mediaKinds'|'maxItems'|'parameters'|'bindings'>&{id?:string};
export type ContentInput=Pick<DisplayContent,'name'|'regionId'|'assets'|'settings'>&{id?:string;legacyId?:string};
export type PlacementInput=Pick<DisplayPlacement,'contentId'|'storeIds'|'terminals'|'startAt'|'endAt'>&{id?:string;timeZone?:string};
export interface TerminalRequest {scope:string;storeId:string;terminal:string;regionCode:string;version:string;now:number;variant?:string}
function fail(message:string):never {throw new Error(message)}
const clone=<T>(value:T):T=>structuredClone(value);
const unique=(values:string[])=>[...new Set(values)];
const uid=(prefix:string)=>`${prefix}-${globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
export function createPlatformState():DisplayPlatform {return {schema:1,revision:0,regions:[{id:'idle-screensaver',name:'待机屏保',code:'idle.screensaver',scene:'待机',description:'终端无操作时展示，进入与退出由终端控制。',ratio:'9:16 / 16:9',mediaKinds:['image','video'],maxItems:20,parameters:['interval','idle','transition'],bindings:{},enabled:true,builtin:true,generation:0}]}}
export function createMerchantState(scope:string):MerchantDisplayState {if(!scope)fail('请选择明确品牌后配置展示内容');return {schema:1,scope,revision:0,contents:[],placements:[],legacyIds:[]}}
export function restrictDisplayStores<T extends {value:string}>(scope:string,options:T[],directory:{storeId:string;merchantId:string}[]):T[] {const own=new Set(directory.filter(s=>s.merchantId===scope).map(s=>s.storeId));return options.filter(s=>!!s.value&&own.has(s.value))}
function requireContext(state:MerchantDisplayState,context:DisplayContext):void {if(!context.canWrite)fail('暂无操作权限');if(!context.scope||context.scope!==state.scope)fail('品牌上下文已变化，请重新打开页面');}
export function parseRatios(ratio:string):string[]{const values=ratio.split('/').map(v=>v.trim());if(!values.length||values.some(v=>!/^\d{1,4}:\d{1,4}$/.test(v)||v.split(':').some(x=>+x<=0)))fail('建议比例格式为 16:9，多比例用 / 分隔');return unique(values)}
export function saveRegion(state:DisplayPlatform,input:RegionInput,allowed:boolean):DisplayPlatform {
  if(!allowed)fail('暂无区域管理权限');const next=clone(state),existing=next.regions.find(r=>r.id===input.id);
  const name=input.name.trim(),code=input.code.trim(),scene=input.scene.trim();
  if(!name||name.length>30)fail('区域名称必填，最多 30 字');if(!scene||scene.length>20)fail('所属场景必填，最多 20 字');
  if(!/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)+$/.test(code)||code.length>64)fail('区域编码使用小写字母、数字和 . _ - 分隔符，最多 64 字');
  if(existing&&existing.code!==code)fail('区域编码创建后不可修改');if(next.regions.some(r=>r.code===code&&r.id!==existing?.id))fail('区域编码已存在');
  const ratio=parseRatios(input.ratio).join(' / ');if(!input.mediaKinds.length||input.mediaKinds.some(k=>!['image','video'].includes(k)))fail('至少选择一种有效素材类型');
  if(!Number.isInteger(input.maxItems)||input.maxItems<1||input.maxItems>20)fail('素材数量上限为 1～20 的整数');
  if(input.parameters.some(p=>!['interval','idle','transition'].includes(p)))fail('展示参数类型无效');if(input.description.length>200)fail('区域说明最多 200 字');
  const changed=existing&&['ratio','maxItems','mediaKinds','parameters'].some(key=>JSON.stringify(existing[key as keyof DisplayRegion])!==JSON.stringify({...input,ratio}[key as keyof RegionInput]));
  if(changed&&Object.keys(existing.bindings).length)fail('已接入区域的素材规范不可直接变更，请创建新区域或先协调终端兼容');
  for(const [terminal,binding] of Object.entries(input.bindings)){
    if(!(DISPLAY_TERMINALS as readonly string[]).includes(terminal))fail('终端类型无效');if(!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(binding.minimumVersion))fail(`${terminal} 最低版本格式无效，例如 5.0.1`);
    if(!binding.mediaKinds.length||binding.mediaKinds.some(k=>!input.mediaKinds.includes(k)))fail(`${terminal} 支持的素材类型超出区域规范`);
  }
  const value:DisplayRegion={...clone(input),id:existing?.id??input.id??uid('region'),name,code,scene,ratio,enabled:existing?.enabled??true,builtin:existing?.builtin??false,generation:existing?.generation??0,mediaKinds:unique(input.mediaKinds) as MediaKind[],parameters:unique(input.parameters) as Parameter[]};
  if(existing)next.regions[next.regions.indexOf(existing)]=value;else next.regions.push(value);return next;
}
export function setRegionEnabled(state:DisplayPlatform,id:string,enabled:boolean,allowed:boolean):DisplayPlatform {if(!allowed)fail('暂无区域管理权限');const next=clone(state),region=next.regions.find(r=>r.id===id);if(!region)fail('区域不存在');if(region!.enabled&&!enabled)region!.generation++;region!.enabled=enabled;return next}
export function isSafeMediaUrl(url:string,kind:MediaKind):boolean {return (kind==='video'&&/^display-media:[a-z0-9_-]+$/i.test(url))||/^https?:\/\//i.test(url)||/^\/(?!\/)/.test(url)||(kind==='image'?/^data:image\/(?:png|jpeg|webp|gif|svg\+xml)[;,]/i:/^data:video\/(?:mp4|webm)[;,]/i).test(url)}
function validateContent(input:ContentInput,region:DisplayRegion):void {
  if(!input.name.trim()||input.name.trim().length>50)fail('内容方案名称必填，最多 50 字');if(!region.enabled)fail('展示区域已停用');
  if(!input.assets.length||input.assets.length>region.maxItems)fail(`请配置 1～${region.maxItems} 个素材`);
  if(input.settings.transition!==undefined&&!['slide','fade','zoom','rotate','bounce','flip'].includes(input.settings.transition))fail('切换效果无效');const ratios=parseRatios(region.ratio);
  for(const variant of new Set(input.assets.map(a=>a.variant))){const group=input.assets.filter(a=>a.variant===variant);if(new Set(group.map(a=>a.kind)).size>1||group.filter(a=>a.kind==='image').length>5||group.filter(a=>a.kind==='video').length>1)fail('每种比例仅支持最多5张图片或1个视频，请调整素材')}for(const asset of input.assets){if(!region.mediaKinds.includes(asset.kind))fail('素材类型不符合区域规范');if(!isSafeMediaUrl(asset.url,asset.kind))fail('素材地址无效');if(asset.variant!=='default'&&!ratios.includes(asset.variant))fail('素材比例不符合区域规范');if(!asset.id||!asset.name.trim())fail('素材信息不完整')}
  for(const [parameter,max] of [['interval',300],['idle',3600]] as const){if(region.parameters.includes(parameter)){const v=input.settings[parameter];if(!Number.isInteger(v)||v!<1||v!>max)fail(`${parameter==='idle'?'无操作进入时间':'轮播间隔'}需为 1～${max} 秒的整数`)}}
}
export function saveContent(state:MerchantDisplayState,platform:DisplayPlatform,input:ContentInput,context:DisplayContext,now:number):MerchantDisplayState {
  requireContext(state,context);const region=platform.regions.find(r=>r.id===input.regionId);if(!region)fail('展示区域不存在');validateContent(input,region!);
  const next=clone(state),existing=next.contents.find(c=>c.id===input.id);const settings:DisplayContent['settings']={};for(const p of region!.parameters){if(p==='transition')settings.transition=input.settings.transition??'slide';else settings[p]=input.settings[p]}if(region!.builtin)settings.transition=input.settings.transition??'slide';
  const value:DisplayContent={...clone(input),id:existing?.id??input.id??uid('content'),name:input.name.trim(),settings,version:(existing?.version??0)+1,updatedAt:now};
  if(existing)next.contents[next.contents.indexOf(existing)]=value;else next.contents.unshift(value);return next;
}
function validateTargets(input:PlacementInput,context:DisplayContext):void {
  if(!input.storeIds.length||input.storeIds.some(s=>!context.storeIds.includes(s)))fail('请选择权限范围内的门店');
  if(!input.terminals.length||input.terminals.some(t=>!(DISPLAY_TERMINALS as readonly string[]).includes(t)))fail('请至少选择一个有效终端');
  if(!Number.isFinite(input.startAt)||!Number.isFinite(input.endAt)||input.endAt<=input.startAt)fail('结束时间必须晚于开始时间');
}
export function savePlacement(state:MerchantDisplayState,platform:DisplayPlatform,input:PlacementInput,context:DisplayContext,now:number):MerchantDisplayState {
  requireContext(state,context);validateTargets(input,context);const content=state.contents.find(c=>c.id===input.contentId);if(!content)fail('内容方案不存在');const region=platform.regions.find(r=>r.id===content!.regionId);if(!region?.enabled)fail('展示区域已停用');
  if(input.endAt<=now)fail('结束时间必须晚于当前时间');if(input.terminals.some(t=>!region.bindings[t]))fail('所选终端尚未接入此区域');
  const next=clone(state),existing=next.placements.find(p=>p.id===input.id);if(existing&&existing.status!=='draft')fail('仅草稿投放可以编辑');
  const value:DisplayPlacement={...clone(input),id:existing?.id??input.id??uid('placement'),regionId:content!.regionId,storeIds:unique(input.storeIds),terminals:unique(input.terminals),timeZone:input.timeZone??'Asia/Shanghai',status:'draft',updatedAt:now};
  if(existing)next.placements[next.placements.indexOf(existing)]=value;else next.placements.unshift(value);return next;
}
export function placementIsRevoked(placement:DisplayPlacement,platform:DisplayPlatform):boolean {const region=platform.regions.find(r=>r.id===placement.regionId);return placement.status==='revoked'||!!placement.snapshot&&(!region||placement.snapshot.generation!==region.generation)}
export function findPlacementConflict(state:MerchantDisplayState,platform:DisplayPlatform,candidate:DisplayPlacement,now:number):DisplayPlacement|undefined {return state.placements.find(p=>p.id!==candidate.id&&p.status==='published'&&p.endAt>now&&!placementIsRevoked(p,platform)&&p.regionId===candidate.regionId&&p.startAt<candidate.endAt&&candidate.startAt<p.endAt&&p.storeIds.some(s=>candidate.storeIds.includes(s)&&p.terminals.some(t=>candidate.terminals.includes(t)&&!p.disabledTargets?.includes(s+'|'+t)&&!candidate.disabledTargets?.includes(s+'|'+t))))}
export function publishPlacement(state:MerchantDisplayState,platform:DisplayPlatform,id:string,context:DisplayContext,now:number):MerchantDisplayState {
  requireContext(state,context);const next=clone(state),placement=next.placements.find(p=>p.id===id);if(!placement)fail('投放不存在');
  const region=platform.regions.find(r=>r.id===placement!.regionId);if(!region?.enabled)fail('展示区域已停用');
  if(placement!.status==='revoked'||placementIsRevoked(placement!,platform))fail('已撤销投放不可重新发布，请创建新投放');
  if(placement!.status!=='draft')fail('投放已发布，不能覆盖发布快照；请新建投放');
  validateTargets(placement!,context);if(placement!.endAt<=now)fail('投放已过期，请重新配置');
  const content=next.contents.find(c=>c.id===placement!.contentId);if(!content||content.regionId!==region.id)fail('内容方案的区域已变化，请重新配置投放');validateContent(content!,region);
  for(const terminal of placement!.terminals){const binding=region.bindings[terminal];if(!binding)fail(`${terminal} 尚未接入此区域`);if(content!.assets.some(a=>!binding.mediaKinds.includes(a.kind)))fail(`${terminal} 不支持所选素材类型`)}
  const conflict=findPlacementConflict(next,platform,placement!,now);if(conflict)fail(`与“${conflict.snapshot?.name??'已发布投放'}”在相同门店、终端和区域存在时间重叠`);
  placement!.snapshot={contentId:content!.id,name:content!.name,version:content!.version,regionCode:region.code,generation:region.generation,assets:clone(content!.assets),settings:clone(content!.settings)};
  placement!.status='published';placement!.publishedAt=now;placement!.updatedAt=now;return next;
}
export function revokePlacement(state:MerchantDisplayState,id:string,context:DisplayContext):MerchantDisplayState {requireContext(state,context);const next=clone(state),p=next.placements.find(p=>p.id===id);if(!p)fail('投放不存在');if(p!.storeIds.some(s=>!context.storeIds.includes(s)))fail('投放包含无权限门店，不能撤销');if(p!.status!=='published')fail('仅已发布投放可以撤销');p!.status='revoked';return next}
export function versionAtLeast(version:string,minimum:string):boolean {if(!/^\d+(?:\.\d+){2,3}$/.test(version)||!/^\d+(?:\.\d+){2,3}$/.test(minimum))return false;const a=version.split('.').map(Number),b=minimum.split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]??0)!==(b[i]??0))return (a[i]??0)>(b[i]??0)}return true}
export function resolveTerminalContent(platform:DisplayPlatform,state:MerchantDisplayState,request:TerminalRequest):{regionCode:string;revision:string;items:DisplayAsset[];settings:DisplayContent['settings'];clear:boolean;reason:string;validUntil:number|null} {
  const empty=(reason:string)=>({regionCode:request.regionCode,revision:`${platform.revision}:${state.revision}`,items:[] as DisplayAsset[],settings:{},clear:true,reason,validUntil:null});
  if(request.scope!==state.scope||!request.scope)return empty('scope-mismatch');const region=platform.regions.find(r=>r.code===request.regionCode);if(!region?.enabled)return empty('region-disabled');
  const binding=region.bindings[request.terminal];if(!binding||!versionAtLeast(request.version,binding.minimumVersion))return empty('unsupported-terminal');
  const matches=state.placements.filter(p=>p.status==='published'&&!placementIsRevoked(p,platform)&&p.regionId===region.id&&p.startAt<=request.now&&request.now<p.endAt&&p.storeIds.includes(request.storeId)&&p.terminals.includes(request.terminal)&&!p.disabledTargets?.includes(request.storeId+'|'+request.terminal));
  if(matches.length!==1)return empty(matches.length?'conflicting-publications':'no-active-content');const p=matches[0],snapshot=p.snapshot;if(!snapshot)return empty('missing-snapshot');
  const assets=snapshot.assets.filter(a=>binding.mediaKinds.includes(a.kind));let items=request.variant?assets.filter(a=>a.variant===request.variant):assets.filter(a=>a.variant==='default');if(!items.length)items=assets.filter(a=>a.variant==='default');if(!items.length&&!request.variant)items=assets.filter(a=>a.variant===assets[0]?.variant);
  if(!items.length)return empty('missing-compatible-media');return {regionCode:region.code,revision:`${platform.revision}:${state.revision}:${p.id}:${snapshot.version}`,items:clone(items),settings:clone(snapshot.settings),clear:false,reason:'active',validUntil:p.endAt};
}
export function importLegacyThemes(state:MerchantDisplayState,platform:DisplayPlatform,raw:unknown,context:DisplayContext,now:number):MerchantDisplayState {
  requireContext(state,context);if(!Array.isArray(raw))fail('旧屏保数据格式无效，原数据未修改');let next=clone(state);
  for(const value of raw){if(!value||typeof value!=='object')continue;const t=value as Record<string,unknown>,id=String(t.id??'');if(!id||next.legacyIds.includes(id))continue;const assets:DisplayAsset[]=[];let unreadable=false;
    for(const [field,variant] of [['portraitImages','9:16'],['landscapeImages','16:9']] as const){if(!Array.isArray(t[field]))continue;for(const [i,m] of (t[field] as unknown[]).entries()){if(!m||typeof m!=='object'){unreadable=true;continue}const a=m as Record<string,unknown>,url=String(a.dataUrl??a.url??''),kind:MediaKind=String(a.type??a.mediaType??'').includes('video')||url.startsWith('data:video/')?'video':'image';if(isSafeMediaUrl(url,kind))assets.push({id:`legacy-${id}-${variant}-${i}`,name:String(a.name??'旧屏保素材'),url,kind,variant});else unreadable=true}}
    if(unreadable||!assets.length||assets.length>20||[...new Set(assets.map(a=>a.variant))].some(variant=>{const group=assets.filter(a=>a.variant===variant);return new Set(group.map(a=>a.kind)).size>1||group.filter(a=>a.kind==='image').length>5||group.filter(a=>a.kind==='video').length>1}))continue;next=saveContent(next,platform,{id:`legacy-${id}`,name:String(t.name??'导入屏保').slice(0,50),regionId:'idle-screensaver',assets:assets.slice(0,20),settings:{interval:Number(t.carouselIntervalSec)||3,idle:Number(t.idleTimeoutSec)||60},legacyId:id},context,now);next.legacyIds.push(id);
  }return next;
}
/** Reject DST gaps and repeated wall-clock times rather than silently shifting a schedule. */
export function wallTimeToEpoch(value:string,timeZone:string):number {
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))fail('请填写完整日期与时间');const nums=value.split(/[-T:]/).map(Number),wall=Date.UTC(nums[0],nums[1]-1,nums[2],nums[3],nums[4]);
  const formatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const parts=(time:number)=>Object.fromEntries(formatter.formatToParts(time).filter(p=>p.type!=='literal').map(p=>[p.type,+p.value]));
  const offsets=new Set<number>();for(const h of [-36,-12,0,12,36]){const t=wall+h*3600000,p=parts(t);offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute)-t)}
  const matches=[...offsets].map(offset=>wall-offset).filter(t=>{const p=parts(t);return [p.year,p.month,p.day,p.hour,p.minute].every((v,i)=>v===nums[i])});
  if(matches.length!==1)fail(matches.length?'该时区的时间因夏令时重复，请选择其他时间':'日期时间无效，或处于夏令时跳过区间');return matches[0];
}

export function duplicateContent(state:MerchantDisplayState,platform:DisplayPlatform,id:string,context:DisplayContext,now:number):MerchantDisplayState{requireContext(state,context);const content=state.contents.find(c=>c.id===id);if(!content)fail('内容方案不存在');return saveContent(state,platform,{name:(content.name.slice(0,45)+' 副本'),regionId:content.regionId,assets:clone(content.assets),settings:clone(content.settings)},context,now)}
export function deleteContent(state:MerchantDisplayState,platform:DisplayPlatform,id:string,context:DisplayContext,now:number):MerchantDisplayState{requireContext(state,context);if(state.placements.some(p=>p.contentId===id&&p.status==='published'&&!placementIsRevoked(p,platform)&&p.endAt>now))fail('内容存在有效投放，请先下架关联投放');const next=clone(state);next.contents=next.contents.filter(c=>c.id!==id);next.placements=next.placements.filter(p=>p.contentId!==id||p.status!=='draft');return next}

export function setPlacementTargetEnabled(state:MerchantDisplayState,platform:DisplayPlatform,id:string,storeId:string,terminal:string,enabled:boolean,context:DisplayContext,now:number):MerchantDisplayState{requireContext(state,context);const next=clone(state),p=next.placements.find(p=>p.id===id);if(!p||p.status!=='published'||placementIsRevoked(p,platform)||p.endAt<=now)fail('仅有效的已上架投放可以调整门店产线');if(p.storeIds.some(s=>!context.storeIds.includes(s))||!p.storeIds.includes(storeId)||!p.terminals.includes(terminal))fail('无权调整此门店产线');const key=storeId+'|'+terminal;p.disabledTargets=enabled?(p.disabledTargets??[]).filter(k=>k!==key):unique([...(p.disabledTargets??[]),key]);if(enabled&&findPlacementConflict(next,platform,p,now))fail('该门店产线已有同区域重叠投放，无法上架');p.updatedAt=now;return next}
