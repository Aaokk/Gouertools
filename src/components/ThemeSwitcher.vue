<template>
  <div class="theme-switcher" ref="wrapRef">
    <!-- 触发按钮 -->
    <button class="theme-btn" @click="open = !open" :title="current.label" aria-label="切换主题">
      <span class="theme-dot-preview" :style="{ background: current.preview }"></span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    </button>

    <!-- 主题面板 -->
    <Transition name="panel">
      <div v-if="open" class="theme-panel">
        <p class="panel-title">切换主题</p>
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const STORAGE_KEY = 'gouer-theme'

const themes = [
  { id: 'warm', label: '护眼绿', preview: '#4A9B8E',
    swatch: 'linear-gradient(135deg, #F7F5F2 50%, #4A9B8E 50%)' },
  { id: 'dark', label: '暗黑科技', preview: '#2db896',
    swatch: 'linear-gradient(135deg, #080c15 50%, #2db896 50%)' },
  { id: 'blue', label: '午夜蓝', preview: '#60a5fa',
    swatch: 'linear-gradient(135deg, #0f172a 50%, #60a5fa 50%)' },
  { id: 'rose', label: '桃杏奶油', preview: '#E098AE',
    swatch: 'linear-gradient(135deg, #FCE9DA 0%, #FFCEC7 33%, #FFD0A6 66%, #E098AE 100%)' },
  { id: 'ink',  label: '极简墨', preview: '#111827',
    swatch: 'linear-gradient(135deg, #ffffff 50%, #111827 50%)' },
]

const currentId = ref('warm')
const open = ref(false)
const wrapRef = ref(null)

const current = computed(() => themes.find(t => t.id === currentId.value) || themes[0])

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
.theme-switcher {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
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
