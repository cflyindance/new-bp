/**
 * 设置滑层：整行表单控件（多选 / 单选 / 颜色），原型 localStorage。
 */

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

export function moduleSettingStorageKey(fieldId: string): string {
  return `bplant-module-setting-field:${fieldId}`;
}

export function readModuleSettingCheckbox(fieldId: string, defaultChecked: boolean): boolean {
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null) return defaultChecked;
    return raw === "1";
  } catch {
    return defaultChecked;
  }
}

export function writeModuleSettingCheckbox(fieldId: string, checked: boolean): void {
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), checked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function readModuleSettingRadio(fieldId: string, defaultValue: string): string {
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null || raw === "") return defaultValue;
    return raw;
  } catch {
    return defaultValue;
  }
}

export function writeModuleSettingRadio(fieldId: string, value: string): void {
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), value);
  } catch {
    /* ignore */
  }
}

export function readModuleSettingColor(fieldId: string, defaultValue: string): string {
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null || raw === "") return defaultValue;
    return raw;
  } catch {
    return defaultValue;
  }
}

export function writeModuleSettingColor(fieldId: string, value: string): void {
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), value);
  } catch {
    /* ignore */
  }
}

export function readModuleSettingNumber(fieldId: string, defaultValue: number): number {
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
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), String(value));
  } catch {
    /* ignore */
  }
}

export function readModuleSettingText(fieldId: string, defaultValue = ""): string {
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(fieldId));
    if (raw === null) return defaultValue;
    return raw;
  } catch {
    return defaultValue;
  }
}

export function writeModuleSettingText(fieldId: string, value: string): void {
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), value);
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

export function writeModuleSettingJson(fieldId: string, value: unknown): void {
  try {
    localStorage.setItem(moduleSettingStorageKey(fieldId), JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
