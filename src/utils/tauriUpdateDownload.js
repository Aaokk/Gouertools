/**
 * Tauri：带进度地下载安装包到临时目录，完成后用系统默认方式打开（如 macOS 打开 .dmg）。
 */
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { openPath } from '@tauri-apps/plugin-opener'
import { updateDownloadOverlay as overlay } from './updateDownloadUiState.js'

function sleep (ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function filenameFromUrl (url) {
  try {
    const u = new URL(String(url).trim())
    const parts = u.pathname.split('/').filter(Boolean)
    const last = parts.pop()
    return last && last.includes('.') ? last : undefined
  } catch {
    return undefined
  }
}

/**
 * @param {string} downloadUrl HTTPS 直链，需为 .dmg/.pkg/.zip/.exe/.msi 等
 */
export async function downloadUpdateAssetThenOpen (downloadUrl) {
  const url = String(downloadUrl).trim()
  overlay.visible = true
  overlay.received = 0
  overlay.total = null
  overlay.error = ''
  overlay.phase = '正在下载更新包…'

  const unlisten = await listen('download_update_progress', (e) => {
    const p = e.payload
    if (p && typeof p.received === 'number') {
      overlay.received = p.received
    }
    if (p && (p.total === null || typeof p.total === 'number')) {
      overlay.total = p.total
    }
  })

  try {
    const path = await invoke('download_update_asset', {
      url,
      filenameHint: filenameFromUrl(url),
    })
    overlay.phase = '下载完成，正在打开安装包…'
    overlay.total = overlay.received
    await openPath(path)
    overlay.phase = '安装界面打开后将自动退出当前应用…'
    await sleep(900)
    await invoke('quit_app')
  } catch (e) {
    overlay.error = e instanceof Error ? e.message : String(e)
    overlay.phase = '下载失败'
    await sleep(3800)
    throw e
  } finally {
    unlisten()
    overlay.visible = false
    overlay.phase = ''
    overlay.error = ''
    overlay.received = 0
    overlay.total = null
  }
}
