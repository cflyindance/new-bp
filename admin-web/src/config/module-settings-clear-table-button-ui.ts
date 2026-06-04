/**
 * 前厅 · 桌台与餐位：seq 642 展示清桌按钮（主开关，仅 eMenu）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const CLEAR_TABLE_BUTTON_SEQ = 642;

const LINES_STORAGE_ID = "642-clear-table-button-lines";

export const CLEAR_TABLE_BUTTON_PRODUCT_LINES = [{ id: "emenu", label: "eMenu" }] as const;

export type ClearTableButtonProductLineId =
  (typeof CLEAR_TABLE_BUTTON_PRODUCT_LINES)[number]["id"];

const EMENU_LINE_ID: ClearTableButtonProductLineId = "emenu";

let toggleMigrated = false;

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureClearTableButtonToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(CLEAR_TABLE_BUTTON_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(CLEAR_TABLE_BUTTON_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(CLEAR_TABLE_BUTTON_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): ClearTableButtonProductLineId[] {
  if (!Array.isArray(raw)) return [];
  return raw.includes(EMENU_LINE_ID) ? [EMENU_LINE_ID] : [];
}

export function readClearTableButtonLines(): ClearTableButtonProductLineId[] {
  ensureClearTableButtonToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(CLEAR_TABLE_BUTTON_SEQ)) {
    writeClearTableButtonLines([EMENU_LINE_ID]);
    return [EMENU_LINE_ID];
  }
  return [];
}

export function writeClearTableButtonLines(lines: ClearTableButtonProductLineId[]): void {
  const enabled = lines.includes(EMENU_LINE_ID);
  writeModuleSettingJson(LINES_STORAGE_ID, enabled ? [EMENU_LINE_ID] : []);
}

export function syncClearTableButtonLinesWithMaster(on: boolean): void {
  writeClearTableButtonLines(on ? [EMENU_LINE_ID] : []);
}

export function isClearTableButtonSeq(seq: number): boolean {
  return seq === CLEAR_TABLE_BUTTON_SEQ;
}

export function renderClearTableButtonPanelHtml(_seq: number, _on: boolean): string {
  return "";
}

export function setClearTableButtonPanelVisible(_seq: number, _visible: boolean): void {
  /* 仅 eMenu，无产线多选面板 */
}

export function bindClearTableButtonUi(_root: ParentNode = document): void {
  /* 仅 eMenu，无产线多选控件 */
}
