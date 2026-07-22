/**
 * 功能设置变更 → 下发记录（可读标签、操作类型、修改前后）
 */
import { readAppHashPath } from "./app-routes";
import {
  buildChangeDetailRows,
  formatConfigDisplayValue,
  getSettingTitleBySeq,
  changeHasDiff,
  recordDeploymentConfigChange,
  summarizeChangeDetails,
} from "./deployment-change-buffer";
import { resolveOriginNavFromPath } from "./deployment-config-domains";
import type { ChangeDetailRow, DeploymentConfigChange } from "./deployment-types";
import {
  isPageBatchSavePath,
  resolvePageSaveKey,
  trackPageConfigChange,
} from "./page-settings-draft";
import {
  getModuleSettingsBasePath,
  listAllModuleSettingCatalogEntries,
} from "./module-settings-catalog";
import {
  listModuleSettingFormFieldDescriptors,
  listModuleSettingFormRows,
} from "./module-settings-form-ui";
import { getCatalogItemBySeq } from "./nav-setting-registry";
import { GUEST_FACING_LOCALES, STAFF_SYSTEM_DEFAULT_LOCALES } from "./module-settings-locale-ui";

export type ModuleSettingChangeKind =
  | "toggle"
  | "product_line"
  | "checkbox"
  | "radio"
  | "number"
  | "text"
  | "color"
  | "json";

const PRODUCT_LINE_LABELS: Record<string, string> = {
  pos: "POS",
  emenu: "eMenu",
  kiosk: "Kiosk",
  cds: "CDS",
  paypad: "PayPad",
  sdi: "SDI",
  "online-order": "Online Order",
};

const FIELD_SUFFIX_LABELS: Record<string, string> = {
  lines: "适用产线",
  "by-line": "按产线配置",
  minutes: "时长（分钟）",
  percent: "百分比",
  "win-probability-percent": "中奖概率",
};

/** 营业时间即将结束提示 · 按产线配置 fieldId */
export const STORE_CLOSING_ALERT_BY_LINE_FIELD_ID = "582-closing-alert-by-line";
const STORE_CLOSING_ALERT_SEQ = 582;

/** 自动登出时间 · 按产线配置 fieldId */
export const AUTO_LOGOUT_BY_LINE_FIELD_ID = "75-auto-logout-by-line";
const AUTO_LOGOUT_MINUTES_SEQ = 75;

/** 每单最多客人数量 · 按产线配置 fieldId */
export const MAX_GUESTS_BY_LINE_FIELD_ID = "111-max-guests-by-line";
const MAX_GUESTS_PER_ORDER_SEQ = 111;

const CLOSING_ALERT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

const AUTO_LOGOUT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

const MAX_GUESTS_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

type ClosingAlertLineConfig = { enabled: boolean; minutes: number };
type AutoLogoutLineConfig = { enabled: boolean; minutes: number };
type MaxGuestsLineConfig = { enabled: boolean; guests: number };

function clampClosingAlertMinutes(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 15;
  return Math.min(180, Math.max(1, Math.round(n)));
}

function clampAutoLogoutMinutes(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 15;
  return Math.min(999, Math.max(1, Math.round(n)));
}

function clampMaxGuests(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 20;
  return Math.min(99, Math.max(1, Math.round(n)));
}

function parseByLineConfigObject(value: unknown): Record<string, Partial<ClosingAlertLineConfig>> | null {
  let raw: unknown = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "（未设置）" || trimmed === "（空）") return null;
    if (trimmed.startsWith("{")) {
      try {
        raw = JSON.parse(trimmed);
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, Partial<ClosingAlertLineConfig>>;
}

/**
 * 将「营业时间即将结束提示」按产线配置格式化为下发记录可读文案。
 * 例：`Kiosk：启用，结束前 15 分钟`
 */
export function formatStoreClosingAlertByLineForDeployment(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "（未设置）" || trimmed === "（空）") return trimmed || null;
    if ((trimmed.includes("：启用") || trimmed.includes("：未启用")) && !trimmed.startsWith("{")) {
      return trimmed;
    }
  }
  const obj = parseByLineConfigObject(value);
  if (!obj) return null;
  return CLOSING_ALERT_LINES.map((line) => {
    const item = obj[line.id];
    const enabled = item?.enabled === true;
    const minutes = clampClosingAlertMinutes(item?.minutes ?? 15);
    if (!enabled) return `${line.label}：未启用`;
    return `${line.label}：启用，结束前 ${minutes} 分钟`;
  }).join("\n");
}

/**
 * 将「自动登出时间」按产线配置格式化为下发记录可读文案。
 * 例：`POS：启用，无操作 15 分钟`
 */
export function formatAutoLogoutByLineForDeployment(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "（未设置）" || trimmed === "（空）") return trimmed || null;
    if ((trimmed.includes("：启用") || trimmed.includes("：未启用")) && !trimmed.startsWith("{")) {
      return trimmed;
    }
  }
  const obj = parseByLineConfigObject(value) as Record<string, Partial<AutoLogoutLineConfig>> | null;
  if (!obj) return null;
  return AUTO_LOGOUT_LINES.map((line) => {
    const item = obj[line.id];
    const enabled = item?.enabled === true;
    const minutes = clampAutoLogoutMinutes(item?.minutes ?? 15);
    if (!enabled) return `${line.label}：未启用`;
    return `${line.label}：启用，无操作 ${minutes} 分钟`;
  }).join("\n");
}

/**
 * 将「每单最多客人数量」按产线配置格式化为下发记录可读文案。
 * 例：`POS：启用，最多 20 人`
 */
export function formatMaxGuestsByLineForDeployment(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "（未设置）" || trimmed === "（空）") return trimmed || null;
    if ((trimmed.includes("：启用") || trimmed.includes("：未启用")) && !trimmed.startsWith("{")) {
      return trimmed;
    }
  }
  const obj = parseByLineConfigObject(value) as Record<string, Partial<MaxGuestsLineConfig>> | null;
  if (!obj) return null;
  return MAX_GUESTS_LINES.map((line) => {
    const item = obj[line.id];
    const enabled = item?.enabled === true;
    const guests = clampMaxGuests(item?.guests ?? 20);
    if (!enabled) return `${line.label}：未启用`;
    return `${line.label}：启用，最多 ${guests} 人`;
  }).join("\n");
}

function formatClosingAlertLineText(item: Record<string, unknown> | undefined): string {
  const enabled = item?.enabled === true;
  const minutes = clampClosingAlertMinutes(item?.minutes ?? 15);
  if (!enabled) return "未启用";
  return `启用，结束前 ${minutes} 分钟`;
}

function formatAutoLogoutLineText(item: Record<string, unknown> | undefined): string {
  const enabled = item?.enabled === true;
  const minutes = clampAutoLogoutMinutes(item?.minutes ?? 15);
  if (!enabled) return "未启用";
  return `启用，无操作 ${minutes} 分钟`;
}

function formatMaxGuestsLineText(item: Record<string, unknown> | undefined): string {
  const enabled = item?.enabled === true;
  const guests = clampMaxGuests(item?.guests ?? 20);
  if (!enabled) return "未启用";
  return `启用，最多 ${guests} 人`;
}

function buildByLineDetailRows(
  before: unknown,
  after: unknown,
  lines: readonly { id: string; label: string }[],
  formatLine: (item: Record<string, unknown> | undefined) => string,
): ChangeDetailRow[] {
  const beforeObj = parseByLineConfigObject(before) ?? {};
  const afterObj = parseByLineConfigObject(after) ?? {};
  const rows: ChangeDetailRow[] = [];
  for (const line of lines) {
    const beforeText = formatLine(beforeObj[line.id] as Record<string, unknown> | undefined);
    const afterText = formatLine(afterObj[line.id] as Record<string, unknown> | undefined);
    if (beforeText === afterText) continue;
    rows.push({
      key: line.id,
      label: line.label,
      before: beforeText,
      after: afterText,
    });
  }
  return rows;
}

function buildDetailsForKind(
  kind: ModuleSettingChangeKind,
  before: unknown,
  after: unknown,
  fieldId?: string,
  rootLabel?: string,
): ChangeDetailRow[] {
  if (fieldId === STORE_CLOSING_ALERT_BY_LINE_FIELD_ID) {
    return buildByLineDetailRows(before, after, CLOSING_ALERT_LINES, formatClosingAlertLineText);
  }
  if (fieldId === AUTO_LOGOUT_BY_LINE_FIELD_ID) {
    return buildByLineDetailRows(before, after, AUTO_LOGOUT_LINES, formatAutoLogoutLineText);
  }
  if (fieldId === MAX_GUESTS_BY_LINE_FIELD_ID) {
    return buildByLineDetailRows(before, after, MAX_GUESTS_LINES, formatMaxGuestsLineText);
  }
  if (kind === "product_line" || (kind === "json" && fieldId && isProductLineIdArray(after))) {
    const beforeText = formatProductLineList(before);
    const afterText = formatProductLineList(after);
    if (beforeText === afterText) return [];
    return [
      {
        key: "lines",
        label: "适用产线",
        before: beforeText,
        after: afterText,
      },
    ];
  }
  if (
    kind === "toggle" ||
    kind === "checkbox" ||
    kind === "number" ||
    kind === "text" ||
    kind === "color" ||
    kind === "radio"
  ) {
    const beforeText = formatValueForKind(kind, before, fieldId);
    const afterText = formatValueForKind(kind, after, fieldId);
    if (beforeText === afterText) return [];
    return [
      {
        key: fieldId ?? "value",
        label: rootLabel ?? "配置值",
        before: beforeText,
        after: afterText,
      },
    ];
  }
  return buildChangeDetailRows(before, after, {
    rootKey: fieldId ?? "value",
    rootLabel: rootLabel ?? "配置值",
  });
}

/** settingsPath + seq → 导航分组路径 */
export function resolveChangeGroupPath(
  settingsPath?: string,
  seq?: number,
): string[] | undefined {
  if (!settingsPath && seq == null) return undefined;
  const path = settingsPath ?? resolveSettingsPathForSeq(seq!);
  if (!path) return undefined;

  const nav = resolveOriginNavFromPath(path);
  const parts: string[] = [];
  if (nav.l1Title) parts.push(nav.l1Title);
  if (nav.l2Title && nav.l2Title !== nav.l1Title) parts.push(nav.l2Title);

  if (seq != null) {
    const catalogItem = getCatalogItemBySeq(seq);
    if (catalogItem?.groupTitle && !parts.includes(catalogItem.groupTitle)) {
      parts.push(catalogItem.groupTitle);
    }
  }

  return parts.length > 0 ? parts : undefined;
}

const KNOWN_LINE_IDS = new Set(Object.keys(PRODUCT_LINE_LABELS));

let radioLabelByFieldValue: Map<string, string> | null = null;
let fieldLabelById: Map<string, string> | null = null;
let settingsPathBySeq: Map<number, string> | null = null;

function ensureFieldLabelCache(): Map<string, string> {
  if (fieldLabelById) return fieldLabelById;
  fieldLabelById = new Map();
  for (const d of listModuleSettingFormFieldDescriptors()) {
    fieldLabelById.set(d.fieldId, d.label);
  }
  return fieldLabelById;
}

function ensureRadioLabelCache(): Map<string, string> {
  if (radioLabelByFieldValue) return radioLabelByFieldValue;
  radioLabelByFieldValue = new Map();
  for (const row of listModuleSettingFormRows()) {
    if ((row.kind === "radio-group" || row.kind === "radio-color") && row.radioFieldId && row.radios) {
      for (const r of row.radios) {
        if ("label" in r) {
          radioLabelByFieldValue.set(`${row.radioFieldId}:${r.value}`, r.label);
        }
      }
    }
  }
  for (const loc of STAFF_SYSTEM_DEFAULT_LOCALES) {
    radioLabelByFieldValue.set(`109-system-default-locale:${loc.code}`, loc.label);
  }
  for (const loc of GUEST_FACING_LOCALES) {
    radioLabelByFieldValue.set(`652-guest-facing-locale:${loc.code}`, loc.label);
    radioLabelByFieldValue.set(`653-default-locale:${loc.code}`, loc.label);
  }
  return radioLabelByFieldValue;
}

function ensureSettingsPathBySeq(): Map<number, string> {
  if (settingsPathBySeq) return settingsPathBySeq;
  settingsPathBySeq = new Map();
  for (const { settingsPath, item } of listAllModuleSettingCatalogEntries()) {
    settingsPathBySeq.set(item.seq, settingsPath);
  }
  return settingsPathBySeq;
}

export function extractSeqFromFieldId(fieldId: string): number | undefined {
  const m = /^(\d+)(?:-|$)/.exec(fieldId);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

export function resolveSettingsPathForSeq(seq: number): string | undefined {
  return ensureSettingsPathBySeq().get(seq);
}

export function resolveSettingsPathForChange(fieldId?: string, seq?: number): string | undefined {
  const resolvedSeq = seq ?? (fieldId ? extractSeqFromFieldId(fieldId) : undefined);
  if (resolvedSeq != null) {
    const fromCatalog = resolveSettingsPathForSeq(resolvedSeq);
    if (fromCatalog) return fromCatalog;
  }
  const path = readAppHashPath();
  const base = getModuleSettingsBasePath(path);
  return base ?? path;
}

export function formatProductLineList(value: unknown): string {
  if (!Array.isArray(value)) return formatConfigDisplayValue(value);
  if (value.length === 0) return "（无）";
  const labels = value
    .filter((v): v is string => typeof v === "string")
    .map((id) => PRODUCT_LINE_LABELS[id.toLowerCase()] ?? id);
  return labels.join("、");
}

function isProductLineIdArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return true;
  return value.every((v) => typeof v === "string" && KNOWN_LINE_IDS.has(v.toLowerCase()));
}

function isProductLineStorageField(fieldId: string, value: unknown): boolean {
  if (!fieldId.includes("-lines") && !fieldId.endsWith("lines")) return false;
  return isProductLineIdArray(value);
}

function humanizeFieldSuffix(fieldId: string, seq?: number): string | undefined {
  let rest = fieldId;
  if (seq != null) {
    rest = fieldId.replace(new RegExp(`^${seq}-`), "");
  }
  if (rest.endsWith("-lines") || rest === "lines") return FIELD_SUFFIX_LABELS.lines;
  for (const [key, label] of Object.entries(FIELD_SUFFIX_LABELS)) {
    if (rest === key || rest.endsWith(`-${key}`)) return label;
  }
  return undefined;
}

function resolveSubFieldLabel(fieldId: string, seq?: number): string | undefined {
  const fromDescriptor = ensureFieldLabelCache().get(fieldId);
  if (fromDescriptor && fromDescriptor !== fieldId) return fromDescriptor;
  return humanizeFieldSuffix(fieldId, seq);
}

function resolveRadioDisplayValue(fieldId: string, value: unknown): string {
  if (typeof value !== "string") return formatConfigDisplayValue(value);
  return ensureRadioLabelCache().get(`${fieldId}:${value}`) ?? formatConfigDisplayValue(value);
}

function buildSettingLabel(seq: number | undefined, subLabel?: string): string {
  const base =
    (seq != null ? getSettingTitleBySeq(seq) : undefined) ??
    (seq != null ? getCatalogItemBySeq(seq)?.title : undefined) ??
    (seq != null ? `设置项 #${seq}` : "功能设置");
  if (!subLabel || subLabel === base) return base;
  return `${base} · ${subLabel}`;
}

function inferProductLineOperation(before: string[], after: string[]): string {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const added = after.filter((id) => !beforeSet.has(id));
  const removed = before.filter((id) => !afterSet.has(id));
  if (added.length === 1 && removed.length === 0) {
    return `勾选产线 ${PRODUCT_LINE_LABELS[added[0]!] ?? added[0]}`;
  }
  if (removed.length === 1 && added.length === 0) {
    return `取消勾选产线 ${PRODUCT_LINE_LABELS[removed[0]!] ?? removed[0]}`;
  }
  return "调整适用产线";
}

function inferToggleOperation(before: unknown, after: unknown): string {
  const on = after === true || after === "1" || after === 1;
  return on ? "开启功能" : "关闭功能";
}

function inferOperation(
  kind: ModuleSettingChangeKind,
  before: unknown,
  after: unknown,
  fieldId?: string,
): string | undefined {
  switch (kind) {
    case "toggle":
      return inferToggleOperation(before, after);
    case "checkbox": {
      const on = after === true || after === "1";
      return on ? "勾选" : "取消勾选";
    }
    case "product_line":
      if (Array.isArray(before) && Array.isArray(after)) {
        return inferProductLineOperation(before, after);
      }
      return "调整适用产线";
    case "radio":
      return "切换选项";
    case "number":
      return "修改数值";
    case "text":
    case "color":
      return "修改内容";
    case "json":
      if (fieldId === STORE_CLOSING_ALERT_BY_LINE_FIELD_ID) {
        return inferClosingAlertByLineOperation(before, after);
      }
      if (fieldId === AUTO_LOGOUT_BY_LINE_FIELD_ID) {
        return inferAutoLogoutByLineOperation(before, after);
      }
      if (fieldId === MAX_GUESTS_BY_LINE_FIELD_ID) {
        return inferMaxGuestsByLineOperation(before, after);
      }
      if (fieldId && isProductLineStorageField(fieldId, after)) {
        if (Array.isArray(before) && Array.isArray(after)) {
          return inferProductLineOperation(before, after);
        }
      }
      return "修改配置";
    default:
      return undefined;
  }
}

function formatValueForKind(
  kind: ModuleSettingChangeKind,
  value: unknown,
  fieldId?: string,
): string {
  if (fieldId === STORE_CLOSING_ALERT_BY_LINE_FIELD_ID) {
    return formatStoreClosingAlertByLineForDeployment(value) ?? formatConfigDisplayValue(value);
  }
  if (fieldId === AUTO_LOGOUT_BY_LINE_FIELD_ID) {
    return formatAutoLogoutByLineForDeployment(value) ?? formatConfigDisplayValue(value);
  }
  if (fieldId === MAX_GUESTS_BY_LINE_FIELD_ID) {
    return formatMaxGuestsByLineForDeployment(value) ?? formatConfigDisplayValue(value);
  }
  if (kind === "product_line" || (kind === "json" && fieldId && isProductLineIdArray(value))) {
    return formatProductLineList(value);
  }
  if (kind === "radio" && fieldId && typeof value === "string") {
    return resolveRadioDisplayValue(fieldId, value);
  }
  if (kind === "checkbox" || kind === "toggle") {
    return formatConfigDisplayValue(value);
  }
  return formatConfigDisplayValue(value);
}

function inferClosingAlertByLineOperation(before: unknown, after: unknown): string {
  const beforeText = formatStoreClosingAlertByLineForDeployment(before);
  const afterText = formatStoreClosingAlertByLineForDeployment(after);
  if (!beforeText || !afterText) return "调整产线提示";

  const beforeLines = beforeText.split("\n");
  const afterLines = afterText.split("\n");
  const changed: string[] = [];
  for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
    if (beforeLines[i] !== afterLines[i] && afterLines[i]) {
      const lineName = afterLines[i]!.split("：")[0];
      if (lineName) changed.push(lineName);
    }
  }
  if (changed.length === 1) return `调整 ${changed[0]} 提示`;
  if (changed.length > 1) return `调整 ${changed.join("、")} 提示`;
  return "调整产线提示";
}

function inferAutoLogoutByLineOperation(before: unknown, after: unknown): string {
  const beforeText = formatAutoLogoutByLineForDeployment(before);
  const afterText = formatAutoLogoutByLineForDeployment(after);
  if (!beforeText || !afterText) return "调整产线登出时间";

  const beforeLines = beforeText.split("\n");
  const afterLines = afterText.split("\n");
  const changed: string[] = [];
  for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
    if (beforeLines[i] !== afterLines[i] && afterLines[i]) {
      const lineName = afterLines[i]!.split("：")[0];
      if (lineName) changed.push(lineName);
    }
  }
  if (changed.length === 1) return `调整 ${changed[0]} 登出时间`;
  if (changed.length > 1) return `调整 ${changed.join("、")} 登出时间`;
  return "调整产线登出时间";
}

function inferMaxGuestsByLineOperation(before: unknown, after: unknown): string {
  const beforeText = formatMaxGuestsByLineForDeployment(before);
  const afterText = formatMaxGuestsByLineForDeployment(after);
  if (!beforeText || !afterText) return "调整产线最多客人";

  const beforeLines = beforeText.split("\n");
  const afterLines = afterText.split("\n");
  const changed: string[] = [];
  for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
    if (beforeLines[i] !== afterLines[i] && afterLines[i]) {
      const lineName = afterLines[i]!.split("：")[0];
      if (lineName) changed.push(lineName);
    }
  }
  if (changed.length === 1) return `调整 ${changed[0]} 最多客人`;
  if (changed.length > 1) return `调整 ${changed.join("、")} 最多客人`;
  return "调整产线最多客人";
}

export interface ModuleSettingChangeInput {
  fieldId?: string;
  seq?: number;
  /** 子项标签（如「适用产线」），会与功能名称拼接 */
  label?: string;
  /** 完整展示标签（跳过自动拼接，用于按产线视图等特殊场景） */
  fullLabel?: string;
  kind?: ModuleSettingChangeKind;
  before: unknown;
  after: unknown;
  settingsPath?: string;
}

export function buildModuleSettingDeploymentChange(
  input: ModuleSettingChangeInput,
): DeploymentConfigChange & { settingsPath?: string } {
  const seq = input.seq ?? (input.fieldId ? extractSeqFromFieldId(input.fieldId) : undefined);
  const fieldId = input.fieldId;

  let kind = input.kind ?? "json";
  if (!input.kind && fieldId) {
    if (isProductLineStorageField(fieldId, input.after)) kind = "product_line";
  }

  const subLabel =
    input.label ??
    (fieldId ? resolveSubFieldLabel(fieldId, seq) : undefined);

  const label =
    input.fullLabel ??
    (fieldId === STORE_CLOSING_ALERT_BY_LINE_FIELD_ID || seq === STORE_CLOSING_ALERT_SEQ
      ? getSettingTitleBySeq(STORE_CLOSING_ALERT_SEQ)
      : undefined) ??
    (fieldId === AUTO_LOGOUT_BY_LINE_FIELD_ID || seq === AUTO_LOGOUT_MINUTES_SEQ
      ? getSettingTitleBySeq(AUTO_LOGOUT_MINUTES_SEQ)
      : undefined) ??
    (fieldId === MAX_GUESTS_BY_LINE_FIELD_ID || seq === MAX_GUESTS_PER_ORDER_SEQ
      ? getSettingTitleBySeq(MAX_GUESTS_PER_ORDER_SEQ)
      : undefined) ??
    (seq != null ? buildSettingLabel(seq, subLabel) : subLabel ?? fieldId ?? "功能设置");

  const beforeStr = formatValueForKind(kind, input.before, fieldId);
  const afterStr = formatValueForKind(kind, input.after, fieldId);
  const operation = inferOperation(kind, input.before, input.after, fieldId);

  const settingsPath =
    input.settingsPath ??
    (seq != null ? resolveSettingsPathForSeq(seq) : undefined) ??
    (fieldId ? resolveSettingsPathForChange(fieldId) : resolveSettingsPathForChange());

  const details = buildDetailsForKind(kind, input.before, input.after, fieldId, subLabel ?? label);
  const summary = details.length > 0 ? summarizeChangeDetails(details) : null;
  const groupPath = resolveChangeGroupPath(settingsPath, seq);

  return {
    fieldKey: fieldId ?? (seq != null ? String(seq) : undefined),
    label,
    operation,
    before: summary?.before ?? beforeStr,
    after: summary?.after ?? afterStr,
    settingsPath,
    groupPath,
    details: details.length > 0 ? details : undefined,
  };
}

/** 记录功能设置变更并返回下发路径（供 notifyConfigSaved 使用） */
export function recordModuleSettingDeploymentChange(input: ModuleSettingChangeInput): string | undefined {
  const built = buildModuleSettingDeploymentChange(input);
  if (!changeHasDiff(built)) return built.settingsPath;

  const settingsPath = built.settingsPath;
  if (settingsPath && isPageBatchSavePath(settingsPath)) {
    trackPageConfigChange(resolvePageSaveKey(settingsPath), settingsPath, built);
    return settingsPath;
  }

  recordDeploymentConfigChange({
    fieldKey: built.fieldKey,
    label: built.label,
    operation: built.operation,
    before: built.before,
    after: built.after,
    settingsPath: built.settingsPath,
    groupPath: built.groupPath,
    details: built.details,
  });
  return built.settingsPath;
}
