/**
 * 应用级路由常量（主导航首页等，不属于任一业务模块）
 */

/** 登录/引导完成后默认落地：仅展示侧栏主导航，不进入模块子页或滑层 */
export const APP_NAV_HOME_PATH = "/home";

export function isNavHomePath(path: string): boolean {
  return path === APP_NAV_HOME_PATH || path === `${APP_NAV_HOME_PATH}/`;
}

/** 从 location.hash 解析当前路径；空 hash 视为导航首页 */
export function readAppHashPath(): string {
  const raw = location.hash.slice(1);
  if (!raw || raw === "/") return APP_NAV_HOME_PATH;
  return raw;
}
