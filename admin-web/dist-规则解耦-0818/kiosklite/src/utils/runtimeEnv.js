/**
 * 运行时环境：默认沿用构建时注入的 REACT_APP_ENV，可由「连点版本号」弹出的环境切换覆盖。
 * 只影响云端接口域名与版本号旁的环境标签，本地 /kpos 接口不受影响。
 */
export const RUNTIME_ENV_STORAGE_KEY = 'kiosk_runtime_env';

export const RUNTIME_ENV = Object.freeze({
  DEV: 'development',
  QA: 'integration',
  PROD: 'production',
});

export const RUNTIME_ENV_OPTIONS = [
  RUNTIME_ENV.DEV,
  RUNTIME_ENV.QA,
  RUNTIME_ENV.PROD,
];

const RUNTIME_ENV_LABELS = Object.freeze({
  [RUNTIME_ENV.DEV]: 'DEV',
  [RUNTIME_ENV.QA]: 'QA',
  [RUNTIME_ENV.PROD]: 'PROD',
});

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidRuntimeEnv(env) {
  return RUNTIME_ENV_OPTIONS.includes(env);
}

function getBuildRuntimeEnv() {
  const env = process.env.REACT_APP_ENV;
  return isValidRuntimeEnv(env) ? env : RUNTIME_ENV.PROD;
}

export function getRuntimeEnv() {
  let saved = null;
  try {
    saved = getStorage()?.getItem(RUNTIME_ENV_STORAGE_KEY);
  } catch {
    saved = null;
  }
  return isValidRuntimeEnv(saved) ? saved : getBuildRuntimeEnv();
}

export function setRuntimeEnv(env) {
  if (!isValidRuntimeEnv(env)) return;
  try {
    getStorage()?.setItem(RUNTIME_ENV_STORAGE_KEY, env);
  } catch {
    /* 隐私模式下写入失败时保持当前环境 */
  }
}

export function getRuntimeEnvLabel(env = getRuntimeEnv()) {
  return RUNTIME_ENV_LABELS[env] || '';
}
