/**
 * 商家后台产品版本：MVP / 未来版本（影响侧栏导航展示）
 */
export type ProductVersion = "mvp" | "future";

const STORAGE_KEY = "menusifu:product-version-v1";

/** MVP 下全视角隐藏的一级导航（仅隐藏，不删除配置） */
export const MVP_GLOBAL_HIDDEN_NAV_MODULE_IDS = ["log-management"] as const;

/** MVP + 集团总部视角下仅隐藏、不删除的一级导航 */
export const MVP_GROUP_HQ_HIDDEN_NAV_MODULE_IDS = ["brand-mgmt", "group-store-list"] as const;

/** MVP + 品牌多门店视角下仅隐藏、不删除的一级导航 */
export const MVP_BRAND_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS = ["brand-store-list"] as const;

/** MVP 下系统设置内隐藏的二级导航（仅隐藏，不删除配置） */
export const MVP_HIDDEN_SETTINGS_NAV_CHILD_IDS = ["set-platform-preset"] as const;

let memoryVersion: ProductVersion | undefined;

export function readProductVersion(): ProductVersion {
  if (memoryVersion) return memoryVersion;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    memoryVersion = raw === "future" ? "future" : "mvp";
    return memoryVersion;
  } catch {
    memoryVersion = "mvp";
    return memoryVersion;
  }
}

export function writeProductVersion(version: ProductVersion): void {
  memoryVersion = version;
  try {
    sessionStorage.setItem(STORAGE_KEY, version);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("menusifu:product-version-change", { detail: { version } }));
}

export function isMvpProductVersion(): boolean {
  return readProductVersion() === "mvp";
}

/** MVP 版本下隐藏「重新引导」等首次登录引导入口 */
export function shouldShowRestartOnboardingControl(): boolean {
  return !isMvpProductVersion();
}

/** MVP 版本下隐藏顶栏 AI 助手入口 */
export function shouldShowAiAssistantControl(): boolean {
  return !isMvpProductVersion();
}

/** MVP 版本下隐藏视角切换中的「集团总部」选项 */
export function shouldShowGroupHqViewSwitchOption(): boolean {
  return !isMvpProductVersion();
}

/** MVP 版本下隐藏视角切换中的「M平台」选项 */
export function shouldShowMPlatformViewSwitchOption(): boolean {
  return !isMvpProductVersion();
}

/** MVP + 品牌多门店视角：展示顶栏「区域」筛选整块控件 */
export function shouldShowBrandPerspectiveRegionScopeFilter(): boolean {
  return !isMvpProductVersion();
}
