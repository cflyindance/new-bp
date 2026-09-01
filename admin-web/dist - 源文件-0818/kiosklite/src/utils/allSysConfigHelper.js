import { fetchSystemConfigAllList } from '@/api';
import getPosVersion from '@/utils/getPosVersion';

/** 将 listSystemConfigurations 接口返回的数组转为 { name: value } 对象 */
export function parseSystemConfiguration(systemConfiguration = []) {
  const sysObj = {};
  systemConfiguration.forEach((item) => {
    sysObj[item.name] =
      item.value === undefined || item.value === null ? '' : item.value;
  });
  return sysObj;
}

/** Redux 中 allSysConfig 初始为 []，拉取成功后才是对象 */
export function isAllSysConfigLoaded(allSysConfig) {
  return (
    !Array.isArray(allSysConfig) &&
    allSysConfig != null &&
    Object.keys(allSysConfig).length > 0
  );
}

export function isCreditChargeEnabled(allSysConfig) {
  if (Array.isArray(allSysConfig) || allSysConfig == null) {
    return false;
  }
  const v = allSysConfig.CREDIT_CHARGE_ENABLE;
  return v === 'true' || v === true;
}

/** 拉取 POS 系统配置，返回 { rawData, config } 或 null */
export async function requestAllSysConfig(options = {}) {
  const { timeout = 15000 } = options;
  const posVersionNum = Number(
    getPosVersion(
      localStorage.getItem('poslocalversion') ||
        localStorage.getItem('posVersion')
    )
  );
  try {
    const res = await fetchSystemConfigAllList({ timeout }, posVersionNum);
    if (res?.data?.systemConfiguration) {
      return {
        rawData: res.data,
        config: parseSystemConfiguration(res.data.systemConfiguration),
      };
    }
  } catch (e) {}
  return null;
}

export function normalizeAllSysConfig(allSysConfig) {
  return Array.isArray(allSysConfig) ? {} : allSysConfig || {};
}

/** 拉取系统配置并写入 Redux，返回 config 对象 */
export async function fetchAndDispatchAllSysConfig(
  initConfigParams,
  currentAllSysConfig
) {
  const result = await requestAllSysConfig();
  if (result?.rawData) {
    initConfigParams?.(null, null, null, result.rawData);
    return result.config;
  }
  return normalizeAllSysConfig(currentAllSysConfig);
}

/** Redux 未就绪时拉取，已就绪则直接返回 */
export async function ensureAllSysConfigLoaded(
  initConfigParams,
  currentAllSysConfig
) {
  if (isAllSysConfigLoaded(currentAllSysConfig)) {
    return currentAllSysConfig;
  }
  return fetchAndDispatchAllSysConfig(initConfigParams, currentAllSysConfig);
}
