<template>
  <button class="lang-btn" @click="toggle" :title="t('common.lang')" :aria-label="t('common.lang')">
    <span class="lang-label">{{ locale === 'zh-CN' ? 'EN' : '中' }}</span>
  </button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n'

const { locale, t } = useI18n()

function toggle () {
  setLocale(locale.value === 'zh-CN' ? 'en' : 'zh-CN')
}
</script>

<style scoped>
.lang-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  width: 40px;
  padding: 0;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  backdrop-filter: blur(12px);
  color: var(--color-text-muted);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.lang-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  box-shadow: var(--shadow-md);
}
.lang-label {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-heading);
  letter-spacing: 0.04em;
  line-height: 1;
}
</style>
