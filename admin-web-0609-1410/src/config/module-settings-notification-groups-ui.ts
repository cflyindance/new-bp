/**
 * 消息中心 · 分组说明（顾客短信渠道）。
 */

export function isNotificationCustomerSmsGroupIntroSeq(seq: number): boolean {
  return seq === 334;
}

export function wrapModuleSettingGroupIntro(innerHtml: string, introHtml: string): string {
  return innerHtml.replace(
    /<div class="border-b border-border px-4 py-3">/,
    `<div class="border-b border-border px-4 py-3">${introHtml}`,
  );
}

export function renderNotificationCustomerSmsGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组仅配置<strong>顾客短信发送开关</strong>（按产线启用下单完成 / 取餐出餐短信），<strong>不包含</strong>短信文案。
      文案请在 <a href="#/notifications/templates" class="font-medium text-primary underline-offset-2 hover:underline">消息模板</a> 维护，各业务场景关联哪条模板请在 <a href="#/notifications/scene-config" class="font-medium text-primary underline-offset-2 hover:underline">消息配置</a> 选择。
      POS 员工端通知请在前厅 <a href="#/operations/queue-call/settings?group=foh-pos-notification-control" class="font-medium text-primary underline-offset-2 hover:underline">POS 通知总控</a> 配置。
    </p>`;
}
