/**
 * 功能可见性引擎 — 产线优先合并（选项 A）；P1 L2 / P7 L3 子入口
 */
import {
  NAV_MODULES,
  navModuleChildrenAsSheetSubnav,
  type NavModule,
  type ProductCenterSidebarSubItem,
} from "./navigation";
import { ALWAYS_VISIBLE_NAV_L1, FEATURE_REGISTRY_L1, PLATFORM_PRESET_DEFAULT_L1, type BusinessTypeTag, type ProductLineTag } from "./feature-registry";
import { FEATURE_REGISTRY_L2, getFeatureMetaL2, getL2FeaturesForModule, type FeatureMetaL2 } from "./feature-registry-l2";
import { getEffectiveBusinessTypePresets } from "./feature-presets-catalog-runtime";
import { getEffectiveVariantForPair, getBusinessProductLineVariantOverrides } from "./feature-presets-variant-runtime";
import { shouldUseFullFeaturePresetScope } from "./feature-presets-recommendations";
import {
  resolveTertiaryPathHit,
} from "./feature-presets-nav-tree";
import { getTertiaryRegistryEntries, getVirtualL2NodesForModule } from "./feature-presets-tertiary-registry";
import { buildPresetNavTree, collectModuleNavSubtreeIds } from "./feature-presets-nav-tree";
import { resolveSheetItemL2 } from "./feature-presets-tertiary-registry";
import { loadTenantProfile, type TenantProfile } from "./tenant-profile-storage";

export interface TenantProfileInput {
  primaryBusinessType: BusinessTypeTag;
  secondaryBusinessType?: BusinessTypeTag;
  productLinePresetIds: string[];
  productLines: ProductLineTag[];
  addedFeatures: string[];
  removedFeatures: string[];
}

export interface VisibilityContext {
  l1: Set<string>;
  l2: Set<string>;
  l2Excludes: Set<string>;
  l3Excludes: Set<string>;
  /** 平台预设 L2 白名单（任一产线变体定义 l2Includes 时启用） */
  l2Includes: Set<string>;
  /** 平台预设 L3/L4 白名单 */
  l3Includes: Set<string>;
  subtreeWhitelistMode: boolean;
  l1Includes: Set<string>;
  /** 引导 Step 3 显式开通的 L2/L3/L4（优先于预设白名单与产线门槛） */
  tenantAdded: Set<string>;
  /** 租户未关闭的一级模块（引导勾选 / 预设默认开） */
  tenantActiveL1: Set<string>;
}

function collectVariantL1ForInput(input: TenantProfileInput): Set<string> {
  const variantL1 = new Set<string>();
  for (const presetId of input.productLinePresetIds) {
    const preset = getEffectiveVariantForPair(input.primaryBusinessType, presetId);
    if (!preset) continue;
    for (const id of collectVariantEnabledL1(preset)) variantL1.add(id);
  }
  return variantL1;
}

/**
 * 清理历史引导 bug 批量写入的 removedFeatures（多个未勾选 L1 整棵子树被误标 removed）。
 * 少量 L1 关闭（引导 Step 3 显式取消）保持不动。
 */
function pruneBulkStaleL1Removals(input: TenantProfileInput): string[] {
  const removed = new Set(input.removedFeatures);
  const l1InRemoved = [...removed].filter(
    (id) => !getFeatureMetaL2(id) && FEATURE_REGISTRY_L1.some((m) => m.moduleId === id),
  );
  if (l1InRemoved.length < 4) return input.removedFeatures;

  const variantL1 = collectVariantL1ForInput(input);
  for (const moduleId of l1InRemoved) {
    if (!variantL1.has(moduleId)) continue;
    if (!(PLATFORM_PRESET_DEFAULT_L1 as readonly string[]).includes(moduleId)) continue;
    if (input.addedFeatures.includes(moduleId)) continue;
    const subtree = collectModuleNavSubtreeIds(moduleId);
    const allSubtreeRemoved =
      subtree.l2.every((id) => removed.has(id)) && subtree.l3.every((id) => removed.has(id));
    if (!allSubtreeRemoved) continue;
    removed.delete(moduleId);
    for (const id of subtree.l2) removed.delete(id);
    for (const id of subtree.l3) removed.delete(id);
  }
  return [...removed].sort();
}

export function profileToInput(profile: TenantProfile): TenantProfileInput {
  const base: TenantProfileInput = {
    primaryBusinessType: profile.primaryBusinessType,
    secondaryBusinessType: profile.secondaryBusinessType,
    productLinePresetIds: profile.productLinePresetIds,
    productLines: profile.productLines,
    addedFeatures: profile.addedFeatures,
    removedFeatures: profile.removedFeatures,
  };
  return {
    ...base,
    removedFeatures: pruneBulkStaleL1Removals(base),
  };
}

function collectBusinessTypeFeatures(businessType: BusinessTypeTag): Set<string> {
  const preset = getEffectiveBusinessTypePresets().find((p) => p.id === businessType);
  const out = new Set<string>();
  if (!preset) return out;
  for (const entry of preset.features) {
    if (entry.tier === "core" || entry.tier === "recommended") {
      out.add(entry.featureId);
    }
  }
  return out;
}

function applyL1ProductLineScopeFilter(merged: Set<string>, productLines: ProductLineTag[]): void {
  const selected = new Set(productLines);
  for (const meta of FEATURE_REGISTRY_L1) {
    if (meta.productLineScope === "agnostic") continue;
    if (meta.productLines.length === 0) continue;

    const hit =
      meta.productLineScope === "all"
        ? meta.productLines.every((line) => selected.has(line))
        : meta.productLines.some((line) => selected.has(line));

    if (!hit) merged.delete(meta.moduleId);
  }
}

/** 聚合业态×产线变体的 L2/L3 白名单（l2Includes 存在即启用勾选才展示） */
/** 平台变体保存的 L2/L3 白名单（限定在指定一级模块子树内） */
export function collectVariantPresetSubtreeIds(
  moduleId: string,
  input: Pick<TenantProfileInput, "primaryBusinessType" | "productLinePresetIds">,
): { l2: string[]; l3: string[] } {
  const presetMod = buildPresetNavTree().find((m) => m.moduleId === moduleId);
  if (!presetMod || input.productLinePresetIds.length === 0) {
    return { l2: [], l3: [] };
  }

  const moduleL2 = new Set(presetMod.children.map((c) => c.id));
  const moduleL3 = new Set<string>();
  for (const l2 of presetMod.children) {
    for (const group of l2.groups) {
      for (const leaf of group.leaves) {
        if (leaf.level !== "l2") moduleL3.add(leaf.id);
      }
    }
  }

  const l2 = new Set<string>();
  const l3 = new Set<string>();
  for (const presetId of input.productLinePresetIds) {
    const variant = getEffectiveVariantForPair(input.primaryBusinessType, presetId);
    if (!variant) continue;
    for (const id of variant.l2Includes ?? []) {
      if (moduleL2.has(id)) l2.add(id);
    }
    for (const id of variant.l3Includes ?? []) {
      if (moduleL3.has(id)) l3.add(id);
    }
  }

  return { l2: [...l2].sort(), l3: [...l3].sort() };
}

export function collectSubtreeWhitelists(input: TenantProfileInput): {
  l2Includes: Set<string>;
  l3Includes: Set<string>;
  whitelistMode: boolean;
} {
  const l2Includes = new Set<string>();
  const l3Includes = new Set<string>();
  let whitelistMode = false;

  for (const presetId of input.productLinePresetIds) {
    const preset = getEffectiveVariantForPair(input.primaryBusinessType, presetId);
    if (!preset) continue;
    if (preset.l2Includes !== undefined) {
      whitelistMode = true;
      for (const id of preset.l2Includes) l2Includes.add(id);
    }
    if (preset.l3Includes !== undefined) {
      for (const id of preset.l3Includes) l3Includes.add(id);
    }
  }

  return { l2Includes, l3Includes, whitelistMode };
}

/** 平台预设 L2 白名单切片（用于产线门槛豁免） */
export interface PresetL2Whitelist {
  l2Includes: ReadonlySet<string>;
  subtreeWhitelistMode: boolean;
}

/** 平台预设 L2 白名单中的项优先于默认产线门槛 */
export function isL2InPlatformPresetWhitelist(
  featureId: string,
  presetWhitelist?: PresetL2Whitelist | null,
): boolean {
  return Boolean(presetWhitelist?.subtreeWhitelistMode && presetWhitelist.l2Includes.has(featureId));
}

/** 变体 L1 白名单（兼容历史 excludes/includes 覆盖层） */
function collectVariantEnabledL1(preset: {
  features: { featureId: string }[];
  excludes?: string[];
  includes?: string[];
}): Set<string> {
  const enabled = new Set(preset.features.map((f) => f.featureId));
  for (const id of preset.excludes ?? []) enabled.delete(id);
  for (const id of preset.includes ?? []) enabled.add(id);
  return enabled;
}

function collectL3Excludes(input: TenantProfileInput): Set<string> {
  const l3Excludes = new Set<string>();
  for (const presetId of input.productLinePresetIds) {
    const preset = getEffectiveVariantForPair(input.primaryBusinessType, presetId);
    if (!preset) continue;
    for (const id of preset.l3Excludes ?? []) l3Excludes.add(id);
  }
  return l3Excludes;
}

/**
 * 产线预设 l2Excludes 合并：仅当租户当前产线集合无法支撑该 L2 时才生效。
 * 避免 emenu+kiosk 组合时 kiosk 模板误伤 eMenu Pro 等 emenu 专属入口。
 */
export function collectL2Excludes(input: TenantProfileInput, presetWhitelist?: PresetL2Whitelist): Set<string> {
  const l2Excludes = new Set<string>();
  const tenantLines = new Set(input.productLines);

  for (const presetId of input.productLinePresetIds) {
    const preset = getEffectiveVariantForPair(input.primaryBusinessType, presetId);
    if (!preset) continue;
    for (const id of preset.l2Excludes ?? []) {
      if (isL2InPlatformPresetWhitelist(id, presetWhitelist)) continue;
      const meta = getFeatureMetaL2(id);
      if (!meta || meta.productLines.length === 0) {
        l2Excludes.add(id);
        continue;
      }
      const stillSupported = meta.productLines.some((line) => tenantLines.has(line));
      if (!stillSupported) l2Excludes.add(id);
    }
  }
  return l2Excludes;
}

/** L2 产线 / 业态门槛（不含 l2Excludes、removedFeatures；白名单 L2 跳过产线门槛） */
export function l2PassesScopeGates(
  meta: FeatureMetaL2,
  input: TenantProfileInput,
  presetWhitelist?: PresetL2Whitelist,
): boolean {
  if (shouldUseFullFeaturePresetScope(input)) return true;

  if (!isL2InPlatformPresetWhitelist(meta.featureId, presetWhitelist)) {
    const selectedLines = new Set(input.productLines);

    if (meta.productLineScope !== "agnostic" && meta.productLines.length > 0 && selectedLines.size > 0) {
      const hit =
        meta.productLineScope === "all"
          ? meta.productLines.every((line) => selectedLines.has(line))
          : meta.productLines.some((line) => selectedLines.has(line));
      if (!hit) return false;
    }
  }

  if (meta.businessTypes.length > 0) {
    const btHit =
      meta.businessTypes.includes(input.primaryBusinessType) ||
      (input.secondaryBusinessType ? meta.businessTypes.includes(input.secondaryBusinessType) : false);
    if (!btHit) return false;
  }

  return true;
}

function ensureAlwaysVisibleNavL1(merged: Set<string>): void {
  for (const id of ALWAYS_VISIBLE_NAV_L1) merged.add(id);
}

function isAlwaysVisibleNavL1(moduleId: string): boolean {
  return (ALWAYS_VISIBLE_NAV_L1 as readonly string[]).includes(moduleId);
}

/** 租户在引导 Step 3 中关闭的功能（L1/L2/L3/L4 id） */
export function isTenantFeatureRemoved(profile: TenantProfile, featureId: string): boolean {
  return profile.removedFeatures.includes(featureId);
}

function isL3IdExcluded(ctx: VisibilityContext, itemId: string, l4Path?: string, moduleId?: string): boolean {
  if (ctx.tenantAdded.has(itemId)) return false;
  if (l4Path && ctx.tenantAdded.has(`l4:${l4Path}`)) return false;
  if (moduleId && isAlwaysVisibleNavL1(moduleId)) {
    return false;
  }
  if (ctx.subtreeWhitelistMode) {
    if (ctx.l3Includes.has(itemId)) return false;
    if (l4Path && ctx.l3Includes.has(`l4:${l4Path}`)) return false;
    if (l4Path?.startsWith("set:") && ctx.l3Includes.has(l4Path)) return false;
    return true;
  }
  if (ctx.l3Excludes.has(itemId)) return true;
  if (l4Path && ctx.l3Excludes.has(`l4:${l4Path}`)) return true;
  if (l4Path?.startsWith("set:")) {
    if (ctx.l3Excludes.has(l4Path)) return true;
  }
  return false;
}

/** 租户侧未关闭的一级模块（mergePresets 已开通且不在 removedFeatures） */
function collectTenantActiveL1(l1: Set<string>, input: TenantProfileInput): Set<string> {
  const active = new Set<string>();
  for (const id of l1) {
    if (!input.removedFeatures.includes(id)) active.add(id);
  }
  return active;
}

function resolveL2Visibility(input: TenantProfileInput, l1: Set<string>): VisibilityContext {
  const l2 = new Set<string>();
  const { l2Includes, l3Includes, whitelistMode } = collectSubtreeWhitelists(input);
  const presetWhitelist: PresetL2Whitelist = { l2Includes, subtreeWhitelistMode: whitelistMode };
  const l2Excludes = collectL2Excludes(input, presetWhitelist);
  const l3Excludes = collectL3Excludes(input);
  const tenantActiveL1 = collectTenantActiveL1(l1, input);

  for (const meta of FEATURE_REGISTRY_L2) {
    if (!l1.has(meta.moduleId)) continue;
    const alwaysShow = isAlwaysVisibleNavL1(meta.moduleId);
    const tenantL1Active = tenantActiveL1.has(meta.moduleId);
    if (!alwaysShow) {
      if (whitelistMode) {
        if (!l2Includes.has(meta.featureId)) {
          const tenantExplicit =
            input.addedFeatures.includes(meta.featureId) && !input.removedFeatures.includes(meta.featureId);
          if (!tenantExplicit) continue;
        }
      } else if (l2Excludes.has(meta.featureId)) {
        continue;
      }
    }
    if (input.removedFeatures.includes(meta.featureId)) continue;
    if (!tenantL1Active && !l2PassesScopeGates(meta, input, presetWhitelist)) continue;
    l2.add(meta.featureId);
  }

  if (whitelistMode) {
    for (const mod of buildPresetNavTree()) {
      if (!tenantActiveL1.has(mod.moduleId)) continue;
      const moduleNavL2 = NAV_MODULE_CHILD_IDS.get(mod.moduleId) ?? [];
      const virtualL2Ids = getVirtualL2NodesForModule(mod.moduleId).map((e) => e.l2FeatureId);
      const navInWhitelist = moduleNavL2.some((id) => l2Includes.has(id));
      const virtualInWhitelist = virtualL2Ids.some((id) => l2Includes.has(id));
      if (!virtualInWhitelist || navInWhitelist) continue;
      for (const meta of getL2FeaturesForModule(mod.moduleId)) {
        if (input.removedFeatures.includes(meta.featureId)) continue;
        if (!l2PassesScopeGates(meta, input, presetWhitelist) && !tenantActiveL1.has(mod.moduleId)) continue;
        l2.add(meta.featureId);
      }
    }
  }

  for (const entry of getTertiaryRegistryEntries()) {
    if (!l1.has(entry.moduleId)) continue;
    if (!tenantActiveL1.has(entry.moduleId)) continue;
    if (input.removedFeatures.includes(entry.l2FeatureId)) continue;
    if (whitelistMode && !l2Includes.has(entry.l2FeatureId)) {
      const tenantExplicit =
        input.addedFeatures.includes(entry.l2FeatureId) &&
        !input.removedFeatures.includes(entry.l2FeatureId);
      if (!tenantExplicit) continue;
    }
    l2.add(entry.l2FeatureId);
  }

  for (const id of input.addedFeatures) {
    if (input.removedFeatures.includes(id)) continue;
    const l2meta = getFeatureMetaL2(id);
    if (l2meta) {
      if (l1.has(l2meta.moduleId)) l2.add(id);
      continue;
    }
    const virtual = getTertiaryRegistryEntries().find((e) => e.l2FeatureId === id);
    if (virtual && l1.has(virtual.moduleId)) l2.add(id);
  }

  const tenantAdded = new Set(
    input.addedFeatures.filter((id) => !input.removedFeatures.includes(id)),
  );

  return {
    l1,
    l2,
    l2Excludes,
    l3Excludes,
    l2Includes,
    l3Includes,
    subtreeWhitelistMode: whitelistMode,
    l1Includes: new Set(),
    tenantAdded,
    tenantActiveL1,
  };
}

export function mergePresets(input: TenantProfileInput, _licenseSkus: string[] = []): Set<string> {
  const merged = new Set<string>();
  const variantL1 = new Set<string>();

  if (input.productLinePresetIds.length > 0) {
    for (const presetId of input.productLinePresetIds) {
      const preset = getEffectiveVariantForPair(input.primaryBusinessType, presetId);
      if (!preset) continue;
      for (const id of collectVariantEnabledL1(preset)) {
        merged.add(id);
        variantL1.add(id);
      }
    }
  } else {
    for (const id of collectBusinessTypeFeatures(input.primaryBusinessType)) merged.add(id);
    if (input.secondaryBusinessType) {
      for (const id of collectBusinessTypeFeatures(input.secondaryBusinessType)) merged.add(id);
    }
  }

  if (input.productLines.length > 0 && !shouldUseFullFeaturePresetScope(input)) {
    applyL1ProductLineScopeFilter(merged, input.productLines);
  }

  // 平台变体显式开通的 L1 优先于产线 scope 过滤（与平台预设编辑勾选一致）
  for (const id of variantL1) merged.add(id);

  for (const id of input.addedFeatures) {
    if (!getFeatureMetaL2(id)) merged.add(id);
  }

  ensureAlwaysVisibleNavL1(merged);

  for (const id of input.removedFeatures) {
    if (!getFeatureMetaL2(id)) merged.delete(id);
  }

  return merged;
}

let visibilityContextCache: { key: string; ctx: VisibilityContext } | null = null;
let cachedPresetsFingerprint: string | null = null;

const NAV_MODULE_CHILD_IDS = new Map(NAV_MODULES.map((m) => [m.id, m.children.map((c) => c.id)]));

/** 平台变体覆盖层指纹（仅在 invalidate 后重算一次，避免每次导航重复 merge 变体） */
function getEffectivePresetsFingerprint(): string {
  if (cachedPresetsFingerprint !== null) return cachedPresetsFingerprint;
  const overrides = getBusinessProductLineVariantOverrides();
  const keys = Object.keys(overrides).sort();
  if (keys.length === 0) {
    cachedPresetsFingerprint = "seed";
    return cachedPresetsFingerprint;
  }
  cachedPresetsFingerprint = keys
    .map((id) => {
      const o = overrides[id];
      const l2 = o.l2Includes ?? [];
      const l3 = o.l3Includes ?? [];
      const features = (o.features ?? []).map((f) => f.featureId).sort().join(",");
      return `${id}@v${o.version ?? 0}:${features}:${l2.length}:${l3.length}:${l2.join(",")}:${l3.join(",")}`;
    })
    .join("|");
  return cachedPresetsFingerprint;
}

function profileVisibilityCacheKey(profile: TenantProfile): string {
  return JSON.stringify({
    primaryBusinessType: profile.primaryBusinessType,
    secondaryBusinessType: profile.secondaryBusinessType,
    productLinePresetIds: profile.productLinePresetIds,
    productLines: profile.productLines,
    addedFeatures: profile.addedFeatures,
    removedFeatures: profile.removedFeatures,
    presetVersions: profile.presetVersions,
    presetsFp: getEffectivePresetsFingerprint(),
  });
}

/** 租户画像或平台预设变更后清空，避免侧栏重复计算可见性 */
export function invalidateVisibilityContextCache(): void {
  visibilityContextCache = null;
  cachedPresetsFingerprint = null;
}

export function resolveVisibilityContext(profile: TenantProfile): VisibilityContext {
  const key = profileVisibilityCacheKey(profile);
  if (visibilityContextCache?.key === key) return visibilityContextCache.ctx;
  const input = profileToInput(profile);
  const l1 = mergePresets(input);
  const ctx = resolveL2Visibility(input, l1);
  visibilityContextCache = { key, ctx };
  return ctx;
}

export function resolveVisibleFeatureIds(profile: TenantProfile): Set<string> {
  const ctx = resolveVisibilityContext(profile);
  return new Set([...ctx.l1, ...ctx.l2]);
}

export function isProfileFilteringActive(profile: TenantProfile | null): boolean {
  if (!profile) return false;
  return profile.onboardingCompleted || profile.implementationPreConfigured;
}

/**
 * 主导航壳层（侧栏 / 侧滑 / 路由守卫 / 权限树 / 搜索）是否在引导完成后按租户画像过滤。
 * 引导未完成前保持全量展示，便于浏览；完成引导后与业态×产线预设及 Step 3 勾选同步。
 */
export function isNavShellFilteringActive(profile?: TenantProfile | null): boolean {
  const p = profile ?? loadTenantProfile();
  if (!p || !p.onboardingCompleted) return false;
  return isProfileFilteringActive(p);
}

/** 预设合并后 L1 是否开通（设置 catalog、引导 Step 4 预览） */
export function isModuleVisibleInPreset(moduleId: string, profile?: TenantProfile | null): boolean {
  const p = profile ?? loadTenantProfile();
  if (!p || !isProfileFilteringActive(p)) return true;
  return resolveVisibilityContext(p).l1.has(moduleId);
}

/** 主导航 L1 是否展示 */
export function isModuleVisible(moduleId: string, profile?: TenantProfile | null): boolean {
  const p = profile ?? loadTenantProfile();
  if (!p || !isNavShellFilteringActive(p)) return true;
  return isModuleVisibleInPreset(moduleId, p);
}

/** L2 子入口：父 L1 勾选 + 平台预设 L2 白名单 + 租户 removedFeatures */
export function isL2FeatureVisible(featureId: string, profile?: TenantProfile | null): boolean {
  const p = profile ?? loadTenantProfile();
  const meta = getFeatureMetaL2(featureId);
  if (!meta) return true;
  if (!p || !isNavShellFilteringActive(p)) return true;

  if (p.removedFeatures.includes(featureId)) return false;
  const ctx = resolveVisibilityContext(p);
  return ctx.l2.has(featureId);
}

function isTertiaryLeafRemoved(p: TenantProfile, itemId: string, l4Path?: string): boolean {
  if (isTenantFeatureRemoved(p, itemId)) return true;
  if (l4Path && isTenantFeatureRemoved(p, `l4:${l4Path}`)) return true;
  return false;
}

/** 三级 / 四级导航项是否可见（需已知所属 moduleId + L2） */
export function isTertiaryNavItemVisible(
  item: ProductCenterSidebarSubItem,
  moduleId: string,
  l2FeatureId: string,
  profile?: TenantProfile | null,
): boolean {
  const p = profile ?? loadTenantProfile();
  if (!p || !isNavShellFilteringActive(p)) return true;
  if (!isL2FeatureVisible(l2FeatureId, p)) return false;

  const ctx = resolveVisibilityContext(p);
  if (isTertiaryLeafRemoved(p, item.id)) return false;
  if (isL3IdExcluded(ctx, item.id, undefined, moduleId)) return false;

  if (!item.sidebarChildren?.length) return true;

  const visibleChildren = item.sidebarChildren.filter(
    (c) => !isL3IdExcluded(ctx, item.id, c.path, moduleId) && !isTertiaryLeafRemoved(p, item.id, c.path),
  );
  return visibleChildren.length > 0;
}

/** 聚合侧滑层 subnav：按项归属 L2 分别过滤 */
export function filterSheetSubnavForModule(
  moduleId: string,
  items: ProductCenterSidebarSubItem[],
  profile?: TenantProfile | null,
): ProductCenterSidebarSubItem[] {
  const p = profile ?? loadTenantProfile();
  if (!p || !isNavShellFilteringActive(p)) return items;
  if (!isModuleVisible(moduleId, p)) return [];

  return items.flatMap((item) => {
    const l2 = resolveSheetItemL2(moduleId, item.id);
    return filterTertiarySubnav([item], moduleId, l2, p);
  });
}

export function filterTertiarySubnav(
  items: ProductCenterSidebarSubItem[],
  moduleId: string,
  l2FeatureId: string,
  profile?: TenantProfile | null,
): ProductCenterSidebarSubItem[] {
  const p = profile ?? loadTenantProfile();
  if (!p || !isNavShellFilteringActive(p)) return items;
  if (!isL2FeatureVisible(l2FeatureId, p)) return [];

  const ctx = resolveVisibilityContext(p);

  return items
    .filter((item) => isTertiaryNavItemVisible(item, moduleId, l2FeatureId, p))
    .map((item) => {
      if (!item.sidebarChildren?.length) return item;
      const children = item.sidebarChildren.filter(
        (c) => !isL3IdExcluded(ctx, item.id, c.path, moduleId) && !isTertiaryLeafRemoved(p, item.id, c.path),
      );
      if (children.length === 0) return null;
      if (children.length === item.sidebarChildren.length) return item;
      return { ...item, sidebarChildren: children };
    })
    .filter((item): item is ProductCenterSidebarSubItem => item !== null);
}

/** 路由是否落在可访问的三级域内 */
export function isTertiaryNavPathVisible(path: string, profile?: TenantProfile | null): boolean {
  const p = profile ?? loadTenantProfile();
  if (!p || !isNavShellFilteringActive(p)) return true;

  const hit = resolveTertiaryPathHit(path);
  if (!hit) return true;

  if (!isL2FeatureVisible(hit.l2FeatureId, p)) return false;

  const ctx = resolveVisibilityContext(p);
  if (isTertiaryLeafRemoved(p, hit.itemId, hit.l4Path)) return false;
  if (isL3IdExcluded(ctx, hit.itemId, hit.l4Path, hit.moduleId)) return false;

  return true;
}

export function getVisibleNavModules(profile?: TenantProfile | null): NavModule[] {
  const p = profile ?? loadTenantProfile();
  if (!p || !isNavShellFilteringActive(p)) return NAV_MODULES;
  const visible = resolveVisibilityContext(p).l1;
  return NAV_MODULES.filter((m) => visible.has(m.id));
}

/** 模块下可见的 L2 子入口（侧栏二级 / 顶栏 Tab） */
export function getVisibleModuleChildren(
  m: NavModule,
  profile?: TenantProfile | null,
): NavModule["children"] {
  const p = profile ?? loadTenantProfile();
  if (!p || !isNavShellFilteringActive(p)) return m.children;
  return m.children.filter((c) => isL2FeatureVisible(c.id, p));
}

export function getVisibleSheetSubnav(m: NavModule, profile?: TenantProfile | null): ProductCenterSidebarSubItem[] {
  const items = navModuleChildrenAsSheetSubnav(m);
  const p = profile ?? loadTenantProfile();
  if (!p || !isNavShellFilteringActive(p)) return items;
  if (!isModuleVisible(m.id, p)) return [];
  return items.filter((item) => isL2FeatureVisible(item.id, p));
}

export function previewVisibleModuleIds(input: TenantProfileInput): string[] {
  const l1 = mergePresets(input);
  const ctx = resolveL2Visibility(input, l1);
  return [...new Set([...ctx.l1, ...ctx.l2])].sort();
}

/** 业态×产线预设合并后应默认启用的一级模块（不含租户 removed/added 覆盖） */
export function computePresetEnabledL1Modules(input: TenantProfileInput): Set<string> {
  return mergePresets({
    ...input,
    addedFeatures: [],
    removedFeatures: [],
  });
}

/**
 * 平台变体保存的 L1 白名单（与预设编辑页 features 一致，不含租户级 PLATFORM_PRESET_DEFAULT_L1 补全）
 */
export function computeVariantPresetEnabledL1Modules(input: TenantProfileInput): Set<string> {
  const merged = new Set<string>();
  const variantL1 = new Set<string>();

  for (const presetId of input.productLinePresetIds) {
    const preset = getEffectiveVariantForPair(input.primaryBusinessType, presetId);
    if (!preset) continue;
    for (const id of collectVariantEnabledL1(preset)) {
      merged.add(id);
      variantL1.add(id);
    }
  }

  if (input.productLines.length > 0 && !shouldUseFullFeaturePresetScope(input)) {
    applyL1ProductLineScopeFilter(merged, input.productLines);
  }

  for (const id of variantL1) merged.add(id);

  return merged;
}

/**
 * 引导 Step 3：按平台变体计算默认 removedFeatures（非预设项默认不勾选）
 */
export function computePresetDefaultRemovedFeatures(_input: TenantProfileInput): string[] {
  return [];
}
