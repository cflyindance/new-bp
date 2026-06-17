/**
 * 前厅设置 · 产线适用范围 SSOT
 * 由 generate-foh-line-scope-matrix.mjs 从 UI 模块抽取 + 手工补全生成 seed，再固化为本模块。
 * 供按产线视图侧栏过滤、列表 scope 标注与 catalog 校验共用。
 */
import seed from "./foh-settings-line-scope.seed.json" with { type: "json" };

/** 按产线侧栏顺序（含全店通用） */
export const FOH_LINE_NAV_ORDER = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
  { id: "cds", label: "CDS" },
  { id: "store-wide", label: "全店通用" },
];

/** @typedef {"ui-module"|"group-default"|"manual"|"store-wide"} FohLineScopeSource */

/**
 * @type {Record<number, { groupKey: string, lines: string[], source: FohLineScopeSource, module?: string }>}
 */
export const FOH_LINE_SCOPE_BY_SEQ = Object.fromEntries(
  Object.entries(seed).map(([seq, v]) => [Number(seq), v]),
);

/**
 * @param {number} seq
 * @param {string} lineId
 * @returns {boolean}
 */
export function fohSeqAppliesToLine(seq, lineId) {
  const entry = FOH_LINE_SCOPE_BY_SEQ[seq];
  if (!entry) return false;
  if (entry.lines.includes("store-wide")) return lineId === "store-wide";
  return entry.lines.includes(lineId);
}

/**
 * @param {string} lineId
 * @returns {number[]}
 */
export function fohSeqsForLine(lineId) {
  return Object.entries(FOH_LINE_SCOPE_BY_SEQ)
    .filter(([, v]) =>
      v.lines.includes("store-wide")
        ? lineId === "store-wide"
        : v.lines.includes(lineId),
    )
    .map(([seq]) => Number(seq))
    .sort((a, b) => a - b);
}
