/**
 * 系统设置 · 集成与 API · 线上订餐服务对接（seq 93、95–97、99–106）。
 */

import { readModuleSettingNumber, readModuleSettingText } from "./module-settings-form-ui";

export const ONLINE_ORDER_SERVICE_INPUT_SEQS = [
  93, 95, 96, 97, 99, 100, 101, 102, 103, 104, 105, 106,
] as const;

export type OnlineOrderServiceInputSeq = (typeof ONLINE_ORDER_SERVICE_INPUT_SEQS)[number];

type OnlineOrderServiceFieldConfig = {
  fieldId: string;
  kind: "text" | "number" | "password";
  defaultValue?: string | number;
  min?: number;
  max?: number;
  placeholder?: string;
  unit?: string;
};

const ONLINE_ORDER_SERVICE_FIELDS: Record<OnlineOrderServiceInputSeq, OnlineOrderServiceFieldConfig> = {
  93: {
    fieldId: "93-oos-no-port-config",
    kind: "text",
    defaultValue: "",
    placeholder: "免开端口配置",
  },
  95: {
    fieldId: "95-oos-host",
    kind: "text",
    defaultValue: "",
    placeholder: "Online order service host",
  },
  96: {
    fieldId: "96-oos-merchant-id",
    kind: "text",
    defaultValue: "",
    placeholder: "Merchant ID",
  },
  97: {
    fieldId: "97-oos-external-port",
    kind: "number",
    defaultValue: 0,
    min: 0,
    max: 65535,
    placeholder: "External port",
  },
  99: {
    fieldId: "99-oos-callback-remote-host",
    kind: "text",
    defaultValue: "",
    placeholder: "callback remotehost",
  },
  100: {
    fieldId: "100-oos-callback-remote-port",
    kind: "number",
    defaultValue: 0,
    min: 0,
    max: 65535,
    placeholder: "callback remoteport",
  },
  101: {
    fieldId: "101-oos-callback-lan-host",
    kind: "text",
    defaultValue: "",
    placeholder: "callback lan host",
  },
  102: {
    fieldId: "102-oos-callback-lan-port",
    kind: "number",
    defaultValue: 0,
    min: 0,
    max: 65535,
    placeholder: "callback lan port",
  },
  103: {
    fieldId: "103-oos-callback-delay-seconds",
    kind: "number",
    defaultValue: 0,
    min: 0,
    max: 86400,
    unit: "秒",
    placeholder: "Delay seconds",
  },
  104: {
    fieldId: "104-oos-callback-interval-seconds",
    kind: "number",
    defaultValue: 0,
    min: 0,
    max: 86400,
    unit: "秒",
    placeholder: "Interval seconds",
  },
  105: {
    fieldId: "105-oos-callback-hash1",
    kind: "password",
    defaultValue: "",
    placeholder: "callback hash1",
  },
  106: {
    fieldId: "106-oos-callback-hash2",
    kind: "password",
    defaultValue: "",
    placeholder: "callback hash2",
  },
};

const TEXT_INPUT_CLASS =
  "h-9 w-full min-w-[12rem] rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-[16rem]";

const NUMBER_INPUT_CLASS =
  "h-9 w-28 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isOnlineOrderServiceInputSeq(seq: number): seq is OnlineOrderServiceInputSeq {
  return (ONLINE_ORDER_SERVICE_INPUT_SEQS as readonly number[]).includes(seq);
}

function renderTextInput(config: OnlineOrderServiceFieldConfig): string {
  const value = readModuleSettingText(config.fieldId, String(config.defaultValue ?? ""));
  const type = config.kind === "password" ? "password" : "text";
  return `
    <input
      type="${type}"
      class="${TEXT_INPUT_CLASS}"
      value="${escapeHtml(value)}"
      data-module-setting-text="${escapeHtml(config.fieldId)}"
      placeholder="${escapeHtml(config.placeholder ?? "")}"
      autocomplete="off"
    />`;
}

function renderNumberInput(config: OnlineOrderServiceFieldConfig): string {
  const stored = readModuleSettingNumber(config.fieldId, Number(config.defaultValue ?? 0));
  const min = config.min ?? 0;
  const max = config.max ?? 999999;
  const value = Math.min(max, Math.max(min, Math.round(stored)));
  const unit = config.unit
    ? `<span class="text-sm text-muted-foreground">${escapeHtml(config.unit)}</span>`
    : "";
  return `
    <div class="inline-flex items-center gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="${NUMBER_INPUT_CLASS}"
        value="${escapeHtml(String(value))}"
        min="${min}"
        max="${max}"
        data-module-setting-number="${escapeHtml(config.fieldId)}"
        placeholder="${escapeHtml(config.placeholder ?? "")}"
      />
      ${unit}
    </div>`;
}

export function renderOnlineOrderServiceInputHtml(seq: OnlineOrderServiceInputSeq): string {
  const config = ONLINE_ORDER_SERVICE_FIELDS[seq];
  const control = config.kind === "number" ? renderNumberInput(config) : renderTextInput(config);
  return `<div class="w-full sm:w-auto sm:shrink-0 sm:pt-0.5">${control}</div>`;
}
