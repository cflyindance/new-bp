import assert from "node:assert/strict";
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
} from "../src/config/navigation";
import { buildCurrentMerchantMenuDemoNodes, JSON_MENU_DEMO_ERROR_KEY, JSON_MENU_DEMO_IFRAME_URL, JSON_MENU_DEMO_ISSUE_ROOT_KEY, JSON_MENU_DEMO_WARNING_KEY } from "../src/config/json-menu-demo-data";
import { synchronizeMenuParentKeys, validateMenuDocument, walkMenuNodes, type MenuDocument, type MenuNode } from "../src/config/json-menu-document-domain";
import { serializeMenuDocument } from "../src/config/json-menu-document-serializer";

interface SourceItem {
  path: string;
  children?: SourceItem[];
  sidebarChildren?: SourceItem[];
}

function sourcePaths(items: SourceItem[]): Set<string> {
  const result = new Set<string>();
  const visit = (item: SourceItem): void => {
    result.add(item.path);
    item.children?.forEach(visit);
    item.sidebarChildren?.forEach(visit);
  };
  items.forEach(visit);
  return result;
}

function detailedSource(module: NavModule): SourceItem[] | null {
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

function generatedPaths(node: MenuNode): Set<string> {
  return new Set(walkMenuNodes([node]).map((visit) => visit.node.path).filter((path): path is string => Boolean(path)));
}

const nodes = buildCurrentMerchantMenuDemoNodes();
assert.equal(nodes.length, NAV_MODULES.length + 1, "一级菜单必须包含完整商家目录与一个校验状态示例");
synchronizeMenuParentKeys(nodes);
const document: MenuDocument = {
  _id: "demo-current-merchant-menu",
  name: "Current Merchant Menu Demo",
  menu: nodes,
  updatedBy: { userId: "demo", timestamp: new Date(0).toISOString(), firstname: "Demo", lastname: null },
  createdDate: 0,
};
const serialized = serializeMenuDocument(document);
assert.deepEqual(serialized.menu, nodes, "序列化不得改变或增加示例节点字段");
const demoIssues = validateMenuDocument(document);
assert(demoIssues.some((issue) => issue.severity === "error" && issue.path?.join(".") === "0.0"), "默认示例必须包含可定位的错误状态");
assert(demoIssues.some((issue) => issue.severity === "warning" && issue.path?.join(".") === "0.1"), "默认示例必须包含可定位的警告状态");
assert.equal(nodes[0]?.key, JSON_MENU_DEMO_ISSUE_ROOT_KEY);
assert.equal(nodes[0]?.children?.[0]?.key, JSON_MENU_DEMO_ERROR_KEY);
assert.equal(nodes[0]?.children?.[1]?.key, JSON_MENU_DEMO_WARNING_KEY);

NAV_MODULES.forEach((module, index) => {
  const generated = nodes[index + 1];
  assert(generated, `缺少一级菜单 ${module.id}`);
  let expected: Set<string>;
  if (module.id === "product-center-main") {
    expected = sourcePaths([...BRAND_PRODUCTS_SUBNAV, ...BRAND_MENU_SUBNAV, ...STORE_MENU_SUBNAV]);
  } else {
    expected = sourcePaths(detailedSource(module) ?? module.children);
  }
  assert.deepEqual([...generatedPaths(generated)].sort(), [...expected].sort(), `${module.id} 路由覆盖不完整`);
});

const visits = walkMenuNodes(nodes);
assert(visits.every((visit) => visit.path.length <= 3), "默认示例不得超过三级");
const ids = visits.map((visit) => visit.node.id).filter((id): id is string => Boolean(id));
const keys = visits.map((visit) => visit.node.key).filter((key): key is string => Boolean(key));
assert.equal(new Set(ids).size, visits.length, "节点 ID 必须存在且唯一");
assert.equal(new Set(keys).size, visits.length, "节点 Key 必须存在且唯一");
assert(visits.every((visit) => !visit.node.path || visit.node.path.startsWith("/")), "项目内路由必须以 / 开头");

const iframeNodes = visits.filter((visit) => visit.node.type === "iframe" && visit.node.key !== JSON_MENU_DEMO_ERROR_KEY);
assert.equal(iframeNodes.length, 1, "必须且只能有一个 iframe 示例节点");
assert.equal(iframeNodes[0]?.node.path, "/gift-cards/cards");
assert.equal(iframeNodes[0]?.node.url, JSON_MENU_DEMO_IFRAME_URL);
assert.equal(new URL(JSON_MENU_DEMO_IFRAME_URL).protocol, "https:");
assert.equal(new URL(JSON_MENU_DEMO_IFRAME_URL).hostname, "example.com");

const expectedPermissions: Record<string, { service: string; values: string[] }> = {
  "/brand-products/products": { service: "m_master", values: ["brand_item_menu_manage"] },
  "/brand-menu/menus": { service: "m_master", values: ["merchant_item_menu_manage"] },
  "/menu/store-menu": { service: "m_master", values: ["store_item_menu_manage"] },
  "/promotions/campaigns": { service: "promotion", values: ["promotion_campaign_view_access", "promotion_campaign_edit_access"] },
  "/promotions/lottery": { service: "promotion", values: ["promotion_lottery_manage_access"] },
  "/reports/revenue": { service: "cloud_report_service", values: ["report_revenue_view_access"] },
  "/reports/sales/orders": { service: "cloud_report_service", values: ["report_sales_view_access"] },
  "/reports/products/ranking": { service: "cloud_report_service", values: ["report_product_view_access"] },
  "/print-templates/decoration": { service: "print", values: ["print_template_view_access", "print_template_edit_access"] },
};

for (const [path, expected] of Object.entries(expectedPermissions)) {
  const node = visits.find((visit) => visit.node.path === path)?.node;
  assert(node, `缺少权限示例节点 ${path}`);
  assert.equal(node.accessControl?.bool, true);
  assert.equal(node.accessControl?.serviceName, expected.service);
  assert.equal(node.accessControl?.permission?.rule, "some");
  assert.deepEqual(node.accessControl?.permission?.value, expected.values);
}

const permissionsByService = new Map<string, Set<string>>();
visits.forEach(({ node }) => {
  const service = node.accessControl?.serviceName;
  if (!service) return;
  const values = permissionsByService.get(service) ?? new Set<string>();
  node.accessControl?.permission?.value.forEach((permission) => values.add(permission));
  permissionsByService.set(service, values);
});
assert.equal(permissionsByService.get("m_master")?.size, 3);
assert.equal(permissionsByService.get("promotion")?.size, 3);
assert.equal(permissionsByService.get("cloud_report_service")?.size, 3);
assert.equal(permissionsByService.get("print")?.size, 2);

console.log(`current merchant menu demo verification passed: ${nodes.length} roots, ${visits.length} nodes`);
