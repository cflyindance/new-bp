/**
 * 订单 · 折扣与加收：seq 446 折扣预设、447 加收预设（名称 + 类型 + 百分比/固定金额）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";

export const ORDER_DISCOUNT_PRESET_SEQ = 446;
export const ORDER_SURCHARGE_PRESET_SEQ = 447;

export type RatePresetKind = "percent" | "fixed";
export type SurchargeFeeType =
  | "service"
  | "delivery"
  | "utensils"
  | "packaging-bag"
  | "packaging-box"
  | "other";

export type RatePresetItem = {
  id: string;
  name: string;
  kind: RatePresetKind;
  value: number;
  surcharge?: SurchargePresetExtra;
};

export type SurchargePresetExtra = {
  feeType: SurchargeFeeType;
  feeTypeLabel: string;
  minGuests: number;
  minDistance: number;
  minAmount: number;
  description: string;
  applyMode: "auto" | "manual";
  taxable: boolean;
  asTip: boolean;
  enabled: boolean;
  orderTypes: string[];
};

const PRESET_SEQ = new Set([ORDER_DISCOUNT_PRESET_SEQ, ORDER_SURCHARGE_PRESET_SEQ]);

const STORAGE_BY_SEQ: Record<number, string> = {
  [ORDER_DISCOUNT_PRESET_SEQ]: "446-discount-presets",
  [ORDER_SURCHARGE_PRESET_SEQ]: "447-surcharge-presets",
};

const CONFIG_BY_SEQ: Record<
  number,
  { addLabel: string; nameHeader: string; namePlaceholder: string }
> = {
  [ORDER_DISCOUNT_PRESET_SEQ]: {
    addLabel: "新增折扣",
    nameHeader: "折扣名称",
    namePlaceholder: "请输入折扣名称",
  },
  [ORDER_SURCHARGE_PRESET_SEQ]: {
    addLabel: "新增加收",
    nameHeader: "加收名称",
    namePlaceholder: "请输入加收名称",
  },
};

const INPUT_CLASS =
  "h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TEXTAREA_CLASS =
  "min-h-[84px] w-full min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SURCHARGE_DIALOG_ORDER_TYPES: { id: string; label: string }[] = [
  { id: "dine-in", label: "Dine In" },
  { id: "to-go", label: "To Go" },
  { id: "delivery", label: "Delivery" },
  { id: "pick-up", label: "Pick Up" },
  { id: "ktv5554", label: "KTV5554" },
  { id: "hu", label: "HU" },
  { id: "custom-order-type-1", label: "Custom Order Type 1" },
  { id: "custom-order-type-4", label: "Custom Order Type 4" },
  { id: "online-to-go", label: "Online To Go" },
];

const SURCHARGE_FEE_TYPES: { value: SurchargeFeeType; label: string }[] = [
  { value: "service", label: "服务费" },
  { value: "delivery", label: "送餐费" },
  { value: "utensils", label: "餐具" },
  { value: "packaging-bag", label: "打包袋" },
  { value: "packaging-box", label: "包装盒" },
  { value: "other", label: "其他" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newPresetId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function storageFieldId(seq: number): string {
  return STORAGE_BY_SEQ[seq] ?? `${seq}-rate-presets`;
}

function surchargeFeeTypeLabel(type: SurchargeFeeType): string {
  return SURCHARGE_FEE_TYPES.find((item) => item.value === type)?.label ?? "服务费";
}

function parseSurchargeFeeType(raw: unknown): SurchargeFeeType {
  if (
    raw === "service" ||
    raw === "delivery" ||
    raw === "utensils" ||
    raw === "packaging-bag" ||
    raw === "packaging-box" ||
    raw === "other"
  ) {
    return raw;
  }
  if (typeof raw === "string") {
    const text = raw.trim().toLowerCase();
    if (text.includes("餐具") || text.includes("utensil")) return "utensils";
    if (text.includes("包装盒") || text.includes("packaging-box")) return "packaging-box";
    if (text.includes("打包袋") || text.includes("打包带")) return "packaging-bag";
    if (text.includes("送餐") || text.includes("delivery")) return "delivery";
    if (text.includes("其他") || text.includes("other")) return "other";
  }
  return "service";
}

function defaultSurchargeExtra(): SurchargePresetExtra {
  return {
    feeType: "service",
    feeTypeLabel: "服务费",
    minGuests: 0,
    minDistance: 0,
    minAmount: 0,
    description: "",
    applyMode: "auto",
    taxable: false,
    asTip: false,
    enabled: true,
    orderTypes: ["dine-in"],
  };
}

function normalizeSurchargeExtra(raw: Partial<SurchargePresetExtra> | undefined): SurchargePresetExtra {
  const defaults = defaultSurchargeExtra();
  const feeType = parseSurchargeFeeType(raw?.feeType ?? raw?.feeTypeLabel);
  const minGuests = Number(raw?.minGuests);
  const minDistance = Number(raw?.minDistance);
  const minAmount = Number(raw?.minAmount);
  const orderTypes = Array.isArray(raw?.orderTypes)
    ? raw.orderTypes
        .filter((it): it is string => typeof it === "string" && it.trim().length > 0)
        .map((it) => it.trim())
    : defaults.orderTypes;
  return {
    feeType,
    feeTypeLabel: surchargeFeeTypeLabel(feeType),
    minGuests: Number.isFinite(minGuests) ? Math.max(0, Math.round(minGuests)) : defaults.minGuests,
    minDistance: Number.isFinite(minDistance) ? Math.max(0, minDistance) : defaults.minDistance,
    minAmount: Number.isFinite(minAmount) ? Math.max(0, minAmount) : defaults.minAmount,
    description: typeof raw?.description === "string" ? raw.description.slice(0, 100) : defaults.description,
    applyMode: raw?.applyMode === "manual" ? "manual" : "auto",
    taxable: raw?.taxable === true,
    asTip: raw?.asTip === true,
    enabled: raw?.enabled !== false,
    orderTypes: orderTypes.length ? [...new Set(orderTypes)] : defaults.orderTypes,
  };
}

function normalizePreset(raw: Partial<RatePresetItem>, seq?: number): RatePresetItem {
  const kind: RatePresetKind = raw.kind === "fixed" ? "fixed" : "percent";
  const value = Number(raw.value);
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const clamped =
    kind === "percent" ? Math.min(100, safeValue) : safeValue;
  const normalized: RatePresetItem = {
    id: typeof raw.id === "string" && raw.id ? raw.id : newPresetId(),
    name: typeof raw.name === "string" ? raw.name : "",
    kind,
    value: clamped,
  };
  if (seq === ORDER_SURCHARGE_PRESET_SEQ) {
    normalized.surcharge = normalizeSurchargeExtra(raw.surcharge);
  }
  return normalized;
}

export function readRatePresets(seq: number): RatePresetItem[] {
  const fieldId = storageFieldId(seq);
  const raw = readModuleSettingJson<Partial<RatePresetItem>[]>(fieldId, []);
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizePreset(item, seq));
}

export function writeRatePresets(seq: number, items: RatePresetItem[]): void {
  writeModuleSettingJson(
    storageFieldId(seq),
    items.map((item) => normalizePreset(item, seq)),
  );
}

export function isDiscountSurchargePresetSeq(seq: number): boolean {
  return PRESET_SEQ.has(seq);
}

function valueSuffix(kind: RatePresetKind): string {
  return kind === "fixed" ? "元" : "%";
}

function renderPresetKindRadios(item: RatePresetItem): string {
  const groupName = `rate-preset-kind-${escapeHtml(item.id)}`;
  const kinds: { value: RatePresetKind; label: string }[] = [
    { value: "percent", label: "百分比" },
    { value: "fixed", label: "固定金额" },
  ];
  return kinds
    .map((k) => {
      const checked = item.kind === k.value;
      return `
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${groupName}"
            value="${k.value}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-rate-preset-kind
            aria-label="${escapeHtml(k.label)}"
          />
          <span>${escapeHtml(k.label)}</span>
        </label>`;
    })
    .join("");
}

function renderPresetRow(seq: number, item: RatePresetItem, namePlaceholder: string): string {
  if (seq === ORDER_SURCHARGE_PRESET_SEQ) {
    const kindLabel = item.kind === "percent" ? "百分比" : "固定金额";
    const valueLabel = item.kind === "percent" ? `${item.value}%` : `${item.value} 元`;
    const feeTypeLabel = item.surcharge?.feeTypeLabel ?? surchargeFeeTypeLabel("service");
    const enabled = item.surcharge?.enabled !== false;
    return `
    <tr class="border-t border-border" data-rate-preset-row data-preset-id="${escapeHtml(item.id)}">
      <td class="px-3 py-2.5">
        <span class="text-sm text-foreground">${escapeHtml(item.name || "未命名加收")}</span>
      </td>
      <td class="px-3 py-2.5">
        <span class="text-sm text-muted-foreground">${escapeHtml(feeTypeLabel)}</span>
      </td>
      <td class="px-3 py-2.5">
        <span class="text-sm text-muted-foreground">${escapeHtml(kindLabel)}</span>
      </td>
      <td class="px-3 py-2.5">
        <span class="text-sm tabular-nums text-foreground">${escapeHtml(valueLabel)}</span>
      </td>
      <td class="px-3 py-2.5 text-right whitespace-nowrap">
        <div class="inline-flex items-center gap-2">
          <button
            type="button"
            class="rounded border border-border px-2 py-1 text-xs ${enabled ? "text-emerald-600 hover:bg-emerald-50" : "text-muted-foreground hover:bg-muted"}"
            data-surcharge-row-toggle-enabled
          >${enabled ? "已启用" : "已停用"}</button>
          <button
            type="button"
            class="text-xs font-medium text-foreground hover:underline"
            data-surcharge-row-edit
          >编辑</button>
          <button
            type="button"
            class="text-xs font-medium text-destructive hover:underline"
            data-rate-preset-remove
          >删除</button>
        </div>
      </td>
    </tr>`;
  }
  const suffix = valueSuffix(item.kind);
  const maxAttr = item.kind === "percent" ? ' max="100"' : "";
  return `
    <tr class="border-t border-border" data-rate-preset-row data-preset-id="${escapeHtml(item.id)}">
      <td class="px-3 py-2.5">
        <input
          type="text"
          class="${INPUT_CLASS}"
          value="${escapeHtml(item.name)}"
          placeholder="${escapeHtml(namePlaceholder)}"
          data-rate-preset-name
        />
      </td>
      <td class="px-3 py-2.5">
        <div class="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3" role="radiogroup" aria-label="比例类型">
          ${renderPresetKindRadios(item)}
        </div>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex items-center gap-1.5">
          <input
            type="number"
            inputmode="decimal"
            class="${INPUT_CLASS} max-w-[8rem] tabular-nums"
            value="${escapeHtml(String(item.value))}"
            min="0"
            step="0.01"${maxAttr}
            data-rate-preset-value
            aria-label="比例数值"
          />
          <span class="shrink-0 text-sm text-muted-foreground" data-rate-preset-suffix>${escapeHtml(suffix)}</span>
        </div>
      </td>
      <td class="px-3 py-2.5 text-right whitespace-nowrap">
        <button
          type="button"
          class="text-sm font-medium text-destructive hover:underline"
          data-rate-preset-remove
        >删除</button>
      </td>
    </tr>`;
}

/** 有数据时才渲染表头与行（无数据时不展示空状态表格） */
function renderPresetTableInner(seq: number, items: RatePresetItem[]): string {
  const cfg = CONFIG_BY_SEQ[seq];
  if (!cfg || items.length === 0) return "";
  const operationColClass = seq === ORDER_SURCHARGE_PRESET_SEQ ? "w-[16rem]" : "w-[4.5rem]";
  const surchargeTypeHeader =
    seq === ORDER_SURCHARGE_PRESET_SEQ
      ? `<th class="px-3 py-2 font-medium w-[6.5rem]">类型</th>`
      : "";
  const rows = items
    .map((item) => renderPresetRow(seq, item, cfg.namePlaceholder))
    .join("");

  return `
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">${escapeHtml(cfg.nameHeader)}</th>
            ${surchargeTypeHeader}
            <th class="px-3 py-2 font-medium w-[8.5rem]">比例类型</th>
            <th class="px-3 py-2 font-medium w-[10rem]">比例</th>
            <th class="px-3 py-2 text-right font-medium ${operationColClass}">操作</th>
          </tr>
        </thead>
        <tbody data-rate-preset-list>${rows}</tbody>
      </table>
    </div>`;
}

function renderPresetTableWrap(seq: number, items: RatePresetItem[]): string {
  const visible = items.length > 0;
  const inner = visible ? renderPresetTableInner(seq, items) : "";
  return `
    <div
      data-rate-preset-table-wrap
      class="${visible ? "" : "hidden"}"
      ${visible ? "" : 'aria-hidden="true"'}
    >${inner}</div>`;
}

function renderSurchargeCreateDialog(): string {
  const orderTypeOptions = SURCHARGE_DIALOG_ORDER_TYPES.map(
    (item) => `
      <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
        <input type="checkbox" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" value="${escapeHtml(item.id)}" data-surcharge-dialog-order-type ${item.id === "dine-in" ? "checked" : ""}/>
        <span>${escapeHtml(item.label)}</span>
      </label>`,
  ).join("");
  const feeTypeOptions = SURCHARGE_FEE_TYPES.map(
    (item, index) => `
      <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
        <input
          type="radio"
          name="surcharge-dialog-fee-type"
          value="${item.value}"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
          data-surcharge-dialog-fee-type
          ${index === 0 ? "checked" : ""}
        />
        <span>${escapeHtml(item.label)}</span>
      </label>`,
  ).join("");

  return `
    <div class="fixed inset-0 z-[10040] hidden items-start justify-center overflow-y-auto p-4 sm:items-center" data-surcharge-create-dialog aria-hidden="true">
      <button type="button" class="absolute inset-0 bg-black/45" data-surcharge-dialog-close aria-label="关闭"></button>
      <div class="relative z-10 my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="surcharge-create-dialog-title">
        <div class="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h3 id="surcharge-create-dialog-title" class="text-base font-semibold text-foreground" data-surcharge-dialog-title>新增加收</h3>
          <button type="button" class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" data-surcharge-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4">
          <div class="space-y-4">
          <div class="grid grid-cols-1 gap-3">
            <label class="space-y-1.5">
              <span class="text-sm text-foreground">名称</span>
              <input class="${INPUT_CLASS}" type="text" maxlength="50" placeholder="不能为空" data-surcharge-dialog-name />
            </label>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">金额类型</span>
            <div class="flex flex-wrap items-center gap-4">
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-kind" value="fixed" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" checked data-surcharge-dialog-kind />
                <span>$ 金额</span>
              </label>
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-kind" value="percent" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" data-surcharge-dialog-kind />
                <span>% 百分比</span>
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground" data-surcharge-dialog-value-label>金额（固定）</span>
            <div class="flex items-center gap-2">
              <input
                class="${INPUT_CLASS} max-w-[16rem]"
                type="number"
                min="0"
                max="10000"
                step="0.001"
                placeholder="在 0 到 10000 之间，最多三位小数"
                data-surcharge-dialog-value
              />
              <span class="text-sm text-muted-foreground" data-surcharge-dialog-value-suffix>元</span>
            </div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">类型</span>
            <div class="flex flex-wrap items-center gap-4">${feeTypeOptions}</div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">最低消费金额</span>
            <input class="${INPUT_CLASS}" type="number" min="0" max="10000000" step="0.01" placeholder="在 0 到 10000000 之间，最多两位小数" data-surcharge-dialog-min-amount />
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="space-y-1.5" data-surcharge-field-group="service">
              <span class="text-sm text-foreground">最低用餐人数</span>
              <input class="${INPUT_CLASS}" type="number" min="0" max="1000" step="1" placeholder="在 0 到 1000 之间，是一个整数" data-surcharge-dialog-min-guests />
            </label>
            <label class="hidden space-y-1.5" data-surcharge-field-group="delivery">
              <span class="text-sm text-foreground">最低里程</span>
              <input class="${INPUT_CLASS}" type="number" min="0" max="1000" step="0.1" placeholder="在 0 到 1000 之间，最多一位小数" data-surcharge-dialog-min-distance />
            </label>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">描述</span>
            <textarea class="${TEXTAREA_CLASS}" maxlength="100" placeholder="最长100个字符" data-surcharge-dialog-description></textarea>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">应用</span>
            <div class="flex items-center gap-4">
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-apply-mode" value="auto" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" checked data-surcharge-dialog-apply-mode />
                <span>自动加收</span>
              </label>
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-apply-mode" value="manual" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" data-surcharge-dialog-apply-mode />
                <span>手动加收</span>
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">计税</span>
            <div class="flex items-center gap-4">
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-taxable" value="yes" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" data-surcharge-dialog-taxable />
                <span>是</span>
              </label>
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-taxable" value="no" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" checked data-surcharge-dialog-taxable />
                <span>否</span>
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">记作小费</span>
            <div class="flex items-center gap-4">
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground" data-surcharge-dialog-tip-option="yes">
                <input type="radio" name="surcharge-dialog-tip" value="yes" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" data-surcharge-dialog-tip />
                <span>是</span>
              </label>
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground" data-surcharge-dialog-tip-option="no">
                <input type="radio" name="surcharge-dialog-tip" value="no" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" checked data-surcharge-dialog-tip />
                <span>否</span>
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-sm text-foreground">状态</div>
            <div>
              <label class="inline-flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" checked data-surcharge-dialog-enabled />
                <span>是否生效</span>
              </label>
            </div>
          </div>
            <fieldset class="space-y-2">
              <legend class="text-sm text-foreground">订单类型</legend>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">${orderTypeOptions}</div>
            </fieldset>
          </div>
        </div>
        <div class="sticky bottom-0 z-20 flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted" data-surcharge-dialog-cancel>取消</button>
          <button type="button" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" data-surcharge-dialog-save>保存</button>
        </div>
      </div>
    </div>`;
}

export function renderDiscountSurchargePresetEditorHtml(seq: number): string {
  const cfg = CONFIG_BY_SEQ[seq];
  if (!cfg) return "";
  const items = readRatePresets(seq);
  const surchargeDialog = seq === ORDER_SURCHARGE_PRESET_SEQ ? renderSurchargeCreateDialog() : "";
  return `
    <div
      class="space-y-3"
      data-rate-preset-editor
      data-preset-seq="${seq}"
      data-storage-id="${escapeHtml(storageFieldId(seq))}"
    >
      ${renderPresetTableWrap(seq, items)}
      <div class="flex justify-start">
        <button
          type="button"
          class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
          data-rate-preset-add
        >${escapeHtml(cfg.addLabel)}</button>
      </div>
      ${surchargeDialog}
    </div>`;
}

function readRowKind(row: HTMLElement): RatePresetKind {
  const checked = row.querySelector<HTMLInputElement>("[data-rate-preset-kind]:checked");
  return checked?.value === "fixed" ? "fixed" : "percent";
}

function syncRowKindUi(row: HTMLElement): void {
  const kind = readRowKind(row);
  const suffix = row.querySelector("[data-rate-preset-suffix]");
  if (suffix) suffix.textContent = valueSuffix(kind);
  const valueInput = row.querySelector<HTMLInputElement>("[data-rate-preset-value]");
  if (!valueInput) return;
  if (kind === "percent") {
    valueInput.setAttribute("max", "100");
    const n = Number(valueInput.value);
    if (Number.isFinite(n) && n > 100) valueInput.value = "100";
  } else {
    valueInput.removeAttribute("max");
  }
}

function collectPresetsFromEditor(editor: HTMLElement): RatePresetItem[] {
  const items: RatePresetItem[] = [];
  editor.querySelectorAll<HTMLElement>("[data-rate-preset-row]").forEach((row) => {
    const id = row.getAttribute("data-preset-id") ?? newPresetId();
    const name =
      row.querySelector<HTMLInputElement>("[data-rate-preset-name]")?.value.trim() ?? "";
    const kind = readRowKind(row);
    const value = Number(row.querySelector<HTMLInputElement>("[data-rate-preset-value]")?.value);
    items.push(
      normalizePreset({
        id,
        name,
        kind,
        value: Number.isFinite(value) ? value : 0,
      }),
    );
  });
  return items;
}

function persistEditor(editor: HTMLElement): void {
  const seq = Number(editor.getAttribute("data-preset-seq"));
  if (!PRESET_SEQ.has(seq)) return;
  writeRatePresets(seq, collectPresetsFromEditor(editor));
}

function rerenderEditor(editor: HTMLElement): void {
  const seq = Number(editor.getAttribute("data-preset-seq"));
  if (!PRESET_SEQ.has(seq)) return;
  const items = readRatePresets(seq);
  const wrap = editor.querySelector<HTMLElement>("[data-rate-preset-table-wrap]");
  if (!wrap) return;

  if (items.length === 0) {
    wrap.innerHTML = "";
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
    return;
  }

  wrap.innerHTML = renderPresetTableInner(seq, items);
  wrap.classList.remove("hidden");
  wrap.removeAttribute("aria-hidden");
  wrap.querySelectorAll<HTMLElement>("[data-rate-preset-row]").forEach(syncRowKindUi);
}

function appendPreset(editor: HTMLElement): void {
  const seq = Number(editor.getAttribute("data-preset-seq"));
  if (!PRESET_SEQ.has(seq)) return;
  const items = readRatePresets(seq);
  items.push({
    id: newPresetId(),
    name: "",
    kind: "percent",
    value: 10,
  });
  writeRatePresets(seq, items);
  rerenderEditor(editor);
  const rows = editor.querySelectorAll("[data-rate-preset-row]");
  const last = rows[rows.length - 1];
  last?.querySelector<HTMLInputElement>("[data-rate-preset-name]")?.focus();
}

function setSurchargeDialogMode(editor: HTMLElement, mode: "create" | "edit", editId = ""): void {
  const dialog = editor.querySelector<HTMLElement>("[data-surcharge-create-dialog]");
  if (!dialog) return;
  dialog.dataset.dialogMode = mode;
  dialog.dataset.editPresetId = editId;
  const title = dialog.querySelector<HTMLElement>("[data-surcharge-dialog-title]");
  if (title) title.textContent = mode === "edit" ? "编辑加收" : "新增加收";
  const saveBtn = dialog.querySelector<HTMLElement>("[data-surcharge-dialog-save]");
  if (saveBtn) saveBtn.textContent = mode === "edit" ? "保存修改" : "保存";
}

function openSurchargeDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-surcharge-create-dialog]");
  if (!dialog) return;
  const setInputValue = (selector: string, value: string) => {
    const el = dialog.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (el) el.value = value;
  };
  const setChecked = (selector: string, checked: boolean) => {
    const el = dialog.querySelector<HTMLInputElement>(selector);
    if (el) el.checked = checked;
  };
  setInputValue("[data-surcharge-dialog-name]", "");
  setChecked('[data-surcharge-dialog-fee-type][value="service"]', true);
  setChecked('[data-surcharge-dialog-fee-type][value="delivery"]', false);
  setChecked('[data-surcharge-dialog-fee-type][value="other"]', false);
  setChecked('[data-surcharge-dialog-kind][value="fixed"]', true);
  setChecked('[data-surcharge-dialog-kind][value="percent"]', false);
  setInputValue("[data-surcharge-dialog-value]", "");
  setInputValue("[data-surcharge-dialog-min-guests]", "");
  setInputValue("[data-surcharge-dialog-min-distance]", "");
  setInputValue("[data-surcharge-dialog-min-amount]", "");
  setInputValue("[data-surcharge-dialog-description]", "");
  setChecked('[data-surcharge-dialog-apply-mode][value="auto"]', true);
  setChecked('[data-surcharge-dialog-apply-mode][value="manual"]', false);
  setChecked('[data-surcharge-dialog-taxable][value="no"]', true);
  setChecked('[data-surcharge-dialog-taxable][value="yes"]', false);
  setChecked('[data-surcharge-dialog-tip][value="no"]', true);
  setChecked('[data-surcharge-dialog-tip][value="yes"]', false);
  setChecked("[data-surcharge-dialog-enabled]", true);
  dialog.querySelectorAll<HTMLInputElement>("[data-surcharge-dialog-order-type]").forEach((el) => {
    el.checked = el.value === "dine-in";
  });
  setSurchargeDialogMode(editor, "create");
  syncSurchargeDialogKindUi(editor);
  syncSurchargeTaxableTipUi(editor);
  syncSurchargeDialogFeeTypeUi(editor);
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  dialog.setAttribute("aria-hidden", "false");
  dialog.querySelector<HTMLInputElement>("[data-surcharge-dialog-name]")?.focus();
}

function closeSurchargeDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-surcharge-create-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("aria-hidden", "true");
  setSurchargeDialogMode(editor, "create");
}

function readCheckedRadioValue(editor: HTMLElement, selector: string, defaultValue: string): string {
  return editor.querySelector<HTMLInputElement>(`${selector}:checked`)?.value ?? defaultValue;
}

function readSurchargeDialogFeeType(editor: HTMLElement): SurchargeFeeType {
  return parseSurchargeFeeType(readCheckedRadioValue(editor, "[data-surcharge-dialog-fee-type]", "service"));
}

function syncSurchargeDialogKindUi(editor: HTMLElement): void {
  const kind = readCheckedRadioValue(editor, "[data-surcharge-dialog-kind]", "fixed");
  const isPercent = kind === "percent";
  const label = editor.querySelector<HTMLElement>("[data-surcharge-dialog-value-label]");
  if (label) label.textContent = isPercent ? "金额（百分比）" : "金额（固定）";
  const suffix = editor.querySelector<HTMLElement>("[data-surcharge-dialog-value-suffix]");
  if (suffix) suffix.textContent = isPercent ? "%" : "元";

  const input = editor.querySelector<HTMLInputElement>("[data-surcharge-dialog-value]");
  if (!input) return;
  if (isPercent) {
    input.step = "0.01";
    input.max = "100";
    input.placeholder = "在 0 到 100 之间，最多两位小数";
    const n = Number(input.value);
    if (Number.isFinite(n) && n > 100) input.value = "100";
  } else {
    input.step = "0.001";
    input.max = "10000";
    input.placeholder = "在 0 到 10000 之间，最多三位小数";
  }
}

function syncSurchargeTaxableTipUi(editor: HTMLElement): void {
  const taxable = readCheckedRadioValue(editor, "[data-surcharge-dialog-taxable]", "no") === "yes";
  const tipYesWrap = editor.querySelector<HTMLElement>('[data-surcharge-dialog-tip-option="yes"]');
  const tipNoWrap = editor.querySelector<HTMLElement>('[data-surcharge-dialog-tip-option="no"]');
  const tipNoInput = editor.querySelector<HTMLInputElement>('[data-surcharge-dialog-tip][value="no"]');
  const tipYesInput = editor.querySelector<HTMLInputElement>('[data-surcharge-dialog-tip][value="yes"]');
  if (!tipNoInput) return;

  if (taxable) {
    if (tipYesWrap) {
      tipYesWrap.classList.add("hidden");
      tipYesWrap.setAttribute("aria-hidden", "true");
    }
    if (tipYesInput) {
      tipYesInput.checked = false;
      tipYesInput.disabled = true;
    }
    if (tipNoWrap) tipNoWrap.classList.add("opacity-100");
    tipNoInput.disabled = false;
    tipNoInput.checked = true;
  } else if (tipYesWrap) {
    tipYesWrap.classList.remove("hidden");
    tipYesWrap.setAttribute("aria-hidden", "false");
    if (tipYesInput) tipYesInput.disabled = false;
    tipNoInput.disabled = false;
  }
}

function syncSurchargeDialogFeeTypeUi(editor: HTMLElement): void {
  const feeType = readSurchargeDialogFeeType(editor);
  editor.querySelectorAll<HTMLElement>("[data-surcharge-field-group]").forEach((el) => {
    const type = el.getAttribute("data-surcharge-field-group");
    const visible = type === feeType;
    el.classList.toggle("hidden", !visible);
    el.setAttribute("aria-hidden", visible ? "false" : "true");
  });
}

function readCheckedOrderTypes(editor: HTMLElement): string[] {
  const values: string[] = [];
  editor.querySelectorAll<HTMLInputElement>("[data-surcharge-dialog-order-type]:checked").forEach((el) => {
    if (el.value.trim()) values.push(el.value.trim());
  });
  return values.length ? values : ["dine-in"];
}

function openSurchargeEditDialog(editor: HTMLElement, presetId: string): void {
  const seq = Number(editor.getAttribute("data-preset-seq"));
  if (seq !== ORDER_SURCHARGE_PRESET_SEQ) return;
  const dialog = editor.querySelector<HTMLElement>("[data-surcharge-create-dialog]");
  if (!dialog) return;
  const preset = readRatePresets(seq).find((item) => item.id === presetId);
  if (!preset) return;
  const extra = normalizeSurchargeExtra(preset.surcharge);

  const setInputValue = (selector: string, value: string) => {
    const el = dialog.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (el) el.value = value;
  };
  const setChecked = (selector: string, checked: boolean) => {
    const el = dialog.querySelector<HTMLInputElement>(selector);
    if (el) el.checked = checked;
  };

  setInputValue("[data-surcharge-dialog-name]", preset.name);
  for (const item of SURCHARGE_FEE_TYPES) {
    setChecked(
      `[data-surcharge-dialog-fee-type][value="${item.value}"]`,
      extra.feeType === item.value,
    );
  }
  setChecked('[data-surcharge-dialog-kind][value="fixed"]', preset.kind === "fixed");
  setChecked('[data-surcharge-dialog-kind][value="percent"]', preset.kind === "percent");
  setInputValue("[data-surcharge-dialog-value]", String(preset.value));
  setInputValue("[data-surcharge-dialog-min-guests]", String(extra.minGuests));
  setInputValue("[data-surcharge-dialog-min-distance]", String(extra.minDistance));
  setInputValue("[data-surcharge-dialog-min-amount]", String(extra.minAmount));
  setInputValue("[data-surcharge-dialog-description]", extra.description);
  setChecked('[data-surcharge-dialog-apply-mode][value="auto"]', extra.applyMode === "auto");
  setChecked('[data-surcharge-dialog-apply-mode][value="manual"]', extra.applyMode === "manual");
  setChecked('[data-surcharge-dialog-taxable][value="yes"]', extra.taxable);
  setChecked('[data-surcharge-dialog-taxable][value="no"]', !extra.taxable);
  setChecked('[data-surcharge-dialog-tip][value="yes"]', extra.asTip);
  setChecked('[data-surcharge-dialog-tip][value="no"]', !extra.asTip);
  setChecked("[data-surcharge-dialog-enabled]", extra.enabled);
  dialog.querySelectorAll<HTMLInputElement>("[data-surcharge-dialog-order-type]").forEach((el) => {
    el.checked = extra.orderTypes.includes(el.value);
  });

  setSurchargeDialogMode(editor, "edit", presetId);
  syncSurchargeDialogKindUi(editor);
  syncSurchargeTaxableTipUi(editor);
  syncSurchargeDialogFeeTypeUi(editor);
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  dialog.setAttribute("aria-hidden", "false");
}

function toggleSurchargeEnabled(editor: HTMLElement, presetId: string): void {
  const seq = Number(editor.getAttribute("data-preset-seq"));
  if (seq !== ORDER_SURCHARGE_PRESET_SEQ) return;
  const items = readRatePresets(seq);
  const next = items.map((item) => {
    if (item.id !== presetId) return item;
    const extra = normalizeSurchargeExtra(item.surcharge);
    return {
      ...item,
      surcharge: {
        ...extra,
        enabled: !extra.enabled,
      },
    };
  });
  writeRatePresets(seq, next);
  rerenderEditor(editor);
}

function addSurchargeFromDialog(editor: HTMLElement): void {
  const seq = Number(editor.getAttribute("data-preset-seq"));
  if (seq !== ORDER_SURCHARGE_PRESET_SEQ) return;
  const name = editor.querySelector<HTMLInputElement>("[data-surcharge-dialog-name]")?.value.trim() ?? "";
  if (!name) {
    alert("请输入加收名称");
    editor.querySelector<HTMLInputElement>("[data-surcharge-dialog-name]")?.focus();
    return;
  }

  const kindValue = readCheckedRadioValue(editor, "[data-surcharge-dialog-kind]", "fixed");
  const kind: RatePresetKind = kindValue === "percent" ? "percent" : "fixed";
  const valueRaw = Number(editor.querySelector<HTMLInputElement>("[data-surcharge-dialog-value]")?.value);
  const value = Number.isFinite(valueRaw) ? valueRaw : 0;

  const minGuestsRaw = Number(editor.querySelector<HTMLInputElement>("[data-surcharge-dialog-min-guests]")?.value);
  const minDistanceRaw = Number(editor.querySelector<HTMLInputElement>("[data-surcharge-dialog-min-distance]")?.value);
  const minAmountRaw = Number(editor.querySelector<HTMLInputElement>("[data-surcharge-dialog-min-amount]")?.value);
  const feeType = readSurchargeDialogFeeType(editor);
  const feeTypeLabel = surchargeFeeTypeLabel(feeType);
  const description = editor.querySelector<HTMLTextAreaElement>("[data-surcharge-dialog-description]")?.value ?? "";
  const applyMode =
    readCheckedRadioValue(editor, "[data-surcharge-dialog-apply-mode]", "auto") === "manual" ? "manual" : "auto";
  const taxable = readCheckedRadioValue(editor, "[data-surcharge-dialog-taxable]", "no") === "yes";
  const asTip = taxable ? false : readCheckedRadioValue(editor, "[data-surcharge-dialog-tip]", "no") === "yes";
  const enabled = editor.querySelector<HTMLInputElement>("[data-surcharge-dialog-enabled]")?.checked !== false;

  const dialog = editor.querySelector<HTMLElement>("[data-surcharge-create-dialog]");
  const editId = dialog?.dataset.dialogMode === "edit" ? dialog.dataset.editPresetId ?? "" : "";
  const nextPreset = normalizePreset(
    {
      id: editId || newPresetId(),
      name,
      kind,
      value,
      surcharge: {
        feeType,
        feeTypeLabel,
        minGuests: feeType === "service" && Number.isFinite(minGuestsRaw) ? minGuestsRaw : 0,
        minDistance: feeType === "delivery" && Number.isFinite(minDistanceRaw) ? minDistanceRaw : 0,
        minAmount: Number.isFinite(minAmountRaw) ? minAmountRaw : 0,
        description,
        applyMode,
        taxable,
        asTip,
        enabled,
        orderTypes: readCheckedOrderTypes(editor),
      },
    },
    seq,
  );

  const items = readRatePresets(seq);
  const nextItems = editId
    ? items.map((item) => (item.id === editId ? nextPreset : item))
    : [...items, nextPreset];
  writeRatePresets(seq, nextItems);
  rerenderEditor(editor);
  closeSurchargeDialog(editor);
}

function removePreset(editor: HTMLElement, row: HTMLElement): void {
  const seq = Number(editor.getAttribute("data-preset-seq"));
  if (!PRESET_SEQ.has(seq)) return;
  const presetId = row.getAttribute("data-preset-id");
  const items = readRatePresets(seq).filter((item) => item.id !== presetId);
  writeRatePresets(seq, items);
  rerenderEditor(editor);
}

export function bindDiscountSurchargePresetEditors(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-rate-preset-editor]").forEach((editor) => {
    if (editor.dataset.ratePresetEditorBound === "1") return;
    editor.dataset.ratePresetEditorBound = "1";

    editor.querySelectorAll<HTMLElement>("[data-rate-preset-row]").forEach(syncRowKindUi);

    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-rate-preset-add]")) {
        const seq = Number(editor.getAttribute("data-preset-seq"));
        if (seq === ORDER_SURCHARGE_PRESET_SEQ) {
          openSurchargeDialog(editor);
        } else {
          appendPreset(editor);
        }
        return;
      }
      if (
        target.closest("[data-surcharge-dialog-cancel]") ||
        target.closest("[data-surcharge-dialog-close]")
      ) {
        closeSurchargeDialog(editor);
        return;
      }
      if (target.closest("[data-surcharge-dialog-save]")) {
        addSurchargeFromDialog(editor);
        return;
      }
      const editBtn = target.closest("[data-surcharge-row-edit]");
      if (editBtn) {
        const row = editBtn.closest<HTMLElement>("[data-rate-preset-row]");
        const presetId = row?.getAttribute("data-preset-id");
        if (presetId) openSurchargeEditDialog(editor, presetId);
        return;
      }
      const toggleBtn = target.closest("[data-surcharge-row-toggle-enabled]");
      if (toggleBtn) {
        const row = toggleBtn.closest<HTMLElement>("[data-rate-preset-row]");
        const presetId = row?.getAttribute("data-preset-id");
        if (presetId) toggleSurchargeEnabled(editor, presetId);
        return;
      }
      const removeBtn = target.closest("[data-rate-preset-remove]");
      if (removeBtn) {
        const row = removeBtn.closest<HTMLElement>("[data-rate-preset-row]");
        if (row) removePreset(editor, row);
      }
    });

    editor.addEventListener("input", (e) => {
      const el = e.target as HTMLElement;
      if (
        el.matches("[data-rate-preset-name]") ||
        el.matches("[data-rate-preset-value]")
      ) {
        persistEditor(editor);
      }
    });

    editor.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (el.matches("[data-rate-preset-kind]")) {
        const row = el.closest<HTMLElement>("[data-rate-preset-row]");
        if (row) syncRowKindUi(row);
        persistEditor(editor);
        return;
      }
      if (
        el.matches("[data-rate-preset-name]") ||
        el.matches("[data-rate-preset-value]")
      ) {
        const row = el.closest<HTMLElement>("[data-rate-preset-row]");
        if (row) syncRowKindUi(row);
        persistEditor(editor);
        return;
      }
      if (el.matches("[data-surcharge-dialog-fee-type]")) {
        syncSurchargeDialogFeeTypeUi(editor);
        return;
      }
      if (el.matches("[data-surcharge-dialog-kind]")) {
        syncSurchargeDialogKindUi(editor);
        return;
      }
      if (el.matches("[data-surcharge-dialog-taxable]")) {
        syncSurchargeTaxableTipUi(editor);
      }
    });

    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-surcharge-dialog-taxable]")) {
        syncSurchargeTaxableTipUi(editor);
      }
    });

    editor.addEventListener("keydown", (e) => {
      const dialog = editor.querySelector<HTMLElement>("[data-surcharge-create-dialog]");
      if (!dialog || dialog.classList.contains("hidden")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeSurchargeDialog(editor);
      }
    });
  });
}
