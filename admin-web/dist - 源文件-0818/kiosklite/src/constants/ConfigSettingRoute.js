const ConfigSettingRoute = [
  'configApp',
  'serviceSetting',
  'inventorySetting',
  'allChargeSetting',
  'brandSetting',
  'promotion',
  'deviceSetting',
  'screenSaver',
  'menuLabel',
  'posterPro',
  'loginGuide',
];

/** 从 hash / pathname 解析路由名，如 #/configApp、/configApp → configApp */
export function normalizeConfigSettingRouteName(pathOrHash = '') {
  const raw = String(pathOrHash).split('?')[0].trim();
  return raw.replace(/^#/, '').replace(/^\//, '');
}

/** 判断是否为配置页路由；不传参时读取当前 window.location.hash */
export function isConfigSettingRoute(pathOrHash) {
  const source =
    pathOrHash ??
    (typeof window !== 'undefined' ? window.location.hash : '');
  return ConfigSettingRoute.includes(
    normalizeConfigSettingRouteName(source)
  );
}

export default ConfigSettingRoute;
