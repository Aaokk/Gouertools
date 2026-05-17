/**
 * 桌面端启动后调用上架接口查询版本；有新版本则询问：自动下载打开 / 浏览器 / 稍后。
 * （HTTP GET 经 Rust invoke，绕过 CORS；直链下载仅允许固定域名。）
 */
import { invoke, isTauri } from '@tauri-apps/api/core'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
import { arch, platform as osPlatform } from '@tauri-apps/plugin-os'
import { downloadUpdateAssetThenOpen } from './tauriUpdateDownload.js'
import {
  UPDATE_API_URL,
  pickVariantKey,
  resolveDownloadUrl,
} from './updateManifestShared.js'

const DISMISS_PREFIX = 'update:dismiss:v'

function compareSemver (remote, local) {
  const ra = String(remote).split('.').map((x) => parseInt(x, 10) || 0)
  const la = String(local).split('.').map((x) => parseInt(x, 10) || 0)
  const n = Math.max(ra.length, la.length)
  for (let i = 0; i < n; i++) {
    const a = ra[i] ?? 0
    const b = la[i] ?? 0
    if (a > b) return 1
    if (a < b) return -1
  }
  return 0
}

/** 仅当 URL 指向常见安装包后缀时，提供应用内自动下载 */
function canAutoDownloadUrl (url) {
  try {
    const path = new URL(String(url).trim()).pathname.toLowerCase()
    return /\.(dmg|pkg|zip|exe|msi)(\?.*)?$/.test(path)
  } catch {
    return false
  }
}

function markDismissed (version, forceUpdate) {
  if (!forceUpdate) {
    localStorage.setItem(DISMISS_PREFIX + version, '1')
  }
}

/**
 * @returns {{ version: string, downloadUrl: string, forceUpdate: boolean, displayName?: string, updateContent?: string } | null}
 */
function parseAppUpdatePayload (parsed) {
  if (!parsed || Number(parsed.code) !== 200 || !parsed.data || typeof parsed.data !== 'object') {
    return null
  }

  const plat = osPlatform()
  const platforms = parsed.data.platforms
  if (!platforms || typeof platforms !== 'object') return null

  const block =
    plat === 'macos'
      ? platforms.macos
      : plat === 'windows'
        ? platforms.windows
        : null

  if (!block || typeof block !== 'object') return null

  const v =
    block.app_version !== undefined && block.app_version !== null
      ? String(block.app_version).trim()
      : ''
  if (!v) return null

  const variantKey = pickVariantKey(plat, arch(), block.variant_urls)
  const downloadUrl = resolveDownloadUrl(block, variantKey)
    || resolveDownloadUrl(block, null)

  if (!downloadUrl) return null

  const forceUpdate = Number(block.force_update) === 1
  let displayName
  let updateContent

  const appMeta = parsed.data.app
  if (appMeta && typeof appMeta.display_name === 'string' && appMeta.display_name.trim()) {
    displayName = appMeta.display_name.trim()
  }
  if (typeof block.update_content === 'string' && block.update_content.trim()) {
    updateContent = block.update_content.trim()
  }

  return {
    version: v,
    downloadUrl,
    forceUpdate,
    displayName,
    updateContent,
  }
}

function dbgUpdate (msg, detail) {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.debug('[tauri-update-check]', msg, detail ?? '')
  }
}

export async function runTauriUpdateCheckOnce () {
  if (!isTauri()) {
    dbgUpdate('skip: 非 Tauri 环境（如仅浏览器）')
    return
  }

  try {
    const raw = await invoke('fetch_update_manifest', { url: UPDATE_API_URL })
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const manifest = parseAppUpdatePayload(parsed)
    if (!manifest) {
      dbgUpdate('skip: 接口无有效平台数据或 package_url 不可用', {
        code: parsed?.code,
        plat: osPlatform(),
      })
      return
    }

    const current =
      typeof __APP_VERSION__ === 'undefined' ? '0.0.0' : String(__APP_VERSION__)
    const cmp = compareSemver(manifest.version, current)
    if (cmp <= 0) {
      dbgUpdate('skip: 已是最新或更高', { remote: manifest.version, local: current })
      return
    }

    if (
      !manifest.forceUpdate &&
      localStorage.getItem(DISMISS_PREFIX + manifest.version)
    ) {
      dbgUpdate('skip: 本版本曾点过稍后', { version: manifest.version })
      return
    }

    const title =
      manifest.displayName != null ? String(manifest.displayName) : 'Gouer工具包包'
    let body = `发现新版本 ${manifest.version}（当前为 ${current}）。`
    if (manifest.updateContent) {
      const note =
        manifest.updateContent.length > 200
          ? manifest.updateContent.slice(0, 200) + '…'
          : manifest.updateContent
      body += `\n\n${note}`
    }

    if (canAutoDownloadUrl(manifest.downloadUrl)) {
      body +=
        '\n\n「自动下载并打开」将把安装包保存到临时目录，完成后唤起系统打开（如 macOS 的 .dmg），请拖拽到「应用程序」完成替换。\n也可选择「用浏览器打开」手动下载。'

      const choice = await message(body, {
        title,
        kind: 'info',
        buttons: {
          yes: '自动下载并打开',
          no: '用浏览器打开',
          cancel: '稍后',
        },
      })
      const c = String(choice)

      if (c === 'Cancel') {
        markDismissed(manifest.version, manifest.forceUpdate)
        return
      }
      if (c === 'Yes' || c.includes('下载并打开')) {
        try {
          await downloadUpdateAssetThenOpen(manifest.downloadUrl)
        } catch {
          const fallback = await ask('自动下载未完成，是否在浏览器打开下载链接？', {
            title,
            okLabel: '打开',
            cancelLabel: '关闭',
          })
          if (fallback) await openUrl(manifest.downloadUrl)
        }
        return
      }
      if (c === 'No' || c.includes('浏览器')) {
        await openUrl(manifest.downloadUrl)
        return
      }
      await openUrl(manifest.downloadUrl)
      return
    }

    body += '\n\n当前链接可能为下载页面，将在浏览器中打开。'
    const goBrowser = await ask(body, {
      title,
      okLabel: '前往下载',
      cancelLabel: '稍后',
    })
    if (!goBrowser) {
      markDismissed(manifest.version, manifest.forceUpdate)
      return
    }
    await openUrl(manifest.downloadUrl)
  } catch (e) {
    console.warn('[tauri-update-check]', e)
  }
}
