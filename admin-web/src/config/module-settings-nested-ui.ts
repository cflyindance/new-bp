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

/** 标题 + 内容文案（copy-form） */
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

/** 独立菜品多选（如展示菜详情、大图菜） */
export type ModuleSettingNestedDishTagsField = {
  kind: "dish-tags";
  fieldKey: string;
  label: string;
  storageFieldId: string;
  /** checkbox：平铺多选；select：下拉添加（默认 checkbox） */
  pickerUi?: "checkbox" | "select";
};

/**
 * 按产线 + 组/类/菜结构选商品（对齐店中店品牌菜单）
 * 存储值为 BrandMenuStructureByLine
 */
export type ModuleSettingNestedMenuStructureByLineField = {
  kind: "menu-structure-by-line";
  fieldKey: string;
  label: string;
  storageFieldId: string;
  hint?: string;
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
  | ModuleSettingNestedMenuStructureByLineField
  | ModuleSettingNestedConditionalDishTagsField
  | ModuleSettingNestedTextInputField;

export interface ModuleSettingNestedGroupConfig {
  parentSeq: number;
  fields: ModuleSettingNestedField[];
}

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
      kind: "menu-structure-by-line",
      fieldKey: "excluded-dishes",
      label: "不参与计算的菜品",
      storageFieldId: "647-excluded-dishes",
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
      kind: "menu-structure-by-line",
      fieldKey: "prize-pool",
      label: "奖励池商品",
      storageFieldId: "647-prize-pool-dishes",
    },
  ],
};

const NESTED_BY_PARENT_SEQ = new Map<number, ModuleSettingNestedGroupConfig>([
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
