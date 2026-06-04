/**
 * 点单前会员身份策略（seq 623；合并原 623/624 布尔开关）。
 * Catalog hub：前厅 · guest-order-rules；UI 按 seq 挂载。
 * 各产线独立配置，每条产线三选一：可选 / 强制 / 不展示。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  readModuleSettingRadio,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const MEMBER_PRE_ORDER_LOGIN_POLICY_SEQ = 623;

export const MEMBER_PRE_ORDER_LOGIN_POLICY_FIELD_ID = "623-member-pre-order-login-policy";

const POLICY_BY_LINE_STORAGE_ID = "623-member-pre-order-login-policy-by-line";

/** 点单前会员身份策略适用产线（与 seq 622 短信验证码产线范围独立） */
export const MEMBER_PRE_ORDER_LOGIN_POLICY_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type MemberPreOrderLoginPolicyProductLineId =
  (typeof MEMBER_PRE_ORDER_LOGIN_POLICY_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: MemberPreOrderLoginPolicyProductLineId[] =
  MEMBER_PRE_ORDER_LOGIN_POLICY_PRODUCT_LINES.map((l) => l.id);

/** 旧存储中的产线键 → 新产线（POS/Paypad 已移除） */
const LEGACY_POLICY_LINE_ALIASES: Partial<
  Record<string, MemberPreOrderLoginPolicyProductLineId>
> = {
  pos: "kiosk",
  paypad: "emenu",
  payPad: "emenu",
};

export const MEMBER_PRE_ORDER_LOGIN_POLICY_OPTIONS = [
  { value: "optional", label: "可选登录（展示登录/注册页，不强制）" },
  { value: "required", label: "点单前必须登录/注册" },
  { value: "hidden", label: "不展示登录/注册页" },
] as const;

export type MemberPreOrderLoginPolicy =
  (typeof MEMBER_PRE_ORDER_LOGIN_POLICY_OPTIONS)[number]["value"];

export type MemberPreOrderLoginPolicyByLine = Record<
  MemberPreOrderLoginPolicyProductLineId,
  MemberPreOrderLoginPolicy
>;

const DEFAULT_POLICY: MemberPreOrderLoginPolicy = "optional";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidPolicy(value: string): value is MemberPreOrderLoginPolicy {
  return MEMBER_PRE_ORDER_LOGIN_POLICY_OPTIONS.some((opt) => opt.value === value);
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function migrateFromLegacyToggles(): MemberPreOrderLoginPolicy {
  if (readLegacyToggleOn(623)) return "required";
  if (readLegacyToggleOn(624)) return "hidden";
  return "optional";
}

function defaultPolicyByLine(policy: MemberPreOrderLoginPolicy = DEFAULT_POLICY): MemberPreOrderLoginPolicyByLine {
  return {
    kiosk: policy,
    emenu: policy,
    sdi: policy,
    "online-order": policy,
  };
}

function resolvePolicyFromRawRecord(
  record: Record<string, unknown>,
  lineId: MemberPreOrderLoginPolicyProductLineId,
): MemberPreOrderLoginPolicy | null {
  const direct = record[lineId];
  if (isValidPolicy(String(direct ?? ""))) {
    return direct as MemberPreOrderLoginPolicy;
  }
  for (const [legacyKey, targetLine] of Object.entries(LEGACY_POLICY_LINE_ALIASES)) {
    if (targetLine !== lineId) continue;
    const legacy = record[legacyKey];
    if (isValidPolicy(String(legacy ?? ""))) {
      return legacy as MemberPreOrderLoginPolicy;
    }
  }
  return null;
}

function normalizePolicyByLine(raw: Partial<Record<string, unknown>>): MemberPreOrderLoginPolicyByLine {
  const base = defaultPolicyByLine();
  for (const line of MEMBER_PRE_ORDER_LOGIN_POLICY_PRODUCT_LINES) {
    const resolved = resolvePolicyFromRawRecord(raw, line.id);
    base[line.id] = resolved ?? DEFAULT_POLICY;
  }
  return base;
}

function readLegacyGlobalPolicy(): MemberPreOrderLoginPolicy | null {
  const stored = readModuleSettingRadio(MEMBER_PRE_ORDER_LOGIN_POLICY_FIELD_ID, "");
  if (isValidPolicy(stored)) return stored;
  if (readLegacyToggleOn(623) || readLegacyToggleOn(624)) {
    return migrateFromLegacyToggles();
  }
  return null;
}

export function readMemberPreOrderLoginPolicyByLine(): MemberPreOrderLoginPolicyByLine {
  const raw = readModuleSettingJson<Partial<Record<string, unknown>>>(
    POLICY_BY_LINE_STORAGE_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizePolicyByLine(raw);
  }

  const legacy = readLegacyGlobalPolicy();
  const migrated = defaultPolicyByLine(legacy ?? DEFAULT_POLICY);
  writeMemberPreOrderLoginPolicyByLine(migrated);
  return migrated;
}

export function writeMemberPreOrderLoginPolicyByLine(values: MemberPreOrderLoginPolicyByLine): void {
  writeModuleSettingJson(POLICY_BY_LINE_STORAGE_ID, normalizePolicyByLine(values));
}

/** @deprecated 取 Kiosk 产线策略；新代码请用 readMemberPreOrderLoginPolicyByLine */
export function readMemberPreOrderLoginPolicy(): MemberPreOrderLoginPolicy {
  return readMemberPreOrderLoginPolicyByLine().kiosk;
}

/** @deprecated 全产线写入同一策略；新代码请用 writeMemberPreOrderLoginPolicyByLine */
export function writeMemberPreOrderLoginPolicy(policy: MemberPreOrderLoginPolicy): void {
  writeMemberPreOrderLoginPolicyByLine(defaultPolicyByLine(policy));
}

export function isMemberPreOrderLoginPolicySeq(seq: number): boolean {
  return seq === MEMBER_PRE_ORDER_LOGIN_POLICY_SEQ;
}

export function renderMemberPreOrderLoginPolicyByLineEditorHtml(): string {
  const values = readMemberPreOrderLoginPolicyByLine();
  const rows = MEMBER_PRE_ORDER_LOGIN_POLICY_PRODUCT_LINES.map((line) => {
    const groupName = `member-pre-order-login-policy-${line.id}`;
    const radios = MEMBER_PRE_ORDER_LOGIN_POLICY_OPTIONS.map((opt) => {
      const checked = values[line.id] === opt.value;
      return `
        <label class="inline-flex cursor-pointer items-start gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} mt-0.5"
            ${checked ? "checked" : ""}
            data-member-login-policy-line="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span class="leading-snug">${escapeHtml(opt.label)}</span>
        </label>`;
    }).join("");

    return `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-col gap-2" role="radiogroup" aria-label="${escapeHtml(line.label)} 点单前会员身份策略">${radios}</div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-member-login-policy-editor class="space-y-2">
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        每条产线独立配置，且只能选一种策略；与 seq 622 短信验证码产线范围可不同。
      </p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[6.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">点单前会员身份策略（单选）</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function collectPolicyByLineFromEditor(editor: HTMLElement): MemberPreOrderLoginPolicyByLine {
  const values = readMemberPreOrderLoginPolicyByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-member-login-policy-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute(
      "data-member-login-policy-line",
    ) as MemberPreOrderLoginPolicyProductLineId | null;
    const value = input.value;
    if (!lineId || !ALL_LINE_IDS.includes(lineId) || !isValidPolicy(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function bindMemberPreOrderLoginPolicyEditor(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-member-login-policy-editor]").forEach((editor) => {
    if (editor.dataset.memberLoginPolicyEditorBound === "1") return;
    editor.dataset.memberLoginPolicyEditorBound = "1";
    editor.addEventListener("change", (e) => {
      if (!(e.target as HTMLElement).matches("[data-member-login-policy-line]")) return;
      writeMemberPreOrderLoginPolicyByLine(collectPolicyByLineFromEditor(editor));
    });
  });
}
