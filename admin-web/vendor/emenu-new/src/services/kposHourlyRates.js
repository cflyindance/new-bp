const ENDPOINT = '/kpos/ws/kposService'

function envelope(operation) {
  return `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:${operation}></app:${operation}></soapenv:Body></soapenv:Envelope>`
}

function children(root, name) {
  return Array.from(root.querySelectorAll('*')).filter(
    (node) => node.localName.toLowerCase() === name.toLowerCase()
  )
}

function directText(root, name) {
  return Array.from(root.children).find(
    (node) => node.localName.toLowerCase() === name.toLowerCase()
  )?.textContent?.trim() || ''
}

function positive(value) {
  if (value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function parsePricing(rates) {
  const sorted = [...rates].sort((a, b) => a.from - b.from)
  let previous = 0
  const domainRates = sorted.map((rate, index) => {
    const last = index === sorted.length - 1
    if (
      !Number.isInteger(rate.from) || rate.from < 0 ||
      (rate.to !== null && (!Number.isInteger(rate.to) || rate.to <= rate.from)) ||
      rate.from !== previous || (!last && rate.to === null)
    ) {
      throw new Error('KPOS 按时计费区间不连续或重叠')
    }
    const fixed = rate.fixPrice !== null && rate.price === null && rate.step === null
    const unit = rate.fixPrice === null && rate.price !== null && rate.step !== null
    if (!fixed && !unit) throw new Error('KPOS 按时计费同一区间必须且只能选择一种收费方式')
    previous = rate.to ?? previous
    return {
      id: rate.id,
      fromMinutes: rate.from,
      toMinutes: rate.to,
      charge: fixed
        ? { type: 'fixed', amount: rate.fixPrice }
        : { type: 'unit', amount: rate.price, unitMinutes: rate.step, roundUp: true },
    }
  })
  return { type: 'rates', rates: domainRates }
}

export async function fetchKposHourlyRateRule(saleItemId) {
  const normalizedId = String(saleItemId ?? '').trim()
  if (!/^\d+$/.test(normalizedId)) return null
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: envelope('ListHourlyRatesBySaleItemType'),
  })
  if (!response.ok) throw new Error(`KPOS 按时计费读取失败（HTTP ${response.status}）`)
  const doc = new DOMParser().parseFromString(await response.text(), 'text/xml')
  if (doc.querySelector('parsererror')) throw new Error('KPOS 按时计费返回无效 XML')
  const fault = children(doc, 'Fault')[0]
  if (fault) throw new Error(directText(fault, 'faultstring') || 'KPOS SOAP Fault')
  const saleItem = children(doc, 'saleItems').find(
    (node) => String(directText(node, 'id')) === normalizedId
  )
  if (!saleItem) return null
  const rates = Array.from(saleItem.children)
    .filter((node) => node.localName.toLowerCase() === 'hourlyrates')
    .map((node) => {
      const from = Number(directText(node, 'from'))
      const toText = directText(node, 'to')
      return {
        id: directText(node, 'id'),
        from,
        to: toText === '' ? null : Number(toText),
        price: positive(directText(node, 'price')),
        step: positive(directText(node, 'step')),
        fixPrice: positive(directText(node, 'fixPrice') || directText(node, 'fixprice')),
      }
    })
  if (!rates.length) return null
  return {
    id: normalizedId,
    enabled: true,
    pricing: parsePricing(rates),
    productBinding: { productId: normalizedId, requiredTag: 'KTV' },
    hourlyRateIds: rates.map((rate) => rate.id),
  }
}
