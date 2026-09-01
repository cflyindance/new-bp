# eMenu 本机图片文件夹同步 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.  
> **本仓库约定：** 不要自动 `git commit` / `git push`；计划中的 Commit 步骤仅作检查点，须用户明确要求后才执行。

**Goal:** 在 eMenu 系统设置页提供「本机图片目录同步」：用 Chrome/Edge File System Access 把单层图片文件夹写入已授权的 `C:\Wisdomount\Menusifu\data\static\images`，同名保留、含子目录则拒绝。

**Architecture:** 纯前端。可单测的校验/规划逻辑放在 `localImageFolderSync.js`；浏览器目录授权、读写、IndexedDB 句柄持久化同文件封装；SystemSetting 底部新增 UI 组件调用该模块。不改 POS、不加 Node 写盘服务。

**Tech Stack:** React + antd（与现有 SystemSetting 一致）、File System Access API、IndexedDB、Node assert 专项 verify 脚本

**Spec:** `docs/superpowers/specs/2026-08-17-emenu-local-image-folder-sync-design.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\emenu-local-image-sync`，分支 `wt/emenu-local-image-sync`  
**双写：** 权威改动在 worktree；同步到主工作区 `F:\米聚\GitHub仓库\new-bp\admin-web\...` 供预览。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `admin-web/vendor/emenu-new/src/utils/localImageFolderSync.js` | 能力检测、扩展名/扁平校验、同名规划、目录选择、写入、句柄持久化 |
| `admin-web/vendor/emenu-new/src/pages/SystemSetting/components/LocalImageFolderSync/index.jsx` | 设置页 UI：说明、授权、同步、结果区 |
| `admin-web/vendor/emenu-new/src/pages/SystemSetting/components/LocalImageFolderSync/index.module.less` | 区块样式（轻量，对齐 footer） |
| `admin-web/vendor/emenu-new/src/pages/SystemSetting/index.jsx` | 挂载组件 |
| `admin-web/vendor/emenu-new/src/pages/SystemSetting/index.module.less` | footer 布局可容纳新区块 |
| `admin-web/vendor/emenu-new/src/locales/{zh,en,zh-Hant,jp,ko,th,vi,es,fr,ru}.json` | `SystemSetting.local_image_*` 文案 |
| `admin-web/scripts/verify-emenu-local-image-folder-sync.mjs` | 静态断言 + 纯函数冒烟 |

---

### Task 1: 纯逻辑 + 失败态 verify 脚本（RED）

**Files:**
- Create: `admin-web/vendor/emenu-new/src/utils/localImageFolderSync.js`（先只放纯函数导出）
- Create: `admin-web/scripts/verify-emenu-local-image-folder-sync.mjs`

- [ ] **Step 1: 写入纯函数模块骨架**

路径：`admin-web/vendor/emenu-new/src/utils/localImageFolderSync.js`

```js
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
  return String(name || '').trim().toLowerCase()
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
 * @returns {{
 *   ok: boolean,
 *   reason?: 'has_subdir' | 'no_images' | 'case_conflict',
 *   images: Array<{ name: string }>,
 *   ignoredNonImages: number,
 * }}
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
 * @returns {{ toWrite: string[], toSkip: string[] }}
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
  const isSecure =
    typeof g.isSecureContext === 'boolean'
      ? g.isSecureContext
      : Boolean(g.location && /^(https:|http:\/\/(localhost|127\.0\.0\.1)(:|$))/i.test(String(g.location.href || '')))
  if (!isSecure) return 'insecure_context'
  if (typeof g.showDirectoryPicker !== 'function') return 'unsupported'
  return 'ok'
}

// 后续 Task 再补：句柄持久化、pick/sync 的浏览器 API 封装
```

- [ ] **Step 2: 写入 verify 脚本（先对未完成 UI/持久化断言，预期 RED）**

路径：`admin-web/scripts/verify-emenu-local-image-folder-sync.mjs`

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const utilPath = path.join(root, 'vendor/emenu-new/src/utils/localImageFolderSync.js')
const uiPath = path.join(root, 'vendor/emenu-new/src/pages/SystemSetting/components/LocalImageFolderSync/index.jsx')
const settingPath = path.join(root, 'vendor/emenu-new/src/pages/SystemSetting/index.jsx')
const zhPath = path.join(root, 'vendor/emenu-new/src/locales/zh.json')
const enPath = path.join(root, 'vendor/emenu-new/src/locales/en.json')

const mod = await import(pathToFileURL(utilPath).href)

assert.equal(mod.detectFolderSyncCapability({ isSecureContext: false, showDirectoryPicker: () => {} }), 'insecure_context')
assert.equal(mod.detectFolderSyncCapability({ isSecureContext: true }), 'unsupported')
assert.equal(mod.detectFolderSyncCapability({ isSecureContext: true, showDirectoryPicker: () => {} }), 'ok')

assert.deepEqual(
  mod.classifySourceEntries([
    { name: 'a.jpg', kind: 'file' },
    { name: 'sub', kind: 'directory' },
  ]).reason,
  'has_subdir',
)
assert.deepEqual(
  mod.classifySourceEntries([{ name: 'readme.txt', kind: 'file' }]).reason,
  'no_images',
)
assert.equal(mod.classifySourceEntries([{ name: 'A.JPG', kind: 'file' }]).ok, true)
assert.equal(mod.isImageFileName('x.PNG'), true)

const planned = mod.planSyncActions(
  [{ name: 'new.png' }, { name: 'Old.JPG' }],
  ['old.jpg', 'keep.gif'],
)
assert.deepEqual(planned.toWrite, ['new.png'])
assert.deepEqual(planned.toSkip, ['Old.JPG'])

const utilSrc = await readFile(utilPath, 'utf8')
assert.match(utilSrc, /export async function ensureTargetDirectoryHandle/)
assert.match(utilSrc, /export async function syncImageFolderToTarget/)
assert.match(utilSrc, /indexedDB|IDBDatabase|HANDLE_DB_NAME/)

const uiSrc = await readFile(uiPath, 'utf8')
assert.match(uiSrc, /LocalImageFolderSync/)
assert.match(uiSrc, /选择文件夹并同步|local_image_sync_button/)
assert.match(uiSrc, /重新授权|local_image_reauth/)
assert.doesNotMatch(uiSrc, /\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/)

const settingSrc = await readFile(settingPath, 'utf8')
assert.match(settingSrc, /LocalImageFolderSync/)

const zh = JSON.parse(await readFile(zhPath, 'utf8'))
const en = JSON.parse(await readFile(enPath, 'utf8'))
for (const key of [
  'local_image_title',
  'local_image_hint',
  'local_image_sync_button',
  'local_image_reauth',
  'local_image_insecure',
  'local_image_unsupported',
  'local_image_need_flat',
  'local_image_no_images',
  'local_image_case_conflict',
  'local_image_reauth_needed',
  'local_image_result',
]) {
  assert.ok(zh.SystemSetting?.[key], `zh missing ${key}`)
  assert.ok(en.SystemSetting?.[key], `en missing ${key}`)
}

console.log('verify-emenu-local-image-folder-sync: OK')
```

> Windows 下 `import.meta.url` → `pathname` 可能带前导 `/`；若脚本路径解析失败，改为：

```js
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
```

- [ ] **Step 3: 跑 verify，确认 RED（缺 UI / 缺异步 API）**

```bash
node admin-web/scripts/verify-emenu-local-image-folder-sync.mjs
```

Expected: FAIL（找不到 UI 文件，或 util 缺 `ensureTargetDirectoryHandle` / `syncImageFolderToTarget`）

- [ ] **Step 4: 检查点（勿自动提交）** — 用户要求提交时再 commit：「add local image folder sync pure helpers + red verify」

---

### Task 2: 补齐浏览器 API 封装（句柄持久化 + 同步）

**Files:**
- Modify: `admin-web/vendor/emenu-new/src/utils/localImageFolderSync.js`

- [ ] **Step 1: 追加 IndexedDB 句柄读写**

```js
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
```

- [ ] **Step 2: 追加权限校验与选目录**

```js
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
 * @returns {Promise<{ handle: FileSystemDirectoryHandle | null, cancelled: boolean }>}
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
```

- [ ] **Step 3: 追加 `listDirectoryEntries` + `syncImageFolderToTarget`**

```js
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
 * @returns {Promise<{
 *   cancelled?: boolean,
 *   blockedReason?: string,
 *   added: number,
 *   skipped: number,
 *   ignoredNonImages: number,
 *   failed: Array<{ name: string, message: string }>,
 * }>}
 */
export async function syncImageFolderToTarget({
  sourceHandle,
  targetHandle,
}) {
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
      if (failed.length >= FAILURE_LIST_LIMIT) {
        // 继续计数但不无限膨胀列表：后续失败合并为省略提示由 UI 处理
      }
    }
  }

  return {
    added,
    skipped: toSkip.length,
    ignoredNonImages: classified.ignoredNonImages,
    failed: failed.slice(0, FAILURE_LIST_LIMIT),
  }
}
```

- [ ] **Step 4: 手工冒烟（可选）** — 在 Chrome DevTools Console 临时 `import` 测 `detectFolderSyncCapability` / `classifySourceEntries`；完整写盘放到 Task 4 E2E。

- [ ] **Step 5: 检查点** — 「add folder sync browser fs helpers」（仅用户要求时提交）

---

### Task 3: i18n 文案

**Files:**
- Modify: `admin-web/vendor/emenu-new/src/locales/zh.json`
- Modify: `admin-web/vendor/emenu-new/src/locales/en.json`
- Modify: 其余 `zh-Hant.json` / `jp.json` / `ko.json` / `th.json` / `vi.json` / `es.json` / `fr.json` / `ru.json`（可先英/中镜像，与现有 `data_backup` 键同级插入）

- [ ] **Step 1: 在 `SystemSetting` 对象中、`data_restore_fail_json` 后追加键**

中文（`zh.json`）：

```json
"local_image_title": "本机图片目录同步",
"local_image_hint": "将单层图片文件夹同步到 C:\\Wisdomount\\Menusifu\\data\\static\\images。同名保留本机原图；含子目录将拒绝同步。",
"local_image_sync_button": "选择文件夹并同步",
"local_image_reauth": "重新授权目标目录",
"local_image_insecure": "当前页面不是安全上下文。请使用本机 localhost / 127.0.0.1 或 HTTPS 打开设置页。",
"local_image_unsupported": "当前浏览器不支持目录授权写盘，请使用本机 Chrome 或 Edge 打开设置页。",
"local_image_need_flat": "请先整理为单层文件夹后再同步。",
"local_image_no_images": "未找到可同步的图片。",
"local_image_case_conflict": "源文件夹存在仅大小写不同的同名图片，请整理后再同步。",
"local_image_reauth_needed": "目标目录权限失效，请重新授权目标目录。",
"local_image_result": "新增 {{added}} · 跳过同名 {{skipped}} · 忽略非图片 {{ignored}} · 失败 {{failed}}",
"local_image_sync_done": "同步完成",
"local_image_sync_blocked": "同步未执行"
```

英文（`en.json`）对应翻译；其他语言可先用英文文案占位，与项目多语言习惯一致即可。

- [ ] **Step 2: 检查点** — 「i18n: local image folder sync strings」

---

### Task 4: SystemSetting UI 挂载

**Files:**
- Create: `admin-web/vendor/emenu-new/src/pages/SystemSetting/components/LocalImageFolderSync/index.jsx`
- Create: `admin-web/vendor/emenu-new/src/pages/SystemSetting/components/LocalImageFolderSync/index.module.less`
- Modify: `admin-web/vendor/emenu-new/src/pages/SystemSetting/index.jsx`
- Modify: `admin-web/vendor/emenu-new/src/pages/SystemSetting/index.module.less`

- [ ] **Step 1: 实现 UI 组件**

`index.jsx` 关键结构（完整实现时按此行为）：

```jsx
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'antd/es/button'
import message from '@/components/Message'
import {
  TARGET_PATH_HINT,
  detectFolderSyncCapability,
  ensureTargetDirectoryHandle,
  pickSourceDirectoryHandle,
  syncImageFolderToTarget,
} from '@/utils/localImageFolderSync'
import styles from './index.module.less'

const LocalImageFolderSync = () => {
  const { t } = useTranslation()
  const capability = useMemo(() => detectFolderSyncCapability(), [])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const onReauth = async () => {
    if (capability !== 'ok') return
    const { cancelled } = await ensureTargetDirectoryHandle({ forcePick: true })
    if (cancelled) return
    message.success(t('SystemSetting.local_image_reauth'))
  }

  const onSync = async () => {
    if (capability === 'insecure_context') {
      message.warn(t('SystemSetting.local_image_insecure'))
      return
    }
    if (capability === 'unsupported') {
      message.warn(t('SystemSetting.local_image_unsupported'))
      return
    }
    setLoading(true)
    try {
      const target = await ensureTargetDirectoryHandle()
      if (target.cancelled || !target.handle) return
      if (!(await /* permission already checked inside ensure */ true)) {
        message.warn(t('SystemSetting.local_image_reauth_needed'))
        return
      }
      const source = await pickSourceDirectoryHandle()
      if (source.cancelled || !source.handle) return

      const summary = await syncImageFolderToTarget({
        sourceHandle: source.handle,
        targetHandle: target.handle,
      })

      if (summary.blockedReason === 'has_subdir') {
        message.warn(t('SystemSetting.local_image_need_flat'))
        setResult(null)
        return
      }
      if (summary.blockedReason === 'no_images') {
        message.warn(t('SystemSetting.local_image_no_images'))
        setResult(null)
        return
      }
      if (summary.blockedReason === 'case_conflict') {
        message.warn(t('SystemSetting.local_image_case_conflict'))
        setResult(null)
        return
      }

      setResult(summary)
      message.success(t('SystemSetting.local_image_sync_done'))
    } catch (e) {
      message.warn(e?.message || t('SystemSetting.local_image_reauth_needed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap} data-local-image-folder-sync>
      <div className={styles.title}>{t('SystemSetting.local_image_title')}</div>
      <div className={styles.hint}>
        {t('SystemSetting.local_image_hint')}
        <div className={styles.path}>{TARGET_PATH_HINT}</div>
      </div>
      <div className={styles.actions}>
        <Button type="primary" loading={loading} disabled={loading} onClick={onSync}>
          {t('SystemSetting.local_image_sync_button')}
        </Button>
        <Button type="text" disabled={loading || capability !== 'ok'} onClick={onReauth}>
          {t('SystemSetting.local_image_reauth')}
        </Button>
      </div>
      {result ? (
        <div className={styles.result}>
          {t('SystemSetting.local_image_result', {
            added: result.added,
            skipped: result.skipped,
            ignored: result.ignoredNonImages,
            failed: result.failed?.length || 0,
          })}
          {result.failed?.length ? (
            <ul>
              {result.failed.map((f) => (
                <li key={f.name}>
                  {f.name}: {f.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default LocalImageFolderSync
```

> 实现时去掉注释式伪代码；`ensureTargetDirectoryHandle` 已含权限校验。失败写盘导致目标句柄失效时，catch 中提示 `local_image_reauth_needed`。

- [ ] **Step 2: 样式**

`index.module.less`：

```less
.wrap {
  padding: 12px 0;
  max-width: 720px;
}
.title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}
.hint {
  font-size: 13px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 12px;
}
.path {
  margin-top: 6px;
  font-family: Consolas, Monaco, monospace;
  word-break: break-all;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.result {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
  ul {
    margin: 6px 0 0;
    padding-left: 18px;
  }
}
```

- [ ] **Step 3: 挂到 SystemSetting**

`index.jsx`：

```jsx
import LocalImageFolderSync from './components/LocalImageFolderSync'
// ...
<div className={styles.footer}>
  <div className={styles.backup}>
    <DataBackupButton />
    <DataRestoreButton />
  </div>
  <LocalImageFolderSync />
</div>
```

`index.module.less` 的 `.footer` 改为纵向排列，避免挤成一行：

```less
.footer {
  min-height: 60px;
  padding: 12px 16px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
```

- [ ] **Step 4: 双写到主工作区** — 将本 Task 改动的相对路径文件同样更新到 `F:\米聚\GitHub仓库\new-bp\admin-web\...`

- [ ] **Step 5: 检查点** — 「feat(emenu): local image folder sync UI」

---

### Task 5: GREEN verify + 手工验收

**Files:**
- 视情况微调 Task 1–4 使断言通过

- [ ] **Step 1: 跑 verify，期望 GREEN**

```bash
node admin-web/scripts/verify-emenu-local-image-folder-sync.mjs
```

Expected: `verify-emenu-local-image-folder-sync: OK`

- [ ] **Step 2: 本机 Chrome/Edge 手工验收（对照 Spec §7）**

在 POS 本机用 `http://localhost:22080/...`（或开发环境等价 localhost）打开 eMenu 设置：

1. 首次点「选择文件夹并同步」→ 授权 `...\data\static\images` → 选单层图片文件夹 → 文件写入成功  
2. 再同步含同名文件的文件夹 → 同名跳过、原图不变  
3. 选含子目录的文件夹 → 提示整理，目标目录无新增  
4. 夹杂 `.txt` → 忽略非图片计数增加，图片仍可同步  
5. 取消系统目录选择 → 静默返回，无错误 toast  
6. 用 `http://局域网IP:...` 打开（若可复现）→ 安全上下文提示  
7. 确认无 `alert` / `confirm` / `prompt`

- [ ] **Step 3: 更新 Spec 状态为「已确认 / 已实施」**（实现完成后）

- [ ] **Step 4: 检查点** — 整单提交仅在用户要求时进行

---

## Spec 覆盖自检

| Spec 要求 | Task |
|---|---|
| 仅 eMenu / 目录授权写盘 | Task 2–4 |
| 单层文件夹 / 同名保留 / 扩展名 | Task 1–2 |
| 安全上下文 vs 浏览器不支持分提示 | Task 1 `detectFolderSyncCapability` + Task 3–4 |
| 取消选择静默中止 | Task 2 `cancelled` + Task 4 |
| 结果四项统计 + 失败最多 10 条 | Task 1–2、4 |
| 同步中禁用主按钮 | Task 4 `loading` |
| 无原生弹窗 | Task 4 + verify |
| 不改 POS / 不加 Node 写盘 | 全计划未涉及 |

## 占位符扫描

无 TBD / 「稍后实现」；异步 API 与 UI 均有完整代码草稿。

## 类型/命名一致性

统一使用：`detectFolderSyncCapability`、`ensureTargetDirectoryHandle`、`pickSourceDirectoryHandle`、`syncImageFolderToTarget`、`classifySourceEntries`、`planSyncActions`、`TARGET_PATH_HINT`、`FAILURE_LIST_LIMIT`。
