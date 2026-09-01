import {
  normalizePaymentTypes,
  resolveTipPaymentTypes,
} from './tipPaymentTypes';

export const TIP_PROCEDURE_BEFORE_CARD = 0;
export const TIP_PROCEDURE_AFTER_CARD = 1;
export const TIP_PROCEDURE_BEFORE_PAYMENT_METHOD = 2;

export const normalizeTipProcedure = (value) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : value;
};

export const reconcileDualPriceTipProcedure = (
  tipProcedureConfig,
  dualPriceEnabled
) => {
  if (
    !dualPriceEnabled ||
    !tipProcedureConfig ||
    tipProcedureConfig.Authorization ||
    normalizeTipProcedure(tipProcedureConfig.value) !==
      TIP_PROCEDURE_BEFORE_CARD
  ) {
    return tipProcedureConfig;
  }
  return {
    ...tipProcedureConfig,
    value: TIP_PROCEDURE_AFTER_CARD,
  };
};

export const isCardTipProcedureEligible = (
  tipConfig,
  availablePaymentTypes
) => {
  const available = normalizePaymentTypes(availablePaymentTypes);
  const selected = resolveTipPaymentTypes(tipConfig, available);
  return available.includes('0') && selected.includes('0');
};

export const isTipBeforePaymentMethodEligible = (
  tipConfig,
  availablePaymentTypes
) => {
  const available = normalizePaymentTypes(availablePaymentTypes);
  const selected = resolveTipPaymentTypes(tipConfig, available);
  return (
    available.length >= 2 &&
    available.every((paymentType) => selected.includes(paymentType))
  );
};

export const getEligibleTipProcedures = (
  tipConfig,
  availablePaymentTypes,
  paymentConfigLoaded = true
) => {
  if (!paymentConfigLoaded) return [];
  const eligible = [];
  if (isCardTipProcedureEligible(tipConfig, availablePaymentTypes)) {
    eligible.push(TIP_PROCEDURE_BEFORE_CARD, TIP_PROCEDURE_AFTER_CARD);
  }
  if (isTipBeforePaymentMethodEligible(tipConfig, availablePaymentTypes)) {
    eligible.push(TIP_PROCEDURE_BEFORE_PAYMENT_METHOD);
  }
  return eligible;
};

export const shouldStartTipBeforePaymentMethod = (
  selfConfig,
  _systemConfig
) => {
  const configList = selfConfig?.configList || [];
  const procedure = normalizeTipProcedure(
    configList.find((item) => item.id === 24)?.value
  );
  return procedure === TIP_PROCEDURE_BEFORE_PAYMENT_METHOD;
};

export const isTipBeforePaymentMethodFlow = ({
  selfConfig,
  locationState,
  tipFlowState,
}) =>
  shouldStartTipBeforePaymentMethod(selfConfig) ||
  locationState?.nextStep === 'paymentType' ||
  Boolean(tipFlowState?.completedBeforePaymentMethod);

export const pushPaymentMethodEntry = (
  history,
  selfConfig,
  systemConfig
) => {
  if (shouldStartTipBeforePaymentMethod(selfConfig, systemConfig)) {
    history.push('/tippingPanel', { nextStep: 'paymentType' });
    return 'tippingPanel';
  }
  history.push('/paymentType');
  return 'paymentType';
};

export const reconcileTipProcedure = (
  configList,
  availablePaymentTypes,
  paymentConfigLoaded
) => {
  if (!paymentConfigLoaded) return configList;
  const tipConfig = configList?.find((item) => item.id === 5);
  const eligibleProcedures = getEligibleTipProcedures(
    tipConfig,
    availablePaymentTypes,
    paymentConfigLoaded
  );
  return configList?.map((item) => {
    if (item.id !== 24) return item;
    const current = normalizeTipProcedure(item.value);
    if (eligibleProcedures.includes(current)) return item;
    return {
      ...item,
      value: eligibleProcedures.includes(TIP_PROCEDURE_BEFORE_CARD)
        ? TIP_PROCEDURE_BEFORE_CARD
        : null,
    };
  });
};
