/**
 * 系统设置 · 集成与 API · WorldPay（seq 460）。
 * 主开关。
 */

export const WORLDPAY_INTEGRATION_SEQ = 460;

export function isWorldPayIntegrationSeq(seq: number): boolean {
  return seq === WORLDPAY_INTEGRATION_SEQ;
}
