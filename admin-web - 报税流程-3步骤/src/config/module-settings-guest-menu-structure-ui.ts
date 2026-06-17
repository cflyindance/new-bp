/**
 * 前厅 · 食客端·菜单展示与购物车：主开关 + 适用产线多选（Kiosk / eMenu / SDI / Online Order）
 * — 515 展示菜单序号
 * — 516 显示组名称
 * — 517 菜单展示位置（侧边 / 顶部）
 * — 518 默认展开第一组
 * — 519 菜单图片裁切显示
 * — 520 套餐展示导航栏
 * — 524 瀑布流模式
 * — 528 菜价为0展示价格
 */

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

export const GUEST_MENU_STRUCTURE_SEQS: readonly number[] = [
  GUEST_MENU_SHOW_SERIAL_SEQ,
  GUEST_MENU_SHOW_GROUP_NAME_SEQ,
  GUEST_MENU_NAV_POSITION_SEQ,
  GUEST_MENU_EXPAND_FIRST_GROUP_SEQ,
  GUEST_MENU_IMAGE_CROP_SEQ,
  GUEST_MENU_COMBO_NAV_SEQ,
  GUEST_MENU_WATERFALL_SEQ,
  GUEST_MENU_ZERO_PRICE_DISPLAY_SEQ,
];

type GuestMenuStructureSeq = (typeof GUEST_MENU_STRUCTURE_SEQS)[number];

const NAV_POSITION_RADIO_FIELD_ID = "517-menu-nav-position";
const NAV_POSITION_RADIO_DEFAULT = "top";

const CONFIG_BY_SEQ: Record<
  GuestMenuStructureSeq,
  { linesStorageId: string; linesAriaLabel: string; panelHint: string }
> = {
  [GUEST_MENU_SHOW_SERIAL_SEQ]: {
    linesStorageId: "515-guest-menu-show-serial-lines",
    linesAriaLabel: "展示菜单序号适用产线",
    panelHint: "勾选产线在菜单卡片上展示菜品序号 ID。",
  },
  [GUEST_MENU_SHOW_GROUP_NAME_SEQ]: {
    linesStorageId: "516-guest-menu-show-group-name-lines",
    linesAriaLabel: "显示组名称适用产线",
    panelHint: "勾选产线在组-类-菜树形菜单中展示组名称。",
  },
  [GUEST_MENU_NAV_POSITION_SEQ]: {
    linesStorageId: "517-guest-menu-nav-position-lines",
    linesAriaLabel: "菜单展示位置适用产线",
    panelHint: "勾选产线后，按下方选项配置分类导航为侧边或顶部展示。",
  },
  [GUEST_MENU_EXPAND_FIRST_GROUP_SEQ]: {
    linesStorageId: "518-guest-menu-expand-first-group-lines",
    linesAriaLabel: "默认展开第一组适用产线",
    panelHint: "勾选产线在组-类-菜树形菜单中默认展开第一组下的类。",
  },
  [GUEST_MENU_IMAGE_CROP_SEQ]: {
    linesStorageId: "519-guest-menu-image-crop-lines",
    linesAriaLabel: "菜单图片裁切显示适用产线",
    panelHint: "勾选产线将菜单图片填充菜单卡片（必要时裁切）；未勾选产线则等比缩放展示。",
  },
  [GUEST_MENU_COMBO_NAV_SEQ]: {
    linesStorageId: "520-guest-menu-combo-nav-lines",
    linesAriaLabel: "套餐展示导航栏适用产线",
    panelHint: "勾选产线在套餐页面展示步骤分类导航栏。",
  },
  [GUEST_MENU_WATERFALL_SEQ]: {
    linesStorageId: "524-guest-menu-waterfall-lines",
    linesAriaLabel: "瀑布流模式适用产线",
    panelHint: "勾选产线以瀑布流连续滚动方式浏览菜单；未勾选产线则通过分类导航切换。",
  },
  [GUEST_MENU_ZERO_PRICE_DISPLAY_SEQ]: {
    linesStorageId: "528-guest-menu-zero-price-display-lines",
    linesAriaLabel: "菜价为0展示价格适用产线",
    panelHint: "勾选产线对价格为 0 的菜品展示价格标签。",
  },
};

type GuestMenuStructureProductLineId =
  (typeof GUEST_MENU_STRUCTURE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestMenuStructureProductLineId[] =
  GUEST_MENU_STRUCTURE_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedToggleSeqs = new Set<number>();

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

function hasStoredNavPosition(): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(NAV_POSITION_RADIO_FIELD_ID)) !== null;
  } catch {
    return false;
  }
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

  const shouldEnable =
    readLegacyToggleOn(seq) || (seq === GUEST_MENU_NAV_POSITION_SEQ && hasStoredNavPosition());

  if (shouldEnable) {
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

  if (readLegacyToggleOn(seq) || (seq === GUEST_MENU_NAV_POSITION_SEQ && hasStoredNavPosition())) {
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

function renderNavPositionRadioHtml(enabled: boolean): string {
  const groupName = "module-setting-radio-517";
  const current = readModuleSettingRadio(NAV_POSITION_RADIO_FIELD_ID, NAV_POSITION_RADIO_DEFAULT);
  const options = [
    { value: "side", label: "侧边展示" },
    { value: "top", label: "顶部展示" },
  ];
  const radios = options
    .map((opt) => {
      const checked = current === opt.value;
      return `
        <label class="inline-flex items-center gap-2 text-sm text-foreground ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            ${enabled ? "" : "disabled"}
            data-module-setting-radio="${escapeHtml(NAV_POSITION_RADIO_FIELD_ID)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    })
    .join("");

  return `
    <div class="mt-3" data-guest-menu-structure-nav-position-radios="${GUEST_MENU_NAV_POSITION_SEQ}">
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">展示位置</p>
      <div class="flex flex-wrap items-center gap-4">${radios}</div>
    </div>`;
}

export function renderGuestMenuStructurePanelHtml(seq: number, on: boolean): string {
  if (!isSeqInGuestMenuStructureGroup(seq)) return "";
  const cfg = getConfig(seq);
  const hidden = on ? "" : "hidden";
  const navPositionHtml =
    seq === GUEST_MENU_NAV_POSITION_SEQ ? renderNavPositionRadioHtml(on) : "";

  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-menu-structure-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(cfg.panelHint)}</p>
      ${navPositionHtml}
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

    if (seq === GUEST_MENU_NAV_POSITION_SEQ) {
      panel.querySelectorAll<HTMLInputElement>("[data-module-setting-radio]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    }
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
}
