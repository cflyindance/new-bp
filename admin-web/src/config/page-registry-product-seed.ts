import { BRAND_PRODUCTS_SUBNAV, BRAND_MENU_SUBNAV, STORE_MENU_SUBNAV } from './navigation';
import type { RegistryWorkspace } from './page-registry-projects';

export const PRODUCT_TEST_PROJECT = 'registry-test-product-center';
/** Deterministic demo fixture; never replace a user's same-name project or edits. */
export function seedProductRegistry(w: RegistryWorkspace): RegistryWorkspace {
  if (w.projects.some(p => p.id === PRODUCT_TEST_PROJECT || p.name === '商品中心')) return w;
  const next = structuredClone(w);
  next.projects.push({ id: PRODUCT_TEST_PROJECT, name: '商品中心', microName: 'product-center-demo', microUrl: 'https://example.com/product-center-demo', microRoute: '/__registry-test/product-center' });
  type Item = { title: string; path: string; sidebarChildren?: readonly Item[] };
  function add(items: readonly Item[], parentId: string | null, prefix: string): void {
    items.forEach((item, index) => {
      const id = `${prefix}-${index}`;
      const children = item.sidebarChildren ?? [];
      const pageId = children.length ? undefined : `${id}-page`;
      next.directories.push({ id, name: item.title, projectId: PRODUCT_TEST_PROJECT, parentId, ...(pageId ? {pageId} : {}) });
      if (pageId) {
        next.pages.push({ id: pageId, title: item.title, module: '商品中心', status: 'active', source: '本地注册（当前浏览器）', routing: { type: 'micro-app', path: `/__registry-test/product-center${item.path}`, microAppConfig: { name: 'product-center-demo', url: 'https://example.com/product-center-demo', path: '/__registry-test/product-center' } } });
        next.assignments.push({pageId, projectId: PRODUCT_TEST_PROJECT, directoryId: parentId});
      }
      add(children, id, id);
    });
  }
  for (const [key, title, items] of [['products','商品管理',BRAND_PRODUCTS_SUBNAV],['brand-menu','品牌菜单',BRAND_MENU_SUBNAV],['stores','门店管理',STORE_MENU_SUBNAV]] as const) {
    const id=`${PRODUCT_TEST_PROJECT}-${key}`;
    next.directories.push({id,name:title,projectId:PRODUCT_TEST_PROJECT,parentId:null}); add(items,id,id);
  }
  return next;
}
