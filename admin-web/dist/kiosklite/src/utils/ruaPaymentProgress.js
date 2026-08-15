import store from '../reducers/store';
import { setTriposPayReady, setTriposPayFinish } from '@/actions';
import { posFrontLog } from '@/api';
import { EventBus } from '@/utils/EventBus';
import {
  RUA_PROGRESS_TYPE,
  RUA_CARD_STATE,
  RUA_PAYMENT_PROGRESS_EVENT,
} from '@/constants/ruaPaymentProgress';

let ruaPaymentActive = false;
let lastProgress = { type: null, code: null };
const progressListeners = new Set();
/** 异常 posFrontLog 去重 key，支付结束 reset 时清空 */
const loggedAbnormalKeys = new Set();

function posFrontLogRuaAbnormalOnce(key, message) {
  if (loggedAbnormalKeys.has(key)) return;
  loggedAbnormalKeys.add(key);
  posFrontLog(message);
}

const CARD_STATE_PAY_READY = new Set([
  RUA_CARD_STATE.READY_FOR_INSERT,
  RUA_CARD_STATE.WAITING_FOR_CARD,
]);

const CARD_STATE_PAY_FINISH = new Set([
  RUA_CARD_STATE.MAGSTRIPE_SWIPED,
  RUA_CARD_STATE.CONTACTLESS_TAPPED,
  RUA_CARD_STATE.ICC_INSERTED,
  RUA_CARD_STATE.READING,
]);

export function isRuaPaymentActive() {
  return ruaPaymentActive;
}

export function setRuaPaymentActive(active) {
  ruaPaymentActive = !!active;
  if (!ruaPaymentActive) {
    resetRuaPaymentProgress();
  }
}

export function resetRuaPaymentProgress() {
  lastProgress = { type: null, code: null };
  loggedAbnormalKeys.clear();
}

export function subscribeRuaPaymentProgress(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
}

function parseProgressPayload(raw) {
  if (raw == null) return null;

  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch (err) {
      const errMsg = err?.message || err;
      posFrontLogRuaAbnormalOnce(
        `parse:${errMsg}`,
        `CR_onGetCreditCardInfoByIngenicoProgress 解析失败: ${errMsg}`
      );
      return null;
    }
  }

  const type = data?.type ?? data?.progressType;
  const code = data?.code ?? data?.state;
  if (type == null || code == null) return null;

  return {
    type: String(type),
    code: Number(code),
    message: data?.msg ?? data?.message ?? '',
  };
}

function notifyProgressChange(payload) {
  progressListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (err) {
      const errMsg = err?.message || err;
      posFrontLogRuaAbnormalOnce(
        `listener:${errMsg}`,
        `ruaPaymentProgress listener error: ${errMsg}`
      );
    }
  });
  EventBus.emit(RUA_PAYMENT_PROGRESS_EVENT, payload);
}

/** 将 rua 进度映射为 CardPayment 沿用的 tripos 就绪/完成信号 */
export function applyRuaProgressToTriposState(type, code) {
  const numericCode = Number(code);

  if (type !== RUA_PROGRESS_TYPE.CARD_STATE) return;

  if (CARD_STATE_PAY_READY.has(numericCode)) {
    store.dispatch(setTriposPayReady(true));
  }
  if (CARD_STATE_PAY_FINISH.has(numericCode)) {
    store.dispatch(setTriposPayFinish(true));
  }
}

/**
 * type / code 相对上次有变化时传出 { type, code, message }，并同步 tripos 状态信号
 * @returns {{ type: string, code: number, message: string } | null}
 */
export function emitRuaPaymentProgressIfChanged(type, code, message = '') {
  const normalizedType = String(type);
  const normalizedCode = Number(code);
  const normalizedMessage = String(message ?? '');

  if (
    lastProgress.type === normalizedType &&
    lastProgress.code === normalizedCode
  ) {
    return null;
  }

  lastProgress = { type: normalizedType, code: normalizedCode };
  const payload = {
    type: normalizedType,
    code: normalizedCode,
    message: normalizedMessage,
  };

  notifyProgressChange(payload);

  if (ruaPaymentActive) {
    posFrontLog(
      `ruaPaymentProgress: type=${payload.type}, code=${payload.code}, message=${payload.message}`
    );
    applyRuaProgressToTriposState(payload.type, payload.code);
  }

  return payload;
}

/** 壳子主动通知入口，挂到 window.CR_onGetCreditCardInfoByIngenicoProgress */
export function handleGetCreditCardInfoByIngenicoProgress(rawData) {
  const payload = parseProgressPayload(rawData);
  if (!payload) return null;
  return emitRuaPaymentProgressIfChanged(
    payload.type,
    payload.code,
    payload.message
  );
}
