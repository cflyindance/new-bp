import { normalizeTriposFailureCode } from '@/container/connectionError/triposFailureCodeConfig';

/**
 * 调用壳子 getTransactionResultCode，获取 Tripos 交易结果码（body 内值）。
 * @param {string|number} amount 当前订单金额（元）
 * @returns {Promise<string>} 归一化后的 triposFailureCode，如 "05"
 */
export async function getTriposTransactionResultCode(amount) {
  if (amount == null || amount === '') {
    return '';
  }
  if (!window.AppJSBridge || typeof window.AppJSBridge.call !== 'function') {
    throw new Error('AppJSBridge 未初始化');
  }
  const result = await window.AppJSBridge.call('getTransactionResultCode', {
    amount: String(amount),
  });
  const body =
    result != null &&
    typeof result === 'object' &&
    Object.prototype.hasOwnProperty.call(result, 'body')
      ? result.body
      : result;
  return normalizeTriposFailureCode(body);
}
