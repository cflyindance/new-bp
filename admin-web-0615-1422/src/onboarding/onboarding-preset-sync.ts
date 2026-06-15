/**
 * 引导流程 — 按平台「业态×产线预设」同步 Step 3 默认功能勾选
 */
import {
  ALWAYS_VISIBLE_NAV_L1,
  FEATURE_REGISTRY_L1,
  PLATFORM_PRESET_DEFAULT_L1,
  type BusinessTypeTag,
} from "../config/feature-registry";
import { buildPresetNavTree, collectModuleNavSubtreeIds } from "../config/feature-presets-nav-tree";
import { listEffectiveVariantsForTenant } from "../config/feature-presets-variant-runtime";
import { NAV_MODULES } from "../config/navigation";
import {
  collectVariantPresetSubtreeIds,
  computePresetDefaultRemovedFeatures,
  computeVariantPresetEnabledL1Modules,
  mergePresets,
  previewVisibleModuleIds,
  resolveVisibilityContext,
  type TenantProfileInput,
  type VisibilityContext,
} from "../config/feature-visibility";
import {
  createDefaultProfile,
  resolveProductLinesFromPresetIds,
  type TenantProfile,
} from "../config/tenant-profile-storage";

export interface OnboardingPresetDraft {
  primaryBusinessType?: BusinessTypeTag;
  secondaryBusinessType?: BusinessTypeTag;
  productLinePresetIds: string[];
  removedFeatures: string[];
  addedFeatures: string[];
  /** 上次按预设同步时的业态+产线指纹，避免 Step 3 重复渲染覆盖用户手动调整 */
  presetSyncKey?: string;
}

/** Step 3 不参与勾选的一级模块（系统始终展示） */
const ONBOARDING_L1_TOGGLE_SKIP = new Set<string>(ALWAYS_VISIBLE_NAV_L1);

/** 平台预设中已勾选的一级模块 */
export function isOnboardingL1PresetEnabled(moduleId: string, draft: OnboardingPresetDraft): boolean {
  if (!draft.primaryBusinessType || draft.productLinePresetIds.length === 0) return false;
  return getOnboardingPresetEnabledL1Modules(draft).has(moduleId);
}

/** Step 3 一级模块是否被用户勾选（预设默认开，非预设默认关） */
export function isOnboardingL1Checked(moduleId: string, draft: OnboardingPresetDraft): boolean {
  if (isOnboardingL1PresetEnabled(moduleId, draft)) {
    return !draft.removedFeatures.includes(moduleId);
  }
  return draft.addedFeatures.includes(moduleId);
}

/** Step 3 展示的全部一级模块（含平台预设未勾选项，默认不勾选） */
export function listOnboardingStep3L1ModuleIds(draft: OnboardingPresetDraft): string[] {
  if (!draft.primaryBusinessType || draft.productLinePresetIds.length === 0) return [];
  const navIds = new Set(NAV_MODULES.map((m) => m.id));
  const listed = new Set<string>();

  for (const moduleId of PLATFORM_PRESET_DEFAULT_L1) {
    if (ONBOARDING_L1_TOGGLE_SKIP.has(moduleId)) continue;
    if (navIds.has(moduleId)) listed.add(moduleId);
  }

  for (const id of getOnboardingPresetEnabledL1Modules(draft)) {
    if (ONBOARDING_L1_TOGGLE_SKIP.has(id)) continue;
    if (navIds.has(id)) listed.add(id);
  }

  // 注册表全部 L1 均展示（含平台预设未勾选项）；业态/产线仅影响默认勾选，不隐藏可选项
  for (const meta of FEATURE_REGISTRY_L1) {
    if (ONBOARDING_L1_TOGGLE_SKIP.has(meta.moduleId)) continue;
    if (!navIds.has(meta.moduleId)) continue;
    listed.add(meta.moduleId);
  }

  const order = new Map(FEATURE_REGISTRY_L1.map((m, i) => [m.moduleId, i]));
  return [...listed].sort(
    (a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999) || a.localeCompare(b),
  );
}

export interface OnboardingFeatureL3Node {
  id: string;
  label: string;
  presetEnabled: boolean;
}

export interface OnboardingFeatureL2Node {
  id: string;
  label: string;
  presetEnabled: boolean;
  children: OnboardingFeatureL3Node[];
}

export interface OnboardingFeatureL1Node {
  moduleId: string;
  label: string;
  presetEnabled: boolean;
  children: OnboardingFeatureL2Node[];
}

export function buildOnboardingPresetSyncKey(draft: OnboardingPresetDraft): string {
  const lines = [...draft.productLinePresetIds].sort().join(",");
  const bt = draft.primaryBusinessType ?? "";
  if (!draft.primaryBusinessType || draft.productLinePresetIds.length === 0) {
    return `${bt}:${lines}`;
  }
  const variants = listEffectiveVariantsForTenant(draft.primaryBusinessType, draft.productLinePresetIds);
  const variantPart = variants
    .map((v) => `${v.id}@v${v.version}`)
    .sort()
    .join(",");
  return `${bt}:${lines}|${variantPart}`;
}

function draftToCleanInput(draft: OnboardingPresetDraft): TenantProfileInput {
  return {
    primaryBusinessType: draft.primaryBusinessType ?? "general",
    secondaryBusinessType: draft.secondaryBusinessType,
    productLinePresetIds: draft.productLinePresetIds,
    productLines: resolveProductLinesFromPresetIds(draft.productLinePresetIds),
    addedFeatures: [],
    removedFeatures: [],
  };
}

/** 引导提交后的租户画像（与侧栏可见性一致） */
export function buildOnboardingCommittedProfile(
  draft: OnboardingPresetDraft,
  base?: TenantProfile | null,
): TenantProfile {
  const synced = syncOnboardingDraftFromPresets(draft);
  const selections = resolveOnboardingCommitFeatures(synced);
  const input: TenantProfileInput = {
    primaryBusinessType: synced.primaryBusinessType ?? "general",
    secondaryBusinessType: synced.secondaryBusinessType,
    productLinePresetIds: synced.productLinePresetIds,
    productLines: resolveProductLinesFromPresetIds(synced.productLinePresetIds),
    addedFeatures: selections.addedFeatures,
    removedFeatures: selections.removedFeatures,
  };
  const seed = base ?? createDefaultProfile();
  return {
    ...seed,
    primaryBusinessType: synced.primaryBusinessType ?? "general",
    secondaryBusinessType: synced.secondaryBusinessType,
    productLinePresetIds: [...synced.productLinePresetIds],
    productLines: resolveProductLinesFromPresetIds(synced.productLinePresetIds),
    addedFeatures: selections.addedFeatures,
    removedFeatures: selections.removedFeatures,
    enabledFeatures: [...mergePresets(input), ...selections.addedFeatures],
    onboardingCompleted: true,
    implementationPreConfigured: listOnboardingResolvedVariants(synced).length > 0,
  };
}

/** 与进入系统后一致的租户画像预览（Step 3 功能树 / 提交前） */
export function buildOnboardingProfilePreview(draft: OnboardingPresetDraft): TenantProfile {
  return buildOnboardingCommittedProfile(draft);
}

function isL3LeafEnabledInContext(
  ctx: VisibilityContext,
  leafId: string,
  leafPath: string | undefined,
  moduleId: string,
): boolean {
  if (ctx.subtreeWhitelistMode) {
    if (ctx.l3Includes.has(leafId)) return true;
    if (leafPath && ctx.l3Includes.has(`l4:${leafPath}`)) return true;
    return false;
  }
  if (ctx.l3Excludes.has(leafId)) return false;
  if (leafPath && ctx.l3Excludes.has(`l4:${leafPath}`)) return false;
  return true;
}

/** 引导提交：含系统始终展示的一级模块 */
function listOnboardingCommitL1ModuleIds(draft: OnboardingPresetDraft): string[] {
  const order = new Map(FEATURE_REGISTRY_L1.map((m, i) => [m.moduleId, i]));
  const ids = new Set(listOnboardingStep3L1ModuleIds(draft));
  for (const id of ALWAYS_VISIBLE_NAV_L1) ids.add(id);
  return [...ids].sort(
    (a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999) || a.localeCompare(b),
  );
}

function isOnboardingL1CommitEnabled(moduleId: string, draft: OnboardingPresetDraft): boolean {
  if ((ALWAYS_VISIBLE_NAV_L1 as readonly string[]).includes(moduleId)) {
    return !draft.removedFeatures.includes(moduleId);
  }
  return isOnboardingL1Checked(moduleId, draft);
}

/** 引导提交：预设树内 L1 用变体 L2/L3 白名单，其余用完整导航子树 */
function resolveOnboardingCommitSubtree(
  moduleId: string,
  draft: OnboardingPresetDraft,
  presetEnabled: boolean,
): { l2: string[]; l3: string[] } {
  const inPresetTree = buildPresetNavTree().some((m) => m.moduleId === moduleId);
  if (
    presetEnabled &&
    inPresetTree &&
    draft.primaryBusinessType &&
    draft.productLinePresetIds.length > 0
  ) {
    return collectVariantPresetSubtreeIds(moduleId, {
      primaryBusinessType: draft.primaryBusinessType,
      productLinePresetIds: draft.productLinePresetIds,
    });
  }
  return collectModuleNavSubtreeIds(moduleId);
}

function buildOnboardingL2NodesForModule(
  mod: ReturnType<typeof buildPresetNavTree>[number],
  draft: OnboardingPresetDraft,
  ctx: VisibilityContext,
): OnboardingFeatureL2Node[] {
  const useFullSubtree = isOnboardingL1Checked(mod.moduleId, draft);
  const l2Nodes: OnboardingFeatureL2Node[] = [];

  for (const l2 of mod.children) {
    if (!useFullSubtree && !ctx.l2.has(l2.id)) continue;

    const l3Nodes: OnboardingFeatureL3Node[] = [];
    for (const group of l2.groups) {
      for (const leaf of group.leaves) {
        if (leaf.level === "l2") continue;
        if (!useFullSubtree && !isL3LeafEnabledInContext(ctx, leaf.id, leaf.path, mod.moduleId)) continue;
        l3Nodes.push({
          id: leaf.id,
          label: leaf.label,
          presetEnabled: true,
        });
      }
    }

    l2Nodes.push({
      id: l2.id,
      label: l2.label,
      presetEnabled: true,
      children: l3Nodes,
    });
  }

  return l2Nodes;
}

/** Step 3：平台预设合并后的 L1→L2→L3 功能树（与进入系统后导航域一致） */
export function buildOnboardingFeatureTree(draft: OnboardingPresetDraft): OnboardingFeatureL1Node[] {
  if (!draft.primaryBusinessType || draft.productLinePresetIds.length === 0) return [];

  const profile = buildOnboardingProfilePreview(draft);
  const ctx = resolveVisibilityContext(profile);
  const out: OnboardingFeatureL1Node[] = [];

  for (const mod of buildPresetNavTree()) {
    if (!isOnboardingL1ModuleListed(mod.moduleId, draft)) continue;
    const checked = isOnboardingL1Checked(mod.moduleId, draft);
    if (!checked && !ctx.l1.has(mod.moduleId)) continue;

    const l2Nodes = buildOnboardingL2NodesForModule(mod, draft, ctx);
    if (l2Nodes.length === 0) continue;

    out.push({
      moduleId: mod.moduleId,
      label: mod.label,
      presetEnabled: isOnboardingL1PresetEnabled(mod.moduleId, draft),
      children: l2Nodes,
    });
  }

  return out;
}

export function countOnboardingPresetSubtreeFeatures(draft: OnboardingPresetDraft): {
  l1: number;
  l2: number;
  l3: number;
} {
  const tree = buildOnboardingFeatureTree(draft);
  let l2 = 0;
  let l3 = 0;
  for (const l1 of tree) {
    for (const l2Node of l1.children) {
      l2++;
      l3 += l2Node.children.length;
    }
  }
  return { l1: tree.length, l2, l3 };
}

export function isOnboardingFeatureChecked(
  featureId: string,
  presetEnabled: boolean,
  removedFeatures: readonly string[],
): boolean {
  return presetEnabled && !removedFeatures.includes(featureId);
}

/** 平台预设完整功能树（不含用户 removed，用于提交时计算勾选） */
export function buildOnboardingPresetFeatureTree(draft: OnboardingPresetDraft): OnboardingFeatureL1Node[] {
  return buildOnboardingFeatureTree({
    ...draft,
    removedFeatures: [],
    addedFeatures: [],
  });
}

/**
 * 引导完成提交：将 Step 3 勾选写入 addedFeatures / removedFeatures，
 * 进入系统后侧栏与引导选择一致（不依赖二次推导白名单）。
 */
export function applyOnboardingFeatureToggle(
  draft: OnboardingPresetDraft,
  featureId: string,
  checked: boolean,
): void {
  const isL1 = FEATURE_REGISTRY_L1.some((m) => m.moduleId === featureId);
  if (isL1) {
    const presetEnabled = isOnboardingL1PresetEnabled(featureId, draft);
    const added = new Set(draft.addedFeatures);
    const removed = new Set(draft.removedFeatures);

    if (checked) {
      if (presetEnabled) removed.delete(featureId);
      else added.add(featureId);
      removed.delete(featureId);
    } else {
      if (presetEnabled) {
        removed.add(featureId);
        const subtree = resolveOnboardingCommitSubtree(featureId, draft, true);
        for (const id of subtree.l2) removed.add(id);
        for (const id of subtree.l3) removed.add(id);
      } else {
        added.delete(featureId);
        const subtree = resolveOnboardingCommitSubtree(featureId, draft, false);
        for (const id of subtree.l2) added.delete(id);
        for (const id of subtree.l3) added.delete(id);
      }
    }

    draft.addedFeatures = [...added].sort();
    draft.removedFeatures = [...removed].sort();
    return;
  }

  const tree = buildOnboardingPresetFeatureTree(draft);
  const removed = new Set(draft.removedFeatures);

  const enable = (id: string) => removed.delete(id);
  const disable = (id: string) => removed.add(id);

  if (checked) {
    enable(featureId);
    for (const l1 of tree) {
      if (l1.moduleId === featureId) continue;
      for (const l2 of l1.children) {
        if (l2.id === featureId) {
          enable(l1.moduleId);
          continue;
        }
        for (const l3 of l2.children) {
          if (l3.id === featureId) {
            enable(l1.moduleId);
            enable(l2.id);
          }
        }
      }
    }
  } else {
    disable(featureId);
    for (const l1 of tree) {
      if (l1.moduleId === featureId) {
        for (const l2 of l1.children) {
          disable(l2.id);
          for (const l3 of l2.children) disable(l3.id);
        }
        continue;
      }
      for (const l2 of l1.children) {
        if (l2.id === featureId) {
          for (const l3 of l2.children) disable(l3.id);
        }
      }
    }
  }

  draft.removedFeatures = [...removed].sort();
}

export function resolveOnboardingCommitFeatures(draft: OnboardingPresetDraft): {
  addedFeatures: string[];
  removedFeatures: string[];
} {
  const added = new Set<string>();
  const removed = new Set<string>();

  for (const moduleId of listOnboardingCommitL1ModuleIds(draft)) {
    const checked = isOnboardingL1CommitEnabled(moduleId, draft);
    const presetEnabled = isOnboardingL1PresetEnabled(moduleId, draft);
    const subtree = resolveOnboardingCommitSubtree(moduleId, draft, presetEnabled);

    if (!checked) {
      if (presetEnabled) {
        removed.add(moduleId);
        for (const id of subtree.l2) removed.add(id);
        for (const id of subtree.l3) removed.add(id);
      }
      continue;
    }

    added.add(moduleId);
    for (const id of subtree.l2) added.add(id);
    for (const id of subtree.l3) added.add(id);
  }

  return {
    addedFeatures: [...added].sort(),
    removedFeatures: [...removed].sort(),
  };
}

/** Step 3/4：用户最终勾选的一级模块数量 */
export function countOnboardingSelectedL1Modules(draft: OnboardingPresetDraft): number {
  return listOnboardingStep3L1ModuleIds(draft).filter((id) => isOnboardingL1Checked(id, draft)).length;
}

/** Step 4：用户勾选的一级模块列表 */
export function buildOnboardingSelectedL1Modules(
  draft: OnboardingPresetDraft,
): Array<{ moduleId: string; label: string }> {
  const tree = buildOnboardingPresetFeatureTree(draft);
  const labelByModule = new Map(tree.map((l1) => [l1.moduleId, l1.label]));
  return listOnboardingStep3L1ModuleIds(draft)
    .filter((moduleId) => isOnboardingL1Checked(moduleId, draft))
    .map((moduleId) => ({
      moduleId,
      label: labelByModule.get(moduleId) ?? NAV_MODULES.find((m) => m.id === moduleId)?.title ?? moduleId,
    }));
}

export function countOnboardingSelectedSubtreeFeatures(draft: OnboardingPresetDraft): {
  l1: number;
  l2: number;
  l3: number;
} {
  const tree = buildOnboardingFeatureTree(draft);
  const treeByModule = new Map(tree.map((l1) => [l1.moduleId, l1]));
  let l1 = 0;
  let l2 = 0;
  let l3 = 0;
  for (const moduleId of listOnboardingStep3L1ModuleIds(draft)) {
    if (!isOnboardingL1Checked(moduleId, draft)) continue;
    l1++;
    const node = treeByModule.get(moduleId);
    if (!node) continue;
    for (const l2Node of node.children) {
      l2++;
      l3 += l2Node.children.length;
    }
  }
  return { l1, l2, l3 };
}

/** 业态 + 产线组合解析预设后的可见 featureId（含 L1/L2） */
export function previewOnboardingVisibleFeatures(draft: OnboardingPresetDraft): string[] {
  if (!draft.primaryBusinessType || draft.productLinePresetIds.length === 0) return [];
  return previewVisibleModuleIds(draftToCleanInput(draft));
}

/** 可见一级模块数量（Step 2 预览：与平台变体保存的 L1 一致） */
export function countOnboardingVisibleL1Modules(draft: OnboardingPresetDraft): number {
  if (!draft.primaryBusinessType || draft.productLinePresetIds.length === 0) return 0;
  return computeVariantPresetEnabledL1Modules(draftToCleanInput(draft)).size;
}

/** 平台变体中应默认勾选的一级模块（与预设编辑页保存结果一致） */
export function getOnboardingPresetEnabledL1Modules(draft: OnboardingPresetDraft): Set<string> {
  if (!draft.primaryBusinessType || draft.productLinePresetIds.length === 0) return new Set();
  return computeVariantPresetEnabledL1Modules(draftToCleanInput(draft));
}

/**
 * 进入功能确认步前，用平台业态×产线变体保存结果重置默认勾选。
 * 业态/产线组合或变体版本变化时重新同步，避免 Step 3 内用户手动调整被覆盖。
 */
export function syncOnboardingDraftFromPresets<T extends OnboardingPresetDraft>(
  draft: T,
  options?: { force?: boolean },
): T {
  const syncKey = buildOnboardingPresetSyncKey(draft);

  if (!draft.primaryBusinessType || draft.productLinePresetIds.length === 0) {
    return { ...draft, removedFeatures: [], addedFeatures: [], presetSyncKey: undefined };
  }

  if (!options?.force && draft.presetSyncKey === syncKey) {
    return draft;
  }

  return {
    ...draft,
    removedFeatures: computePresetDefaultRemovedFeatures(draftToCleanInput(draft)),
    addedFeatures: [],
    presetSyncKey: syncKey,
  };
}

export function listOnboardingResolvedVariants(draft: OnboardingPresetDraft) {
  if (!draft.primaryBusinessType) return [];
  return listEffectiveVariantsForTenant(draft.primaryBusinessType, draft.productLinePresetIds);
}

/** Step 3 是否展示该一级模块（含平台预设未勾选的可选模块） */
export function isOnboardingL1ModuleListed(moduleId: string, draft: OnboardingPresetDraft): boolean {
  return listOnboardingStep3L1ModuleIds(draft).includes(moduleId);
}
