/**
 * 主页 · 待办 — 按租户功能画像过滤（P4）
 */
import { getVisibleNavModules } from "./feature-visibility";
import { listEffectiveVariantsForTenant } from "./feature-presets-variant-runtime";
import { renderTenantProfileBanner } from "./tenant-profile-banner-ui";
import { loadTenantProfile } from "./tenant-profile-storage";

export type TodoPriority = "high" | "medium" | "low";

export interface DashboardTodoItem {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  path: string;
  priority: TodoPriority;
}

const TODO_DEFS: DashboardTodoItem[] = [
  {
    id: "shift-close",
    moduleId: "finance-center",
    title: "完成今日班结",
    description: "核对收银班次与钱箱，提交日结",
    path: "/finance/settings",
    priority: "high",
  },
  {
    id: "open-orders",
    moduleId: "orders",
    title: "处理未结订单",
    description: "检查挂单与异常订单",
    path: "/orders/settings",
    priority: "high",
  },
  {
    id: "kds-prep",
    moduleId: "kitchen-kds",
    title: "确认后厨档口配置",
    description: "检查 KDS 显示与出餐流程",
    path: "/operations/kitchen-kds/settings",
    priority: "medium",
  },
  {
    id: "foh-line",
    moduleId: "queue-call",
    title: "检查前厅产线设置",
    description: "点单界面与食客端是否就绪",
    path: "/operations/queue-call/settings",
    priority: "medium",
  },
  {
    id: "device-health",
    moduleId: "device-management",
    title: "巡检硬件设备",
    description: "打印机、支付终端在线状态",
    path: "/device-management/hardware/payments",
    priority: "medium",
  },
  {
    id: "member-campaign",
    moduleId: "marketing",
    title: "查看营销活动进度",
    description: "进行中的促销与触达任务",
    path: "/marketing/settings",
    priority: "low",
  },
  {
    id: "inventory-alert",
    moduleId: "inventory-ordering",
    title: "处理库存预警",
    description: "低库存与采购建议",
    path: "/operations/inventory-ordering/settings",
    priority: "low",
  },
  {
    id: "waitlist-fulfill",
    moduleId: "waitlist",
    title: "跟进外卖履约",
    description: "待接单与配送异常",
    path: "/operations/waitlist",
    priority: "high",
  },
];

const PRIORITY_LABEL: Record<TodoPriority, string> = {
  high: "紧急",
  medium: "一般",
  low: "可延后",
};

const PRIORITY_CLASS: Record<TodoPriority, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildVariantAwareTodos(): DashboardTodoItem[] {
  const profile = loadTenantProfile();
  if (!profile) return [];
  const variants = listEffectiveVariantsForTenant(
    profile.primaryBusinessType,
    profile.productLinePresetIds,
  );
  if (variants.length === 0) return [];
  const visibleIds = new Set(getVisibleNavModules().map((m) => m.id));
  if (!visibleIds.has("queue-call")) return [];
  return [
    {
      id: "variant-foh-settings",
      moduleId: "queue-call",
      title: "核对前厅业态×产线预设",
      description: `已应用 ${variants.map((v) => v.title).join("、")}，请在前厅设置中确认跳过选桌、人数等业务项`,
      path: "/operations/queue-call/settings",
      priority: "medium",
    },
  ];
}

export function getDashboardTodos(): DashboardTodoItem[] {
  const visibleIds = new Set(getVisibleNavModules().map((m) => m.id));
  const base = TODO_DEFS.filter((t) => visibleIds.has(t.moduleId));
  const extra = buildVariantAwareTodos().filter((t) => !base.some((b) => b.id === t.id));
  return [...extra, ...base];
}

export function renderDashboardTodosPage(): string {
  const profileBanner = renderTenantProfileBanner({ compactVariants: true });
  const todos = getDashboardTodos();
  const high = todos.filter((t) => t.priority === "high");
  const rest = todos.filter((t) => t.priority !== "high");

  const renderRow = (t: DashboardTodoItem) => `
    <li class="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3">
      <span class="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_CLASS[t.priority]}">${PRIORITY_LABEL[t.priority]}</span>
      <div class="min-w-0 flex-1">
        <a href="#${t.path}" class="text-sm font-medium text-foreground hover:text-primary">${escapeHtml(t.title)}</a>
        <p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(t.description)}</p>
      </div>
    </li>`;

  return `
    <div class="space-y-6">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">待办事项</h1>
          <p class="mt-1 text-sm text-muted-foreground">根据当前功能画像与生效变体展示相关任务。</p>
        </div>
        <a href="#/dashboard/overview" class="text-sm text-primary underline-offset-2 hover:underline">← 今日概览</a>
      </div>

      ${profileBanner}

      ${
        todos.length === 0
          ? `<p class="text-sm text-muted-foreground">暂无待办。请前往 <a href="#/settings/feature-presets" class="text-primary underline">平台预设</a> 配置相关模块。</p>`
          : `
      ${
        high.length > 0
          ? `
      <section>
        <h2 class="mb-3 text-sm font-medium text-muted-foreground">优先处理</h2>
        <ul class="grid list-none gap-2 p-0" role="list">${high.map(renderRow).join("")}</ul>
      </section>`
          : ""
      }
      ${
        rest.length > 0
          ? `
      <section>
        <h2 class="mb-3 text-sm font-medium text-muted-foreground">其他待办</h2>
        <ul class="grid list-none gap-2 p-0" role="list">${rest.map(renderRow).join("")}</ul>
      </section>`
          : ""
      }`
      }
    </div>`;
}
