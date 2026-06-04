/**
 * 食客端输入页字段规则（505 手机号必填 / 507 姓名必填 / 510 默认选中隐私条款）。
 * Catalog hub：前厅 · guest-order-rules；与 504/506 展示页配套；主开关 + 适用产线多选。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";
import {
  MEMBER_LOGIN_PRODUCT_LINES,
  type MemberLoginProductLineId,
} from "./module-settings-member-sms-verification-ui";

export const MEMBER_PHONE_REQUIRED_SEQ = 505;
export const MEMBER_NAME_REQUIRED_SEQ = 507;
export const MEMBER_PRIVACY_DEFAULT_SEQ = 510;

export const MEMBER_REGISTRATION_FIELD_SEQS = [
  MEMBER_PHONE_REQUIRED_SEQ,
  MEMBER_NAME_REQUIRED_SEQ,
  MEMBER_PRIVACY_DEFAULT_SEQ,
] as const;

export type MemberRegistrationFieldSeq = (typeof MEMBER_REGISTRATION_FIELD_SEQS)[number];

const FIELD_CONFIG: Record<
  MemberRegistrationFieldSeq,
  { linesStorageId: string; panelHint: string }
> = {
  [MEMBER_PHONE_REQUIRED_SEQ]: {
    linesStorageId: "505-phone-required-lines",
    panelHint: "勾选产线在输入手机号页面要求手机号必填（取餐联络等）。",
  },
  [MEMBER_NAME_REQUIRED_SEQ]: {
    linesStorageId: "507-name-required-lines",
    panelHint: "勾选产线在输入姓名页面要求姓名必填（叫号等）。",
  },
  [MEMBER_PRIVACY_DEFAULT_SEQ]: {
    linesStorageId: "510-privacy-default-lines",
    panelHint: "勾选产线在输入手机号页面默认勾选隐私条款（食客仍可取消）。",
  },
};

const ALL_LINE_IDS: MemberLoginProductLineId[] = MEMBER_LOGIN_PRODUCT_LINES.map((l) => l.id);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isRegistrationFieldSeq(seq: number): seq is MemberRegistrationFieldSeq {
  return seq in FIELD_CONFIG;
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

export function readMemberRegistrationFieldLines(seq: MemberRegistrationFieldSeq): MemberLoginProductLineId[] {
  const { linesStorageId } = FIELD_CONFIG[seq];
  const normalized = normalizeLineIds(readModuleSettingJson<unknown>(linesStorageId, null));
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    writeMemberRegistrationFieldLines(seq, ALL_LINE_IDS);
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function writeMemberRegistrationFieldLines(
  seq: MemberRegistrationFieldSeq,
  lines: MemberLoginProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(FIELD_CONFIG[seq].linesStorageId, unique);
}

export function ensureMemberRegistrationFieldLinesDefault(seq: MemberRegistrationFieldSeq): void {
  if (readMemberRegistrationFieldLines(seq).length === 0) {
    writeMemberRegistrationFieldLines(seq, ALL_LINE_IDS);
  }
}

export function isMemberRegistrationFieldSeq(seq: number): seq is MemberRegistrationFieldSeq {
  return isRegistrationFieldSeq(seq);
}

export function renderMemberRegistrationFieldLinesPanelHtml(seq: MemberRegistrationFieldSeq, on: boolean): string {
  const selected = new Set(readMemberRegistrationFieldLines(seq));
  const { panelHint } = FIELD_CONFIG[seq];
  const checkboxes = MEMBER_LOGIN_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
          value="${escapeHtml(line.id)}"
          data-member-registration-field-line="${seq}"
          data-member-registration-line-id="${escapeHtml(line.id)}"
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
      data-member-registration-field-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="适用产线">
        ${checkboxes}
      </div>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(panelHint)}</p>
    </div>`;
}

export function setMemberRegistrationFieldLinesPanelVisible(seq: MemberRegistrationFieldSeq, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-member-registration-field-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel.querySelectorAll<HTMLInputElement>("[data-member-registration-field-line]").forEach((input) => {
      if (Number(input.getAttribute("data-member-registration-field-line")) === seq) {
        input.disabled = !visible;
      }
    });
  });
}

function collectLinesFromPanel(panel: HTMLElement, seq: MemberRegistrationFieldSeq): MemberLoginProductLineId[] {
  const lines: MemberLoginProductLineId[] = [];
  panel.querySelectorAll<HTMLInputElement>(`[data-member-registration-field-line="${seq}"]:checked`).forEach((input) => {
    const id = input.getAttribute("data-member-registration-line-id");
    if (id && ALL_LINE_IDS.includes(id as MemberLoginProductLineId)) {
      lines.push(id as MemberLoginProductLineId);
    }
  });
  return lines;
}

export function bindMemberRegistrationFieldsUi(root: ParentNode = document): void {
  for (const seq of MEMBER_REGISTRATION_FIELD_SEQS) {
    root.querySelectorAll<HTMLElement>(`[data-member-registration-field-panel="${seq}"]`).forEach((panel) => {
      if (panel.dataset.memberRegistrationFieldPanelBound === "1") return;
      panel.dataset.memberRegistrationFieldPanelBound = "1";
      panel.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches(`[data-member-registration-field-line="${seq}"]`)) return;
        writeMemberRegistrationFieldLines(seq, collectLinesFromPanel(panel, seq));
      });
    });
  }
}
