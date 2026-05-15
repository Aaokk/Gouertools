import { reactive } from 'vue'

/** 桌面端「更新包下载」遮罩状态（由 tauriUpdateDownload 驱动） */
export const updateDownloadOverlay = reactive({
  visible: false,
  received: 0,
  total: null,
  phase: '',
  error: '',
})
