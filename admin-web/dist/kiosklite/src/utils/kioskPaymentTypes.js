export const KIOSK_PAYMENT_TYPES_CONFIG_ID = 70;
export const KIOSK_PAYMENT_TYPES_CONFIG_KEY = 'kiosk-payment-types';
export const VALID_KIOSK_PAYMENT_TYPES = ['0', '1', '2'];

export const normalizeKioskPaymentTypes = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String))]
    .filter((item) => VALID_KIOSK_PAYMENT_TYPES.includes(item))
    .sort((a, b) => Number(a) - Number(b));
};

const normalizeLegacyPosPaymentTypes = (value) =>
  [...new Set(String(value ?? '').split(',').map(String))]
    .filter((item) => VALID_KIOSK_PAYMENT_TYPES.includes(item))
    .sort((a, b) => Number(a) - Number(b));

export const getKioskPaymentTypesConfigState = (configList) => {
  const config = configList?.find(
    (item) => item?.id === KIOSK_PAYMENT_TYPES_CONFIG_ID
  );
  if (!config) return { status: 'missing', value: [] };
  if (!Array.isArray(config.value)) {
    return { status: 'invalid', value: [] };
  }
  const value = normalizeKioskPaymentTypes(config.value);
  return value.length
    ? { status: 'valid', value }
    : { status: 'invalid', value: [] };
};

export const resolveKioskPaymentTypes = (selfConfig, systemConfig) => {
  const state = getKioskPaymentTypesConfigState(selfConfig?.configList);
  if (state.status === 'valid') return state.value;
  if (state.status === 'invalid') return [];
  return normalizeLegacyPosPaymentTypes(
    systemConfig?.KIOSK_PAYMENT_TYPE?.value
  );
};

export const upsertKioskPaymentTypesConfig = (configList, value) => {
  const normalized = normalizeKioskPaymentTypes(value);
  if (!normalized.length) return configList;
  const next = [...(configList || [])];
  const index = next.findIndex(
    (item) => item?.id === KIOSK_PAYMENT_TYPES_CONFIG_ID
  );
  const config = {
    id: KIOSK_PAYMENT_TYPES_CONFIG_ID,
    key: KIOSK_PAYMENT_TYPES_CONFIG_KEY,
    value: normalized,
  };
  if (index < 0) next.push(config);
  else next[index] = { ...next[index], ...config };
  return next.sort((a, b) => Number(a.id) - Number(b.id));
};
