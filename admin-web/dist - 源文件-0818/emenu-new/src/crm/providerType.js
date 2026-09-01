export const CRM_PROVIDER = Object.freeze({
  NONE: 'none',
  LEGACY: 'legacy',
  INTEGRATION: 'integration',
})

export const CRM_CONFIG = Object.freeze({
  LEGACY_POS: 'POS_CRM_SERVICE_ENABLED',
  LEGACY_CRM: 'CRM_SERVICE_ENABLED',
  INTEGRATION: 'CRM_INTEGRATION_SERVICE_ENABLED',
})

export function isConfigEnabled(systemInfo = [], configName) {
  return (
    systemInfo.find((config) => config.name === configName)?.value === 'true'
  )
}

export function resolveCrmProviderType(systemInfo = []) {
  const isLegacyEnabled =
    isConfigEnabled(systemInfo, CRM_CONFIG.LEGACY_POS) ||
    isConfigEnabled(systemInfo, CRM_CONFIG.LEGACY_CRM)
  const isIntegrationEnabled = isConfigEnabled(
    systemInfo,
    CRM_CONFIG.INTEGRATION
  )

  if (isIntegrationEnabled) return CRM_PROVIDER.INTEGRATION
  if (isLegacyEnabled) return CRM_PROVIDER.LEGACY
  return CRM_PROVIDER.NONE
}

export function isCrmEnabled(systemInfo = []) {
  return resolveCrmProviderType(systemInfo) !== CRM_PROVIDER.NONE
}
