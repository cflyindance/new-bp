import {authorizationSelection} from './center-authorization';
import type {Catalog} from './center-catalog';
import type {Access,Role} from './center-domain';
import {readonlyChildDefault} from './center-child-defaults';
import {buildRoleTree,flattenRoleTree,treeSelection,treeEffective,treeRestriction,treeChanged,roleSelectionTargets,roleSelectionState,type RoleTreeNode,type RoleTreeState} from './center-role-tree-model';
import './center-role-tree.css';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const kindLabel={directory:'目录',page:'页面',content:'内容',setting:'设置项',action:'操作',object:'业务内容',group:'分组'};
export function treeChoices(n:RoleTreeNode):[Access,string][]{
  return n.kind==='action'?[['hidden','禁止'],['edit','允许']]:n.kind==='page'||n.kind==='setting'||n.kind==='object'?[['hidden','不可见'],['read','可见不可编辑'],['edit','可编辑']]:[['hidden','不可见'],['read','可见']];
}
export function visibleRoleTree(c:Catalog,role:Role,original:Role,s:RoleTreeState):{roots:RoleTreeNode[];category:RoleTreeNode|undefined;nodes:RoleTreeNode[]} {
  const roots=buildRoleTree(c),category=roots.find(n=>n.id===s.category)??roots[0],query=s.search.trim().toLowerCase();
  const visit=(n:RoleTreeNode,ancestorMatch=false):RoleTreeNode|undefined=>{
    const match=ancestorMatch||!query||n.title.toLowerCase().includes(query);
    const children=n.children.flatMap(child=>{const next=visit(child,match&&!!query);return next?[next]:[];});
    const granted=!s.onlyGranted||treeEffective(c,role,n)!=='hidden';
    const changed=!s.onlyChanged||treeChanged(c,role,original,n);
    return match&&granted&&changed||children.length?{...n,children}:undefined;
  };
  return {roots,category,nodes:(query?roots:category?[category]:[]).flatMap(n=>{const next=visit(n);return next?[next]:[];})};
}
export function renderRoleTree(c:Catalog,role:Role,original:Role,s:RoleTreeState):string {
  const {roots,category,nodes}=visibleRoleTree(c,role,original,s),all=flattenRoleTree(nodes),filtering=!!s.search.trim()||s.onlyGranted||s.onlyChanged;
  const selectable=roleSelectionTargets(nodes),selected=roleSelectionTargets(roots).filter(n=>s.selected.has(n.id)),currentSelection=roleSelectionState(nodes,s.selected);
  const count=(n:RoleTreeNode)=>{const pages=flattenRoleTree([n]).filter(n=>n.kind==='page');return `${pages.filter(n=>treeEffective(c,role,n)!=='hidden').length} / ${pages.length}`;};
  const row=(n:RoleTreeNode,path:string[],depth:number):string=>{
    const choice=treeSelection(c,role,n),effective=treeEffective(c,role,n),restriction=treeRestriction(c,role,n),collapsed=!filtering&&s.collapsed.has(n.id),choices=treeChoices(n);
    const r=n.key?c.resources.get(n.key):undefined;
    const hasExplicit=!!n.key&&role.grants[n.key]!==undefined;
    const source=r&&(role.defaultedGrants?.includes(r.key)||readonlyChildDefault(role,r,c.resources)!==undefined&&!hasExplicit)?(n.kind==='action'?'默认禁止':'默认只读'):hasExplicit?'单独设置':'';
    const isChanged=treeChanged(c,role,original,n),selection=roleSelectionState([n],s.selected);
    const readonlyReason=restriction.includes('不可见');
    const partial=n.authorization&&authorizationSelection(n.authorization,k=>role.grants[k]??'hidden')==='mixed'&&(n.kind!=='action'||n.authorization.editKeys.some(k=>role.grants[k]==='edit'));
    const controls=n.key&&n.kind!=='group'?`<select data-role-tree-grant="${esc(n.id)}" aria-label="${esc(n.title)}权限">${partial?'<option value="" selected disabled>部分授权</option>':''}${choices.map(([v,label])=>`<option value="${v}" ${!partial&&v===choice?'selected':''} ${v!=='hidden'&&readonlyReason?'disabled':''}>${label}</option>`).join('')}</select>`:'<span class="pc-muted">—</span>';
    return `<li><div class="pc-rt-row${isChanged?' pc-rt-changed':''}" data-role-tree-row="${esc(n.id)}" style="--permission-depth:${depth}"><div class="pc-rt-name">${n.children.length?`<button type="button" data-role-tree-toggle="${esc(n.id)}" aria-label="${collapsed?'展开':'收起'}${esc(n.title)}" aria-expanded="${!collapsed}" ${filtering?'disabled':''}>${collapsed?'▸':'▾'}</button>`:'<span class="pc-rt-spacer"></span>'}${selection.total?`<input type="checkbox" data-role-tree-select="${esc(n.id)}" aria-label="批量选择${esc(n.title)}" ${selection.checked?'checked':''}>`:'<span class="pc-rt-check-space"></span>'}<div><span>${esc(n.title)}</span><small>${kindLabel[n.kind]}${isChanged?' · 已修改':''}${source?' · '+source:''}</small>${s.search?`<small class="pc-rt-path">${esc(path.join(' / '))}</small>`:''}</div></div><div class="pc-rt-control">${controls}${restriction?`<small class="pc-rt-restriction">${esc(restriction)}；当前${esc(choices.find(([v])=>v===effective)?.[1]??'不可见')}</small>`:''}</div></div>${n.children.length&&!collapsed?`<ul>${n.children.map(child=>row(child,[...path,n.title],depth+1)).join('')}</ul>`:''}</li>`;
  };
  return `<div class="pc-rt"><aside class="pc-rt-nav" data-scroll="role-categories" aria-label="权限分类"><div class="pc-rt-nav-label">菜单分类 <small>已选 / 总项</small></div>${roots.map(n=>{const selection=roleSelectionState([n],s.selected);return `<div class="pc-rt-category${category?.id===n.id?' active':''}"><input type="checkbox" data-role-tree-category-select="${esc(n.id)}" aria-label="批量选择整个${esc(n.title)}" title="选择本分类全部页面和内容；独立操作单独授权" ${selection.checked?'checked':''} ${selection.total?'':'disabled'}><button type="button" data-role-tree-category="${esc(n.id)}" ${category?.id===n.id?'aria-current="page"':''}><span>${esc(n.title)}</span><small aria-label="已选 ${selection.selectedCount} 项，共 ${selection.total} 项">${selection.selectedCount} / ${selection.total}</small></button></div>`;}).join('')}</aside><section class="pc-rt-pane"><div class="pc-rt-toolbar"><label class="pc-rt-search"><span class="sr-only">搜索菜单或操作</span><input data-role-tree-search aria-label="搜索菜单或操作" placeholder="搜索菜单或操作" value="${esc(s.search)}"></label><label><input type="checkbox" data-role-tree-filter="granted" ${s.onlyGranted?'checked':''}>仅看已授权</label><label><input type="checkbox" data-role-tree-filter="changed" ${s.onlyChanged?'checked':''}>仅看本次修改</label><div class="pc-rt-expand"><button type="button" data-role-tree-expand="all">展开全部</button><button type="button" data-role-tree-expand="none">收起全部</button></div></div><div class="pc-rt-heading"><div><h2>${s.search?'搜索结果':esc(category?.title??'功能权限')}</h2><p>新增子页面默认可见不可编辑，操作项默认禁止。</p></div><span class="pc-muted">可见页面 / 全部页面 ${category?count(category):'0 / 0'}</span></div><div class="pc-rt-batch"><label><input type="checkbox" data-role-tree-select-all ${currentSelection.checked?'checked':''} ${!selectable.length?'disabled':''}>选择当前结果</label><span>已选 ${selected.length} 项（跨分类保留）</span><select data-role-tree-batch-mode aria-label="批量设置权限" ${!selected.length?'disabled':''}><option value="hidden">设为不可见</option><option value="read" selected>设为可见不可编辑</option><option value="edit">设为可编辑</option></select><button type="button" data-role-tree-batch ${!selected.length?'disabled':''}>应用到勾选项</button><small>仅修改已勾选项；独立操作逐项授权</small></div><div class="pc-rt-table-head"><span>菜单与功能</span><span>权限设置</span></div><div class="pc-rt-scroll" data-scroll="role-tree">${nodes.length?`<ul class="pc-rt-tree">${nodes.map(n=>row(n,[],0)).join('')}</ul>`:'<div class="pc-empty" role="status">没有匹配的权限项</div>'}</div></section></div>`;
}
