import type { Access, Resource } from './center-domain';
import type { Catalog, MenuNode } from './center-catalog';
export const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export interface EditorOptions { catalog: Catalog; page: string; group: string; preview: boolean; readonly: boolean; staff: boolean; value: (key:string)=>Access; own: (key:string)=>Access|'inherit'; search: string }
export function renderPermissionEditor(o: EditorOptions): string {
  const {catalog}=o;
  const visible = (n:MenuNode): boolean => {
    if(n.key && o.preview && o.value(n.key)==='hidden') return false;
    if(n.children.length) return n.children.some(visible);
    if(o.search && !n.title.toLowerCase().includes(o.search.toLowerCase())) return false;
    if(o.preview && n.key && catalog.groups.has(n.key)) return catalog.groups.get(n.key)!.some(g=>g.keys.some(k=>o.value(k)!=='hidden'));
    return true;
  };
  const tree = (nodes:MenuNode[]):string => nodes.filter(visible).map(n=> n.children.length ? `<details data-menu-node="${esc(n.id)}" open><summary>${esc(n.title)}</summary>${n.key&&!o.preview&&!o.readonly?control(catalog.resources.get(n.key)!):''}<div class="pc-tree-children">${tree(n.children)}</div></details>` : `<button type="button" class="pc-tree-item ${o.page===n.key?'active':''}" data-page="${esc(n.key)}">${esc(n.title)}</button>`).join('');
  function control(resource:Resource): string {
    const vals: [Access|'inherit',string][] = resource.type==='action' ? [['hidden','禁止'],['edit','允许']] : resource.type==='setting' ? [['hidden','隐藏'],['read','可见不可编辑'],['edit','可编辑']] : [['hidden','不可查看'],['read','可查看']];
    if(o.staff) vals.unshift(['inherit','跟随角色']);
    const blocked = !!resource.parent && o.value(resource.parent)==='hidden';
    return `<div class="pc-segment" role="group" aria-label="${esc(resource.title)}权限">${vals.map(([v,l])=>`<button type="button" data-grant="${esc(resource.key)}" data-value="${v}" aria-pressed="${o.own(resource.key)===v}" ${blocked?'disabled':''}>${l}</button>`).join('')}</div>`;
  }
  const page=catalog.resources.get(o.page), groups=(catalog.groups.get(o.page)??[]).filter(g=>!o.preview || g.keys.some(k=>o.value(k)!=='hidden'));
  const active=groups.find(g=>g.id===o.group)??groups[0];
  const actions=[...catalog.resources.values()].filter(r=>r.parent===o.page&&r.type==='action');
  const accessLabel=(r:Resource):string=>o.value(r.key)==='hidden'?'不可操作':o.value(r.key)==='edit'?'可操作':'仅查看';
  const row=(r:Resource)=>`<tr><th scope="row">${esc(r.title)}</th><td>${o.preview ? r.type==='page'?`<span class="pc-tag">${o.value(r.key)==='hidden'?'不可查看':'可查看'}</span>`:r.type==='action'?`<button type="button" data-demo ${o.value(r.key)!=='edit'?'disabled title="暂无操作权限"':''}>${esc(r.title)}</button>`:`<span class="pc-tag">${o.value(r.key)==='edit'?'可编辑':'只读'}</span><button type="button" data-demo ${o.value(r.key)!=='edit'?'disabled title="暂无操作权限"':''}>编辑</button>` : o.readonly ? `<span class="pc-tag">${r.type==='page'?(o.value(r.key)==='hidden'?'不可查看':'可查看'):accessLabel(r)}</span>`:control(r)}</td></tr>`;
  let lastSection='';
  const categories=groups.map(g=>{const section=g.section!==lastSection?`<h4>${esc(g.section)}</h4>`:'';lastSection=g.section;return `${section}<button type="button" data-group="${esc(g.id)}" class="${g.id===active?.id?'active':''}">${esc(g.title)}</button>`}).join('');
  const body=!page || o.preview&&o.value(o.page)==='hidden' ? '<div class="pc-empty">请选择可查看的页面</div>' : `<header class="pc-detail-heading"><div><small>${esc(catalog.resources.get(page.parent??'')?.title)}</small><h2>${esc(page.title)}</h2></div>${!o.preview&&!o.readonly&&(groups.length||actions.length)?control(page):`<span class="pc-tag">${o.value(page.key)==='hidden'?'不可查看':'可查看'}</span>`}</header>${groups.length ? `<div class="pc-settings"><nav class="pc-categories" data-scroll="categories" tabindex="0" aria-label="设置分类">${categories}</nav><div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="功能设置项"><table><thead><tr><th>功能设置项</th><th>${o.preview?'效果':'权限'}</th></tr></thead><tbody>${active?.keys.filter(k=>!o.preview||o.value(k)!=='hidden').map(k=>row(catalog.resources.get(k)!)).join('')??''}</tbody></table></div></div>` : actions.length?`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="页面操作权限"><h3>页面操作权限</h3><table><thead><tr><th>操作</th><th>${o.preview?'效果':'授权'}</th></tr></thead><tbody>${actions.map(row).join('')}</tbody></table></div>`:`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="页面访问权限"><table><thead><tr><th>页面功能</th><th>${o.preview?'效果':'权限'}</th></tr></thead><tbody>${row({...page,title:'查看页面'})}</tbody></table></div>`}`;
  return `<div class="pc-editor"><aside class="pc-tree" data-scroll="tree"><label class="pc-search">搜索菜单<input data-menu-search aria-label="搜索菜单" value="${esc(o.search)}" placeholder="搜索菜单名称"></label>${tree(catalog.tree)||'<p class="pc-empty">没有可显示的菜单</p>'}</aside><section class="pc-detail" data-scroll="detail">${body}</section></div>`;
}
