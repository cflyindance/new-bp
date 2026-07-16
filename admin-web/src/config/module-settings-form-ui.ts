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

const WAIT_TIME_FORM_ROWS: ModuleSettingFormRowConfig[] = [
  {
    seq: 537,
    kind: "checkbox-group",
    checkboxes: [
      { fieldId: "537-queue-count", label: "展示排队数量", defaultChecked: true },
      { fieldId: "537-wait-time", label: "展示等待时间", defaultChecked: true },
    ],
  },
  {
    seq: 538,
    kind: "radio-group",
    radioFieldId: "538-font-size-mode",
    radioDefault: "system",
    radios: [
      { value: "system", label: "系统默认大小" },
      {
        value: "multiplier",
        labelBefore: "系统默认大小的",
        numberFieldId: "538-font-size-multiplier",
        numberDefault: 1,
        labelAfter: "倍",
        numberMin: 0.1,
        numberMax: 10,
      },
    ],
  },
  {
    seq: 539,
    kind: "radio-color",
    radioFieldId: "539-font-bg-mode",
    radioDefault: "system",
    customColorValue: "custom",
    colorFieldId: "539-font-bg-color",
    colorDefault: "#9ca3af",
    radios: [
      { value: "system", label: "系统默认背景色" },
      { value: "custom", label: "自定义背景色" },
    ],
  },
  {
    seq: 540,
    kind: "radio-color",
    radioFieldId: "540-font-color-mode",
    radioDefault: "system",
    customColorValue: "custom",
    colorFieldId: "540-font-color",
    colorDefault: "#ffffff",
    radios: [
      { value: "system", label: "系统默认颜色" },
      { value: "custom", label: "自定义颜色" },
    ],
  },
];

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
  ...WAIT_TIME_FORM_ROWS,
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

export function readModuleSettingJson<T>(fieldId: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null || raw === "") return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function writeModuleSettingJson(fieldId: string, value: unknown, kind: ModuleSettingChangeKind = "json"): void {
  const before = readModuleSettingJson<unknown>(fieldId, null);
  const afterStr = JSON.stringify(value);
  const beforeStr = before === null ? null : JSON.stringify(before);
  if (beforeStr === afterStr) return;
  const resolvedKind =
    kind === "json" && isProductLineJsonField(fieldId, value) ? "product_line" : kind;
  if (deferFieldWrite(fieldId, afterStr, resolvedKind, before, value)) return;
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), afterStr);
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

function isProductLineJsonField(fieldId: string, value: unknown): boolean {
  if (!fieldId.includes("-lines") && !fieldId.endsWith("lines")) return false;
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return true;
  const known = new Set(["pos", "emenu", "kiosk", "cds", "paypad", "sdi", "online-order"]);
  return value.every((v) => typeof v === "string" && known.has(v.toLowerCase()));
}
