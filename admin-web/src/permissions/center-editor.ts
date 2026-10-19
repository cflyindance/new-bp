import { categoryGrantValue, categorySettingKeys } from './center-category-grants';
import type { Access, Resource } from './center-domain';
import type { Catalog, MenuNode } from './center-catalog';
import { authorizationRows, authorizationSelection, type AuthorizationRow } from './center-authorization';
import { resourceOwn } from './center-employee-pages';
import {pagePolicy} from './center-page-policy';
import {settingCategoryGate} from './center-setting-levels';
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
  const menuStatus=(key:string):string=>`<span class="pc-tag" data-menu-access="${o.value(key)}">${o.value(key)==='hidden'?'不可见':'可见'}</span>`;
  const tree = (nodes:MenuNode[],ancestorMatch=false):string => nodes.filter(n=>visible(n,ancestorMatch)).map(n=> {
    const matches=ancestorMatch||!o.search||n.title.toLowerCase().includes(o.search.toLowerCase());
    return n.children.length ? `<details data-menu-node="${esc(n.id)}" open><summary class="pc-tree-menu-row">${n.key?`<button type="button" class="pc-tree-group-label ${o.page===n.key?'active':''}" data-page="${esc(n.key)}" title="${esc(n.title)}">${esc(n.title)}</button>`:`<span class="pc-tree-group-label" title="${esc(n.title)}">${esc(n.title)}</span>`}${n.key&&!o.preview?`<span class="pc-menu-controls">${o.readonly?menuStatus(n.key):control(catalog.resources.get(n.key)!,true)}</span>`:''}</summary><div class="pc-tree-children">${tree(n.children,matches)}</div></details>` : `<button type="button" class="pc-tree-item ${o.page===n.key?'active':''}" data-page="${esc(n.key)}">${esc(n.title)}</button>`;
  }).join('');
  function control(resource:Resource, compact=false): string {
    const vals: [Access|'inherit',string][] = resource.type==='action' ? [['hidden','禁止'],['edit','允许']] : resource.type==='setting' ? [['hidden',resource.path==='/team/shift-scheduling/rules'?'不可见':'隐藏'],['read','可见不可编辑'],['edit','可编辑']] : resource.type==='content'||resource.type==='field' ? [['hidden','不可见'],['read','可见']] : [['hidden','不可查看'],['read','可查看']];
    if(resource.type==='setting')vals[0][1]='不可见';
    if(['module','navigation','page'].includes(resource.type)){vals[0][1]='不可见';vals[1][1]='可见';}
    if(o.staff) vals.unshift(['inherit','跟随角色']);
    const ownSelection=resource.defaultAccess&&o.own(resource.key)==='hidden'&&o.value(resource.key)!=='hidden'?o.value(resource.key):resourceOwn(resource,o.own);
    const selection=resource.parent===o.page&&catalog.resources.get(o.page)?.pageContentKeys&&o.own(o.page)==='hidden'&&!['hidden','inherit'].includes(ownSelection)?'mixed':ownSelection;
    const parentBlocked=!!resource.parent && (resource.parent===o.page&&catalog.resources.get(o.page)?.pageContentKeys?!!catalog.resources.get(o.page)?.parent&&o.value(catalog.resources.get(o.page)!.parent!)==='hidden':o.value(resource.parent)==='hidden');
    const contentBlocked=resource.requires?.some(k=>o.value(k)==='hidden');
    const blocked=parentBlocked||contentBlocked||resource.ceilingKeys?.some(k=>o.value(k)==='hidden');
    const editBlocked=resource.ceilingKeys?.some(k=>o.value(k)!=='edit');
    const tag=compact?'span':'div';
    const reason=parentBlocked?(catalog.resources.get(resource.parent!)?.type==='content'?'所属内容不可见':'上级导航不可查看'):'所需页面内容不可见';
return `<${tag} class="pc-segment" role="group" aria-label="${esc(resource.title)}权限">${vals.map(([v,l])=>`<button type="button" data-grant="${esc(resource.key)}" data-value="${v}" aria-pressed="${selection===v}" ${blocked?`disabled title="${reason}"`:v==='edit'&&editBlocked?'disabled title="上级只读或不可见，不能配置可编辑"':''}>${l}</button>`).join('')}</${tag}>${selection==='mixed'?'<small class="pc-muted">部分配置，需复核</small>':''}${selection==='edit'&&editBlocked?'<small class="pc-muted">原可编辑配置已保留，当前受上级权限限制。</small>':''}`;
  }
  const page=catalog.resources.get(o.page),pageSections=catalog.sections?.get(o.page),allGroups=pageSections??catalog.groups.get(o.page)??[], groups=allGroups.filter(g=>!o.preview || g.keys.some(k=>o.value(k)!=='hidden'));
  const policy=page?.type==='page'?pagePolicy(catalog,o.page):undefined;
  const active=groups.find(g=>g.id===o.group)??groups[0];
  const actions=[...catalog.resources.values()].filter(r=>r.parent===o.page&&r.type==='action');
  const contents=[...catalog.resources.values()].filter(r=>!r.compatibilityOnly&&((r.type==='content'&&r.parent===o.page)||(r.type==='field'&&catalog.resources.get(r.parent??'')?.parent===o.page)));
  const inCategory=(key:string)=>!pageSections||!!active?.keys.includes(key);
  const shownActions=actions.filter(r=>inCategory(r.key)&&(!o.preview||o.value(r.key)==='edit'));
  const shownContents=contents.filter(r=>inCategory(r.key)&&(!o.preview||o.value(r.key)!=='hidden'));
  const unified=authorizationRows(catalog,o.page),unifiedByContent=new Map(unified.map(r=>[r.contentKey,r]));
  const mergedContents=new Set(unified.flatMap(r=>r.additionalContentKeys??[]));
  const mergedActions=new Set(unified.flatMap(r=>r.editKeys));
  const accessLabel=(r:Resource):string=>o.value(r.key)==='hidden'?'不可操作':o.value(r.key)==='edit'?'可操作':'仅查看';
  const isMenu=(r:Resource)=>r.type==='module'||r.type==='navigation'||r.type==='page';
  const actionTitle=(r:Resource):string=>{
    if(!r.help)return esc(r.title);
    const id=`pc-help-${o.preview?'preview':o.readonly?'readonly':'editor'}-${encodeURIComponent(r.key)}`;
    return `<span class="pc-action-name">${esc(r.title)}<span class="pc-help"><button type="button" class="pc-help-trigger" aria-label="${esc(r.title)}权限说明" aria-describedby="${esc(id)}">?</button><span class="pc-help-text" role="tooltip" id="${esc(id)}">${esc(r.help)}</span></span></span>`;
  };
  const isContent=(r:Resource)=>r.type==='content'||r.type==='field';
  const row=(r:Resource)=>`<tr${r.type==='field'?' class="pc-content-field"':''}><th scope="row">${r.type==='field'?`<small>敏感字段 · ${esc(catalog.resources.get(r.parent??'')?.title)}</small><br>`:''}${actionTitle(r)}</th><td>${o.preview ? isMenu(r)?menuStatus(r.key):isContent(r)?`<span class="pc-content-sample">${esc(r.previewValue??'内容示意')}</span>`:r.type==='action'?`<button type="button" data-demo >${esc(r.title)}</button>`:`<span class="pc-tag">${o.value(r.key)==='edit'?'可编辑':'只读'}</span>${o.value(r.key)==='edit'?'<button type="button" data-demo >编辑</button>':''}` : o.readonly ? isMenu(r)?menuStatus(r.key):isContent(r)?`<span class="pc-tag">${o.value(r.key)==='hidden'?'不可见':'可见'}</span>`:`<span class="pc-tag">${accessLabel(r)}</span>`:r.type==='page'&&r.pageContentKeys?`${menuStatus(r.key)} <button type="button" data-page="${esc(r.key)}">配置权限</button>`:control(r)}</td></tr>`;
  const ancestors:string[]=[];let parent=page?.parent;const seen=new Set<string>();
  while(parent&&!seen.has(parent)){seen.add(parent);const r=catalog.resources.get(parent);if(!r)break;ancestors.unshift(r.title);parent=r.parent;}
const submenus=[...catalog.resources.values()].filter(r=>r.parent===o.page&&!r.compatibilityOnly&&isMenu(r)&&(!o.preview||(menuNodes.has(r.key)?visible(menuNodes.get(r.key)!,true):o.value(r.key)!=='hidden')));
  let lastSection='';
  const categories=groups.map(g=>{const section=g.section!==lastSection?`<h4>${esc(g.section)}</h4>`:'';lastSection=g.section;return `${section}<button type="button" data-group="${esc(g.id)}" class="${g.id===active?.id?'active':''}">${esc(g.title)}</button>`}).join('');
  const table=(title:string,rows:string)=>`<table><thead><tr><th>${title}</th><th>${o.preview?'效果':'授权'}</th></tr></thead><tbody>${rows}</tbody></table>`;
  const unifiedRow=(a:AuthorizationRow,compact=false):string=>{
    const content=catalog.resources.get(a.contentKey)!;
    const conflict=o.own(o.page)==='hidden'&&[a.contentKey,...(a.additionalContentKeys??[])].some(k=>o.own(k)==='read');
    const selection=conflict?'mixed':authorizationSelection(a,o.own);
    const blocked=!!content.parent&&(content.parent===o.page&&page?.pageContentKeys?!!page.parent&&o.value(page.parent)==='hidden':o.value(content.parent)==='hidden');
    const editBlocked=[content,...a.editKeys.map(k=>catalog.resources.get(k)!)].some(r=>r.ceilingKeys?.some(k=>o.value(k)!=='edit'));
    const effective=o.value(a.contentKey)==='hidden'?'hidden':a.editKeys.every(k=>o.value(k)==='edit')?'edit':a.mode==='visibility'?'hidden':'read';
    const label=effective==='hidden'?'不可见':a.mode==='visibility'?'可见':effective==='edit'?'可编辑':'可见不可编辑';
    const choices:[Access|'inherit',string][]=a.mode==='visibility'?[['hidden','不可见'],['read','可见']]:[['hidden','不可见'],['read','可见不可编辑'],['edit','可编辑']];if(o.staff)choices.unshift(['inherit','跟随角色']);
    const name=o.preview&&effective!=='edit'?esc(a.title):actionTitle({...content,title:a.title,help:a.help});
    const result=o.preview?`<span class="pc-content-sample">${esc(content.previewValue)}</span><span class="pc-tag">${label}</span>${effective==='edit'?`<button type="button" data-demo >${esc(a.editTitle)}</button>`:''}`:o.readonly?`<span class="pc-tag">${label}</span>`:`<div class="pc-segment" role="group" aria-label="${esc(a.title)}授权">${choices.map(([v,l])=>`<button type="button" data-authorization="${esc(a.contentKey)}" data-value="${v}" aria-pressed="${selection===v}" ${blocked?'disabled title="上级导航不可查看"':editBlocked&&(v==='edit'||a.mode==='visibility'&&v==='read')?'disabled title="上级只读或不可见，不能配置可编辑"':''}>${l}</button>`).join('')}</div>${selection==='mixed'?'<small class="pc-muted">部分配置，需复核</small>':''}`;
    return compact?`<div class="pc-page-authorization">${o.preview&&effective!=='edit'?'':actionTitle({...content,title:a.editTitle,help:a.help})}${result}</div>`:`<tr><th scope="row">${name}</th><td>${result}</td></tr>`;
  };
  const visibleContents=shownContents.filter(r=>!mergedContents.has(r.key)&&r.key!==policy?.row?.contentKey).filter(r=>!o.preview||unifiedByContent.get(r.key)?.mode!=='visibility'||unifiedByContent.get(r.key)!.editKeys.every(k=>o.value(k)==='edit'));
  const sensitive=(r:Resource)=>o.page==='page:/team/payroll-report'&&r.type==='field';
  const authorizationBody=visibleContents.filter(r=>!sensitive(r)).map(r=>unifiedByContent.has(r.key)?unifiedRow(unifiedByContent.get(r.key)!):row(r)).join('')+shownActions.filter(r=>!mergedActions.has(r.key)).map(row).join('');
  const sensitiveBody=visibleContents.filter(sensitive).map(row).join('');
  const categoryHasAuthorization=visibleContents.length>0||shownActions.some(r=>!mergedActions.has(r.key));
  const authorizationSection=categoryHasAuthorization?`<h3>功能授权</h3>${o.preview&&shownContents.length?'<p class="pc-muted">以下为示例内容，不读取真实业务数据。</p>':''}${authorizationBody?table('功能 / 内容',authorizationBody):'<p class="pc-empty">没有可显示的内容或可操作功能</p>'}${sensitiveBody?'<h3>敏感字段权限</h3>'+table('敏感字段',sensitiveBody):''}`:'';
  const settingKeys=active?.keys.filter(k=>catalog.resources.get(k)?.type==='setting')??[];
  const categoryBody=pageSections?`${active?`<h3>${esc(active.title)}</h3>`:'<p class="pc-empty">没有可显示的分类</p>'}${authorizationSection}${settingKeys.length?table('功能设置项',settingKeys.filter(k=>!o.preview||o.value(k)!=='hidden').map(k=>row(catalog.resources.get(k)!)).join('')):''}`:`${authorizationSection}${active?table('功能设置项',active.keys.filter(k=>!o.preview||o.value(k)!=='hidden').map(k=>row(catalog.resources.get(k)!)).join('')):'<p class="pc-empty">没有可显示的设置项</p>'}`;
  const flatStorePage=!page?.settingPageGate&&['/stores/profile','/stores/hours','/team/breaks-overtime/custom-breaks','/team/breaks-overtime/overtime-rules','/team/shift-scheduling/rules'].includes(page?.path??'');
  const flatKeys=[...new Set(groups.flatMap(g=>g.keys))].filter(k=>!o.preview||o.value(k)!=='hidden');
  const categoryKeys=active?categorySettingKeys(catalog,o.page,active.id):[];
  const categorySelection=categoryGrantValue(catalog,categoryKeys,o.own);
  const categoryBlocked=!!page&&(page.pageContentKeys?!!page.parent&&o.value(page.parent)==='hidden':o.value(page.key)==='hidden');
    const categoryChoices:[Access|'inherit',string][]=[['hidden','不可见'],['read','可见不可编辑'],['edit','可编辑']];
  if(o.staff)categoryChoices.unshift(['inherit','跟随角色']);
  const categoryGate=active&&page?.settingPageGate?catalog.resources.get(settingCategoryGate(o.page,active.id)):undefined;
  const categoryControls=categoryGate?`<div class="pc-category-controls"><p class="pc-muted">本分类权限上限</p>${o.preview||o.readonly?`<span class="pc-tag">${o.value(categoryGate.key)==='hidden'?'不可见':o.value(categoryGate.key)==='edit'?'可编辑':'可见不可编辑'}</span>`:control(categoryGate)}</div>`:categoryKeys.length&&!o.preview&&!o.readonly?`<div class="pc-category-controls"><p class="pc-muted">批量设置本分类</p><div class="pc-segment" role="group" aria-label="${esc(active!.title)}分类权限">${categoryChoices.map(([v,l])=>`<button type="button" data-category-grant="${esc(active!.id)}" data-value="${v}" aria-pressed="${categorySelection===v}" ${categoryBlocked?'disabled title="上级页面不可查看"':''}>${l}</button>`).join('')}</div>${categorySelection==='mixed'?'<small class="pc-muted">部分配置，逐项权限见下方</small>':''}</div>`:'';
  const settingsLayout=flatStorePage
    ? `<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="功能设置项">${flatKeys.length?table('功能设置项',flatKeys.map(k=>row(catalog.resources.get(k)!)).join('')):'<p class="pc-empty">没有可显示的设置项</p>'}</div>`
    : `<div class="pc-settings"><nav class="pc-categories" data-scroll="categories" tabindex="0" aria-label="${pageSections?esc(page?.title)+'分类':'设置分类'}">${categories}</nav><div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="功能设置项">${categoryControls}${categoryBody}</div></div>`;
  const headerControls=page?.settingPageGate?o.preview||o.readonly?`<span class="pc-tag">${o.value(page.settingPageGate)==='hidden'?'不可见':o.value(page.settingPageGate)==='edit'?'可编辑':'可见不可编辑'}</span>`:control(catalog.resources.get(page.settingPageGate)!):policy?.row?unifiedRow(policy.row,true):policy?.kind==='single'
    ? policy.row?unifiedRow(policy.row,true):!o.preview&&!o.readonly?control(policy.setting!):`<span class="pc-tag">${o.value(policy.setting!.key)==='hidden'?'不可见':o.value(policy.setting!.key)==='edit'?'可编辑':'可见不可编辑'}</span>`
    : page?.type!=='page'||policy?.kind==='complex'||o.preview||o.readonly?menuStatus(o.page):page?control(page):'';
  let blockedAncestor:Resource|undefined,ancestorKey=page?.parent;const checkedAncestors=new Set<string>();
  while(ancestorKey&&!checkedAncestors.has(ancestorKey)){checkedAncestors.add(ancestorKey);const r=catalog.resources.get(ancestorKey);if(!r)break;if(o.value(r.key)==='hidden')blockedAncestor=r;ancestorKey=r.parent;}
  const ancestorNotice=!o.preview&&blockedAncestor?`<p class="pc-muted" role="status">上级“${esc(blockedAncestor.title)}”不可见，配置已保留，暂不生效。</p>`:'';
  const legacyNotice=!o.preview&&policy?.coreKeys.some(k=>['read','edit'].includes(o.own(k)))&&o.own(o.page)==='hidden'?'<p class="pc-muted" role="status">历史页面权限关闭，与内容配置不一致，需复核；请重新选择核心授权。</p>':'';
  const singleBody=!page?.settingPageGate&&policy?.kind==='single'?`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="${policy.setting?'功能设置项':'页面权限说明'}">${policy.setting&&policy.setting.title!==page?.title?`<h3>${esc(policy.setting.title)}</h3>`:''}<p class="pc-muted">${esc(policy.row?.help??'不可见：隐藏页面及内容；可见不可编辑：仅查看；可编辑：允许编辑。')}</p></div>`:undefined;
const body=!page || o.preview&&o.value(o.page)==='hidden' ? '<div class="pc-empty">请选择可查看的页面</div>' : `<header class="pc-detail-heading"><div><small>${esc(ancestors.join(' / '))}</small><h2>${esc(page.title)}</h2></div>${headerControls}</header>${ancestorNotice}${legacyNotice}${page.type==='module'||page.type==='navigation'?`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="子导航查看权限"><h3>子导航查看权限</h3>${table('子导航',submenus.map(row).join('')||'<tr><td colspan="2" class="pc-empty">没有可显示的子导航</td></tr>')}</div>`:singleBody??(allGroups.length ? settingsLayout:`<div class="pc-setting-items" data-scroll="settings" tabindex="0" role="region" aria-label="功能授权">${authorizationSection}</div>`)}`;
  return `<div class="pc-editor"><aside class="pc-tree" data-scroll="tree"><label class="pc-search">搜索菜单<input data-menu-search aria-label="搜索菜单" value="${esc(o.search)}" placeholder="搜索菜单名称"></label>${tree(catalog.tree)||'<p class="pc-empty">没有可显示的菜单</p>'}</aside><section class="pc-detail" data-scroll="detail">${body}</section></div>`;
}
