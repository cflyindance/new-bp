import { esc } from '../permissions/center-editor';
import { compactBrandMenuRows } from './brand-menu-presentation';
import type { MenuChoice } from './brand-access-store';

/** Read-only projection: path ancestors do not become grants or persisted choices. */
export function bindOpenedBrandMenuTree(host:HTMLElement,choices:MenuChoice[],opened:Set<string>,options:{emptyText?:string}={}):void {
  const all=new Map(choices.map(c=>[c.key,c])),included=new Set(opened);
  for(const key of opened){let parent=all.get(key)?.parent;const seen=new Set<string>();while(parent&&!seen.has(parent)){seen.add(parent);included.add(parent);parent=all.get(parent)?.parent;}}
  const rows=compactBrandMenuRows(choices).filter(c=>included.has(c.key)),byKey=new Map(rows.map(c=>[c.key,c])),children=new Map<string,MenuChoice[]>(),parents=new Map<string,string>();
  for(const row of rows){let parent=row.parent;const seen=new Set<string>();while(parent&&!byKey.has(parent)&&!seen.has(parent)){seen.add(parent);parent=all.get(parent)?.parent;}parents.set(row.key,parent??'');const list=children.get(parent??'')??[];list.push(row);children.set(parent??'',list);}
  const roots=children.get('')??[];
  if(!roots.length){host.innerHTML=`<div class="ba-card ba-empty">${esc(options.emptyText??'尚未开通菜单。由 M 平台选择品牌可用范围。')}</div>`;return;}
  let active=roots[0].key,query='';
  const collapsed=new Set(rows.filter(c=>c.isPage).map(c=>c.key));
  const rootOf=(key:string):string=>{let parent=parents.get(key);const seen=new Set<string>();while(parent&&!seen.has(parent)){seen.add(parent);key=parent;parent=parents.get(key);}return key;};
  const pageCount=(key:string)=>rows.filter(c=>c.isPage&&opened.has(c.key)&&rootOf(c.key)===key).length;
  const pathOf=(key:string)=>{const titles:string[]=[];let parent=parents.get(key);const seen=new Set<string>();while(parent&&!seen.has(parent)){seen.add(parent);const row=byKey.get(parent);if(row)titles.unshift(row.title);parent=parents.get(parent);}return titles.join(' / ');};
  host.innerHTML='<div class="ba-toolbar"><input type="search" data-opened-search aria-label="搜索已开通菜单" placeholder="搜索菜单名称或路由"></div><div class="ba-menu ba-tree-picker ba-opened-menu"><nav aria-label="已开通菜单分类" data-opened-nav></nav><div class="ba-tree-pane"><header class="ba-tree-heading"><strong data-opened-heading></strong><div class="ba-actions"><button type="button" class="ba-btn" data-opened-expand>展开全部</button><button type="button" class="ba-btn" data-opened-collapse>收起全部</button></div></header><div class="ba-menu-list" data-opened-list></div></div></div>';
  const render=()=>{
    const searching=Boolean(query.trim()),matches=new Set<string>();
    if(searching){const q=query.trim().toLocaleLowerCase();for(const row of rows){if(!`${row.title} ${row.path??''}`.toLocaleLowerCase().includes(q))continue;const includeChildren=(key:string)=>{matches.add(key);(children.get(key)??[]).forEach(child=>includeChildren(child.key));};includeChildren(row.key);let parent=parents.get(row.key);while(parent){matches.add(parent);parent=parents.get(parent);}}}
    host.querySelector('[data-opened-nav]')!.innerHTML=roots.map(c=>`<button type="button" data-opened-category="${esc(c.key)}" class="${active===c.key&&!searching?'active':''}" ${active===c.key&&!searching?'aria-current="true"':''}><span>${esc(c.title)}</span><span class="ba-tree-nav-count">${pageCount(c.key)} 个页面</span></button>`).join('');
    host.querySelector('[data-opened-heading]')!.textContent=searching?'搜索结果':byKey.get(active)?.title??'菜单明细';
    const renderRow=(row:MenuChoice):string=>{
      if(searching&&!matches.has(row.key))return '';
      const nested=(children.get(row.key)??[]).filter(child=>!searching||matches.has(child.key)),type=row.level===1?'目录':row.isPage?'页面':row.kind==='setting'?'设置项':'分组';
      const title=`<span class="ba-tree-title">${esc(row.title)}</span><span class="ba-tree-type">${type}${!opened.has(row.key)?' · 路径':''}</span>${searching?`<small class="ba-opened-path">${esc(pathOf(row.key))}</small>`:''}`;
      return nested.length?`<li><details data-opened-node="${esc(row.key)}" ${searching||!collapsed.has(row.key)?'open':''}><summary>${title}</summary><ul>${nested.map(renderRow).join('')}</ul></details></li>`:`<li class="ba-opened-leaf" data-opened-node="${esc(row.key)}">${title}</li>`;
    };
    const list=searching?roots.map(renderRow).join(''):(children.get(active)??[]).map(renderRow).join('');
    host.querySelector('[data-opened-list]')!.innerHTML=list?`<ul class="ba-opened-tree" aria-label="已开通菜单明细">${list}</ul>`:`<p class="ba-empty">${searching?'没有匹配菜单':'仅目录开通，尚未选择页面'}</p>`;
    host.querySelectorAll<HTMLButtonElement>('[data-opened-category]').forEach(button=>button.onclick=()=>{active=button.dataset.openedCategory!;query='';host.querySelector<HTMLInputElement>('[data-opened-search]')!.value='';render();});
    host.querySelectorAll<HTMLDetailsElement>('details[data-opened-node]').forEach(details=>details.ontoggle=()=>{if(searching||!details.isConnected)return;details.open?collapsed.delete(details.dataset.openedNode!):collapsed.add(details.dataset.openedNode!);});
    host.querySelectorAll<HTMLButtonElement>('[data-opened-expand],[data-opened-collapse]').forEach(button=>button.disabled=searching);
  };
  host.querySelector<HTMLInputElement>('[data-opened-search]')!.oninput=e=>{query=(e.target as HTMLInputElement).value;render();};
  host.querySelector<HTMLButtonElement>('[data-opened-expand]')!.onclick=()=>{rows.filter(c=>rootOf(c.key)===active).forEach(c=>collapsed.delete(c.key));render();};
  host.querySelector<HTMLButtonElement>('[data-opened-collapse]')!.onclick=()=>{rows.filter(c=>rootOf(c.key)===active).forEach(c=>collapsed.add(c.key));render();};
  render();
}
