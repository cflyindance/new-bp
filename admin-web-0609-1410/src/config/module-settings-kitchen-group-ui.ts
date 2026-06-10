/**
 * 后厨管理中心 · 设置二级导航组级说明与跨 hub 跳转提示（v2.0：短标题 + 说明条补全）。
 */

export const KITCHEN_SETTINGS_PATH = "/operations/kitchen-kds/settings";

const FOH_SEND_KITCHEN_SETTINGS_PATH = "/operations/queue-call/settings/foh-kitchen-send-timing";
const PRINT_PACKING_SLIP_SETTINGS_PATH = "/print-templates/settings/packing-slip";
const HARDWARE_PRINTERS_PATH = "/device-management/hardware/printers";

const KITCHEN_GROUP_HINT_HTML: Record<string, string> = {
  "kitchen-order-send": `
    限定<strong>可送厨的订单范围</strong>：按订单类型排除不送厨（36）；未付款订单是否下单后直接送厨（62）。
    收银台送厨时机请在前厅
    <a href="#${FOH_SEND_KITCHEN_SETTINGS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">送厨时机</a>
    配置。`,
  "kitchen-ticket-issue": `
    控制送厨后<strong>厨房单分张方式</strong>：首次送厨是否打印整单（304）；零价菜品是否单独打印厨房小票（32）。`,
  "kitchen-printer-route": `
    按菜品条件将送厨内容<strong>分配至指定厨房打印机</strong>（37）。
    打印机设备绑定见
    <a href="#${HARDWARE_PRINTERS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">硬件管理中心 · 打印机</a>。`,
  "ticket-grouping": `
    单张厨房单内按<strong>座位、菜序、语言、子菜与调味</strong>进行分区展示。
    <strong>54 KDS 分离相同菜</strong>为刻意多行展示，与「相同行合并」可独立配置。`,
  "line-merge-rules": `
    相同主菜/子菜行在<strong>厨房单、打包单、食客收据</strong>上的合并规则（3×2 矩阵）。
    配置入口统一在后厨；打印中心不再重复展示矩阵列项。`,
  "cross-ticket-fields": `
    同时在<strong>厨房单、打包单、订单收据</strong>生效：打印菜品编号（271）、外带订单黑底白字强调（258）；均为「主开关 + 三票种多选」。`,
  "ticket-fields": `
    <strong>厨房单票面字段</strong>：送厨次数、价格、数量、顾客信息、订单时间与合计等是否打印。
    多票种共用项见「多票种共用」；版式见「票面版式」。`,
  "ticket-format": `
    <strong>厨房单票面版式</strong>：边距、备注黑底白字（38）、非零价标记、分割线、数量格式、切纸分段序号等。
    外带三票种强调见「多票种共用」中的 258。`,
  "packing-slip": `
    打包单<strong>触发订单类型、重打与分张</strong>规则（与 seq 36 独立，仅作用于打包单）。
    打印份数、显示价格、删菜样式见
    <a href="#${PRINT_PACKING_SLIP_SETTINGS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">打印中心 · 打包单</a>；
    「堂食」标识见打印中心「订单收据」。`,
};

export function isKitchenSettingsPath(path: string): boolean {
  return path === KITCHEN_SETTINGS_PATH || path.startsWith(`${KITCHEN_SETTINGS_PATH}/`);
}

export function renderKitchenSettingsHubIntroHtml(): string {
  return `按<strong class="text-card-foreground">送厨范围 → 厨房单分张 → 打印机分配 → 菜品分区 → 相同行合并 → 多票种共用 → 票面信息 → 票面版式 → 打包单</strong>排列。
    本 hub 聚焦厨房单与打包单打印及 KDS 展示；收银送厨时机见前厅，设备见硬件管理中心，小票模板见打印中心。`;
}

export function renderKitchenSettingsGroupHintHtml(groupKey: string): string {
  const body = KITCHEN_GROUP_HINT_HTML[groupKey];
  if (!body) return "";
  return `
    <p class="border-b border-border bg-muted/30 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
      ${body.trim()}
    </p>`;
}
