import {DIMENSIONS,businessTemplateDimensions,readBusinessMenuTemplates,planTemplateSelection,type BusinessMenuTemplate} from './business-menu-template-store';
import {bindOpenedBrandMenuTree} from './brand-menu-read-tree';
import type {MenuChoice} from './brand-menu-choices';
import {readSubscriptionServiceSnapshot} from './subscription-service-store';
import {getPublishedSubscriptionRouteCatalog} from './subscription-published-menu-tree';
import './business-menu-template.css';
import {mCanVisit} from '../permissions/m-platform-runtime';
import {BUSINESS_MENU_TEMPLATE_PATH} from './business-menu-template-scope';
export const templateEsc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function templateDialog(title:string,body:string):HTMLDialogElement{
 const d=document.createElement('dialog');d.className='ba ba-modal ba-store-effective';d.setAttribute('aria-label',title);
 d.innerHTML=`<div class="ba-dialog-inner"><header class="ba-dialog-header"><h2>${templateEsc(title)}</h2><button type="button" class="ba-btn" data-template-close aria-label="关闭">×</button></header><section class="ba-dialog-body">${body}</section><footer class="ba-footer"><button type="button" class="ba-btn" data-template-close>关闭</button></footer></div>`;
 let discard:HTMLDialogElement|undefined;
 const close=()=>{if(d.dataset.templateDirty!=='true'){d.close();return;}if(discard?.open)return;discard=templateDialog('放弃模板修改？','<p>有未保存的修改，是否放弃？</p><button type="button" class="ba-btn ba-primary" data-template-discard>放弃修改</button>');discard.querySelector('[data-template-discard]')!.addEventListener('click',()=>{d.dataset.templateDirty='';discard!.close();d.close();});};
 const originalHash=location.hash;
 const hash=(e:HashChangeEvent)=>{if(d.dataset.templateDirty==='true'&&location.hash!==originalHash){e.stopImmediatePropagation();history.replaceState(null,'',originalHash);close();return;}discard?.close();d.close();};
 const unload=(e:BeforeUnloadEvent)=>{if(d.dataset.templateDirty==='true'){e.preventDefault();e.returnValue='';}};
 d.querySelectorAll('[data-template-close]').forEach(b=>b.addEventListener('click',close));d.addEventListener('cancel',e=>{e.preventDefault();close()});d.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}},true);
 d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 d.addEventListener('close',()=>{d.remove();window.removeEventListener('hashchange',hash,true);window.removeEventListener('beforeunload',unload)},{once:true});document.body.append(d);d.showModal();window.addEventListener('hashchange',hash,true);window.addEventListener('beforeunload',unload);return d;
}
export function templateSourceFor(host:HTMLElement|null):string{return (host?.previousElementSibling as HTMLElement|undefined)?.dataset.templateSource??'';}
function paidNames(keys:string[],choices:MenuChoice[]):string[]{
 const selected=new Set(keys),paths=new Set(choices.filter(c=>selected.has(c.key)&&c.isPage).map(c=>c.path));
 const data=readSubscriptionServiceSnapshot(),catalog=getPublishedSubscriptionRouteCatalog();
 return data.packages.filter(p=>p.commercial?.chargeType==='paid'&&data.releases.find(r=>r.id===p.activeReleaseId)?.routeNodeIds.some(id=>paths.has(catalog.find(n=>n.id===id)?.path))).map(p=>p.name);
}
export function bindBusinessTemplateToolbar(host:HTMLElement,choices:MenuChoice[],read:()=>string[],apply:(keys:string[])=>void,allowed?:Set<string>):()=>void {
 if(host.previousElementSibling?.hasAttribute('data-template-toolbar'))host.previousElementSibling.remove();
 const toolbar=document.createElement('section');toolbar.dataset.templateToolbar='';toolbar.className='ba-card';toolbar.style.marginBottom='12px';
 toolbar.innerHTML=`<h3>按业态模板快捷选择</h3>${location.hash.startsWith('#/m-platform/')&&mCanVisit(BUSINESS_MENU_TEMPLATE_PATH)?`<a href="#${BUSINESS_MENU_TEMPLATE_PATH}" class="ba-btn" data-template-manage-link>管理业态与模板</a>`:''}<p class="ba-muted" style="margin:8px 0">只改变当前待保存选择，可继续手动增减；不自动开通收费服务或试用。</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px">${Object.entries(businessTemplateDimensions()).map(([key,values])=>`<label class="ba-field">${{category:'经营品类',mode:'服务方式',org:'组织模式'}[key as 'category']}<select data-template-filter="${key}"><option value="">全部</option>${Object.entries(values).map(([id,label])=>`<option value="${id}">${templateEsc(label)}</option>`).join('')}</select></label>`).join('')}<label class="ba-field">业态菜单模板<select data-template-choice></select></label></div><div class="ba-actions" style="margin-top:12px"><button type="button" class="ba-btn" data-template-preview>查看模板菜单</button><button type="button" class="ba-btn" data-template-apply="replace">按模板重新选择</button><button type="button" class="ba-btn" data-template-apply="add">仅补充模板菜单</button></div><p class="ba-muted" data-template-summary aria-live="polite" style="margin-top:10px"></p><p class="ba-error" data-template-error role="alert"></p>`;host.before(toolbar);
 let applied:{id:string;name:string;version:number;baseline:string[]}|undefined;
 const summary=toolbar.querySelector<HTMLElement>('[data-template-summary]')!,error=toolbar.querySelector<HTMLElement>('[data-template-error]')!;
 const update=()=>{if(!applied)return;const keys=read(),added=keys.filter(k=>!applied!.baseline.includes(k)).length,removed=applied.baseline.filter(k=>!keys.includes(k)).length;const source=`模板「${applied.name}」v${applied.version} [${applied.id}] · 额外选择 ${added} 项／取消 ${removed} 项`;summary.textContent=source;toolbar.dataset.templateSource=source;};host.addEventListener('change',update);
 const list=()=>readBusinessMenuTemplates(choices).filter(t=>t.enabled&&t.releases.length);
 const selected=():BusinessMenuTemplate|undefined=>list().find(t=>t.id===toolbar.querySelector<HTMLSelectElement>('[data-template-choice]')!.value);
 const refresh=()=>{try{const rows=list().filter(t=>Object.keys(DIMENSIONS).every(key=>{const value=toolbar.querySelector<HTMLSelectElement>(`[data-template-filter="${key}"]`)!.value;return !value||t.releases.at(-1)![key as 'category']===value;}));const select=toolbar.querySelector<HTMLSelectElement>('[data-template-choice]')!,old=select.value;select.innerHTML=rows.map(t=>`<option value="${templateEsc(t.id)}">${templateEsc(t.releases.at(-1)!.name)} · v${t.releases.at(-1)!.version}</option>`).join('')||'<option value="">暂无匹配的已发布模板</option>';if(rows.some(t=>t.id===old))select.value=old;toolbar.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=!rows.length);error.textContent='';}catch(e){error.textContent=(e as Error).message;}};
 toolbar.addEventListener('input',e=>e.stopPropagation());toolbar.addEventListener('change',e=>{e.stopPropagation();if((e.target as Element).hasAttribute('data-template-filter'))refresh();});refresh();
 toolbar.querySelector('[data-template-preview]')!.addEventListener('click',()=>{const t=selected(),release=t?.releases.at(-1);if(!release)return;const d=templateDialog(release.name+' · 模板菜单',`<p class="ba-muted">已发布 v${release.version}，仅查看，不改变当前选择。</p><div data-template-read></div>`);bindOpenedBrandMenuTree(d.querySelector<HTMLElement>('[data-template-read]')!,choices,new Set(release.keys),{emptyText:'当前目录无可展示菜单'});});
 toolbar.querySelectorAll<HTMLButtonElement>('[data-template-apply]').forEach(b=>b.onclick=()=>{try{
  const t=selected(),release=t?.releases.at(-1);if(!t||!release)throw Error('请选择已发布模板。');const revision=t.revision,mode=b.dataset.templateApply as 'replace'|'add',plan=planTemplateSelection(read(),release.keys,choices,allowed,mode),paid=paidNames(plan.next,choices);
  const d=templateDialog('应用业态菜单模板',`<h3>${templateEsc(release.name)} · v${release.version}</h3><p>${mode==='replace'?'按模板重新选择，将替换当前选择':'仅补充模板菜单，保留当前选择'}</p><p>新增 ${plan.added.length} 项 · 关闭 ${plan.removed.length} 项</p><p class="ba-muted">${plan.blocked.length} 项不在品牌或门店可用范围，${plan.missing.length} 项已不在当前目录，均不选择。</p><details><summary>查看未选择节点明细</summary><ul>${[...plan.blocked,...plan.missing].map(k=>`<li>${templateEsc(choices.find(c=>c.key===k)?.title??k)}</li>`).join('')||'<li>无</li>'}</ul></details><p class="ba-note">涉及收费服务：${templateEsc(paid.join('、')||'当前未匹配收费服务')}。选菜单不代表已购买，也不会开始试用。</p><details><summary>本次新增</summary><div data-template-added></div></details><details><summary>本次关闭</summary><div data-template-removed></div></details><p class="ba-error" data-template-confirm-error role="alert"></p><button type="button" class="ba-btn ba-primary" data-template-confirm>确认应用到当前选择</button>`);
  for(const field of ['added','removed'] as const)bindOpenedBrandMenuTree(d.querySelector<HTMLElement>(`[data-template-${field}]`)!,choices,new Set(plan[field]),{emptyText:'无'});
  d.querySelector('[data-template-confirm]')!.addEventListener('click',()=>{try{const current=list().find(row=>row.id===t.id);if(!current||current.revision!==revision)throw Error('模板已更新或停用，请关闭后重新选择。');apply(plan.next);applied={id:t.id,name:release.name,version:release.version,baseline:plan.baseline};update();host.dispatchEvent(new Event('change',{bubbles:true}));d.close();}catch(e){d.querySelector('[data-template-confirm-error]')!.textContent=(e as Error).message;}});
 }catch(e){error.textContent=(e as Error).message;}});
 return update;
}
