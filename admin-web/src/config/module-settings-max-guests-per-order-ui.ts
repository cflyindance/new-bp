/**
 * 前厅 · 开单流程：seq 111 每单最多客人数量（按产线启用 + 人数，对齐 seq 75/582 表格）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";

export const MAX_GUESTS_PER_ORDER_SEQ = 111;

export const MAX_GUESTS_PER_ORDER_FIELD_ID = "111-max-guests-per-order";
export const MAX_GUESTS_BY_LINE_FIELD_ID = "111-max-guests-by-line";
const LINES_STORAGE_ID = "111-max-guests-per-order-lines";

export const MAX_GUESTS_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type MaxGuestsProductLineId = (typeof MAX_GUESTS_PRODUCT_LINES)[number]["id"];

export type MaxGuestsLineConfig = {
  enabled: boolean;
  guests: number;
};

const ALL_LINE_IDS: MaxGuestsProductLineId[] = MAX_GUESTS_PRODUCT_LINES.map((l) => l.id);

const GUESTS_DEFAULT = 20;
const GUESTS_MIN = 1;
const GUESTS_MAX = 99;

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

function clampGuests(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return GUESTS_DEFAULT;
  return Math.min(GUESTS_MAX, Math.max(GUESTS_MIN, Math.round(n)));
}

function defaultLineConfig(enabled: boolean): MaxGuestsLineConfig {
  return { enabled, guests: GUESTS_DEFAULT };
}

function defaultByLineConfig(): Record<MaxGuestsProductLineId, MaxGuestsLineConfig> {
  return Object.fromEntries(
    MAX_GUESTS_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(true)]),
  ) as Record<MaxGuestsProductLineId, MaxGuestsLineConfig>;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<MaxGuestsLineConfig>>>,
): Record<MaxGuestsProductLineId, MaxGuestsLineConfig> {
  const base = defaultByLineConfig();
  for (const line of MAX_GUESTS_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      guests: clampGuests(item.guests ?? base[line.id].guests),
    };
  }
  return base;
}

function syncLegacyFields(config: Record<MaxGuestsProductLineId, MaxGuestsLineConfig>): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(LINES_STORAGE_ID, enabledLines);
  const firstEnabled = MAX_GUESTS_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingNumber(MAX_GUESTS_PER_ORDER_FIELD_ID, config[firstEnabled.id].guests);
  }
}

function readLegacyGuestsRaw(): number {
  const stored = readModuleSettingNumber(MAX_GUESTS_PER_ORDER_FIELD_ID, GUESTS_DEFAULT);
  if (!Number.isFinite(stored)) return GUESTS_DEFAULT;
  return Math.round(stored);
}

function ensureMaxGuestsByLineMigrated(): void {
  if (migrated) return;
  migrated = true;

  const raw = readModuleSettingJson<Partial<Record<string, Partial<MaxGuestsLineConfig>>>>(
    MAX_GUESTS_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeMaxGuestsByLine(normalizeByLineConfig(raw));
    return;
  }

  const hasLegacyGuests = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(MAX_GUESTS_PER_ORDER_FIELD_ID)) !== null;
    } catch {
      return false;
    }
  })();
  const hasLegacyLines = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(LINES_STORAGE_ID)) !== null;
    } catch {
      return false;
    }
  })();

  if (!hasLegacyGuests && !hasLegacyLines) {
    writeMaxGuestsByLine(defaultByLineConfig());
    return;
  }

  const guestsLegacy = clampGuests(readLegacyGuestsRaw());
  const linesRaw = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalizedLines = Array.isArray(linesRaw)
    ? linesRaw.filter(
        (id): id is MaxGuestsProductLineId =>
          typeof id === "string" && ALL_LINE_IDS.includes(id as MaxGuestsProductLineId),
      )
    : [];
  const linesLegacy =
    normalizedLines.length > 0 ? normalizedLines : ([...ALL_LINE_IDS] as MaxGuestsProductLineId[]);
  const selected = new Set(linesLegacy);

  const config = defaultByLineConfig();
  for (const line of MAX_GUESTS_PRODUCT_LINES) {
    config[line.id] = selected.has(line.id)
      ? { enabled: true, guests: guestsLegacy }
      : { enabled: false, guests: GUESTS_DEFAULT };
  }
  writeMaxGuestsByLine(config);
}

export function readMaxGuestsByLine(): Record<MaxGuestsProductLineId, MaxGuestsLineConfig> {
  ensureMaxGuestsByLineMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<MaxGuestsLineConfig>>>>(
    MAX_GUESTS_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLineConfig(raw);
  }
  return defaultByLineConfig();
}

export function writeMaxGuestsByLine(
  config: Record<MaxGuestsProductLineId, MaxGuestsLineConfig>,
): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(MAX_GUESTS_BY_LINE_FIELD_ID, normalized);
  syncLegacyFields(normalized);
}

/** FOH 写 lines 后回写 by-line.enabled */
export function syncMaxGuestsEnabledFromLines(lines: readonly string[]): void {
  ensureMaxGuestsByLineMigrated();
  const config = readMaxGuestsByLine();
  const selected = new Set(
    lines.filter((id): id is MaxGuestsProductLineId =>
      ALL_LINE_IDS.includes(id as MaxGuestsProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = {
      ...config[id],
      enabled: selected.has(id),
    };
  }
  writeMaxGuestsByLine(config);
}

export function isMaxGuestsPerOrderSeq(seq: number): boolean {
  return seq === MAX_GUESTS_PER_ORDER_SEQ;
}

export function readMaxGuestsPerOrder(): number {
  const config = readMaxGuestsByLine();
  const firstEnabled = MAX_GUESTS_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) return config[firstEnabled.id].guests;
  return clampGuests(readModuleSettingNumber(MAX_GUESTS_PER_ORDER_FIELD_ID, GUESTS_DEFAULT));
}

export function writeMaxGuestsPerOrder(guests: number): void {
  const value = clampGuests(guests);
  const config = readMaxGuestsByLine();
  let changed = false;
  for (const id of ALL_LINE_IDS) {
    if (config[id].enabled) {
      config[id] = { ...config[id], guests: value };
      changed = true;
    }
  }
  if (changed) {
    writeMaxGuestsByLine(config);
    return;
  }
  writeModuleSettingNumber(MAX_GUESTS_PER_ORDER_FIELD_ID, value);
}

function syncGuestsInputDisabled(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLInputElement>("[data-max-guests-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-max-guests-line-enabled");
    if (!lineId) return;
    const input = editor.querySelector<HTMLInputElement>(`[data-max-guests-line-guests="${lineId}"]`);
    if (!input) return;
    input.disabled = !checkbox.checked;
  });
}

function collectFromEditor(editor: HTMLElement): void {
  const config = readMaxGuestsByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-max-guests-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-max-guests-line-enabled");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as MaxGuestsProductLineId)) return;
    config[lineId as MaxGuestsProductLineId].enabled = checkbox.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-max-guests-line-guests]").forEach((input) => {
    const lineId = input.getAttribute("data-max-guests-line-guests");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as MaxGuestsProductLineId)) return;
    config[lineId as MaxGuestsProductLineId].guests = clampGuests(input.value);
  });
  writeMaxGuestsByLine(config);
  syncGuestsInputDisabled(editor);
}

function renderByLineEditorHtml(): string {
  const config = readMaxGuestsByLine();
  const rows = MAX_GUESTS_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-middle whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-middle">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="${CHECKBOX_CLASS}"
            ${item.enabled ? "checked" : ""}
            data-max-guests-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用每单最多客人限制"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputmode="numeric"
            class="${NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(item.guests))}"
            min="${GUESTS_MIN}"
            max="${GUESTS_MAX}"
            step="1"
            data-max-guests-line-guests="${escapeHtml(line.id)}"
            ${item.enabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 每单最多客人数量"
          />
          <span class="text-xs text-muted-foreground">人（${GUESTS_MIN}–${GUESTS_MAX}）</span>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-max-guests-by-line-editor="${MAX_GUESTS_PER_ORDER_SEQ}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">最多客人</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

/** @deprecated 使用 renderMaxGuestsPerOrderPanelHtml；保留别名避免旧引用断裂 */
export function renderMaxGuestsPerOrderControl(): string {
  return renderMaxGuestsPerOrderPanelHtml();
}

export function renderMaxGuestsPerOrderPanelHtml(): string {
  return `
    <div class="mt-3 space-y-4" data-max-guests-per-order-panel="${MAX_GUESTS_PER_ORDER_SEQ}">
      ${renderByLineEditorHtml()}
    </div>`;
}

export function bindMaxGuestsPerOrderUi(root: ParentNode = document): void {
  ensureMaxGuestsByLineMigrated();
  root.querySelectorAll<HTMLElement>("[data-max-guests-by-line-editor]").forEach((editor) => {
    if (editor.dataset.maxGuestsByLineEditorBound === "1") return;
    editor.dataset.maxGuestsByLineEditorBound = "1";

    syncGuestsInputDisabled(editor);

    const persist = () => collectFromEditor(editor);
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.matches("[data-max-guests-line-enabled]") ||
        target.matches("[data-max-guests-line-guests]")
      ) {
        persist();
      }
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-max-guests-line-guests]")) persist();
    });
  });
}
