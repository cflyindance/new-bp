/**
 * 设置滑层：整行表单控件（多选 / 单选 / 颜色），原型 localStorage。
 */
import { notifyConfigSaved } from "./deployment-auto-trigger";
import {
  recordModuleSettingDeploymentChange,
  resolveSettingsPathForChange,
  type ModuleSettingChangeKind,
} from "./module-settings-deployment-change";
import { readAppHashPath } from "./app-routes";
import { FOH_LINE_NAV_ORDER } from "./foh-settings-line-scope";
import {
  decodeFohLinesValue,
  encodeFohLinesValue,
  fohLinesSeqForFieldId,
  isFohLinesFieldId,
} from "./foh-settings-lines-codec";
import {
  isPageBatchSavePath,
  readPageDraftFieldForCurrentPath,
  resolvePageSaveKey,
  setPageDraftField,
} from "./page-settings-draft";

export type ModuleSettingCheckboxOption = {
  fieldId: string;
  label: string;
  defaultChecked: boolean;
};

export type ModuleSettingRadioOption =
  | { value: string; label: string }
  | {
      value: string;
      labelBefore: string;
      numberFieldId: string;
      numberDefault: number;
      labelAfter: string;
      numberMin?: number;
      numberMax?: number;
    };

export interface ModuleSettingFormRowConfig {
  seq: number;
  kind: "checkbox-group" | "radio-group" | "radio-color";
  /** radio-group / radio-color */
  radioFieldId?: string;
  radioDefault?: string;
  checkboxes?: ModuleSettingCheckboxOption[];
  radios?: ModuleSettingRadioOption[];
  /** radio-color 自定义选项 value */
  customColorValue?: string;
  colorFieldId?: string;
  colorDefault?: string;
}

/** 团队管理 · 下班打卡打印确认小票（70）：三选一 */
const TEAM_TIME_ATTENDANCE_FORM_ROWS: ModuleSettingFormRowConfig[] = [
  {
    seq: 70,
    kind: "radio-group",
    radioFieldId: "70-clockout-slip-mode",
    radioDefault: "none",
    radios: [
      { value: "work-hours-only", label: "Print work hours only" },
      { value: "work-hours-and-tips", label: "Print work hours&Tips" },
      { value: "none", label: "None" },
    ],
  },
];

/** 团队管理 · 薪酬与小费相关单选 */
const TEAM_PAYROLL_TIP_FORM_ROWS: ModuleSettingFormRowConfig[] = [
  {
    seq: 186,
    kind: "radio-group",
    radioFieldId: "186-tip-base-mode",
    radioDefault: "net-sales",
    radios: [
      { value: "net-sales", label: "Net Sales" },
      { value: "grand-total", label: "Grand Total" },
      { value: "account-receivable", label: "Account Receivable" },
      { value: "only-gratuity", label: "Only Gratuity" },
    ],
  },
  {
    seq: 309,
    kind: "radio-group",
    radioFieldId: "309-tip-calculation-standard",
    radioDefault: "default",
    radios: [
      { value: "default", label: "DEFAULT" },
      { value: "working-hours", label: "WORKING HOURS" },
    ],
  },
  {
    seq: 310,
    kind: "radio-group",
    radioFieldId: "310-wage-calculation-standard",
    radioDefault: "default",
    radios: [
      { value: "default", label: "Default" },
      { value: "california-rule", label: "California Rule" },
      { value: "40-hours-per-week", label: "40 Hours Per Week Rule" },
      { value: "44-hours-per-week", label: "44 Hours Per Week Rule" },
      { value: "46-hours-per-week", label: "46 Hours Per Week Rule" },
      { value: "48-hours-per-week", label: "48 Hours Per Week Rule" },
    ],
  },
];

const MODULE_SETTING_FORM_ROWS: ModuleSettingFormRowConfig[] = [
  ...TEAM_TIME_ATTENDANCE_FORM_ROWS,
  ...TEAM_PAYROLL_TIP_FORM_ROWS,
];

const FORM_ROW_BY_SEQ = new Map(MODULE_SETTING_FORM_ROWS.map((r) => [r.seq, r]));

export function getModuleSettingFormRow(seq: number): ModuleSettingFormRowConfig | undefined {
  return FORM_ROW_BY_SEQ.get(seq);
}

export function isModuleSettingFormRowSeq(seq: number): boolean {
  return FORM_ROW_BY_SEQ.has(seq);
}

/** 652/653 使用 module-settings-locale-ui，不计入通用 form row */
export function isModuleSettingGenericFormRowSeq(seq: number): boolean {
  return FORM_ROW_BY_SEQ.has(seq);
}

export function listModuleSettingFormRows(): readonly ModuleSettingFormRowConfig[] {
  return MODULE_SETTING_FORM_ROWS;
}

export type ModuleSettingFormFieldDescriptor = {
  seq: number;
  fieldId: string;
  kind: "checkbox" | "radio" | "number" | "color";
  label: string;
  radioOptions?: { value: string; label: string }[];
};

/** 供 AI 助手索引表单类设置项（多选 / 单选 / 颜色 / 附属数字） */
export function listModuleSettingFormFieldDescriptors(): ModuleSettingFormFieldDescriptor[] {
  const out: ModuleSettingFormFieldDescriptor[] = [];
  for (const row of MODULE_SETTING_FORM_ROWS) {
    if (row.kind === "checkbox-group" && row.checkboxes) {
      for (const cb of row.checkboxes) {
        out.push({ seq: row.seq, fieldId: cb.fieldId, kind: "checkbox", label: cb.label });
      }
    }
    if ((row.kind === "radio-group" || row.kind === "radio-color") && row.radioFieldId && row.radios) {
      const radioOptions = row.radios
        .filter((r): r is { value: string; label: string } => "label" in r)
        .map((r) => ({ value: r.value, label: r.label }));
      out.push({
        seq: row.seq,
        fieldId: row.radioFieldId,
        kind: "radio",
        label: row.radioFieldId,
        radioOptions,
      });
      for (const r of row.radios) {
        if ("numberFieldId" in r) {
          out.push({
            seq: row.seq,
            fieldId: r.numberFieldId,
            kind: "number",
            label: `${r.labelBefore ?? ""}${r.labelAfter ?? ""}`.trim() || r.numberFieldId,
          });
        }
      }
    }
    if (row.kind === "radio-color" && row.colorFieldId) {
      out.push({ seq: row.seq, fieldId: row.colorFieldId, kind: "color", label: "自定义颜色" });
    }
  }
  return out;
}

export function moduleSettingStorageKey(fieldId: string): string {
  return `bplant-module-setting-field:${fieldId}`;
}

export function readModuleSettingCheckbox(fieldId: string, defaultChecked: boolean): boolean {
  const draft = readPageDraftFieldForCurrentPath(fieldId);
  if (draft !== undefined) return draft === "1";
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null) return defaultChecked;
    return raw === "1";
  } catch {
    return defaultChecked;
  }
}

function resolveDeferPageKey(fieldId: string): string | undefined {
  const currentPath = readAppHashPath();
  const pageKeyFromPath = resolvePageSaveKey(currentPath);
  if (isPageBatchSavePath(pageKeyFromPath)) return pageKeyFromPath;
  const settingsPath = resolveSettingsPathForChange(fieldId);
  if (settingsPath && isPageBatchSavePath(settingsPath)) {
    return resolvePageSaveKey(settingsPath);
  }
  return undefined;
}

function deferFieldWrite(
  fieldId: string,
  storageValue: string,
  kind: ModuleSettingChangeKind,
  before: unknown,
  after: unknown,
): boolean {
  const pageKey = resolveDeferPageKey(fieldId);
  if (!pageKey) return false;
  setPageDraftField(pageKey, fieldId, storageValue);
  recordModuleSettingDeploymentChange({
    fieldId,
    kind,
    before,
    after,
    settingsPath: pageKey,
  });
  notifyConfigSaved(pageKey);
  return true;
}

export function writeModuleSettingCheckbox(fieldId: string, checked: boolean): void {
  const before = readModuleSettingCheckbox(fieldId, checked);
  if (before === checked) return;
  if (deferFieldWrite(fieldId, checked ? "1" : "0", "checkbox", before, checked)) return;
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), checked ? "1" : "0");
    const settingsPath = recordModuleSettingDeploymentChange({
      fieldId,
      kind: "checkbox",
      before,
      after: checked,
    });
    notifyConfigSaved(settingsPath);
  } catch {
    /* ignore */
  }
}

export function readModuleSettingRadio(fieldId: string, defaultValue: string): string {
  const draft = readPageDraftFieldForCurrentPath(fieldId);
  if (draft !== undefined) return draft;
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null || raw === "") return defaultValue;
    return raw;
  } catch {
    return defaultValue;
  }
}

export function writeModuleSettingRadio(fieldId: string, value: string): void {
  const before = readModuleSettingRadio(fieldId, value);
  if (before === value) return;
  if (deferFieldWrite(fieldId, value, "radio", before, value)) return;
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), value);
    const settingsPath = recordModuleSettingDeploymentChange({
      fieldId,
      kind: "radio",
      before,
      after: value,
    });
    notifyConfigSaved(settingsPath);
  } catch {
    /* ignore */
  }
}

export function readModuleSettingColor(fieldId: string, defaultValue: string): string {
  const draft = readPageDraftFieldForCurrentPath(fieldId);
  if (draft !== undefined) return draft;
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null || raw === "") return defaultValue;
    return raw;
  } catch {
    return defaultValue;
  }
}

export function writeModuleSettingColor(fieldId: string, value: string): void {
  const before = readModuleSettingColor(fieldId, value);
  if (before === value) return;
  if (deferFieldWrite(fieldId, value, "color", before, value)) return;
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), value);
    const settingsPath = recordModuleSettingDeploymentChange({
      fieldId,
      kind: "color",
      before,
      after: value,
    });
    notifyConfigSaved(settingsPath);
  } catch {
    /* ignore */
  }
}

export function readModuleSettingNumber(fieldId: string, defaultValue: number): number {
  const draft = readPageDraftFieldForCurrentPath(fieldId);
  if (draft !== undefined) {
    const n = Number(draft);
    return Number.isFinite(n) ? n : defaultValue;
  }
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null || raw === "") return defaultValue;
    const n = Number(raw);
    return Number.isFinite(n) ? n : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function writeModuleSettingNumber(fieldId: string, value: number): void {
  const before = readModuleSettingNumber(fieldId, value);
  if (before === value) return;
  if (deferFieldWrite(fieldId, String(value), "number", before, value)) return;
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), String(value));
    const settingsPath = recordModuleSettingDeploymentChange({
      fieldId,
      kind: "number",
      before,
      after: value,
    });
    notifyConfigSaved(settingsPath);
  } catch {
    /* ignore */
  }
}

export function readModuleSettingText(fieldId: string, defaultValue = ""): string {
  const draft = readPageDraftFieldForCurrentPath(fieldId);
  if (draft !== undefined) return draft;
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null) return defaultValue;
    return raw;
  } catch {
    return defaultValue;
  }
}

export function writeModuleSettingText(fieldId: string, value: string): void {
  const before = readModuleSettingText(fieldId, value);
  if (before === value) return;
  if (deferFieldWrite(fieldId, value, "text", before, value)) return;
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), value);
    const settingsPath = recordModuleSettingDeploymentChange({
      fieldId,
      kind: "text",
      before,
      after: value,
    });
    notifyConfigSaved(settingsPath);
  } catch {
    /* ignore */
  }
}

/**
 * 前厅适用产线字段在存储层是 `{ v: 1, lines: [...] }`，对调用方仍呈现为产线数组。
 * 未配置（缺失键或存量空数组）时保持调用方自带的兜底，不在此处改变默认语义。
 */
function decodeStoredJson<T>(fieldId: string, raw: unknown, defaultValue: T): T {
  if (!isFohLinesFieldId(fieldId)) return raw as T;
  const decoded = decodeFohLinesValue(raw);
  if (decoded.state === "configured") return decoded.lines as unknown as T;
  if (decoded.state === "unconfigured") return Array.isArray(raw) ? (raw as T) : defaultValue;
  return raw as T;
}

function encodeStoredJson(fieldId: string, value: unknown): unknown {
  if (!isFohLinesFieldId(fieldId)) return value;
  if (!Array.isArray(value)) return value;
  return encodeFohLinesValue(value as string[]);
}

/**
 * 未经产线解码的原始值，`undefined` 表示无值。
 * 需要区分「已配置为空」与「未配置」的调用方用这个。
 */
export function readModuleSettingJsonRaw(fieldId: string): unknown {
  try {
    const draft = readPageDraftFieldForCurrentPath(fieldId);
    const serialized =
      draft !== undefined ? draft : localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (serialized === null || serialized === undefined || serialized === "") return undefined;
    return JSON.parse(serialized);
  } catch {
    return undefined;
  }
}

export function readModuleSettingJson<T>(fieldId: string, defaultValue: T): T {
  const draft = readPageDraftFieldForCurrentPath(fieldId);
  if (draft !== undefined) {
    try {
      if (draft === "") return defaultValue;
      return decodeStoredJson(fieldId, JSON.parse(draft), defaultValue);
    } catch {
      return defaultValue;
    }
  }
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null || raw === "") return defaultValue;
    return decodeStoredJson(fieldId, JSON.parse(raw), defaultValue);
  } catch {
    return defaultValue;
  }
}

export function writeModuleSettingJson(fieldId: string, value: unknown, kind: ModuleSettingChangeKind = "json"): void {
  const storedRaw = readModuleSettingJsonRaw(fieldId);
  const before = decodeStoredJson(fieldId, storedRaw === undefined ? null : storedRaw, null);
  const afterStr = JSON.stringify(encodeStoredJson(fieldId, value));
  /**
   * 比较存储形态而非逻辑值：存量裸数组即使逻辑值未变也需要升级为结构体，
   * 否则「全部关闭」在存量空数组上无法落盘。
   */
  const storedStr = storedRaw === undefined ? null : JSON.stringify(storedRaw);
  if (storedStr === afterStr) return;
  const resolvedKind =
    kind === "json" && isProductLineJsonField(fieldId, value) ? "product_line" : kind;
  if (deferFieldWrite(fieldId, afterStr, resolvedKind, before, value)) {
    /**
     * 草稿阶段也同步镜像：同页内再次读取空产线时，
     * 各模块「主开关开 → 回写全选」才不会把草稿复活。
     * discardPageDraft 会按持久层值把镜像拨回。
     */
    syncFohLinesMirrorToggle(fieldId, value);
    return;
  }
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), afterStr);
    syncFohLinesMirrorToggle(fieldId, value);
    const settingsPath = recordModuleSettingDeploymentChange({
      fieldId,
      kind: resolvedKind,
      before,
      after: value,
    });
    notifyConfigSaved(settingsPath);
  } catch {
    /* ignore */
  }
}

/**
 * 与按产线开关共用镜像键：空产线 → "0"。
 * 各模块的「空数组 + 主开关开 → 回写全选」迁移依赖这个键；
 * 不写入时，场景视图取消全部勾选后刷新会再次复活为全选。
 */
function syncFohLinesMirrorToggle(fieldId: string, value: unknown): void {
  const seq = fohLinesSeqForFieldId(fieldId);
  if (seq === undefined) return;
  const lines = Array.isArray(value) ? value : [];
  try {
    localStorage.setItem(`bplant-module-setting-toggle:${seq}`, lines.length > 0 ? "1" : "0");
  } catch {
    /* ignore */
  }
}

const KNOWN_PRODUCT_LINE_IDS = new Set<string>(
  FOH_LINE_NAV_ORDER.filter((line) => line.id !== "store-wide").map((line) => line.id),
);

function isProductLineJsonField(fieldId: string, value: unknown): boolean {
  if (!fieldId.includes("-lines") && !fieldId.endsWith("lines")) return false;
  const lines = Array.isArray(value) ? value : decodeProductLineWrapper(value);
  if (!lines) return false;
  if (lines.length === 0) return true;
  return lines.every((v) => typeof v === "string" && KNOWN_PRODUCT_LINE_IDS.has(v.toLowerCase()));
}

function decodeProductLineWrapper(value: unknown): unknown[] | null {
  const decoded = decodeFohLinesValue(value);
  return decoded.state === "configured" ? decoded.lines : null;
}
