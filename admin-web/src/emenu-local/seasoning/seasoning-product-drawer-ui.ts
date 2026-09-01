import { t, tf } from "../../i18n";
import { openConfirmDialog } from "../../ui/app-confirm-dialog";
import { seasoningApi, SeasoningApiError } from "./seasoning-api";
import { calculateActualMarkupPrice, updateBatchInputPrice } from "./seasoning-batch-pricing";
import {
  configuredRelationCount,
  createConfiguredOption,
  createProductConfigurationDraft,
  installSeasoningWorkspaceReorder,
  moveDraftAction,
  moveDraftOption,
  renderSeasoningConfigurationWorkspace,
  syncSeasoningOptionCategoryIndeterminate,
  type SeasoningConfigurationDraft,
} from "./seasoning-configuration-workspace-ui";
import { assignSeasoningSortOrders } from "./seasoning-relation-order";
import type { ProductSeasoningRelation, SeasoningActionCode, SeasoningOption, SeasoningOptionCategory, SeasoningProduct } from "./seasoning-types";
import { actionLabel, actionTone, escapeSeasoningHtml, primaryButtonClass, secondaryButtonClass } from "./seasoning-ui-helpers";

type DrawerInput = {
  productId: string;
  onSaved: (version: number) => Promise<void> | void;
};

class ProductEditWizardController {
  private product: SeasoningProduct | null = null;
  private options: SeasoningOption[] = [];
  private optionCategories: SeasoningOptionCategory[] = [];
  private draft: SeasoningConfigurationDraft = [];
  private latestRelations: ProductSeasoningRelation[] = [];
  private version = 0;
  private step: 1 | 2 = 1;
  private activeAction: SeasoningActionCode | null = null;
  private actionPickerOpen = false;
  private optionPickerOpen = false;
  private pendingActions = new Set<SeasoningActionCode>();
  private pendingOptions = new Set<string>();
  private optionPickerQuery = "";
  private activeOptionCategoryId: string | null = null;
  private selectedPriceOptions = new Set<string>();
  private bulkPriceInput = "";
  private optionQuery = "";
  private loading = true;
  private saving = false;
  private error = "";
  private dirty = false;
  private conflict: { version: number; relations: ProductSeasoningRelation[] } | null = null;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly input: DrawerInput,
  ) {
    this.overlay.addEventListener("click", (event) => void this.handleClick(event));
    this.overlay.addEventListener("change", (event) => this.handleChange(event));
    this.overlay.addEventListener("input", (event) => this.handleInput(event));
    this.overlay.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (this.actionPickerOpen || this.optionPickerOpen) {
        this.actionPickerOpen = false;
        this.optionPickerOpen = false;
        this.render();
      } else void this.close();
    });
    installSeasoningWorkspaceReorder(this.overlay, {
      moveAction: (source, target) => {
        this.draft = moveDraftAction(this.draft, source, target);
        this.changed();
      },
      moveOption: (action, source, target) => {
        if (this.optionQuery.trim()) return;
        this.draft = moveDraftOption(this.draft, action, source, target);
        this.changed();
      },
    });
    this.render();
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.error = "";
    this.render();
    try {
      const [productData, optionSnapshot] = await Promise.all([
        seasoningApi.productRelations(this.input.productId),
        seasoningApi.optionPicker(),
      ]);
      this.product = productData.product;
      this.latestRelations = productData.relations;
      this.draft = createProductConfigurationDraft(productData.relations);
      this.activeAction = this.draft[0]?.action ?? null;
      this.version = productData.version;
      this.options = optionSnapshot.items;
      this.optionCategories = optionSnapshot.categories;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "request_failed";
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private async close(force = false): Promise<void> {
    if (!force && this.dirty) {
      const ok = await openConfirmDialog({
        title: "放弃修改",
        message: t("seasoning.discardConfirm"),
        confirmLabel: "确认放弃",
        danger: true,
      });
      if (!ok) return;
    }
    this.overlay.remove();
  }

  private changed(): void {
    this.dirty = true;
    this.conflict = null;
    this.step = 1;
    this.render();
  }

  private activeGroup() {
    return this.draft.find((group) => group.action === this.activeAction);
  }

  private normalizedBulkPrice(): number | null {
    const value = this.bulkPriceInput.trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
    const price = Number(value);
    return Number.isFinite(price) && price >= 0 ? Math.round((price + Number.EPSILON) * 100) / 100 : null;
  }

  private renderSteps(): string {
    const labels = [t("seasoning.batch.stepConfigure"), t("seasoning.batch.stepPreview")];
    return `<ol class="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1" aria-label="Steps">${labels.map((label, index) => {
      const number = index + 1;
      const active = number === this.step;
      const done = number < this.step;
      return `<li class="flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${active ? "bg-card text-primary shadow-sm" : done ? "text-foreground" : "text-muted-foreground"}"><span class="flex size-5 shrink-0 items-center justify-center rounded-full ${active || done ? "bg-primary text-primary-foreground" : "bg-background"}">${done ? "✓" : number}</span><span class="truncate">${escapeSeasoningHtml(label)}</span></li>`;
    }).join("")}</ol>`;
  }

  private renderProductBand(): string {
    if (!this.product) return "";
    return `<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"><div><strong class="text-sm text-foreground">${escapeSeasoningHtml(this.product.name)}</strong><p class="mt-1 text-xs text-muted-foreground">${escapeSeasoningHtml(this.product.categoryName)} · ${escapeSeasoningHtml(this.product.code)} · ${tf("seasoning.batch.optionCount", { count: String(configuredRelationCount(this.draft)) })}</p></div><span class="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">${t("seasoning.specifiedProduct")}</span></div>`;
  }

  private renderConfiguration(): string {
    return renderSeasoningConfigurationWorkspace({
      draft: this.draft,
      activeAction: this.activeAction,
      actionPickerOpen: this.actionPickerOpen,
      optionPickerOpen: this.optionPickerOpen,
      pendingActions: this.pendingActions,
      pendingOptions: this.pendingOptions,
      selectedPriceOptions: this.selectedPriceOptions,
      bulkPriceInput: this.bulkPriceInput,
      optionQuery: this.optionQuery,
      optionPickerQuery: this.optionPickerQuery,
      activeOptionCategoryId: this.activeOptionCategoryId,
      optionCategories: this.optionCategories,
      options: this.options,
    });
  }

  private renderPreview(): string {
    const optionById = new Map(this.options.map((option) => [option.id, option]));
    return `<div class="space-y-4"><div class="flex items-center justify-between gap-3"><div><h3 class="text-base font-semibold">${t("seasoning.previewCompleteConfig")}</h3><p class="mt-1 text-xs text-muted-foreground">${tf("seasoning.batch.configuredRelationCount", { count: String(configuredRelationCount(this.draft)) })}</p></div></div>${this.conflict ? `<div class="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/25 dark:text-amber-100"><p class="font-semibold">${t("seasoning.conflictReloaded")}</p><div class="mt-3 flex flex-wrap gap-2"><button type="button" data-load-latest class="${secondaryButtonClass}">${t("seasoning.reloadLatest")}</button><button type="button" data-review-overwrite class="${primaryButtonClass}">${t("seasoning.overwriteLatest")}</button></div></div>` : ""}<div class="max-h-[52vh] space-y-3 overflow-y-auto pr-1">${this.draft.map((group) => `<section class="overflow-x-auto rounded-xl border border-border bg-card"><header class="flex min-w-[620px] items-center justify-between bg-muted/35 px-4 py-2.5"><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(group.action)}">${escapeSeasoningHtml(actionLabel(group.action))}</span><span class="text-xs font-semibold text-muted-foreground">${tf("seasoning.batch.optionCount", { count: String(group.options.length) })}</span></header><div class="grid min-w-[620px] grid-cols-[minmax(180px,1fr)_130px_110px_140px] gap-3 border-t border-border bg-muted/15 px-4 py-2 text-xs font-semibold text-muted-foreground"><span>Option</span><span class="text-right">${t("seasoning.batch.inputPrice")}</span><span class="text-right">${t("seasoning.batch.markupCoefficient")}</span><span class="text-right">${t("seasoning.batch.actualMarkupPrice")}</span></div><div class="min-w-[620px] divide-y divide-border">${group.options.map((draft) => `<div class="grid grid-cols-[minmax(180px,1fr)_130px_110px_140px] items-center gap-3 px-4 py-3"><strong class="truncate text-sm">${escapeSeasoningHtml(optionById.get(draft.optionId)?.name ?? draft.optionId)}</strong><span class="text-right text-sm tabular-nums">$${draft.inputPrice.toFixed(2)}</span><span class="text-right text-sm tabular-nums">${draft.markupCoefficient.toFixed(2)}</span><span class="text-right text-sm font-semibold tabular-nums">$${calculateActualMarkupPrice(draft.inputPrice, draft.markupCoefficient).toFixed(2)}</span></div>`).join("")}</div></section>`).join("")}</div></div>`;
  }

  private render(): void {
    const content = this.loading
      ? `<div class="flex min-h-72 items-center justify-center text-sm font-medium text-muted-foreground">${t("seasoning.loading")}</div>`
      : this.error && !this.product
        ? `<div class="flex min-h-72 flex-col items-center justify-center gap-3 text-center"><p class="text-sm font-semibold text-destructive">${escapeSeasoningHtml(this.error)}</p><button type="button" data-retry class="${secondaryButtonClass}">${t("seasoning.retry")}</button></div>`
        : this.step === 1 ? this.renderConfiguration() : this.renderPreview();
    this.overlay.innerHTML = `<section data-seasoning-product-editor role="dialog" aria-modal="true" aria-labelledby="seasoning-product-editor-title" class="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"><header class="border-b border-border px-5 py-4"><div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">${t("seasoning.title")}</p><h2 id="seasoning-product-editor-title" class="mt-1 text-xl font-semibold">${t("seasoning.editProductTitle")}</h2></div><button type="button" data-close class="${secondaryButtonClass}" aria-label="${t("seasoning.close")}">×</button></div><div class="mt-4">${this.renderSteps()}</div></header><div class="min-h-0 flex-1 overflow-y-auto p-5">${this.renderProductBand()}${this.error && this.product ? `<p class="my-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">${escapeSeasoningHtml(this.error)}</p>` : ""}<div class="mt-4">${content}</div></div><footer class="flex items-center justify-between gap-3 border-t border-border bg-muted/25 px-5 py-4"><button type="button" data-back class="${secondaryButtonClass}" ${this.step === 1 || this.loading || this.saving ? "disabled" : ""}>${this.step === 1 ? t("seasoning.cancel") : t("seasoning.back")}</button><button type="button" data-next class="${primaryButtonClass}" ${this.loading || this.saving || !configuredRelationCount(this.draft) || Boolean(this.conflict) ? "disabled" : ""}>${this.step === 1 ? t("seasoning.batch.generatePreview") : t("seasoning.confirmSave")}</button></footer></section>`;
    this.syncBulkControls();
    syncSeasoningOptionCategoryIndeterminate(this.overlay);
  }

  private syncBulkControls(): void {
    const price = this.normalizedBulkPrice();
    const group = this.activeGroup();
    const fillAll = this.overlay.querySelector<HTMLButtonElement>("[data-fill-bulk-price]");
    if (fillAll) fillAll.disabled = price === null || !group?.options.length;
    const fillSelected = this.overlay.querySelector<HTMLButtonElement>("[data-fill-selected-prices]");
    if (fillSelected) fillSelected.disabled = price === null || !this.selectedPriceOptions.size;
    const visibleIds = [...this.overlay.querySelectorAll<HTMLElement>("[data-linked-option-row]:not(.hidden)")].map((row) => String(row.dataset.optionId));
    const selectedVisible = visibleIds.filter((id) => this.selectedPriceOptions.has(id)).length;
    const selectAll = this.overlay.querySelector<HTMLInputElement>("[data-select-visible-price-options]");
    if (selectAll) {
      selectAll.checked = visibleIds.length > 0 && selectedVisible === visibleIds.length;
      selectAll.indeterminate = selectedVisible > 0 && selectedVisible < visibleIds.length;
    }
  }

  private applyBulkPrice(selectedOnly: boolean): void {
    const price = this.normalizedBulkPrice();
    if (price === null || !this.activeAction) return;
    this.draft = this.draft.map((group) => group.action === this.activeAction ? {
      ...group,
      options: group.options.map((option) => !selectedOnly || this.selectedPriceOptions.has(option.optionId) ? { ...option, ...updateBatchInputPrice(option, price) } : option),
    } : group);
    this.changed();
  }

  private async save(): Promise<void> {
    if (this.conflict) return;
    this.saving = true;
    this.error = "";
    this.render();
    try {
      const ordered = assignSeasoningSortOrders(this.draft.flatMap((group) => group.options.map((option) => ({
        action: group.action,
        optionId: option.optionId,
        priceDelta: calculateActualMarkupPrice(option.inputPrice, option.markupCoefficient),
        status: "active" as const,
      }))));
      const result = await seasoningApi.saveProductRelations(this.input.productId, { expectedVersion: this.version, relations: ordered });
      this.version = result.version;
      this.dirty = false;
      await this.input.onSaved(result.version);
      void this.close(true);
    } catch (error) {
      if (error instanceof SeasoningApiError && error.code === "version_conflict") {
        try {
          const latest = await seasoningApi.productRelations(this.input.productId);
          this.conflict = { version: latest.version, relations: latest.relations };
          this.version = latest.version;
          this.error = t("seasoning.conflictReloaded");
        } catch (reloadError) {
          this.error = String(reloadError instanceof Error ? reloadError.message : reloadError);
        }
      } else this.error = String(error instanceof Error ? error.message : error);
    } finally {
      this.saving = false;
      this.render();
    }
  }

  private async handleClick(event: Event): Promise<void> {
    const clicked = event.target as HTMLElement;
    const backdrop = clicked.dataset.pickerBackdrop;
    if (backdrop) {
      if (backdrop === "action") this.actionPickerOpen = false;
      if (backdrop === "option") this.optionPickerOpen = false;
      this.render();
      return;
    }
    const button = clicked.closest<HTMLButtonElement>("button");
    if (!button) return;
    if (button.hasAttribute("data-close")) return void this.close();
    if (button.hasAttribute("data-retry")) return void this.load();
    if (button.hasAttribute("data-back")) {
      if (this.step === 1) void this.close(); else { this.step = 1; this.render(); }
      return;
    }
    if (button.hasAttribute("data-next")) {
      if (this.step === 1) { this.step = 2; this.render(); } else await this.save();
      return;
    }
    if (button.hasAttribute("data-load-latest") && this.conflict) {
      this.latestRelations = this.conflict.relations;
      this.draft = createProductConfigurationDraft(this.conflict.relations);
      this.activeAction = this.draft[0]?.action ?? null;
      this.conflict = null;
      this.error = "";
      this.dirty = false;
      this.step = 1;
      this.render();
      return;
    }
    if (button.hasAttribute("data-review-overwrite") && this.conflict) {
      this.conflict = null;
      this.error = "";
      this.step = 1;
      this.dirty = true;
      this.render();
      return;
    }
    if (button.hasAttribute("data-open-action-picker")) {
      this.pendingActions = new Set(this.draft.map((group) => group.action));
      this.actionPickerOpen = true;
      this.render();
      return;
    }
    if (button.hasAttribute("data-open-option-picker") && this.activeAction) {
      this.pendingOptions = new Set();
      this.optionPickerQuery = "";
      this.activeOptionCategoryId = this.optionCategories.find((category) => this.options.some((option) => option.categoryId === category.id))?.id ?? this.optionCategories[0]?.id ?? null;
      this.optionPickerOpen = true;
      this.render();
      return;
    }
    const closePicker = button.dataset.closePicker;
    if (closePicker) {
      if (closePicker === "action") this.actionPickerOpen = false;
      if (closePicker === "option") this.optionPickerOpen = false;
      this.render();
      return;
    }
    if (button.hasAttribute("data-confirm-actions")) {
      for (const action of this.pendingActions) if (!this.draft.some((group) => group.action === action)) this.draft.push({ action, options: [] });
      this.activeAction ??= this.draft[0]?.action ?? null;
      this.actionPickerOpen = false;
      this.changed();
      return;
    }
    const action = button.dataset.activateAction as SeasoningActionCode | undefined;
    if (action) {
      this.activeAction = action;
      this.optionQuery = "";
      this.selectedPriceOptions.clear();
      this.render();
      return;
    }
    if (button.hasAttribute("data-remove-action") && this.activeAction) {
      const ok = await openConfirmDialog({
        title: "移除动作",
        message: tf("seasoning.batch.removeActionConfirm", { action: actionLabel(this.activeAction) }),
        confirmLabel: "确认移除",
        danger: true,
      });
      if (!ok) return;
      const index = this.draft.findIndex((group) => group.action === this.activeAction);
      this.draft.splice(index, 1);
      this.activeAction = this.draft[Math.min(index, this.draft.length - 1)]?.action ?? null;
      this.changed();
      return;
    }
    if (button.hasAttribute("data-confirm-options") && this.activeAction) {
      const group = this.activeGroup();
      if (!group) return;
      const existing = new Map(group.options.map((option) => [option.optionId, option]));
      group.options = [
        ...group.options,
        ...this.options.filter((option) => this.pendingOptions.has(option.id) && !existing.has(option.id)).map((option) => createConfiguredOption(option.id)),
      ];
      this.optionPickerOpen = false;
      this.changed();
      return;
    }
    const optionCategoryId = button.dataset.activateOptionCategory;
    if (optionCategoryId) {
      this.activeOptionCategoryId = optionCategoryId;
      this.render();
      return;
    }
    const removeOption = button.dataset.removeActionOption;
    if (removeOption && this.activeAction) {
      const group = this.activeGroup();
      if (group) group.options = group.options.filter((option) => option.optionId !== removeOption);
      this.selectedPriceOptions.delete(removeOption);
      this.changed();
      return;
    }
    if (button.hasAttribute("data-fill-bulk-price")) return this.applyBulkPrice(false);
    if (button.hasAttribute("data-fill-selected-prices")) return this.applyBulkPrice(true);
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.hasAttribute("data-bulk-action-price")) {
      this.bulkPriceInput = target.value;
      this.syncBulkControls();
      return;
    }
    if (target.hasAttribute("data-linked-option-query")) {
      this.optionQuery = target.value;
      const query = target.value.trim().toLocaleLowerCase();
      this.overlay.querySelectorAll<HTMLElement>("[data-linked-option-row]").forEach((row) => row.classList.toggle("hidden", !String(row.dataset.searchText).includes(query)));
      this.overlay.querySelectorAll<HTMLButtonElement>("[data-drag-option]").forEach((drag) => { drag.disabled = Boolean(query); });
      this.overlay.querySelector<HTMLElement>("[data-option-reorder-search-hint]")?.classList.toggle("hidden", !query);
      this.syncBulkControls();
      return;
    }
    if (target.hasAttribute("data-option-picker-query")) {
      this.optionPickerQuery = target.value;
      this.render();
      const input = this.overlay.querySelector<HTMLInputElement>("[data-option-picker-query]");
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
      return;
    }
    const optionId = target.dataset.actionOptionPrice;
    const group = this.activeGroup();
    const option = group?.options.find((item) => item.optionId === optionId);
    if (!option) return;
    Object.assign(option, updateBatchInputPrice(option, Math.max(0, Number(target.value) || 0)));
    const actual = this.overlay.querySelector<HTMLElement>(`[data-action-option-actual-price="${CSS.escape(option.optionId)}"]`);
    if (actual) actual.textContent = `$${calculateActualMarkupPrice(option.inputPrice, option.markupCoefficient).toFixed(2)}`;
    this.dirty = true;
  }

  private handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const action = target.dataset.actionPickerOption as SeasoningActionCode | undefined;
    if (action) {
      if (target.checked) this.pendingActions.add(action); else this.pendingActions.delete(action);
      return;
    }
    const pickedOption = target.dataset.optionPickerOption;
    if (pickedOption) {
      if (target.checked) this.pendingOptions.add(pickedOption); else this.pendingOptions.delete(pickedOption);
      this.render();
      return;
    }
    const toggleCategoryId = target.dataset.optionCategoryToggle;
    if (toggleCategoryId && this.activeAction) {
      const query = this.optionPickerQuery.trim().toLocaleLowerCase();
      const category = this.optionCategories.find((item) => item.id === toggleCategoryId);
      const existing = new Set(this.activeGroup()?.options.map((option) => option.optionId) ?? []);
      const visible = this.options.filter((option) => option.categoryId === toggleCategoryId && !existing.has(option.id) && (!query || category?.name.toLocaleLowerCase().includes(query) || `${option.name} ${option.nameEn ?? ""} ${option.code}`.toLocaleLowerCase().includes(query)));
      for (const option of visible) target.checked ? this.pendingOptions.add(option.id) : this.pendingOptions.delete(option.id);
      this.render();
      return;
    }
    const selectedPrice = target.dataset.selectPriceOption;
    if (selectedPrice) {
      if (target.checked) this.selectedPriceOptions.add(selectedPrice); else this.selectedPriceOptions.delete(selectedPrice);
      this.syncBulkControls();
      return;
    }
    if (target.hasAttribute("data-select-visible-price-options")) {
      this.overlay.querySelectorAll<HTMLInputElement>("[data-linked-option-row]:not(.hidden) [data-select-price-option]").forEach((checkbox) => {
        checkbox.checked = target.checked;
        const id = String(checkbox.dataset.selectPriceOption);
        if (target.checked) this.selectedPriceOptions.add(id); else this.selectedPriceOptions.delete(id);
      });
      this.syncBulkControls();
      return;
    }
  }
}

export function openSeasoningProductDrawer(host: HTMLElement, input: DrawerInput): void {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-6";
  host.appendChild(overlay);
  new ProductEditWizardController(overlay, input);
  overlay.querySelector<HTMLElement>("[data-close]")?.focus();
}
