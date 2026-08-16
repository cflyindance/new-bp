import {
  buildTerminalSeasoningGroups,
  productHasGuestSeasoningDetail,
} from '@/utils/seasoningGuest'

const SNAPSHOT_URL = '/api/v1/emenu-local/seasoning/snapshot'
const STORAGE_KEY = 'emenu-local-seasoning-snapshot-v1'

let memoryCache = null
let inflight = null

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocal(snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore quota */
  }
}

export async function ensureSeasoningSnapshot() {
  if (memoryCache) return memoryCache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const res = await fetch(SNAPSHOT_URL, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(`snapshot_http_${res.status}`)
      const data = await res.json()
      if (!data || !Array.isArray(data.relations)) throw new Error('snapshot_invalid')
      memoryCache = data
      writeLocal(data)
      return data
    } catch (err) {
      const cached = readLocal()
      if (cached) {
        memoryCache = cached
        return cached
      }
      memoryCache = null
      throw err
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function getSeasoningGroupsForProduct(snapshot, productId) {
  if (!snapshot) return []
  const product = (snapshot.products || []).find((p) => String(p.id) === String(productId))
  if (!product) return []
  const relations = (snapshot.relations || []).filter((r) => String(r.productId) === String(productId))
  return buildTerminalSeasoningGroups({
    product,
    options: snapshot.options || [],
    relations,
  })
}

export function productShowsSeasoningDetail(snapshot, productId) {
  if (!snapshot) return false
  const product = (snapshot.products || []).find((p) => String(p.id) === String(productId))
  if (!product) return false
  const relations = (snapshot.relations || []).filter((r) => String(r.productId) === String(productId))
  return productHasGuestSeasoningDetail({
    product,
    options: snapshot.options || [],
    relations,
  })
}
