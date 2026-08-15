import assert from 'node:assert/strict'

const moduleUrl = new URL(
  '../src/utils/crmIntegrationMember.js',
  import.meta.url
).href
const { normalizeCrmIntegrationMember, getCrmIntegrationPointBalance } =
  await import(moduleUrl)

const assets = {
  loyaltyAccount: {
    pointBalance: 188,
  },
  vouchers: [{ id: 'voucher-1' }],
}

assert.equal(getCrmIntegrationPointBalance(assets), 188)
assert.equal(getCrmIntegrationPointBalance({}), 0)

const member = normalizeCrmIntegrationMember(
  {
    id: 'customer-1',
    phone: '2135558888',
    firstName: 'Ada',
    lastName: 'Lovelace',
  },
  assets
)

assert.equal(member.id, 'customer-1')
assert.equal(member.userId, 'customer-1')
assert.equal(member.phone, '2135558888')
assert.equal(member.phoneNumber, '2135558888')
assert.equal(member.pointBalance, 188)
assert.deepEqual(member.crmIntegrationAssets, assets)
assert.deepEqual(member.crmIntegrationVouchers, [{ id: 'voucher-1' }])

console.log('crmIntegrationMember tests passed')
