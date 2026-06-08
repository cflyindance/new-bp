/**
 * 语言与本地化：109 店员端系统默认语言；652/653 食客端界面语言（原型 localStorage）。
 */

import {
  readModuleSettingCheckbox,
  readModuleSettingRadio,
  writeModuleSettingCheckbox,
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

const DEFAULT_SELECTED_CODES = new Set(["en", "zh-Hans"]);
const DEFAULT_LOCALE_CODE = "en";
const STAFF_SYSTEM_DEFAULT_LOCALE_SEQ = 109;
const LOCALE_SELECT_SEQ = 652;
const LOCALE_DEFAULT_SEQ = 653;
const STAFF_SYSTEM_DEFAULT_LOCALE_FIELD_ID = "109-system-default-locale";
const DEFAULT_RADIO_FIELD_ID = "653-default-locale";

const STAFF_SYSTEM_DEFAULT_LOCALE_CODES = new Set(
  STAFF_SYSTEM_DEFAULT_LOCALES.map((l) => l.code),
);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function localeCheckboxFieldId(code: string): string {
  return `652-lang-${code}`;
}

export function isModuleSettingLocaleSelectSeq(seq: number): boolean {
  return seq === LOCALE_SELECT_SEQ;
}

export function isSystemDefaultLocaleSeq(seq: number): boolean {
  return seq === STAFF_SYSTEM_DEFAULT_LOCALE_SEQ;
}

export function isModuleSettingLocaleDefaultSeq(seq: number): boolean {
  return seq === LOCALE_DEFAULT_SEQ;
}

export function isModuleSettingGuestFacingLocaleSeq(seq: number): boolean {
  return seq === LOCALE_SELECT_SEQ || seq === LOCALE_DEFAULT_SEQ;
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
      新会话或未单独设置语言时将使用该值。食客端（eMenu / Kiosk / 客显）语言见前厅「食客端·界面语言」652/653。
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

function defaultCheckedForLocale(code: string): boolean {
  return DEFAULT_SELECTED_CODES.has(code);
}

export function readSelectedLocaleCodes(): string[] {
  return GUEST_FACING_LOCALES.filter((l) =>
    readModuleSettingCheckbox(localeCheckboxFieldId(l.code), defaultCheckedForLocale(l.code)),
  ).map((l) => l.code);
}

export function readDefaultLocaleCode(): string {
  return readModuleSettingRadio(DEFAULT_RADIO_FIELD_ID, DEFAULT_LOCALE_CODE);
}

export function writeDefaultLocaleCode(code: string): void {
  writeModuleSettingRadio(DEFAULT_RADIO_FIELD_ID, code);
}

export function resolveEffectiveDefaultLocale(selected: string[]): string {
  const current = readDefaultLocaleCode();
  if (selected.includes(current)) return current;
  const fallback = selected[0] ?? DEFAULT_LOCALE_CODE;
  writeDefaultLocaleCode(fallback);
  return fallback;
}

export function renderLocaleDefaultRadiosHtml(): string {
  const selected = readSelectedLocaleCodes();
  if (selected.length === 0) {
    return `<p class="m-0 text-sm text-muted-foreground">请至少选择一种语言</p>`;
  }
  const effective = resolveEffectiveDefaultLocale(selected);
  const groupName = "module-setting-locale-default";
  return selected
    .map((code) => {
      const locale = GUEST_FACING_LOCALES.find((l) => l.code === code);
      if (!locale) return "";
      const checked = effective === code;
      return `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="radio"
          name="${groupName}"
          value="${code}"
          class="size-4 shrink-0 rounded-full border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          ${checked ? "checked" : ""}
          data-locale-default-radio
          data-module-setting-radio="${DEFAULT_RADIO_FIELD_ID}"
        />
        <span>${escapeHtml(locale.label)}</span>
      </label>`;
    })
    .join("");
}

export function refreshAllLocaleDefaultRadioPanels(): void {
  document.querySelectorAll<HTMLElement>("[data-locale-default-radios]").forEach((panel) => {
    panel.innerHTML = renderLocaleDefaultRadiosHtml();
  });
}

export function bindGuestFacingLocaleControls(): void {
  if (document.documentElement.dataset.guestFacingLocaleBound === "1") return;
  document.documentElement.dataset.guestFacingLocaleBound = "1";

  document.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;

    const localeCb = target.closest<HTMLInputElement>("[data-locale-select-checkbox]");
    if (localeCb) {
      const code = localeCb.getAttribute("data-locale-code");
      if (!code) return;
      const checkedCount = [
        ...document.querySelectorAll<HTMLInputElement>("[data-locale-select-checkbox]"),
      ].filter((cb) => cb.checked).length;
      if (checkedCount === 0) {
        localeCb.checked = true;
        return;
      }
      writeModuleSettingCheckbox(localeCheckboxFieldId(code), localeCb.checked);
      refreshAllLocaleDefaultRadioPanels();
      return;
    }

    const defaultRadio = target.closest<HTMLInputElement>("[data-locale-default-radio]");
    if (defaultRadio?.checked) {
      writeModuleSettingRadio(DEFAULT_RADIO_FIELD_ID, defaultRadio.value);
    }
  });
}
