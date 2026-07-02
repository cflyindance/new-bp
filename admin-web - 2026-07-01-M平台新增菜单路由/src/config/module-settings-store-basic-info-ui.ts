/**
 * 门店管理 · 餐馆基本信息表单（seq 417；归属「门店档案」组，四区布局）。
 * 营业时段见 seq 418（`module-settings-store-business-hours-ui.ts`）。
 */

import { readModuleSettingText } from "./module-settings-form-ui";

export const STORE_BASIC_INFO_HOST_SEQ = 417;

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SECTION_HEAD_CLASS =
  "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

type StoreBasicInfoField = {
  fieldId: string;
  label: string;
  inputType?: string;
  placeholder?: string;
};

type StoreBasicInfoSection = {
  title: string;
  fields: StoreBasicInfoField[];
};

export const STORE_BASIC_INFO_SECTIONS: StoreBasicInfoSection[] = [
  {
    title: "门店标识",
    fields: [
      { fieldId: "417-restaurant-name", label: "餐馆名", placeholder: "Restaurant name" },
      { fieldId: "417-store-no", label: "门店编号", placeholder: "Store #" },
    ],
  },
  {
    title: "联系信息",
    fields: [
      { fieldId: "417-phone-1", label: "电话1", inputType: "tel", placeholder: "Phone 1" },
      { fieldId: "417-phone-2", label: "电话2", inputType: "tel", placeholder: "Phone 2" },
      { fieldId: "417-fax", label: "传真", inputType: "tel", placeholder: "Fax" },
      { fieldId: "417-website", label: "网站", inputType: "url", placeholder: "https://" },
      { fieldId: "417-email", label: "邮箱地址", inputType: "email", placeholder: "Email" },
    ],
  },
  {
    title: "地址",
    fields: [
      { fieldId: "417-address-line-1", label: "地址栏1", placeholder: "Address line 1" },
      { fieldId: "417-address-line-2", label: "地址栏2", placeholder: "Address line 2" },
      { fieldId: "417-city", label: "城市", placeholder: "City" },
      { fieldId: "417-zip", label: "邮编", placeholder: "ZIP / Postal code" },
      { fieldId: "417-region", label: "地区", placeholder: "Region / State / Province" },
    ],
  },
  {
    title: "商户与证书",
    fields: [
      { fieldId: "417-merchant-group-no", label: "商家组编号", placeholder: "Merchant group #" },
      { fieldId: "417-merchant-code", label: "商家代号", placeholder: "Merchant code" },
      { fieldId: "417-merchant-no", label: "商户编号", placeholder: "Merchant #" },
      { fieldId: "417-dealer", label: "经销商", placeholder: "Dealer" },
      { fieldId: "417-version-cert", label: "版本证书信息", placeholder: "Version / certificate info" },
    ],
  },
];

export const STORE_BASIC_INFO_FIELDS: StoreBasicInfoField[] = STORE_BASIC_INFO_SECTIONS.flatMap(
  (section) => section.fields,
);

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

function renderField(field: StoreBasicInfoField): string {
  const value = readModuleSettingText(field.fieldId, "");
  return `
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-foreground">${escapeHtml(field.label)}</label>
      <input
        type="${escapeHtml(field.inputType ?? "text")}"
        class="${INPUT_CLASS}"
        value="${escapeHtml(value)}"
        data-module-setting-text="${escapeHtml(field.fieldId)}"
        aria-label="${escapeHtml(field.label)}"
        placeholder="${escapeHtml(field.placeholder ?? "")}"
      />
    </div>`;
}

function renderSection(section: StoreBasicInfoSection, index: number): string {
  const divider = index > 0 ? "border-t border-border pt-5" : "";
  const fields = section.fields.map(renderField).join("");
  return `
    <section class="space-y-3 ${divider}" data-store-basic-info-section="${escapeHtml(section.title)}">
      <h4 class="${SECTION_HEAD_CLASS}">${escapeHtml(section.title)}</h4>
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
