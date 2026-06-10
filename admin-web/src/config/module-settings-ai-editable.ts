/**
 * AI 助手 · 非简单开关类设置改配（表单 / 多选 / 产线 / 数值 / 单选等）
 */

import { writeFohByLineToggleState } from "./foh-settings-by-line-toggle";
import { FOH_LINE_STORAGE_BY_SEQ } from "./foh-settings-line-storage-registry";
import { FOH_LINE_NAV_ORDER, type FohLineNavId } from "./foh-settings-line-scope";
import {
  kitchenOrderTypeCheckboxFieldId,
  KITCHEN_STANDARD_ORDER_TYPES,
  isKitchenOrderTypeMultiselectSeq,
} from "./module-settings-kitchen-order-type-ui";
import {
  listModuleSettingFormFieldDescriptors,
  readModuleSettingCheckbox,
  readModuleSettingNumber,
  readModuleSettingRadio,
  readModuleSettingText,
  writeModuleSettingCheckbox,
  writeModuleSettingColor,
  writeModuleSettingNumber,
  writeModuleSettingRadio,
  writeModuleSettingText,
} from "./module-settings-form-ui";
import {
  packingSlipOrderTypeCheckboxFieldId,
  PACKING_SLIP_ORDER_TYPE_OPTIONS,
  isPackingSlipOrderTypeMultiselectSeq,
} from "./module-settings-packing-slip-order-type-ui";
import { getModuleSettingNestedGroup } from "./module-settings-nested-ui";
import { WAIT_TIME_CALCULATION_FIELDS } from "./module-settings-wait-time-calculation-ui";
import type { ModuleSettingCatalogItem } from "./module-settings-catalog";
import {
  getModuleSettingsItemHref,
  listAllModuleSettingCatalogEntries,
} from "./module-settings-catalog";
import { isModuleSettingToggleSeq } from "./module-settings-toggle-ui";
import {
  readAviatoServiceScopes,
  writeAviatoServiceScopes,
  type AviatoServiceScopeId,
} from "./module-settings-advanced-service-switches-ui";
import {
  extractSubOptionPhrase,
  getSubOptionsForSeq,
  hasSubOptionsForSeq,
  matchSubOption,
  type SubOptionDef,
} from "./module-settings-ai-multi-options";

export type AiSettingMutation =
  | { kind: "toggle"; seq: number; on: boolean }
  | { kind: "checkbox"; fieldId: string; checked: boolean; seq: number; label: string }
  | { kind: "radio"; fieldId: string; value: string; seq: number; label: string }
  | { kind: "number"; fieldId: string; value: number; seq: number; label: string }
  | { kind: "text"; fieldId: string; value: string; seq: number; label: string }
  | { kind: "color"; fieldId: string; value: string; seq: number; label: string }
  | { kind: "foh-line"; seq: number; lineId: string; on: boolean; lineLabel: string }
  | { kind: "order-type"; seq: number; code: string; checked: boolean; optionLabel: string }
  | { kind: "aviato-scope"; scopeId: AviatoServiceScopeId; checked: boolean; seq: number; label: string };

export type AiSettingApplyResult = {
  text: string;
  html: string;
  mutations?: AiSettingMutation[];
};

type IndexedSetting = {
  hubTitle: string;
  settingsPath: string;
  item: ModuleSettingCatalogItem;
  href: string;
};

type NumberFieldMeta = {
  seq: number;
  fieldId: string;
  label: string;
  min?: number;
  max?: number;
};

type TextFieldMeta = {
  seq: number;
  fieldId: string;
  label: string;
};

const SETTING_INDEX: IndexedSetting[] = listAllModuleSettingCatalogEntries().map((row) => ({
  hubTitle: row.hubTitle,
  settingsPath: row.settingsPath,
  item: row.item,
  href: getModuleSettingsItemHref(row.settingsPath, row.item),
}));

/** 已知数值字段（fieldId 前缀为 seq） */
const KNOWN_NUMBER_FIELDS: NumberFieldMeta[] = [
  ...WAIT_TIME_CALCULATION_FIELDS.map((f) => ({
    seq: 673,
    fieldId: f.fieldId,
    label: f.label,
    min: f.min,
    max: f.max,
  })),
  { seq: 63, fieldId: "63-cash-drawer-float-amount", label: "开班备款金额", min: 0, max: 10000 },
  { seq: 76, fieldId: "76-cash-reconciliation-tolerance", label: "长短款容差", min: 0, max: 500 },
  { seq: 111, fieldId: "111-max-guests-per-order", label: "每单最大人数" },
  { seq: 110, fieldId: "110-order-timeout-reminder-minutes", label: "订单超时提醒" },
  { seq: 75, fieldId: "75-auto-logout-minutes", label: "自动登出分钟" },
  { seq: 230, fieldId: "230-settlement-days", label: "结算天数" },
  { seq: 236, fieldId: "236-unbatched-order-limit", label: "未batch订单上限" },
  { seq: 232, fieldId: "232-tip-alert-ratio-percent", label: "小费提醒比例" },
  { seq: 445, fieldId: "445-base-tax-rate-percent", label: "基础税率" },
  { seq: 307, fieldId: "307-processor-fee-percent", label: "收单通道成本率" },
  { seq: 305, fieldId: "305-cash-pay-discount-percent", label: "现金折扣" },
  { seq: 34, fieldId: "34-packing-slip-copies", label: "打包单份数" },
  { seq: 267, fieldId: "267-delivery-receipt-copies", label: "外卖小票份数" },
  { seq: 282, fieldId: "282-receipt-dish-spacing", label: "收据菜品间距" },
  { seq: 640, fieldId: "640-service-call-cooldown-seconds", label: "呼叫间隔秒数" },
  { seq: 645, fieldId: "645-dish-name-font-px", label: "菜品名字体大小" },
  { seq: 341, fieldId: "341-reservation-reminder-hours", label: "预约提醒小时" },
  { seq: 3, fieldId: "3-caller-ticket-display-minutes", label: "叫号展示分钟" },
  { seq: 4, fieldId: "4-caller-ticket-slot-limit", label: "叫号槽位上限" },
  { seq: 5, fieldId: "5-caller-data-retention-days", label: "叫号数据保留天数" },
  { seq: 588, fieldId: "588-order-place-interval-seconds", label: "下单间隔秒数" },
];

const KNOWN_TEXT_FIELDS: TextFieldMeta[] = [
  { seq: 280, fieldId: "280-receipt-auto-surcharge-hint", label: "自动加收提示文案" },
  { seq: 163, fieldId: "163-discount-reason-default", label: "折扣原因默认值" },
];

const LINE_ALIAS: Readonly<Record<string, string>> = {
  pos: "pos",
  "pos go": "pos-go",
  posgo: "pos-go",
  paypad: "paypad",
  kiosk: "kiosk",
  emenu: "emenu",
  "e menu": "emenu",
  sdi: "sdi",
  "online order": "online-order",
  online: "online-order",
  cds: "cds",
  全店: "store-wide",
  全店通用: "store-wide",
};

const ORDER_TYPE_ALIAS: Readonly<Record<string, string>> = {
  堂食: "dine-in",
  堂吃: "dine-in",
  dinein: "dine-in",
  "dine in": "dine-in",
  外带: "to-go",
  "to go": "to-go",
  自取: "pick-up",
  pickup: "pick-up",
  "pick up": "pick-up",
  外送: "delivery",
  外卖: "delivery",
  delivery: "delivery",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function settingLink(href: string, label: string): string {
  return `<a href="#${escapeHtml(href)}" class="font-medium text-primary underline underline-offset-2 hover:text-primary/80">${escapeHtml(label)}</a>`;
}

function searchSettingsByPhrase(phrase: string, limit = 5): IndexedSetting[] {
  const q = phrase.trim().toLowerCase();
  if (!q) return [];
  return SETTING_INDEX.map((row) => {
    let score = 0;
    const title = row.item.title.toLowerCase();
    if (title === q) score += 120;
    else if (title.includes(q)) score += 70;
    const blob = `${row.hubTitle} ${row.item.groupTitle} ${row.item.sceneDesc}`.toLowerCase();
    if (blob.includes(q)) score += 20;
    return { row, score };
  })
    .filter((x) => x.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.row);
}

function listNestedNumberTextFields(): Array<
  NumberFieldMeta | (TextFieldMeta & { kind: "text" })
> {
  const out: Array<NumberFieldMeta | (TextFieldMeta & { kind: "text" })> = [];
  for (const seq of [535, 536, 196, 570, 647]) {
    const group = getModuleSettingNestedGroup(seq);
    if (!group) continue;
    for (const field of group.fields) {
      if (field.kind === "inline") {
        for (const part of field.parts) {
          if (part.type === "number") {
            out.push({
              seq: group.parentSeq,
              fieldId: part.fieldId,
              label: part.fieldId,
              min: part.min,
              max: part.max,
            });
          }
        }
      }
      if (field.kind === "text-input") {
        out.push({
          seq: group.parentSeq,
          fieldId: field.textFieldId,
          label: field.textFieldId,
          kind: "text",
        });
      }
      if (field.kind === "copy-form") {
        out.push({ seq: group.parentSeq, fieldId: field.titleFieldId, label: "标题", kind: "text" });
        out.push({ seq: group.parentSeq, fieldId: field.contentFieldId, label: "内容", kind: "text" });
      }
    }
  }
  return out;
}

function resolveNumberField(seq: number, hint?: string): NumberFieldMeta | undefined {
  const fields = [
    ...KNOWN_NUMBER_FIELDS,
    ...listNestedNumberTextFields().filter((f): f is NumberFieldMeta => !("kind" in f)),
  ].filter((f) => f.seq === seq);
  if (fields.length === 0) return undefined;
  if (!hint) return fields[0];
  const h = hint.toLowerCase();
  return (
    fields.find((f) => f.label.toLowerCase().includes(h) || f.fieldId.toLowerCase().includes(h)) ??
    fields[0]
  );
}

function resolveTextField(seq: number, hint?: string): TextFieldMeta | undefined {
  const nested = listNestedNumberTextFields().filter(
    (f): f is TextFieldMeta & { kind: "text" } => "kind" in f && f.kind === "text" && f.seq === seq,
  );
  const fields = [...KNOWN_TEXT_FIELDS.filter((f) => f.seq === seq), ...nested];
  if (fields.length === 0) return undefined;
  if (!hint) return fields[0];
  const h = hint.toLowerCase();
  return (
    fields.find((f) => f.label.toLowerCase().includes(h) || f.fieldId.toLowerCase().includes(h)) ??
    fields[0]
  );
}

function matchRadioOption(
  fieldId: string,
  optionPhrase: string,
): { value: string; label: string } | undefined {
  const desc = listModuleSettingFormFieldDescriptors().find(
    (f) => f.fieldId === fieldId && f.kind === "radio",
  );
  if (!desc?.radioOptions) return undefined;
  const p = optionPhrase.trim().toLowerCase();
  return desc.radioOptions.find(
    (o) =>
      o.label.toLowerCase() === p ||
      o.label.toLowerCase().includes(p) ||
      o.value.toLowerCase() === p ||
      p.includes(o.label.toLowerCase()),
  );
}

function matchCheckboxField(seq: number, optionPhrase: string) {
  const registryOpt = matchSubOption(seq, optionPhrase);
  if (registryOpt && registryOpt.storage === "checkbox") {
    return { fieldId: registryOpt.fieldId, label: registryOpt.label };
  }
  const options = listModuleSettingFormFieldDescriptors().filter(
    (f) => f.seq === seq && f.kind === "checkbox",
  );
  const p = optionPhrase.trim().toLowerCase();
  return options.find(
    (o) => o.label.toLowerCase() === p || o.label.toLowerCase().includes(p) || p.includes(o.label),
  );
}

function buildSubOptionMutation(seq: number, opt: SubOptionDef, checked: boolean): AiSettingMutation {
  if (opt.storage === "aviato-scope" && opt.scopeId) {
    return {
      kind: "aviato-scope",
      scopeId: opt.scopeId as AviatoServiceScopeId,
      checked,
      seq,
      label: opt.label,
    };
  }
  return { kind: "checkbox", fieldId: opt.fieldId, checked, seq, label: opt.label };
}

function readSubOptionChecked(opt: SubOptionDef): boolean {
  if (opt.storage === "aviato-scope" && opt.scopeId) {
    return readAviatoServiceScopes().includes(opt.scopeId as AviatoServiceScopeId);
  }
  return readModuleSettingCheckbox(opt.fieldId, false);
}

function resolveSubOptionFromPhrases(
  seq: number,
  phrases: string[],
): SubOptionDef | undefined {
  for (const phrase of phrases) {
    const opt = matchSubOption(seq, phrase);
    if (opt) return opt;
  }
  return undefined;
}

function tryApplySubOptionChange(
  indexed: IndexedSetting,
  checked: boolean,
  phrases: string[],
  locale: "zh" | "en",
): AiSettingApplyResult | null {
  const seq = indexed.item.seq;
  if (!hasSubOptionsForSeq(seq)) return null;
  const opt = resolveSubOptionFromPhrases(seq, phrases);
  if (!opt) return null;
  return buildApplyReply(indexed, [buildSubOptionMutation(seq, opt, checked)], locale);
}

/** 一项多功能：列出子选项及当前勾选状态，并给出对话改配示例 */
export function formatMultiOptionGuide(
  indexed: IndexedSetting,
  locale: "zh" | "en",
): AiSettingApplyResult {
  const { item, hubTitle, href } = indexed;
  const options = getSubOptionsForSeq(item.seq);
  const lines = options.map((opt) => {
    const on = readSubOptionChecked(opt);
    const state =
      locale === "en" ? (on ? "checked" : "unchecked") : on ? "已勾选" : "未勾选";
    return `${opt.label}（${state}）`;
  });
  const example =
    locale === "en"
      ? `e.g. "enable ${item.title} · ${options[0]?.label ?? "option"}" or "check ${options[0]?.label ?? "option"} for ${item.title}"`
      : `可说「把${item.title}的${options[0]?.label ?? "子选项"}打开」或「勾选${options[0]?.label ?? "子选项"}」`;
  const head =
    locale === "en"
      ? `${hubTitle} · ${item.title} has multiple options:`
      : `${hubTitle} ·「${item.title}」包含多个可勾选项：`;
  const text = `${head}\n${lines.join("\n")}\n${example}`;
  const html = `<p>${escapeHtml(head)}</p><ul class="mt-2 list-disc space-y-1 pl-4">${lines
    .map((l) => `<li>${escapeHtml(l)}</li>`)
    .join("")}</ul><p class="mt-2 text-xs text-muted-foreground">${escapeHtml(example)}</p><p class="mt-2">${settingLink(href, locale === "en" ? "View in settings" : "在设置页查看")}</p>`;
  return { text, html };
}

/** 开关式口语改配：解析父项下的子选项勾选/取消 */
export function processSubOptionConfigureIntent(
  query: string,
  configure: { action: "on" | "off"; target: string },
  locale: "zh" | "en",
): AiSettingApplyResult | null {
  const checked = configure.action === "on";
  const hits = searchSettingsByPhrase(configure.target, 5);
  for (const hit of hits) {
    const phrases = [
      configure.target,
      query,
      extractSubOptionPhrase(configure.target, hit.item.title),
    ];
    const deTail = configure.target.match(/的(.+)$/u)?.[1];
    if (deTail) phrases.push(deTail);
    const applied = tryApplySubOptionChange(hit, checked, phrases, locale);
    if (applied) return applied;
  }
  const multiParent = hits.find((h) => hasSubOptionsForSeq(h.item.seq));
  if (multiParent) return formatMultiOptionGuide(multiParent, locale);
  return null;
}

function normalizeLineId(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  return LINE_ALIAS[key] ?? (FOH_LINE_NAV_ORDER.some((l) => l.id === key) ? key : null);
}

function normalizeOrderTypeCode(raw: string): string | null {
  return ORDER_TYPE_ALIAS[raw.trim().toLowerCase()] ?? null;
}

function persistMutation(m: AiSettingMutation): void {
  switch (m.kind) {
    case "checkbox":
      writeModuleSettingCheckbox(m.fieldId, m.checked);
      break;
    case "radio":
      writeModuleSettingRadio(m.fieldId, m.value);
      break;
    case "number":
      writeModuleSettingNumber(m.fieldId, m.value);
      break;
    case "text":
      writeModuleSettingText(m.fieldId, m.value);
      break;
    case "color":
      writeModuleSettingColor(m.fieldId, m.value);
      break;
    case "foh-line":
      writeFohByLineToggleState(m.seq, m.lineId as FohLineNavId, m.on);
      break;
    case "order-type": {
      const fieldId = isKitchenOrderTypeMultiselectSeq(m.seq)
        ? kitchenOrderTypeCheckboxFieldId(m.seq, m.code)
        : packingSlipOrderTypeCheckboxFieldId(m.seq, m.code);
      writeModuleSettingCheckbox(fieldId, m.checked);
      break;
    }
    case "aviato-scope": {
      const scopes = readAviatoServiceScopes();
      const next = m.checked
        ? scopes.includes(m.scopeId)
          ? scopes
          : [...scopes, m.scopeId]
        : scopes.filter((id) => id !== m.scopeId);
      writeAviatoServiceScopes(next);
      break;
    }
    case "toggle":
      break;
  }
}

function formatMutationSummary(m: AiSettingMutation, locale: "zh" | "en"): string {
  if (locale === "en") {
    switch (m.kind) {
      case "number":
        return `${m.label} → ${m.value}`;
      case "text":
        return `${m.label} → "${m.value}"`;
      case "radio":
        return `${m.label} → ${m.value}`;
      case "checkbox":
        return `${m.label} → ${m.checked ? "checked" : "unchecked"}`;
      case "foh-line":
        return `${m.lineLabel} → ${m.on ? "enabled" : "disabled"}`;
      case "order-type":
        return `${m.optionLabel} → ${m.checked ? "on" : "off"}`;
      case "aviato-scope":
        return `${m.label} → ${m.checked ? "checked" : "unchecked"}`;
      default:
        return "";
    }
  }
  switch (m.kind) {
    case "number":
      return `${m.label} → ${m.value}`;
    case "text":
      return `${m.label} →「${m.value}」`;
    case "radio":
      return `选项 → ${m.label}（${m.value}）`;
    case "checkbox":
      return `${m.label} → ${m.checked ? "已勾选" : "已取消"}`;
    case "foh-line":
      return `产线 ${m.lineLabel} → ${m.on ? "已启用" : "已停用"}`;
    case "order-type":
      return `${m.optionLabel} → ${m.checked ? "已勾选" : "已取消"}`;
    case "aviato-scope":
      return `${m.label} → ${m.checked ? "已勾选" : "已取消"}`;
    default:
      return "";
  }
}

function buildApplyReply(
  indexed: IndexedSetting,
  mutations: AiSettingMutation[],
  locale: "zh" | "en",
): AiSettingApplyResult {
  for (const m of mutations) persistMutation(m);
  const { item, hubTitle, href } = indexed;
  const lines = mutations.map((m) => formatMutationSummary(m, locale)).filter(Boolean);
  const head =
    locale === "en"
      ? `${hubTitle} · ${item.title}: updated`
      : `${hubTitle} · ${item.title}：已更新配置`;
  const text = `${head}\n${lines.join("\n")}`;
  const html = `<p>${escapeHtml(head)}</p><ul class="mt-2 list-disc space-y-1 pl-4">${lines
    .map((l) => `<li>${escapeHtml(l)}</li>`)
    .join("")}</ul><p class="mt-2">${settingLink(href, locale === "en" ? "View in settings" : "在设置页查看")}</p>`;
  return { text, html, mutations };
}

/** 解析并应用复杂改配（表单 / 数值 / 产线 / 订单类型多选等） */
export function processAiAssistantComplexSettingChange(
  query: string,
  locale: "zh" | "en",
): AiSettingApplyResult | null {
  const q = query.trim();

  const parentSubOn = q.match(
    /^(?:请|帮我|请帮我|麻烦|能不能|可以|我想|我要|我需要)?(?:把|将)\s*(.+?)的(.+?)(?:给|)?(?:开启|打开|启用|激活|勾选)(?:一下|下)?$/u,
  );
  const parentSubOff = q.match(
    /^(?:请|帮我|请帮我|麻烦|能不能|可以|我想|我要|我需要)?(?:把|将)\s*(.+?)的(.+?)(?:给|)?(?:关闭|关掉|禁用|停用|取消)(?:一下|下)?$/u,
  );
  if (parentSubOn || parentSubOff) {
    const parentPhrase = (parentSubOn?.[1] ?? parentSubOff?.[1] ?? "").trim();
    const subPhrase = (parentSubOn?.[2] ?? parentSubOff?.[2] ?? "").trim();
    const checked = Boolean(parentSubOn);
    const hits = searchSettingsByPhrase(parentPhrase, 5);
    for (const hit of hits) {
      const applied = tryApplySubOptionChange(hit, checked, [subPhrase, q], locale);
      if (applied) return applied;
    }
  }

  const fohLineMatch = q.match(
    /(?:产线|在)\s*(POS\s*GO|POS|PayPad|Kiosk|eMenu|SDI|Online\s*Order|CDS|全店通用|全店)\s*(上)?\s*(开启|打开|启用|勾选|关闭|关掉|禁用|取消)\s*(.+)$/iu,
  );
  if (fohLineMatch) {
    const lineId = normalizeLineId(fohLineMatch[1].replace(/\s+/g, " "));
    const on = /开启|打开|启用|勾选/.test(fohLineMatch[3]);
    const target = fohLineMatch[4].trim();
    const hits = searchSettingsByPhrase(target, 3);
    const hit = hits.find((h) => FOH_LINE_STORAGE_BY_SEQ[h.item.seq]);
    if (lineId && hit) {
      const lineLabel = FOH_LINE_NAV_ORDER.find((l) => l.id === lineId)?.label ?? lineId;
      const mutation: AiSettingMutation = {
        kind: "foh-line",
        seq: hit.item.seq,
        lineId,
        on,
        lineLabel,
      };
      return buildApplyReply(hit, [mutation], locale);
    }
  }

  const orderTypeMatch = q.match(
    /(?:订单类型|类型)?\s*(堂食|堂吃|外带|外送|外卖|自取|Dine\s*In|To\s*Go|Pick\s*Up|Delivery)\s*(开启|打开|勾选|关闭|关掉|禁用|取消)/iu,
  );
  if (orderTypeMatch) {
    const code = normalizeOrderTypeCode(orderTypeMatch[1]);
    const checked = /开启|打开|勾选/.test(orderTypeMatch[2]);
    const target = q
      .replace(orderTypeMatch[0], "")
      .replace(/不需要厨房单|打包单|设置项|设置/g, "")
      .trim();
    const hits = searchSettingsByPhrase(target || q, 5);
    const hit = hits.find(
      (h) => isKitchenOrderTypeMultiselectSeq(h.item.seq) || isPackingSlipOrderTypeMultiselectSeq(h.item.seq),
    );
    if (code && hit) {
      const options = isKitchenOrderTypeMultiselectSeq(hit.item.seq)
        ? KITCHEN_STANDARD_ORDER_TYPES
        : PACKING_SLIP_ORDER_TYPE_OPTIONS;
      const opt = options.find((o) => o.code === code);
      if (opt) {
        const mutation: AiSettingMutation = {
          kind: "order-type",
          seq: hit.item.seq,
          code,
          checked,
          optionLabel: opt.label,
        };
        return buildApplyReply(hit, [mutation], locale);
      }
    }
  }

  const checkboxOn = q.match(/^(?:勾选|选中|启用选项)\s*(.+)$/u);
  const checkboxOff = q.match(/^(?:取消勾选|取消选中|停用选项)\s*(.+)$/u);
  if (checkboxOn || checkboxOff) {
    const target = (checkboxOn?.[1] ?? checkboxOff?.[1] ?? "").trim();
    const parts = target.split(/\s+/);
    const optionHint = parts.length > 1 ? parts[parts.length - 1] : target;
    const settingHint = parts.length > 1 ? parts.slice(0, -1).join(" ") : target;
    const hits = searchSettingsByPhrase(settingHint, 5);
    for (const hit of hits) {
      const cb = matchCheckboxField(hit.item.seq, optionHint) ?? matchCheckboxField(hit.item.seq, target);
      if (cb) {
        const mutation: AiSettingMutation = {
          kind: "checkbox",
          fieldId: cb.fieldId,
          checked: Boolean(checkboxOn),
          seq: hit.item.seq,
          label: cb.label,
        };
        return buildApplyReply(hit, [mutation], locale);
      }
    }
  }

  const radioMatch = q.match(/^(?:选择|切换到|设为选项|选项改为)\s*(.+?)(?:\s*选项)?$/u);
  if (radioMatch) {
    const target = radioMatch[1].trim();
    const hits = searchSettingsByPhrase(target, 5);
    for (const hit of hits) {
      const formDesc = listModuleSettingFormFieldDescriptors().find(
        (f) => f.seq === hit.item.seq && f.kind === "radio",
      );
      if (!formDesc) continue;
      const opt = matchRadioOption(formDesc.fieldId, target);
      if (opt) {
        const mutation: AiSettingMutation = {
          kind: "radio",
          fieldId: formDesc.fieldId,
          value: opt.value,
          seq: hit.item.seq,
          label: opt.label,
        };
        return buildApplyReply(hit, [mutation], locale);
      }
    }
  }

  const numberMatch = q.match(
    /^(?:把|将)?(.+?)(?:设为|改成|改为|设置为|调整到)\s*([+-]?\d+(?:\.\d+)?)\s*$/u,
  );
  if (numberMatch) {
    const target = numberMatch[1].replace(/^(一下|这个|那个)+/u, "").trim();
    const value = Number(numberMatch[2]);
    if (!Number.isFinite(value)) return null;
    const hits = searchSettingsByPhrase(target, 5);
    for (const hit of hits) {
      const field = resolveNumberField(hit.item.seq, target);
      if (field) {
        let v = value;
        if (field.min != null) v = Math.max(field.min, v);
        if (field.max != null) v = Math.min(field.max, v);
        const mutation: AiSettingMutation = {
          kind: "number",
          fieldId: field.fieldId,
          value: v,
          seq: hit.item.seq,
          label: field.label,
        };
        return buildApplyReply(hit, [mutation], locale);
      }
    }
  }

  const textMatch = q.match(/^(?:把|将)?(.+?)(?:设为|改成|改为|设置为)\s*[「"']?(.+?)[」"']?\s*$/u);
  if (textMatch && !/^\d+(\.\d+)?$/.test(textMatch[2].trim())) {
    const target = textMatch[1].trim();
    const value = textMatch[2].trim();
    const hits = searchSettingsByPhrase(target, 5);
    for (const hit of hits) {
      const field = resolveTextField(hit.item.seq, target);
      if (field) {
        const mutation: AiSettingMutation = {
          kind: "text",
          fieldId: field.fieldId,
          value,
          seq: hit.item.seq,
          label: field.label,
        };
        return buildApplyReply(hit, [mutation], locale);
      }
    }
  }

  return null;
}

/** 读取一项多功能子选项状态摘要 */
export function readSubOptionStatusSummary(seq: number): string | null {
  const options = getSubOptionsForSeq(seq);
  if (options.length === 0) return null;
  const on = options.filter((opt) => readSubOptionChecked(opt)).map((opt) => opt.label);
  return on.length > 0 ? on.join("、") : "无";
}

/** 读取非开关项当前值摘要（供状态查询扩展） */
export function readComplexSettingStateSummary(seq: number): string | null {
  if (isModuleSettingToggleSeq(seq)) return null;
  const subSummary = readSubOptionStatusSummary(seq);
  if (subSummary) return `已勾选：${subSummary}`;
  const form = listModuleSettingFormFieldDescriptors().filter((f) => f.seq === seq);
  if (form.length > 0) {
    return form
      .map((f) => {
        if (f.kind === "checkbox") {
          return `${f.label}:${readModuleSettingCheckbox(f.fieldId, false) ? "开" : "关"}`;
        }
        if (f.kind === "radio") {
          return `${f.label}:${readModuleSettingRadio(f.fieldId, f.radioOptions?.[0]?.value ?? "")}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("；");
  }
  const num = resolveNumberField(seq);
  if (num) return `${num.label}:${readModuleSettingNumber(num.fieldId, 0)}`;
  const txt = resolveTextField(seq);
  if (txt) return `${txt.label}:${readModuleSettingText(txt.fieldId, "")}`;
  if (isKitchenOrderTypeMultiselectSeq(seq)) {
    const on = KITCHEN_STANDARD_ORDER_TYPES.filter((t) =>
      readModuleSettingCheckbox(kitchenOrderTypeCheckboxFieldId(seq, t.code), false),
    ).map((t) => t.label);
    return `订单类型:${on.join(",") || "无"}`;
  }
  if (isPackingSlipOrderTypeMultiselectSeq(seq)) {
    const on = PACKING_SLIP_ORDER_TYPE_OPTIONS.filter((t) =>
      readModuleSettingCheckbox(packingSlipOrderTypeCheckboxFieldId(seq, t.code), false),
    ).map((t) => t.label);
    return `打包单类型:${on.join(",") || "无"}`;
  }
  return null;
}
