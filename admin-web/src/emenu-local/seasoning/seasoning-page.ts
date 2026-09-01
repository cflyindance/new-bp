import { t, tf } from "../../i18n";
import { openConfirmDialog } from "../../ui/app-confirm-dialog";
import { openSeasoningBatchWizard } from "./seasoning-batch-wizard-ui";
import { seasoningApi, SeasoningApiError } from "./seasoning-api";
import { renderSeasoningOptionLibrary, openSeasoningOptionEditor } from "./seasoning-option-library-ui";
import { openSeasoningOptionCategoryManager } from "./seasoning-option-category-manager-ui";
import { renderSeasoningOverview } from "./seasoning-overview-ui";
import { openSeasoningProductDrawer } from "./seasoning-product-drawer-ui";
import { SeasoningStore, type SeasoningStoreState } from "./seasoning-store";
import type { SeasoningRelationPageSize } from "./seasoning-types";
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
      return `<div class="flex flex-col gap-2 border-b border-border bg-muted/20 p-4 sm:flex-row"><input data-filter="option-query" class="${inputClass} sm:max-w-sm" placeholder="${t("seasoning.searchOptions")}" value="${escapeSeasoningHtml(state.optionFilters.query)}"><select data-filter="option-category" class="${inputClass} sm:max-w-48"><option value="">全部 Option 分类</option>${state.optionCategories.map((category) => `<option value="${escapeSeasoningHtml(category.id)}" ${state.optionFilters.categoryId === category.id ? "selected" : ""}>${escapeSeasoningHtml(category.name)}</option>`).join("")}</select><select data-filter="option-status" class="${inputClass} sm:max-w-48"><option value="">${t("seasoning.allStatuses")}</option><option value="active" ${state.optionFilters.status === "active" ? "selected" : ""}>${t("seasoning.statusActive")}</option><option value="inactive" ${state.optionFilters.status === "inactive" ? "selected" : ""}>${t("seasoning.statusInactive")}</option></select>${state.bootstrap?.permissions.canEdit ? `<button type="button" data-seasoning-manage-option-categories class="${secondaryButtonClass} sm:ml-auto">分类管理</button><button type="button" data-seasoning-add-option class="${primaryButtonClass}">＋ ${t("seasoning.addOption")}</button>` : ""}</div>`;
    }
    return `<div class="grid gap-2 border-b border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_180px_180px]"><input data-filter="relation-query" class="${inputClass}" placeholder="${t("seasoning.searchRelations")}" value="${escapeSeasoningHtml(state.relationFilters.query)}"><select data-filter="relation-action" class="${inputClass}"><option value="">${t("seasoning.allActions")}</option><option value="ADD" ${state.relationFilters.action === "ADD" ? "selected" : ""}>${t("seasoning.action.add")}</option><option value="LESS" ${state.relationFilters.action === "LESS" ? "selected" : ""}>${t("seasoning.action.less")}</option><option value="MORE" ${state.relationFilters.action === "MORE" ? "selected" : ""}>${t("seasoning.action.more")}</option><option value="NONE" ${state.relationFilters.action === "NONE" ? "selected" : ""}>${t("seasoning.action.none")}</option></select><select data-filter="relation-category" class="${inputClass}"><option value="">${t("seasoning.allCategories")}</option>${(state.bootstrap?.categories ?? []).map((category) => `<option value="${category.id}" ${state.relationFilters.categoryId === category.id ? "selected" : ""}>${escapeSeasoningHtml(category.name)}</option>`).join("")}</select><select data-filter="relation-status" class="${inputClass}"><option value="">${t("seasoning.allStatuses")}</option><option value="active" ${state.relationFilters.status === "active" ? "selected" : ""}>${t("seasoning.statusActive")}</option><option value="mixed" ${state.relationFilters.status === "mixed" ? "selected" : ""}>${t("seasoning.statusMixed")}</option><option value="inactive" ${state.relationFilters.status === "inactive" ? "selected" : ""}>${t("seasoning.statusInactive")}</option></select></div>`;
  }

  private render(state: SeasoningStoreState): void {
    const workspace = this.root.querySelector<HTMLElement>("[data-seasoning-workspace]");
    if (!workspace) return;
    const content = state.error
      ? `<div class="flex min-h-80 flex-col items-center justify-center gap-4 p-6 text-center"><p class="font-semibold text-destructive">${escapeSeasoningHtml(state.error || t("seasoning.loadError"))}</p><button type="button" data-seasoning-retry class="${secondaryButtonClass}">${t("seasoning.retry")}</button></div>`
        : state.loading && !(state.productGroups || state.options)
        ? `<div class="flex min-h-80 items-center justify-center p-6 text-sm font-medium text-muted-foreground">${t("seasoning.loading")}</div>`
        : state.tab === "relations"
          ? renderSeasoningOverview(
            state.productGroups,
            Boolean(state.bootstrap?.permissions.canEdit),
            Boolean(state.relationFilters.query || state.relationFilters.action || state.relationFilters.categoryId || state.relationFilters.status),
          )
          : renderSeasoningOptionLibrary(state.options?.items ?? [], Boolean(state.bootstrap?.permissions.canEdit));
    const nextCursor = state.tab === "options" ? state.options?.nextCursor : null;
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
      openSeasoningOptionEditor(this.root, { version: this.store.state.bootstrap.version, categories: this.store.state.optionCategories, onSaved: (version) => this.afterMutation(version) });
      return;
    }
    if (button.hasAttribute("data-seasoning-manage-option-categories") && this.store.state.bootstrap) {
      openSeasoningOptionCategoryManager(this.root, { version: this.store.state.bootstrap.version, categories: this.store.state.optionCategories, onSaved: (version) => this.afterMutation(version) });
      return;
    }
    const editOptionId = button.dataset.seasoningEditOption;
    if (editOptionId && this.store.state.bootstrap) {
      const option = this.store.state.options?.items.find((item) => item.id === editOptionId);
      if (option) openSeasoningOptionEditor(this.root, { version: this.store.state.bootstrap.version, categories: this.store.state.optionCategories, option, onSaved: (version) => this.afterMutation(version) });
      return;
    }
    const toggleOptionId = button.dataset.seasoningToggleOption;
    if (toggleOptionId && this.store.state.bootstrap) {
      const status = button.dataset.nextStatus as "active" | "inactive";
      if (status === "inactive") {
        const ok = await openConfirmDialog({
          title: "停用 Option",
          message: "停用后，该 Option 将从食客端隐藏。确定继续吗？",
          confirmLabel: "确认停用",
          danger: true,
        });
        if (!ok) return;
      }
      try {
        const response = await seasoningApi.updateOption(toggleOptionId, { expectedVersion: this.store.state.bootstrap.version, status });
        await this.afterMutation(response.version);
      } catch (error) {
        this.showToast(error instanceof SeasoningApiError && error.code === "version_conflict" ? t("seasoning.versionConflict") : String(error instanceof Error ? error.message : error));
      }
      return;
    }
    const relationPage = Number(button.dataset.seasoningRelationPage);
    if (Number.isInteger(relationPage) && relationPage > 0) {
      await this.store.loadRelationPage(relationPage);
      return;
    }
    if (button.hasAttribute("data-seasoning-clear-relation-filters")) {
      this.store.state.relationFilters = { query: "", action: "", categoryId: "", status: "" };
      await this.store.loadRelationPage(1);
      return;
    }
    const editProductId = button.dataset.seasoningEditProduct;
    if (editProductId) {
      openSeasoningProductDrawer(this.root, { productId: editProductId, onSaved: (version) => this.afterMutation(version) });
      return;
    }
    const deleteProductId = button.dataset.seasoningDeleteProduct;
    if (deleteProductId && this.store.state.bootstrap) {
      const productName = button.dataset.productName || deleteProductId;
      const ok = await openConfirmDialog({
        title: "删除菜品关联",
        message: tf("seasoning.deleteProductConfirm", { product: productName }),
        confirmLabel: "确认删除",
        danger: true,
      });
      if (!ok) return;
      button.disabled = true;
      try {
        const response = await seasoningApi.saveProductRelations(deleteProductId, { expectedVersion: this.store.state.bootstrap.version, relations: [] });
        await this.afterMutation(response.version);
        this.showToast(tf("seasoning.deleteProductSuccess", { product: productName }));
      } catch (error) {
        button.disabled = false;
        this.showToast(error instanceof SeasoningApiError && error.code === "version_conflict" ? t("seasoning.versionConflict") : String(error instanceof Error ? error.message : error));
      }
    }
  }

  private handleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const filter = target.dataset.filter;
    if (!filter) return;
    if (filter === "relation-action") this.store.state.relationFilters.action = target.value;
    if (filter === "relation-category") this.store.state.relationFilters.categoryId = target.value;
    if (filter === "relation-status") this.store.state.relationFilters.status = target.value;
    if (filter === "relation-page-size") {
      const pageSize = Number(target.value) as SeasoningRelationPageSize;
      if ([5, 10, 20, 50].includes(pageSize)) void this.store.setRelationPageSize(pageSize);
      return;
    }
    if (filter === "option-status") this.store.state.optionFilters.status = target.value;
    if (filter === "option-category") this.store.state.optionFilters.categoryId = target.value;
    if (filter.startsWith("relation-")) void this.store.loadRelationPage(1);
    else void this.store.loadCurrentTab();
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const filter = target.dataset.filter;
    if (filter !== "relation-query" && filter !== "option-query") return;
    if (filter === "relation-query") this.store.state.relationFilters.query = target.value;
    else this.store.state.optionFilters.query = target.value;
    if (this.queryTimer) clearTimeout(this.queryTimer);
    this.queryTimer = setTimeout(() => {
      if (filter === "relation-query") void this.store.loadRelationPage(1);
      else void this.store.loadCurrentTab();
    }, 280);
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
