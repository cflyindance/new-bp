import { BRAND_MENU_STRUCTURE_BY_LINE, dishKey, emptyBrandMenuStructureByLine } from "../config/brand-menu-structure-picker-ui";
import type { Campaign, Products, PromotionConfiguration } from "./domain";

const kioskMenu = BRAND_MENU_STRUCTURE_BY_LINE.kiosk;

function kioskProducts(...ids: string[]): Products {
  const result = emptyBrandMenuStructureByLine();
  result.kiosk = kioskMenu.flatMap(group => group.categories.flatMap(category =>
    category.dishes.filter(dish => ids.includes(dish.id)).map(dish => dishKey(group.id, category.id, dish.id)),
  ));
  return result;
}

function relativeDate(today: Date, days: number): string {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(part => String(part).padStart(2, "0")).join("-");
}

export function createPromotionDemo(now = new Date()): PromotionConfiguration {
  const dateRange = (start: number, end: number) => ({ startDate: relativeDate(now, start), endDate: relativeDate(now, end) });
  const current = dateRange(-7, 14);
  const campaign = (
    id: string, type: Campaign["type"], name: string, en: string,
    fields: Campaign["fields"], selection: Pick<Campaign, "purchase" | "reward"> = {}, enabled = true,
  ): Campaign => ({ id: `promo-demo-${id}`, type, enabled, fields: { name, zh: name, en, ...current, ...fields }, ...selection });

  return {
    activeType: "order",
    campaigns: [
      campaign("dinner-bundle", "gift", "双人火锅 · 点两份肉送饮品", "Hot Pot for Two", {
        mode: "any", quantity: "2", rewardMode: "any", limit: "1", startTime: "17:00", endTime: "21:30",
      }, { purchase: kioskProducts("d-beef-premium", "d-pork-belly"), reward: kioskProducts("d-cola", "d-juice") }),
      campaign("tea-refill", "gift", "热茶同款 · 买两杯赠一杯", "Buy Two Teas, Get One", {
        mode: "same", quantity: "2", rewardMode: "same", limit: "1", days: "1,2,3,4,5",
      }, { purchase: kioskProducts("d-tea"), reward: kioskProducts("d-tea") }),
      campaign("coffee-round", "quantity", "好友拼单 · 美式每满三杯优惠一杯", "Americano Group Offer", {
        mode: "same", quantity: "3", discount: "30", frequency: "each",
      }, { purchase: kioskProducts("d-coffee") }),
      campaign("vegetable-pair", "quantity", "素菜自由搭 · 满两份优惠一份", "Mix and Match Vegetables", {
        mode: "any", quantity: "2", discount: "20", frequency: "once",
      }, { purchase: kioskProducts("d-lettuce", "d-tofu", "d-mushroom") }),
      campaign("house-order", "order", "整单优惠 · 满 $50 减 $8", "Save $8 on $50", {
        threshold: "50", discountKind: "fixed", discount: "8", firstOrder: "no", useCode: "no",
      }),
      campaign("first-visit", "order", "首次到店 · 满 $25 减 15%", "First Order: 15% Off", {
        threshold: "25", discountKind: "percent", discount: "15", firstOrder: "yes", useCode: "no",
      }),
      campaign("table-code", "order", "桌贴专享 · 满 $35 减 $5", "Table QR: Save $5", {
        threshold: "35", discountKind: "fixed", discount: "5", firstOrder: "no",
        useCode: "yes", codeName: "堂食桌贴优惠", code: "TABLE5",
      }),
      campaign("drink-addon", "exchange", "火锅加饮 · 订单满 $35 换购", "Drink Add-on on $35", {
        condition: "amount", rewardMode: "any", threshold: "35", limit: "1", discountKind: "fixed", discount: "2",
      }, { reward: kioskProducts("d-cola", "d-juice") }),
      campaign("tofu-addon", "exchange", "肉菜加配 · 买两份肉换购豆腐", "Tofu Add-on with Two Meats", {
        condition: "items", mode: "any", quantity: "2", rewardMode: "same", limit: "1", discountKind: "percent", discount: "50",
      }, { purchase: kioskProducts("d-beef-premium", "d-combo-1"), reward: kioskProducts("d-tofu") }),
      campaign("opening-week", "order", "新店开业周 · 满 $40 减 $6", "Opening Week: Save $6", {
        ...dateRange(3, 10), threshold: "40", discountKind: "fixed", discount: "6", firstOrder: "no", useCode: "no",
      }),
      campaign("anniversary", "order", "店庆返场 · 满 $80 减 12%", "Anniversary: 12% Off", {
        ...dateRange(-20, -2), threshold: "80", discountKind: "percent", discount: "12", firstOrder: "no", useCode: "no",
      }),
      campaign("weekly-special", "order", "每周指定日 · 满 $45 减 $5", "Weekly Offer: Save $5", {
        days: String((now.getDay() + 1) % 7), threshold: "45", discountKind: "fixed", discount: "5", firstOrder: "no", useCode: "no",
      }),
      campaign("takeout-code", "order", "自取回馈 · 满 $30 减 $4", "Pickup Code: Save $4", {
        threshold: "30", discountKind: "fixed", discount: "4", firstOrder: "no",
        useCode: "yes", codeName: "自取回馈码", code: "PICKUP4",
      }, {}, false),
    ],
  };
}
