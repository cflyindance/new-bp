/**
 * 前厅 · 点单页展示：seq 133/134 相同菜品展示（各产线单选：拆分显示 / 合并显示）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { readModuleSettingJson, readModuleSettingRadio, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const ORDER_SAME_DISH_DISPLAY_HOST_SEQ = 133;

export const ORDER_SAME_DISH_DISPLAY_MEMBER_SEQ = 134;

const LEGACY_RADIO_FIELD_ID = "order-same-dish-display-mode";
const MODE_BY_LINE_STORAGE_ID = "133-order-same-dish-display-by-line";

export const ORDER_SAME_DISH_DISPLAY_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type OrderSameDishDisplayProductLineId =
  (typeof ORDER_SAME_DISH_DISPLAY_PRODUCT_LINES)[number]["id"];

export type OrderSameDishDisplayMode = "split" | "merge";

export type OrderSameDishDisplayModeByLine = Record<
  OrderSameDishDisplayProductLineId,
  OrderSameDishDisplayMode
>;

const ALL_LINE_IDS: OrderSameDishDisplayProductLineId[] =
  ORDER_SAME_DISH_DISPLAY_PRODUCT_LINES.map((l) => l.id);

const DEFAULT_MODE: OrderSameDishDisplayMode = "merge";

export const ORDER_SAME_DISH_DISPLAY_MODE_OPTIONS: ReadonlyArray<{
  value: OrderSameDishDisplayMode;
  label: string;
}> = [
  { value: "split", label: "拆分显示" },
  { value: "merge", label: "合并显示" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidMode(value: string): value is OrderSameDishDisplayMode {
  return value === "split" || value === "merge";
}

function readLegacyToggle(seq: number): boolean | null {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(seq));
    if (raw === null) return null;
    return raw === "1";
  } catch {
    return null;
  }
}

function readLegacyGlobalMode(): OrderSameDishDisplayMode {
  const stored = readModuleSettingRadio(LEGACY_RADIO_FIELD_ID, "");
  if (stored === "split" || stored === "merge") return stored;

  const splitOn = readLegacyToggle(ORDER_SAME_DISH_DISPLAY_HOST_SEQ);
  const mergeOn = readLegacyToggle(ORDER_SAME_DISH_DISPLAY_MEMBER_SEQ);
  if (mergeOn === true && splitOn !== true) return "merge";
  if (splitOn === true && mergeOn !== true) return "split";
  return DEFAULT_MODE;
}

function defaultModeByLine(mode: OrderSameDishDisplayMode = DEFAULT_MODE): OrderSameDishDisplayModeByLine {
  return Object.fromEntries(ALL_LINE_IDS.map((id) => [id, mode])) as OrderSameDishDisplayModeByLine;
}

function normalizeModeByLine(raw: unknown): OrderSameDishDisplayModeByLine | null {
  if (!raw || typeof raw !== "object") return null;
  const base = defaultModeByLine();
  const record = raw as Partial<Record<string, unknown>>;
  for (const lineId of ALL_LINE_IDS) {
    const value = record[lineId];
    if (typeof value === "string" && isValidMode(value)) {
      base[lineId] = value;
    }
  }
  return base;
}

export function readOrderSameDishDisplayModeByLine(): OrderSameDishDisplayModeByLine {
  const stored = readModuleSettingJson<unknown>(MODE_BY_LINE_STORAGE_ID, null);
  const normalized = normalizeModeByLine(stored);
  if (normalized) return normalized;

  const legacy = readLegacyGlobalMode();
  const migrated = defaultModeByLine(legacy);
  writeOrderSameDishDisplayModeByLine(migrated);
  return migrated;
}

export function writeOrderSameDishDisplayModeByLine(values: OrderSameDishDisplayModeByLine): void {
  writeModuleSettingJson(MODE_BY_LINE_STORAGE_ID, values);
}

/** @deprecated 使用 readOrderSameDishDisplayModeByLine */
export function readOrderSameDishDisplayMode(): OrderSameDishDisplayMode {
  return readLegacyGlobalMode();
}

export function isOrderSameDishDisplayHostSeq(seq: number): boolean {
  return seq === ORDER_SAME_DISH_DISPLAY_HOST_SEQ;
}

export function shouldSkipOrderSameDishDisplayMemberRow(seq: number): boolean {
  return seq === ORDER_SAME_DISH_DISPLAY_MEMBER_SEQ;
}

function renderModeRadiosForLine(options: {
  lineId: OrderSameDishDisplayProductLineId;
  lineLabel: string;
  mode: OrderSameDishDisplayMode;
}): string {
  const groupName = `order-same-dish-display-mode-${options.lineId}`;
  const radios = ORDER_SAME_DISH_DISPLAY_MODE_OPTIONS.map((opt) => {
    const checked = options.mode === opt.value;
    return `
        <label class="inline-flex items-center gap-1.5 text-sm cursor-pointer text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-order-same-dish-display-line="${escapeHtml(options.lineId)}"
            aria-label="${escapeHtml(options.lineLabel)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
  }).join("");

  return `
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4" role="radiogroup" aria-label="${escapeHtml(options.lineLabel)} 相同菜品展示">${radios}</div>`;
}

export function renderOrderSameDishDisplayByLineTableHtml(): string {
  const values = readOrderSameDishDisplayModeByLine();
  const rows = ORDER_SAME_DISH_DISPLAY_PRODUCT_LINES.map(
    (line) => `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderModeRadiosForLine({
          lineId: line.id,
          lineLabel: line.label,
          mode: values[line.id],
        })}
      </td>
    </tr>`,
  ).join("");

  return `
    <div data-order-same-dish-display-by-line-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[22rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">相同菜品展示</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderOrderSameDishDisplayPanelHtml(): string {
  return `
    <div class="mt-3 max-w-2xl">
      ${renderOrderSameDishDisplayByLineTableHtml()}
    </div>`;
}

function collectModeByLineFromRoot(root: ParentNode): OrderSameDishDisplayModeByLine {
  const values = readOrderSameDishDisplayModeByLine();
  root.querySelectorAll<HTMLInputElement>("[data-order-same-dish-display-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute(
      "data-order-same-dish-display-line",
    ) as OrderSameDishDisplayProductLineId | null;
    const value = input.value;
    if (!lineId || !ALL_LINE_IDS.includes(lineId) || !isValidMode(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function bindOrderSameDishDisplayRadios(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-order-same-dish-display-by-line-editor]").forEach((editor) => {
    if (editor.dataset.orderSameDishDisplayByLineBound === "1") return;
    editor.dataset.orderSameDishDisplayByLineBound = "1";
    editor.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).matches("[data-order-same-dish-display-line]")) {
        writeOrderSameDishDisplayModeByLine(collectModeByLineFromRoot(editor));
      }
    });
  });
}
