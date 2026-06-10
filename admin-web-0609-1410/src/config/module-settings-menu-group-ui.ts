/**
 * 设置滑层：菜单组多选（560 设备级 checkbox；599 见 guest-menu-group-by-line-ui 下拉 + 产线）。
 */

import { renderModuleSettingCheckboxChoiceHtml } from "./module-settings-choice-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { readBrandMenus } from "./module-settings-store-brand-menu-ui";

export type MenuGroupTag = { id: string; name: string };

/** 原型菜单组库（组类菜结构 · 组层级，后续对接菜单 API） */
export const MODULE_SETTING_MOCK_MENU_GROUPS: MenuGroupTag[] = [
  { id: "mg-hotpot-base", name: "火锅底" },
  { id: "mg-japanese", name: "日料" },
  { id: "mg-chinese", name: "中餐" },
  { id: "mg-lunch", name: "午餐" },
  { id: "mg-zh-hans", name: "-简体" },
  { id: "mg-breakfast", name: "Breakfast" },
  { id: "mg-bar", name: "Bar" },
  { id: "mg-164", name: "164" },
  { id: "mg-166", name: "166" },
  { id: "mg-hot", name: "热菜" },
  { id: "mg-cold", name: "冷菜" },
  { id: "mg-staple", name: "主食" },
  { id: "mg-soup", name: "汤品" },
  { id: "mg-drink", name: "饮品" },
  { id: "mg-dessert", name: "甜品" },
];

const MENU_GROUP_SELECT_SEQS = new Set([560]);

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

export type MenuGroupCatalogKey = "mock" | "brand";

export function resolveMenuGroupCatalog(catalogKey: MenuGroupCatalogKey = "mock"): MenuGroupTag[] {
  if (catalogKey === "brand") {
    return readBrandMenus().map((m) => ({ id: m.id, name: m.name }));
  }
  return MODULE_SETTING_MOCK_MENU_GROUPS;
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
      class="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
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

/** 触发区：brand 等多选场景在框内展示可换行标签（对齐特殊菜单设置产线） */
function renderMenuGroupDropdownTriggerLabel(groups: MenuGroupTag[], catalogKey: MenuGroupCatalogKey): string {
  if (groups.length === 0) {
    const placeholder = catalogKey === "brand" ? "请选择菜单" : "请选择菜单组";
    return `<span class="text-sm text-muted-foreground" data-menu-group-dropdown-placeholder>${escapeHtml(placeholder)}</span>`;
  }
  if (catalogKey === "brand") {
    return `<span class="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-0.5" data-menu-group-dropdown-tag-chips>${groups
      .map(
        (g) =>
          `<span class="inline-flex max-w-full items-center gap-1 rounded border border-border bg-muted/80 px-1.5 py-0.5 text-xs text-foreground"><span class="truncate">${escapeHtml(g.name)}</span><span class="text-muted-foreground" aria-hidden="true">×</span></span>`,
      )
      .join("")}</span>`;
  }
  const text = groups.map((g) => g.name).join("、");
  return `<span class="block min-w-0 truncate text-sm text-foreground" title="${escapeHtml(text)}">${escapeHtml(text)}</span>`;
}

function renderMenuGroupDropdownOptions(catalog: MenuGroupTag[], selectedIds: Set<string>): string {
  return catalog.map((g) => {
    const checked = selectedIds.has(g.id);
    return `
      <li>
        <label class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted">
          <input
            type="checkbox"
            class="size-4 shrink-0 accent-primary"
            data-menu-group-dropdown-choice
            data-group-id="${escapeHtml(g.id)}"
            data-group-name="${escapeHtml(g.name)}"
            value="${escapeHtml(g.id)}"
            ${checked ? "checked" : ""}
          />
          <span class="min-w-0 truncate">${escapeHtml(g.name)}</span>
        </label>
      </li>`;
  }).join("");
}

/** eMenu 设备等场景：标签 + 下拉多选（替代平铺 checkbox） */
export function renderMenuGroupDropdownHtml(
  storageFieldId: string,
  selected?: MenuGroupTag[],
  catalogKey: MenuGroupCatalogKey = "mock",
): string {
  const groups = selected ?? readMenuGroupTags(storageFieldId);
  const selectedIds = new Set(groups.map((g) => g.id));
  const catalog = resolveMenuGroupCatalog(catalogKey);
  return `
    <div
      class="relative w-full min-w-0"
      data-menu-group-dropdown
      data-storage-id="${escapeHtml(storageFieldId)}"
      data-menu-group-catalog="${catalogKey}"
    >
      <button
        type="button"
        class="flex min-h-9 w-full items-stretch overflow-hidden rounded-md border border-input bg-card p-0 text-left text-sm text-card-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-menu-group-dropdown-trigger
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <span class="flex min-w-0 flex-1 items-center px-3 py-1.5" data-menu-group-dropdown-tags>
          ${renderMenuGroupDropdownTriggerLabel(groups, catalogKey)}
        </span>
        <span class="flex w-9 shrink-0 items-center justify-center border-l border-border bg-card" aria-hidden="true">
          <svg class="size-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </span>
      </button>
      <div
        class="menu-group-dropdown-menu fixed z-[200] hidden max-h-60 overflow-y-auto overscroll-y-contain rounded-md border border-border bg-card py-1 text-card-foreground shadow-lg"
        data-menu-group-dropdown-menu
        role="listbox"
        aria-multiselectable="true"
      >
        <ul class="list-none p-0">${renderMenuGroupDropdownOptions(catalog, selectedIds)}</ul>
      </div>
    </div>`;
}

export function collectMenuGroupsFromDropdown(wrap: Element): MenuGroupTag[] {
  return [...wrap.querySelectorAll<HTMLInputElement>("[data-menu-group-dropdown-choice]:checked")].map(
    (input) => ({
      id: input.getAttribute("data-group-id") ?? input.value,
      name: input.getAttribute("data-group-name") ?? "",
    }),
  );
}

/** 从下拉 data-menu-group-catalog 解析选项库（用于摘要标签） */
export function collectMenuGroupsFromDropdownWithCatalog(wrap: Element): MenuGroupTag[] {
  const checked = collectMenuGroupsFromDropdown(wrap);
  const key = (wrap.getAttribute("data-menu-group-catalog") as MenuGroupCatalogKey | null) ?? "mock";
  const catalog = resolveMenuGroupCatalog(key);
  const byId = new Map(catalog.map((g) => [g.id, g]));
  return checked.map((t) => byId.get(t.id) ?? t).filter((t) => t.id && t.name);
}

function syncMenuGroupDropdownTags(dropdown: HTMLElement): void {
  const tagsWrap = dropdown.querySelector<HTMLElement>("[data-menu-group-dropdown-tags]");
  if (!tagsWrap) return;
  const tags = collectMenuGroupsFromDropdown(dropdown);
  const catalogKey = (dropdown.getAttribute("data-menu-group-catalog") as MenuGroupCatalogKey | null) ?? "mock";
  tagsWrap.innerHTML = renderMenuGroupDropdownTriggerLabel(tags, catalogKey);
}

function clearMenuGroupDropdownMenuPosition(menu: HTMLElement): void {
  menu.style.left = "";
  menu.style.top = "";
  menu.style.width = "";
  menu.style.maxHeight = "";
}

function positionMenuGroupDropdownMenu(dropdown: HTMLElement): void {
  const menu = dropdown.querySelector<HTMLElement>("[data-menu-group-dropdown-menu]");
  const trigger = dropdown.querySelector<HTMLElement>("[data-menu-group-dropdown-trigger]");
  if (!menu || !trigger) return;
  const rect = trigger.getBoundingClientRect();
  const gap = 4;
  const maxMenuHeight = 240;
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
  const available = openUp ? spaceAbove : spaceBelow;
  const height = Math.min(maxMenuHeight, Math.max(120, available - 8));
  menu.style.width = `${rect.width}px`;
  menu.style.left = `${rect.left}px`;
  menu.style.maxHeight = `${height}px`;
  if (openUp) {
    menu.style.top = `${Math.max(8, rect.top - gap - height)}px`;
  } else {
    menu.style.top = `${rect.bottom + gap}px`;
  }
}

type DropdownScrollClose = (e: Event) => void;

function isScrollInsideMenuGroupDropdown(menu: HTMLElement, eventTarget: EventTarget | null): boolean {
  if (!(eventTarget instanceof Node)) return false;
  return menu === eventTarget || menu.contains(eventTarget);
}

function detachMenuGroupDropdownScrollClose(dropdown: HTMLElement): void {
  const handler = (dropdown as HTMLElement & { __menuGroupScrollClose?: DropdownScrollClose })
    .__menuGroupScrollClose;
  if (!handler) return;
  window.removeEventListener("scroll", handler, true);
  window.removeEventListener("resize", handler);
  (dropdown as HTMLElement & { __menuGroupScrollClose?: DropdownScrollClose }).__menuGroupScrollClose =
    undefined;
}

function attachMenuGroupDropdownScrollClose(dropdown: HTMLElement): void {
  detachMenuGroupDropdownScrollClose(dropdown);
  const menu = dropdown.querySelector<HTMLElement>("[data-menu-group-dropdown-menu]");
  const handler: DropdownScrollClose = (e) => {
    if (menu && !menu.classList.contains("hidden") && isScrollInsideMenuGroupDropdown(menu, e.target)) {
      return;
    }
    setMenuGroupDropdownOpen(dropdown, false);
  };
  (dropdown as HTMLElement & { __menuGroupScrollClose?: DropdownScrollClose }).__menuGroupScrollClose =
    handler;
  window.addEventListener("scroll", handler, { capture: true, passive: true });
  window.addEventListener("resize", handler, { passive: true });
}

/** 列表内滚轮优先滚动下拉，避免冒泡到主内容区 */
function bindMenuGroupDropdownMenuWheel(menu: HTMLElement): void {
  if (menu.dataset.menuGroupDropdownWheelBound === "1") return;
  menu.dataset.menuGroupDropdownWheelBound = "1";
  menu.addEventListener(
    "wheel",
    (e) => {
      const el = menu;
      if (el.scrollHeight <= el.clientHeight) return;
      const delta = e.deltaY;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) return;
      e.stopPropagation();
    },
    { passive: true },
  );
}

function setMenuGroupDropdownOpen(dropdown: HTMLElement, open: boolean): void {
  const menu = dropdown.querySelector<HTMLElement>("[data-menu-group-dropdown-menu]");
  const trigger = dropdown.querySelector<HTMLElement>("[data-menu-group-dropdown-trigger]");
  if (!menu || !trigger) return;
  if (open) {
    menu.classList.remove("hidden");
    positionMenuGroupDropdownMenu(dropdown);
    trigger.setAttribute("aria-expanded", "true");
    attachMenuGroupDropdownScrollClose(dropdown);
  } else {
    menu.classList.add("hidden");
    clearMenuGroupDropdownMenuPosition(menu);
    trigger.setAttribute("aria-expanded", "false");
    detachMenuGroupDropdownScrollClose(dropdown);
  }
}

function persistMenuGroupDropdown(dropdown: HTMLElement): void {
  if (dropdown.closest("[data-foh-special-menu-entry]")) return;
  const storageId = dropdown.getAttribute("data-storage-id");
  if (!storageId) return;
  writeMenuGroupTags(storageId, collectMenuGroupsFromDropdown(dropdown));
}

export function bindMenuGroupDropdownPickers(root: ParentNode = document): void {
  ensureMenuGroupDropdownDocumentCloseListener();
  root.querySelectorAll<HTMLElement>("[data-menu-group-dropdown]").forEach((dropdown) => {
    if (dropdown.dataset.menuGroupDropdownBound === "1") return;
    dropdown.dataset.menuGroupDropdownBound = "1";

    const trigger = dropdown.querySelector<HTMLElement>("[data-menu-group-dropdown-trigger]");
    trigger?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const menu = dropdown.querySelector("[data-menu-group-dropdown-menu]");
      const willOpen = menu?.classList.contains("hidden") ?? true;
      document.querySelectorAll<HTMLElement>("[data-menu-group-dropdown]").forEach((other) => {
        if (other !== dropdown) setMenuGroupDropdownOpen(other, false);
      });
      setMenuGroupDropdownOpen(dropdown, willOpen);
    });

    const menu = dropdown.querySelector<HTMLElement>("[data-menu-group-dropdown-menu]");
    if (menu) bindMenuGroupDropdownMenuWheel(menu);
    menu?.addEventListener("mousedown", (e) => e.stopPropagation());

    menu?.addEventListener("change", (e) => {
      const cb = (e.target as HTMLElement).closest<HTMLInputElement>("[data-menu-group-dropdown-choice]");
      if (!cb) return;
      syncMenuGroupDropdownTags(dropdown);
      persistMenuGroupDropdown(dropdown);
    });
  });
}

let menuGroupDropdownDocumentCloseBound = false;

export function ensureMenuGroupDropdownDocumentCloseListener(): void {
  if (menuGroupDropdownDocumentCloseBound) return;
  menuGroupDropdownDocumentCloseBound = true;
  document.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-menu-group-dropdown]")) return;
    document.querySelectorAll<HTMLElement>("[data-menu-group-dropdown]").forEach((d) => {
      setMenuGroupDropdownOpen(d, false);
    });
  });
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
