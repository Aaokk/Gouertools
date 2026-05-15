import { ref } from 'vue'

/**
 * 全局互斥：任一气泡 flash 前递增；其它气泡实例 watch 到此值后立即收起。
 */
export const anchoredBubbleExclusiveGen = ref(0)
