export const EMENU_DISPLAY_CONFIG_ID = 95

export const EMENU_VIEWPORT_LIMITS = Object.freeze({
  minScale: 0.75,
  maxScale: 1.4,
  scaleStep: 0.05,
  minWidthRatio: 0.6,
  maxWidthRatio: 1,
  minHeightRatio: 0.55,
  maxHeightRatio: 1,
  hysteresis: 16,
})

export const EMENU_DENSITY_TOKENS = Object.freeze({
  compact: Object.freeze({ cardMinWidth: 144, gap: 12, padding: 12 }),
  standard: Object.freeze({ cardMinWidth: 168, gap: 16, padding: 16 }),
  comfortable: Object.freeze({ cardMinWidth: 192, gap: 20, padding: 20 }),
})

export const DEFAULT_EMENU_DISPLAY_CONFIG = Object.freeze({
  scale: 1,
  widthRatio: 1,
  heightRatio: 1,
  density: 'standard',
  allowGuestResize: true,
  allowPinchZoom: true,
  allowDragResize: true,
})

const finiteOr = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback

export const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, finiteOr(value, min)))

export const snapToStep = (value, step = 0.05) =>
  Number((Math.round(finiteOr(value, 0) / step) * step).toFixed(4))

export function normalizeEmenuDisplayConfig(value = {}) {
  const density = Object.prototype.hasOwnProperty.call(
    EMENU_DENSITY_TOKENS,
    value?.density
  )
    ? value.density
    : DEFAULT_EMENU_DISPLAY_CONFIG.density
  return {
    scale: clamp(
      snapToStep(value?.scale ?? DEFAULT_EMENU_DISPLAY_CONFIG.scale),
      EMENU_VIEWPORT_LIMITS.minScale,
      EMENU_VIEWPORT_LIMITS.maxScale
    ),
    widthRatio: clamp(
      snapToStep(
        value?.widthRatio ?? DEFAULT_EMENU_DISPLAY_CONFIG.widthRatio
      ),
      EMENU_VIEWPORT_LIMITS.minWidthRatio,
      EMENU_VIEWPORT_LIMITS.maxWidthRatio
    ),
    heightRatio: clamp(
      snapToStep(
        value?.heightRatio ?? DEFAULT_EMENU_DISPLAY_CONFIG.heightRatio
      ),
      EMENU_VIEWPORT_LIMITS.minHeightRatio,
      EMENU_VIEWPORT_LIMITS.maxHeightRatio
    ),
    density,
    allowGuestResize:
      value?.allowGuestResize ??
      DEFAULT_EMENU_DISPLAY_CONFIG.allowGuestResize,
    allowPinchZoom:
      value?.allowPinchZoom ?? DEFAULT_EMENU_DISPLAY_CONFIG.allowPinchZoom,
    allowDragResize:
      value?.allowDragResize ?? DEFAULT_EMENU_DISPLAY_CONFIG.allowDragResize,
  }
}

export const getEmenuOrientation = (width, height) =>
  finiteOr(width, 0) >= finiteOr(height, 0) ? 'landscape' : 'portrait'

export function resolveViewportSize({
  availableWidth,
  availableHeight,
  widthRatio,
  heightRatio,
}) {
  const safeWidth = Math.max(0, finiteOr(availableWidth, 0))
  const safeHeight = Math.max(0, finiteOr(availableHeight, 0))
  const resolvedWidthRatio = clamp(
    snapToStep(widthRatio),
    EMENU_VIEWPORT_LIMITS.minWidthRatio,
    EMENU_VIEWPORT_LIMITS.maxWidthRatio
  )
  const resolvedHeightRatio = clamp(
    snapToStep(heightRatio),
    EMENU_VIEWPORT_LIMITS.minHeightRatio,
    EMENU_VIEWPORT_LIMITS.maxHeightRatio
  )
  return {
    width: Math.round(safeWidth * resolvedWidthRatio),
    height: Math.round(safeHeight * resolvedHeightRatio),
    widthRatio: resolvedWidthRatio,
    heightRatio: resolvedHeightRatio,
  }
}

export function resolveEmenuGrid({
  containerWidth,
  scale = 1,
  density = 'standard',
  orientation = 'landscape',
  sidebarWidth = 188,
  contentPadding = 24,
  previousColumns,
}) {
  const tokens =
    EMENU_DENSITY_TOKENS[density] || EMENU_DENSITY_TOKENS.standard
  const safeScale = clamp(
    scale,
    EMENU_VIEWPORT_LIMITS.minScale,
    EMENU_VIEWPORT_LIMITS.maxScale
  )
  const minColumns = 2
  const maxColumns = orientation === 'portrait' ? 4 : 6
  const scaledCardWidth = tokens.cardMinWidth * safeScale
  const sidebarCollapseAt =
    sidebarWidth + contentPadding * 2 + scaledCardWidth * 2 + tokens.gap
  const collapsedSidebar = containerWidth < sidebarCollapseAt
  const usedSidebarWidth = collapsedSidebar ? 0 : sidebarWidth
  const contentWidth = Math.max(
    0,
    finiteOr(containerWidth, 0) - usedSidebarWidth - contentPadding * 2
  )
  let columns = Math.floor(
    (contentWidth + tokens.gap) / (scaledCardWidth + tokens.gap)
  )
  columns = clamp(columns, minColumns, maxColumns)

  if (
    Number.isInteger(previousColumns) &&
    previousColumns >= minColumns &&
    previousColumns <= maxColumns &&
    previousColumns !== columns
  ) {
    const boundary =
      Math.max(previousColumns, columns) * scaledCardWidth +
      (Math.max(previousColumns, columns) - 1) * tokens.gap
    if (Math.abs(contentWidth - boundary) <= EMENU_VIEWPORT_LIMITS.hysteresis) {
      columns = previousColumns
    }
  }

  return {
    columns,
    collapsedSidebar,
    contentWidth,
    cardMinWidth: scaledCardWidth,
    gap: tokens.gap,
    padding: tokens.padding,
  }
}
