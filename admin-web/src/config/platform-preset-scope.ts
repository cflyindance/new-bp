/**
 * 平台预设 · 商家级 vs 企业级（M 平台）作用域配置
 */
import { PLATFORM_PRESET_PRODUCT_LINES, type ProductLineId } from "./platform-preset-catalog";
import type { PlatformPresetStoreApi } from "./platform-preset-store-factory";
import * as merchantStore from "./platform-preset-store";
import * as enterpriseStore from "./enterprise-platform-preset-store";

export type PresetScope = "merchant" | "enterprise";

export interface PresetScopeConfig {
  scope: PresetScope;
  routePrefix: string;
  moduleLabel: string;
  listIntro: string;
  editorHint: string;
  /** 是否允许在本作用域新增/编辑自定义经营业态（仅 M 平台） */
  allowCustomBusinessTypeManage: boolean;
  publishSuccessMessage: (version: number) => string;
  versionBadge: (version: number, hasPublished: boolean) => string;
  store: PlatformPresetStoreApi;
}

/** 当前作用域可见的自定义业态（商家后台读取 M 平台配置） */
export function listScopedCustomBusinessTypes(scope: PresetScopeConfig) {
  if (scope.scope === "merchant") {
    return ENTERPRISE_PLATFORM_PRESET_SCOPE.store.listCustomBusinessTypes();
  }
  return scope.store.listCustomBusinessTypes();
}

export const MERCHANT_PLATFORM_PRESET_SCOPE: PresetScopeConfig = {
  scope: "merchant",
  routePrefix: "/settings/platform-preset",
  moduleLabel: "系统设置",
  listIntro:
    "在左侧选择经营业态后，在此配置该业态下各产线组合的默认功能与设置展示范围。经营业态由 M 平台统一维护，商家后台不可新增。",
  editorHint:
    "此处勾选不会实时改变侧栏；保存并发布后，请通过顶栏「重新引导」验证效果。",
  allowCustomBusinessTypeManage: false,
  publishSuccessMessage: (version) =>
    `已发布 v${version}。可通过顶栏「重新引导」选择对应业态与产线，验证预设效果。`,
  versionBadge: (version, hasPublished) =>
    version > 0 ? `v${version}${hasPublished ? " · 已覆盖" : ""}` : "v1",
  store: merchantStore,
};

export const ENTERPRISE_PLATFORM_PRESET_SCOPE: PresetScopeConfig = {
  scope: "enterprise",
  routePrefix: "/m-platform/platform-preset",
  moduleLabel: "M 平台",
  listIntro:
    "企业级平台预设：配置后将作为下属商家的默认预设。新商家首次登录引导将同步此处发布的配置。",
  editorHint:
    "此处为企业级默认配置，保存并发布后不会直接改变当前商家侧栏；后续将支持同步到商家后台。",
  allowCustomBusinessTypeManage: true,
  publishSuccessMessage: (version) =>
    `已发布企业级预设 v${version}。新商家首次引导将默认获取此配置（同步到既有商家为后续能力）。`,
  versionBadge: (version, hasPublished) =>
    version > 0 ? `v${version}${hasPublished ? " · 企业默认" : ""}` : "未发布",
  store: enterpriseStore,
};

export function isMPlatformPresetPath(path: string): boolean {
  return path === "/m-platform/platform-preset" || path.startsWith("/m-platform/platform-preset/");
}

export function isMerchantPlatformPresetPath(path: string): boolean {
  return path === "/settings/platform-preset" || path.startsWith("/settings/platform-preset/");
}

export function isAnyPlatformPresetPath(path: string): boolean {
  return isMerchantPlatformPresetPath(path) || isMPlatformPresetPath(path);
}

export function getPresetScopeForPath(path: string): PresetScopeConfig {
  if (isMPlatformPresetPath(path)) return ENTERPRISE_PLATFORM_PRESET_SCOPE;
  return MERCHANT_PLATFORM_PRESET_SCOPE;
}

export function parsePlatformPresetEditPathForScope(
  path: string,
  scope: PresetScopeConfig,
): { businessTypeId: string; productLineId: ProductLineId } | null {
  const prefix = scope.routePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = path.match(new RegExp(`^${prefix}/([^/]+)/([^/]+)/edit$`));
  if (!m) return null;
  const businessTypeId = decodeURIComponent(m[1]!);
  const productLineId = decodeURIComponent(m[2]!) as ProductLineId;
  if (!PLATFORM_PRESET_PRODUCT_LINES.some((l) => l.id === productLineId)) return null;
  return { businessTypeId, productLineId };
}
