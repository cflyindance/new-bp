const handleGetDevicePaymentInfo = (selfConfig) => {
  const currentDeviceId = localStorage.getItem('deviceId');
  // 兼容本地测试 默认全部开启
  if (!currentDeviceId) {
    return {
      devicePayByCard: true,
      devicePayByCash: true,
      devicePayByEcard: true,
    };
  }
  const currentDeviceInfo = selfConfig?.configList
    ?.find((config) => config.id === 34)
    ?.value?.find((device) => device.deviceId === currentDeviceId);
  const { devicePaymentType } = currentDeviceInfo;
  return {
    devicePayByCard: devicePaymentType.canPayByCard,
    devicePayByCash: devicePaymentType.canPayByCash,
    devicePayByEcard: devicePaymentType.canPayByEcard || false,
    // menuDisplay
  };
};

export default handleGetDevicePaymentInfo;
