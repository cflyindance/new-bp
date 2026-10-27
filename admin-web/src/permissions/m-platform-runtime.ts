import { bindNavigationSubmenuActions } from '../shell/navigation-submenu-actions';
import { M_MODULES, M_PAGES, mPageForPath, mPageKey, mModuleKey, mActionKey, type MModule } from './m-platform-catalog';
import { currentMAccess, currentMAccount } from './m-platform-store';
import { groupMNavigation } from './m-platform-navigation';
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function mCanVisit(path: string): boolean {
  const page = mPageForPath(path);
  if (!page || currentMAccess(mPageKey(page.id)) === 'hidden') return false;
  if (/\/(new|create)(\/|$)/.test(path) || /\/edit(\/|$)/.test(path) && !['roles', 'presets', 'routing'].includes(page.id)) {
    if (currentMAccess(mPageKey(page.id)) !== 'edit') return false;
    if (page.id === 'roles' && path.endsWith('/new')) return currentMAccess(mActionKey('roles', 'create')) === 'edit';
    if (page.id === 'services' && path.endsWith('/create')) return currentMAccess(mActionKey('services', 'create')) === 'edit';
  }
  return true;
}
export function mDenied(): string {
  return `<section class="mp-denied" role="alert"><h1>暂无 M 平台访问权限</h1><p>${currentMAccount()?.enabled === false ? '该服务商员工账号已停用。' : '请联系服务商管理员，为当前员工分配具有相应菜单权限的角色。'}</p><p class="mt-4"><a href="#/nav-home" class="text-primary">返回商家后台</a></p></section>`;
}
export function renderMNavigation(path: string): string {
  const modules = groupMNavigation(M_MODULES.map(module => ({ ...module, pages: module.pages.filter(p => currentMAccess(mPageKey(p.id)) !== 'hidden') })).filter(module => module.pages.length && currentMAccess(mModuleKey(module.id)) !== 'hidden'));
  const hasChildren = (module: MModule) => module.id === 'activity-analysis' || (M_MODULES.find(original => original.id === module.id)?.pages.length ?? module.pages.length) > 1 || module.id === 'permissions';
  const active = mPageForPath(path);
  const activeModuleId = modules.find(module => module.pages.some(page => page.id === active?.id))?.id;
  const hasLayer = modules.some(module => module.id === activeModuleId && hasChildren(module));
  const link = (page: typeof M_PAGES[number] | MModule['pages'][number]) => `<a href="#${page.path}" class="block rounded-lg px-3 py-2 text-sm ${page.id === active?.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/60 text-foreground'}">${esc(page.title)}</a>`;
  return `<nav class="mp-sidebar min-h-0 flex-1" data-hub-sheet-root="m-platform" aria-label="M 平台导航"><div class="mp-slide ${hasLayer ? 'hidden' : ''}" data-m-nav-root>${modules.map(module => !hasChildren(module) ? link(module.pages[0]) : `<button type="button" data-m-nav-open="${module.id}" aria-controls="m-nav-${module.id}" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/60"><span>${esc(module.title)}</span><span aria-hidden="true">›</span></button>`).join('') || '<p class="p-3 text-sm text-muted-foreground">暂无可访问菜单</p>'}</div>${modules.filter(module => hasChildren(module)).map(module => `<div class="mp-slide mp-submenu-slide flex flex-col ${module.id === activeModuleId ? '' : 'hidden'}" data-m-nav-layer="${module.id}" id="m-nav-${module.id}"><header class="mp-submenu-heading flex h-14 shrink-0 items-center gap-1 border-b border-sidebar-foreground/10 px-2 dark:border-white/10"><button type="button" data-m-nav-back data-navigation-sheet-back aria-label="返回上一级菜单" class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-foreground/[0.06] dark:hover:bg-white/5 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><h2 class="min-w-0 truncate text-sm font-semibold text-sidebar-foreground dark:text-white">${esc(module.title)}</h2></header><div class="min-h-0 flex-1 overflow-auto px-2 py-3">${module.pages.map(link).join('')}</div></div>`).join('')}</nav>`;
}
export function bindMNavigation(): void {
  const root = document.querySelector<HTMLElement>('[data-hub-sheet-root="m-platform"]');
  if (!root) return;
  bindNavigationSubmenuActions(root, {
    back: () => {
      root.querySelectorAll('[data-m-nav-layer]').forEach(el => el.classList.add('hidden'));
      root.querySelector('[data-m-nav-root]')?.classList.remove('hidden');
    },
    open: (_hubId, controls) => {
      root.querySelector('[data-m-nav-root]')?.classList.add('hidden');
      root.querySelectorAll('[data-m-nav-layer]').forEach(el => el.classList.add('hidden'));
      document.getElementById(controls)?.classList.remove('hidden');
    },
    keepLeaf: () => !!root.querySelector('[data-m-nav-layer]:not(.hidden)'),
  });
}

const harmless = '[data-m-nav-back],[data-m-nav-open],[data-exit-m-platform],[data-view-switch-trigger],[data-theme-toggle],#theme-toggle,[data-sub-modal-close],[data-pp-changelog-close],[data-merchant-stores-dialog-close]';
const readonlyBrowse = '[data-merchant-filter],[data-group-filter],[data-enterprise-hw-filter],[data-enterprise-hw-filter-form],[data-enterprise-merchant-filter-form],[data-enterprise-group-filter-form],[data-pp-col-select],[data-pp-select-bt],[data-pp-line-card],[data-nb-structure-focus],[data-merchant-view-stores],[data-store-change-log],[data-pp-list-changelog],[data-pp-changelog],[data-sub-route-search]';
function deniedControl(target: Element, type: string): boolean {
  const path = location.hash.slice(1), page = mPageForPath(path);
  if (!path.startsWith('/m-platform/') || !page || target.closest('.mp-center,.mp-permission-dialog')) return false;
  if (target.closest(harmless)) return false;
  if (!mCanVisit(path)) return true;
  const control = target.closest('button,input,select,textarea,a,form,[draggable="true"]');
  if (!control) return false;
  const anchor = target.closest<HTMLAnchorElement>('a[href^="#/m-platform/"]');
  if (anchor && !mCanVisit(anchor.hash.slice(1))) return true;
  const keys = page.actions.filter(action => target.closest(action.selector));
  if (keys.some(action => currentMAccess(mActionKey(page.id, action.id)) !== 'edit')) return true;
  if (currentMAccess(mPageKey(page.id)) === 'edit') return false;
  if (keys.length && keys.every(a => !a.write)) return false;
  if (target.closest('[data-pp-enable],[data-rbac-l4-editable],[data-nb-edit-l1],[data-nb-drag-handle],[data-nb-draggable-row]')) return true;
  if (target.closest(readonlyBrowse) || page.id === 'merchant-activity' && target.closest('[data-activity-browse]') || page.id === 'device-activity' && target.closest('[data-device-activity-browse]')) return false;
  if (anchor) return false;
  if (control instanceof HTMLButtonElement && control.type === 'button' && /关闭|取消|返回/.test(control.textContent ?? '')) return false;
  // Read-only pages permit browsing links, filtering and scrolling; reject remaining writes.
  return type === 'submit' || !!target.closest('button,input,select,textarea,[draggable="true"]');
}
export function installMRuntimeGuards(): void {
  if (document.documentElement.dataset.mPermissionGuard) return;
  document.documentElement.dataset.mPermissionGuard = '1';
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled || !location.hash.startsWith('#/m-platform/')) return;
    scheduled = true; requestAnimationFrame(() => { scheduled = false; applyMControlStates(); });
  }).observe(document.body, { childList: true, subtree: true });
  for (const type of ['click', 'submit', 'change', 'input', 'keydown', 'dragstart', 'drop']) document.addEventListener(type, event => {
    const target = event.target;
    if (!(target instanceof Element) || !deniedControl(target, type)) return;
    if (type === 'keydown' && !['Enter', ' '].includes((event as KeyboardEvent).key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
  }, true);
}
export function applyMControlStates(): void {
  const page = mPageForPath(location.hash.slice(1));
  if (!page) return;
  if (currentMAccess(mPageKey(page.id)) === 'read' && page.editable) {
    const content = document.querySelector('[data-m-platform-content]');
    if (content && !content.querySelector('.mp-readonly-note')) content.insertAdjacentHTML('afterbegin', '<p class="mp-readonly-note">当前页面为只读，暂无修改权限。</p>');
  }
  document.querySelectorAll<HTMLElement>('[data-m-platform-content] button,[data-m-platform-content] input,[data-m-platform-content] select,[data-m-platform-content] textarea').forEach(control => {
    if (!deniedControl(control, 'click')) return;
    control.setAttribute('disabled', ''); control.setAttribute('title', '暂无操作权限');
  });
}
