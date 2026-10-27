import { PRODUCT_LINES, shiftDate, type ActivityDataset, type ActivityStore, type ProductLine } from "./merchant-activity-domain";

export function demoAsOf(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function createActivityDemo(asOf = demoAsOf()): ActivityDataset {
  const stores: ActivityStore[] = [
    { id: "demo-all", merchantId: "demo-a", merchantName: "禾味餐饮（演示）", name: "中央广场店", openedOn: shiftDate(asOf, -120), lines: [...PRODUCT_LINES], quality: "complete", scenario: "六条产线均有订单" },
    { id: "demo-mixed", merchantId: "demo-a", merchantName: "禾味餐饮（演示）", name: "滨江店", openedOn: shiftDate(asOf, -100), lines: ["POS", "Kiosk", "eMenu", "SDI", "POS GO"], quality: "complete", scenario: "部分产线长期未使用" },
    { id: "demo-uneven", merchantId: "demo-b", merchantName: "青禾小馆（演示）", name: "大学城店", openedOn: shiftDate(asOf, -100), lines: ["POS", "Kiosk", "OO"], quality: "complete", scenario: "Kiosk 绑定 5 台，近 7 天使用 3 台" },
    { id: "demo-stopped", merchantId: "demo-b", merchantName: "青禾小馆（演示）", name: "老街店", openedOn: shiftDate(asOf, -100), lines: ["POS", "eMenu"], quality: "complete", scenario: "最近点单距今 18 天" },
    { id: "demo-recent", merchantId: "demo-b", merchantName: "青禾小馆（演示）", name: "市集店", openedOn: shiftDate(asOf, -100), lines: ["POS", "Kiosk"], quality: "complete", scenario: "最近点单距今 9 天" },
    { id: "demo-long", merchantId: "demo-c", merchantName: "森野咖啡（演示）", name: "山麓店", openedOn: shiftDate(asOf, -100), lines: ["POS", "POS GO"], quality: "complete", scenario: "最近点单距今 40 天" },
    { id: "demo-new", merchantId: "demo-c", merchantName: "森野咖啡（演示）", name: "新城店", openedOn: shiftDate(asOf, -3), lines: ["POS", "Kiosk"], quality: "complete", scenario: "开通 3 天，尚未产生订单" },
    { id: "demo-unknown", merchantId: "demo-c", merchantName: "森野咖啡（演示）", name: "湖畔店", openedOn: shiftDate(asOf, -100), lines: ["POS", "OO"], quality: "complete", scenario: "含来源待识别订单" },
    { id: "demo-error", merchantId: "demo-c", merchantName: "森野咖啡（演示）", name: "机场店", openedOn: shiftDate(asOf, -100), lines: ["POS", "SDI"], quality: "error", scenario: "受控数据异常演示" },
  ];
  const data: ActivityDataset = { asOf, timezone: "Asia/Shanghai", stores, devices: [], bindings: [], orders: [] };
  let serial = 0;
  function orders(store: ActivityStore, deviceId: string | null, age: number, volume: number, span = 25): void {
    for (let day = age; day < Math.min(age + span, 90); day++) {
      for (let i = 0; i < volume + (day % 3); i++) {
        const n = ++serial;
        data.orders.push({ id: "DEMO-" + String(n).padStart(6, "0"), storeId: store.id, deviceId,
          submittedAt: shiftDate(asOf, -day) + "T" + String(10 + i % 10).padStart(2, "0") + ":" + String(i % 60).padStart(2, "0") + ":00+08:00",
          status: n % 11 === 0 ? "cancelled" : n % 5 === 0 ? "submitted" : "paid" });
      }
    }
  }
  for (const store of stores) {
    for (const line of store.lines) {
      const lineIndex = PRODUCT_LINES.indexOf(line);
      const count = store.id === "demo-uneven" && line === "Kiosk" ? 5 : store.id === "demo-all" ? (line === "Kiosk" ? 3 : 2) : 1;
      for (let i = 0; i < count; i++) {
        const id = store.id + "-" + line.replace(/ /g, "") + "-" + (i + 1);
        data.devices.push({ id, name: line + " 点单终端 " + String(i + 1).padStart(2, "0") });
        data.bindings.push({ licenseId: "LIC-" + id, deviceId: id, storeId: store.id, line,
          from: store.openedOn + "T00:00:00+08:00", to: null });
        if (store.id === "demo-new" || store.quality === "error" || store.id === "demo-mixed" && line === "POS GO") continue;
        let age = 0;
        if (store.id === "demo-mixed") age = ({ POS: 0, Kiosk: 9, eMenu: 18, SDI: 40 } as Partial<Record<ProductLine, number>>)[line] ?? 0;
        if (store.id === "demo-uneven" && line === "Kiosk" && i >= 3) age = i === 3 ? 10 : 32;
        if (store.id === "demo-stopped") age = 18;
        if (store.id === "demo-recent") age = 9;
        if (store.id === "demo-long") age = 40;
        orders(store, id, age, Math.max(1, 8 - lineIndex - i));
      }
    }
  }
  // Same physical device changed product line: half-open intervals preserve its historical origin.
  const switched = "demo-all-switched";
  data.devices.push({ id: switched, name: "移动点单终端（产线切换演示）" });
  data.bindings.push(
    { licenseId: "LIC-SWITCH-EMENU", deviceId: switched, storeId: "demo-all", line: "eMenu", from: shiftDate(asOf, -120) + "T00:00:00+08:00", to: shiftDate(asOf, -5) + "T00:00:00+08:00" },
    { licenseId: "LIC-SWITCH-GO", deviceId: switched, storeId: "demo-all", line: "POS GO", from: shiftDate(asOf, -5) + "T00:00:00+08:00", to: null },
  );
  orders(stores[0]!, switched, 9, 2, 2);
  orders(stores[0]!, switched, 1, 2, 2);
  orders(stores.find(s => s.id === "demo-unknown")!, null, 0, 2, 7);
  const original = data.orders[0]!;
  data.orders.push({ ...original }); // repeated delivery: one business order
  data.orders.push({ ...original, id: "DEMO-DRAFT", status: "draft" });
  return data;
}
