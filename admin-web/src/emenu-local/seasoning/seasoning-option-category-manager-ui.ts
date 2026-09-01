import { seasoningApi, SeasoningApiError } from "./seasoning-api";
import type { SeasoningOptionCategory } from "./seasoning-types";
import { escapeSeasoningHtml, primaryButtonClass, secondaryButtonClass } from "./seasoning-ui-helpers";
import { showAppToast } from "../../ui/app-toast";
import { openConfirmDialog } from "../../ui/app-confirm-dialog";
import { openPromptDialog } from "../../ui/app-prompt-dialog";

export function openSeasoningOptionCategoryManager(
  host: HTMLElement,
  input: { version: number; categories: SeasoningOptionCategory[]; onSaved: (version: number) => Promise<void> | void },
): void {
  let version = input.version;
  let categories = [...input.categories];
  let dragged = "";
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]";

  const render = () => {
    overlay.innerHTML = `<section data-option-category-manager role="dialog" aria-modal="true" aria-labelledby="option-category-manager-title" class="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"><header class="flex items-start justify-between gap-4 border-b border-border px-5 py-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">PUBLIC OPTION LIBRARY</p><h2 id="option-category-manager-title" class="mt-1 text-xl font-semibold">Option 分类管理</h2><p class="mt-1 text-sm text-muted-foreground">拖动调整分类顺序；未分类固定置底。</p></div><button type="button" data-category-close class="${secondaryButtonClass}">×</button></header><div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-5" data-category-sort-list>${categories.map((category) => `<article draggable="${!category.system}" data-category-row="${escapeSeasoningHtml(category.id)}" class="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border px-3 py-3 ${category.system ? "bg-muted/35" : "bg-card"}"><button type="button" data-category-drag="${escapeSeasoningHtml(category.id)}" ${category.system ? "disabled" : ""} class="cursor-grab text-lg text-muted-foreground disabled:cursor-not-allowed disabled:opacity-30" aria-label="拖动调整${escapeSeasoningHtml(category.name)}顺序">⠿</button><div class="min-w-0"><div class="flex items-center gap-2"><strong class="truncate text-sm">${escapeSeasoningHtml(category.name)}</strong>${category.system ? `<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">系统</span>` : ""}${category.status === "inactive" ? `<span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">已停用</span>` : ""}</div><p class="mt-1 font-mono text-[11px] text-muted-foreground">${escapeSeasoningHtml(category.code)} · ${category.optionCount ?? 0} 个 Option</p></div><div class="flex gap-1">${category.system ? "" : `<button type="button" data-category-edit="${escapeSeasoningHtml(category.id)}" class="${secondaryButtonClass} !min-h-8 !px-2 text-xs">编辑</button><button type="button" data-category-toggle="${escapeSeasoningHtml(category.id)}" class="${secondaryButtonClass} !min-h-8 !px-2 text-xs">${category.status === "active" ? "停用" : "启用"}</button><button type="button" data-category-delete="${escapeSeasoningHtml(category.id)}" class="${secondaryButtonClass} !min-h-8 !px-2 text-xs text-destructive">删除</button>`}</div></article>`).join("")}</div><footer class="flex justify-between border-t border-border px-5 py-4"><button type="button" data-category-add class="${primaryButtonClass}">＋ 新增分类</button><button type="button" data-category-close class="${secondaryButtonClass}">完成</button></footer></section>`;
  };

  const refresh = async (nextVersion: number) => {
    version = nextVersion;
    categories = (await seasoningApi.optionCategories(true)).items;
    await input.onSaved(version);
    render();
  };

  const reorder = async (source: string, target: string) => {
    if (!source || !target || source === target) return;
    const ids = categories.filter((category) => !category.system).map((category) => category.id);
    const from = ids.indexOf(source); const to = ids.indexOf(target);
    if (from < 0 || to < 0) return;
    const [moved] = ids.splice(from, 1); ids.splice(to, 0, moved);
    const response = await seasoningApi.reorderOptionCategories({ expectedVersion: version, categoryIds: ids });
    await refresh(response.version);
  };

  overlay.addEventListener("dragstart", (event) => { dragged = (event.target as HTMLElement).closest<HTMLElement>("[data-category-row]")?.dataset.categoryRow ?? ""; });
  overlay.addEventListener("dragover", (event) => event.preventDefault());
  overlay.addEventListener("drop", (event) => { event.preventDefault(); const target = (event.target as HTMLElement).closest<HTMLElement>("[data-category-row]")?.dataset.categoryRow; if (target) void reorder(dragged, target); });
  overlay.addEventListener("keydown", (event) => {
    if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    const handle = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-category-drag]");
    if (!handle) return;
    const ids = categories.filter((category) => !category.system).map((category) => category.id);
    const index = ids.indexOf(String(handle.dataset.categoryDrag));
    const target = ids[index + (event.key === "ArrowUp" ? -1 : 1)];
    if (target) void reorder(String(handle.dataset.categoryDrag), target);
    event.preventDefault();
  });
  overlay.addEventListener("click", async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!button) return;
    if (button.hasAttribute("data-category-close")) { overlay.remove(); return; }
    if (button.hasAttribute("data-category-add")) {
      const name = await openPromptDialog({
        title: "新增分类",
        label: "分类名称",
        confirmLabel: "下一步",
      });
      if (!name?.trim()) return;
      const code = await openPromptDialog({
        title: "新增分类",
        label: "内部编码",
        initialValue: name.trim().toUpperCase().replace(/\s+/g, "_"),
        confirmLabel: "确认新增",
      });
      if (!code?.trim()) return;
      const response = await seasoningApi.createOptionCategory({ expectedVersion: version, name: name.trim(), code: code.trim() });
      await refresh(response.version);
      return;
    }
    const editId = button.dataset.categoryEdit;
    if (editId) {
      const current = categories.find((item) => item.id === editId);
      const name = await openPromptDialog({
        title: "编辑分类",
        label: "分类名称",
        initialValue: current?.name ?? "",
        confirmLabel: "确认保存",
      });
      if (!name?.trim()) return;
      const response = await seasoningApi.updateOptionCategory(editId, { expectedVersion: version, name: name.trim() });
      await refresh(response.version);
      return;
    }
    const toggleId = button.dataset.categoryToggle;
    if (toggleId) {
      const current = categories.find((item) => item.id === toggleId);
      const response = await seasoningApi.updateOptionCategory(toggleId, {
        expectedVersion: version,
        status: current?.status === "active" ? "inactive" : "active",
      });
      await refresh(response.version);
      return;
    }
    const deleteId = button.dataset.categoryDelete;
    if (deleteId) {
      const ok = await openConfirmDialog({
        title: "删除分类",
        message: "确认删除该分类？有关联 Option 时无法删除。",
        confirmLabel: "确认删除",
        danger: true,
      });
      if (!ok) return;
      try {
        const response = await seasoningApi.deleteOptionCategory(deleteId, { expectedVersion: version });
        await refresh(response.version);
      } catch (error) {
        showAppToast(
          error instanceof SeasoningApiError && error.code === "option_category_in_use"
            ? "该分类仍有关联 Option，请先迁移。"
            : String(error instanceof Error ? error.message : error),
          { variant: "error" },
        );
      }
    }
  });
  host.appendChild(overlay);
  render();
}
