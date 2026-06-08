import { SYSTEM_SETTINGS_CATALOG_PATH_BY_SEQ } from "./system-settings-groups.mjs";

/**
 * 设置 catalog 挂载路由（覆盖 hub 默认 settingsPath）。
 */
export const SETTINGS_CATALOG_PATH_BY_SEQ = new Map([
  ...Object.entries(SYSTEM_SETTINGS_CATALOG_PATH_BY_SEQ).map(([seq, p]) => [Number(seq), p]),
  /** 门店安全策略（349），非 /permissions/account-session */
  [349, "/permissions/store-security"],
  /** 抽奖活动独立功能页，非 /promotions/settings */
  [647, "/promotions/lottery"],
  /** 门店管理：品牌与菜单与门店状态同级，非 /stores/settings 内分组 */
  [530, "/stores/brand-menu"],
  [531, "/stores/brand-menu"],
  [547, "/stores/brand-menu"],
]);

/** @param {number} seq @param {string | undefined} defaultPath */
export function getSettingsCatalogPathForSeq(seq, defaultPath) {
  return SETTINGS_CATALOG_PATH_BY_SEQ.get(Number(seq)) ?? defaultPath;
}
