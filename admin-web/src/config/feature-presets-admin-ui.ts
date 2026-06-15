/**
 * 平台预设管理页 — 左业态 / 右产线树状浏览 + 导航树编辑
 */
import { t, tf } from "../i18n";
import {
  bindBusinessTypeAdminModals,
  renderBusinessTypeCreateModalShell,
  renderBusinessTypeDeleteModalShell,
  renderBusinessTypeEditModalShell,
} from "./feature-presets-business-type-modal-ui";
import {
  getEffectiveBusinessTypePresets,
  isCustomBusinessTypeId,
  isKnownBusinessTypeId,
} from "./feature-presets-catalog-runtime";
import {
  listBusinessTypeDisplayGroups,
  sortBusinessTypesForDisplay,
} from "./feature-presets-taxonomy";
import type { BusinessTypePreset } from "./feature-presets";
import { PRODUCT_LINE_KEYS } from "./feature-presets";
import {
  bindPresetNavTreeEditor,
  exportPresetEditorState,
  type PresetEditorHandle,
} from "./feature-presets-admin-tree-bind";
import {
  computeRecommendedVariantFeatures,
  getBusinessTypeFeatureTierMap,
  getRecommendedL1Ids,
} from "./feature-presets-recommendations";
import {
  bindPresetDetailModal,
  renderPresetDetailModalShell,
} from "./feature-presets-detail-modal-ui";
import {
  bindPresetHistoryModal,
  openPresetHistoryModal,
  renderPresetHistoryModalShell,
} from "./feature-presets-history-modal-ui";
import { pickPresetTitle } from "./feature-presets-labels";
import { fetchPlatformPresets, initFeaturePresetsFromApi, saveBusinessProductLineVariantOverride } from "./feature-presets-api";
import { invalidateVisibilityContextCache } from "./feature-visibility";
import type { BusinessTypeTag } from "./feature-registry";
import { buildVariantId } from "./feature-presets-variants";
import {
  getBusinessProductLineVariantOverrides,
  getEffectiveBusinessProductLineVariant,
  getEffectiveVariantForPair,
} from "./feature-presets-variant-runtime";

export const FEATURE_PRESETS_ADMIN_PATH = "/settings/feature-presets";

const VARIANT_EDIT_PREFIX = `${FEATURE_PRESETS_ADMIN_PATH}/variant/`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isFeaturePresetsAdminPath(path: string): boolean {
  return path === FEATURE_PRESETS_ADMIN_PATH || path.startsWith(`${FEATURE_PRESETS_ADMIN_PATH}/`);
}

function getEditVariantId(path: string): string | null {
  if (!path.startsWith(VARIANT_EDIT_PREFIX)) return null;
  return decodeURIComponent(path.slice(VARIANT_EDIT_PREFIX.length).split("/")[0] || "");
}

function businessTypePath(id: string): string {
  return `${FEATURE_PRESETS_ADMIN_PATH}/${id}`;
}

/** 列表页选中的业态：/feature-presets/{businessType}，缺省为第一个业态 */
function getSelectedBusinessType(path: string): string {
  const variantId = getEditVariantId(path);
  if (variantId) {
    const idx = variantId.indexOf(":");
    if (idx > 0) {
      const bt = variantId.slice(0, idx);
      if (isKnownBusinessTypeId(bt)) return bt;
    }
  }

  const base = `${FEATURE_PRESETS_ADMIN_PATH}/`;
  if (path.startsWith(base) && !path.startsWith(VARIANT_EDIT_PREFIX)) {
    const seg = decodeURIComponent(path.slice(base.length).split("/")[0] || "");
    if (seg && isKnownBusinessTypeId(seg)) return seg;
  }

  return sortBusinessTypesForDisplay(getEffectiveBusinessTypePresets())[0]?.id ?? "general";
}

function countBusinessOverrides(businessType: string): number {
  const overrides = getBusinessProductLineVariantOverrides();
  return PRODUCT_LINE_KEYS.filter((pl) => overrides[buildVariantId(businessType, pl.id)]).length;
}

function taxonomyGroupLabel(group: "service-mode" | "cuisine" | "custom"): string {
  if (group === "service-mode") return t("featurePresets.taxonomyGroupServiceMode");
  if (group === "cuisine") return t("featurePresets.taxonomyGroupCuisine");
  return t("featurePresets.taxonomyGroupCustom");
}

function renderBusinessTreeItem(bt: BusinessTypePreset, selected: string): string {
  const active = bt.id === selected;
  const overrideCount = countBusinessOverrides(bt.id);
  const custom = isCustomBusinessTypeId(bt.id);
  return `
    <li class="flex items-center gap-0.5">
      <a href="#${businessTypePath(bt.id)}"
        class="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          active
            ? "bg-primary/10 font-medium text-primary ring-1 ring-primary/25"
            : "text-foreground hover:bg-muted/60"
        }"
        aria-current="${active ? "page" : "false"}">
        <span class="min-w-0 truncate">${escapeHtml(pickPresetTitle(bt.title, bt.titleEn))}</span>
        <span class="flex shrink-0 items-center gap-1">
          ${
            custom
              ? `<span class="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground" title="${escapeHtml(t("featurePresets.customBusinessType"))}">${escapeHtml(t("featurePresets.customTag"))}</span>`
              : ""
          }
          ${
            overrideCount > 0
              ? `<span class="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary" title="${escapeHtml(t("featurePresets.overridden"))}">${overrideCount}</span>`
              : ""
          }
        </span>
      </a>
      ${
        custom
          ? `<div class="flex shrink-0 flex-col gap-0.5 pr-1">
        <button type="button" class="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground" data-preset-edit-business-type="${escapeHtml(bt.id)}" title="${escapeHtml(t("featurePresets.editBusinessType"))}">${escapeHtml(t("featurePresets.editBusinessType"))}</button>
        <button type="button" class="rounded px-1.5 py-0.5 text-[10px] text-destructive hover:bg-destructive/10" data-preset-delete-business-type="${escapeHtml(bt.id)}" title="${escapeHtml(t("featurePresets.deleteBusinessType"))}">${escapeHtml(t("featurePresets.deleteBusinessType"))}</button>
      </div>`
          : ""
      }
    </li>`;
}

function renderBusinessTree(selected: string): string {
  const displayGroups = listBusinessTypeDisplayGroups(getEffectiveBusinessTypePresets());
  return `
    <nav class="flex h-full flex-col" aria-label="${escapeHtml(t("featurePresets.treeBusinessCol"))}">
      <div class="mb-2 flex items-center justify-between gap-2 px-2">
        <p class="text-xs font-medium text-muted-foreground">${escapeHtml(t("featurePresets.treeBusinessCol"))}</p>
        <button type="button" class="rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-muted/50" data-preset-add-business-type>+ ${escapeHtml(t("featurePresets.addBusinessType"))}</button>
      </div>
      <div class="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 pb-1">
        ${displayGroups
          .map(
            (section) => `
        <section>
          <p class="sticky top-0 z-[1] bg-card/95 px-2 py-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground backdrop-blur">
            ${escapeHtml(taxonomyGroupLabel(section.group))}
          </p>
          <ul class="space-y-0.5">
            ${section.presets.map((bt) => renderBusinessTreeItem(bt, selected)).join("")}
          </ul>
        </section>`,
          )
          .join("")}
      </div>
    </nav>`;
}

function renderProductLinePanel(businessType: string): string {
  const bt = getEffectiveBusinessTypePresets().find((b) => b.id === businessType);
  const btName = bt ? pickPresetTitle(bt.title, bt.titleEn) : businessType;
  const overrides = getBusinessProductLineVariantOverrides();

  const cards = PRODUCT_LINE_KEYS.map((pl) => {
    const variant = getEffectiveVariantForPair(businessType, pl.id);
    if (!variant) return "";

    const plName = pickPresetTitle(pl.title, pl.titleEn);
    const hasOverride = Boolean(overrides[variant.id]);
    const editHref = `#${VARIANT_EDIT_PREFIX}${encodeURIComponent(variant.id)}`;
    const recommended = computeRecommendedVariantFeatures(businessType, pl.id, bt);
    const enabledCount = variant.features.length;
    const recSummary = tf("featurePresets.variantRecSummary", {
      recommended: String(recommended.length),
      enabled: String(enabledCount),
    });

    return `
      <article class="rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-primary/30">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h3 class="text-sm font-medium">${escapeHtml(plName)}</h3>
            <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">${escapeHtml(variant.id)}</p>
            <p class="mt-1 text-[11px] text-muted-foreground">${escapeHtml(recSummary)}</p>
          </div>
          <span class="shrink-0 text-xs text-muted-foreground">v${variant.version}${hasOverride ? ` <span class="text-primary">${escapeHtml(t("featurePresets.overridden"))}</span>` : ""}</span>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-border px-3 py-1.5 text-xs text-primary hover:bg-muted/50"
            data-preset-view-detail="${escapeHtml(variant.id)}"
          >${escapeHtml(t("featurePresets.viewDetail"))}</button>
          <button
            type="button"
            class="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/50"
            data-preset-view-history="${escapeHtml(variant.id)}"
          >${escapeHtml(t("featurePresets.viewHistory"))}</button>
          <a href="${editHref}" class="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            ${escapeHtml(t("featurePresets.configurePreset"))}
          </a>
        </div>
      </article>`;
  }).join("");

  const custom = isCustomBusinessTypeId(businessType);

  return `
    <div class="flex h-full min-h-0 flex-col">
      <div class="mb-4 border-b border-border pb-3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 class="text-sm font-medium">${escapeHtml(tf("featurePresets.treeProductLineTitle", { business: btName }))}</h2>
            <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(t("featurePresets.treeSelectHint"))}</p>
            ${
              bt
                ? `<p class="mt-1.5 text-[11px] text-muted-foreground">${escapeHtml(
                    tf("featurePresets.businessTypePresetSummary", {
                      core: String(bt.features.filter((f) => f.tier === "core").length),
                      recommended: String(bt.features.filter((f) => f.tier === "recommended").length),
                      optional: String(bt.features.filter((f) => f.tier === "optional" || f.tier === "advanced").length),
                    }),
                  )}</p>`
                : ""
            }
          </div>
          <div class="flex shrink-0 flex-wrap gap-1.5">
            <button type="button" class="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted" data-preset-view-history-business="${escapeHtml(businessType)}">${escapeHtml(t("featurePresets.viewHistory"))}</button>
            ${
              custom
                ? `<button type="button" class="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted" data-preset-edit-business-type="${escapeHtml(businessType)}">${escapeHtml(t("featurePresets.editBusinessType"))}</button>
            <button type="button" class="rounded-lg border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10" data-preset-delete-business-type="${escapeHtml(businessType)}">${escapeHtml(t("featurePresets.deleteBusinessType"))}</button>`
                : ""
            }
          </div>
        </div>
      </div>
      <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">${cards}</div>
    </div>`;
}

function renderListPage(path: string): string {
  const selected = getSelectedBusinessType(path);

  return `
    <div class="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">${escapeHtml(t("featurePresets.pageTitle"))}</h1>
        <p class="mt-1 text-sm text-muted-foreground">${t("featurePresets.pageDesc")}</p>
        <a href="#/settings/feature-presets" class="mt-2 inline-block text-sm text-primary underline-offset-2 hover:underline">${escapeHtml(t("featurePresets.backToPresets"))}</a>
      </div>

      <section class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div class="grid min-h-[min(560px,70vh)] grid-cols-1 md:grid-cols-[minmax(11rem,13rem)_1fr]">
          <div class="border-b border-border bg-muted/20 p-3 md:border-b-0 md:border-r">
            ${renderBusinessTree(selected)}
          </div>
          <div class="min-h-0 p-4 sm:p-5">
            ${renderProductLinePanel(selected)}
          </div>
        </div>
      </section>
      ${renderPresetDetailModalShell()}
      ${renderBusinessTypeCreateModalShell()}
      ${renderBusinessTypeEditModalShell()}
      ${renderBusinessTypeDeleteModalShell()}
      ${renderPresetHistoryModalShell()}
    </div>`;
}

function renderVariantEditPage(variantId: string): string {
  const v = getEffectiveBusinessProductLineVariant(variantId);
  if (!v) {
    return `
      <div class="mx-auto max-w-3xl p-6">
        <p class="text-sm text-destructive">${escapeHtml(tf("featurePresets.variantNotFound", { id: variantId }))}</p>
        <a href="#${FEATURE_PRESETS_ADMIN_PATH}" class="mt-2 inline-block text-sm text-primary underline">${escapeHtml(t("featurePresets.backList"))}</a>
      </div>`;
  }

  const variantName = pickPresetTitle(v.title, v.titleEn);
  const pl = PRODUCT_LINE_KEYS.find((p) => p.id === v.productLinePresetId);
  const plName = pl ? pickPresetTitle(pl.title, pl.titleEn) : v.productLinePresetId;
  const bt = getEffectiveBusinessTypePresets().find((b) => b.id === v.businessType);
  const btName = bt ? pickPresetTitle(bt.title, bt.titleEn) : v.businessType;
  const backHref = `#${businessTypePath(v.businessType)}`;
  const recommended = computeRecommendedVariantFeatures(v.businessType, v.productLinePresetId, bt);
  const recHint = tf("featurePresets.businessTypeRecHint", {
    business: btName,
    count: String(recommended.length),
  });

  return `
    <div class="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <a href="${backHref}" class="text-sm text-primary underline-offset-2 hover:underline">${escapeHtml(t("featurePresets.backList"))}</a>
        <h1 class="mt-2 text-xl font-semibold tracking-tight">${escapeHtml(tf("featurePresets.editVariantTitle", { name: variantName }))}</h1>
        <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(tf("featurePresets.editVariantMeta", { business: btName, productLine: plName, base: v.productLinePresetId }))}</p>
        <p class="mt-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">${escapeHtml(recHint)}</p>
      </div>

      <form id="feature-preset-variant-edit-form" data-variant-id="${escapeHtml(v.id)}" data-business-type="${escapeHtml(v.businessType)}" class="space-y-4">
        <section class="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
            <div class="min-w-0 flex-1">
              <h2 class="text-sm font-medium">${escapeHtml(t("featurePresets.treeTitle"))}</h2>
              <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(t("featurePresets.treeHint"))}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/50" data-preset-view-history="${escapeHtml(v.id)}">${escapeHtml(t("featurePresets.viewHistory"))}</button>
            <button type="button" class="rounded-lg border border-primary/40 px-3 py-1.5 text-xs text-primary hover:bg-primary/5" data-preset-apply-recommended="${escapeHtml(v.id)}">${escapeHtml(t("featurePresets.applyRecommended"))}</button>
            </div>
          </div>

          <div class="mt-3 grid min-h-[22rem] grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded-lg border border-border/80 bg-background p-2">
              <p class="mb-2 px-1 text-xs font-medium text-muted-foreground">${escapeHtml(t("featurePresets.treeColL1"))}</p>
              <div id="preset-tree-l1" class="max-h-[20rem] space-y-0.5 overflow-y-auto"></div>
            </div>
            <div class="rounded-lg border border-border/80 bg-background p-2">
              <p class="mb-2 px-1 text-xs font-medium text-muted-foreground">${escapeHtml(t("featurePresets.treeColL2"))}</p>
              <div id="preset-tree-l2" class="max-h-[20rem] space-y-0.5 overflow-y-auto"></div>
            </div>
            <div class="rounded-lg border border-border/80 bg-background p-2">
              <p class="mb-2 px-1 text-xs font-medium text-muted-foreground">${escapeHtml(t("featurePresets.treeColL3"))}</p>
              <div id="preset-tree-l3" class="max-h-[20rem] space-y-0.5 overflow-y-auto"></div>
            </div>
            <div class="rounded-lg border border-border/80 bg-background p-2">
              <p class="mb-2 px-1 text-xs font-medium text-muted-foreground">${escapeHtml(t("featurePresets.treeColLeaves"))}</p>
              <div id="preset-tree-l4" class="max-h-[20rem] space-y-0.5 overflow-y-auto"></div>
            </div>
          </div>
        </section>

        <div class="flex items-center gap-3">
          <button type="submit" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            ${escapeHtml(tf("featurePresets.savePublish", { version: String(v.version + 1) }))}
          </button>
          <span id="feature-preset-variant-edit-status" class="text-sm text-muted-foreground"></span>
        </div>
      </form>
      ${renderPresetHistoryModalShell()}
    </div>`;
}

export function renderFeaturePresetsAdminPage(path = FEATURE_PRESETS_ADMIN_PATH): string {
  const variantId = getEditVariantId(path);
  if (variantId) return renderVariantEditPage(variantId);
  return renderListPage(path);
}

let treeEditorHandle: PresetEditorHandle | null = null;

export function bindFeaturePresetsAdminPage(root: ParentNode = document): void {
  bindPresetDetailModal(root, (variantId) => getEffectiveBusinessProductLineVariant(variantId) ?? null);
  bindPresetHistoryModal(root);
  bindBusinessTypeAdminModals(root);

  root.querySelectorAll<HTMLButtonElement>("[data-preset-view-history]").forEach((btn) => {
    if (btn.dataset.historyBound === "1") return;
    btn.dataset.historyBound = "1";
    btn.addEventListener("click", () => {
      const variantId = btn.getAttribute("data-preset-view-history");
      if (!variantId) return;
      const variant = getEffectiveBusinessProductLineVariant(variantId);
      void openPresetHistoryModal({
        variantId,
        subtitle: variant ? pickPresetTitle(variant.title, variant.titleEn) : variantId,
      });
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-preset-view-history-business]").forEach((btn) => {
    if (btn.dataset.historyBound === "1") return;
    btn.dataset.historyBound = "1";
    btn.addEventListener("click", () => {
      const businessTypeId = btn.getAttribute("data-preset-view-history-business");
      if (!businessTypeId) return;
      const bt = getEffectiveBusinessTypePresets().find((b) => b.id === businessTypeId);
      void openPresetHistoryModal({
        businessTypeId,
        subtitle: bt ? pickPresetTitle(bt.title, bt.titleEn) : businessTypeId,
      });
    });
  });

  const variantForm = root.querySelector<HTMLFormElement>("#feature-preset-variant-edit-form");
  if (variantForm) {
    bindVariantEditForm(root, variantForm);
  }
}

function bindVariantEditForm(root: ParentNode, form: HTMLFormElement): void {
  const variantId = form.dataset.variantId;
  const businessType = form.dataset.businessType as BusinessTypeTag | undefined;
  if (!variantId) return;

  const variant = getEffectiveBusinessProductLineVariant(variantId);
  if (!variant) return;

  const bindKey = `${variantId}@v${variant.version}`;
  if (form.dataset.variantTreeBound !== bindKey) {
    form.dataset.variantTreeBound = bindKey;
    treeEditorHandle = null;
    const btPreset = getEffectiveBusinessTypePresets().find((b) => b.id === variant.businessType);
    const recommendedL1 = getRecommendedL1Ids(variant.businessType, variant.productLinePresetId, btPreset);
    treeEditorHandle = bindPresetNavTreeEditor(
      root,
      {
        features: variant.features.map((f) => ({ ...f })),
        excludes: [...variant.excludes],
        includes: [...(variant.includes ?? [])],
        l2Includes: variant.l2Includes ? [...variant.l2Includes] : undefined,
        l3Includes: variant.l3Includes ? [...variant.l3Includes] : undefined,
        l2Excludes: [...(variant.l2Excludes ?? [])],
        l3Excludes: [...(variant.l3Excludes ?? [])],
        settingConfigs: variant.settingConfigs,
      },
      undefined,
      {
        recommendedL1,
        businessTypeTiers: getBusinessTypeFeatureTierMap(variant.businessType, btPreset),
      },
    );

    root.querySelector<HTMLButtonElement>(`[data-preset-apply-recommended="${CSS.escape(variantId)}"]`)?.addEventListener("click", () => {
      if (!treeEditorHandle) return;
      const ids = getRecommendedL1Ids(variant.businessType, variant.productLinePresetId, btPreset);
      treeEditorHandle.applyRecommendedL1(ids);
      const status = root.querySelector("#feature-preset-variant-edit-status");
      if (status) status.textContent = t("featurePresets.applyRecommendedDone");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!variantId || !treeEditorHandle) return;

      const status = root.querySelector("#feature-preset-variant-edit-status");
      if (status) status.textContent = t("featurePresets.saving");

      const base = getEffectiveVariantForPair(variant.businessType, variant.productLinePresetId);
      const nextVersion = (base?.version ?? 1) + 1;
      const backPath = businessType ? businessTypePath(businessType) : FEATURE_PRESETS_ADMIN_PATH;

      try {
        const patch = {
          ...exportPresetEditorState(treeEditorHandle.state),
          version: nextVersion,
          updatedAt: new Date().toISOString(),
        };
        await saveBusinessProductLineVariantOverride(variantId, patch);
        invalidateVisibilityContextCache();
        treeEditorHandle = null;
        form.dataset.variantTreeBound = "";
        if (status) status.textContent = t("featurePresets.saved");
        setTimeout(() => {
          window.location.hash = backPath;
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        }, 400);
      } catch (err) {
        if (status) status.textContent = tf("featurePresets.saveFailed", { error: String(err) });
      }
    });
  }
}

export { initFeaturePresetsFromApi };