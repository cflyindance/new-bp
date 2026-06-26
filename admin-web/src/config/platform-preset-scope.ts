/**
 * 平台预设 · 商家级 vs 企业级（M 平台）作用域配置
 */
import { PLATFORM_PRESET_PRODUCT_LINES, type ProductLineId } from "./platform-preset-catalog";
import type { CustomBusinessType } from "./platform-preset-store";
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
  publishSuccessMessage: (version: number) => string;
  versionBadge: (version: number, hasPublished: boolean) => string;
  store: PlatformPresetStoreApi;
}

export const MERCHANT_PLATFORM_PRESET_SCOPE: PresetScopeConfig = {
  scope: "merchant",
  routePrefix: "/settings/platform-preset",
  moduleLabel: "系统设置",
  listIntro:
    "列表范围与登录引导所选业态、产线一致；在左侧选择业态后，配置各产线组合的功能与设置展示范围。经营业态由 M 平台统一维护。",
  editorHint:
    "此处勾选不会实时改变侧栏；保存并发布后，请通过顶栏「重新引导」验证效果。",
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

/** 仅 M 平台支持新增自定义经营业态 */
export function canAddCustomBusinessTypes(scope: PresetScopeConfig): boolean {
  return scope.scope === "enterprise";
}

/** 商家后台读取 M 平台下发的自定义业态；M 平台读取本作用域存储 */
export function listCustomBusinessTypesForScope(scope: PresetScopeConfig): CustomBusinessType[] {
  if (scope.scope === "enterprise") return scope.store.listCustomBusinessTypes();
  return enterpriseStore.listCustomBusinessTypes();
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
