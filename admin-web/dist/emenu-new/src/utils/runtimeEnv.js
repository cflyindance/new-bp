export const RUNTIME_ENV_STORAGE_KEY = 'emenu_runtime_env'

export const RUNTIME_ENV = Object.freeze({
  DEV: 'DEV',
  QA: 'QA',
  PROD: 'PROD',
})

export const RUNTIME_ENV_OPTIONS = [
  RUNTIME_ENV.DEV,
  RUNTIME_ENV.QA,
  RUNTIME_ENV.PROD,
]

function getDefaultStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function getDefaultRuntimeEnv(isDev = import.meta.env.DEV) {
  return isDev ? RUNTIME_ENV.DEV : RUNTIME_ENV.PROD
}

export function isValidRuntimeEnv(env) {
  return RUNTIME_ENV_OPTIONS.includes(env)
}

export function getRuntimeEnv(options = {}) {
  const { storage = getDefaultStorage(), isDev = import.meta.env.DEV } = options
  const savedEnv = storage?.getItem(RUNTIME_ENV_STORAGE_KEY)

  if (isValidRuntimeEnv(savedEnv)) {
    return savedEnv
  }

  return getDefaultRuntimeEnv(isDev)
}

export function setRuntimeEnv(env, storage = getDefaultStorage()) {
  if (!isValidRuntimeEnv(env)) return
  storage?.setItem(RUNTIME_ENV_STORAGE_KEY, env)
}

export function getRuntimeEnvLabel(env = getRuntimeEnv()) {
  return isValidRuntimeEnv(env) ? env : getDefaultRuntimeEnv()
}

export function isRuntimeProd(options) {
  return getRuntimeEnv(options) === RUNTIME_ENV.PROD
}
