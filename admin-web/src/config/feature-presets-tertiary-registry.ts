/**
 * 平台预设 / 可见性 — 全量 L2 → 三级 subnav 注册表（SSOT）
 */
import {
  buildSettingsCatalogAsTertiary,
  shouldUseSettingsCatalogTree,
} from "./feature-presets-settings-tree";
import {
  BRAND_MENU_SUBNAV,
  BRAND_PRODUCTS_SUBNAV,
  DEVICE_MANAGEMENT_HARDWARE_SUBNAV,
  EMENU_ORDERING_SUBNAV,
  FINANCE_SHEET_SUBNAV,
  GIFT_CARDS_SHEET_MAIN_SUBNAV,
  KIOSK_ORDERING_SUBNAV,
  MARKETING_MGMT_SUBNAV,
  MEMBERS_SHEET_SUBNAV,
  NAV_MODULES,
  PAYPAD_ORDERING_SUBNAV,
  POS_ORDERING_SUBNAV,
  PRINT_SHEET_SUBNAV,
  PROMOTIONS_MGMT_SUBNAV,
  REPORTS_SHEET_SUBNAV,
  RESERVATIONS_SHEET_SUBNAV,
  STORE_BASIC_SUBNAV,
  STORE_MENU_SUBNAV,
  TEAM_REPORTS_SUBNAV,
  TIPS_MANAGEMENT_SUBNAV,
  type ProductCenterSidebarSubItem,
} from "./navigation";
import { getModuleSettingsBasePath } from "./module-settings-catalog";

export interface TertiaryNavItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
  activePrefix?: string;
  activePrefixes?: string[];
  sidebarChildren?: { title: string; titleEn?: string; path: string }[];
}

export interface TertiaryRegistryEntry {
  moduleId: string;
  l2FeatureId: string;
  /** 虚拟 L2（不在 NAV_MODULES.children 中）时的展示名 */
  labelZh?: string;
  labelEn?: string;
  items: ProductCenterSidebarSubItem[];
  pathPrefixes: string[];
}

export function toSidebarSubnav(items: TertiaryNavItem[]): ProductCenterSidebarSubItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    titleEn: item.titleEn,
    path: item.path,
    activePrefix: item.activePrefix,
    activePrefixes: item.activePrefixes,
    sidebarChildren: item.sidebarChildren,
  }));
}

function pickSheetByIds(
  all: ProductCenterSidebarSubItem[],
  ids: string[],
): ProductCenterSidebarSubItem[] {
  return ids.map((id) => all.find((x) => x.id === id)).filter((x): x is ProductCenterSidebarSubItem => Boolean(x));
}

const REPORTS_L2_TO_SHEET_ID: Record<string, string> = {
  "rpt-revenue": "rpt-business-overview",
  "rpt-sales": "rpt-sales-summary",
  "rpt-products": "rpt-product-reports",
  "rpt-staff": "rpt-center-staff",
  "rpt-trends": "rpt-trends",
  "rpt-monthly": "rpt-monthly",
  "rpt-settings": "rpt-settings",
};

/** 侧滑层聚合 subnav 项 → 归属 L2 */
const SHEET_ITEM_TO_L2: Record<string, Record<string, string>> = {
  "reports-finance": Object.fromEntries(
    Object.entries(REPORTS_L2_TO_SHEET_ID).map(([l2, sheetId]) => [sheetId, l2]),
  ),
  reservations: {
    "res-waitlist": "res-waitlist",
    "res-rsv": "res-rsv",
    "res-history": "res-history",
    "res-section": "res-section",
    "res-settings": "res-settings",
  },
  "print-templates": {
    "pt-decoration": "pt-decoration",
    "pt-settings": "pt-settings",
  },
  marketing: {
    "mkt-screensaver": "mkt-screensaver",
    "mkt-ads": "mkt-ads",
    "mkt-poster-pro": "mkt-poster-pro",
  },
  promotions: {
    "promo-campaigns": "promo-campaigns",
    "promo-lottery": "promo-lottery",
  },
  members: {
    "mem-card-mgmt": "mem-card-entry",
    "mem-points": "mem-points",
    "mem-settings": "mem-settings",
  },
  "gift-cards": {
    "gc-cards": "gc-cards",
    "gc-settings": "gc-settings",
  },
  "finance-center": {
    "fin-register-audit": "fin-register-audit",
    "fin-settings": "fin-settings",
  },
};

function buildExplicitEntries(): TertiaryRegistryEntry[] {
  const memCard = MEMBERS_SHEET_SUBNAV.find((x) => x.id === "mem-card-mgmt");
  const memPoints = MEMBERS_SHEET_SUBNAV.find((x) => x.id === "mem-points");

  const entries: TertiaryRegistryEntry[] = [
    {
      moduleId: "product-center-main",
      l2FeatureId: "pcm-brand-products",
      items: BRAND_PRODUCTS_SUBNAV,
      pathPrefixes: ["/brand-products"],
    },
    {
      moduleId: "product-center-main",
      l2FeatureId: "pcm-brand-menu",
      items: BRAND_MENU_SUBNAV,
      pathPrefixes: ["/brand-menu"],
    },
    {
      moduleId: "product-center-main",
      l2FeatureId: "pcm-store-mgmt",
      items: STORE_MENU_SUBNAV,
      pathPrefixes: ["/menu"],
    },
    {
      moduleId: "members",
      l2FeatureId: "mem-card-entry",
      items: memCard ? [memCard] : [],
      pathPrefixes: ["/members/card"],
    },
    {
      moduleId: "members",
      l2FeatureId: "mem-points",
      items: memPoints ? [memPoints] : [],
      pathPrefixes: ["/members/points"],
    },
    {
      moduleId: "marketing",
      l2FeatureId: "mkt-screensaver",
      items: pickSheetByIds(MARKETING_MGMT_SUBNAV, ["mkt-screensaver"]),
      pathPrefixes: ["/marketing/screensaver"],
    },
    {
      moduleId: "marketing",
      l2FeatureId: "mkt-ads",
      items: pickSheetByIds(MARKETING_MGMT_SUBNAV, ["mkt-ads"]),
      pathPrefixes: ["/marketing/ads"],
    },
    {
      moduleId: "marketing",
      l2FeatureId: "mkt-poster-pro",
      items: pickSheetByIds(MARKETING_MGMT_SUBNAV, ["mkt-poster-pro"]),
      pathPrefixes: ["/marketing/poster-pro"],
    },
    {
      moduleId: "promotions",
      l2FeatureId: "promo-campaigns",
      items: pickSheetByIds(PROMOTIONS_MGMT_SUBNAV, ["promo-campaigns"]),
      pathPrefixes: ["/promotions/campaigns"],
    },
    {
      moduleId: "promotions",
      l2FeatureId: "promo-lottery",
      items: pickSheetByIds(PROMOTIONS_MGMT_SUBNAV, ["promo-lottery"]),
      pathPrefixes: ["/promotions/lottery"],
    },
    {
      moduleId: "gift-cards",
      l2FeatureId: "gc-cards",
      items: GIFT_CARDS_SHEET_MAIN_SUBNAV,
      pathPrefixes: ["/gift-cards/cards"],
    },
    {
      moduleId: "finance-center",
      l2FeatureId: "fin-register-audit",
      items: FINANCE_SHEET_SUBNAV,
      pathPrefixes: ["/finance/register-audit"],
    },
    {
      moduleId: "device-management",
      l2FeatureId: "dm-hardware",
      items: toSidebarSubnav(DEVICE_MANAGEMENT_HARDWARE_SUBNAV),
      pathPrefixes: ["/device-management/hardware"],
    },
    {
      moduleId: "team",
      l2FeatureId: "team-tips",
      items: toSidebarSubnav(TIPS_MANAGEMENT_SUBNAV),
      pathPrefixes: ["/team/tips"],
    },
    {
      moduleId: "team",
      l2FeatureId: "team-reports",
      items: toSidebarSubnav(TEAM_REPORTS_SUBNAV),
      pathPrefixes: ["/team/reports"],
    },
    {
      moduleId: "queue-call",
      l2FeatureId: "foh-ord-pos",
      labelZh: "POS 点餐设置",
      labelEn: "POS ordering",
      items: toSidebarSubnav(POS_ORDERING_SUBNAV),
      pathPrefixes: ["/ordering/pos"],
    },
    {
      moduleId: "queue-call",
      l2FeatureId: "foh-ord-paypad",
      labelZh: "PayPad 点餐设置",
      labelEn: "PayPad ordering",
      items: toSidebarSubnav(PAYPAD_ORDERING_SUBNAV),
      pathPrefixes: ["/ordering/paypad"],
    },
    {
      moduleId: "queue-call",
      l2FeatureId: "foh-ord-kiosk",
      labelZh: "Kiosk 点餐设置",
      labelEn: "Kiosk ordering",
      items: toSidebarSubnav(KIOSK_ORDERING_SUBNAV),
      pathPrefixes: ["/ordering/kiosk"],
    },
    {
      moduleId: "queue-call",
      l2FeatureId: "foh-ord-emenu",
      labelZh: "eMenu 点餐设置",
      labelEn: "eMenu ordering",
      items: toSidebarSubnav(EMENU_ORDERING_SUBNAV),
      pathPrefixes: ["/ordering/tablet"],
    },
    {
      moduleId: "store-mgmt",
      l2FeatureId: "st-store-profile",
      labelZh: "门店基础信息",
      labelEn: "Store profile",
      items: toSidebarSubnav(STORE_BASIC_SUBNAV),
      pathPrefixes: ["/store"],
    },
  ];

  for (const [l2Id, sheetId] of Object.entries(REPORTS_L2_TO_SHEET_ID)) {
    const item = REPORTS_SHEET_SUBNAV.find((x) => x.id === sheetId);
    if (!item) continue;
    entries.push({
      moduleId: "reports-finance",
      l2FeatureId: l2Id,
      items: [item],
      pathPrefixes: [item.activePrefix ?? item.path],
    });
  }

  for (const item of RESERVATIONS_SHEET_SUBNAV) {
    entries.push({
      moduleId: "reservations",
      l2FeatureId: item.id,
      items: [item],
      pathPrefixes: [item.path],
    });
  }

  for (const item of PRINT_SHEET_SUBNAV) {
    entries.push({
      moduleId: "print-templates",
      l2FeatureId: item.id,
      items: [item],
      pathPrefixes: [item.path],
    });
  }

  return entries.filter((e) => e.items.length > 0);
}

let cachedEntries: TertiaryRegistryEntry[] | null = null;

export function getTertiaryRegistryEntries(): TertiaryRegistryEntry[] {
  if (!cachedEntries) cachedEntries = buildExplicitEntries();
  return cachedEntries;
}

function resolveNavL2Path(moduleId: string, l2FeatureId: string): string | undefined {
  const mod = NAV_MODULES.find((m) => m.id === moduleId);
  return mod?.children.find((c) => c.id === l2FeatureId)?.path;
}

export function getTertiaryItemsForL2(moduleId: string, l2FeatureId: string): ProductCenterSidebarSubItem[] | null {
  const l2Path = resolveNavL2Path(moduleId, l2FeatureId);
  if (l2Path && shouldUseSettingsCatalogTree(moduleId, l2FeatureId)) {
    const fromCatalog = buildSettingsCatalogAsTertiary(l2FeatureId, l2Path);
    if (fromCatalog?.length) return fromCatalog;
  }

  const row = getTertiaryRegistryEntries().find(
    (e) => e.moduleId === moduleId && e.l2FeatureId === l2FeatureId,
  );
  return row?.items.length ? row.items : null;
}

export function getTertiaryPathPrefixes(moduleId: string, l2FeatureId: string): string[] {
  const l2Path = resolveNavL2Path(moduleId, l2FeatureId);
  if (l2Path) {
    const base = getModuleSettingsBasePath(l2Path);
    if (base) return [base];
  }
  const row = getTertiaryRegistryEntries().find(
    (e) => e.moduleId === moduleId && e.l2FeatureId === l2FeatureId,
  );
  return row?.pathPrefixes ?? (l2Path ? [l2Path] : []);
}

export function getVirtualL2NodesForModule(moduleId: string): TertiaryRegistryEntry[] {
  return getTertiaryRegistryEntries().filter((e) => e.moduleId === moduleId && e.labelZh);
}

export function resolveSheetItemL2(moduleId: string, sheetItemId: string): string {
  return SHEET_ITEM_TO_L2[moduleId]?.[sheetItemId] ?? sheetItemId;
}

export function itemPathPrefixes(item: ProductCenterSidebarSubItem): string[] {
  if (item.activePrefixes?.length) return item.activePrefixes;
  if (item.activePrefix) return [item.activePrefix];
  return [item.path];
}
