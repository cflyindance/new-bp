/**
 * 前厅管理中心 · 品牌多门店视角下需页内先选门店的路径
 */
import { FOH_CATEGORY_SETTINGS_BASE } from "./foh-category-settings-ui";
import { FOH_CLASSIFICATION_SETTINGS_BASE } from "./foh-classification-settings-ui";
import { MENU_ORDER_LIMITS_BASE } from "./foh-menu-order-limits-ui";
import { FLOOR_PLAN_PATH } from "./floor-plan-ui";

/** 品牌与菜单 */
export const FOH_BRAND_MENU_PATH = "/operations/queue-call/brand-menu";

/** eMenu Pro */
export const FOH_EMENU_PRO_PATH = "/operations/queue-call/emenu-pro";

/** 品牌多门店视角下须在页内选择门店后再操作的前厅管理入口 */
export const FOH_STORE_SCOPED_PATH_PREFIXES = [
  FLOOR_PLAN_PATH,
  FOH_BRAND_MENU_PATH,
  MENU_ORDER_LIMITS_BASE,
  FOH_CATEGORY_SETTINGS_BASE,
  FOH_CLASSIFICATION_SETTINGS_BASE,
  FOH_EMENU_PRO_PATH,
] as const;

export function isFohStoreScopedNavigationPath(path: string): boolean {
  return FOH_STORE_SCOPED_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}
