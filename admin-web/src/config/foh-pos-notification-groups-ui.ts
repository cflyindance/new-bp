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
  return "";
}

export function renderFohPosOrderAlertsGroupIntroHtml(): string {
  return "";
}
