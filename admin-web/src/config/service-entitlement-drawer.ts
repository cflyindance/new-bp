import './service-entitlement-drawer.css';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
let active:{root:HTMLElement;close:()=>void}|undefined;

/** Move the existing nodes so record-level handlers and permission checks survive. */
export function openEntitlementDrawer(root:HTMLElement,trigger:HTMLButtonElement):void {
 active?.close();
 const row=trigger.closest('tbody'),content=row?.querySelector<HTMLElement>('[data-rights-detail-content]');if(!row||!content)return;
 const anchor=content.parentElement!,name=row.querySelector('[data-ent-menu],strong')?.textContent??'服务';
 const scrollHost=(()=>{let n=root.parentElement;while(n){if(['auto','scroll'].includes(getComputedStyle(n).overflowY))return n;n=n.parentElement;}return document.scrollingElement as HTMLElement;})(),position=scrollHost.scrollTop;
 const d=document.createElement('dialog');d.className='ba ba-modal ba-admin-dialog ba-rights-drawer';d.dataset.rightsDrawer='';d.setAttribute('aria-labelledby','rights-drawer-title');
 d.innerHTML=`<div class="ba-dialog-inner"><header class="ba-dialog-header"><div><h2 id="rights-drawer-title">${esc(name)} · 历史权益</h2></div><button type="button" class="ba-btn" data-rights-drawer-close aria-label="关闭历史权益">×</button></header><section class="ba-dialog-body"></section><footer class="ba-footer" style="justify-content:flex-end"><button type="button" class="ba-btn" data-rights-drawer-close>关闭</button></footer></div>`;
 d.querySelector('.ba-dialog-body')!.append(content);
 let closed=false;
 const observer=new MutationObserver(()=>{if(!root.isConnected)close();});
 const close=()=>{if(closed)return;closed=true;observer.disconnect();document.querySelectorAll<HTMLDialogElement>('dialog[data-rights-drawer-child][open]').forEach(child=>child.close());if(d.open)d.close();anchor.append(content);d.remove();window.removeEventListener('hashchange',close);if(active?.root===root)active=undefined;if(root.isConnected){scrollHost.scrollTop=position;if(trigger.isConnected)trigger.focus({preventScroll:true});}};
 active={root,close};
 d.querySelectorAll('[data-rights-drawer-close]').forEach(b=>b.addEventListener('click',close));d.addEventListener('close',close,{once:true});d.addEventListener('cancel',e=>{e.preventDefault();close();});
 d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
 document.body.append(d);d.showModal();observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',close);
}

/** Successful mutations remount the list; never leave stale record controls open. */
export function closeDetachedEntitlementDrawer(root:HTMLElement):void {
 if(active&&(!active.root.isConnected||active.root!==root))active.close();
}
