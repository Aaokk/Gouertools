<template>
  <div
    ref="anchorRef"
    class="anchored-bubble-anchor"
    :class="{ 'anchored-bubble-anchor--stretch': stretch }"
  >
    <transition name="anchored-bubble-pop">
      <div
        v-show="visible"
        ref="bubbleRef"
        class="anchored-bubble"
        :class="[`anchored-bubble--${placement}`, { 'anchored-bubble--prelayout': layoutPending }]"
        role="tooltip"
      >
        <slot name="tip">{{ text }}</slot>
      </div>
    </transition>
    <slot />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  text: { type: String, default: '' },
  /** 占满父级 flex 一格（如并排底部按钮） */
  stretch: { type: Boolean, default: false },
})

const EDGE = 10

const anchorRef = ref(null)
const bubbleRef = ref(null)
/** 相对锚点：上方（箭头朝下）或下方（箭头朝上） */
const placement = ref('top')
const layoutPending = ref(false)

let teardownScroll = null
let placementRaf = 0

function rAF() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

function stopScrollListeners() {
  if (teardownScroll) {
    teardownScroll()
    teardownScroll = null
  }
}

async function resolvePlacement() {
  await nextTick()
  await rAF()
  await nextTick()

  let anchor = anchorRef.value
  let bubble = bubbleRef.value
  if ((!bubble || !anchor) && props.visible) {
    await rAF()
    anchor = anchorRef.value
    bubble = bubbleRef.value
  }

  try {
    if (!anchor || !bubble || !props.visible) return

    const tryPlace = (side) => {
      placement.value = side
    }

    tryPlace('top')
    await nextTick()
    await rAF()
    const rectTop = bubble.getBoundingClientRect()

    tryPlace('bottom')
    await nextTick()
    await rAF()
    const rectBottom = bubble.getBoundingClientRect()

    const topOk = rectTop.top >= EDGE
    const bottomOk = rectBottom.bottom <= window.innerHeight - EDGE

    if (topOk && bottomOk) {
      tryPlace('top')
    } else if (topOk && !bottomOk) {
      tryPlace('top')
    } else if (!topOk && bottomOk) {
      tryPlace('bottom')
    } else {
      const ar = anchor.getBoundingClientRect()
      const gapAbove = ar.top - EDGE
      const gapBelow = window.innerHeight - ar.bottom - EDGE
      tryPlace(gapAbove >= gapBelow ? 'top' : 'bottom')
    }
  } finally {
    layoutPending.value = false
  }
}

function scheduleResolvePlacement() {
  cancelAnimationFrame(placementRaf)
  placementRaf = requestAnimationFrame(() => {
    placementRaf = 0
    resolvePlacement()
  })
}

watch(
  () => props.visible,
  (v) => {
    stopScrollListeners()
    if (!v) {
      placement.value = 'top'
      layoutPending.value = false
      return
    }
    layoutPending.value = true
    placement.value = 'top'
    scheduleResolvePlacement()
    const onViewportChange = () => scheduleResolvePlacement()
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    teardownScroll = () => {
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }
)

watch(
  () => props.text,
  () => {
    if (props.visible) {
      layoutPending.value = true
      scheduleResolvePlacement()
    }
  }
)

onUnmounted(() => {
  stopScrollListeners()
  cancelAnimationFrame(placementRaf)
})
</script>

<style scoped>
.anchored-bubble-anchor {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  min-width: 0;
}

.anchored-bubble-anchor--stretch {
  flex: 1;
  width: 100%;
}

.anchored-bubble {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
  width: max-content;
  /* 勿再用锚点宽度百分比（窄按钮会把气泡压成竖条） */
  max-width: min(340px, calc(100vw - 24px));
  padding: 10px 14px;
  border-radius: 10px;
  background: #4a4a4a;
  color: #fff;
  font-size: 13px;
  line-height: 1.45;
  text-align: center;
  z-index: 2000;
  pointer-events: none;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
}

/* 测量两种 placement 时避免肉眼看到跳动 */
.anchored-bubble--prelayout {
  opacity: 0;
}

.anchored-bubble--top {
  bottom: calc(100% + 10px);
  top: auto;
}

.anchored-bubble--bottom {
  top: calc(100% + 10px);
  bottom: auto;
}

/* 箭头朝下（气泡在按钮上方） */
.anchored-bubble--top::after {
  content: '';
  position: absolute;
  top: 100%;
  bottom: auto;
  left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-top-color: #4a4a4a;
}

/* 箭头朝上（气泡在按钮下方） */
.anchored-bubble--bottom::after {
  content: '';
  position: absolute;
  bottom: 100%;
  top: auto;
  left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-bottom-color: #4a4a4a;
}

.anchored-bubble-pop-enter-active,
.anchored-bubble-pop-leave-active {
  transition: opacity 0.18s ease;
}

.anchored-bubble-pop-enter-from,
.anchored-bubble-pop-leave-to {
  opacity: 0;
}
</style>
