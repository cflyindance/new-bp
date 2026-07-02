/**
 * 预约等位 · 等位排队规则（seq 12–14、529）。
 * 529 主开关 + 产线多选；12 开关；13 团体人数（文本）；14 团体代号（单选）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { renderModuleSettingSingleChoiceHtml } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  readModuleSettingRadio,
  readModuleSettingText,
  writeModuleSettingJson,
  writeModuleSettingRadio,
  writeModuleSettingText,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const WAITLIST_MODE_SEQ = 529;
export const WAITLIST_SPLIT_BY_PARTY_SIZE_SEQ = 12;
export const WAITLIST_PARTY_SIZE_OPTIONS_SEQ = 13;
export const WAITLIST_PARTY_IDENTIFIER_SEQ = 14;

/** 等位取号可触达产线（529 主开关 + 多选） */
export const WAITLIST_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "pos", label: "POS" },
] as const;

export type WaitlistProductLineId = (typeof WAITLIST_PRODUCT_LINES)[number]["id"];

const WAITLIST_MODE_LINES_STORAGE_ID = "529-waitlist-mode-lines";

/** 按团体人数分开排队 */
export const WAITLIST_QUEUE_TOGGLE_SEQS: readonly number[] = [WAITLIST_SPLIT_BY_PARTY_SIZE_SEQ];

export const WAITLIST_PARTY_SIZE_OPTIONS_FIELD_ID = "13-waitlist-party-size-options";
export const WAITLIST_PARTY_SIZE_OPTIONS_DEFAULT = "2,3,4,5,6,7,8";

export const WAITLIST_PARTY_IDENTIFIER_FIELD_ID = "14-waitlist-party-identifier";
export const WAITLIST_PARTY_IDENTIFIER_GROUP = "module-setting-radio-14-waitlist-party-identifier";

export const WAITLIST_PARTY_IDENTIFIER_OPTIONS = [
  { value: "queue_number", label: "排队号码（系统自动分配）" },
  { value: "guest_name", label: "客人姓名" },
  { value: "number_and_name", label: "号码 + 姓名" },
] as const;

export type WaitlistPartyIdentifier =
  (typeof WAITLIST_PARTY_IDENTIFIER_OPTIONS)[number]["value"];

const PARTY_IDENTIFIER_FALLBACK: WaitlistPartyIdentifier = "queue_number";

const ALL_LINE_IDS: WaitlistProductLineId[] = WAITLIST_PRODUCT_LINES.map((l) => l.id);

const TEXT_INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

function normalizeLineIds(raw: unknown): WaitlistProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter((id): id is WaitlistProductLineId => typeof id === "string" && valid.has(id));
}

export function readWaitlistModeLines(): WaitlistProductLineId[] {
  const normalized = normalizeLineIds(
    readModuleSettingJson<unknown>(WAITLIST_MODE_LINES_STORAGE_ID, null),
  );
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(WAITLIST_MODE_SEQ)) {
    writeWaitlistModeLines(ALL_LINE_IDS);
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function writeWaitlistModeLines(lines: WaitlistProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(WAITLIST_MODE_LINES_STORAGE_ID, unique);
}

export function ensureWaitlistModeLinesDefault(): void {
  if (readWaitlistModeLines().length === 0) {
    writeWaitlistModeLines(ALL_LINE_IDS);
  }
}

export function isWaitlistModeSeq(seq: number): boolean {
  return seq === WAITLIST_MODE_SEQ;
}

export function isWaitlistQueueToggleSeq(seq: number): boolean {
  return (WAITLIST_QUEUE_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function isWaitlistPartySizeOptionsSeq(seq: number): boolean {
  return seq === WAITLIST_PARTY_SIZE_OPTIONS_SEQ;
}

export function isWaitlistPartyIdentifierSeq(seq: number): boolean {
  return seq === WAITLIST_PARTY_IDENTIFIER_SEQ;
}

function isValidPartyIdentifier(value: string): value is WaitlistPartyIdentifier {
  return WAITLIST_PARTY_IDENTIFIER_OPTIONS.some((opt) => opt.value === value);
}

export function readWaitlistPartySizeOptionsCsv(): string {
  const stored = readModuleSettingText(
    WAITLIST_PARTY_SIZE_OPTIONS_FIELD_ID,
    WAITLIST_PARTY_SIZE_OPTIONS_DEFAULT,
  );
  return stored.trim() || WAITLIST_PARTY_SIZE_OPTIONS_DEFAULT;
}

export function writeWaitlistPartySizeOptionsCsv(value: string): void {
  writeModuleSettingText(WAITLIST_PARTY_SIZE_OPTIONS_FIELD_ID, value.trim());
}

export function readWaitlistPartyIdentifier(): WaitlistPartyIdentifier {
  const stored = readModuleSettingRadio(
    WAITLIST_PARTY_IDENTIFIER_FIELD_ID,
    PARTY_IDENTIFIER_FALLBACK,
  );
  return isValidPartyIdentifier(stored) ? stored : PARTY_IDENTIFIER_FALLBACK;
}

export function writeWaitlistPartyIdentifier(value: WaitlistPartyIdentifier): void {
  writeModuleSettingRadio(WAITLIST_PARTY_IDENTIFIER_FIELD_ID, value);
}

export function renderWaitlistModeLinesPanelHtml(seq: number, on: boolean): string {
  const selected = new Set(readWaitlistModeLines());
  const checkboxes = WAITLIST_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
          value="${escapeHtml(line.id)}"
          data-waitlist-mode-line="${seq}"
          data-waitlist-mode-line-id="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${on ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span>${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-3 ${hidden}"
      data-waitlist-mode-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="等位模式适用产线">
        ${checkboxes}
      </div>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        开启后，仅在勾选的产线展示等位排队取号能力；关闭主开关后所有产线均不可用。
      </p>
    </div>`;
}

export function setWaitlistModeLinesPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-waitlist-mode-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel.querySelectorAll<HTMLInputElement>("[data-waitlist-mode-line]").forEach((input) => {
      input.disabled = !visible;
    });
  });
}

function collectLinesFromPanel(panel: HTMLElement): WaitlistProductLineId[] {
  const lines: WaitlistProductLineId[] = [];
  panel.querySelectorAll<HTMLInputElement>("[data-waitlist-mode-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-waitlist-mode-line-id");
    if (id && ALL_LINE_IDS.includes(id as WaitlistProductLineId)) {
      lines.push(id as WaitlistProductLineId);
    }
  });
  return lines;
}

export function bindWaitlistModeUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-waitlist-mode-panel]").forEach((panel) => {
    if (panel.dataset.waitlistModePanelBound === "1") return;
    panel.dataset.waitlistModePanelBound = "1";

    panel.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-waitlist-mode-line]")) return;
      writeWaitlistModeLines(collectLinesFromPanel(panel));
    });
  });
}

export function renderWaitlistPartySizeOptionsInputHtml(): string {
  const value = readWaitlistPartySizeOptionsCsv();
  return `
    <input
      type="text"
      class="${TEXT_INPUT_CLASS}"
      value="${escapeHtml(value)}"
      placeholder="${escapeHtml(WAITLIST_PARTY_SIZE_OPTIONS_DEFAULT)}"
      data-module-setting-text="${escapeHtml(WAITLIST_PARTY_SIZE_OPTIONS_FIELD_ID)}"
      aria-label="等位可选团体人数"
    />
    <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
      英文逗号分隔，如 2,4,6 表示食客可选 2 人桌、4 人桌、6 人桌等；与「按团体人数分开排队」联动时分队依据。
    </p>`;
}

export function renderWaitlistPartyIdentifierChoiceHtml(): string {
  return renderModuleSettingSingleChoiceHtml({
    options: WAITLIST_PARTY_IDENTIFIER_OPTIONS,
    fieldId: WAITLIST_PARTY_IDENTIFIER_FIELD_ID,
    groupName: WAITLIST_PARTY_IDENTIFIER_GROUP,
    currentValue: readWaitlistPartyIdentifier(),
    layout: "vertical",
    ariaLabel: "等位团体代号识别方式",
  });
}
