/**
 * 打印中心 · 设置二级导航组级说明与跨 hub 跳转提示。
 */

export const PRINT_SETTINGS_PATH = "/print-templates/settings";

export function isPrintSettingsPath(path: string): boolean {
  return path === PRINT_SETTINGS_PATH || path.startsWith(`${PRINT_SETTINGS_PATH}/`);
}

export function renderPrintSettingsHubIntroHtml(): string {
  return `按<strong class="text-card-foreground">出纸与设备 → 订单收据 → 支付签购单 → 打包单 → 取餐号小票</strong>排列。
    厨房单与送厨规则见后厨管理中心；设备绑定见硬件管理中心；计税规则见支付中心「税务计算」。`;
}

export function renderPrintSettingsGroupHintHtml(_groupKey: string): string {
  return "";
}
