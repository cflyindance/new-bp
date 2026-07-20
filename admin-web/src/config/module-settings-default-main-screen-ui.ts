/**
 * 前厅管理中心 · 主界面与导航 · 默认主界面（seq 165）。
 * 形式对齐「类展示」(217)：主开关 + 各产线独立单选（MAIN / TABLE / ORDER / RECALL）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const DEFAULT_MAIN_SCREEN_SEQ = 165;

const DEFAULT_MAIN_SCREEN_BY_LINE_STORAGE_ID = "165-default-main-screen-by-line";
const LINES_STORAGE_ID = "165-default-main-screen-lines";

export const STAFF_TERMINAL_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type StaffTerminalProductLineId = (typeof STAFF_TERMINAL_PRODUCT_LINES)[number]["id"];

export const DEFAULT_MAIN_SCREEN_OPTIONS = [
  { value: "MAIN", label: "MAIN（主页）" },
  { value: "TABLE", label: "TABLE（桌台）" },
  { value: "ORDER", label: "ORDER（点单）" },
  { value: "RECALL", label: "RECALL（找单）" },
] as const;

export type DefaultMainScreen = (typeof DEFAULT_MAIN_SCREEN_OPTIONS)[number]["value"];

export type DefaultMainScreenByLine = Record<StaffTerminalProductLineId, DefaultMainScreen>;

const DEFAULT_SCREEN: DefaultMainScreen = "ORDER";

const ALL_LINE_IDS: StaffTerminalProductLineId[] = STAFF_TERMINAL_PRODUCT_LINES.map((l) => l.id);
const VALID_SCREENS = new Set<string>(DEFAULT_MAIN_SCREEN_OPTIONS.map((o) => o.value));

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

function isValidMainScreen(value: string): value is DefaultMainScreen {
  return VALID_SCREENS.has(value);
}

function defaultMainScreenByLine(screen: DefaultMainScreen = DEFAULT_SCREEN): DefaultMainScreenByLine {
  return Object.fromEntries(ALL_LINE_IDS.map((id) => [id, screen])) as DefaultMainScreenByLine;
}

function normalizeMainScreenByLine(raw: Partial<DefaultMainScreenByLine>): DefaultMainScreenByLine {
  const base = defaultMainScreenByLine();
  for (const line of STAFF_TERMINAL_PRODUCT_LINES) {
    const v = raw[line.id];
    base[line.id] = isValidMainScreen(String(v ?? "")) ? v! : DEFAULT_SCREEN;
  }
  return base;
}

function normalizeLineIds(raw: unknown): StaffTerminalProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is StaffTerminalProductLineId => typeof id === "string" && valid.has(id),
  );
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(DEFAULT_MAIN_SCREEN_SEQ)) === "1";
  } catch {
    return false;
  }
}

function hasByLineStorage(): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(DEFAULT_MAIN_SCREEN_BY_LINE_STORAGE_ID)) !== null;
  } catch {
    return false;
  }
}

export function ensureDefaultMainScreenToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(DEFAULT_MAIN_SCREEN_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn() || hasByLineStorage()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(DEFAULT_MAIN_SCREEN_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

export function readDefaultMainScreenLines(): StaffTerminalProductLineId[] {
  ensureDefaultMainScreenToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;
  if (readLegacyToggleOn() || hasByLineStorage()) {
    const all = [...ALL_LINE_IDS];
    writeDefaultMainScreenLines(all);
    return all;
  }
  return [];
}

export function writeDefaultMainScreenLines(lines: StaffTerminalProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function ensureDefaultMainScreenLinesDefault(): void {
  if (readDefaultMainScreenLines().length === 0) {
    writeDefaultMainScreenLines([...ALL_LINE_IDS]);
  }
}

function ensureLineStored(lineId: StaffTerminalProductLineId): void {
  const lines = readDefaultMainScreenLines();
  if (!lines.includes(lineId)) {
    writeDefaultMainScreenLines([...lines, lineId]);
  }
}

export function readDefaultMainScreenByLine(): DefaultMainScreenByLine {
  ensureDefaultMainScreenToggleMigrated();
  const raw = readModuleSettingJson<Partial<DefaultMainScreenByLine>>(
    DEFAULT_MAIN_SCREEN_BY_LINE_STORAGE_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeMainScreenByLine(raw);
  }
  const initial = defaultMainScreenByLine();
  writeDefaultMainScreenByLine(initial);
  return initial;
}

export function writeDefaultMainScreenByLine(values: DefaultMainScreenByLine): void {
  writeModuleSettingJson(DEFAULT_MAIN_SCREEN_BY_LINE_STORAGE_ID, normalizeMainScreenByLine(values));
}

export function isDefaultMainScreenSeq(seq: number): boolean {
  return seq === DEFAULT_MAIN_SCREEN_SEQ;
}

export function renderPosShellLandingGroupIntroHtml(): string {
  return "";
}

function renderByLineEditorHtml(): string {
  const values = readDefaultMainScreenByLine();
  const rows = STAFF_TERMINAL_PRODUCT_LINES.map((line) => {
    const groupName = `default-main-screen-${line.id}`;
    const radios = DEFAULT_MAIN_SCREEN_OPTIONS.map((opt) => {
      const checked = values[line.id] === opt.value;
      return `
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CONTROL_CLASS}"
            data-default-main-screen-line="${escapeHtml(line.id)}"
            ${checked ? "checked" : ""}
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    }).join("");

    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-4" role="radiogroup" aria-label="${escapeHtml(line.label)} 默认主界面">${radios}</div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-default-main-screen-editor="${DEFAULT_MAIN_SCREEN_SEQ}" class="mt-3 space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">默认主界面</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderDefaultMainScreenPanelHtml(on: boolean): string {
  if (on) ensureDefaultMainScreenLinesDefault();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-default-main-screen-panel="${DEFAULT_MAIN_SCREEN_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderByLineEditorHtml()}
    </div>`;
}

/** @deprecated 使用 renderDefaultMainScreenPanelHtml */
export function renderDefaultMainScreenEditorHtml(): string {
  return renderDefaultMainScreenPanelHtml(true);
}

export function setDefaultMainScreenPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-default-main-screen-panel="${DEFAULT_MAIN_SCREEN_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-default-main-screen-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectMainScreenByLineFromEditor(editor: HTMLElement): DefaultMainScreenByLine {
  const values = readDefaultMainScreenByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-default-main-screen-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute("data-default-main-screen-line") as StaffTerminalProductLineId | null;
    const value = input.value;
    if (!lineId || !ALL_LINE_IDS.includes(lineId) || !isValidMainScreen(value)) return;
    values[lineId] = value;
    ensureLineStored(lineId);
  });
  return values;
}

export function bindDefaultMainScreenEditor(root: ParentNode = document): void {
  ensureDefaultMainScreenToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-default-main-screen-editor]").forEach((editor) => {
    if (editor.dataset.defaultMainScreenEditorBound === "1") return;
    editor.dataset.defaultMainScreenEditorBound = "1";
    editor.addEventListener("change", (e) => {
      if (!(e.target as HTMLElement).matches("[data-default-main-screen-line]")) return;
      writeDefaultMainScreenByLine(collectMainScreenByLineFromEditor(editor));
    });
  });
}
