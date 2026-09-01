import qs from 'qs';
import { posFrontLog } from '@/api';

/** 支付流程相关页面（Hash 路径片段） */
export const PAYMENT_FLOW_PAGE_KEYWORDS = ['cardPayment'];

export function isOnPaymentFlowPage(hash = window.location.hash) {
  return PAYMENT_FLOW_PAGE_KEYWORDS.some((key) => hash.indexOf(key) > -1);
}

/**
 * 跳转 connectionError 报错页（HashRouter，无 history 时使用）
 * @param {{
 *   code?: string,
 *   pay?: number|string,
 *   failureReason?: string,
 *   triposFailureCode?: string,
 *   triposCardInputMode?: string,
 * }} options
 */
export function navigateToConnectionError({
  code = '000',
  pay = 0,
  failureReason = '',
  triposFailureCode = '',
  triposCardInputMode = '',
} = {}) {
  if (window.location.hash.indexOf('connectionError') > -1) {
    return;
  }

  const logTripos = triposFailureCode ? ` tripos=${triposFailureCode}` : '';
  posFrontLog(`Kiosk Payment Error: 【${code}】${failureReason}${logTripos}`);

  const search = qs.stringify({
    pay,
    code,
    ...(triposFailureCode ? { triposFailureCode } : {}),
    ...(triposCardInputMode ? { triposCardInputMode } : {}),
    ...(failureReason ? { failureReason } : {}),
  });
  window.location.hash = `#/connectionError?${search}`;
}
