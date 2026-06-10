/**
 * 后厨管理中心 · KDS 出餐流程 — 组级说明与跨 hub 跳转（v1.0）。
 */

export const KDS_WORKFLOW_SETTINGS_PATH = "/operations/kitchen-kds/workflow";

const FOH_SEND_KITCHEN_SETTINGS_PATH = "/operations/queue-call/settings/foh-kitchen-send-timing";
const KITCHEN_PRINTER_ROUTE_PATH = "/operations/kitchen-kds/settings/kitchen-printer-route";
const KITCHEN_TICKET_GROUPING_PATH = "/operations/kitchen-kds/settings/ticket-grouping";
const HARDWARE_KDS_PATH = "/device-management/hardware/kds";
const KDS_DISPLAY_THEME_PATH = "/operations/kitchen-kds/display/kds-display-theme";

const KDS_WORKFLOW_GROUP_HINT_HTML: Record<string, string> = {
  "kds-workflow-status": `
    固定流水线 <strong>待制作 → 制作中 → 已出餐 → 完成</strong> 的中英文标签与背景色。
    v1 不可打乱顺序；状态标签总开关见
    <a href="#${KDS_DISPLAY_THEME_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">KDS 显示与交互 · 主题与标签</a>。`,
  "kds-workflow-confirm": `
    降低误触<strong>撤销或回退</strong>的风险；关键状态转移可单独要求二次确认。`,
  "kds-workflow-cross-terminal": `
    <strong>KDS 与 RDS</strong>（备餐/出餐屏）流程模板对齐，避免多端状态不一致。`,
  "kds-workflow-advanced": `
    部分完成、子菜流程等<strong>进阶策略</strong>，默认影响点击粒度。
    纸单子菜分区见
    <a href="#${KITCHEN_TICKET_GROUPING_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">设置 · 菜品分区</a>，可独立配置。`,
  "kds-workflow-alert": `
    门店默认<strong>响铃策略</strong> + 按<strong>应用实例</strong>覆盖（次数/类型）。
    实例选项与
    <a href="#${HARDWARE_KDS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">硬件管理中心 · KDS</a>
    设备台账同步（原型默认含 KDS / 111 / 11）。`,
};

export function isKdsWorkflowSettingsPath(path: string): boolean {
  return path === KDS_WORKFLOW_SETTINGS_PATH || path.startsWith(`${KDS_WORKFLOW_SETTINGS_PATH}/`);
}

export function renderKdsWorkflowSettingsHubIntroHtml(): string {
  return `本页配置 <strong class="text-card-foreground">出餐状态、点击规则与 KDS↔RDS 协同</strong>。
    送厨时机见
    <a href="#${FOH_SEND_KITCHEN_SETTINGS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">前厅 · 送厨时机</a>；
    打印机路由见
    <a href="#${KITCHEN_PRINTER_ROUTE_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">设置 · 打印机分配</a>。`;
}

export function renderKdsWorkflowSettingsGroupHintHtml(groupKey: string): string {
  const body = KDS_WORKFLOW_GROUP_HINT_HTML[groupKey];
  if (!body) return "";
  return `
    <p class="border-b border-border bg-muted/30 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
      ${body.trim()}
    </p>`;
}
