/**
 * 前厅 · 按产线视图：主开关 ↔ 当前产线在 lines 存储中的启用状态（P2）
 */
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  getDefaultModuleSettingToggleOn,
  moduleSettingToggleStorageKey,
} from "./module-settings-toggle-ui";
import {
  FOH_LINE_SCOPE_BY_SEQ,
  fohSeqAppliesToLine,
  type FohLineNavId,
} from "./foh-settings-line-scope";
import { FOH_LINE_STORAGE_BY_SEQ, hasFohLineStorage } from "./foh-settings-line-storage-registry";
import {
  FOH_LINE_CONFIG_ROW_ATTR,
  getActiveFohByLineIdFromDom,
  getFohActiveLineFilterId,
  getFohByLineRenderContext,
  isFohByLinePanelSuppressed,
  isFohLineConfigRowVisible,
  setFohByLineRenderContext,
} from "./foh-settings-by-line-filter";

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
  const raw = readGlobalToggleRaw(seq);
  if (raw === null) return getDefaultModuleSettingToggleOn(seq);
  return raw;
}

function scopeLineIds(seq: number): string[] {
  const entry = FOH_LINE_SCOPE_BY_SEQ[seq];
  if (!entry) return [];
  return entry.lines.filter((l) => l !== "store-wide");
}

function readStoredLines(seq: number): string[] {
  const storageId = FOH_LINE_STORAGE_BY_SEQ[seq];
  if (!storageId) return [];
  const raw = readModuleSettingJson<unknown>(storageId, null);
  if (!Array.isArray(raw)) return [];
  const valid = new Set(scopeLineIds(seq));
  return raw.filter((id): id is string => typeof id === "string" && valid.has(id));
}

function writeStoredLines(seq: number, lines: string[]): void {
  const storageId = FOH_LINE_STORAGE_BY_SEQ[seq];
  if (!storageId) return;
  const order = scopeLineIds(seq);
  const unique = order.filter((id) => lines.includes(id));
  writeModuleSettingJson(storageId, unique);
}

function migrateLinesFromGlobalToggle(seq: number): string[] {
  if (!readGlobalToggleOn(seq)) return [];
  const scope = scopeLineIds(seq);
  if (scope.length > 0) {
    writeStoredLines(seq, scope);
    return scope;
  }
  return [];
}

/** 按产线视图下：主开关 = 当前产线是否在 lines 存储中启用 */
export function readFohByLineToggleState(seq: number, lineId: FohLineNavId): boolean {
  if (!fohSeqAppliesToLine(seq, lineId)) return false;

  if (lineId === "store-wide") {
    return readGlobalToggleOn(seq);
  }

  if (hasFohLineStorage(seq)) {
    const lines = readStoredLines(seq);
    if (lines.length > 0) return lines.includes(lineId);
    return migrateLinesFromGlobalToggle(seq).includes(lineId);
  }

  return readGlobalToggleOn(seq);
}

export function writeFohByLineToggleState(seq: number, lineId: FohLineNavId, on: boolean): void {
  if (!fohSeqAppliesToLine(seq, lineId)) return;

  if (lineId === "store-wide" || !hasFohLineStorage(seq)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), on ? "1" : "0");
    } catch {
      /* ignore */
    }
    return;
  }

  let lines = readStoredLines(seq);
  if (lines.length === 0 && readGlobalToggleOn(seq)) {
    lines = migrateLinesFromGlobalToggle(seq);
  }

  if (on) {
    if (!lines.includes(lineId)) lines = [...lines, lineId];
  } else {
    lines = lines.filter((id) => id !== lineId);
  }
  writeStoredLines(seq, lines);

  try {
    localStorage.setItem(moduleSettingToggleStorageKey(seq), lines.length > 0 ? "1" : "0");
  } catch {
    /* ignore */
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

/** 隐藏「适用产线（多选）」区域，保留按产线子配置（如 217/218 布局表） */
export function applyFohByLineUiSuppressions(root: ParentNode = document): void {
  const container =
    root instanceof Document
      ? root.querySelector<HTMLElement>("[data-foh-by-line-view]")
      : (root as ParentNode).querySelector?.("[data-foh-by-line-view]") ??
        (root instanceof HTMLElement && root.hasAttribute("data-foh-by-line-view") ? root : null);
  if (!container || !(container instanceof HTMLElement)) return;

  const lineId = container.getAttribute("data-foh-by-line-view");
  const lineLabel = lineId ? (LINE_LABEL_BY_ID[lineId] ?? lineId) : null;

  container.querySelectorAll("p").forEach((p) => {
    if (p.textContent?.trim() !== "适用产线（多选）") return;
    p.classList.add("hidden");
    let sib = p.nextElementSibling;
    while (sib) {
      if (sib.matches('[role="group"]') || sib.hasAttribute("data-pos-menu-scope-lines")) {
        sib.classList.add("hidden");
        sib.setAttribute("aria-hidden", "true");
        sib = sib.nextElementSibling;
        continue;
      }
      if (
        sib.matches("p") &&
        sib.classList.contains("text-muted-foreground") &&
        sib.classList.contains("text-xs")
      ) {
        sib.classList.add("hidden");
        break;
      }
      break;
    }
  });

  container.querySelectorAll<HTMLElement>('[role="group"][aria-label*="适用产线"]').forEach((group) => {
    const wrap = group.parentElement;
    if (wrap?.querySelector("p")?.textContent?.trim() === "适用产线（多选）") return;
    group.classList.add("hidden");
    group.setAttribute("aria-hidden", "true");
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

