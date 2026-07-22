/**
 * 后厨管理中心 · 设置二级导航组级说明与跨 hub 跳转提示（v2.0：短标题 + 说明条补全）。
 */

export const KITCHEN_SETTINGS_PATH = "/operations/kitchen-kds/settings";

const KITCHEN_GROUP_HINT_HTML: Record<string, string> = {
  "line-merge-rules":
    "按票据类型分别配置是否将相同主菜/子菜合并为一行并汇总数量。厨房单、打包单、食客收据可独立勾选。",
};

export function isKitchenSettingsPath(path: string): boolean {
  return path === KITCHEN_SETTINGS_PATH || path.startsWith(`${KITCHEN_SETTINGS_PATH}/`);
}

export function renderKitchenSettingsHubIntroHtml(): string {
  return `按<strong class="text-card-foreground">送厨范围 → 厨房单分张 → 打印机分配 → 菜品分区 → 行级合并规则 → 多票种共用 → 票面信息 → 票面版式 → 打包单</strong>排列。
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
