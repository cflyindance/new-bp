/**
 * 系统设置 · 集成与 API · Datahub（seq 343）。
 * 订单报告配置输入。
 */

import { readModuleSettingText } from "./module-settings-form-ui";

export const DATAHUB_ORDER_REPORT_SEQ = 343;

export const DATAHUB_ORDER_REPORT_CONFIG_FIELD_ID = "343-order-report-config";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const LABEL_CLASS = "block text-sm font-medium text-foreground";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isDatahubOrderReportSeq(seq: number): boolean {
  return seq === DATAHUB_ORDER_REPORT_SEQ;
}

export function renderDatahubOrderReportPanelHtml(): string {
  const value = readModuleSettingText(DATAHUB_ORDER_REPORT_CONFIG_FIELD_ID, "");
  return `
    <div class="mt-3 max-w-2xl space-y-4 rounded-lg border border-border bg-muted/40 px-3 py-3">
      <div class="space-y-1.5">
        <label class="${LABEL_CLASS}" for="datahub-order-report-config">订单报告配置</label>
        <input
          id="datahub-order-report-config"
          type="text"
          class="${INPUT_CLASS}"
          value="${escapeHtml(value)}"
          data-module-setting-text="${escapeHtml(DATAHUB_ORDER_REPORT_CONFIG_FIELD_ID)}"
          aria-label="订单报告配置"
          placeholder="Datahub 订单报告配置"
          autocomplete="off"
        />
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        填写 Datahub 订单报告对接参数；上线后由后端加密托管。
      </p>
    </div>`;
}
