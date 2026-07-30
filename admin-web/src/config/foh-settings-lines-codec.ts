/**
 * 前厅 · 适用产线数组的存储编解码。
 *
 * 值形态 `{ v: 1, lines: [...] }`：结构体存在本身即代表「商户已配置」，
 * 因此空数组唯一地表示「全部产线关闭」，不需要额外的播种标记。
 *
 * 裸数组为存量形态：非空视为已配置；空数组无法区分「从没配过」与「全部关闭」，
 * 按未配置处理，避免升级后存量门店的功能突然全部关闭。
 */
import { FOH_LINE_SCOPE_BY_SEQ } from "./foh-settings-line-scope";
import { FOH_LINE_STORAGE_BY_SEQ } from "./foh-settings-line-storage-registry";

export const FOH_LINES_VALUE_VERSION = 1;

export interface FohLinesStoredValue {
  v: typeof FOH_LINES_VALUE_VERSION;
  lines: string[];
}

/** `-by-line` 后缀是按产线的对象配置（如 517/652/653），不走本编解码 */
const MANAGED_FIELD_SUFFIX = "-lines";

const SEQ_BY_FIELD_ID: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const [seq, fieldId] of Object.entries(FOH_LINE_STORAGE_BY_SEQ)) {
    if (!fieldId.endsWith(MANAGED_FIELD_SUFFIX)) continue;
    if (map[fieldId] === undefined) map[fieldId] = Number(seq);
  }
  return map;
})();

export function isFohLinesFieldId(fieldId: string): boolean {
  return Object.prototype.hasOwnProperty.call(SEQ_BY_FIELD_ID, fieldId);
}

export function fohLinesSeqForFieldId(fieldId: string): number | undefined {
  return SEQ_BY_FIELD_ID[fieldId];
}

/** 该 seq 允许的产线（不含全店通用） */
export function fohLinesScopeForSeq(seq: number): string[] {
  const entry = FOH_LINE_SCOPE_BY_SEQ[seq];
  if (!entry) return [];
  return entry.lines.filter((id) => id !== "store-wide");
}

export function fohLinesScopeForFieldId(fieldId: string): string[] {
  const seq = SEQ_BY_FIELD_ID[fieldId];
  return seq === undefined ? [] : fohLinesScopeForSeq(seq);
}

export type FohLinesDecoded =
  | { state: "configured"; lines: string[] }
  | { state: "unconfigured" }
  /** 既非结构体也非数组，交回原值由调用方自行处理 */
  | { state: "foreign" };

/**
 * 只做去重与类型收敛，不按矩阵过滤。
 * 各模块的产线选项与矩阵可能存在细微差异，在此过滤会静默丢数据。
 */
function normalizeLines(raw: unknown[]): string[] {
  const out: string[] = [];
  for (const id of raw) {
    if (typeof id !== "string" || id === "") continue;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export function decodeFohLinesValue(raw: unknown): FohLinesDecoded {
  if (raw === null || raw === undefined) return { state: "unconfigured" };
  if (Array.isArray(raw)) {
    if (raw.length === 0) return { state: "unconfigured" };
    return { state: "configured", lines: normalizeLines(raw) };
  }
  if (typeof raw === "object") {
    const candidate = raw as Partial<FohLinesStoredValue>;
    if (candidate.v === FOH_LINES_VALUE_VERSION && Array.isArray(candidate.lines)) {
      return { state: "configured", lines: normalizeLines(candidate.lines) };
    }
  }
  return { state: "foreign" };
}

export function encodeFohLinesValue(lines: readonly string[]): FohLinesStoredValue {
  return { v: FOH_LINES_VALUE_VERSION, lines: normalizeLines([...lines]) };
}

/** 未配置时的默认：矩阵内全部产线开启，与按产线视图的既有表现一致 */
export function resolveFohLinesFromDecoded(fieldId: string, decoded: FohLinesDecoded): string[] {
  if (decoded.state === "configured") return decoded.lines;
  return fohLinesScopeForFieldId(fieldId);
}
