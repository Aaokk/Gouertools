<template>
  <div class="not-found-page">
    <div class="not-found-inner">
      <p class="not-found-code">404</p>
      <h1>{{ t('notFound.title') }}</h1>
      <p class="not-found-path" v-if="displayPath">{{ displayPath }}</p>
      <p class="not-found-tip">{{ t('notFound.tip') }}</p>
      <div class="not-found-actions">
        <router-link to="/" class="btn btn-primary">{{ t('notFound.backBtn') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()

/** hash 模式下 path 仍为「逻辑路径」；展示的地址栏路径更贴近用户所见 */
const displayPath = computed(() => {
  const p = route.path
  return p && p !== '/' ? p : ''
})
</script>

<style scoped>
.not-found-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
  min-height: 60vh;
}

.not-found-inner {
  max-width: 440px;
  width: 100%;
  text-align: center;
}

.not-found-code {
  font-family: var(--font-heading);
  font-size: clamp(3rem, 8vw, 4.5rem);
  font-weight: 700;
  line-height: 1;
  color: var(--color-accent);
  letter-spacing: 0.06em;
  margin-bottom: var(--spacing-sm);
  opacity: 0.9;
}

.not-found-inner h1 {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: var(--spacing-md);
}

.not-found-path {
  font-size: 13px;
  font-family: ui-monospace, monospace;
  color: var(--color-text-muted);
  word-break: break-all;
  margin-bottom: var(--spacing-md);
  padding: 8px 10px;
  background: var(--color-muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.not-found-tip {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
}

.not-found-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
}
</style>
