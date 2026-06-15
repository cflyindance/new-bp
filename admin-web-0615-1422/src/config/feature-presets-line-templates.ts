/**
 * 产线组合键模板 — 仅用于 materialize 业态×产线变体与引导 Step 2 展示
 * 非独立预设层；运行时只读 BUSINESS_PRODUCT_LINE_VARIANTS
 */
import type { FeatureTier, ProductLineTag } from "./feature-registry";
import type { PresetFeatureEntry } from "./feature-presets";

function f(featureId: string, tier: FeatureTier = "recommended"): PresetFeatureEntry {
  return { featureId, tier };
}

export interface ProductLineKeyTemplate {
  id: string;
  title: string;
  titleEn: string;
  productLines: ProductLineTag[];
  features: PresetFeatureEntry[];
  excludes: string[];
  l2Excludes?: string[];
  l3Excludes?: string[];
}

/** 引导 Step 2 可选的产线组合键（非独立预设） */
export const PRODUCT_LINE_KEY_TEMPLATES: ProductLineKeyTemplate[] = [
  {
    id: "emenu-only",
    title: "eMenu",
    titleEn: "eMenu",
    productLines: ["emenu"],
    features: [
      f("queue-call", "core"),
      f("transactions", "core"),
      f("device-management", "recommended"),
      f("marketing", "optional"),
      f("members", "recommended"),
      f("reviews", "optional"),
    ],
    excludes: ["kitchen-kds", "finance-center", "orders", "print-templates", "reservations", "waitlist"],
  },
  {
    id: "sdi-only",
    title: "SDI",
    titleEn: "SDI",
    productLines: ["sdi"],
    features: [
      f("queue-call", "core"),
      f("transactions", "core"),
      f("device-management", "recommended"),
      f("members", "recommended"),
    ],
    excludes: [
      "kitchen-kds",
      "finance-center",
      "orders",
      "print-templates",
      "reservations",
      "waitlist",
      "marketing",
      "reviews",
    ],
  },
  {
    id: "kiosk-only",
    title: "Kiosk",
    titleEn: "Kiosk",
    productLines: ["kiosk"],
    features: [
      f("queue-call", "core"),
      f("transactions", "core"),
      f("device-management", "recommended"),
      f("marketing", "optional"),
      f("members", "recommended"),
    ],
    excludes: ["finance-center", "reservations", "orders"],
  },
  {
    id: "pos-suite",
    title: "收银 POS",
    titleEn: "POS suite",
    productLines: ["pos", "pos-go", "paypad"],
    features: [
      f("orders", "core"),
      f("finance-center", "recommended"),
      f("print-templates", "recommended"),
      f("device-management", "recommended"),
      f("queue-call", "recommended"),
      f("marketing", "optional"),
      f("promotions", "optional"),
    ],
    excludes: [],
  },
  {
    id: "pos-go-only",
    title: "POS GO",
    titleEn: "POS GO",
    productLines: ["pos-go"],
    features: [
      f("orders", "core"),
      f("queue-call", "recommended"),
      f("device-management", "recommended"),
      f("print-templates", "recommended"),
    ],
    excludes: ["finance-center", "kitchen-kds", "reservations", "waitlist"],
  },
  {
    id: "online-order",
    title: "网订 / 外卖",
    titleEn: "Online ordering",
    productLines: ["online-order"],
    features: [
      f("waitlist", "core"),
      f("transactions", "core"),
      f("reviews", "optional"),
      f("members", "recommended"),
    ],
    excludes: ["queue-call", "reservations", "finance-center", "kitchen-kds"],
  },
  {
    id: "kds",
    title: "厨房显示 KDS",
    titleEn: "Kitchen display",
    productLines: ["kds"],
    features: [f("kitchen-kds", "core"), f("print-templates", "recommended")],
    excludes: [],
  },
  {
    id: "paypad",
    title: "PayPad",
    titleEn: "PayPad",
    productLines: ["paypad"],
    features: [f("queue-call", "recommended"), f("orders", "recommended")],
    excludes: ["finance-center"],
  },
];

/** 全量产线组合键（materialize / 自定义业态补全） */
export const PRODUCT_LINE_KEY_IDS = PRODUCT_LINE_KEY_TEMPLATES.map((t) => t.id);

/** 引导 / 摘要展示用产线键目录 */
export const PRODUCT_LINE_KEYS = PRODUCT_LINE_KEY_TEMPLATES.map(({ id, title, titleEn, productLines }) => ({
  id,
  title,
  titleEn,
  productLines,
}));

export function getProductLineKeyTemplate(id: string): ProductLineKeyTemplate | undefined {
  return PRODUCT_LINE_KEY_TEMPLATES.find((t) => t.id === id);
}

export function resolveProductLinesFromLineKeys(lineKeys: string[]): ProductLineTag[] {
  const lines = new Set<ProductLineTag>();
  for (const key of lineKeys) {
    const tpl = getProductLineKeyTemplate(key);
    if (!tpl) continue;
    for (const line of tpl.productLines) lines.add(line);
  }
  return [...lines];
}
