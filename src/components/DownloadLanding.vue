<template>
  <div class="dl-standalone-host">
    <main class="center">
      <div class="brand">
        <div class="brand-icon">
          <LogoCanvas :display-size="80" />
        </div>
        <h1>
          Gouer<strong class="brand-accent">工具包包</strong>
        </h1>
        <p>{{ deviceHint }}</p>
      </div>

      <!-- 分割线 + 更新摘要（对齐微信素材） -->
      <section v-if="changelogRows.length" class="dl-changelog" aria-label="近期更新">
        <div class="dl-changelog-hr" />
        <ul class="dl-log-list">
          <li
            v-for="(row, i) in changelogRows"
            :key="i"
            class="dl-log-li"
          >
            <span class="dl-log-text">{{ row.text }}</span>
            <span class="dl-log-date">{{ row.date }}</span>
          </li>
        </ul>
      </section>

      <section class="dl-platform-strip" aria-label="Windows 与 macOS 安装包">
        <div
          v-for="card in cards"
          :key="card.id"
          class="plat-tile"
          :class="{ 'plat-tile--disabled': !!loading }"
          role="button"
          tabindex="0"
          @click="onPick(card)"
          @keydown.enter.prevent="onPick(card)"
          @keydown.space.prevent="onPick(card)"
        >
          <div class="plat-circle">
            <svg v-if="card.kind === 'win'" viewBox="0 0 1028 1024" aria-hidden="true">
              <path fill="currentColor" :d="WINDOWS_LOGO_PATH" />
            </svg>
            <svg v-else viewBox="0 0 1024 1024" aria-hidden="true">
              <path fill="currentColor" :d="MACOS_LOGO_PATH" />
            </svg>
          </div>
          <div class="plat-label">
            <span class="plat-title">{{ card.title }}</span>
          </div>
        </div>
      </section>

      <div
        class="dl-cta-main"
        :class="{ 'dl-cta-main--disabled': !!loading }"
        role="button"
        tabindex="0"
        @click="onRecommended"
        @keydown.enter.prevent="onRecommended"
        @keydown.space.prevent="onRecommended"
      >
        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        {{ loading === 'go' ? '正在获取…' : '立即下载' }}
      </div>

      <p class="dl-back">
        <router-link to="/">返回首页</router-link>
      </p>
    </main>

    <div class="bottom-wave-area" aria-hidden="true" />
    <footer class="dl-site-footer">
      <p class="dl-footer-copy">
        Copyright © 2024–2026
        <a href="https://gouer.vip" target="_blank" rel="noopener noreferrer">Gouer.Vip</a><br>
        All Rights Reserved.
      </p>
    </footer>
  </div>

  <Teleport to="body">
    <div ref="toastBoxRef" class="toast-box dl-download-toasts" aria-live="polite" />
  </Teleport>
</template>

<script>
import '../styles/downloadStandalone.css'
import LogoCanvas from './LogoCanvas.vue'
import { MACOS_LOGO_PATH, WINDOWS_LOGO_PATH } from '../constants/dlPlatformSvgPaths.js'
import {
  fetchUpdateManifestJson,
  getDeviceProfile,
  resolveArtifactForPlatform,
} from '../utils/updateManifestShared.js'

const CARDS = [
  {
    id: 'win',
    kind: 'win',
    platformOs: 'windows',
    title: 'Windows',
    loadingKey: 'win',
  },
  {
    id: 'mac',
    kind: 'mac',
    platformOs: 'macos',
    title: 'macOS',
    loadingKey: 'mac',
  },
]

export default {
  name: 'DownloadLanding',
  components: { LogoCanvas },
  data () {
    return {
      WINDOWS_LOGO_PATH,
      MACOS_LOGO_PATH,
      cards: CARDS,
      loading: '',
      changelogRows: [],
      _bodyOverflow: null,
      _htmlOverflow: null,
      deviceHint: '选择一个系统开始下载电脑版客户端。',
    }
  },
  mounted () {
    this._bodyOverflow = document.body.style.overflow
    this._htmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    void this.initDeviceHint()
  },
  beforeUnmount () {
    document.body.style.overflow = this._bodyOverflow ?? ''
    document.documentElement.style.overflow = this._htmlOverflow ?? ''
  },
  methods: {
    async initDeviceHint () {
      try {
        await getDeviceProfile()
        this.deviceHint = '请选择 Windows / macOS 下载；或通过「立即下载」按当前设备匹配。'
      } catch (_) { /* noop */ }
    },
    todayMmDd () {
      const d = new Date()
      return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    async prefetchMeta () {
      try {
        const parsed = await fetchUpdateManifestJson()
        if (Number(parsed?.code) !== 200 || !parsed?.data?.platforms) return
        const p = parsed.data.platforms
        const w = this.verFromBlock(p.windows)
        const m = this.verFromBlock(p.macos)
        const day = this.todayMmDd()
        const rows = []
        if (w) {
          rows.push({
            text: `Gouer工具包包 ${w} · Windows`,
            date: day,
          })
        }
        if (m) {
          rows.push({
            text: `Gouer工具包包 ${m} · macOS`,
            date: day,
          })
        }
        this.changelogRows = rows
      } catch (_) { /* noop */ }
    },
    verFromBlock (block) {
      if (!block || typeof block !== 'object') return ''
      const v =
        block.app_version !== undefined && block.app_version !== null
          ? String(block.app_version).trim()
          : ''
      return v ? `v${v.replace(/^v+/i, '')}` : ''
    },
    toast (msg) {
      const box = this.$refs.toastBoxRef
      if (!box) return
      const el = document.createElement('div')
      el.className = 'toast'
      el.innerHTML =
        `<span class="toast-ico"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></span>`
        + `<span>${escapeHtml(msg)}</span>`
      box.appendChild(el)
      window.setTimeout(() => {
        el.classList.add('out')
        el.addEventListener('animationend', () => el.remove())
      }, 2200)
    },
    async fetchParsed () {
      const parsed = await fetchUpdateManifestJson()
      if (
        Number(parsed?.code) !== 200
        || !parsed?.data?.platforms
        || typeof parsed.data.platforms !== 'object'
      ) {
        throw new Error(
          parsed?.message ? String(parsed.message) : 'INVALID_MANIFEST',
        )
      }
      return parsed.data.platforms
    },
    async openHref (href) {
      try {
        const { isTauri } = await import('@tauri-apps/api/core')
        if (isTauri()) {
          const { openUrl } = await import('@tauri-apps/plugin-opener')
          await openUrl(href)
          return
        }
      } catch (_) { /* noop */ }
      const w = window.open(href, '_blank', 'noopener,noreferrer')
      if (w) w.focus()
      else window.location.href = href
    },
    async resolveAndOpen (platformOs, rustArch, loadingKey) {
      this.loading = loadingKey ?? 'go'
      try {
        if (platformOs !== 'windows' && platformOs !== 'macos') return
        const platforms = await this.fetchParsed()
        const r = resolveArtifactForPlatform(platforms, platformOs, rustArch)
        if (!r?.downloadUrl) {
          this.toast(
            `${
              platformOs === 'macos' ? 'macOS' : 'Windows'
            } 暂无可用安装包或链接未在白名单域名内。`,
          )
          return
        }
        await this.openHref(r.downloadUrl)
        this.toast('正在前往下载 …')
      } catch (e) {
        const msg =
          e?.message?.includes?.('INVALID')
            ? '上架接口暂未返回可用的平台描述。'
            : '无法获取下载信息，请稍后重试或在 Gouer 客户端内打开本页。'
        this.toast(msg)
      } finally {
        this.loading = ''
      }
    },
    async onPick (card) {
      if (this.loading) return
      let rustArch =
        card.platformOs === 'windows' ? 'x86_64' : 'aarch64'
      try {
        const p = await getDeviceProfile()
        if (p.platformOs === card.platformOs) {
          rustArch = p.rustArch
        }
      } catch (_) { /* 默认架构 */ }
      await this.resolveAndOpen(
        card.platformOs,
        rustArch,
        card.loadingKey,
      )
    },
    async onRecommended () {
      if (this.loading) return
      const { platformOs, rustArch } = await getDeviceProfile()
      if (platformOs === 'linux') {
        this.toast('当前为 Linux：请点上方的 Windows / macOS 图标选择下载。')
        return
      }
      if (platformOs === 'ios') {
        this.toast('当前为移动端：请在电脑上打开本页下载桌面端。')
        return
      }
      await this.resolveAndOpen(
        platformOs === 'windows' ? 'windows' : 'macos',
        rustArch,
        'go',
      )
    },
  },
}

function escapeHtml (s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
</script>
