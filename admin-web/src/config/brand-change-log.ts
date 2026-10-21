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
 const unique=[...new Set(keys)],map=new Map(choices.map(c=>[c.key,c]));let pages=0,settings=0,directories=0,unknown=0;
 for(const key of unique){const c=map.get(key);if(!c)unknown++;else if(c.isPage)pages++;else if(c.kind==='setting')settings++;else directories++;}
 return `${pages} 个页面、${directories} 个目录/分组、${settings} 个设置项${unknown?`、${unknown} 个历史菜单`:''}`;
}
export function bindBrandChangeLog(host:HTMLElement,entries:MerchantChangeLogEntry[],current:MenuChoice[],stores:{storeId:string;name:string}[]):void{
 const groups=new Map<string,MerchantChangeLogEntry[]>();for(const e of entries){const key=e.menuChange?.operationId??e.id;groups.set(key,[...(groups.get(key)??[]),e]);}const rows=[...groups.values()].sort((a,b)=>b[0].at.localeCompare(a[0].at));
 const target=(e:MerchantChangeLogEntry)=>e.storeId?`${e.menuChange?.storeName??stores.find(s=>s.storeId===e.storeId)?.name??'历史门店'} · ${e.storeId}`:'品牌';
 const summary=(row:MerchantChangeLogEntry[],verbose=false)=>{const e=row[0],diff=menuChangeKeys(e);if(row.length>1)return `${row.length} 家门店，查看各店变更明细`;if(!diff)return verbose?e.detail:e.detail.length>120?e.detail.slice(0,120)+'…':e.detail;if(!verbose)return `新增 ${new Set(diff.added).size} 项菜单节点，关闭 ${new Set(diff.removed).size} 项菜单节点`;const c=e.menuChange?.choices??current;return `新增 ${changeCount(diff.added,c)}；关闭 ${changeCount(diff.removed,c)}`;};
 host.innerHTML=`<header class="ba-head"><h2>变更记录</h2></header><div class="ba-table-wrap"><table><thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>涉及对象</th><th>变更摘要</th><th>操作</th></tr></thead><tbody>${rows.map((row,i)=>{const e=row[0];return `<tr data-change-row><td>${esc(new Date(e.at).toLocaleString('zh-CN'))}</td><td>${esc(e.operatorEmail)}</td><td>${esc(labels[e.action]??(e.action.startsWith('access:')?e.action.slice(7):'品牌信息变更'))}</td><td>${row.length>1?`${row.length} 家门店`:esc(target(e))}</td><td>${esc(summary(row))}</td><td><button type="button" class="ba-btn" data-change-detail="${i}">查看详情</button></td></tr>`;}).join('')||'<tr><td colspan="6" class="ba-empty">暂无变更记录</td></tr>'}</tbody></table></div>`;
 host.querySelectorAll<HTMLButtonElement>('[data-change-detail]').forEach(button=>button.onclick=()=>{
 const row=rows[Number(button.dataset.changeDetail)],d=document.createElement('dialog');d.className='ba ba-modal ba-change-detail';d.setAttribute('aria-label','变更详情');let index=0,filter:'added'|'removed'='added';
 d.innerHTML=`<div class="ba-dialog-inner"><header class="ba-dialog-header"><h2>变更详情</h2><button type="button" class="ba-btn" data-log-close aria-label="关闭详情">×</button></header><section class="ba-dialog-body"><div data-log-info></div>${row.length>1?`<details><summary>涉及 ${row.length} 家门店</summary><ul>${row.map(e=>`<li>${esc(target(e))}</li>`).join('')}</ul></details><label class="ba-field">查看门店<select data-log-store>${row.map((e,i)=>`<option value="${i}">${esc(target(e))}</option>`).join('')}</select></label>`:''}<div data-log-summary></div><div class="ba-actions ba-preview-filters"><button class="ba-btn" type="button" data-log-filter="added">新增菜单</button><button class="ba-btn" type="button" data-log-filter="removed">关闭菜单</button></div><div data-log-tree></div><div data-log-unknown></div><details data-log-raw><summary>原始记录（追溯）</summary><p style="overflow-wrap:anywhere" data-log-original></p></details></section><footer class="ba-footer"><button type="button" class="ba-btn" data-log-close>关闭</button></footer></div>`;
 const render=()=>{const e=row[index],diff=menuChangeKeys(e),choices=e.menuChange?.choices??current,map=new Set(choices.map(c=>c.key));
 d.querySelector('[data-log-info]')!.innerHTML=`<dl class="ba-log-info"><dt>时间</dt><dd>${esc(new Date(e.at).toLocaleString('zh-CN'))}</dd><dt>操作人</dt><dd>${esc(e.operatorEmail)}</dd><dt>来源</dt><dd>${esc(e.menuChange?.source??(e.detail.startsWith('M 平台')?'M 平台运营':e.detail.startsWith('品牌 Admin')?'品牌 Admin':'历史记录未保存'))}</dd><dt>涉及对象</dt><dd>${esc(target(e))}</dd><dt>配置方式</dt><dd>${e.menuChange?esc(modeName(e.menuChange.beforeMode)+' → '+modeName(e.menuChange.mode)):'历史记录未保存'}</dd></dl>`;
 d.querySelector('[data-log-summary]')!.textContent=summary([e],true);d.querySelector('[data-log-original]')!.textContent=e.detail;
 d.querySelectorAll<HTMLButtonElement>('[data-log-filter]').forEach(b=>{b.hidden=!diff;b.setAttribute('aria-pressed',String(b.dataset.logFilter===filter));});
 const tree=d.querySelector<HTMLElement>('[data-log-tree]')!;if(diff){const keys=diff[filter];bindOpenedBrandMenuTree(tree,choices,new Set(keys.filter(k=>map.has(k))),{emptyText:filter==='added'?'没有新增菜单':'没有关闭菜单'});const unknown=keys.filter(k=>!map.has(k));d.querySelector('[data-log-unknown]')!.innerHTML=unknown.length?`<h3>历史菜单（无法识别名称）</h3><ul>${unknown.map(k=>`<li>${esc(k)}</li>`).join('')}</ul>`:'';}else{tree.innerHTML='<p class="ba-muted">该历史记录未保存菜单明细，请查看原始记录。</p>';d.querySelector('[data-log-unknown]')!.innerHTML='';}
 if(!e.menuChange&&diff){const note=document.createElement('p');note.className='ba-muted';note.textContent='历史菜单名称与层级按当前路由识别，原始记录保留供追溯。';tree.prepend(note);}
 };
 d.querySelector<HTMLSelectElement>('[data-log-store]')?.addEventListener('change',e=>{index=Number((e.target as HTMLSelectElement).value);render();});d.querySelectorAll<HTMLButtonElement>('[data-log-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.logFilter as typeof filter;render();});
 d.querySelectorAll('[data-log-close]').forEach(b=>b.addEventListener('click',()=>d.close()));d.addEventListener('close',()=>{d.remove();button.focus();},{once:true});document.body.append(d);render();d.showModal();
 });
}
