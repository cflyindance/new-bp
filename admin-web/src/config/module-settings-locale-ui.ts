/**
 * 语言与本地化：109 店员端系统默认语言；
 * 652 选择语言（按产线多选，样式对齐点单显示座位）；
 * 653 默认语言（按产线单选，样式对齐类展示）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR, getFohActiveLineFilterId } from "./foh-settings-by-line-filter";
import {
  moduleSettingStorageKey,
  readModuleSettingCheckbox,
  readModuleSettingJson,
  readModuleSettingRadio,
  writeModuleSettingJson,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";

export type GuestFacingLocale = {
  code: string;
  label: string;
};

/** 店员端（POS）系统默认语言可选列表 */
export const STAFF_SYSTEM_DEFAULT_LOCALES: GuestFacingLocale[] = [
  { code: "zh-Hans", label: "中文" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh-Hant", label: "中文繁体" },
  { code: "fr", label: "Français" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "ru", label: "Русский" },
];

/** 参考竞品/终版：C 端界面可选语言列表 */
export const GUEST_FACING_LOCALES: GuestFacingLocale[] = [
  { code: "en", label: "英语" },
  { code: "zh-Hans", label: "中文简体" },
  { code: "zh-Hant", label: "中文繁体" },
  { code: "fr", label: "法语" },
  { code: "ja", label: "日语" },
  { code: "ru", label: "俄语" },
  { code: "es", label: "西班牙语" },
  { code: "vi", label: "越南语" },
  { code: "th", label: "泰语" },
  { code: "ko", label: "韩语" },
];

export const GUEST_FACING_LOCALE_SELECT_SEQ = 652;
export const GUEST_FACING_LOCALE_DEFAULT_SEQ = 653;

export const GUEST_FACING_LOCALE_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "cds", label: "CDS" },
] as const;

export type GuestFacingLocaleProductLineId =
  (typeof GUEST_FACING_LOCALE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestFacingLocaleProductLineId[] =
  GUEST_FACING_LOCALE_PRODUCT_LINES.map((l) => l.id);

const ALL_LOCALE_CODES = GUEST_FACING_LOCALES.map((l) => l.code);
const LOCALE_CODE_SET = new Set(ALL_LOCALE_CODES);

const DEFAULT_SELECTED_CODES = ["en", "zh-Hans"] as const;
const DEFAULT_LOCALE_CODE = "en";

const LOCALES_BY_LINE_STORAGE_ID = "652-guest-facing-locales-by-line";
const DEFAULT_LOCALE_BY_LINE_STORAGE_ID = "653-default-locale-by-line";

const STAFF_SYSTEM_DEFAULT_LOCALE_SEQ = 109;
const STAFF_SYSTEM_DEFAULT_LOCALE_FIELD_ID = "109-system-default-locale";
/** @deprecated 旧版全局默认语言字段，仅迁移用 */
const LEGACY_DEFAULT_RADIO_FIELD_ID = "653-default-locale";

const STAFF_SYSTEM_DEFAULT_LOCALE_CODES = new Set(
  STAFF_SYSTEM_DEFAULT_LOCALES.map((l) => l.code),
);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @deprecated 旧版全局勾选字段 id，仅迁移/部署文案用 */
export function localeCheckboxFieldId(code: string): string {
  return `652-lang-${code}`;
}

export function isModuleSettingLocaleSelectSeq(seq: number): boolean {
  return seq === GUEST_FACING_LOCALE_SELECT_SEQ;
}

export function isSystemDefaultLocaleSeq(seq: number): boolean {
  return seq === STAFF_SYSTEM_DEFAULT_LOCALE_SEQ;
}

export function isModuleSettingLocaleDefaultSeq(seq: number): boolean {
  return seq === GUEST_FACING_LOCALE_DEFAULT_SEQ;
}

export function isModuleSettingGuestFacingLocaleSeq(seq: number): boolean {
  return seq === GUEST_FACING_LOCALE_SELECT_SEQ || seq === GUEST_FACING_LOCALE_DEFAULT_SEQ;
}

export function readSystemDefaultLocaleCode(): string {
  const stored = readModuleSettingRadio(STAFF_SYSTEM_DEFAULT_LOCALE_FIELD_ID, "zh-Hans");
  return STAFF_SYSTEM_DEFAULT_LOCALE_CODES.has(stored) ? stored : "zh-Hans";
}

export function writeSystemDefaultLocaleCode(code: string): void {
  const next = STAFF_SYSTEM_DEFAULT_LOCALE_CODES.has(code) ? code : "zh-Hans";
  writeModuleSettingRadio(STAFF_SYSTEM_DEFAULT_LOCALE_FIELD_ID, next);
}

export function renderLanguageLocalizationGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      <strong>系统默认语言</strong>为当前登录账号在<strong>店员端（POS）</strong>的默认界面语言；
      新会话或未单独设置语言时将使用该值。食客端（eMenu / Kiosk / 客显）语言见前厅「食客端语言」652/653。
    </p>`;
}

export function renderSystemDefaultLocaleRadiosHtml(): string {
  const effective = readSystemDefaultLocaleCode();
  const groupName = "module-setting-staff-system-default-locale";
  return STAFF_SYSTEM_DEFAULT_LOCALES.map((locale) => {
    const checked = effective === locale.code;
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="radio"
          name="${groupName}"
          value="${escapeHtml(locale.code)}"
          class="size-4 shrink-0 rounded-full border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          ${checked ? "checked" : ""}
          data-system-default-locale-radio
          data-module-setting-radio="${STAFF_SYSTEM_DEFAULT_LOCALE_FIELD_ID}"
        />
        <span>${escapeHtml(locale.label)}</span>
      </label>`;
  }).join("");
}

function normalizeLocaleCodes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !LOCALE_CODE_SET.has(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return ALL_LOCALE_CODES.filter((code) => seen.has(code));
}

function emptyLocalesByLine(): Record<GuestFacingLocaleProductLineId, string[]> {
  return {
    kiosk: [],
    emenu: [],
    sdi: [],
    cds: [],
  };
}

function emptyDefaultByLine(
  fallback: string = DEFAULT_LOCALE_CODE,
): Record<GuestFacingLocaleProductLineId, string> {
  return {
    kiosk: fallback,
    emenu: fallback,
    sdi: fallback,
    cds: fallback,
  };
}

function readLegacySelectedLocaleCodes(): string[] {
  const selected = GUEST_FACING_LOCALES.filter((l) =>
    readModuleSettingCheckbox(
      localeCheckboxFieldId(l.code),
      l.code === "en" || l.code === "zh-Hans",
    ),
  ).map((l) => l.code);
  return selected.length > 0 ? selected : [...DEFAULT_SELECTED_CODES];
}

function hasLocalesByLineStorage(): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(LOCALES_BY_LINE_STORAGE_ID)) !== null;
  } catch {
    return false;
  }
}

function hasDefaultByLineStorage(): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(DEFAULT_LOCALE_BY_LINE_STORAGE_ID)) !== null;
  } catch {
    return false;
  }
}

export function readGuestFacingLocalesByLine(): Record<GuestFacingLocaleProductLineId, string[]> {
  const stored = readModuleSettingJson<unknown>(LOCALES_BY_LINE_STORAGE_ID, null);
  if (stored && typeof stored === "object") {
    const record = stored as Record<string, unknown>;
    const base = emptyLocalesByLine();
    let hasAny = false;
    for (const lineId of ALL_LINE_IDS) {
      const codes = normalizeLocaleCodes(record[lineId]);
      base[lineId] = codes.length > 0 ? codes : [...DEFAULT_SELECTED_CODES];
      if (codes.length > 0) hasAny = true;
    }
    if (hasAny || hasLocalesByLineStorage()) return base;
  }

  const legacy = readLegacySelectedLocaleCodes();
  const migrated = emptyLocalesByLine();
  for (const lineId of ALL_LINE_IDS) {
    migrated[lineId] = [...legacy];
  }
  writeGuestFacingLocalesByLine(migrated);
  return migrated;
}

export function writeGuestFacingLocalesByLine(
  values: Record<GuestFacingLocaleProductLineId, string[]>,
): void {
  const payload = emptyLocalesByLine();
  for (const lineId of ALL_LINE_IDS) {
    const codes = normalizeLocaleCodes(values[lineId]);
    payload[lineId] = codes.length > 0 ? codes : [...DEFAULT_SELECTED_CODES];
  }
  writeModuleSettingJson(LOCALES_BY_LINE_STORAGE_ID, payload);
}

function resolveDefaultForLine(selected: string[], current: string): string {
  if (selected.includes(current)) return current;
  return selected[0] ?? DEFAULT_LOCALE_CODE;
}

export function readGuestFacingDefaultLocaleByLine(): Record<
  GuestFacingLocaleProductLineId,
  string
> {
  const localesByLine = readGuestFacingLocalesByLine();
  const stored = readModuleSettingJson<unknown>(DEFAULT_LOCALE_BY_LINE_STORAGE_ID, null);
  const base = emptyDefaultByLine();

  if (stored && typeof stored === "object" && hasDefaultByLineStorage()) {
    const record = stored as Record<string, unknown>;
    let changed = false;
    for (const lineId of ALL_LINE_IDS) {
      const raw = record[lineId];
      const current = typeof raw === "string" ? raw : DEFAULT_LOCALE_CODE;
      const resolved = resolveDefaultForLine(localesByLine[lineId], current);
      base[lineId] = resolved;
      if (resolved !== current) changed = true;
    }
    if (changed) writeGuestFacingDefaultLocaleByLine(base);
    return base;
  }

  const legacyDefault = readModuleSettingRadio(LEGACY_DEFAULT_RADIO_FIELD_ID, DEFAULT_LOCALE_CODE);
  for (const lineId of ALL_LINE_IDS) {
    base[lineId] = resolveDefaultForLine(localesByLine[lineId], legacyDefault);
  }
  writeGuestFacingDefaultLocaleByLine(base);
  return base;
}

export function writeGuestFacingDefaultLocaleByLine(
  values: Record<GuestFacingLocaleProductLineId, string>,
): void {
  const localesByLine = readGuestFacingLocalesByLine();
  const payload = emptyDefaultByLine();
  for (const lineId of ALL_LINE_IDS) {
    payload[lineId] = resolveDefaultForLine(
      localesByLine[lineId],
      typeof values[lineId] === "string" ? values[lineId] : DEFAULT_LOCALE_CODE,
    );
  }
  writeModuleSettingJson(DEFAULT_LOCALE_BY_LINE_STORAGE_ID, payload);
}

/** 并集：任一产线已选语言（兼容旧调用） */
export function readSelectedLocaleCodes(): string[] {
  const byLine = readGuestFacingLocalesByLine();
  const seen = new Set<string>();
  for (const lineId of ALL_LINE_IDS) {
    for (const code of byLine[lineId]) seen.add(code);
  }
  return ALL_LOCALE_CODES.filter((code) => seen.has(code));
}

export function readDefaultLocaleCode(): string {
  const byLine = readGuestFacingDefaultLocaleByLine();
  return byLine.emenu || byLine.kiosk || DEFAULT_LOCALE_CODE;
}

export function writeDefaultLocaleCode(code: string): void {
  const byLine = readGuestFacingDefaultLocaleByLine();
  for (const lineId of ALL_LINE_IDS) {
    byLine[lineId] = code;
  }
  writeGuestFacingDefaultLocaleByLine(byLine);
}

function visibleProductLines(): typeof GUEST_FACING_LOCALE_PRODUCT_LINES[number][] {
  const activeLine = getFohActiveLineFilterId();
  if (!activeLine) return [...GUEST_FACING_LOCALE_PRODUCT_LINES];
  return GUEST_FACING_LOCALE_PRODUCT_LINES.filter((line) => line.id === activeLine);
}

function renderLocaleCheckboxesForLine(
  lineId: GuestFacingLocaleProductLineId,
  lineLabel: string,
  selected: Set<string>,
): string {
  const inputs = GUEST_FACING_LOCALES.map((locale) => {
    const checked = selected.has(locale.code);
    return `
      <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(locale.code)}"
          data-guest-facing-locale-line="${escapeHtml(lineId)}"
          data-guest-facing-locale-code="${escapeHtml(locale.code)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(lineLabel)} ${escapeHtml(locale.label)}"
        />
        <span>${escapeHtml(locale.label)}</span>
      </label>`;
  }).join("");

  return `<div class="flex flex-wrap items-center gap-x-3 gap-y-2">${inputs}</div>`;
}

/** 652 选择语言：按产线多选（对齐点单显示座位） */
export function renderGuestFacingLocaleSelectEditorHtml(): string {
  const byLine = readGuestFacingLocalesByLine();
  const rows = visibleProductLines()
    .map((line) => {
      const selected = new Set(byLine[line.id]);
      return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderLocaleCheckboxesForLine(line.id, line.label, selected)}
      </td>
    </tr>`;
    })
    .join("");

  return `
    <div data-guest-facing-locale-select-editor class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">可选语言（多选）</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderDefaultRadiosForLine(
  lineId: GuestFacingLocaleProductLineId,
  lineLabel: string,
  selectedCodes: string[],
  effectiveDefault: string,
): string {
  if (selectedCodes.length === 0) {
    return `<p class="m-0 text-sm text-muted-foreground">请先在「选择语言」中为该产线勾选至少一种语言</p>`;
  }

  const groupName = `guest-facing-default-locale-${lineId}`;
  const radios = selectedCodes
    .map((code) => {
      const locale = GUEST_FACING_LOCALES.find((l) => l.code === code);
      if (!locale) return "";
      const checked = effectiveDefault === code;
      return `
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(code)}"
            class="${MODULE_SETTING_CONTROL_CLASS}"
            data-guest-facing-default-locale-line="${escapeHtml(lineId)}"
            data-guest-facing-default-locale-code="${escapeHtml(code)}"
            ${checked ? "checked" : ""}
            aria-label="${escapeHtml(lineLabel)} ${escapeHtml(locale.label)}"
          />
          <span>${escapeHtml(locale.label)}</span>
        </label>`;
    })
    .join("");

  return `<div class="flex flex-wrap items-center gap-4" role="radiogroup" aria-label="${escapeHtml(lineLabel)} 默认语言">${radios}</div>`;
}

/** 653 默认语言：按产线单选（对齐类展示） */
export function renderGuestFacingLocaleDefaultEditorHtml(): string {
  const localesByLine = readGuestFacingLocalesByLine();
  const defaultByLine = readGuestFacingDefaultLocaleByLine();
  const rows = visibleProductLines()
    .map((line) => {
      const selected = localesByLine[line.id];
      const effective = resolveDefaultForLine(selected, defaultByLine[line.id]);
      return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderDefaultRadiosForLine(line.id, line.label, selected, effective)}
      </td>
    </tr>`;
    })
    .join("");

  return `
    <div data-guest-facing-locale-default-editor class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">默认语言</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/** @deprecated 旧全局默认语言面板；保留空实现以免旧调用报错 */
export function renderLocaleDefaultRadiosHtml(): string {
  return renderGuestFacingLocaleDefaultEditorHtml();
}

export function refreshAllGuestFacingLocaleDefaultEditors(): void {
  document.querySelectorAll<HTMLElement>("[data-guest-facing-locale-default-editor]").forEach((editor) => {
    editor.outerHTML = renderGuestFacingLocaleDefaultEditorHtml();
  });
  bindGuestFacingLocaleDefaultEditors(document);
}

function collectLocalesByLineFromEditor(
  editor: HTMLElement,
): Record<GuestFacingLocaleProductLineId, string[]> {
  const current = readGuestFacingLocalesByLine();
  for (const lineId of ALL_LINE_IDS) {
    const checked = new Set<string>();
    editor
      .querySelectorAll<HTMLInputElement>(
        `[data-guest-facing-locale-line="${lineId}"][data-guest-facing-locale-code]:checked`,
      )
      .forEach((input) => {
        const code = input.getAttribute("data-guest-facing-locale-code");
        if (code && LOCALE_CODE_SET.has(code)) checked.add(code);
      });
    // 若该产线在当前编辑器中有控件，则以其勾选结果为准
    const hasControls = editor.querySelector(
      `[data-guest-facing-locale-line="${lineId}"][data-guest-facing-locale-code]`,
    );
    if (hasControls) {
      current[lineId] = ALL_LOCALE_CODES.filter((code) => checked.has(code));
      if (current[lineId].length === 0) {
        current[lineId] = [...DEFAULT_SELECTED_CODES];
      }
    }
  }
  writeGuestFacingLocalesByLine(current);

  const defaults = readGuestFacingDefaultLocaleByLine();
  for (const lineId of ALL_LINE_IDS) {
    defaults[lineId] = resolveDefaultForLine(current[lineId], defaults[lineId]);
  }
  writeGuestFacingDefaultLocaleByLine(defaults);
  return current;
}

function bindGuestFacingLocaleSelectEditors(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-guest-facing-locale-select-editor]").forEach((editor) => {
    if (editor.dataset.guestFacingLocaleSelectBound === "1") return;
    editor.dataset.guestFacingLocaleSelectBound = "1";
    editor.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-facing-locale-code]")) return;

      const lineId = el.getAttribute("data-guest-facing-locale-line") as
        | GuestFacingLocaleProductLineId
        | null;
      if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;

      const checkedCount = editor.querySelectorAll(
        `[data-guest-facing-locale-line="${lineId}"][data-guest-facing-locale-code]:checked`,
      ).length;
      if (checkedCount === 0 && el instanceof HTMLInputElement) {
        el.checked = true;
        return;
      }

      collectLocalesByLineFromEditor(editor);
      refreshAllGuestFacingLocaleDefaultEditors();
    });
  });
}

function bindGuestFacingLocaleDefaultEditors(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-guest-facing-locale-default-editor]").forEach((editor) => {
    if (editor.dataset.guestFacingLocaleDefaultBound === "1") return;
    editor.dataset.guestFacingLocaleDefaultBound = "1";
    editor.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-facing-default-locale-code]")) return;
      if (!(el instanceof HTMLInputElement) || !el.checked) return;

      const lineId = el.getAttribute("data-guest-facing-default-locale-line") as
        | GuestFacingLocaleProductLineId
        | null;
      const code = el.getAttribute("data-guest-facing-default-locale-code");
      if (!lineId || !code || !ALL_LINE_IDS.includes(lineId) || !LOCALE_CODE_SET.has(code)) return;

      const defaults = readGuestFacingDefaultLocaleByLine();
      defaults[lineId] = code;
      writeGuestFacingDefaultLocaleByLine(defaults);
    });
  });
}

export function bindGuestFacingLocaleControls(root: ParentNode = document): void {
  bindGuestFacingLocaleSelectEditors(root);
  bindGuestFacingLocaleDefaultEditors(root);
}

/** @deprecated 使用 refreshAllGuestFacingLocaleDefaultEditors */
export function refreshAllLocaleDefaultRadioPanels(): void {
  refreshAllGuestFacingLocaleDefaultEditors();
}
