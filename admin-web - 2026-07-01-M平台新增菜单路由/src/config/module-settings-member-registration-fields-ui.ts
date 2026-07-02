/**
 * 前厅 · 食客端·下单与规则：seq 510 默认选中隐私条款（主开关 + 多产线多选）。
 * seq 504/505/506/507 见各自 guest-*-page-ui。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const MEMBER_PRIVACY_DEFAULT_SEQ = 510;

export type MemberRegistrationFieldSeq = typeof MEMBER_PRIVACY_DEFAULT_SEQ;

const LINES_STORAGE_ID = "510-privacy-default-lines";

export const MEMBER_PRIVACY_DEFAULT_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
  { id: "cds", label: "CDS" },
] as const;

export type MemberPrivacyDefaultProductLineId =
  (typeof MEMBER_PRIVACY_DEFAULT_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: MemberPrivacyDefaultProductLineId[] =
  MEMBER_PRIVACY_DEFAULT_PRODUCT_LINES.map((l) => l.id);

/** 旧产线键（POS/Paypad 等）迁移到新矩阵 */
const LEGACY_LINE_ALIASES: Partial<Record<string, MemberPrivacyDefaultProductLineId>> = {
  pos: "kiosk",
  paypad: "cds",
  payPad: "cds",
};

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(MEMBER_PRIVACY_DEFAULT_SEQ)) === "1";
  } catch {
    return false;
  }
}

function normalizeLineIds(raw: unknown): MemberPrivacyDefaultProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<MemberPrivacyDefaultProductLineId>();
  const out: MemberPrivacyDefaultProductLineId[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    let id: MemberPrivacyDefaultProductLineId | undefined;
    if (ALL_LINE_IDS.includes(item as MemberPrivacyDefaultProductLineId)) {
      id = item as MemberPrivacyDefaultProductLineId;
    } else {
      const mapped = LEGACY_LINE_ALIASES[item];
      if (mapped) id = mapped;
    }
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function readMemberPrivacyDefaultLines(): MemberPrivacyDefaultProductLineId[] {
  const normalized = normalizeLineIds(readModuleSettingJson<unknown>(LINES_STORAGE_ID, null));
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    writeMemberPrivacyDefaultLines([...ALL_LINE_IDS]);
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function writeMemberPrivacyDefaultLines(lines: MemberPrivacyDefaultProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function ensureMemberPrivacyDefaultLinesDefault(): void {
  if (readMemberPrivacyDefaultLines().length === 0 && readLegacyToggleOn()) {
    writeMemberPrivacyDefaultLines([...ALL_LINE_IDS]);
  }
}

export function isMemberPrivacyDefaultSeq(seq: number): boolean {
  return seq === MEMBER_PRIVACY_DEFAULT_SEQ;
}

/** @deprecated 使用 isMemberPrivacyDefaultSeq */
export function isMemberRegistrationFieldSeq(seq: number): boolean {
  return isMemberPrivacyDefaultSeq(seq);
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readMemberPrivacyDefaultLines());
  const cells = MEMBER_PRIVACY_DEFAULT_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-member-privacy-default-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-3xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-member-privacy-default-lines="${MEMBER_PRIVACY_DEFAULT_SEQ}"
      role="group"
      aria-label="默认选中隐私条款适用产线"
    >
      ${cells}
    </div>`;
}

export function renderMemberPrivacyDefaultPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-member-privacy-default-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        勾选产线在输入手机号页面的隐私条款默认勾选（食客仍可取消）。
      </p>
    </div>`;
}

/** @deprecated 使用 renderMemberPrivacyDefaultPanelHtml */
export function renderMemberRegistrationFieldLinesPanelHtml(seq: number, on: boolean): string {
  return renderMemberPrivacyDefaultPanelHtml(seq, on);
}

export function setMemberPrivacyDefaultPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-member-privacy-default-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-member-privacy-default-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

/** @deprecated 使用 setMemberPrivacyDefaultPanelVisible */
export function setMemberRegistrationFieldLinesPanelVisible(
  seq: number,
  visible: boolean,
): void {
  setMemberPrivacyDefaultPanelVisible(seq, visible);
}

function collectLinesFromGroup(group: HTMLElement): MemberPrivacyDefaultProductLineId[] {
  const lines: MemberPrivacyDefaultProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-member-privacy-default-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-member-privacy-default-line");
    if (id && ALL_LINE_IDS.includes(id as MemberPrivacyDefaultProductLineId)) {
      lines.push(id as MemberPrivacyDefaultProductLineId);
    }
  });
  writeMemberPrivacyDefaultLines(lines);
  return lines;
}

export function bindMemberPrivacyDefaultUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(`[data-member-privacy-default-lines="${MEMBER_PRIVACY_DEFAULT_SEQ}"]`).forEach((group) => {
    if (group.dataset.memberPrivacyDefaultBound === "1") return;
    group.dataset.memberPrivacyDefaultBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-member-privacy-default-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}

/** @deprecated 使用 bindMemberPrivacyDefaultUi */
export function bindMemberRegistrationFieldsUi(root: ParentNode = document): void {
  bindMemberPrivacyDefaultUi(root);
}

/** @deprecated 使用 ensureMemberPrivacyDefaultLinesDefault */
export function ensureMemberRegistrationFieldLinesDefault(seq: number): void {
  if (seq === MEMBER_PRIVACY_DEFAULT_SEQ) {
    ensureMemberPrivacyDefaultLinesDefault();
  }
}
