import { DEFAULT_CONN_ERR_CODE } from './connectionErrorRouteParams';
import {
  getTriposFailureI18nKeys,
  isKnownTriposFailureCode,
  normalizeTriposFailureCode,
  TRIPOS_FAILURE_UI,
} from './triposFailureCodeConfig';
import { TRIPOS_CARD_INPUT_MODE } from '@/constants/triposCardInputMode';

/** Payment gateway 返回 Express 离线时的 failureReason 关键字 */
export const EXPRESS_OFFLINE_FAILURE_KEYWORD = 'Express is offline';

export function isExpressOfflineFailure(failureReason) {
  const reason = failureReason == null ? '' : String(failureReason);
  return reason.includes(EXPRESS_OFFLINE_FAILURE_KEYWORD);
}

function resolveExpressOfflineFailureUi(t) {
  return {
    mode: 'custom',
    opsText: t('conn_err_express_offline_title'),
    mainText: t('conn_err_express_offline_main'),
    subText: '',
    showSub: false,
    showTryAgain: false,
    tryAgainText: '',
    forceShowPayCash: true,
  };
}

/** 已知业务错误码（非列表内按默认页展示） */
export const KNOWN_CONNECTION_ERROR_CODES = new Set([
  '001', //一般错误
  '002', //手动取消支付
  '003', //卡机断联
  '004', //存单错误
  '005', //刷卡异常
  '101020',
  '101021',
  '101032',
  '101023',
  '101024',
  '101027',
  '101028',
  '101029',
  '101030',
  '101031',
  '101999',
  '101198',
  '101197',
  '101036',
]);

function resolveTriposFailureUi(triposCodeRaw, t) {
  const triposCode = normalizeTriposFailureCode(triposCodeRaw);
  const cfg = TRIPOS_FAILURE_UI[triposCode];
  const i18nKeys = getTriposFailureI18nKeys(triposCode);
  if (!cfg || !i18nKeys) {
    return null;
  }
  return {
    mode: 'custom',
    opsText: t(i18nKeys.titleKey),
    mainText: t(i18nKeys.mainKey),
    subText: '',
    showSub: false,
    showTryAgain: cfg.showTryAgain,
    tryAgainText: cfg.showTryAgain ? t(cfg.tryAgainKey) : '',
    forceShowPayCash: cfg.showPayCash,
  };
}

/**
 * @param {string} codeRaw
 * @param {string} failureReason 接口 failureReason
 * @param {import('i18next').TFunction} t
 * @param {string} [triposFailureCode] Tripos getTransactionResultCode 返回码
 * @returns {{
 *   mode: 'default' | 'custom',
 *   opsText: string,
 *   mainText: string,
 *   subText: string,
 *   showSub: boolean,
 *   showTryAgain: boolean,
 *   tryAgainText: string,
 *   forceShowPayCash: boolean,
 * }}
 */
export function resolveConnectionErrorUi(
  codeRaw,
  failureReason,
  t,
  triposFailureCode = '',
  triposCardInputMode = ''
) {
  const code = String(codeRaw || DEFAULT_CONN_ERR_CODE).trim();
  const reason = failureReason == null ? '' : String(failureReason);

  if (isExpressOfflineFailure(reason)) {
    return resolveExpressOfflineFailureUi(t);
  }

  if (isKnownTriposFailureCode(triposFailureCode)) {
    const triposUi = resolveTriposFailureUi(triposFailureCode, t);
    if (triposUi) {
      return triposUi;
    }
  }

  if (
    code === DEFAULT_CONN_ERR_CODE ||
    !KNOWN_CONNECTION_ERROR_CODES.has(code)
  ) {
    return {
      mode: 'default',
      opsText: t('ops'),
      mainText: reason || t('connect-error'),
      subText: reason ? '' : t('please-retry'),
      showSub: true,
      showTryAgain: true,
      tryAgainText: t('try_again'),
      forceShowPayCash: false,
    };
  }

  switch (code) {
    case '005': {
      const mainTextKey = {
        [TRIPOS_CARD_INPUT_MODE.INSERT_SWIPE_CARD]:
          'conn_err_005_insert_swipe_main',
        [TRIPOS_CARD_INPUT_MODE.SWIPE_TAP_CARD]: 'conn_err_005_swipe_tap_main',
        [TRIPOS_CARD_INPUT_MODE.SWIPE_CARD]: 'conn_err_005_swipe_main',
      }[triposCardInputMode];
      return {
        mode: 'custom',
        opsText: t('conn_err_005_title'),
        mainText: mainTextKey ? t(mainTextKey) : t('connect-error'),
        subText: '',
        showSub: false,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_retry'),
        forceShowPayCash: false,
      };
    }
    case '101020':
      return {
        mode: 'custom',
        opsText: t('conn_err_101020_title'),
        mainText: t('conn_err_101020_main'),
        subText: t('conn_err_101020_sub'),
        showSub: true,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_change_card'),
        forceShowPayCash: false,
      };
    case '101021':
      return {
        mode: 'custom',
        opsText: t('conn_err_101021_title'),
        mainText: t('conn_err_101021_main'),
        subText: t('conn_err_101021_sub'),
        showSub: true,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_change_card'),
        forceShowPayCash: false,
      };
    case '101032':
      return {
        mode: 'custom',
        opsText: t('conn_err_101032_title'),
        mainText: t('conn_err_101032_main'),
        subText: t('conn_err_101032_sub'),
        showSub: true,
        showTryAgain: false,
        tryAgainText: '',
        forceShowPayCash: true,
      };
    case '101023':
    case '002':
      return {
        mode: 'custom',
        opsText: t('conn_err_101023_title'),
        mainText: t('conn_err_101023_main'),
        subText: '',
        showSub: false,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_retry'),
        forceShowPayCash: false,
      };
    case '101024':
      return {
        mode: 'custom',
        opsText: t('conn_err_101024_title'),
        mainText: t('conn_err_101024_main'),
        subText: '',
        showSub: false,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_retry'),
        forceShowPayCash: false,
      };
    case '101027':
    case '101028':
      return {
        mode: 'custom',
        opsText: t('conn_err_101028_title'),
        mainText: t('conn_err_101028_main'),
        subText: '',
        showSub: false,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_change_card'),
        forceShowPayCash: false,
      };
    case '101029':
      return {
        mode: 'custom',
        opsText: t('conn_err_101029_title'),
        mainText: t('conn_err_101029_main'),
        subText: t('conn_err_101029_sub'),
        showSub: true,
        showTryAgain: false,
        tryAgainText: '',
        forceShowPayCash: true,
      };
    case '101030':
      return {
        mode: 'custom',
        opsText: t('conn_err_101030_title'),
        mainText: t('conn_err_101030_main'),
        subText: t('conn_err_101030_sub'),
        showSub: true,
        showTryAgain: false,
        tryAgainText: '',
        forceShowPayCash: true,
      };
    case '101031':
      return {
        mode: 'custom',
        opsText: t('conn_err_101031_title'),
        mainText: t('conn_err_101031_main'),
        subText: t('conn_err_101031_sub'),
        showSub: true,
        showTryAgain: false,
        tryAgainText: '',
        forceShowPayCash: true,
      };
    case '101999':
      return {
        mode: 'custom',
        opsText: t('conn_err_101999_title'),
        mainText: t('conn_err_101999_main'),
        subText: t('conn_err_101999_sub'),
        showSub: true,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_retry'),
        forceShowPayCash: true,
      };
    case '101198':
      return {
        mode: 'custom',
        opsText: t('conn_err_101198_title'),
        mainText: t('conn_err_101198_main'),
        subText: t('conn_err_101198_sub'),
        showSub: true,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_retry'),
        forceShowPayCash: false,
      };
    case '003':
    case '101197':
      return {
        mode: 'custom',
        opsText: t('conn_err_101197_title'),
        mainText: t('conn_err_101197_main'),
        subText: '',
        showSub: false,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_retry'),
        forceShowPayCash: true,
      };
    case '101036':
      return {
        mode: 'custom',
        opsText: t('conn_err_101036_title'),
        mainText: t('conn_err_101036_main'),
        subText: '',
        showSub: false,
        showTryAgain: true,
        tryAgainText: t('conn_err_btn_retry'),
        forceShowPayCash: true,
      };
    case '004':
      return {
        mode: 'custom',
        opsText: t('order-create-fail'),
        mainText:
          reason.trim() === 'Insufficient inventory'
            ? t('order-contains-sold-out-items')
            : t('order-create-sub-fail'),
        subText: '',
        showSub: false,
        showTryAgain: false,
        tryAgainText: '',
        forceShowPayCash: false,
      };
    default:
      return {
        mode: 'default',
        opsText: t('ops'),
        mainText: t('connect-error'),
        subText: t('please-retry'),
        showSub: true,
        showTryAgain: true,
        tryAgainText: t('try_again'),
        forceShowPayCash: false,
      };
  }
}
