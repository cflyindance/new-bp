/**
 * 前厅 · 食客端·首页与版式：seq 645 菜品名称字体大小
 * （按产线启用 + 字号，表格结构对齐「每单最多客人数量」111）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";
import {
  getGuestMenuBodyProductLines,
  type GuestMenuBodyProductLineId,
} from "./module-settings-guest-menu-body-line-scope";
import { readModuleSettingJsonState } from "./module-setting-storage-state";

export const GUEST_MENU_DISH_NAME_FONT_SEQ = 645;

export const DISH_NAME_FONT_BY_LINE_FIELD_ID = "645-dish-name-font-by-line";
const LINES_STORAGE_ID = "645-dish-name-font-lines";
const LEGACY_FONT_FIELD_ID = "645-dish-name-font-px";

const FONT_MIN = 8;
const FONT_MAX = 72;
const FONT_DEFAULT = 16;

export const GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES = getGuestMenuBodyProductLines(
  GUEST_MENU_DISH_NAME_FONT_SEQ,
);

export type GuestMenuDishNameFontProductLineId = GuestMenuBodyProductLineId;

export type DishNameFontLineConfig = {
  enabled: boolean;
  fontPx: number;
};

const ALL_LINE_IDS: GuestMenuDishNameFontProductLineId[] =
  GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES.map((l) => l.id);

const CHECKBOX_CLASS =
  "size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const NUMBER_INPUT_CLASS =
  "h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

let migrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clampFontPx(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return FONT_DEFAULT;
  return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n)));
}

function defaultLineConfig(enabled: boolean): DishNameFontLineConfig {
  return { enabled, fontPx: FONT_DEFAULT };
}

function defaultByLineConfig(
  enabled = true,
): Record<GuestMenuDishNameFontProductLineId, DishNameFontLineConfig> {
  return Object.fromEntries(
    GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(enabled)]),
  ) as Record<GuestMenuDishNameFontProductLineId, DishNameFontLineConfig>;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<DishNameFontLineConfig>>>,
): Record<GuestMenuDishNameFontProductLineId, DishNameFontLineConfig> {
  const base = defaultByLineConfig(false);
  for (const line of GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      fontPx: clampFontPx(item.fontPx ?? base[line.id].fontPx),
    };
  }
  return base;
}

function fontPxFieldId(lineId: GuestMenuDishNameFontProductLineId): string {
  return `645-${lineId}-dish-name-font-px`;
}

function syncLegacyFields(
  config: Record<GuestMenuDishNameFontProductLineId, DishNameFontLineConfig>,
): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(LINES_STORAGE_ID, enabledLines);
  const firstEnabled = GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingNumber(LEGACY_FONT_FIELD_ID, config[firstEnabled.id].fontPx);
    writeModuleSettingNumber(fontPxFieldId(firstEnabled.id), config[firstEnabled.id].fontPx);
  }
  for (const lineId of ALL_LINE_IDS) {
    writeModuleSettingNumber(fontPxFieldId(lineId), config[lineId].fontPx);
  }
}

function ensureDishNameFontByLineMigrated(): void {
  if (migrated) return;
  migrated = true;

  const state = readModuleSettingJsonState(DISH_NAME_FONT_BY_LINE_FIELD_ID);
  if (state.state === "configured" || state.state === "invalid") return;

  const hasLegacyFont = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(LEGACY_FONT_FIELD_ID)) !== null;
    } catch {
      return false;
    }
  })();
  const hasPerLine = ALL_LINE_IDS.some((lineId) => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(fontPxFieldId(lineId))) !== null;
    } catch {
      return false;
    }
  });
  const hasLegacyLines = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(LINES_STORAGE_ID)) !== null;
    } catch {
      return false;
    }
  })();

  if (!hasLegacyFont && !hasPerLine && !hasLegacyLines) {
    writeDishNameFontByLine(defaultByLineConfig());
    return;
  }

  const linesRaw = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalizedLines = Array.isArray(linesRaw)
    ? linesRaw.filter(
        (id): id is GuestMenuDishNameFontProductLineId =>
          typeof id === "string" && ALL_LINE_IDS.includes(id as GuestMenuDishNameFontProductLineId),
      )
    : [];
  const linesLegacy =
    normalizedLines.length > 0
      ? normalizedLines
      : ([...ALL_LINE_IDS] as GuestMenuDishNameFontProductLineId[]);
  const selected = new Set(linesLegacy);

  const config = defaultByLineConfig();
  for (const line of GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES) {
    const perLinePx = clampFontPx(readModuleSettingNumber(fontPxFieldId(line.id), FONT_DEFAULT));
    const legacyPx = clampFontPx(readModuleSettingNumber(LEGACY_FONT_FIELD_ID, FONT_DEFAULT));
    const hasThisLine = (() => {
      try {
        return localStorage.getItem(moduleSettingStorageKey(fontPxFieldId(line.id))) !== null;
      } catch {
        return false;
      }
    })();
    config[line.id] = {
      enabled: selected.has(line.id),
      fontPx: hasThisLine ? perLinePx : legacyPx,
    };
  }
  writeDishNameFontByLine(config);
}

export function readDishNameFontByLine(): Record<
  GuestMenuDishNameFontProductLineId,
  DishNameFontLineConfig
> {
  ensureDishNameFontByLineMigrated();
  const state = readModuleSettingJsonState(DISH_NAME_FONT_BY_LINE_FIELD_ID);
  if (state.state === "configured" && state.value && typeof state.value === "object") {
    return normalizeByLineConfig(
      state.value as Partial<Record<string, Partial<DishNameFontLineConfig>>>,
    );
  }
  return defaultByLineConfig(state.state === "missing");
}

export function writeDishNameFontByLine(
  config: Record<GuestMenuDishNameFontProductLineId, DishNameFontLineConfig>,
): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(DISH_NAME_FONT_BY_LINE_FIELD_ID, normalized);
  syncLegacyFields(normalized);
}

/** FOH 写 lines 后回写 by-line.enabled */
export function syncDishNameFontEnabledFromLines(lines: readonly string[]): void {
  ensureDishNameFontByLineMigrated();
  const config = readDishNameFontByLine();
  const selected = new Set(
    lines.filter((id): id is GuestMenuDishNameFontProductLineId =>
      ALL_LINE_IDS.includes(id as GuestMenuDishNameFontProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = {
      ...config[id],
      enabled: selected.has(id),
    };
  }
  writeDishNameFontByLine(config);
}

export function readGuestMenuDishNameFontPxForLine(
  lineId: GuestMenuDishNameFontProductLineId,
): number {
  return readDishNameFontByLine()[lineId].fontPx;
}

export function isGuestMenuDishNameFontSeq(seq: number): boolean {
  return seq === GUEST_MENU_DISH_NAME_FONT_SEQ;
}

function syncFontInputDisabled(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLInputElement>("[data-dish-name-font-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-dish-name-font-line-enabled");
    if (!lineId) return;
    const input = editor.querySelector<HTMLInputElement>(
      `[data-dish-name-font-line-px="${lineId}"]`,
    );
    if (!input) return;
    input.disabled = !checkbox.checked;
  });
}

function collectFromEditor(editor: HTMLElement): void {
  const config = readDishNameFontByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-dish-name-font-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-dish-name-font-line-enabled");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as GuestMenuDishNameFontProductLineId)) return;
    config[lineId as GuestMenuDishNameFontProductLineId].enabled = checkbox.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-dish-name-font-line-px]").forEach((input) => {
    const lineId = input.getAttribute("data-dish-name-font-line-px");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as GuestMenuDishNameFontProductLineId)) return;
    config[lineId as GuestMenuDishNameFontProductLineId].fontPx = clampFontPx(input.value);
  });
  writeDishNameFontByLine(config);
  syncFontInputDisabled(editor);
}

function renderByLineEditorHtml(): string {
  const config = readDishNameFontByLine();
  const rows = GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}" data-dish-name-font-line-config="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-middle whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-middle">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="${CHECKBOX_CLASS}"
            ${item.enabled ? "checked" : ""}
            data-dish-name-font-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用菜品名称字体大小"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputmode="numeric"
            class="${NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(item.fontPx))}"
            min="${FONT_MIN}"
            max="${FONT_MAX}"
            step="1"
            data-dish-name-font-line-px="${escapeHtml(line.id)}"
            ${item.enabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 菜品名称字号"
          />
          <span class="text-xs text-muted-foreground">px（${FONT_MIN}–${FONT_MAX}，默认 ${FONT_DEFAULT}）</span>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-dish-name-font-by-line-editor="${GUEST_MENU_DISH_NAME_FONT_SEQ}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">字体大小</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderGuestMenuDishNameFontPanelHtml(): string {
  return `
    <div class="mt-3 space-y-4" data-dish-name-font-panel="${GUEST_MENU_DISH_NAME_FONT_SEQ}">
      ${renderByLineEditorHtml()}
    </div>`;
}

export function bindGuestMenuDishNameFontUi(root: ParentNode = document): void {
  ensureDishNameFontByLineMigrated();
  root.querySelectorAll<HTMLElement>("[data-dish-name-font-by-line-editor]").forEach((editor) => {
    if (editor.dataset.dishNameFontByLineEditorBound === "1") return;
    editor.dataset.dishNameFontByLineEditorBound = "1";

    syncFontInputDisabled(editor);

    const persist = () => collectFromEditor(editor);
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.matches("[data-dish-name-font-line-enabled]") ||
        target.matches("[data-dish-name-font-line-px]")
      ) {
        persist();
      }
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-dish-name-font-line-px]")) persist();
    });
  });
}
