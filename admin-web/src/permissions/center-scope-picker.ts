import {esc} from './center-editor';
import {renderScope} from './center-staff-roles';
import type {Scope,Store} from './center-domain';
import {BrandStoreSelection,scopeFromPicker,type ScopeBrand,type ScopePickerMode} from './center-brand-store-selection';

export function scopePickerOptions(initial?:Scope):string {
  const options:[ScopePickerMode,string][]=[['stores','指定门店'],['brand-stores','品牌']];
  if(initial?.mode==='brands')options.push(['brands','动态品牌（原授权）']);
  if(initial?.mode==='regions')options.push(['regions','原授权范围（保留）']);
  return options.map(([id,label])=>`<option value="${id}" ${initial?.mode===id?'selected':''}${id==='regions'?' disabled':''}>${label}</option>`).join('');
}
export function renderGroupedScope(scope:Scope,stores:Store[],names:ScopeBrand[]):string {
  if(scope.mode!=='stores')return scope.mode==='brands'?`<p>动态品牌：${scope.ids.map(id=>esc(names.find(b=>b.id===id)?.name??id)).join('、')}</p>${renderScope(scope,stores,true)}`:renderScope(scope,stores,true);
  const model=new BrandStoreSelection(stores,names,scope.ids);
  const groups=model.groups.filter(g=>g.stores.some(s=>scope.ids.includes(s.id)));
  const missing=scope.ids.filter(id=>!stores.some(s=>s.id===id));
  return groups.map(g=>`<section class="pc-scope-summary"><strong>${esc(g.name)}</strong>${renderScope({mode:'stores',ids:g.stores.filter(s=>scope.ids.includes(s.id)).map(s=>s.id)},stores,true)}</section>`).join('')+(missing.length?renderScope({mode:'stores',ids:missing},stores,true):'');
}

function storeTable(stores:Store[],selected:Set<string>,query:string,selectedOnly:boolean):string {
  return `<div class="pc-store-picker-toolbar">
    <input type="search" data-store-query aria-label="搜索门店" placeholder="搜索名称、编号、地址或邮编" value="${esc(query)}">
    <label><input type="checkbox" data-store-selected-only ${selectedOnly?'checked':''}>仅看已选</label>
    <span class="pc-muted" data-store-count aria-live="polite"></span>
  </div>
  <div class="pc-store-picker-scroll"><table class="pc-store-picker-table">
    <thead><tr><th scope="col"><input type="checkbox" data-store-all aria-label="全选当前筛选门店"></th><th scope="col">门店名称</th><th scope="col">门店编号</th><th scope="col">地址</th><th scope="col">邮编</th></tr></thead>
    <tbody>${stores.map(store=>`<tr data-store-row data-search="${esc([store.title,store.id,store.address,store.postalCode].join(' '))}">
      <td><input type="checkbox" name="scope" value="${esc(store.id)}" aria-label="选择 ${esc(store.title)}（${esc(store.id)}）" ${selected.has(store.id)?'checked':''}></td>
      <td>${esc(store.title)}</td><td>${esc(store.id)}</td><td>${esc(store.address?.trim()||'—')}</td><td>${esc(store.postalCode?.trim()||'—')}</td>
    </tr>`).join('')}<tr data-store-empty hidden><td colspan="5" class="pc-empty">没有匹配门店</td></tr></tbody>
  </table></div>`;
}

/** Controller owns transient scope choices; read() is the only submission boundary. */
export function bindScopePicker(dialog:HTMLDialogElement,initial:Scope,stores:Store[],names:ScopeBrand[],options:{allowEmptyStores?:boolean}={}):()=>Scope {
  const select=dialog.querySelector<HTMLSelectElement>('[name="mode"]')!;
  const area=dialog.querySelector<HTMLElement>('[data-scope-options]')!;
  const choices=new Map<ScopePickerMode,Set<string>>([[initial.mode,new Set(initial.ids)]]);
  const brands=new BrandStoreSelection(stores,names);
  let mode=select.value as ScopePickerMode,brandSearch='',storeSearch='',selectedOnly=false;
  const matches=(text:string,query:string)=>text.toLowerCase().includes(query.trim().toLowerCase());
  const remember=()=>{if(mode!=='brand-stores'&&mode!=='regions')choices.set(mode,new Set([...area.querySelectorAll<HTMLInputElement>('[name="scope"]:checked')].map(x=>x.value)));};
  const visibleStoreBoxes=()=>[...area.querySelectorAll<HTMLInputElement>('[data-store-row]:not([hidden]) input')];
  const syncTable=()=>{
    const all=area.querySelector<HTMLInputElement>('[data-store-all]');
    if(!all)return;
    for(const row of area.querySelectorAll<HTMLTableRowElement>('[data-store-row]')){
      row.hidden=!matches(row.dataset.search??'',storeSearch)||(selectedOnly&&!row.querySelector<HTMLInputElement>('input')!.checked);
    }
    const visible=visibleStoreBoxes();
    const checked=visible.filter(box=>box.checked).length;
    all.disabled=!visible.length;
    all.checked=visible.length>0&&checked===visible.length;
    all.indeterminate=checked>0&&checked<visible.length;
    area.querySelector<HTMLElement>('[data-store-empty]')!.hidden=visible.length>0;
    const count=mode==='brand-stores'?brands.selected.size:area.querySelectorAll('[data-store-row] input:checked').length;
    area.querySelector<HTMLElement>('[data-store-count]')!.textContent=`已选 ${count} 家`;
  };
  dialog.classList.add('pc-brand-scope-dialog');
  dialog.classList.add('pc-assignment-dialog');
  const render=()=>{
    if(mode==='regions'){
      area.innerHTML=`<p>原授权范围（保留）：${initial.ids.map(id=>esc(id)).join('、')}</p><p class="pc-muted">当前范围保持不变；如需调整，请选择指定门店或品牌。</p>`;
      return;
    }
    if(mode==='stores'){
      const chosen=choices.get(mode)??new Set<string>();
      const missing=[...chosen].filter(id=>!stores.some(store=>store.id===id)).map(id=>({id,title:'已失效门店',brand:'',region:''}));
      area.innerHTML=storeTable([...stores,...missing],chosen,storeSearch,selectedOnly);
      syncTable();
      return;
    }
    if(mode!=='brand-stores'){
      const chosen=choices.get(mode)??new Set<string>();
      const known=[...new Set([...stores.map(s=>s.brand).filter(Boolean),...chosen])].map(id=>[id,names.find(b=>b.id===id)?.name??'原授权品牌']);
      const ids=new Set(known.map(([id])=>id));const list=[...known,...[...chosen].filter(id=>!ids.has(id)).map(id=>[id,'原授权范围（当前无候选，配置保留）'])];
      area.innerHTML=`<label>搜索范围<input type="search" data-scope-search placeholder="输入名称或编号"></label><div class="pc-choice-list">${list.map(([id,title])=>`<label data-scope-label><input type="checkbox" name="scope" value="${esc(id)}" ${chosen.has(id)?'checked':''}>${esc(title)}${id!==title?`<small>${esc(id)}</small>`:''}</label>`).join('')||'<p class="pc-muted">暂无可选范围</p>'}</div>`;
      return;
    }
    const active=brands.groups.find(g=>g.id===brands.active&&brands.visited.has(g.id));
    area.innerHTML=`<p class="pc-muted">按已选门店授权，未来新增门店不自动加入。</p><div class="pc-brand-store-picker"><section class="pc-brand-pane"><h3>品牌</h3><label class="pc-sr-label">搜索品牌<input type="search" data-brand-search placeholder="搜索品牌" value="${esc(brandSearch)}"></label><div class="pc-brand-list">${brands.groups.filter(g=>matches(`${g.name} ${g.id}`,brandSearch)).map(g=>{const state=brands.state(g.id),count=g.stores.filter(s=>brands.selected.has(s.id)).length;return `<div class="pc-brand-row ${active?.id===g.id?'active':''}"><input type="checkbox" data-scope-brand="${esc(g.id)}" aria-label="${esc(g.name)}全部门店" ${state==='all'?'checked':''} aria-checked="${state==='partial'?'mixed':state==='all'}"><button type="button" data-open-brand="${esc(g.id)}" aria-pressed="${active?.id===g.id}"><span>${esc(g.name)}</span>${g.name==='未识别品牌'?`<small>${esc(g.id)}</small>`:'' }<small>${count} / ${g.stores.length} 家</small></button></div>`;}).join('')||'<p class="pc-muted">没有匹配品牌</p>'}</div></section><section class="pc-brand-stores-pane"><h3>${active?`${esc(active.name)} · 门店`:'门店'}</h3>${active?storeTable(active.stores,brands.selected,storeSearch,selectedOnly):'<p class="pc-muted">请选择左侧品牌</p>'}</section></div>`;
    for(const box of area.querySelectorAll<HTMLInputElement>('[data-scope-brand]'))box.indeterminate=brands.state(box.dataset.scopeBrand!)==='partial';
    syncTable();
  };
  select.addEventListener('change',()=>{remember();mode=select.value as ScopePickerMode;storeSearch='';selectedOnly=false;render();});
  area.addEventListener('click',ev=>{const button=(ev.target as Element).closest<HTMLButtonElement>('[data-open-brand]');if(!button)return;brands.activate(button.dataset.openBrand!);storeSearch='';render();[...area.querySelectorAll<HTMLButtonElement>('[data-open-brand]')].find(b=>b.dataset.openBrand===brands.active)?.focus({preventScroll:true});});
  area.addEventListener('change',ev=>{
    const box=ev.target as HTMLInputElement;
    if(box.hasAttribute('data-scope-brand')){
      brands.setBrand(box.dataset.scopeBrand!,box.checked);
      storeSearch='';
      render();
      area.querySelector<HTMLInputElement>(`[data-scope-brand="${CSS.escape(box.dataset.scopeBrand!)}"]`)?.focus();
      return;
    }
    if(box.hasAttribute('data-store-selected-only')){
      selectedOnly=box.checked;
      syncTable();
      return;
    }
    const isAll=box.hasAttribute('data-store-all');
    if(!isAll&&!box.closest('[data-store-row]'))return;
    const boxes=isAll?visibleStoreBoxes():[box];
    for(const item of boxes){
      item.checked=box.checked;
      if(mode==='brand-stores')brands.setStore(item.value,item.checked);
    }
    syncTable();
    if(mode==='brand-stores'){
      for(const input of area.querySelectorAll<HTMLInputElement>('[data-scope-brand]')){
        const group=brands.groups.find(group=>group.id===input.dataset.scopeBrand)!;
        const count=group.stores.filter(store=>brands.selected.has(store.id)).length;
        input.checked=count===group.stores.length;
        input.indeterminate=count>0&&count<group.stores.length;
        input.setAttribute('aria-checked',input.indeterminate?'mixed':String(input.checked));
        input.parentElement!.querySelector('button small:last-child')!.textContent=`${count} / ${group.stores.length} 家`;
      }
    }
  });
  area.addEventListener('input',ev=>{
    const input=ev.target as HTMLInputElement;
    if(input.hasAttribute('data-store-query')){storeSearch=input.value;syncTable();return;}
    if(input.hasAttribute('data-scope-search')){
      for(const label of area.querySelectorAll<HTMLElement>('[data-scope-label]'))label.hidden=!matches(label.textContent??'',input.value);
      return;
    }
    if(!input.hasAttribute('data-brand-search'))return;
    brandSearch=input.value;
    render();
    area.querySelector<HTMLInputElement>('[data-brand-search]')?.focus();
  });
  render();
  return ()=>{
    remember();
    const ids=[...(choices.get(mode)??[])];
    if(options.allowEmptyStores&&mode==='stores'&&!ids.length)return {mode,ids};
    return scopeFromPicker(mode,ids,brands);
  };
}
