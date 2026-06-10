/**
 * 打印中心 · 设置二级导航组级说明与跨 hub 跳转提示。
 */

export const PRINT_SETTINGS_PATH = "/print-templates/settings";

const KITCHEN_PACKING_SLIP_SETTINGS_PATH = "/operations/kitchen-kds/settings/packing-slip";
const HARDWARE_PRINTERS_PATH = "/device-management/hardware/printers";
const PAYMENT_TAX_RULES_PATH = "/transactions/settings/tax-rules";

const PRINT_GROUP_HINT_HTML: Record<string, string> = {
  "print-engine-device": `
    <strong>全局出纸策略</strong>：页高、失败重试、快速模式、出纸前选机；Logo 按票种开关亦在此组。
    打印机设备绑定见
    <a href="#${HARDWARE_PRINTERS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">硬件管理中心 · 打印机</a>。`,
  "order-receipt": `
    <strong>顾客订单明细单</strong>：自动打印时机、份数与重打范围，以及票面字段与版式。
    组内顺序为「何时打 → 打什么」；支付签购单见本页「支付签购单」。`,
  "payment-signature-slip": `
    <strong>支付签购单</strong>：按支付方式/删卡/付款前的出纸规则，以及签名栏、持卡人姓名等票面字段。
    结账客显与食客签名栏见支付中心「食客结账界面」。`,
  "packing-slip": `
    <strong>打包单出纸</strong>：份数、显示价格、删菜样式。
    触发订单类型、分张与合并规则见
    <a href="#${KITCHEN_PACKING_SLIP_SETTINGS_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">后厨管理中心 · 打包单</a>。`,
  "pickup-number-slip": `
    <strong>取餐号小票</strong>：在付款完成、送厨、新建单等节点是否打印排队/取餐号，及打印份数。`,
};

export function isPrintSettingsPath(path: string): boolean {
  return path === PRINT_SETTINGS_PATH || path.startsWith(`${PRINT_SETTINGS_PATH}/`);
}

export function renderPrintSettingsHubIntroHtml(): string {
  return `按<strong class="text-card-foreground">出纸与设备 → 订单收据 → 支付签购单 → 打包单 → 取餐号小票</strong>排列。
    厨房单与送厨规则见后厨管理中心；设备绑定见硬件管理中心；计税规则见支付中心「税务计算」。`;
}

export function renderPrintSettingsGroupHintHtml(groupKey: string): string {
  const body = PRINT_GROUP_HINT_HTML[groupKey];
  if (!body) return "";
  const taxHint =
    groupKey === "order-receipt"
      ? `
    折扣/加收打印位置（290）依赖
    <a href="#${PAYMENT_TAX_RULES_PATH}" class="font-medium text-primary underline-offset-2 hover:underline">支付中心 · 税务计算</a>。`
      : "";
  return `
    <p class="border-b border-border bg-muted/30 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
      ${body.trim()}${taxHint}
    </p>`;
}
