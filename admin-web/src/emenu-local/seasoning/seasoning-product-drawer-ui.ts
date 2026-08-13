import { t } from "../../i18n";
import { SEASONING_ACTIONS } from "./seasoning-domain";
import { seasoningApi, SeasoningApiError } from "./seasoning-api";
import type { ProductSeasoningRelation, SeasoningActionCode, SeasoningOption, SeasoningProduct } from "./seasoning-types";
import { actionLabel, actionTone, escapeSeasoningHtml, inputClass, primaryButtonClass, secondaryButtonClass } from "./seasoning-ui-helpers";

type DrawerInput = {
  productId: string;
  onSaved: (version: number) => Promise<void> | void;
};

class ProductDrawerController {
  private product: SeasoningProduct | null = null;
  private relations: ProductSeasoningRelation[] = [];
  private options: SeasoningOption[] = [];
  private version = 0;
  private loading = true;
  private error = "";
  private dirty = false;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly input: DrawerInput,
  ) {
    this.overlay.addEventListener("click", (event) => void this.handleClick(event));
    this.overlay.addEventListener("change", (event) => this.handleChange(event));
    this.overlay.addEventListener("input", (event) => this.handleInput(event));
    this.overlay.addEventListener("keydown", (event) => { if (event.key === "Escape") this.close(); });
    this.render();
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [productData, optionPage] = await Promise.all([
        seasoningApi.productRelations(this.input.productId),
        seasoningApi.options({ limit: 100 }),
      ]);
      this.product = productData.product;
      this.relations = productData.relations.map((relation) => ({ ...relation }));
      this.version = productData.version;
      this.options = optionPage.items;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "request_failed";
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private close(force = false): void {
    if (!force && this.dirty && !window.confirm(t("seasoning.discardConfirm"))) return;
    this.overlay.remove();
  }

  private actionRelations(action: SeasoningActionCode): ProductSeasoningRelation[] {
    return this.relations.filter((relation) => relation.action === action).sort((left, right) => left.sortOrder - right.sortOrder || left.optionId.localeCompare(right.optionId));
  }

  private optionName(optionId: string): string {
    return this.options.find((option) => option.id === optionId)?.name ?? optionId;
  }

  private availableOptions(action: SeasoningActionCode): SeasoningOption[] {
    const used = new Set(this.actionRelations(action).map((relation) => relation.optionId));
    return this.options.filter((option) => option.status === "active" && !used.has(option.id));
  }

  private renderAction(action: SeasoningActionCode): string {
    const relations = this.actionRelations(action);
    const available = this.availableOptions(action);
    return `<section class="rounded-2xl border border-border bg-card p-4">
      <div class="flex items-center justify-between gap-3"><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(action)}">${escapeSeasoningHtml(actionLabel(action))}</span><span class="text-xs text-muted-foreground">${relations.length} Option</span></div>
      <div class="mt-3 space-y-2">${relations.length ? relations.map((relation, index) => `
        <article class="rounded-xl border border-border/80 bg-muted/20 p-3" data-relation-id="${relation.id}">
          <div class="flex items-start justify-between gap-3"><div><strong class="text-sm">${escapeSeasoningHtml(this.optionName(relation.optionId))}</strong><p class="mt-0.5 text-[11px] text-muted-foreground">${relation.status === "active" ? t("seasoning.statusActive") : t("seasoning.statusInactive")}</p></div><button type="button" data-remove-relation="${relation.id}" class="text-xs font-semibold text-destructive hover:underline">${t("seasoning.remove")}</button></div>
          <div class="mt-3 grid grid-cols-[1fr_auto] items-end gap-2"><label><span class="mb-1 block text-[11px] text-muted-foreground">${t("seasoning.price")}</span><input data-relation-price="${relation.id}" type="number" min="0" step="0.01" value="${relation.priceDelta}" class="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"></label><label class="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-2 text-xs"><input data-relation-status="${relation.id}" type="checkbox" ${relation.status === "active" ? "checked" : ""}>${t("seasoning.statusActive")}</label></div>
          <div class="mt-2 flex gap-2"><button type="button" data-move-relation="${relation.id}" data-direction="up" class="${secondaryButtonClass}" ${index === 0 ? "disabled" : ""}>↑ ${t("seasoning.moveUp")}</button><button type="button" data-move-relation="${relation.id}" data-direction="down" class="${secondaryButtonClass}" ${index === relations.length - 1 ? "disabled" : ""}>↓ ${t("seasoning.moveDown")}</button></div>
        </article>`).join("") : `<p class="rounded-xl border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">暂无配置</p>`}</div>
      ${available.length ? `<div class="mt-3 flex gap-2"><select data-add-option-select="${action}" class="${inputClass}"><option value="">${t("seasoning.addRelation")}</option>${available.map((option) => `<option value="${option.id}">${escapeSeasoningHtml(option.name)}</option>`).join("")}</select><button type="button" data-add-relation="${action}" class="${secondaryButtonClass}">＋</button></div>` : ""}
    </section>`;
  }

  private render(): void {
    this.overlay.innerHTML = `
      <div data-seasoning-product-drawer class="ml-auto flex h-full w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="seasoning-product-drawer-title">
        <header class="flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">${t("seasoning.productDrawer")}</p><h2 id="seasoning-product-drawer-title" class="mt-1 text-xl font-semibold">${escapeSeasoningHtml(this.product?.name ?? t("seasoning.loading"))}</h2>${this.product ? `<p class="mt-1 text-sm text-muted-foreground">${escapeSeasoningHtml(this.product.categoryName)} · ${escapeSeasoningHtml(this.product.code)}</p>` : ""}</div><button type="button" data-close class="${secondaryButtonClass}" aria-label="${t("seasoning.close")}">×</button></header>
        <div class="min-h-0 flex-1 overflow-y-auto bg-muted/25 p-4 sm:p-5">${this.error ? `<p class="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">${escapeSeasoningHtml(this.error)}</p>` : this.loading ? `<div class="flex min-h-72 items-center justify-center text-sm text-muted-foreground">${t("seasoning.loading")}</div>` : `<div class="grid gap-3 sm:grid-cols-2">${SEASONING_ACTIONS.map((definition) => this.renderAction(definition.code)).join("")}</div>`}</div>
        <footer class="flex justify-end gap-2 border-t border-border bg-card px-5 py-4"><button type="button" data-close class="${secondaryButtonClass}">${t("seasoning.cancel")}</button><button type="button" data-save class="${primaryButtonClass}" ${!this.dirty || this.loading ? "disabled" : ""}>${t("seasoning.save")}</button></footer>
      </div>`;
  }

  private addRelation(action: SeasoningActionCode): void {
    const select = this.overlay.querySelector<HTMLSelectElement>(`[data-add-option-select="${action}"]`);
    const optionId = select?.value;
    if (!optionId) return;
    const actionRelations = this.actionRelations(action);
    const sortOrder = actionRelations.reduce((max, relation) => Math.max(max, relation.sortOrder), 0) + 10;
    const timestamp = new Date().toISOString();
    this.relations.push({ id: `new-${crypto.randomUUID()}`, productId: this.input.productId, action, optionId, priceDelta: 0, sortOrder, status: "active", createdAt: timestamp, updatedAt: timestamp });
    this.dirty = true;
    this.render();
  }

  private moveRelation(relationId: string, direction: "up" | "down"): void {
    const relation = this.relations.find((item) => item.id === relationId);
    if (!relation) return;
    const ordered = this.actionRelations(relation.action);
    const index = ordered.findIndex((item) => item.id === relationId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= ordered.length) return;
    [ordered[index].sortOrder, ordered[swapIndex].sortOrder] = [ordered[swapIndex].sortOrder, ordered[index].sortOrder];
    this.dirty = true;
    this.render();
  }

  private async save(): Promise<void> {
    this.loading = true;
    this.error = "";
    this.render();
    try {
      const normalized = SEASONING_ACTIONS.flatMap(({ code }) => this.actionRelations(code).map((relation, index) => ({ action: relation.action, optionId: relation.optionId, priceDelta: Math.max(0, Number(relation.priceDelta) || 0), sortOrder: (index + 1) * 10, status: relation.status })));
      const result = await seasoningApi.saveProductRelations(this.input.productId, { expectedVersion: this.version, relations: normalized });
      this.version = result.version;
      this.relations = result.relations;
      this.dirty = false;
      await this.input.onSaved(result.version);
      this.close(true);
    } catch (error) {
      this.error = error instanceof SeasoningApiError && error.code === "version_conflict" ? t("seasoning.versionConflict") : String(error instanceof Error ? error.message : error);
      this.loading = false;
      this.render();
    }
  }

  private async handleClick(event: Event): Promise<void> {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!button) return;
    if (button.hasAttribute("data-close")) return this.close();
    if (button.hasAttribute("data-save")) return void this.save();
    const addAction = button.dataset.addRelation as SeasoningActionCode | undefined;
    if (addAction) return this.addRelation(addAction);
    const removeId = button.dataset.removeRelation;
    if (removeId) {
      this.relations = this.relations.filter((relation) => relation.id !== removeId);
      this.dirty = true;
      this.render();
      return;
    }
    const moveId = button.dataset.moveRelation;
    const direction = button.dataset.direction as "up" | "down" | undefined;
    if (moveId && direction) this.moveRelation(moveId, direction);
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const relationId = target.dataset.relationPrice;
    if (!relationId) return;
    const relation = this.relations.find((item) => item.id === relationId);
    if (!relation) return;
    relation.priceDelta = Math.max(0, Number(target.value) || 0);
    this.dirty = true;
    this.overlay.querySelector<HTMLButtonElement>("[data-save]")?.removeAttribute("disabled");
  }

  private handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const relationId = target.dataset.relationStatus;
    if (!relationId) return;
    const relation = this.relations.find((item) => item.id === relationId);
    if (!relation) return;
    relation.status = target.checked ? "active" : "inactive";
    this.dirty = true;
    this.render();
  }
}

export function openSeasoningProductDrawer(host: HTMLElement, input: DrawerInput): void {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[90] bg-slate-950/35 backdrop-blur-[1px]";
  host.appendChild(overlay);
  new ProductDrawerController(overlay, input);
}
