/** Navigation entries share the existing routing permission resource. */
export const MENU_ROUTING_ROOT = "/m-platform/nav-blueprint";
export const MENU_ROUTING_PAGES = [
  { view: "nav", title: "菜单管理", path: `${MENU_ROUTING_ROOT}/navigation` },
  { view: "menu-root", title: "菜单配置", path: `${MENU_ROUTING_ROOT}/menu` },
  { view: "menu-log", title: "操作记录", path: `${MENU_ROUTING_ROOT}/navigation/logs` },
  { view: "registry", title: "页面注册中心", path: `${MENU_ROUTING_ROOT}/page-registry` },
  { view: "projects", title: "项目管理", path: `${MENU_ROUTING_ROOT}/page-registry/projects` },
  { view: "pages", title: "页面管理", path: `${MENU_ROUTING_ROOT}/page-registry/pages` },
  { view: "registry-log", title: "操作记录", path: `${MENU_ROUTING_ROOT}/page-registry/logs` },
] as const;
export type MenuRoutingView = typeof MENU_ROUTING_PAGES[number]["view"];

export function menuRoutingPage(path: string) {
  const normalized = path.split("?")[0].replace(/\/+$/, "");
  if(normalized===`${MENU_ROUTING_ROOT}/page-registry`)return MENU_ROUTING_PAGES.find(p=>p.view==='projects')!;
  if(normalized===`${MENU_ROUTING_ROOT}/menu`)return MENU_ROUTING_PAGES[0];
  return MENU_ROUTING_PAGES.find(page => page.path === normalized) ?? MENU_ROUTING_PAGES[0];
}
