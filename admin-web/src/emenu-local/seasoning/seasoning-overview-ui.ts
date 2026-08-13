import { t } from "../../i18n";
import type { SeasoningRelationSummary } from "./seasoning-types";
import { actionLabel, actionTone, escapeSeasoningHtml, formatSeasoningMoney } from "./seasoning-ui-helpers";

function priceSummary(item: SeasoningRelationSummary): string {
  if (item.distinctPriceCount <= 1) return formatSeasoningMoney(item.minPrice);
  return `${formatSeasoningMoney(item.minPrice)}–${formatSeasoningMoney(item.maxPrice)} · ${item.distinctPriceCount}`;
}

export function renderSeasoningOverviewRows(items: SeasoningRelationSummary[]): string {
  if (!items.length) {
    return `<div class="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div class="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-xl">◇</div><p class="font-semibold text-foreground">${t("seasoning.noRelations")}</p></div>`;
  }
  return `
    <div class="hidden overflow-x-auto lg:block">
      <table class="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead class="bg-muted/55 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <tr><th class="px-5 py-3">${t("seasoning.allActions")}</th><th class="px-5 py-3">${t("seasoning.option")}</th><th class="px-5 py-3">${t("seasoning.associationCount")}</th><th class="px-5 py-3">${t("seasoning.price")}</th><th class="px-5 py-3">${t("seasoning.allStatuses")}</th><th class="px-5 py-3"></th></tr>
        </thead>
        <tbody class="divide-y divide-border/80">
          ${items.map((item) => `
            <tr class="transition-colors hover:bg-muted/25">
              <td class="px-5 py-4"><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(item.action)}">${escapeSeasoningHtml(actionLabel(item.action))}</span></td>
              <td class="px-5 py-4"><p class="font-semibold text-foreground">${escapeSeasoningHtml(item.optionName)}</p><p class="mt-0.5 font-mono text-[11px] text-muted-foreground">${escapeSeasoningHtml(item.optionCode)}</p></td>
              <td class="px-5 py-4"><button type="button" data-seasoning-view-products data-action="${item.action}" data-option-id="${escapeSeasoningHtml(item.optionId)}" class="font-semibold text-primary hover:underline">${item.activeProductCount} / ${item.totalProductCount}</button></td>
              <td class="px-5 py-4 font-medium text-foreground">${escapeSeasoningHtml(priceSummary(item))}</td>
              <td class="px-5 py-4 text-muted-foreground">${item.inactiveRelationCount ? t("seasoning.statusMixed") : t("seasoning.statusActive")}</td>
              <td class="px-5 py-4 text-right"><button type="button" data-seasoning-view-products data-action="${item.action}" data-option-id="${escapeSeasoningHtml(item.optionId)}" class="text-sm font-semibold text-primary hover:underline">${t("seasoning.viewProducts")}</button></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="divide-y divide-border lg:hidden">
      ${items.map((item) => `
        <article class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-3"><div><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(item.action)}">${escapeSeasoningHtml(actionLabel(item.action))}</span><h3 class="mt-2 font-semibold text-foreground">${escapeSeasoningHtml(item.optionName)}</h3></div><button type="button" data-seasoning-view-products data-action="${item.action}" data-option-id="${escapeSeasoningHtml(item.optionId)}" class="text-sm font-semibold text-primary">${t("seasoning.viewProducts")}</button></div>
          <div class="grid grid-cols-2 gap-3 text-sm"><div><p class="text-xs text-muted-foreground">${t("seasoning.associationCount")}</p><p class="mt-1 font-semibold">${item.activeProductCount} / ${item.totalProductCount}</p></div><div><p class="text-xs text-muted-foreground">${t("seasoning.price")}</p><p class="mt-1 font-semibold">${escapeSeasoningHtml(priceSummary(item))}</p></div></div>
        </article>`).join("")}
    </div>`;
}
