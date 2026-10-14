import type { Access, Resource } from './center-domain';
import type { Catalog, MenuNode } from './center-catalog';
export const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export interface EditorOptions { catalog: Catalog; page: string; group: string; preview: boolean; readonly: boolean; staff: boolean; value: (key:string)=>Access; own: (key:string)=>Access|'inherit'; search: string }
export function renderPermissionEditor(o: EditorOptions): string {
  const {catalog}=o;
  const menuNodes=new Map<string,MenuNode>();
  const indexNodes=(nodes:MenuNode[]):void=>{for(const node of nodes){if(node.key)menuNodes.set(node.key,node);indexNodes(node.children);}};
  indexNodes(catalog.tree);
  const visible = (n:MenuNode, ancestorMatch=false): boolean => {
    if(n.key && o.preview && o.value(n.key)==='hidden') return false;
    const matches=ancestorMatch||!o.search||n.title.toLowerCase().includes(o.search.toLowerCase());
    if(n.children.length) return n.children.some(child=>visible(child,matches));
    if(!matches) return false;
    if(o.preview && n.key && catalog.groups.has(n.key)) return catalog.groups.get(n.key)!.some(g=>g.keys.some(k=>o.value(k)!=='hidden'));
    return true;
  };
  const menuStatus=(key:string):string=>`<span class="pc-tag" data-menu-access="${o.value(key)}">${o.value(key)==='hidden'?'不可查看':'可查看'}</span>`;
  const tree = (nodes:MenuNode[],ancestorMatch=false):string => nodes.filter(n=>visible(n,ancestorMatch)).map(n=> {
    const matches=ancestorMatch||!o.search||n.title.toLowerCase().includes(o.search.toLowerCase());
    return n.children.length ? `<details data-menu-node="${esc(n.id)}" open><summary class="pc-tree-menu-row">${n.key?`<button type="button" class="pc-tree-group-label ${o.page===n.key?'active':''}" data-page="${esc(n.key)}" title="${esc(n.title)}">${esc(n.title)}</button>`:`<span class="pc-tree-group-label" title="${esc(n.title)}">${esc(n.title)}</span>`}${n.key&&!o.preview?`<span class="pc-menu-controls">${o.readonly?menuStatus(n.key):control(catalog.resources.get(n.key)!,true)}</span>`:''}</summary><div class="pc-tree-children">${tree(n.children,matches)}</div></details>` : `<button type="button" class="pc-tree-item ${o.page===n.key?'active':''}" data-page="${esc(n.key)}">${esc(n.title)}</button>`;
  }).join('');
  function control(resource:Resource, compact=false): string {
    const vals: [Access|'inherit',string][] = resource.type==='action' ? [['hidden','禁止'],['edit','允许']] : resource.type==='setting' ? [['hidden','隐藏'],['read','可见不可编辑'],['edit','可编辑']] : [['hidden','不可查看'],['read','可查看']];
    if(o.staff) vals.unshift(['inherit','跟随角色']);
    const blocked = !!resource.parent && o.value(resource.parent)==='hidden';
    const tag=compact?'span':'div';
    return `<${tag} class="pc-segment" role="group" aria-label="${esc(resource.title)}权限">${vals.map(([v,l])=>`<button type="button" data-grant="${esc(resource.key)}" data-value="${v}" aria-pressed="${o.own(resource.key)===v}" ${blocked?'disabled title="上级导航不可查看"':''}>${l}</button>`).join('')}</${tag}>`;
  }
  const page=catalog.resources.get(o.page), groups=(catalog.groups.get(o.page)??[]).filter(g=>!o.preview || g.keys.some(k=>o.value(k)!=='hidden'));
  const active=groups.find(g=>g.id===o.group)??groups[0];
  const actions=[...catalog.resources.values()].filter(r=>r.parent===o.page&&r.type==='action');
  const accessLabel=(r:Resource):string=>o.value(r.key)==='hidden'?'不可操作':o.value(r.key)==='edit'?'可操作':'仅查看';
  const isMenu=(r:Resource)=>r.type==='module'||r.type==='navigation'||r.type==='page';
  const row=(r:Resource)=>`<tr><th scope="row">${esc(r.title)}</th><td>${o.preview ? isMenu(r)?menuStatus(r.key):r.type==='action'?`<button type="button" data-demo ${o.value(r.key)!=='edit'?'disabled title="暂无操作权限"':''}>${esc(r.title)}</button>`:`<span class="pc-tag">${o.value(r.key)==='edit'?'可编辑':'只读'}</span><button type="button" data-demo ${o.value(r.key)!=='edit'?'disabled title="暂无操作权限"':''}>编辑</button>` : o.readonly ? isMenu(r)?menuStatus(r.key):`<span class="pc-tag">${accessLabel(r)}</span>`:control(r)}</td></tr>`;
  const ancestors:string[]=[];let parent=page?.parent;const seen=new Set<string>();
  while(parent&&!seen.has(parent)){seen.add(parent);const r=catalog.resources.get(parent);if(!r)break;ancestors.unshift(r.title);parent=r.parent;}
  const submenus=[...catalog.resources.values()].filter(r=>r.parent===o.page&&isMenu(r)&&(!o.preview||(menuNodes.has(r.key)?visible(menuNodes.get(r.key)!,true):o.value(r.key)!=='hidden')));
  let lastSection='';
  const categories=groups.map(g=>{const section=g.section!==lastSection?`<h4>${esc(g.section)}</h4>`:'';lastSection=g.section;return `${section}<button type="button" data-group="${esc(g.id)}" class="${g.id===active?.id?'active':''}">${esc(g.title)}</button>`}).join('');
  const body=!page || o.preview&&o.value(o.page)==='hidden' ? '<div class="pc-empty">请选择可查看的页面</div>' : `<header class="pc-detail-heading"><div><small>${esc(ancestors.join(' / '))}</small><h2>${esc(page.title)}</h2></div>${!o.preview&&!o.readonly&&(page.type!=='page'||groups.length||actions.length)?control(page):menuStatus(page.key)}</header>${page.type==='module'||page.type==='navigation'?`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="子导航查看权限"><h3>子导航查看权限</h3><table><thead><tr><th>子导航</th><th>${o.preview?'效果':'权限'}</th></tr></thead><tbody>${submenus.map(row).join('')||'<tr><td colspan="2" class="pc-empty">没有可显示的子导航</td></tr>'}</tbody></table></div>`:groups.length ? `<div class="pc-settings"><nav class="pc-categories" data-scroll="categories" tabindex="0" aria-label="设置分类">${categories}</nav><div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="功能设置项"><table><thead><tr><th>功能设置项</th><th>${o.preview?'效果':'权限'}</th></tr></thead><tbody>${active?.keys.filter(k=>!o.preview||o.value(k)!=='hidden').map(k=>row(catalog.resources.get(k)!)).join('')??''}</tbody></table></div></div>` : actions.length?`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="页面操作权限"><h3>页面操作权限</h3><table><thead><tr><th>操作</th><th>${o.preview?'效果':'授权'}</th></tr></thead><tbody>${actions.map(row).join('')}</tbody></table></div>`:`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="页面访问权限"><table><thead><tr><th>页面功能</th><th>${o.preview?'效果':'权限'}</th></tr></thead><tbody>${row({...page,title:'查看页面'})}</tbody></table></div>`}`;
  return `<div class="pc-editor"><aside class="pc-tree" data-scroll="tree"><label class="pc-search">搜索菜单<input data-menu-search aria-label="搜索菜单" value="${esc(o.search)}" placeholder="搜索菜单名称"></label>${tree(catalog.tree)||'<p class="pc-empty">没有可显示的菜单</p>'}</aside><section class="pc-detail" data-scroll="detail">${body}</section></div>`;
}
