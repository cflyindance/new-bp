const handleBrandDisplayCol = (selfConfig) => {
  const currentDeviceId = localStorage.getItem('deviceId');
  const currentDeviceInfo = selfConfig?.configList
    ?.find((config) => config.id === 34)
    ?.value?.find((device) => device.deviceId === currentDeviceId);

  const brandDisplay = currentDeviceInfo?.brandDisplay;
  if (brandDisplay && [1, 2, 3].includes(brandDisplay)) {
    return {
      useDefault: false,
      colSpan: Math.floor(24 / brandDisplay),
    };
  }

  return { useDefault: true };
};

export default handleBrandDisplayCol;
