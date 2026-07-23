/**
 * 前厅 · 食客下单限流：seq 588 订单下单时间间隔（按产线启用 + 各自间隔秒数）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES,
  normalizeMenuOrderLimitOtherProductLineIds,
  type MenuOrderLimitOtherProductLineId,
} from "./menu-order-limit-product-lines";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_ORDER_PLACE_INTERVAL_SEQ = 588;

const LINES_STORAGE_ID = "588-order-place-interval-lines";
/** @deprecated 旧版全局秒数；迁移后由按产线配置同步首个启用产线的值 */
export const GUEST_ORDER_PLACE_INTERVAL_FIELD_ID = "588-order-place-interval-seconds";
export const GUEST_ORDER_PLACE_INTERVAL_BY_LINE_FIELD_ID = "588-order-place-interval-by-line";

export const GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES = MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES;

export type GuestOrderPlaceIntervalProductLineId = MenuOrderLimitOtherProductLineId;

export type GuestOrderPlaceIntervalLineConfig = {
  enabled: boolean;
  seconds: number;
};

export type GuestOrderPlaceIntervalByLine = Record<
  GuestOrderPlaceIntervalProductLineId,
  GuestOrderPlaceIntervalLineConfig
>;

const ALL_LINE_IDS: GuestOrderPlaceIntervalProductLineId[] = [
  ...MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
];

const INTERVAL_DEFAULT = 60;
const INTERVAL_MIN = 0;
const INTERVAL_MAX = 3600;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;
let byLineMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clampSeconds(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return INTERVAL_DEFAULT;
  return Math.min(INTERVAL_MAX, Math.max(INTERVAL_MIN, Math.round(n)));
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_ORDER_PLACE_INTERVAL_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestOrderPlaceIntervalToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_ORDER_PLACE_INTERVAL_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_ORDER_PLACE_INTERVAL_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function defaultLineConfig(enabled = true): GuestOrderPlaceIntervalLineConfig {
  return { enabled, seconds: INTERVAL_DEFAULT };
}

function defaultByLineConfig(enabled = true): GuestOrderPlaceIntervalByLine {
  return Object.fromEntries(
    GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(enabled)]),
  ) as GuestOrderPlaceIntervalByLine;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<GuestOrderPlaceIntervalLineConfig>>>,
): GuestOrderPlaceIntervalByLine {
  const base = defaultByLineConfig(false);
  for (const line of GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      seconds: clampSeconds(item.seconds ?? base[line.id].seconds),
    };
  }
  return base;
}

function syncLegacyFields(config: GuestOrderPlaceIntervalByLine): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(LINES_STORAGE_ID, enabledLines);
  const firstEnabled = GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingNumber(GUEST_ORDER_PLACE_INTERVAL_FIELD_ID, config[firstEnabled.id].seconds);
  }
}

function hasStoredKey(storageId: string): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(storageId)) !== null;
  } catch {
    return false;
  }
}

export function ensureGuestOrderPlaceIntervalByLineMigrated(): void {
  if (byLineMigrated) return;
  byLineMigrated = true;
  ensureGuestOrderPlaceIntervalToggleMigrated();

  const raw = readModuleSettingJson<Partial<Record<string, Partial<GuestOrderPlaceIntervalLineConfig>>>>(
    GUEST_ORDER_PLACE_INTERVAL_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeGuestOrderPlaceIntervalByLine(normalizeByLineConfig(raw));
    return;
  }

  const hasLegacySeconds = hasStoredKey(GUEST_ORDER_PLACE_INTERVAL_FIELD_ID);
  const hasLegacyLines = hasStoredKey(LINES_STORAGE_ID);
  const toggleOn = readLegacyToggleOn();

  if (!hasLegacySeconds && !hasLegacyLines && !toggleOn) {
    writeGuestOrderPlaceIntervalByLine(defaultByLineConfig(true));
    return;
  }

  const secondsLegacy = clampSeconds(
    readModuleSettingNumber(GUEST_ORDER_PLACE_INTERVAL_FIELD_ID, INTERVAL_DEFAULT),
  );
  const linesLegacy = normalizeMenuOrderLimitOtherProductLineIds(
    readModuleSettingJson<unknown>(LINES_STORAGE_ID, null),
  );
  const selected =
    linesLegacy.length > 0
      ? new Set(linesLegacy)
      : toggleOn || hasLegacySeconds
        ? new Set(ALL_LINE_IDS)
        : new Set<GuestOrderPlaceIntervalProductLineId>();

  const config = defaultByLineConfig(false);
  for (const line of GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES) {
    config[line.id] = {
      enabled: selected.has(line.id),
      seconds: secondsLegacy,
    };
  }
  writeGuestOrderPlaceIntervalByLine(config);
}

export function readGuestOrderPlaceIntervalByLine(): GuestOrderPlaceIntervalByLine {
  ensureGuestOrderPlaceIntervalByLineMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<GuestOrderPlaceIntervalLineConfig>>>>(
    GUEST_ORDER_PLACE_INTERVAL_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLineConfig(raw);
  }
  return defaultByLineConfig(true);
}

export function writeGuestOrderPlaceIntervalByLine(config: GuestOrderPlaceIntervalByLine): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(GUEST_ORDER_PLACE_INTERVAL_BY_LINE_FIELD_ID, normalized);
  syncLegacyFields(normalized);
}

export function readGuestOrderPlaceIntervalLines(): GuestOrderPlaceIntervalProductLineId[] {
  return ALL_LINE_IDS.filter((id) => readGuestOrderPlaceIntervalByLine()[id].enabled);
}

export function writeGuestOrderPlaceIntervalLines(lines: GuestOrderPlaceIntervalProductLineId[]): void {
  const selected = new Set(ALL_LINE_IDS.filter((id) => lines.includes(id)));
  const config = readGuestOrderPlaceIntervalByLine();
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeGuestOrderPlaceIntervalByLine(config);
}

export function readGuestOrderPlaceIntervalSecondsForLine(
  lineId: GuestOrderPlaceIntervalProductLineId,
): number {
  return readGuestOrderPlaceIntervalByLine()[lineId]?.seconds ?? INTERVAL_DEFAULT;
}

export function writeGuestOrderPlaceIntervalSecondsForLine(
  lineId: GuestOrderPlaceIntervalProductLineId,
  seconds: number,
): void {
  if (!ALL_LINE_IDS.includes(lineId)) return;
  const config = readGuestOrderPlaceIntervalByLine();
  config[lineId] = { ...config[lineId], seconds: clampSeconds(seconds) };
  writeGuestOrderPlaceIntervalByLine(config);
}

/** @deprecated 旧版全局秒数；返回首个启用产线的间隔，若无启用则返回默认值 */
export function readGuestOrderPlaceIntervalSeconds(): number {
  const config = readGuestOrderPlaceIntervalByLine();
  const firstEnabled = GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) return config[firstEnabled.id].seconds;
  return INTERVAL_DEFAULT;
}

/** @deprecated 旧版全局秒数；写入所有启用产线（无启用时写入全部产线） */
export function writeGuestOrderPlaceIntervalSeconds(seconds: number): void {
  const value = clampSeconds(seconds);
  const config = readGuestOrderPlaceIntervalByLine();
  const enabledIds = ALL_LINE_IDS.filter((id) => config[id].enabled);
  const targets = enabledIds.length > 0 ? enabledIds : ALL_LINE_IDS;
  for (const id of targets) {
    config[id] = { ...config[id], seconds: value };
  }
  writeGuestOrderPlaceIntervalByLine(config);
}

export function isGuestOrderPlaceIntervalSeq(seq: number): boolean {
  return seq === GUEST_ORDER_PLACE_INTERVAL_SEQ;
}

function syncSecondsInputDisabled(editor: HTMLElement, panelEnabled: boolean): void {
  editor.querySelectorAll<HTMLInputElement>("[data-guest-order-place-interval-line-enabled]").forEach((cb) => {
    const lineId = cb.getAttribute("data-guest-order-place-interval-line-enabled");
    if (!lineId) return;
    const secondsInput = editor.querySelector<HTMLInputElement>(
      `[data-guest-order-place-interval-line-seconds="${CSS.escape(lineId)}"]`,
    );
    if (!secondsInput) return;
    secondsInput.disabled = !panelEnabled || !cb.checked;
  });
}

function collectByLineFromEditor(editor: HTMLElement): GuestOrderPlaceIntervalByLine {
  const config = defaultByLineConfig(false);
  editor.querySelectorAll<HTMLInputElement>("[data-guest-order-place-interval-line-enabled]").forEach((cb) => {
    const lineId = cb.getAttribute(
      "data-guest-order-place-interval-line-enabled",
    ) as GuestOrderPlaceIntervalProductLineId | null;
    if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;
    config[lineId].enabled = cb.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-guest-order-place-interval-line-seconds]").forEach((input) => {
    const lineId = input.getAttribute(
      "data-guest-order-place-interval-line-seconds",
    ) as GuestOrderPlaceIntervalProductLineId | null;
    if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;
    config[lineId].seconds = clampSeconds(input.value);
  });
  writeGuestOrderPlaceIntervalByLine(config);
  syncSecondsInputDisabled(editor, true);
  return config;
}

function renderByLineEditorHtml(enabled: boolean): string {
  const config = readGuestOrderPlaceIntervalByLine();
  const rows = GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-middle whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-middle">
        <label class="inline-flex ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} items-center gap-2">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
            ${item.enabled ? "checked" : ""}
            ${enabled ? "" : "disabled"}
            data-guest-order-place-interval-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用订单下单时间间隔"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputmode="numeric"
            class="${NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(item.seconds))}"
            min="${INTERVAL_MIN}"
            max="${INTERVAL_MAX}"
            step="1"
            data-guest-order-place-interval-line-seconds="${escapeHtml(line.id)}"
            ${enabled && item.enabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 订单下单最小时间间隔"
          />
          <span class="text-xs text-muted-foreground">秒（${INTERVAL_MIN}–${INTERVAL_MAX}，小于间隔时需服务员授权）</span>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div
      data-guest-order-place-interval-by-line-editor="${GUEST_ORDER_PLACE_INTERVAL_SEQ}"
      class="space-y-2"
    >
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">最小间隔</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderGuestOrderPlaceIntervalPanelHtml(on: boolean): string {
  ensureGuestOrderPlaceIntervalByLineMigrated();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 space-y-4 ${hidden}"
      data-guest-order-place-interval-panel="${GUEST_ORDER_PLACE_INTERVAL_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderByLineEditorHtml(on)}
    </div>`;
}

export function setGuestOrderPlaceIntervalPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-guest-order-place-interval-panel="${GUEST_ORDER_PLACE_INTERVAL_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-guest-order-place-interval-line-enabled]")
        .forEach((input) => {
          input.disabled = !visible;
          const label = input.closest("label");
          if (label) {
            label.classList.toggle("cursor-not-allowed", !visible);
            label.classList.toggle("opacity-50", !visible);
            label.classList.toggle("cursor-pointer", visible);
          }
        });

      const editor = panel.querySelector<HTMLElement>("[data-guest-order-place-interval-by-line-editor]");
      if (editor) syncSecondsInputDisabled(editor, visible);
    });
}

export function bindGuestOrderPlaceIntervalUi(root: ParentNode = document): void {
  ensureGuestOrderPlaceIntervalByLineMigrated();

  root
    .querySelectorAll<HTMLElement>("[data-guest-order-place-interval-by-line-editor]")
    .forEach((editor) => {
      if (editor.dataset.guestOrderPlaceIntervalByLineBound === "1") return;
      editor.dataset.guestOrderPlaceIntervalByLineBound = "1";

      syncSecondsInputDisabled(editor, true);

      const persist = () => collectByLineFromEditor(editor);
      editor.addEventListener("change", (e) => {
        const target = e.target as HTMLElement;
        if (
          !target.matches(
            "[data-guest-order-place-interval-line-enabled], [data-guest-order-place-interval-line-seconds]",
          )
        ) {
          return;
        }
        persist();
      });
      editor.addEventListener("blur", (e) => {
        const target = e.target as HTMLElement;
        if (!target.matches("[data-guest-order-place-interval-line-seconds]")) return;
        persist();
      }, true);
    });
}
