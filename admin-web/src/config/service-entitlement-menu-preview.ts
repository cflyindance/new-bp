import { ensurePublishedSubscriptionMenuTree, filterSubscriptionMenuTree, getPublishedSubscriptionMenuTree, type SubscriptionMenuTreeNode } from './subscription-published-menu-tree';
import { readSubscriptionServiceSnapshot } from './subscription-service-store';
import { showAppToast } from '../ui/app-toast';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** Only bound nodes and their structural ancestors; never include unbound siblings. */
export function serviceMenuPreviewRoots(nodes:SubscriptionMenuTreeNode[],ids:Set<string>):SubscriptionMenuTreeNode[] {
  return nodes.flatMap(node=>{
    const children=serviceMenuPreviewRoots(node.children,ids);
    return ids.has(node.routeNodeId)||children.length?[{...node,children}]:[];
  });
}
function renderNode(node:SubscriptionMenuTreeNode):string {
  const content=`<span>${esc(node.title)}</span>`;
  return node.children.length?`<details open style="padding:8px 0"><summary style="cursor:pointer">${content}</summary><div style="margin:8px 0 0 12px;padding-left:18px;border-left:1px solid var(--color-border)">${node.children.map(n=>renderNode(n)).join('')}</div></details>`:`<div style="padding:10px 0">${content}</div>`;
}
let active:HTMLDialogElement|undefined;
export async function openServiceMenuPreview(packageId:string):Promise<void> {
  try{await ensurePublishedSubscriptionMenuTree();}catch{showAppToast('菜单目录加载失败，请稍后重试。');return;}
  // Read after loading: previews always use the current published service release.
  const snapshot=readSubscriptionServiceSnapshot(),pkg=snapshot.packages.find(p=>p.id===packageId),release=snapshot.releases.find(r=>r.id===pkg?.activeReleaseId);
  if(!pkg){showAppToast('服务不存在，请刷新页面。');return;}
  active?.close();
  const d=document.createElement('dialog');active=d;d.className='ba ba-modal ba-admin-dialog ba-store-effective';d.setAttribute('aria-label',pkg.name+' · 菜单');d.dataset.serviceMenuPreview='';
  const tree=getPublishedSubscriptionMenuTree(),ids=new Set(release?.routeNodeIds??[]),roots=serviceMenuPreviewRoots(tree?.roots??[],ids);
  const known=new Set<string>();const collect=(nodes:SubscriptionMenuTreeNode[])=>nodes.forEach(n=>{known.add(n.routeNodeId);collect(n.children)});collect(roots);
  const missing=[...ids].filter(id=>!known.has(id));
  d.innerHTML=`<div class="ba-dialog-inner"><header class="ba-dialog-header"><h2>${esc(pkg.name)} · 菜单</h2><button type="button" class="ba-btn" data-menu-preview-close aria-label="关闭">×</button></header><section class="ba-dialog-body"><label class="ba-field" style="margin:16px 0">搜索菜单<input type="search" data-menu-preview-search placeholder="输入菜单名称" aria-label="搜索菜单"></label>${missing.length?`<p class="ba-note">${missing.length} 个配置节点不在当前已发布菜单目录中，请到服务包管理核对。</p>`:''}<div data-menu-preview-tree></div></section><footer class="ba-footer" style="justify-content:flex-end"><button type="button" class="ba-btn" data-menu-preview-close>关闭</button></footer></div>`;
  const host=d.querySelector<HTMLElement>('[data-menu-preview-tree]')!;
  const render=(query='')=>{const filtered=filterSubscriptionMenuTree(roots,query);host.innerHTML=filtered.map(n=>renderNode(n)).join('')||`<p class="ba-empty">${query?'没有匹配的菜单':release?'暂无可展示菜单':'暂无已发布菜单'}</p>`;};render();
  d.querySelector<HTMLInputElement>('[data-menu-preview-search]')!.oninput=e=>render((e.target as HTMLInputElement).value);
  const close=()=>{if(d.open)d.close();d.remove();window.removeEventListener('hashchange',close);if(active===d)active=undefined;};
  d.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}},true);
  d.querySelectorAll('[data-menu-preview-close]').forEach(b=>b.addEventListener('click',close));d.addEventListener('close',close,{once:true});d.addEventListener('cancel',e=>{e.preventDefault();close()});
  d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  document.body.append(d);d.showModal();window.addEventListener('hashchange',close);
}
