export function getCrmIntegrationPointBalance(assets) {
  return Number(assets?.loyaltyAccount?.pointBalance || 0)
}

export function normalizeCrmIntegrationMember(customer, assets = {}) {
  if (!customer || !Object.keys(customer).length) return null

  const customerId = customer.id || customer.userId
  const phone = customer.phone || customer.phoneNumber || ''

  return {
    ...customer,
    id: customerId,
    userId: customerId,
    phone,
    phoneNumber: phone,
    pointBalance: getCrmIntegrationPointBalance(assets),
    crmIntegrationAssets: assets,
    crmIntegrationVouchers: Array.isArray(assets?.vouchers)
      ? assets.vouchers
      : [],
  }
}
