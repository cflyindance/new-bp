/**
 * 前厅 · POS 点单页工具栏：seq 196 自定义分割线名称。
 * 结构对齐 seq 215（来取/外送历史订单界面:将「复制」隐藏）：主开关 + 产线多选，仅保留产线。
 * 适用产线：POS / POS GO / PayPad。
 */

import { readModuleSettingJson, writeModuleSettingJson, writeModuleSettingText } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const CUSTOM_DIVIDER_NAME_SEQ = 196;

export const CUSTOM_DIVIDER_NAME_FIELD_ID = "196-custom-divider-name";
/** @deprecated 兼容旧按产线名称表；新 UI 仅写 lines */
export const CUSTOM_DIVIDER_BY_LINE_FIELD_ID = "196-custom-divider-by-line";
const LINES_STORAGE_ID = "196-custom-divider-name-lines";

export const CUSTOM_DIVIDER_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type CustomDividerProductLineId = (typeof CUSTOM_DIVIDER_PRODUCT_LINES)[number]["id"];

export type CustomDividerLineConfig = {
  enabled: boolean;
  name: string;
};

const ALL_LINE_IDS: CustomDividerProductLineId[] = CUSTOM_DIVIDER_PRODUCT_LINES.map((l) => l.id);

const NAME_DEFAULT = "";
const NAME_MAX_LENGTH = 40;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let migrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeName(raw: unknown): string {
  return String(raw ?? "").trim().slice(0, NAME_MAX_LENGTH);
}

function normalizeLineIds(raw: unknown): CustomDividerProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is CustomDividerProductLineId => typeof id === "string" && valid.has(id),
  );
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(CUSTOM_DIVIDER_NAME_SEQ)) === "1";
  } catch {
    return false;
  }
}

function writeMasterToggleOn(on: boolean): void {
  try {
    localStorage.setItem(moduleSettingToggleStorageKey(CUSTOM_DIVIDER_NAME_SEQ), on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function defaultByLineConfig(
  enabledLines: CustomDividerProductLineId[] = [...ALL_LINE_IDS],
  name = NAME_DEFAULT,
): Record<CustomDividerProductLineId, CustomDividerLineConfig> {
  const selected = new Set(enabledLines);
  return Object.fromEntries(
    CUSTOM_DIVIDER_PRODUCT_LINES.map((line) => [
      line.id,
      { enabled: selected.has(line.id), name: normalizeName(name) },
    ]),
  ) as Record<CustomDividerProductLineId, CustomDividerLineConfig>;
}

function syncLegacyByLine(lines: CustomDividerProductLineId[], name?: string): void {
  const sharedName = normalizeName(name ?? NAME_DEFAULT);
  writeModuleSettingJson(CUSTOM_DIVIDER_BY_LINE_FIELD_ID, defaultByLineConfig(lines, sharedName));
  if (sharedName) writeModuleSettingText(CUSTOM_DIVIDER_NAME_FIELD_ID, sharedName);
}

export function ensureCustomDividerNameToggleMigrated(): void {
  if (migrated) return;
  migrated = true;

  const storedLines = normalizeLineIds(readModuleSettingJson<unknown>(LINES_STORAGE_ID, null));
  if (storedLines.length > 0) {
    writeMasterToggleOn(true);
    syncLegacyByLine(storedLines);
    return;
  }

  const rawByLine = readModuleSettingJson<Partial<Record<string, Partial<CustomDividerLineConfig>>>>(
    CUSTOM_DIVIDER_BY_LINE_FIELD_ID,
    {},
  );
  if (rawByLine && typeof rawByLine === "object" && Object.keys(rawByLine).length > 0) {
    const lines = ALL_LINE_IDS.filter((id) => rawByLine[id]?.enabled === true);
    const name =
      ALL_LINE_IDS.map((id) => normalizeName(rawByLine[id]?.name)).find((n) => n.length > 0) ??
      NAME_DEFAULT;
    writeCustomDividerLines(lines.length > 0 ? lines : [...ALL_LINE_IDS]);
    if (name) writeModuleSettingText(CUSTOM_DIVIDER_NAME_FIELD_ID, name);
    writeMasterToggleOn(lines.length > 0);
    return;
  }

  if (readLegacyToggleOn()) {
    writeCustomDividerLines([...ALL_LINE_IDS]);
    writeMasterToggleOn(true);
  }
}

export function readCustomDividerLines(): CustomDividerProductLineId[] {
  ensureCustomDividerNameToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeCustomDividerLines(all);
    return all;
  }
  return [];
}

export function writeCustomDividerLines(lines: CustomDividerProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
  syncLegacyByLine(unique);
}

/** 供按产线视图同步 enabled */
export function readCustomDividerByLine(): Record<CustomDividerProductLineId, CustomDividerLineConfig> {
  ensureCustomDividerNameToggleMigrated();
  const lines = readCustomDividerLines();
  return defaultByLineConfig(lines);
}

export function writeCustomDividerByLine(
  config: Record<CustomDividerProductLineId, CustomDividerLineConfig>,
): void {
  const lines = ALL_LINE_IDS.filter((id) => config[id]?.enabled === true);
  const name =
    ALL_LINE_IDS.map((id) => normalizeName(config[id]?.name)).find((n) => n.length > 0) ??
    NAME_DEFAULT;
  writeCustomDividerLines(lines);
  if (name) writeModuleSettingText(CUSTOM_DIVIDER_NAME_FIELD_ID, name);
}

export function syncCustomDividerEnabledFromLines(lines: readonly string[]): void {
  ensureCustomDividerNameToggleMigrated();
  const selected = lines.filter((id): id is CustomDividerProductLineId =>
    ALL_LINE_IDS.includes(id as CustomDividerProductLineId),
  );
  writeCustomDividerLines(selected);
}

export function isCustomDividerNameSeq(seq: number): boolean {
  return seq === CUSTOM_DIVIDER_NAME_SEQ;
}

export function writeCustomDividerName(name: string): void {
  writeModuleSettingText(CUSTOM_DIVIDER_NAME_FIELD_ID, normalizeName(name));
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readCustomDividerLines());
  const cells = CUSTOM_DIVIDER_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-4 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-custom-divider-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-custom-divider-lines="${CUSTOM_DIVIDER_NAME_SEQ}"
      role="group"
      aria-label="自定义分割线名称适用产线"
    >
      ${cells}
    </div>`;
}

export function renderCustomDividerNamePanelHtml(on: boolean): string {
  ensureCustomDividerNameToggleMigrated();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-custom-divider-name-panel="${CUSTOM_DIVIDER_NAME_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setCustomDividerNamePanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-custom-divider-name-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-custom-divider-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectLinesFromGroup(group: HTMLElement): CustomDividerProductLineId[] {
  const lines: CustomDividerProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-custom-divider-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-custom-divider-line");
    if (id && ALL_LINE_IDS.includes(id as CustomDividerProductLineId)) {
      lines.push(id as CustomDividerProductLineId);
    }
  });
  writeCustomDividerLines(lines);
  return lines;
}

export function bindCustomDividerNameUi(root: ParentNode = document): void {
  ensureCustomDividerNameToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-custom-divider-lines]").forEach((group) => {
    if (group.dataset.customDividerBound === "1") return;
    group.dataset.customDividerBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-custom-divider-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
