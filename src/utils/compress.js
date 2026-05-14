/**
 * 图片压缩引擎 — 移植自 pic-smaller
 *
 * 支持格式：
 *   JPEG / WebP  → OffscreenCanvas.convertToBlob（有损，quality 0-1）
 *   PNG          → WASM pngquant（颜色数 2-256，抖动 0-1）
 *
 * 缩放模式（resizeMethod）：
 *   null      — 不缩放
 *   fitWidth  — 按宽度等比缩放（option.width）
 *   fitHeight — 按高度等比缩放（option.height）
 *   setShort  — 短边限制（option.short）
 *   setLong   — 长边限制（option.long）
 */

import { Module } from '../engines/PngWasmModule.js'

/* ── 尺寸计算 ─────────────────────────────────────────────── */

/**
 * @param {{ width:number, height:number }} info
 * @param {{
 *   resizeMethod?: string|null,
 *   width?: number,
 *   height?: number,
 *   short?: number,
 *   long?: number,
 *   cropWidthRatio?: number,
 *   cropHeightRatio?: number,
 *   cropWidthSize?: number,
 *   cropHeightSize?: number,
 * }} option
 * @returns {{ x:number, y:number, width:number, height:number }}
 */
export function getOutputDimension(info, option) {
  const { resizeMethod, width, height, short, long,
          cropWidthRatio, cropHeightRatio, cropWidthSize, cropHeightSize } = option

  if (resizeMethod === 'fitWidth' && width) {
    const rate = width / info.width
    return { x: 0, y: 0, width: Math.ceil(width), height: Math.ceil(rate * info.height) }
  }

  if (resizeMethod === 'fitHeight' && height) {
    const rate = height / info.height
    return { x: 0, y: 0, width: Math.ceil(rate * info.width), height: Math.ceil(height) }
  }

  if (resizeMethod === 'setShort' && short) {
    if (info.width <= info.height) {
      const rate = short / info.width
      return { x: 0, y: 0, width: Math.ceil(short), height: Math.ceil(rate * info.height) }
    } else {
      const rate = short / info.height
      return { x: 0, y: 0, width: Math.ceil(rate * info.width), height: Math.ceil(short) }
    }
  }

  if (resizeMethod === 'setLong' && long) {
    if (info.width >= info.height) {
      const rate = long / info.width
      return { x: 0, y: 0, width: Math.ceil(long), height: Math.ceil(rate * info.height) }
    } else {
      const rate = long / info.height
      return { x: 0, y: 0, width: Math.ceil(rate * info.width), height: Math.ceil(long) }
    }
  }

  // 裁剪模式：按比例居中裁剪
  if (resizeMethod === 'setCropRatio' && cropWidthRatio && cropHeightRatio) {
    let x, y, newWidth, newHeight
    if (cropWidthRatio / cropHeightRatio >= info.width / info.height) {
      x = 0
      newWidth = info.width
      newHeight = (info.width * cropHeightRatio) / cropWidthRatio
      y = (info.height - newHeight) / 2
    } else {
      y = 0
      newHeight = info.height
      newWidth = (info.height * cropWidthRatio) / cropHeightRatio
      x = (info.width - newWidth) / 2
    }
    return {
      x: Math.ceil(x), y: Math.ceil(y),
      width: Math.ceil(newWidth), height: Math.ceil(newHeight),
    }
  }

  // 裁剪模式：按指定像素尺寸居中裁剪
  if (resizeMethod === 'setCropSize' && cropWidthSize && cropHeightSize) {
    const newWidth  = cropWidthSize  >= info.width  ? info.width  : cropWidthSize
    const newHeight = cropHeightSize >= info.height ? info.height : cropHeightSize
    return {
      x: Math.ceil((info.width - newWidth) / 2),
      y: Math.ceil((info.height - newHeight) / 2),
      width: Math.ceil(newWidth),
      height: Math.ceil(newHeight),
    }
  }

  return { x: 0, y: 0, width: info.width, height: info.height }
}

/* ── 画布工具 ─────────────────────────────────────────────── */

async function createOffscreenCanvas(blob, info, dim) {
  const canvas = new OffscreenCanvas(dim.width, dim.height)
  const ctx = canvas.getContext('2d')
  const bitmap = await createImageBitmap(blob)
  const isCrop = dim.x !== 0 || dim.y !== 0
  if (isCrop) {
    // 裁剪模式：从原图 (x,y) 起点取指定尺寸
    ctx.drawImage(bitmap, dim.x, dim.y, dim.width, dim.height, 0, 0, dim.width, dim.height)
  } else {
    // 缩放模式：全图缩到目标尺寸
    ctx.drawImage(bitmap, 0, 0, info.width, info.height, 0, 0, dim.width, dim.height)
  }
  bitmap.close()
  return canvas
}

/* ── JPEG / WebP 压缩 ─────────────────────────────────────── */

/**
 * @param {Blob} blob
 * @param {{ width:number, height:number }} info
 * @param {{ quality: number }} jpegOption
 * @param {{ resizeMethod?:string, width?:number, height?:number, short?:number, long?:number }} resizeOption
 * @returns {Promise<Blob>}
 */
export async function compressJpegWebp(blob, info, jpegOption, resizeOption) {
  const dim = getOutputDimension(info, resizeOption)
  const canvas = await createOffscreenCanvas(blob, info, dim)
  return canvas.convertToBlob({ type: blob.type, quality: jpegOption.quality })
}

/* ── PNG 压缩（WASM pngquant）───────────────────────────── */

/**
 * @param {Blob} blob
 * @param {{ width:number, height:number }} info
 * @param {{ colors: number, dithering: number }} pngOption
 * @param {{ resizeMethod?:string, width?:number, height?:number, short?:number, long?:number }} resizeOption
 * @returns {Promise<Blob>}
 */
export async function compressPng(blob, info, pngOption, resizeOption) {
  const dim = getOutputDimension(info, resizeOption)
  const canvas = await createOffscreenCanvas(blob, info, dim)
  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, dim.width, dim.height).data

  try {
    const buffer = Module._malloc(imageData.byteLength)
    Module.HEAPU8.set(imageData, buffer)

    if (imageData.byteLength !== dim.width * dim.height * 4) {
      Module._free(buffer)
      return blob
    }

    const outputSizePointer = Module._malloc(4)
    const result = Module._compress(
      dim.width,
      dim.height,
      pngOption.colors,
      pngOption.dithering,
      buffer,
      outputSizePointer,
    )

    if (result) {
      Module._free(buffer)
      Module._free(outputSizePointer)
      return blob
    }

    const outputSize = Module.getValue(outputSizePointer, 'i32', false)
    const output = new Uint8Array(outputSize)
    output.set(Module.HEAPU8.subarray(buffer, buffer + outputSize))
    Module._free(buffer)
    Module._free(outputSizePointer)

    return new Blob([output], { type: 'image/png' })
  } catch {
    return blob
  }
}

/* ── 统一入口 ─────────────────────────────────────────────── */

/**
 * 根据 MIME 类型分派压缩策略
 *
 * @param {Blob} blob
 * @param {{ width:number, height:number }} info
 * @param {{
 *   jpeg: { quality: number },
 *   png: { colors: number, dithering: number },
 *   resizeMethod?: string|null,
 *   width?: number,
 *   height?: number,
 *   short?: number,
 *   long?: number,
 *   targetFormat?: string|null,
 *   transparentFill?: string,
 * }} option
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
export async function compress(blob, info, option) {
  let workBlob = blob
  let workMime = blob.type.toLowerCase()

  // 格式转换预处理（PNG→JPEG/WebP 时先填充透明背景）
  if (option.targetFormat && option.targetFormat !== workMime) {
    const targetMime = mimeFromTarget(option.targetFormat)
    if (targetMime) {
      const bitmap = await createImageBitmap(blob)
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = canvas.getContext('2d')
      if (['image/jpeg', 'image/jpg'].includes(targetMime)) {
        ctx.fillStyle = option.transparentFill || '#ffffff'
        ctx.fillRect(0, 0, bitmap.width, bitmap.height)
      }
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      workBlob = await canvas.convertToBlob({ type: targetMime, quality: 1 })
      workMime = targetMime
    }
  }

  const resizeOption = {
    resizeMethod:    option.resizeMethod || null,
    width:           option.width,
    height:          option.height,
    short:           option.short,
    long:            option.long,
    cropWidthRatio:  option.cropWidthRatio,
    cropHeightRatio: option.cropHeightRatio,
    cropWidthSize:   option.cropWidthSize,
    cropHeightSize:  option.cropHeightSize,
  }

  const dim = getOutputDimension(info, resizeOption)
  let outBlob

  if (workMime === 'image/png') {
    outBlob = await compressPng(workBlob, info, option.png, resizeOption)
  } else {
    outBlob = await compressJpegWebp(workBlob, info, option.jpeg, resizeOption)
  }

  return { blob: outBlob, width: dim.width, height: dim.height }
}

/* ── 工具 ─────────────────────────────────────────────────── */

function mimeFromTarget(target) {
  const map = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }
  return map[target.toLowerCase()] || null
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 读取图片 Blob 的原始宽高
 * @param {Blob} blob
 * @returns {Promise<{ width:number, height:number }>}
 */
export async function getBlobDimension(blob) {
  const bitmap = await createImageBitmap(blob)
  const w = bitmap.width
  const h = bitmap.height
  bitmap.close()
  return { width: w, height: h }
}
