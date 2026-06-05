/**
 * 设置滑层：主开关 + 展开子项（原型，localStorage 持久化）。
 */

export type ModuleSettingNestedFieldPart =
  | { type: "text"; value: string }
  | { type: "number"; fieldId: string; defaultValue: number; min?: number; max?: number; widthClass?: string };

export type ModuleSettingNestedInlineField = {
  kind: "inline";
  fieldKey: string;
  parts: ModuleSettingNestedFieldPart[];
};

export type ModuleSettingNestedRadioField = {
  kind: "radio";
  fieldKey: string;
  radioFieldId: string;
  radioDefault: string;
  options: { value: string; label: string }[];
};

/** 标题 + 内容文案（如点单须知、火锅页面提示） */
export type ModuleSettingNestedCopyFormField = {
  kind: "copy-form";
  fieldKey: string;
  titleFieldId: string;
  contentFieldId: string;
  titleMaxLength: number;
  contentMaxLength: number;
  titleLabel?: string;
  contentLabel?: string;
};

/** 每轮菜品互斥规则（597） */
export type ModuleSettingNestedDishMutexField = {
  kind: "dish-mutex-rules";
  fieldKey: string;
  storageFieldId: string;
};

/** 每轮菜品组合规则（598） */
export type ModuleSettingNestedDishComboField = {
  kind: "dish-combo-rules";
  fieldKey: string;
  storageFieldId: string;
};

export type ModuleSettingNestedHintField = {
  kind: "hint";
  fieldKey: string;
  text: string;
};

/** 独立菜品多选（如展示菜详情、大图菜、抽奖排除/奖池） */
export type ModuleSettingNestedDishTagsField = {
  kind: "dish-tags";
  fieldKey: string;
  label: string;
  storageFieldId: string;
  /** checkbox：平铺多选；select：下拉添加（默认 checkbox） */
  pickerUi?: "checkbox" | "select";
};

/** 随单选值显隐的菜品多选（如大图模式下的「请选择大图菜」） */
export type ModuleSettingNestedConditionalDishTagsField = {
  kind: "conditional-dish-tags";
  fieldKey: string;
  label: string;
  storageFieldId: string;
  whenRadioFieldId: string;
  whenRadioValue: string;
  whenRadioDefault: string;
};

/** 开关开启后的单行文本（如自定义分割线名称） */
export type ModuleSettingNestedTextInputField = {
  kind: "text-input";
  fieldKey: string;
  textFieldId: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
};

export type ModuleSettingNestedField =
  | ModuleSettingNestedInlineField
  | ModuleSettingNestedRadioField
  | ModuleSettingNestedCopyFormField
  | ModuleSettingNestedDishMutexField
  | ModuleSettingNestedDishComboField
  | ModuleSettingNestedHintField
  | ModuleSettingNestedDishTagsField
  | ModuleSettingNestedConditionalDishTagsField
  | ModuleSettingNestedTextInputField;

export interface ModuleSettingNestedGroupConfig {
  parentSeq: number;
  fields: ModuleSettingNestedField[];
}

/** 排队与等待展示 · 展示当前订单预计等待时长（535；产线见 wait-time-display-ui） */
const WAIT_TIME_535_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 535,
  fields: [
    {
      kind: "inline",
      fieldKey: "auto-close-minutes",
      parts: [
        { type: "text", value: "当前下单预计等待时间大于" },
        { type: "number", fieldId: "535-auto-close-minutes", defaultValue: 30, min: 0, widthClass: "w-16" },
        { type: "text", value: "分钟后，自动关闭提示" },
      ],
    },
    {
      kind: "inline",
      fieldKey: "menu-popup-minutes",
      parts: [
        { type: "text", value: "当前下单预计等待时间大于" },
        { type: "number", fieldId: "535-menu-popup-minutes", defaultValue: 10, min: 0, widthClass: "w-16" },
        { type: "text", value: "分钟后，菜单页自动展示弹框提示" },
      ],
    },
  ],
};

/** 排队与等待展示 · 预计等待时长区间设置（536） */
const WAIT_TIME_536_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 536,
  fields: [
    {
      kind: "inline",
      fieldKey: "cups-or-minutes",
      parts: [
        { type: "text", value: "当杯数大于" },
        { type: "number", fieldId: "536-cups-threshold", defaultValue: 10, min: 0, widthClass: "w-16" },
        { type: "text", value: "杯，或者当预计等待时长大于" },
        { type: "number", fieldId: "536-minutes-threshold", defaultValue: 10, min: 0, widthClass: "w-16" },
        { type: "text", value: "分钟" },
      ],
    },
    {
      kind: "inline",
      fieldKey: "range-start-offset",
      parts: [
        { type: "text", value: "区间开始：在原固定时长上减" },
        { type: "number", fieldId: "536-range-start-minus", defaultValue: 2, min: 0, widthClass: "w-16" },
        { type: "text", value: "分钟" },
      ],
    },
    {
      kind: "inline",
      fieldKey: "range-end-offset",
      parts: [
        { type: "text", value: "区间结束：在原固定时长上加" },
        { type: "number", fieldId: "536-range-end-plus", defaultValue: 2, min: 0, widthClass: "w-16" },
        { type: "text", value: "分钟" },
      ],
    },
  ],
};

/** POS 点单页工具栏 · 自定义分割线名称（196） */
const POS_TOOLBAR_196_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 196,
  fields: [
    {
      kind: "text-input",
      fieldKey: "divider-name",
      textFieldId: "196-custom-divider-name",
      label: "分割线名称",
      placeholder: "请输入 POS 点单页自定义分割线名称",
      maxLength: 40,
    },
  ],
};

/** seq 569 点单须知见 module-settings-guest-order-notice-ui.ts（主开关 + 各产线标题/内容） */

/** 食客端·下单与规则 · 火锅页面提示（570） */
const GUEST_ORDER_570_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 570,
  fields: [
    {
      kind: "copy-form",
      fieldKey: "hotpot-tip",
      titleFieldId: "570-title",
      contentFieldId: "570-content",
      titleMaxLength: 20,
      contentMaxLength: 200,
    },
  ],
};

/** 597/598 每轮菜品互斥/组合已迁前厅 menu-order-limits 业务页，见 foh-menu-order-limits-ui.ts */

/** 食客端·首页与版式 · 展示菜详情（608）见 module-settings-guest-dish-detail-display-ui.ts */

/** 食客端·首页与版式 · 菜品名称字体大小（645）见 module-settings-guest-menu-dish-name-font-ui.ts */

/** 促销中心 · 抽奖活动（647） */
const PROMO_LOTTERY_647_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 647,
  fields: [
    {
      kind: "inline",
      fieldKey: "draw-quota",
      parts: [
        { type: "text", value: "每满" },
        { type: "number", fieldId: "647-items-per-draw", defaultValue: 1, min: 1, widthClass: "w-16" },
        { type: "text", value: "件菜品抽一次  最多抽" },
        { type: "number", fieldId: "647-max-draws", defaultValue: 1, min: 1, widthClass: "w-16" },
        { type: "text", value: "次" },
      ],
    },
    {
      kind: "dish-tags",
      fieldKey: "excluded-dishes",
      label: "不参与计算的菜品",
      storageFieldId: "647-excluded-dishes",
      pickerUi: "select",
    },
    {
      kind: "inline",
      fieldKey: "win-probability",
      parts: [
        { type: "text", value: "每次中奖概率" },
        { type: "number", fieldId: "647-win-probability-percent", defaultValue: 10, min: 0, max: 100, widthClass: "w-16" },
        { type: "text", value: "%" },
      ],
    },
    {
      kind: "dish-tags",
      fieldKey: "prize-pool",
      label: "奖励池商品",
      storageFieldId: "647-prize-pool-dishes",
      pickerUi: "select",
    },
  ],
};

const NESTED_BY_PARENT_SEQ = new Map<number, ModuleSettingNestedGroupConfig>([
  [535, WAIT_TIME_535_NESTED],
  [536, WAIT_TIME_536_NESTED],
  [196, POS_TOOLBAR_196_NESTED],
  [570, GUEST_ORDER_570_NESTED],
  [647, PROMO_LOTTERY_647_NESTED],
]);

export function getModuleSettingNestedGroup(parentSeq: number): ModuleSettingNestedGroupConfig | undefined {
  return NESTED_BY_PARENT_SEQ.get(parentSeq);
}

export function isModuleSettingNestedParentSeq(seq: number): boolean {
  return NESTED_BY_PARENT_SEQ.has(seq);
}

export {
  readModuleSettingNumber as readModuleSettingFieldNumber,
  writeModuleSettingNumber as writeModuleSettingFieldNumber,
  readModuleSettingRadio,
  writeModuleSettingRadio,
  readModuleSettingText,
  writeModuleSettingText,
} from "./module-settings-form-ui";
