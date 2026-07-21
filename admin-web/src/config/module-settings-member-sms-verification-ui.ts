/**
 * 登录/注册短信验证码（seq 622；合并原 508）。
 * Catalog hub：前厅 · guest-order-rules；紧挨 623；默认开启，无主开关，仅配置适用产线。
 */

import {
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { writeModuleSettingToggleOn } from "./module-settings-toggle-ui";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

export const MEMBER_SMS_VERIFICATION_SEQ = 622;

const LINES_STORAGE_ID = "622-sms-verification-lines";

/** seq 622 短信验证码适用产线（与 623 点单前身份策略产线集一致） */
export const MEMBER_SMS_VERIFICATION_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "cds", label: "CDS" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type MemberSmsVerificationProductLineId =
  (typeof MEMBER_SMS_VERIFICATION_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: MemberSmsVerificationProductLineId[] =
  MEMBER_SMS_VERIFICATION_PRODUCT_LINES.map((l) => l.id);

/** 旧存储中的产线键 → 新产线（POS/Paypad 已移除） */
const LEGACY_SMS_LINE_ALIASES: Partial<Record<string, MemberSmsVerificationProductLineId>> = {
  pos: "kiosk",
  paypad: "emenu",
  payPad: "emenu",
};

/** 供 507/510/509 等仍沿用旧产线矩阵的设置项；622 请用 MEMBER_SMS_VERIFICATION_PRODUCT_LINES */
export const MEMBER_LOGIN_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "paypad", label: "Paypad" },
] as const;

export type MemberLoginProductLineId = (typeof MEMBER_LOGIN_PRODUCT_LINES)[number]["id"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveSmsLineId(id: string): MemberSmsVerificationProductLineId | null {
  if (ALL_LINE_IDS.includes(id as MemberSmsVerificationProductLineId)) {
    return id as MemberSmsVerificationProductLineId;
  }
  return LEGACY_SMS_LINE_ALIASES[id] ?? null;
}

function normalizeLineIds(raw: unknown): MemberSmsVerificationProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<MemberSmsVerificationProductLineId>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const resolved = resolveSmsLineId(item);
    if (resolved) seen.add(resolved);
  }
  return ALL_LINE_IDS.filter((id) => seen.has(id));
}

export function readMemberSmsVerificationLines(): MemberSmsVerificationProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  // 默认开启：无存储或旧数据为空时，默认全产线勾选
  writeMemberSmsVerificationLines([...ALL_LINE_IDS]);
  return [...ALL_LINE_IDS];
}

export function writeMemberSmsVerificationLines(lines: MemberSmsVerificationProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function ensureMemberSmsVerificationLinesDefault(): void {
  writeModuleSettingToggleOn(MEMBER_SMS_VERIFICATION_SEQ, true);
  if (readModuleSettingJson<unknown>(LINES_STORAGE_ID, null) == null) {
    writeMemberSmsVerificationLines([...ALL_LINE_IDS]);
    return;
  }
  // 触发一次读取以补齐空数组为默认全选
  readMemberSmsVerificationLines();
}

export function isMemberSmsVerificationSeq(seq: number): boolean {
  return seq === MEMBER_SMS_VERIFICATION_SEQ;
}

export function renderMemberSmsVerificationLinesPanelHtml(seq: number): string {
  const selected = new Set(readMemberSmsVerificationLines());
  const cells = MEMBER_SMS_VERIFICATION_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground cursor-pointer sm:px-6 ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-member-sms-verification-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div class="mt-3" data-member-sms-verification-panel="${seq}">
      <div
        class="flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-muted/40"
        data-member-sms-verification-lines="${seq}"
        role="group"
        aria-label="短信验证码适用产线"
      >
        ${cells}
      </div>
    </div>`;
}

/** @deprecated 已默认开启且无主开关，保留空实现以免旧调用报错 */
export function setMemberSmsVerificationLinesPanelVisible(_seq: number, _visible: boolean): void {
  /* no-op */
}

function collectLinesFromPanel(panel: HTMLElement): MemberSmsVerificationProductLineId[] {
  const lines: MemberSmsVerificationProductLineId[] = [];
  panel.querySelectorAll<HTMLInputElement>("[data-member-sms-verification-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-member-sms-verification-line");
    if (id && ALL_LINE_IDS.includes(id as MemberSmsVerificationProductLineId)) {
      lines.push(id as MemberSmsVerificationProductLineId);
    }
  });
  return lines;
}

export function bindMemberSmsVerificationUi(root: ParentNode = document): void {
  ensureMemberSmsVerificationLinesDefault();
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
