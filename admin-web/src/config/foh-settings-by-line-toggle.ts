/**
 * 前厅 · 按产线视图：主开关 ↔ 当前产线在 lines 存储中的启用状态（P2）
 */
import { readFohLines, writeFohLines } from "./foh-settings-lines-store";
import {
  getDefaultModuleSettingToggleOn,
  isFohHubSettingToggleSeq,
  moduleSettingToggleStorageKey,
} from "./module-settings-toggle-ui";
import {
  FOH_LINE_SCOPE_BY_SEQ,
  fohSeqAppliesToLine,
  type FohLineNavId,
} from "./foh-settings-line-scope";
import { hasFohLineStorage } from "./foh-settings-line-storage-registry";
import { isFohLinesToggleMirrorExcludedSeq } from "./module-settings-guest-menu-body-line-scope";
import {
  FOH_LINE_CONFIG_ROW_ATTR,
  getActiveFohByLineIdFromDom,
  getFohActiveLineFilterId,
  getFohByLineRenderContext,
  isFohByLinePanelSuppressed,
  isFohLineConfigRowVisible,
  setFohByLineRenderContext,
} from "./foh-settings-by-line-filter";
import {
  isPageBatchSavePath,
  readPageDraftFohToggleForCurrentPath,
  resolveCurrentPageSaveKey,
  resolvePageSaveKey,
} from "./page-settings-draft";
import {
  AUTO_LOGOUT_MINUTES_SEQ,
  readAutoLogoutByLine,
  syncAutoLogoutEnabledFromLines,
} from "./module-settings-pos-session-security-ui";
import {
  MAX_GUESTS_PER_ORDER_SEQ,
  readMaxGuestsByLine,
  syncMaxGuestsEnabledFromLines,
} from "./module-settings-max-guests-per-order-ui";
import {
  WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ,
  WAIT_TIME_DISPLAY_RANGE_SEQ,
  readWaitTimeDisplayCurrentOrderByLine,
  readWaitTimeDisplayRangeByLine,
  syncWaitTimeDisplayCurrentOrderEnabledFromLines,
  syncWaitTimeDisplayRangeEnabledFromLines,
} from "./module-settings-wait-time-display-ui";
import {
  isWaitTimeDisplayStyleSeq,
  readWaitTimeStyleEnabledLines,
  syncWaitTimeStyleEnabledFromLines,
  ensureWaitTimeStyleMigrated,
} from "./module-settings-wait-time-style-ui";
import {
  TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ,
  readServiceCallCooldownByLine,
  syncServiceCallCooldownEnabledFromLines,
} from "./module-settings-tableside-service-call-ui";
import {
  GUEST_MENU_DISH_NAME_FONT_SEQ,
  readDishNameFontByLine,
  syncDishNameFontEnabledFromLines,
} from "./module-settings-guest-menu-dish-name-font-ui";
import {
  ORDER_TIMEOUT_REMINDER_SEQ,
  readOrderTimeoutByLine,
  syncOrderTimeoutEnabledFromLines,
} from "./module-settings-order-timeout-reminder-ui";
import {
  CUSTOM_DIVIDER_NAME_SEQ,
  readCustomDividerByLine,
  syncCustomDividerEnabledFromLines,
} from "./module-settings-custom-divider-name-ui";
import {
  EMENU_CUSTOM_MESSAGE_SEQ,
  readEmenuCustomMessageByLine,
  syncEmenuCustomMessageEnabledFromLines,
} from "./module-settings-emenu-custom-message-ui";
import {
  GUEST_DINING_DURATION_LIMIT_SEQ,
  GUEST_DINING_DURATION_SEQS,
  isGuestDiningDurationLineLimitEnabled,
  readDiningDurationLimitByLine,
  syncDiningDurationLimitEnabledFromLines,
} from "./module-settings-guest-dining-duration-ui";

export {
  FOH_LINE_CONFIG_ROW_ATTR,
  getActiveFohByLineIdFromDom,
  getFohActiveLineFilterId,
  getFohByLineRenderContext,
  isFohByLinePanelSuppressed,
  isFohLineConfigRowVisible,
  setFohByLineRenderContext,
};

const FOH_LINE_CONFIG_BLOCK_SELECTORS: ReadonlyArray<{
  selector: string;
  lineIdAttr: string;
}> = [
  { selector: "[data-menu-image-mode-line-config]", lineIdAttr: "data-menu-image-mode-line-config" },
  { selector: "[data-dish-name-font-line-config]", lineIdAttr: "data-dish-name-font-line-config" },
  { selector: "[data-guest-dish-detail-line-row]", lineIdAttr: "data-guest-dish-detail-line-row" },
  { selector: "[data-product-remark-line-row]", lineIdAttr: "data-product-remark-line-row" },
  { selector: "[data-guest-menu-group-by-line-row]", lineIdAttr: "data-guest-menu-group-by-line-row" },
  { selector: "[data-order-type-row]", lineIdAttr: "data-order-type-row" },
  { selector: `[${FOH_LINE_CONFIG_ROW_ATTR}]`, lineIdAttr: FOH_LINE_CONFIG_ROW_ATTR },
];

function applyFohByLineLineConfigBlockFilters(container: HTMLElement, lineId: string): void {
  for (const { selector, lineIdAttr } of FOH_LINE_CONFIG_BLOCK_SELECTORS) {
    container.querySelectorAll<HTMLElement>(selector).forEach((block) => {
      const blockLineId = block.getAttribute(lineIdAttr);
      if (!blockLineId) return;
      const show = blockLineId === lineId;
      block.classList.toggle("hidden", !show);
      if (show) block.removeAttribute("aria-hidden");
      else block.setAttribute("aria-hidden", "true");
    });
  }
}

function readGlobalToggleRaw(seq: number): boolean | null {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(seq));
    if (raw === null) return null;
    return raw === "1";
  } catch {
    return null;
  }
}

function readGlobalToggleOn(seq: number): boolean {
  /** 前厅设置：全局主开关固定开启，空产线列表会迁移为全选 */
  if (isFohHubSettingToggleSeq(seq)) return true;
  const raw = readGlobalToggleRaw(seq);
  if (raw === null) return getDefaultModuleSettingToggleOn(seq);
  return raw;
}

function scopeLineIds(seq: number): string[] {
  const entry = FOH_LINE_SCOPE_BY_SEQ[seq];
  if (!entry) return [];
  return entry.lines.filter((l) => l !== "store-wide");
}

/** `undefined` = 未配置过；`[]` = 全部产线关闭 */
function readStoredLines(seq: number): string[] | undefined {
  const stored = readFohLines(seq);
  if (stored === undefined) return undefined;
  const valid = new Set(scopeLineIds(seq));
  return stored.filter((id) => valid.has(id));
}

function writeStoredLines(seq: number, lines: string[]): void {
  writeFohLines(seq, lines);
}

/** 未配置时的生效值：矩阵内全部产线开启，只读不落盘 */
function resolveLines(seq: number): string[] {
  return readStoredLines(seq) ?? scopeLineIds(seq);
}

/** 按产线视图下：主开关 = 当前产线是否在 lines 存储中启用 */
export function readFohByLineToggleState(seq: number, lineId: FohLineNavId): boolean {
  if (typeof window !== "undefined") {
    const pageKey = resolveCurrentPageSaveKey();
    if (isPageBatchSavePath(pageKey)) {
      const draft = readPageDraftFohToggleForCurrentPath(seq, lineId);
      if (draft !== undefined) return draft;
    }
  }

  if (!fohSeqAppliesToLine(seq, lineId)) return false;

  if (lineId === "store-wide") {
    return readGlobalToggleOn(seq);
  }

  if (seq === GUEST_DINING_DURATION_LIMIT_SEQ) {
    return isGuestDiningDurationLineLimitEnabled(lineId);
  }

  if (hasFohLineStorage(seq)) {
    if (seq === AUTO_LOGOUT_MINUTES_SEQ) {
      readAutoLogoutByLine();
    } else if (seq === MAX_GUESTS_PER_ORDER_SEQ) {
      readMaxGuestsByLine();
    } else if (seq === WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ) {
      readWaitTimeDisplayCurrentOrderByLine();
    } else if (seq === WAIT_TIME_DISPLAY_RANGE_SEQ) {
      readWaitTimeDisplayRangeByLine();
    } else if (isWaitTimeDisplayStyleSeq(seq)) {
      ensureWaitTimeStyleMigrated(seq);
      readWaitTimeStyleEnabledLines(seq);
    } else if (seq === TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ) {
      readServiceCallCooldownByLine();
    } else if (seq === GUEST_MENU_DISH_NAME_FONT_SEQ) {
      readDishNameFontByLine();
    } else if (seq === ORDER_TIMEOUT_REMINDER_SEQ) {
      readOrderTimeoutByLine();
    } else if (seq === CUSTOM_DIVIDER_NAME_SEQ) {
      readCustomDividerByLine();
    } else if (seq === EMENU_CUSTOM_MESSAGE_SEQ) {
      readEmenuCustomMessageByLine();
    }
    return resolveLines(seq).includes(lineId);
  }

  return readGlobalToggleOn(seq);
}

export function writeFohByLineToggleState(seq: number, lineId: FohLineNavId, on: boolean): void {
  /** 开单前换桌是三态值，禁止布尔入口绕过专用模式写入。 */
  if (seq === 643 || seq === 644) return;
  if (!fohSeqAppliesToLine(seq, lineId)) return;

  if (
    (GUEST_DINING_DURATION_SEQS as readonly number[]).includes(seq) &&
    !isGuestDiningDurationLineLimitEnabled(lineId)
  ) {
    return;
  }

  if (seq === GUEST_DINING_DURATION_LIMIT_SEQ) {
    const config = readDiningDurationLimitByLine();
    const lines = Object.entries(config)
      .filter(([, item]) => item.enabled)
      .map(([id]) => id);
    const nextLines = on
      ? lines.includes(lineId)
        ? lines
        : [...lines, lineId]
      : lines.filter((id) => id !== lineId);
    syncDiningDurationLimitEnabledFromLines(nextLines);
    return;
  }

  if (lineId === "store-wide" || !hasFohLineStorage(seq)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), on ? "1" : "0");
    } catch {
      /* ignore */
    }
    return;
  }

  let lines = resolveLines(seq);

  if (on) {
    if (!lines.includes(lineId)) lines = [...lines, lineId];
  } else {
    lines = lines.filter((id) => id !== lineId);
  }

  if (seq === AUTO_LOGOUT_MINUTES_SEQ) {
    syncAutoLogoutEnabledFromLines(lines);
  } else if (seq === MAX_GUESTS_PER_ORDER_SEQ) {
    syncMaxGuestsEnabledFromLines(lines);
  } else if (seq === WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ) {
    syncWaitTimeDisplayCurrentOrderEnabledFromLines(lines);
  } else if (seq === WAIT_TIME_DISPLAY_RANGE_SEQ) {
    syncWaitTimeDisplayRangeEnabledFromLines(lines);
  } else if (isWaitTimeDisplayStyleSeq(seq)) {
    syncWaitTimeStyleEnabledFromLines(seq, lines);
  } else if (seq === TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ) {
    syncServiceCallCooldownEnabledFromLines(lines);
  } else if (seq === GUEST_MENU_DISH_NAME_FONT_SEQ) {
    syncDishNameFontEnabledFromLines(lines);
  } else if (seq === ORDER_TIMEOUT_REMINDER_SEQ) {
    syncOrderTimeoutEnabledFromLines(lines);
  } else if (seq === CUSTOM_DIVIDER_NAME_SEQ) {
    syncCustomDividerEnabledFromLines(lines);
  } else if (seq === EMENU_CUSTOM_MESSAGE_SEQ) {
    syncEmenuCustomMessageEnabledFromLines(lines);
  } else {
    writeStoredLines(seq, lines);
  }

  if (!isFohLinesToggleMirrorExcludedSeq(seq)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), lines.length > 0 ? "1" : "0");
    } catch {
      /* ignore */
    }
  }
}

const LINE_LABEL_BY_ID: Record<string, string> = {
  pos: "POS",
  "pos-go": "POS GO",
  paypad: "PayPad",
  kiosk: "Kiosk",
  emenu: "eMenu",
  sdi: "SDI",
  "online-order": "Online Order",
  cds: "CDS",
};

/** 按产线视图：隐藏适用产线多选控件，保留按产线子配置（如 217/218 布局表） */
export function applyFohByLineUiSuppressions(root: ParentNode = document): void {
  const container =
    root instanceof Document
      ? root.querySelector<HTMLElement>("[data-foh-by-line-view]")
      : (root as ParentNode).querySelector?.("[data-foh-by-line-view]") ??
        (root instanceof HTMLElement && root.hasAttribute("data-foh-by-line-view") ? root : null);
  if (!container || !(container instanceof HTMLElement)) return;

  const lineId = container.getAttribute("data-foh-by-line-view");
  const lineLabel = lineId ? (LINE_LABEL_BY_ID[lineId] ?? lineId) : null;

  container.querySelectorAll<HTMLElement>('[role="group"][aria-label*="适用产线"]').forEach((group) => {
    group.classList.add("hidden");
    group.setAttribute("aria-hidden", "true");
  });

  container.querySelectorAll<HTMLElement>("[data-pos-menu-scope-lines]").forEach((el) => {
    el.classList.add("hidden");
    el.setAttribute("aria-hidden", "true");
  });

  if (lineId) {
    applyFohByLineLineConfigBlockFilters(container, lineId);

    container.querySelectorAll<HTMLElement>("table tbody tr").forEach((row) => {
      const rowLineId = row.getAttribute(FOH_LINE_CONFIG_ROW_ATTR);
      if (rowLineId) {
        const show = rowLineId === lineId;
        row.classList.toggle("hidden", !show);
        if (show) row.removeAttribute("aria-hidden");
        else row.setAttribute("aria-hidden", "true");
        return;
      }
      if (!lineLabel) return;
      const firstCell = row.querySelector("td, th");
      const label = firstCell?.textContent?.trim();
      if (label && label !== lineLabel && Object.values(LINE_LABEL_BY_ID).includes(label)) {
        row.classList.add("hidden");
        row.setAttribute("aria-hidden", "true");
      }
    });
  }
}
