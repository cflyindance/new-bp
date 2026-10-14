import type { Access, Resource } from './center-domain';
import type { Catalog, MenuNode } from './center-catalog';
import { authorizationRows, authorizationSelection, type AuthorizationRow } from './center-authorization';
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
    return true;
  };
  const menuStatus=(key:string):string=>`<span class="pc-tag" data-menu-access="${o.value(key)}">${o.value(key)==='hidden'?'不可查看':'可查看'}</span>`;
  const tree = (nodes:MenuNode[],ancestorMatch=false):string => nodes.filter(n=>visible(n,ancestorMatch)).map(n=> {
    const matches=ancestorMatch||!o.search||n.title.toLowerCase().includes(o.search.toLowerCase());
    return n.children.length ? `<details data-menu-node="${esc(n.id)}" open><summary class="pc-tree-menu-row">${n.key?`<button type="button" class="pc-tree-group-label ${o.page===n.key?'active':''}" data-page="${esc(n.key)}" title="${esc(n.title)}">${esc(n.title)}</button>`:`<span class="pc-tree-group-label" title="${esc(n.title)}">${esc(n.title)}</span>`}${n.key&&!o.preview?`<span class="pc-menu-controls">${o.readonly?menuStatus(n.key):control(catalog.resources.get(n.key)!,true)}</span>`:''}</summary><div class="pc-tree-children">${tree(n.children,matches)}</div></details>` : `<button type="button" class="pc-tree-item ${o.page===n.key?'active':''}" data-page="${esc(n.key)}">${esc(n.title)}</button>`;
  }).join('');
  function control(resource:Resource, compact=false): string {
    const vals: [Access|'inherit',string][] = resource.type==='action' ? [['hidden','禁止'],['edit','允许']] : resource.type==='setting' ? [['hidden','隐藏'],['read','可见不可编辑'],['edit','可编辑']] : resource.type==='content'||resource.type==='field' ? [['hidden','不可见'],['read','可见']] : [['hidden','不可查看'],['read','可查看']];
    if(o.staff) vals.unshift(['inherit','跟随角色']);
    const parentBlocked=!!resource.parent && o.value(resource.parent)==='hidden';
    const contentBlocked=resource.requires?.some(k=>o.value(k)==='hidden');
    const blocked=parentBlocked||contentBlocked;
    const tag=compact?'span':'div';
    const reason=parentBlocked?(catalog.resources.get(resource.parent!)?.type==='content'?'所属内容不可见':'上级导航不可查看'):'所需页面内容不可见';
    return `<${tag} class="pc-segment" role="group" aria-label="${esc(resource.title)}权限">${vals.map(([v,l])=>`<button type="button" data-grant="${esc(resource.key)}" data-value="${v}" aria-pressed="${o.own(resource.key)===v}" ${blocked?`disabled title="${reason}"`:''}>${l}</button>`).join('')}</${tag}>`;
  }
  const page=catalog.resources.get(o.page),pageSections=catalog.sections?.get(o.page),allGroups=pageSections??catalog.groups.get(o.page)??[], groups=allGroups.filter(g=>!o.preview || g.keys.some(k=>o.value(k)!=='hidden'));
  const active=groups.find(g=>g.id===o.group)??groups[0];
  const actions=[...catalog.resources.values()].filter(r=>r.parent===o.page&&r.type==='action');
  const contents=[...catalog.resources.values()].filter(r=>r.path===page?.path&&(r.type==='content'||r.type==='field'));
  const inCategory=(key:string)=>!pageSections||!!active?.keys.includes(key);
  const shownActions=actions.filter(r=>inCategory(r.key)&&(!o.preview||o.value(r.key)==='edit'));
  const shownContents=contents.filter(r=>inCategory(r.key)&&(!o.preview||o.value(r.key)!=='hidden'));
  const unified=authorizationRows(catalog,o.page),unifiedByContent=new Map(unified.map(r=>[r.contentKey,r]));
  const mergedActions=new Set(unified.flatMap(r=>r.editKeys));
  const accessLabel=(r:Resource):string=>o.value(r.key)==='hidden'?'不可操作':o.value(r.key)==='edit'?'可操作':'仅查看';
  const isMenu=(r:Resource)=>r.type==='module'||r.type==='navigation'||r.type==='page';
  const actionTitle=(r:Resource):string=>{
    if(!r.help)return esc(r.title);
    const id=`pc-help-${o.preview?'preview':o.readonly?'readonly':'editor'}-${encodeURIComponent(r.key)}`;
    return `<span class="pc-action-name">${esc(r.title)}<span class="pc-help"><button type="button" class="pc-help-trigger" aria-label="${esc(r.title)}权限说明" aria-describedby="${esc(id)}">?</button><span class="pc-help-text" role="tooltip" id="${esc(id)}">${esc(r.help)}</span></span></span>`;
  };
  const isContent=(r:Resource)=>r.type==='content'||r.type==='field';
  const row=(r:Resource)=>`<tr${r.type==='field'?' class="pc-content-field"':''}><th scope="row">${r.type==='field'?`<small>敏感字段 · ${esc(catalog.resources.get(r.parent??'')?.title)}</small><br>`:''}${actionTitle(r)}</th><td>${o.preview ? isMenu(r)?menuStatus(r.key):isContent(r)?`<span class="pc-content-sample">${esc(r.previewValue??'内容示意')}</span>`:r.type==='action'?`<button type="button" data-demo >${esc(r.title)}</button>`:`<span class="pc-tag">${o.value(r.key)==='edit'?'可编辑':'只读'}</span>${o.value(r.key)==='edit'?'<button type="button" data-demo >编辑</button>':''}` : o.readonly ? isMenu(r)?menuStatus(r.key):isContent(r)?`<span class="pc-tag">${o.value(r.key)==='hidden'?'不可见':'可见'}</span>`:`<span class="pc-tag">${accessLabel(r)}</span>`:control(r)}</td></tr>`;
  const ancestors:string[]=[];let parent=page?.parent;const seen=new Set<string>();
  while(parent&&!seen.has(parent)){seen.add(parent);const r=catalog.resources.get(parent);if(!r)break;ancestors.unshift(r.title);parent=r.parent;}
  const submenus=[...catalog.resources.values()].filter(r=>r.parent===o.page&&isMenu(r)&&(!o.preview||(menuNodes.has(r.key)?visible(menuNodes.get(r.key)!,true):o.value(r.key)!=='hidden')));
  let lastSection='';
  const categories=groups.map(g=>{const section=g.section!==lastSection?`<h4>${esc(g.section)}</h4>`:'';lastSection=g.section;return `${section}<button type="button" data-group="${esc(g.id)}" class="${g.id===active?.id?'active':''}">${esc(g.title)}</button>`}).join('');
  const table=(title:string,rows:string)=>`<table><thead><tr><th>${title}</th><th>${o.preview?'效果':'授权'}</th></tr></thead><tbody>${rows}</tbody></table>`;
  const unifiedRow=(a:AuthorizationRow):string=>{
    const content=catalog.resources.get(a.contentKey)!,selection=authorizationSelection(a,o.own),blocked=!!content.parent&&o.value(content.parent)==='hidden';
    const effective=o.value(a.contentKey)==='hidden'?'hidden':a.editKeys.every(k=>o.value(k)==='edit')?'edit':'read';
    const label=effective==='hidden'?'不可见':effective==='edit'?'可编辑':'可见不可编辑';
    const choices:[Access|'inherit',string][]=[['hidden','不可见'],['read','可见不可编辑'],['edit','可编辑']];if(o.staff)choices.unshift(['inherit','跟随角色']);
    const name=o.preview&&effective!=='edit'?esc(a.title):actionTitle({...content,title:a.title,help:a.help});
    const result=o.preview?`<span class="pc-content-sample">${esc(content.previewValue)}</span><span class="pc-tag">${label}</span>${effective==='edit'?`<button type="button" data-demo >${esc(a.editTitle)}</button>`:''}`:o.readonly?`<span class="pc-tag">${label}</span>`:`<div class="pc-segment" role="group" aria-label="${esc(a.title)}授权">${choices.map(([v,l])=>`<button type="button" data-authorization="${esc(a.contentKey)}" data-value="${v}" aria-pressed="${selection===v}" ${blocked?'disabled title="上级导航不可查看"':''}>${l}</button>`).join('')}</div>${selection==='mixed'?'<small class="pc-muted">部分配置，需复核</small>':''}`;
    return `<tr><th scope="row">${name}</th><td>${result}</td></tr>`;
  };
  const authorizationBody=shownContents.map(r=>unifiedByContent.has(r.key)?unifiedRow(unifiedByContent.get(r.key)!):row(r)).join('')+shownActions.filter(r=>!mergedActions.has(r.key)).map(row).join('');
  const categoryHasAuthorization=contents.some(r=>inCategory(r.key))||actions.some(r=>inCategory(r.key));
  const authorizationSection=categoryHasAuthorization?`<h3>功能授权</h3>${o.preview&&shownContents.length?'<p class="pc-muted">以下为示例内容，不读取真实业务数据。</p>':''}${authorizationBody?table('功能 / 内容',authorizationBody):'<p class="pc-empty">没有可显示的内容或可操作功能</p>'}`:'';
  const settingKeys=active?.keys.filter(k=>catalog.resources.get(k)?.type==='setting')??[];
  const categoryBody=pageSections?`${active?`<h3>${esc(active.title)}</h3>`:'<p class="pc-empty">没有可显示的分类</p>'}${authorizationSection}${settingKeys.length?table('功能设置项',settingKeys.filter(k=>!o.preview||o.value(k)!=='hidden').map(k=>row(catalog.resources.get(k)!)).join('')):''}`:`${authorizationSection}${active?table('功能设置项',active.keys.filter(k=>!o.preview||o.value(k)!=='hidden').map(k=>row(catalog.resources.get(k)!)).join('')):'<p class="pc-empty">没有可显示的设置项</p>'}`;
  const body=!page || o.preview&&o.value(o.page)==='hidden' ? '<div class="pc-empty">请选择可查看的页面</div>' : `<header class="pc-detail-heading"><div><small>${esc(ancestors.join(' / '))}</small><h2>${esc(page.title)}</h2></div>${!o.preview&&!o.readonly&&(page.type!=='page'||allGroups.length||actions.length||contents.length)?control(page):menuStatus(page.key)}</header>${page.type==='module'||page.type==='navigation'?`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="子导航查看权限"><h3>子导航查看权限</h3>${table('子导航',submenus.map(row).join('')||'<tr><td colspan="2" class="pc-empty">没有可显示的子导航</td></tr>')}</div>`:allGroups.length ? `<div class="pc-settings"><nav class="pc-categories" data-scroll="categories" tabindex="0" aria-label="${pageSections?'休息与加班分类':'设置分类'}">${categories}</nav><div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="功能设置项">${categoryBody}</div></div>`:`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="功能授权">${authorizationSection}${!contents.length&&!actions.length?table('页面功能',row({...page,title:'查看页面'})):''}</div>`}`;
  return `<div class="pc-editor"><aside class="pc-tree" data-scroll="tree"><label class="pc-search">搜索菜单<input data-menu-search aria-label="搜索菜单" value="${esc(o.search)}" placeholder="搜索菜单名称"></label>${tree(catalog.tree)||'<p class="pc-empty">没有可显示的菜单</p>'}</aside><section class="pc-detail" data-scroll="detail">${body}</section></div>`;
}
