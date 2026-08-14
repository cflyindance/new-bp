import { t, tf } from "../../i18n";
import { SEASONING_ACTIONS } from "./seasoning-domain";
import { calculateActualMarkupPrice, createBatchOptionPricing, type BatchOptionPricingDraft } from "./seasoning-batch-pricing";
import { moveOrderedItem, seasoningActionOrder, sortSeasoningProductRelations } from "./seasoning-relation-order";
import type { ProductSeasoningRelation, SeasoningActionCode, SeasoningOption, SeasoningOptionCategory, SeasoningStatus } from "./seasoning-types";
import { actionLabel, actionTone, escapeSeasoningHtml, inputClass, primaryButtonClass, secondaryButtonClass } from "./seasoning-ui-helpers";

export type SeasoningConfiguredOption = BatchOptionPricingDraft & {
  optionId: string;
  relationId?: string;
  status?: SeasoningStatus;
};

export type SeasoningConfigurationDraft = Array<{
  action: SeasoningActionCode;
  options: SeasoningConfiguredOption[];
}>;

export type SeasoningWorkspaceMode = "batch" | "product";

export type SeasoningWorkspaceView = {
  draft: SeasoningConfigurationDraft;
  activeAction: SeasoningActionCode | null;
  actionPickerOpen: boolean;
  optionPickerOpen: boolean;
  pendingActions: Set<SeasoningActionCode>;
  pendingOptions: Set<string>;
  selectedPriceOptions: Set<string>;
  bulkPriceInput: string;
  optionQuery: string;
  optionPickerQuery: string;
  activeOptionCategoryId: string | null;
  optionCategories: SeasoningOptionCategory[];
  options: SeasoningOption[];
  mode: SeasoningWorkspaceMode;
};

export function createProductConfigurationDraft(relations: ProductSeasoningRelation[]): SeasoningConfigurationDraft {
  const ordered = sortSeasoningProductRelations(relations);
  return seasoningActionOrder(relations).map((action) => ({
    action,
    options: ordered.filter((relation) => relation.action === action).map((relation) => ({
      optionId: relation.optionId,
      relationId: relation.id,
      inputPrice: relation.priceDelta,
      markupCoefficient: 1,
      status: relation.status,
    })),
  }));
}

export function createConfiguredOption(optionId: string, mode: SeasoningWorkspaceMode): SeasoningConfiguredOption {
  return { optionId, ...createBatchOptionPricing(), ...(mode === "product" ? { status: "active" as const } : {}) };
}

export function configuredRelationCount(draft: SeasoningConfigurationDraft): number {
  return draft.reduce((total, group) => total + group.options.length, 0);
}

export function moveDraftAction(draft: SeasoningConfigurationDraft, action: SeasoningActionCode, target: SeasoningActionCode): SeasoningConfigurationDraft {
  const from = draft.findIndex((group) => group.action === action);
  const to = draft.findIndex((group) => group.action === target);
  return moveOrderedItem(draft, from, to);
}

export function moveDraftOption(draft: SeasoningConfigurationDraft, action: SeasoningActionCode, optionId: string, targetOptionId: string): SeasoningConfigurationDraft {
  return draft.map((group) => {
    if (group.action !== action) return group;
    const from = group.options.findIndex((option) => option.optionId === optionId);
    const to = group.options.findIndex((option) => option.optionId === targetOptionId);
    return { ...group, options: moveOrderedItem(group.options, from, to) };
  });
}

function actionDescription(action: SeasoningActionCode): string {
  if (action === "ADD") return t("seasoning.batch.actionAddHint");
  if (action === "LESS") return t("seasoning.batch.actionLessHint");
  if (action === "MORE") return t("seasoning.batch.actionMoreHint");
  return t("seasoning.batch.actionNoneHint");
}

function renderActionPicker(view: SeasoningWorkspaceView): string {
  if (!view.actionPickerOpen) return "";
  return `<div class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" data-picker-backdrop="action"><section role="dialog" aria-modal="true" aria-labelledby="seasoning-action-picker-title" class="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl"><div class="flex items-start justify-between gap-4"><div><h3 id="seasoning-action-picker-title" class="text-lg font-semibold">${t("seasoning.batch.addAction")}</h3><p class="mt-1 text-sm text-muted-foreground">${t("seasoning.batch.addActionHint")}</p></div><button type="button" data-close-picker="action" class="${secondaryButtonClass}" aria-label="${t("seasoning.close")}">×</button></div><div class="mt-5 grid gap-3 sm:grid-cols-2">${SEASONING_ACTIONS.map((definition) => {
    const existing = view.draft.some((group) => group.action === definition.code);
    const checked = existing || view.pendingActions.has(definition.code);
    return `<label class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${checked ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"} ${existing ? "opacity-70" : ""}"><input type="checkbox" data-action-picker-option="${definition.code}" ${checked ? "checked" : ""} ${existing ? "disabled" : ""} class="mt-1 size-4 rounded border-border text-primary"><span><strong class="inline-flex rounded-full border px-2.5 py-1 text-xs ${actionTone(definition.code)}">${escapeSeasoningHtml(actionLabel(definition.code))}</strong><span class="mt-2 block text-sm text-muted-foreground">${escapeSeasoningHtml(actionDescription(definition.code))}</span>${existing ? `<span class="mt-1 block text-xs font-semibold text-primary">${t("seasoning.batch.actionAdded")}</span>` : ""}</span></label>`;
  }).join("")}</div><div class="mt-6 flex justify-end gap-2"><button type="button" data-close-picker="action" class="${secondaryButtonClass}">${t("seasoning.cancel")}</button><button type="button" data-confirm-actions class="${primaryButtonClass}">${t("seasoning.batch.confirmAdd")}</button></div></section></div>`;
}

function renderOptionPicker(view: SeasoningWorkspaceView): string {
  if (!view.optionPickerOpen || !view.activeAction) return "";
  const existing = new Set(view.draft.find((group) => group.action === view.activeAction)?.options.map((option) => option.optionId) ?? []);
  const query = view.optionPickerQuery.trim().toLocaleLowerCase();
  const optionsByCategory = new Map<string, SeasoningOption[]>();
  for (const category of view.optionCategories) {
    const categoryMatch = query && category.name.toLocaleLowerCase().includes(query);
    const matches = view.options.filter((option) => option.categoryId === category.id && (!query || categoryMatch || `${option.name} ${option.nameEn ?? ""} ${option.code}`.toLocaleLowerCase().includes(query)));
    if (matches.length || !query) optionsByCategory.set(category.id, matches);
  }
  const visibleCategories = view.optionCategories.filter((category) => optionsByCategory.has(category.id));
  const activeCategoryId = visibleCategories.some((category) => category.id === view.activeOptionCategoryId) ? view.activeOptionCategoryId : visibleCategories[0]?.id ?? null;
  const activeOptions = activeCategoryId ? optionsByCategory.get(activeCategoryId) ?? [] : [];
  const categoryRows = visibleCategories.map((category) => {
    const available = (optionsByCategory.get(category.id) ?? []).filter((option) => !existing.has(option.id));
    const selected = available.filter((option) => view.pendingOptions.has(option.id)).length;
    const checked = available.length > 0 && selected === available.length;
    const partial = selected > 0 && !checked;
    return `<div class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${category.id === activeCategoryId ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/55"}"><input type="checkbox" data-option-category-toggle="${escapeSeasoningHtml(category.id)}" ${checked ? "checked" : ""} ${partial ? 'data-option-category-indeterminate="1" aria-checked="mixed"' : ""} ${available.length ? "" : "disabled"} class="size-4 shrink-0 accent-primary" aria-label="选择${escapeSeasoningHtml(category.name)}下全部可用 Option"><button type="button" data-activate-option-category="${escapeSeasoningHtml(category.id)}" class="flex min-w-0 flex-1 items-center gap-2 text-left" aria-current="${category.id === activeCategoryId ? "true" : "false"}"><span class="min-w-0 flex-1 truncate text-sm font-medium">${escapeSeasoningHtml(category.name)}</span><span class="shrink-0 rounded-md bg-background/80 px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">${selected}/${available.length}</span><span class="text-xs text-muted-foreground">›</span></button></div>`;
  }).join("");
  const optionRows = activeOptions.map((option) => {
    const already = existing.has(option.id);
    const checked = already || view.pendingOptions.has(option.id);
    return `<label data-option-picker-card class="flex items-start gap-3 rounded-lg px-3 py-2.5 transition ${checked ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/55"} ${already ? "cursor-not-allowed opacity-65" : "cursor-pointer"}"><input type="checkbox" data-option-picker-option="${escapeSeasoningHtml(option.id)}" ${checked ? "checked" : ""} ${already ? "disabled" : ""} class="mt-0.5 size-4 shrink-0 accent-primary"><span class="min-w-0 flex-1"><strong class="block truncate text-sm font-medium">${escapeSeasoningHtml(option.name)}</strong><span class="mt-0.5 block font-mono text-[10px] tracking-wide text-muted-foreground">${escapeSeasoningHtml(option.code)}</span>${already ? `<span class="mt-1 block text-[11px] font-medium text-primary">已在当前动作中</span>` : ""}</span></label>`;
  }).join("");
  return `<div class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" data-picker-backdrop="option"><section role="dialog" aria-modal="true" aria-labelledby="seasoning-option-picker-title" class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"><header class="border-b border-border px-5 py-4"><div class="flex items-start justify-between gap-4"><div><h3 id="seasoning-option-picker-title" class="text-lg font-semibold">${t("seasoning.batch.addOptionToAction")}</h3><p class="mt-1 text-sm text-muted-foreground">${tf("seasoning.batch.optionPickerHint", { action: actionLabel(view.activeAction) })}</p></div><button type="button" data-close-picker="option" class="${secondaryButtonClass}" aria-label="${t("seasoning.close")}">×</button></div><div class="mt-4 flex items-center gap-3"><input data-option-picker-query class="${inputClass} flex-1" placeholder="搜索分类、Option 名称或编码" value="${escapeSeasoningHtml(view.optionPickerQuery)}"><span data-picked-option-count class="shrink-0 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">${tf("seasoning.batch.selectedOptionCount", { count: String(view.pendingOptions.size) })}</span></div></header><div class="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[280px_minmax(0,1fr)] md:divide-x md:divide-border"><section class="flex max-h-44 min-h-0 flex-col border-b border-border md:max-h-none md:border-b-0"><header class="bg-muted/35 px-4 py-2.5"><strong class="text-xs tracking-wide">类</strong><p class="mt-0.5 text-[11px] text-muted-foreground">选择公共调味分类</p></header><div role="listbox" aria-label="Option 分类" class="min-h-0 flex-1 space-y-1 overflow-auto p-2">${categoryRows || `<p class="px-4 py-10 text-center text-sm text-muted-foreground">没有匹配的分类</p>`}</div></section><section class="flex min-h-0 flex-col"><header class="bg-muted/35 px-4 py-2.5"><strong class="text-xs tracking-wide">Option</strong><p class="mt-0.5 text-[11px] text-muted-foreground">勾选当前动作需要的 Option</p></header><div class="min-h-48 flex-1 space-y-1 overflow-y-auto p-2">${optionRows || `<p class="px-4 py-16 text-center text-sm text-muted-foreground">${query ? "没有匹配的 Option" : "当前分类暂无 Option"}</p>`}</div></section></div><footer class="flex items-center justify-between gap-3 border-t border-border px-5 py-4"><p data-option-picker-live class="sr-only" aria-live="polite"></p><button type="button" data-close-picker="option" class="${secondaryButtonClass}">${t("seasoning.cancel")}</button><button type="button" data-confirm-options class="${primaryButtonClass}" ${view.pendingOptions.size ? "" : "disabled"}>确认添加（${view.pendingOptions.size}）</button></footer></section></div>`;
}

export function syncSeasoningOptionCategoryIndeterminate(root: ParentNode): void {
  const apply = () => root.querySelectorAll<HTMLInputElement>('[data-option-category-indeterminate="1"]').forEach((checkbox) => { checkbox.indeterminate = true; checkbox.setAttribute("aria-checked", "mixed"); });
  apply();
  requestAnimationFrame(apply);
}

export function renderSeasoningConfigurationWorkspace(view: SeasoningWorkspaceView): string {
  const activeGroup = view.draft.find((group) => group.action === view.activeAction);
  const optionsById = new Map(view.options.map((option) => [option.id, option]));
  const linkedOptions = activeGroup?.options.map((draft) => ({ draft, option: optionsById.get(draft.optionId) })).filter((entry) => entry.option) ?? [];
  const queryActive = Boolean(view.optionQuery.trim());
  const columns = view.mode === "product"
    ? "grid-cols-[28px_36px_minmax(140px,1fr)_130px_110px_140px_92px_44px]"
    : "grid-cols-[28px_36px_minmax(140px,1fr)_130px_110px_140px_44px]";
  const actionCards = view.draft.map((group) => `<div data-action-drag-row="${group.action}" class="group grid grid-cols-[28px_minmax(0,1fr)] items-center gap-1 rounded-xl border px-1 py-1 transition ${view.activeAction === group.action ? "border-primary/50 bg-primary/5 ring-2 ring-primary/10" : "border-transparent hover:border-border hover:bg-muted/35"}"><button type="button" data-drag-action="${group.action}" aria-label="${tf("seasoning.reorderAction", { action: actionLabel(group.action) })}" class="flex h-full min-h-12 touch-none cursor-grab items-center justify-center rounded-lg text-lg text-muted-foreground hover:bg-muted active:cursor-grabbing">⠿</button><button type="button" data-activate-action="${group.action}" class="min-w-0 px-2 py-2 text-left"><span class="flex items-center justify-between gap-2"><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(group.action)}">${escapeSeasoningHtml(actionLabel(group.action))}</span><span class="text-xs font-semibold text-muted-foreground">${tf("seasoning.batch.optionCount", { count: String(group.options.length) })}</span></span><span class="mt-2 block truncate text-xs text-muted-foreground">${escapeSeasoningHtml(actionDescription(group.action))}</span></button></div>`).join("");
  return `<div class="grid min-h-[430px] overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[270px_minmax(0,1fr)]"><aside class="flex flex-col border-b border-border bg-muted/20 p-4 lg:border-b-0 lg:border-r"><div class="flex items-center justify-between gap-3"><div><h3 class="text-sm font-semibold">${t("seasoning.batch.actions")}</h3><p class="mt-1 text-xs text-muted-foreground">${view.draft.length ? tf("seasoning.batch.actionCount", { count: String(view.draft.length) }) : t("seasoning.batch.noActions")}</p></div><button type="button" data-open-action-picker class="${primaryButtonClass} !min-h-9 !px-3 text-xs">＋ ${t("seasoning.batch.addAction")}</button></div>${actionCards ? `<div class="mt-4 space-y-2" data-action-drag-list>${actionCards}</div>` : ""}</aside><section class="min-w-0 p-5">${activeGroup && view.activeAction ? `<div class="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4"><div class="flex items-center gap-2"><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${actionTone(view.activeAction)}">${escapeSeasoningHtml(actionLabel(view.activeAction))}</span><span class="text-xs text-muted-foreground">${t("seasoning.batch.currentAction")}</span></div><div class="flex gap-2"><button type="button" data-remove-action class="${secondaryButtonClass} text-destructive">${t("seasoning.batch.removeAction")}</button><button type="button" data-open-option-picker class="${primaryButtonClass}">＋ ${t("seasoning.batch.addOptionToAction")}</button></div></div><div class="mt-4 flex flex-wrap items-center gap-3"><input data-linked-option-query class="${inputClass} min-w-52 flex-1" placeholder="${t("seasoning.searchOptions")}" value="${escapeSeasoningHtml(view.optionQuery)}"><span class="shrink-0 text-sm text-muted-foreground">${tf("seasoning.batch.optionCount", { count: String(activeGroup.options.length) })}</span><div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/25 p-1 pl-3"><label class="text-xs font-semibold text-muted-foreground">${t("seasoning.batch.bulkPrice")}</label><span class="text-sm text-muted-foreground">$</span><input type="number" min="0" step="0.01" inputmode="decimal" data-bulk-action-price value="${escapeSeasoningHtml(view.bulkPriceInput)}" placeholder="0.00" class="h-8 w-20 rounded-md border border-border bg-background px-2 text-right text-sm"><button type="button" data-fill-selected-prices class="${secondaryButtonClass} !min-h-8 !px-3 text-xs"><span data-selected-price-count>${tf("seasoning.batch.updateSelectedPrices", { count: String(view.selectedPriceOptions.size) })}</span></button><button type="button" data-fill-bulk-price class="${secondaryButtonClass} !min-h-8 !px-3 text-xs">${t("seasoning.batch.fillAllPrices")}</button></div></div><p data-option-reorder-search-hint class="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 ${queryActive ? "" : "hidden"}">${t("seasoning.clearSearchToReorder")}</p><div class="mt-3 overflow-x-auto rounded-xl border border-border"><div class="min-w-[780px]"><div class="grid ${columns} items-center gap-3 bg-muted/45 px-4 py-3 text-xs font-semibold text-muted-foreground"><span></span><input type="checkbox" data-select-visible-price-options class="size-4 rounded border-border text-primary" aria-label="${t("seasoning.batch.selectVisibleOptions")}"><span>${t("seasoning.option")}</span><span>${t("seasoning.batch.inputPrice")}</span><span>${t("seasoning.batch.markupCoefficient")}</span><span>${t("seasoning.batch.actualMarkupPrice")}</span>${view.mode === "product" ? `<span>${t("seasoning.status")}</span>` : ""}<span></span></div><div data-linked-option-list>${linkedOptions.map(({ option, draft }) => {
    if (!option) return "";
    const actual = calculateActualMarkupPrice(draft.inputPrice, draft.markupCoefficient);
    const hidden = queryActive && !`${option.name} ${option.code}`.toLocaleLowerCase().includes(view.optionQuery.trim().toLocaleLowerCase());
    return `<div data-linked-option-row data-option-id="${escapeSeasoningHtml(option.id)}" data-option-drag-row="${escapeSeasoningHtml(option.id)}" data-search-text="${escapeSeasoningHtml(`${option.name} ${option.code}`.toLocaleLowerCase())}" class="grid ${columns} items-center gap-3 border-t border-border px-4 py-3 ${hidden ? "hidden" : ""}"><button type="button" data-drag-option="${escapeSeasoningHtml(option.id)}" data-action="${view.activeAction}" aria-label="${tf("seasoning.reorderOption", { option: option.name })}" class="touch-none cursor-grab rounded-md text-lg text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35" ${queryActive ? "disabled" : ""}>⠿</button><input type="checkbox" data-select-price-option="${escapeSeasoningHtml(option.id)}" ${view.selectedPriceOptions.has(option.id) ? "checked" : ""} class="size-4 rounded border-border text-primary" aria-label="${tf("seasoning.batch.selectOptionForPrice", { option: option.name })}"><strong class="min-w-0 truncate text-sm">${escapeSeasoningHtml(option.name)}</strong><label class="flex items-center gap-2"><span class="text-sm text-muted-foreground">$</span><input type="number" min="0" step="0.01" inputmode="decimal" data-action-option-price="${escapeSeasoningHtml(option.id)}" value="${draft.inputPrice}" class="h-9 w-24 rounded-lg border border-border bg-background px-2 text-right text-sm"></label><span class="inline-flex w-fit items-center rounded-full border border-border bg-muted/35 px-2.5 py-1 text-xs font-semibold">${draft.markupCoefficient.toFixed(2)}</span><span data-action-option-actual-price="${escapeSeasoningHtml(option.id)}" class="font-semibold tabular-nums">$${actual.toFixed(2)}</span>${view.mode === "product" ? `<label class="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground"><input type="checkbox" data-action-option-status="${escapeSeasoningHtml(option.id)}" ${draft.status !== "inactive" ? "checked" : ""} class="size-4 rounded border-border text-primary">${draft.status !== "inactive" ? t("seasoning.statusActive") : t("seasoning.statusInactive")}</label>` : ""}<button type="button" data-remove-action-option="${escapeSeasoningHtml(option.id)}" class="rounded-lg text-lg text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="${t("seasoning.remove")}">×</button></div>`;
  }).join("")}</div></div>${activeGroup.options.length ? "" : `<div class="flex min-h-48 flex-col items-center justify-center border-t border-border px-4 text-center"><p class="text-sm font-semibold">${t("seasoning.batch.optionEmptyTitle")}</p><button type="button" data-open-option-picker class="${secondaryButtonClass} mt-3">${t("seasoning.batch.addOptionToAction")}</button></div>`}</div>` : `<div class="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 px-6 text-center"><span class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary">＋</span><h3 class="mt-4 text-base font-semibold">${t("seasoning.batch.actionEmptyTitle")}</h3><p class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">${t("seasoning.batch.actionEmptyDescription")}</p><button type="button" data-open-action-picker class="${primaryButtonClass} mt-5">${t("seasoning.batch.addAction")}</button></div>`}</section></div>${renderActionPicker(view)}${renderOptionPicker(view)}<p data-seasoning-reorder-live class="sr-only" aria-live="polite"></p>`;
}

type ReorderCallbacks = {
  moveAction: (source: SeasoningActionCode, target: SeasoningActionCode) => void;
  moveOption: (action: SeasoningActionCode, source: string, target: string) => void;
};

export function installSeasoningWorkspaceReorder(root: HTMLElement, callbacks: ReorderCallbacks): () => void {
  let drag: { kind: "action" | "option"; action: SeasoningActionCode; id: string; pointerId: number } | null = null;
  const announce = (message: string) => { const live = root.querySelector<HTMLElement>("[data-seasoning-reorder-live]"); if (live) live.textContent = message; };
  const pointerDown = (event: PointerEvent) => {
    const handle = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-drag-action],[data-drag-option]");
    if (!handle || handle.disabled || event.button !== 0) return;
    const action = (handle.dataset.dragAction ?? handle.dataset.action) as SeasoningActionCode;
    const optionId = handle.dataset.dragOption;
    drag = { kind: optionId ? "option" : "action", action, id: optionId ?? action, pointerId: event.pointerId };
    handle.setPointerCapture?.(event.pointerId);
    handle.closest<HTMLElement>(optionId ? "[data-option-drag-row]" : "[data-action-drag-row]")?.classList.add("opacity-55", "ring-2", "ring-primary/30");
    event.preventDefault();
  };
  const pointerUp = (event: PointerEvent) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    if (drag.kind === "action") {
      const row = target?.closest<HTMLElement>("[data-action-drag-row]");
      const targetAction = row?.dataset.actionDragRow as SeasoningActionCode | undefined;
      if (targetAction && targetAction !== drag.action) callbacks.moveAction(drag.action, targetAction);
    } else {
      const row = target?.closest<HTMLElement>("[data-option-drag-row]");
      const targetOption = row?.dataset.optionDragRow;
      if (targetOption && targetOption !== drag.id) callbacks.moveOption(drag.action, drag.id, targetOption);
    }
    root.querySelectorAll(".opacity-55.ring-2").forEach((node) => node.classList.remove("opacity-55", "ring-2", "ring-primary/30"));
    drag = null;
  };
  const keyDown = (event: KeyboardEvent) => {
    if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    const handle = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-drag-action],[data-drag-option]");
    if (!handle || handle.disabled) return;
    const rows = [...root.querySelectorAll<HTMLElement>(handle.dataset.dragOption ? "[data-option-drag-row]:not(.hidden)" : "[data-action-drag-row]")];
    const row = handle.closest<HTMLElement>(handle.dataset.dragOption ? "[data-option-drag-row]" : "[data-action-drag-row]");
    const index = row ? rows.indexOf(row) : -1;
    const target = rows[index + (event.key === "ArrowUp" ? -1 : 1)];
    if (!target) return;
    if (handle.dataset.dragOption) callbacks.moveOption(handle.dataset.action as SeasoningActionCode, handle.dataset.dragOption, String(target.dataset.optionDragRow));
    else callbacks.moveAction(handle.dataset.dragAction as SeasoningActionCode, target.dataset.actionDragRow as SeasoningActionCode);
    announce(t("seasoning.reorderComplete"));
    event.preventDefault();
  };
  root.addEventListener("pointerdown", pointerDown);
  root.addEventListener("pointerup", pointerUp);
  root.addEventListener("pointercancel", pointerUp);
  root.addEventListener("keydown", keyDown);
  return () => {
    root.removeEventListener("pointerdown", pointerDown);
    root.removeEventListener("pointerup", pointerUp);
    root.removeEventListener("pointercancel", pointerUp);
    root.removeEventListener("keydown", keyDown);
  };
}
