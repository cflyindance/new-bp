import {
  BRAND_MENU_SUBNAV,
  BRAND_PRODUCTS_SUBNAV,
  FINANCE_SHEET_SETTINGS_SUBNAV,
  FINANCE_SHEET_SUBNAV,
  GIFT_CARDS_SHEET_MAIN_SUBNAV,
  GIFT_CARDS_SHEET_SETTINGS_SUBNAV,
  MARKETING_SHEET_SUBNAV,
  MEMBERS_SHEET_SETTINGS_SUBNAV,
  MEMBERS_SHEET_SUBNAV,
  NAV_MODULES,
  PRINT_SHEET_SUBNAV,
  PROMOTIONS_MGMT_SUBNAV,
  REPORTS_SHEET_SUBNAV,
  RESERVATIONS_SHEET_SUBNAV,
  STORE_MENU_SUBNAV,
  type NavModule,
} from "./navigation";
import type { MenuNode } from "./json-menu-document-domain";

interface DemoNavItem {
  id?: string;
  title: string;
  titleEn?: string;
  path: string;
  children?: DemoNavItem[];
  sidebarChildren?: Array<{ title: string; titleEn?: string; path: string }>;
}

const permissionByPath: Record<string, { serviceName: string; permissions: string[] }> = {
  "/brand-products/products": { serviceName: "m_master", permissions: ["brand_item_menu_manage"] },
  "/brand-menu/menus": { serviceName: "m_master", permissions: ["merchant_item_menu_manage"] },
  "/menu/store-menu": { serviceName: "m_master", permissions: ["store_item_menu_manage"] },
  "/promotions/campaigns": { serviceName: "promotion", permissions: ["promotion_campaign_view_access", "promotion_campaign_edit_access"] },
  "/promotions/lottery": { serviceName: "promotion", permissions: ["promotion_lottery_manage_access"] },
  "/reports/revenue": { serviceName: "cloud_report_service", permissions: ["report_revenue_view_access"] },
  "/reports/sales/orders": { serviceName: "cloud_report_service", permissions: ["report_sales_view_access"] },
  "/reports/products/ranking": { serviceName: "cloud_report_service", permissions: ["report_product_view_access"] },
  "/print-templates/decoration": { serviceName: "print", permissions: ["print_template_view_access", "print_template_edit_access"] },
};

const IFRAME_DEMO_PATH = "/gift-cards/cards";
export const JSON_MENU_DEMO_IFRAME_URL = "https://example.com/menusifu-gift-card-demo";
export const JSON_MENU_DEMO_ISSUE_ROOT_KEY = "demo_validation_state_samples";
export const JSON_MENU_DEMO_ERROR_KEY = "demo_validation_error_iframe";
export const JSON_MENU_DEMO_WARNING_KEY = "demo_validation_warning_i18n";

function readableSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "node";
}

function base64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function identity(namespace: string): Pick<MenuNode, "id" | "key"> {
  const readable = readableSegment(namespace).slice(0, 48);
  const encoded = base64Url(namespace);
  return { id: `demo-${readable}--${encoded}`, key: `demo_${readable}__${encoded}` };
}

function localized(title: string, titleEn?: string): NonNullable<MenuNode["i18nInfo"]> {
  return { "zh-CN": title, "zh-HK": title, "en-US": titleEn || title };
}

function accessControl(path: string): MenuNode["accessControl"] | undefined {
  const sample = permissionByPath[path];
  return sample ? { bool: true, serviceName: sample.serviceName, permission: { rule: "some", value: [...sample.permissions] } } : undefined;
}

function leafNode(item: DemoNavItem, namespace: string, title = item.title, titleEn = item.titleEn): MenuNode {
  const iframe = item.path === IFRAME_DEMO_PATH;
  return {
    ...identity(namespace),
    name: titleEn || title,
    path: item.path,
    i18nInfo: localized(title, titleEn),
    type: iframe ? "iframe" : "inner",
    ...(iframe ? { url: JSON_MENU_DEMO_IFRAME_URL } : {}),
    ...(accessControl(item.path) ? { accessControl: accessControl(item.path) } : {}),
  };
}

function sourceSegment(item: DemoNavItem): string {
  return item.id ? `id:${item.id}` : `path:${item.path}`;
}

function withOccurrence(items: DemoNavItem[]): Array<{ item: DemoNavItem; segment: string }> {
  const counts = new Map<string, number>();
  return items.map((item) => {
    const base = sourceSegment(item);
    const occurrence = counts.get(base) ?? 0;
    counts.set(base, occurrence + 1);
    return { item, segment: occurrence ? `${base}|occurrence:${occurrence}` : base };
  });
}

function detailedItemNode(item: DemoNavItem, namespace: string): MenuNode {
  const sidebarChildren = item.sidebarChildren ?? [];
  if (!sidebarChildren.length && !item.children?.length) return leafNode(item, namespace);
  const rawChildren: DemoNavItem[] = (item.children ?? []).length ? item.children! : sidebarChildren;
  const children = withOccurrence(rawChildren).map(({ item: child, segment }) => leafNode(child, `${namespace}/${segment}`));
  if (!rawChildren.some((child) => child.path === item.path)) {
    children.unshift(leafNode({ title: "概览", titleEn: "Overview", path: item.path }, `${namespace}/path:${item.path}|overview`));
  }
  return { ...identity(namespace), name: item.titleEn || item.title, i18nInfo: localized(item.title, item.titleEn), children };
}

function flatDetailedNodes(items: DemoNavItem[], parentNamespace: string): MenuNode[] {
  const flattened: DemoNavItem[] = [];
  items.forEach((item) => {
    if (!item.sidebarChildren?.length) {
      flattened.push(item);
      return;
    }
    if (!item.sidebarChildren.some((child) => child.path === item.path)) flattened.push({ ...item, sidebarChildren: undefined });
    item.sidebarChildren.forEach((child) => flattened.push({
      ...child,
      id: `${item.id ?? readableSegment(item.path)}-${readableSegment(child.path)}`,
      title: `${item.title} · ${child.title}`,
      titleEn: `${item.titleEn || item.title} · ${child.titleEn || child.title}`,
    }));
  });
  return withOccurrence(flattened).map(({ item, segment }) => leafNode(item, `${parentNamespace}/${segment}`));
}

function productCenterChildren(module: NavModule, namespace: string): MenuNode[] {
  const groups: Array<{ source: DemoNavItem | undefined; items: DemoNavItem[] }> = [
    { source: module.children[0], items: BRAND_PRODUCTS_SUBNAV },
    { source: module.children[1], items: BRAND_MENU_SUBNAV },
    { source: module.children[2], items: STORE_MENU_SUBNAV },
  ];
  return groups.filter((group): group is { source: DemoNavItem; items: DemoNavItem[] } => Boolean(group.source)).map(({ source, items }) => {
    const groupNamespace = `${namespace}/${sourceSegment(source)}`;
    return {
      ...identity(groupNamespace),
      name: source.titleEn || source.title,
      i18nInfo: localized(source.title, source.titleEn),
      children: flatDetailedNodes(items, groupNamespace),
    };
  });
}

function detailedItemsFor(module: NavModule): DemoNavItem[] | null {
  switch (module.id) {
    case "marketing": return MARKETING_SHEET_SUBNAV;
    case "promotions": return PROMOTIONS_MGMT_SUBNAV;
    case "members": return [...MEMBERS_SHEET_SUBNAV, ...MEMBERS_SHEET_SETTINGS_SUBNAV];
    case "gift-cards": return [...GIFT_CARDS_SHEET_MAIN_SUBNAV, ...GIFT_CARDS_SHEET_SETTINGS_SUBNAV];
    case "reservations": return RESERVATIONS_SHEET_SUBNAV;
    case "reports-finance": return REPORTS_SHEET_SUBNAV;
    case "finance-center": return [...FINANCE_SHEET_SUBNAV, ...FINANCE_SHEET_SETTINGS_SUBNAV];
    case "print-templates": return PRINT_SHEET_SUBNAV;
    default: return null;
  }
}

function moduleNode(module: NavModule): MenuNode {
  const namespace = `id:${module.id}`;
  const detailed = detailedItemsFor(module);
  const children = module.id === "product-center-main"
    ? productCenterChildren(module, namespace)
    : withOccurrence(detailed ?? module.children).map(({ item, segment }) => detailedItemNode(item, `${namespace}/${segment}`));
  if (!children.length) return { ...leafNode({ id: module.id, title: module.title, titleEn: module.titleEn, path: module.path }, namespace), icon: module.icon };
  return {
    ...identity(namespace),
    name: module.titleEn || module.title,
    icon: module.icon,
    i18nInfo: localized(module.title, module.titleEn),
    children,
  };
}

export function buildCurrentMerchantMenuDemoNodes(modules: NavModule[] = NAV_MODULES): MenuNode[] {
  const validationSamples: MenuNode = {
    id: "demo-validation-state-samples",
    key: JSON_MENU_DEMO_ISSUE_ROOT_KEY,
    name: "Validation State Samples",
    i18nInfo: localized("校验状态示例", "Validation State Samples"),
    children: [
      {
        id: "demo-validation-error-iframe",
        key: JSON_MENU_DEMO_ERROR_KEY,
        parentKey: JSON_MENU_DEMO_ISSUE_ROOT_KEY,
        name: "Error Sample",
        i18nInfo: localized("错误示例 · iframe 地址无效", "Error Sample · Invalid iframe URL"),
        path: "/demo/validation/error",
        type: "iframe",
        url: "invalid-iframe-url",
      },
      {
        id: "demo-validation-warning-i18n",
        key: JSON_MENU_DEMO_WARNING_KEY,
        parentKey: JSON_MENU_DEMO_ISSUE_ROOT_KEY,
        name: "Warning Sample",
        i18nInfo: { "zh-CN": "警告示例 · 多语言不完整" },
        path: "/demo/validation/warning",
        type: "inner",
      },
    ],
  };
  return [validationSamples, ...modules.map(moduleNode)];
}
