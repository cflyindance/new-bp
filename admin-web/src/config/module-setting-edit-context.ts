/**
 * 设置控件当前编辑作用域。
 *
 * 页面模式继续按真实设置页分桶；滑层搜索模式使用独立 scopeKey，
 * 但始终保留真实 settingsPath 供变更预览与下发归属使用。
 */
export type SettingEditContext = {
  mode: "page" | "search";
  scopeKey: string;
  settingsPath: string;
  hubId?: string;
};

const HUB_SEARCH_SCOPE_PREFIX = "hub-search:";

let activeContext: SettingEditContext | null = null;

export function hubSearchEditScopeKey(hubId: string): string {
  return `${HUB_SEARCH_SCOPE_PREFIX}${hubId}`;
}

export function isHubSearchEditScopeKey(value: string): boolean {
  return value.startsWith(HUB_SEARCH_SCOPE_PREFIX);
}

export function setActiveSettingEditContext(context: SettingEditContext | null): void {
  activeContext = context;
}

export function getActiveSettingEditContext(): SettingEditContext | null {
  return activeContext;
}

export function getActiveSettingEditScopeKey(): string | null {
  return activeContext?.scopeKey ?? null;
}
