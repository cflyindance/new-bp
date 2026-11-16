/** Navigation entries share the existing routing permission resource. */
export const MENU_ROUTING_ROOT = "/m-platform/nav-blueprint";
export const MENU_ROUTING_PAGES = [
  { view: "nav", title: "菜单配置", path: `${MENU_ROUTING_ROOT}/navigation` },
  { view: "registry", title: "页面注册中心", path: `${MENU_ROUTING_ROOT}/page-registry` },
  { view: "projects", title: "项目管理", path: `${MENU_ROUTING_ROOT}/page-registry/projects` },
  { view: "pages", title: "页面管理", path: `${MENU_ROUTING_ROOT}/page-registry/pages` },
] as const;
export type MenuRoutingView = typeof MENU_ROUTING_PAGES[number]["view"];

export function menuRoutingPage(path: string) {
  const normalized = path.split("?")[0].replace(/\/+$/, "");
  return MENU_ROUTING_PAGES.find(page => page.path === normalized) ?? MENU_ROUTING_PAGES[0];
}
