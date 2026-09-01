import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import dayjs from 'dayjs';

const compareByKey = (key) => (m, n) => m[key] - n[key];

// 整理配置数据（缺失项、脏数据
export function mergeRemoteConfigWithDefaults(
  remoteConfig = {},
  defaultConfig = {}
) {
  const nextConfig = cloneDeep(remoteConfig || {});
  const defaultList = Array.isArray(defaultConfig?.configList)
    ? defaultConfig.configList
    : [];
  const rawList = Array.isArray(nextConfig?.configList) ? nextConfig.configList : [];
  const sanitizedList = rawList.filter((item) => item?.id);
  const defectList = [];

  defaultList.forEach((item) => {
    const included = sanitizedList.find((c) => c.id == item.id);
    if (!included) {
      defectList.push(cloneDeep(item));
    }
  });

  nextConfig.configList = sanitizedList
    .concat(defectList)
    .sort(compareByKey('id'));

  return {
    mergedConfig: nextConfig,
    hasInvalidConfigItems: rawList.length !== sanitizedList.length,
    hasMissingConfigItems: defectList.length > 0,
  };
}

const normalizeDeviceUpdateTimeToDate = (updateTime) => {
  if (typeof updateTime !== 'string' || !updateTime) return updateTime;
  const parsed = dayjs(updateTime);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : updateTime;
};

// 设备信息需要保存时，检查是否有变更（包含更新时间，但仅比较日期）
export function normalizeDeviceUpdateTime(config) {
  const clonedConfig = cloneDeep(config);
  const deviceInfoConfig = clonedConfig?.configList?.find((item) => item.id === 34);

  if (Array.isArray(deviceInfoConfig?.value)) {
    deviceInfoConfig.value = deviceInfoConfig.value.map((device) => {
      if (!device || typeof device !== 'object') return device;
      return {
        ...device,
        updateTime: normalizeDeviceUpdateTimeToDate(device.updateTime),
      };
    });
  }

  return clonedConfig;
}

export function upsertLicenseDeviceInfo(config, licenseDevice) {
  const nextConfig = cloneDeep(config || {});
  const configList = Array.isArray(nextConfig.configList) ? nextConfig.configList : [];
  const originConfig = cloneDeep(nextConfig);
  const index = configList.findIndex((item) => item.id === 34);

  if (index !== -1) {
    const licenseDeviceConfig = configList[index];
    const valueList = Array.isArray(licenseDeviceConfig.value)
      ? licenseDeviceConfig.value
      : [];
    let foundFirstMatch = false;

    licenseDeviceConfig.value = valueList.filter((item) => {
      if (item?.deviceId === licenseDevice.deviceId) {
        if (!foundFirstMatch) {
          foundFirstMatch = true;
          return true;
        }
        return false;
      }
      return true;
    });

    const deviceIndex = licenseDeviceConfig.value.findIndex(
      (item) => item?.deviceId === licenseDevice.deviceId
    );
    if (deviceIndex > -1) {
      const preDeviceInfo = licenseDeviceConfig.value[deviceIndex];
      const nextDeviceInfo = {
        ...licenseDevice,
      };
      if (preDeviceInfo?.hasOwnProperty('devicePaymentType')) {
        nextDeviceInfo.devicePaymentType = preDeviceInfo.devicePaymentType;
      }
      if (preDeviceInfo?.hasOwnProperty('menuDisplay')) {
        nextDeviceInfo.menuDisplay = preDeviceInfo.menuDisplay;
      }
      if (preDeviceInfo?.hasOwnProperty('brandDisplay')) {
        nextDeviceInfo.brandDisplay = preDeviceInfo.brandDisplay;
      }
      licenseDeviceConfig.value[deviceIndex] = nextDeviceInfo;
    } else {
      licenseDeviceConfig.value.push(licenseDevice);
    }
  } else {
    configList.push({
      id: 34,
      value: [licenseDevice],
      key: 'licenes-device-info',
    });
  }

  configList.sort(compareByKey('id'));

  const hasDeviceInfoChanged = !isEqual(
    normalizeDeviceUpdateTime(originConfig),
    normalizeDeviceUpdateTime(nextConfig)
  );

  return {
    updatedConfig: nextConfig,
    hasDeviceInfoChanged,
  };
}

export function createConfigSaveQueue(saveHandler) {
  let saveQueue = Promise.resolve();

  return (params) => {
    const payload = cloneDeep(params);
    const run = () => saveHandler(payload);
    const queued = saveQueue.then(run, run);
    saveQueue = queued.catch(() => undefined);
    return queued;
  };
}
