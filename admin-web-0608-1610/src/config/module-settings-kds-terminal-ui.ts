/**
 * 后厨 · KDS 终端配置专用 UI（seq 701–721，见 KDS终端配置语义重设计方案 v1.2）。
 */

import { renderModuleSettingSingleChoiceHtml } from "./module-settings-choice-ui";
import {
  readModuleSettingColor,
  readModuleSettingJson,
  readModuleSettingNumber,
  readModuleSettingRadio,
  readModuleSettingText,
  writeModuleSettingColor,
  writeModuleSettingJson,
  writeModuleSettingNumber,
  writeModuleSettingRadio,
  writeModuleSettingText,
} from "./module-settings-form-ui";
import type { ModuleSettingCatalogItem } from "./module-settings-catalog";
import { readModuleSettingToggleOn } from "./module-settings-toggle-ui";

export const KDS_LAYOUT_SEQ = 701;
export const KDS_THEME_COLOR_SEQ = 702;
export const KDS_COUNT_SUFFIX_SEQ = 703;
export const KDS_ORDER_TYPE_STYLE_HOST_SEQ = 707;
export const KDS_REMINDER_HOST_SEQ = 708;
export const KDS_STATUS_PIPELINE_HOST_SEQ = 709;
export const KDS_FLOW_MAP_HOST_SEQ = 712;
export const KDS_PARTIAL_COMPLETE_HOST_SEQ = 715;
export const KDS_SUBITEM_FLOW_HOST_SEQ = 717;
export const KDS_RING_DEFAULT_HOST_SEQ = 719;
export const KDS_RING_INSTANCE_SEQ = 721;

/** 合并展示、跳过独立 catalog 行 */
export const KDS_MERGED_SKIP_SEQ: readonly number[] = [713, 714, 716, 718, 720];

/** 简单开关（右侧 toggle）；715/717 为宿主行主开关，718 嵌在 717 行内 */
export const KDS_SIMPLE_TOGGLE_SEQ: readonly number[] = [704, 705, 706, 710, 711, 715, 717, 718];

export const KDS_LAYOUT_FIELD_ID = "701-kds-layout-mode";
export const KDS_THEME_COLOR_FIELD_ID = "702-kds-theme-color";
export const KDS_COUNT_SUFFIX_FIELD_ID = "703-kds-count-suffix";
export const KDS_ORDER_TYPE_STYLES_FIELD_ID = "707-kds-order-type-styles";
export const KDS_REMINDER_FIELD_ID = "708-kds-reminder-ladder";
export const KDS_STATUS_PIPELINE_FIELD_ID = "709-kds-status-pipeline";
export const KDS_FLOW_KDS_FIELD_ID = "712-kds-flow-map-kds";
export const KDS_FLOW_RDS_FIELD_ID = "712-kds-flow-map-rds";
export const KDS_FLOW_RDS_CLICK_FIELD_ID = "712-kds-rds-can-click";
export const KDS_PARTIAL_FLOW_FIELD_ID = "715-kds-partial-complete-flow";
export const KDS_RING_COUNT_FIELD_ID = "719-kds-ring-count";
export const KDS_RING_TYPE_FIELD_ID = "719-kds-ring-type";
export const KDS_RING_INSTANCE_RULES_FIELD_ID = "721-kds-ring-instance-rules";
/** 与硬件 KDS 设备台账共用的应用实例目录（原型 localStorage） */
export const KDS_INSTANCE_CATALOG_FIELD_ID = "kds-application-instance-catalog";

export const HARDWARE_KDS_PATH = "/device-management/hardware/kds";

export type KdsApplicationInstance = { id: string; label: string };

export type KdsRingInstanceRule = {
  id: string;
  instanceId: string;
  ringCount: number;
  ringType: string;
};

const DEFAULT_KDS_APPLICATION_INSTANCES: KdsApplicationInstance[] = [
  { id: "kds-default", label: "KDS" },
  { id: "kds-111", label: "111" },
  { id: "kds-11", label: "11" },
];

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer`;
const COLOR_CLASS =
  "size-9 shrink-0 cursor-pointer rounded border border-input bg-background p-0.5";

export const KDS_STANDARD_ORDER_TYPES = [
  { code: "dine-in", label: "Dine In" },
  { code: "to-go", label: "To Go" },
  { code: "pick-up", label: "Pick Up" },
  { code: "delivery", label: "Delivery" },
] as const;

/** KDS / RDS 流程映射：绑定出餐状态（与 709 四态一致） */
export const KDS_FLOW_STATUS_OPTIONS = [
  { value: "WAITING", label: "WAITING" },
  { value: "PROCESSING", label: "PROCESSING" },
  { value: "SERVED", label: "SERVED" },
  { value: "COMPLETE", label: "COMPLETE" },
] as const;

const KDS_FLOW_STATUS_VALUES = new Set<string>(KDS_FLOW_STATUS_OPTIONS.map((o) => o.value));

const LEGACY_KDS_FLOW_MAP_VALUES = new Set(["default", "fast-food", "full-service"]);
const LEGACY_KDS_PARTIAL_FLOW_VALUES = new Set(["default-partial", "split-station"]);

function readKdsFlowStatusMapping(
  fieldId: string,
  fallback: string = "WAITING",
  legacyValues: ReadonlySet<string> = LEGACY_KDS_FLOW_MAP_VALUES,
): string {
  const stored = readModuleSettingRadio(fieldId, fallback);
  if (KDS_FLOW_STATUS_VALUES.has(stored)) return stored;
  if (legacyValues.has(stored)) return fallback;
  return fallback;
}

export const KDS_RING_TYPE_OPTIONS = [
  { value: "bell-1", label: "铃声 1" },
  { value: "bell-2", label: "铃声 2" },
  { value: "long-alert", label: "长提示音" },
] as const;

type KdsOrderTypeStyleRow = {
  id: string;
  orderType: string;
  bgColor: string;
  fgColor: string;
};

type KdsStatusNode = {
  key: string;
  systemLabel: string;
  zh: string;
  en: string;
  bgColor: string;
};

type KdsReminderLadder = {
  firstMinutes: number;
  firstColor: string;
  secondMinutes: number;
  secondColor: string;
};

const DEFAULT_STATUS_PIPELINE: KdsStatusNode[] = [
  { key: "waiting", systemLabel: "WAITING", zh: "待制作", en: "Waiting", bgColor: "#f3f4f6" },
  { key: "processing", systemLabel: "PROCESSING", zh: "制作中", en: "Processing", bgColor: "#fef3c7" },
  { key: "served", systemLabel: "SERVED", zh: "已出餐", en: "Served", bgColor: "#dbeafe" },
  { key: "complete", systemLabel: "COMPLETE", zh: "完成", en: "Complete", bgColor: "#dcfce7" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function shouldSkipKdsMergedCatalogRow(seq: number): boolean {
  return KDS_MERGED_SKIP_SEQ.includes(seq);
}

export function isKdsSimpleToggleSeq(seq: number): boolean {
  return KDS_SIMPLE_TOGGLE_SEQ.includes(seq);
}

export function isKdsLayoutSeq(seq: number): boolean {
  return seq === KDS_LAYOUT_SEQ;
}

export function isKdsThemeColorSeq(seq: number): boolean {
  return seq === KDS_THEME_COLOR_SEQ;
}

export function isKdsCountSuffixSeq(seq: number): boolean {
  return seq === KDS_COUNT_SUFFIX_SEQ;
}

export function isKdsOrderTypeStyleHostSeq(seq: number): boolean {
  return seq === KDS_ORDER_TYPE_STYLE_HOST_SEQ;
}

export function isKdsReminderHostSeq(seq: number): boolean {
  return seq === KDS_REMINDER_HOST_SEQ;
}

export function isKdsStatusPipelineHostSeq(seq: number): boolean {
  return seq === KDS_STATUS_PIPELINE_HOST_SEQ;
}

export function isKdsFlowMapHostSeq(seq: number): boolean {
  return seq === KDS_FLOW_MAP_HOST_SEQ;
}

export function isKdsPartialCompleteHostSeq(seq: number): boolean {
  return seq === KDS_PARTIAL_COMPLETE_HOST_SEQ;
}

export function isKdsSubitemFlowHostSeq(seq: number): boolean {
  return seq === KDS_SUBITEM_FLOW_HOST_SEQ;
}

export function isKdsRingDefaultHostSeq(seq: number): boolean {
  return seq === KDS_RING_DEFAULT_HOST_SEQ;
}

export function isKdsRingInstanceSeq(seq: number): boolean {
  return seq === KDS_RING_INSTANCE_SEQ;
}

function readOrderTypeStyles(): KdsOrderTypeStyleRow[] {
  return readModuleSettingJson<KdsOrderTypeStyleRow[]>(KDS_ORDER_TYPE_STYLES_FIELD_ID, []);
}

function readStatusPipeline(): KdsStatusNode[] {
  const stored = readModuleSettingJson<KdsStatusNode[]>(KDS_STATUS_PIPELINE_FIELD_ID, []);
  if (!stored.length) return DEFAULT_STATUS_PIPELINE.map((n) => ({ ...n }));
  return DEFAULT_STATUS_PIPELINE.map((def) => {
    const hit = stored.find((s) => s.key === def.key);
    return hit ? { ...def, ...hit, systemLabel: def.systemLabel, key: def.key } : { ...def };
  });
}

function readReminderLadder(): KdsReminderLadder {
  return readModuleSettingJson<KdsReminderLadder>(KDS_REMINDER_FIELD_ID, {
    firstMinutes: 8,
    firstColor: "#f59e0b",
    secondMinutes: 18,
    secondColor: "#ef4444",
  });
}

function renderSelect(
  fieldId: string,
  options: readonly { value: string; label: string }[],
  current: string,
  ariaLabel: string,
  disabled = false,
  dataAttr: "data-module-setting-select" | "data-kds-ring-instance-field" = "data-module-setting-select",
  dataValue?: string,
): string {
  const opts = options
    .map(
      (o) =>
        `<option value="${escapeHtml(o.value)}" ${current === o.value ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
    )
    .join("");
  const attrValue = dataAttr === "data-kds-ring-instance-field" ? dataValue ?? "ringType" : fieldId;
  const attrName =
    dataAttr === "data-kds-ring-instance-field"
      ? `${dataAttr}="${escapeHtml(attrValue)}"`
      : `${dataAttr}="${escapeHtml(fieldId)}"`;
  return `
    <select
      class="${SELECT_CLASS}"
      ${attrName}
      aria-label="${escapeHtml(ariaLabel)}"
      ${disabled ? "disabled" : ""}
    >
      ${opts}
    </select>`;
}

export function renderKdsLayoutRowHtml(_item: ModuleSettingCatalogItem): string {
  const current = readModuleSettingRadio(KDS_LAYOUT_FIELD_ID, "waterfall");
  const choice = renderModuleSettingSingleChoiceHtml({
    options: [
      { value: "waterfall", label: "瀑布流" },
      { value: "grid", label: "行列式" },
    ],
    fieldId: KDS_LAYOUT_FIELD_ID,
    groupName: "kds-layout-mode",
    currentValue: current,
    layout: "wrap",
    ariaLabel: "页面布局类型",
  });
  const preview =
    current === "grid"
      ? `<div class="grid grid-cols-3 gap-1.5 w-28"><div class="h-6 rounded bg-primary/25"></div><div class="h-8 rounded bg-primary/25"></div><div class="h-5 rounded bg-primary/25"></div><div class="h-7 rounded bg-primary/20"></div><div class="h-6 rounded bg-primary/20"></div><div class="h-9 rounded bg-primary/20"></div></div>`
      : `<div class="flex w-28 flex-col gap-1.5"><div class="h-5 w-full rounded bg-primary/25"></div><div class="h-8 w-4/5 rounded bg-primary/25"></div><div class="h-6 w-full rounded bg-primary/20"></div><div class="h-7 w-3/5 rounded bg-primary/20"></div></div>`;

  return `
    <div class="mt-3 flex flex-wrap items-start gap-6" data-kds-layout-controls>
      <div class="min-w-0 flex-1 space-y-2">${choice}</div>
      <div class="rounded-lg border border-dashed border-border bg-muted/30 p-3" aria-hidden="true">
        <p class="mb-2 text-xs text-muted-foreground">布局预览</p>
        ${preview}
      </div>
    </div>`;
}

export function renderKdsThemeColorRowHtml(): string {
  const color = readModuleSettingColor(KDS_THEME_COLOR_FIELD_ID, "#f97316");
  return `
    <div class="mt-3 flex items-center gap-3" data-kds-theme-color-controls>
      <input
        type="color"
        class="${COLOR_CLASS}"
        value="${escapeHtml(color)}"
        data-module-setting-color="${escapeHtml(KDS_THEME_COLOR_FIELD_ID)}"
        aria-label="主题色"
      />
      <span class="text-sm tabular-nums text-muted-foreground">${escapeHtml(color)}</span>
    </div>`;
}

export function renderKdsCountSuffixRowHtml(): string {
  const value = readModuleSettingText(KDS_COUNT_SUFFIX_FIELD_ID, "");
  return `
    <div class="mt-3 max-w-xs" data-kds-count-suffix-controls>
      <input
        type="text"
        class="${INPUT_CLASS}"
        value="${escapeHtml(value)}"
        placeholder="如：份"
        data-module-setting-field="${escapeHtml(KDS_COUNT_SUFFIX_FIELD_ID)}"
        data-default-value=""
        aria-label="计数后缀"
      />
    </div>`;
}

function renderOrderTypeStyleRow(row: KdsOrderTypeStyleRow): string {
  const typeOptions = KDS_STANDARD_ORDER_TYPES.map((t) => {
    const sel = row.orderType === t.code ? "selected" : "";
    return `<option value="${escapeHtml(t.code)}" ${sel}>${escapeHtml(t.label)}</option>`;
  }).join("");

  return `
    <div
      class="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
      data-kds-order-type-style-row="${escapeHtml(row.id)}"
    >
      <label class="space-y-1 text-sm">
        <span class="font-medium text-foreground">订单类型 <span class="text-destructive">*</span></span>
        <select class="${SELECT_CLASS}" data-kds-order-type-style-field="orderType" aria-label="订单类型">
          <option value="">请选择订单类型</option>
          ${typeOptions}
        </select>
      </label>
      <label class="space-y-1 text-sm">
        <span class="font-medium text-foreground">背景色 <span class="text-destructive">*</span></span>
        <input type="color" class="${COLOR_CLASS}" value="${escapeHtml(row.bgColor)}" data-kds-order-type-style-field="bgColor" aria-label="背景色" />
      </label>
      <label class="space-y-1 text-sm">
        <span class="font-medium text-foreground">文字颜色</span>
        <input type="color" class="${COLOR_CLASS}" value="${escapeHtml(row.fgColor)}" data-kds-order-type-style-field="fgColor" aria-label="文字颜色" />
      </label>
      <div class="flex items-end justify-end sm:justify-center">
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
          data-kds-order-type-style-remove
          aria-label="删除此项"
        >✕</button>
      </div>
    </div>`;
}

export function renderKdsOrderTypeStylesHtml(): string {
  const rows = readOrderTypeStyles();
  const body =
    rows.length > 0
      ? rows.map((r) => renderOrderTypeStyleRow(r)).join("")
      : `<p class="text-sm text-muted-foreground">尚未添加订单类型样式，点击下方按钮添加。</p>`;

  return `
    <div class="mt-3 space-y-3" data-kds-order-type-styles-root>
      <div class="space-y-2" data-kds-order-type-styles-list>${body}</div>
      <button
        type="button"
        class="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        data-kds-order-type-style-add
      >+ 添加项目</button>
    </div>`;
}

export function renderKdsReminderLadderHtml(): string {
  const r = readReminderLadder();
  return `
    <div class="mt-3 space-y-4" data-kds-reminder-ladder-root>
      <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>0 min</span>
        <span class="h-px flex-1 min-w-[2rem] bg-border"></span>
        <span>第一次（${r.firstMinutes} min）</span>
        <span class="h-px flex-1 min-w-[2rem] bg-border"></span>
        <span>第二次（${r.secondMinutes} min）</span>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <fieldset class="space-y-2 rounded-lg border border-border p-3">
          <legend class="px-1 text-sm font-medium text-foreground">第一次提醒配置</legend>
          <label class="block space-y-1 text-sm">
            <span class="text-muted-foreground">提醒时间（分钟）</span>
            <input type="number" min="1" step="1" class="${INPUT_CLASS} tabular-nums" value="${r.firstMinutes}" data-kds-reminder-field="firstMinutes" />
          </label>
          <label class="flex items-center gap-2 text-sm">
            <span class="text-muted-foreground">提醒颜色</span>
            <input type="color" class="${COLOR_CLASS}" value="${escapeHtml(r.firstColor)}" data-kds-reminder-field="firstColor" />
          </label>
        </fieldset>
        <fieldset class="space-y-2 rounded-lg border border-border p-3">
          <legend class="px-1 text-sm font-medium text-foreground">第二次提醒配置</legend>
          <label class="block space-y-1 text-sm">
            <span class="text-muted-foreground">提醒时间（分钟）</span>
            <input type="number" min="1" step="1" class="${INPUT_CLASS} tabular-nums" value="${r.secondMinutes}" data-kds-reminder-field="secondMinutes" />
          </label>
          <label class="flex items-center gap-2 text-sm">
            <span class="text-muted-foreground">提醒颜色</span>
            <input type="color" class="${COLOR_CLASS}" value="${escapeHtml(r.secondColor)}" data-kds-reminder-field="secondColor" />
          </label>
        </fieldset>
      </div>
    </div>`;
}

function renderStatusNodeCard(node: KdsStatusNode): string {
  return `
    <div class="space-y-2 rounded-lg border border-border bg-card p-3" data-kds-status-node="${escapeHtml(node.key)}">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">${escapeHtml(node.systemLabel)}</span>
      </div>
      <label class="block space-y-1 text-sm">
        <span class="text-muted-foreground">中文</span>
        <input type="text" class="${INPUT_CLASS}" value="${escapeHtml(node.zh)}" data-kds-status-field="zh" placeholder="请输入${escapeHtml(node.systemLabel)}中文名称" />
      </label>
      <label class="block space-y-1 text-sm">
        <span class="text-muted-foreground">英文</span>
        <input type="text" class="${INPUT_CLASS}" value="${escapeHtml(node.en)}" data-kds-status-field="en" placeholder="请输入${escapeHtml(node.systemLabel)}英文名称" />
      </label>
      <label class="flex items-center gap-2 text-sm">
        <span class="text-muted-foreground">背景色</span>
        <input type="color" class="${COLOR_CLASS}" value="${escapeHtml(node.bgColor)}" data-kds-status-field="bgColor" />
      </label>
    </div>`;
}

export function renderKdsStatusPipelineHtml(): string {
  const nodes = readStatusPipeline();
  return `
    <div class="mt-3 grid gap-3 sm:grid-cols-2" data-kds-status-pipeline-root>
      ${nodes.map((n) => renderStatusNodeCard(n)).join("")}
    </div>
    <p class="mt-2 text-xs text-muted-foreground">出餐状态顺序固定，仅可编辑展示文案与背景色。</p>`;
}

export function renderKdsFlowMapControlsHtml(): string {
  const kdsFlow = readKdsFlowStatusMapping(KDS_FLOW_KDS_FIELD_ID, "WAITING");
  const rdsFlow = readKdsFlowStatusMapping(KDS_FLOW_RDS_FIELD_ID, "WAITING");
  const rdsClick = readModuleSettingRadio(KDS_FLOW_RDS_CLICK_FIELD_ID, "0") === "1";
  return `
    <div class="mt-3 space-y-4" data-kds-flow-map-root>
      <p class="text-xs text-muted-foreground">将 KDS / RDS 端映射到出餐状态：WAITING · PROCESSING · SERVED · COMPLETE。</p>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-1 text-sm">
          <span class="font-medium text-foreground">KDS</span>
          ${renderSelect(KDS_FLOW_KDS_FIELD_ID, KDS_FLOW_STATUS_OPTIONS, kdsFlow, "请选择KDS映射")}
        </label>
        <label class="block space-y-1 text-sm">
          <span class="font-medium text-foreground">RDS</span>
          ${renderSelect(KDS_FLOW_RDS_FIELD_ID, KDS_FLOW_STATUS_OPTIONS, rdsFlow, "请选择RDS映射")}
        </label>
      </div>
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input type="checkbox" class="size-4 accent-primary" ${rdsClick ? "checked" : ""} data-kds-flow-rds-click />
        <span>RDS可点击KDS流程</span>
      </label>
    </div>`;
}

export function renderKdsPartialCompleteFlowHtml(enabled: boolean): string {
  const partialFlow = readKdsFlowStatusMapping(
    KDS_PARTIAL_FLOW_FIELD_ID,
    "WAITING",
    LEGACY_KDS_PARTIAL_FLOW_VALUES,
  );
  return `
    <div class="mt-3 space-y-2" data-kds-partial-flow-controls>
      <p class="text-xs text-muted-foreground">部分完成时映射到的出餐状态：WAITING · PROCESSING · SERVED · COMPLETE。</p>
      ${renderSelect(KDS_PARTIAL_FLOW_FIELD_ID, KDS_FLOW_STATUS_OPTIONS, partialFlow, "请选择部分完成流程", !enabled)}
    </div>`;
}

export function setKdsPartialFlowSelectEnabled(enabled: boolean, root: ParentNode = document): void {
  root.querySelectorAll("[data-kds-partial-flow-controls] select").forEach((sel) => {
    (sel as HTMLSelectElement).disabled = !enabled;
    sel.closest("label")?.classList.toggle("opacity-50", !enabled);
  });
}

export function setKdsSubitemDisableMainClickVisible(
  subitemFlowOn: boolean,
  root: ParentNode = document,
): void {
  root.querySelectorAll("[data-kds-subitem-disable-main-row]").forEach((row) => {
    row.classList.toggle("hidden", !subitemFlowOn);
  });
}

export function renderKdsRingDefaultHtml(): string {
  const count = readModuleSettingNumber(KDS_RING_COUNT_FIELD_ID, 2);
  const type = readModuleSettingRadio(KDS_RING_TYPE_FIELD_ID, "bell-1");
  return `
    <div class="mt-3 grid gap-4 sm:grid-cols-2" data-kds-ring-default-root>
      <label class="block space-y-1 text-sm">
        <span class="font-medium text-foreground">响铃次数</span>
        <input type="number" min="0" max="10" step="1" class="${INPUT_CLASS} tabular-nums" value="${count}" data-module-setting-field="${escapeHtml(KDS_RING_COUNT_FIELD_ID)}" data-default-value="2" />
      </label>
      <label class="block space-y-1 text-sm">
        <span class="font-medium text-foreground">响铃类型</span>
        ${renderSelect(KDS_RING_TYPE_FIELD_ID, KDS_RING_TYPE_OPTIONS, type, "请选择响铃")}
      </label>
    </div>`;
}

export function readKdsApplicationInstanceCatalog(): KdsApplicationInstance[] {
  const stored = readModuleSettingJson<KdsApplicationInstance[]>(KDS_INSTANCE_CATALOG_FIELD_ID, []);
  if (stored.length > 0) return stored;
  return DEFAULT_KDS_APPLICATION_INSTANCES.map((item) => ({ ...item }));
}

export function readKdsRingInstanceRules(): KdsRingInstanceRule[] {
  return readModuleSettingJson<KdsRingInstanceRule[]>(KDS_RING_INSTANCE_RULES_FIELD_ID, []);
}

function renderInstanceSelect(currentId: string, ariaLabel: string): string {
  const instances = readKdsApplicationInstanceCatalog();
  const opts = instances
    .map((inst) => {
      const sel = currentId === inst.id ? "selected" : "";
      return `<option value="${escapeHtml(inst.id)}" ${sel}>${escapeHtml(inst.label)}</option>`;
    })
    .join("");
  return `
    <select class="${SELECT_CLASS}" data-kds-ring-instance-field="instanceId" aria-label="${escapeHtml(ariaLabel)}">
      <option value="">请选择应用实例</option>
      ${opts}
    </select>`;
}

function renderRingInstanceRuleRow(row: KdsRingInstanceRule): string {
  const ringType = KDS_RING_TYPE_OPTIONS.some((o) => o.value === row.ringType)
    ? row.ringType
    : "bell-1";
  return `
    <div
      class="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto] sm:items-end"
      data-kds-ring-instance-row="${escapeHtml(row.id)}"
    >
      <label class="block space-y-1 text-sm">
        <span class="font-medium text-foreground"><span class="text-destructive">*</span> 应用实例</span>
        ${renderInstanceSelect(row.instanceId, "应用实例")}
      </label>
      <label class="block space-y-1 text-sm">
        <span class="font-medium text-foreground"><span class="text-destructive">*</span> 响铃次数</span>
        <input
          type="number"
          min="0"
          max="10"
          step="1"
          class="${INPUT_CLASS} tabular-nums"
          value="${row.ringCount}"
          data-kds-ring-instance-field="ringCount"
          aria-label="响铃次数"
        />
      </label>
      <label class="block space-y-1 text-sm">
        <span class="font-medium text-foreground"><span class="text-destructive">*</span> 响铃类型</span>
        ${renderSelect(row.id, KDS_RING_TYPE_OPTIONS, ringType, "请选择响铃", false, "data-kds-ring-instance-field", "ringType")}
      </label>
      <div class="flex items-end justify-end pb-0.5 sm:justify-center">
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
          data-kds-ring-instance-remove
          aria-label="删除此项"
        >✕</button>
      </div>
    </div>`;
}

export function renderKdsRingInstanceRulesHtml(): string {
  const rows = readKdsRingInstanceRules();
  const body =
    rows.length > 0
      ? rows.map((r) => renderRingInstanceRuleRow(r)).join("")
      : `<p class="text-sm text-muted-foreground">尚未添加应用实例响铃规则，点击下方「添加项目」。</p>`;
  const instances = readKdsApplicationInstanceCatalog();

  return `
    <div class="mt-3 space-y-3" data-kds-ring-instance-rules-root>
      <div class="space-y-2" data-kds-ring-instance-rules-list>${body}</div>
      <button
        type="button"
        class="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        data-kds-ring-instance-add
      >+ 添加项目</button>
      <p class="text-xs leading-relaxed text-muted-foreground">
        未单独配置的实例继承上方门店默认响铃。应用实例选项来自本店 KDS 设备（当前 ${instances.length} 个）；
        <a href="#${HARDWARE_KDS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">硬件管理中心 · KDS</a>
        可增删设备后刷新本页。
      </p>
    </div>`;
}

function persistRingInstanceRulesFromDom(root: HTMLElement): void {
  const defaultCount = readModuleSettingNumber(KDS_RING_COUNT_FIELD_ID, 2);
  const defaultType = readModuleSettingRadio(KDS_RING_TYPE_FIELD_ID, "bell-1");
  const rows: KdsRingInstanceRule[] = [];
  root.querySelectorAll("[data-kds-ring-instance-row]").forEach((el) => {
    const id = el.getAttribute("data-kds-ring-instance-row") ?? newRowId();
    const instanceId =
      (el.querySelector('[data-kds-ring-instance-field="instanceId"]') as HTMLSelectElement)?.value ?? "";
    const ringCountRaw = Number(
      (el.querySelector('[data-kds-ring-instance-field="ringCount"]') as HTMLInputElement)?.value ??
        defaultCount,
    );
    const ringType =
      (el.querySelector('[data-kds-ring-instance-field="ringType"]') as HTMLSelectElement)?.value ??
      defaultType;
    rows.push({
      id,
      instanceId,
      ringCount: Number.isFinite(ringCountRaw) ? Math.max(0, Math.min(10, ringCountRaw)) : defaultCount,
      ringType,
    });
  });
  writeModuleSettingJson(KDS_RING_INSTANCE_RULES_FIELD_ID, rows);
}

function refreshRingInstanceRulesList(list: HTMLElement): void {
  const rows = readKdsRingInstanceRules();
  list.innerHTML =
    rows.length > 0
      ? rows.map((r) => renderRingInstanceRuleRow(r)).join("")
      : `<p class="text-sm text-muted-foreground">尚未添加应用实例响铃规则，点击下方「添加项目」。</p>`;
}

function bindRingInstanceRuleRowControls(root: HTMLElement | null): void {
  if (!root || root.dataset.kdsRingInstanceRulesBound === "1") return;
  root.dataset.kdsRingInstanceRulesBound = "1";

  root.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-kds-ring-instance-add]")) {
      const rows = readKdsRingInstanceRules();
      rows.push({
        id: newRowId(),
        instanceId: "",
        ringCount: readModuleSettingNumber(KDS_RING_COUNT_FIELD_ID, 2),
        ringType: readModuleSettingRadio(KDS_RING_TYPE_FIELD_ID, "bell-1"),
      });
      writeModuleSettingJson(KDS_RING_INSTANCE_RULES_FIELD_ID, rows);
      const list = root.querySelector("[data-kds-ring-instance-rules-list]") as HTMLElement;
      if (list) refreshRingInstanceRulesList(list);
      return;
    }
    if (t.closest("[data-kds-ring-instance-remove]")) {
      const rowEl = t.closest("[data-kds-ring-instance-row]");
      const id = rowEl?.getAttribute("data-kds-ring-instance-row");
      if (!id) return;
      writeModuleSettingJson(
        KDS_RING_INSTANCE_RULES_FIELD_ID,
        readKdsRingInstanceRules().filter((r) => r.id !== id),
      );
      const list = root.querySelector("[data-kds-ring-instance-rules-list]") as HTMLElement;
      if (list) refreshRingInstanceRulesList(list);
    }
  });

  root.addEventListener("change", () => persistRingInstanceRulesFromDom(root));
  root.addEventListener("input", () => persistRingInstanceRulesFromDom(root));
}

function persistOrderTypeStylesFromDom(root: HTMLElement): void {
  const rows: KdsOrderTypeStyleRow[] = [];
  root.querySelectorAll("[data-kds-order-type-style-row]").forEach((el) => {
    const id = el.getAttribute("data-kds-order-type-style-row") ?? newRowId();
    const orderType =
      (el.querySelector('[data-kds-order-type-style-field="orderType"]') as HTMLSelectElement)?.value ?? "";
    const bgColor =
      (el.querySelector('[data-kds-order-type-style-field="bgColor"]') as HTMLInputElement)?.value ?? "#ffffff";
    const fgColor =
      (el.querySelector('[data-kds-order-type-style-field="fgColor"]') as HTMLInputElement)?.value ?? "#111827";
    if (!orderType) return;
    rows.push({ id, orderType, bgColor, fgColor });
  });
  writeModuleSettingJson(KDS_ORDER_TYPE_STYLES_FIELD_ID, rows);
}

function persistReminderFromDom(root: HTMLElement): void {
  const firstMinutes = Number(
    (root.querySelector('[data-kds-reminder-field="firstMinutes"]') as HTMLInputElement)?.value ?? 8,
  );
  let secondMinutes = Number(
    (root.querySelector('[data-kds-reminder-field="secondMinutes"]') as HTMLInputElement)?.value ?? 18,
  );
  if (secondMinutes < firstMinutes) secondMinutes = firstMinutes;
  const ladder: KdsReminderLadder = {
    firstMinutes: Math.max(1, firstMinutes),
    firstColor:
      (root.querySelector('[data-kds-reminder-field="firstColor"]') as HTMLInputElement)?.value ?? "#f59e0b",
    secondMinutes: Math.max(1, secondMinutes),
    secondColor:
      (root.querySelector('[data-kds-reminder-field="secondColor"]') as HTMLInputElement)?.value ?? "#ef4444",
  };
  writeModuleSettingJson(KDS_REMINDER_FIELD_ID, ladder);
}

function persistStatusPipelineFromDom(root: HTMLElement): void {
  const nodes: KdsStatusNode[] = [];
  root.querySelectorAll("[data-kds-status-node]").forEach((el) => {
    const key = el.getAttribute("data-kds-status-node") ?? "";
    const def = DEFAULT_STATUS_PIPELINE.find((d) => d.key === key);
    if (!def) return;
    nodes.push({
      key,
      systemLabel: def.systemLabel,
      zh: (el.querySelector('[data-kds-status-field="zh"]') as HTMLInputElement)?.value ?? def.zh,
      en: (el.querySelector('[data-kds-status-field="en"]') as HTMLInputElement)?.value ?? def.en,
      bgColor: (el.querySelector('[data-kds-status-field="bgColor"]') as HTMLInputElement)?.value ?? def.bgColor,
    });
  });
  writeModuleSettingJson(KDS_STATUS_PIPELINE_FIELD_ID, nodes);
}

function refreshOrderTypeStylesList(list: HTMLElement): void {
  const rows = readOrderTypeStyles();
  list.innerHTML =
    rows.length > 0
      ? rows.map((r) => renderOrderTypeStyleRow(r)).join("")
      : `<p class="text-sm text-muted-foreground">尚未添加订单类型样式，点击下方按钮添加。</p>`;
  bindOrderTypeStyleRowControls(list.closest("[data-kds-order-type-styles-root]") as HTMLElement);
}

function bindOrderTypeStyleRowControls(root: HTMLElement | null): void {
  if (!root || root.dataset.kdsOrderTypeStylesBound === "1") return;
  root.dataset.kdsOrderTypeStylesBound = "1";

  root.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-kds-order-type-style-add]")) {
      const rows = readOrderTypeStyles();
      rows.push({
        id: newRowId(),
        orderType: "",
        bgColor: "#ffffff",
        fgColor: "#111827",
      });
      writeModuleSettingJson(KDS_ORDER_TYPE_STYLES_FIELD_ID, rows);
      const list = root.querySelector("[data-kds-order-type-styles-list]") as HTMLElement;
      if (list) refreshOrderTypeStylesList(list);
      return;
    }
    if (t.closest("[data-kds-order-type-style-remove]")) {
      const rowEl = t.closest("[data-kds-order-type-style-row]");
      const id = rowEl?.getAttribute("data-kds-order-type-style-row");
      if (!id) return;
      writeModuleSettingJson(
        KDS_ORDER_TYPE_STYLES_FIELD_ID,
        readOrderTypeStyles().filter((r) => r.id !== id),
      );
      const list = root.querySelector("[data-kds-order-type-styles-list]") as HTMLElement;
      if (list) refreshOrderTypeStylesList(list);
    }
  });

  root.addEventListener("change", () => persistOrderTypeStylesFromDom(root));
  root.addEventListener("input", () => persistOrderTypeStylesFromDom(root));
}

export function bindKdsTerminalSettingsControls(root: ParentNode = document): void {
  root.querySelectorAll("[data-kds-order-type-styles-root]").forEach((el) => {
    bindOrderTypeStyleRowControls(el as HTMLElement);
  });

  root.querySelectorAll("[data-kds-reminder-ladder-root]").forEach((el) => {
    const host = el as HTMLElement;
    if (host.dataset.kdsReminderBound === "1") return;
    host.dataset.kdsReminderBound = "1";
    const persist = () => persistReminderFromDom(host);
    host.addEventListener("change", persist);
    host.addEventListener("input", persist);
  });

  root.querySelectorAll("[data-kds-status-pipeline-root]").forEach((el) => {
    const host = el as HTMLElement;
    if (host.dataset.kdsStatusBound === "1") return;
    host.dataset.kdsStatusBound = "1";
    const persist = () => persistStatusPipelineFromDom(host);
    host.addEventListener("change", persist);
    host.addEventListener("input", persist);
  });

  root.querySelectorAll("[data-kds-flow-map-root]").forEach((el) => {
    const host = el as HTMLElement;
    if (host.dataset.kdsFlowBound === "1") return;
    host.dataset.kdsFlowBound = "1";
    host.querySelectorAll("[data-module-setting-select]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const field = (sel as HTMLElement).getAttribute("data-module-setting-select");
        if (field) writeModuleSettingRadio(field, (sel as HTMLSelectElement).value);
      });
    });
    const rdsClick = host.querySelector("[data-kds-flow-rds-click]") as HTMLInputElement | null;
    rdsClick?.addEventListener("change", () => {
      writeModuleSettingRadio(KDS_FLOW_RDS_CLICK_FIELD_ID, rdsClick.checked ? "1" : "0");
    });
  });

  root.querySelectorAll("[data-kds-partial-flow-controls]").forEach((el) => {
    const host = el as HTMLElement;
    host.querySelectorAll("[data-module-setting-select]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const field = (sel as HTMLElement).getAttribute("data-module-setting-select");
        if (field) writeModuleSettingRadio(field, (sel as HTMLSelectElement).value);
      });
    });
  });

  root.querySelectorAll("[data-kds-ring-default-root]").forEach((el) => {
    const host = el as HTMLElement;
    if (host.dataset.kdsRingBound === "1") return;
    host.dataset.kdsRingBound = "1";
    host.querySelectorAll("[data-module-setting-select]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const field = (sel as HTMLElement).getAttribute("data-module-setting-select");
        if (field) writeModuleSettingRadio(field, (sel as HTMLSelectElement).value);
      });
    });
  });

  root.querySelectorAll("[data-kds-theme-color-controls] input[type=color]").forEach((el) => {
    el.addEventListener("change", () => {
      writeModuleSettingColor(KDS_THEME_COLOR_FIELD_ID, (el as HTMLInputElement).value);
      const label = el.parentElement?.querySelector(".tabular-nums");
      if (label) label.textContent = (el as HTMLInputElement).value;
    });
  });

  root.querySelectorAll("[data-kds-ring-instance-rules-root]").forEach((el) => {
    bindRingInstanceRuleRowControls(el as HTMLElement);
  });

  setKdsPartialFlowSelectEnabled(readModuleSettingToggleOn(KDS_PARTIAL_COMPLETE_HOST_SEQ), root);
  setKdsSubitemDisableMainClickVisible(readModuleSettingToggleOn(KDS_SUBITEM_FLOW_HOST_SEQ), root);
}
