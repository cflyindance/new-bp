/**
 * 前厅 · 桌台与餐位：seq 619 人数选择（合并原 108 跳过选择人数 + 619 人数页显隐）。
 * 主开关：开启后在所选产线展示人数选择页；关闭则跳过。按产线多选存储。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

/** 合并后 SSOT（展示人数选择页） */
export const PARTY_SIZE_SELECTION_PAGE_SEQ = 619;

/** 已并入 619，设置滑层不再单独展示 */
export const PARTY_SIZE_SELECTION_PAGE_LEGACY_SKIP_SEQ = 108;

const LINES_STORAGE_ID = "619-party-size-selection-lines";

export const PARTY_SIZE_SELECTION_PAGE_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
] as const;

export type PartySizeSelectionPageProductLineId =
  (typeof PARTY_SIZE_SELECTION_PAGE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PartySizeSelectionPageProductLineId[] =
  PARTY_SIZE_SELECTION_PAGE_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

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

function writeMasterToggleOn(on: boolean): void {
  try {
    localStorage.setItem(
      moduleSettingToggleStorageKey(PARTY_SIZE_SELECTION_PAGE_SEQ),
      on ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}

/** 旧 619=展示、108=跳过；迁移为 619 ON=展示 */
export function ensurePartySizeSelectionPageToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(PARTY_SIZE_SELECTION_PAGE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  const showLegacy619 = readLegacyToggleOn(PARTY_SIZE_SELECTION_PAGE_SEQ);
  const skipLegacy108 = readLegacyToggleOn(PARTY_SIZE_SELECTION_PAGE_LEGACY_SKIP_SEQ);
  if (showLegacy619) {
    writeMasterToggleOn(true);
    return;
  }
  if (skipLegacy108) {
    writeMasterToggleOn(false);
  }
}

export function readPartySizeSelectionPageMasterOn(): boolean {
  ensurePartySizeSelectionPageToggleMigrated();
  return readLegacyToggleOn(PARTY_SIZE_SELECTION_PAGE_SEQ);
}

function normalizeLineIds(raw: unknown): PartySizeSelectionPageProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PartySizeSelectionPageProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPartySizeSelectionPageLines(): PartySizeSelectionPageProductLineId[] {
  ensurePartySizeSelectionPageToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readPartySizeSelectionPageMasterOn()) {
    const all = [...ALL_LINE_IDS];
    writePartySizeSelectionPageLines(all);
    return all;
  }
  return [];
}

export function writePartySizeSelectionPageLines(lines: PartySizeSelectionPageProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isPartySizeSelectionPageSeq(seq: number): boolean {
  return seq === PARTY_SIZE_SELECTION_PAGE_SEQ;
}

export function shouldSkipPartySizeSelectionPageMergedSeq(seq: number): boolean {
  return seq === PARTY_SIZE_SELECTION_PAGE_LEGACY_SKIP_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readPartySizeSelectionPageLines());
  const cells = PARTY_SIZE_SELECTION_PAGE_PRODUCT_LINES.map((line, index) => {
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
          data-party-size-selection-page-line="${escapeHtml(line.id)}"
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
      data-party-size-selection-page-lines="${PARTY_SIZE_SELECTION_PAGE_SEQ}"
      role="group"
      aria-label="人数选择适用产线"
    >
      ${cells}
    </div>`;
}

export function renderPartySizeSelectionPagePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-party-size-selection-page-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setPartySizeSelectionPagePanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-party-size-selection-page-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-party-size-selection-page-line]")
        .forEach((input) => {
          input.disabled = !visible;
          const label = input.closest("label");
          if (!label) return;
          label.classList.toggle("cursor-not-allowed", !visible);
          label.classList.toggle("opacity-50", !visible);
          label.classList.toggle("cursor-pointer", visible);
        });
    });
}

function collectLinesFromGroup(group: HTMLElement): PartySizeSelectionPageProductLineId[] {
  const lines: PartySizeSelectionPageProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-party-size-selection-page-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-party-size-selection-page-line");
      if (id && ALL_LINE_IDS.includes(id as PartySizeSelectionPageProductLineId)) {
        lines.push(id as PartySizeSelectionPageProductLineId);
      }
    });
  writePartySizeSelectionPageLines(lines);
  return lines;
}

export function bindPartySizeSelectionPageUi(root: ParentNode = document): void {
  ensurePartySizeSelectionPageToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-party-size-selection-page-lines]").forEach((group) => {
    if (group.dataset.partySizeSelectionPageBound === "1") return;
    group.dataset.partySizeSelectionPageBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-party-size-selection-page-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
