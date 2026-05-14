/**
 * 图片压缩引擎 — 移植自 pic-smaller
 *
 * 支持格式：
 *   JPEG / WebP  → OffscreenCanvas.convertToBlob（有损，quality 0-1）
 *   PNG          → WASM pngquant（颜色数 2-256，抖动 0-1）
 *   GIF          → WASM gifsicle（颜色数 2-256，抖色）
 *   AVIF         → WASM avif encoder（quality 1-100，speed 1-10）
 *   SVG          → svgo（移除冗余标签/属性）
 *
 * 缩放模式（resizeMethod）：
 *   null         — 不缩放
 *   fitWidth     — 按宽度等比缩放（option.width）
 *   fitHeight    — 按高度等比缩放（option.height）
 *   setShort     — 短边限制（option.short）
 *   setLong      — 长边限制（option.long）
 *   setCropRatio — 按比例居中裁剪（option.cropWidthRatio / cropHeightRatio）
 *   setCropSize  — 按像素居中裁剪（option.cropWidthSize / cropHeightSize）
 */

import { Module } from '../engines/PngWasmModule.js'
import { gifsicle } from '../engines/GifWasmModule.js'
import { avif } from '../engines/AvifWasmModule.js'

/* ── 尺寸计算 ─────────────────────────────────────────────── */

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
  if (resizeMethod === 'setCropRatio' && cropWidthRatio && cropHeightRatio) {
    let x, y, newWidth, newHeight
    if (cropWidthRatio / cropHeightRatio >= info.width / info.height) {
      x = 0; newWidth = info.width
      newHeight = (info.width * cropHeightRatio) / cropWidthRatio
      y = (info.height - newHeight) / 2
    } else {
      y = 0; newHeight = info.height
      newWidth = (info.height * cropWidthRatio) / cropHeightRatio
      x = (info.width - newWidth) / 2
    }
    return { x: Math.ceil(x), y: Math.ceil(y), width: Math.ceil(newWidth), height: Math.ceil(newHeight) }
  }
  if (resizeMethod === 'setCropSize' && cropWidthSize && cropHeightSize) {
    const nw = cropWidthSize  >= info.width  ? info.width  : cropWidthSize
    const nh = cropHeightSize >= info.height ? info.height : cropHeightSize
    return {
      x: Math.ceil((info.width - nw) / 2),
      y: Math.ceil((info.height - nh) / 2),
      width: Math.ceil(nw), height: Math.ceil(nh),
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
    ctx.drawImage(bitmap, dim.x, dim.y, dim.width, dim.height, 0, 0, dim.width, dim.height)
  } else {
    ctx.drawImage(bitmap, 0, 0, info.width, info.height, 0, 0, dim.width, dim.height)
  }
  bitmap.close()
  return canvas
}

/* ── JPEG / WebP 压缩 ─────────────────────────────────────── */

export async function compressJpegWebp(blob, info, jpegOption, resizeOption) {
  const dim = getOutputDimension(info, resizeOption)
  const canvas = await createOffscreenCanvas(blob, info, dim)
  return canvas.convertToBlob({ type: blob.type, quality: jpegOption.quality })
}

/* ── PNG 压缩（WASM pngquant）───────────────────────────── */

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
    const result = Module._compress(dim.width, dim.height, pngOption.colors, pngOption.dithering, buffer, outputSizePointer)
    if (result) { Module._free(buffer); Module._free(outputSizePointer); return blob }
    const outputSize = Module.getValue(outputSizePointer, 'i32', false)
    const output = new Uint8Array(outputSize)
    output.set(Module.HEAPU8.subarray(buffer, buffer + outputSize))
    Module._free(buffer); Module._free(outputSizePointer)
    return new Blob([output], { type: 'image/png' })
  } catch { return blob }
}

/* ── GIF 压缩（WASM gifsicle）───────────────────────────── */

export async function compressGif(blob, info, gifOption, resizeOption, fileName) {
  const dim = getOutputDimension(info, resizeOption)
  try {
    const commands = [
      '--optimize=3',
      `--colors=${gifOption.colors}`,
    ]
    if (dim.width !== info.width || dim.height !== info.height) {
      commands.push(`--crop=${resizeOption.x || 0},${resizeOption.y || 0}+${dim.width}x${dim.height}`)
    } else {
      commands.push(`--resize=${dim.width}x${dim.height}`)
    }
    if (gifOption.dithering) commands.push('--dither=floyd-steinberg')
    const name = fileName || 'image.gif'
    commands.push(`--output=/out/${name}`, name)
    const buffer = await blob.arrayBuffer()
    const result = await gifsicle({
      data: [{ file: buffer, name }],
      command: [commands.join(' ')],
    })
    if (!Array.isArray(result) || result.length !== 1) return blob
    return new Blob([result[0].file], { type: 'image/gif' })
  } catch { return blob }
}

/* ── AVIF 压缩（WASM avif encoder）─────────────────────── */

export async function compressAvif(blob, info, avifOption, resizeOption) {
  const dim = getOutputDimension(info, resizeOption)
  try {
    const canvas = await createOffscreenCanvas(blob, info, dim)
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, dim.width, dim.height).data
    const bytes = new Uint8Array(imageData)
    const result = await avif(bytes, dim.width, dim.height, avifOption.quality, avifOption.speed)
    return new Blob([result], { type: 'image/avif' })
  } catch { return blob }
}

/* ── SVG 压缩（svgo）────────────────────────────────────── */

export async function compressSvg(blob) {
  try {
    const { optimize } = await import('svgo')
    const text = await blob.text()
    const result = optimize(text)
    return new Blob([result.data], { type: 'image/svg+xml' })
  } catch { return blob }
}

/* ── 统一入口 ─────────────────────────────────────────────── */

export async function compress(blob, info, option) {
  let workBlob = blob
  let workMime = blob.type.toLowerCase()

  // SVG 单独处理，不走格式转换逻辑
  if (workMime === 'image/svg+xml') {
    const outBlob = await compressSvg(workBlob)
    return { blob: outBlob, width: info.width, height: info.height }
  }

  // 格式转换预处理
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
  } else if (workMime === 'image/gif') {
    outBlob = await compressGif(workBlob, info, option.gif, resizeOption, option._fileName)
  } else if (workMime === 'image/avif') {
    outBlob = await compressAvif(workBlob, info, option.avif, resizeOption)
  } else {
    outBlob = await compressJpegWebp(workBlob, info, option.jpeg, resizeOption)
  }

  return { blob: outBlob, width: dim.width, height: dim.height }
}

/* ── 工具 ─────────────────────────────────────────────────── */

function mimeFromTarget(target) {
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', avif: 'image/avif',
    svg: 'image/svg+xml',
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

export async function getBlobDimension(blob) {
  // SVG 用 Image 元素读取尺寸（createImageBitmap 不支持 SVG）
  if (blob.type === 'image/svg+xml') {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth || 100, height: img.naturalHeight || 100 })
        URL.revokeObjectURL(url)
      }
      img.onerror = () => { resolve({ width: 0, height: 0 }); URL.revokeObjectURL(url) }
      img.src = url
    })
  }
  const bitmap = await createImageBitmap(blob)
  const w = bitmap.width
  const h = bitmap.height
  bitmap.close()
  return { width: w, height: h }
}
