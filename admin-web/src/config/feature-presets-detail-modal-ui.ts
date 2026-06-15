/**
 * 平台预设 — 产线预设详情弹框（层级功能树）
 */
import { t, tf } from "../i18n";
import { getEffectiveBusinessTypePresets } from "./feature-presets-catalog-runtime";
import { PRODUCT_LINE_KEYS } from "./feature-presets";
import {
  buildPresetNavTree,
  isL2FullyExcluded,
  type PresetNavGroup,
  type PresetNavL2Node,
  type PresetNavLeaf,
  type PresetNavModuleNode,
} from "./feature-presets-nav-tree";
import { getL1ModuleLabel, pickPresetTitle } from "./feature-presets-labels";
import type { PresetSettingConfig } from "./feature-presets-setting-config";
import type { BusinessProductLineVariant } from "./feature-presets-variants";
import { formatVariantSettingBrief } from "./feature-presets-variant-summary";
import type { FeatureTier } from "./feature-registry";
import { mergePresets } from "./feature-visibility";

const FEATURE_PRESETS_ADMIN_PATH = "/settings/feature-presets";
const VARIANT_EDIT_PREFIX = `${FEATURE_PRESETS_ADMIN_PATH}/variant/`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tierLabel(tier: FeatureTier): string {
  if (tier === "core") return t("featurePresets.tierCore");
  if (tier === "recommended") return t("featurePresets.tierRecommended");
  return t("featurePresets.tierOptional");
}

function tierBadgeClass(tier: FeatureTier): string {
  if (tier === "core") return "bg-primary/15 text-primary";
  if (tier === "recommended") return "bg-muted text-muted-foreground";
  return "bg-muted/60 text-muted-foreground";
}

function formatSettingBrief(config: PresetSettingConfig): string {
  const raw = formatVariantSettingBrief(config);
  if (raw === "开启") return t("featurePresets.settingOn");
  if (raw === "关闭") return t("featurePresets.settingOff");
  if (raw === "已预设") return t("featurePresets.detailSettingPreset");
  return raw;
}

function renderLeafRow(
  leaf: PresetNavLeaf,
  l3Excludes: Set<string>,
  settingConfigs: Record<string, PresetSettingConfig>,
): string {
  const excluded = l3Excludes.has(leaf.id);
  const setting = settingConfigs[leaf.id];
  const status = excluded
    ? `<span class="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">${escapeHtml(t("featurePresets.detailStatusExcluded"))}</span>`
    : setting
      ? `<span class="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-400">${escapeHtml(formatSettingBrief(setting))}</span>`
      : `<span class="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">${escapeHtml(t("featurePresets.detailStatusVisible"))}</span>`;

  return `
    <li class="flex items-center justify-between gap-2 rounded-md px-1 py-0.5 hover:bg-muted/30">
      <span class="min-w-0 truncate text-xs ${excluded ? "text-muted-foreground line-through" : "text-foreground/90"}">${escapeHtml(leaf.label)}</span>
      ${status}
    </li>`;
}

function renderGroupBlock(
  group: PresetNavGroup,
  l3Excludes: Set<string>,
  settingConfigs: Record<string, PresetSettingConfig>,
): string {
  const leaves = group.leaves.filter((leaf) => leaf.level !== "l2");
  if (leaves.length === 0) return "";

  const showGroupTitle = leaves.length > 1 || group.id.startsWith("leaf:") === false;
  const leafRows = leaves.map((leaf) => renderLeafRow(leaf, l3Excludes, settingConfigs)).join("");

  return `
    <div class="mt-1.5">
      ${
        showGroupTitle
          ? `<p class="mb-0.5 text-[11px] font-medium text-muted-foreground">${escapeHtml(group.label)}</p>`
          : ""
      }
      <ul class="space-y-0.5 border-l-2 border-border/50 pl-2.5">${leafRows}</ul>
    </div>`;
}

function renderL2Block(
  l2: PresetNavL2Node,
  moduleId: string,
  l1Excludes: Set<string>,
  l2Excludes: Set<string>,
  l3Excludes: Set<string>,
  settingConfigs: Record<string, PresetSettingConfig>,
): string {
  const l2Excluded = isL2FullyExcluded(l2, l1Excludes, l2Excludes, l3Excludes, moduleId);
  const isL2Only =
    l2.groups.length === 1 &&
    l2.groups[0].leaves.length === 1 &&
    l2.groups[0].leaves[0].level === "l2";

  const l2Status = l2Excluded
    ? `<span class="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">${escapeHtml(t("featurePresets.detailStatusExcluded"))}</span>`
    : `<span class="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">${escapeHtml(t("featurePresets.detailStatusVisible"))}</span>`;

  const children = isL2Only
    ? ""
    : l2.groups.map((g) => renderGroupBlock(g, l3Excludes, settingConfigs)).join("");

  return `
    <li class="rounded-md border border-border/50 bg-background/60 px-2.5 py-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-medium ${l2Excluded ? "text-muted-foreground line-through" : "text-foreground"}">${escapeHtml(l2.label)}</span>
        ${l2Status}
      </div>
      ${children ? `<div class="mt-1.5 pl-1">${children}</div>` : ""}
    </li>`;
}

function renderModuleBlock(
  mod: PresetNavModuleNode,
  tier: FeatureTier,
  l1Excludes: Set<string>,
  l2Excludes: Set<string>,
  l3Excludes: Set<string>,
  settingConfigs: Record<string, PresetSettingConfig>,
): string {
  const l2Blocks = mod.children
    .map((l2) => renderL2Block(l2, mod.moduleId, l1Excludes, l2Excludes, l3Excludes, settingConfigs))
    .join("");

  return `
    <article class="overflow-hidden rounded-lg border border-border shadow-sm">
      <header class="flex items-center justify-between gap-2 border-b border-border/70 bg-muted/20 px-3 py-2.5">
        <div class="flex min-w-0 items-center gap-2">
          <span class="inline-flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-semibold text-primary">L1</span>
          <span class="truncate text-sm font-medium">${escapeHtml(mod.label)}</span>
        </div>
        <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${tierBadgeClass(tier)}">${escapeHtml(tierLabel(tier))}</span>
      </header>
      <ul class="space-y-2 p-3">${l2Blocks}</ul>
    </article>`;
}

function renderVariantFeatureTree(variant: BusinessProductLineVariant): string {
  const tree = buildPresetNavTree();
  const featureTier = new Map(variant.features.map((f) => [f.featureId, f.tier]));
  const l2Excludes = new Set(variant.l2Excludes ?? []);
  const l3Excludes = new Set(variant.l3Excludes ?? []);
  const settingConfigs = variant.settingConfigs ?? {};
  const mergedL1 = mergePresets({
    primaryBusinessType: variant.businessType,
    productLinePresetIds: [variant.productLinePresetId],
    productLines: variant.productLines,
    addedFeatures: [],
    removedFeatures: [],
  });

  const includedModules = tree
    .filter((mod) => mergedL1.has(mod.moduleId))
    .map((mod) =>
      renderModuleBlock(
        mod,
        featureTier.get(mod.moduleId) ?? "recommended",
        new Set<string>(),
        l2Excludes,
        l3Excludes,
        settingConfigs,
      ),
    )
    .join("");

  if (!includedModules) {
    return `<p class="text-sm text-muted-foreground">${escapeHtml(t("featurePresets.detailEmpty"))}</p>`;
  }

  return `
    <div class="space-y-4">
      <section>
        <h4 class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">${escapeHtml(t("featurePresets.presetDetailFeatures"))}</h4>
        <div class="space-y-3">${includedModules}</div>
      </section>
    </div>`;
}

export function renderPresetDetailModalContent(variant: BusinessProductLineVariant): string {
  const variantName = pickPresetTitle(variant.title, variant.titleEn);
  const pl = PRODUCT_LINE_KEYS.find((p) => p.id === variant.productLinePresetId);
  const plName = pl ? pickPresetTitle(pl.title, pl.titleEn) : variant.productLinePresetId;
  const bt = getEffectiveBusinessTypePresets().find((b) => b.id === variant.businessType);
  const btName = bt ? pickPresetTitle(bt.title, bt.titleEn) : variant.businessType;
  const editHref = `#${VARIANT_EDIT_PREFIX}${encodeURIComponent(variant.id)}`;

  return `
    <div class="border-b border-border px-5 py-4 sm:px-6">
      <h3 id="preset-detail-modal-title" class="text-base font-semibold text-foreground">${escapeHtml(variantName)}</h3>
      <p class="mt-1 font-mono text-xs text-muted-foreground">${escapeHtml(variant.id)}</p>
      <p class="mt-1.5 text-xs text-muted-foreground">
        ${escapeHtml(btName)} · ${escapeHtml(plName)} · ${escapeHtml(variant.productLines.join(", "))} · v${variant.version}
      </p>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
      <div class="mb-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full bg-emerald-500/70"></span>${escapeHtml(t("featurePresets.detailStatusVisible"))}</span>
        <span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full bg-amber-500/70"></span>${escapeHtml(t("featurePresets.detailStatusExcluded"))}</span>
        <span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full bg-sky-500/70"></span>${escapeHtml(t("featurePresets.detailSettingPreset"))}</span>
      </div>
      ${renderVariantFeatureTree(variant)}
    </div>
    <div class="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
      <button
        type="button"
        class="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
        data-preset-detail-modal-close
      >${escapeHtml(t("featurePresets.detailClose"))}</button>
      <a
        href="${editHref}"
        class="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        data-preset-detail-modal-configure
      >${escapeHtml(t("featurePresets.configurePreset"))}</a>
    </div>`;
}

export function renderPresetDetailModalShell(): string {
  return `
    <div
      class="fixed inset-0 z-[10050] hidden items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center sm:p-6"
      data-preset-detail-modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-detail-modal-title"
      aria-hidden="true"
    >
      <button
        type="button"
        class="absolute inset-0 cursor-default"
        data-preset-detail-modal-backdrop
        tabindex="-1"
        aria-label="${escapeHtml(t("featurePresets.detailClose"))}"
      ></button>
      <div class="relative z-10 my-4 flex max-h-[min(88vh,44rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:my-0">
        <div class="flex min-h-0 flex-1 flex-col" data-preset-detail-modal-body></div>
      </div>
    </div>`;
}

function closePresetDetailModal(root: ParentNode): void {
  const dialog = root.querySelector<HTMLElement>("[data-preset-detail-modal]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("aria-hidden", "true");
  const body = dialog.querySelector<HTMLElement>("[data-preset-detail-modal-body]");
  if (body) body.innerHTML = "";
}

function openPresetDetailModal(root: ParentNode, variant: BusinessProductLineVariant): void {
  const dialog = root.querySelector<HTMLElement>("[data-preset-detail-modal]");
  const body = dialog?.querySelector<HTMLElement>("[data-preset-detail-modal-body]");
  if (!dialog || !body) return;

  body.innerHTML = renderPresetDetailModalContent(variant);
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  dialog.setAttribute("aria-hidden", "false");

  const closeBtn = body.querySelector<HTMLElement>("[data-preset-detail-modal-close]");
  closeBtn?.focus({ preventScroll: true });
}

export function bindPresetDetailModal(
  root: ParentNode,
  resolveVariant: (variantId: string) => BusinessProductLineVariant | null,
): void {
  const host = root instanceof Document ? root.body : root;
  if (host instanceof HTMLElement && host.dataset.presetDetailModalBound === "1") return;
  if (host instanceof HTMLElement) host.dataset.presetDetailModalBound = "1";

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const viewBtn = target.closest<HTMLElement>("[data-preset-view-detail]");
    if (viewBtn) {
      e.preventDefault();
      const variantId = viewBtn.dataset.presetViewDetail;
      if (!variantId) return;
      const variant = resolveVariant(variantId);
      if (variant) openPresetDetailModal(root, variant);
      return;
    }

    if (target.closest("[data-preset-detail-modal-close], [data-preset-detail-modal-backdrop]")) {
      e.preventDefault();
      closePresetDetailModal(root);
      return;
    }

    if (target.closest("[data-preset-detail-modal-configure]")) {
      closePresetDetailModal(root);
    }
  });

  root.addEventListener("keydown", (e) => {
    if (!(e instanceof KeyboardEvent) || e.key !== "Escape") return;
    const dialog = root.querySelector<HTMLElement>("[data-preset-detail-modal]");
    if (dialog && !dialog.classList.contains("hidden")) {
      e.preventDefault();
      closePresetDetailModal(root);
    }
  });
}
