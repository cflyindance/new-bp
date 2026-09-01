import { CRM_PROVIDER } from '@/crm/providerType'
import { integrationCrmProvider } from '@/crm/providers/integrationCrmProvider'

const providerMap = {
  [CRM_PROVIDER.INTEGRATION]: integrationCrmProvider,
}

export function getCrmProvider(providerType) {
  return providerMap[providerType] || null
}
