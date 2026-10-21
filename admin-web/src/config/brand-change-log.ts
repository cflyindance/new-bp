import {esc} from '../permissions/center-editor';
import {bindOpenedBrandMenuTree} from './brand-menu-read-tree';
import type {MenuChoice} from './brand-menu-choices';
import type {MerchantChangeLogEntry} from './enterprise-merchant-types';
const labels:Record<string,string>={'store.capability.update':'配置门店菜单','brand.menu.update':'修改品牌菜单','org.store.associate':'关联门店','merchant.create':'创建品牌'};
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
export function bindBrandChangeLog(host:HTMLElement,entries:MerchantChangeLogEntry[],current:MenuChoice[],stores:{storeId:string;name:string}[],options:{storeView?:boolean}={}):void{
 const groups=new Map<string,MerchantChangeLogEntry[]>();
 for(const e of entries){const key=e.facts?.operationId??e.menuChange?.operationId??e.id;groups.set(key,[...(groups.get(key)??[]),e]);}
 const rows=[...groups.values()].map(row=>row.sort((a,b)=>b.at.localeCompare(a.at))).sort((a,b)=>b[0].at.localeCompare(a[0].at));
 const category=(e:MerchantChangeLogEntry)=>options.storeView&&e.action.startsWith("store.capability")?"门店菜单":options.storeView&&e.action.startsWith("org.store.")?"门店归属":e.facts?.category??(e.action.startsWith('store.')||e.action.startsWith('org.store.')?'品牌门店':e.action==='brand.menu.update'?'品牌菜单':'其他');
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
 host.innerHTML=`<header class="ba-head"><h2>变更记录</h2><label class="ba-field">变更类型<select data-log-category><option value="">全部类型</option>${(options.storeView?['门店菜单','门店归属','其他']:['品牌门店','品牌菜单','品牌管理员','品牌服务','其他']).map(c=>`<option>${c}</option>`).join('')}</select></label></header><div class="ba-table-wrap ba-change-list"><table><thead><tr><th>时间</th><th>操作人</th><th>类型</th><th>操作</th><th>涉及对象</th><th>变更摘要</th><th>操作</th></tr></thead><tbody>${rows.map((row,i)=>{const e=row[0],text=summary(row);return `<tr data-change-row data-change-category="${category(e)}"><td>${esc(new Date(e.at).toLocaleString('zh-CN'))}</td><td>${esc(e.operatorEmail)}</td><td>${esc(category(e))}</td><td>${esc(title(e))}</td><td>${row.length>1?`${row.length} 家门店`:esc(target(e))}</td><td>${esc(text.length>180?text.slice(0,180)+'…':text)}</td><td><button type="button" class="ba-btn" data-change-detail="${i}">查看详情</button></td></tr>`;}).join('')}<tr data-log-empty ${rows.length?'hidden':''}><td colspan="7" class="ba-empty">暂无变更记录</td></tr></tbody></table></div>`;
 host.querySelector<HTMLSelectElement>('[data-log-category]')!.onchange=e=>{const value=(e.target as HTMLSelectElement).value;host.querySelectorAll<HTMLElement>('[data-change-row]').forEach(tr=>tr.hidden=!!value&&tr.dataset.changeCategory!==value);host.querySelector<HTMLElement>('[data-log-empty]')!.hidden=!![...host.querySelectorAll<HTMLElement>('[data-change-row]')].find(tr=>!tr.hidden);};
 host.querySelectorAll<HTMLButtonElement>('[data-change-detail]').forEach(button=>button.onclick=()=>{
  const row=rows[Number(button.dataset.changeDetail)],d=document.createElement('dialog');d.className='ba ba-modal ba-change-detail';d.setAttribute('aria-label','变更详情');let index=0,filter:'added'|'removed'='added';
  d.innerHTML=`<div class="ba-dialog-inner"><header class="ba-dialog-header"><h2>变更详情</h2><button type="button" class="ba-btn" data-log-close aria-label="关闭详情">×</button></header><section class="ba-dialog-body"><div data-log-info></div>${row.length>1?`<details><summary>涉及 ${row.length} 家门店</summary><ul>${row.map(e=>`<li>${esc(target(e))}</li>`).join('')}</ul></details><label class="ba-field">查看门店<select data-log-store>${row.map((e,i)=>`<option value="${i}">${esc(target(e))}</option>`).join('')}</select></label>`:''}<p data-log-summary></p><div data-log-fields></div><div class="ba-actions ba-preview-filters"><button class="ba-btn" type="button" data-log-filter="added">新增菜单</button><button class="ba-btn" type="button" data-log-filter="removed">关闭菜单</button></div><div data-log-tree></div><div data-log-unknown></div><details data-log-raw><summary>原始记录（追溯）</summary><p style="overflow-wrap:anywhere" data-log-original></p></details></section><footer class="ba-footer"><button type="button" class="ba-btn" data-log-close>关闭</button></footer></div>`;
  const render=()=>{
   const e=row[index],diff=menuChangeKeys(e),choices=e.menuChange?.choices??current,map=new Set(choices.map(c=>c.key));
   const source=e.facts?.source??e.menuChange?.source??(e.detail.startsWith('M 平台')?'M 平台运营':e.detail.startsWith('品牌 Admin')?'品牌 Admin':'历史记录未保存');
   d.querySelector('[data-log-info]')!.innerHTML=`<dl class="ba-log-info"><dt>时间</dt><dd>${esc(new Date(e.at).toLocaleString('zh-CN'))}</dd><dt>操作人</dt><dd>${esc(e.operatorEmail)}</dd><dt>来源</dt><dd>${esc(source)}</dd><dt>变更类型</dt><dd>${esc(category(e)+' · '+title(e))}</dd><dt>涉及对象</dt><dd>${esc(target(e))}</dd>${e.action==='store.capability.update'?`<dt>配置方式</dt><dd>${e.menuChange?esc(modeName(e.menuChange.beforeMode)+' → '+modeName(e.menuChange.mode)):'历史记录未保存'}</dd>`:''}</dl>`;
   d.querySelector('[data-log-summary]')!.textContent=summary([e]);d.querySelector('[data-log-original]')!.textContent=e.detail;
   const fields=e.facts?.fields??[];d.querySelector('[data-log-fields]')!.innerHTML=fields.length?`<h3>变更前后</h3><div class="ba-table-wrap"><table><thead><tr><th>字段</th><th>变更前</th><th>变更后</th></tr></thead><tbody>${fields.map(f=>`<tr><td>${esc(f.name)}</td><td>${esc(f.before)}</td><td>${esc(f.after)}</td></tr>`).join('')}</tbody></table></div>`:!diff?'<p class="ba-muted">该历史记录仅保留操作摘要，未保存字段前后值。</p>':'';
   d.querySelectorAll<HTMLButtonElement>('[data-log-filter]').forEach(b=>{b.hidden=!diff;b.setAttribute('aria-pressed',String(b.dataset.logFilter===filter));});
   const tree=d.querySelector<HTMLElement>('[data-log-tree]')!;d.querySelector('[data-log-unknown]')!.innerHTML='';
   if(diff){const keys=diff[filter];bindOpenedBrandMenuTree(tree,choices,new Set(keys.filter(k=>map.has(k))),{emptyText:filter==='added'?'没有新增菜单':'没有关闭菜单'});const unknown=keys.filter(k=>!map.has(k));d.querySelector('[data-log-unknown]')!.innerHTML=unknown.length?`<h3>历史菜单（无法识别名称）</h3><ul>${unknown.map(k=>`<li>${esc(k)}</li>`).join('')}</ul>`:'';}else tree.innerHTML='';
   if(!e.menuChange&&diff){const note=document.createElement('p');note.className='ba-muted';note.textContent='历史菜单名称与层级按当前路由识别，原始记录保留供追溯。';tree.prepend(note);}
  };
  d.querySelector<HTMLSelectElement>('[data-log-store]')?.addEventListener('change',e=>{index=Number((e.target as HTMLSelectElement).value);render();});d.querySelectorAll<HTMLButtonElement>('[data-log-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.logFilter as typeof filter;render();});d.querySelectorAll('[data-log-close]').forEach(b=>b.addEventListener('click',()=>d.close()));d.addEventListener('close',()=>{d.remove();button.focus();},{once:true});document.body.append(d);render();d.showModal();
 });
}
