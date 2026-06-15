/**
 * 主页 · 今日概览 — 按租户功能画像展示快捷入口（P2）
 */
import { fetchDashboardKpi, getCachedDashboardKpi } from "./dashboard-kpi-api";
import { getVisibleNavModules } from "./feature-visibility";
import { renderTenantProfileBanner } from "./tenant-profile-banner-ui";

export interface DashboardQuickLink {
  moduleId: string;
  path: string;
  title: string;
  titleEn?: string;
  description: string;
}

const QUICK_LINK_DEFS: DashboardQuickLink[] = [
  {
    moduleId: "product-center-main",
    path: "/brand-products/products",
    title: "商品中心",
    titleEn: "Products",
    description: "管理商品、菜单与门店售卖",
  },
  {
    moduleId: "queue-call",
    path: "/operations/queue-call/settings",
    title: "前厅设置",
    titleEn: "Front of house",
    description: "点单界面、产线与食客端配置",
  },
  {
    moduleId: "transactions",
    path: "/transactions/settings",
    title: "支付中心",
    titleEn: "Payments",
    description: "支付方式、结账与小费",
  },
  {
    moduleId: "kitchen-kds",
    path: "/operations/kitchen-kds/settings",
    title: "后厨设置",
    titleEn: "Kitchen",
    description: "厨房单、KDS 与出餐流程",
  },
  {
    moduleId: "reports-finance",
    path: "/reports/revenue",
    title: "营业报表",
    titleEn: "Reports",
    description: "销售汇总与经营分析",
  },
  {
    moduleId: "members",
    path: "/members/card/coupon-mgmt",
    title: "会员中心",
    titleEn: "Members",
    description: "卡券、积分与会员权益",
  },
  {
    moduleId: "waitlist",
    path: "/operations/waitlist",
    title: "外卖/来取",
    titleEn: "Delivery",
    description: "网订履约与渠道设置",
  },
  {
    moduleId: "device-management",
    path: "/device-management/hardware/payments",
    title: "硬件管理",
    titleEn: "Hardware",
    description: "打印机、支付终端与设备",
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderKpiCards(kpi: ReturnType<typeof getCachedDashboardKpi>) {
  const items = kpi
    ? [
        { key: "salesToday", ...kpi.metrics.salesToday },
        { key: "orderCount", ...kpi.metrics.orderCount },
        { key: "staffOnDuty", ...kpi.metrics.staffOnDuty },
      ]
    : [
        { key: "salesToday", label: "今日销售额", formatted: "—" },
        { key: "orderCount", label: "订单数", formatted: "—" },
        { key: "staffOnDuty", label: "在岗员工", formatted: "—" },
      ];
  return items
    .map(
      (item) => `
          <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
            <p class="text-xs font-medium text-muted-foreground">${escapeHtml(item.label)}</p>
            <p class="mt-2 text-2xl font-semibold tabular-nums text-card-foreground" data-kpi-value="${escapeHtml(item.key)}">${escapeHtml(item.formatted)}</p>
          </div>`,
    )
    .join("");
}

export function bindDashboardOverviewKpi(root: ParentNode = document): void {
  const grid = root.querySelector("[data-dashboard-kpi-grid]");
  if (!grid || grid.getAttribute("data-kpi-bound") === "1") return;
  grid.setAttribute("data-kpi-bound", "1");

  void fetchDashboardKpi(true).then((kpi) => {
    if (!kpi) return;
    grid.innerHTML = renderKpiCards(kpi);
  });
}

export function getDashboardQuickLinks(): DashboardQuickLink[] {
  const visibleIds = new Set(getVisibleNavModules().map((m) => m.id));
  return QUICK_LINK_DEFS.filter((link) => visibleIds.has(link.moduleId));
}

export function renderDashboardOverviewPage(): string {
  const profileBanner = renderTenantProfileBanner({ compactVariants: true });
  const links = getDashboardQuickLinks();

  return `
    <div class="space-y-6">
      ${profileBanner}

      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-base font-semibold tracking-tight">今日概览</h2>
          <a href="#/dashboard/todos" class="text-sm text-primary underline-offset-2 hover:underline">查看待办 →</a>
        </div>
        <p class="mt-1 text-sm text-muted-foreground">根据您的业态与产线，为您展示常用功能入口。</p>
        <ul class="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3" role="list">
          ${links
            .map(
              (link) => `
            <li>
              <a href="#${link.path}"
                class="group flex min-h-[5rem] flex-col justify-center rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-primary/35 hover:bg-primary/[0.04]">
                <span class="text-sm font-semibold text-card-foreground group-hover:text-primary">${escapeHtml(link.title)}</span>
                <span class="mt-1 text-xs text-muted-foreground">${escapeHtml(link.description)}</span>
              </a>
            </li>`,
            )
            .join("")}
        </ul>
        ${
          links.length === 0
            ? `<p class="mt-4 text-sm text-muted-foreground">暂无可用快捷入口，请前往 <a href="#/settings/feature-presets" class="text-primary underline">平台预设</a> 配置功能模块。</p>`
            : ""
        }
      </div>

      <div class="grid gap-4 sm:grid-cols-3" data-dashboard-kpi-grid>
        ${renderKpiCards(getCachedDashboardKpi())}
      </div>
    </div>`;
}
