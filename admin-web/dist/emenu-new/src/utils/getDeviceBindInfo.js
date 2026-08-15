const getDeviceBindInfo = (deviceConfig) => {
  return deviceConfig
    ?.map((device) => {
      const { configInfo } = device
      const bindInfo = configInfo?.find((config) => config.id === 50)
      return bindInfo || null
    })
    ?.filter(Boolean)
}

export default getDeviceBindInfo
