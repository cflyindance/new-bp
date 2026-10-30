import {templateDialog,templateEsc as esc} from './business-menu-template-ui';
import {readSubscriptionServiceSnapshot} from './subscription-service-store';
import {getSubscriptionRouteCatalog,type ServicePackageRelease} from './subscription-service-domain';
import {getPublishedSubscriptionMenuTree,flattenSubscriptionMenuTree,type SubscriptionMenuTreeNode} from './subscription-published-menu-tree';
import {serviceMenuPreviewRoots} from './service-entitlement-menu-preview';
import './service-package-version-preview.css';
interface VersionNode {id:string;title:string;selected:boolean;children:VersionNode[]}
export function versionMenuNodes(release:ServicePackageRelease):VersionNode[]{
 const ids=new Set(release.routeNodeIds),tree=getPublishedSubscriptionMenuTree(),known=new Set(flattenSubscriptionMenuTree(tree?.roots??[]).map(n=>n.routeNodeId));
 const adapt=(n:SubscriptionMenuTreeNode):VersionNode=>({id:n.routeNodeId,title:n.title,selected:ids.has(n.routeNodeId),children:n.children.map(adapt)});
 const roots=serviceMenuPreviewRoots(tree?.roots??[],ids).map(adapt),legacy=getSubscriptionRouteCatalog(),groups=new Map<string,VersionNode>();
 for(const id of ids){if(known.has(id))continue;const item=legacy.find(n=>n.id===id);if(item){let group=groups.get(item.moduleId);if(!group){group={id:'legacy-'+item.moduleId,title:item.moduleTitle,selected:false,children:[]};groups.set(item.moduleId,group);}group.children.push({id,title:item.title,selected:true,children:[]});}else{let group=groups.get('unknown');if(!group){group={id:'unknown-history',title:'未识别的历史菜单',selected:false,children:[]};groups.set('unknown',group);}group.children.push({id,title:'历史菜单（名称未留存）',selected:true,children:[]});}}
 return [...roots,...groups.values()];
}
const filter=(nodes:VersionNode[],q:string):VersionNode[]=>nodes.flatMap(n=>{const children=filter(n.children,q);return !q||n.title.toLocaleLowerCase().includes(q)?[n]:children.length?[{...n,children}]:[];});
const count=(n:VersionNode):number=>(n.selected?1:0)+n.children.reduce((sum,c)=>sum+count(c),0);
const nodeHtml=(n:VersionNode):string=>n.children.length?`<details open data-version-node="${esc(n.id)}"><summary><span>${esc(n.title)}</span><small>${count(n)} 项</small></summary><div class="version-tree-children">${n.children.map(nodeHtml).join('')}</div></details>`:`<div class="version-tree-leaf" data-version-node="${esc(n.id)}"><span aria-hidden="true">•</span>${esc(n.title)}</div>`;
const date=(v:string)=>Number.isFinite(Date.parse(v))?new Date(v).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'未记录';
function standardPrice(r:ServicePackageRelease){if(!Number.isSafeInteger(r.priceMinor)||r.priceMinor<0)return '未记录';if(r.commercial?.chargeType==='free'&&r.priceMinor===0)return '免费';try{return new Intl.NumberFormat('zh-CN',{style:'currency',currency:r.currency}).format(r.priceMinor/100);}catch{return `${(r.priceMinor/100).toFixed(2)} ${r.currency||'币种未记录'}`;}}
let active:HTMLDialogElement|undefined;
export function openServiceVersionPreview(packageId:string,releaseId:string):void{
 const snapshot=readSubscriptionServiceSnapshot(),pkg=snapshot.packages.find(p=>p.id===packageId),release=snapshot.releases.find(r=>r.id===releaseId&&r.packageId===packageId);if(!pkg||!release)return;
 active?.close();const trigger=document.activeElement as HTMLElement|null,nodes=versionMenuNodes(release),ids=new Set(release.routeNodeIds),current=pkg.activeReleaseId===release.id;
 const interval=({month:'月',quarter:'季度',year:'年','one-time':'一次性'} as Record<string,string>)[release.billingInterval]??'周期未记录',unit=release.commercial?.billingUnit==='brand'?'品牌':release.commercial?.billingUnit==='store'?'门店':'';
 const d=templateDialog('版本详情',`<div class="version-preview-heading"><div><h3>${esc(release.name)}</h3><span class="version-number">v${release.version}</span></div><span class="version-state${current?' current':''}">${current?'当前版本':'历史版本'}</span></div><dl class="version-preview-facts"><div><dt>发布时间</dt><dd>${esc(date(release.publishedAt))}</dd></div><div><dt>标准价格</dt><dd>${esc(standardPrice(release))}<small>${unit?' / '+unit:''}${interval==='一次性'?' · 一次性':' / '+esc(interval)}</small></dd></div><div><dt>发布人</dt><dd>${esc(release.publishedBy||'未记录')}</dd></div></dl><section class="version-preview-menus"><div class="version-menu-heading"><h3>版本菜单 <span>${ids.size}</span></h3><div><button type="button" class="ba-btn" data-version-expand>展开全部</button><button type="button" class="ba-btn" data-version-collapse>收起全部</button></div></div><label class="version-preview-search"><span class="sr-only">搜索版本菜单</span><input type="search" data-version-search aria-label="搜索版本菜单" placeholder="搜索菜单名称"></label>${nodes.some(n=>n.id==='unknown-history')?'<p class="version-history-note">部分历史菜单名称未留存，仍保留原版本绑定记录。</p>':''}<div class="version-menu-tree" data-version-tree></div></section>`);
 active=d;d.dataset.serviceVersionPreview='';d.classList.add('service-version-preview');d.querySelector('footer')!.classList.add('version-preview-footer');
 const host=d.querySelector<HTMLElement>('[data-version-tree]')!;const render=(q='')=>{host.innerHTML=filter(nodes,q.trim().toLocaleLowerCase()).map(nodeHtml).join('')||`<p class="ba-empty">${q?'没有匹配的菜单':'该版本未配置菜单'}</p>`;};render();
 d.querySelector<HTMLInputElement>('[data-version-search]')!.oninput=e=>render((e.target as HTMLInputElement).value);
 d.querySelector('[data-version-expand]')!.addEventListener('click',()=>host.querySelectorAll('details').forEach(n=>n.open=true));d.querySelector('[data-version-collapse]')!.addEventListener('click',()=>host.querySelectorAll('details').forEach(n=>n.open=false));
 d.addEventListener('close',()=>{if(active===d)active=undefined;if(trigger?.isConnected)trigger.focus({preventScroll:true});},{once:true});
}
