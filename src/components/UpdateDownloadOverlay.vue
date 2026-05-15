<template>
  <Teleport to="body">
    <div
      v-if="overlay.visible"
      class="update-dl-backdrop"
      role="status"
      aria-live="polite"
    >
      <div class="update-dl-card">
        <p class="update-dl-title">{{ overlay.phase }}</p>
        <div class="update-dl-bar-wrap" :class="{ 'is-indeterminate': indeterminate }">
          <div
            v-if="!indeterminate"
            class="update-dl-bar"
            :style="{ width: barPct + '%' }"
          />
        </div>
        <p class="update-dl-meta">{{ sizeLabel }}</p>
        <p v-if="overlay.error" class="update-dl-err">{{ overlay.error }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { computed } from 'vue'
import { updateDownloadOverlay as overlay } from '../utils/updateDownloadUiState.js'

function fmtBytes (n) {
  if (n == null || Number.isNaN(n)) return '—'
  const x = Number(n)
  if (x < 1024) return `${x} B`
  const kb = x / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(2)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

export default {
  name: 'UpdateDownloadOverlay',
  setup () {
    const indeterminate = computed(
      () => overlay.total == null || overlay.total === 0
    )
    const barPct = computed(() => {
      const t = overlay.total
      const r = overlay.received
      if (t == null || t <= 0) return 8
      return Math.min(100, Math.round((100 * r) / t))
    })
    const sizeLabel = computed(() => {
      const r = overlay.received
      const t = overlay.total
      if (indeterminate.value) return `已下载 ${fmtBytes(r)}`
      return `${fmtBytes(r)} / ${fmtBytes(t)}`
    })
    return { overlay, indeterminate, barPct, sizeLabel }
  },
}
</script>
