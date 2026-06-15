/**
 * 消息中心 · 员工订单消息（637/638/639）— 适用产线多选（各 seq 可选集不同）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";
import {
  VOICE_ALERT_PRODUCT_LINES,
  type VoiceAlertProductLineId,
} from "./module-settings-notification-voice-alert-ui";

export const STAFF_ORDER_ALERT_NEW_ORDER_SEQ = 638;
export const STAFF_ORDER_ALERT_APPEND_SEQ = 639;
export const STAFF_ORDER_ALERT_CUSTOM_MENU_SEQ = 637;

export const STAFF_ORDER_ALERT_SEQS: readonly number[] = [
  STAFF_ORDER_ALERT_NEW_ORDER_SEQ,
  STAFF_ORDER_ALERT_APPEND_SEQ,
  STAFF_ORDER_ALERT_CUSTOM_MENU_SEQ,
];

export type StaffOrderAlertProductLineId = VoiceAlertProductLineId;

/** 新订单店内提醒、指定菜品下单提醒：不含 POS / POS GO / PayPad */
const NEW_ORDER_AND_CUSTOM_MENU_LINE_IDS: StaffOrderAlertProductLineId[] = [
  "kiosk",
  "emenu",
  "sdi",
  "online-order",
];

/** 追单店内提醒：仅 eMenu、SDI */
const APPEND_ORDER_LINE_IDS: StaffOrderAlertProductLineId[] = ["emenu", "sdi"];

const STAFF_ALERT_LINE_IDS_BY_SEQ: Record<number, readonly StaffOrderAlertProductLineId[]> = {
  [STAFF_ORDER_ALERT_NEW_ORDER_SEQ]: NEW_ORDER_AND_CUSTOM_MENU_LINE_IDS,
  [STAFF_ORDER_ALERT_CUSTOM_MENU_SEQ]: NEW_ORDER_AND_CUSTOM_MENU_LINE_IDS,
  [STAFF_ORDER_ALERT_APPEND_SEQ]: APPEND_ORDER_LINE_IDS,
};

const LINE_BY_ID = new Map(VOICE_ALERT_PRODUCT_LINES.map((l) => [l.id, l]));

function getAllowedLineIds(seq: number): readonly StaffOrderAlertProductLineId[] {
  return STAFF_ALERT_LINE_IDS_BY_SEQ[seq] ?? [];
}

export function getStaffAlertProductLinesForSeq(
  seq: number,
): ReadonlyArray<{ id: StaffOrderAlertProductLineId; label: string }> {
  return getAllowedLineIds(seq)
    .map((id) => LINE_BY_ID.get(id))
    .filter((l): l is (typeof VOICE_ALERT_PRODUCT_LINES)[number] => l != null);
}

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function staffAlertLinesStorageId(seq: number): string {
  return `${seq}-staff-alert-product-lines`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function normalizeLineIds(seq: number, raw: unknown): StaffOrderAlertProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(getAllowedLineIds(seq));
  return raw.filter(
    (id): id is StaffOrderAlertProductLineId => typeof id === "string" && valid.has(id),
  );
}

function defaultLinesForLegacyToggle(seq: number): StaffOrderAlertProductLineId[] {
  const allowed = getAllowedLineIds(seq);
  if (allowed.includes("emenu")) return ["emenu"];
  return allowed.length ? [allowed[0]] : [];
}

export function readStaffOrderAlertProductLines(seq: number): StaffOrderAlertProductLineId[] {
  const stored = readModuleSettingJson<unknown>(staffAlertLinesStorageId(seq), null);
  const normalized = normalizeLineIds(seq, stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const legacy = defaultLinesForLegacyToggle(seq);
    writeStaffOrderAlertProductLines(seq, legacy);
    return legacy;
  }
  return [];
}

export function writeStaffOrderAlertProductLines(
  seq: number,
  lines: StaffOrderAlertProductLineId[],
): void {
  const allowed = getAllowedLineIds(seq);
  const unique = allowed.filter((id) => lines.includes(id));
  writeModuleSettingJson(staffAlertLinesStorageId(seq), unique);
}

export function isStaffOrderAlertSeq(seq: number): boolean {
  return (STAFF_ORDER_ALERT_SEQS as readonly number[]).includes(seq);
}

const migratedToggleSeqs = new Set<number>();

function hasStoredStaffAlertLines(seq: number): boolean {
  const stored = readModuleSettingJson<unknown>(staffAlertLinesStorageId(seq), null);
  return normalizeLineIds(seq, stored).length > 0;
}

export function ensureStaffOrderAlertToggleMigrated(seq: number): void {
  if (!isStaffOrderAlertSeq(seq)) return;
  if (migratedToggleSeqs.has(seq)) return;
  migratedToggleSeqs.add(seq);
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(seq)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (hasStoredStaffAlertLines(seq) || readLegacyToggleOn(seq)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), "1");
    } catch {
      /* ignore */
    }
  }
}

function ensureAllStaffOrderAlertTogglesMigrated(): void {
  for (const seq of STAFF_ORDER_ALERT_SEQS) {
    ensureStaffOrderAlertToggleMigrated(seq);
  }
}

const PANEL_HINT_BY_SEQ: Record<number, string> = {
  [STAFF_ORDER_ALERT_NEW_ORDER_SEQ]:
    "勾选产线后，该产线有新订单进入店内时向员工发送消息提醒（不发顾客短信）。",
  [STAFF_ORDER_ALERT_APPEND_SEQ]:
    "勾选产线后，该产线在追单/加菜时向员工发送消息提醒（不发顾客短信）。",
  [STAFF_ORDER_ALERT_CUSTOM_MENU_SEQ]:
    "勾选产线后，订单含指定菜品时向员工发送消息提醒；指定菜品列表配置见业务规则（原型待接）。",
};

function renderStaffOrderAlertByLineHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readStaffOrderAlertProductLines(seq));
  const lines = getStaffAlertProductLinesForSeq(seq);
  const cells = lines.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-staff-alert-product-line="${escapeHtml(line.id)}"
          data-staff-alert-seq="${seq}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-3xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-staff-alert-by-line="${seq}"
      role="group"
      aria-label="适用产线"
    >
      ${cells}
    </div>`;
}

export function renderStaffOrderAlertPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  const hint = PANEL_HINT_BY_SEQ[seq] ?? "";
  return `
    <div
      class="mt-3 ${hidden}"
      data-staff-alert-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderStaffOrderAlertByLineHtml(seq, on)}
      ${hint ? `<p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(hint)}</p>` : ""}
    </div>`;
}

export function setStaffOrderAlertPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-staff-alert-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-staff-alert-product-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectStaffAlertLines(group: HTMLElement, seq: number): void {
  const allowed = new Set(getAllowedLineIds(seq));
  const lines: StaffOrderAlertProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-staff-alert-product-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-staff-alert-product-line");
    if (id && allowed.has(id as StaffOrderAlertProductLineId)) {
      lines.push(id as StaffOrderAlertProductLineId);
    }
  });
  writeStaffOrderAlertProductLines(seq, lines);
}

export function bindStaffOrderAlertUi(root: ParentNode = document): void {
  ensureAllStaffOrderAlertTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-staff-alert-by-line]").forEach((group) => {
    if (group.dataset.staffAlertBound === "1") return;
    group.dataset.staffAlertBound = "1";
    const seq = Number(group.getAttribute("data-staff-alert-by-line"));
    if (!isStaffOrderAlertSeq(seq)) return;
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-staff-alert-product-line]")) return;
      collectStaffAlertLines(group, seq);
    });
  });
}
