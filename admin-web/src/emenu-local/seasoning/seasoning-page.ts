import { t } from "../../i18n";
import { openSeasoningBatchWizard } from "./seasoning-batch-wizard-ui";
import { seasoningApi, SeasoningApiError } from "./seasoning-api";
import { renderSeasoningOptionLibrary, openSeasoningOptionEditor } from "./seasoning-option-library-ui";
import { renderSeasoningOverviewRows } from "./seasoning-overview-ui";
import { openSeasoningProductDrawer } from "./seasoning-product-drawer-ui";
import { SeasoningStore, type SeasoningStoreState } from "./seasoning-store";
import type { BatchCommitResult, SeasoningActionCode } from "./seasoning-types";
import { escapeSeasoningHtml, inputClass, primaryButtonClass, secondaryButtonClass } from "./seasoning-ui-helpers";

let activeCleanup: (() => void) | null = null;

export function renderSeasoningSettingsPage(): string {
  return `
    <section data-seasoning-settings-page class="flex min-h-[36rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]" aria-labelledby="seasoning-settings-title">
      <header class="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between lg:px-6">
        <div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">eMenu · Local configuration</p><h2 id="seasoning-settings-title" class="mt-1 text-2xl font-semibold tracking-tight text-foreground">${t("seasoning.title")}</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">${t("seasoning.description")}</p></div>
        <div class="flex flex-wrap gap-2"><button type="button" data-seasoning-open-library class="${secondaryButtonClass}">${t("seasoning.publicLibrary")}</button><button type="button" data-seasoning-open-batch class="${primaryButtonClass}">＋ ${t("seasoning.batch.open")}</button></div>
      </header>
      <div data-seasoning-workspace class="min-h-0 flex-1"></div>
      <div data-seasoning-toast class="pointer-events-none fixed bottom-5 right-5 z-[110] hidden max-w-sm rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-xl"></div>
    </section>`;
}

class SeasoningPageController {
  private readonly store = new SeasoningStore();
  private unsubscribe: (() => void) | null = null;
  private queryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly root: HTMLElement) {
    this.unsubscribe = this.store.subscribe((state) => this.render(state));
    this.root.addEventListener("click", (event) => void this.handleClick(event));
    this.root.addEventListener("change", (event) => void this.handleChange(event));
    this.root.addEventListener("input", (event) => this.handleInput(event));
    void this.store.initialize();
  }

  destroy(): void {
    this.unsubscribe?.();
    if (this.queryTimer) clearTimeout(this.queryTimer);
  }

  private showToast(message: string): void {
    const toast = this.root.querySelector<HTMLElement>("[data-seasoning-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    window.setTimeout(() => toast.classList.add("hidden"), 3500);
  }

  private renderFilters(state: SeasoningStoreState): string {
    if (state.tab === "options") {
      return `<div class="flex flex-col gap-2 border-b border-border bg-muted/20 p-4 sm:flex-row"><input data-filter="option-query" class="${inputClass} sm:max-w-sm" placeholder="${t("seasoning.searchOptions")}" value="${escapeSeasoningHtml(state.optionFilters.query)}"><select data-filter="option-status" class="${inputClass} sm:max-w-48"><option value="">${t("seasoning.allStatuses")}</option><option value="active" ${state.optionFilters.status === "active" ? "selected" : ""}>${t("seasoning.statusActive")}</option><option value="inactive" ${state.optionFilters.status === "inactive" ? "selected" : ""}>${t("seasoning.statusInactive")}</option></select>${state.bootstrap?.permissions.canEdit ? `<button type="button" data-seasoning-add-option class="${primaryButtonClass} sm:ml-auto">＋ ${t("seasoning.addOption")}</button>` : ""}</div>`;
    }
    return `<div class="grid gap-2 border-b border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_180px_180px]"><input data-filter="relation-query" class="${inputClass}" placeholder="${t("seasoning.searchRelations")}" value="${escapeSeasoningHtml(state.relationFilters.query)}"><select data-filter="relation-action" class="${inputClass}"><option value="">${t("seasoning.allActions")}</option><option value="ADD" ${state.relationFilters.action === "ADD" ? "selected" : ""}>${t("seasoning.action.add")}</option><option value="LESS" ${state.relationFilters.action === "LESS" ? "selected" : ""}>${t("seasoning.action.less")}</option><option value="MORE" ${state.relationFilters.action === "MORE" ? "selected" : ""}>${t("seasoning.action.more")}</option><option value="NONE" ${state.relationFilters.action === "NONE" ? "selected" : ""}>${t("seasoning.action.none")}</option></select><select data-filter="relation-category" class="${inputClass}"><option value="">${t("seasoning.allCategories")}</option>${(state.bootstrap?.categories ?? []).map((category) => `<option value="${category.id}" ${state.relationFilters.categoryId === category.id ? "selected" : ""}>${escapeSeasoningHtml(category.name)}</option>`).join("")}</select><select data-filter="relation-status" class="${inputClass}"><option value="">${t("seasoning.allStatuses")}</option><option value="active" ${state.relationFilters.status === "active" ? "selected" : ""}>${t("seasoning.statusActive")}</option><option value="mixed" ${state.relationFilters.status === "mixed" ? "selected" : ""}>${t("seasoning.statusMixed")}</option><option value="inactive" ${state.relationFilters.status === "inactive" ? "selected" : ""}>${t("seasoning.statusInactive")}</option></select></div>`;
  }

  private render(state: SeasoningStoreState): void {
    const workspace = this.root.querySelector<HTMLElement>("[data-seasoning-workspace]");
    if (!workspace) return;
    const content = state.error
      ? `<div class="flex min-h-80 flex-col items-center justify-center gap-4 p-6 text-center"><p class="font-semibold text-destructive">${t("seasoning.loadError")}</p><button type="button" data-seasoning-retry class="${secondaryButtonClass}">${t("seasoning.retry")}</button></div>`
      : state.loading && !(state.summaries || state.options)
        ? `<div class="flex min-h-80 items-center justify-center p-6 text-sm font-medium text-muted-foreground">${t("seasoning.loading")}</div>`
        : state.tab === "relations"
          ? renderSeasoningOverviewRows(state.summaries?.items ?? [])
          : renderSeasoningOptionLibrary(state.options?.items ?? [], Boolean(state.bootstrap?.permissions.canEdit));
    const nextCursor = state.tab === "relations" ? state.summaries?.nextCursor : state.options?.nextCursor;
    workspace.innerHTML = `
      <nav class="flex gap-5 border-b border-border px-5" aria-label="Seasoning settings"><button type="button" data-seasoning-tab="relations" class="border-b-2 py-3 text-sm font-semibold ${state.tab === "relations" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}">${t("seasoning.relationsTab")}</button><button type="button" data-seasoning-tab="options" class="border-b-2 py-3 text-sm font-semibold ${state.tab === "options" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}">${t("seasoning.optionsTab")}</button></nav>
      ${this.renderFilters(state)}
      <div class="relative min-h-0">${state.loading ? `<div class="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/10"><div class="h-full w-1/3 animate-pulse bg-primary"></div></div>` : ""}${content}</div>
      ${nextCursor ? `<div class="flex justify-end border-t border-border p-4"><button type="button" data-seasoning-next-cursor="${escapeSeasoningHtml(nextCursor)}" class="${secondaryButtonClass}">${t("seasoning.next")}</button></div>` : ""}`;
  }

  private async afterMutation(version: number): Promise<void> {
    if (this.store.state.bootstrap) this.store.state.bootstrap.version = version;
    await this.store.loadCurrentTab();
  }

  private async handleClick(event: Event): Promise<void> {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!button) return;
    const tab = button.dataset.seasoningTab as "relations" | "options" | undefined;
    if (tab) return void this.store.setTab(tab);
    if (button.hasAttribute("data-seasoning-open-library")) return void this.store.setTab("options");
    if (button.hasAttribute("data-seasoning-retry")) return void this.store.initialize();
    const cursor = button.dataset.seasoningNextCursor;
    if (cursor) return void this.store.loadCurrentTab(cursor);
    if (button.hasAttribute("data-seasoning-open-batch") && this.store.state.bootstrap) {
      openSeasoningBatchWizard(this.root, {
        bootstrap: this.store.state.bootstrap,
        onSaved: async (result) => {
          await this.afterMutation(result.version);
          this.showToast(`已新增 ${result.created} 条，更新 ${result.updated + result.reactivated} 条，跳过 ${result.skipped} 条。`);
        },
      });
      return;
    }
    if (button.hasAttribute("data-seasoning-add-option") && this.store.state.bootstrap) {
      openSeasoningOptionEditor(this.root, { version: this.store.state.bootstrap.version, onSaved: (version) => this.afterMutation(version) });
      return;
    }
    const editOptionId = button.dataset.seasoningEditOption;
    if (editOptionId && this.store.state.bootstrap) {
      const option = this.store.state.options?.items.find((item) => item.id === editOptionId);
      if (option) openSeasoningOptionEditor(this.root, { version: this.store.state.bootstrap.version, option, onSaved: (version) => this.afterMutation(version) });
      return;
    }
    const toggleOptionId = button.dataset.seasoningToggleOption;
    if (toggleOptionId && this.store.state.bootstrap) {
      const status = button.dataset.nextStatus as "active" | "inactive";
      if (status === "inactive" && !window.confirm("停用后，该 Option 将从食客端隐藏。确定继续吗？")) return;
      try {
        const response = await seasoningApi.updateOption(toggleOptionId, { expectedVersion: this.store.state.bootstrap.version, status });
        await this.afterMutation(response.version);
      } catch (error) {
        this.showToast(error instanceof SeasoningApiError && error.code === "version_conflict" ? t("seasoning.versionConflict") : String(error instanceof Error ? error.message : error));
      }
      return;
    }
    if (button.hasAttribute("data-seasoning-view-products")) {
      await this.openRelationProducts(button.dataset.action as SeasoningActionCode, String(button.dataset.optionId));
    }
  }

  private async openRelationProducts(action: SeasoningActionCode, optionId: string): Promise<void> {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]";
    overlay.innerHTML = `<section role="dialog" aria-modal="true" class="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl"><div class="flex items-center justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">${t("seasoning.associationCount")}</p><h2 class="mt-1 text-xl font-semibold">${t("seasoning.loading")}</h2></div><button data-close class="${secondaryButtonClass}">×</button></div><div data-product-list class="mt-4 min-h-48"></div></section>`;
    this.root.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector("[data-close]")?.addEventListener("click", close);
    try {
      const page = await seasoningApi.relationProducts({ action, optionId, limit: 100 });
      const title = overlay.querySelector("h2");
      if (title) title.textContent = `${page.total} ${t("seasoning.associationCount")}`;
      const list = overlay.querySelector<HTMLElement>("[data-product-list]");
      if (list) list.innerHTML = `<div class="divide-y divide-border rounded-xl border border-border">${page.items.map((item) => `<button type="button" data-open-product="${item.product.id}" class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"><span><strong class="block text-sm">${escapeSeasoningHtml(item.product.name)}</strong><span class="text-xs text-muted-foreground">${escapeSeasoningHtml(item.product.categoryName)}</span></span><span class="text-sm font-semibold text-primary">${item.priceDelta ? `+¥${item.priceDelta}` : "¥0"} →</span></button>`).join("")}</div>`;
      overlay.addEventListener("click", (event) => {
        const productButton = (event.target as HTMLElement).closest<HTMLElement>("[data-open-product]");
        const productId = productButton?.dataset.openProduct;
        if (!productId) return;
        close();
        openSeasoningProductDrawer(this.root, { productId, onSaved: (version) => this.afterMutation(version) });
      });
    } catch (error) {
      const list = overlay.querySelector<HTMLElement>("[data-product-list]");
      if (list) list.textContent = String(error instanceof Error ? error.message : error);
    }
  }

  private handleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const filter = target.dataset.filter;
    if (!filter) return;
    if (filter === "relation-action") this.store.state.relationFilters.action = target.value;
    if (filter === "relation-category") this.store.state.relationFilters.categoryId = target.value;
    if (filter === "relation-status") this.store.state.relationFilters.status = target.value;
    if (filter === "option-status") this.store.state.optionFilters.status = target.value;
    void this.store.loadCurrentTab();
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const filter = target.dataset.filter;
    if (filter !== "relation-query" && filter !== "option-query") return;
    if (filter === "relation-query") this.store.state.relationFilters.query = target.value;
    else this.store.state.optionFilters.query = target.value;
    if (this.queryTimer) clearTimeout(this.queryTimer);
    this.queryTimer = setTimeout(() => void this.store.loadCurrentTab(), 280);
  }
}

export function bindSeasoningSettingsPage(): void {
  activeCleanup?.();
  const root = document.querySelector<HTMLElement>("[data-seasoning-settings-page]");
  if (!root) {
    activeCleanup = null;
    return;
  }
  const controller = new SeasoningPageController(root);
  activeCleanup = () => controller.destroy();
}
