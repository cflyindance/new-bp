export const PRODUCT_LINES = ["POS", "Kiosk", "eMenu", "SDI", "OO", "POS GO"] as const;
export type ProductLine = typeof PRODUCT_LINES[number];
export type ActivityStatus = "active" | "recent" | "suspected" | "long" | "never" | "unconfigured" | "error";
export const STATUS_LABELS: Record<ActivityStatus, string> = {
  active: "活跃", recent: "近期未使用", suspected: "疑似停用", long: "长期未使用",
  never: "尚未使用", unconfigured: "未开通／未绑定", error: "数据异常",
};
export interface ActivityStore {
  id: string; merchantId: string; merchantName: string; name: string;
  openedOn: string; lines: ProductLine[]; quality: "complete" | "error"; scenario: string;
}
export interface ActivityDevice { id: string; name: string; }
export interface LicenseBinding {
  licenseId: string; deviceId: string; storeId: string; line: ProductLine;
  from: string; to: string | null;
}
export interface ActivityOrder {
  id: string; storeId: string; deviceId: string | null; submittedAt: string;
  status: "submitted" | "paid" | "cancelled" | "draft";
}
export interface ActivityDataset {
  asOf: string; timezone: "Asia/Shanghai"; stores: ActivityStore[];
  devices: ActivityDevice[]; bindings: LicenseBinding[]; orders: ActivityOrder[];
}
export interface ActivityPeriod { start: string; end: string; }
export interface ActivityScope { storeId: string; line?: ProductLine; deviceId?: string; }
export interface ResolvedOrder extends ActivityOrder { binding: LicenseBinding | null; }
export interface ActivityMetrics {
  status: ActivityStatus; count: number | null; paid: number | null; cancelled: number | null;
  activeDays: number | null; dailyAverage: number | null; latest: string | null; daysSince: number | null;
  boundDevices: number; usedDevices: number | null; unusedDevices: number | null; unknown: number | null;
}
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
export function dateNumber(date: string): number {
  if (!DATE_PATTERN.test(date)) throw Error("日期格式应为 YYYY-MM-DD");
  const n = Date.parse(date + "T00:00:00Z");
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== date) throw Error("日期无效");
  return n / DAY;
}
export function shiftDate(date: string, days: number): string {
  return new Date((dateNumber(date) + days) * DAY).toISOString().slice(0, 10);
}
export function validatePeriod(period: ActivityPeriod, asOf: string): string | null {
  try {
    if (dateNumber(period.start) > dateNumber(period.end)) return "开始日期不能晚于结束日期";
    if (dateNumber(period.end) > dateNumber(asOf)) return "结束日期不能晚于统计截至日期";
    if (dateNumber(period.start) < dateNumber(shiftDate(asOf, -89))) return "演示数据仅支持最近 90 天";
    return null;
  } catch { return "请输入有效的开始日期和结束日期"; }
}
export function classifyActivity(days: number | null, configured = true, error = false): ActivityStatus {
  if (error) return "error";
  if (!configured) return "unconfigured";
  if (days === null) return "never";
  if (days < 7) return "active";
  if (days < 14) return "recent";
  if (days < 30) return "suspected";
  return "long";
}
function endOf(date: string): string { return date + "T23:59:59+08:00"; }
export function resolveOrders(data: ActivityDataset): ResolvedOrder[] {
  const orders = new Map<string, ActivityOrder>();
  for (const order of data.orders) {
    if (order.status === "draft" || order.submittedAt > endOf(data.asOf)) continue;
    // ID is the original business order ID; replayed delivery/payment events do not add orders.
    const key = order.storeId + ":" + order.id;
    if (!orders.has(key)) orders.set(key, order);
  }
  return [...orders.values()].map(order => {
    const matches = data.bindings.filter(binding =>
      binding.deviceId === order.deviceId && binding.storeId === order.storeId &&
      binding.from <= order.submittedAt && (binding.to === null || order.submittedAt < binding.to));
    return { ...order, binding: matches.length === 1 ? matches[0]! : null };
  });
}
export function currentBindings(data: ActivityDataset, scope: ActivityScope): LicenseBinding[] {
  const at = endOf(data.asOf);
  return data.bindings.filter(b => b.storeId === scope.storeId && (!scope.line || b.line === scope.line) &&
    (!scope.deviceId || b.deviceId === scope.deviceId) && b.from <= at && (!b.to || at < b.to));
}
export function scopeOrders(orders: ResolvedOrder[], scope: ActivityScope): ResolvedOrder[] {
  return orders.filter(o => o.storeId === scope.storeId &&
    (!scope.line || o.binding?.line === scope.line) && (!scope.deviceId || o.binding?.deviceId === scope.deviceId));
}
export function periodOrders(orders: ResolvedOrder[], period: ActivityPeriod): ResolvedOrder[] {
  return orders.filter(o => o.submittedAt.slice(0, 10) >= period.start && o.submittedAt.slice(0, 10) <= period.end);
}
export function summarizeActivity(data: ActivityDataset, orders: ResolvedOrder[], scope: ActivityScope, period: ActivityPeriod): ActivityMetrics {
  const store = data.stores.find(s => s.id === scope.storeId);
  if (!store) throw Error("门店不存在");
  const bindings = currentBindings(data, scope);
  const bound = new Set(bindings.map(b => b.deviceId));
  const all = scopeOrders(orders, scope);
  const selected = periodOrders(all, period);
  const latest = all.reduce<string | null>((v, o) => v === null || o.submittedAt > v ? o.submittedAt : v, null);
  const daysSince = latest ? dateNumber(data.asOf) - dateNumber(latest.slice(0, 10)) : null;
  const configured = scope.deviceId ? all.length > 0 || bindings.length > 0 : scope.line ? store.lines.includes(scope.line) : true;
  const error = store.quality === "error";
  const used = new Set(selected.filter(o => o.binding).map(o => o.binding!.deviceId));
  const usedBound = [...bound].filter(id => used.has(id)).length;
  return {
    status: classifyActivity(daysSince, configured, error),
    count: error ? null : selected.length,
    paid: error ? null : selected.filter(o => o.status === "paid").length,
    cancelled: error ? null : selected.filter(o => o.status === "cancelled").length,
    activeDays: error ? null : new Set(selected.map(o => o.submittedAt.slice(0, 10))).size,
    dailyAverage: error ? null : selected.length / (dateNumber(period.end) - dateNumber(period.start) + 1),
    latest: error ? null : latest, daysSince: error ? null : daysSince,
    boundDevices: bound.size, usedDevices: error ? null : used.size, unusedDevices: error ? null : bound.size - usedBound,
    unknown: error ? null : selected.filter(o => !o.binding).length,
  };
}
export function devicesForScope(data: ActivityDataset, orders: ResolvedOrder[], scope: ActivityScope, period: ActivityPeriod): ActivityDevice[] {
  const ids = new Set(currentBindings(data, scope).map(b => b.deviceId));
  periodOrders(scopeOrders(orders, scope), period).forEach(o => { if (o.binding) ids.add(o.binding.deviceId); });
  return data.devices.filter(d => ids.has(d.id));
}
