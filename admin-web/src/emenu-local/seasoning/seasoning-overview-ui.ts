import { t, tf } from "../../i18n";
import type { SeasoningRelationProductGroup, SeasoningRelationProductPage } from "./seasoning-types";
import { previewPageItems } from "./seasoning-preview-pagination";
import { actionLabel, actionTone, escapeSeasoningHtml, formatSeasoningMoney, secondaryButtonClass } from "./seasoning-ui-helpers";

function renderActionGroups(product: SeasoningRelationProductGroup): string {
  return product.actions.map((group) => `
    <div data-seasoning-product-action="${group.action}" class="grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] items-start gap-3 py-1.5">
      <span class="inline-flex justify-center rounded-md border px-2 py-1 text-xs font-semibold ${actionTone(group.action)}">${escapeSeasoningHtml(actionLabel(group.action))}</span>
      <div class="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1.5 pt-0.5">
        ${group.items.map((item) => `<span data-seasoning-product-option="${escapeSeasoningHtml(item.optionId)}" class="inline-flex whitespace-nowrap text-sm text-foreground"><span class="font-medium">${escapeSeasoningHtml(item.optionName)}</span><span class="ml-1 text-muted-foreground">（${escapeSeasoningHtml(formatSeasoningMoney(item.priceDelta))}）</span></span>`).join("")}
      </div>
    </div>`).join("");
}

function renderProductRow(item: SeasoningRelationProductGroup, canEdit: boolean): string {
  const productName = escapeSeasoningHtml(item.product.name);
  return `
    <article data-seasoning-product-row="${escapeSeasoningHtml(item.product.id)}" class="grid min-w-0 gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[11.5rem_minmax(0,1fr)_auto] lg:gap-5">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-semibold text-foreground">${productName}</h3>
        <p class="mt-1 text-xs text-muted-foreground">${escapeSeasoningHtml(item.product.categoryName)} · ${escapeSeasoningHtml(item.product.code)} · ${escapeSeasoningHtml(tf("seasoning.batch.optionCount", { count: String(item.visibleRelationCount) }))}</p>
      </div>
      <div class="min-w-0 space-y-0.5">${renderActionGroups(item)}</div>
      ${canEdit ? `<div class="flex items-start justify-end gap-3 lg:min-w-24">
        <button type="button" data-seasoning-edit-product="${escapeSeasoningHtml(item.product.id)}" aria-label="${escapeSeasoningHtml(tf("seasoning.editProductAria", { product: item.product.name }))}" class="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">${t("seasoning.edit")}</button>
        <button type="button" data-seasoning-delete-product="${escapeSeasoningHtml(item.product.id)}" data-product-name="${productName}" aria-label="${escapeSeasoningHtml(tf("seasoning.deleteProductAria", { product: item.product.name }))}" class="text-sm font-semibold text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">${t("seasoning.delete")}</button>
      </div>` : ""}
    </article>`;
}

function renderPagination(page: SeasoningRelationProductPage): string {
  const pages = previewPageItems(page.page, page.totalPages);
  return `
    <div data-seasoning-relation-pagination class="flex flex-col gap-3 border-t border-border bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <label class="flex flex-nowrap items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
        <span>${t("seasoning.perPage")}</span>
        <select data-filter="relation-page-size" class="h-9 w-20 rounded-lg border border-border bg-background px-2 text-sm text-foreground">
          ${([5, 10, 20, 50] as const).map((size) => `<option value="${size}" ${page.pageSize === size ? "selected" : ""}>${size}</option>`).join("")}
        </select>
        <span>${t("seasoning.productsUnit")}</span>
      </label>
      <nav class="flex flex-wrap items-center justify-end gap-1.5" aria-label="${t("seasoning.pagination")}">
        <button type="button" data-seasoning-relation-page="${Math.max(1, page.page - 1)}" class="${secondaryButtonClass} min-h-9 rounded-lg px-3 py-1.5" ${page.page <= 1 || page.totalPages === 0 ? "disabled" : ""}>${t("seasoning.previous")}</button>
        ${pages.map((value, index) => value === null
          ? `<span class="inline-flex size-9 items-center justify-center text-sm text-muted-foreground" aria-hidden="true" data-page-ellipsis="${index}">…</span>`
          : `<button type="button" data-seasoning-relation-page="${value}" aria-current="${value === page.page ? "page" : "false"}" class="inline-flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${value === page.page ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"}">${value}</button>`).join("")}
        <button type="button" data-seasoning-relation-page="${Math.min(Math.max(1, page.totalPages), page.page + 1)}" class="${secondaryButtonClass} min-h-9 rounded-lg px-3 py-1.5" ${page.totalPages === 0 || page.page >= page.totalPages ? "disabled" : ""}>${t("seasoning.nextPage")}</button>
      </nav>
    </div>`;
}

export function renderSeasoningOverview(page: SeasoningRelationProductPage | null, canEdit: boolean, hasFilters: boolean): string {
  const resolved = page ?? { items: [], page: 1, pageSize: 10, totalPages: 0, totalProducts: 0 };
  const content = resolved.items.length
    ? `<div data-seasoning-product-groups class="divide-y divide-border/80">${resolved.items.map((item) => renderProductRow(item, canEdit)).join("")}</div>`
    : `<div class="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center"><div class="flex size-12 items-center justify-center rounded-2xl bg-muted text-xl">◇</div><p class="font-semibold text-foreground">${hasFilters ? t("seasoning.noFilteredRelations") : t("seasoning.noRelations")}</p>${hasFilters ? `<button type="button" data-seasoning-clear-relation-filters class="${secondaryButtonClass}">${t("seasoning.clearFilters")}</button>` : ""}</div>`;
  return `${content}${renderPagination(resolved)}`;
}
