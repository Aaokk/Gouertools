<template>
  <div class="theme-corner" ref="wrapRef">
    <!-- 语言切换 -->
    <LanguageSwitcher />
    <!-- 仅在浏览器站点显示；桌面端（Tauri）已有更新与安装链路，不占角标位置 -->
    <router-link
      v-if="showBrowserDownload"
      to="/download"
      class="theme-btn dl-corner"
      :title="t('common.download')"
      :aria-label="t('common.download')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </router-link>
    <div class="theme-switcher">
      <!-- 触发按钮 -->
      <button class="theme-btn" @click="open = !open" :title="currentTheme.label" :aria-label="t('theme.title')">
      <span class="theme-dot-preview" :style="{ background: currentTheme.preview }"></span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    </button>

    <!-- 主题面板 -->
    <Transition name="panel">
      <div v-if="open" class="theme-panel">
        <p class="panel-title">{{ t('theme.title') }}</p>
        <div class="theme-list">
          <button
            v-for="t in themes"
            :key="t.id"
            :class="['theme-item', { active: currentId === t.id }]"
            @click="applyTheme(t.id)"
          >
            <span class="swatch" :style="{ background: t.swatch }"></span>
            <span class="theme-label">{{ t.label }}</span>
            <svg v-if="currentId === t.id" class="check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './LanguageSwitcher.vue'
import { isTauri } from '@tauri-apps/api/core'

const { t, locale } = useI18n()

const STORAGE_KEY = 'gouer-theme'

const showBrowserDownload = computed(() => !isTauri())

const themeDefs = [
  { id: 'warm', key: 'warm', preview: '#4A9B8E',
    swatch: 'linear-gradient(135deg, #F7F5F2 50%, #4A9B8E 50%)' },
  { id: 'dark', key: 'dark', preview: '#2db896',
    swatch: 'linear-gradient(135deg, #080c15 50%, #2db896 50%)' },
  { id: 'blue', key: 'blue', preview: '#60a5fa',
    swatch: 'linear-gradient(135deg, #0f172a 50%, #60a5fa 50%)' },
  { id: 'rose', key: 'rose', preview: '#E098AE',
    swatch: 'linear-gradient(135deg, #FCE9DA 0%, #FFCEC7 33%, #FFD0A6 66%, #E098AE 100%)' },
  { id: 'ink', key: 'ink', preview: '#111827',
    swatch: 'linear-gradient(135deg, #ffffff 50%, #111827 50%)' },
]

const themes = computed(() =>
  themeDefs.map(d => ({ ...d, label: t(`theme.${d.key}`) }))
)

const currentId = ref('warm')
const open = ref(false)
const wrapRef = ref(null)

const currentTheme = computed(() => themes.value.find(t => t.id === currentId.value) || themes.value[0])

function applyTheme(id) {
  currentId.value = id
  document.documentElement.setAttribute('data-theme', id === 'warm' ? '' : id)
  localStorage.setItem(STORAGE_KEY, id)
  open.value = false
}

function onClickOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY) || 'warm'
  applyTheme(saved)
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.theme-corner {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
}

/* ≥901px：悬浮角标（主栏内挂载，仍为视口 fixed） */
@media (min-width: 901px) {
  .theme-corner {
    position: fixed;
    top: max(16px, env(safe-area-inset-top));
    right: max(20px, env(safe-area-inset-right));
    z-index: 9000;
  }
}

/* ≤900px：随 .main-chrome-actions 排版，与各页共用同一顶栏占位 */
@media (max-width: 900px) {
  .theme-corner {
    position: static;
    z-index: auto;
  }
}
.theme-switcher {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.dl-corner {
  text-decoration: none;
  flex-shrink: 0;
  justify-content: center;
}

/* 触发按钮 */
.theme-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  backdrop-filter: blur(12px);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-body);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}
.theme-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  box-shadow: var(--shadow-md);
}
.theme-dot-preview {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  flex-shrink: 0;
}

/* 面板 */
.theme-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: var(--color-surface-solid);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  width: 160px;
}
.panel-title {
  padding: 10px 12px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--font-body);
}
.theme-list {
  padding: 0 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.theme-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-muted);
  cursor: pointer;
  font-size: 13px;
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-foreground);
  width: 100%;
  text-align: left;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.theme-item:hover {
  background: var(--color-accent-dim);
}
.theme-item.active {
  color: var(--color-accent);
  background: var(--color-accent-dim);
}
.swatch {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}
.theme-label {
  flex: 1;
}
.check {
  color: var(--color-accent);
  flex-shrink: 0;
}

/* 进出动画 */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
