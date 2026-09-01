import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const utilPath = path.join(
  root,
  'vendor/emenu-new/src/utils/localImageFolderSync.js',
)
const uiPath = path.join(
  root,
  'vendor/emenu-new/src/pages/SystemSetting/components/LocalImageFolderSync/index.jsx',
)
const settingPath = path.join(
  root,
  'vendor/emenu-new/src/pages/SystemSetting/index.jsx',
)
const zhPath = path.join(root, 'vendor/emenu-new/src/locales/zh.json')
const enPath = path.join(root, 'vendor/emenu-new/src/locales/en.json')

const mod = await import(pathToFileURL(utilPath).href)

assert.equal(
  mod.detectFolderSyncCapability({
    isSecureContext: false,
    showDirectoryPicker: () => {},
  }),
  'insecure_context',
)
assert.equal(
  mod.detectFolderSyncCapability({ isSecureContext: true }),
  'unsupported',
)
assert.equal(
  mod.detectFolderSyncCapability({
    isSecureContext: true,
    showDirectoryPicker: () => {},
  }),
  'ok',
)

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
assert.equal(
  mod.classifySourceEntries([{ name: 'A.JPG', kind: 'file' }]).ok,
  true,
)
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

const shellPath = path.join(root, 'src/shell/emenu-local-shell.ts')
const shellSrc = await readFile(shellPath, 'utf8')
assert.match(shellSrc, /renderLocalImageFolderSyncPanel/)
assert.match(shellSrc, /bindLocalImageFolderSyncPanel/)
assert.match(shellSrc, /data-emenu-local-emenu-settings-frame/)

const localSyncUiPath = path.join(
  root,
  'src/emenu-local/local-image-folder-sync/local-image-folder-sync-ui.ts',
)
const localSyncUiSrc = await readFile(localSyncUiPath, 'utf8')
assert.match(localSyncUiSrc, /data-emenu-local-image-sync/)
assert.match(localSyncUiSrc, /emenuLocalImageSync\.syncButton/)
assert.match(localSyncUiSrc, /openSyncTargetDialog/)
assert.doesNotMatch(localSyncUiSrc, /\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/)

const targetDialogPath = path.join(
  root,
  'src/emenu-local/local-image-folder-sync/local-image-folder-sync-target-dialog.ts',
)
const targetDialogSrc = await readFile(targetDialogPath, 'utf8')
assert.match(targetDialogSrc, /role="dialog"/)
assert.match(targetDialogSrc, /aria-modal="true"/)
assert.match(targetDialogSrc, /data-target-dialog-select/)
assert.match(targetDialogSrc, /data-target-dialog-confirm/)
assert.match(targetDialogSrc, /data-target-dialog-cancel/)
assert.doesNotMatch(targetDialogSrc, /\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/)

const localSyncCorePath = path.join(
  root,
  'src/emenu-local/local-image-folder-sync/local-image-folder-sync.ts',
)
const localSyncCoreSrc = await readFile(localSyncCorePath, 'utf8')
assert.match(localSyncCoreSrc, /images\\emenu/)
assert.match(localSyncCoreSrc, /images\\kiosk/)
assert.match(localSyncCoreSrc, /export async function resolveTargetFromRoot/)
assert.match(localSyncCoreSrc, /handleKeyForTarget/)
// 已授权 images 根目录后切换目标不得再弹系统目录框
assert.match(localSyncCoreSrc, /deriveTargetFromStoredRoot/)
assert.match(localSyncCoreSrc, /ROOT_HANDLE_KEY/)

const i18nPath = path.join(root, 'src/i18n.ts')
const i18nSrc = await readFile(i18nPath, 'utf8')
assert.match(i18nSrc, /emenuLocalImageSync\.title/)
assert.match(i18nSrc, /emenuLocalImageSync\.syncButton/)
assert.match(i18nSrc, /emenuLocalImageSync\.target\.emenu/)
assert.match(i18nSrc, /emenuLocalImageSync\.target\.kiosk/)
assert.match(i18nSrc, /emenuLocalImageSync\.targetDialogTitle/)

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
