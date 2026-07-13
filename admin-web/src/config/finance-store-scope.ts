/**
 * 财务中心 · 品牌多门店视角下需页内先选门店的路径
 *
 * 注：收银稽核（/finance/register-audit/*）门店筛选在页内精简下拉，不走外层 page-store-picker。
 */
export const FINANCE_SETTINGS_PATH = "/finance/settings";

/** 品牌多门店视角下须在页内选择门店后再操作的财务入口 */
export const FINANCE_STORE_SCOPED_PATH_PREFIXES = [FINANCE_SETTINGS_PATH] as const;

export function isFinanceStoreScopedNavigationPath(path: string): boolean {
  return FINANCE_STORE_SCOPED_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}
