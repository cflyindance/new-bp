/**
 * 前厅 · 适用产线数组的读写入口。
 *
 * 「按场景」的多选组与「按产线」的开关是同一份 lines 数组的两种投影，
 * 两个视图都必须经过这里，避免各自维护状态导致漂移。
 */
import { readModuleSettingJsonRaw, writeModuleSettingJson } from "./module-settings-form-ui";
import { FOH_LINE_STORAGE_BY_SEQ } from "./foh-settings-line-storage-registry";
import {
  decodeFohLinesValue,
  fohLinesScopeForSeq,
  isFohLinesFieldId,
} from "./foh-settings-lines-codec";

function fieldIdForSeq(seq: number): string | undefined {
  const fieldId = FOH_LINE_STORAGE_BY_SEQ[seq];
  if (!fieldId || !isFohLinesFieldId(fieldId)) return undefined;
  return fieldId;
}

/**
 * `undefined` 表示商户未配置过；`[]` 表示全部产线关闭。
 * 调用方若只关心生效结果，用 `resolveFohLines`。
 */
export function readFohLines(seq: number): string[] | undefined {
  const fieldId = fieldIdForSeq(seq);
  if (!fieldId) return undefined;
  /** 必须读原值：解码后的「已配置为空」与「未配置」都会呈现为空数组 */
  const decoded = decodeFohLinesValue(readModuleSettingJsonRaw(fieldId));
  return decoded.state === "configured" ? decoded.lines : undefined;
}

export function isFohLinesConfigured(seq: number): boolean {
  return readFohLines(seq) !== undefined;
}

/** 生效的产线集合；未配置时按矩阵全选，且不落盘 */
export function resolveFohLines(seq: number): string[] {
  return readFohLines(seq) ?? fohLinesScopeForSeq(seq);
}

/** 写入后该 seq 即视为已配置，空数组会被持久化为「全部关闭」 */
export function writeFohLines(seq: number, lines: readonly string[]): void {
  const fieldId = fieldIdForSeq(seq);
  if (!fieldId) return;
  const order = fohLinesScopeForSeq(seq);
  const known = order.filter((id) => lines.includes(id));
  const extra = lines.filter((id) => !order.includes(id));
  writeModuleSettingJson(fieldId, [...known, ...extra]);
}

export function fohLinesScope(seq: number): string[] {
  return fohLinesScopeForSeq(seq);
}
