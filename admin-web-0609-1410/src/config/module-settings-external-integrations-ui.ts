/**
 * 系统设置 · 连接与服务 · 人力与排班（78 同步云员工开关；79–81 链接/地址输入）。
 */

import { readModuleSettingText } from "./module-settings-form-ui";

export const CLOUD_EMPLOYEE_SYNC_SEQ = 78;
export const CLOUD_EMPLOYEE_SYSTEM_URL_SEQ = 79;
export const THIRD_PARTY_SCHEDULE_LINK_SEQ = 80;
export const THIRD_PARTY_PUNCH_LINK_SEQ = 81;

export const EXTERNAL_INTEGRATIONS_INPUT_SEQS = [
  CLOUD_EMPLOYEE_SYSTEM_URL_SEQ,
  THIRD_PARTY_SCHEDULE_LINK_SEQ,
  THIRD_PARTY_PUNCH_LINK_SEQ,
] as const;

export type ExternalIntegrationsInputSeq = (typeof EXTERNAL_INTEGRATIONS_INPUT_SEQS)[number];

export const CLOUD_EMPLOYEE_SYSTEM_URL_FIELD_ID = "79-cloud-employee-system-url";
export const THIRD_PARTY_SCHEDULE_LINK_FIELD_ID = "80-third-party-schedule-link";
export const THIRD_PARTY_PUNCH_LINK_FIELD_ID = "81-third-party-punch-link";

type ExternalIntegrationsFieldConfig = {
  fieldId: string;
  placeholder: string;
  hint: string;
  /** 随 seq 78 同步开关禁用（仅云员工地址） */
  tiedToCloudEmployeeSync?: boolean;
};

const EXTERNAL_INTEGRATIONS_FIELDS: Record<
  ExternalIntegrationsInputSeq,
  ExternalIntegrationsFieldConfig
> = {
  [CLOUD_EMPLOYEE_SYSTEM_URL_SEQ]: {
    fieldId: CLOUD_EMPLOYEE_SYSTEM_URL_FIELD_ID,
    placeholder: "https://employee.example.com",
    hint: "云员工系统 API / 管理端地址；须开启上方「同步云员工系统」。",
    tiedToCloudEmployeeSync: true,
  },
  [THIRD_PARTY_SCHEDULE_LINK_SEQ]: {
    fieldId: THIRD_PARTY_SCHEDULE_LINK_FIELD_ID,
    placeholder: "https://schedule.example.com",
    hint: "管理端跳转第三方排班表的 URL（如 7shifts 排班页）。",
  },
  [THIRD_PARTY_PUNCH_LINK_SEQ]: {
    fieldId: THIRD_PARTY_PUNCH_LINK_FIELD_ID,
    placeholder: "https://punch.example.com",
    hint: "管理端跳转第三方打卡/考勤记录的 URL。",
  },
};

const TEXT_INPUT_CLASS =
  "h-9 w-full min-w-[12rem] rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[20rem]";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isCloudEmployeeSyncSeq(seq: number): boolean {
  return seq === CLOUD_EMPLOYEE_SYNC_SEQ;
}

export function isExternalIntegrationsInputSeq(seq: number): seq is ExternalIntegrationsInputSeq {
  return (EXTERNAL_INTEGRATIONS_INPUT_SEQS as readonly number[]).includes(seq);
}

export function renderExternalIntegrationsGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组对接<strong>云员工系统</strong>与<strong>第三方排班 / 打卡</strong>外链。
      开启同步后，员工档案与排班数据将按配置地址拉取；排班表与打卡记录链接供管理端快捷跳转。
    </p>`;
}

function renderTextInput(
  config: ExternalIntegrationsFieldConfig,
  options: { disabled?: boolean; seq: number },
): string {
  const value = readModuleSettingText(config.fieldId, "");
  const disabled = options.disabled ?? false;
  const tiedAttr = config.tiedToCloudEmployeeSync ? ' data-cloud-employee-url-input="1"' : "";
  return `
    <div class="w-full space-y-1.5 sm:max-w-xl" data-external-integrations-input="${options.seq}">
      <input
        type="url"
        inputmode="url"
        class="${TEXT_INPUT_CLASS}"
        value="${escapeHtml(value)}"
        data-module-setting-text="${escapeHtml(config.fieldId)}"
        placeholder="${escapeHtml(config.placeholder)}"
        autocomplete="off"
        aria-label="${escapeHtml(config.placeholder)}"
        ${disabled ? "disabled" : ""}
        ${tiedAttr}
      />
      <p class="m-0 text-xs text-muted-foreground">${escapeHtml(config.hint)}</p>
    </div>`;
}

export function renderExternalIntegrationsInputHtml(
  seq: ExternalIntegrationsInputSeq,
  cloudEmployeeSyncOn: boolean,
): string {
  const config = EXTERNAL_INTEGRATIONS_FIELDS[seq];
  const disabled = config.tiedToCloudEmployeeSync ? !cloudEmployeeSyncOn : false;
  return renderTextInput(config, { disabled, seq });
}

/** seq 78 开关变更时，同步云员工地址输入框可用态 */
export function setCloudEmployeeSystemUrlInputEnabled(enabled: boolean, root: ParentNode = document): void {
  root.querySelectorAll<HTMLInputElement>('[data-cloud-employee-url-input="1"]').forEach((input) => {
    input.disabled = !enabled;
    input.closest("[data-external-integrations-input]")?.classList.toggle("opacity-50", !enabled);
  });
}

export function syncExternalIntegrationsUrlFields(
  cloudEmployeeSyncOn: boolean,
  root: ParentNode = document,
): void {
  setCloudEmployeeSystemUrlInputEnabled(cloudEmployeeSyncOn, root);
}
