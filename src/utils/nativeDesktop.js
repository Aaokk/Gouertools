/**
 * Tauri 桌面壳：保存/选目录走 dialog + invoke；Web 端无壳则返回 null，走浏览器下载。
 */
import { invoke, isTauri } from '@tauri-apps/api/core'

const allFilesFilter = [{ name: 'All Files', extensions: ['*'] }]

const tauriShell = {
  async saveFile (suggestedName) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const path = await save({
      defaultPath: suggestedName,
      title: '保存图片',
      filters: allFilesFilter,
    })
    return path ?? null
  },

  async saveImage ({ dataUrl, path }) {
    await invoke('desktop_save_image', { path, dataUrl })
  },

  async selectDirectory () {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({
      directory: true,
      multiple: false,
      title: '选择保存目录',
    })
    if (selected === null) {
      return { canceled: true, filePaths: [] }
    }
    if (Array.isArray(selected)) {
      return { canceled: selected.length === 0, filePaths: selected }
    }
    return { canceled: false, filePaths: [selected] }
  },
}

/** @returns {typeof tauriShell | null} */
export function getDesktopShell () {
  if (typeof window === 'undefined') return null
  if (isTauri()) return tauriShell
  return null
}
