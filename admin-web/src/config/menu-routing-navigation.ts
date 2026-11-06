/** Navigation entries share the existing routing permission resource. */
export const MENU_ROUTING_ROOT = "/m-platform/nav-blueprint";
export const MENU_ROUTING_PAGES = [
  { view: "nav", title: "导航编排", path: `${MENU_ROUTING_ROOT}/navigation` },
  { view: "registry", title: "页面注册中心", path: `${MENU_ROUTING_ROOT}/page-registry` },
] as const;
export type MenuRoutingView = typeof MENU_ROUTING_PAGES[number]["view"];

export function menuRoutingPage(path: string) {
  const normalized = path.split("?")[0].replace(/\/+$/, "");
  return MENU_ROUTING_PAGES.find(page => page.path === normalized) ?? MENU_ROUTING_PAGES[0];
}
