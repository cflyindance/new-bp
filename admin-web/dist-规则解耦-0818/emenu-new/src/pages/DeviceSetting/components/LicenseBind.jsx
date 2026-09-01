import { CardHead } from '@/components/AdminSettings/CardHead'
import styles from './BindItem.module.less'
import { Button, Select } from 'antd'
import classNames from 'classnames'
import { Card } from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useState } from 'react'
import { listAppInstances } from '@/services/system'
import { useMount } from 'ahooks'

const { Option } = Select

const LicenseBind = (props) => {
  const {
    bindingInfo,
    deviceInfo,
    deviceConfig,
    handleChangeDeviceConfig,
    handleSave,
  } = props
  const { t } = useTranslation()
  const [licenseList, setLicenseList] = useState([])
  const [selectedLicense, setSelectedLicense] = useState(null)

  useMount(() => {
    getLicenseList()
  })

  const allBindLicenses = useMemo(() => {
    return deviceConfig
      .map((item) => {
        const { configInfo } = item
        const deviceBindInfo = configInfo.find((config) => config.id === 50)
        return deviceBindInfo?.value?.licenseId || null
      })
      .filter(Boolean)
  }, [deviceConfig])

  const bindLicense = useMemo(() => {
    return bindingInfo?.licenseId || ''
  }, [bindingInfo])

  useEffect(() => {
    if (licenseList?.length) {
      const currentDeviceLicense = licenseList?.find(
        (l) => l.displayName === deviceInfo?.deviceLicense
      )
      const licenseId = currentDeviceLicense?.id
      setSelectedLicense(
        bindLicense || (allBindLicenses.includes(licenseId) ? null : licenseId)
      )
    }
  }, [deviceInfo, bindLicense, licenseList, allBindLicenses])

  const getLicenseList = async () => {
    try {
      const res = await listAppInstances()
      if (res?.appInstances?.length) {
        const emenuLicense = res?.appInstances?.filter(
          (each) => each.type === 'EMENU'
        )
        setLicenseList(emenuLicense)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const changeSelectedLicense = (val) => {
    setSelectedLicense(val)
  }

  const handleBindDevice = () => {
    const bindLicense = {
      ...bindingInfo,
      deviceId: deviceInfo?.deviceId,
      licenseId: selectedLicense,
      licenseName: licenseList?.find((l) => l.id === selectedLicense)
        ?.displayName,
    }
    handleChangeDeviceConfig(50, bindLicense)
    handleSave()
  }

  const unBindDevice = () => {
    const bindLicense = {
      ...bindingInfo,
      licenseId: null,
      licenseName: null,
    }
    handleChangeDeviceConfig(50, bindLicense)
    handleSave()
  }

  return (
    <div className={styles.bindingItem}>
      <Card elevation={0}>
        <CardHead
          title={
            <div className={styles.bindingInnerContent}>
              <span className={styles.label}>License:</span>
              <Select
                className={styles.list}
                value={selectedLicense}
                onChange={changeSelectedLicense}
                disabled={!!bindLicense}
              >
                {licenseList.map((each) => {
                  return (
                    <Option
                      value={each.id}
                      key={each.id}
                      disabled={allBindLicenses.includes(each.id)}
                    >
                      {each.displayName}
                    </Option>
                  )
                })}
              </Select>
              <span
                className={classNames(
                  styles.bindingType,
                  bindLicense && styles.selected
                )}
              >
                {bindLicense ? t('bind.already_bind') : t('bind.not_bind')}
              </span>
            </div>
          }
          subheader={t('bind.bind_subtitle_license')}
          action={
            bindLicense ? (
              <Button onClick={unBindDevice}>{t('bind.unBind_device')}</Button>
            ) : (
              <Button type="primary" onClick={handleBindDevice}>
                {t('bind.bind_device')}
              </Button>
            )
          }
        />
      </Card>
    </div>
  )
}

export default LicenseBind
