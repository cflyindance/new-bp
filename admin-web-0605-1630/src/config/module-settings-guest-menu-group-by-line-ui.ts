/**
 * 前厅 · 食客端·首页与版式：seq 599 选择您想展示的菜单组
 * （eMenu / SDI 各产线下拉多选菜单组，可直接配置，无需先勾选产线）。
 */

import {
  bindMenuGroupDropdownPickers,
  ensureMenuGroupDropdownDocumentCloseListener,
  readMenuGroupTags,
  renderMenuGroupDropdownHtml,
  writeMenuGroupTags,
  type MenuGroupTag,
} from "./module-settings-menu-group-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const GUEST_MENU_GROUP_BY_LINE_SEQ = 599;

const LINES_STORAGE_ID = "599-guest-menu-group-lines";
const LEGACY_GROUPS_STORAGE_ID = "599-menu-groups";

export const GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestMenuGroupByLineProductLineId =
  (typeof GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestMenuGroupByLineProductLineId[] =
  GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES.map((l) => l.id);

let legacyGroupsMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function menuGroupByLineStorageFieldId(lineId: GuestMenuGroupByLineProductLineId): string {
  return `${GUEST_MENU_GROUP_BY_LINE_SEQ}-menu-groups-${lineId}`;
}

function normalizeLineIds(raw: unknown): GuestMenuGroupByLineProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestMenuGroupByLineProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

/** 按各产线已选菜单组同步「生效产线」缓存（供后续对接运行时读取） */
function syncActiveLinesFromMenuGroups(): void {
  const active = ALL_LINE_IDS.filter(
    (lineId) => readMenuGroupTags(menuGroupByLineStorageFieldId(lineId)).length > 0,
  );
  writeModuleSettingJson(LINES_STORAGE_ID, active);
}

export function ensureGuestMenuGroupByLineLegacyMigrated(): void {
  if (legacyGroupsMigrated) return;
  legacyGroupsMigrated = true;

  const legacy = readMenuGroupTags(LEGACY_GROUPS_STORAGE_ID);
  if (legacy.length === 0) return;

  for (const lineId of ALL_LINE_IDS) {
    const fieldId = menuGroupByLineStorageFieldId(lineId);
    if (readMenuGroupTags(fieldId).length === 0) {
      writeMenuGroupTags(fieldId, legacy);
    }
  }
  syncActiveLinesFromMenuGroups();
}

/** 已配置菜单组的产线（由下拉选择结果推导，非 UI 前置勾选） */
export function readGuestMenuGroupByLineLines(): GuestMenuGroupByLineProductLineId[] {
  ensureGuestMenuGroupByLineLegacyMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  const fromGroups = ALL_LINE_IDS.filter(
    (lineId) => readMenuGroupTags(menuGroupByLineStorageFieldId(lineId)).length > 0,
  );
  if (fromGroups.length > 0) {
    writeModuleSettingJson(LINES_STORAGE_ID, fromGroups);
    return fromGroups;
  }
  if (readMenuGroupTags(LEGACY_GROUPS_STORAGE_ID).length > 0) {
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function readGuestMenuGroupTagsForLine(
  lineId: GuestMenuGroupByLineProductLineId,
): MenuGroupTag[] {
  ensureGuestMenuGroupByLineLegacyMigrated();
  return readMenuGroupTags(menuGroupByLineStorageFieldId(lineId));
}

export function isGuestMenuGroupByLineSeq(seq: number): boolean {
  return seq === GUEST_MENU_GROUP_BY_LINE_SEQ;
}

function renderLineMenuGroupRow(line: (typeof GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES)[number]): string {
  const storageId = menuGroupByLineStorageFieldId(line.id);
  const groups = readGuestMenuGroupTagsForLine(line.id);
  return `
    <div class="space-y-2" data-guest-menu-group-by-line-row="${escapeHtml(line.id)}">
      <p class="m-0 text-sm font-medium text-foreground">${escapeHtml(line.label)}</p>
      ${renderMenuGroupDropdownHtml(storageId, groups)}
    </div>`;
}

export function renderGuestMenuGroupByLinePanelHtml(): string {
  ensureGuestMenuGroupByLineLegacyMigrated();
  const rows = GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES.map((line) =>
    renderLineMenuGroupRow(line),
  ).join("");

  return `
    <div class="mt-3 space-y-4" data-guest-menu-group-by-line-panel="${GUEST_MENU_GROUP_BY_LINE_SEQ}">
      <div class="space-y-4">
        <p class="m-0 text-xs font-medium text-muted-foreground">按产线选择菜单组（下拉多选）</p>
        ${rows}
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        分别为 eMenu、SDI 下拉选择要展示的菜单组；未选择菜单组的产线不生效。
      </p>
    </div>`;
}

export function bindGuestMenuGroupByLineUi(root: ParentNode = document): void {
  ensureGuestMenuGroupByLineLegacyMigrated();
  ensureMenuGroupDropdownDocumentCloseListener();

  root.querySelectorAll<HTMLElement>("[data-guest-menu-group-by-line-panel]").forEach((panel) => {
    if (panel.dataset.guestMenuGroupByLinePanelBound === "1") return;
    panel.dataset.guestMenuGroupByLinePanelBound = "1";
    panel.addEventListener("change", (e) => {
      const cb = (e.target as HTMLElement).closest<HTMLInputElement>(
        "[data-menu-group-dropdown-choice]",
      );
      if (!cb) return;
      syncActiveLinesFromMenuGroups();
    });
  });

  bindMenuGroupDropdownPickers(root);
}
