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

/** 等待时长 · 展示当前订单预计等待时长（535） */
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

/** 等待时长 · 预计等待时长区间设置（536） */
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

/** 备注与附加服务 · 产品备注（522） */
const GUEST_NOTES_522_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 522,
  fields: [
    {
      kind: "dish-tags",
      fieldKey: "remark-dishes",
      label: "请选择展示备注的菜品",
      storageFieldId: "522-remark-dishes",
    },
  ],
};

/** 备注与附加服务 · 餐具加收（544） */
const GUEST_NOTES_544_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 544,
  fields: [
    {
      kind: "radio",
      fieldKey: "utensils-fee",
      radioFieldId: "544-utensils-fee-mode",
      radioDefault: "free",
      options: [
        { value: "free", label: "免费" },
        { value: "1.5", label: "$1.5" },
        { value: "other", label: "其他金额" },
      ],
    },
  ],
};

/** 备注与附加服务 · 打包带加收（545） */
const GUEST_NOTES_545_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 545,
  fields: [
    {
      kind: "radio",
      fieldKey: "packaging-fee",
      radioFieldId: "545-packaging-fee-mode",
      radioDefault: "free",
      options: [
        { value: "free", label: "免费" },
        { value: "1.5", label: "$1.5" },
        { value: "other", label: "其他金额" },
      ],
    },
  ],
};

/** 食客端·下单与规则 · 点单须知（569） */
const GUEST_ORDER_569_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 569,
  fields: [
    {
      kind: "copy-form",
      fieldKey: "order-notice",
      titleFieldId: "569-title",
      contentFieldId: "569-content",
      titleMaxLength: 20,
      contentMaxLength: 200,
    },
  ],
};

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

/** 食客端·下单与规则 · 每轮菜品互斥下单（597） */
const GUEST_ORDER_597_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 597,
  fields: [{ kind: "dish-mutex-rules", fieldKey: "mutex", storageFieldId: "597-mutex-rules" }],
};

/** 食客端·下单与规则 · 每轮菜品组合下单（598） */
const GUEST_ORDER_598_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 598,
  fields: [{ kind: "dish-combo-rules", fieldKey: "combo", storageFieldId: "598-combo-rules" }],
};

/** 食客端·首页与版式 · 菜单图片展示模式（607） */
const GUEST_MENU_607_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 607,
  fields: [
    {
      kind: "radio",
      fieldKey: "image-mode",
      radioFieldId: "607-image-mode",
      radioDefault: "small",
      options: [
        { value: "original", label: "原始模式" },
        { value: "small", label: "小图模式" },
        { value: "large", label: "大图模式" },
      ],
    },
    {
      kind: "conditional-dish-tags",
      fieldKey: "small-dishes",
      label: "请选择大图菜",
      storageFieldId: "607-small-dishes",
      whenRadioFieldId: "607-image-mode",
      whenRadioValue: "small",
      whenRadioDefault: "small",
    },
    {
      kind: "conditional-dish-tags",
      fieldKey: "large-dishes",
      label: "请选择小图菜",
      storageFieldId: "607-large-dishes",
      whenRadioFieldId: "607-image-mode",
      whenRadioValue: "large",
      whenRadioDefault: "small",
    },
  ],
};

/** 食客端·首页与版式 · 展示菜详情（608） */
const GUEST_MENU_608_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 608,
  fields: [
    {
      kind: "hint",
      fieldKey: "detail-hint",
      text: "只针对仅有图片、名称、价格、描述的菜生效",
    },
    {
      kind: "dish-tags",
      fieldKey: "no-attr-dishes",
      label: "请选择无属性的菜",
      storageFieldId: "608-no-attr-dishes",
    },
  ],
};

/** 食客端·首页与版式 · 菜品名称字体大小（645） */
const GUEST_MENU_645_NESTED: ModuleSettingNestedGroupConfig = {
  parentSeq: 645,
  fields: [
    {
      kind: "hint",
      fieldKey: "font-hint",
      text: "打开后，你可以设置菜品名称字体大小",
    },
    {
      kind: "inline",
      fieldKey: "font-size",
      parts: [
        {
          type: "number",
          fieldId: "645-dish-name-font-px",
          defaultValue: 16,
          min: 8,
          max: 72,
          widthClass: "w-16",
        },
        { type: "text", value: "px" },
      ],
    },
  ],
};

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
  [522, GUEST_NOTES_522_NESTED],
  [544, GUEST_NOTES_544_NESTED],
  [545, GUEST_NOTES_545_NESTED],
  [569, GUEST_ORDER_569_NESTED],
  [570, GUEST_ORDER_570_NESTED],
  [597, GUEST_ORDER_597_NESTED],
  [598, GUEST_ORDER_598_NESTED],
  [607, GUEST_MENU_607_NESTED],
  [608, GUEST_MENU_608_NESTED],
  [645, GUEST_MENU_645_NESTED],
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
