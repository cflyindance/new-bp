/** rua 读卡进度 type */
export const RUA_PROGRESS_TYPE = {
  CARD_STATE: 'cardState',
  TRANSACTION_STATE: 'transactionState',
};

/** cardState code */
export const RUA_CARD_STATE = {
  UNKNOWN: 0,
  READY_FOR_INSERT: 1,
  WAITING_FOR_CARD: 2,
  MAGSTRIPE_SWIPED: 3,
  CONTACTLESS_TAPPED: 4,
  ICC_INSERTED: 5,
  CARD_REMOVED: 6,
  READING: 7,
  READ_FAILED: 8,
  TAP_FAILED: 9,
  MULTIPLE_CARDS: 10,
  TRANSACTION_CANCELLED: 11,
  CARD_EXPIRED: 12,
  DEVICE_BUSY: 13,
};

/** transactionState code */
export const RUA_TRANSACTION_STATE = {
  INITIAL: 0,
  PREPARING: 1,
  PROCESSING: 2,
  CANCELLED: 3,
  COMPLETED: 4,
};

export const RUA_PAYMENT_PROGRESS_EVENT = 'rua_payment_progress';
export const RUA_PAYMENT_PROGRESS_ERROR_EVENT = 'rua_payment_progress_error';
