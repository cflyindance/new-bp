/**
 * 设置滑层：菜单组多选（599 全店默认 / 560 设备级，原型 localStorage JSON）。
 */

import { renderModuleSettingCheckboxChoiceHtml } from "./module-settings-choice-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export type MenuGroupTag = { id: string; name: string };

/** 原型菜单组库（组类菜结构 · 组层级，后续对接菜单 API） */
export const MODULE_SETTING_MOCK_MENU_GROUPS: MenuGroupTag[] = [
  { id: "mg-hot", name: "热菜" },
  { id: "mg-cold", name: "冷菜" },
  { id: "mg-staple", name: "主食" },
  { id: "mg-soup", name: "汤品" },
  { id: "mg-drink", name: "饮品" },
  { id: "mg-dessert", name: "甜品" },
];

const MENU_GROUP_SELECT_SEQS = new Set([560, 599]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isModuleSettingMenuGroupSelectSeq(seq: number): boolean {
  return MENU_GROUP_SELECT_SEQS.has(seq);
}

export function menuGroupStorageFieldId(seq: number): string {
  return `${seq}-menu-groups`;
}

export function readMenuGroupTags(storageFieldId: string): MenuGroupTag[] {
  const raw = readModuleSettingJson<MenuGroupTag[]>(storageFieldId, []);
  return Array.isArray(raw) ? raw.filter((t) => t?.id && t?.name) : [];
}

export function writeMenuGroupTags(storageFieldId: string, tags: MenuGroupTag[]): void {
  writeModuleSettingJson(storageFieldId, tags);
}

function renderMenuGroupTag(tag: MenuGroupTag): string {
  return `
    <span
      data-menu-group-tag
      data-group-id="${escapeHtml(tag.id)}"
      data-group-name="${escapeHtml(tag.name)}"
      class="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/80 px-2 py-0.5 text-xs text-foreground"
    >
      <span class="truncate">${escapeHtml(tag.name)}</span>
      <button
        type="button"
        class="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
        data-menu-group-tag-remove
        aria-label="移除 ${escapeHtml(tag.name)}"
      >×</button>
    </span>`;
}

function collectTagsFromPicker(picker: Element): MenuGroupTag[] {
  return [...picker.querySelectorAll("[data-menu-group-tag]")].map((el) => ({
    id: el.getAttribute("data-group-id") ?? "",
    name: el.getAttribute("data-group-name") ?? "",
  }));
}

function collectTagsFromCheckboxes(picker: HTMLElement): MenuGroupTag[] {
  return [...picker.querySelectorAll<HTMLInputElement>("[data-menu-group-choice]:checked")].map(
    (input) => ({
      id: input.getAttribute("data-group-id") ?? input.value,
      name: input.getAttribute("data-group-name") ?? "",
    }),
  );
}

function syncMenuGroupTagsFromCheckboxes(picker: HTMLElement): void {
  const tags = collectTagsFromCheckboxes(picker);
  let tagsWrap = picker.querySelector<HTMLElement>("[data-menu-group-tags]");
  if (tags.length === 0) {
    tagsWrap?.remove();
    return;
  }
  if (!tagsWrap) {
    picker.insertAdjacentHTML(
      "afterbegin",
      `<div class="flex flex-wrap gap-1.5" data-menu-group-tags></div>`,
    );
    tagsWrap = picker.querySelector<HTMLElement>("[data-menu-group-tags]");
  }
  if (tagsWrap) tagsWrap.innerHTML = tags.map(renderMenuGroupTag).join("");
}

function renderMenuGroupPickerInner(seq: number, groups: MenuGroupTag[]): string {
  const selectedIds = new Set(groups.map((g) => g.id));
  const tags =
    groups.length > 0
      ? `<div class="flex flex-wrap gap-1.5" data-menu-group-tags>${groups.map(renderMenuGroupTag).join("")}</div>`
      : "";
  const choices = renderModuleSettingCheckboxChoiceHtml({
    options: MODULE_SETTING_MOCK_MENU_GROUPS.map((g) => ({ value: g.id, label: g.name })),
    selectedValues: selectedIds,
    checkboxDataAttr: "data-menu-group-choice",
    getItemAttrs: (value, label) => ({
      "data-group-id": value,
      "data-group-name": label,
    }),
    layout: "wrap",
  });
  return `
    <div
      class="module-setting-menu-group-picker w-full min-w-0 space-y-2 rounded-md border border-input bg-background px-3 py-2.5"
      data-menu-group-picker
      data-setting-seq="${seq}"
    >
      ${tags}
      ${choices}
    </div>`;
}

export function renderMenuGroupPickerHtml(seq: number, storageFieldId: string): string {
  const groups = readMenuGroupTags(storageFieldId);
  return `
    <div
      class="w-full min-w-0"
      data-standalone-menu-group-picker
      data-storage-id="${escapeHtml(storageFieldId)}"
      data-setting-seq="${seq}"
    >
      ${renderMenuGroupPickerInner(seq, groups)}
    </div>`;
}

function persistStandaloneMenuGroupPicker(picker: HTMLElement): void {
  const wrap = picker.closest<HTMLElement>("[data-standalone-menu-group-picker]");
  const storageId = wrap?.getAttribute("data-storage-id");
  if (!storageId) return;
  writeMenuGroupTags(storageId, collectTagsFromCheckboxes(picker));
}

export function bindModuleSettingMenuGroupPickers(): void {
  document.querySelectorAll<HTMLElement>("[data-standalone-menu-group-picker]").forEach((wrap) => {
    if (wrap.dataset.menuGroupPickerBound === "1") return;
    wrap.dataset.menuGroupPickerBound = "1";
    wrap.addEventListener("click", (e) => {
      const removeBtn = (e.target as HTMLElement).closest("[data-menu-group-tag-remove]");
      if (!removeBtn) return;
      const tag = removeBtn.closest("[data-menu-group-tag]");
      const picker = tag?.closest<HTMLElement>("[data-menu-group-picker]");
      const groupId = tag?.getAttribute("data-group-id");
      if (groupId && picker) {
        const cb = picker.querySelector<HTMLInputElement>(
          `[data-menu-group-choice][data-group-id="${groupId}"]`,
        );
        if (cb) cb.checked = false;
        tag?.remove();
        const tagsWrap = picker.querySelector("[data-menu-group-tags]");
        if (tagsWrap && !tagsWrap.querySelector("[data-menu-group-tag]")) tagsWrap.remove();
        persistStandaloneMenuGroupPicker(picker);
      }
    });
    wrap.addEventListener("change", (e) => {
      const cb = (e.target as HTMLElement).closest<HTMLInputElement>("[data-menu-group-choice]");
      if (!cb) return;
      const picker = cb.closest<HTMLElement>("[data-menu-group-picker]");
      if (!picker) return;
      syncMenuGroupTagsFromCheckboxes(picker);
      persistStandaloneMenuGroupPicker(picker);
    });
  });
}
