import { ref, reactive, watch, onUnmounted } from 'vue'
import { anchoredBubbleExclusiveGen } from '../utils/anchoredBubbleCoordinator.js'

/**
 * 锚定在按钮附近的短时气泡提示（配合 AnchoredBubbleTip）
 * 返回 reactive，便于模板中写成 tip.visible / tip.text（嵌套 ref 会正确解包）。
 */
export function useAnchoredBubbleTip(options = {}) {
  const dismissMs = options.dismissMs ?? 2800
  const visible = ref(false)
  const text = ref(options.initialText ?? '')
  /** 本轮展示对应的代数；与 anchoredBubbleExclusiveGen 不一致则被别的气泡顶替 */
  const lastShownGen = ref(-1)
  let timer = null

  watch(anchoredBubbleExclusiveGen, (g) => {
    if (!visible.value) return
    if (lastShownGen.value !== g) hide()
  })

  function flash(nextText) {
    const g = anchoredBubbleExclusiveGen.value + 1
    lastShownGen.value = g
    anchoredBubbleExclusiveGen.value = g

    if (typeof nextText === 'string') text.value = nextText
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => {
      visible.value = false
      timer = null
    }, dismissMs)
  }

  function hide() {
    visible.value = false
    clearTimeout(timer)
    timer = null
  }

  onUnmounted(() => clearTimeout(timer))

  return reactive({
    visible,
    text,
    flash,
    hide,
  })
}
