/**
 * 跨端文件下载工具
 *
 * - Android / 桌面浏览器：<a download> + click()
 * - iOS Safari：blob URL 不支持 download 属性，改用 window.open() 新页面
 *   用户在新页面长按图片 → 存储到相册 / 共享
 */

import { showToast } from './toast.js'

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

/**
 * 下载 Blob 文件
 * @param {Blob|string} blobOrUrl  Blob 对象或已有的 Object URL
 * @param {string} filename        下载文件名
 * @param {boolean} [ownUrl=true]  是否由本函数创建并回收 Object URL
 */
export function downloadBlob(blobOrUrl, filename, ownUrl = true) {
  const url = typeof blobOrUrl === 'string'
    ? blobOrUrl
    : URL.createObjectURL(blobOrUrl)

  if (isIOS()) {
    // iOS Safari：在新标签打开，用户长按保存
    window.open(url, '_blank')
    showToast({ message: 'iOS 请在新页面长按图片保存', type: 'info' })
    // 延迟回收，给新页面加载时间
    if (ownUrl && typeof blobOrUrl !== 'string') {
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    }
  } else {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    if (ownUrl && typeof blobOrUrl !== 'string') {
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }
}

/**
 * 下载 dataURL（base64）
 * @param {string} dataUrl
 * @param {string} filename
 */
export function downloadDataUrl(dataUrl, filename) {
  if (isIOS()) {
    window.open(dataUrl, '_blank')
    showToast({ message: 'iOS 请在新页面长按图片保存', type: 'info' })
  } else {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}
