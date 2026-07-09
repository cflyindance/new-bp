/**
 * 门店管理 · 营业与运营：seq 582 营业时间即将结束提示（主开关 + 各产线独立提前分钟数）。
 */

import {
  moduleSettingStorageKey,
  readModuleSettingCheckbox,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingCheckbox,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";

export const STORE_CLOSING_ALERT_SEQ = 582;

const BY_LINE_STORAGE_ID = "582-closing-alert-by-line";
const LEGACY_MINUTES_FIELD_ID = "582-alert-minutes";

const MINUTES_MIN = 1;
const MINUTES_MAX = 180;
const MINUTES_DEFAULT = 15;

const CHECKBOX_CLASS =
  "size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const NUMBER_INPUT_CLASS =
  "h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export const STORE_CLOSING_ALERT_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk", legacyCheckboxFieldId: "582-c-line-kiosk", defaultChecked: true },
  { id: "emenu", label: "eMenu", legacyCheckboxFieldId: "582-c-line-emenu", defaultChecked: true },
  { id: "sdi", label: "SDI", legacyCheckboxFieldId: "582-c-line-sdi", defaultChecked: true },
] as const;

export type StoreClosingAlertProductLineId = (typeof STORE_CLOSING_ALERT_PRODUCT_LINES)[number]["id"];

export type StoreClosingAlertLineConfig = {
  enabled: boolean;
  minutes: number;
};

const ALL_LINE_IDS: StoreClosingAlertProductLineId[] = STORE_CLOSING_ALERT_PRODUCT_LINES.map((l) => l.id);

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

function defaultLineConfig(enabled: boolean): StoreClosingAlertLineConfig {
  return { enabled, minutes: MINUTES_DEFAULT };
}

function defaultByLineConfig(): Record<StoreClosingAlertProductLineId, StoreClosingAlertLineConfig> {
  return Object.fromEntries(
    STORE_CLOSING_ALERT_PRODUCT_LINES.map((line) => [
      line.id,
      defaultLineConfig(line.defaultChecked),
    ]),
  ) as Record<StoreClosingAlertProductLineId, StoreClosingAlertLineConfig>;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<StoreClosingAlertLineConfig>>>,
): Record<StoreClosingAlertProductLineId, StoreClosingAlertLineConfig> {
  const base = defaultByLineConfig();
  for (const line of STORE_CLOSING_ALERT_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      minutes: clampMinutes(item.minutes ?? base[line.id].minutes),
    };
  }
  return base;
}

function syncLegacyFields(config: Record<StoreClosingAlertProductLineId, StoreClosingAlertLineConfig>): void {
  for (const line of STORE_CLOSING_ALERT_PRODUCT_LINES) {
    writeModuleSettingCheckbox(line.legacyCheckboxFieldId, config[line.id].enabled);
  }
  const firstEnabled = STORE_CLOSING_ALERT_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingNumber(LEGACY_MINUTES_FIELD_ID, config[firstEnabled.id].minutes);
  }
}

function ensureStoreClosingAlertMigrated(): void {
  if (migrated) return;
  migrated = true;

  const raw = readModuleSettingJson<Partial<Record<string, Partial<StoreClosingAlertLineConfig>>>>(
    BY_LINE_STORAGE_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    const normalized = normalizeByLineConfig(raw);
    writeStoreClosingAlertByLine(normalized);
    return;
  }

  const legacyMinutes = readModuleSettingNumber(LEGACY_MINUTES_FIELD_ID, MINUTES_DEFAULT);
  const safeMinutes = clampMinutes(legacyMinutes);
  const hasLegacyCheckbox = STORE_CLOSING_ALERT_PRODUCT_LINES.some((line) => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(line.legacyCheckboxFieldId)) !== null;
    } catch {
      return false;
    }
  });
  const hasLegacyMinutes = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(LEGACY_MINUTES_FIELD_ID)) !== null;
    } catch {
      return false;
    }
  })();

  if (!hasLegacyCheckbox && !hasLegacyMinutes) return;

  const config = defaultByLineConfig();
  for (const line of STORE_CLOSING_ALERT_PRODUCT_LINES) {
    const enabled = readModuleSettingCheckbox(line.legacyCheckboxFieldId, line.defaultChecked);
    config[line.id] = { enabled, minutes: safeMinutes };
  }
  writeStoreClosingAlertByLine(config);
}

export function readStoreClosingAlertByLine(): Record<
  StoreClosingAlertProductLineId,
  StoreClosingAlertLineConfig
> {
  ensureStoreClosingAlertMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<StoreClosingAlertLineConfig>>>>(
    BY_LINE_STORAGE_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLineConfig(raw);
  }
  return defaultByLineConfig();
}

export function writeStoreClosingAlertByLine(
  config: Record<StoreClosingAlertProductLineId, StoreClosingAlertLineConfig>,
): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(BY_LINE_STORAGE_ID, normalized);
  syncLegacyFields(normalized);
}

export function isStoreClosingAlertSeq(seq: number): boolean {
  return seq === STORE_CLOSING_ALERT_SEQ;
}

function renderByLineEditorHtml(enabled: boolean): string {
  const config = readStoreClosingAlertByLine();
  const rows = STORE_CLOSING_ALERT_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    const rowEnabled = enabled && item.enabled;
    return `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-middle whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-middle">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="${CHECKBOX_CLASS}"
            ${item.enabled ? "checked" : ""}
            data-store-closing-alert-line-enabled="${escapeHtml(line.id)}"
            ${enabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 启用提示"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground">结束前</span>
          <input
            type="number"
            inputmode="numeric"
            class="${NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(item.minutes))}"
            min="${MINUTES_MIN}"
            max="${MINUTES_MAX}"
            step="1"
            data-store-closing-alert-line-minutes="${escapeHtml(line.id)}"
            ${rowEnabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 提前提示分钟数"
          />
          <span class="text-xs text-muted-foreground">分钟</span>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-store-closing-alert-by-line-editor="${STORE_CLOSING_ALERT_SEQ}" class="space-y-2">
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">为各产线分别设置营业结束前的提前提示时间；取消勾选表示该产线不提示。</p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">提前提示</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderStoreClosingAlertPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div class="mt-3 rounded-lg bg-muted/50 p-3 ${hidden}" data-store-closing-alert-panel="${seq}" ${on ? "" : 'aria-hidden="true"'}>
      ${renderByLineEditorHtml(on)}
    </div>`;
}

function syncMinutesInputDisabled(editor: HTMLElement): void {
  const panelEnabled = !editor.closest<HTMLElement>("[data-store-closing-alert-panel]")?.classList.contains("hidden");
  editor.querySelectorAll<HTMLInputElement>("[data-store-closing-alert-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-store-closing-alert-line-enabled");
    if (!lineId) return;
    const minutes = editor.querySelector<HTMLInputElement>(
      `[data-store-closing-alert-line-minutes="${lineId}"]`,
    );
    if (!minutes) return;
    minutes.disabled = !panelEnabled || !checkbox.checked;
  });
}

export function setStoreClosingAlertPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-store-closing-alert-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>(
      "[data-store-closing-alert-line-enabled], [data-store-closing-alert-line-minutes]",
    ).forEach((input) => {
      if (input.hasAttribute("data-store-closing-alert-line-enabled")) {
        input.disabled = !visible;
      }
    });
    panel.querySelectorAll<HTMLElement>("[data-store-closing-alert-by-line-editor]").forEach((editor) => {
      syncMinutesInputDisabled(editor);
    });
  });
}

function collectFromEditor(editor: HTMLElement): void {
  const config = readStoreClosingAlertByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-store-closing-alert-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-store-closing-alert-line-enabled");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as StoreClosingAlertProductLineId)) return;
    config[lineId as StoreClosingAlertProductLineId].enabled = checkbox.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-store-closing-alert-line-minutes]").forEach((input) => {
    const lineId = input.getAttribute("data-store-closing-alert-line-minutes");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as StoreClosingAlertProductLineId)) return;
    config[lineId as StoreClosingAlertProductLineId].minutes = clampMinutes(input.value);
  });
  writeStoreClosingAlertByLine(config);
  syncMinutesInputDisabled(editor);
}

export function bindStoreClosingAlertUi(root: ParentNode = document): void {
  ensureStoreClosingAlertMigrated();
  root.querySelectorAll<HTMLElement>("[data-store-closing-alert-by-line-editor]").forEach((editor) => {
    if (editor.dataset.storeClosingAlertByLineEditorBound === "1") return;
    editor.dataset.storeClosingAlertByLineEditorBound = "1";

    syncMinutesInputDisabled(editor);

    const persist = () => collectFromEditor(editor);
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.matches("[data-store-closing-alert-line-enabled]") ||
        target.matches("[data-store-closing-alert-line-minutes]")
      ) {
        persist();
      }
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-store-closing-alert-line-minutes]")) persist();
    });
  });
}
