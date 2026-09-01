import LicenseBind from './LicenseBind'
import TableBind from './TableBind'

const BindingSetting = (props) => {
  const {
    deviceInfo,
    getDeviceConfig,
    handleChangeDeviceConfig,
    handleSave,
    deviceConfig,
  } = props
  const bindingInfo = getDeviceConfig(50) || {}

  return (
    <div>
      <LicenseBind
        bindingInfo={bindingInfo}
        deviceInfo={deviceInfo}
        deviceConfig={deviceConfig}
        handleChangeDeviceConfig={handleChangeDeviceConfig}
        handleSave={handleSave}
      />
      <TableBind
        bindingInfo={bindingInfo}
        deviceInfo={deviceInfo}
        deviceConfig={deviceConfig}
        handleChangeDeviceConfig={handleChangeDeviceConfig}
        handleSave={handleSave}
      />
    </div>
  )
}

export default BindingSetting
