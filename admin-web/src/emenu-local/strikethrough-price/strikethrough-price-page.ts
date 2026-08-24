import { seasoningApi } from "../seasoning/seasoning-api";
import type { SeasoningMenuDish } from "../seasoning/seasoning-types";
import { discountLabel, formatPrice, parsePriceToCents, validateStrikethroughPrice, type StrikethroughPriceChange } from "./strikethrough-price-domain";
import { StrikethroughPriceStore } from "./strikethrough-price-store";

function esc(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderProductStrikethroughPricePage(): string {
  return `<section data-strike-page class="flex min-h-[36rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
    <header class="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between lg:px-6"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">eMenu</p><h2 class="mt-1 text-2xl font-semibold tracking-tight">商品划线价</h2><p class="mt-2 text-sm text-muted-foreground">维护已经设置划线价的商品，并通过新增流程批量配置。</p></div><button type="button" data-open-strike-wizard class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">＋ 新增商品划线价</button></header>
    <div data-strike-content class="min-h-0 flex-1"></div>
    <div data-strike-toast class="pointer-events-none fixed bottom-5 right-5 z-[120] hidden rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-xl"></div>
  </section>`;
}

class Controller {
  private readonly store = new StrikethroughPriceStore();
  private menuGroups: any[] = [];
  private productById = new Map<string, any>();
  private loading = true;
  private loadError = "";
  private wizardOpen = false;
  private overviewQuery = "";
  private step = 1;
  private activeGroupId = "";
  private activeCategoryId = "";
  private selected = new Set<string>();
  private rowSelected = new Set<string>();
  private drafts = new Map<string, string>();
  private baseline = new Map<string, { cents: number | null; version: number }>();
  private query = "";
  private filter = "all";
  private preview: StrikethroughPriceChange[] = [];

  constructor(private readonly root: HTMLElement) {
    root.addEventListener("click", (event) => this.onClick(event));
    root.addEventListener("change", (event) => this.onChange(event));
    root.addEventListener("input", (event) => this.onInput(event));
    this.render();
    void this.initializeMenu();
  }

  private async initializeMenu(): Promise<void> {
    this.loading = true;
    this.loadError = "";
    this.render();
    try {
      const selection = await seasoningApi.createProductSelection();
      const first = await seasoningApi.menuStructure({ selectionToken: selection.token, limit: 100 });
      const groups: any[] = [];
      for (const groupSummary of first.groups) {
        const groupView = await seasoningApi.menuStructure({ selectionToken: selection.token, groupId: groupSummary.id, limit: 100 });
        const categories: any[] = [];
        for (const categorySummary of groupView.categories) {
          let page = await seasoningApi.menuStructure({ selectionToken: selection.token, groupId: groupSummary.id, categoryId: categorySummary.id, limit: 100 });
          const dishes: SeasoningMenuDish[] = [...page.dishes.items];
          while (page.dishes.nextCursor) {
            page = await seasoningApi.menuStructure({ selectionToken: selection.token, groupId: groupSummary.id, categoryId: categorySummary.id, cursor: page.dishes.nextCursor, limit: 100 });
            dishes.push(...page.dishes.items);
          }
          const productIds: string[] = [];
          for (const dish of dishes) {
            productIds.push(dish.id);
            if (!this.productById.has(dish.id)) {
              const sourceStrikethroughPriceCents = dish.strikethroughPrice == null ? null : Math.round(Number(dish.strikethroughPrice) * 100);
              this.store.hydrate(dish.id, sourceStrikethroughPriceCents);
              const persisted = this.store.get(dish.id);
              this.productById.set(dish.id, {
                ...dish,
                salePriceCents: Math.round(Number(dish.price || 0) * 100),
                sourceStrikethroughPriceCents,
                persisted,
              });
            }
          }
          categories.push({ id: categorySummary.id, name: categorySummary.name, productIds });
        }
        groups.push({ id: groupSummary.id, name: groupSummary.name, categories });
      }
      this.menuGroups = groups;
      this.activeGroupId = groups[0]?.id ?? "";
      this.activeCategoryId = groups[0]?.categories[0]?.id ?? "";
      await seasoningApi.discardProductSelection(selection.token).catch(() => undefined);
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : "无法读取商品菜单";
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private selectable(id: string): boolean {
    const product: any = this.productById.get(id);
    return Boolean(product?.selectable && product?.emenuSellable && product.status === "active" && product.salePriceCents > 0);
  }

  private categoryIds(groupId = this.activeGroupId, categoryId = this.activeCategoryId): string[] {
    const group = this.menuGroups.find((item: any) => item.id === groupId);
    return group?.categories.find((item: any) => item.id === categoryId)?.productIds ?? [];
  }

  private ensureDraft(id: string): void {
    if (this.baseline.has(id)) return;
    const row = this.store.get(id);
    this.baseline.set(id, { ...row });
    this.drafts.set(id, formatPrice(row.cents));
  }

  private toggleIds(ids: string[], checked: boolean): void {
    ids.filter((id) => this.selectable(id)).forEach((id) => {
      if (checked) { this.selected.add(id); this.ensureDraft(id); }
      else { this.selected.delete(id); this.rowSelected.delete(id); }
    });
  }

  private branchState(ids: string[]): { checked: boolean; partial: boolean } {
    const selectableIds = [...new Set(ids.filter((id) => this.selectable(id)))];
    const count = selectableIds.filter((id) => this.selected.has(id)).length;
    return { checked: selectableIds.length > 0 && count === selectableIds.length, partial: count > 0 && count < selectableIds.length };
  }

  private renderSteps(): string {
    return `<div class="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">${["选择商品", "设置价格", "确认保存"].map((label, index) => `<button type="button" data-step="${index + 1}" class="rounded-lg px-3 py-2 text-left text-sm ${this.step === index + 1 ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground"}"><span class="mr-2 text-xs">${index + 1}</span>${label}</button>`).join("")}</div>`;
  }

  private resetWizard(): void {
    this.step = 1;
    this.selected.clear();
    this.rowSelected.clear();
    this.drafts.clear();
    this.baseline.clear();
    this.preview = [];
    this.query = "";
    this.filter = "all";
  }

  private renderOverview(): string {
    const configured = this.store.configuredEntries()
      .map((entry) => ({ ...entry, product: this.productById.get(entry.productId) }))
      .filter((entry) => entry.product)
      .filter((entry) => !this.overviewQuery || entry.product.name.includes(this.overviewQuery) || entry.product.code.toLowerCase().includes(this.overviewQuery.toLowerCase()));
    if (!configured.length && !this.overviewQuery) {
      return `<div class="flex min-h-[28rem] flex-col items-center justify-center px-6 text-center"><div class="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">$</div><h3 class="text-lg font-semibold">暂未设置商品划线价</h3><p class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">新增后，可在这里统一查看、编辑和清除已经设置划线价的商品。</p><button type="button" data-open-strike-wizard class="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">＋ 新增商品划线价</button></div>`;
    }
    return `<div class="flex min-h-0 flex-1 flex-col"><div class="border-b border-border bg-muted/20 p-4"><input data-overview-search class="h-10 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm" placeholder="搜索已设置商品名称 / 编号" value="${esc(this.overviewQuery)}"></div><div class="overflow-x-auto"><table class="w-full min-w-[820px] text-sm"><thead class="bg-muted/30 text-left text-xs text-muted-foreground"><tr><th class="p-3">商品</th><th class="p-3">商品组 / 类</th><th class="p-3">当前售价</th><th class="p-3">划线价</th><th class="p-3">折扣</th><th class="p-3">同步状态</th><th class="p-3">操作</th></tr></thead><tbody>${configured.map((entry) => { const product = entry.product; return `<tr class="border-t border-border"><td class="p-3"><span class="font-medium">${esc(product.name)}</span><span class="block text-xs text-muted-foreground">${esc(product.code)}</span></td><td class="p-3 text-muted-foreground">${esc(product.groupName || "—")} / ${esc(product.categoryName || "—")}</td><td class="p-3">$${formatPrice(product.salePriceCents)}</td><td class="p-3 font-semibold">$${formatPrice(entry.cents)}</td><td class="p-3">${discountLabel(product.salePriceCents, entry.cents)}</td><td class="p-3 text-emerald-600">已同步</td><td class="p-3"><div class="flex gap-3"><button type="button" data-edit-configured="${esc(entry.productId)}" class="text-primary">编辑</button><button type="button" data-clear-configured="${esc(entry.productId)}" class="text-destructive">清除</button></div></td></tr>`; }).join("") || `<tr><td colspan="7" class="p-10 text-center text-muted-foreground">没有匹配的已设置商品</td></tr>`}</tbody></table></div></div>`;
  }

  private renderPicker(): string {
    const group: any = this.menuGroups.find((item: any) => item.id === this.activeGroupId) ?? this.menuGroups[0];
    const ids = this.categoryIds();
    const products: any[] = ids.map((id) => this.productById.get(id)).filter(Boolean).filter((product) => {
      const row = this.store.get(product.id);
      const matchesQuery = !this.query || product.name.includes(this.query) || product.code.toLowerCase().includes(this.query.toLowerCase());
      const matchesFilter = this.filter === "all" || (this.filter === "configured" ? row.cents !== null : row.cents === null);
      return matchesQuery && matchesFilter;
    });
    return `<div class="overflow-hidden rounded-xl border border-border"><div class="flex flex-wrap gap-2 border-b border-border bg-muted/25 p-3"><input data-search class="h-10 min-w-56 flex-1 rounded-lg border border-input bg-background px-3 text-sm" placeholder="搜索商品名称 / 编号" value="${esc(this.query)}"><select data-filter class="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">全部状态</option><option value="configured" ${this.filter === "configured" ? "selected" : ""}>已设置划线价</option><option value="empty" ${this.filter === "empty" ? "selected" : ""}>未设置</option></select></div>
      <div class="grid min-h-80 md:grid-cols-[0.9fr_1fr_1.5fr] md:divide-x divide-border">
        <div class="p-3"><p class="mb-2 text-xs font-semibold text-muted-foreground">商品组</p>${this.menuGroups.map((item: any) => { const state = this.branchState(item.categories.flatMap((c: any) => c.productIds)); return `<div class="flex items-center gap-2 rounded-lg ${item.id === this.activeGroupId ? "bg-primary/10" : ""} p-2"><input type="checkbox" data-toggle-group="${esc(item.id)}" ${state.checked ? "checked" : ""} ${state.partial ? 'data-indeterminate="1" aria-checked="mixed"' : ""}><button type="button" data-group="${esc(item.id)}" class="min-w-0 flex-1 text-left text-sm font-medium">${esc(item.name)}</button></div>`; }).join("")}</div>
        <div class="p-3"><p class="mb-2 text-xs font-semibold text-muted-foreground">商品类</p>${group.categories.map((item: any) => { const state = this.branchState(item.productIds); return `<div class="flex items-center gap-2 rounded-lg ${item.id === this.activeCategoryId ? "bg-primary/10" : ""} p-2"><input type="checkbox" data-toggle-category="${esc(item.id)}" ${state.checked ? "checked" : ""} ${state.partial ? 'data-indeterminate="1" aria-checked="mixed"' : ""}><button type="button" data-category="${esc(item.id)}" class="min-w-0 flex-1 text-left text-sm font-medium">${esc(item.name)}</button></div>`; }).join("")}</div>
        <div class="p-3"><p class="mb-2 text-xs font-semibold text-muted-foreground">商品</p>${products.map((product) => { const row = this.store.get(product.id); const disabled = !this.selectable(product.id); return `<label class="flex items-start gap-3 rounded-lg p-2 ${disabled ? "opacity-50" : "hover:bg-muted/60"}"><input type="checkbox" data-product="${esc(product.id)}" ${this.selected.has(product.id) ? "checked" : ""} ${disabled ? "disabled" : ""}><span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">${esc(product.name)}</span><span class="text-xs text-muted-foreground">${esc(product.code)} · 售价 $${formatPrice(product.salePriceCents)}${row.cents !== null ? ` · 当前划线价 $${formatPrice(row.cents)}` : ""}${disabled ? " · 不可用于 eMenu" : ""}</span></span></label>`; }).join("") || `<p class="p-6 text-center text-sm text-muted-foreground">没有匹配商品</p>`}</div>
      </div></div>`;
  }

  private validation(id: string): string {
    const product: any = this.productById.get(id);
    return validateStrikethroughPrice(this.drafts.get(id) ?? "", product.salePriceCents);
  }

  private renderEditor(): string {
    const ids = [...this.selected];
    return `<div class="overflow-hidden rounded-xl border border-border"><div class="flex flex-wrap items-end gap-2 border-b border-border bg-muted/25 p-3"><label class="text-xs font-medium">批量划线价<input data-batch-price class="mt-1 block h-10 w-44 rounded-lg border border-input bg-background px-3 text-sm" placeholder="0.00"></label><button type="button" data-batch-set class="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">应用到勾选商品</button><button type="button" data-batch-clear class="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium">清除勾选商品</button></div><div class="overflow-x-auto"><table class="w-full min-w-[760px] text-sm"><thead class="bg-muted/30 text-left text-xs text-muted-foreground"><tr><th class="p-3"><input type="checkbox" data-select-all-rows ${ids.length && ids.every((id) => this.rowSelected.has(id)) ? "checked" : ""}></th><th class="p-3">商品</th><th class="p-3">当前售价</th><th class="p-3">当前划线价</th><th class="p-3">新划线价</th><th class="p-3">折扣预览</th><th class="p-3">状态</th><th class="p-3">操作</th></tr></thead><tbody>${ids.map((id) => { const product: any = this.productById.get(id); const base = this.baseline.get(id)!; const draft = this.drafts.get(id) ?? ""; const error = this.validation(id); const cents = parsePriceToCents(draft); return `<tr class="border-t border-border"><td class="p-3"><input type="checkbox" data-row-select="${esc(id)}" ${this.rowSelected.has(id) ? "checked" : ""}></td><td class="p-3"><span class="font-medium">${esc(product.name)}</span><span class="block text-xs text-muted-foreground">${esc(product.code)}</span></td><td class="p-3">$${formatPrice(product.salePriceCents)}</td><td class="p-3">${base.cents === null ? "—" : `$${formatPrice(base.cents)}`}</td><td class="p-3"><input data-row-price="${esc(id)}" class="h-9 w-32 rounded-lg border ${error ? "border-destructive" : "border-input"} bg-background px-2" value="${esc(draft)}" placeholder="清除"></td><td class="p-3">${discountLabel(product.salePriceCents, cents !== null && !Number.isNaN(cents) ? cents : null)}</td><td class="p-3 ${error ? "text-destructive" : "text-muted-foreground"}">${error || "可保存"}</td><td class="p-3"><button type="button" data-restore="${esc(id)}" class="text-primary">恢复原值</button></td></tr>`; }).join("")}</tbody></table></div></div>`;
  }

  private renderPreview(): string {
    const groups = { create: 0, update: 0, clear: 0 };
    this.preview.forEach((item) => groups[item.kind]++);
    return `<div class="overflow-hidden rounded-xl border border-border"><div class="flex flex-wrap gap-3 border-b border-border bg-muted/25 p-4 text-sm"><span>新增 ${groups.create}</span><span>修改 ${groups.update}</span><span>清除 ${groups.clear}</span><strong>共 ${this.preview.length} 项变更</strong></div><div class="overflow-x-auto"><table class="w-full min-w-[650px] text-sm"><thead class="bg-muted/30 text-left text-xs text-muted-foreground"><tr><th class="p-3">商品</th><th class="p-3">当前售价</th><th class="p-3">原划线价</th><th class="p-3">新划线价</th><th class="p-3">变更</th></tr></thead><tbody>${this.preview.map((change) => { const product: any = this.productById.get(change.productId); const labels = { create: "新增", update: "修改", clear: "清除" }; return `<tr class="border-t border-border"><td class="p-3 font-medium">${esc(product.name)}</td><td class="p-3">$${formatPrice(product.salePriceCents)}</td><td class="p-3">${change.originalPriceCents === null ? "—" : `$${formatPrice(change.originalPriceCents)}`}</td><td class="p-3">${change.targetPriceCents === null ? "—" : `$${formatPrice(change.targetPriceCents)}`}</td><td class="p-3">${labels[change.kind]}</td></tr>`; }).join("")}</tbody></table></div></div>`;
  }

  private render(): void {
    const content = this.root.querySelector<HTMLElement>("[data-strike-content]");
    if (!content) return;
    this.root.querySelector("[data-strike-wizard-overlay]")?.remove();
    const overviewBody = this.loading ? `<div class="flex min-h-80 items-center justify-center text-sm text-muted-foreground">正在读取与调味设置相同的商品菜单…</div>` : this.loadError ? `<div class="flex min-h-80 flex-col items-center justify-center gap-3 text-sm text-destructive"><span>${esc(this.loadError)}</span><button type="button" data-retry-menu class="rounded-lg border border-border px-4 py-2 text-foreground">重试</button></div>` : this.renderOverview();
    content.innerHTML = overviewBody;
    if (!this.wizardOpen) {
      return;
    }
    const invalid = [...this.selected].some((id) => Boolean(this.validation(id)));
    const body = this.loading ? `<div class="flex min-h-80 items-center justify-center text-sm text-muted-foreground">正在读取与调味设置相同的商品菜单…</div>` : this.loadError ? `<div class="flex min-h-80 flex-col items-center justify-center gap-3 text-sm text-destructive"><span>${esc(this.loadError)}</span><button type="button" data-retry-menu class="rounded-lg border border-border px-4 py-2 text-foreground">重试</button></div>` : this.step === 1 ? this.renderPicker() : this.step === 2 ? this.renderEditor() : this.renderPreview();
    this.root.insertAdjacentHTML("beforeend", `<div data-strike-wizard-overlay class="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="strike-wizard-title"><section class="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"><header class="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">商品划线价</p><h3 id="strike-wizard-title" class="mt-1 text-xl font-semibold">${this.step === 1 ? "新增商品划线价" : this.step === 2 ? "设置商品划线价" : "确认划线价变更"}</h3></div><button type="button" data-cancel-wizard class="flex size-9 items-center justify-center rounded-lg text-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="关闭">×</button></header><div class="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6"><div class="flex min-h-full flex-col gap-4">${this.renderSteps()}${body}</div></div><footer class="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4"><span class="text-sm text-muted-foreground">已选 ${this.selected.size} 个商品</span><div class="flex flex-wrap justify-end gap-2"><button type="button" data-cancel-wizard class="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium">取消</button>${this.step > 1 ? `<button type="button" data-back class="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium">上一步</button>` : ""}${this.step === 1 ? `<button type="button" data-next class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" ${this.selected.size && !this.loading ? "" : "disabled"}>下一步：设置划线价</button>` : this.step === 2 ? `<button type="button" data-next class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" ${invalid ? "disabled" : ""}>预览变更</button>` : `<button type="button" data-save class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" ${this.preview.length ? "" : "disabled"}>保存并下发 eMenu</button>`}</div></footer></section></div>`);
    this.root.querySelectorAll<HTMLInputElement>('[data-indeterminate="1"]').forEach((checkbox) => { checkbox.indeterminate = true; });
  }

  private toast(message: string): void {
    const node = this.root.querySelector<HTMLElement>("[data-strike-toast]");
    if (!node) return; node.textContent = message; node.classList.remove("hidden"); setTimeout(() => node.classList.add("hidden"), 3200);
  }

  private onClick(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!button) return;
    if (button.hasAttribute("data-open-strike-wizard")) { this.resetWizard(); this.wizardOpen = true; this.render(); return; }
    if (button.hasAttribute("data-cancel-wizard")) { this.resetWizard(); this.wizardOpen = false; this.render(); return; }
    const editId = button.dataset.editConfigured;
    if (editId) { this.resetWizard(); this.selected.add(editId); this.ensureDraft(editId); this.rowSelected.add(editId); this.step = 2; this.wizardOpen = true; this.render(); return; }
    const clearId = button.dataset.clearConfigured;
    if (clearId) {
      const current = this.store.get(clearId);
      try {
        const changes = this.store.preview([{ productId: clearId, expectedVersion: current.version, targetPriceCents: null }]);
        if (changes.length) this.store.commit(changes);
        this.toast("已清除商品划线价并同步 eMenu");
        this.render();
      } catch (error) { this.toast(error instanceof Error ? error.message : "清除失败"); }
      return;
    }
    if (button.hasAttribute("data-retry-menu")) { void this.initializeMenu(); return; }
    if (button.dataset.group) { this.activeGroupId = button.dataset.group; const group: any = this.menuGroups.find((x: any) => x.id === this.activeGroupId); this.activeCategoryId = group?.categories[0]?.id ?? ""; this.render(); return; }
    if (button.dataset.category) { this.activeCategoryId = button.dataset.category; this.render(); return; }
    if (button.dataset.restore) { const base = this.baseline.get(button.dataset.restore); this.drafts.set(button.dataset.restore, formatPrice(base?.cents ?? null)); this.render(); return; }
    if (button.hasAttribute("data-batch-set")) { const input = this.root.querySelector<HTMLInputElement>("[data-batch-price]"); const value = input?.value ?? ""; if (Number.isNaN(parsePriceToCents(value))) { this.toast("请输入有效的批量划线价"); return; } this.rowSelected.forEach((id) => this.drafts.set(id, value)); this.render(); return; }
    if (button.hasAttribute("data-batch-clear")) { this.rowSelected.forEach((id) => this.drafts.set(id, "")); this.render(); return; }
    if (button.hasAttribute("data-back")) { this.step--; this.render(); return; }
    if (button.hasAttribute("data-next")) { if (this.step === 1) { this.rowSelected = new Set(this.selected); this.step = 2; } else { try { this.preview = this.store.preview([...this.selected].map((id) => ({ productId: id, expectedVersion: this.baseline.get(id)!.version, targetPriceCents: parsePriceToCents(this.drafts.get(id) ?? "") }))); this.step = 3; } catch (error) { this.toast(error instanceof Error ? error.message : "预览失败"); } } this.render(); return; }
    if (button.hasAttribute("data-save")) { try { const result = this.store.commit(this.preview); this.toast(`保存成功，已同步 eMenu（批次 ${result.batchId.slice(0, 8)}）`); this.resetWizard(); this.wizardOpen = false; this.render(); } catch (error) { this.toast(error instanceof Error ? error.message : "保存失败"); } }
  }

  private onChange(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.matches("[data-overview-search]")) { this.overviewQuery = target.value; this.render(); return; }
    if (target.matches("[data-filter]")) { this.filter = target.value; this.render(); return; }
    if (target instanceof HTMLInputElement && target.dataset.product) { this.toggleIds([target.dataset.product], target.checked); this.render(); return; }
    if (target instanceof HTMLInputElement && target.dataset.toggleGroup) { const group: any = this.menuGroups.find((x: any) => x.id === target.dataset.toggleGroup); this.toggleIds(group?.categories.flatMap((c: any) => c.productIds) ?? [], target.checked); this.render(); return; }
    if (target instanceof HTMLInputElement && target.dataset.toggleCategory) { this.toggleIds(this.categoryIds(this.activeGroupId, target.dataset.toggleCategory), target.checked); this.render(); return; }
    if (target instanceof HTMLInputElement && target.dataset.rowSelect) { target.checked ? this.rowSelected.add(target.dataset.rowSelect) : this.rowSelected.delete(target.dataset.rowSelect); this.render(); return; }
    if (target instanceof HTMLInputElement && target.hasAttribute("data-select-all-rows")) { this.rowSelected = target.checked ? new Set(this.selected) : new Set(); this.render(); }
  }

  private onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.hasAttribute("data-overview-search")) { this.overviewQuery = target.value; return; }
    if (target.hasAttribute("data-search")) { this.query = target.value; this.render(); return; }
    if (target.dataset.rowPrice) { this.drafts.set(target.dataset.rowPrice, target.value); this.render(); }
  }
}

let active: Controller | null = null;
export function bindProductStrikethroughPricePage(): void {
  const root = document.querySelector<HTMLElement>("[data-strike-page]");
  active = root ? new Controller(root) : null;
  void active;
}
