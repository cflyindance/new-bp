/**
 * 预约等位 · 等位排队规则（seq 12–14、529）。
 * 529 等位模式：默认开启、无主开关，产线多选结构对齐跳过选桌（107），仅 Kiosk；
 * 12 开关；13 团体人数（文本）；14 团体代号（单选）。
 */

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

/** 等位取号可触达产线（仅 Kiosk） */
export const WAITLIST_PRODUCT_LINES = [{ id: "kiosk", label: "Kiosk" }] as const;

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
const DEFAULT_LINES: WaitlistProductLineId[] = ["kiosk"];

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const TEXT_INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeMasterToggleOn(on: boolean): void {
  try {
    localStorage.setItem(moduleSettingToggleStorageKey(WAITLIST_MODE_SEQ), on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function normalizeLineIds(raw: unknown): WaitlistProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter((id): id is WaitlistProductLineId => typeof id === "string" && valid.has(id));
}

export function readWaitlistModeLines(): WaitlistProductLineId[] {
  const stored = readModuleSettingJson<unknown>(WAITLIST_MODE_LINES_STORAGE_ID, null);
  if (stored == null) {
    writeWaitlistModeLines(DEFAULT_LINES);
    return [...DEFAULT_LINES];
  }
  const normalized = normalizeLineIds(stored);
  // 旧版可能含 eMenu/POS；过滤后为空则回落默认 Kiosk
  if (Array.isArray(stored) && stored.length > 0 && normalized.length === 0) {
    writeWaitlistModeLines(DEFAULT_LINES);
    return [...DEFAULT_LINES];
  }
  return normalized;
}

export function writeWaitlistModeLines(lines: WaitlistProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(WAITLIST_MODE_LINES_STORAGE_ID, unique);
  writeMasterToggleOn(unique.length > 0);
}

/** 等位模式默认开启：首次无数据时勾选 Kiosk */
export function ensureWaitlistModeLinesDefault(): void {
  void readWaitlistModeLines();
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

/** 结构对齐跳过选桌（107）产线分栏多选；无主开关，默认展示 */
export function renderWaitlistModeLinesPanelHtml(): string {
  ensureWaitlistModeLinesDefault();
  const selected = new Set(readWaitlistModeLines());
  const cells = WAITLIST_PRODUCT_LINES.map((line, index) => {
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
          data-waitlist-mode-line-id="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-xs overflow-hidden rounded-md border border-border bg-muted/40"
      data-waitlist-mode-lines="${WAITLIST_MODE_SEQ}"
      role="group"
      aria-label="等位模式适用产线"
    >
      ${cells}
    </div>`;
}

function collectLinesFromGroup(group: HTMLElement): WaitlistProductLineId[] {
  const lines: WaitlistProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-waitlist-mode-line-id]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-waitlist-mode-line-id");
      if (id && ALL_LINE_IDS.includes(id as WaitlistProductLineId)) {
        lines.push(id as WaitlistProductLineId);
      }
    });
  writeWaitlistModeLines(lines);
  return lines;
}

export function bindWaitlistModeUi(root: ParentNode = document): void {
  ensureWaitlistModeLinesDefault();
  root.querySelectorAll<HTMLElement>("[data-waitlist-mode-lines]").forEach((group) => {
    if (group.dataset.waitlistModeBound === "1") return;
    group.dataset.waitlistModeBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-waitlist-mode-line-id]")) return;
      collectLinesFromGroup(group);
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
