/**
 * 前厅 · 食客下单限流：seq 588 订单下单时间间隔（主开关 + 间隔秒数 + eMenu/SDI 产线多选）。
 */

import {
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_ORDER_PLACE_INTERVAL_SEQ = 588;

const LINES_STORAGE_ID = "588-order-place-interval-lines";
export const GUEST_ORDER_PLACE_INTERVAL_FIELD_ID = "588-order-place-interval-seconds";

export const GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestOrderPlaceIntervalProductLineId =
  (typeof GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestOrderPlaceIntervalProductLineId[] =
  GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES.map((l) => l.id);

const INTERVAL_DEFAULT = 60;
const INTERVAL_MIN = 0;
const INTERVAL_MAX = 3600;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function normalizeLineIds(raw: unknown): GuestOrderPlaceIntervalProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestOrderPlaceIntervalProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readGuestOrderPlaceIntervalLines(): GuestOrderPlaceIntervalProductLineId[] {
  ensureGuestOrderPlaceIntervalToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeGuestOrderPlaceIntervalLines(all);
    return all;
  }
  return [];
}

export function writeGuestOrderPlaceIntervalLines(lines: GuestOrderPlaceIntervalProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function readGuestOrderPlaceIntervalSeconds(): number {
  let stored = readModuleSettingNumber(GUEST_ORDER_PLACE_INTERVAL_FIELD_ID, INTERVAL_DEFAULT);
  if (!Number.isFinite(stored) && readLegacyToggleOn()) {
    stored = INTERVAL_DEFAULT;
    writeGuestOrderPlaceIntervalSeconds(stored);
  }
  if (!Number.isFinite(stored)) return INTERVAL_DEFAULT;
  return Math.min(INTERVAL_MAX, Math.max(INTERVAL_MIN, Math.round(stored)));
}

export function writeGuestOrderPlaceIntervalSeconds(seconds: number): void {
  const value = Math.min(INTERVAL_MAX, Math.max(INTERVAL_MIN, Math.round(seconds)));
  writeModuleSettingNumber(GUEST_ORDER_PLACE_INTERVAL_FIELD_ID, value);
}

export function isGuestOrderPlaceIntervalSeq(seq: number): boolean {
  return seq === GUEST_ORDER_PLACE_INTERVAL_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestOrderPlaceIntervalLines());
  const cells = GUEST_ORDER_PLACE_INTERVAL_PRODUCT_LINES.map((line, index) => {
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
          data-guest-order-place-interval-line="${escapeHtml(line.id)}"
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
      data-guest-order-place-interval-lines="${GUEST_ORDER_PLACE_INTERVAL_SEQ}"
      role="group"
      aria-label="订单下单时间间隔适用产线"
    >
      ${cells}
    </div>`;
}

function renderIntervalInputHtml(enabled: boolean): string {
  const value = readGuestOrderPlaceIntervalSeconds();
  return `
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted-foreground">最小间隔</span>
      <input
        type="number"
        inputmode="numeric"
        class="${NUMBER_INPUT_CLASS}"
        value="${escapeHtml(String(value))}"
        min="${INTERVAL_MIN}"
        max="${INTERVAL_MAX}"
        step="1"
        data-guest-order-place-interval-seconds="${GUEST_ORDER_PLACE_INTERVAL_SEQ}"
        ${enabled ? "" : "disabled"}
        aria-label="订单下单最小时间间隔"
      />
      <span class="text-sm text-muted-foreground">秒</span>
      <span class="text-xs text-muted-foreground">（${INTERVAL_MIN}–${INTERVAL_MAX}，小于间隔时需服务员授权）</span>
    </div>`;
}

export function renderGuestOrderPlaceIntervalPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 space-y-4 ${hidden}"
      data-guest-order-place-interval-panel="${GUEST_ORDER_PLACE_INTERVAL_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">时间间隔</p>
        ${renderIntervalInputHtml(on)}
      </div>
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
        ${renderLinesMultiselectHtml(on)}
      </div>
    </div>`;
}

export function setGuestOrderPlaceIntervalPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-guest-order-place-interval-panel="${GUEST_ORDER_PLACE_INTERVAL_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectLinesFromGroup(group: HTMLElement): GuestOrderPlaceIntervalProductLineId[] {
  const lines: GuestOrderPlaceIntervalProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-order-place-interval-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-order-place-interval-line");
    if (id && ALL_LINE_IDS.includes(id as GuestOrderPlaceIntervalProductLineId)) {
      lines.push(id as GuestOrderPlaceIntervalProductLineId);
    }
  });
  writeGuestOrderPlaceIntervalLines(lines);
  return lines;
}

export function bindGuestOrderPlaceIntervalUi(root: ParentNode = document): void {
  ensureGuestOrderPlaceIntervalToggleMigrated();

  root.querySelectorAll<HTMLInputElement>("[data-guest-order-place-interval-seconds]").forEach((input) => {
    if (input.dataset.guestOrderPlaceIntervalSecondsBound === "1") return;
    input.dataset.guestOrderPlaceIntervalSecondsBound = "1";
    const persist = () => {
      const n = Number(input.value);
      if (Number.isFinite(n)) writeGuestOrderPlaceIntervalSeconds(n);
    };
    input.addEventListener("change", persist);
    input.addEventListener("blur", persist);
  });

  root.querySelectorAll<HTMLElement>("[data-guest-order-place-interval-lines]").forEach((group) => {
    if (group.dataset.guestOrderPlaceIntervalLinesBound === "1") return;
    group.dataset.guestOrderPlaceIntervalLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-order-place-interval-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
