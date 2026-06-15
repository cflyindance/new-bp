/**
 * 产线预设 — 可配置设置项 schema（复用模块设置控件元数据）
 */
import { getSubOptionsForSeq } from "./module-settings-ai-multi-options";
import {
  getModuleSettingFormRow,
  listModuleSettingFormFieldDescriptors,
} from "./module-settings-form-ui";
import {
  MAX_GUESTS_PER_ORDER_FIELD_ID,
  MAX_GUESTS_PER_ORDER_SEQ,
} from "./module-settings-max-guests-per-order-ui";
import {
  getDefaultModuleSettingToggleOn,
  isModuleSettingToggleSeq,
} from "./module-settings-toggle-ui";

/** 避免经 table-selection / party-size UI 模块间接拉起 toggle-ui 循环引用 */
const TABLE_SELECTION_PAGE_SEQ = 107;
const PARTY_SIZE_SELECTION_PAGE_SEQ = 619;
const FOH_LINE_OPTIONS = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
] as const;

export type PresetSettingControl =
  | { kind: "toggle"; label: string; defaultOn: boolean }
  | {
      kind: "number";
      fieldId: string;
      label: string;
      default: number;
      min?: number;
      max?: number;
    }
  | {
      kind: "checkbox";
      fieldId: string;
      label: string;
      default: boolean;
    }
  | {
      kind: "radio";
      fieldId: string;
      label: string;
      default: string;
      options: { value: string; label: string }[];
    }
  | {
      kind: "lineMultiselect";
      fieldId: string;
      label: string;
      default: string[];
      options: { id: string; label: string }[];
    };

export interface PresetSettingSchema {
  seq: number;
  controls: PresetSettingControl[];
}

const PRESET_NUMBER_FIELDS: {
  seq: number;
  fieldId: string;
  label: string;
  default: number;
  min?: number;
  max?: number;
}[] = [
  {
    seq: MAX_GUESTS_PER_ORDER_SEQ,
    fieldId: MAX_GUESTS_PER_ORDER_FIELD_ID,
    label: "每单最多客人数量",
    default: 20,
    min: 1,
    max: 99,
  },
  { seq: 63, fieldId: "63-cash-drawer-float-amount", label: "开班备款金额", default: 0, min: 0, max: 10000 },
  { seq: 76, fieldId: "76-cash-reconciliation-tolerance", label: "长短款容差", default: 0, min: 0, max: 500 },
  { seq: 110, fieldId: "110-order-timeout-reminder-minutes", label: "订单超时提醒", default: 30 },
  { seq: 75, fieldId: "75-auto-logout-minutes", label: "自动登出分钟", default: 15 },
  { seq: 230, fieldId: "230-settlement-days", label: "结算天数", default: 7 },
  { seq: 236, fieldId: "236-unbatched-order-limit", label: "未 batch 订单上限", default: 50 },
  { seq: 232, fieldId: "232-tip-alert-ratio-percent", label: "小费提醒比例", default: 20 },
  { seq: 640, fieldId: "640-service-call-cooldown-seconds", label: "呼叫间隔秒数", default: 60 },
];

function pushFormRowControls(controls: PresetSettingControl[], seq: number): void {
  const row = getModuleSettingFormRow(seq);
  if (!row) return;

  if (row.kind === "checkbox-group" && row.checkboxes) {
    for (const cb of row.checkboxes) {
      controls.push({
        kind: "checkbox",
        fieldId: cb.fieldId,
        label: cb.label,
        default: cb.defaultChecked,
      });
    }
  }

  if ((row.kind === "radio-group" || row.kind === "radio-color") && row.radioFieldId && row.radios) {
    const options = row.radios
      .filter((r): r is { value: string; label: string } => "label" in r)
      .map((r) => ({ value: r.value, label: r.label }));
    controls.push({
      kind: "radio",
      fieldId: row.radioFieldId,
      label: "选项",
      default: row.radioDefault ?? options[0]?.value ?? "",
      options,
    });
    for (const r of row.radios) {
      if ("numberFieldId" in r) {
        controls.push({
          kind: "number",
          fieldId: r.numberFieldId,
          label: `${r.labelBefore ?? ""}${r.labelAfter ?? ""}`.trim() || r.numberFieldId,
          default: r.numberDefault,
          min: r.numberMin,
          max: r.numberMax,
        });
      }
    }
  }
}

function pushSubOptionControls(controls: PresetSettingControl[], seq: number): void {
  for (const opt of getSubOptionsForSeq(seq)) {
    if (controls.some((c) => "fieldId" in c && c.fieldId === opt.fieldId)) continue;
    controls.push({
      kind: "checkbox",
      fieldId: opt.fieldId,
      label: opt.label,
      default: true,
    });
  }
}

function pushNumberControls(controls: PresetSettingControl[], seq: number): void {
  for (const nf of PRESET_NUMBER_FIELDS.filter((f) => f.seq === seq)) {
    if (controls.some((c) => c.kind === "number" && c.fieldId === nf.fieldId)) continue;
    controls.push({
      kind: "number",
      fieldId: nf.fieldId,
      label: nf.label,
      default: nf.default,
      min: nf.min,
      max: nf.max,
    });
  }
  for (const fd of listModuleSettingFormFieldDescriptors().filter((f) => f.seq === seq && f.kind === "number")) {
    if (controls.some((c) => c.kind === "number" && c.fieldId === fd.fieldId)) continue;
    controls.push({
      kind: "number",
      fieldId: fd.fieldId,
      label: fd.label,
      default: 0,
    });
  }
}

/** 返回 null 表示该叶子仅支持排除，无可编辑选项 */
export function getPresetSettingSchema(seq: number): PresetSettingSchema | null {
  const controls: PresetSettingControl[] = [];

  if (seq === TABLE_SELECTION_PAGE_SEQ) {
    controls.push({
      kind: "toggle",
      label: "展示选桌页",
      defaultOn: getDefaultModuleSettingToggleOn(seq),
    });
    controls.push({
      kind: "lineMultiselect",
      fieldId: "107-table-selection-page-lines",
      label: "适用产线",
      default: FOH_LINE_OPTIONS.map((l) => l.id),
      options: FOH_LINE_OPTIONS.map((l) => ({ id: l.id, label: l.label })),
    });
    return { seq, controls };
  }

  if (seq === PARTY_SIZE_SELECTION_PAGE_SEQ) {
    controls.push({
      kind: "toggle",
      label: "展示人数选择页",
      defaultOn: getDefaultModuleSettingToggleOn(seq),
    });
    controls.push({
      kind: "lineMultiselect",
      fieldId: "619-party-size-selection-lines",
      label: "适用产线",
      default: FOH_LINE_OPTIONS.map((l) => l.id),
      options: FOH_LINE_OPTIONS.map((l) => ({ id: l.id, label: l.label })),
    });
    return { seq, controls };
  }

  pushFormRowControls(controls, seq);
  pushSubOptionControls(controls, seq);

  const hasToggle =
    isModuleSettingToggleSeq(seq) &&
    seq !== TABLE_SELECTION_PAGE_SEQ &&
    seq !== PARTY_SIZE_SELECTION_PAGE_SEQ;

  if (hasToggle) {
    controls.unshift({
      kind: "toggle",
      label: "功能开关",
      defaultOn: getDefaultModuleSettingToggleOn(seq),
    });
  }

  pushNumberControls(controls, seq);

  if (controls.length === 0) return null;
  return { seq, controls };
}

export function leafHasConfigurableSettings(leafId: string, seq: number | null): boolean {
  if (seq === null) return false;
  return getPresetSettingSchema(seq) !== null;
}
