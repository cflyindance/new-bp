/**
 * 前厅 · 食客端·首页与版式：seq 608 展示菜详情
 * （主开关 + 产线多选后，按产线配置无属性菜品的详情展示）。
 */

import {
  bindModuleSettingsDishRules,
  readDishTags,
  renderStandaloneDishPickerHtml,
  writeDishTags,
} from "./module-settings-dish-rules-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_DISH_DETAIL_DISPLAY_SEQ = 608;

const LINES_STORAGE_ID = "608-guest-dish-detail-lines";
const LEGACY_DISHES_STORAGE_ID = "608-no-attr-dishes";

export const GUEST_DISH_DETAIL_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "kiosk", label: "Kiosk" },
  { id: "online-order", label: "Online Order" },
] as const;

export type GuestDishDetailProductLineId =
  (typeof GUEST_DISH_DETAIL_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestDishDetailProductLineId[] =
  GUEST_DISH_DETAIL_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;
let legacyDishesMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function noAttrDishesStorageId(lineId: GuestDishDetailProductLineId): string {
  return `${GUEST_DISH_DETAIL_DISPLAY_SEQ}-no-attr-dishes-${lineId}`;
}

function normalizeLineIds(raw: unknown): GuestDishDetailProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestDishDetailProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_DISH_DETAIL_DISPLAY_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestDishDetailDisplayToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_DISH_DETAIL_DISPLAY_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_DISH_DETAIL_DISPLAY_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function ensureLegacyDishesMigrated(): void {
  if (legacyDishesMigrated) return;
  legacyDishesMigrated = true;
  const legacy = readDishTags(LEGACY_DISHES_STORAGE_ID);
  if (legacy.length === 0) return;

  for (const lineId of ALL_LINE_IDS) {
    const fieldId = noAttrDishesStorageId(lineId);
    if (readDishTags(fieldId).length === 0) {
      writeDishTags(fieldId, legacy);
    }
  }
}

export function readGuestDishDetailLines(): GuestDishDetailProductLineId[] {
  ensureGuestDishDetailDisplayToggleMigrated();
  ensureLegacyDishesMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  const active = ALL_LINE_IDS.filter(
    (lineId) => readDishTags(noAttrDishesStorageId(lineId)).length > 0,
  );
  if (active.length > 0) {
    writeGuestDishDetailLines(active);
    return active;
  }
  if (readDishTags(LEGACY_DISHES_STORAGE_ID).length > 0) {
    const all = [...ALL_LINE_IDS];
    writeGuestDishDetailLines(all);
    return all;
  }

  return [];
}

export function writeGuestDishDetailLines(lines: GuestDishDetailProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isGuestDishDetailDisplaySeq(seq: number): boolean {
  return seq === GUEST_DISH_DETAIL_DISPLAY_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestDishDetailLines());
  const cells = GUEST_DISH_DETAIL_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-2 text-sm text-foreground sm:px-3 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-dish-detail-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight text-xs sm:text-sm">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="grid w-full max-w-2xl grid-cols-2 overflow-hidden rounded-md border border-border bg-muted/40 sm:grid-cols-4"
      data-guest-dish-detail-lines="${GUEST_DISH_DETAIL_DISPLAY_SEQ}"
      role="group"
      aria-label="展示菜详情适用产线"
    >
      ${cells}
    </div>`;
}

function renderLineConfigRow(line: (typeof GUEST_DISH_DETAIL_PRODUCT_LINES)[number]): string {
  const storageId = noAttrDishesStorageId(line.id);
  const pickerHtml = renderStandaloneDishPickerHtml(
    GUEST_DISH_DETAIL_DISPLAY_SEQ,
    `no-attr-${line.id}`,
    storageId,
    "checkbox",
  );
  return `
    <div
      class="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3"
      data-guest-dish-detail-line-row="${escapeHtml(line.id)}"
    >
      <p class="m-0 text-sm font-medium text-foreground">${escapeHtml(line.label)}</p>
      <p class="m-0 text-xs text-muted-foreground">只针对仅有图片、名称、价格、描述的菜生效</p>
      <div class="space-y-1.5">
        <p class="m-0 text-xs text-muted-foreground">请选择无属性的菜</p>
        ${pickerHtml}
      </div>
    </div>`;
}

function renderLineSettingsInnerHtml(): string {
  const selectedIds = readGuestDishDetailLines();
  if (selectedIds.length === 0) {
    return `
      <p class="m-0 rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
        请在上方勾选产线后，再配置对应产线的无属性菜详情展示。
      </p>`;
  }
  const rows = GUEST_DISH_DETAIL_PRODUCT_LINES.filter((line) => selectedIds.includes(line.id))
    .map((line) => renderLineConfigRow(line))
    .join("");
  return `<div class="space-y-3">${rows}</div>`;
}

export function renderGuestDishDetailPanelHtml(on: boolean): string {
  ensureLegacyDishesMigrated();
  const hidden = on ? "" : "hidden";

  return `
    <div
      class="mt-3 space-y-4 max-w-2xl ${hidden}"
      data-guest-dish-detail-panel="${GUEST_DISH_DETAIL_DISPLAY_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
        ${renderLinesMultiselectHtml(on)}
      </div>
      <div class="space-y-2" data-guest-dish-detail-line-settings-wrap>
        <p class="m-0 text-xs font-medium text-muted-foreground">按产线配置</p>
        <div data-guest-dish-detail-line-settings>${renderLineSettingsInnerHtml()}</div>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        勾选哪个产线，即展示并配置该产线；未勾选产线不展示配置项。
      </p>
    </div>`;
}

export function setGuestDishDetailPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-guest-dish-detail-panel="${GUEST_DISH_DETAIL_DISPLAY_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-guest-dish-detail-line]").forEach((input) => {
        input.disabled = !visible;
      });
      panel.querySelectorAll("label").forEach((label) => {
        if (!label.querySelector("[data-guest-dish-detail-line]")) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });

      if (visible) rerenderGuestDishDetailLineSettings(panel);
    });
}

function rerenderGuestDishDetailLineSettings(panel: HTMLElement): void {
  const wrap = panel.querySelector<HTMLElement>("[data-guest-dish-detail-line-settings]");
  if (!wrap) return;
  wrap.innerHTML = renderLineSettingsInnerHtml();
  bindModuleSettingsDishRules();
}

function collectLinesFromGroup(group: HTMLElement): GuestDishDetailProductLineId[] {
  const lines: GuestDishDetailProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-dish-detail-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-dish-detail-line");
    if (id && ALL_LINE_IDS.includes(id as GuestDishDetailProductLineId)) {
      lines.push(id as GuestDishDetailProductLineId);
    }
  });
  writeGuestDishDetailLines(lines);
  return lines;
}

export function bindGuestDishDetailDisplayUi(root: ParentNode = document): void {
  ensureGuestDishDetailDisplayToggleMigrated();
  bindModuleSettingsDishRules();

  root.querySelectorAll<HTMLElement>("[data-guest-dish-detail-lines]").forEach((group) => {
    if (group.dataset.guestDishDetailLinesBound === "1") return;
    group.dataset.guestDishDetailLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-dish-detail-line]")) return;
      collectLinesFromGroup(group);
      const panel = group.closest<HTMLElement>("[data-guest-dish-detail-panel]");
      if (panel) rerenderGuestDishDetailLineSettings(panel);
    });
  });
}
