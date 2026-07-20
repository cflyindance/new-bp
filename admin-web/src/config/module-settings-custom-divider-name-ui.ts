/**
 * 前厅 · POS 点单页工具栏：seq 196 自定义分割线名称（按产线启用 + 名称，对齐 seq 111）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingText,
  writeModuleSettingJson,
  writeModuleSettingText,
} from "./module-settings-form-ui";

export const CUSTOM_DIVIDER_NAME_SEQ = 196;

export const CUSTOM_DIVIDER_NAME_FIELD_ID = "196-custom-divider-name";
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

const CHECKBOX_CLASS =
  "size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TEXT_INPUT_CLASS =
  "h-8 w-full min-w-[10rem] max-w-xs rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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

function defaultLineConfig(enabled: boolean, name = NAME_DEFAULT): CustomDividerLineConfig {
  return { enabled, name: normalizeName(name) };
}

function defaultByLineConfig(): Record<CustomDividerProductLineId, CustomDividerLineConfig> {
  return Object.fromEntries(
    CUSTOM_DIVIDER_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(true)]),
  ) as Record<CustomDividerProductLineId, CustomDividerLineConfig>;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<CustomDividerLineConfig>>>,
): Record<CustomDividerProductLineId, CustomDividerLineConfig> {
  const base = defaultByLineConfig();
  for (const line of CUSTOM_DIVIDER_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      name: normalizeName(item.name ?? base[line.id].name),
    };
  }
  return base;
}

function syncLegacyFields(config: Record<CustomDividerProductLineId, CustomDividerLineConfig>): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(LINES_STORAGE_ID, enabledLines);
  const firstEnabled = CUSTOM_DIVIDER_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingText(CUSTOM_DIVIDER_NAME_FIELD_ID, config[firstEnabled.id].name);
  }
}

function ensureMigrated(): void {
  if (migrated) return;
  migrated = true;

  const raw = readModuleSettingJson<Partial<Record<string, Partial<CustomDividerLineConfig>>>>(
    CUSTOM_DIVIDER_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeCustomDividerByLine(normalizeByLineConfig(raw));
    return;
  }

  const hasLegacyName = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(CUSTOM_DIVIDER_NAME_FIELD_ID)) !== null;
    } catch {
      return false;
    }
  })();
  const hasLegacyLines = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(LINES_STORAGE_ID)) !== null;
    } catch {
      return false;
    }
  })();

  if (!hasLegacyName && !hasLegacyLines) {
    writeCustomDividerByLine(defaultByLineConfig());
    return;
  }

  const nameLegacy = normalizeName(readModuleSettingText(CUSTOM_DIVIDER_NAME_FIELD_ID, NAME_DEFAULT));
  const linesRaw = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalizedLines = Array.isArray(linesRaw)
    ? linesRaw.filter(
        (id): id is CustomDividerProductLineId =>
          typeof id === "string" && ALL_LINE_IDS.includes(id as CustomDividerProductLineId),
      )
    : [];
  const linesLegacy =
    normalizedLines.length > 0
      ? normalizedLines
      : ([...ALL_LINE_IDS] as CustomDividerProductLineId[]);
  const selected = new Set(linesLegacy);

  const config = defaultByLineConfig();
  for (const line of CUSTOM_DIVIDER_PRODUCT_LINES) {
    config[line.id] = selected.has(line.id)
      ? { enabled: true, name: nameLegacy }
      : { enabled: false, name: NAME_DEFAULT };
  }
  writeCustomDividerByLine(config);
}

export function readCustomDividerByLine(): Record<CustomDividerProductLineId, CustomDividerLineConfig> {
  ensureMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<CustomDividerLineConfig>>>>(
    CUSTOM_DIVIDER_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLineConfig(raw);
  }
  return defaultByLineConfig();
}

export function writeCustomDividerByLine(
  config: Record<CustomDividerProductLineId, CustomDividerLineConfig>,
): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(CUSTOM_DIVIDER_BY_LINE_FIELD_ID, normalized);
  syncLegacyFields(normalized);
}

export function syncCustomDividerEnabledFromLines(lines: readonly string[]): void {
  ensureMigrated();
  const config = readCustomDividerByLine();
  const selected = new Set(
    lines.filter((id): id is CustomDividerProductLineId =>
      ALL_LINE_IDS.includes(id as CustomDividerProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeCustomDividerByLine(config);
}

export function isCustomDividerNameSeq(seq: number): boolean {
  return seq === CUSTOM_DIVIDER_NAME_SEQ;
}

export function writeCustomDividerName(name: string): void {
  const value = normalizeName(name);
  const config = readCustomDividerByLine();
  let changed = false;
  for (const id of ALL_LINE_IDS) {
    if (config[id].enabled) {
      config[id] = { ...config[id], name: value };
      changed = true;
    }
  }
  if (changed) {
    writeCustomDividerByLine(config);
    return;
  }
  writeModuleSettingText(CUSTOM_DIVIDER_NAME_FIELD_ID, value);
}

function syncNameInputDisabled(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLInputElement>("[data-custom-divider-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-custom-divider-line-enabled");
    if (!lineId) return;
    const input = editor.querySelector<HTMLInputElement>(
      `[data-custom-divider-line-name="${lineId}"]`,
    );
    if (!input) return;
    input.disabled = !checkbox.checked;
  });
}

function collectFromEditor(editor: HTMLElement): void {
  const config = readCustomDividerByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-custom-divider-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-custom-divider-line-enabled");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as CustomDividerProductLineId)) return;
    config[lineId as CustomDividerProductLineId].enabled = checkbox.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-custom-divider-line-name]").forEach((input) => {
    const lineId = input.getAttribute("data-custom-divider-line-name");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as CustomDividerProductLineId)) return;
    config[lineId as CustomDividerProductLineId].name = normalizeName(input.value);
  });
  writeCustomDividerByLine(config);
  syncNameInputDisabled(editor);
}

function renderByLineEditorHtml(): string {
  const config = readCustomDividerByLine();
  const rows = CUSTOM_DIVIDER_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-middle whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-middle">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="${CHECKBOX_CLASS}"
            ${item.enabled ? "checked" : ""}
            data-custom-divider-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用自定义分割线名称"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <input
          type="text"
          class="${TEXT_INPUT_CLASS}"
          value="${escapeHtml(item.name)}"
          maxlength="${NAME_MAX_LENGTH}"
          placeholder="请输入分割线名称"
          data-custom-divider-line-name="${escapeHtml(line.id)}"
          ${item.enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)} 分割线名称"
        />
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-custom-divider-by-line-editor="${CUSTOM_DIVIDER_NAME_SEQ}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">分割线名称</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderCustomDividerNamePanelHtml(): string {
  return `
    <div class="mt-3 space-y-4" data-custom-divider-name-panel="${CUSTOM_DIVIDER_NAME_SEQ}">
      ${renderByLineEditorHtml()}
    </div>`;
}

export function bindCustomDividerNameUi(root: ParentNode = document): void {
  ensureMigrated();
  root.querySelectorAll<HTMLElement>("[data-custom-divider-by-line-editor]").forEach((editor) => {
    if (editor.dataset.customDividerByLineEditorBound === "1") return;
    editor.dataset.customDividerByLineEditorBound = "1";
    syncNameInputDisabled(editor);
    const persist = () => collectFromEditor(editor);
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.matches("[data-custom-divider-line-enabled]") ||
        target.matches("[data-custom-divider-line-name]")
      ) {
        persist();
      }
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-custom-divider-line-name]")) persist();
    });
  });
}
