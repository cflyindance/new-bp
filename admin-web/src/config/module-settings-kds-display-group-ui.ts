/**
 * 后厨管理中心 · KDS 显示与交互 — 组级说明与跨 hub 跳转（v1.0）。
 */

export const KDS_DISPLAY_SETTINGS_PATH = "/operations/kitchen-kds/display";

const KITCHEN_SETTINGS_PATH = "/operations/kitchen-kds/settings";
const KITCHEN_TICKET_GROUPING_PATH = `${KITCHEN_SETTINGS_PATH}/ticket-grouping`;
const KITCHEN_LINE_MERGE_PATH = `${KITCHEN_SETTINGS_PATH}/line-merge-rules`;
const HARDWARE_KDS_PATH = "/device-management/hardware/kds";
const KDS_WORKFLOW_STATUS_PATH = "/operations/kitchen-kds/workflow/kds-workflow-status";

const KDS_DISPLAY_GROUP_HINT_HTML: Record<string, string> = {
  "kds-display-layout": `
    控制 KDS 订单卡片的<strong>整体排布</strong>（瀑布流 / 行列式）。
    与食客端菜单「瀑布流模式」（前厅）无关。`,
  "kds-display-theme": `
    KDS 屏<strong>全局视觉</strong>：主题色、数量后缀、状态标签总开关。
    状态文案与颜色见
    <a href="#${KDS_WORKFLOW_STATUS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">KDS 出餐流程 · 出餐状态</a>。`,
  "kds-display-lines": `
    控制 KDS <strong>行级显隐</strong>。相同菜合并 vs 刻意拆行见
    <a href="#${KITCHEN_TICKET_GROUPING_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">设置 · 菜品分区（54）</a>
    与
    <a href="#${KITCHEN_LINE_MERGE_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">相同行合并</a>。`,
  "kds-display-order-alert": `
    按<strong>订单类型</strong>区分卡片配色；按等待时长阶梯变色提醒厨师。`,
};

export function isKdsDisplaySettingsPath(path: string): boolean {
  return path === KDS_DISPLAY_SETTINGS_PATH || path.startsWith(`${KDS_DISPLAY_SETTINGS_PATH}/`);
}

export function renderKdsDisplaySettingsHubIntroHtml(): string {
  return `本页配置 <strong class="text-card-foreground">KDS 屏</strong>布局、配色与超时提醒。
    厨房单打印字段与相同菜规则见
    <a href="#${KITCHEN_SETTINGS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">设置</a>；
    设备绑定见
    <a href="#${HARDWARE_KDS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">硬件管理中心 · KDS</a>。`;
}

export function renderKdsDisplaySettingsGroupHintHtml(groupKey: string): string {
  const body = KDS_DISPLAY_GROUP_HINT_HTML[groupKey];
  if (!body) return "";
  return `
    <p class="border-b border-border bg-muted/30 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
      ${body.trim()}
    </p>`;
}
