import { NAV_MODULE_ICONS } from "../config/nav-module-icons";
import {parseSubscriptionBrandRightsPath} from '../config/subscription-service-scope';
import {providerTargetAllowed} from '../auth/provider-access-runtime';
import {getEnterpriseMerchantSnapshot} from '../config/enterprise-merchant-store';
import { bindNavigationSubmenuActions } from '../shell/navigation-submenu-actions';
import { M_MODULES, M_PAGES, mPageForPath, mPageKey, mModuleKey, mActionKey, type MModule } from './m-platform-catalog';
import { currentMAccess, currentMAccount } from './m-platform-store';
import { buildMNavigationModules, mNavigationHasChildren } from './m-platform-navigation';
import { menuRoutingPage } from '../config/menu-routing-navigation';
const decodeTarget=(id:string)=>{try{return decodeURIComponent(id);}catch{return '';}};
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function mCanVisit(path: string): boolean {
  path=path.split('?')[0];
  const rightsBrand=parseSubscriptionBrandRightsPath(path);if(rightsBrand&&!providerTargetAllowed(rightsBrand))return false;
  if(path==='/m-platform/permissions/change-log')return currentMAccess(mPageKey('permission-log'))!=='hidden'||currentMAccess(mPageKey('provider-roles'))!=='hidden';
  if(path.endsWith('/merchant-access')&&currentMAccess(mPageKey('provider-roles'))==='hidden')return false;
  const storeMatch=/^\/m-platform\/merchants\/stores\/([^/]+)/.exec(path);
  if(storeMatch){const store=getEnterpriseMerchantSnapshot().stores.find(s=>s.storeId===decodeTarget(storeMatch[1]));if(!store||!providerTargetAllowed(store.merchantId,store.storeId))return false;}
  const brandMatch=/^\/m-platform\/merchants\/([^/]+)/.exec(path);
  if(brandMatch&&!['stores','overview','new','activity','device-activity','org-tree','reports','change-log'].includes(brandMatch[1])&&!providerTargetAllowed(decodeTarget(brandMatch[1])))return false;

  if (/^\/m-platform\/merchants\/(?:stores\/[^/]+|[^/]+)\/usage$/.test(path) && currentMAccess(mPageKey('merchant-activity')) === 'hidden') return false;
  const page = mPageForPath(path);
  if (!page || currentMAccess(mPageKey(page.id)) === 'hidden') return false;
  if (/\/(new|create)(\/|$)/.test(path) || /\/edit(\/|$)/.test(path) && !['roles', 'provider-roles', 'presets', 'routing'].includes(page.id)) {
    if (currentMAccess(mPageKey(page.id)) !== 'edit') return false;
    if (page.id === 'roles' && path.endsWith('/new')) return currentMAccess(mActionKey('roles', 'create')) === 'edit';
    if (page.id === 'services' && path.endsWith('/create')) return currentMAccess(mActionKey('services', 'create')) === 'edit';
  }
  return true;
}
export function mDenied(): string {
  return `<section class="mp-denied" role="alert"><h1>暂无平台管理权限</h1><p>${currentMAccount()?.enabled === false ? '该服务商员工账号已停用。' : '请联系服务商管理员，为当前员工分配具有相应菜单权限的角色。'}</p><p class="mt-4"><a href="#/nav-home" class="text-primary">返回商户后台</a></p></section>`;
}
const mNavigationIcons: Record<string, keyof typeof NAV_MODULE_ICONS> = {
  merchants: 'brandMgmt', 'activity-analysis': 'reports', hardware: 'assetCenter',
  services: 'financeCenter', presets: 'configCenter', permissions: 'permissionMgmt', routing: 'menu',
  'display-regions-nav': 'deviceManagement', 'business-menu-template-nav': 'brandMenu',
};
const mNavigationIcon = (id: string) => `<span class="mb-nav-icon" aria-hidden="true">${NAV_MODULE_ICONS[mNavigationIcons[id] ?? 'settings']}</span>`;
export function renderMNavigation(path: string): string {
  const modules = buildMNavigationModules(M_MODULES.map(module => ({ ...module, pages: module.pages.filter(p => currentMAccess(mPageKey(p.id)) !== 'hidden'||p.id==='permission-log'&&currentMAccess(mPageKey('provider-roles'))!=='hidden') })).filter(module => module.pages.length && currentMAccess(mModuleKey(module.id)) !== 'hidden'));
  const rolePages = modules.find(m=>m.id==='role-permissions-nav')?.pages ?? [];
  const providerActive = rolePages.some(p=>path.split('?')[0]===p.path||path.startsWith(p.path+'/')&&!path.startsWith(p.path+'/change-log'));
  const hasChildren = mNavigationHasChildren;
  const active = mPageForPath(path);
  const registryActive = path.split('?')[0].startsWith('/m-platform/nav-blueprint/page-registry');
  const menuActive = active?.id==='routing'&&!registryActive;
  const activeModuleId = menuActive && modules.some(m=>m.id==='menu-config-nav') ? 'menu-config-nav' : registryActive && modules.some(m => m.id === 'registry-nav') ? 'registry-nav' : providerActive ? 'role-permissions-nav' : modules.find(module => module.pages.some(page => page.id === active?.id))?.id;
  const hasLayer = modules.some(module => module.id === activeModuleId && hasChildren(module));
  const link = (page: typeof M_PAGES[number] | MModule['pages'][number]) => {
    const presetAliases=['/m-platform/business-menu-templates','/m-platform/display-regions'];
    const selected = page.id === 'routing' ? active?.id === 'routing' && page.path === menuRoutingPage(path).path : page.path===path||(!presetAliases.includes(path)&&!presetAliases.includes(page.path)&&page.id===active?.id&&page.id!=='provider-roles');
    return `<a href="#${page.path}" ${selected ? 'aria-current="page"' : ''} class="block rounded-lg px-3 py-2 text-sm ${selected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/60 text-foreground'}">${mNavigationIcon(modules.find(module => module.pages.some(p => p.path === page.path))?.id ?? '')}<span class="min-w-0 flex-1 truncate">${esc(page.title)}</span></a>`;
  };
  return `<nav class="mp-sidebar min-h-0 flex-1" data-hub-sheet-root="m-platform" aria-label="M 平台导航"><div class="mp-slide ${hasLayer ? 'hidden' : ''}" data-m-nav-root>${modules.filter(module=>!['role-permissions-nav','registry-nav','menu-config-nav'].includes(module.id)).map(module => !hasChildren(module) ? link(module.pages[0]) : `<button type="button" data-m-nav-open="${module.id}" aria-controls="m-nav-${module.id}" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/60">${mNavigationIcon(module.id)}<span class="min-w-0 flex-1 truncate">${esc(module.title)}</span><span aria-hidden="true">›</span></button>`).join('') || '<p class="p-3 text-sm text-muted-foreground">暂无可访问菜单</p>'}</div>${modules.filter(module => hasChildren(module)).map(module => `<div class="mp-slide mp-submenu-slide flex flex-col ${module.id === activeModuleId ? '' : 'hidden'}" data-m-nav-layer="${module.id}" id="m-nav-${module.id}"><header class="mp-submenu-heading flex h-14 shrink-0 items-center gap-1 border-b border-sidebar-foreground/10 px-2 dark:border-white/10"><button type="button" data-m-nav-back data-navigation-sheet-back aria-label="返回上一级菜单" class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-foreground/[0.06] dark:hover:bg-white/5 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><h2 class="min-w-0 truncate text-sm font-semibold text-sidebar-foreground dark:text-white">${esc(module.title)}</h2></header><div class="min-h-0 flex-1 overflow-auto px-2 py-3">${module.pages.filter(page=>module.id!=='permissions'||!['roles','provider-roles'].includes(page.id)||page.id===rolePages[0]?.id).map(page=>module.id==='permissions'&&['roles','provider-roles'].includes(page.id)?`<button type="button" aria-controls="m-nav-role-permissions-nav" data-m-nav-open="role-permissions-nav" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/60">${mNavigationIcon('permissions')}<span class="min-w-0 flex-1 truncate">角色与权限</span><span aria-hidden="true">›</span></button>`:module.id==='routing'&&page.path.endsWith('/page-registry')?`<button type="button" aria-controls="m-nav-registry-nav" data-m-nav-open="registry-nav" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/60">${mNavigationIcon('routing')}<span class="min-w-0 flex-1 truncate">页面注册中心</span><span aria-hidden="true">›</span></button>`:module.id==='routing'&&page.path.endsWith('/menu')?`<button type="button" aria-controls="m-nav-menu-config-nav" data-m-nav-open="menu-config-nav" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/60">${mNavigationIcon('routing')}<span class="min-w-0 flex-1 truncate">菜单配置</span><span aria-hidden="true">›</span></button>`:link(page)).join('')}</div></div>`).join('')}</nav>`;
}
export function bindMNavigation(): void {
  const root = document.querySelector<HTMLElement>('[data-hub-sheet-root="m-platform"]');
  if (!root) return;
  bindNavigationSubmenuActions(root, {
    back: () => {
      const menuNested=root.querySelector('[data-m-nav-layer="menu-config-nav"]:not(.hidden)');
      const registryNested = root.querySelector('[data-m-nav-layer="registry-nav"]:not(.hidden)');
      const nested = root.querySelector('[data-m-nav-layer="role-permissions-nav"]:not(.hidden)');
      root.querySelectorAll('[data-m-nav-layer]').forEach(el => el.classList.add('hidden'));
      if(menuNested) root.querySelector('[data-m-nav-layer="routing"]')?.classList.remove('hidden');
      else if(registryNested) root.querySelector('[data-m-nav-layer="routing"]')?.classList.remove('hidden');
      else if(nested) root.querySelector('[data-m-nav-layer="permissions"]')?.classList.remove('hidden');
      else root.querySelector('[data-m-nav-root]')?.classList.remove('hidden');
    },
    open: (_hubId, controls) => {
      root.querySelector('[data-m-nav-root]')?.classList.add('hidden');
      root.querySelectorAll('[data-m-nav-layer]').forEach(el => el.classList.add('hidden'));
      document.getElementById(controls)?.classList.remove('hidden');
      if(controls==='m-nav-menu-config-nav') {location.hash='/m-platform/nav-blueprint/navigation';}
      if(controls==='m-nav-registry-nav') {location.hash='/m-platform/nav-blueprint/page-registry/projects';}
      if(controls==='m-nav-role-permissions-nav'){const first=root.querySelector<HTMLAnchorElement>('#m-nav-role-permissions-nav a');if(first)location.hash=first.hash;}
    },
    keepLeaf: () => !!root.querySelector('[data-m-nav-layer]:not(.hidden)'),
  });
}

const harmless = '[data-m-nav-back],[data-m-nav-open],[data-exit-m-platform],[data-view-switch-trigger],[data-theme-toggle],#theme-toggle,[data-sub-modal-close],[data-template-close],[data-pp-changelog-close],[data-merchant-stores-dialog-close]';
const readonlyBrowse = '[data-brand-list-filter],[data-brand-row-more],[data-permission-audit],[data-sub-more],[data-sub-operation=detail],[data-brand-store-details],[data-brand-store-detail-dialog],[data-merchant-usage] [data-activity-browse],[data-merchant-filter],[data-group-filter],[data-enterprise-hw-filter],[data-enterprise-hw-filter-form],[data-enterprise-merchant-filter-form],[data-enterprise-group-filter-form],[data-pp-col-select],[data-pp-select-bt],[data-pp-line-card],[data-nb-structure-focus],[data-merchant-view-stores],[data-store-change-log],[data-pp-list-changelog],[data-pp-changelog],[data-sub-route-search],[data-spe-tab],[data-spe-category],[data-spe-search],[data-spe-only],[data-spe-expand],[data-spe-collapse],[data-spe-version],[data-sub-brand-rights],[data-rights-query],[data-rights-status],[data-rights-store],[data-rights-expand],[data-rights-stores],[data-rights-store-dialog],[data-rights-audit-more],[data-rights-tab],[data-rights-audit-query],[data-rights-audit-operation],[data-rights-audit-from],[data-rights-audit-to],[data-rights-audit-reset],[data-rights-drawer-close],[data-rights-history-open],[data-rights-basis],[data-rights-basis-dialog],[data-package-toast-close],[data-service-version-preview]';
function deniedControl(target: Element, type: string): boolean {
  if(target.closest('[data-page-copy-path]'))return false;
  if (target.closest('[data-pt-search],[data-pt-toggle],[data-pt-toggle-all],[data-pt-back]')) return false;
  const path = location.hash.slice(1), page = mPageForPath(path);
  if (!path.startsWith('/m-platform/') || !page || target.closest('#m-permission-center,.mp-permission-dialog,dialog.provider-dialog')) return false;
  if (target.closest(harmless)) return false;
  if (page.id === 'presets' && path.split('?')[0] === '/m-platform/display-regions' && target.closest('[data-display-action="bindings"],[data-display-action="copy-code"],#display-search,#display-status-filter,[data-display-action="reset"],[data-display-action="next"],[data-display-action="previous"]')) return false;
  if (!mCanVisit(path)) return true;
    // Registry controls only inspect the code catalog, including for routing read-only roles.
    if (target.closest('[data-page-registry-search],[data-page-registry-status],[data-page-detail],[data-page-spec],[data-page-close],[data-project-filter],[data-project-reset],[data-project-close],[data-operation-log],[data-log-overlay]') || target.matches('[data-page-overlay]')) return false;
  const control = target.closest('button,input,select,textarea,a,form,[draggable="true"]');
  if (!control) return false;
  const anchor = target.closest<HTMLAnchorElement>('a[href^="#/m-platform/"]');
  if (anchor && !mCanVisit(anchor.hash.slice(1))) return true;
  const keys = page.actions.filter(action => target.closest(action.selector));
  if (keys.some(action => currentMAccess(mActionKey(page.id, action.id)) !== 'edit')) return true;
  if (currentMAccess(mPageKey(page.id)) === 'edit') return false;
  if(target.closest('[data-business-template-manage],[data-template-view],[data-business-template-read]'))return false;
  if(target.closest('[data-business-type-maintain],[data-business-type-bind],[data-business-category]'))return false;
  if(target.closest('[data-business-category-key]'))return false;
  if (target.closest('[data-ent-menu],[data-service-menu-preview]')) return false;
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
