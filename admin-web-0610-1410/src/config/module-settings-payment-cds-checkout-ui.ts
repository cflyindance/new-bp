/**
 * 支付中心 · 食客结账界面（463 小费页、493 收取方式、9 刷卡顺序、464 签名、465 小票、669 签购单）。
 * 463/464 按 CDS / Kiosk / PayPad 产线矩阵；原 492/497/662/664 及 seq 8 已合并。
 */

import {
  readModuleSettingJson,
  readModuleSettingRadio,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  CHECKOUT_RECEIPT_LINES,
  CHECKOUT_UX_LINES,
  defaultCheckoutUxToggleByLine,
  normalizeCheckoutUxToggleByLine,
  type CheckoutReceiptLineId,
  type CheckoutUxLineId,
  type CheckoutUxToggleByLine,
} from "./module-settings-payment-checkout-ux-lines";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";
import { readTipCollectionModeByLine } from "./module-settings-payment-tip-policy-ui";

export const CDS_CHECKOUT_TIP_PAGE_SEQ = 463;
export const CDS_CHECKOUT_SIGNATURE_PAGE_SEQ = 464;
export const CDS_CHECKOUT_RECEIPT_SEQ = 465;
export const CDS_CHECKOUT_CARD_SLIP_SEQ = 669;

const TIP_PAGE_STORAGE_ID = "463-tip-page-by-line";
const TIP_PAGE_DETAIL_BY_LINE_STORAGE_ID = "463-tip-page-detail-by-line";
/** @deprecated 已迁移至 463-tip-page-detail-by-line */
const LEGACY_KIOSK_TIP_PAGE_DETAIL_STORAGE_ID = "463-kiosk-tip-page-detail";
const SIGNATURE_PAGE_STORAGE_ID = "464-signature-page-by-line";
const RECEIPT_SETTINGS_STORAGE_ID = "465-receipt-by-line";
const CARD_SLIP_SETTINGS_STORAGE_ID = "669-card-slip-by-line";
/** @deprecated 旧 flat 存储键，读取时自动迁移 */
const LEGACY_FLAT_RECEIPT_STORAGE_ID = "465-receipt-print-by-line";

const LEGACY_CARD_SLIP_CUSTOMER_SEQ = 669;
const LEGACY_CARD_SLIP_MERCHANT_SEQ = 670;
/** 打印中心迁入：支付后自动打印收据小票 */
const LEGACY_RECEIPT_AFTER_PAYMENT_SEQ = 260;
/** 打印中心迁入：信用卡支付打印签购单 */
const LEGACY_CARD_RECEIPT_PRINT_SEQ = 245;
/** 打印中心迁入：签购单联次（全局四选一） */
const LEGACY_CARD_SLIP_COPY_MODE_SEQ = 249;
const LEGACY_CARD_SLIP_COPY_RADIO_FIELDS = [
  "249-receipt-slip-print-mode",
  "249-receipt-slip-print-option",
  `${LEGACY_CARD_SLIP_COPY_MODE_SEQ}-receipt-copy-mode`,
] as const;

export type ReceiptChannelMode = "manual" | "auto" | "none";

export type ReceiptChannelKey = "paper" | "electronicSms" | "electronicEmail";

export type ReceiptChannelsByLine = Record<ReceiptChannelKey, ReceiptChannelMode>;

export type ReceiptSettingsByLine = Record<CheckoutReceiptLineId, ReceiptChannelsByLine>;

const RECEIPT_CHANNEL_KEYS: readonly ReceiptChannelKey[] = [
  "paper",
  "electronicSms",
  "electronicEmail",
];

const RECEIPT_CHANNEL_ROWS: readonly { key: ReceiptChannelKey; label: string }[] = [
  { key: "paper", label: "纸质小票" },
  { key: "electronicSms", label: "电子小票（短信）" },
  { key: "electronicEmail", label: "电子小票（邮箱）" },
];

const DEFAULT_RECEIPT_CHANNEL: ReceiptChannelMode = "none";

const PAPER_RECEIPT_OPTIONS = [
  { value: "manual", label: "手动打印" },
  { value: "auto", label: "自动打印" },
  { value: "none", label: "不打印" },
] as const;

const ELECTRONIC_RECEIPT_OPTIONS = [
  { value: "manual", label: "手动发送" },
  { value: "auto", label: "自动发送" },
  { value: "none", label: "不发送" },
] as const;

export type CardSlipCopyKey = "merchantCopy" | "customerCopy";

export type CardSlipCopiesByLine = Record<CardSlipCopyKey, ReceiptChannelMode>;

export type CardSlipSettingsByLine = Record<CheckoutReceiptLineId, CardSlipCopiesByLine>;

const CARD_SLIP_COPY_KEYS: readonly CardSlipCopyKey[] = ["merchantCopy", "customerCopy"];

const CARD_SLIP_COPY_ROWS: readonly { key: CardSlipCopyKey; label: string }[] = [
  { key: "merchantCopy", label: "Merchant Copy（商户联）" },
  { key: "customerCopy", label: "Customer Copy（客户联）" },
];

const CARD_SLIP_PRINT_OPTIONS = PAPER_RECEIPT_OPTIONS;

/** @deprecated 使用 ReceiptChannelMode */
export type ReceiptPrintMode = ReceiptChannelMode;

const LEGACY_RECEIPT_SEQ_BY_LINE: Record<CheckoutUxLineId, number> = {
  cds: 465,
  kiosk: 501,
  paypad: 665,
};

const LEGACY_RECEIPT_RADIO_FIELD_BY_LINE: Record<CheckoutUxLineId, string> = {
  cds: "465-receipt-print-mode",
  kiosk: "501-sms-receipt-mode",
  paypad: "665-email-receipt-mode",
};

const LEGACY_TIP_PAGE_SEQ_BY_LINE: Record<CheckoutUxLineId, number> = {
  cds: 463,
  kiosk: 492,
  paypad: 662,
};

const LEGACY_SIGNATURE_PAGE_SEQ_BY_LINE: Record<CheckoutUxLineId, number> = {
  cds: 464,
  kiosk: 497,
  paypad: 664,
};

const LEGACY_CDS_SIGNATURE_SEQ = 8;

const LEGACY_KIOSK_SHOW_PERCENT_AMOUNT_SEQ = 494;
const LEGACY_KIOSK_SHOW_NO_TIP_SEQ = 496;

export type TipPageLineDetail = {
  showPercentAmount: boolean;
  showNoTip: boolean;
};

export type TipPageDetailByLine = Record<CheckoutUxLineId, TipPageLineDetail>;

/** @deprecated 使用 TipPageLineDetail */
export type KioskTipPageDetail = TipPageLineDetail;

const MODULE_SETTING_TOGGLE_TRACK_ON =
  "bg-primary border-primary shadow-sm";
const MODULE_SETTING_TOGGLE_TRACK_OFF =
  "bg-neutral-300 border-neutral-400/80 shadow-inner dark:bg-neutral-600 dark:border-neutral-500";
const MODULE_SETTING_TOGGLE_KNOB =
  "bg-white shadow-md ring-1 ring-black/10 dark:bg-neutral-100 dark:ring-white/15";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean | null {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(seq));
    if (raw === null) return null;
    return raw === "1";
  } catch {
    return null;
  }
}

function isValidReceiptChannelMode(value: string): value is ReceiptChannelMode {
  return value === "manual" || value === "auto" || value === "none";
}

function normalizeLegacyReceiptMode(raw: string): ReceiptChannelMode | null {
  const v = raw.trim().toLowerCase();
  if (isValidReceiptChannelMode(v)) return v;
  if (v === "manual-send" || v === "manual-print" || v === "1") return "manual";
  if (v === "auto-send" || v === "auto-print" || v === "automatic") return "auto";
  if (v === "off" || v === "no" || v === "0" || v === "dont-send") return "none";
  return null;
}

function defaultReceiptChannels(): ReceiptChannelsByLine {
  return {
    paper: DEFAULT_RECEIPT_CHANNEL,
    electronicSms: DEFAULT_RECEIPT_CHANNEL,
    electronicEmail: DEFAULT_RECEIPT_CHANNEL,
  };
}

function defaultReceiptSettingsByLine(): ReceiptSettingsByLine {
  const out = {} as ReceiptSettingsByLine;
  for (const line of CHECKOUT_RECEIPT_LINES) out[line.id] = defaultReceiptChannels();
  return out;
}

function parseReceiptChannelsEntry(
  raw: unknown,
  lineId: CheckoutReceiptLineId,
): ReceiptChannelsByLine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const paper = isValidReceiptChannelMode(String(o.paper ?? ""))
    ? (o.paper as ReceiptChannelMode)
    : DEFAULT_RECEIPT_CHANNEL;
  if (
    isValidReceiptChannelMode(String(o.electronicSms ?? "")) &&
    isValidReceiptChannelMode(String(o.electronicEmail ?? ""))
  ) {
    return {
      paper,
      electronicSms: o.electronicSms as ReceiptChannelMode,
      electronicEmail: o.electronicEmail as ReceiptChannelMode,
    };
  }
  if (isValidReceiptChannelMode(String(o.electronic ?? ""))) {
    const legacyElectronic = o.electronic as ReceiptChannelMode;
    return {
      paper,
      electronicSms: lineId === "paypad" ? DEFAULT_RECEIPT_CHANNEL : legacyElectronic,
      electronicEmail: lineId === "paypad" ? legacyElectronic : DEFAULT_RECEIPT_CHANNEL,
    };
  }
  return { paper, electronicSms: DEFAULT_RECEIPT_CHANNEL, electronicEmail: DEFAULT_RECEIPT_CHANNEL };
}

function enforceAutoMutex(
  channels: ReceiptChannelsByLine,
  changedChannel: ReceiptChannelKey,
): ReceiptChannelsByLine {
  const next = { ...channels };
  if (next[changedChannel] !== "auto") return next;
  for (const key of RECEIPT_CHANNEL_KEYS) {
    if (key !== changedChannel && next[key] === "auto") next[key] = "manual";
  }
  return next;
}

function normalizeReceiptSettingsByLine(raw: Partial<ReceiptSettingsByLine>): ReceiptSettingsByLine {
  const base = defaultReceiptSettingsByLine();
  for (const line of CHECKOUT_RECEIPT_LINES) {
    const entry = raw[line.id];
    const parsed = parseReceiptChannelsEntry(entry, line.id);
    if (parsed) {
      base[line.id] = enforceAutoMutex(parsed, "paper");
    } else if (typeof entry === "string" && isValidReceiptChannelMode(entry)) {
      base[line.id] = {
        paper: entry,
        electronicSms: DEFAULT_RECEIPT_CHANNEL,
        electronicEmail: DEFAULT_RECEIPT_CHANNEL,
      };
    }
  }
  return base;
}

function readLegacyReceiptSettingsByLine(): Partial<ReceiptSettingsByLine> {
  const out: Partial<ReceiptSettingsByLine> = {};
  const cdsToggle = readLegacyToggleOn(LEGACY_RECEIPT_SEQ_BY_LINE.cds);
  if (cdsToggle !== null) {
    out.cds = {
      paper: cdsToggle ? "manual" : "none",
      electronicSms: DEFAULT_RECEIPT_CHANNEL,
      electronicEmail: DEFAULT_RECEIPT_CHANNEL,
    };
  }
  for (const lineId of ["kiosk", "paypad"] as const) {
    const radioField = LEGACY_RECEIPT_RADIO_FIELD_BY_LINE[lineId];
    const fromRadio = normalizeLegacyReceiptMode(readModuleSettingRadio(radioField, ""));
    const toggle = readLegacyToggleOn(LEGACY_RECEIPT_SEQ_BY_LINE[lineId]);
    const legacyElectronic =
      fromRadio ?? (toggle === null ? null : toggle ? "manual" : "none");
    if (legacyElectronic !== null) {
      out[lineId] = {
        paper: DEFAULT_RECEIPT_CHANNEL,
        electronicSms: lineId === "kiosk" ? legacyElectronic : DEFAULT_RECEIPT_CHANNEL,
        electronicEmail: lineId === "paypad" ? legacyElectronic : DEFAULT_RECEIPT_CHANNEL,
      };
    }
  }
  return out;
}

function readFlatLegacyStorage(): Partial<ReceiptSettingsByLine> | null {
  const flat = readModuleSettingJson<Partial<Record<CheckoutReceiptLineId, string>>>(
    LEGACY_FLAT_RECEIPT_STORAGE_ID,
    {},
  );
  if (!flat || typeof flat !== "object" || Object.keys(flat).length === 0) return null;
  const out: Partial<ReceiptSettingsByLine> = {};
  for (const line of CHECKOUT_RECEIPT_LINES) {
    const v = flat[line.id];
    if (typeof v === "string" && isValidReceiptChannelMode(v)) {
      out[line.id] = {
        paper: v,
        electronicSms: DEFAULT_RECEIPT_CHANNEL,
        electronicEmail: DEFAULT_RECEIPT_CHANNEL,
      };
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

function migrateReceiptFromPrintCenterLegacy(): ReceiptSettingsByLine | null {
  const afterPay = readLegacyToggleOn(LEGACY_RECEIPT_AFTER_PAYMENT_SEQ);
  if (afterPay === null) return null;
  const migrated = defaultReceiptSettingsByLine();
  for (const line of CHECKOUT_RECEIPT_LINES) {
    migrated[line.id] = enforceAutoMutex(
      {
        ...migrated[line.id],
        paper: afterPay ? "auto" : migrated[line.id].paper,
      },
      "paper",
    );
  }
  return migrated;
}

export function readReceiptSettingsByLine(): ReceiptSettingsByLine {
  const raw = readModuleSettingJson<Partial<ReceiptSettingsByLine>>(RECEIPT_SETTINGS_STORAGE_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeReceiptSettingsByLine(raw);
  }
  const flatLegacy = readFlatLegacyStorage();
  if (flatLegacy) {
    const migrated = normalizeReceiptSettingsByLine(flatLegacy);
    writeModuleSettingJson(RECEIPT_SETTINGS_STORAGE_ID, migrated);
    return migrated;
  }
  const seqLegacy = readLegacyReceiptSettingsByLine();
  if (Object.keys(seqLegacy).length > 0) {
    const migrated = normalizeReceiptSettingsByLine(seqLegacy);
    writeModuleSettingJson(RECEIPT_SETTINGS_STORAGE_ID, migrated);
    return migrated;
  }
  const printCenterLegacy = migrateReceiptFromPrintCenterLegacy();
  if (printCenterLegacy) {
    writeModuleSettingJson(RECEIPT_SETTINGS_STORAGE_ID, printCenterLegacy);
    return printCenterLegacy;
  }
  return defaultReceiptSettingsByLine();
}

export function writeReceiptSettingsByLine(values: ReceiptSettingsByLine): void {
  writeModuleSettingJson(RECEIPT_SETTINGS_STORAGE_ID, normalizeReceiptSettingsByLine(values));
}

function defaultCardSlipCopies(): CardSlipCopiesByLine {
  return {
    merchantCopy: DEFAULT_RECEIPT_CHANNEL,
    customerCopy: DEFAULT_RECEIPT_CHANNEL,
  };
}

function defaultCardSlipSettingsByLine(): CardSlipSettingsByLine {
  const out = {} as CardSlipSettingsByLine;
  for (const line of CHECKOUT_RECEIPT_LINES) out[line.id] = defaultCardSlipCopies();
  return out;
}

function parseCardSlipCopiesEntry(raw: unknown): CardSlipCopiesByLine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    isValidReceiptChannelMode(String(o.merchantCopy ?? "")) &&
    isValidReceiptChannelMode(String(o.customerCopy ?? ""))
  ) {
    return {
      merchantCopy: o.merchantCopy as ReceiptChannelMode,
      customerCopy: o.customerCopy as ReceiptChannelMode,
    };
  }
  return null;
}

function cardSlipCopiesFromLegacy249(): CardSlipCopiesByLine | null {
  for (const fieldId of LEGACY_CARD_SLIP_COPY_RADIO_FIELDS) {
    const raw = readModuleSettingRadio(fieldId, "").trim().toLowerCase();
    if (!raw) continue;
    if (raw.includes("both") || raw.includes("双") || raw === "2") {
      return { merchantCopy: "auto", customerCopy: "auto" };
    }
    if (raw.includes("none") || raw.includes("不") || raw === "0") {
      return { merchantCopy: "none", customerCopy: "none" };
    }
    if (raw.includes("merchant") || raw.includes("商户")) {
      return { merchantCopy: "auto", customerCopy: "none" };
    }
    if (raw.includes("customer") || raw.includes("食客") || raw.includes("客户")) {
      return { merchantCopy: "none", customerCopy: "auto" };
    }
  }
  const toggle249 = readLegacyToggleOn(LEGACY_CARD_SLIP_COPY_MODE_SEQ);
  if (toggle249 === null) return null;
  return toggle249
    ? { merchantCopy: "auto", customerCopy: "auto" }
    : { merchantCopy: "none", customerCopy: "none" };
}

function migrateCardSlipFromPrintCenterLegacy(): CardSlipSettingsByLine | null {
  const copiesFrom249 = cardSlipCopiesFromLegacy249();
  const cardAuto = readLegacyToggleOn(LEGACY_CARD_RECEIPT_PRINT_SEQ);
  if (copiesFrom249 === null && cardAuto === null) return null;

  const perLine: CardSlipCopiesByLine =
    copiesFrom249 ??
    (cardAuto
      ? { merchantCopy: "auto", customerCopy: "auto" }
      : { merchantCopy: "none", customerCopy: "none" });

  const migrated = defaultCardSlipSettingsByLine();
  for (const line of CHECKOUT_RECEIPT_LINES) migrated[line.id] = { ...perLine };
  return migrated;
}

function normalizeCardSlipSettingsByLine(raw: Partial<CardSlipSettingsByLine>): CardSlipSettingsByLine {
  const base = defaultCardSlipSettingsByLine();
  for (const line of CHECKOUT_RECEIPT_LINES) {
    const parsed = parseCardSlipCopiesEntry(raw[line.id]);
    if (parsed) base[line.id] = parsed;
  }
  return base;
}

function readLegacyCardSlipSettingsByLine(): Partial<CardSlipSettingsByLine> {
  const merchantToggle = readLegacyToggleOn(LEGACY_CARD_SLIP_MERCHANT_SEQ);
  const customerToggle = readLegacyToggleOn(LEGACY_CARD_SLIP_CUSTOMER_SEQ);
  if (merchantToggle === null && customerToggle === null) return {};
  const toMode = (on: boolean | null): ReceiptChannelMode =>
    on === null ? DEFAULT_RECEIPT_CHANNEL : on ? "manual" : "none";
  return {
    paypad: {
      merchantCopy: toMode(merchantToggle),
      customerCopy: toMode(customerToggle),
    },
  };
}

export function readCardSlipSettingsByLine(): CardSlipSettingsByLine {
  const raw = readModuleSettingJson<Partial<CardSlipSettingsByLine>>(CARD_SLIP_SETTINGS_STORAGE_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeCardSlipSettingsByLine(raw);
  }
  const legacy = readLegacyCardSlipSettingsByLine();
  if (Object.keys(legacy).length > 0) {
    const migrated = normalizeCardSlipSettingsByLine(legacy);
    writeModuleSettingJson(CARD_SLIP_SETTINGS_STORAGE_ID, migrated);
    return migrated;
  }
  const printCenterLegacy = migrateCardSlipFromPrintCenterLegacy();
  if (printCenterLegacy) {
    writeModuleSettingJson(CARD_SLIP_SETTINGS_STORAGE_ID, printCenterLegacy);
    return printCenterLegacy;
  }
  return defaultCardSlipSettingsByLine();
}

export function writeCardSlipSettingsByLine(values: CardSlipSettingsByLine): void {
  writeModuleSettingJson(CARD_SLIP_SETTINGS_STORAGE_ID, normalizeCardSlipSettingsByLine(values));
}

function readLegacyTipPageByLine(): Partial<CheckoutUxToggleByLine> {
  const out: Partial<CheckoutUxToggleByLine> = {};
  for (const line of CHECKOUT_UX_LINES) {
    const legacy = readLegacyToggleOn(LEGACY_TIP_PAGE_SEQ_BY_LINE[line.id]);
    if (legacy !== null) out[line.id] = legacy;
  }
  return out;
}

function readLegacySignaturePageByLine(): Partial<CheckoutUxToggleByLine> {
  const out: Partial<CheckoutUxToggleByLine> = {};
  for (const line of CHECKOUT_UX_LINES) {
    const seq = LEGACY_SIGNATURE_PAGE_SEQ_BY_LINE[line.id];
    let legacy = readLegacyToggleOn(seq);
    if (line.id === "cds" && legacy === null) {
      legacy = readLegacyToggleOn(LEGACY_CDS_SIGNATURE_SEQ);
    }
    if (legacy !== null) out[line.id] = legacy;
  }
  return out;
}

function readToggleByLine(
  storageId: string,
  legacyReader: () => Partial<CheckoutUxToggleByLine>,
): CheckoutUxToggleByLine {
  const raw = readModuleSettingJson<Partial<CheckoutUxToggleByLine>>(storageId, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeCheckoutUxToggleByLine(raw, false);
  }
  const legacy = legacyReader();
  if (Object.keys(legacy).length > 0) {
    const migrated = normalizeCheckoutUxToggleByLine(legacy, false);
    writeModuleSettingJson(storageId, migrated);
    return migrated;
  }
  return defaultCheckoutUxToggleByLine(false);
}

export function readTipPageByLine(): CheckoutUxToggleByLine {
  return readToggleByLine(TIP_PAGE_STORAGE_ID, readLegacyTipPageByLine);
}

export function writeTipPageByLine(values: CheckoutUxToggleByLine): void {
  writeModuleSettingJson(TIP_PAGE_STORAGE_ID, normalizeCheckoutUxToggleByLine(values, false));
}

function defaultTipPageLineDetail(): TipPageLineDetail {
  return { showPercentAmount: false, showNoTip: true };
}

function defaultTipPageDetailByLine(): TipPageDetailByLine {
  return {
    cds: defaultTipPageLineDetail(),
    kiosk: defaultTipPageLineDetail(),
    paypad: defaultTipPageLineDetail(),
  };
}

function parseTipPageLineDetail(raw: unknown): TipPageLineDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    showPercentAmount: Boolean(o.showPercentAmount),
    showNoTip: o.showNoTip !== false,
  };
}

function readLegacyKioskTipPageDetailForLine(): Partial<TipPageDetailByLine> | null {
  const percentToggle = readLegacyToggleOn(LEGACY_KIOSK_SHOW_PERCENT_AMOUNT_SEQ);
  const noTipToggle = readLegacyToggleOn(LEGACY_KIOSK_SHOW_NO_TIP_SEQ);
  if (percentToggle === null && noTipToggle === null) return null;
  return {
    kiosk: {
      showPercentAmount: percentToggle ?? false,
      showNoTip: noTipToggle ?? true,
    },
  };
}

function readFlatLegacyKioskTipPageDetail(): Partial<TipPageDetailByLine> | null {
  const raw = readModuleSettingJson<Partial<TipPageLineDetail>>(LEGACY_KIOSK_TIP_PAGE_DETAIL_STORAGE_ID, {});
  const parsed = parseTipPageLineDetail(raw);
  if (!parsed) return null;
  return { kiosk: parsed };
}

export function readTipPageDetailByLine(): TipPageDetailByLine {
  const raw = readModuleSettingJson<Partial<TipPageDetailByLine>>(TIP_PAGE_DETAIL_BY_LINE_STORAGE_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    const base = defaultTipPageDetailByLine();
    for (const line of CHECKOUT_UX_LINES) {
      const parsed = parseTipPageLineDetail(raw[line.id]);
      if (parsed) base[line.id] = parsed;
    }
    return base;
  }
  const flatLegacy = readFlatLegacyKioskTipPageDetail();
  const seqLegacy = readLegacyKioskTipPageDetailForLine();
  const legacy = flatLegacy ?? seqLegacy;
  if (legacy) {
    const migrated = { ...defaultTipPageDetailByLine(), ...legacy };
    writeModuleSettingJson(TIP_PAGE_DETAIL_BY_LINE_STORAGE_ID, migrated);
    return migrated;
  }
  return defaultTipPageDetailByLine();
}

export function writeTipPageDetailByLine(values: TipPageDetailByLine): void {
  const base = defaultTipPageDetailByLine();
  for (const line of CHECKOUT_UX_LINES) {
    base[line.id] = {
      showPercentAmount: Boolean(values[line.id]?.showPercentAmount),
      showNoTip: values[line.id]?.showNoTip !== false,
    };
  }
  writeModuleSettingJson(TIP_PAGE_DETAIL_BY_LINE_STORAGE_ID, base);
}

/** @deprecated 使用 readTipPageDetailByLine().kiosk */
export function readKioskTipPageDetail(): TipPageLineDetail {
  return readTipPageDetailByLine().kiosk;
}

/** @deprecated 使用 writeTipPageDetailByLine */
export function writeKioskTipPageDetail(detail: TipPageLineDetail): void {
  const values = readTipPageDetailByLine();
  values.kiosk = detail;
  writeTipPageDetailByLine(values);
}

export function readSignaturePageByLine(): CheckoutUxToggleByLine {
  return readToggleByLine(SIGNATURE_PAGE_STORAGE_ID, readLegacySignaturePageByLine);
}

export function writeSignaturePageByLine(values: CheckoutUxToggleByLine): void {
  writeModuleSettingJson(SIGNATURE_PAGE_STORAGE_ID, normalizeCheckoutUxToggleByLine(values, false));
}

function syncToggleButton(btn: HTMLButtonElement): void {
  const on = btn.getAttribute("aria-checked") === "true";
  const knob = btn.querySelector("span[aria-hidden='true']");
  if (knob) {
    knob.classList.toggle("translate-x-5", on);
    knob.classList.toggle("translate-x-0.5", !on);
  }
  for (const cls of MODULE_SETTING_TOGGLE_TRACK_ON.split(/\s+/)) {
    btn.classList.toggle(cls, on);
  }
  for (const cls of MODULE_SETTING_TOGGLE_TRACK_OFF.split(/\s+/)) {
    btn.classList.toggle(cls, !on);
  }
  const group = btn.closest("[data-module-setting-toggle-group]");
  const offLabel = group?.querySelector("[data-toggle-off-label]");
  const onLabel = group?.querySelector("[data-toggle-on-label]");
  if (offLabel) {
    offLabel.className = on ? "text-xs text-muted-foreground" : "text-xs font-medium text-foreground";
  }
  if (onLabel) {
    onLabel.className = on ? "text-xs font-medium text-foreground" : "text-xs text-muted-foreground";
  }
}

function renderLineToggleSwitch(options: {
  editorKind: "tip-page" | "signature-page";
  lineId: CheckoutUxLineId;
  lineLabel: string;
  on: boolean;
}): string {
  const trackClass = options.on ? MODULE_SETTING_TOGGLE_TRACK_ON : MODULE_SETTING_TOGGLE_TRACK_OFF;
  const knobClass = options.on ? "translate-x-5" : "translate-x-0.5";
  return `
    <div class="flex shrink-0 items-center gap-2" data-module-setting-toggle-group>
      <span data-toggle-off-label class="${options.on ? "text-xs text-muted-foreground" : "text-xs font-medium text-foreground"}">关</span>
      <button
        type="button"
        role="switch"
        aria-checked="${options.on ? "true" : "false"}"
        aria-label="${escapeHtml(options.lineLabel)} ${options.editorKind === "tip-page" ? "展示小费页" : "展示签名页"}"
        data-checkout-ux-toggle="${escapeHtml(options.editorKind)}"
        data-checkout-ux-line="${escapeHtml(options.lineId)}"
        class="module-setting-toggle relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${trackClass}"
      >
        <span class="pointer-events-none block size-5 ${knobClass} ${MODULE_SETTING_TOGGLE_KNOB} rounded-full transition-transform duration-200" aria-hidden="true"></span>
      </button>
      <span data-toggle-on-label class="${options.on ? "text-xs font-medium text-foreground" : "text-xs text-muted-foreground"}">开</span>
    </div>`;
}

function renderToggleByLineTableHtml(options: {
  editorKind: "tip-page" | "signature-page";
  editorAttr: string;
  valueHeader: string;
  values: CheckoutUxToggleByLine;
}): string {
  const rows = CHECKOUT_UX_LINES.map(
    (line) => `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm text-foreground">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderLineToggleSwitch({
          editorKind: options.editorKind,
          lineId: line.id,
          lineLabel: line.label,
          on: options.values[line.id],
        })}
      </td>
    </tr>`,
  ).join("");

  return `
    <div ${options.editorAttr} class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[16rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium">产线</th>
              <th class="px-3 py-2 font-medium">${escapeHtml(options.valueHeader)}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function isCdsCheckoutTipPageSeq(seq: number): boolean {
  return seq === CDS_CHECKOUT_TIP_PAGE_SEQ;
}

export function isCdsCheckoutSignaturePageSeq(seq: number): boolean {
  return seq === CDS_CHECKOUT_SIGNATURE_PAGE_SEQ;
}

export function isCdsCheckoutReceiptSeq(seq: number): boolean {
  return seq === CDS_CHECKOUT_RECEIPT_SEQ;
}

export function isCdsCheckoutCardSlipSeq(seq: number): boolean {
  return seq === CDS_CHECKOUT_CARD_SLIP_SEQ;
}

export function renderCdsCheckoutGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      配置客显 / Kiosk / PayPad 结账流程：<strong>小费页 → 收取方式 → 刷卡顺序 → 签名 → 小票 → 签购单</strong>，各产线可独立设置。
      小费预设见「小费」<strong>237</strong>；签名金额门槛见「卡付规则与加价」<strong>243</strong>。现金班结见财务中心。
    </p>`;
}

export function renderCdsCheckoutTipPagePanelHtml(): string {
  return `
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      原 seq <strong>492</strong>（Kiosk）、<strong>662</strong>（PayPad）已合并。
      预设小费选项维护于「小费」<strong>237</strong>；下方 <strong>493</strong> 配置各产线收取方式（固定/百分比）。
      下方分两项：原 <strong>494</strong>「展示百分比小费的具体金额」、原 <strong>496</strong>「展示 No Tip」，均按产线配置。
    </p>`;
}

export function renderCdsCheckoutSignaturePagePanelHtml(): string {
  return `
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      原 seq <strong>497</strong>（Kiosk）、<strong>664</strong>（PayPad）、客显 <strong>8</strong> 已合并。
      低于「卡付规则与加价」<strong>243</strong> 产线门槛时可跳过（若门槛 &gt; 0）。
    </p>`;
}

export function renderTipPageByLineTableHtml(): string {
  const tipPageTable = renderToggleByLineTableHtml({
    editorKind: "tip-page",
    editorAttr: "data-checkout-tip-page-matrix",
    valueHeader: "展示小费页",
    values: readTipPageByLine(),
  });
  return `
    <div data-checkout-tip-page-editor class="space-y-4">
      ${tipPageTable}
      ${renderTipPageDetailByLineHtml()}
    </div>`;
}

function syncTipPageDetailToggleButton(btn: HTMLButtonElement): void {
  const on = btn.getAttribute("aria-checked") === "true";
  const knob = btn.querySelector("span[aria-hidden='true']");
  if (knob) {
    knob.classList.toggle("translate-x-5", on);
    knob.classList.toggle("translate-x-0.5", !on);
  }
  for (const cls of MODULE_SETTING_TOGGLE_TRACK_ON.split(/\s+/)) {
    btn.classList.toggle(cls, on);
  }
  for (const cls of MODULE_SETTING_TOGGLE_TRACK_OFF.split(/\s+/)) {
    btn.classList.toggle(cls, !on);
  }
  const group = btn.closest("[data-module-setting-toggle-group]");
  const offLabel = group?.querySelector("[data-toggle-off-label]");
  const onLabel = group?.querySelector("[data-toggle-on-label]");
  if (offLabel) {
    offLabel.className = on ? "text-xs text-muted-foreground" : "text-xs font-medium text-foreground";
  }
  if (onLabel) {
    onLabel.className = on ? "text-xs font-medium text-foreground" : "text-xs text-muted-foreground";
  }
}

function renderTipPageDetailToggleSwitch(options: {
  lineId: CheckoutUxLineId;
  field: "showPercentAmount" | "showNoTip";
  checked: boolean;
  disabled: boolean;
  label: string;
}): string {
  const dataAttr =
    options.field === "showPercentAmount"
      ? "data-tip-page-show-percent-amount"
      : "data-tip-page-show-no-tip";
  const trackClass = options.checked ? MODULE_SETTING_TOGGLE_TRACK_ON : MODULE_SETTING_TOGGLE_TRACK_OFF;
  const knobClass = options.checked ? "translate-x-5" : "translate-x-0.5";
  return `
    <div class="flex shrink-0 items-center gap-2 ${options.disabled ? "opacity-50" : ""}" data-module-setting-toggle-group>
      <span data-toggle-off-label class="${options.checked ? "text-xs text-muted-foreground" : "text-xs font-medium text-foreground"}">关</span>
      <button
        type="button"
        role="switch"
        aria-checked="${options.checked ? "true" : "false"}"
        class="group inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${trackClass} ${options.disabled ? "cursor-not-allowed" : "cursor-pointer"}"
        ${dataAttr}
        data-tip-page-detail-line="${escapeHtml(options.lineId)}"
        ${options.disabled ? "disabled" : ""}
        aria-label="${escapeHtml(options.label)}"
      >
        <span
          aria-hidden="true"
          class="inline-block h-5 w-5 rounded-full transition-transform duration-200 ${MODULE_SETTING_TOGGLE_KNOB} ${knobClass}"
        ></span>
      </button>
      <span data-toggle-on-label class="${options.checked ? "text-xs font-medium text-foreground" : "text-xs text-muted-foreground"}">开</span>
    </div>`;
}

function renderTipPageDetailLineTable(options: {
  rowAttr: string;
  valueHeader: string;
  field: "showPercentAmount" | "showNoTip";
  isRowDisabled: (lineId: CheckoutUxLineId) => boolean;
  isInputDisabled: (lineId: CheckoutUxLineId) => boolean;
}): string {
  const details = readTipPageDetailByLine();
  const rows = CHECKOUT_UX_LINES.map((line) => {
    const detail = details[line.id];
    const rowDisabled = options.isRowDisabled(line.id);
    const inputDisabled = options.isInputDisabled(line.id);
    const checked =
      options.field === "showPercentAmount" ? detail.showPercentAmount : detail.showNoTip;
    return `
    <tr class="border-t border-border ${rowDisabled ? "opacity-50" : ""}" ${options.rowAttr}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm text-foreground">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderTipPageDetailToggleSwitch({
          lineId: line.id,
          field: options.field,
          checked,
          disabled: inputDisabled,
          label: `${line.label} ${options.valueHeader}`,
        })}
      </td>
    </tr>`;
  }).join("");

  return `
      <div class="overflow-x-auto rounded-md border border-border bg-background">
        <table class="w-full min-w-[18rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">${escapeHtml(options.valueHeader)}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
}

export function renderTipPageDetailByLineHtml(): string {
  const tipPageOn = readTipPageByLine();
  const collectionModes = readTipCollectionModeByLine();

  const percentTable = renderTipPageDetailLineTable({
    rowAttr: "data-tip-page-percent-row",
    valueHeader: "展示",
    field: "showPercentAmount",
    isRowDisabled: (lineId) => !tipPageOn[lineId] || collectionModes[lineId] !== "percent",
    isInputDisabled: (lineId) => !tipPageOn[lineId] || collectionModes[lineId] !== "percent",
  });

  const noTipTable = renderTipPageDetailLineTable({
    rowAttr: "data-tip-page-no-tip-row",
    valueHeader: "展示",
    field: "showNoTip",
    isRowDisabled: (lineId) => !tipPageOn[lineId],
    isInputDisabled: (lineId) => !tipPageOn[lineId],
  });

  return `
    <div data-tip-page-detail-by-line class="space-y-4">
      <div class="rounded-md border border-border bg-muted/20 p-3">
        <p class="mb-1 text-sm font-semibold text-foreground">展示百分比小费的具体金额</p>
        <p class="mb-3 text-xs leading-relaxed text-muted-foreground">
          原 seq <strong>494</strong>。仅当对应产线「展示小费页」为开且「小费政策」<strong>493</strong> 为「百分比」时生效。
        </p>
        ${percentTable}
      </div>
      <div class="rounded-md border border-border bg-muted/20 p-3">
        <p class="mb-1 text-sm font-semibold text-foreground">展示 No Tip</p>
        <p class="mb-3 text-xs leading-relaxed text-muted-foreground">
          原 seq <strong>496</strong>。仅当对应产线「展示小费页」为开时生效，与收取方式无关。
        </p>
        ${noTipTable}
      </div>
    </div>`;
}

function syncTipPageDetailByLineState(editor: HTMLElement): void {
  const tipPageOn = readTipPageByLine();
  const collectionModes = readTipCollectionModeByLine();
  for (const line of CHECKOUT_UX_LINES) {
    const lineOn = tipPageOn[line.id];
    const percentDisabled = !lineOn || collectionModes[line.id] !== "percent";
    editor
      .querySelectorAll<HTMLButtonElement>(
        `[data-tip-page-detail-line="${line.id}"][data-tip-page-show-percent-amount]`,
      )
      .forEach((btn) => {
        btn.disabled = percentDisabled;
        btn.classList.toggle("cursor-not-allowed", percentDisabled);
        btn.classList.toggle("cursor-pointer", !percentDisabled);
      });
    editor
      .querySelectorAll<HTMLButtonElement>(
        `[data-tip-page-detail-line="${line.id}"][data-tip-page-show-no-tip]`,
      )
      .forEach((btn) => {
        btn.disabled = !lineOn;
        btn.classList.toggle("cursor-not-allowed", !lineOn);
        btn.classList.toggle("cursor-pointer", lineOn);
      });
    editor
      .querySelector<HTMLElement>(`[data-tip-page-percent-row="${line.id}"]`)
      ?.classList.toggle("opacity-50", percentDisabled);
    editor
      .querySelector<HTMLElement>(`[data-tip-page-no-tip-row="${line.id}"]`)
      ?.classList.toggle("opacity-50", !lineOn);
  }
}

function collectTipPageDetailByLineFromEditor(editor: HTMLElement): TipPageDetailByLine {
  const values = readTipPageDetailByLine();
  for (const line of CHECKOUT_UX_LINES) {
    const percent = editor.querySelector<HTMLButtonElement>(
      `[data-tip-page-detail-line="${line.id}"][data-tip-page-show-percent-amount]`,
    );
    const noTip = editor.querySelector<HTMLButtonElement>(
      `[data-tip-page-detail-line="${line.id}"][data-tip-page-show-no-tip]`,
    );
    values[line.id] = {
      showPercentAmount:
        percent !== null
          ? percent.getAttribute("aria-checked") === "true"
          : values[line.id].showPercentAmount,
      showNoTip:
        noTip !== null ? noTip.getAttribute("aria-checked") === "true" : values[line.id].showNoTip,
    };
  }
  return values;
}

export function renderSignaturePageByLineTableHtml(): string {
  return renderToggleByLineTableHtml({
    editorKind: "signature-page",
    editorAttr: "data-checkout-signature-page-editor",
    valueHeader: "展示签名页",
    values: readSignaturePageByLine(),
  });
}

export function renderCdsCheckoutReceiptPanelHtml(): string {
  return `
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      按 <strong>POS / CDS / Kiosk / PayPad</strong> 配置<strong>纸质小票</strong>、<strong>电子小票（短信）</strong>、<strong>电子小票（邮箱）</strong>三通道。
      同一产线<strong>仅允许一个通道为「自动」</strong>。原 <strong>260</strong>（支付后自动打印）并入纸质「自动打印」；<strong>501/665</strong> 并入短信/邮箱通道。
    </p>`;
}

export function renderCdsCheckoutCardSlipPanelHtml(): string {
  return `
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      按 <strong>POS / CDS / Kiosk / PayPad</strong> 配置信用卡<strong>纸质签购单</strong>：商户联与客户联可分别选手动/自动/不打印。
      原打印中心 <strong>245、249</strong> 与硬件 <strong>670</strong> 已并入本项。
    </p>`;
}

function hasPeerAuto(channels: ReceiptChannelsByLine, except: ReceiptChannelKey): boolean {
  return RECEIPT_CHANNEL_KEYS.some((key) => key !== except && channels[key] === "auto");
}

function renderReceiptChannelRadios(options: {
  lineId: CheckoutReceiptLineId;
  lineLabel: string;
  channel: ReceiptChannelKey;
  channelLabel: string;
  mode: ReceiptChannelMode;
  channels: ReceiptChannelsByLine;
  optionList: readonly { value: ReceiptChannelMode; label: string }[];
}): string {
  const groupName = `receipt-${options.channel}-${options.lineId}`;
  const peerAuto = hasPeerAuto(options.channels, options.channel);
  const radios = options.optionList
    .map((opt) => {
      const checked = options.mode === opt.value;
      const disableAuto = opt.value === "auto" && peerAuto;
      return `
        <label class="inline-flex items-center gap-1.5 text-sm ${disableAuto ? "cursor-not-allowed opacity-50" : "cursor-pointer text-foreground"}">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            ${disableAuto ? "disabled" : ""}
            data-receipt-line="${escapeHtml(options.lineId)}"
            data-receipt-channel="${escapeHtml(options.channel)}"
            aria-label="${escapeHtml(options.lineLabel)} ${escapeHtml(options.channelLabel)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    })
    .join("");
  return `
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-3" role="radiogroup" aria-label="${escapeHtml(options.lineLabel)} ${escapeHtml(options.channelLabel)}">${radios}</div>`;
}

export function renderReceiptPrintByLineTableHtml(): string {
  const values = readReceiptSettingsByLine();
  const rows = CHECKOUT_RECEIPT_LINES.flatMap((line) => {
    const channels = values[line.id];
    return RECEIPT_CHANNEL_ROWS.map((row, index) => {
      const optionList = row.key === "paper" ? PAPER_RECEIPT_OPTIONS : ELECTRONIC_RECEIPT_OPTIONS;
      const lineCell =
        index === 0
          ? `<td class="px-3 py-2.5 text-sm text-foreground align-top" rowspan="${RECEIPT_CHANNEL_ROWS.length}">${escapeHtml(line.label)}</td>`
          : "";
      return `
    <tr class="${index === 0 ? "border-t border-border" : "border-t border-border/60"}">
      ${lineCell}
      <td class="px-3 py-2 text-xs font-medium text-muted-foreground align-top">${escapeHtml(row.label)}</td>
      <td class="px-3 py-2.5">
        ${renderReceiptChannelRadios({
          lineId: line.id,
          lineLabel: line.label,
          channel: row.key,
          channelLabel: row.label,
          mode: channels[row.key],
          channels,
          optionList,
        })}
      </td>
    </tr>`;
    });
  }).join("");

  return `
    <div data-receipt-settings-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[7.5rem]">通道</th>
              <th class="px-3 py-2 font-medium">输出方式</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderCardSlipCopyRadios(options: {
  lineId: CheckoutReceiptLineId;
  lineLabel: string;
  copy: CardSlipCopyKey;
  copyLabel: string;
  mode: ReceiptChannelMode;
}): string {
  const groupName = `card-slip-${options.copy}-${options.lineId}`;
  const radios = CARD_SLIP_PRINT_OPTIONS.map((opt) => {
    const checked = options.mode === opt.value;
    return `
        <label class="inline-flex items-center gap-1.5 text-sm cursor-pointer text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-card-slip-line="${escapeHtml(options.lineId)}"
            data-card-slip-copy="${escapeHtml(options.copy)}"
            aria-label="${escapeHtml(options.lineLabel)} ${escapeHtml(options.copyLabel)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
  }).join("");
  return `
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-3" role="radiogroup" aria-label="${escapeHtml(options.lineLabel)} ${escapeHtml(options.copyLabel)}">${radios}</div>`;
}

export function renderCardSlipByLineTableHtml(): string {
  const values = readCardSlipSettingsByLine();
  const rows = CHECKOUT_RECEIPT_LINES.flatMap((line) => {
    const copies = values[line.id];
    return CARD_SLIP_COPY_ROWS.map((row, index) => {
      const lineCell =
        index === 0
          ? `<td class="px-3 py-2.5 text-sm text-foreground align-top" rowspan="${CARD_SLIP_COPY_ROWS.length}">${escapeHtml(line.label)}</td>`
          : "";
      return `
    <tr class="${index === 0 ? "border-t border-border" : "border-t border-border/60"}">
      ${lineCell}
      <td class="px-3 py-2 text-xs font-medium text-muted-foreground align-top">${escapeHtml(row.label)}</td>
      <td class="px-3 py-2.5">
        ${renderCardSlipCopyRadios({
          lineId: line.id,
          lineLabel: line.label,
          copy: row.key,
          copyLabel: row.label,
          mode: copies[row.key],
        })}
      </td>
    </tr>`;
    });
  }).join("");

  return `
    <div data-card-slip-settings-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[10rem]">联次</th>
              <th class="px-3 py-2 font-medium">输出方式</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function setCardSlipCopyValue(
  values: CardSlipSettingsByLine,
  lineId: CheckoutReceiptLineId,
  copy: CardSlipCopyKey,
  value: ReceiptChannelMode,
): void {
  values[lineId][copy] = value;
}

function collectCardSlipSettingsFromRoot(root: ParentNode): CardSlipSettingsByLine {
  const stored = readCardSlipSettingsByLine();
  const values: CardSlipSettingsByLine = defaultCardSlipSettingsByLine();
  for (const line of CHECKOUT_RECEIPT_LINES) {
    values[line.id] = { ...stored[line.id] };
  }
  root.querySelectorAll<HTMLInputElement>("[data-card-slip-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute("data-card-slip-line") as CheckoutReceiptLineId | null;
    const copy = input.getAttribute("data-card-slip-copy") as CardSlipCopyKey | null;
    const value = input.value;
    if (!lineId || !copy || !isValidReceiptChannelMode(value)) return;
    setCardSlipCopyValue(values, lineId, copy, value);
  });
  return values;
}

function setReceiptChannelValue(
  values: ReceiptSettingsByLine,
  lineId: CheckoutReceiptLineId,
  channel: ReceiptChannelKey,
  value: ReceiptChannelMode,
): void {
  values[lineId][channel] = value;
}

function enforceAutoMutexForLine(
  values: ReceiptSettingsByLine,
  lineId: CheckoutReceiptLineId,
  changedChannel: ReceiptChannelKey,
): void {
  values[lineId] = enforceAutoMutex({ ...values[lineId] }, changedChannel);
}

function collectReceiptSettingsFromRoot(root: ParentNode): ReceiptSettingsByLine {
  const stored = readReceiptSettingsByLine();
  const values: ReceiptSettingsByLine = defaultReceiptSettingsByLine();
  for (const line of CHECKOUT_RECEIPT_LINES) {
    values[line.id] = { ...stored[line.id] };
  }
  let changedLineId: CheckoutReceiptLineId | null = null;
  let changedChannel: ReceiptChannelKey | null = null;

  root.querySelectorAll<HTMLInputElement>("[data-receipt-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute("data-receipt-line") as CheckoutReceiptLineId | null;
    const channel = input.getAttribute("data-receipt-channel") as ReceiptChannelKey | null;
    const value = input.value;
    if (!lineId || !channel || !isValidReceiptChannelMode(value)) return;
    setReceiptChannelValue(values, lineId, channel, value);
    changedLineId = lineId;
    changedChannel = channel;
  });

  if (changedLineId !== null && changedChannel !== null) {
    enforceAutoMutexForLine(values, changedLineId, changedChannel);
  }

  return values;
}

function applyReceiptSettingsToEditor(editor: HTMLElement, values: ReceiptSettingsByLine): void {
  for (const line of CHECKOUT_RECEIPT_LINES) {
    for (const channel of RECEIPT_CHANNEL_KEYS) {
      const mode = values[line.id][channel];
      editor
        .querySelectorAll<HTMLInputElement>(
          `[data-receipt-line="${line.id}"][data-receipt-channel="${channel}"]`,
        )
        .forEach((input) => {
          input.checked = input.value === mode;
        });
    }
  }
}

function syncReceiptAutoMutexUi(editor: HTMLElement): void {
  const values = readReceiptSettingsByLine();
  for (const line of CHECKOUT_RECEIPT_LINES) {
    const channels = values[line.id];
    for (const channel of RECEIPT_CHANNEL_KEYS) {
      const peerAuto = hasPeerAuto(channels, channel);
      editor
        .querySelectorAll<HTMLInputElement>(
          `[data-receipt-line="${line.id}"][data-receipt-channel="${channel}"][value="auto"]`,
        )
        .forEach((input) => {
          input.disabled = peerAuto;
          input.closest("label")?.classList.toggle("cursor-not-allowed", peerAuto);
          input.closest("label")?.classList.toggle("opacity-50", peerAuto);
          input.closest("label")?.classList.toggle("cursor-pointer", !peerAuto);
        });
    }
  }
}

function collectToggleByLineFromRoot(
  root: ParentNode,
  editorKind: "tip-page" | "signature-page",
): CheckoutUxToggleByLine {
  const values =
    editorKind === "tip-page" ? readTipPageByLine() : readSignaturePageByLine();
  root.querySelectorAll<HTMLButtonElement>(`[data-checkout-ux-toggle="${editorKind}"]`).forEach((btn) => {
    const lineId = btn.getAttribute("data-checkout-ux-line") as CheckoutUxLineId | null;
    if (!lineId) return;
    values[lineId] = btn.getAttribute("aria-checked") === "true";
  });
  return values;
}

function bindToggleByLineEditor(
  root: ParentNode,
  selector: string,
  editorKind: "tip-page" | "signature-page",
  persist: (values: CheckoutUxToggleByLine) => void,
): void {
  root.querySelectorAll<HTMLElement>(selector).forEach((editor) => {
    const boundKey =
      editorKind === "tip-page" ? "checkoutTipPageEditorBound" : "checkoutSignaturePageEditorBound";
    if (editor.dataset[boundKey] === "1") return;
    editor.dataset[boundKey] = "1";
    editor.querySelectorAll<HTMLButtonElement>(`[data-checkout-ux-toggle="${editorKind}"]`).forEach((btn) => {
      if (btn.dataset.checkoutUxToggleBound === "1") return;
      btn.dataset.checkoutUxToggleBound = "1";
      btn.addEventListener("click", () => {
        const next = btn.getAttribute("aria-checked") !== "true";
        btn.setAttribute("aria-checked", next ? "true" : "false");
        syncToggleButton(btn);
        persist(collectToggleByLineFromRoot(editor, editorKind));
      });
    });
  });
}

export function bindCdsCheckoutEditors(root: ParentNode = document): void {
  bindToggleByLineEditor(root, "[data-checkout-tip-page-editor]", "tip-page", (values) => {
    writeTipPageByLine(values);
    root.querySelectorAll<HTMLElement>("[data-checkout-tip-page-editor]").forEach(syncTipPageDetailByLineState);
  });
  bindToggleByLineEditor(
    root,
    "[data-checkout-signature-page-editor]",
    "signature-page",
    writeSignaturePageByLine,
  );

  root.querySelectorAll<HTMLElement>("[data-checkout-tip-page-editor]").forEach((editor) => {
    if (editor.dataset.tipPageDetailByLineBound === "1") return;
    editor.dataset.tipPageDetailByLineBound = "1";
    syncTipPageDetailByLineState(editor);
    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>(
        "[data-tip-page-show-percent-amount], [data-tip-page-show-no-tip]",
      );
      if (btn) {
        if (btn.disabled) return;
        const next = btn.getAttribute("aria-checked") !== "true";
        btn.setAttribute("aria-checked", next ? "true" : "false");
        syncTipPageDetailToggleButton(btn);
        writeTipPageDetailByLine(collectTipPageDetailByLineFromEditor(editor));
        syncTipPageDetailByLineState(editor);
      }
    });
  });

  root.querySelectorAll<HTMLElement>("[data-receipt-settings-editor]").forEach((editor) => {
    if (editor.dataset.receiptSettingsEditorBound === "1") return;
    editor.dataset.receiptSettingsEditorBound = "1";
    const persistAndSync = () => {
      const values = collectReceiptSettingsFromRoot(editor);
      writeReceiptSettingsByLine(values);
      applyReceiptSettingsToEditor(editor, values);
      syncReceiptAutoMutexUi(editor);
    };
    editor.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).matches("[data-receipt-line]")) persistAndSync();
    });
    syncReceiptAutoMutexUi(editor);
  });

  root.querySelectorAll<HTMLElement>("[data-card-slip-settings-editor]").forEach((editor) => {
    if (editor.dataset.cardSlipSettingsEditorBound === "1") return;
    editor.dataset.cardSlipSettingsEditorBound = "1";
    editor.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).matches("[data-card-slip-line]")) {
        writeCardSlipSettingsByLine(collectCardSlipSettingsFromRoot(editor));
      }
    });
  });
}
