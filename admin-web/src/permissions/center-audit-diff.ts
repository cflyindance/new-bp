import type { Audit, CenterState, Resource, Store } from './center-domain';

interface Context { state:CenterState; stores:Store[]; brands:{id:string;name:string}[]; resources:Map<string,Resource> }
interface Item { key:string; text:string }
interface Row { group:string; label:string; before:Item[]; after:Item[] }
const labels:Record<string,string>={name:'姓名',email:'登录邮箱',status:'账号状态',description:'角色描述',system:'系统角色',migrationReview:'旧授权待复核',roleId:'角色',mode:'授权范围类型',id:'对象编号',bindings:'角色授权',overrides:'个人例外',grants:'功能权限'};
const statuses:Record<string,string>={unopened:'未开通',pending:'待接受邀请',revoked:'邀请已撤销',enabled:'已启用',disabled:'已停用',hidden:'不可见／未授权',read:'可查看',edit:'可编辑',inherit:'继承',stores:'指定门店',brands:'动态品牌',regions:'动态区域'};
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const object=(v:unknown):Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const items=(v:unknown,translate=false):Item[]=>v===undefined||v===null||v===''?[]:[{key:JSON.stringify(v),text:typeof v==='boolean'?(v?'是':'否'):typeof v==='string'?(translate?(statuses[v]??v):v):JSON.stringify(v)}];
const missing=(id:string)=>`名称不可用（${id}）`;
export function renderAuditDiff(log:Audit,ctx:Context):string {
  let before:unknown,after:unknown;
  try {before=log.before?JSON.parse(log.before):null;after=log.after?JSON.parse(log.after):null;} catch {
    return `<p class="pc-notice">此历史记录无法解析，暂不能生成变更对照。</p><details><summary>查看原始记录</summary><h3>变更前</h3><pre class="pc-log-json">${escape(log.before)}</pre><h3>变更后</h3><pre class="pc-log-json">${escape(log.after)}</pre></details>`;
  }
  if((before!==null&&typeof before!=='object')||(after!==null&&typeof after!=='object')||Array.isArray(before)||Array.isArray(after))return '<p class="pc-notice">此历史记录不是角色或员工对象，无法生成业务变更对照。</p>';
  const a=object(before),b=object(after),rows:Row[]=[];
  const isRole='grants' in a||'grants' in b;
  const roleName=(id:string)=>ctx.state.roles.find(r=>r.id===id)?.name??missing(id);
  const resourceName=(key:string):string=>{
    const parts:string[]=[],seen=new Set<string>();let r=ctx.resources.get(key);
    if(!r)return missing(key);
    while(r&&!seen.has(r.key)){seen.add(r.key);if(parts[0]!==r.title)parts.unshift(r.title);r=r.parent?ctx.resources.get(r.parent):undefined;}
    return parts.join(' → ');
  };
  const add=(group:string,label:string,left:Item[],right:Item[])=>{
    if(left.length===right.length&&left.every(x=>right.some(y=>x.key===y.key)))return;
    rows.push({group,label,before:left,after:right});
  };
  const scalar=(group:string,label:string,left:unknown,right:unknown,translate=false)=>add(group,label,items(left,translate),items(right,translate));
  const scopeItems=(scope:Record<string,unknown>):Item[]=>Array.isArray(scope.ids)?scope.ids.map(id=>{
    const value=String(id),mode=scope.mode;
    const text=mode==='stores'?ctx.stores.find(s=>s.id===value)?.title:mode==='brands'?ctx.brands.find(b=>b.id===value)?.name:mode==='regions'?value:undefined;
    return {key:`${String(mode)}:${value}`,text:text??missing(value)};
  }):[];
  const grants=(left:Record<string,unknown>,right:Record<string,unknown>,group:string,prefix='')=>{
    for(const key of new Set([...Object.keys(left),...Object.keys(right)]))scalar(group,prefix+resourceName(key),left[key],right[key],true);
  };
  for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
    if(key==='id')continue;
    if(key==='bindings'){
      const left=Array.isArray(a.bindings)?a.bindings.map(object):[],right=Array.isArray(b.bindings)?b.bindings.map(object):[];
      for(const id of new Set([...left,...right].map(x=>x.id))){
        const old=left.find(x=>x.id===id),next=right.find(x=>x.id===id),name=roleName(String((next??old)?.roleId??''));
        if(!old||!next){
          const binding=next??old!;const scope=object(binding.scope);
          add('角色授权',name+' → 角色分配',old?[{key:'assigned',text:'已分配'}]:[],next?[{key:'assigned',text:'已分配'}]:[]);
          scalar('角色授权',name+' → 授权范围类型',old?object(old.scope).mode:undefined,next?scope.mode:undefined,true);
          add('角色授权',name+' → 授权范围',old?scopeItems(object(old.scope)):[],next?scopeItems(scope):[]);
        }else{
          if(old.roleId!==next.roleId)add('角色授权',name+' → 角色',[{key:String(old.roleId),text:roleName(String(old.roleId))}],[{key:String(next.roleId),text:name}]);
          const x=object(old.scope),y=object(next.scope);
          scalar('角色授权',name+' → 授权范围类型',x.mode,y.mode,true);
          add('角色授权',name+' → 授权范围',scopeItems(x),scopeItems(y));
        }
      }
    }else if(key==='grants')grants(object(a[key]),object(b[key]),'功能权限');
    else if(key==='overrides'){
      const left=object(a[key]),right=object(b[key]);
      for(const id of new Set([...Object.keys(left),...Object.keys(right)]))grants(object(left[id]),object(right[id]),'个人例外',(ctx.stores.find(s=>s.id===id)?.title??missing(id))+' → ');
    }else scalar(isRole?'角色资料':'账号资料',key==='name'&&isRole?'角色名称':labels[key]??`其他字段（${key}）`,a[key],b[key],key==='status');
  }
  const name=String(b.name??a.name??ctx.state.employees.find(e=>e.id===log.objectId)?.name??ctx.state.roles.find(r=>r.id===log.objectId)?.name??missing(log.objectId));
  const cell=(values:Item[],other:Item[],kind:'added'|'removed')=>values.length?`<ul class="pc-audit-values">${values.map(v=>{const changed=!other.some(x=>x.key===v.key);return `<li${changed?` class="pc-audit-${kind}"`:''}>${escape(v.text)}${changed?` <span class="pc-audit-badge">${kind==='added'?'新增':'移除'}</span>`:''}</li>`;}).join('')}</ul>`:'<span class="pc-muted">无</span>';
  return `<p class="pc-audit-object">${isRole?'角色':'员工'}：<strong>${escape(name)}</strong></p>${rows.length?'':'<p class="pc-empty">未发现字段变化</p>'}${[...new Set(rows.map(r=>r.group))].map(group=>`<section class="pc-audit-group"><h3>${group}</h3><table><thead><tr><th>变更项目</th><th>变更前</th><th>变更后</th></tr></thead><tbody>${rows.filter(r=>r.group===group).map(r=>`<tr><th scope="row">${escape(r.label)}</th><td>${cell(r.before,r.after,'removed')}</td><td>${cell(r.after,r.before,'added')}</td></tr>`).join('')}</tbody></table></section>`).join('')}`;
}
