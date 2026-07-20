/**
 * 前厅 · POS 点单页工具栏：seq 110 点单超时提醒（按产线启用 + 分钟，对齐 seq 111）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";

export const ORDER_TIMEOUT_REMINDER_SEQ = 110;

export const ORDER_TIMEOUT_REMINDER_FIELD_ID = "110-order-timeout-reminder-minutes";
export const ORDER_TIMEOUT_BY_LINE_FIELD_ID = "110-order-timeout-by-line";
const LINES_STORAGE_ID = "110-order-timeout-reminder-lines";

export const ORDER_TIMEOUT_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type OrderTimeoutProductLineId = (typeof ORDER_TIMEOUT_PRODUCT_LINES)[number]["id"];

export type OrderTimeoutLineConfig = {
  enabled: boolean;
  minutes: number;
};

const ALL_LINE_IDS: OrderTimeoutProductLineId[] = ORDER_TIMEOUT_PRODUCT_LINES.map((l) => l.id);

const MINUTES_DEFAULT = 30;
const MINUTES_MIN = 1;
const MINUTES_MAX = 999;

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

function clampMinutes(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return MINUTES_DEFAULT;
  return Math.min(MINUTES_MAX, Math.max(MINUTES_MIN, Math.round(n)));
}

function defaultLineConfig(enabled: boolean): OrderTimeoutLineConfig {
  return { enabled, minutes: MINUTES_DEFAULT };
}

function defaultByLineConfig(): Record<OrderTimeoutProductLineId, OrderTimeoutLineConfig> {
  return Object.fromEntries(
    ORDER_TIMEOUT_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(true)]),
  ) as Record<OrderTimeoutProductLineId, OrderTimeoutLineConfig>;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<OrderTimeoutLineConfig>>>,
): Record<OrderTimeoutProductLineId, OrderTimeoutLineConfig> {
  const base = defaultByLineConfig();
  for (const line of ORDER_TIMEOUT_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      minutes: clampMinutes(item.minutes ?? base[line.id].minutes),
    };
  }
  return base;
}

function syncLegacyFields(config: Record<OrderTimeoutProductLineId, OrderTimeoutLineConfig>): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(LINES_STORAGE_ID, enabledLines);
  const firstEnabled = ORDER_TIMEOUT_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingNumber(ORDER_TIMEOUT_REMINDER_FIELD_ID, config[firstEnabled.id].minutes);
  }
}

function ensureMigrated(): void {
  if (migrated) return;
  migrated = true;

  const raw = readModuleSettingJson<Partial<Record<string, Partial<OrderTimeoutLineConfig>>>>(
    ORDER_TIMEOUT_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeOrderTimeoutByLine(normalizeByLineConfig(raw));
    return;
  }

  const hasLegacyMinutes = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(ORDER_TIMEOUT_REMINDER_FIELD_ID)) !== null;
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

  if (!hasLegacyMinutes && !hasLegacyLines) {
    writeOrderTimeoutByLine(defaultByLineConfig());
    return;
  }

  const minutesLegacy = clampMinutes(
    readModuleSettingNumber(ORDER_TIMEOUT_REMINDER_FIELD_ID, MINUTES_DEFAULT),
  );
  const linesRaw = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalizedLines = Array.isArray(linesRaw)
    ? linesRaw.filter(
        (id): id is OrderTimeoutProductLineId =>
          typeof id === "string" && ALL_LINE_IDS.includes(id as OrderTimeoutProductLineId),
      )
    : [];
  const linesLegacy =
    normalizedLines.length > 0 ? normalizedLines : ([...ALL_LINE_IDS] as OrderTimeoutProductLineId[]);
  const selected = new Set(linesLegacy);

  const config = defaultByLineConfig();
  for (const line of ORDER_TIMEOUT_PRODUCT_LINES) {
    config[line.id] = selected.has(line.id)
      ? { enabled: true, minutes: minutesLegacy }
      : { enabled: false, minutes: MINUTES_DEFAULT };
  }
  writeOrderTimeoutByLine(config);
}

export function readOrderTimeoutByLine(): Record<OrderTimeoutProductLineId, OrderTimeoutLineConfig> {
  ensureMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<OrderTimeoutLineConfig>>>>(
    ORDER_TIMEOUT_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLineConfig(raw);
  }
  return defaultByLineConfig();
}

export function writeOrderTimeoutByLine(
  config: Record<OrderTimeoutProductLineId, OrderTimeoutLineConfig>,
): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(ORDER_TIMEOUT_BY_LINE_FIELD_ID, normalized);
  syncLegacyFields(normalized);
}

export function syncOrderTimeoutEnabledFromLines(lines: readonly string[]): void {
  ensureMigrated();
  const config = readOrderTimeoutByLine();
  const selected = new Set(
    lines.filter((id): id is OrderTimeoutProductLineId =>
      ALL_LINE_IDS.includes(id as OrderTimeoutProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeOrderTimeoutByLine(config);
}

export function isOrderTimeoutReminderSeq(seq: number): boolean {
  return seq === ORDER_TIMEOUT_REMINDER_SEQ;
}

export function readOrderTimeoutReminderMinutes(): number {
  const config = readOrderTimeoutByLine();
  const firstEnabled = ORDER_TIMEOUT_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) return config[firstEnabled.id].minutes;
  return clampMinutes(readModuleSettingNumber(ORDER_TIMEOUT_REMINDER_FIELD_ID, MINUTES_DEFAULT));
}

export function writeOrderTimeoutReminderMinutes(minutes: number): void {
  const value = clampMinutes(minutes);
  const config = readOrderTimeoutByLine();
  let changed = false;
  for (const id of ALL_LINE_IDS) {
    if (config[id].enabled) {
      config[id] = { ...config[id], minutes: value };
      changed = true;
    }
  }
  if (changed) {
    writeOrderTimeoutByLine(config);
    return;
  }
  writeModuleSettingNumber(ORDER_TIMEOUT_REMINDER_FIELD_ID, value);
}

function syncMinutesInputDisabled(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLInputElement>("[data-order-timeout-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-order-timeout-line-enabled");
    if (!lineId) return;
    const input = editor.querySelector<HTMLInputElement>(
      `[data-order-timeout-line-minutes="${lineId}"]`,
    );
    if (!input) return;
    input.disabled = !checkbox.checked;
  });
}

function collectFromEditor(editor: HTMLElement): void {
  const config = readOrderTimeoutByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-order-timeout-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-order-timeout-line-enabled");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as OrderTimeoutProductLineId)) return;
    config[lineId as OrderTimeoutProductLineId].enabled = checkbox.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-order-timeout-line-minutes]").forEach((input) => {
    const lineId = input.getAttribute("data-order-timeout-line-minutes");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as OrderTimeoutProductLineId)) return;
    config[lineId as OrderTimeoutProductLineId].minutes = clampMinutes(input.value);
  });
  writeOrderTimeoutByLine(config);
  syncMinutesInputDisabled(editor);
}

function renderByLineEditorHtml(): string {
  const config = readOrderTimeoutByLine();
  const rows = ORDER_TIMEOUT_PRODUCT_LINES.map((line) => {
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
            data-order-timeout-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用点单超时提醒"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputmode="numeric"
            class="${NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(item.minutes))}"
            min="${MINUTES_MIN}"
            max="${MINUTES_MAX}"
            step="1"
            data-order-timeout-line-minutes="${escapeHtml(line.id)}"
            ${item.enabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 点单超时提醒分钟数"
          />
          <span class="text-xs text-muted-foreground">分钟（${MINUTES_MIN}–${MINUTES_MAX}）</span>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-order-timeout-by-line-editor="${ORDER_TIMEOUT_REMINDER_SEQ}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">超时提醒</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderOrderTimeoutReminderControl(): string {
  return renderOrderTimeoutReminderPanelHtml();
}

export function renderOrderTimeoutReminderPanelHtml(): string {
  return `
    <div class="mt-3 space-y-4" data-order-timeout-reminder-panel="${ORDER_TIMEOUT_REMINDER_SEQ}">
      ${renderByLineEditorHtml()}
    </div>`;
}

export function bindOrderTimeoutReminderUi(root: ParentNode = document): void {
  ensureMigrated();
  root.querySelectorAll<HTMLElement>("[data-order-timeout-by-line-editor]").forEach((editor) => {
    if (editor.dataset.orderTimeoutByLineEditorBound === "1") return;
    editor.dataset.orderTimeoutByLineEditorBound = "1";
    syncMinutesInputDisabled(editor);
    const persist = () => collectFromEditor(editor);
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.matches("[data-order-timeout-line-enabled]") ||
        target.matches("[data-order-timeout-line-minutes]")
      ) {
        persist();
      }
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-order-timeout-line-minutes]")) persist();
    });
  });
}
