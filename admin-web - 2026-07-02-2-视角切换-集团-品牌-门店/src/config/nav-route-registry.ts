/**
 * 菜单路由 · 固定页面路由注册表（只读，供新增一级导航对话框）
 */
import {
  BRAND_MENU_SUBNAV,
  BRAND_PRODUCTS_SUBNAV,
  BRAND_RECIPES_MGMT_SUBNAV,
  BRAND_SEASONING_MGMT_SUBNAV,
  BRAND_TAGS_MGMT_SUBNAV,
  DEVICE_MANAGEMENT_HARDWARE_SUBNAV,
  EMENU_ORDERING_SUBNAV,
  FINANCE_SHEET_SETTINGS_SUBNAV,
  FINANCE_SHEET_SUBNAV,
  GIFT_CARDS_SHEET_SUBNAV,
  KIOSK_ORDERING_SUBNAV,
  MARKETING_SHEET_SUBNAV,
  MEMBERS_SHEET_SUBNAV,
  MENU_TAX_TYPES_SUBNAV,
  NAV_MODULES,
  PAYPAD_ORDERING_SUBNAV,
  POS_ORDERING_SUBNAV,
  PRINT_SHEET_SUBNAV,
  PRODUCT_CENTER_DEEP_NAV,
  PROMOTIONS_MGMT_SUBNAV,
  REPORTS_SHEET_SUBNAV,
  RESERVATIONS_SHEET_SUBNAV,
  STORE_BASIC_SUBNAV,
  STORE_MENU_SUBNAV,
  TEAM_REPORTS_SUBNAV,
  TIPS_MANAGEMENT_SUBNAV,
  type NavItem,
  type NavModule,
} from "./navigation";

export interface NavRouteRegistryEntry {
  id: string;
  path: string;
  title: string;
  titleEn?: string;
  level: 1 | 2 | 3;
  groupId: string;
  groupTitle: string;
  moduleRootPath: string;
}

let cachedRegistry: NavRouteRegistryEntry[] | null = null;

function resolveModuleRoot(path: string, modules: NavModule[]): string {
  for (const m of modules) {
    if (path === m.path || path.startsWith(`${m.path}/`)) return m.path;
    if (m.matchPrefixes?.some((p) => path === p || path.startsWith(`${p}/`))) return m.path;
    for (const c of m.children) {
      if (path === c.path || path.startsWith(`${c.path}/`)) return m.path;
    }
  }
  const seg = path.split("/").filter(Boolean)[0];
  return seg ? `/${seg}` : "/";
}

function pushEntry(
  entries: NavRouteRegistryEntry[],
  seen: Set<string>,
  entry: NavRouteRegistryEntry,
): void {
  if (seen.has(entry.path)) return;
  seen.add(entry.path);
  entries.push(entry);
}

function pushNavItems(
  entries: NavRouteRegistryEntry[],
  seen: Set<string>,
  items: readonly NavItem[],
  groupId: string,
  groupTitle: string,
  level: 2 | 3,
  modules: NavModule[],
): void {
  for (const item of items) {
    pushEntry(entries, seen, {
      id: `route:${groupId}:${item.id}`,
      path: item.path,
      title: item.title,
      titleEn: item.titleEn,
      level,
      groupId,
      groupTitle,
      moduleRootPath: resolveModuleRoot(item.path, modules),
    });
    if (item.children) {
      for (const ch of item.children) {
        pushEntry(entries, seen, {
          id: `route:${groupId}:${ch.id}`,
          path: ch.path,
          title: ch.title,
          titleEn: ch.titleEn,
          level: 3,
          groupId,
          groupTitle,
          moduleRootPath: resolveModuleRoot(ch.path, modules),
        });
      }
    }
  }
}

export function buildNavRouteRegistry(): NavRouteRegistryEntry[] {
  if (cachedRegistry) return cachedRegistry;

  const entries: NavRouteRegistryEntry[] = [];
  const seen = new Set<string>();

  for (const m of NAV_MODULES) {
    pushEntry(entries, seen, {
      id: `l1:${m.id}`,
      path: m.path,
      title: m.title,
      titleEn: m.titleEn,
      level: 1,
      groupId: m.id,
      groupTitle: m.title,
      moduleRootPath: m.path,
    });
    for (const c of m.children) {
      pushEntry(entries, seen, {
        id: `l2:${m.id}:${c.id}`,
        path: c.path,
        title: c.title,
        titleEn: c.titleEn,
        level: 2,
        groupId: m.id,
        groupTitle: m.title,
        moduleRootPath: m.path,
      });
    }
  }

  const deepGroups: { items: readonly NavItem[]; groupId: string; groupTitle: string }[] = [
    { items: PRODUCT_CENTER_DEEP_NAV, groupId: "product-center", groupTitle: "商品中心" },
    { items: BRAND_PRODUCTS_SUBNAV, groupId: "brand-products", groupTitle: "品牌商品" },
    { items: BRAND_MENU_SUBNAV, groupId: "brand-menu", groupTitle: "品牌菜单" },
    { items: STORE_MENU_SUBNAV, groupId: "store-menu", groupTitle: "门店菜单" },
    { items: MENU_TAX_TYPES_SUBNAV, groupId: "menu-tax", groupTitle: "税种管理" },
    { items: BRAND_SEASONING_MGMT_SUBNAV, groupId: "seasoning", groupTitle: "调味管理" },
    { items: BRAND_TAGS_MGMT_SUBNAV, groupId: "tags", groupTitle: "标签管理" },
    { items: BRAND_RECIPES_MGMT_SUBNAV, groupId: "recipes", groupTitle: "配方管理" },
    { items: MARKETING_SHEET_SUBNAV, groupId: "marketing", groupTitle: "营销中心" },
    { items: PROMOTIONS_MGMT_SUBNAV, groupId: "promotions", groupTitle: "促销管理" },
    { items: MEMBERS_SHEET_SUBNAV, groupId: "members", groupTitle: "会员" },
    { items: GIFT_CARDS_SHEET_SUBNAV, groupId: "gift-cards", groupTitle: "礼品卡" },
    { items: REPORTS_SHEET_SUBNAV, groupId: "reports", groupTitle: "报表" },
    { items: PRINT_SHEET_SUBNAV, groupId: "print", groupTitle: "打印" },
    { items: RESERVATIONS_SHEET_SUBNAV, groupId: "reservations", groupTitle: "预约" },
    { items: FINANCE_SHEET_SUBNAV, groupId: "finance", groupTitle: "财务" },
    { items: FINANCE_SHEET_SETTINGS_SUBNAV, groupId: "finance-settings", groupTitle: "财务设置" },
    { items: DEVICE_MANAGEMENT_HARDWARE_SUBNAV, groupId: "device", groupTitle: "设备管理" },
    { items: TIPS_MANAGEMENT_SUBNAV, groupId: "tips", groupTitle: "小费管理" },
    { items: TEAM_REPORTS_SUBNAV, groupId: "team-reports", groupTitle: "团队报表" },
    { items: KIOSK_ORDERING_SUBNAV, groupId: "kiosk", groupTitle: "Kiosk" },
    { items: POS_ORDERING_SUBNAV, groupId: "pos-ordering", groupTitle: "POS 点餐" },
    { items: PAYPAD_ORDERING_SUBNAV, groupId: "paypad", groupTitle: "Paypad" },
    { items: EMENU_ORDERING_SUBNAV, groupId: "emenu", groupTitle: "电子菜单" },
    { items: STORE_BASIC_SUBNAV, groupId: "store-basic", groupTitle: "门店基础" },
  ];

  for (const g of deepGroups) {
    pushNavItems(entries, seen, g.items, g.groupId, g.groupTitle, 3, NAV_MODULES);
  }

  pushEntry(entries, seen, {
    id: "route:inventory-change",
    path: "/operations/inventory-ordering/inventory-change-log",
    title: "库存变更记录",
    titleEn: "Inventory change log",
    level: 3,
    groupId: "inventory-ordering",
    groupTitle: "库存订购",
    moduleRootPath: resolveModuleRoot("/operations/inventory-ordering/inventory-change-log", NAV_MODULES),
  });

  cachedRegistry = entries;
  return entries;
}

export function getNavRouteRegistryEntry(id: string): NavRouteRegistryEntry | undefined {
  return buildNavRouteRegistry().find((e) => e.id === id);
}

/** 按路径解析注册表中的页面标题（用于【页面】类一级展示挂载页名称） */
export function resolveNavRouteTitleByPath(path: string): string | undefined {
  const normalized = path.trim();
  if (!normalized) return undefined;
  return buildNavRouteRegistry().find((e) => e.path === normalized)?.title;
}

export function searchNavRouteRegistry(query: string, includeLevel3 = false): NavRouteRegistryEntry[] {
  const q = query.trim().toLowerCase();
  return buildNavRouteRegistry().filter((e) => {
    if (!includeLevel3 && e.level === 3) return false;
    if (!q) return e.level <= 2;
    return (
      e.title.toLowerCase().includes(q) ||
      (e.titleEn?.toLowerCase().includes(q) ?? false) ||
      e.path.toLowerCase().includes(q) ||
      e.groupTitle.toLowerCase().includes(q)
    );
  });
}

export function groupNavRouteEntries(entries: NavRouteRegistryEntry[]): Map<string, NavRouteRegistryEntry[]> {
  const map = new Map<string, NavRouteRegistryEntry[]>();
  for (const e of entries) {
    const list = map.get(e.groupTitle) ?? [];
    list.push(e);
    map.set(e.groupTitle, list);
  }
  return map;
}

/** 从路径推导一级模块根路由（首段） */
export function deriveModuleRootFromPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (!parts.length) return "/";
  return `/${parts[0]}`;
}

/** 拼接设置 Hub 默认路径 */
export function defaultSettingsPathForModuleRoot(moduleRoot: string): string {
  const base = moduleRoot.replace(/\/$/, "");
  return `${base}/settings`;
}
