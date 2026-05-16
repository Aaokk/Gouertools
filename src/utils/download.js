/**
 * 跨端文件下载工具
 *
 * - Tauri 桌面端：弹出原生「另存为」对话框
 * - Android / 桌面浏览器：<a download> + click()
 * - iOS Safari：blob URL 不支持 download 属性，改用 window.open() 新页面
 */

import { showToast } from './toast.js'

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

let _tauriChecked = false
let _isTauri = false

async function checkTauri() {
  if (_tauriChecked) return _isTauri
  try {
    const { isTauri } = await import('@tauri-apps/api/core')
    _isTauri = isTauri()
  } catch { _isTauri = false }
  _tauriChecked = true
  return _isTauri
}

async function tauriSaveBlob(blobOrUrl, filename) {
  try {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { invoke } = await import('@tauri-apps/api/core')
    const path = await save({
      defaultPath: filename,
      title: '保存文件',
      filters: [{ name: 'All Files', extensions: ['*'] }],
    })
    if (!path) return false
    const blob = typeof blobOrUrl === 'string'
      ? await (await fetch(blobOrUrl)).blob()
      : blobOrUrl
    const reader = new FileReader()
    const dataUrl = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
    await invoke('desktop_save_image', { path, dataUrl })
    showToast({ message: '已保存', type: 'success' })
    return true
  } catch (err) {
    console.error('Tauri 保存失败:', err)
    return false
  }
}

/**
 * 下载 Blob 文件
 * @param {Blob|string} blobOrUrl  Blob 对象或已有的 Object URL
 * @param {string} filename        下载文件名
 * @param {boolean} [ownUrl=true]  是否由本函数创建并回收 Object URL
 */
export async function downloadBlob(blobOrUrl, filename, ownUrl = true) {
  if (await checkTauri()) {
    if (await tauriSaveBlob(blobOrUrl, filename)) return
  }

  const url = typeof blobOrUrl === 'string'
    ? blobOrUrl
    : URL.createObjectURL(blobOrUrl)

  if (isIOS()) {
    window.open(url, '_blank')
    showToast({ message: 'iOS 请在新页面长按图片保存', type: 'info' })
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
export async function downloadDataUrl(dataUrl, filename) {
  if (await checkTauri()) {
    if (await tauriSaveBlob(dataUrl, filename)) return
  }

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
