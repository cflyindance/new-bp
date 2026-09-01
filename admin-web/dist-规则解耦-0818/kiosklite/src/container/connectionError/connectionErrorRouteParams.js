import qs from 'qs';

export const DEFAULT_CONN_ERR_CODE = '000';

/**
 * 解析 connectionError 路由参数（search + state）
 * @param {import('react-router').Location} location
 */
export function parseConnectionErrorRoute(location) {
  const q = qs.parse(location.search, { ignoreQueryPrefix: true });
  const code = String(q.code ?? DEFAULT_CONN_ERR_CODE).trim();
  const pay = q.pay;
  const failureReasonFromState =
    location.state &&
    Object.prototype.hasOwnProperty.call(location.state, 'failureReason')
      ? location.state.failureReason
      : undefined;
  const failureReason =
    failureReasonFromState != null && failureReasonFromState !== ''
      ? String(failureReasonFromState)
      : q.failureReason
        ? String(q.failureReason)
        : '';
  const triposFailureCodeFromState =
    location.state &&
    Object.prototype.hasOwnProperty.call(location.state, 'triposFailureCode')
      ? location.state.triposFailureCode
      : undefined;
  const triposFailureCode =
    triposFailureCodeFromState != null && triposFailureCodeFromState !== ''
      ? String(triposFailureCodeFromState).trim()
      : q.triposFailureCode
        ? String(q.triposFailureCode).trim()
        : '';
  const triposCardInputMode = q.triposCardInputMode
    ? String(q.triposCardInputMode).trim()
    : '';
  const orderId = q.orderId ? String(q.orderId).trim() : '';
  return {
    code,
    pay,
    failureReason,
    triposFailureCode,
    triposCardInputMode,
    orderId,
  };
}
