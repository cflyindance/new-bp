/** MSCardReaderErrorCode → i18n key */
const MS_CARD_READER_ERROR_I18N_KEYS = {
  4001: 'moby_card_reader_err_4001',
  4002: 'moby_card_reader_err_4002',
  4003: 'moby_card_reader_err_4003',
  4004: 'moby_card_reader_err_4004',
  4005: 'moby_card_reader_err_4005',
  4006: 'moby_card_reader_err_4006',
  4007: 'moby_card_reader_err_4007',
  4008: 'moby_card_reader_err_4008',
  4009: 'moby_card_reader_err_4009',
  4010: 'moby_card_reader_err_4010',
  4011: 'moby_card_reader_err_4011',
  4012: 'moby_card_reader_err_4012',
  4013: 'moby_card_reader_err_4013',
  4014: 'moby_card_reader_err_4014',
  4015: 'moby_card_reader_err_4015',
  4016: 'moby_card_reader_err_4016',
};

/** code 不为 1 时视为失败 */
export function isMobyCardInfoError(data) {
  if (data == null) return true;
  return Number(data.code) !== 1;
}

/**
 * @param {{ message?: string, body?: { errorCode?: number|string } }} data
 * @param {import('i18next').TFunction} t
 */
export function resolveMobyCardInfoFailureReason(data, t) {
  const rawErrorCode = data?.body?.errorCode;
  if (
    rawErrorCode !== undefined &&
    rawErrorCode !== null &&
    rawErrorCode !== ''
  ) {
    const numericCode = Number(rawErrorCode);
    const i18nKey = MS_CARD_READER_ERROR_I18N_KEYS[numericCode];
    if (i18nKey) {
      return t(i18nKey);
    }
  }

  const lower = String(data?.message ?? '')
    .trim()
    .toLowerCase();
  switch (lower) {
    case 'cardreader lost':
      return t('moby_card_err_card_reader_lost');
    case 'contactlessfailed':
      return t('moby_card_err_contactless_failed');
    case 'cancel':
      return t('moby_card_err_cancel');
    case 'user input timed out':
      return t('moby_card_err_user_input_timed_out');
    case 'the battery level of the card is low':
      return t('moby_card_err_battery_low');
    default:
      return t('connect-error');
  }
}

/** cardState 8/9/10 错误文案 */
export function resolveRuaCardStateFailureReason(cardStateCode, t) {
  switch (Number(cardStateCode)) {
    case 8:
      return t('rua_card_state_err_8');
    case 9:
      return t('moby_card_err_contactless_failed');
    case 10:
      return t('rua_card_state_err_10');
    default:
      return t('connect-error');
  }
}

/**
 * rua 读卡进度文案：code 8/9/10 优先使用已有 i18n，其余优先壳子 message
 * @param {string} type
 * @param {number} code
 * @param {string} message
 * @param {import('i18next').TFunction} t
 */
export function resolveRuaPaymentProgressText(type, code, message, t) {
  if (type === 'cardState') {
    const numericCode = Number(code);
    if (numericCode === 8 || numericCode === 9 || numericCode === 10) {
      return resolveRuaCardStateFailureReason(numericCode, t);
    }
  }

  const raw = String(message ?? '').trim();
  if (raw) return raw;

  return '';
}
