/**
 * 前厅 · 选桌与开台流程：开单前换桌三态矩阵。
 * seq 643 是唯一可见功能；seq 644 仅作为历史「必须换桌」兼容镜像。
 */

import { encodeFohLinesValue } from "./foh-settings-lines-codec";
import { readModuleSettingJsonState } from "./module-setting-storage-state";
import {
  moduleSettingStorageKey,
  writeModuleSettingDerivedJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const PRE_ORDER_CHANGE_TABLE_SEQ = 643;
export const PRE_ORDER_MUST_CHANGE_TABLE_SEQ = 644;

/** 仅 seq 643 进入可见目录与专用渲染。 */
export const PRE_ORDER_TABLE_CHANGE_SEQS = [PRE_ORDER_CHANGE_TABLE_SEQ] as const;

export type PreOrderTableChangeSeq = (typeof PRE_ORDER_TABLE_CHANGE_SEQS)[number];

export const PRE_ORDER_TABLE_CHANGE_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type PreOrderTableChangeProductLineId =
  (typeof PRE_ORDER_TABLE_CHANGE_PRODUCT_LINES)[number]["id"];

export const PRE_ORDER_TABLE_CHANGE_MODES = [
  { id: "disabled", label: "不启用" },
  { id: "optional", label: "可选换桌" },
  { id: "required", label: "必须换桌" },
] as const;

export type PreOrderTableChangeMode = (typeof PRE_ORDER_TABLE_CHANGE_MODES)[number]["id"];

export type PreOrderTableChangeModeByLine = Record<
  PreOrderTableChangeProductLineId,
  PreOrderTableChangeMode
>;

export const PRE_ORDER_TABLE_CHANGE_MODE_FIELD_ID =
  "643-pre-order-change-table-mode-by-line";
export const PRE_ORDER_CHANGE_TABLE_LINES_STORAGE_ID =
  "643-pre-order-change-table-lines";
export const PRE_ORDER_MUST_CHANGE_TABLE_LINES_STORAGE_ID =
  "644-pre-order-must-change-table-lines";

const ALL_LINE_IDS = PRE_ORDER_TABLE_CHANGE_PRODUCT_LINES.map((line) => line.id);
/** 合并前运行时实际支持的四条产线；旧总开关回填不得自动加入 SDI。 */
const LEGACY_FALLBACK_LINE_IDS: PreOrderTableChangeProductLineId[] = [
  "pos",
  "pos-go",
  "paypad",
  "emenu",
];
const VALID_MODES = new Set<string>(PRE_ORDER_TABLE_CHANGE_MODES.map((mode) => mode.id));
const MATRIX_ATTR = "data-pre-order-table-change-matrix";
const LINE_ATTR = "data-pre-order-table-change-line";
const MODE_ATTR = "data-pre-order-table-change-mode";
const FOH_LINE_CONFIG_ROW_ATTR = "data-foh-line-config-row";
const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function createDisabledModeByLine(): PreOrderTableChangeModeByLine {
  return Object.fromEntries(
    ALL_LINE_IDS.map((lineId) => [lineId, "disabled"]),
  ) as PreOrderTableChangeModeByLine;
}

function normalizeModeByLine(raw: unknown): PreOrderTableChangeModeByLine | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const result = createDisabledModeByLine();
  for (const lineId of ALL_LINE_IDS) {
    if (!Object.prototype.hasOwnProperty.call(record, lineId)) continue;
    const mode = record[lineId];
    if (typeof mode !== "string" || !VALID_MODES.has(mode)) return null;
    result[lineId] = mode as PreOrderTableChangeMode;
  }
  return result;
}

function normalizeLegacyLineIds(raw: readonly unknown[]): PreOrderTableChangeProductLineId[] {
  const selected = new Set(
    raw.filter(
      (lineId): lineId is PreOrderTableChangeProductLineId =>
        typeof lineId === "string" && ALL_LINE_IDS.includes(lineId as PreOrderTableChangeProductLineId),
    ),
  );
  return ALL_LINE_IDS.filter((lineId) => selected.has(lineId));
}

function readLegacyToggleRaw(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

/**
 * 旧数组无副作用解码：只有字段 missing 时才允许旧总开关回填。
 * 显式空数组、非法 JSON 或非法结构均按空集合处理。
 */
function readLegacyLines(
  fieldId: string,
  seq: number,
): PreOrderTableChangeProductLineId[] {
  const state = readModuleSettingJsonState(fieldId);
  if (state.state === "missing") {
    return readLegacyToggleRaw(seq) ? [...LEGACY_FALLBACK_LINE_IDS] : [];
  }
  if (state.state === "invalid") return [];

  const raw = state.value;
  if (Array.isArray(raw)) return normalizeLegacyLineIds(raw);
  if (raw && typeof raw === "object") {
    const candidate = raw as { v?: unknown; lines?: unknown };
    if (candidate.v === 1 && Array.isArray(candidate.lines)) {
      return normalizeLegacyLineIds(candidate.lines);
    }
  }
  return [];
}

function deriveModeByLineFromLegacy(): PreOrderTableChangeModeByLine {
  const optionalOrRequired = new Set(
    readLegacyLines(PRE_ORDER_CHANGE_TABLE_LINES_STORAGE_ID, PRE_ORDER_CHANGE_TABLE_SEQ),
  );
  const required = new Set(
    readLegacyLines(
      PRE_ORDER_MUST_CHANGE_TABLE_LINES_STORAGE_ID,
      PRE_ORDER_MUST_CHANGE_TABLE_SEQ,
    ),
  );
  const result = createDisabledModeByLine();
  for (const lineId of ALL_LINE_IDS) {
    if (required.has(lineId)) result[lineId] = "required";
    else if (optionalOrRequired.has(lineId)) result[lineId] = "optional";
  }
  return result;
}

function deriveCompatibilityLines(config: PreOrderTableChangeModeByLine): {
  enabled: PreOrderTableChangeProductLineId[];
  required: PreOrderTableChangeProductLineId[];
} {
  return {
    enabled: ALL_LINE_IDS.filter((lineId) => config[lineId] !== "disabled"),
    required: ALL_LINE_IDS.filter((lineId) => config[lineId] === "required"),
  };
}

/** 首次加载旧配置时直接落盘，避免只访问页面就产生一组未保存草稿。 */
function persistMigratedSnapshot(config: PreOrderTableChangeModeByLine): boolean {
  const lines = deriveCompatibilityLines(config);
  try {
    localStorage.setItem(
      moduleSettingStorageKey(PRE_ORDER_TABLE_CHANGE_MODE_FIELD_ID),
      JSON.stringify(config),
    );
    localStorage.setItem(
      moduleSettingStorageKey(PRE_ORDER_CHANGE_TABLE_LINES_STORAGE_ID),
      JSON.stringify(encodeFohLinesValue(lines.enabled)),
    );
    localStorage.setItem(
      moduleSettingStorageKey(PRE_ORDER_MUST_CHANGE_TABLE_LINES_STORAGE_ID),
      JSON.stringify(encodeFohLinesValue(lines.required)),
    );
    localStorage.setItem(
      moduleSettingToggleStorageKey(PRE_ORDER_CHANGE_TABLE_SEQ),
      lines.enabled.length > 0 ? "1" : "0",
    );
    localStorage.setItem(
      moduleSettingToggleStorageKey(PRE_ORDER_MUST_CHANGE_TABLE_SEQ),
      lines.required.length > 0 ? "1" : "0",
    );
    return true;
  } catch {
    return false;
  }
}

export function readPreOrderTableChangeModeByLine(): PreOrderTableChangeModeByLine {
  const state = readModuleSettingJsonState(PRE_ORDER_TABLE_CHANGE_MODE_FIELD_ID);
  if (state.state === "configured") {
    const configured = normalizeModeByLine(state.value);
    if (configured) return configured;
    /** 损坏主配置仅以内存方式从兼容镜像恢复，不在加载阶段覆盖。 */
    return deriveModeByLineFromLegacy();
  }
  if (state.state === "invalid") return deriveModeByLineFromLegacy();

  const migrated = deriveModeByLineFromLegacy();
  persistMigratedSnapshot(migrated);
  return migrated;
}

export function readPreOrderTableChangeMode(
  lineId: PreOrderTableChangeProductLineId,
): PreOrderTableChangeMode {
  return readPreOrderTableChangeModeByLine()[lineId];
}

export function writePreOrderTableChangeModeByLine(
  next: PreOrderTableChangeModeByLine,
): void {
  const normalized = normalizeModeByLine(next) ?? createDisabledModeByLine();
  const lines = deriveCompatibilityLines(normalized);
  /** 主配置先写；两份旧数组会通过通用 lines codec 同步各自旧总开关。 */
  writeModuleSettingJson(PRE_ORDER_TABLE_CHANGE_MODE_FIELD_ID, normalized, "product_line");
  writeModuleSettingDerivedJson(PRE_ORDER_CHANGE_TABLE_LINES_STORAGE_ID, lines.enabled);
  writeModuleSettingDerivedJson(
    PRE_ORDER_MUST_CHANGE_TABLE_LINES_STORAGE_ID,
    lines.required,
  );
}

export function writePreOrderTableChangeMode(
  lineId: PreOrderTableChangeProductLineId,
  mode: PreOrderTableChangeMode,
): void {
  if (!ALL_LINE_IDS.includes(lineId) || !VALID_MODES.has(mode)) return;
  const current = readPreOrderTableChangeModeByLine();
  if (current[lineId] === mode) return;
  writePreOrderTableChangeModeByLine({ ...current, [lineId]: mode });
}

export function isPreOrderTableChangeSeq(seq: number): seq is PreOrderTableChangeSeq {
  return seq === PRE_ORDER_CHANGE_TABLE_SEQ;
}

export function isDeprecatedPreOrderTableChangeSeq(seq: number): boolean {
  return seq === PRE_ORDER_MUST_CHANGE_TABLE_SEQ;
}

export function isPreOrderTableChangeBooleanMutationSeq(seq: number): boolean {
  return seq === PRE_ORDER_CHANGE_TABLE_SEQ || seq === PRE_ORDER_MUST_CHANGE_TABLE_SEQ;
}

export function renderPreOrderTableChangePanelHtml(): string {
  const config = readPreOrderTableChangeModeByLine();
  const rows = PRE_ORDER_TABLE_CHANGE_PRODUCT_LINES.map((line) => {
    const radios = PRE_ORDER_TABLE_CHANGE_MODES.map((mode) => {
      const checked = config[line.id] === mode.id;
      return `
        <label class="inline-flex min-w-[7.25rem] cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
          checked
            ? "border-primary/50 bg-primary/5 font-medium text-foreground"
            : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
        }">
          <input
            type="radio"
            name="pre-order-table-change-${escapeHtml(line.id)}"
            value="${escapeHtml(mode.id)}"
            class="${MODULE_SETTING_CONTROL_CLASS}"
            ${LINE_ATTR}="${escapeHtml(line.id)}"
            ${MODE_ATTR}="${escapeHtml(mode.id)}"
            ${checked ? "checked" : ""}
            aria-label="${escapeHtml(line.label)} 开单前换桌规则：${escapeHtml(mode.label)}"
          />
          <span>${escapeHtml(mode.label)}</span>
        </label>`;
    }).join("");

    return `
      <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
        <th scope="row" class="w-[7.5rem] whitespace-nowrap px-3 py-3 text-left text-sm font-medium text-foreground">${escapeHtml(line.label)}</th>
        <td class="px-3 py-2.5">
          <div class="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="${escapeHtml(line.label)} 开单前换桌规则">
            ${radios}
          </div>
        </td>
      </tr>`;
  }).join("");

  return `
    <div class="mt-3 overflow-x-auto rounded-md border border-border" ${MATRIX_ATTR}>
      <table class="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="w-[7.5rem] px-3 py-2 font-medium">产线</th>
            <th class="px-3 py-2 font-medium">开单前换桌规则</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function syncPreOrderTableChangeUi(root: ParentNode = document): void {
  const config = readPreOrderTableChangeModeByLine();
  root.querySelectorAll<HTMLInputElement>(`[${LINE_ATTR}][${MODE_ATTR}]`).forEach((input) => {
    const lineId = input.getAttribute(LINE_ATTR) as PreOrderTableChangeProductLineId | null;
    const mode = input.getAttribute(MODE_ATTR) as PreOrderTableChangeMode | null;
    if (!lineId || !mode || !ALL_LINE_IDS.includes(lineId) || !VALID_MODES.has(mode)) return;
    const checked = config[lineId] === mode;
    input.checked = checked;
    const label = input.closest("label");
    if (!label) return;
    label.classList.toggle("border-primary/50", checked);
    label.classList.toggle("bg-primary/5", checked);
    label.classList.toggle("font-medium", checked);
    label.classList.toggle("text-foreground", checked);
    label.classList.toggle("border-transparent", !checked);
    label.classList.toggle("text-muted-foreground", !checked);
  });
}

export function bindPreOrderTableChangeUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(`[${MATRIX_ATTR}]`).forEach((matrix) => {
    if (matrix.dataset.preOrderTableChangeBound === "1") return;
    matrix.dataset.preOrderTableChangeBound = "1";
    matrix.addEventListener("change", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "radio" || !input.checked) return;
      const lineId = input.getAttribute(LINE_ATTR) as PreOrderTableChangeProductLineId | null;
      const mode = input.getAttribute(MODE_ATTR) as PreOrderTableChangeMode | null;
      if (!lineId || !mode || !ALL_LINE_IDS.includes(lineId) || !VALID_MODES.has(mode)) return;
      writePreOrderTableChangeMode(lineId, mode);
      syncPreOrderTableChangeUi(document);
    });
  });
}
