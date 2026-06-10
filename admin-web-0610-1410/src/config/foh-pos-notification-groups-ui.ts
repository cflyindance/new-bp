/**
 * 前厅管理中心 · POS 通知分组说明（总控 vs 订单消息提醒）。
 */

export function isFohPosNotificationControlGroupIntroSeq(seq: number): boolean {
  return seq === 331;
}

export function isFohPosOrderAlertsGroupIntroSeq(seq: number): boolean {
  return seq === 638;
}

export function renderFohPosNotificationControlGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组为<strong>POS/员工端通知地基</strong>：先勾选需要接收的<strong>通知类型</strong>，再按产线配置<strong>新单语音播报</strong>。
      扫码点餐的<strong>订单文字消息</strong>见「订单消息提醒」；桌边「呼叫服务员」在
      <a href="#/operations/queue-call/settings?group=foh-tableside-service" class="font-medium text-primary underline-offset-2 hover:underline">桌边服务</a>
      配置，员工是否收到须在总控中勾选「桌边服务请求」。
    </p>`;
}

export function renderFohPosOrderAlertsGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组向<strong>店内员工</strong>推送订单相关提醒（POS/员工端消息），<strong>不发送给顾客</strong>。
      每项可<strong>多选适用产线</strong>；未勾选任何产线即不发送。指定菜品提醒为订单跟单，<strong>非</strong>桌边呼叫。相关类型请在「POS 通知总控 → 员工端通知类型」中启用。
    </p>`;
}
