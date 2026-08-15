import { useEffect, useState } from 'react'
import { getPlatformType } from '@/utils/KeyBoardBounce/utils'
import axios from 'axios'
import async from 'async'

const { isIOS } = getPlatformType()

const preloadImageQueue = async.queue(async (task) => await task(), 3)

const loadImageBlob = (src) =>
  preloadImageQueue.push(async () => {
    try {
      const res = await axios.get(src, { responseType: 'blob' })
      return res.data
    } catch {
      return false
    }
  })

const getMaxScreenWidth = () => {
  return window.screen.width * window.devicePixelRatio
}

const imageCache = new Map()
const pendingRequests = new Map()

export const deleteImageCache = (src) => {
  if (Array.isArray(src)) {
    src.forEach(deleteImageCache)
  } else {
    if (imageCache.has(src)) {
      imageCache.delete(src)
    }
    if (pendingRequests.has(src)) {
      pendingRequests.delete(src)
    }
  }
}

const worker = isIOS
  ? null
  : new Worker(new URL('../../workers/preload.worker.js', import.meta.url))

if (worker) {
  worker.addEventListener('message', (event) => {
    const { src, blob, error } = event.data
    const pendingList = pendingRequests.get(src)
    if (error) {
      pendingList?.forEach((resolve) => resolve(false))
    } else {
      pendingList?.forEach((resolve) => resolve(blob))
    }
    pendingRequests.delete(src)
  })
}

const CacheImage = ({ src, imgRef, ...props }) => {
  const [img, setImg] = useState()

  useEffect(() => {
    let blobUrl = undefined
    let cancelled = false

    if (src) {
      preloadImage(src).then((cachedBlob) => {
        if (cancelled) return
        if (cachedBlob) {
          blobUrl = URL.createObjectURL(cachedBlob)
          setImg(blobUrl)
        } else {
          setImg(src)
        }
      })
    } else {
      setImg(undefined)
    }

    return () => {
      cancelled = true
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
        blobUrl = undefined
      }
    }
  }, [src])

  const onError = () => {
    if (img !== src) {
      setImg(src)
    }
  }

  return <img ref={imgRef} src={img} onError={onError} {...props} />
}

export const preloadImage = async (src) => {
  if (imageCache.has(src)) {
    return imageCache.get(src)
  }
  if (pendingRequests.has(src)) {
    return new Promise((resolve) => {
      pendingRequests.set(src, [...(pendingRequests.get(src) || []), resolve])
    })
  }
  return new Promise((resolve) => {
    pendingRequests.set(src, [
      ...(pendingRequests.get(src) || []),
      (blob) => {
        if (blob) {
          imageCache.set(src, blob)
        }
        resolve(blob)
      },
    ])
    loadImageBlob(src).then((blob) => {
      if (blob) {
        if (isIOS) {
          pendingRequests.get(src)?.forEach((resolve) => resolve(blob))
          pendingRequests.delete(src)
        } else {
          const maxWidth = getMaxScreenWidth()
          worker.postMessage({ src, blob, maxWidth })
        }
      } else {
        pendingRequests.get(src)?.forEach((resolve) => resolve(false))
        pendingRequests.delete(src)
      }
    })
  })
}

export default CacheImage
