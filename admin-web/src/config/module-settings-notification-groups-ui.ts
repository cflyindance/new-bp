/**
 * 消息中心 · 分组说明（员工店内提醒 vs 顾客短信）。
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
      本组为<strong>全局通知能力</strong>：按消息主题启用产品线提醒，并按产线配置<strong>新单语音播报</strong>。
      扫码点餐（eMenu）的<strong>店内文字消息</strong>见「店内员工订单提醒」；桌边「呼叫服务员」能力在前厅设置，员工是否收到 Service Request 须在本组主题中勾选。
    </p>`;
}

export function renderNotificationStaffOrderAlertsGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组向<strong>店内员工</strong>推送订单相关提醒（POS/员工端消息），<strong>不发送给顾客</strong>。
      每项可<strong>多选适用产线</strong>（与「语音提醒」产线集合一致）；未勾选任何产线即不发送。指定菜品提醒为订单跟单，<strong>非</strong>桌边呼叫。相关主题请在「通知基础与渠道 → 消息中心的主题」中启用。
    </p>`;
}

export function renderNotificationCustomerSmsGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组配置<strong>发给顾客手机</strong>的短信：点单完成小票、取餐/出餐提醒及文案模板。
      与「店内员工订单提醒」无关；渠道与模板按产线、履约方式（ASAP/预点单、配送/非配送）分别维护。
    </p>`;
}
