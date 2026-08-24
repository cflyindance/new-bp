import { useCallback, useEffect, useRef } from 'react'
import classNames from 'classnames'
import { useEmenuViewport } from '@/context/EmenuViewportContext'
import styles from './index.module.less'

function ResizableMenuViewport({ children, empty = false }) {
  const stageRef = useRef(null)
  const contentRef = useRef(null)
  const dragRef = useRef(null)
  const pointersRef = useRef(new Map())
  const pinchRef = useRef(null)
  const viewport = useEmenuViewport()

  const clearDragListeners = useCallback((drag) => {
    if (!drag) return
    window.removeEventListener('pointermove', drag.moveHandler)
    window.removeEventListener('pointerup', drag.endHandler)
    window.removeEventListener('pointercancel', drag.endHandler)
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    const measure = () => {
      const rect = stage.getBoundingClientRect()
      viewport.setAvailableSize(
        Math.round(rect.width),
        Math.round(rect.height),
        'window-resize'
      )
    }
    measure()
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(measure)
      observer.observe(stage)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [viewport.setAvailableSize])

  useEffect(() => {
    const content = contentRef.current
    if (!content || !viewport.setHeaderLogicalHeight) return undefined
    const measureHeader = () => {
      const header = content.querySelector('[data-emenu-header]')
      viewport.setHeaderLogicalHeight(header?.offsetHeight || 0)
    }
    measureHeader()
    const resizeObserver = window.ResizeObserver
      ? new ResizeObserver(measureHeader)
      : null
    resizeObserver?.observe(content)
    const mutationObserver = new MutationObserver(measureHeader)
    mutationObserver.observe(content, { childList: true, subtree: true })
    return () => {
      resizeObserver?.disconnect()
      mutationObserver.disconnect()
    }
  }, [viewport.setHeaderLogicalHeight])

  const startDrag = useCallback(
    (axis) => (event) => {
      if (viewport.modalLocked || !viewport.defaults.allowDragResize) return
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0))
        return
      dragRef.current = {
        axis,
        pointerId: event.pointerId,
        target: event.currentTarget,
        active: false,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: viewport.width,
        startHeight: viewport.height,
        moveHandler: moveDrag,
        endHandler: endDrag,
      }
      window.addEventListener('pointermove', moveDrag, { passive: false })
      window.addEventListener('pointerup', endDrag)
      window.addEventListener('pointercancel', endDrag)
    },
    [viewport]
  )

  const moveDrag = useCallback(
    (event) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      const deltaX = event.clientX - drag.startX
      const deltaY = event.clientY - drag.startY
      if (!drag.active) {
        if (Math.hypot(deltaX, deltaY) < 4) return
        drag.active = true
        drag.target.setPointerCapture?.(event.pointerId)
        viewport.beginInteraction()
      }
      event.preventDefault()
      const width =
        drag.axis === 'y'
          ? drag.startWidth
          : drag.startWidth + deltaX
      const height =
        drag.axis === 'x'
          ? drag.startHeight
          : drag.startHeight + deltaY
      viewport.resizeTo(width, height)
    },
    [viewport]
  )

  const endDrag = useCallback(
    (event) => {
      const drag = dragRef.current
      if (drag?.pointerId !== event.pointerId) return
      clearDragListeners(drag)
      if (drag.active && drag.target.hasPointerCapture?.(event.pointerId)) {
        drag.target.releasePointerCapture?.(event.pointerId)
      }
      dragRef.current = null
      if (drag.active) viewport.endInteraction()
    },
    [clearDragListeners, viewport]
  )

  useEffect(
    () => () => {
      const drag = dragRef.current
      if (!drag) return
      clearDragListeners(drag)
    },
    [clearDragListeners]
  )

  const handleProps = (axis) => ({
    onPointerDown: startDrag(axis),
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
  })

  const showResizeZones =
    !empty &&
    viewport.defaults.allowGuestResize &&
    viewport.defaults.allowDragResize

  const onViewportPointerDown = (event) => {
    if (
      event.pointerType !== 'touch' ||
      !viewport.defaults.allowGuestResize ||
      !viewport.defaults.allowPinchZoom ||
      viewport.modalLocked
    )
      return
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()]
      pinchRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: viewport.scale,
      }
      viewport.beginInteraction()
    }
  }

  const onViewportPointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    if (pointersRef.current.size !== 2 || !pinchRef.current) return
    event.preventDefault()
    const [a, b] = [...pointersRef.current.values()]
    const distance = Math.hypot(a.x - b.x, a.y - b.y)
    const nextScale =
      pinchRef.current.scale *
      (distance / Math.max(1, pinchRef.current.distance))
    viewport.setScale(nextScale, 'gesture')
  }

  const onViewportPointerEnd = (event) => {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2 && pinchRef.current) {
      pinchRef.current = null
      window.setTimeout(viewport.endInteraction, 150)
    }
  }

  const onWheel = (event) => {
    if (
      !event.ctrlKey ||
      !viewport.defaults.allowGuestResize ||
      !viewport.defaults.allowPinchZoom ||
      viewport.modalLocked
    )
      return
    event.preventDefault()
    viewport.setScale(
      viewport.scale + (event.deltaY > 0 ? -0.05 : 0.05),
      'gesture'
    )
  }

  return (
    <div ref={stageRef} className={styles.stage}>
      <section
        className={classNames(styles.viewport, {
          [styles.interacting]: viewport.interacting,
        })}
        style={{
          width: viewport.width,
          height: viewport.height,
          '--emenu-scale': viewport.scale,
          '--emenu-grid-gap': `${viewport.gap}px`,
          '--emenu-card-padding': `${viewport.padding}px`,
        }}
        data-emenu-columns={viewport.columns}
        data-emenu-sidebar={viewport.collapsedSidebar ? 'collapsed' : 'side'}
        onPointerDownCapture={onViewportPointerDown}
        onPointerMoveCapture={onViewportPointerMove}
        onPointerUpCapture={onViewportPointerEnd}
        onPointerCancelCapture={onViewportPointerEnd}
        onWheel={onWheel}
        onClickCapture={(event) => {
          if (viewport.interacting) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
      >
        <div
          ref={contentRef}
          className={styles.content}
          style={{
            width: viewport.frameLayoutWidth,
            height: viewport.frameLayoutHeight,
          }}
        >
          {children}
        </div>
        {showResizeZones ? (
          <>
            <span
              className={classNames(styles.resizeZone, styles.rightEdge)}
              aria-hidden="true"
              data-emenu-resize-edge="right"
              {...handleProps('x')}
            />
            <span
              className={classNames(styles.resizeZone, styles.bottomEdge)}
              aria-hidden="true"
              data-emenu-resize-edge="bottom"
              {...handleProps('y')}
            />
            <span
              className={classNames(styles.resizeZone, styles.cornerEdge)}
              aria-hidden="true"
              data-emenu-resize-edge="corner"
              {...handleProps('both')}
            />
          </>
        ) : null}
      </section>
    </div>
  )
}

export default ResizableMenuViewport
