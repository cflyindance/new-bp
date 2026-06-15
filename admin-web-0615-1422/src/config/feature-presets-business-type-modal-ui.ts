/**
 * 平台预设 — 经营业态新增 / 编辑 / 删除
 */
import { t, tf } from "../i18n";
import {
  appendLocalBusinessTypeCatalog,
  buildNewBusinessTypeCatalog,
  getBusinessTypePreset,
  getEffectiveBusinessTypePresets,
  isCustomBusinessTypeId,
  suggestBusinessTypeIdFromTitle,
  validateNewBusinessTypeId,
} from "./feature-presets-catalog-runtime";
import { sortBusinessTypesForDisplay } from "./feature-presets-taxonomy";
import {
  applyLocalBusinessTypeDelete,
  applyLocalBusinessTypeUpdate,
  createPlatformBusinessType,
  deletePlatformBusinessType,
  persistLocalCustomCatalog,
  updatePlatformBusinessType,
} from "./feature-presets-api";
import { pickPresetTitle } from "./feature-presets-labels";

const INPUT_CLASS =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const READONLY_CLASS =
  "h-10 w-full rounded-md border border-border bg-muted/40 px-3 font-mono text-xs text-muted-foreground";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCloneOptions(selected: string): string {
  return sortBusinessTypesForDisplay(getEffectiveBusinessTypePresets())
    .map((bt) => {
      const active = bt.id === selected;
      return `<option value="${escapeHtml(bt.id)}" ${active ? "selected" : ""}>${escapeHtml(pickPresetTitle(bt.title, bt.titleEn))}</option>`;
    })
    .join("");
}

export function renderBusinessTypeCreateModalShell(): string {
  return `
    <div
      class="fixed inset-0 z-[10060] hidden items-center justify-center bg-black/40 p-4"
      data-preset-bt-create-modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-bt-create-title"
      aria-hidden="true"
    >
      <button type="button" class="absolute inset-0" data-preset-bt-create-backdrop tabindex="-1" aria-label="${escapeHtml(t("featurePresets.detailClose"))}"></button>
      <form class="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl" data-preset-bt-create-form>
        <div class="border-b border-border px-5 py-4">
          <h3 id="preset-bt-create-title" class="text-base font-semibold">${escapeHtml(t("featurePresets.addBusinessTypeTitle"))}</h3>
          <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(t("featurePresets.addBusinessTypeDesc"))}</p>
        </div>
        <div class="space-y-4 px-5 py-4">
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">${escapeHtml(t("featurePresets.addBusinessTypeName"))}</span>
            <input type="text" class="${INPUT_CLASS}" data-preset-bt-create-title-input required maxlength="40" placeholder="${escapeHtml(t("featurePresets.addBusinessTypeNamePh"))}" />
          </label>
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">${escapeHtml(t("featurePresets.addBusinessTypeNameEn"))}</span>
            <input type="text" class="${INPUT_CLASS}" data-preset-bt-create-title-en-input maxlength="60" placeholder="Coffee shop" />
          </label>
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">${escapeHtml(t("featurePresets.addBusinessTypeId"))}</span>
            <input type="text" class="${INPUT_CLASS} font-mono text-xs" data-preset-bt-create-id-input required pattern="[a-z][a-z0-9-]{1,31}" placeholder="pizza-shop" />
            <span class="text-[11px] text-muted-foreground">${escapeHtml(t("featurePresets.addBusinessTypeIdHint"))}</span>
          </label>
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">${escapeHtml(t("featurePresets.addBusinessTypeClone"))}</span>
            <select class="${INPUT_CLASS}" data-preset-bt-create-clone-select>${renderCloneOptions("general")}</select>
          </label>
          <p class="hidden text-xs text-destructive" data-preset-bt-create-error></p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm hover:bg-muted" data-preset-bt-create-cancel>${escapeHtml(t("featurePresets.detailClose"))}</button>
          <button type="submit" class="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90" data-preset-bt-create-submit>${escapeHtml(t("featurePresets.addBusinessTypeSubmit"))}</button>
        </div>
      </form>
    </div>`;
}

export function renderBusinessTypeEditModalShell(): string {
  return `
    <div
      class="fixed inset-0 z-[10060] hidden items-center justify-center bg-black/40 p-4"
      data-preset-bt-edit-modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-bt-edit-title"
      aria-hidden="true"
    >
      <button type="button" class="absolute inset-0" data-preset-bt-edit-backdrop tabindex="-1" aria-label="${escapeHtml(t("featurePresets.detailClose"))}"></button>
      <form class="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl" data-preset-bt-edit-form>
        <input type="hidden" data-preset-bt-edit-id />
        <div class="border-b border-border px-5 py-4">
          <h3 id="preset-bt-edit-title" class="text-base font-semibold">${escapeHtml(t("featurePresets.editBusinessTypeTitle"))}</h3>
          <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(t("featurePresets.editBusinessTypeDesc"))}</p>
        </div>
        <div class="space-y-4 px-5 py-4">
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">${escapeHtml(t("featurePresets.addBusinessTypeId"))}</span>
            <div class="${READONLY_CLASS} flex items-center" data-preset-bt-edit-id-display></div>
          </label>
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">${escapeHtml(t("featurePresets.addBusinessTypeName"))}</span>
            <input type="text" class="${INPUT_CLASS}" data-preset-bt-edit-title-input required maxlength="40" />
          </label>
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">${escapeHtml(t("featurePresets.addBusinessTypeNameEn"))}</span>
            <input type="text" class="${INPUT_CLASS}" data-preset-bt-edit-title-en-input maxlength="60" />
          </label>
          <p class="hidden text-xs text-destructive" data-preset-bt-edit-error></p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm hover:bg-muted" data-preset-bt-edit-cancel>${escapeHtml(t("featurePresets.detailClose"))}</button>
          <button type="submit" class="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">${escapeHtml(t("featurePresets.editBusinessTypeSubmit"))}</button>
        </div>
      </form>
    </div>`;
}

export function renderBusinessTypeDeleteModalShell(): string {
  return `
    <div
      class="fixed inset-0 z-[10060] hidden items-center justify-center bg-black/40 p-4"
      data-preset-bt-delete-modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-bt-delete-title"
      aria-hidden="true"
    >
      <button type="button" class="absolute inset-0" data-preset-bt-delete-backdrop tabindex="-1" aria-label="${escapeHtml(t("featurePresets.detailClose"))}"></button>
      <div class="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="preset-bt-delete-title" class="text-base font-semibold text-destructive">${escapeHtml(t("featurePresets.deleteBusinessTypeTitle"))}</h3>
        </div>
        <div class="space-y-3 px-5 py-4 text-sm">
          <p data-preset-bt-delete-message></p>
          <p class="text-xs text-muted-foreground">${escapeHtml(t("featurePresets.deleteBusinessTypeWarn"))}</p>
          <input type="hidden" data-preset-bt-delete-id />
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm hover:bg-muted" data-preset-bt-delete-cancel>${escapeHtml(t("featurePresets.detailClose"))}</button>
          <button type="button" class="inline-flex h-9 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:opacity-90" data-preset-bt-delete-confirm>${escapeHtml(t("featurePresets.deleteBusinessTypeSubmit"))}</button>
        </div>
      </div>
    </div>`;
}

function setCreateError(modal: HTMLElement, message: string | null): void {
  const el = modal.querySelector<HTMLElement>("[data-preset-bt-create-error]");
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function setEditError(modal: HTMLElement, message: string | null): void {
  const el = modal.querySelector<HTMLElement>("[data-preset-bt-edit-error]");
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function closeCreateModal(root: ParentNode): void {
  const modal = root.querySelector<HTMLElement>("[data-preset-bt-create-modal]");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  modal.setAttribute("aria-hidden", "true");
  setCreateError(modal, null);
}

function openCreateModal(root: ParentNode): void {
  const modal = root.querySelector<HTMLElement>("[data-preset-bt-create-modal]");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.setAttribute("aria-hidden", "false");
  modal.querySelector<HTMLInputElement>("[data-preset-bt-create-title-input]")?.focus({ preventScroll: true });
}

function closeEditModal(root: ParentNode): void {
  const modal = root.querySelector<HTMLElement>("[data-preset-bt-edit-modal]");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  modal.setAttribute("aria-hidden", "true");
  setEditError(modal, null);
}

function openEditModal(root: ParentNode, businessTypeId: string): void {
  const bt = getBusinessTypePreset(businessTypeId);
  if (!bt || !isCustomBusinessTypeId(businessTypeId)) return;
  const modal = root.querySelector<HTMLElement>("[data-preset-bt-edit-modal]");
  if (!modal) return;
  modal.querySelector<HTMLInputElement>("[data-preset-bt-edit-id]")!.value = businessTypeId;
  const idDisplay = modal.querySelector<HTMLElement>("[data-preset-bt-edit-id-display]");
  if (idDisplay) idDisplay.textContent = businessTypeId;
  const titleInput = modal.querySelector<HTMLInputElement>("[data-preset-bt-edit-title-input]");
  const titleEnInput = modal.querySelector<HTMLInputElement>("[data-preset-bt-edit-title-en-input]");
  if (titleInput) titleInput.value = bt.title;
  if (titleEnInput) titleEnInput.value = bt.titleEn;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.setAttribute("aria-hidden", "false");
  titleInput?.focus({ preventScroll: true });
}

function closeDeleteModal(root: ParentNode): void {
  const modal = root.querySelector<HTMLElement>("[data-preset-bt-delete-modal]");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  modal.setAttribute("aria-hidden", "true");
}

function openDeleteModal(root: ParentNode, businessTypeId: string): void {
  const bt = getBusinessTypePreset(businessTypeId);
  if (!bt || !isCustomBusinessTypeId(businessTypeId)) return;
  const modal = root.querySelector<HTMLElement>("[data-preset-bt-delete-modal]");
  if (!modal) return;
  modal.querySelector<HTMLInputElement>("[data-preset-bt-delete-id]")!.value = businessTypeId;
  const msg = modal.querySelector<HTMLElement>("[data-preset-bt-delete-message]");
  if (msg) {
    msg.textContent = tf("featurePresets.deleteBusinessTypeConfirm", {
      name: pickPresetTitle(bt.title, bt.titleEn),
    });
  }
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.setAttribute("aria-hidden", "false");
}

function reloadAfterBusinessTypeChange(hash: string): void {
  window.location.hash = hash;
  window.location.reload();
}

/** @deprecated 使用 bindBusinessTypeAdminModals */
export function bindBusinessTypeCreateModal(root: ParentNode, onCreated?: (businessTypeId: string) => void): void {
  bindBusinessTypeAdminModals(root, onCreated);
}

export function bindBusinessTypeAdminModals(root: ParentNode, onCreated?: (businessTypeId: string) => void): void {
  const host = root instanceof Document ? root.body : root;
  if (host instanceof HTMLElement && host.dataset.presetBtAdminBound === "1") return;
  if (host instanceof HTMLElement) host.dataset.presetBtAdminBound = "1";

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.closest("[data-preset-add-business-type]")) {
      e.preventDefault();
      openCreateModal(root);
      return;
    }

    const editBtn = target.closest<HTMLElement>("[data-preset-edit-business-type]");
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = editBtn.getAttribute("data-preset-edit-business-type");
      if (id) openEditModal(root, id);
      return;
    }

    const deleteBtn = target.closest<HTMLElement>("[data-preset-delete-business-type]");
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = deleteBtn.getAttribute("data-preset-delete-business-type");
      if (id) openDeleteModal(root, id);
      return;
    }

    if (target.closest("[data-preset-bt-create-cancel], [data-preset-bt-create-backdrop]")) {
      e.preventDefault();
      closeCreateModal(root);
      return;
    }
    if (target.closest("[data-preset-bt-edit-cancel], [data-preset-bt-edit-backdrop]")) {
      e.preventDefault();
      closeEditModal(root);
      return;
    }
    if (target.closest("[data-preset-bt-delete-cancel], [data-preset-bt-delete-backdrop]")) {
      e.preventDefault();
      closeDeleteModal(root);
      return;
    }

    if (target.closest("[data-preset-bt-delete-confirm]")) {
      e.preventDefault();
      const modal = root.querySelector<HTMLElement>("[data-preset-bt-delete-modal]");
      const id = modal?.querySelector<HTMLInputElement>("[data-preset-bt-delete-id]")?.value;
      const confirmBtn = target.closest<HTMLButtonElement>("[data-preset-bt-delete-confirm]");
      if (!id || !confirmBtn) return;
      confirmBtn.disabled = true;
      void (async () => {
        try {
          await deletePlatformBusinessType(id);
        } catch {
          applyLocalBusinessTypeDelete(id);
        }
        closeDeleteModal(root);
        reloadAfterBusinessTypeChange("#/settings/feature-presets/general");
      })();
    }
  });

  root.addEventListener("input", (e) => {
    const target = e.target as HTMLElement;
    if (!target.matches("[data-preset-bt-create-title-input]")) return;
    const modal = target.closest<HTMLElement>("[data-preset-bt-create-modal]");
    const idInput = modal?.querySelector<HTMLInputElement>("[data-preset-bt-create-id-input]");
    if (!idInput || idInput.dataset.touched === "1") return;
    const suggested = suggestBusinessTypeIdFromTitle((target as HTMLInputElement).value);
    if (suggested) idInput.value = suggested;
  });

  root.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    if (target.matches("[data-preset-bt-create-id-input]")) {
      (target as HTMLInputElement).dataset.touched = "1";
    }
  });

  root.querySelector<HTMLFormElement>("[data-preset-bt-create-form]")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const modal = form.closest<HTMLElement>("[data-preset-bt-create-modal]");
    if (!modal) return;

    const title = modal.querySelector<HTMLInputElement>("[data-preset-bt-create-title-input]")?.value.trim() ?? "";
    const titleEn =
      modal.querySelector<HTMLInputElement>("[data-preset-bt-create-title-en-input]")?.value.trim() || title;
    const id = modal.querySelector<HTMLInputElement>("[data-preset-bt-create-id-input]")?.value.trim().toLowerCase() ?? "";
    const cloneFrom = modal.querySelector<HTMLSelectElement>("[data-preset-bt-create-clone-select]")?.value ?? "general";

    if (!title) {
      setCreateError(modal, t("featurePresets.addBusinessTypeErrName"));
      return;
    }
    const idErr = validateNewBusinessTypeId(id);
    if (idErr === "invalid_id") {
      setCreateError(modal, t("featurePresets.addBusinessTypeErrId"));
      return;
    }
    if (idErr === "duplicate") {
      setCreateError(modal, t("featurePresets.addBusinessTypeErrDup"));
      return;
    }

    setCreateError(modal, null);
    try {
      await createPlatformBusinessType({ id, title, titleEn, cloneFrom });
    } catch {
      const built = buildNewBusinessTypeCatalog(id, title, titleEn, cloneFrom);
      appendLocalBusinessTypeCatalog(built.businessType, built.variants);
      persistLocalCustomCatalog();
    }
    closeCreateModal(root);
    onCreated?.(id);
    reloadAfterBusinessTypeChange(`#/settings/feature-presets/${encodeURIComponent(id)}`);
  });

  root.querySelector<HTMLFormElement>("[data-preset-bt-edit-form]")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const modal = form.closest<HTMLElement>("[data-preset-bt-edit-modal]");
    if (!modal) return;

    const id = modal.querySelector<HTMLInputElement>("[data-preset-bt-edit-id]")?.value ?? "";
    const title = modal.querySelector<HTMLInputElement>("[data-preset-bt-edit-title-input]")?.value.trim() ?? "";
    const titleEn =
      modal.querySelector<HTMLInputElement>("[data-preset-bt-edit-title-en-input]")?.value.trim() || title;

    if (!title) {
      setEditError(modal, t("featurePresets.addBusinessTypeErrName"));
      return;
    }
    setEditError(modal, null);

    try {
      await updatePlatformBusinessType(id, { title, titleEn });
    } catch {
      applyLocalBusinessTypeUpdate(id, title, titleEn);
    }
    closeEditModal(root);
    reloadAfterBusinessTypeChange(`#/settings/feature-presets/${encodeURIComponent(id)}`);
  });

  root.addEventListener("keydown", (e) => {
    if (!(e instanceof KeyboardEvent) || e.key !== "Escape") return;
    if (root.querySelector<HTMLElement>("[data-preset-bt-delete-modal]:not(.hidden)")) {
      e.preventDefault();
      closeDeleteModal(root);
      return;
    }
    if (root.querySelector<HTMLElement>("[data-preset-bt-edit-modal]:not(.hidden)")) {
      e.preventDefault();
      closeEditModal(root);
      return;
    }
    if (root.querySelector<HTMLElement>("[data-preset-bt-create-modal]:not(.hidden)")) {
      e.preventDefault();
      closeCreateModal(root);
    }
  });
}
