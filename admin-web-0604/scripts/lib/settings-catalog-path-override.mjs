/**
 * 设置 catalog 挂载路由（覆盖 hub 默认 settingsPath）。
 */
export const SETTINGS_CATALOG_PATH_BY_SEQ = new Map([
  /** 抽奖活动独立功能页，非 /promotions/settings */
  [647, "/promotions/lottery"],
]);

/** @param {number} seq @param {string | undefined} defaultPath */
export function getSettingsCatalogPathForSeq(seq, defaultPath) {
  return SETTINGS_CATALOG_PATH_BY_SEQ.get(Number(seq)) ?? defaultPath;
}
