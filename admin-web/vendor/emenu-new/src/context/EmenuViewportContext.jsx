import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  DEFAULT_EMENU_DISPLAY_CONFIG,
  EMENU_VIEWPORT_LIMITS,
  clamp,
  getEmenuOrientation,
  normalizeEmenuDisplayConfig,
  resolveEmenuGrid,
  resolveViewportSize,
  snapToStep,
} from '@/utils/emenuViewportLayout'
import {
  readEmenuViewportPreference,
  writeEmenuViewportPreference,
} from '@/utils/emenuViewportPreference'

const EmenuViewportContext = createContext(null)

export function EmenuViewportProvider({
  storeConfig,
  sessionKey,
  fallbackSessionKey,
  children,
}) {
  const defaults = useMemo(
    () => normalizeEmenuDisplayConfig(storeConfig),
    [storeConfig]
  )
  const [preference, setPreference] = useState(defaults)
  const [availableSize, setAvailableSizeState] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const [source, setSource] = useState('store-default')
  const [interacting, setInteracting] = useState(false)
  const [modalLocked, setModalLocked] = useState(false)
  const [headerLogicalHeight, setHeaderLogicalHeightState] = useState(0)
  const [previousColumns, setPreviousColumns] = useState()
  const frameRef = useRef()

  useEffect(() => {
    const stored =
      readEmenuViewportPreference(sessionKey) ||
      readEmenuViewportPreference(fallbackSessionKey)
    if (stored && sessionKey) {
      writeEmenuViewportPreference(sessionKey, stored)
    }
    setPreference(stored || defaults)
    setSource(stored ? 'fallback' : 'store-default')
  }, [defaults, fallbackSessionKey, sessionKey])

  const persist = useCallback(
    (next) => {
      setPreference(next)
      writeEmenuViewportPreference(sessionKey, next)
    },
    [sessionKey]
  )

  const updatePreference = useCallback(
    (patch, nextSource) => {
      if (!defaults.allowGuestResize || modalLocked) return
      const next = normalizeEmenuDisplayConfig({ ...preference, ...patch })
      persist(next)
      setSource(nextSource)
    },
    [defaults.allowGuestResize, modalLocked, persist, preference]
  )

  const setAvailableSize = useCallback((width, height, nextSource) => {
    if (!Number.isFinite(width) || !Number.isFinite(height)) return
    setAvailableSizeState((current) => {
      if (current.width === width && current.height === height) return current
      return { width, height }
    })
    if (nextSource) setSource(nextSource)
  }, [])

  const size = useMemo(
    () =>
      resolveViewportSize({
        availableWidth: availableSize.width,
        availableHeight: availableSize.height,
        widthRatio: preference.widthRatio,
        heightRatio: preference.heightRatio,
      }),
    [availableSize, preference.heightRatio, preference.widthRatio]
  )
  const orientation = getEmenuOrientation(
    availableSize.width,
    availableSize.height
  )
  const grid = useMemo(
    () =>
      resolveEmenuGrid({
        containerWidth: size.width,
        scale: preference.scale,
        density: preference.density,
        orientation,
        previousColumns,
      }),
    [orientation, preference.density, preference.scale, previousColumns, size]
  )

  useEffect(() => {
    setPreviousColumns(grid.columns)
  }, [grid.columns])

  const setScale = useCallback(
    (scale, nextSource = 'preset') =>
      updatePreference(
        {
          scale: clamp(
            snapToStep(scale),
            EMENU_VIEWPORT_LIMITS.minScale,
            EMENU_VIEWPORT_LIMITS.maxScale
          ),
        },
        nextSource
      ),
    [updatePreference]
  )

  const resizeTo = useCallback(
    (width, height) =>
      updatePreference(
        {
          widthRatio: width / Math.max(1, availableSize.width),
          heightRatio: height / Math.max(1, availableSize.height),
        },
        'drag'
      ),
    [availableSize, updatePreference]
  )

  const scheduleResizeTo = useCallback(
    (width, height) => {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(() => resizeTo(width, height))
    },
    [resizeTo]
  )

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  const beginInteraction = useCallback(
    () => !modalLocked && setInteracting(true),
    [modalLocked]
  )
  const endInteraction = useCallback(() => setInteracting(false), [])
  const setModalLock = useCallback((locked) => {
    setInteracting(false)
    setModalLocked(Boolean(locked))
  }, [])
  const setHeaderLogicalHeight = useCallback((height) => {
    if (!Number.isFinite(height) || height < 0) return
    setHeaderLogicalHeightState((current) =>
      Math.abs(current - height) < 0.5 ? current : height
    )
  }, [])

  const frameLayoutWidth = size.width / preference.scale
  const frameLayoutHeight = size.height / preference.scale
  const innerMenuHeight = Math.max(0, frameLayoutHeight - headerLogicalHeight)

  const value = useMemo(
    () => ({
      ...size,
      ...grid,
      scale: preference.scale,
      density: preference.density,
      layoutWidth: frameLayoutWidth,
      layoutHeight: innerMenuHeight,
      frameLayoutWidth,
      frameLayoutHeight,
      headerLogicalHeight,
      orientation,
      source,
      defaults,
      interacting,
      modalLocked,
      setScale,
      setPreset: setScale,
      resizeTo: scheduleResizeTo,
      setAvailableSize,
      beginInteraction,
      endInteraction,
      setModalLocked: setModalLock,
      setHeaderLogicalHeight,
      resetToStoreDefault: () => {
        persist(defaults)
        setSource('store-default')
      },
    }),
    [
      defaults,
      beginInteraction,
      endInteraction,
      frameLayoutHeight,
      frameLayoutWidth,
      grid,
      headerLogicalHeight,
      innerMenuHeight,
      interacting,
      modalLocked,
      orientation,
      persist,
      preference,
      scheduleResizeTo,
      setAvailableSize,
      setScale,
      setModalLock,
      setHeaderLogicalHeight,
      size,
      source,
    ]
  )

  return (
    <EmenuViewportContext.Provider value={value}>
      {children}
    </EmenuViewportContext.Provider>
  )
}

export function useEmenuViewport() {
  const value = useContext(EmenuViewportContext)
  if (!value) {
    return {
      ...DEFAULT_EMENU_DISPLAY_CONFIG,
      defaults: DEFAULT_EMENU_DISPLAY_CONFIG,
      width: window.innerWidth,
      height: window.innerHeight,
      layoutWidth: window.innerWidth,
      layoutHeight: window.innerHeight,
      frameLayoutWidth: window.innerWidth,
      frameLayoutHeight: window.innerHeight,
      headerLogicalHeight: 0,
      columns: 4,
      gap: 16,
      padding: 16,
      collapsedSidebar: false,
      interacting: false,
      modalLocked: false,
    }
  }
  return value
}
