/**
 * 会员中心 · 积分规则与兑换商品（525/527 开关+产线多选；526 产线矩阵顶部/尾部）。
 * seq 509 展示账户积分已迁至 guest-menu-line-toggle-ui（前厅·食客端·首页与版式）。
 */

import {
  FOH_LINE_CONFIG_ROW_ATTR,
  getFohActiveLineFilterId,
} from "./foh-settings-by-line-filter";
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

export const MEMBER_SHOW_ACCOUNT_POINTS_SEQ = 509;
export const MEMBER_SHOW_POINTS_DISHES_SEQ = 525;
export const MEMBER_POINTS_DISH_POSITION_SEQ = 526;
export const MEMBER_POINTS_ONLY_ORDER_SEQ = 527;

export const MEMBER_POINTS_TOGGLE_FIELD_SEQS = [
  MEMBER_SHOW_POINTS_DISHES_SEQ,
  MEMBER_POINTS_ONLY_ORDER_SEQ,
] as const;

export type MemberPointsToggleFieldSeq = (typeof MEMBER_POINTS_TOGGLE_FIELD_SEQS)[number];

const TOGGLE_FIELD_CONFIG: Record<
  MemberPointsToggleFieldSeq,
  { linesStorageId: string; panelHint: string }
> = {
  [MEMBER_SHOW_POINTS_DISHES_SEQ]: {
    linesStorageId: "525-show-points-dishes-lines",
    panelHint: "勾选产线在菜单页展示可积分兑换的商品。",
  },
  [MEMBER_POINTS_ONLY_ORDER_SEQ]: {
    linesStorageId: "527-points-only-order-lines",
    panelHint: "勾选产线允许订单仅含积分商品时直接下单兑换。",
  },
};

const POINTS_DISH_POSITION_STORAGE_ID = "526-points-dish-position-by-line";

export const MEMBER_POINTS_DISH_POSITION_OPTIONS = [
  { value: "top", label: "顶部展示" },
  { value: "bottom", label: "尾部展示" },
] as const;

export type MemberPointsDishPosition =
  (typeof MEMBER_POINTS_DISH_POSITION_OPTIONS)[number]["value"];

export type MemberPointsDishPositionByLine = Record<
  MemberLoginProductLineId,
  MemberPointsDishPosition
>;

const DEFAULT_POSITION: MemberPointsDishPosition = "top";

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

function isToggleFieldSeq(seq: number): seq is MemberPointsToggleFieldSeq {
  return seq in TOGGLE_FIELD_CONFIG;
}

function isValidPosition(value: string): value is MemberPointsDishPosition {
  return MEMBER_POINTS_DISH_POSITION_OPTIONS.some((opt) => opt.value === value);
}

export function isMemberPointsToggleFieldSeq(seq: number): seq is MemberPointsToggleFieldSeq {
  return isToggleFieldSeq(seq);
}

export function isMemberPointsDishPositionSeq(seq: number): boolean {
  return seq === MEMBER_POINTS_DISH_POSITION_SEQ;
}

export function readMemberPointsToggleFieldLines(seq: MemberPointsToggleFieldSeq): MemberLoginProductLineId[] {
  const { linesStorageId } = TOGGLE_FIELD_CONFIG[seq];
  const normalized = normalizeLineIds(readModuleSettingJson<unknown>(linesStorageId, null));
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    writeMemberPointsToggleFieldLines(seq, ALL_LINE_IDS);
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function writeMemberPointsToggleFieldLines(
  seq: MemberPointsToggleFieldSeq,
  lines: MemberLoginProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(TOGGLE_FIELD_CONFIG[seq].linesStorageId, unique);
}

export function ensureMemberPointsToggleFieldLinesDefault(seq: MemberPointsToggleFieldSeq): void {
  if (readMemberPointsToggleFieldLines(seq).length === 0) {
    writeMemberPointsToggleFieldLines(seq, ALL_LINE_IDS);
  }
}

function defaultPositionByLine(position: MemberPointsDishPosition = DEFAULT_POSITION): MemberPointsDishPositionByLine {
  return Object.fromEntries(
    MEMBER_LOGIN_PRODUCT_LINES.map((line) => [line.id, position]),
  ) as MemberPointsDishPositionByLine;
}

function normalizePositionByLine(raw: Partial<MemberPointsDishPositionByLine>): MemberPointsDishPositionByLine {
  const base = defaultPositionByLine();
  for (const line of MEMBER_LOGIN_PRODUCT_LINES) {
    const v = raw[line.id];
    base[line.id] = isValidPosition(String(v ?? "")) ? v! : DEFAULT_POSITION;
  }
  return base;
}

export function readMemberPointsDishPositionByLine(): MemberPointsDishPositionByLine {
  const raw = readModuleSettingJson<Partial<MemberPointsDishPositionByLine>>(
    POINTS_DISH_POSITION_STORAGE_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizePositionByLine(raw);
  }
  const migrated = defaultPositionByLine();
  writeMemberPointsDishPositionByLine(migrated);
  return migrated;
}

export function writeMemberPointsDishPositionByLine(values: MemberPointsDishPositionByLine): void {
  writeModuleSettingJson(POINTS_DISH_POSITION_STORAGE_ID, normalizePositionByLine(values));
}

export function renderMemberPointsToggleFieldLinesPanelHtml(
  seq: MemberPointsToggleFieldSeq,
  on: boolean,
): string {
  const selected = new Set(readMemberPointsToggleFieldLines(seq));
  const { panelHint } = TOGGLE_FIELD_CONFIG[seq];
  const checkboxes = MEMBER_LOGIN_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
          data-member-points-toggle-field-line="${seq}"
          data-member-points-line-id="${escapeHtml(line.id)}"
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
      data-member-points-toggle-field-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="适用产线">
        ${checkboxes}
      </div>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(panelHint)}</p>
    </div>`;
}

export function setMemberPointsToggleFieldLinesPanelVisible(
  seq: MemberPointsToggleFieldSeq,
  visible: boolean,
): void {
  document.querySelectorAll<HTMLElement>(`[data-member-points-toggle-field-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel.querySelectorAll<HTMLInputElement>(`[data-member-points-toggle-field-line="${seq}"]`).forEach((input) => {
      input.disabled = !visible;
    });
  });
}

export function renderMemberPointsDishPositionByLineEditorHtml(): string {
  const values = readMemberPointsDishPositionByLine();
  const activeLine = getFohActiveLineFilterId();
  const lines = activeLine
    ? MEMBER_LOGIN_PRODUCT_LINES.filter((line) => line.id === activeLine)
    : MEMBER_LOGIN_PRODUCT_LINES;
  const rows = lines.map((line) => {
    const groupName = `member-points-dish-position-${line.id}`;
    const radios = MEMBER_POINTS_DISH_POSITION_OPTIONS.map((opt) => {
      const checked = values[line.id] === opt.value;
      return `
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-member-points-dish-position-line="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    }).join("");

    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="radiogroup" aria-label="${escapeHtml(line.label)} 积分菜展示位置">${radios}</div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-member-points-dish-position-editor class="space-y-2">
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        各产线独立配置积分菜在菜单中的展示位置；须对应产线已开启「菜单页面展示积分菜」。
      </p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[6.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">展示位置（单选）</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function collectToggleLinesFromPanel(panel: HTMLElement, seq: MemberPointsToggleFieldSeq): MemberLoginProductLineId[] {
  const lines: MemberLoginProductLineId[] = [];
  panel.querySelectorAll<HTMLInputElement>(`[data-member-points-toggle-field-line="${seq}"]:checked`).forEach((input) => {
    const id = input.getAttribute("data-member-points-line-id");
    if (id && ALL_LINE_IDS.includes(id as MemberLoginProductLineId)) {
      lines.push(id as MemberLoginProductLineId);
    }
  });
  return lines;
}

function collectPositionByLineFromEditor(editor: HTMLElement): MemberPointsDishPositionByLine {
  const values = readMemberPointsDishPositionByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-member-points-dish-position-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute("data-member-points-dish-position-line") as MemberLoginProductLineId | null;
    const value = input.value;
    if (!lineId || !isValidPosition(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function bindMemberPointsRewardsUi(root: ParentNode = document): void {
  for (const seq of MEMBER_POINTS_TOGGLE_FIELD_SEQS) {
    root.querySelectorAll<HTMLElement>(`[data-member-points-toggle-field-panel="${seq}"]`).forEach((panel) => {
      if (panel.dataset.memberPointsToggleFieldPanelBound === "1") return;
      panel.dataset.memberPointsToggleFieldPanelBound = "1";
      panel.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches(`[data-member-points-toggle-field-line="${seq}"]`)) return;
        writeMemberPointsToggleFieldLines(seq, collectToggleLinesFromPanel(panel, seq));
      });
    });
  }

  root.querySelectorAll<HTMLElement>("[data-member-points-dish-position-editor]").forEach((editor) => {
    if (editor.dataset.memberPointsDishPositionEditorBound === "1") return;
    editor.dataset.memberPointsDishPositionEditorBound = "1";
    editor.addEventListener("change", (e) => {
      if (!(e.target as HTMLElement).matches("[data-member-points-dish-position-line]")) return;
      writeMemberPointsDishPositionByLine(collectPositionByLineFromEditor(editor));
    });
  });
}
