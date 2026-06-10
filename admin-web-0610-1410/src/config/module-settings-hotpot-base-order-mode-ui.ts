/**
 * 前厅 · 食客端·下单与规则：seq 574 火锅锅底下单方式
 * （主开关 + 各产线独立二选一：锅底先下单 / 购物车统一下单；交互对齐 seq 623）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  readModuleSettingRadio,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const HOTPOT_BASE_ORDER_MODE_SEQ = 574;

/** @deprecated 仅用于旧版全局单选迁移 */
export const HOTPOT_BASE_ORDER_MODE_FIELD_ID = "574-hotpot-base-order-mode";

const MODE_BY_LINE_STORAGE_ID = "574-hotpot-base-order-mode-by-line";

/** @deprecated 仅用于旧版产线多选迁移 */
const LEGACY_LINES_STORAGE_ID = "574-hotpot-base-order-mode-lines";

export const HOTPOT_BASE_ORDER_MODE_OPTIONS = [
  { value: "order-first", label: "锅底先下单" },
  { value: "cart-unified", label: "购物车统一下单" },
] as const;

export type HotpotBaseOrderMode =
  (typeof HOTPOT_BASE_ORDER_MODE_OPTIONS)[number]["value"];

export const HOTPOT_BASE_ORDER_MODE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type HotpotBaseOrderModeProductLineId =
  (typeof HOTPOT_BASE_ORDER_MODE_PRODUCT_LINES)[number]["id"];

export type HotpotBaseOrderModeByLine = Record<
  HotpotBaseOrderModeProductLineId,
  HotpotBaseOrderMode
>;

const ALL_LINE_IDS: HotpotBaseOrderModeProductLineId[] =
  HOTPOT_BASE_ORDER_MODE_PRODUCT_LINES.map((l) => l.id);

const DEFAULT_MODE: HotpotBaseOrderMode = "order-first";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidMode(value: string): value is HotpotBaseOrderMode {
  return HOTPOT_BASE_ORDER_MODE_OPTIONS.some((o) => o.value === value);
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(HOTPOT_BASE_ORDER_MODE_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureHotpotBaseOrderModeToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(HOTPOT_BASE_ORDER_MODE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(HOTPOT_BASE_ORDER_MODE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function defaultModeByLine(mode: HotpotBaseOrderMode = DEFAULT_MODE): HotpotBaseOrderModeByLine {
  return {
    emenu: mode,
    sdi: mode,
  };
}

function normalizeLineIds(raw: unknown): HotpotBaseOrderModeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is HotpotBaseOrderModeProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

function readLegacyGlobalMode(): HotpotBaseOrderMode {
  const stored = readModuleSettingRadio(HOTPOT_BASE_ORDER_MODE_FIELD_ID, DEFAULT_MODE);
  return isValidMode(stored) ? stored : DEFAULT_MODE;
}

function readLegacyEnabledLines(): HotpotBaseOrderModeProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LEGACY_LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;
  if (readLegacyToggleOn()) return [...ALL_LINE_IDS];
  return [];
}

function migrateFromLegacyStorage(): HotpotBaseOrderModeByLine {
  const globalMode = readLegacyGlobalMode();
  const base = defaultModeByLine(globalMode);
  const enabledLines = new Set(readLegacyEnabledLines());
  if (enabledLines.size === 0) {
    return defaultModeByLine();
  }
  for (const lineId of ALL_LINE_IDS) {
    if (!enabledLines.has(lineId)) {
      base[lineId] = DEFAULT_MODE;
    }
  }
  return base;
}

function normalizeModeByLine(raw: Partial<Record<string, unknown>>): HotpotBaseOrderModeByLine {
  const base = defaultModeByLine();
  for (const line of HOTPOT_BASE_ORDER_MODE_PRODUCT_LINES) {
    const v = raw[line.id];
    base[line.id] = isValidMode(String(v ?? "")) ? (v as HotpotBaseOrderMode) : DEFAULT_MODE;
  }
  return base;
}

export function readHotpotBaseOrderModeByLine(): HotpotBaseOrderModeByLine {
  ensureHotpotBaseOrderModeToggleMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, unknown>>>(MODE_BY_LINE_STORAGE_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeModeByLine(raw);
  }

  const migrated = migrateFromLegacyStorage();
  writeHotpotBaseOrderModeByLine(migrated);
  return migrated;
}

export function writeHotpotBaseOrderModeByLine(values: HotpotBaseOrderModeByLine): void {
  writeModuleSettingJson(MODE_BY_LINE_STORAGE_ID, normalizeModeByLine(values));
}

/** @deprecated 取 eMenu 产线方式；新代码请用 readHotpotBaseOrderModeByLine */
export function readHotpotBaseOrderMode(): HotpotBaseOrderMode {
  return readHotpotBaseOrderModeByLine().emenu;
}

export function isHotpotBaseOrderModeSeq(seq: number): boolean {
  return seq === HOTPOT_BASE_ORDER_MODE_SEQ;
}

export function renderHotpotBaseOrderModeByLineEditorHtml(): string {
  const values = readHotpotBaseOrderModeByLine();
  const rows = HOTPOT_BASE_ORDER_MODE_PRODUCT_LINES.map((line) => {
    const groupName = `hotpot-base-order-mode-${line.id}`;
    const radios = HOTPOT_BASE_ORDER_MODE_OPTIONS.map((opt) => {
      const checked = values[line.id] === opt.value;
      return `
        <label class="inline-flex cursor-pointer items-start gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} mt-0.5"
            ${checked ? "checked" : ""}
            data-hotpot-base-order-mode-line="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span class="leading-snug">${escapeHtml(opt.label)}</span>
        </label>`;
    }).join("");

    return `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5" role="radiogroup" aria-label="${escapeHtml(line.label)} 火锅锅底下单方式">${radios}</div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-hotpot-base-order-mode-editor class="space-y-2">
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        每条产线独立配置，且只能选一种下单方式；须与 seq 572 火锅锅底必选同轨产线配合使用。
      </p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[6.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">火锅锅底下单方式（单选）</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderHotpotBaseOrderModePanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-4xl ${hidden}"
      data-hotpot-base-order-mode-panel="${HOTPOT_BASE_ORDER_MODE_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderHotpotBaseOrderModeByLineEditorHtml()}
    </div>`;
}

export function setHotpotBaseOrderModePanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-hotpot-base-order-mode-panel="${HOTPOT_BASE_ORDER_MODE_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");
      panel.querySelectorAll<HTMLInputElement>("[data-hotpot-base-order-mode-line]").forEach((input) => {
        input.disabled = !visible;
      });
    });
}

function collectModeByLineFromEditor(editor: HTMLElement): HotpotBaseOrderModeByLine {
  const values = readHotpotBaseOrderModeByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-hotpot-base-order-mode-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute(
      "data-hotpot-base-order-mode-line",
    ) as HotpotBaseOrderModeProductLineId | null;
    const value = input.value;
    if (!lineId || !ALL_LINE_IDS.includes(lineId) || !isValidMode(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function bindHotpotBaseOrderModeUi(root: ParentNode = document): void {
  ensureHotpotBaseOrderModeToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-hotpot-base-order-mode-editor]").forEach((editor) => {
    if (editor.dataset.hotpotBaseOrderModeEditorBound === "1") return;
    editor.dataset.hotpotBaseOrderModeEditorBound = "1";
    editor.addEventListener("change", (e) => {
      if (!(e.target as HTMLElement).matches("[data-hotpot-base-order-mode-line]")) return;
      writeHotpotBaseOrderModeByLine(collectModeByLineFromEditor(editor));
    });
  });
}
