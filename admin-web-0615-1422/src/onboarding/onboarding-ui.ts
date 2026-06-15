import { getEffectiveBusinessTypePresets } from "../config/feature-presets-catalog-runtime";
import { PRODUCT_LINE_KEYS, PRODUCT_LINE_QUICK_BUNDLES, type BusinessTypePreset } from "../config/feature-presets";
import {
  groupBusinessTypesForOnboarding,
  ONBOARDING_TAXONOMY_GROUP_LABELS,
} from "../config/feature-presets-taxonomy";
import { FEATURE_REGISTRY_L1, ONBOARDING_GROUP_LABELS, type BusinessTypeTag } from "../config/feature-registry";
import {
  applyOnboardingFeatureToggle,
  buildOnboardingPresetSyncKey,
  buildOnboardingSelectedL1Modules,
  countOnboardingSelectedL1Modules,
  countOnboardingSelectedSubtreeFeatures,
  countOnboardingVisibleL1Modules,
  isOnboardingL1Checked,
  isOnboardingL1PresetEnabled,
  listOnboardingStep3L1ModuleIds,
  listOnboardingResolvedVariants,
  buildOnboardingCommittedProfile,
  syncOnboardingDraftFromPresets,
} from "./onboarding-preset-sync";
import { NAV_MODULES } from "../config/navigation";
import { applyActiveTenantPresetSettings } from "../config/feature-presets-setting-apply";
import {
  areFeaturePresetsLoaded,
  ensureFeaturePresetsLoaded,
  initFeaturePresetsFromApi,
} from "../config/feature-presets-api";
import { invalidateVisibilityContextCache } from "../config/feature-visibility";
import { getEffectiveVariantForPair } from "../config/feature-presets-variant-runtime";
import { saveTenantProfileToApi } from "../config/tenant-profile-api";
import {
  createDefaultProfile,
  loadTenantProfile,
  resolveProductLinesFromPresetIds,
  type TenantProfile,
} from "../config/tenant-profile-storage";

const DRAFT_KEY = "onboarding-draft-v1";

export const ONBOARDING_BASE_PATH = "/onboarding";

export interface OnboardingDraft {
  step: 1 | 2 | 3 | 4;
  primaryBusinessType?: BusinessTypeTag;
  secondaryBusinessType?: BusinessTypeTag;
  productLinePresetIds: string[];
  removedFeatures: string[];
  addedFeatures: string[];
  presetSyncKey?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadDraft(): OnboardingDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw) as OnboardingDraft;
  } catch {
    /* ignore */
  }
  return { step: 1, productLinePresetIds: [], removedFeatures: [], addedFeatures: [] };
}

function saveDraft(draft: OnboardingDraft): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY);
}

/** 重新运行引导前清空 session 草稿，避免旧业态/产线残留 */
export function resetOnboardingDraft(): void {
  clearDraft();
}

export function isOnboardingPath(path: string): boolean {
  return path === ONBOARDING_BASE_PATH || path.startsWith(`${ONBOARDING_BASE_PATH}/`);
}

function getOnboardingStep(path: string): 1 | 2 | 3 | 4 {
  if (path === `${ONBOARDING_BASE_PATH}/lines`) return 2;
  if (path === `${ONBOARDING_BASE_PATH}/features`) return 3;
  if (path === `${ONBOARDING_BASE_PATH}/confirm`) return 4;
  return 1;
}

function stepPath(step: 1 | 2 | 3 | 4): string {
  if (step === 1) return ONBOARDING_BASE_PATH;
  if (step === 2) return `${ONBOARDING_BASE_PATH}/lines`;
  if (step === 3) return `${ONBOARDING_BASE_PATH}/features`;
  return `${ONBOARDING_BASE_PATH}/confirm`;
}

function renderStepIndicator(current: number): string {
  const labels = ["业态", "产线", "功能", "确认"];
  return `
    <ol class="flex items-center justify-center gap-2 text-sm" aria-label="引导步骤">
      ${labels
        .map((label, i) => {
          const n = i + 1;
          const active = n === current;
          const done = n < current;
          return `
        <li class="flex items-center gap-2">
          <span class="flex size-8 items-center justify-center rounded-full text-xs font-medium ${
            active
              ? "bg-primary text-primary-foreground"
              : done
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
          }">${n}</span>
          <span class="${active ? "font-medium text-foreground" : "text-muted-foreground"}">${label}</span>
          ${i < labels.length - 1 ? '<span class="mx-1 text-muted-foreground" aria-hidden="true">→</span>' : ""}
        </li>`;
        })
        .join("")}
    </ol>`;
}

function draftToProfileInput(draft: OnboardingDraft) {
  return {
    primaryBusinessType: draft.primaryBusinessType ?? "general",
    secondaryBusinessType: draft.secondaryBusinessType,
    productLinePresetIds: draft.productLinePresetIds,
    productLines: resolveProductLinesFromPresetIds(draft.productLinePresetIds),
    addedFeatures: draft.addedFeatures,
    removedFeatures: draft.removedFeatures,
  };
}

function renderBusinessTypeCard(bt: BusinessTypePreset, selected: boolean): string {
  return `
    <button type="button" data-onboarding-business="${bt.id}"
      class="rounded-xl border p-4 text-left transition-colors ${
        selected ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/40 hover:bg-muted/40"
      }">
      <p class="font-medium">${escapeHtml(bt.title)}</p>
      <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(bt.titleEn)}</p>
    </button>`;
}

function renderBusinessTypeGroup(
  title: string,
  titleEn: string,
  presets: BusinessTypePreset[],
  draft: OnboardingDraft,
): string {
  if (presets.length === 0) return "";
  return `
    <section class="space-y-3">
      <div class="border-b border-border/60 pb-2">
        <h2 class="text-sm font-semibold text-foreground">${escapeHtml(title)}</h2>
        <p class="text-xs text-muted-foreground">${escapeHtml(titleEn)}</p>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        ${presets
          .map((bt) => renderBusinessTypeCard(bt, draft.primaryBusinessType === bt.id))
          .join("")}
      </div>
    </section>`;
}

function renderStep1(draft: OnboardingDraft): string {
  const groups = groupBusinessTypesForOnboarding(getEffectiveBusinessTypePresets());
  const labels = ONBOARDING_TAXONOMY_GROUP_LABELS;
  return `
    <div>
      <h1 class="mb-2 text-center text-2xl font-semibold tracking-tight">选择您的经营业态</h1>
      <p class="mb-2 text-center text-sm text-muted-foreground">请选择最符合您门店经营形态的业态</p>
      <p class="mb-6 text-center text-xs text-muted-foreground">流程差异大的品类请优先选对应条目（如火锅店选火锅，中式快餐选快餐）</p>
      <div class="mx-auto max-w-3xl space-y-8">
        ${renderBusinessTypeGroup(labels["service-mode"].title, labels["service-mode"].titleEn, groups.serviceMode, draft)}
        ${renderBusinessTypeGroup(labels.cuisine.title, labels.cuisine.titleEn, groups.cuisine, draft)}
        ${renderBusinessTypeGroup(labels.custom.title, labels.custom.titleEn, groups.custom, draft)}
      </div>
    </div>`;
}

function renderStep2(draft: OnboardingDraft): string {
  const previewCount = countOnboardingVisibleL1Modules(draft);
  const variants = listOnboardingResolvedVariants(draft);
  const variantHint =
    variants.length > 0
      ? `<p class="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center text-xs text-primary">将应用业态×产线预设：${variants.map((v) => escapeHtml(v.title)).join("、")}</p>`
      : "";
  return `
    <div>
      <h1 class="mb-2 text-center text-2xl font-semibold tracking-tight">选择使用的产线 / 设备</h1>
      <p class="mb-4 text-center text-sm text-muted-foreground">产线决定渠道相关功能；冲突时以产线为准</p>
      ${variantHint}
      <div class="mb-4 flex flex-wrap justify-center gap-2">
        ${PRODUCT_LINE_QUICK_BUNDLES.map((bundle) => {
          const active =
            bundle.presetIds.length === draft.productLinePresetIds.length &&
            bundle.presetIds.every((id) => draft.productLinePresetIds.includes(id));
          return `
          <button type="button" data-onboarding-quick="${escapeHtml(bundle.id)}"
            class="rounded-full border px-3 py-1.5 text-xs transition-colors ${
              active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
            }">${escapeHtml(bundle.title)}</button>`;
        }).join("")}
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        ${PRODUCT_LINE_KEYS.map((pl) => {
          const checked = draft.productLinePresetIds.includes(pl.id);
          return `
          <label class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
            checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
          }">
            <input type="checkbox" class="mt-1 size-4 accent-primary" data-onboarding-line="${escapeHtml(pl.id)}" ${checked ? "checked" : ""} />
            <span>
              <span class="font-medium">${escapeHtml(pl.title)}</span>
              <span class="mt-1 block text-xs text-muted-foreground">${escapeHtml(pl.titleEn)}</span>
            </span>
          </label>`;
        }).join("")}
      </div>
      <p class="mt-4 text-center text-sm text-muted-foreground">预计将开启 <strong>${previewCount}</strong> 个功能模块（下一步将按平台业态×产线预设生成默认勾选）</p>
    </div>`;
}

function renderStep3(draft: OnboardingDraft): string {
  const synced = syncOnboardingDraftFromPresets(draft);
  const presets = listOnboardingResolvedVariants(synced);
  const selectedL1Count = countOnboardingSelectedL1Modules(synced);
  const presetHint =
    presets.length > 0
      ? `<p class="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center text-xs text-primary">默认勾选来自平台预设：${presets.map((v) => escapeHtml(v.title)).join("、")}</p>`
      : "";

  const groups = new Map<string, { moduleId: string; title: string; presetEnabled: boolean }[]>();
  for (const moduleId of listOnboardingStep3L1ModuleIds(synced)) {
    const meta = FEATURE_REGISTRY_L1.find((m) => m.moduleId === moduleId);
    const mod = NAV_MODULES.find((m) => m.id === moduleId);
    if (!mod) continue;
    const group = meta?.onboardingGroup ?? "store";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({
      moduleId,
      title: mod.title,
      presetEnabled: isOnboardingL1PresetEnabled(moduleId, synced),
    });
  }

  const hasModules = [...groups.values()].some((items) => items.length > 0);

  return `
    <div>
      <h1 class="mb-2 text-center text-2xl font-semibold tracking-tight">确认功能模块</h1>
      <p class="mb-2 text-center text-sm text-muted-foreground">平台预设内模块默认勾选；未纳入预设的模块也会列出，默认不勾选，可按需额外开通</p>
      <p class="mb-4 text-center text-xs text-muted-foreground">已选 ${selectedL1Count} 个一级模块</p>
      ${presetHint}
      <div class="max-h-[min(420px,55vh)] space-y-4 overflow-y-auto pr-1">
        ${[...groups.entries()]
          .map(([groupKey, items]) => {
            if (items.length === 0) return "";
            const label = ONBOARDING_GROUP_LABELS[groupKey]?.title ?? groupKey;
            return `
          <section>
            <h2 class="mb-2 text-sm font-medium text-muted-foreground">${escapeHtml(label)}</h2>
            <ul class="space-y-2">
              ${items
                .map((item) => {
                  const on = isOnboardingL1Checked(item.moduleId, synced);
                  const presetBadge = item.presetEnabled
                    ? ""
                    : `<span class="ml-1.5 text-[10px] text-muted-foreground">（非平台预设）</span>`;
                  return `
                <li class="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span class="text-sm">${escapeHtml(item.title)}${presetBadge}</span>
                  <label class="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" class="size-4 accent-primary" data-onboarding-feature="${escapeHtml(item.moduleId)}" ${on ? "checked" : ""} />
                    启用
                  </label>
                </li>`;
                })
                .join("")}
            </ul>
          </section>`;
          })
          .join("")}
        ${
          !hasModules
            ? `<p class="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">当前业态×产线组合下暂无可用功能，请返回上一步调整产线</p>`
            : ""
        }
      </div>
    </div>`;
}

function renderSelectedFeatureSummary(draft: OnboardingDraft): string {
  const modules = buildOnboardingSelectedL1Modules(draft);
  if (modules.length === 0) {
    return `<p class="text-sm text-muted-foreground">未选择任何功能模块</p>`;
  }
  return `
    <ul class="max-h-[min(200px,32vh)] space-y-1 overflow-y-auto text-sm">
      ${modules.map((m) => `<li class="rounded-md px-2 py-1 text-foreground">${escapeHtml(m.label)}</li>`).join("")}
    </ul>
    <p class="mt-3 text-xs text-muted-foreground">各模块下的二级、三级功能将按平台预设默认开通</p>`;
}

function renderStep4(draft: OnboardingDraft): string {
  const synced = syncOnboardingDraftFromPresets(draft);
  const selectedCounts = countOnboardingSelectedSubtreeFeatures(synced);
  const bt = getEffectiveBusinessTypePresets().find((b) => b.id === draft.primaryBusinessType);
  const lines = draft.productLinePresetIds
    .map((id) => PRODUCT_LINE_KEYS.find((p) => p.id === id)?.title ?? id)
    .join("、");
  const variants = listOnboardingResolvedVariants(draft);
  const variantRow =
    variants.length > 0
      ? `<div class="flex justify-between gap-4">
          <dt class="text-muted-foreground">业态×产线预设</dt>
          <dd class="text-right font-medium">${variants.map((v) => escapeHtml(v.title)).join("、")}</dd>
        </div>`
      : "";

  return `
    <div>
      <h1 class="mb-2 text-center text-2xl font-semibold tracking-tight">准备就绪</h1>
      <p class="mb-6 text-center text-sm text-muted-foreground">确认后将进入系统；已选一级模块下的二级、三级功能按平台预设开通</p>
      <dl class="mb-4 space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
        <div class="flex justify-between gap-4">
          <dt class="text-muted-foreground">经营业态</dt>
          <dd class="font-medium">${escapeHtml(bt?.title ?? "未选择")}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-muted-foreground">产线 / 设备</dt>
          <dd class="text-right font-medium">${escapeHtml(lines || "未选择")}</dd>
        </div>
        ${variantRow}
        <div class="flex justify-between gap-4">
          <dt class="text-muted-foreground">已选一级模块</dt>
          <dd class="font-medium">${selectedCounts.l1} 个</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-muted-foreground">将开通（平台预设）</dt>
          <dd class="font-medium">${selectedCounts.l2} 个二级 · ${selectedCounts.l3} 个三级</dd>
        </div>
      </dl>
      <section class="rounded-xl border border-border p-4">
        <h2 class="mb-3 text-sm font-medium text-foreground">已选一级模块</h2>
        ${renderSelectedFeatureSummary(synced)}
      </section>
      <p class="mt-4 text-center text-xs text-muted-foreground">之后可在「系统设置 → 平台预设」中调整功能范围</p>
    </div>`;
}

function renderNavButtons(step: 1 | 2 | 3 | 4, draft: OnboardingDraft): string {
  const canNext = step === 1 ? !!draft.primaryBusinessType : step === 2 ? draft.productLinePresetIds.length > 0 : true;
  return `
    <div class="flex items-center justify-between gap-3">
      ${
        step > 1
          ? `<button type="button" data-onboarding-back class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">上一步</button>`
          : `<span></span>`
      }
      ${
        step < 4
          ? `<button type="button" data-onboarding-next class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50" ${canNext ? "" : "disabled"}>下一步</button>`
          : `<button type="button" data-onboarding-finish class="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">进入系统</button>`
      }
    </div>`;
}

export function renderOnboardingPage(path: string): string {
  const step = getOnboardingStep(path);
  let draft = loadDraft();
  draft.step = step;

  if (
    (step === 3 || step === 4) &&
    draft.primaryBusinessType &&
    draft.productLinePresetIds.length > 0
  ) {
    // 仅业态/产线组合变化时重置为平台预设默认；Step 4 不得 force，否则会清空 Step 3 取消勾选
    draft = syncOnboardingDraftFromPresets(draft, {
      force: buildOnboardingPresetSyncKey(draft) !== draft.presetSyncKey,
    });
  }

  saveDraft(draft);

  let body = "";
  if (step === 1) body = renderStep1(draft);
  else if (step === 2) body = renderStep2(draft);
  else if (step === 3) body = renderStep3(draft);
  else body = renderStep4(draft);

  return `
    <div class="flex min-h-dvh items-center justify-center bg-background px-4 py-6 sm:py-8">
      <div class="flex max-h-[calc(100dvh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-fade-in">
        <div class="shrink-0 border-b border-border/60 px-6 py-4 sm:px-8 sm:py-5">
          ${renderStepIndicator(step)}
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 sm:px-8 sm:py-5">
          ${body}
        </div>
        <div class="shrink-0 border-t border-border bg-card px-6 py-4 sm:px-8">
          ${renderNavButtons(step, draft)}
        </div>
      </div>
    </div>`;
}

function buildPresetVersionsForProfile(
  businessType: BusinessTypeTag,
  productLinePresetIds: string[],
  existing?: TenantProfile["presetVersions"],
): TenantProfile["presetVersions"] {
  const productLine: Record<string, number> = {};
  for (const id of productLinePresetIds) {
    const variant = getEffectiveVariantForPair(businessType, id);
    productLine[id] = variant?.version ?? existing?.productLine[id] ?? 1;
  }
  const businessPreset = getEffectiveBusinessTypePresets().find((p) => p.id === businessType);
  return {
    business: businessPreset?.version ?? existing?.business ?? 1,
    productLine,
  };
}

function commitDraftToProfile(draft: OnboardingDraft): TenantProfile {
  if (!draft.primaryBusinessType || draft.productLinePresetIds.length === 0) {
    throw new Error("onboarding draft incomplete");
  }
  const synced = syncOnboardingDraftFromPresets(draft);
  const base = loadTenantProfile() ?? createDefaultProfile();
  const profile = buildOnboardingCommittedProfile(synced, base);

  return {
    ...profile,
    enabledFeatures: [...new Set(profile.enabledFeatures)],
    onboardingCompletedAt: new Date().toISOString(),
    presetVersions: buildPresetVersionsForProfile(
      synced.primaryBusinessType!,
      synced.productLinePresetIds,
      base.presetVersions,
    ),
  };
}

export function renderFeatureUnavailablePage(moduleTitle: string): string {
  return `
    <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p class="text-lg font-medium">「${escapeHtml(moduleTitle)}」未开通</p>
        <p class="max-w-md text-sm text-muted-foreground">当前租户的功能画像中未包含此模块。请在「系统设置 → 平台预设」中调整，或重新运行引导。</p>
        <a href="#/dashboard/overview" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">返回主页</a>
      </div>
    </main>`;
}

export function bindOnboardingPage(onNavigate: (path: string) => void): void {
  const draft = loadDraft();
  const step = draft.step;

  document.querySelectorAll<HTMLButtonElement>("[data-onboarding-business]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-onboarding-business") as BusinessTypeTag;
      const d = loadDraft();
      d.primaryBusinessType = id;
      d.productLinePresetIds = [];
      d.removedFeatures = [];
      d.addedFeatures = [];
      d.presetSyncKey = undefined;
      saveDraft(d);
      onNavigate(stepPath(1));
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-onboarding-quick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const quickId = btn.getAttribute("data-onboarding-quick");
      const bundle = PRODUCT_LINE_QUICK_BUNDLES.find((b) => b.id === quickId);
      if (!bundle) return;
      const d = loadDraft();
      d.productLinePresetIds = [...bundle.presetIds];
      d.removedFeatures = [];
      d.addedFeatures = [];
      d.presetSyncKey = undefined;
      saveDraft(d);
      onNavigate(stepPath(2));
    });
  });

  document.querySelectorAll<HTMLInputElement>("[data-onboarding-line]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.getAttribute("data-onboarding-line");
      if (!id) return;
      const d = loadDraft();
      if (input.checked) {
        if (!d.productLinePresetIds.includes(id)) d.productLinePresetIds.push(id);
      } else {
        d.productLinePresetIds = d.productLinePresetIds.filter((x) => x !== id);
      }
      d.removedFeatures = [];
      d.addedFeatures = [];
      d.presetSyncKey = undefined;
      saveDraft(d);
      onNavigate(stepPath(2));
    });
  });

  document.querySelectorAll<HTMLInputElement>("[data-onboarding-feature]").forEach((input) => {
    input.addEventListener("change", () => {
      const featureId = input.getAttribute("data-onboarding-feature");
      if (!featureId) return;
      const d = loadDraft();
      applyOnboardingFeatureToggle(d, featureId, input.checked);
      saveDraft(d);
      onNavigate(stepPath(3));
    });
  });

  document.querySelector<HTMLButtonElement>("[data-onboarding-back]")?.addEventListener("click", () => {
    const d = loadDraft();
    const prev = Math.max(1, d.step - 1) as 1 | 2 | 3 | 4;
    onNavigate(stepPath(prev));
  });

  document.querySelector<HTMLButtonElement>("[data-onboarding-next]")?.addEventListener("click", () => {
    let d = loadDraft();
    const next = Math.min(4, d.step + 1) as 1 | 2 | 3 | 4;
    if (d.step === 2 && next === 3) {
      d = syncOnboardingDraftFromPresets(d, { force: true });
      saveDraft(d);
    }
    onNavigate(stepPath(next));
  });

  document.querySelector<HTMLButtonElement>("[data-onboarding-finish]")?.addEventListener("click", () => {
    const d = loadDraft();
    const profile = commitDraftToProfile(d);
    void saveTenantProfileToApi(profile).then(async () => {
      try {
        if (!areFeaturePresetsLoaded()) {
          await initFeaturePresetsFromApi();
        }
      } catch (err) {
        console.error("[onboarding] preset refresh failed", err);
      }
      invalidateVisibilityContextCache();
      applyActiveTenantPresetSettings(profile);
      clearDraft();
      onNavigate("/dashboard/overview");
    });
  });
}

/** 重置引导状态并进入首次配置（测试 / 业态产线变更） */
export function restartOnboarding(onNavigate: (path: string) => void): void {
  const profile = loadTenantProfile();
  if (!profile) return;
  resetOnboardingDraft();
  void saveTenantProfileToApi({
    ...profile,
    onboardingCompleted: false,
    implementationPreConfigured: false,
    removedFeatures: [],
    addedFeatures: [],
  }).then(() => onNavigate("/onboarding"));
}

export function bindReonboardHeaderButton(onNavigate: (path: string) => void): void {
  document.querySelector<HTMLButtonElement>("[data-header-reonboard]")?.addEventListener("click", () => {
    restartOnboarding(onNavigate);
  });
}
