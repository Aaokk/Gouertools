/**
 * 桌面端启动后调用上架接口查询版本；有新版本则询问：自动下载打开 / 浏览器 / 稍后。
 * （HTTP GET 经 Rust invoke，绕过 CORS；直链下载仅允许固定域名。）
 */
import { invoke, isTauri } from '@tauri-apps/api/core'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
import { arch, platform as osPlatform } from '@tauri-apps/plugin-os'
import { downloadUpdateAssetThenOpen } from './tauriUpdateDownload.js'

const UPDATE_API_URL =
  'https://tapi.ge0.cc/app/appup/getAppUpdate?appname=tools'

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

/** 只允许下载/落地页的 HTTPS 域名（与后端配置一致时可扩展） */
function isAllowedPublicUrl (url) {
  try {
    const u = new URL(String(url).trim())
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    return host === 'tools.gouer.vip' || host === 'up.gouer.vip'
  } catch {
    return false
  }
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
 * @param {string} platformOs plugin-os：`macos` | `windows` | ...
 * @param {string} rustArch plugin-os：`aarch64` | `x86_64` | …
 * @param {Record<string, string>} variantUrls API `variant_urls`
 */
function pickVariantKey (platformOs, rustArch, variantUrls) {
  const vu = variantUrls && typeof variantUrls === 'object' ? variantUrls : {}
  const has = (k) => typeof vu[k] === 'string' && vu[k].trim() !== ''

  if (platformOs === 'macos') {
    if (rustArch === 'aarch64' || rustArch === 'arm') {
      return has('arm64') ? 'arm64' : null
    }
    if (rustArch === 'x86_64' || rustArch === 'x86') {
      return has('x64') ? 'x64' : null
    }
  }
  if (platformOs === 'windows') {
    if (rustArch === 'aarch64' || rustArch === 'arm') {
      if (has('arm64')) return 'arm64'
    }
    if (rustArch === 'x86_64') return has('x64') ? 'x64' : null
    if (rustArch === 'x86') return has('x86') ? 'x86' : null
  }
  return null
}

/** package_url 是否已是安装包的完整 HTTPS 路径（避免因 variant_urls 占位符再拼接） */
function packageUrlLooksLikeArtifact (urlStr) {
  try {
    const u = String(urlStr).trim()
    if (!u.startsWith('https://')) return false
    const path = new URL(u).pathname.toLowerCase()
    return /\.(dmg|pkg|zip|exe|msi)(\?|$)/i.test(path)
  } catch {
    return false
  }
}

/**
 * @param {{ package_url?: string, variant_urls?: Record<string, string> }} block platforms.xxx
 * @param {string | null} variantKey `arm64` / `x64` / …
 */
function resolveDownloadUrl (block, variantKey) {
  if (!block) return null
  const pkg = typeof block.package_url === 'string' ? block.package_url.trim() : ''
  // 典型：package_url 已是 https://.../xxx_aarch64.dmg，variant_urls 仍为 { arm64: "arm64" } 占位 — 不可再拼接
  if (pkg && packageUrlLooksLikeArtifact(pkg)) {
    return pkg.startsWith('https://') && isAllowedPublicUrl(pkg) ? pkg : null
  }

  const vu = typeof block.variant_urls === 'object' && block.variant_urls ? block.variant_urls : {}
  const seg =
    variantKey && typeof vu[variantKey] === 'string'
      ? vu[variantKey].trim()
      : ''

  let candidate = ''

  if (seg.startsWith('https://')) {
    candidate = seg
  } else if (seg && pkg) {
    const base = pkg.replace(/\/?$/, '/')
    candidate = base + seg.replace(/^\//, '')
  }

  if (!candidate && pkg) {
    candidate = pkg
  }

  return candidate.startsWith('https://') && isAllowedPublicUrl(candidate) ? candidate : null
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
  if (!block.app_version || typeof block.app_version !== 'string') return null

  const v = block.app_version.trim()
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

export async function runTauriUpdateCheckOnce () {
  if (!isTauri()) return

  try {
    const raw = await invoke('fetch_update_manifest', { url: UPDATE_API_URL })
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const manifest = parseAppUpdatePayload(parsed)
    if (!manifest) return

    const current =
      typeof __APP_VERSION__ === 'undefined' ? '0.0.0' : String(__APP_VERSION__)
    if (compareSemver(manifest.version, current) <= 0) return

    if (
      !manifest.forceUpdate &&
      localStorage.getItem(DISMISS_PREFIX + manifest.version)
    ) {
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
