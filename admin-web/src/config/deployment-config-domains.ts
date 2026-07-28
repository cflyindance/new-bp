/**
 * 模拟下发 · 配置域注册与 path 解析
 */
import { DEVICE_MANAGEMENT_HARDWARE_SUBNAV, NAV_MODULES } from "./navigation";
import type { DeploymentOriginNav } from "./deployment-types";

export interface DeploymentConfigDomain {
  domainKey: string;
  displayName: string;
  navRefs: Array<{ l1Key: string; l2Key: string }>;
  productLines: string[];
  granularity: "store" | "device";
  pagePaths: string[];
  bundleWith?: string[];
}

function hardwareSlugFromPath(path: string): string {
  return path.replace("/device-management/hardware/", "");
}

function resolveHardwareProductLines(slug: string): string[] {
  if (slug === "kiosk") return ["Kiosk"];
  if (slug === "emenu") return ["eMenu"];
  return ["POS"];
}

function buildHardwareConfigDomains(): DeploymentConfigDomain[] {
  return DEVICE_MANAGEMENT_HARDWARE_SUBNAV.map((item) => {
    const slug = hardwareSlugFromPath(item.path);
    return {
      domainKey: `hardware.${slug}`,
      displayName: item.title,
      navRefs: [{ l1Key: "device-management", l2Key: item.id }],
      productLines: resolveHardwareProductLines(slug),
      granularity: "device",
      pagePaths: [item.path],
    };
  });
}

export const DEMO_CONFIG_DOMAINS: DeploymentConfigDomain[] = [
  {
    domainKey: "brand.menu",
    displayName: "品牌菜单",
    navRefs: [{ l1Key: "product-center-main", l2Key: "bm-menus" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: ["/brand-menu/menus"],
    bundleWith: ["brand.menu.channel"],
  },
  {
    domainKey: "brand.menu.channel",
    displayName: "渠道可见性",
    navRefs: [{ l1Key: "product-center-main", l2Key: "bm-channel-visibility" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: ["/brand-menu/channel-visibility"],
  },
  {
    // syncMode 设计为 manual-only（见云端下发设计附录 A）；原型域表暂无 syncMode 字段
    domainKey: "store.profile",
    displayName: "门店档案",
    navRefs: [{ l1Key: "store-mgmt", l2Key: "st-settings" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: [
      "/stores/settings",
      "/stores/settings/store-profile",
      "/stores/settings/brand-identity-assets",
    ],
  },
  {
    domainKey: "store.hours",
    displayName: "营业时间",
    navRefs: [{ l1Key: "store-mgmt", l2Key: "store-hours" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: [
      "/stores/hours",
      "/stores/settings",
      "/stores/settings/store-hours-operation",
    ],
  },
  {
    domainKey: "module.settings",
    displayName: "模块设置",
    navRefs: [],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: [],
  },
  {
    domainKey: "team.clock-in",
    displayName: "员工打卡",
    navRefs: [{ l1Key: "team-mgmt", l2Key: "team-clock-in" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/team/clock-in"],
  },
  {
    domainKey: "team.shift-scheduling",
    displayName: "排班",
    navRefs: [{ l1Key: "team-mgmt", l2Key: "team-shift-scheduling" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/team/shift-scheduling"],
  },
  {
    domainKey: "team.breaks-overtime",
    displayName: "休息与加班",
    navRefs: [{ l1Key: "team-mgmt", l2Key: "team-breaks-overtime" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/team/breaks-overtime"],
  },
  {
    domainKey: "foh.floor-plan",
    displayName: "餐位平面图",
    navRefs: [{ l1Key: "foh-mgmt", l2Key: "foh-floor-plan" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: ["/operations/queue-call/floor-plan"],
  },
  {
    domainKey: "payment.card-pricing",
    displayName: "卡付定价（双重定价 / 加价）",
    navRefs: [{ l1Key: "transactions", l2Key: "tx-settings" }],
    productLines: ["POS", "Kiosk", "eMenu", "PayPad"],
    granularity: "store",
    pagePaths: ["/transactions/settings", "/transactions/settings/card-fees"],
  },
  {
    domainKey: "team.roles-employees",
    displayName: "角色与员工",
    navRefs: [{ l1Key: "team", l2Key: "team-roles" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/team/roles-employees"],
  },
  {
    domainKey: "team.breaks-overtime",
    displayName: "休息与加班",
    navRefs: [{ l1Key: "team", l2Key: "team-breaks" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/team/breaks-overtime"],
  },
  {
    domainKey: "team.clock-in",
    displayName: "员工打卡",
    navRefs: [{ l1Key: "team", l2Key: "team-clock" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/team/clock-in"],
  },
  {
    domainKey: "team.shift-scheduling",
    displayName: "排班",
    navRefs: [{ l1Key: "team", l2Key: "team-shifts" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/team/shift-scheduling"],
  },
  {
    domainKey: "promo.lottery",
    displayName: "抽奖活动",
    navRefs: [{ l1Key: "promotions", l2Key: "promo-lottery" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: ["/promotions/lottery"],
  },
  {
    domainKey: "foh.floor-plan",
    displayName: "餐位平面图",
    navRefs: [{ l1Key: "queue-call", l2Key: "qc-floor-plan" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/operations/queue-call/floor-plan"],
  },
  {
    domainKey: "foh.brand-menu",
    displayName: "店中店管理",
    navRefs: [{ l1Key: "queue-call", l2Key: "qc-brand-menu" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: ["/operations/queue-call/brand-menu"],
  },
  {
    domainKey: "foh.settings",
    displayName: "前厅设置",
    navRefs: [{ l1Key: "queue-call", l2Key: "qc-settings" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: ["/operations/queue-call/settings"],
  },
  {
    domainKey: "foh.menu-order-limits",
    displayName: "菜单下单限制",
    navRefs: [{ l1Key: "queue-call", l2Key: "qc-menu-order-limits" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: ["/operations/queue-call/menu-order-limits"],
  },
  {
    domainKey: "foh.category-settings",
    displayName: "品类管理",
    navRefs: [{ l1Key: "queue-call", l2Key: "qc-category-settings" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: ["/operations/queue-call/category-settings"],
  },
  {
    domainKey: "foh.classification-settings",
    displayName: "分类管理",
    navRefs: [{ l1Key: "queue-call", l2Key: "qc-classification-settings" }],
    productLines: ["POS", "Kiosk", "eMenu"],
    granularity: "store",
    pagePaths: ["/operations/queue-call/classification-settings"],
  },
  {
    domainKey: "foh.emenu-pro",
    displayName: "eMenu Pro",
    navRefs: [{ l1Key: "queue-call", l2Key: "qc-emenu-pro" }],
    productLines: ["eMenu"],
    granularity: "store",
    pagePaths: ["/operations/queue-call/emenu-pro"],
  },
  {
    domainKey: "marketing.ads",
    displayName: "广告",
    navRefs: [{ l1Key: "marketing", l2Key: "mkt-ads" }],
    productLines: ["eMenu", "Kiosk", "CDS", "叫号屏"],
    granularity: "store",
    pagePaths: ["/marketing/ads"],
  },
  {
    domainKey: "kds.display",
    displayName: "KDS显示与交互",
    navRefs: [{ l1Key: "kitchen-kds", l2Key: "kds-display" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/operations/kitchen-kds/display"],
  },
  {
    domainKey: "kds.workflow",
    displayName: "KDS出餐流程",
    navRefs: [{ l1Key: "kitchen-kds", l2Key: "kds-workflow" }],
    productLines: ["POS"],
    granularity: "store",
    pagePaths: ["/operations/kitchen-kds/workflow"],
  },
  ...buildHardwareConfigDomains(),
];

export function getDeploymentConfigDomain(domainKey: string): DeploymentConfigDomain | undefined {
  return DEMO_CONFIG_DOMAINS.find((d) => d.domainKey === domainKey);
}

export function listDeploymentConfigDomains(): DeploymentConfigDomain[] {
  return DEMO_CONFIG_DOMAINS;
}

function pathMatchesDomain(path: string, domain: DeploymentConfigDomain): boolean {
  if (path.includes("/distribution-log")) return false;
  if (domain.pagePaths.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  if (domain.domainKey === "module.settings" && /\/settings(\/|$)/.test(path) && !path.startsWith("/settings/")) {
    if (path.startsWith("/operations/queue-call/")) return false;
    if (path.startsWith("/operations/kitchen-kds/")) return false;
    if (path.startsWith("/device-management/")) return false;
    return true;
  }
  if (domain.domainKey === "module.settings" && path.startsWith("/settings/") && path !== "/settings/deployment-log") {
    return false;
  }
  return false;
}

export function resolveDomainsForPath(path: string): DeploymentConfigDomain[] {
  const matched = DEMO_CONFIG_DOMAINS.filter((d) => pathMatchesDomain(path, d));
  if (matched.length > 0) {
    const keys = new Set(matched.map((d) => d.domainKey));
    for (const d of matched) {
      for (const bundled of d.bundleWith ?? []) {
        const domain = getDeploymentConfigDomain(bundled);
        if (domain) keys.add(domain.domainKey);
      }
    }
    return [...keys].map((k) => getDeploymentConfigDomain(k)!).filter(Boolean);
  }
  if (/\/settings(\/|$)/.test(path) && !path.startsWith("/settings/")) {
    const mod = getDeploymentConfigDomain("module.settings");
    return mod ? [{ ...mod, displayName: "模块设置" }] : [];
  }
  return [];
}

function findNavMatch(path: string): { l1Key: string; l1Title: string; l2Key: string; l2Title: string } | null {
  for (const mod of NAV_MODULES) {
    if (path === mod.path || path.startsWith(`${mod.path}/`)) {
      for (const child of mod.children ?? []) {
        if (path === child.path || path.startsWith(`${child.path}/`)) {
          return {
            l1Key: mod.id,
            l1Title: mod.title,
            l2Key: child.id,
            l2Title: child.title,
          };
        }
      }
      return {
        l1Key: mod.id,
        l1Title: mod.title,
        l2Key: mod.id,
        l2Title: mod.title,
      };
    }
  }
  return null;
}

export function resolveOriginNavFromPath(path: string, fallbackTitle?: string): DeploymentOriginNav {
  const nav = findNavMatch(path);
  const domains = resolveDomainsForPath(path);
  const primary = domains[0];
  if (nav) {
    return {
      l1Key: nav.l1Key,
      l1Title: nav.l1Title,
      l2Key: nav.l2Key,
      l2Title: nav.l2Title,
      pagePath: path,
    };
  }
  return {
    l1Key: "unknown",
    l1Title: "商家后台",
    l2Key: path.replace(/\//g, "-"),
    l2Title: primary?.displayName ?? fallbackTitle ?? "配置页",
    pagePath: path,
  };
}

export function formatDeploymentDomainLabel(domainKey: string): string {
  return getDeploymentConfigDomain(domainKey)?.displayName ?? domainKey;
}
