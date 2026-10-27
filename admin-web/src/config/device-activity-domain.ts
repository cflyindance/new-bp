import {
  classifyActivity, dateNumber, periodOrders, type ActivityDataset, type ActivityDevice,
  type ActivityMetrics, type ActivityPeriod, type ActivityStore, type LicenseBinding, type ResolvedOrder,
} from "./merchant-activity-domain";

export interface DeviceActivityRow {
  device: ActivityDevice; current: LicenseBinding[]; binding: LicenseBinding | null;
  store: ActivityStore | null; history: LicenseBinding[]; metrics: ActivityMetrics;
  issue: "data" | "binding" | null;
}
export interface DeviceActivityFilters { brand: string; store: string; line: string; status: string; query: string; }
export function deviceLifetimeOrders(orders: ResolvedOrder[], id: string): ResolvedOrder[] {
  return orders.filter(order => order.binding?.deviceId === id);
}
export function globalDeviceRows(data: ActivityDataset, orders: ResolvedOrder[], period: ActivityPeriod): DeviceActivityRow[] {
  const end = data.asOf + "T23:59:59+08:00";
  const uniqueDevices = [...new Map(data.devices.map(device => [device.id, device])).values()];
  return uniqueDevices.map(device => {
    const history = data.bindings.filter(b => b.deviceId === device.id && b.from <= end);
    const current = history.filter(b => b.to === null || end < b.to);
    const binding = current.length === 1 ? current[0]! : null;
    const store = binding ? data.stores.find(s => s.id === binding.storeId) ?? null : null;
    const issue = current.length > 1 || binding && !store ? "binding" :
      history.some(b => data.stores.find(s => s.id === b.storeId)?.quality === "error") ? "data" : null;
    const all = deviceLifetimeOrders(orders, device.id);
    const selected = periodOrders(all, period);
    const latest = all.reduce<string | null>((value, order) => value === null || order.submittedAt > value ? order.submittedAt : value, null);
    const days = latest ? dateNumber(data.asOf) - dateNumber(latest.slice(0, 10)) : null;
    return {
      device, current, binding, store, history, issue,
      metrics: {
        status: classifyActivity(days, current.length > 0 || all.length > 0, issue !== null),
        count: issue ? null : selected.length,
        paid: issue ? null : selected.filter(o => o.status === "paid").length,
        cancelled: issue ? null : selected.filter(o => o.status === "cancelled").length,
        activeDays: issue ? null : new Set(selected.map(o => o.submittedAt.slice(0, 10))).size,
        dailyAverage: issue ? null : selected.length / (dateNumber(period.end) - dateNumber(period.start) + 1),
        latest: issue ? null : latest, daysSince: issue ? null : days,
        boundDevices: current.length > 0 ? 1 : 0,
        usedDevices: issue ? null : selected.length > 0 ? 1 : 0,
        unusedDevices: issue ? null : current.length > 0 && selected.length === 0 ? 1 : 0,
        unknown: issue ? null : 0,
      },
    };
  });
}
export function filterDeviceRows(rows: DeviceActivityRow[], filters: DeviceActivityFilters): DeviceActivityRow[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter(row => (!filters.brand || row.store?.merchantId === filters.brand) &&
    (!filters.store || row.store?.id === filters.store) &&
    (!filters.line || (filters.line === "__unbound" ? row.current.length === 0 : row.binding?.line === filters.line)) &&
    (!filters.status || row.metrics.status === filters.status) &&
    (!query || [row.device.id, row.device.name, ...row.current.map(b => b.licenseId)].join(" ").toLowerCase().includes(query)));
}
