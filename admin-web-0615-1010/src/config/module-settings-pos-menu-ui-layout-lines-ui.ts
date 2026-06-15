/**
 * 前厅 · 菜单区界面布局：主开关 + POS / PayPad 产线多选
 * — 216 组平铺展示、219 按钮颜色满铺、220 显示菜品价格、350 电子菜单自定义消息（仅产线多选）
 * — 217 类展示、218 菜展示（产线多选 + 各产线独立布局单选）
 */

import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingRadio,
  writeModuleSettingJson,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const MENU_GROUP_FLAT_DISPLAY_SEQ = 216;
export const CATEGORY_LAYOUT_SEQ = 217;
export const ITEM_LAYOUT_SEQ = 218;
export const BUTTON_COLOR_FULL_FILL_SEQ = 219;
export const SHOW_DISH_PRICE_SEQ = 220;
export const EMENU_CUSTOM_MESSAGE_SEQ = 350;

export const POS_MENU_UI_LAYOUT_TOGGLE_ONLY_SEQS = [
  MENU_GROUP_FLAT_DISPLAY_SEQ,
  BUTTON_COLOR_FULL_FILL_SEQ,
  SHOW_DISH_PRICE_SEQ,
  EMENU_CUSTOM_MESSAGE_SEQ,
] as const;

export const POS_MENU_UI_LAYOUT_RADIO_SEQS = [CATEGORY_LAYOUT_SEQ, ITEM_LAYOUT_SEQ] as const;

export const POS_MENU_UI_LAYOUT_LINES_SEQS = [
  MENU_GROUP_FLAT_DISPLAY_SEQ,
  CATEGORY_LAYOUT_SEQ,
  ITEM_LAYOUT_SEQ,
  BUTTON_COLOR_FULL_FILL_SEQ,
  SHOW_DISH_PRICE_SEQ,
  EMENU_CUSTOM_MESSAGE_SEQ,
] as const;

export type PosMenuUiLayoutLinesSeq = (typeof POS_MENU_UI_LAYOUT_LINES_SEQS)[number];
export type PosMenuUiLayoutToggleOnlySeq = (typeof POS_MENU_UI_LAYOUT_TOGGLE_ONLY_SEQS)[number];
export type PosMenuUiLayoutRadioSeq = (typeof POS_MENU_UI_LAYOUT_RADIO_SEQS)[number];

export const POS_MENU_UI_LAYOUT_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "paypad", label: "PayPad" },
] as const;

export type PosMenuUiLayoutProductLineId = (typeof POS_MENU_UI_LAYOUT_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PosMenuUiLayoutProductLineId[] = POS_MENU_UI_LAYOUT_PRODUCT_LINES.map(
  (l) => l.id,
);

const LEGACY_CATEGORY_LAYOUT_FIELD_ID = "217-category-layout";
const LEGACY_ITEM_LAYOUT_FIELD_ID = "218-item-layout";

const CATEGORY_LAYOUT_OPTIONS = [
  { value: "horizontal2", label: "Horizontal2" },
  { value: "horizontal3", label: "Horizontal 3" },
  { value: "vertical1", label: "Vertical 1" },
] as const;

const ITEM_LAYOUT_OPTIONS = [
  { value: "regular-buttons", label: "Regular Buttons" },
  { value: "large-buttons", label: "Large Buttons" },
] as const;

type CategoryLayoutValue = (typeof CATEGORY_LAYOUT_OPTIONS)[number]["value"];
type ItemLayoutValue = (typeof ITEM_LAYOUT_OPTIONS)[number]["value"];

const DEFAULT_CATEGORY_LAYOUT: CategoryLayoutValue = "horizontal2";
const DEFAULT_ITEM_LAYOUT: ItemLayoutValue = "regular-buttons";

const LINES_STORAGE_ID_BY_SEQ: Record<PosMenuUiLayoutLinesSeq, string> = {
  [MENU_GROUP_FLAT_DISPLAY_SEQ]: "216-menu-group-flat-display-lines",
  [CATEGORY_LAYOUT_SEQ]: "217-category-layout-lines",
  [ITEM_LAYOUT_SEQ]: "218-item-layout-lines",
  [BUTTON_COLOR_FULL_FILL_SEQ]: "219-button-color-full-fill-lines",
  [SHOW_DISH_PRICE_SEQ]: "220-show-dish-price-lines",
  [EMENU_CUSTOM_MESSAGE_SEQ]: "350-emenu-custom-message-lines",
};

const LINES_GROUP_ARIA_BY_SEQ: Record<PosMenuUiLayoutLinesSeq, string> = {
  [MENU_GROUP_FLAT_DISPLAY_SEQ]: "组平铺展示适用产线",
  [CATEGORY_LAYOUT_SEQ]: "类展示适用产线",
  [ITEM_LAYOUT_SEQ]: "菜展示适用产线",
  [BUTTON_COLOR_FULL_FILL_SEQ]: "按钮颜色满铺适用产线",
  [SHOW_DISH_PRICE_SEQ]: "显示菜品价格适用产线",
  [EMENU_CUSTOM_MESSAGE_SEQ]: "电子菜单自定义消息适用产线",
};

const PANEL_HINT_BY_SEQ: Record<PosMenuUiLayoutLinesSeq, string> = {
  [MENU_GROUP_FLAT_DISPLAY_SEQ]: "勾选产线后，点单页菜单组以平铺方式展示。",
  [CATEGORY_LAYOUT_SEQ]: "按产线独立配置分类展示布局。",
  [ITEM_LAYOUT_SEQ]: "按产线独立配置菜品按钮展示布局。",
  [BUTTON_COLOR_FULL_FILL_SEQ]: "勾选产线后，点单页菜单按钮颜色铺满按钮区域。",
  [SHOW_DISH_PRICE_SEQ]: "勾选产线后，点单页菜单区展示菜品价格。",
  [EMENU_CUSTOM_MESSAGE_SEQ]: "勾选产线后，允许配置电子菜单自定义消息。",
};

const CATEGORY_BY_LINE_STORAGE_ID = "217-category-layout-by-line";
const ITEM_BY_LINE_STORAGE_ID = "218-item-layout-by-line";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedToggleSeqs = new Set<number>();
const legacyRadioMigrated = new Set<number>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function categoryLayoutFieldId(lineId: PosMenuUiLayoutProductLineId): string {
  return `217-${lineId}-category-layout`;
}

function itemLayoutFieldId(lineId: PosMenuUiLayoutProductLineId): string {
  return `218-${lineId}-item-layout`;
}

function isSeqInGroup(seq: number): seq is PosMenuUiLayoutLinesSeq {
  return (POS_MENU_UI_LAYOUT_LINES_SEQS as readonly number[]).includes(seq);
}

function isRadioSeq(seq: number): seq is PosMenuUiLayoutRadioSeq {
  return (POS_MENU_UI_LAYOUT_RADIO_SEQS as readonly number[]).includes(seq);
}

function isValidCategoryLayout(value: string): value is CategoryLayoutValue {
  return CATEGORY_LAYOUT_OPTIONS.some((o) => o.value === value);
}

function isValidItemLayout(value: string): value is ItemLayoutValue {
  return ITEM_LAYOUT_OPTIONS.some((o) => o.value === value);
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function hasLegacyStorageKey(fieldId: string): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(fieldId)) !== null;
  } catch {
    return false;
  }
}

export function ensurePosMenuUiLayoutToggleMigrated(seq: number): void {
  if (migratedToggleSeqs.has(seq)) return;
  migratedToggleSeqs.add(seq);
  if (!isSeqInGroup(seq)) return;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(seq)) !== null) {
      return;
    }
  } catch {
    return;
  }

  const legacyOn = readLegacyToggleOn(seq);
  const legacyRadioOn =
    (seq === CATEGORY_LAYOUT_SEQ && hasLegacyStorageKey(LEGACY_CATEGORY_LAYOUT_FIELD_ID)) ||
    (seq === ITEM_LAYOUT_SEQ && hasLegacyStorageKey(LEGACY_ITEM_LAYOUT_FIELD_ID));

  if (legacyOn || legacyRadioOn) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): PosMenuUiLayoutProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PosMenuUiLayoutProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPosMenuUiLayoutLines(seq: PosMenuUiLayoutLinesSeq): PosMenuUiLayoutProductLineId[] {
  ensurePosMenuUiLayoutToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID_BY_SEQ[seq], null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePosMenuUiLayoutLines(seq, all);
    return all;
  }
  return [];
}

export function writePosMenuUiLayoutLines(
  seq: PosMenuUiLayoutLinesSeq,
  lines: PosMenuUiLayoutProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], unique);
}

export function ensurePosMenuUiLayoutLinesDefault(seq: PosMenuUiLayoutLinesSeq): void {
  if (readPosMenuUiLayoutLines(seq).length === 0) {
    writePosMenuUiLayoutLines(seq, [...ALL_LINE_IDS]);
  }
}

function defaultCategoryByLine(
  mode: CategoryLayoutValue = DEFAULT_CATEGORY_LAYOUT,
): Record<PosMenuUiLayoutProductLineId, CategoryLayoutValue> {
  return { pos: mode, paypad: mode };
}

function defaultItemByLine(
  mode: ItemLayoutValue = DEFAULT_ITEM_LAYOUT,
): Record<PosMenuUiLayoutProductLineId, ItemLayoutValue> {
  return { pos: mode, paypad: mode };
}

function migrateLegacyCategoryByLine(): Record<PosMenuUiLayoutProductLineId, CategoryLayoutValue> {
  const legacy = readModuleSettingRadio(LEGACY_CATEGORY_LAYOUT_FIELD_ID, DEFAULT_CATEGORY_LAYOUT);
  const mode = isValidCategoryLayout(legacy) ? legacy : DEFAULT_CATEGORY_LAYOUT;
  return defaultCategoryByLine(mode);
}

function migrateLegacyItemByLine(): Record<PosMenuUiLayoutProductLineId, ItemLayoutValue> {
  const legacy = readModuleSettingRadio(LEGACY_ITEM_LAYOUT_FIELD_ID, DEFAULT_ITEM_LAYOUT);
  const mode = isValidItemLayout(legacy) ? legacy : DEFAULT_ITEM_LAYOUT;
  return defaultItemByLine(mode);
}

function normalizeCategoryByLine(
  raw: Partial<Record<string, unknown>>,
): Record<PosMenuUiLayoutProductLineId, CategoryLayoutValue> {
  const base = defaultCategoryByLine();
  for (const line of POS_MENU_UI_LAYOUT_PRODUCT_LINES) {
    const v = raw[line.id];
    base[line.id] = isValidCategoryLayout(String(v ?? ""))
      ? (v as CategoryLayoutValue)
      : DEFAULT_CATEGORY_LAYOUT;
  }
  return base;
}

function normalizeItemByLine(
  raw: Partial<Record<string, unknown>>,
): Record<PosMenuUiLayoutProductLineId, ItemLayoutValue> {
  const base = defaultItemByLine();
  for (const line of POS_MENU_UI_LAYOUT_PRODUCT_LINES) {
    const v = raw[line.id];
    base[line.id] = isValidItemLayout(String(v ?? ""))
      ? (v as ItemLayoutValue)
      : DEFAULT_ITEM_LAYOUT;
  }
  return base;
}

function migratePerLineRadioFromLegacy(seq: PosMenuUiLayoutRadioSeq): void {
  if (legacyRadioMigrated.has(seq)) return;
  legacyRadioMigrated.add(seq);

  const hasPerLine = ALL_LINE_IDS.some((lineId) => {
    const fieldId =
      seq === CATEGORY_LAYOUT_SEQ ? categoryLayoutFieldId(lineId) : itemLayoutFieldId(lineId);
    return hasLegacyStorageKey(fieldId);
  });
  if (hasPerLine) return;

  if (seq === CATEGORY_LAYOUT_SEQ) {
    const migrated = migrateLegacyCategoryByLine();
    writeCategoryLayoutByLine(migrated);
    for (const lineId of ALL_LINE_IDS) {
      writeModuleSettingRadio(categoryLayoutFieldId(lineId), migrated[lineId]);
    }
    return;
  }

  const migrated = migrateLegacyItemByLine();
  writeItemLayoutByLine(migrated);
  for (const lineId of ALL_LINE_IDS) {
    writeModuleSettingRadio(itemLayoutFieldId(lineId), migrated[lineId]);
  }
}

export function readCategoryLayoutByLine(): Record<PosMenuUiLayoutProductLineId, CategoryLayoutValue> {
  migratePerLineRadioFromLegacy(CATEGORY_LAYOUT_SEQ);
  const raw = readModuleSettingJson<Partial<Record<string, unknown>>>(CATEGORY_BY_LINE_STORAGE_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeCategoryByLine(raw);
  }
  const migrated = migrateLegacyCategoryByLine();
  writeCategoryLayoutByLine(migrated);
  return migrated;
}

export function writeCategoryLayoutByLine(
  values: Record<PosMenuUiLayoutProductLineId, CategoryLayoutValue>,
): void {
  writeModuleSettingJson(CATEGORY_BY_LINE_STORAGE_ID, normalizeCategoryByLine(values));
}

export function readItemLayoutByLine(): Record<PosMenuUiLayoutProductLineId, ItemLayoutValue> {
  migratePerLineRadioFromLegacy(ITEM_LAYOUT_SEQ);
  const raw = readModuleSettingJson<Partial<Record<string, unknown>>>(ITEM_BY_LINE_STORAGE_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeItemByLine(raw);
  }
  const migrated = migrateLegacyItemByLine();
  writeItemLayoutByLine(migrated);
  return migrated;
}

export function writeItemLayoutByLine(
  values: Record<PosMenuUiLayoutProductLineId, ItemLayoutValue>,
): void {
  writeModuleSettingJson(ITEM_BY_LINE_STORAGE_ID, normalizeItemByLine(values));
}

export function isPosMenuUiLayoutLinesSeq(seq: number): seq is PosMenuUiLayoutLinesSeq {
  return isSeqInGroup(seq);
}

export function isPosMenuUiLayoutRadioSeq(seq: number): seq is PosMenuUiLayoutRadioSeq {
  return isRadioSeq(seq);
}

function renderLinesMultiselectHtml(seq: PosMenuUiLayoutLinesSeq, enabled: boolean): string {
  const selected = new Set(readPosMenuUiLayoutLines(seq));
  const cells = POS_MENU_UI_LAYOUT_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-4 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-pos-menu-ui-layout-line="${escapeHtml(line.id)}"
          data-pos-menu-ui-layout-lines-seq="${seq}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-pos-menu-ui-layout-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(LINES_GROUP_ARIA_BY_SEQ[seq])}"
    >
      ${cells}
    </div>`;
}

function ensureRadioSeqLineStored(seq: PosMenuUiLayoutRadioSeq, lineId: PosMenuUiLayoutProductLineId): void {
  const lines = readPosMenuUiLayoutLines(seq);
  if (!lines.includes(lineId)) {
    writePosMenuUiLayoutLines(seq, [...lines, lineId]);
  }
}

function renderCategoryLayoutByLineEditorHtml(seq: PosMenuUiLayoutRadioSeq): string {
  const values = readCategoryLayoutByLine();
  const rows = POS_MENU_UI_LAYOUT_PRODUCT_LINES.map((line) => {
    const lineEnabled = true;
    const groupName = `pos-menu-ui-layout-category-${line.id}`;
    const radios = CATEGORY_LAYOUT_OPTIONS.map((opt) => {
      const checked = values[line.id] === opt.value;
      return `
        <label class="inline-flex ${lineEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CONTROL_CLASS}"
            data-pos-menu-ui-layout-category-line="${escapeHtml(line.id)}"
            data-pos-menu-ui-layout-category-seq="${seq}"
            ${checked ? "checked" : ""}
            ${lineEnabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    }).join("");

    return `
    <tr class="border-t border-border ${lineEnabled ? "" : "opacity-60"}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-4" role="radiogroup" aria-label="${escapeHtml(line.label)} 类展示布局">${radios}</div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-pos-menu-ui-layout-category-editor="${seq}" class="mt-3 space-y-2">
      <p class="m-0 text-xs font-medium text-muted-foreground">各产线分类布局（单选）</p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">类展示布局</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderItemLayoutByLineEditorHtml(seq: PosMenuUiLayoutRadioSeq): string {
  const values = readItemLayoutByLine();
  const rows = POS_MENU_UI_LAYOUT_PRODUCT_LINES.map((line) => {
    const lineEnabled = true;
    const groupName = `pos-menu-ui-layout-item-${line.id}`;
    const radios = ITEM_LAYOUT_OPTIONS.map((opt) => {
      const checked = values[line.id] === opt.value;
      return `
        <label class="inline-flex ${lineEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CONTROL_CLASS}"
            data-pos-menu-ui-layout-item-line="${escapeHtml(line.id)}"
            data-pos-menu-ui-layout-item-seq="${seq}"
            ${checked ? "checked" : ""}
            ${lineEnabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    }).join("");

    return `
    <tr class="border-t border-border ${lineEnabled ? "" : "opacity-60"}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-4" role="radiogroup" aria-label="${escapeHtml(line.label)} 菜展示布局">${radios}</div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-pos-menu-ui-layout-item-editor="${seq}" class="mt-3 space-y-2">
      <p class="m-0 text-xs font-medium text-muted-foreground">各产线菜品按钮布局（单选）</p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">菜展示布局</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderRadioExtraHtml(seq: PosMenuUiLayoutRadioSeq): string {
  if (seq === CATEGORY_LAYOUT_SEQ) return renderCategoryLayoutByLineEditorHtml(seq);
  return renderItemLayoutByLineEditorHtml(seq);
}

export function renderPosMenuUiLayoutLinesPanelHtml(seq: PosMenuUiLayoutLinesSeq, on: boolean): string {
  if (on && isRadioSeq(seq)) {
    ensurePosMenuUiLayoutLinesDefault(seq);
  }
  const hidden = on ? "" : "hidden";
  const radioExtra = isRadioSeq(seq) && on ? renderRadioExtraHtml(seq) : "";
  const linesMultiselect = isRadioSeq(seq)
    ? ""
    : `
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}`;
  const hint = PANEL_HINT_BY_SEQ[seq]
    ? `<p class="m-0 ${isRadioSeq(seq) ? "mb-2" : "mt-2"} text-xs leading-relaxed text-muted-foreground">${escapeHtml(PANEL_HINT_BY_SEQ[seq])}</p>`
    : "";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pos-menu-ui-layout-lines-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${linesMultiselect}
      ${hint}
      ${radioExtra}
    </div>`;
}

export function setPosMenuUiLayoutLinesPanelVisible(
  seq: PosMenuUiLayoutLinesSeq,
  visible: boolean,
): void {
  document.querySelectorAll<HTMLElement>(`[data-pos-menu-ui-layout-lines-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-pos-menu-ui-layout-line]").forEach((input) => {
      if (Number(input.getAttribute("data-pos-menu-ui-layout-lines-seq")) !== seq) return;
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });

    if (isRadioSeq(seq)) {
      refreshRadioEditorEnabledState(seq, panel);
    }
  });
}

function refreshRadioEditorEnabledState(seq: PosMenuUiLayoutRadioSeq, panel: HTMLElement): void {
  const panelVisible = !panel.classList.contains("hidden");
  const selector =
    seq === CATEGORY_LAYOUT_SEQ
      ? "[data-pos-menu-ui-layout-category-line]"
      : "[data-pos-menu-ui-layout-item-line]";

  panel.querySelectorAll<HTMLInputElement>(selector).forEach((input) => {
    input.disabled = !panelVisible;
    const label = input.closest("label");
    if (!label) return;
    label.classList.toggle("cursor-not-allowed", !panelVisible);
    label.classList.toggle("opacity-50", !panelVisible);
    label.classList.toggle("cursor-pointer", panelVisible);
  });
  panel.querySelectorAll<HTMLElement>("tr.border-t").forEach((row) => {
    row.classList.remove("opacity-60");
  });
}

function collectLinesFromGroup(
  group: HTMLElement,
  seq: PosMenuUiLayoutLinesSeq,
): PosMenuUiLayoutProductLineId[] {
  const lines: PosMenuUiLayoutProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>(
      `[data-pos-menu-ui-layout-line][data-pos-menu-ui-layout-lines-seq="${seq}"]:checked`,
    )
    .forEach((input) => {
      const id = input.getAttribute("data-pos-menu-ui-layout-line");
      if (id && ALL_LINE_IDS.includes(id as PosMenuUiLayoutProductLineId)) {
        lines.push(id as PosMenuUiLayoutProductLineId);
      }
    });
  writePosMenuUiLayoutLines(seq, lines);

  const panel = group.closest<HTMLElement>(`[data-pos-menu-ui-layout-lines-panel="${seq}"]`);
  if (panel && isRadioSeq(seq)) {
    refreshRadioEditorEnabledState(seq, panel);
  }
  return lines;
}

function collectCategoryLayoutFromEditor(editor: HTMLElement): void {
  const values = readCategoryLayoutByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-pos-menu-ui-layout-category-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute("data-pos-menu-ui-layout-category-line");
    const value = input.value;
    if (!lineId || !ALL_LINE_IDS.includes(lineId as PosMenuUiLayoutProductLineId)) return;
    if (!isValidCategoryLayout(value)) return;
    values[lineId as PosMenuUiLayoutProductLineId] = value;
    writeModuleSettingRadio(categoryLayoutFieldId(lineId as PosMenuUiLayoutProductLineId), value);
    ensureRadioSeqLineStored(CATEGORY_LAYOUT_SEQ, lineId as PosMenuUiLayoutProductLineId);
  });
  writeCategoryLayoutByLine(values);
}

function collectItemLayoutFromEditor(editor: HTMLElement): void {
  const values = readItemLayoutByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-pos-menu-ui-layout-item-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute("data-pos-menu-ui-layout-item-line");
    const value = input.value;
    if (!lineId || !ALL_LINE_IDS.includes(lineId as PosMenuUiLayoutProductLineId)) return;
    if (!isValidItemLayout(value)) return;
    values[lineId as PosMenuUiLayoutProductLineId] = value;
    writeModuleSettingRadio(itemLayoutFieldId(lineId as PosMenuUiLayoutProductLineId), value);
    ensureRadioSeqLineStored(ITEM_LAYOUT_SEQ, lineId as PosMenuUiLayoutProductLineId);
  });
  writeItemLayoutByLine(values);
}

export function bindPosMenuUiLayoutLinesUi(root: ParentNode = document): void {
  for (const seq of POS_MENU_UI_LAYOUT_LINES_SEQS) {
    ensurePosMenuUiLayoutToggleMigrated(seq);
  }

  root.querySelectorAll<HTMLElement>("[data-pos-menu-ui-layout-lines]").forEach((group) => {
    if (group.dataset.posMenuUiLayoutLinesBound === "1") return;
    group.dataset.posMenuUiLayoutLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pos-menu-ui-layout-line]")) return;
      const seqRaw = el.getAttribute("data-pos-menu-ui-layout-lines-seq");
      const seq = Number(seqRaw);
      if (!isPosMenuUiLayoutLinesSeq(seq)) return;
      collectLinesFromGroup(group, seq);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-pos-menu-ui-layout-category-editor]").forEach((editor) => {
    if (editor.dataset.posMenuUiLayoutCategoryEditorBound === "1") return;
    editor.dataset.posMenuUiLayoutCategoryEditorBound = "1";
    editor.addEventListener("change", (e) => {
      if (!(e.target as HTMLElement).matches("[data-pos-menu-ui-layout-category-line]")) return;
      collectCategoryLayoutFromEditor(editor);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-pos-menu-ui-layout-item-editor]").forEach((editor) => {
    if (editor.dataset.posMenuUiLayoutItemEditorBound === "1") return;
    editor.dataset.posMenuUiLayoutItemEditorBound = "1";
    editor.addEventListener("change", (e) => {
      if (!(e.target as HTMLElement).matches("[data-pos-menu-ui-layout-item-line]")) return;
      collectItemLayoutFromEditor(editor);
    });
  });
}
