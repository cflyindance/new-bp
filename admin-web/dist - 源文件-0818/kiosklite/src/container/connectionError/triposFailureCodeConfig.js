/** Tripos 壳子 getTransactionResultCode 返回码 → 错误页 UI 配置（文案见 i18n tripos_fail_*） */
export const TRIPOS_FAILURE_UI = {
  '01': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '02': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '03': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '04': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '05': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '06': { showTryAgain: true, tryAgainKey: 'conn_err_btn_retry', showPayCash: true },
  '07': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '12': { showTryAgain: true, tryAgainKey: 'conn_err_btn_retry', showPayCash: true },
  '13': { showTryAgain: true, tryAgainKey: 'conn_err_btn_retry', showPayCash: true },
  '14': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '15': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '30': { showTryAgain: true, tryAgainKey: 'conn_err_btn_retry', showPayCash: true },
  '41': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '43': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '51': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '54': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '57': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '58': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '59': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '61': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '62': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '63': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '65': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '91': { showTryAgain: true, tryAgainKey: 'conn_err_btn_change_card', showPayCash: true },
  '92': { showTryAgain: true, tryAgainKey: 'conn_err_btn_retry', showPayCash: true },
  '96': { showTryAgain: true, tryAgainKey: 'conn_err_btn_retry', showPayCash: true },
};

export function getTriposFailureI18nKeys(code) {
  const normalized = normalizeTriposFailureCode(code);
  if (!normalized) return null;
  return {
    titleKey: `tripos_fail_${normalized}_title`,
    mainKey: `tripos_fail_${normalized}_main`,
  };
}

export function normalizeTriposFailureCode(raw) {
  if (raw == null || raw === '') return '';
  const s = String(raw).trim();
  if (!s) return '';
  return s.padStart(2, '0');
}

export function isKnownTriposFailureCode(code) {
  const normalized = normalizeTriposFailureCode(code);
  return (
    normalized !== '' &&
    Object.prototype.hasOwnProperty.call(TRIPOS_FAILURE_UI, normalized)
  );
}
