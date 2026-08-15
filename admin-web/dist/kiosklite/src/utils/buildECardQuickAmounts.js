import Big from 'big.js';

const KIOSK_CHANNEL = 'KIOSK';
const BONUS_LABEL_KEY = 'ecard_quick_amount_bonus_label';
const SAVE_LABEL_KEY = 'ecard_quick_amount_save_label';
const FIXED_TYPES = ['fixed', 'fixAmount'];
const PERCENTAGE_TYPES = ['percentage'];

const normalizeSettingsData = (settings) => {
  if (settings?.data && typeof settings.data === 'object') {
    return settings.data;
  }

  return settings || {};
};

const isFixedDiscountType = (type) => FIXED_TYPES.includes(type);

const isPercentageDiscountType = (type) => PERCENTAGE_TYPES.includes(type);

const getMatchedDiscount = (discountList = [], amount) => {
  return [...discountList]
    .filter((discount) => {
      const minAmount = discount?.condition?.amount?.gte;
      return typeof minAmount === 'number' && amount >= minAmount;
    })
    .sort(
      (a, b) =>
        (a?.condition?.amount?.gte || 0) - (b?.condition?.amount?.gte || 0)
    )
    .pop();
};

const toMoney = (value) => Number(Big(value || 0).toFixed(2));

const buildECardQuickAmounts = (settings) => {
  const ecardSettings = normalizeSettingsData(settings);
  const purchaseChannels = ecardSettings?.purchaseChannels || [];
  const defaultValues = (ecardSettings?.defaultValues || []).filter(
    (amount) => amount !== null && amount !== undefined && amount !== ''
  );
  const loadDiscount = ecardSettings?.loadDiscount || {};

  if (
    !Array.isArray(purchaseChannels) ||
    !purchaseChannels.includes(KIOSK_CHANNEL)
  ) {
    return [];
  }

  if (!Array.isArray(defaultValues) || defaultValues.length === 0) {
    return [];
  }

  if (!loadDiscount.enable) {
    return defaultValues.map((amount) => ({
      rechargeAmount: amount,
      receivedAmount: amount,
      paymentAmount: amount,
      label: '',
    }));
  }

  return defaultValues.map((amount) => {
    const matchedDiscount = getMatchedDiscount(
      loadDiscount.discountList,
      amount
    );
    const defaultLabel =
      isFixedDiscountType(loadDiscount.type)
        ? BONUS_LABEL_KEY
        : isPercentageDiscountType(loadDiscount.type)
          ? SAVE_LABEL_KEY
          : '';
    const discountType = matchedDiscount?.benefit?.discount?.type;
    const discountValue = matchedDiscount?.benefit?.discount?.value;

    if (discountType === 'fixed' && typeof discountValue === 'number') {
      const receivedAmount = toMoney(Big(amount).plus(discountValue));
      return {
        rechargeAmount: amount,
        receivedAmount,
        paymentAmount: amount,
        bonusAmount: toMoney(Big(receivedAmount).minus(amount)),
        label: BONUS_LABEL_KEY,
        discountValue,
      };
    }

    if (discountType === 'percentage' && typeof discountValue === 'number') {
      const paymentAmount = toMoney(
        Big(amount).times(Big(1).minus(Big(discountValue).div(100)))
      );
      return {
        rechargeAmount: amount,
        receivedAmount: amount,
        paymentAmount,
        saveAmount: toMoney(Big(amount).minus(paymentAmount)),
        label: SAVE_LABEL_KEY,
        discountValue,
      };
    }

    return {
      rechargeAmount: amount,
      receivedAmount: amount,
      paymentAmount: amount,
      bonusAmount: isFixedDiscountType(loadDiscount.type) ? 0 : undefined,
      saveAmount: isPercentageDiscountType(loadDiscount.type) ? 0 : undefined,
      label: defaultLabel,
    };
  });
};

export default buildECardQuickAmounts;
