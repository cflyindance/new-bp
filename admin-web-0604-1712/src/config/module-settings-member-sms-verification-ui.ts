/**
 * 登录/注册短信验证码（seq 622；合并原 508）。
 * Catalog hub：前厅 · guest-order-rules；紧挨 623；主开关 + 适用产线多选。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const MEMBER_SMS_VERIFICATION_SEQ = 622;

const LINES_STORAGE_ID = "622-sms-verification-lines";

/** 会员登录/注册可触达产线（与支付方式矩阵一致） */
export const MEMBER_LOGIN_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "paypad", label: "Paypad" },
] as const;

export type MemberLoginProductLineId = (typeof MEMBER_LOGIN_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: MemberLoginProductLineId[] = MEMBER_LOGIN_PRODUCT_LINES.map((l) => l.id);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function normalizeLineIds(raw: unknown): MemberLoginProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter((id): id is MemberLoginProductLineId => typeof id === "string" && valid.has(id));
}

export function readMemberSmsVerificationLines(): MemberLoginProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  const enabled = readLegacyToggleOn(MEMBER_SMS_VERIFICATION_SEQ) || readLegacyToggleOn(508);
  if (enabled) {
    writeMemberSmsVerificationLines(ALL_LINE_IDS);
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function writeMemberSmsVerificationLines(lines: MemberLoginProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function ensureMemberSmsVerificationLinesDefault(): void {
  if (readMemberSmsVerificationLines().length === 0) {
    writeMemberSmsVerificationLines(ALL_LINE_IDS);
  }
}

export function isMemberSmsVerificationSeq(seq: number): boolean {
  return seq === MEMBER_SMS_VERIFICATION_SEQ;
}

export function renderMemberSmsVerificationLinesPanelHtml(seq: number, on: boolean): string {
  const selected = new Set(readMemberSmsVerificationLines());
  const checkboxes = MEMBER_LOGIN_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
          value="${escapeHtml(line.id)}"
          data-member-sms-verification-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${on ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span>${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-3 ${hidden}"
      data-member-sms-verification-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="短信验证码适用产线">
        ${checkboxes}
      </div>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        仅对勾选的产线生效；关闭主开关后，所有产线均不要求短信验证码。
      </p>
    </div>`;
}

export function setMemberSmsVerificationLinesPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-member-sms-verification-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel.querySelectorAll<HTMLInputElement>("[data-member-sms-verification-line]").forEach((input) => {
      input.disabled = !visible;
    });
  });
}

function collectLinesFromPanel(panel: HTMLElement): MemberLoginProductLineId[] {
  const lines: MemberLoginProductLineId[] = [];
  panel.querySelectorAll<HTMLInputElement>("[data-member-sms-verification-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-member-sms-verification-line");
    if (id && ALL_LINE_IDS.includes(id as MemberLoginProductLineId)) {
      lines.push(id as MemberLoginProductLineId);
    }
  });
  return lines;
}

export function bindMemberSmsVerificationUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-member-sms-verification-panel]").forEach((panel) => {
    if (panel.dataset.memberSmsVerificationPanelBound === "1") return;
    panel.dataset.memberSmsVerificationPanelBound = "1";

    panel.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-member-sms-verification-line]")) return;
      writeMemberSmsVerificationLines(collectLinesFromPanel(panel));
    });
  });
}
