/**
 * 支付中心 · 小费与刷卡顺序（seq 9）：CDS / Kiosk / PayPad 产线矩阵 SSOT。
 * 原 seq 495（扫码）、663（Paypad）已合并。
 */

import {
  CHECKOUT_UX_LINES,
  type CheckoutUxLineId,
} from "./module-settings-payment-checkout-ux-lines";
import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  readModuleSettingRadio,
  writeModuleSettingJson,
} from "./module-settings-form-ui";

export const TIP_CARD_ORDER_SEQ = 9;

const TIP_CARD_ORDER_STORAGE_ID = "9-tip-card-order-by-line";

/** @deprecated 使用 CHECKOUT_UX_LINES */
export const TIP_CARD_FLOW_LINES = CHECKOUT_UX_LINES;

export type TipCardFlowLineId = CheckoutUxLineId;
export type TipCardFlowOrder = "tip-before-card" | "tip-after-card";
export type TipCardFlowByLine = Record<TipCardFlowLineId, TipCardFlowOrder>;

const TIP_CARD_ORDER_OPTIONS = [
  { value: "tip-before-card", label: "刷卡前选择小费" },
  { value: "tip-after-card", label: "刷卡后选择小费" },
] as const;

const LEGACY_RADIO_FIELD_BY_LINE: Record<TipCardFlowLineId, string> = {
  cds: "9-tip-card-order",
  kiosk: "495-tip-card-order",
  paypad: "663-tip-card-order",
};

const DEFAULT_ORDER: TipCardFlowOrder = "tip-before-card";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidOrder(value: string): value is TipCardFlowOrder {
  return value === "tip-before-card" || value === "tip-after-card";
}

function normalizeLegacyOrder(raw: string): TipCardFlowOrder | null {
  const v = raw.trim().toLowerCase();
  if (isValidOrder(v)) return v;
  if (v === "before" || v === "tip-first" || v === "1") return "tip-before-card";
  if (v === "after" || v === "card-first" || v === "0") return "tip-after-card";
  return null;
}

function defaultByLine(): TipCardFlowByLine {
  return { cds: DEFAULT_ORDER, kiosk: DEFAULT_ORDER, paypad: DEFAULT_ORDER };
}

function readLegacyLineOrder(lineId: TipCardFlowLineId): TipCardFlowOrder | null {
  const fieldId = LEGACY_RADIO_FIELD_BY_LINE[lineId];
  const raw = readModuleSettingRadio(fieldId, "");
  if (!raw) return null;
  return normalizeLegacyOrder(raw);
}

function normalizeByLine(raw: Partial<TipCardFlowByLine>): TipCardFlowByLine {
  const base = defaultByLine();
  for (const line of CHECKOUT_UX_LINES) {
    const v = raw[line.id];
    base[line.id] = isValidOrder(String(v ?? "")) ? v! : DEFAULT_ORDER;
  }
  return base;
}

export function readTipCardFlowByLine(): TipCardFlowByLine {
  const raw = readModuleSettingJson<Partial<TipCardFlowByLine>>(TIP_CARD_ORDER_STORAGE_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLine(raw);
  }
  const migrated = defaultByLine();
  let hasLegacy = false;
  for (const line of CHECKOUT_UX_LINES) {
    const legacy = readLegacyLineOrder(line.id);
    if (legacy) {
      migrated[line.id] = legacy;
      hasLegacy = true;
    }
  }
  if (hasLegacy) writeTipCardFlowByLine(migrated);
  return migrated;
}

export function writeTipCardFlowByLine(values: TipCardFlowByLine): void {
  writeModuleSettingJson(TIP_CARD_ORDER_STORAGE_ID, normalizeByLine(values));
}

export function isTipCardOrderSeq(seq: number): boolean {
  return seq === TIP_CARD_ORDER_SEQ;
}

export function renderCheckoutTipCardOrderGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      控制 <strong>CDS、Kiosk、PayPad</strong> 在卡付结账时，先进入小费页还是先刷卡。各产线可独立配置；POS / eMenu 不涉及食客自助刷卡流程。
      原扫码端 <strong>495</strong>、PayPad <strong>663</strong> 已合并于此。
    </p>`;
}

export function renderTipCardOrderByLineTableHtml(): string {
  const values = readTipCardFlowByLine();
  const rows = CHECKOUT_UX_LINES.map((line) => {
    const groupName = `tip-card-order-${line.id}`;
    const radios = TIP_CARD_ORDER_OPTIONS.map((opt) => {
      const checked = values[line.id] === opt.value;
      return `
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-tip-card-order-line="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    }).join("");
    return `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm text-foreground align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4" role="radiogroup" aria-label="${escapeHtml(line.label)} 小费与刷卡顺序">${radios}</div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-tip-card-order-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">小费与刷卡顺序</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function collectFromRoot(root: ParentNode): TipCardFlowByLine {
  const values = readTipCardFlowByLine();
  root.querySelectorAll<HTMLInputElement>("[data-tip-card-order-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute("data-tip-card-order-line") as TipCardFlowLineId | null;
    const value = input.value;
    if (!lineId || !isValidOrder(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function bindTipCardOrderEditors(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-tip-card-order-editor]").forEach((editor) => {
    if (editor.dataset.tipCardOrderEditorBound === "1") return;
    editor.dataset.tipCardOrderEditorBound = "1";
    const persist = () => writeTipCardFlowByLine(collectFromRoot(editor));
    editor.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).matches("[data-tip-card-order-line]")) persist();
    });
  });
}
