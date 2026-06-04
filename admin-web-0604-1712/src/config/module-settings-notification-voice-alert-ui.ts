/**
 * 消息中心 · 语音提醒：新单（seq 332）— 适用产线多选。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const NOTIFICATION_VOICE_ALERT_SEQ = 332;

const VOICE_ALERT_LINES_STORAGE_ID = "332-voice-alert-product-lines";

export const VOICE_ALERT_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type VoiceAlertProductLineId = (typeof VOICE_ALERT_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: VoiceAlertProductLineId[] = VOICE_ALERT_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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

function normalizeLineIds(raw: unknown): VoiceAlertProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is VoiceAlertProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readVoiceAlertProductLines(): VoiceAlertProductLineId[] {
  const stored = readModuleSettingJson<unknown>(VOICE_ALERT_LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(NOTIFICATION_VOICE_ALERT_SEQ)) {
    writeVoiceAlertProductLines([...ALL_LINE_IDS]);
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function writeVoiceAlertProductLines(lines: VoiceAlertProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(VOICE_ALERT_LINES_STORAGE_ID, unique);
}

export function isNotificationVoiceAlertSeq(seq: number): boolean {
  return seq === NOTIFICATION_VOICE_ALERT_SEQ;
}

export function renderNotificationVoiceAlertByLineHtml(): string {
  const selected = new Set(readVoiceAlertProductLines());
  const cells = VOICE_ALERT_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-voice-alert-product-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-3xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-voice-alert-by-line="${NOTIFICATION_VOICE_ALERT_SEQ}"
      role="group"
      aria-label="语音提醒：新单适用产线"
    >
      ${cells}
    </div>`;
}

function collectVoiceAlertLines(group: HTMLElement): VoiceAlertProductLineId[] {
  const lines: VoiceAlertProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-voice-alert-product-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-voice-alert-product-line");
    if (id && ALL_LINE_IDS.includes(id as VoiceAlertProductLineId)) {
      lines.push(id as VoiceAlertProductLineId);
    }
  });
  writeVoiceAlertProductLines(lines);
  return lines;
}

export function bindNotificationVoiceAlertUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-voice-alert-by-line]").forEach((group) => {
    if (group.dataset.voiceAlertBound === "1") return;
    group.dataset.voiceAlertBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-voice-alert-product-line]")) return;
      collectVoiceAlertLines(group);
    });
  });
}
