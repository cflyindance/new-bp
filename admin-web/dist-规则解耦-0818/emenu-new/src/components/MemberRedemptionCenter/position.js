const DEFAULT_RIGHT_GAP = 20
const DEFAULT_BOTTOM_GAP = 20
const DEFAULT_DRAG_THRESHOLD = 5

function getPositionBounds(options = {}) {
  const viewportWidth = Math.max(Number(options.viewportWidth) || 0, 0)
  const viewportHeight = Math.max(Number(options.viewportHeight) || 0, 0)
  const iconWidth = Math.max(Number(options.iconWidth) || 0, 0)
  const iconHeight = Math.max(Number(options.iconHeight) || 0, 0)

  return {
    maxX: Math.max(viewportWidth - iconWidth, 0),
    maxY: Math.max(viewportHeight - iconHeight, 0),
  }
}

export function clampMemberRedemptionCenterPosition(position, options = {}) {
  const { maxX, maxY } = getPositionBounds(options)
  const x = Number.isFinite(position?.x) ? position.x : 0
  const y = Number.isFinite(position?.y) ? position.y : 0

  return {
    x: Math.min(Math.max(x, 0), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  }
}

export function getDefaultMemberRedemptionCenterPosition(options = {}) {
  const viewportWidth = Math.max(Number(options.viewportWidth) || 0, 0)
  const viewportHeight = Math.max(Number(options.viewportHeight) || 0, 0)
  const iconWidth = Math.max(Number(options.iconWidth) || 0, 0)
  const iconHeight = Math.max(Number(options.iconHeight) || 0, 0)

  return clampMemberRedemptionCenterPosition(
    {
      x: viewportWidth - iconWidth - DEFAULT_RIGHT_GAP,
      y: viewportHeight - iconHeight - DEFAULT_BOTTOM_GAP,
    },
    options
  )
}

export function normalizeMemberRedemptionCenterPosition(
  position,
  options = {}
) {
  if (!Number.isFinite(position?.x) || !Number.isFinite(position?.y)) {
    return getDefaultMemberRedemptionCenterPosition(options)
  }
  return clampMemberRedemptionCenterPosition(position, options)
}

export function hasExceededMemberRedemptionCenterDragThreshold(options = {}) {
  const startX = Number(options.startX) || 0
  const startY = Number(options.startY) || 0
  const currentX = Number(options.currentX) || 0
  const currentY = Number(options.currentY) || 0
  const threshold = Number.isFinite(options.threshold)
    ? Math.max(options.threshold, 0)
    : DEFAULT_DRAG_THRESHOLD
  const deltaX = currentX - startX
  const deltaY = currentY - startY

  return deltaX * deltaX + deltaY * deltaY > threshold * threshold
}
