export const TARGET_PATH_HINT =
  String.raw`C:\Wisdomount\Menusifu\data\static\images`

export const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
])

export const FAILURE_LIST_LIMIT = 10

export const HANDLE_DB_NAME = 'emenu-local-image-folder-sync'
export const HANDLE_STORE = 'handles'
export const HANDLE_KEY = 'targetStaticImages'

export function normalizeNameKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
}

export function getExtension(name) {
  const n = String(name || '')
  const i = n.lastIndexOf('.')
  if (i < 0) return ''
  return n.slice(i).toLowerCase()
}

export function isImageFileName(name) {
  return IMAGE_EXTENSIONS.has(getExtension(name))
}

/**
 * @param {Array<{ name: string, kind: 'file' | 'directory' }>} entries
 */
export function classifySourceEntries(entries) {
  const list = Array.isArray(entries) ? entries : []
  if (list.some((e) => e.kind === 'directory')) {
    return { ok: false, reason: 'has_subdir', images: [], ignoredNonImages: 0 }
  }

  const images = []
  let ignoredNonImages = 0
  const seen = new Map()

  for (const e of list) {
    if (e.kind !== 'file') continue
    if (!isImageFileName(e.name)) {
      ignoredNonImages += 1
      continue
    }
    const key = normalizeNameKey(e.name)
    if (seen.has(key) && seen.get(key) !== e.name) {
      return {
        ok: false,
        reason: 'case_conflict',
        images: [],
        ignoredNonImages: 0,
      }
    }
    seen.set(key, e.name)
    images.push({ name: e.name })
  }

  if (images.length === 0) {
    return { ok: false, reason: 'no_images', images: [], ignoredNonImages }
  }

  return { ok: true, images, ignoredNonImages }
}

/**
 * @param {Array<{ name: string }>} sourceImages
 * @param {Iterable<string>} targetNames
 */
export function planSyncActions(sourceImages, targetNames) {
  const existing = new Set(
    [...(targetNames || [])].map((n) => normalizeNameKey(n)),
  )
  const toWrite = []
  const toSkip = []
  for (const img of sourceImages || []) {
    const key = normalizeNameKey(img.name)
    if (existing.has(key)) toSkip.push(img.name)
    else toWrite.push(img.name)
  }
  return { toWrite, toSkip }
}

/**
 * @returns {'ok' | 'insecure_context' | 'unsupported'}
 */
export function detectFolderSyncCapability(globalObj = globalThis) {
  const g = globalObj || {}
  let isSecure = false
  if (typeof g.isSecureContext === 'boolean') {
    isSecure = g.isSecureContext
  } else if (g.location) {
    isSecure = /^(https:|http:\/\/(localhost|127\.0\.0\.1)(:|$))/i.test(
      String(g.location.href || ''),
    )
  }
  if (!isSecure) return 'insecure_context'
  if (typeof g.showDirectoryPicker !== 'function') return 'unsupported'
  return 'ok'
}

function openHandleDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveTargetDirectoryHandle(handle) {
  const db = await openHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite')
    tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function loadTargetDirectoryHandle() {
  const db = await openHandleDb()
  const handle = await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readonly')
    const req = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return handle
}

export async function clearTargetDirectoryHandle() {
  const db = await openHandleDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite')
    tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function verifyHandlePermission(handle, mode = 'readwrite') {
  if (!handle) return false
  const opts = { mode }
  if (handle.queryPermission) {
    if ((await handle.queryPermission(opts)) === 'granted') return true
  }
  if (handle.requestPermission) {
    if ((await handle.requestPermission(opts)) === 'granted') return true
  }
  return false
}

/**
 * @param {{ forcePick?: boolean }} [opts]
 */
export async function ensureTargetDirectoryHandle(opts = {}) {
  const forcePick = Boolean(opts.forcePick)
  if (!forcePick) {
    const cached = await loadTargetDirectoryHandle().catch(() => null)
    if (cached && (await verifyHandlePermission(cached, 'readwrite'))) {
      return { handle: cached, cancelled: false }
    }
  }

  try {
    const handle = await window.showDirectoryPicker({
      id: 'emenu-static-images',
      mode: 'readwrite',
    })
    await saveTargetDirectoryHandle(handle)
    return { handle, cancelled: false }
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) {
      return { handle: null, cancelled: true }
    }
    throw e
  }
}

export async function pickSourceDirectoryHandle() {
  try {
    const handle = await window.showDirectoryPicker({
      id: 'emenu-image-source',
      mode: 'read',
    })
    return { handle, cancelled: false }
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) {
      return { handle: null, cancelled: true }
    }
    throw e
  }
}

export async function listDirectoryEntries(dirHandle) {
  const entries = []
  for await (const [name, handle] of dirHandle.entries()) {
    entries.push({
      name,
      kind: handle.kind === 'directory' ? 'directory' : 'file',
      handle,
    })
  }
  return entries
}

/**
 * @param {{ sourceHandle: FileSystemDirectoryHandle, targetHandle: FileSystemDirectoryHandle }} args
 */
export async function syncImageFolderToTarget({ sourceHandle, targetHandle }) {
  const sourceEntries = await listDirectoryEntries(sourceHandle)
  const classified = classifySourceEntries(sourceEntries)
  if (!classified.ok) {
    return {
      added: 0,
      skipped: 0,
      ignoredNonImages: classified.ignoredNonImages || 0,
      failed: [],
      blockedReason: classified.reason,
    }
  }

  const targetEntries = await listDirectoryEntries(targetHandle)
  const targetNames = targetEntries
    .filter((e) => e.kind === 'file')
    .map((e) => e.name)
  const { toWrite, toSkip } = planSyncActions(classified.images, targetNames)

  const failed = []
  let added = 0
  const sourceMap = new Map(sourceEntries.map((e) => [e.name, e]))

  for (const name of toWrite) {
    try {
      const src = sourceMap.get(name)
      if (!src?.handle) throw new Error('missing source handle')
      const file = await src.handle.getFile()
      const out = await targetHandle.getFileHandle(name, { create: true })
      const writable = await out.createWritable()
      await writable.write(await file.arrayBuffer())
      await writable.close()
      added += 1
    } catch (e) {
      failed.push({
        name,
        message: e?.message || String(e),
      })
    }
  }

  return {
    added,
    skipped: toSkip.length,
    ignoredNonImages: classified.ignoredNonImages,
    failed: failed.slice(0, FAILURE_LIST_LIMIT),
  }
}
