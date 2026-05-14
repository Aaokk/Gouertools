import { ref } from 'vue'

/** @typedef {'success' | 'error' | 'info'} ToastType */

export const toastItems = ref(
  /** @type {{ id: number, message: string, type: ToastType, duration: number }[]} */ ([]),
)

let _seq = 0

export function dismissToast(id) {
  toastItems.value = toastItems.value.filter((t) => t.id !== id)
}

/**
 * @param {string | { message: string, type?: ToastType | 'warning', duration?: number }} opts
 */
export function showToast(opts) {
  const o = typeof opts === 'string' ? { message: opts } : opts
  const raw = (o.type || 'success').toLowerCase()
  const type =
    raw === 'error' ? 'error' :
    raw === 'info' || raw === 'warning' ? 'info' :
    'success'
  const duration =
    typeof o.duration === 'number' ? o.duration :
    type === 'error' ? 5200 : 4000

  const id = ++_seq
  toastItems.value = [...toastItems.value, { id, message: o.message, type, duration }]
  if (duration > 0) setTimeout(() => dismissToast(id), duration)
  return id
}
