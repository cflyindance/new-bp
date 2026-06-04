/**
 * 食客端·界面语言（652 选择语言 / 653 默认语言），原型 localStorage。
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
const LOCALE_SELECT_SEQ = 652;
const LOCALE_DEFAULT_SEQ = 653;
const DEFAULT_RADIO_FIELD_ID = "653-default-locale";

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

export function isModuleSettingLocaleDefaultSeq(seq: number): boolean {
  return seq === LOCALE_DEFAULT_SEQ;
}

export function isModuleSettingGuestFacingLocaleSeq(seq: number): boolean {
  return seq === LOCALE_SELECT_SEQ || seq === LOCALE_DEFAULT_SEQ;
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
