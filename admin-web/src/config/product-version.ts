/**
 * 商家后台产品版本：MVP / 未来版本（影响侧栏导航展示）
 */
export type ProductVersion = "mvp" | "future";

const STORAGE_KEY = "menusifu:product-version-v1";

/** MVP 下全视角隐藏的一级导航（仅隐藏，不删除配置；当前无全局隐藏项） */
export const MVP_GLOBAL_HIDDEN_NAV_MODULE_IDS = [] as const;

/** MVP + 集团总部视角下仅隐藏、不删除的一级导航 */
export const MVP_GROUP_HQ_HIDDEN_NAV_MODULE_IDS = ["brand-mgmt", "group-store-list"] as const;

/** MVP + 品牌多门店视角下仅隐藏、不删除的一级导航 */
export const MVP_BRAND_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS = ["brand-store-list"] as const;

/** MVP 下系统设置内隐藏的二级导航（仅隐藏，不删除配置） */
export const MVP_HIDDEN_SETTINGS_NAV_CHILD_IDS = ["set-platform-preset"] as const;

/** MVP 下模块设置中隐藏的 seq（仅隐藏，不删除 catalog 配置） */
export const MVP_HIDDEN_MODULE_SETTING_SEQS = [583] as const;

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

/** MVP 下是否隐藏某模块设置项（如「额外时间」） */
export function isMvpHiddenModuleSettingSeq(seq: number): boolean {
  return (
    isMvpProductVersion() && (MVP_HIDDEN_MODULE_SETTING_SEQS as readonly number[]).includes(seq)
  );
}

export function filterModuleSettingItemsForProductVersion<T extends { seq: number }>(items: T[]): T[] {
  if (!isMvpProductVersion()) return items;
  const hidden = MVP_HIDDEN_MODULE_SETTING_SEQS as readonly number[];
  return items.filter((item) => !hidden.includes(item.seq));
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

/** MVP 下前厅设置不展示「查看方式」切换；默认按场景 */
export function shouldShowFohSettingsViewModeControl(): boolean {
  return !isMvpProductVersion();
}

/**
 * MVP + 品牌多门店视角：顶栏品牌是否可切换（非 MVP 行为相同）。
 * 授权 ≥2 个品牌时展示下拉；仅 1 个品牌时只读锁定。见 session-scope.shouldShowBrandScopeFilter。
 */
