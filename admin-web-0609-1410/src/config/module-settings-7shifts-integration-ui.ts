/**
 * 系统设置 · 集成与 API · 7shifts（seq 458）。
 * 主开关 + API 与门店定位字段。
 */

import { readModuleSettingText } from "./module-settings-form-ui";

export const SEVENSHIFTS_INTEGRATION_SEQ = 458;

export const SEVENSHIFTS_API_KEY_FIELD_ID = "458-api-key";
export const SEVENSHIFTS_LOCATION_ID_FIELD_ID = "458-location-id";
export const SEVENSHIFTS_LOCATION_NAME_FIELD_ID = "458-location-name";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const LABEL_CLASS = "block text-sm font-medium text-foreground";

type CredentialField = {
  fieldId: string;
  label: string;
  inputType?: "text" | "password";
  placeholder?: string;
};

const CREDENTIAL_FIELDS: CredentialField[] = [
  {
    fieldId: SEVENSHIFTS_API_KEY_FIELD_ID,
    label: "7Shifts API Key",
    inputType: "password",
    placeholder: "7Shifts API Key",
  },
  {
    fieldId: SEVENSHIFTS_LOCATION_ID_FIELD_ID,
    label: "7Shifts Location ID",
    placeholder: "7Shifts Location ID",
  },
  {
    fieldId: SEVENSHIFTS_LOCATION_NAME_FIELD_ID,
    label: "7Shifts Location Name",
    placeholder: "7Shifts Location Name",
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isSevenShiftsIntegrationSeq(seq: number): boolean {
  return seq === SEVENSHIFTS_INTEGRATION_SEQ;
}

function renderCredentialField(field: CredentialField, enabled: boolean): string {
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
        ${enabled ? "" : "disabled"}
      />
    </div>`;
}

export function renderSevenShiftsIntegrationPanelHtml(seq: number, on: boolean): string {
  const fields = CREDENTIAL_FIELDS.map((field) => renderCredentialField(field, on)).join("");
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl space-y-4 rounded-lg border border-border bg-muted/40 px-3 py-3 ${hidden}"
      data-7shifts-integration-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${fields}
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        开启后填写 7Shifts 接入参数；关闭时保留已填内容但不发起对接。
      </p>
    </div>`;
}

export function setSevenShiftsIntegrationPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-7shifts-integration-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel.querySelectorAll<HTMLInputElement>("[data-module-setting-text]").forEach((input) => {
      input.disabled = !visible;
    });
  });
}
