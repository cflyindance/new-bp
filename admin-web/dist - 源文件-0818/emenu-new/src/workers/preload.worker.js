self.onmessage = async ({ data }) => {
  const { src, blob, maxWidth } = data
  try {
    const sourceType = String(blob?.type || '').toLowerCase()
    const normalizeType = sourceType === 'image/jpg' ? 'image/jpeg' : sourceType
    const supportedTypes = new Set(['image/jpeg', 'image/webp', 'image/png'])

    if (!supportedTypes.has(normalizeType)) {
      self.postMessage({ src, blob })
      return
    }

    const bitmap = await createImageBitmap(blob)
    const shouldResize = bitmap.width > maxWidth
    if (!shouldResize) {
      bitmap.close()
      self.postMessage({ src, blob })
      return
    }

    const targetWidth = maxWidth
    const targetHeight = Math.ceil((bitmap.height * targetWidth) / bitmap.width)
    const canvas = new OffscreenCanvas(targetWidth, targetHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      self.postMessage({ src, blob })
      return
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    bitmap.close()

    const convertToBlobOptions = { type: normalizeType }
    const compressedBlob = await canvas.convertToBlob(convertToBlobOptions)

    canvas.width = 0
    canvas.height = 0

    const finalBlob =
      compressedBlob &&
      compressedBlob.size > 0 &&
      compressedBlob.size < blob.size
        ? compressedBlob
        : blob

    self.postMessage({ src, blob: finalBlob })
  } catch (e) {
    self.postMessage({ src, error: e.message })
  }
}
