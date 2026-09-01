import { resolveKioskPaymentTypes } from './kioskPaymentTypes';

export const TIP_PAYMENT_TYPE_CARD = '0';
export const TIP_PAYMENT_TYPE_CASH = '1';
export const TIP_PAYMENT_TYPE_GIFT_CARD = '2';

const ELIGIBLE_TIP_PAYMENT_TYPES = [
  TIP_PAYMENT_TYPE_CARD,
  TIP_PAYMENT_TYPE_CASH,
  TIP_PAYMENT_TYPE_GIFT_CARD,
];

export const normalizePaymentTypes = (value) => {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(',');
  return [...new Set(raw.map(String))].filter((item) =>
    ELIGIBLE_TIP_PAYMENT_TYPES.includes(item)
  );
};

export const getAvailableTipPaymentTypes = (posConfigList) => {
  const paymentConfig = posConfigList?.find(
    (item) => item?.['app:name'] === 'KIOSK_PAYMENT_TYPE'
  );
  return normalizePaymentTypes(paymentConfig?.['app:value']);
};

export const resolveTipPaymentTypes = (tipConfig, availablePaymentTypes) => {
  const available = normalizePaymentTypes(availablePaymentTypes);
  const configured = Array.isArray(tipConfig?.tipPaymentTypes)
    ? normalizePaymentTypes(tipConfig.tipPaymentTypes)
    : available;
  return configured.filter((item) => available.includes(item));
};

export const reconcileTipConfig = (tipConfig, availablePaymentTypes) => ({
  ...tipConfig,
  value: Boolean(tipConfig?.value),
  tipPaymentTypes: resolveTipPaymentTypes(tipConfig, availablePaymentTypes),
});

const paymentTypeToCode = (paymentType) => {
  if (paymentType === 'CREDIT_CARD') return TIP_PAYMENT_TYPE_CARD;
  if (paymentType === 'CASH') return TIP_PAYMENT_TYPE_CASH;
  if (paymentType === 'GIFT_CARD') return TIP_PAYMENT_TYPE_GIFT_CARD;
  return null;
};

export const isTipEnabledForPaymentType = (
  selfConfig,
  paymentType,
  systemConfig
) => {
  const tipConfig = selfConfig?.configList?.find((item) => item.id === 5);
  if (!tipConfig) return false;

  const code = paymentTypeToCode(paymentType);
  if (!code) return false;

  const available = normalizePaymentTypes(
    resolveKioskPaymentTypes(selfConfig, systemConfig)
  );
  if (!available.includes(code)) return false;

  if (!Array.isArray(tipConfig.tipPaymentTypes)) return true;
  return normalizePaymentTypes(tipConfig.tipPaymentTypes).includes(code);
};
