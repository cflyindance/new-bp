import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_EMENU_DISPLAY_CONFIG,
  EMENU_DENSITY_TOKENS,
  EMENU_VIEWPORT_LIMITS,
  getEmenuOrientation,
  normalizeEmenuDisplayConfig,
  resolveEmenuGrid,
  resolveViewportSize,
  snapToStep,
} from '../vendor/emenu-new/src/utils/emenuViewportLayout.js'
import {
  buildEmenuViewportSessionKey,
  buildEmenuViewportTableKey,
  clearEmenuViewportPreference,
  readEmenuViewportPreference,
  writeEmenuViewportPreference,
} from '../vendor/emenu-new/src/utils/emenuViewportPreference.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

assert.deepEqual(normalizeEmenuDisplayConfig(), DEFAULT_EMENU_DISPLAY_CONFIG)
assert.equal(normalizeEmenuDisplayConfig({ scale: 99 }).scale, 1.4)
assert.equal(normalizeEmenuDisplayConfig({ scale: 0 }).scale, 0.75)
assert.equal(normalizeEmenuDisplayConfig({ density: 'unknown' }).density, 'standard')
assert.equal(snapToStep(0.876), 0.9)
assert.equal(getEmenuOrientation(1024, 768), 'landscape')
assert.equal(getEmenuOrientation(768, 1024), 'portrait')

assert.deepEqual(
  resolveViewportSize({
    availableWidth: 1000,
    availableHeight: 800,
    widthRatio: 0.5,
    heightRatio: 2,
  }),
  { width: 600, height: 800, widthRatio: 0.6, heightRatio: 1 }
)

for (const density of Object.keys(EMENU_DENSITY_TOKENS)) {
  const landscape = resolveEmenuGrid({
    containerWidth: 1920,
    density,
    orientation: 'landscape',
  })
  const portrait = resolveEmenuGrid({
    containerWidth: 768,
    density,
    orientation: 'portrait',
  })
  assert.ok(landscape.columns >= 2 && landscape.columns <= 6)
  assert.ok(portrait.columns >= 2 && portrait.columns <= 4)
}

const nearBoundary = resolveEmenuGrid({
  containerWidth: 188 + 48 + 3 * 168 + 2 * 16 + 8,
  previousColumns: 2,
})
assert.equal(nearBoundary.columns, 2)
assert.equal(EMENU_VIEWPORT_LIMITS.hysteresis, 16)

const source = fs.readFileSync(
  path.join(root, 'vendor/emenu-new/src/utils/emenuViewportLayout.js'),
  'utf8'
)
assert.ok(source.includes('allowGuestResize'))
assert.ok(source.includes('allowPinchZoom'))
assert.ok(source.includes('allowDragResize'))

const memory = new Map()
global.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
}
assert.equal(
  buildEmenuViewportSessionKey(
    { currentArea: { id: 1 }, currentTable: { id: 2 } },
    null
  ),
  'table:1:2'
)
assert.equal(buildEmenuViewportSessionKey({}, 99), 'order:99')
assert.equal(
  buildEmenuViewportTableKey({
    currentArea: { id: 1 },
    currentTable: { id: 2 },
  }),
  'table:1:2'
)
writeEmenuViewportPreference('table:1:2', { scale: 1.2 })
assert.equal(readEmenuViewportPreference('table:1:2').scale, 1.2)
assert.equal(readEmenuViewportPreference('table:2:3'), null)
clearEmenuViewportPreference()
assert.equal(readEmenuViewportPreference('table:1:2'), null)

const configSource = fs.readFileSync(
  path.join(root, 'vendor/emenu-new/src/constants/systemConfig.js'),
  'utf8'
)
assert.match(configSource, /id:\s*95,[\s\S]*key:\s*'emenuDisplayDefaults'/)
assert.equal((configSource.match(/id:\s*95\b/g) || []).length, 1)
const deviceDefaults = configSource.match(/DEVICE_DEFAULT_CONFIG\s*=\s*\[([^\]]*)\]/)?.[1]
assert.ok(deviceDefaults && !deviceDefaults.split(',').map(Number).includes(95))

const settingsSource = fs.readFileSync(
  path.join(
    root,
    'vendor/emenu-new/src/components/AdminSettings/SettingMenuDisplay.jsx'
  ),
  'utf8'
)
assert.ok(settingsSource.includes('changeGlobalConfig'))
assert.ok(settingsSource.includes('effects.setConfig()'))

for (const localeFile of fs.readdirSync(
  path.join(root, 'vendor/emenu-new/src/locales')
)) {
  if (!localeFile.endsWith('.json')) continue
  const locale = JSON.parse(
    fs.readFileSync(
      path.join(root, 'vendor/emenu-new/src/locales', localeFile),
      'utf8'
    )
  )
  assert.ok(
    locale.SettingMenuDisplay?.guest_display_heading,
    `${localeFile} is missing guest display translations`
  )
}

const containerSizedFiles = [
  'vendor/emenu-new/src/components/RightContent/index.jsx',
  'vendor/emenu-new/src/components/LeftMenu/index.jsx',
  'vendor/emenu-new/src/components/OldOrderPage/RightContent.jsx',
  'vendor/emenu-new/src/components/OldOrderPage/LeftMenu.jsx',
  'vendor/emenu-new/src/pages/Order/components/OrderListWrapper.jsx',
  'vendor/emenu-new/src/utils/virtualListData.js',
]
for (const relativePath of containerSizedFiles) {
  const fileSource = fs.readFileSync(path.join(root, relativePath), 'utf8')
  assert.doesNotMatch(
    fileSource,
    /calc\(100v[wh]|window\.inner(?:Width|Height)/,
    `${relativePath} still depends on the browser viewport`
  )
}

const resizableSource = fs.readFileSync(
  path.join(
    root,
    'vendor/emenu-new/src/components/ResizableMenuViewport/index.jsx'
  ),
  'utf8'
)
assert.ok(resizableSource.includes("pointerType !== 'touch'"))
assert.ok(resizableSource.includes("event.ctrlKey"))
assert.ok(resizableSource.includes('viewport.frameLayoutWidth'))
assert.ok(resizableSource.includes('viewport.frameLayoutHeight'))
assert.ok(resizableSource.includes("querySelector('[data-emenu-header]')"))
assert.ok(resizableSource.includes('Math.hypot(deltaX, deltaY) < 4'))
assert.ok(resizableSource.includes('setPointerCapture'))
assert.ok(resizableSource.includes('releasePointerCapture'))
assert.ok(resizableSource.includes('styles.rightEdge'))
assert.ok(resizableSource.includes('styles.bottomEdge'))
assert.ok(resizableSource.includes('styles.cornerEdge'))
assert.ok(!resizableSource.includes('styles.handle'))
assert.ok(resizableSource.includes('data-emenu-resize-edge="right"'))
assert.ok(resizableSource.includes('data-emenu-resize-edge="bottom"'))
assert.ok(resizableSource.includes('data-emenu-resize-edge="corner"'))
assert.equal((resizableSource.match(/aria-hidden="true"/g) || []).length, 3)

const resizableStyles = fs.readFileSync(
  path.join(
    root,
    'vendor/emenu-new/src/components/ResizableMenuViewport/index.module.less'
  ),
  'utf8'
)
assert.match(resizableStyles, /\.rightEdge[\s\S]*touch-action:\s*pan-y/)
assert.match(resizableStyles, /\.bottomEdge[\s\S]*touch-action:\s*pan-x/)
assert.match(resizableStyles, /\.cornerEdge[\s\S]*touch-action:\s*none/)
assert.ok(!resizableStyles.includes('.handle'))

const orderPageSource = fs.readFileSync(
  path.join(root, 'vendor/emenu-new/src/pages/Order/Order.jsx'),
  'utf8'
)
assert.ok(orderPageSource.includes('<TopBar'))

const topBarSource = fs.readFileSync(
  path.join(root, 'vendor/emenu-new/src/components/TopBar/index.jsx'),
  'utf8'
)
assert.ok(topBarSource.includes('data-emenu-header="true"'))

const viewportContextSource = fs.readFileSync(
  path.join(root, 'vendor/emenu-new/src/context/EmenuViewportContext.jsx'),
  'utf8'
)
assert.ok(
  viewportContextSource.includes(
    'Math.max(0, frameLayoutHeight - headerLogicalHeight)'
  )
)

const indexPageSource = fs.readFileSync(
  path.join(root, 'vendor/emenu-new/src/pages/Index.jsx'),
  'utf8'
)
assert.ok(indexPageSource.includes("new Set(['/', '/setup', '/order'])"))
assert.ok(indexPageSource.includes('<CustomerViewportOutlet />'))
assert.equal((indexPageSource.match(/<ResizableMenuViewport/g) || []).length, 1)

assert.ok(!orderPageSource.includes('<EmenuViewportProvider'))
assert.ok(!orderPageSource.includes('<ResizableMenuViewport'))
assert.match(
  orderPageSource,
  /root:\s*\{[\s\S]*?backgroundColor:\s*['"]#1A2241['"]/,
  'Order page must preserve the dark eMenu background inside the shared frame'
)

for (const relativePath of [
  'vendor/emenu-new/src/pages/Landing/index.jsx',
  'vendor/emenu-new/src/pages/SetupOrder/index.module.less',
  'vendor/emenu-new/src/pages/SetupOrder/components/PosterSwiper.module.less',
]) {
  const pageSource = fs.readFileSync(path.join(root, relativePath), 'utf8')
  assert.doesNotMatch(
    pageSource,
    /100v[wh]|window\.inner(?:Width|Height)/,
    `${relativePath} still depends on the browser viewport`
  )
}

console.log('eMenu responsive viewport verification passed')
