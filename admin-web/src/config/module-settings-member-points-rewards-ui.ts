/**
 * 会员中心 / 前厅 · 积分规则与兑换商品
 * — 525 菜单页面展示积分菜：产线多选（样式对齐 509 展示账户积分），无总开关、默认展开
 * — 527 纯积分订单：默认开启（无总开关）+ 产线多选（POS / PayPad / POS GO / eMenu / SDI）
 * — 526 积分菜展示位置：按产线单选顶部/尾部（Kiosk / eMenu / SDI / Online Order）
 * seq 509 展示账户积分已迁至 guest-menu-line-toggle-ui（前厅·食客端·首页与版式）。
 */

import {
  FOH_LINE_CONFIG_ROW_ATTR,
  getFohActiveLineFilterId,
} from "./foh-settings-by-line-filter";
import {
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES,
  normalizeMenuOrderLimitOtherProductLineIds,
  type MenuOrderLimitOtherProductLineId,
} from "./menu-order-limit-product-lines";
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

/** 526 积分菜展示位置适用产线（不含 POS / PayPad） */
export const MEMBER_POINTS_DISH_POSITION_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type MemberPointsDishPositionProductLineId =
  (typeof MEMBER_POINTS_DISH_POSITION_PRODUCT_LINES)[number]["id"];

/** 527 纯积分订单适用产线（与菜单下单限制·其他设置一致） */
export const MEMBER_POINTS_ONLY_ORDER_PRODUCT_LINES = MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES;

export type MemberPointsOnlyOrderProductLineId = MenuOrderLimitOtherProductLineId;

/** 527 等积分字段（菜单下单限制页默认开启、不展示总开关） */
export const MEMBER_POINTS_TOGGLE_FIELD_SEQS = [MEMBER_POINTS_ONLY_ORDER_SEQ] as const;

export type MemberPointsToggleFieldSeq = (typeof MEMBER_POINTS_TOGGLE_FIELD_SEQS)[number];

const SHOW_POINTS_DISHES_LINES_STORAGE_ID = "525-show-points-dishes-lines";

const TOGGLE_FIELD_CONFIG: Record<
  MemberPointsToggleFieldSeq,
  { linesStorageId: string; linesAriaLabel: string }
> = {
  [MEMBER_POINTS_ONLY_ORDER_SEQ]: {
    linesStorageId: "527-points-only-order-lines",
    linesAriaLabel: "纯积分订单适用产线",
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
  MemberPointsDishPositionProductLineId,
  MemberPointsDishPosition
>;

const DEFAULT_POSITION: MemberPointsDishPosition = "top";

const ALL_LINE_IDS: MemberLoginProductLineId[] = MEMBER_LOGIN_PRODUCT_LINES.map((l) => l.id);

const POINTS_ONLY_ORDER_LINE_IDS: MemberPointsOnlyOrderProductLineId[] = [
  ...MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
];

const POSITION_LINE_IDS: MemberPointsDishPositionProductLineId[] =
  MEMBER_POINTS_DISH_POSITION_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

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
  return (MEMBER_POINTS_TOGGLE_FIELD_SEQS as readonly number[]).includes(seq);
}

function isValidPosition(value: string): value is MemberPointsDishPosition {
  return MEMBER_POINTS_DISH_POSITION_OPTIONS.some((opt) => opt.value === value);
}

export function isMemberShowPointsDishesSeq(seq: number): boolean {
  return seq === MEMBER_SHOW_POINTS_DISHES_SEQ;
}

export function isMemberPointsToggleFieldSeq(seq: number): seq is MemberPointsToggleFieldSeq {
  return isToggleFieldSeq(seq);
}

export function isMemberPointsDishPositionSeq(seq: number): boolean {
  return seq === MEMBER_POINTS_DISH_POSITION_SEQ;
}

export function readMemberShowPointsDishesLines(): MemberLoginProductLineId[] {
  const normalized = normalizeLineIds(
    readModuleSettingJson<unknown>(SHOW_POINTS_DISHES_LINES_STORAGE_ID, null),
  );
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(MEMBER_SHOW_POINTS_DISHES_SEQ)) {
    writeMemberShowPointsDishesLines(ALL_LINE_IDS);
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function writeMemberShowPointsDishesLines(lines: MemberLoginProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(SHOW_POINTS_DISHES_LINES_STORAGE_ID, unique);
}

export function ensureMemberShowPointsDishesLinesDefault(): void {
  if (readMemberShowPointsDishesLines().length === 0) {
    writeMemberShowPointsDishesLines(ALL_LINE_IDS);
  }
}

export function readMemberPointsToggleFieldLines(
  seq: MemberPointsToggleFieldSeq,
): MemberPointsOnlyOrderProductLineId[] {
  const { linesStorageId } = TOGGLE_FIELD_CONFIG[seq];
  const normalized = normalizeMenuOrderLimitOtherProductLineIds(
    readModuleSettingJson<unknown>(linesStorageId, null),
  );
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    writeMemberPointsToggleFieldLines(seq, POINTS_ONLY_ORDER_LINE_IDS);
    return [...POINTS_ONLY_ORDER_LINE_IDS];
  }
  return [];
}

export function writeMemberPointsToggleFieldLines(
  seq: MemberPointsToggleFieldSeq,
  lines: MemberPointsOnlyOrderProductLineId[],
): void {
  const unique = POINTS_ONLY_ORDER_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(TOGGLE_FIELD_CONFIG[seq].linesStorageId, unique);
}

export function ensureMemberPointsToggleFieldLinesDefault(seq: MemberPointsToggleFieldSeq): void {
  if (readMemberPointsToggleFieldLines(seq).length === 0) {
    writeMemberPointsToggleFieldLines(seq, POINTS_ONLY_ORDER_LINE_IDS);
  }
}

function defaultPositionByLine(position: MemberPointsDishPosition = DEFAULT_POSITION): MemberPointsDishPositionByLine {
  return Object.fromEntries(
    MEMBER_POINTS_DISH_POSITION_PRODUCT_LINES.map((line) => [line.id, position]),
  ) as MemberPointsDishPositionByLine;
}

function normalizePositionByLine(
  raw: Partial<Record<string, MemberPointsDishPosition>>,
): MemberPointsDishPositionByLine {
  const base = defaultPositionByLine();
  /** 旧版 PayPad 并入 eMenu；POS 已移除 */
  const legacyAliases: Record<string, MemberPointsDishPositionProductLineId> = {
    paypad: "emenu",
    payPad: "emenu",
  };
  for (const [rawId, value] of Object.entries(raw)) {
    const lineId =
      POSITION_LINE_IDS.includes(rawId as MemberPointsDishPositionProductLineId)
        ? (rawId as MemberPointsDishPositionProductLineId)
        : legacyAliases[rawId];
    if (!lineId || !isValidPosition(String(value ?? ""))) continue;
    base[lineId] = value!;
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

/** 525：样式对齐 509 展示账户积分（分段产线多选），无总开关、默认展开 */
export function renderMemberShowPointsDishesPanelHtml(): string {
  ensureMemberShowPointsDishesLinesDefault();
  const selected = new Set(readMemberShowPointsDishesLines());
  const cells = MEMBER_LOGIN_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 px-1.5 py-3 text-sm text-foreground sm:px-2 cursor-pointer ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-member-show-points-dishes-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center text-xs leading-tight sm:text-sm">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div class="mt-3" data-member-show-points-dishes-panel="${MEMBER_SHOW_POINTS_DISHES_SEQ}">
      <div
        class="flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-muted/40"
        data-member-show-points-dishes-lines
        role="group"
        aria-label="菜单页面展示积分菜适用产线"
      >
        ${cells}
      </div>
    </div>`;
}

export function renderMemberPointsToggleFieldLinesPanelHtml(
  seq: MemberPointsToggleFieldSeq,
  on: boolean,
): string {
  const selected = new Set(readMemberPointsToggleFieldLines(seq));
  const { linesAriaLabel } = TOGGLE_FIELD_CONFIG[seq];
  const cells = MEMBER_POINTS_ONLY_ORDER_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 px-1.5 py-3 text-sm text-foreground sm:px-2 ${on ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          data-member-points-toggle-field-line="${seq}"
          data-member-points-line-id="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${on ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center text-xs leading-tight sm:text-sm">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-member-points-toggle-field-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <div
        class="flex w-full max-w-3xl overflow-hidden rounded-md border border-border bg-muted/40"
        role="group"
        aria-label="${escapeHtml(linesAriaLabel)}"
      >
        ${cells}
      </div>
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
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

export function renderMemberPointsDishPositionByLineEditorHtml(): string {
  const values = readMemberPointsDishPositionByLine();
  const activeLine = getFohActiveLineFilterId();
  const lines = activeLine
    ? MEMBER_POINTS_DISH_POSITION_PRODUCT_LINES.filter((line) => line.id === activeLine)
    : MEMBER_POINTS_DISH_POSITION_PRODUCT_LINES;
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
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">展示位置（单选）</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function collectShowPointsDishesLinesFromGroup(group: HTMLElement): MemberLoginProductLineId[] {
  const lines: MemberLoginProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-member-show-points-dishes-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-member-show-points-dishes-line");
    if (id && ALL_LINE_IDS.includes(id as MemberLoginProductLineId)) {
      lines.push(id as MemberLoginProductLineId);
    }
  });
  return lines;
}

function collectToggleLinesFromPanel(
  panel: HTMLElement,
  seq: MemberPointsToggleFieldSeq,
): MemberPointsOnlyOrderProductLineId[] {
  const lines: MemberPointsOnlyOrderProductLineId[] = [];
  panel.querySelectorAll<HTMLInputElement>(`[data-member-points-toggle-field-line="${seq}"]:checked`).forEach((input) => {
    const id = input.getAttribute("data-member-points-line-id");
    if (id && POINTS_ONLY_ORDER_LINE_IDS.includes(id as MemberPointsOnlyOrderProductLineId)) {
      lines.push(id as MemberPointsOnlyOrderProductLineId);
    }
  });
  return lines;
}

function collectPositionByLineFromEditor(editor: HTMLElement): MemberPointsDishPositionByLine {
  const values = readMemberPointsDishPositionByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-member-points-dish-position-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute(
      "data-member-points-dish-position-line",
    ) as MemberPointsDishPositionProductLineId | null;
    const value = input.value;
    if (!lineId || !POSITION_LINE_IDS.includes(lineId) || !isValidPosition(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function bindMemberPointsRewardsUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-member-show-points-dishes-lines]").forEach((group) => {
    if (group.dataset.memberShowPointsDishesBound === "1") return;
    group.dataset.memberShowPointsDishesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-member-show-points-dishes-line]")) return;
      writeMemberShowPointsDishesLines(collectShowPointsDishesLinesFromGroup(group));
    });
  });

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
