/**
 * 门店管理 · 餐馆基本信息表单（seq 417；归属「门店档案」组）。
 * 平台主数据字段只读展示；联系展示与内部编码可编辑。
 * 营业时段见 seq 418（`module-settings-store-business-hours-ui.ts`）。
 */

import { readModuleSettingText } from "./module-settings-form-ui";
import {
  isStoreBasicProfileReadOnlyFieldId,
  readStoreBasicProfileMasterField,
} from "./module-settings-store-profile-master";

export const STORE_BASIC_INFO_HOST_SEQ = 417;

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const READONLY_INPUT_CLASS =
  "h-9 w-full cursor-not-allowed rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground shadow-sm";

const SECTION_HEAD_CLASS =
  "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

type StoreBasicInfoField = {
  fieldId: string;
  label: string;
  inputType?: string;
  placeholder?: string;
  readOnly?: boolean;
};

type StoreBasicInfoSection = {
  title: string;
  description?: string;
  fields: StoreBasicInfoField[];
};

export const STORE_BASIC_INFO_SECTIONS: StoreBasicInfoSection[] = [
  {
    title: "",
    fields: [
      { fieldId: "417-restaurant-name", label: "餐馆名", readOnly: true },
      { fieldId: "417-merchant-no", label: "商户编号", readOnly: true },
      { fieldId: "417-phone-1", label: "电话1", inputType: "tel", readOnly: true },
      { fieldId: "417-phone-2", label: "电话2", inputType: "tel", readOnly: true },
      { fieldId: "417-address-line-1", label: "地址栏1", readOnly: true },
      { fieldId: "417-address-line-2", label: "地址栏2", readOnly: true },
      { fieldId: "417-city", label: "城市", readOnly: true },
      { fieldId: "417-state-province", label: "州/省", readOnly: true },
      { fieldId: "417-zip", label: "邮编", readOnly: true },
      { fieldId: "417-region", label: "地区", readOnly: true },
      { fieldId: "417-dealer", label: "经销商", readOnly: true },
      { fieldId: "417-version-cert", label: "版本证书信息", readOnly: true },
    ],
  },
  {
    title: "联系与展示",
    fields: [
      { fieldId: "417-fax", label: "传真", inputType: "tel", placeholder: "Fax" },
      { fieldId: "417-website", label: "网站", inputType: "url", placeholder: "https://" },
      { fieldId: "417-email", label: "邮箱地址", inputType: "email", placeholder: "Email" },
    ],
  },
  {
    title: "内部编码",
    fields: [
      { fieldId: "417-store-no", label: "门店编号", placeholder: "Store #" },
      { fieldId: "417-merchant-group-no", label: "商家组编号", placeholder: "Merchant group #" },
      { fieldId: "417-merchant-code", label: "商家代号", placeholder: "Merchant code" },
    ],
  },
];

export const STORE_BASIC_INFO_FIELDS: StoreBasicInfoField[] = STORE_BASIC_INFO_SECTIONS.flatMap(
  (section) => section.fields,
);

export const STORE_BASIC_INFO_READONLY_FIELD_IDS: string[] = STORE_BASIC_INFO_FIELDS.filter(
  (field) => field.readOnly,
).map((field) => field.fieldId);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isStoreBasicInfoHostSeq(seq: number): boolean {
  return seq === STORE_BASIC_INFO_HOST_SEQ;
}

export { isStoreBasicProfileReadOnlyFieldId };

function resolveFieldValue(field: StoreBasicInfoField): string {
  if (field.readOnly || isStoreBasicProfileReadOnlyFieldId(field.fieldId)) {
    return readStoreBasicProfileMasterField(field.fieldId);
  }
  return readModuleSettingText(field.fieldId, "");
}

function renderField(field: StoreBasicInfoField): string {
  const value = resolveFieldValue(field);
  const readOnly = field.readOnly === true;
  const inputClass = readOnly ? READONLY_INPUT_CLASS : INPUT_CLASS;
  const readonlyAttr = readOnly ? ' readonly data-module-setting-readonly="1"' : "";
  const dataAttr = readOnly
    ? `data-store-basic-profile-field="${escapeHtml(field.fieldId)}"`
    : `data-module-setting-text="${escapeHtml(field.fieldId)}"`;

  return `
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-foreground">${escapeHtml(field.label)}</label>
      <input
        type="${escapeHtml(field.inputType ?? "text")}"
        class="${inputClass}"
        value="${escapeHtml(value)}"
        ${dataAttr}
        aria-label="${escapeHtml(field.label)}"
        placeholder="${escapeHtml(field.placeholder ?? "")}"
        ${readonlyAttr}
      />
    </div>`;
}

function renderSection(section: StoreBasicInfoSection, index: number): string {
  const divider = index > 0 ? "border-t border-border pt-5" : "";
  const fields = section.fields.map(renderField).join("");
  const hasHeader = Boolean(section.title.trim() || section.description?.trim());
  const description = section.description
    ? `<p class="text-xs text-muted-foreground">${escapeHtml(section.description)}</p>`
    : "";
  const header = hasHeader
    ? `<div class="space-y-1">
        <h4 class="${SECTION_HEAD_CLASS}">${escapeHtml(section.title)}</h4>
        ${description}
      </div>`
    : "";

  return `
    <section class="space-y-3 ${divider}" data-store-basic-info-section="${escapeHtml(section.title || `section-${index}`)}">
      ${header}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        ${fields}
      </div>
    </section>`;
}

export function renderStoreBasicInfoFormHtml(): string {
  const sections = STORE_BASIC_INFO_SECTIONS.map(renderSection).join("");
  return `
    <div class="mt-3 space-y-5" data-store-basic-info-form>
      ${sections}
    </div>`;
}
