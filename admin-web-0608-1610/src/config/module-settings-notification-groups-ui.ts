/**
 * 消息中心 · 分组说明（员工端总控 vs 员工订单消息 vs 顾客短信渠道）。
 */

export function isNotificationBasicsGroupIntroSeq(seq: number): boolean {
  return seq === 331;
}

export function isNotificationStaffOrderAlertsGroupIntroSeq(seq: number): boolean {
  return seq === 638;
}

export function isNotificationCustomerSmsGroupIntroSeq(seq: number): boolean {
  return seq === 334;
}

export function wrapModuleSettingGroupIntro(innerHtml: string, introHtml: string): string {
  return innerHtml.replace(
    /<div class="border-b border-border px-4 py-3">/,
    `<div class="border-b border-border px-4 py-3">${introHtml}`,
  );
}

export function renderNotificationBasicsGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组为<strong>员工端通知地基</strong>：先勾选需要接收的<strong>通知类型</strong>，再按产线配置<strong>新单语音播报</strong>。
      扫码点餐的<strong>订单文字消息</strong>见「员工订单消息」；桌边「呼叫服务员」在前厅设置，员工是否收到须在总控中勾选「桌边服务请求」。
    </p>`;
}

export function renderNotificationStaffOrderAlertsGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组向<strong>店内员工</strong>推送订单相关提醒（POS/员工端消息），<strong>不发送给顾客</strong>。
      每项可<strong>多选适用产线</strong>；未勾选任何产线即不发送。指定菜品提醒为订单跟单，<strong>非</strong>桌边呼叫。相关类型请在「员工端通知总控 → 员工端通知类型」中启用。
    </p>`;
}

export function renderNotificationCustomerSmsGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组仅配置<strong>顾客短信发送开关</strong>（按产线启用下单完成 / 取餐出餐短信），<strong>不包含</strong>短信文案。
      文案请在 <a href="#/notifications/templates" class="font-medium text-primary underline-offset-2 hover:underline">消息模板</a> 维护，各业务场景关联哪条模板请在 <a href="#/notifications/scene-config" class="font-medium text-primary underline-offset-2 hover:underline">消息配置</a> 选择。
    </p>`;
}
