const PAYMENT_CONFIG_NAME = 'KIOSK_PAYMENT_TYPE';
const POS_ONLY_CONFIG_NAMES = [
  'CHOOSE_ORDER_TYPE',
  'KIOSK_SEND_MESSAGE',
];

const MULTI_SELECT_CONFIG_NAMES = new Set([
  PAYMENT_CONFIG_NAME,
  'CHOOSE_ORDER_TYPE',
]);

const normalizeConfigValue = (name, value) => {
  const normalized = String(value ?? '');
  if (!MULTI_SELECT_CONFIG_NAMES.has(name)) return normalized;
  return normalized
    .split(',')
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b))
    .join(',');
};

const configValueByName = (list = []) =>
  new Map(
    list.map((item) => {
      const name = item?.['app:name'];
      return [name, normalizeConfigValue(name, item?.['app:value'])];
    })
  );

export const isValidPosConfigUserId = (userId) => {
  if (typeof userId === 'number') {
    return Number.isFinite(userId) && Number.isInteger(userId) && userId > 0;
  }
  if (typeof userId !== 'string') return false;
  const normalized = userId.trim();
  if (!/^[0-9]+$/.test(normalized)) return false;
  const value = Number(normalized);
  return Number.isSafeInteger(value) && value > 0;
};

export const getPosConfigSaveDecision = ({
  current = [],
  original = [],
  userId,
} = {}) => {
  const currentValues = configValueByName(current);
  const originalValues = configValueByName(original);
  const changedNames = [PAYMENT_CONFIG_NAME, ...POS_ONLY_CONFIG_NAMES].filter(
    (name) => currentValues.get(name) !== originalValues.get(name)
  );
  const paymentTypeChanged = changedNames.includes(PAYMENT_CONFIG_NAME);
  const posOnlyChangedNames = POS_ONLY_CONFIG_NAMES.filter((name) =>
    changedNames.includes(name)
  );
  const authenticated = isValidPosConfigUserId(userId);

  return {
    blocked: !authenticated && posOnlyChangedNames.length > 0,
    shouldSavePos: authenticated && changedNames.length > 0,
    requiresPaymentConfirmation: authenticated && paymentTypeChanged,
    paymentTypeChanged,
    posOnlyChangedNames,
  };
};
