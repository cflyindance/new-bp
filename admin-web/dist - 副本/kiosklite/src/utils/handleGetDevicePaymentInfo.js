const handleGetDevicePaymentInfo = (selfConfig) => {
  const unrestricted = {
    devicePayByCard: true,
    devicePayByCash: true,
    devicePayByEcard: true,
  };
  const currentDeviceId = localStorage.getItem('deviceId');
  // 兼容本地测试 默认全部开启
  if (!currentDeviceId) return unrestricted;
  const currentDeviceInfo = selfConfig?.configList
    ?.find((config) => config.id === 34)
    ?.value?.find((device) => device.deviceId === currentDeviceId);
  const devicePaymentType = currentDeviceInfo?.devicePaymentType;
  if (!devicePaymentType) return unrestricted;
  return {
    devicePayByCard: devicePaymentType.canPayByCard ?? true,
    devicePayByCash: devicePaymentType.canPayByCash ?? true,
    devicePayByEcard: devicePaymentType.canPayByEcard || false,
    // menuDisplay
  };
};

export default handleGetDevicePaymentInfo;
