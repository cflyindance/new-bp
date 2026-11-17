export type IntervalUnit = "minutes" | "seconds";
export function intervalDisplayValue(seconds: number, unit: IntervalUnit): number {
  return unit === "minutes" ? Number((seconds / 60).toFixed(6)) : seconds;
}
export function intervalSeconds(value: unknown, unit: IntervalUnit, min: number, max: number, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number * (unit === "minutes" ? 60 : 1)))) : fallback;
}
export function formatIntervalDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60), remainder = seconds % 60;
  return minutes && remainder ? `${minutes} 分 ${remainder} 秒` : minutes ? `${minutes} 分钟` : `${remainder} 秒`;
}

export function combineIntervalParts(minutes: unknown, seconds: unknown, min: number, max: number, fallback: number): number {
  const m = Number(minutes), s = Number(seconds);
  return Number.isFinite(m) && Number.isFinite(s) ? Math.min(max, Math.max(min, Math.max(0, Math.round(m)) * 60 + Math.max(0, Math.round(s)))) : fallback;
}
