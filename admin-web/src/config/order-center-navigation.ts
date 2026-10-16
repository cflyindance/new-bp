import type { ModuleSettingCatalogGroup } from "./module-settings-catalog";

export function orderPresetSeq(path: string): number | undefined {
  path = path.split(/[?#]/)[0].replace(/\/$/, "");
  if (path === "/orders/discounts" || path.startsWith("/orders/discounts/")) return 446;
  if (path === "/orders/surcharges" || path.startsWith("/orders/surcharges/")) return 447;
  return undefined;
}

/** New business entries inherit the existing settings entitlement. */
export function orderCenterGateId(id: string): string {
  return id === "orders-discounts" || id === "orders-surcharges" ? "orders-settings" : id;
}

/** Called after per-item permission, subscription and preset filtering. */
export function orderCenterViewGroups(groups: ModuleSettingCatalogGroup[], path: string): ModuleSettingCatalogGroup[] {
  const seq = orderPresetSeq(path);
  if (seq) return groups.map(g => ({ ...g, groupTitle: seq === 446 ? "折扣管理" : "附加费与服务费", items: g.items.filter(i => i.seq === seq) })).filter(g => g.items.length);
  const result = groups.map(g => ({ ...g, groupTitle: g.groupKey === "order-basics" ? "订单基础与单号" : g.groupTitle, items: g.items.filter(i => i.seq !== 446 && i.seq !== 447) })).filter(g => g.items.length);
  const pricingKeys = ["order-discount", "order-surcharge-fees", "order-settlement-rounding"];
  const pricing = result.filter(g => pricingKeys.includes(g.groupKey)).flatMap(g => g.items);
  return [...result.filter(g => !pricingKeys.includes(g.groupKey)), ...(pricing.length ? [{ groupKey: "order-pricing", groupTitle: "金额与结算", items: pricing }] : [])];
}

export function orderCenterLegacyRedirect(path: string, hash: string): string | undefined {
  if (!path.startsWith("/orders/settings")) return undefined;
  const anchor = hash.replace(/^#/, "").split("#")[1];
  const seq = path.match(/\/s(446|447)(?:\/|$)/)?.[1] ?? anchor?.match(/^s(446|447)-/)?.[1];
  if (seq) return `${seq === "446" ? "/orders/discounts" : "/orders/surcharges"}${anchor ? `#${anchor}` : ""}`;
  if (/^\/orders\/settings\/(order-discount|order-surcharge-fees|order-surcharge|order-settlement-rounding|order-settlement)(?:\/|$)/.test(path)) {
    const suffix = path.replace(/^\/orders\/settings\/[^/]+/, "");
    return `/orders/settings/order-pricing${suffix}${anchor ? `#${anchor}` : ""}`;
  }
  return undefined;
}
