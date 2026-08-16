import { t, tf } from "../../i18n";
import { SEASONING_ACTIONS } from "./seasoning-domain";
import { seasoningApi, SeasoningApiError } from "./seasoning-api";
import {
  calculateActualMarkupPrice,
  createBatchOptionPricing,
  updateBatchInputPrice,
  type BatchOptionPricingDraft,
} from "./seasoning-batch-pricing";
import {
  installSeasoningWorkspaceReorder,
  moveDraftAction,
  moveDraftOption,
  renderSeasoningConfigurationWorkspace,
  syncSeasoningOptionCategoryIndeterminate,
  type SeasoningConfigurationDraft,
} from "./seasoning-configuration-workspace-ui";
import { renderSeasoningMenuStructurePicker, syncSeasoningMenuIndeterminate } from "./seasoning-menu-structure-picker-ui";
import { previewPageItems } from "./seasoning-preview-pagination";
import type {
  BatchCommitResult,
  BatchPreviewPageSize,
  BatchPreviewProductNumberPage,
  BatchPreviewResponse,
  CursorPage,
  ProductSelectionDraft,
  SeasoningActionCode,
  SeasoningBootstrap,
  SeasoningMenuStructure,
  SeasoningOption,
} from "./seasoning-types";
import { actionLabel, actionTone, escapeSeasoningHtml, inputClass, primaryButtonClass, secondaryButtonClass } from "./seasoning-ui-helpers";

type WizardInput = {
  bootstrap: SeasoningBootstrap;
  onSaved: (result: BatchCommitResult) => Promise<void> | void;
};

const PRODUCT_SELECTION_ERRORS = new Set([
  "product_selection_expired",
  "product_selection_stale",
  "product_selection_mismatch",
  "product_selection_store_mismatch",
]);

class BatchWizardController {
  private step = 1;
  private actionOptions = new Map<SeasoningActionCode, Map<string, BatchOptionPricingDraft>>();
  private activeAction: SeasoningActionCode | null = null;
  private actionPickerOpen = false;
  private optionPickerOpen = false;
  private pendingActions = new Set<SeasoningActionCode>();
  private pendingOptions = new Set<string>();
  private optionPickerQuery = "";
  private activeOptionCategoryId: string | null = null;
  private bulkPriceInput = "";
  private linkedOptionQuery = "";
  private selectedPriceOptions = new Set<string>();
  private options: CursorPage<SeasoningOption> | null = null;
  private optionCategories: import("./seasoning-types").SeasoningOptionCategory[] = [];
  private productSelection: ProductSelectionDraft | null = null;
  private menu: SeasoningMenuStructure | null = null;
  private productQuery = "";
  private appliedProductQuery = "";
  private preview: BatchPreviewResponse | null = null;
  private previewPage: BatchPreviewProductNumberPage | null = null;
  private previewPageNumber = 1;
  private previewPageSize: BatchPreviewPageSize = 5;
  private collapsedPreviewProducts = new Set<string>();
  private loading = false;
  private error = "";
  private dirty = false;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly input: WizardInput,
  ) {
    this.overlay.addEventListener("click", (event) => void this.handleClick(event));
    this.overlay.addEventListener("change", (event) => void this.handleChange(event));
    this.overlay.addEventListener("input", (event) => this.handleInput(event));
    this.overlay.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (this.actionPickerOpen || this.optionPickerOpen) {
        this.actionPickerOpen = false;
        this.optionPickerOpen = false;
        this.render();
      } else {
        this.close();
      }
    });
    installSeasoningWorkspaceReorder(this.overlay, {
      moveAction: (source, target) => this.reorderAction(source, target),
      moveOption: (action, source, target) => this.reorderOption(action, source, target),
    });
    this.render();
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    this.loading = true;
    this.render();
    try {
      this.productSelection = await seasoningApi.createProductSelection();
      await this.loadMenuStructure(false);
    } catch (error) {
      this.error = this.errorMessage(error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private async discardDrafts(): Promise<void> {
    const previewToken = this.preview?.previewToken;
    const selectionToken = this.productSelection?.token;
    if (previewToken) await seasoningApi.discardPreview(previewToken).catch(() => undefined);
    if (selectionToken) await seasoningApi.discardProductSelection(selectionToken).catch(() => undefined);
  }

  private close(force = false): void {
    if (!force && this.dirty && !window.confirm(t("seasoning.discardConfirm"))) return;
    void this.discardDrafts();
    this.overlay.remove();
  }

  private selectedProductCount(): number {
    return this.productSelection?.total ?? this.menu?.selectedTotal ?? 0;
  }

  private discardPreview(): void {
    const token = this.preview?.previewToken;
    if (token) void seasoningApi.discardPreview(token).catch(() => undefined);
    this.preview = null;
    this.previewPage = null;
    this.previewPageNumber = 1;
    this.previewPageSize = 5;
    this.collapsedPreviewProducts.clear();
  }

  private clearAfterProductChange(): void {
    this.actionOptions.clear();
    this.activeAction = null;
    this.actionPickerOpen = false;
    this.optionPickerOpen = false;
    this.pendingActions.clear();
    this.pendingOptions.clear();
    this.bulkPriceInput = "";
    this.selectedPriceOptions.clear();
    this.discardPreview();
  }

  private clearAfterConfigurationChange(): void {
    this.discardPreview();
  }

  private configurationDraft(): SeasoningConfigurationDraft {
    return [...this.actionOptions].map(([action, options]) => ({
      action,
      options: [...options].map(([optionId, pricing]) => ({ optionId, ...pricing })),
    }));
  }

  private applyConfigurationDraft(draft: SeasoningConfigurationDraft): void {
    this.actionOptions = new Map(draft.map((group) => [group.action, new Map(group.options.map(({ optionId, inputPrice, markupCoefficient }) => [optionId, { inputPrice, markupCoefficient }]))]));
  }

  private reorderAction(source: SeasoningActionCode, target: SeasoningActionCode): void {
    this.applyConfigurationDraft(moveDraftAction(this.configurationDraft(), source, target));
    this.clearAfterConfigurationChange();
    this.dirty = true;
    this.render();
  }

  private reorderOption(action: SeasoningActionCode, source: string, target: string): void {
    if (this.linkedOptionQuery.trim()) return;
    this.applyConfigurationDraft(moveDraftOption(this.configurationDraft(), action, source, target));
    this.clearAfterConfigurationChange();
    this.dirty = true;
    this.render();
  }

  private renderSharedConfigurationStep(): string {
    return renderSeasoningConfigurationWorkspace({
      draft: this.configurationDraft(),
      activeAction: this.activeAction,
      actionPickerOpen: this.actionPickerOpen,
      optionPickerOpen: this.optionPickerOpen,
      pendingActions: this.pendingActions,
      pendingOptions: this.pendingOptions,
      selectedPriceOptions: this.selectedPriceOptions,
      bulkPriceInput: this.bulkPriceInput,
      optionQuery: this.linkedOptionQuery,
      optionPickerQuery: this.optionPickerQuery,
      activeOptionCategoryId: this.activeOptionCategoryId,
      optionCategories: this.optionCategories,
      options: this.options?.items ?? [],
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof SeasoningApiError && error.code === "version_conflict") return t("seasoning.versionConflict");
    if (error instanceof SeasoningApiError && PRODUCT_SELECTION_ERRORS.has(error.code)) return t("seasoning.productSelectionExpired");
    if (error instanceof SeasoningApiError && error.code === "preview_expired") return "预览已过期，请重新生成";
    return String(error instanceof Error ? error.message : error);
  }

  private renderSteps(): string {
    const labels = [t("seasoning.batch.stepProduct"), t("seasoning.batch.stepConfigure"), t("seasoning.batch.stepPreview")];
    return `<ol class="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1" aria-label="Steps">${labels.map((label, index) => {
      const number = index + 1;
      const active = number === this.step;
      const done = number < this.step;
      return `<li data-seasoning-batch-step="${number}" class="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold ${active ? "bg-card text-primary shadow-sm" : done ? "text-foreground" : "text-muted-foreground"}"><span class="flex size-5 shrink-0 items-center justify-center rounded-full ${active || done ? "bg-primary text-primary-foreground" : "bg-background"}">${done ? "✓" : number}</span><span class="hidden truncate sm:block">${escapeSeasoningHtml(label)}</span></li>`;
    }).join("")}</ol>`;
  }

  private configuredRelationCount(): number {
    return [...this.actionOptions.values()].reduce((total, options) => total + options.size, 0);
  }

  private allActionsConfigured(): boolean {
    return this.actionOptions.size > 0 && [...this.actionOptions.values()].every((options) => options.size > 0);
  }

  private normalizedBulkPrice(): number | null {
    const value = this.bulkPriceInput.trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
    const price = Number(value);
    if (!Number.isFinite(price) || price < 0) return null;
    return Math.round((price + Number.EPSILON) * 100) / 100;
  }

  private syncBulkPriceSelectionState(): void {
    const visibleRows = [...this.overlay.querySelectorAll<HTMLElement>("[data-linked-option-row]:not(.hidden)")];
    const visibleIds = visibleRows.map((row) => String(row.dataset.optionId)).filter(Boolean);
    const selectedVisibleCount = visibleIds.filter((optionId) => this.selectedPriceOptions.has(optionId)).length;
    const selectAll = this.overlay.querySelector<HTMLInputElement>("[data-select-visible-price-options]");
    if (selectAll) {
      selectAll.checked = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
      selectAll.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
    }
    const selectedCount = this.overlay.querySelector<HTMLElement>("[data-selected-price-count]");
    if (selectedCount) selectedCount.textContent = tf("seasoning.batch.updateSelectedPrices", { count: String(this.selectedPriceOptions.size) });
    const updateSelected = this.overlay.querySelector<HTMLButtonElement>("[data-fill-selected-prices]");
    if (updateSelected) updateSelected.disabled = this.selectedPriceOptions.size === 0 || this.normalizedBulkPrice() === null;
    const fillAll = this.overlay.querySelector<HTMLButtonElement>("[data-fill-bulk-price]");
    const activeOptions = this.activeAction ? this.actionOptions.get(this.activeAction) : undefined;
    if (fillAll) fillAll.disabled = !activeOptions?.size || this.normalizedBulkPrice() === null;
  }

  private actionDescription(action: SeasoningActionCode): string {
    if (action === "ADD") return t("seasoning.batch.actionAddHint");
    if (action === "LESS") return t("seasoning.batch.actionLessHint");
    if (action === "MORE") return t("seasoning.batch.actionMoreHint");
    return t("seasoning.batch.actionNoneHint");
  }

  private renderActionPicker(): string {
    if (!this.actionPickerOpen) return "";
    return `<div class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" data-picker-backdrop="action">
      <section role="dialog" aria-modal="true" aria-labelledby="seasoning-action-picker-title" class="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-4"><h3 id="seasoning-action-picker-title" class="text-lg font-semibold">${t("seasoning.batch.addAction")}</h3><button type="button" data-close-picker="action" class="${secondaryButtonClass}" aria-label="${t("seasoning.close")}">×</button></div>
        <div class="mt-5 grid gap-3 sm:grid-cols-2">${SEASONING_ACTIONS.map((definition) => {
          const existing = this.actionOptions.has(definition.code);
          const checked = existing || this.pendingActions.has(definition.code);
          return `<label class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${checked ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"} ${existing ? "opacity-70" : ""}"><input type="checkbox" data-action-picker-option="${definition.code}" ${checked ? "checked" : ""} ${existing ? "disabled" : ""} class="mt-1 size-4 rounded border-border text-primary"><span><strong class="inline-flex rounded-full border px-2.5 py-1 text-xs ${actionTone(definition.code)}">${escapeSeasoningHtml(actionLabel(definition.code))}</strong><span class="mt-2 block text-sm text-muted-foreground">${escapeSeasoningHtml(this.actionDescription(definition.code))}</span>${existing ? `<span class="mt-1 block text-xs font-semibold text-primary">${t("seasoning.batch.actionAdded")}</span>` : ""}</span></label>`;
        }).join("")}</div>
        <div class="mt-6 flex justify-end gap-2"><button type="button" data-close-picker="action" class="${secondaryButtonClass}">${t("seasoning.cancel")}</button><button type="button" data-confirm-actions class="${primaryButtonClass}">${t("seasoning.batch.confirmAdd")}</button></div>
      </section>
    </div>`;
  }

  private renderOptionPicker(): string {
    if (!this.optionPickerOpen || !this.activeAction) return "";
    const options = this.options?.items ?? [];
    return `<div class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" data-picker-backdrop="option">
      <section role="dialog" aria-modal="true" aria-labelledby="seasoning-option-picker-title" class="flex max-h-[86vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-4"><div><h3 id="seasoning-option-picker-title" class="text-lg font-semibold">${t("seasoning.batch.addOptionToAction")}</h3><p class="mt-1 text-sm text-muted-foreground">${tf("seasoning.batch.optionPickerHint", { action: actionLabel(this.activeAction) })}</p></div><button type="button" data-close-picker="option" class="${secondaryButtonClass}" aria-label="${t("seasoning.close")}">×</button></div>
        <div class="mt-4"><input data-option-picker-query class="${inputClass}" placeholder="${t("seasoning.searchOptions")}"></div>
        <div class="mt-4 grid min-h-0 flex-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">${options.map((option) => `<label data-option-picker-card data-search-text="${escapeSeasoningHtml(`${option.name} ${option.code}`.toLocaleLowerCase())}" class="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${this.pendingOptions.has(option.id) ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"}"><input type="checkbox" data-option-picker-option="${escapeSeasoningHtml(option.id)}" ${this.pendingOptions.has(option.id) ? "checked" : ""} class="mt-1 size-4 rounded border-border text-primary"><span class="min-w-0"><strong class="block truncate text-sm">${escapeSeasoningHtml(option.name)}</strong><span class="mt-1 block truncate font-mono text-[11px] text-muted-foreground">${escapeSeasoningHtml(option.code)}</span></span></label>`).join("") || `<p class="col-span-full py-12 text-center text-sm text-muted-foreground">${t("seasoning.noOptions")}</p>`}</div>
        <div class="mt-5 flex items-center justify-between gap-3"><span data-picked-option-count class="text-sm text-muted-foreground">${tf("seasoning.batch.selectedOptionCount", { count: String(this.pendingOptions.size) })}</span><div class="flex gap-2"><button type="button" data-close-picker="option" class="${secondaryButtonClass}">${t("seasoning.cancel")}</button><button type="button" data-confirm-options class="${primaryButtonClass}">${t("seasoning.batch.confirmOptions")}</button></div></div>
      </section>
    </div>`;
  }

  private renderConfigurationStep(): string {
    const activeOptions = this.activeAction ? this.actionOptions.get(this.activeAction) : undefined;
    const actionCards = [...this.actionOptions.entries()].map(([action, options]) => `<button type="button" data-activate-action="${action}" class="w-full rounded-xl border px-3 py-3 text-left transition ${this.activeAction === action ? "border-primary/50 bg-primary/5 ring-2 ring-primary/10" : "border-transparent hover:border-border hover:bg-muted/35"}"><span class="flex items-center justify-between gap-2"><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(action)}">${escapeSeasoningHtml(actionLabel(action))}</span><span class="text-xs font-semibold text-muted-foreground">${tf("seasoning.batch.optionCount", { count: String(options.size) })}</span></span><span class="mt-2 block text-xs text-muted-foreground">${escapeSeasoningHtml(this.actionDescription(action))}</span></button>`).join("");
    const linkedOptions = activeOptions ? (this.options?.items ?? []).filter((option) => activeOptions.has(option.id)) : [];
    const bulkPrice = this.normalizedBulkPrice();
    const bulkPriceEditor = activeOptions ? `<div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/25 p-1 pl-3"><label for="seasoning-bulk-price" class="text-xs font-semibold text-muted-foreground">${t("seasoning.batch.bulkPrice")}</label><span class="text-sm text-muted-foreground">$</span><input id="seasoning-bulk-price" type="number" min="0" step="0.01" inputmode="decimal" data-bulk-action-price value="${escapeSeasoningHtml(this.bulkPriceInput)}" placeholder="0.00" class="h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-sm"><button type="button" data-fill-selected-prices class="${secondaryButtonClass} !min-h-8 !px-3 text-xs" ${this.selectedPriceOptions.size && bulkPrice !== null ? "" : "disabled"}><span data-selected-price-count>${tf("seasoning.batch.updateSelectedPrices", { count: String(this.selectedPriceOptions.size) })}</span></button><button type="button" data-fill-bulk-price class="${secondaryButtonClass} !min-h-8 !px-3 text-xs" ${activeOptions.size && bulkPrice !== null ? "" : "disabled"}>${t("seasoning.batch.fillAllPrices")}</button></div>` : "";
    return `<div class="grid min-h-[430px] overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside class="flex flex-col border-b border-border bg-muted/20 p-4 lg:border-b-0 lg:border-r">
        <div class="flex items-center justify-between gap-3"><div><h3 class="text-sm font-semibold">${t("seasoning.batch.actions")}</h3><p class="mt-1 text-xs text-muted-foreground">${this.actionOptions.size ? tf("seasoning.batch.actionCount", { count: String(this.actionOptions.size) }) : t("seasoning.batch.noActions")}</p></div><button type="button" data-open-action-picker class="${primaryButtonClass} !min-h-9 !px-3 text-xs">＋ ${t("seasoning.batch.addAction")}</button></div>
        ${actionCards ? `<div class="mt-4 space-y-2">${actionCards}</div>` : ""}
      </aside>
      <section class="min-w-0 p-5">${this.activeAction && activeOptions ? `<div class="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4"><div class="flex items-center gap-2"><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(this.activeAction)}">${escapeSeasoningHtml(actionLabel(this.activeAction))}</span><span class="text-xs text-muted-foreground">${t("seasoning.batch.currentAction")}</span></div><div class="flex gap-2"><button type="button" data-remove-action class="${secondaryButtonClass} text-destructive">${t("seasoning.batch.removeAction")}</button><button type="button" data-open-option-picker class="${primaryButtonClass}">＋ ${t("seasoning.batch.addOptionToAction")}</button></div></div>
        <div class="mt-4 flex flex-wrap items-center gap-3"><input data-linked-option-query class="${inputClass} min-w-52 flex-1" placeholder="${t("seasoning.searchOptions")}"><span class="shrink-0 text-sm text-muted-foreground">${tf("seasoning.batch.optionCount", { count: String(activeOptions.size) })}</span>${bulkPriceEditor}</div>
        <div class="mt-3 overflow-x-auto rounded-xl border border-border"><div class="min-w-[720px]"><div class="grid grid-cols-[36px_minmax(140px,1fr)_130px_110px_140px_44px] items-center gap-3 bg-muted/45 px-4 py-3 text-xs font-semibold text-muted-foreground"><input type="checkbox" data-select-visible-price-options class="size-4 rounded border-border text-primary" aria-label="${t("seasoning.batch.selectVisibleOptions")}"><span>${t("seasoning.option")}</span><span>${t("seasoning.batch.inputPrice")}</span><span>${t("seasoning.batch.markupCoefficient")}</span><span>${t("seasoning.batch.actualMarkupPrice")}</span><span></span></div><div data-linked-option-list>${linkedOptions.map((option) => {
          const pricing = activeOptions.get(option.id);
          if (!pricing) return "";
          const actualPrice = calculateActualMarkupPrice(pricing.inputPrice, pricing.markupCoefficient);
          return `<div data-linked-option-row data-option-id="${escapeSeasoningHtml(option.id)}" data-search-text="${escapeSeasoningHtml(`${option.name} ${option.code}`.toLocaleLowerCase())}" class="grid grid-cols-[36px_minmax(140px,1fr)_130px_110px_140px_44px] items-center gap-3 border-t border-border px-4 py-3"><input type="checkbox" data-select-price-option="${escapeSeasoningHtml(option.id)}" ${this.selectedPriceOptions.has(option.id) ? "checked" : ""} class="size-4 rounded border-border text-primary" aria-label="${tf("seasoning.batch.selectOptionForPrice", { option: option.name })}"><span class="min-w-0"><strong class="block truncate text-sm">${escapeSeasoningHtml(option.name)}</strong></span><label class="flex items-center gap-2"><span class="text-sm text-muted-foreground">$</span><input type="number" min="0" step="0.01" inputmode="decimal" data-action-option-price="${escapeSeasoningHtml(option.id)}" value="${pricing.inputPrice}" placeholder="0.00" class="h-9 w-24 rounded-lg border border-border bg-background px-2 text-right text-sm"></label><span data-action-option-coefficient="${escapeSeasoningHtml(option.id)}" class="inline-flex w-fit items-center rounded-full border border-border bg-muted/35 px-2.5 py-1 text-xs font-semibold text-foreground">${pricing.markupCoefficient.toFixed(2)}</span><span data-action-option-actual-price="${escapeSeasoningHtml(option.id)}" class="font-semibold tabular-nums text-foreground">$${actualPrice.toFixed(2)}</span><button type="button" data-remove-action-option="${escapeSeasoningHtml(option.id)}" class="rounded-lg border-0 bg-transparent text-lg text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="${t("seasoning.remove")}">×</button></div>`;
        }).join("")}</div></div>${activeOptions.size ? "" : `<div class="flex min-h-48 flex-col items-center justify-center border-t border-border px-4 text-center"><p class="text-sm font-semibold">${t("seasoning.batch.optionEmptyTitle")}</p><button type="button" data-open-option-picker class="${secondaryButtonClass} mt-3">${t("seasoning.batch.addOptionToAction")}</button></div>`}</div>` : `<div class="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 px-6 text-center"><span class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary">＋</span><h3 class="mt-4 text-base font-semibold">${t("seasoning.batch.actionEmptyTitle")}</h3><p class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">${t("seasoning.batch.actionEmptyDescription")}</p><button type="button" data-open-action-picker class="${primaryButtonClass} mt-5">${t("seasoning.batch.addAction")}</button></div>`}</section>
    </div>${this.renderActionPicker()}${this.renderOptionPicker()}`;
  }

  private renderProductStep(): string {
    if (!this.menu) return `<div class="flex min-h-72 items-center justify-center"><button type="button" data-retry-products class="${secondaryButtonClass}">重新加载菜单</button></div>`;
    return `<div class="space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row">
        <div class="relative min-w-0 flex-1"><input data-product-query class="${inputClass} pr-10" placeholder="${t("seasoning.searchProducts")}" value="${escapeSeasoningHtml(this.productQuery)}"><span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">⌕</span></div>
        <button type="button" data-search-products class="${secondaryButtonClass}">搜索</button>
        <span class="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary/10 px-3 text-sm font-semibold text-primary">${tf("seasoning.batch.selectedCount", { count: String(this.selectedProductCount()) })}</span>
      </div>
      ${renderSeasoningMenuStructurePicker(this.menu)}
    </div>`;
  }

  private renderPreviewStep(): string {
    if (!this.preview || !this.previewPage) return "";
    return `<div class="space-y-3">
      <div class="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <span><strong>${this.preview.actualProductCount}</strong> 个商品</span><span class="text-muted-foreground">·</span><span><strong>${this.preview.total}</strong> 条候选关系</span>
      </div>
      <div class="max-h-[48vh] space-y-3 overflow-y-auto pr-1">${this.previewPage.items.map((product) => {
        const collapsed = this.collapsedPreviewProducts.has(product.productId);
        return `<article data-preview-product="${escapeSeasoningHtml(product.productId)}" class="overflow-hidden rounded-xl border ${product.excludedCandidates.length ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/10" : "border-border bg-card"}">
          <button type="button" data-toggle-preview-product="${escapeSeasoningHtml(product.productId)}" aria-expanded="${!collapsed}" class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/35">
            <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">${escapeSeasoningHtml((product.productName ?? product.productId).slice(0, 1))}</span>
            <span class="min-w-0 flex-1"><strong class="block truncate text-sm">${escapeSeasoningHtml(product.productName ?? product.productId)}</strong><span class="mt-0.5 block text-xs text-muted-foreground">${product.finalRelationCount} 个 Option${product.excludedCandidates.length ? ` · ${product.excludedCandidates.length} 条不可用` : ""}</span></span>
            <span class="text-sm text-muted-foreground transition-transform ${collapsed ? "" : "rotate-180"}" aria-hidden="true">⌄</span>
          </button>
          ${collapsed ? "" : `<div class="space-y-3 border-t border-border bg-background/60 p-3">${product.actions.map((group) => `<section data-preview-action="${escapeSeasoningHtml(group.action)}" class="overflow-x-auto rounded-lg border border-border bg-card">
            <header class="flex min-w-[620px] items-center justify-between bg-muted/35 px-3 py-2"><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(group.action)}">${escapeSeasoningHtml(actionLabel(group.action))}</span><span class="text-xs font-semibold text-muted-foreground">${group.items.length} 个 Option</span></header>
            <div class="grid min-w-[620px] grid-cols-[minmax(160px,1fr)_120px_100px_120px] gap-3 border-t border-border bg-muted/15 px-3 py-2 text-xs font-semibold text-muted-foreground"><span>Option</span><span class="text-right">Option 原价</span><span class="text-right">加价系数</span><span class="text-right">实际价格</span></div>
            <div class="min-w-[620px] divide-y divide-border">${group.items.map((item) => `<div data-preview-option="${escapeSeasoningHtml(item.source === "configured" ? item.candidateId : item.relationId)}" class="grid grid-cols-[minmax(160px,1fr)_120px_100px_120px] items-center gap-3 px-3 py-3">
              <strong data-preview-option-name class="truncate text-sm">${escapeSeasoningHtml(item.optionName ?? item.optionId)}</strong>
              <span data-preview-option-input-price class="text-right text-sm tabular-nums">$${Number(item.inputPrice).toFixed(2)}</span>
              <span data-preview-option-coefficient class="text-right text-sm tabular-nums">${Number(item.markupCoefficient).toFixed(2)}</span>
              <span data-preview-option-actual-price class="text-right text-sm font-semibold tabular-nums">$${Number(item.priceDelta).toFixed(2)}</span>
            </div>`).join("")}</div>
          </section>`).join("")}</div>`}
        </article>`;
      }).join("") || `<div class="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">暂无可预览商品</div>`}</div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <label class="inline-flex shrink-0 flex-nowrap items-center gap-3 whitespace-nowrap text-sm text-muted-foreground"><span class="shrink-0">每页</span><select data-preview-page-size class="${inputClass} !h-9 !w-20 shrink-0">${([5, 10, 20, 50] as const).map((size) => `<option value="${size}" ${this.previewPageSize === size ? "selected" : ""}>${size}</option>`).join("")}</select><span class="shrink-0">个商品</span></label>
        <nav data-preview-pagination aria-label="预览分页" class="flex flex-wrap items-center justify-end gap-1.5">
          <button type="button" data-preview-previous class="${secondaryButtonClass} !min-h-9 !px-3" ${this.previewPageNumber <= 1 || !this.previewPage.totalPages ? "disabled" : ""}>上一页</button>
          ${previewPageItems(this.previewPageNumber, this.previewPage.totalPages).map((page) => page === null ? `<span data-preview-ellipsis class="px-1 text-sm text-muted-foreground">…</span>` : `<button type="button" data-preview-page="${page}" aria-label="第 ${page} 页" ${page === this.previewPageNumber ? 'aria-current="page"' : ""} class="${page === this.previewPageNumber ? primaryButtonClass : secondaryButtonClass} !min-h-9 min-w-9 !px-2">${page}</button>`).join("")}
          <button type="button" data-preview-next class="${secondaryButtonClass} !min-h-9 !px-3" ${!this.previewPage.totalPages || this.previewPageNumber >= this.previewPage.totalPages ? "disabled" : ""}>下一页</button>
        </nav>
      </div>
    </div>`;
  }

  private render(): void {
    const content = this.loading ? `<div class="flex min-h-72 items-center justify-center"><p class="text-sm font-medium text-muted-foreground">${t("seasoning.loading")}</p></div>` : this.step === 1 ? this.renderProductStep() : this.step === 2 ? this.renderSharedConfigurationStep() : this.renderPreviewStep();
    const canNext = this.step === 1 ? this.selectedProductCount() > 0 : this.step === 2 ? this.allActionsConfigured() : true;
    this.overlay.innerHTML = `
      <section data-seasoning-batch-wizard role="dialog" aria-modal="true" aria-labelledby="seasoning-batch-title" class="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <header class="border-b border-border px-5 py-4"><div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">${t("seasoning.title")}</p><h2 id="seasoning-batch-title" class="mt-1 text-xl font-semibold">${t("seasoning.batch.open")}</h2></div><button type="button" data-close class="${secondaryButtonClass}" aria-label="${t("seasoning.close")}">×</button></div><div class="mt-4">${this.renderSteps()}</div></header>
        <div class="min-h-0 flex-1 overflow-y-auto p-5">${this.error ? `<p class="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">${escapeSeasoningHtml(this.error)}</p>` : ""}${content}</div>
        <footer class="flex items-center justify-between gap-3 border-t border-border bg-muted/25 px-5 py-4"><button type="button" data-back class="${secondaryButtonClass}" ${this.step === 1 || this.loading ? "disabled" : ""}>${t("seasoning.back")}</button><div class="flex items-center gap-3">${this.step === 2 && this.configuredRelationCount() ? `<span class="hidden text-sm text-muted-foreground sm:inline">${tf("seasoning.batch.configuredRelationCount", { count: String(this.configuredRelationCount()) })}</span>` : ""}<button type="button" data-next class="${primaryButtonClass}" ${!canNext || this.loading ? "disabled" : ""}>${this.step === 3 ? t("seasoning.batch.confirm") : this.step === 2 ? t("seasoning.batch.generatePreview") : t("seasoning.next")}</button></div></footer>
      </section>`;
    syncSeasoningMenuIndeterminate(this.overlay);
    syncSeasoningOptionCategoryIndeterminate(this.overlay);
    this.syncBulkPriceSelectionState();
  }

  private async loadOptions(): Promise<void> {
    this.loading = true;
    this.render();
    try {
      const snapshot = await seasoningApi.optionPicker();
      this.options = { items: snapshot.items, nextCursor: null, total: snapshot.items.length };
      this.optionCategories = snapshot.categories;
    } catch (error) {
      this.error = this.errorMessage(error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private async loadMenuStructure(
    showLoading = false,
    cursor?: string,
    append = false,
    query = this.appliedProductQuery,
    groupId = this.menu?.activeGroupId,
    categoryId = this.menu?.activeCategoryId,
  ): Promise<void> {
    if (!this.productSelection) return;
    if (showLoading) {
      this.loading = true;
      this.render();
    }
    try {
      const next = await seasoningApi.menuStructure({
        selectionToken: this.productSelection.token,
        query,
        groupId,
        categoryId,
        cursor,
        limit: 6,
      });
      this.menu = append && this.menu ? { ...next, dishes: { ...next.dishes, items: [...this.menu.dishes.items, ...next.dishes.items] } } : next;
      this.appliedProductQuery = next.query;
      this.productSelection = { ...this.productSelection, total: next.selectedTotal };
      this.error = "";
    } catch (error) {
      await this.recoverFromError(error);
    } finally {
      if (showLoading) this.loading = false;
      this.render();
    }
  }

  private async recoverFromError(error: unknown): Promise<void> {
    if (error instanceof SeasoningApiError && PRODUCT_SELECTION_ERRORS.has(error.code)) {
      this.clearAfterProductChange();
      this.productSelection = await seasoningApi.createProductSelection().catch(() => null);
      this.menu = null;
      this.step = 1;
      this.error = t("seasoning.productSelectionExpired");
      if (this.productSelection) await this.loadMenuStructure(false);
      return;
    }
    if (error instanceof SeasoningApiError && error.code === "preview_expired") {
      this.preview = null;
      this.previewPage = null;
      if (this.productSelection) {
        try {
          this.productSelection = await seasoningApi.productSelection(this.productSelection.token);
        } catch (selectionError) {
          await this.recoverFromError(selectionError);
          return;
        }
      }
      this.step = 2;
      this.error = "预览已过期，请重新生成";
      return;
    }
    this.error = this.errorMessage(error);
  }

  private async updateProductSelection(body: Parameters<typeof seasoningApi.updateProductSelection>[1]): Promise<void> {
    if (!this.productSelection) return;
    this.error = "";
    try {
      this.productSelection = await seasoningApi.updateProductSelection(this.productSelection.token, body);
      this.clearAfterProductChange();
      this.dirty = true;
      await this.loadMenuStructure(false);
    } catch (error) {
      await this.recoverFromError(error);
      this.render();
    }
  }

  private async createPreview(): Promise<void> {
    if (!this.allActionsConfigured() || !this.productSelection) return;
    this.loading = true;
    this.error = "";
    this.render();
    try {
      this.discardPreview();
      this.preview = await seasoningApi.previewBatch({
        actionOptions: [...this.actionOptions].map(([action, options]) => ({
          action,
          optionPrices: [...options].map(([optionId, pricing]) => ({
            optionId,
            inputPrice: pricing.inputPrice,
            markupCoefficient: pricing.markupCoefficient,
            priceDelta: calculateActualMarkupPrice(pricing.inputPrice, pricing.markupCoefficient),
          })),
        })),
        productSelectionToken: this.productSelection.token,
        expectedVersion: this.input.bootstrap.version,
      });
      this.collapsedPreviewProducts.clear();
      await this.loadPreviewProducts();
      this.step = 3;
    } catch (error) {
      await this.recoverFromError(error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private async loadPreviewProducts(): Promise<void> {
    if (!this.preview) return;
    this.loading = true;
    this.render();
    try {
      const response = await seasoningApi.previewProducts(this.preview.previewToken, { page: this.previewPageNumber, limit: this.previewPageSize });
      if (!("page" in response)) throw new Error("invalid_pagination_response");
      if (response.totalPages > 0 && response.page > response.totalPages) {
        this.previewPageNumber = response.totalPages;
        const recovered = await seasoningApi.previewProducts(this.preview.previewToken, { page: this.previewPageNumber, limit: this.previewPageSize });
        if (!("page" in recovered)) throw new Error("invalid_pagination_response");
        this.previewPage = recovered;
      } else {
        this.previewPageNumber = response.page;
        this.previewPage = response;
      }
      this.error = "";
    } catch (error) {
      if (error instanceof SeasoningApiError && (error.code === "invalid_page" || error.code === "invalid_page_size" || error.code === "invalid_pagination")) {
        this.previewPageNumber = 1;
        this.previewPageSize = 5;
        try {
          const recovered = await seasoningApi.previewProducts(this.preview.previewToken, { page: 1, limit: 5 });
          if (!("page" in recovered)) throw new Error("invalid_pagination_response");
          this.previewPage = recovered;
          this.error = "预览分页已刷新，已返回第一页";
        } catch (recoveryError) {
          await this.recoverFromError(recoveryError);
        }
      } else {
        await this.recoverFromError(error);
      }
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private async commit(): Promise<void> {
    if (!this.preview) return;
    this.loading = true;
    this.render();
    try {
      const result = await seasoningApi.commitBatch({ expectedVersion: this.input.bootstrap.version, previewToken: this.preview.previewToken });
      this.dirty = false;
      this.preview = null;
      this.productSelection = null;
      await this.input.onSaved(result);
      this.close(true);
    } catch (error) {
      await this.recoverFromError(error);
      this.loading = false;
      this.render();
    }
  }

  private async handleClick(event: Event): Promise<void> {
    const clicked = event.target as HTMLElement;
    const pickerBackdrop = clicked.dataset.pickerBackdrop;
    if (pickerBackdrop === "action") this.actionPickerOpen = false;
    if (pickerBackdrop === "option") this.optionPickerOpen = false;
    if (pickerBackdrop) {
      this.render();
      return;
    }
    const target = clicked.closest<HTMLElement>("button");
    if (!target) return;
    if (target.hasAttribute("data-close")) return this.close();
    if (target.hasAttribute("data-retry-products")) return void this.initialize();
    if (target.hasAttribute("data-open-action-picker")) {
      this.pendingActions = new Set(this.actionOptions.keys());
      this.actionPickerOpen = true;
      this.render();
      return;
    }
    if (target.hasAttribute("data-open-option-picker") && this.activeAction) {
      this.pendingOptions = new Set();
      this.optionPickerQuery = "";
      this.activeOptionCategoryId = this.optionCategories.find((category) => (this.options?.items ?? []).some((option) => option.categoryId === category.id))?.id ?? this.optionCategories[0]?.id ?? null;
      this.optionPickerOpen = true;
      this.render();
      return;
    }
    const closePicker = target.dataset.closePicker;
    if (closePicker === "action") this.actionPickerOpen = false;
    if (closePicker === "option") this.optionPickerOpen = false;
    if (closePicker) {
      this.render();
      return;
    }
    if (target.hasAttribute("data-confirm-actions")) {
      const previousActions = new Set(this.actionOptions.keys());
      for (const definition of SEASONING_ACTIONS) {
        if (this.pendingActions.has(definition.code) && !this.actionOptions.has(definition.code)) this.actionOptions.set(definition.code, new Map());
      }
      this.activeAction = this.activeAction ?? [...this.actionOptions.keys()].find((action) => !previousActions.has(action)) ?? [...this.actionOptions.keys()][0] ?? null;
      this.actionPickerOpen = false;
      this.clearAfterConfigurationChange();
      this.dirty = true;
      this.render();
      return;
    }
    const activeAction = target.dataset.activateAction as SeasoningActionCode | undefined;
    if (activeAction && this.actionOptions.has(activeAction)) {
      this.activeAction = activeAction;
      this.bulkPriceInput = "";
      this.selectedPriceOptions.clear();
      this.render();
      return;
    }
    if (target.hasAttribute("data-remove-action") && this.activeAction) {
      const action = this.activeAction;
      if (!window.confirm(tf("seasoning.batch.removeActionConfirm", { action: actionLabel(action) }))) return;
      const actions = [...this.actionOptions.keys()];
      const index = actions.indexOf(action);
      this.actionOptions.delete(action);
      const remaining = [...this.actionOptions.keys()];
      this.activeAction = remaining[Math.min(index, remaining.length - 1)] ?? null;
      this.bulkPriceInput = "";
      this.selectedPriceOptions.clear();
      this.clearAfterConfigurationChange();
      this.dirty = true;
      this.render();
      return;
    }
    if (target.hasAttribute("data-confirm-options") && this.activeAction) {
      const previous = this.actionOptions.get(this.activeAction) ?? new Map<string, BatchOptionPricingDraft>();
      const next = new Map<string, BatchOptionPricingDraft>(previous);
      for (const option of this.options?.items ?? []) {
        if (this.pendingOptions.has(option.id)) next.set(option.id, createBatchOptionPricing());
      }
      this.actionOptions.set(this.activeAction, next);
      this.selectedPriceOptions = new Set([...this.selectedPriceOptions].filter((optionId) => next.has(optionId)));
      this.optionPickerOpen = false;
      this.clearAfterConfigurationChange();
      this.dirty = true;
      this.render();
      return;
    }
    const optionCategoryId = target.dataset.activateOptionCategory;
    if (optionCategoryId) {
      this.activeOptionCategoryId = optionCategoryId;
      this.render();
      return;
    }
    const removeOptionId = target.dataset.removeActionOption;
    if (removeOptionId && this.activeAction) {
      this.actionOptions.get(this.activeAction)?.delete(removeOptionId);
      this.selectedPriceOptions.delete(removeOptionId);
      this.clearAfterConfigurationChange();
      this.dirty = true;
      this.render();
      return;
    }
    if (target.hasAttribute("data-fill-bulk-price") && this.activeAction) {
      const price = this.normalizedBulkPrice();
      const options = this.actionOptions.get(this.activeAction);
      if (price === null || !options?.size) return;
      for (const [optionId, pricing] of options) options.set(optionId, updateBatchInputPrice(pricing, price));
      this.clearAfterConfigurationChange();
      this.dirty = true;
      this.render();
      return;
    }
    if (target.hasAttribute("data-fill-selected-prices") && this.activeAction) {
      const price = this.normalizedBulkPrice();
      const options = this.actionOptions.get(this.activeAction);
      if (price === null || !options || !this.selectedPriceOptions.size) return;
      for (const optionId of this.selectedPriceOptions) {
        const pricing = options.get(optionId);
        if (pricing) options.set(optionId, updateBatchInputPrice(pricing, price));
      }
      this.clearAfterConfigurationChange();
      this.dirty = true;
      this.render();
      return;
    }
    if (target.hasAttribute("data-back")) {
      if (this.step === 3) this.discardPreview();
      if (this.step === 2) this.selectedPriceOptions.clear();
      this.step = Math.max(1, this.step - 1);
      this.render();
      return;
    }
    if (target.hasAttribute("data-next")) {
      if (this.step === 1) { this.step = 2; await this.loadOptions(); }
      else if (this.step === 2) await this.createPreview();
      else await this.commit();
      return;
    }
    if (target.hasAttribute("data-search-products")) {
      await this.loadMenuStructure(true, undefined, false, this.productQuery, "", "");
      return;
    }
    const groupId = target.dataset.menuActivateGroup;
    if (groupId && this.menu) {
      this.menu = { ...this.menu, activeGroupId: groupId, activeCategoryId: "" };
      await this.loadMenuStructure(false);
      return;
    }
    const categoryId = target.dataset.menuActivateCategory;
    if (categoryId && this.menu) {
      this.menu = { ...this.menu, activeCategoryId: categoryId };
      await this.loadMenuStructure(false);
      return;
    }
    if (target.hasAttribute("data-menu-load-more") && this.menu?.dishes.nextCursor) {
      await this.loadMenuStructure(false, this.menu.dishes.nextCursor, true);
      return;
    }
    const togglePreviewProductId = target.dataset.togglePreviewProduct;
    if (togglePreviewProductId) {
      if (this.collapsedPreviewProducts.has(togglePreviewProductId)) this.collapsedPreviewProducts.delete(togglePreviewProductId);
      else this.collapsedPreviewProducts.add(togglePreviewProductId);
      this.render();
      return;
    }
    if (target.hasAttribute("data-preview-previous") && this.previewPageNumber > 1) {
      this.previewPageNumber -= 1;
      await this.loadPreviewProducts();
      return;
    }
    if (target.hasAttribute("data-preview-next") && this.previewPage && this.previewPageNumber < this.previewPage.totalPages) {
      this.previewPageNumber += 1;
      await this.loadPreviewProducts();
      return;
    }
    const directPage = Number(target.dataset.previewPage);
    if (Number.isInteger(directPage) && directPage >= 1 && directPage <= (this.previewPage?.totalPages ?? 0) && directPage !== this.previewPageNumber) {
      this.previewPageNumber = directPage;
      await this.loadPreviewProducts();
      return;
    }
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.hasAttribute("data-product-query")) this.productQuery = target.value;
    if (target.hasAttribute("data-bulk-action-price")) {
      this.bulkPriceInput = target.value;
      const fillButton = this.overlay.querySelector<HTMLButtonElement>("[data-fill-bulk-price]");
      const activeOptions = this.activeAction ? this.actionOptions.get(this.activeAction) : undefined;
      if (fillButton) fillButton.disabled = !activeOptions?.size || this.normalizedBulkPrice() === null;
      this.syncBulkPriceSelectionState();
    }
    const changedPriceOptionId = target.dataset.actionOptionPrice;
    if (changedPriceOptionId && this.activeAction && this.actionOptions.get(this.activeAction)?.has(changedPriceOptionId)) {
      const pricing = this.actionOptions.get(this.activeAction)?.get(changedPriceOptionId);
      if (!pricing) return;
      const updated = updateBatchInputPrice(pricing, Math.max(0, Number(target.value) || 0));
      this.actionOptions.get(this.activeAction)?.set(changedPriceOptionId, updated);
      const actualPrice = this.overlay.querySelector<HTMLElement>(`[data-action-option-actual-price="${CSS.escape(changedPriceOptionId)}"]`);
      if (actualPrice) actualPrice.textContent = `$${calculateActualMarkupPrice(updated.inputPrice, updated.markupCoefficient).toFixed(2)}`;
      this.clearAfterConfigurationChange();
      this.dirty = true;
    }
    if (target.hasAttribute("data-linked-option-query")) {
      const query = target.value.trim().toLocaleLowerCase();
      this.linkedOptionQuery = target.value;
      this.overlay.querySelectorAll<HTMLElement>("[data-linked-option-row]").forEach((row) => row.classList.toggle("hidden", !String(row.dataset.searchText).includes(query)));
      this.overlay.querySelectorAll<HTMLButtonElement>("[data-drag-option]").forEach((button) => { button.disabled = Boolean(query); });
      this.overlay.querySelector<HTMLElement>("[data-option-reorder-search-hint]")?.classList.toggle("hidden", !query);
      this.syncBulkPriceSelectionState();
    }
    if (target.hasAttribute("data-option-picker-query")) {
      this.optionPickerQuery = target.value;
      this.render();
      const input = this.overlay.querySelector<HTMLInputElement>("[data-option-picker-query]");
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    }
  }

  private async handleChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target instanceof HTMLSelectElement && target.hasAttribute("data-preview-page-size")) {
      const pageSize = Number(target.value);
      if (![5, 10, 20, 50].includes(pageSize)) return;
      this.previewPageSize = pageSize as BatchPreviewPageSize;
      this.previewPageNumber = 1;
      await this.loadPreviewProducts();
      return;
    }
    if (!(target instanceof HTMLInputElement)) return;
    const actionPickerOption = target.dataset.actionPickerOption as SeasoningActionCode | undefined;
    if (actionPickerOption) {
      if (target.checked) this.pendingActions.add(actionPickerOption); else this.pendingActions.delete(actionPickerOption);
      const card = target.closest<HTMLElement>("label");
      card?.classList.toggle("border-primary/50", target.checked);
      card?.classList.toggle("bg-primary/5", target.checked);
      card?.classList.toggle("border-border", !target.checked);
      return;
    }
    const optionPickerOption = target.dataset.optionPickerOption;
    if (optionPickerOption) {
      if (target.checked) this.pendingOptions.add(optionPickerOption); else this.pendingOptions.delete(optionPickerOption);
      this.render();
      return;
    }
    const toggleCategoryId = target.dataset.optionCategoryToggle;
    if (toggleCategoryId && this.activeAction) {
      const query = this.optionPickerQuery.trim().toLocaleLowerCase();
      const category = this.optionCategories.find((item) => item.id === toggleCategoryId);
      const existing = new Set(this.actionOptions.get(this.activeAction)?.keys() ?? []);
      const visible = (this.options?.items ?? []).filter((option) => option.categoryId === toggleCategoryId && !existing.has(option.id) && (!query || category?.name.toLocaleLowerCase().includes(query) || `${option.name} ${option.nameEn ?? ""} ${option.code}`.toLocaleLowerCase().includes(query)));
      for (const option of visible) target.checked ? this.pendingOptions.add(option.id) : this.pendingOptions.delete(option.id);
      this.render();
      return;
    }
    const priceOptionId = target.dataset.selectPriceOption;
    if (priceOptionId) {
      if (target.checked) this.selectedPriceOptions.add(priceOptionId); else this.selectedPriceOptions.delete(priceOptionId);
      this.syncBulkPriceSelectionState();
      return;
    }
    if (target.hasAttribute("data-select-visible-price-options")) {
      const visibleIds = [...this.overlay.querySelectorAll<HTMLElement>("[data-linked-option-row]:not(.hidden)")].map((row) => String(row.dataset.optionId)).filter(Boolean);
      for (const optionId of visibleIds) {
        if (target.checked) this.selectedPriceOptions.add(optionId); else this.selectedPriceOptions.delete(optionId);
        this.overlay.querySelectorAll<HTMLInputElement>("[data-select-price-option]").forEach((optionCheckbox) => {
          if (optionCheckbox.dataset.selectPriceOption === optionId) optionCheckbox.checked = target.checked;
        });
      }
      this.syncBulkPriceSelectionState();
      return;
    }
    const menuLevel = target.dataset.menuToggleLevel;
    const menuId = target.dataset.menuToggleId;
    if (menuLevel && menuId && this.menu) {
      if (menuLevel === "dish") {
        await this.updateProductSelection({
          operation: "dish",
          productId: menuId,
          groupId: this.menu.activeGroupId,
          selected: target.checked,
        });
      } else if (menuLevel === "group") {
        this.menu = { ...this.menu, activeGroupId: menuId, activeCategoryId: "" };
        await this.updateProductSelection({ operation: "scope", level: "group", groupId: menuId, query: this.appliedProductQuery, selected: target.checked });
      } else if (menuLevel === "category") {
        this.menu = { ...this.menu, activeCategoryId: menuId };
        await this.updateProductSelection({
          operation: "scope",
          level: "category",
          groupId: this.menu.activeGroupId,
          categoryId: menuId,
          query: this.appliedProductQuery,
          selected: target.checked,
        });
      }
      return;
    }
    const changedPriceOptionId = target.dataset.actionOptionPrice;
    if (changedPriceOptionId && this.activeAction && this.actionOptions.get(this.activeAction)?.has(changedPriceOptionId)) {
      const pricing = this.actionOptions.get(this.activeAction)?.get(changedPriceOptionId);
      if (!pricing) return;
      this.actionOptions.get(this.activeAction)?.set(changedPriceOptionId, updateBatchInputPrice(pricing, Math.max(0, Number(target.value) || 0)));
      this.clearAfterConfigurationChange();
      this.dirty = true;
      return;
    }
  }
}

export function openSeasoningBatchWizard(host: HTMLElement, input: WizardInput): void {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-6";
  host.appendChild(overlay);
  new BatchWizardController(overlay, input);
  overlay.querySelector<HTMLElement>("[data-close]")?.focus();
}
