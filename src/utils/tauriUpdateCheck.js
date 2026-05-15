/**
 * 桌面端启动后调用上架接口查询版本；有新版本则弹窗，确认后用系统浏览器打开下载页。
 * （HTTP GET 经 Rust invoke，绕过 CORS；下载链接仍只允许固定域名。）
 */
import { invoke, isTauri } from '@tauri-apps/api/core'
import { ask } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
import { arch, platform as osPlatform } from '@tauri-apps/plugin-os'

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

/**
 * @param {{ package_url?: string, variant_urls?: Record<string, string> }} block platforms.xxx
 * @param {string | null} variantKey `arm64` / `x64` / …
 */
function resolveDownloadUrl (block, variantKey) {
  if (!block) return null
  const vu = typeof block.variant_urls === 'object' && block.variant_urls ? block.variant_urls : {}
  const seg =
    variantKey && typeof vu[variantKey] === 'string'
      ? vu[variantKey].trim()
      : ''

  let candidate = ''

  if (seg.startsWith('https://')) {
    candidate = seg
  } else if (seg && typeof block.package_url === 'string' && block.package_url.trim()) {
    const base = block.package_url.trim().replace(/\/?$/, '/')
    candidate = base + seg.replace(/^\//, '')
  }

  if (!candidate && typeof block.package_url === 'string') {
    candidate = block.package_url.trim()
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
    let body = `发现新版本 ${manifest.version}（当前为 ${current}），是否前往下载页面？`
    if (manifest.updateContent) {
      const note =
        manifest.updateContent.length > 200
          ? manifest.updateContent.slice(0, 200) + '…'
          : manifest.updateContent
      body += `\n\n${note}`
    }

    const go = await ask(body, {
      title,
      okLabel: '前往下载',
      cancelLabel: '稍后',
    })

    if (!go) {
      if (!manifest.forceUpdate) {
        localStorage.setItem(DISMISS_PREFIX + manifest.version, '1')
      }
      return
    }

    await openUrl(manifest.downloadUrl)
  } catch (e) {
    console.warn('[tauri-update-check]', e)
  }
}
