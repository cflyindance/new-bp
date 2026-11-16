export type OperationScope = 'menu' | 'registry';
export interface OperationEntry {
 id:string; batchId:string; time:string; scope:OperationScope; action:string; actor:string;
 stage:string; result:'success'|'failure'; reason:string; before:unknown; after:unknown;
 objects:Array<{id:string;name:string;path:string;kind:string}>;
 changes:Array<{field:string;before:unknown;after:unknown}>;
 persistent:boolean;
}
export interface LogStorage {getItem(key:string):string|null;setItem(key:string,value:string):void}
export const OPERATION_LOG_KEY='menusifu:menu-registry-operation-log:v1';
let session:OperationEntry[]=[];
let actorProvider=()=> '未知本地账号';
export function setOperationActor(provider:()=>string):void {actorProvider=provider;}
export function redactOperationValue(value:unknown,key=''):unknown {
 if(/password|passwd|secret|token|authorization|cookie|credential/i.test(key))return '[已隐藏]';
 if(typeof value==='string') {
  if(!/^https?:\/\//i.test(value)&&/https?:\/\//i.test(value))return value.replace(/https?:\/\/[^\s"<>]+/gi,url=>String(redactOperationValue(url,'url')));
  if(/^https?:\/\//i.test(value)){try{const url=new URL(value);url.username='';url.password='';url.search='';url.hash='';return url.toString();}catch{return '[无效 URL]';}}
  if(/url|path|route/i.test(key))return value.split(/[?#]/)[0];
  return value;
 }
 if(Array.isArray(value))return value.map(v=>redactOperationValue(v,key));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redactOperationValue(v,k)]));
 return value??null;
}
export function operationChanges(before:unknown,after:unknown,prefix=''):OperationEntry['changes'] {
 if(JSON.stringify(before)===JSON.stringify(after))return [];
 if(Array.isArray(before)&&Array.isArray(after)&&[...before,...after].every(v=>v&&typeof v==='object'&&typeof v.id==='string')) {
  const old=new Map(before.map(v=>[v.id,v])),next=new Map(after.map(v=>[v.id,v]));
  const diff=[...new Set([...old.keys(),...next.keys()])].flatMap(id=>operationChanges(old.get(id),next.get(id),`${prefix}[${id}]`));
  if(JSON.stringify([...old.keys()])!==JSON.stringify([...next.keys()]))diff.push({field:`${prefix}.顺序`,before:[...old.keys()],after:[...next.keys()]});return diff;
 }
 if(before&&after&&typeof before==='object'&&typeof after==='object'&&!Array.isArray(before)&&!Array.isArray(after))return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(k=>operationChanges((before as Record<string,unknown>)[k],(after as Record<string,unknown>)[k],prefix?`${prefix}.${k}`:k));
 return [{field:prefix||'配置',before:before??null,after:after??null}];
}
export function operationObjects(snapshot:unknown):OperationEntry['objects'] {
 if(!snapshot||typeof snapshot!=='object')return [];
 const root=snapshot as Record<string,unknown>,out:OperationEntry['objects']=[];
 if(Array.isArray(root.menu)){
  const walk=(nodes:Array<Record<string,unknown>>,parent:string[])=>{nodes.forEach((n,index)=>{const name=String(n.name??n.key??'未命名菜单');const path=[...parent,name];out.push({id:String(n.id??n.key??path.join('/')),name,path:path.join(' / '),kind:'菜单'});if(Array.isArray(n.children))walk(n.children,path);});};walk(root.menu,[]);
 } else {
  const projects=(root.projects??[]) as Array<Record<string,unknown>>;
  const dirs=(root.directories??[]) as Array<Record<string,unknown>>;
  const pages=(root.pages??[]) as Array<Record<string,unknown>>;
  const assignments=(root.assignments??[]) as Array<Record<string,unknown>>;
  const dirPath=(id:unknown)=>{const path:string[]=[];const seen=new Set();let d=dirs.find(d=>d.id===id);while(d&&!seen.has(d.id)){seen.add(d.id);path.unshift(String(d.name));d=dirs.find(p=>p.id===d!.parentId);}return path;};
  for(const p of projects)out.push({id:String(p.id),name:String(p.name),path:String(p.name),kind:'项目'});
  for(const d of dirs)out.push({id:String(d.id),name:String(d.name),path:[projects.find(p=>p.id===d.projectId)?.name,...dirPath(d.id)].filter(Boolean).join(' / '),kind:'目录'});
  for(const p of pages){const a=assignments.find(a=>a.pageId===p.id);out.push({id:String(p.id),name:String(p.title),path:[projects.find(p=>p.id===a?.projectId)?.name,...dirPath(a?.directoryId),p.title].filter(Boolean).join(' / '),kind:'页面'});}
 }
 return out;
}
function getStorage():LogStorage {return localStorage;}
export function readOperationLog(target?:LogStorage):{entries:OperationEntry[];error?:string} {
 try{const raw=(target??getStorage()).getItem(OPERATION_LOG_KEY);let entries:OperationEntry[]=[];if(raw!==null){const payload=JSON.parse(raw);if(payload.version!==1||!Array.isArray(payload.entries)||payload.entries.some((e:OperationEntry)=>!e.id||!Number.isFinite(Date.parse(e.time))||typeof e.actor!=='string'||typeof e.action!=='string'||typeof e.stage!=='string'||typeof e.reason!=='string'||!['menu','registry'].includes(e.scope)||!Array.isArray(e.changes)||!Array.isArray(e.objects)||!['success','failure'].includes(e.result)))throw Error();entries=payload.entries;}const map=new Map(entries.map(e=>[e.id,{...e,persistent:true}]));session.forEach(e=>{if(!map.has(e.id))map.set(e.id,e);});return {entries:[...map.values()].sort((a,b)=>b.time.localeCompare(a.time))};}catch{return {entries:[...session],error:'本地操作记录无法读取，原数据已保留；禁止覆盖异常记录。'};}
}
export function appendOperation(input:{scope:OperationScope;action:string;stage:string;before:unknown;after:unknown;result?:'success'|'failure';reason?:string;force?:boolean},target?:LogStorage):OperationEntry|null {
 const before=redactOperationValue(input.before),after=redactOperationValue(input.after),changes=operationChanges(before,after);
 if(!changes.length&&!input.force&&input.result!=='failure')return null;
 const id=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;
 let actor='未知本地账号';try{actor=actorProvider()||actor;}catch{}
 const oldObjects=operationObjects(before),newObjects=operationObjects(after);
 const lookup=(snapshot:unknown,id:string):unknown=>{if(!snapshot||typeof snapshot!=='object')return undefined;if(Array.isArray(snapshot)){for(const item of snapshot){const found=lookup(item,id);if(found!==undefined)return found;}return undefined;}const record=snapshot as Record<string,unknown>;if(record.id===id)return record;for(const value of Object.values(record)){const found=lookup(value,id);if(found!==undefined)return found;}return undefined;};
 const candidates=[...new Map([...oldObjects,...newObjects].map(o=>[o.id,o])).values()];
 const touched=candidates.filter(o=>JSON.stringify(lookup(before,o.id))!==JSON.stringify(lookup(after,o.id))||oldObjects.find(p=>p.id===o.id)?.path!==newObjects.find(p=>p.id===o.id)?.path);
 const objects=touched.length?touched:candidates;
 const entry:OperationEntry={id,batchId:id,time:new Date().toISOString(),scope:input.scope,action:input.action,stage:input.stage,actor,result:input.result??'success',reason:String(redactOperationValue(input.reason??'','reason')),before,after,objects,changes,persistent:false};
 const state=readOperationLog(target);try{if(state.error)throw Error(state.error);const entries=[...state.entries.filter(e=>e.id!==id),{...entry,persistent:true}];(target??getStorage()).setItem(OPERATION_LOG_KEY,JSON.stringify({version:1,entries}));entry.persistent=true;session=session.filter(e=>!entries.some(p=>p.id===e.id));}catch{session.push(entry);if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('menusifu:operation-log-warning',{detail:'业务结果不变，但操作记录保存失败；本次记录仅在当前会话可见，刷新会丢失。'}));}
 return entry;
}
export function resetOperationLogSessionForTest():void {session=[];}
