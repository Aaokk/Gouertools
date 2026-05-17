/**
 * 上架接口 platforms / variant_urls 解析（与桌面端更新检查同源逻辑）。
 */

import { invoke, isTauri } from '@tauri-apps/api/core'

export const UPDATE_API_URL =
  'https://tapi.ge0.cc/app/appup/getAppUpdate?appname=tools'

/** HTTPS 域名白名单（安装包落地页） */
export function isAllowedPublicUrl (url) {
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
 * 与上架接口 variant_urls / variant_url_keys 对齐。
 * @param {'macos'|'windows'} platformOs
 * @param {string} rustArch `aarch64` | `x86_64` | `x86` | `arm`
 * @param {Record<string, string>} variantUrls API `variant_urls`
 */
export function pickVariantKey (platformOs, rustArch, variantUrls) {
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
    if (rustArch === 'x86_64') {
      if (has('win_x64')) return 'win_x64'
      if (has('x64')) return 'x64'
      return null
    }
    if (rustArch === 'x86') return has('x86') ? 'x86' : null
  }
  return null
}

export function packageUrlLooksLikeArtifact (urlStr) {
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
 * @param {{ package_url?: string, variant_urls?: Record<string, string> }} block
 * @param {string | null} variantKey
 */
export function resolveDownloadUrl (block, variantKey) {
  if (!block) return null
  const pkg = typeof block.package_url === 'string' ? block.package_url.trim() : ''
  if (pkg && packageUrlLooksLikeArtifact(pkg)) {
    return pkg.startsWith('https://') && isAllowedPublicUrl(pkg) ? pkg : null
  }

  const vu =
    typeof block.variant_urls === 'object' && block.variant_urls ? block.variant_urls : {}
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
 * @param {object|null} platforms `data.platforms`
 * @param {'macos'|'windows'} platformOs
 * @param {string} rustArch
 */
export function resolveArtifactForPlatform (platforms, platformOs, rustArch) {
  const block =
    platformOs === 'macos'
      ? platforms?.macos
      : platformOs === 'windows'
        ? platforms?.windows
        : null

  if (!block || typeof block !== 'object') return null

  const vk = pickVariantKey(platformOs, rustArch, block.variant_urls)
  const downloadUrl =
    resolveDownloadUrl(block, vk) || resolveDownloadUrl(block, null)

  const version =
    block.app_version !== undefined && block.app_version !== null
      ? String(block.app_version).trim()
      : ''

  return downloadUrl ? { downloadUrl, version, variantKey: vk } : null
}

/** 浏览器环境下的平台 + 架构推断（启发式）。 */
export function detectWebArchPlatform () {
  const ua =
    typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
  const uaL = ua.toLowerCase()
  const platformStr =
    typeof navigator !== 'undefined' && navigator.platform
      ? String(navigator.platform)
      : ''

  let platformOs = 'windows'
  if (/iphone|ipad|ipod/i.test(ua)) platformOs = 'ios'
  else if (/macintosh|mac os x/i.test(ua)) platformOs = 'macos'
  else if (/linux/i.test(ua) && !/android/i.test(ua)) platformOs = 'linux'

  const uaArm = /\baarch64\b|;\s*ARM64\b|;\s*aarch64\b/i.test(ua)

  let rustArch = 'x86_64'
  if (platformOs === 'macos') {
    rustArch = uaArm ? 'aarch64' : 'x86_64'
  } else if (platformOs === 'windows') {
    if (/\barm(?![a-z0-9])\b|\baarch64\b|arm64/i.test(ua + platformStr)) {
      rustArch = 'aarch64'
    } else if (
      /win32/i.test(uaL)
      && !/\bwow64\b|\bwin64\b/i.test(ua)
      && !/Win64/i.test(platformStr)
    ) {
      rustArch = 'x86'
    } else rustArch = 'x86_64'
  } else if (platformOs === 'linux') {
    rustArch = uaArm
      ? 'aarch64'
      : /\b(i686|i386)\b/i.test(ua)
        ? 'x86'
        : 'x86_64'
  }

  return { platformOs, rustArch }
}

export async function getDeviceProfile () {
  try {
    if (!isTauri()) throw new Error('browser')
    const os = await import('@tauri-apps/plugin-os')
    return { platformOs: os.platform(), rustArch: os.arch() }
  } catch {
    return detectWebArchPlatform()
  }
}

/** Tauri 经 Rust invoke；浏览器直接 fetch（可能受 CORS 限制）。 */
export async function fetchUpdateManifestJson () {
  if (isTauri()) {
    const raw = await invoke('fetch_update_manifest', { url: UPDATE_API_URL })
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  }
  const res = await fetch(UPDATE_API_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
