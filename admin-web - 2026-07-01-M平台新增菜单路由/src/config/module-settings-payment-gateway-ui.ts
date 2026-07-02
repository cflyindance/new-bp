/**
 * 支付中心 · 支付网关与受理（seq 229 · Payment Service Settings）。
 */

import { readModuleSettingText } from "./module-settings-form-ui";

export const PAYMENT_GATEWAY_HOST_SEQ = 229;

export const PAYMENT_SERVICE_FIELD_ID = "229-payment-service";

export const PAYMENT_SERVICE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "usaepay", label: "USAePAY" },
  { value: "usaepay-test", label: "USAePAY Test Only" },
  { value: "dejavoo", label: "Dejavoo" },
  { value: "pax", label: "Pax" },
  { value: "moneris-cloud", label: "Moneris Cloud" },
  { value: "individual", label: "Individual" },
] as const;

export type PaymentServiceValue = (typeof PAYMENT_SERVICE_OPTIONS)[number]["value"];

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const LABEL_CLASS = "block text-sm font-medium text-foreground";

type GatewayField = {
  fieldId: string;
  label: string;
  inputType?: "text" | "password";
  placeholder?: string;
};

const MERCHANT_FIELDS: GatewayField[] = [
  { fieldId: "229-merchant-name", label: "Merchant Name", placeholder: "Merchant Name" },
  { fieldId: "229-merchant-id", label: "Merchant ID", placeholder: "Merchant ID" },
  { fieldId: "229-merchant-key", label: "Merchant Key", inputType: "password", placeholder: "Merchant Key" },
  { fieldId: "229-setup-password", label: "Setup Password", inputType: "password", placeholder: "Setup Password" },
  { fieldId: "229-authorization", label: "Authorization", placeholder: "Authorization" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isPaymentGatewayHostSeq(seq: number): boolean {
  return seq === PAYMENT_GATEWAY_HOST_SEQ;
}

export function readPaymentServiceValue(): PaymentServiceValue {
  const raw = readModuleSettingText(PAYMENT_SERVICE_FIELD_ID, "none");
  const hit = PAYMENT_SERVICE_OPTIONS.find((o) => o.value === raw);
  return hit?.value ?? "none";
}

function renderPaymentServiceSelect(): string {
  const current = readPaymentServiceValue();
  const options = PAYMENT_SERVICE_OPTIONS.map((o) => {
    const selected = o.value === current ? " selected" : "";
    return `<option value="${escapeHtml(o.value)}"${selected}>${escapeHtml(o.label)}</option>`;
  }).join("");
  return `
    <div class="space-y-1.5">
      <label class="${LABEL_CLASS}" for="payment-service-select">Payment Service</label>
      <select
        id="payment-service-select"
        class="${INPUT_CLASS}"
        data-module-setting-text="${escapeHtml(PAYMENT_SERVICE_FIELD_ID)}"
        aria-label="Payment Service"
      >
        ${options}
      </select>
    </div>`;
}

function renderMerchantField(field: GatewayField): string {
  const value = readModuleSettingText(field.fieldId, "");
  const type = field.inputType ?? "text";
  return `
    <div class="space-y-1.5">
      <label class="${LABEL_CLASS}">${escapeHtml(field.label)}</label>
      <input
        type="${type}"
        class="${INPUT_CLASS}"
        value="${escapeHtml(value)}"
        data-module-setting-text="${escapeHtml(field.fieldId)}"
        aria-label="${escapeHtml(field.label)}"
        placeholder="${escapeHtml(field.placeholder ?? "")}"
        autocomplete="off"
      />
    </div>`;
}

export function renderPaymentGatewaySettingsFormHtml(): string {
  const merchantFields = MERCHANT_FIELDS.map(renderMerchantField).join("");
  return `
    <div class="mt-4 space-y-4 max-w-2xl" data-payment-gateway-form>
      ${renderPaymentServiceSelect()}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        ${merchantFields}
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed">
        选择收单服务类型并填写商户接入参数；凭据仅保存在本机演示存储，上线后由后端加密托管。
      </p>
    </div>`;
}
