import type { BrandMenuStructureByLine } from "../config/brand-menu-structure-picker-ui";

export const promotionTypes = {
  gift: "买A赠B",
  quantity: "M件N折",
  order: "满减折扣",
  exchange: "加价换购",
} as const;

export type PromotionType = keyof typeof promotionTypes;
export type Products = BrandMenuStructureByLine;
export interface Campaign {
  id: string;
  type: PromotionType;
  enabled: boolean;
  fields: Record<string, string>;
  purchase?: Products;
  reward?: Products;
}
export interface PromotionConfiguration {
  activeType: PromotionType | "";
  campaigns: Campaign[];
}

const textFields = ["name", "en", "zh"];

export function validateCampaign(campaign: Campaign, configuration: PromotionConfiguration): [string, string] | undefined {
  const { fields: f, type } = campaign;
  for (const key of textFields) {
    if (!f[key]?.trim()) return [key, "请输入此字段。"];
  }
  if (!!f.startDate !== !!f.endDate || (f.startDate && f.startDate > f.endDate)) {
    return ["endDate", "请填写成对日期，结束日期不得早于开始日期。"];
  }
  if (!!f.startTime !== !!f.endTime || (f.startTime && f.startTime >= f.endTime)) {
    return ["endTime", "请填写同一天的起止时间，结束时间须晚于开始时间。"];
  }
  if (!f.startDate && !f.days && !f.startTime) return ["startDate", "请至少设置日期、星期或时段之一。"];

  const hasProducts = (products?: Products) => !!products && Object.values(products).some(keys => keys.some(key => key.startsWith("d:")));
  const count = (key: string) => /^[1-9]\d*$/.test(f[key] ?? "") && Number.isSafeInteger(Number(f[key]));
  const decimal = (key: string) => /^\d+(\.\d{1,2})?$/.test(f[key] ?? "") && Number.isFinite(Number(f[key]));
  const byItems = type === "gift" || type === "quantity" || (type === "exchange" && f.condition === "items");
  if (byItems && !count("quantity")) return ["quantity", "请输入正整数件数。"];
  if (byItems && !hasProducts(campaign.purchase)) return ["purchase", "请至少选择一个购买商品。"];
  if ((type === "order" || (type === "exchange" && !byItems)) &&
      (!decimal("threshold") || (type === "order" && !Number.isInteger(Number(f.threshold))))) {
    return ["threshold", "请输入有效的订单门槛金额。"];
  }
  if (type === "gift" || type === "exchange") {
    if (!count("limit")) return ["limit", "请输入正整数件数。"];
    if (!hasProducts(campaign.reward)) return ["reward", "请至少选择一个优惠商品。"];
  }
  if (type !== "gift") {
    if (!f.discountKind && type !== "quantity") return ["discountKind", "请选择优惠类型。"];
    if (!decimal("discount") || Number(f.discount) <= 0) return ["discount", "请输入大于 0 的有效优惠值。"];
    if ((type === "quantity" || f.discountKind === "percent") && Number(f.discount) > 100) return ["discount", "优惠比例不得超过 100%。"];
    if (type === "order" && f.discountKind === "fixed" && Number(f.discount) > Number(f.threshold)) return ["discount", "固定减免不得超过门槛。"];
  }
  if (type === "order" && f.useCode === "yes") {
    if (!f.codeName?.trim()) return ["codeName", "请输入促销码名称。"];
    if (!f.code?.trim()) return ["code", "请输入促销码。"];
    if (configuration.campaigns.some(other => other.id !== campaign.id && other.type === "order" && other.fields.useCode === "yes" && other.fields.code === f.code)) {
      return ["code", "此促销码已被使用。"];
    }
  }
}

export const promotionStatuses = ["进行中", "已结束", "待开始"] as const;
export type PromotionStatus = (typeof promotionStatuses)[number];

function dateKey(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(n => String(n).padStart(2, "0")).join("-");
}

export function scheduleStatus(campaign: Campaign, activeType: PromotionConfiguration["activeType"], now = new Date()): PromotionStatus | null {
  if (!campaign.enabled || campaign.type !== activeType) return null;

  const { startDate, endDate, startTime, endTime, days } = campaign.fields;
  const today = dateKey(now);
  if (endDate && today > endDate) return "已结束";

  const time = [now.getHours(), now.getMinutes()].map(n => String(n).padStart(2, "0")).join(":");
  const weekdays = days ? new Set(days.split(",")) : null;
  if ((!startDate || today >= startDate) && (!weekdays || weekdays.has(String(now.getDay()))) &&
      (!startTime || (time >= startTime && time < endTime))) {
    return "进行中";
  }

  const candidate = startDate && today < startDate
    ? new Date(startDate + "T00:00:00")
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() + (endTime && time >= endTime ? 1 : 0));
  // A weekly schedule repeats within seven calendar days.
  for (let offset = 0; offset < 7; offset++) {
    if (endDate && dateKey(candidate) > endDate) break;
    if (!weekdays || weekdays.has(String(candidate.getDay()))) return "待开始";
    candidate.setDate(candidate.getDate() + 1);
  }
  return "已结束";
}
