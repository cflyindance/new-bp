/** Shared contract for M-platform slot configuration and native advertising pages. */
export const CHANNELS = ['Kiosk','eMenu','CDS','OO','SDI','取餐屏','Waitlist'] as const;
export const PLATFORM_KEY = 'menusifu:display-regions:v1';
export type Kind = 'image'|'video';
export interface AdSpec {
  id:string; name:string; width:number; height:number; applicability:string;
  mediaKinds:Kind[]; imageFormats:string[]; videoFormats:string[];
  imageMaxMB:number; videoMaxMB:number; videoMaxSeconds:number;
  maxImages:number; maxVideos:number; sizeMode:'recommend'|'strict'; fit:'contain'|'cover';
}
export interface SlotRevision {version:number;specs:AdSpec[]}
export interface AdSlot {
  id:string; name:string; code:string; productLine?:string; scene:string; description:string;
  enabled:boolean; builtin:boolean; ratio:string; mediaKinds:Kind[]; maxItems:number;
  parameters:string[]; bindings:Record<string,{minimumVersion:string;mediaKinds:Kind[]}>;
  generation:number; specs?:AdSpec[]; specVersion?:number; specHistory?:SlotRevision[];
}
export interface SlotSnapshot {id:string;name:string;code:string;productLine:string;version:number;specs:AdSpec[]}
const canonical=(value:unknown):string=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((out,key)=>({...out,[key]:v[key]}),{}):v);
const copy=<T>(x:T):T=>structuredClone(x);
function fail(text:string):never {throw Error(text)}
export function newSpec(id='portrait',width=1080,height=1920):AdSpec {
  return {id,name:height>width?'竖版':'横版',width,height,applicability:height>width?'竖屏标准版式':'横屏标准版式',mediaKinds:['image','video'],imageFormats:['image/jpeg','image/png','image/gif','image/webp'],videoFormats:['video/mp4','video/webm'],imageMaxMB:5,videoMaxMB:20,videoMaxSeconds:120,maxImages:5,maxVideos:1,sizeMode:'recommend',fit:'contain'};
}
export function ratio(spec:Pick<AdSpec,'width'|'height'>):string {let a=spec.width,b=spec.height;while(b){const r=a%b;a=b;b=r}return `${spec.width/a}:${spec.height/a}`}
export function validateSpecs(specs:AdSpec[]):void {
  if(!Array.isArray(specs)||!specs.length||specs.length>12)fail('请配置1～12套素材规格');
  const ids=new Set<string>(),conditions=new Set<string>();
  for(const s of specs){
    if(!/^[a-z][a-z0-9_-]{0,39}$/.test(s.id)||ids.has(s.id))fail('规格编码须为唯一的小写字母、数字、下划线或短横线');ids.add(s.id);
    if(!s.name.trim()||s.name.length>30||!s.applicability.trim()||s.applicability.length>80)fail('规格名称与适用版式／设备必填，分别最多30／80字');
    const condition=s.applicability.trim().toLowerCase();if(conditions.has(condition))fail('同一位置的适用版式／设备不得重复');conditions.add(condition);
    if(!Number.isInteger(s.width)||!Number.isInteger(s.height)||Math.min(s.width,s.height)<1||Math.max(s.width,s.height)>16384)fail('素材宽高须为1～16384的整数');
    if(!s.mediaKinds.length||s.mediaKinds.some(k=>!['image','video'].includes(k)))fail('每套规格至少支持图片或视频');
    if(!['recommend','strict'].includes(s.sizeMode)||!['contain','cover'].includes(s.fit))fail('尺寸校验或展示方式无效');
    if(s.mediaKinds.includes('image')&&(!s.imageFormats.length||s.imageFormats.some(f=>!['image/jpeg','image/png','image/gif','image/webp'].includes(f))))fail('请选择有效图片格式');
    if(s.mediaKinds.includes('video')&&(!s.videoFormats.length||s.videoFormats.some(f=>!['video/mp4','video/webm'].includes(f))))fail('请选择有效视频格式');
    for(const [v,max,label] of [[s.imageMaxMB,100,'图片大小'],[s.videoMaxMB,500,'视频大小'],[s.videoMaxSeconds,3600,'视频时长'],[s.maxImages,20,'图片数量'],[s.maxVideos,1,'视频数量']] as const)if(!Number.isInteger(v)||v<1||v>max)fail(`${label}须为1～${max}的整数`);
  }
}
export function defaults():AdSlot[] {
  return ['screensaver','home'].map((code):AdSlot=>({id:'ad-kiosk-'+code,name:code==='home'?'首页广告':'屏保',code,productLine:'Kiosk',scene:code==='home'?'首页':'待机',description:code==='home'?'Kiosk首页广告区域':'Kiosk无操作时展示，进入退出由终端控制。',enabled:true,builtin:true,ratio:code==='home'?'108:125 / 4:3':'9:16 / 16:9',mediaKinds:['image','video'],maxItems:20,parameters:code==='home'?['interval','transition']:['interval','idle','transition'],bindings:{Kiosk:{minimumVersion:'0.0.0',mediaKinds:['image','video']}},generation:0,specVersion:1,specHistory:[],specs:code==='home'?[newSpec('portrait',1080,1250),newSpec('landscape',1440,1080)]:[newSpec(),newSpec('landscape',1920,1080)]})).concat([{id:'ad-waitlist-screensaver',name:'屏保',code:'screensaver',productLine:'Waitlist',scene:'待机',description:'Waitlist屏保展示区域',enabled:true,builtin:true,ratio:'9:16 / 16:9',mediaKinds:['image','video'],maxItems:20,parameters:['interval','idle','transition'],bindings:{Waitlist:{minimumVersion:'0.0.0',mediaKinds:['image','video']}},generation:0,specVersion:1,specHistory:[],specs:[newSpec(),newSpec('landscape',1920,1080)]}] as AdSlot[]);
}
export function withDefaults<T extends {regions:AdSlot[]}>(platform:T):T {
  const next=copy(platform);for(const slot of defaults())if(!next.regions.some(r=>r.id===slot.id||r.productLine===slot.productLine&&r.code===slot.code))next.regions.push(slot);return next;
}
export function readCatalog(storage:Pick<Storage,'getItem'>):AdSlot[] {
  const raw=storage.getItem(PLATFORM_KEY);if(!raw)return defaults();
  let value;try{value=JSON.parse(raw)}catch{fail('广告位配置无法读取，请联系平台管理员')}
  if(!value||value.schema!==1||!Number.isInteger(value.revision)||!Array.isArray(value.regions))fail('广告位配置版本无效，请联系平台管理员');
  return withDefaults(value).regions;
}
export function available(slots:AdSlot[],line:string):AdSlot[]{return slots.filter(s=>s.enabled&&s.productLine===line&&s.bindings[line]&&s.specs?.length)}
export function snapshot(slot:AdSlot):SlotSnapshot {if(!slot.productLine||!slot.specs?.length)fail('广告位尚未配置产线与规格');return {id:slot.id,name:slot.name,code:slot.code,productLine:slot.productLine,version:slot.specVersion??1,specs:copy(slot.specs)}}
export function validateSnapshot(slots:AdSlot[],value:SlotSnapshot):AdSlot {
  const slot=slots.find(s=>s.id===value?.id);if(!slot||!slot.enabled||slot.productLine!==value.productLine||slot.code!==value.code||!slot.bindings[value.productLine])fail('广告位不可用或尚未接入，请返回选择渠道与广告位');
  const revision=(slot.specVersion??1)===value.version?slot.specs:slot.specHistory?.find(v=>v.version===value.version)?.specs;
  if(!revision||canonical(revision)!==canonical(value.specs))fail('广告位规格版本已变化，请返回编辑页核对');return slot;
}
export function updateContract(existing:AdSlot|undefined,input:AdSlot):AdSlot {
  if(!CHANNELS.includes(input.productLine as typeof CHANNELS[number]))fail('请选择所属产线');
  if(existing?.productLine&&existing.productLine!==input.productLine)fail('所属产线创建后不可修改');
  if(!/^[a-z][a-z0-9._-]{0,63}$/.test(input.code))fail('位置编码须以小写字母开头，最多64位');
  validateSpecs(input.specs??[]);
  if(Object.keys(input.bindings).some(line=>line!==input.productLine))fail('接入产线必须与广告位所属产线一致');
  const next=copy(input);next.specVersion=existing?.specVersion??1;next.specHistory=copy(existing?.specHistory??[]);
  if(existing?.specs&&canonical(existing.specs)!==canonical(next.specs)){
    next.specHistory.push({version:existing.specVersion??1,specs:copy(existing.specs)});next.specVersion=(existing.specVersion??1)+1;
  }
  return next;
}
export interface MediaMetadata {kind:Kind;mime:string;bytes:number;width:number;height:number;duration?:number}
export function validateMedia(spec:AdSpec,media:MediaMetadata):string[] {
  if(!spec.mediaKinds.includes(media.kind))fail(`${spec.name}不支持此素材类型`);
  const formats=media.kind==='image'?spec.imageFormats:spec.videoFormats;
  if(!formats.includes(media.mime))fail(`${spec.name}素材格式不符合要求`);
  if(!Number.isFinite(media.bytes)||media.bytes<=0)fail('素材文件大小无效');
  if(media.bytes>(media.kind==='image'?spec.imageMaxMB:spec.videoMaxMB)*1024*1024)fail(`${spec.name}素材文件超过大小限制`);
  if(!Number.isFinite(media.width)||!Number.isFinite(media.height)||media.width<1||media.height<1)fail('无法读取素材尺寸，请重新上传');
  if(media.kind==='video'&&(!Number.isFinite(media.duration)||media.duration!<=0||media.duration!>spec.videoMaxSeconds))fail(`${spec.name}视频时长不符合要求`);
  const mismatch=media.width!==spec.width||media.height!==spec.height;
  if(mismatch&&spec.sizeMode==='strict')fail(`${spec.name}须为${spec.width}×${spec.height}px`);
  return mismatch?[`${spec.name}建议${spec.width}×${spec.height}px，当前${media.width}×${media.height}px`]:[];
}
export function samePosition(a:{adSlot?:SlotSnapshot;distributePositions?:string[]},b:{adSlot?:SlotSnapshot;distributePositions?:string[]}):boolean {
  if(a.adSlot&&b.adSlot)return a.adSlot.productLine===b.adSlot.productLine&&a.adSlot.id===b.adSlot.id;
  const av=a.adSlot?[a.adSlot.code]:a.distributePositions,bv=b.adSlot?[b.adSlot.code]:b.distributePositions;
  return !av?.length||!bv?.length||av.some(v=>bv.includes(v));
}
