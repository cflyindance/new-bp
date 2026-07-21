/**
 * 前厅 · 食客端·菜单展示与购物车：主开关 + 适用产线多选（Kiosk / eMenu / SDI / Online Order）
 * — 515 展示菜单序号
 * — 516 显示组名称
 * — 517 菜单展示位置：按产线单选侧边/顶部（结构对齐 526，无总开关）
 * — 518 默认展开第一组
 * — 519 菜单图片裁切显示
 * — 520 套餐展示导航栏
 * — 524 瀑布流模式
 * — 528 菜价为0展示价格
 */

import {
  FOH_LINE_CONFIG_ROW_ATTR,
  getFohActiveLineFilterId,
} from "./foh-settings-by-line-filter";
import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingRadio,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_SHOW_SERIAL_SEQ = 515;
export const GUEST_MENU_SHOW_GROUP_NAME_SEQ = 516;
export const GUEST_MENU_NAV_POSITION_SEQ = 517;
export const GUEST_MENU_EXPAND_FIRST_GROUP_SEQ = 518;
export const GUEST_MENU_IMAGE_CROP_SEQ = 519;
export const GUEST_MENU_COMBO_NAV_SEQ = 520;
export const GUEST_MENU_WATERFALL_SEQ = 524;
export const GUEST_MENU_ZERO_PRICE_DISPLAY_SEQ = 528;

export const GUEST_MENU_STRUCTURE_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

/** 517 菜单展示位置适用产线（与结构组一致，独立导出供产线抽取） */
export const GUEST_MENU_NAV_POSITION_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

/** 带总开关的菜单结构设置（517 已改为无开关常显表格） */
export const GUEST_MENU_STRUCTURE_SEQS: readonly number[] = [
  GUEST_MENU_SHOW_SERIAL_SEQ,
  GUEST_MENU_SHOW_GROUP_NAME_SEQ,
  GUEST_MENU_EXPAND_FIRST_GROUP_SEQ,
  GUEST_MENU_IMAGE_CROP_SEQ,
  GUEST_MENU_COMBO_NAV_SEQ,
  GUEST_MENU_WATERFALL_SEQ,
  GUEST_MENU_ZERO_PRICE_DISPLAY_SEQ,
];

type GuestMenuStructureSeq = (typeof GUEST_MENU_STRUCTURE_SEQS)[number];

const LEGACY_NAV_POSITION_RADIO_FIELD_ID = "517-menu-nav-position";
/** 旧版产线多选存储（勿用 *_LINES_STORAGE_ID 命名，避免产线 registry 误抽） */
const LEGACY_NAV_POSITION_LINES_KEY = "517-guest-menu-nav-position-lines";
const NAV_POSITION_BY_LINE_STORAGE_ID = "517-guest-menu-nav-position-by-line";

export const GUEST_MENU_NAV_POSITION_OPTIONS = [
  { value: "side", label: "侧边展示" },
  { value: "top", label: "顶部展示" },
] as const;

export type GuestMenuNavPosition = (typeof GUEST_MENU_NAV_POSITION_OPTIONS)[number]["value"];

export type GuestMenuNavPositionProductLineId =
  (typeof GUEST_MENU_NAV_POSITION_PRODUCT_LINES)[number]["id"];

export type GuestMenuNavPositionByLine = Record<
  GuestMenuNavPositionProductLineId,
  GuestMenuNavPosition
>;

const DEFAULT_NAV_POSITION: GuestMenuNavPosition = "top";

const CONFIG_BY_SEQ: Record<
  GuestMenuStructureSeq,
  { linesStorageId: string; linesAriaLabel: string }
> = {
  [GUEST_MENU_SHOW_SERIAL_SEQ]: {
    linesStorageId: "515-guest-menu-show-serial-lines",
    linesAriaLabel: "展示菜单序号适用产线",
  },
  [GUEST_MENU_SHOW_GROUP_NAME_SEQ]: {
    linesStorageId: "516-guest-menu-show-group-name-lines",
    linesAriaLabel: "显示组名称适用产线",
  },
  [GUEST_MENU_EXPAND_FIRST_GROUP_SEQ]: {
    linesStorageId: "518-guest-menu-expand-first-group-lines",
    linesAriaLabel: "默认展开第一组适用产线",
  },
  [GUEST_MENU_IMAGE_CROP_SEQ]: {
    linesStorageId: "519-guest-menu-image-crop-lines",
    linesAriaLabel: "菜单图片裁切显示适用产线",
  },
  [GUEST_MENU_COMBO_NAV_SEQ]: {
    linesStorageId: "520-guest-menu-combo-nav-lines",
    linesAriaLabel: "套餐展示导航栏适用产线",
  },
  [GUEST_MENU_WATERFALL_SEQ]: {
    linesStorageId: "524-guest-menu-waterfall-lines",
    linesAriaLabel: "瀑布流模式适用产线",
  },
  [GUEST_MENU_ZERO_PRICE_DISPLAY_SEQ]: {
    linesStorageId: "528-guest-menu-zero-price-display-lines",
    linesAriaLabel: "菜价为0展示价格适用产线",
  },
};

type GuestMenuStructureProductLineId =
  (typeof GUEST_MENU_STRUCTURE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestMenuStructureProductLineId[] =
  GUEST_MENU_STRUCTURE_PRODUCT_LINES.map((l) => l.id);

const NAV_POSITION_LINE_IDS: GuestMenuNavPositionProductLineId[] =
  GUEST_MENU_NAV_POSITION_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedToggleSeqs = new Set<number>();
let navPositionMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSeqInGuestMenuStructureGroup(seq: number): seq is GuestMenuStructureSeq {
  return (GUEST_MENU_STRUCTURE_SEQS as readonly number[]).includes(seq);
}

function getConfig(seq: GuestMenuStructureSeq) {
  return CONFIG_BY_SEQ[seq];
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function isValidNavPosition(value: string): value is GuestMenuNavPosition {
  return GUEST_MENU_NAV_POSITION_OPTIONS.some((opt) => opt.value === value);
}

function defaultNavPositionByLine(
  position: GuestMenuNavPosition = DEFAULT_NAV_POSITION,
): GuestMenuNavPositionByLine {
  return Object.fromEntries(
    GUEST_MENU_NAV_POSITION_PRODUCT_LINES.map((line) => [line.id, position]),
  ) as GuestMenuNavPositionByLine;
}

function normalizeNavPositionByLine(
  raw: Partial<Record<string, GuestMenuNavPosition>>,
): GuestMenuNavPositionByLine {
  const base = defaultNavPositionByLine();
  for (const [rawId, value] of Object.entries(raw)) {
    if (!NAV_POSITION_LINE_IDS.includes(rawId as GuestMenuNavPositionProductLineId)) continue;
    if (!isValidNavPosition(String(value ?? ""))) continue;
    base[rawId as GuestMenuNavPositionProductLineId] = value!;
  }
  return base;
}

function readLegacyNavPositionLines(): GuestMenuNavPositionProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LEGACY_NAV_POSITION_LINES_KEY, null);
  if (!Array.isArray(stored)) return [];
  return stored.filter(
    (id): id is GuestMenuNavPositionProductLineId =>
      typeof id === "string" && NAV_POSITION_LINE_IDS.includes(id as GuestMenuNavPositionProductLineId),
  );
}

function migrateLegacyNavPositionByLine(): GuestMenuNavPositionByLine | null {
  let legacyPosition: GuestMenuNavPosition | null = null;
  try {
    if (localStorage.getItem(moduleSettingStorageKey(LEGACY_NAV_POSITION_RADIO_FIELD_ID)) !== null) {
      const v = readModuleSettingRadio(LEGACY_NAV_POSITION_RADIO_FIELD_ID, DEFAULT_NAV_POSITION);
      if (isValidNavPosition(v)) legacyPosition = v;
    }
  } catch {
    /* ignore */
  }

  const legacyLines = readLegacyNavPositionLines();
  const toggleOn = readLegacyToggleOn(GUEST_MENU_NAV_POSITION_SEQ);

  if (!legacyPosition && legacyLines.length === 0 && !toggleOn) return null;

  const position = legacyPosition ?? DEFAULT_NAV_POSITION;
  const base = defaultNavPositionByLine(DEFAULT_NAV_POSITION);
  const applyTo =
    legacyLines.length > 0 ? legacyLines : toggleOn || legacyPosition ? [...NAV_POSITION_LINE_IDS] : [];
  for (const lineId of applyTo) {
    base[lineId] = position;
  }
  return base;
}

export function readGuestMenuNavPositionByLine(): GuestMenuNavPositionByLine {
  if (!navPositionMigrated) {
    navPositionMigrated = true;
    const existing = readModuleSettingJson<Partial<Record<string, GuestMenuNavPosition>> | null>(
      NAV_POSITION_BY_LINE_STORAGE_ID,
      null,
    );
    if (existing && typeof existing === "object" && Object.keys(existing).length > 0) {
      return normalizeNavPositionByLine(existing);
    }
    const migrated = migrateLegacyNavPositionByLine();
    if (migrated) {
      writeGuestMenuNavPositionByLine(migrated);
      return migrated;
    }
    const defaults = defaultNavPositionByLine();
    writeGuestMenuNavPositionByLine(defaults);
    return defaults;
  }

  const raw = readModuleSettingJson<Partial<Record<string, GuestMenuNavPosition>>>(
    NAV_POSITION_BY_LINE_STORAGE_ID,
    {},
  );
  return normalizeNavPositionByLine(raw ?? {});
}

export function writeGuestMenuNavPositionByLine(values: GuestMenuNavPositionByLine): void {
  writeModuleSettingJson(NAV_POSITION_BY_LINE_STORAGE_ID, normalizeNavPositionByLine(values));
}

export function isGuestMenuNavPositionSeq(seq: number): boolean {
  return seq === GUEST_MENU_NAV_POSITION_SEQ;
}

export function renderGuestMenuNavPositionByLineEditorHtml(): string {
  const values = readGuestMenuNavPositionByLine();
  const activeLine = getFohActiveLineFilterId();
  const lines = activeLine
    ? GUEST_MENU_NAV_POSITION_PRODUCT_LINES.filter((line) => line.id === activeLine)
    : GUEST_MENU_NAV_POSITION_PRODUCT_LINES;
  const rows = lines.map((line) => {
    const groupName = `guest-menu-nav-position-${line.id}`;
    const radios = GUEST_MENU_NAV_POSITION_OPTIONS.map((opt) => {
      const checked = values[line.id] === opt.value;
      return `
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-guest-menu-nav-position-line="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    }).join("");

    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="radiogroup" aria-label="${escapeHtml(line.label)} 菜单展示位置">${radios}</div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-guest-menu-nav-position-editor class="space-y-2">
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

function collectNavPositionByLineFromEditor(editor: HTMLElement): GuestMenuNavPositionByLine {
  const values = readGuestMenuNavPositionByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-guest-menu-nav-position-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute(
      "data-guest-menu-nav-position-line",
    ) as GuestMenuNavPositionProductLineId | null;
    const value = input.value;
    if (!lineId || !NAV_POSITION_LINE_IDS.includes(lineId) || !isValidNavPosition(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function ensureGuestMenuStructureToggleMigrated(seq: number): void {
  if (migratedToggleSeqs.has(seq)) return;
  migratedToggleSeqs.add(seq);
  if (!isSeqInGuestMenuStructureGroup(seq)) return;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(seq)) !== null) {
      return;
    }
  } catch {
    return;
  }

  if (readLegacyToggleOn(seq)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): GuestMenuStructureProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  const out: GuestMenuStructureProductLineId[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    if (valid.has(item) && !out.includes(item as GuestMenuStructureProductLineId)) {
      out.push(item as GuestMenuStructureProductLineId);
    }
  }
  return out;
}

export function readGuestMenuStructureLines(seq: number): string[] {
  if (!isSeqInGuestMenuStructureGroup(seq)) return [];
  ensureGuestMenuStructureToggleMigrated(seq);
  const { linesStorageId } = getConfig(seq);
  const stored = readModuleSettingJson<unknown>(linesStorageId, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writeGuestMenuStructureLines(seq, all);
    return all;
  }
  return [];
}

export function writeGuestMenuStructureLines(seq: number, lines: string[]): void {
  if (!isSeqInGuestMenuStructureGroup(seq)) return;
  const valid = new Set(ALL_LINE_IDS);
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id) && valid.has(id));
  writeModuleSettingJson(getConfig(seq).linesStorageId, unique);
}

export function isGuestMenuStructureSeq(seq: number): boolean {
  return isSeqInGuestMenuStructureGroup(seq);
}

export function ensureGuestMenuStructureLinesDefault(seq: number): void {
  if (!isSeqInGuestMenuStructureGroup(seq)) return;
  if (readGuestMenuStructureLines(seq).length === 0) {
    writeGuestMenuStructureLines(seq, [...ALL_LINE_IDS]);
  }
}

function renderLinesMultiselectHtml(seq: GuestMenuStructureSeq, enabled: boolean): string {
  const selected = new Set(readGuestMenuStructureLines(seq));
  const cells = GUEST_MENU_STRUCTURE_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 px-1.5 py-3 text-sm text-foreground sm:px-2 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-menu-structure-line="${seq}"
          data-line-id="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center text-xs leading-tight sm:text-sm">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const cfg = getConfig(seq);

  return `
    <div
      class="flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-menu-structure-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(cfg.linesAriaLabel)}"
    >
      ${cells}
    </div>`;
}

export function renderGuestMenuStructurePanelHtml(seq: number, on: boolean): string {
  if (!isSeqInGuestMenuStructureGroup(seq)) return "";
  const hidden = on ? "" : "hidden";

  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-menu-structure-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setGuestMenuStructurePanelVisible(seq: number, visible: boolean): void {
  if (!isSeqInGuestMenuStructureGroup(seq)) return;
  document.querySelectorAll<HTMLElement>(`[data-guest-menu-structure-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-menu-structure-line]").forEach((input) => {
      if (Number(input.getAttribute("data-guest-menu-structure-line")) !== seq) return;
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): string[] {
  const seq = Number(group.getAttribute("data-guest-menu-structure-lines"));
  if (!isGuestMenuStructureSeq(seq)) return [];

  const lines: string[] = [];
  group.querySelectorAll<HTMLInputElement>(`[data-guest-menu-structure-line="${seq}"]:checked`).forEach((input) => {
    const id = input.getAttribute("data-line-id");
    if (id && (ALL_LINE_IDS as readonly string[]).includes(id)) lines.push(id);
  });
  writeGuestMenuStructureLines(seq, lines);
  return lines;
}

export function bindGuestMenuStructureUi(root: ParentNode = document): void {
  for (const seq of GUEST_MENU_STRUCTURE_SEQS) {
    ensureGuestMenuStructureToggleMigrated(seq);
  }
  root.querySelectorAll<HTMLElement>("[data-guest-menu-structure-lines]").forEach((group) => {
    if (group.dataset.guestMenuStructureBound === "1") return;
    group.dataset.guestMenuStructureBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-menu-structure-line]")) return;
      collectLinesFromGroup(group);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-guest-menu-nav-position-editor]").forEach((editor) => {
    if (editor.dataset.guestMenuNavPositionEditorBound === "1") return;
    editor.dataset.guestMenuNavPositionEditorBound = "1";
    editor.addEventListener("change", (e) => {
      if (!(e.target as HTMLElement).matches("[data-guest-menu-nav-position-line]")) return;
      writeGuestMenuNavPositionByLine(collectNavPositionByLineFromEditor(editor));
    });
  });
}
