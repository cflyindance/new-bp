import handleGetDevicePaymentInfo from './handleGetDevicePaymentInfo';

/**
 * 判断当前支付方式是否需要进入 paymentType 路由
 *
 * 支付方式代码：
 * - '0' = credit/debit card (信用卡/借记卡)
 * - '1' = cash (现金)
 * - '2' = ecard (电子卡)
 *
 * @param {Object} systemConfig - 系统配置
 * @param {Object} selfConfig - 设备配置
 * @returns {Object} 判断结果
 * @returns {boolean} returns.shouldSkipPaymentType - 是否跳过 paymentType
 * @returns {boolean} returns.canPayByCard - 是否支持 card 支付（全局+设备）
 * @returns {boolean} returns.canPayByCash - 是否支持 cash 支付（全局+设备）
 * @returns {boolean} returns.canPayByEcard - 是否支持 ecard 支付（全局+设备）
 */
const handlePaymentTypeRoute = (systemConfig, selfConfig) => {
  const {
    devicePayByCard = true,
    devicePayByCash = true,
    devicePayByEcard = true,
  } = handleGetDevicePaymentInfo(selfConfig);

  const paymentTypeValue = systemConfig?.KIOSK_PAYMENT_TYPE?.value;

  if (!paymentTypeValue) {
    return {
      shouldSkipPaymentType: false,
      canPayByCard: false,
      canPayByCash: false,
      canPayByEcard: false,
    };
  }

  // 解析支付方式配置，同时结合全局配置和设备能力
  const canPayByCard = paymentTypeValue.includes('0') && devicePayByCard;
  const canPayByCash = paymentTypeValue.includes('1') && devicePayByCash;
  const canPayByEcard = paymentTypeValue.includes('2') && devicePayByEcard;

  // 判断逻辑：
  // 只有当"只有 card"或"只有 cash"时才跳过 paymentType
  // 其他情况（有 ecard 或有多种支付方式）都进入 paymentType

  const onlyCard = canPayByCard && !canPayByCash && !canPayByEcard;
  const onlyCash = !canPayByCard && canPayByCash && !canPayByEcard;
  const shouldSkipPaymentType = onlyCard || onlyCash;

  return {
    shouldSkipPaymentType,
    canPayByCard,
    canPayByCash,
    canPayByEcard,
    onlyCard,
    onlyCash,
  };
};

export default handlePaymentTypeRoute;
