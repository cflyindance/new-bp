/**
 * 前厅 · POS 菜单与布局：seq 350 电子菜单自定义消息（按产线启用 + 消息，对齐 seq 196）。
 * 适用产线：POS / PayPad。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingText,
  writeModuleSettingJson,
  writeModuleSettingText,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const EMENU_CUSTOM_MESSAGE_SEQ = 350;

export const EMENU_CUSTOM_MESSAGE_FIELD_ID = "350-emenu-custom-message";
export const EMENU_CUSTOM_MESSAGE_BY_LINE_FIELD_ID = "350-emenu-custom-message-by-line";
const LINES_STORAGE_ID = "350-emenu-custom-message-lines";

export const EMENU_CUSTOM_MESSAGE_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "paypad", label: "PayPad" },
] as const;

export type EmenuCustomMessageProductLineId =
  (typeof EMENU_CUSTOM_MESSAGE_PRODUCT_LINES)[number]["id"];

export type EmenuCustomMessageLineConfig = {
  enabled: boolean;
  message: string;
};

const ALL_LINE_IDS: EmenuCustomMessageProductLineId[] = EMENU_CUSTOM_MESSAGE_PRODUCT_LINES.map(
  (l) => l.id,
);

const MESSAGE_DEFAULT = "";
const MESSAGE_MAX_LENGTH = 100;

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

function normalizeMessage(raw: unknown): string {
  return String(raw ?? "").trim().slice(0, MESSAGE_MAX_LENGTH);
}

function defaultLineConfig(
  enabled: boolean,
  message = MESSAGE_DEFAULT,
): EmenuCustomMessageLineConfig {
  return { enabled, message: normalizeMessage(message) };
}

function defaultByLineConfig(): Record<EmenuCustomMessageProductLineId, EmenuCustomMessageLineConfig> {
  return Object.fromEntries(
    EMENU_CUSTOM_MESSAGE_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(true)]),
  ) as Record<EmenuCustomMessageProductLineId, EmenuCustomMessageLineConfig>;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<EmenuCustomMessageLineConfig>>>,
): Record<EmenuCustomMessageProductLineId, EmenuCustomMessageLineConfig> {
  const base = defaultByLineConfig();
  for (const line of EMENU_CUSTOM_MESSAGE_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      message: normalizeMessage(item.message ?? base[line.id].message),
    };
  }
  return base;
}

function syncLegacyFields(
  config: Record<EmenuCustomMessageProductLineId, EmenuCustomMessageLineConfig>,
): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(LINES_STORAGE_ID, enabledLines);
  const firstEnabled = EMENU_CUSTOM_MESSAGE_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingText(EMENU_CUSTOM_MESSAGE_FIELD_ID, config[firstEnabled.id].message);
  }
  try {
    localStorage.setItem(
      moduleSettingToggleStorageKey(EMENU_CUSTOM_MESSAGE_SEQ),
      enabledLines.length > 0 ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}

function ensureMigrated(): void {
  if (migrated) return;
  migrated = true;

  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<EmenuCustomMessageLineConfig>>>
  >(EMENU_CUSTOM_MESSAGE_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeEmenuCustomMessageByLine(normalizeByLineConfig(raw));
    return;
  }

  const hasLegacyMessage = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(EMENU_CUSTOM_MESSAGE_FIELD_ID)) !== null;
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
  const hasLegacyToggle = (() => {
    try {
      return localStorage.getItem(moduleSettingToggleStorageKey(EMENU_CUSTOM_MESSAGE_SEQ)) !== null;
    } catch {
      return false;
    }
  })();

  if (!hasLegacyMessage && !hasLegacyLines && !hasLegacyToggle) {
    writeEmenuCustomMessageByLine(defaultByLineConfig());
    return;
  }

  const messageLegacy = normalizeMessage(
    readModuleSettingText(EMENU_CUSTOM_MESSAGE_FIELD_ID, MESSAGE_DEFAULT),
  );
  const linesRaw = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalizedLines = Array.isArray(linesRaw)
    ? linesRaw.filter(
        (id): id is EmenuCustomMessageProductLineId =>
          typeof id === "string" && ALL_LINE_IDS.includes(id as EmenuCustomMessageProductLineId),
      )
    : [];

  let linesLegacy = normalizedLines;
  if (linesLegacy.length === 0) {
    try {
      if (localStorage.getItem(moduleSettingToggleStorageKey(EMENU_CUSTOM_MESSAGE_SEQ)) === "1") {
        linesLegacy = [...ALL_LINE_IDS];
      }
    } catch {
      /* ignore */
    }
  }

  const selected = new Set(linesLegacy);
  const config = defaultByLineConfig();
  for (const line of EMENU_CUSTOM_MESSAGE_PRODUCT_LINES) {
    config[line.id] = selected.has(line.id)
      ? { enabled: true, message: messageLegacy }
      : { enabled: false, message: MESSAGE_DEFAULT };
  }
  writeEmenuCustomMessageByLine(config);
}

export function readEmenuCustomMessageByLine(): Record<
  EmenuCustomMessageProductLineId,
  EmenuCustomMessageLineConfig
> {
  ensureMigrated();
  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<EmenuCustomMessageLineConfig>>>
  >(EMENU_CUSTOM_MESSAGE_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLineConfig(raw);
  }
  return defaultByLineConfig();
}

export function writeEmenuCustomMessageByLine(
  config: Record<EmenuCustomMessageProductLineId, EmenuCustomMessageLineConfig>,
): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(EMENU_CUSTOM_MESSAGE_BY_LINE_FIELD_ID, normalized);
  syncLegacyFields(normalized);
}

export function syncEmenuCustomMessageEnabledFromLines(lines: readonly string[]): void {
  ensureMigrated();
  const config = readEmenuCustomMessageByLine();
  const selected = new Set(
    lines.filter((id): id is EmenuCustomMessageProductLineId =>
      ALL_LINE_IDS.includes(id as EmenuCustomMessageProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeEmenuCustomMessageByLine(config);
}

export function isEmenuCustomMessageSeq(seq: number): boolean {
  return seq === EMENU_CUSTOM_MESSAGE_SEQ;
}

function syncMessageInputDisabled(editor: HTMLElement): void {
  editor
    .querySelectorAll<HTMLInputElement>("[data-emenu-custom-message-line-enabled]")
    .forEach((checkbox) => {
      const lineId = checkbox.getAttribute("data-emenu-custom-message-line-enabled");
      if (!lineId) return;
      const input = editor.querySelector<HTMLInputElement>(
        `[data-emenu-custom-message-line-text="${lineId}"]`,
      );
      if (!input) return;
      input.disabled = !checkbox.checked;
    });
}

function collectFromEditor(editor: HTMLElement): void {
  const config = readEmenuCustomMessageByLine();
  editor
    .querySelectorAll<HTMLInputElement>("[data-emenu-custom-message-line-enabled]")
    .forEach((checkbox) => {
      const lineId = checkbox.getAttribute("data-emenu-custom-message-line-enabled");
      if (!lineId || !ALL_LINE_IDS.includes(lineId as EmenuCustomMessageProductLineId)) return;
      config[lineId as EmenuCustomMessageProductLineId].enabled = checkbox.checked;
    });
  editor
    .querySelectorAll<HTMLInputElement>("[data-emenu-custom-message-line-text]")
    .forEach((input) => {
      const lineId = input.getAttribute("data-emenu-custom-message-line-text");
      if (!lineId || !ALL_LINE_IDS.includes(lineId as EmenuCustomMessageProductLineId)) return;
      config[lineId as EmenuCustomMessageProductLineId].message = normalizeMessage(input.value);
    });
  writeEmenuCustomMessageByLine(config);
  syncMessageInputDisabled(editor);
}

function renderByLineEditorHtml(): string {
  const config = readEmenuCustomMessageByLine();
  const rows = EMENU_CUSTOM_MESSAGE_PRODUCT_LINES.map((line) => {
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
            data-emenu-custom-message-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用电子菜单自定义消息"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <input
          type="text"
          class="${TEXT_INPUT_CLASS}"
          value="${escapeHtml(item.message)}"
          maxlength="${MESSAGE_MAX_LENGTH}"
          placeholder="请输入自定义消息"
          data-emenu-custom-message-line-text="${escapeHtml(line.id)}"
          ${item.enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)} 自定义消息"
        />
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-emenu-custom-message-by-line-editor="${EMENU_CUSTOM_MESSAGE_SEQ}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">自定义消息</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderEmenuCustomMessagePanelHtml(): string {
  return `
    <div class="mt-3 space-y-4" data-emenu-custom-message-panel="${EMENU_CUSTOM_MESSAGE_SEQ}">
      ${renderByLineEditorHtml()}
    </div>`;
}

export function bindEmenuCustomMessageUi(root: ParentNode = document): void {
  ensureMigrated();
  root.querySelectorAll<HTMLElement>("[data-emenu-custom-message-by-line-editor]").forEach((editor) => {
    if (editor.dataset.emenuCustomMessageByLineEditorBound === "1") return;
    editor.dataset.emenuCustomMessageByLineEditorBound = "1";
    syncMessageInputDisabled(editor);
    const persist = () => collectFromEditor(editor);
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.matches("[data-emenu-custom-message-line-enabled]") ||
        target.matches("[data-emenu-custom-message-line-text]")
      ) {
        persist();
      }
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-emenu-custom-message-line-text]")) persist();
    });
  });
}
