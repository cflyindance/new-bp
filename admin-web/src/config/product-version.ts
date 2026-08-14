/**
 * 商家后台产品版本：MVP / 复杂版本（影响侧栏导航展示）
 * 冷启动（含页面刷新）始终默认「复杂版本」；同页内切换仅保存在内存，不跨刷新持久化。
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

/** MVP 下模块设置中隐藏的 seq（仅隐藏，不删除 catalog 配置）；复杂版本下以红框标注 */
export const MVP_HIDDEN_MODULE_SETTING_SEQS = [118, 148, 165, 196, 216, 217, 218, 219, 350, 583] as const;

/** MVP 下模块设置侧栏分组隐藏（groupKey）；复杂版本下以红框标注 */
export const MVP_HIDDEN_MODULE_SETTING_GROUP_KEYS = ["foh-pos-buttons", "foh-pos-order-toolbar"] as const;

/** 已合并退役、任何产品版本下均不展示的设置 seq（catalog 可保留作历史） */
export const RETIRED_MODULE_SETTING_SEQS = [164, 169, 176, 177] as const;

let memoryVersion: ProductVersion | undefined;

/**
 * 是否为相较 MVP 仅在未来版本展示、且仍用红框标注的一级导航。
 * 「门店管理」改打「非MVP版本」标签，不再画红框。
 */
export function isFutureVersionDiffNavModule(moduleId: string): boolean {
  if (moduleId === "group-store-list" || moduleId === "brand-store-list") return false;
  return (
    (MVP_GLOBAL_HIDDEN_NAV_MODULE_IDS as readonly string[]).includes(moduleId) ||
    (MVP_GROUP_HQ_HIDDEN_NAV_MODULE_IDS as readonly string[]).includes(moduleId) ||
    (MVP_BRAND_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS as readonly string[]).includes(moduleId)
  );
}

/**
 * 是否为相较 MVP 仅在未来版本展示、且仍用红框标注的系统设置二级。
 * 「平台预设」改打「非MVP版本」标签，不再画红框；MVP 显隐仍由 MVP_HIDDEN_SETTINGS_NAV_CHILD_IDS 控制。
 */
export function isFutureVersionDiffSettingsNavChild(_childId: string): boolean {
  return false;
}

/** 是否为相较 MVP 仅在未来版本展示的模块设置项。 */
export function isFutureVersionDiffModuleSettingSeq(seq: number): boolean {
  return (MVP_HIDDEN_MODULE_SETTING_SEQS as readonly number[]).includes(seq);
}

/** 是否为相较 MVP 仅在未来版本展示、且仍用红框标注的模块设置侧栏分组。 */
export function isFutureVersionDiffModuleSettingGroupKey(groupKey: string): boolean {
  return (MVP_HIDDEN_MODULE_SETTING_GROUP_KEYS as readonly string[]).includes(groupKey);
}

export function readProductVersion(): ProductVersion {
  if (memoryVersion) return memoryVersion;
  // 页面刷新 / 冷启动：始终回到复杂版本；清掉历史 session 残留，避免旧 MVP 选择复活
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  memoryVersion = "future";
  return memoryVersion;
}

export function writeProductVersion(version: ProductVersion): void {
  memoryVersion = version;
  // 故意不写入 sessionStorage：刷新后仍回到复杂版本；同页 remount 靠 memoryVersion
  syncProductVersionDocumentAttribute();
  window.dispatchEvent(new CustomEvent("menusifu:product-version-change", { detail: { version } }));
}

export function isMvpProductVersion(): boolean {
  return readProductVersion() === "mvp";
}

/** 供统一差异样式按当前产品版本启停。 */
export function syncProductVersionDocumentAttribute(): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.productVersion = readProductVersion();
}

/** MVP 下是否隐藏某模块设置项（如「额外时间」） */
export function isMvpHiddenModuleSettingSeq(seq: number): boolean {
  return (
    isMvpProductVersion() && (MVP_HIDDEN_MODULE_SETTING_SEQS as readonly number[]).includes(seq)
  );
}

export function filterModuleSettingItemsForProductVersion<T extends { seq: number }>(items: T[]): T[] {
  const retired = RETIRED_MODULE_SETTING_SEQS as readonly number[];
  const withoutRetired = items.filter((item) => !retired.includes(item.seq));
  if (!isMvpProductVersion()) return withoutRetired;
  const hidden = MVP_HIDDEN_MODULE_SETTING_SEQS as readonly number[];
  return withoutRetired.filter((item) => !hidden.includes(item.seq));
}

export function filterModuleSettingGroupsForProductVersion<T extends { groupKey: string }>(
  groups: T[],
): T[] {
  if (!isMvpProductVersion()) return groups;
  const hidden = MVP_HIDDEN_MODULE_SETTING_GROUP_KEYS as readonly string[];
  return groups.filter((g) => !hidden.includes(g.groupKey));
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
