import {esc} from '../permissions/center-editor';
import { auditComparison, auditDetailShell, auditFields, auditValue, showAuditDetail } from './brand-audit-detail';
import type {MenuChoice} from './brand-menu-choices';
import type {MerchantChangeLogEntry} from './enterprise-merchant-types';
const labels:Record<string,string>={'store.capability.update':'配置门店菜单','brand.menu.update':'修改品牌菜单','org.store.associate':'添加新门店','merchant.create':'创建品牌'};
const modeName=(mode:string)=>({inherit:'继承品牌菜单',independent:'独立配置',add:'独立配置 · 增量开通',replace:'独立配置 · 替换',brand:'品牌菜单'}[mode]??'历史记录未保存');
export function menuChangeKeys(entry:MerchantChangeLogEntry){
 if(entry.menuChange)return {added:entry.menuChange.added,removed:entry.menuChange.removed};
 const match=entry.detail.match(/新增\s+\d+\s+项\s*\[([^\]]*)\][\s\S]*关闭\s+\d+\s+项\s*\[([^\]]*)\]/);
 return match?{added:match[1].split(',').map(k=>k.trim()).filter(Boolean),removed:match[2].split(',').map(k=>k.trim()).filter(Boolean)}:null;
}
export function changeCount(keys:string[],choices:MenuChoice[]):string{
 const map=new Map(choices.map(c=>[c.key,c]));let pages=0,settings=0,directories=0,unknown=0;
 for(const key of new Set(keys)){const c=map.get(key);if(!c)unknown++;else if(c.isPage)pages++;else if(c.kind==='setting')settings++;else directories++;}
 return [[pages,'个页面'],[directories,'个目录/分组'],[settings,'个设置项'],[unknown,'个历史菜单']].filter(([n])=>n).map(([n,t])=>`${n} ${t}`).join('、')||'无';
}
export function bindBrandChangeLog(host:HTMLElement,entries:MerchantChangeLogEntry[],current:MenuChoice[],stores:{storeId:string;name:string;address?:string;postalCode?:string}[],options:{storeView?:boolean}={}):void{
 const groups=new Map<string,MerchantChangeLogEntry[]>();
 for(const e of entries){const key=e.facts?.operationId??e.menuChange?.operationId??e.id;groups.set(key,[...(groups.get(key)??[]),e]);}
 const rows=[...groups.values()].map(row=>row.sort((a,b)=>b.at.localeCompare(a.at))).sort((a,b)=>b[0].at.localeCompare(a[0].at));
 const category=(e:MerchantChangeLogEntry)=>options.storeView&&e.action.startsWith('impersonate.')?'门店代登录':options.storeView&&e.action.startsWith("store.capability")?"门店菜单":options.storeView&&e.action.startsWith("org.store.")?"门店归属":e.facts?.category??(e.action.startsWith('store.')||e.action.startsWith('org.store.')?'品牌门店':e.action==='brand.menu.update'?'品牌菜单':'其他');
 const title=(e:MerchantChangeLogEntry)=>e.facts?.title??labels[e.action]??(e.action.startsWith('access:')?e.action.slice(7):'品牌信息变更');
 const target=(e:MerchantChangeLogEntry)=>e.facts?.target??(e.storeId?`${e.menuChange?.storeName??stores.find(s=>s.storeId===e.storeId)?.name??'历史门店'} · ${e.storeId}`:'品牌');
 const fieldSummary=(e:MerchantChangeLogEntry)=>e.facts?.fields.filter(f=>f.before!==f.after).map(f=>`${f.name}：${f.before} → ${f.after}`).join('；');
 const summary=(row:MerchantChangeLogEntry[])=>{
  const e=row[0],diff=menuChangeKeys(e);
  if(row.length>1){if(diff&&!row.some(v=>{const k=menuChangeKeys(v);return k&&(k.added.length||k.removed.length);}))return `${row.length} 家门店，配置方式已调整；菜单范围不变`;if(diff)return `${row.length} 家门店；新增菜单 ${row.filter(v=>menuChangeKeys(v)?.added.length).length} 家，关闭菜单 ${row.filter(v=>menuChangeKeys(v)?.removed.length).length} 家；详情逐店核对`;return `${row.length} 家门店${e.action==='org.store.associate'?'关联到品牌，默认继承品牌菜单':'发生变更'}`;}
  if(!diff){if(e.facts?.title==='重设管理员密码')return '已重设密码，旧密码失效';if(e.facts?.title==='开通管理员')return '已开通并启用品牌管理员';return fieldSummary(e)||e.detail;}
  const c=e.menuChange?.choices??current,mode=e.facts?.fields.find(f=>f.name==='配置方式');
  const modeText=mode&&mode.before!==mode.after?`${mode.before} → ${mode.after}；`:'';
  const impact=e.facts?.fields.filter(f=>f.name.startsWith('门店影响')).length??0;
  return modeText+(diff.added.length||diff.removed.length?`${diff.added.length?'新增 '+changeCount(diff.added,c):'未新增菜单'}；${diff.removed.length?'关闭 '+changeCount(diff.removed,c):'未关闭菜单'}`:'菜单范围不变')+(impact?`；影响 ${impact} 家门店`:'');
 };
 const brandDetail=!!host.closest('[data-brand-detail-tab]');
 const operators=[...new Set(rows.map(row=>row[0].operatorEmail).filter(Boolean))].sort();
 host.innerHTML=`<header class="ba-head ba-log-filters">${brandDetail?"":"<h2>变更记录</h2>"}<label class="ba-field">变更类型<select data-log-category><option value="">${brandDetail?'变更类型':'全部类型'}</option>${(options.storeView?['门店菜单','门店归属','门店代登录','其他']:['品牌门店','品牌菜单','品牌管理员','品牌服务','其他']).map(c=>`<option>${c}</option>`).join('')}</select></label>${brandDetail?`<label class="ba-field">操作人<select data-log-operator><option value="">操作人</option>${operators.map(operator=>`<option>${esc(operator)}</option>`).join('')}</select></label><button type="button" class="ba-btn" data-log-reset>重置</button>`:''}</header><div class="ba-table-wrap ba-change-list"><table><thead><tr><th>时间</th><th>操作人</th><th>类型</th><th>操作</th><th>涉及对象</th><th>变更摘要</th><th>操作</th></tr></thead><tbody>${rows.map((row,i)=>{const e=row[0],text=summary(row);return `<tr data-change-row data-change-category="${esc(category(e))}" data-change-operator="${esc(e.operatorEmail)}"><td>${esc(new Date(e.at).toLocaleString('zh-CN'))}</td><td>${esc(e.operatorEmail)}${e.id.startsWith('demo-brand-change-')?' <span class="ba-tag">演示</span>':''}</td><td><span class="ba-log-category">${esc(category(e))}</span></td><td>${esc(title(e))}</td><td>${row.length>1?`${row.length} 家门店`:esc(target(e))}</td><td>${esc(text.length>180?text.slice(0,180)+'…':text)}</td><td><button type="button" class="ba-btn" data-change-detail="${i}">查看详情</button></td></tr>`;}).join('')}<tr data-log-empty ${rows.length?'hidden':''}><td colspan="7" class="ba-empty">暂无变更记录</td></tr></tbody></table></div>`;
 const categoryFilter=host.querySelector<HTMLSelectElement>('[data-log-category]')!;
 const operatorFilter=host.querySelector<HTMLSelectElement>('[data-log-operator]');
 const applyFilters=()=>{
  const changes=[...host.querySelectorAll<HTMLElement>('[data-change-row]')];
  changes.forEach(row=>{
   row.hidden=(!!categoryFilter.value&&row.dataset.changeCategory!==categoryFilter.value)
    || (!!operatorFilter?.value&&row.dataset.changeOperator!==operatorFilter.value);
  });
  const empty=host.querySelector<HTMLElement>('[data-log-empty]')!;
  empty.hidden=changes.some(row=>!row.hidden);
  empty.querySelector('td')!.textContent=rows.length?'没有符合条件的变更记录':'暂无变更记录';
 };
 categoryFilter.onchange=applyFilters;
 operatorFilter?.addEventListener('change',applyFilters);
 host.querySelector('[data-log-reset]')?.addEventListener('click',()=>{
  categoryFilter.value='';
  if(operatorFilter)operatorFilter.value='';
  applyFilters();
 });
 host.querySelectorAll<HTMLButtonElement>('[data-change-detail]').forEach(button=>button.onclick=()=>{
  const row=rows[Number(button.dataset.changeDetail)], first=row[0];
  const dialog=document.createElement('dialog');
  dialog.className='ba-change-detail brand-log-modal';
  const storeName=(entry: MerchantChangeLogEntry) => entry.menuChange?.storeName
   ?? (entry.facts?.target.endsWith(' · '+entry.storeId) ? entry.facts.target.slice(0,-(' · '+entry.storeId).length) : undefined)
   ?? stores.find(store=>store.storeId===entry.storeId)?.name ?? target(entry);
  const storeInfo=(entry: MerchantChangeLogEntry) => {
   const store=stores.find(item=>item.storeId===entry.storeId);
   return `<strong>${esc(storeName(entry))}</strong><small>${esc(entry.storeId??'')}</small><small>地址 ${esc(store?.address?.trim()||'—')} · 邮编 ${esc(store?.postalCode?.trim()||'—')}</small>`;
  };
  const storeList=(entries: MerchantChangeLogEntry[]) => entries.length
   ? `<strong class="brand-audit-object">本次涉及 ${entries.length} 家门店</strong><ul class="brand-audit-stores">${entries.map(entry=>`<li>${storeInfo(entry)}</li>`).join('')}</ul>`
   : '<p class="ba-muted">本次涉及的门店未归属该品牌</p>';
  const membership=first.action==='org.store.associate'||first.action==='org.store.remove';
  const selection=row.length>1 ? `<label class="ba-field">切换门店<select data-log-store>${row.map((entry,i)=>`<option value="${i}">${esc(target(entry))}</option>`).join('')}</select></label>` : '';
  const operation=first.action==='org.store.associate'?'添加新门店':title(first);
  dialog.innerHTML=auditDetailShell(first.operatorEmail,first.at,row.length>1?`${operation} · ${row.length} 家门店`:operation,`
   ${membership ? auditComparison(storeList(first.action==='org.store.remove'?row:[]),storeList(first.action==='org.store.associate'?row:[])) : ''}
   ${row.length>1||first.storeId ? `<div class="brand-audit-scope"><div data-log-target></div>${selection}</div>` : ''}
   <div data-log-fields></div><div data-log-tree></div>`);
  const render=(index: number)=>{
   const entry=row[index], diff=menuChangeKeys(entry);
   const fields=entry.facts?.fields??[];
   const object=`<strong class="brand-audit-object">${esc(entry.storeId ? storeName(entry) : target(entry))}</strong>`;
   const selected=dialog.querySelector('[data-log-target]');
   if(selected&&entry.storeId)selected.innerHTML=storeInfo(entry);
   dialog.querySelector('[data-log-fields]')!.innerHTML=fields.length
    ? auditComparison(object+auditFields(fields.map(f=>[f.name,f.before])),object+auditFields(fields.map(f=>[f.name,f.after])))
    : diff ? (!entry.storeId ? object : '') : `${object}<p class="ba-muted">该历史记录仅保留操作摘要，未保存字段前后值。</p><p>${esc(entry.detail)}</p>`;
   const menus=dialog.querySelector('[data-log-tree]')!;
   if(!diff){menus.innerHTML='';return;}
   const choices=new Map((entry.menuChange?.choices??current).map(choice=>[choice.key,choice]));
   const label=(key: string)=>{
    const chain:string[]=[];
    const seen=new Set<string>();
    for(let choice=choices.get(key);choice&&!seen.has(choice.key);choice=choice.parent?choices.get(choice.parent):undefined){
     chain.unshift(choice.title);seen.add(choice.key);
    }
    return chain.join(' / ') || `历史菜单（${key}）`;
   };
   const added=new Set(diff.added),removed=new Set(diff.removed);
   const changes=[...new Set([...added,...removed])].filter(key=>added.has(key)!==removed.has(key));
   menus.innerHTML=`${entry.menuChange?'':'<p class="ba-muted">历史菜单名称与层级按当前路由识别。</p>'}
    ${changes.length ? `<div class="ba-table-wrap"><table class="brand-audit-menu-table"><thead><tr><th scope="col">变更菜单</th><th scope="col">原值</th><th scope="col">新值</th></tr></thead><tbody>
     ${changes.map(key=>`<tr><td>${esc(label(key))}</td><td>${auditValue(added.has(key)?'未开通':'已开通',true)}</td><td>${auditValue(added.has(key)?'已开通':'未开通',true)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="ba-muted">菜单范围无变更</p>'}`;
  };
  dialog.querySelector<HTMLSelectElement>('[data-log-store]')?.addEventListener('change',event=>render(Number((event.target as HTMLSelectElement).value)));
  render(0);
  showAuditDetail(dialog,button);
 });
}
