import { t } from "../../i18n";
import { seasoningApi, SeasoningApiError } from "./seasoning-api";
import type { SeasoningOption, SeasoningOptionCategory } from "./seasoning-types";
import { escapeSeasoningHtml, inputClass, primaryButtonClass, secondaryButtonClass } from "./seasoning-ui-helpers";

export function renderSeasoningOptionLibrary(items: SeasoningOption[], canEdit: boolean): string {
  return `
    <section data-seasoning-option-library>
      ${items.length ? `<div class="divide-y divide-border/80">
        ${items.map((option) => `
          <article class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold text-foreground">${escapeSeasoningHtml(option.name)}</h3><span class="rounded-full border px-2 py-0.5 text-[11px] font-semibold ${option.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border bg-muted text-muted-foreground"}">${option.status === "active" ? t("seasoning.statusActive") : t("seasoning.statusInactive")}</span><span class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">${escapeSeasoningHtml(option.categoryName ?? "未分类")}</span></div><p class="mt-1 font-mono text-xs text-muted-foreground">${escapeSeasoningHtml(option.code)} · ${option.relationCount ?? 0} ${t("seasoning.associationCount")}</p></div>
            ${canEdit ? `<div class="flex items-center gap-2"><button type="button" data-seasoning-edit-option="${escapeSeasoningHtml(option.id)}" class="${secondaryButtonClass}">编辑</button><button type="button" data-seasoning-toggle-option="${escapeSeasoningHtml(option.id)}" data-next-status="${option.status === "active" ? "inactive" : "active"}" class="${secondaryButtonClass}">${option.status === "active" ? t("seasoning.disable") : t("seasoning.enable")}</button></div>` : ""}
          </article>`).join("")}
      </div>` : `<div class="flex min-h-64 items-center justify-center px-6 text-center"><p class="font-semibold text-foreground">${t("seasoning.noOptions")}</p></div>`}
    </section>`;
}

export function openSeasoningOptionEditor(
  host: HTMLElement,
  input: { version: number; categories: SeasoningOptionCategory[]; option?: SeasoningOption; onSaved: (version: number) => Promise<void> | void },
): void {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]";
  overlay.innerHTML = `
    <section role="dialog" aria-modal="true" aria-labelledby="seasoning-option-editor-title" class="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl">
      <div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">${t("seasoning.publicLibrary")}</p><h2 id="seasoning-option-editor-title" class="mt-1 text-xl font-semibold">${input.option ? "编辑 Option" : t("seasoning.addOption")}</h2></div><button type="button" data-close class="${secondaryButtonClass}" aria-label="${t("seasoning.close")}">×</button></div>
      <form data-seasoning-option-form class="mt-5 space-y-4">
        <label class="block"><span class="mb-1.5 block text-sm font-medium">${t("seasoning.optionName")}</span><input required name="name" class="${inputClass}" value="${escapeSeasoningHtml(input.option?.name ?? "")}"></label>
        <label class="block"><span class="mb-1.5 block text-sm font-medium">${t("seasoning.optionNameEn")}</span><input name="nameEn" class="${inputClass}" value="${escapeSeasoningHtml(input.option?.nameEn ?? "")}"></label>
        <label class="block"><span class="mb-1.5 block text-sm font-medium">${t("seasoning.optionCode")}</span><input required name="code" pattern="[A-Za-z0-9_-]{2,40}" class="${inputClass}" value="${escapeSeasoningHtml(input.option?.code ?? "")}" ${input.option ? "readonly" : ""}></label>
        <label class="block"><span class="mb-1.5 block text-sm font-medium">所属分类</span><select required name="categoryId" class="${inputClass}"><option value="">请选择分类</option>${input.categories.filter((category) => category.status === "active" || category.id === input.option?.categoryId).map((category) => `<option value="${escapeSeasoningHtml(category.id)}" ${category.id === input.option?.categoryId ? "selected" : ""}>${escapeSeasoningHtml(category.name)}${category.status === "inactive" ? "（已停用）" : ""}</option>`).join("")}</select></label>
        <label class="block"><span class="mb-1.5 block text-sm font-medium">${t("seasoning.optionSortOrder")}</span><input name="sortOrder" type="number" min="1" class="${inputClass}" value="${input.option?.sortOrder ?? 10}"></label>
        <p data-error class="hidden rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"></p>
        <div class="flex justify-end gap-2 pt-2"><button type="button" data-close class="${secondaryButtonClass}">${t("seasoning.cancel")}</button><button type="submit" class="${primaryButtonClass}">${t("seasoning.save")}</button></div>
      </form>
    </section>`;
  host.appendChild(overlay);
  const first = overlay.querySelector<HTMLInputElement>('input[name="name"]');
  first?.focus();
  const close = () => overlay.remove();
  overlay.querySelectorAll<HTMLElement>("[data-close]").forEach((button) => button.addEventListener("click", close));
  overlay.querySelector<HTMLFormElement>("[data-seasoning-option-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const errorNode = form.querySelector<HTMLElement>("[data-error]");
    const data = new FormData(form);
    submit?.setAttribute("disabled", "true");
    try {
      const payload = { expectedVersion: input.version, name: String(data.get("name") ?? ""), nameEn: String(data.get("nameEn") ?? ""), code: String(data.get("code") ?? ""), categoryId: String(data.get("categoryId") ?? ""), sortOrder: Number(data.get("sortOrder") ?? 10) };
      const response = input.option
        ? await seasoningApi.updateOption(input.option.id, payload)
        : await seasoningApi.createOption(payload);
      await input.onSaved(response.version);
      close();
    } catch (error) {
      if (errorNode) {
        errorNode.textContent = error instanceof SeasoningApiError && error.code === "version_conflict" ? t("seasoning.versionConflict") : String(error instanceof Error ? error.message : error);
        errorNode.classList.remove("hidden");
      }
    } finally {
      submit?.removeAttribute("disabled");
    }
  });
}
