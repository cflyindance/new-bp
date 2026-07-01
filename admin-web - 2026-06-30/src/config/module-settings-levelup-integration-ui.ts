/**
 * 系统设置 · 集成与 API · LevelUp（seq 457）。
 * 主开关 + API 凭据字段。
 */

import { readModuleSettingText } from "./module-settings-form-ui";

export const LEVELUP_INTEGRATION_SEQ = 457;

export const LEVELUP_API_KEY_FIELD_ID = "457-api-key";
export const LEVELUP_USER_NAME_FIELD_ID = "457-user-name";
export const LEVELUP_PASSWORD_FIELD_ID = "457-password";

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
  { fieldId: LEVELUP_API_KEY_FIELD_ID, label: "API钥", placeholder: "API Key" },
  { fieldId: LEVELUP_USER_NAME_FIELD_ID, label: "User Name", placeholder: "User Name" },
  {
    fieldId: LEVELUP_PASSWORD_FIELD_ID,
    label: "Password",
    inputType: "password",
    placeholder: "Password",
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isLevelUpIntegrationSeq(seq: number): boolean {
  return seq === LEVELUP_INTEGRATION_SEQ;
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

export function renderLevelUpIntegrationPanelHtml(seq: number, on: boolean): string {
  const fields = CREDENTIAL_FIELDS.map((field) => renderCredentialField(field, on)).join("");
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl space-y-4 rounded-lg border border-border bg-muted/40 px-3 py-3 ${hidden}"
      data-levelup-integration-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${fields}
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        开启后填写 LevelUp 接入凭据；关闭时保留已填内容但不发起对接。
      </p>
    </div>`;
}

export function setLevelUpIntegrationPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-levelup-integration-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel.querySelectorAll<HTMLInputElement>("[data-module-setting-text]").forEach((input) => {
      input.disabled = !visible;
    });
  });
}
