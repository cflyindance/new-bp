import {esc} from './center-editor';
import {renderScope} from './center-staff-roles';
import type {Scope,Store} from './center-domain';
import {BrandStoreSelection,scopeFromPicker,type ScopeBrand,type ScopePickerMode} from './center-brand-store-selection';

export function scopePickerOptions(initial?:Scope):string {
  const options:[ScopePickerMode,string][]=[['stores','指定门店'],['brand-stores','品牌'],['regions','动态区域']];
  if(initial?.mode==='brands')options.push(['brands','动态品牌（原授权）']);
  return options.map(([id,label])=>`<option value="${id}" ${initial?.mode===id?'selected':''}>${label}</option>`).join('');
}
export function renderGroupedScope(scope:Scope,stores:Store[],names:ScopeBrand[]):string {
  if(scope.mode!=='stores')return scope.mode==='brands'?`<p>动态品牌：${scope.ids.map(id=>esc(names.find(b=>b.id===id)?.name??id)).join('、')}</p>${renderScope(scope,stores,true)}`:renderScope(scope,stores,true);
  const model=new BrandStoreSelection(stores,names,scope.ids);
  const groups=model.groups.filter(g=>g.stores.some(s=>scope.ids.includes(s.id)));
  const missing=scope.ids.filter(id=>!stores.some(s=>s.id===id));
  return groups.map(g=>`<section class="pc-scope-summary"><strong>${esc(g.name)}</strong>${renderScope({mode:'stores',ids:g.stores.filter(s=>scope.ids.includes(s.id)).map(s=>s.id)},stores,true)}</section>`).join('')+(missing.length?renderScope({mode:'stores',ids:missing},stores,true):'');
}

/** Controller owns transient scope choices; read() is the only submission boundary. */
export function bindScopePicker(dialog:HTMLDialogElement,initial:Scope,stores:Store[],names:ScopeBrand[]):()=>Scope {
  const select=dialog.querySelector<HTMLSelectElement>('[name="mode"]')!;
  const area=dialog.querySelector<HTMLElement>('[data-scope-options]')!;
  const choices=new Map<ScopePickerMode,Set<string>>([[initial.mode,new Set(initial.ids)]]);
  const brands=new BrandStoreSelection(stores,names);
  let mode=select.value as ScopePickerMode,brandSearch='',storeSearch='';
  const matches=(text:string,query:string)=>text.toLowerCase().includes(query.trim().toLowerCase());
  const remember=()=>{if(mode!=='brand-stores')choices.set(mode,new Set([...area.querySelectorAll<HTMLInputElement>('[name="scope"]:checked')].map(x=>x.value)));};
  const render=()=>{
    dialog.classList.toggle('pc-brand-scope-dialog',mode==='brand-stores');
    if(mode!=='brand-stores'){
      const chosen=choices.get(mode)??new Set<string>();
      const known=mode==='stores'?stores.map(s=>[s.id,s.title]):mode==='brands'?[...new Set([...stores.map(s=>s.brand).filter(Boolean),...chosen])].map(id=>[id,names.find(b=>b.id===id)?.name??'原授权品牌']):[...new Set(stores.map(s=>s.region).filter(Boolean))].map(id=>[id,id]);
      const ids=new Set(known.map(([id])=>id));const list=[...known,...[...chosen].filter(id=>!ids.has(id)).map(id=>[id,'原授权范围（当前无候选，配置保留）'])];
      area.innerHTML=`<label>搜索${mode==='stores'?'门店':'范围'}<input type="search" data-scope-search placeholder="输入名称或编号"></label>${mode==='stores'?'':`<p class="pc-muted">${mode==='brands'?'原授权保持动态品牌；选择品牌选项并确认后才改为指定门店。':'动态区域包含未来新增或纳入的门店。'}</p>`}<div class="pc-choice-list">${list.map(([id,title])=>`<label data-scope-label><input type="checkbox" name="scope" value="${esc(id)}" ${chosen.has(id)?'checked':''}>${esc(title)}${id!==title?`<small>${esc(id)}</small>`:''}</label>`).join('')||'<p class="pc-muted">暂无可选范围</p>'}</div>`;
      return;
    }
    const active=brands.groups.find(g=>g.id===brands.active&&brands.visited.has(g.id));
    area.innerHTML=`<p class="pc-muted">按已选门店授权，未来新增门店不自动加入。</p><div class="pc-brand-store-picker"><section class="pc-brand-pane"><h3>品牌</h3><label class="pc-sr-label">搜索品牌<input type="search" data-brand-search placeholder="搜索品牌" value="${esc(brandSearch)}"></label><div class="pc-brand-list">${brands.groups.filter(g=>matches(`${g.name} ${g.id}`,brandSearch)).map(g=>{const state=brands.state(g.id),count=g.stores.filter(s=>brands.selected.has(s.id)).length;return `<div class="pc-brand-row ${active?.id===g.id?'active':''}"><input type="checkbox" data-scope-brand="${esc(g.id)}" aria-label="${esc(g.name)}全部门店" ${state==='all'?'checked':''} aria-checked="${state==='partial'?'mixed':state==='all'}"><button type="button" data-open-brand="${esc(g.id)}" aria-pressed="${active?.id===g.id}"><span>${esc(g.name)}</span>${g.name==='未识别品牌'?`<small>${esc(g.id)}</small>`:'' }<small>${count} / ${g.stores.length} 家</small></button></div>`;}).join('')||'<p class="pc-muted">没有匹配品牌</p>'}</div></section><section class="pc-brand-stores-pane"><h3>${active?`${esc(active.name)} · 门店`:'门店'}</h3>${active?`<label class="pc-sr-label">搜索门店<input type="search" data-brand-store-search placeholder="输入门店名称或编号" value="${esc(storeSearch)}"></label><label class="pc-brand-all"><input type="checkbox" data-brand-all ${brands.state(active.id)==='all'?'checked':''} aria-checked="${brands.state(active.id)==='partial'?'mixed':brands.state(active.id)==='all'}">全选该品牌（${active.stores.length} 家）</label><div class="pc-brand-store-list">${active.stores.filter(s=>matches(`${s.title} ${s.id}`,storeSearch)).map(s=>`<label><input type="checkbox" data-brand-store="${esc(s.id)}" ${brands.selected.has(s.id)?'checked':''}><span>${esc(s.title)}<small>${esc(s.id)}</small></span></label>`).join('')||'<p class="pc-muted">没有匹配门店</p>'}</div>`:'<p class="pc-muted">请选择左侧品牌</p>'}</section></div><p class="pc-muted">已选 ${brands.selected.size} 家门店</p>`;
    for(const box of area.querySelectorAll<HTMLInputElement>('[data-scope-brand]'))box.indeterminate=brands.state(box.dataset.scopeBrand!)==='partial';
    const all=area.querySelector<HTMLInputElement>('[data-brand-all]');if(all&&active)all.indeterminate=brands.state(active.id)==='partial';
  };
  select.addEventListener('change',()=>{remember();mode=select.value as ScopePickerMode;render();});
  area.addEventListener('click',ev=>{const button=(ev.target as Element).closest<HTMLButtonElement>('[data-open-brand]');if(!button)return;brands.activate(button.dataset.openBrand!);storeSearch='';render();[...area.querySelectorAll<HTMLButtonElement>('[data-open-brand]')].find(b=>b.dataset.openBrand===brands.active)?.focus({preventScroll:true});});
  area.addEventListener('change',ev=>{const box=ev.target as HTMLInputElement;let selector='';let value='';if(box.hasAttribute('data-scope-brand')){value=box.dataset.scopeBrand!;brands.setBrand(value,box.checked);selector='[data-scope-brand]';storeSearch='';}else if(box.hasAttribute('data-brand-all')){brands.setBrand(brands.active,box.checked);selector='[data-brand-all]';}else if(box.hasAttribute('data-brand-store')){value=box.dataset.brandStore!;brands.setStore(value,box.checked);selector='[data-brand-store]';}else return;render();[...area.querySelectorAll<HTMLInputElement>(selector)].find(b=>selector==='[data-brand-all]'||b.dataset.scopeBrand===value||b.dataset.brandStore===value)?.focus({preventScroll:true});});
  area.addEventListener('input',ev=>{const input=ev.target as HTMLInputElement;if(input.hasAttribute('data-scope-search')){for(const label of area.querySelectorAll<HTMLElement>('[data-scope-label]'))label.hidden=!matches(label.textContent??'',input.value);return;}const attribute=input.hasAttribute('data-brand-search')?'data-brand-search':input.hasAttribute('data-brand-store-search')?'data-brand-store-search':'';if(!attribute)return;if(attribute==='data-brand-search')brandSearch=input.value;else storeSearch=input.value;const pos=input.selectionStart;render();const next=area.querySelector<HTMLInputElement>(`[${attribute}]`);next?.focus();next?.setSelectionRange(pos,pos);});
  render();
  return ()=>{remember();return scopeFromPicker(mode,[...(choices.get(mode)??[])],brands);};
}
