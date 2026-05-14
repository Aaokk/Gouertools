<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast-tg" tag="div" class="toast-tg-stack">
        <div
          v-for="t in toastItems"
          :key="t.id"
          role="status"
          :class="['toast', t.type]"
          @click="dismissToast(t.id)"
        >
          <svg v-if="t.type === 'success'" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" />
          </svg>
          <svg v-else-if="t.type === 'error'" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M5 7h14l-7 13-7-13z" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13 16h-1v-4h-1m2-4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" stroke-width="2" />
          </svg>
          <span>{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { toastItems, dismissToast } from '../utils/toast.js'
</script>

<style scoped>
.toast-container {
  z-index: 10050;
}

.toast-tg-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.toast-tg-enter-active {
  animation: appToastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-tg-leave-active {
  animation: appToastOut 0.25s ease-in forwards;
}

@keyframes appToastIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes appToastOut {
  to {
    opacity: 0;
    transform: translateX(30px);
  }
}
</style>
