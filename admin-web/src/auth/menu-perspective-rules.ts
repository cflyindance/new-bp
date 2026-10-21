/** 单店组织层级下侧栏默认隐藏的连锁向一级模块 */
export const STORE_TIER_HIDDEN_NAV_MODULE_IDS: readonly string[] = [
  "brand-mgmt",
];

/** 门店数据视角下隐藏的一级模块 */
export const STORE_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS: readonly string[] = ["brand-mgmt"];

export const BRAND_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS: readonly string[] = ["brand-mgmt"];

/** 品牌多门店视角下才展示的一级模块 */
export const BRAND_PERSPECTIVE_ONLY_NAV_MODULE_IDS: readonly string[] = ["brand-store-list"];

/** 集团总部视角下才展示的一级模块 */
export const GROUP_HQ_PERSPECTIVE_ONLY_NAV_MODULE_IDS: readonly string[] = ["group-store-list"];

/** Context-free store view classification shared with inherited menu grants. */
export function isStorePerspectiveModule(moduleId:string):boolean {
  return ![...STORE_TIER_HIDDEN_NAV_MODULE_IDS,...STORE_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS,...BRAND_PERSPECTIVE_ONLY_NAV_MODULE_IDS,...GROUP_HQ_PERSPECTIVE_ONLY_NAV_MODULE_IDS].includes(moduleId);
}
