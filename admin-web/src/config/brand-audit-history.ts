import type {BrandChangeFacts} from './brand-audit-types';
/** Recover only facts explicitly present in old redacted account snapshots. */
export function historicalAdminFacts(log:{action:string;before:string;after:string}):BrandChangeFacts|undefined {
 if(!/品牌 Admin|管理员/.test(log.action))return;
 const facts:BrandChangeFacts={category:'品牌管理员',title:log.action,target:'历史记录未保存具体账号',source:'历史记录未保存',fields:[]};
 try{
  const old=JSON.parse(log.before).accounts??[],next=JSON.parse(log.after).accounts??[];
  const changed=next.filter((a:{id:string;name:string;email:string;enabled:boolean})=>{const b=old.find((v:{id:string})=>v.id===a.id);return !b||a.name!==b.name||a.email!==b.email||a.enabled!==b.enabled;});
  if(changed.length===1){const a=changed[0],b=old.find((v:{id:string})=>v.id===a.id);facts.target=`${a.name} · ${a.email}`;
   for(const key of ['name','email','enabled'] as const)if(!b||a[key]!==b[key]){const label={name:'姓名',email:'登录账号',enabled:'账号状态'}[key],value=(v:unknown)=>key==='enabled'?(v?'已启用':'已停用'):String(v);facts.fields.push({name:label,before:b?value(b[key]):'未开通',after:value(a[key])});}
  }
 }catch{/* Missing history stays explicitly unknown. */}
 if(/密码/.test(log.action))facts.fields.push({name:'登录密码',before:'历史记录未保存',after:'已执行重设（不记录密码内容）'});
 return facts;
}
