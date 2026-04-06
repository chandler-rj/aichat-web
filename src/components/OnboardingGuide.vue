<script setup>
import { ref, watch, nextTick } from 'vue'
import { ElButton } from 'element-plus'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible'])

// 当前步骤索引
const currentStep = ref(0)

// 向导步骤数据 - 3个步骤（会话列表、添加用户、模型配置）
// 气泡位置通过目标元素的 data-position 属性指定，支持 'top', 'bottom', 'left', 'right'
const steps = [
  { target: '[data-step="add-user"]', title: '会话列表', content: '创建新对话从这里开始' },
  { target: '[data-step="add-user-btn"]', title: '添加用户', content: '添加 AI 角色，它们会在群聊中回复' },
  { target: '[data-step="model-config"]', title: '模型配置', content: '配置您的 API Key，每个模型都需要设置' }
]

// 高亮框位置
const highlightStyle = ref({
  top: '0px',
  left: '0px',
  width: '0px',
  height: '0px'
})

// 气泡位置
const bubbleStyle = ref({
  top: '0px',
  left: '0px'
})

// 气泡箭头方向
const arrowPosition = ref('bottom')

// Overlay 样式（用于 mask 定位）
const overlayStyle = ref({
  '--highlight-x': '50%',
  '--highlight-y': '50%'
})

// 更新高亮位置 - 气泡紧贴目标元素且不超出可见范围
const updateHighlightPosition = () => {
  const step = steps[currentStep.value]

  nextTick(() => {
    const element = document.querySelector(step.target)
    if (!element) {
      return
    }

    const rect = element.getBoundingClientRect()
    const padding = 6
    const gap = 8
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const safeMargin = 12

    // 高亮框紧贴元素
    highlightStyle.value = {
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`
    }

    // 设置 mask 圆心位置（高亮框中心）- 在 overlay 上设置
    overlayStyle.value = {
      '--highlight-x': `${rect.left + rect.width / 2}px`,
      '--highlight-y': `${rect.top + rect.height / 2}px`
    }

    const bubbleWidth = 180
    const bubbleHeight = 90

    // 获取用户指定的位置偏好
    const dataPosition = element.getAttribute('data-position')

    // 始终尝试放在上方（用户要求）
    const spaceAbove = rect.top - padding
    const elemCenterX = rect.left + rect.width / 2

    let bubbleTop, bubbleLeft, arrowPos

    if (spaceAbove >= bubbleHeight + gap + safeMargin) {
      // 上方空间足够：气泡在上，箭头在下
      bubbleTop = rect.top - bubbleHeight - gap
      arrowPos = 'bottom'
      bubbleLeft = Math.max(safeMargin, Math.min(elemCenterX - bubbleWidth / 2, viewportWidth - bubbleWidth - safeMargin))
    } else {
      // 上方空间不足：气泡在下，箭头在上
      bubbleTop = rect.bottom + gap
      arrowPos = 'top'
      bubbleLeft = Math.max(safeMargin, Math.min(elemCenterX - bubbleWidth / 2, viewportWidth - bubbleWidth - safeMargin))
    }

    // 约束边界
    bubbleTop = Math.max(safeMargin, Math.min(bubbleTop, viewportHeight - bubbleHeight - safeMargin))
    bubbleLeft = Math.max(safeMargin, Math.min(bubbleLeft, viewportWidth - bubbleWidth - safeMargin))

    arrowPosition.value = arrowPos
    bubbleStyle.value = {
      top: `${bubbleTop}px`,
      left: `${bubbleLeft}px`
    }
  })
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    updateHighlightPosition()
  }
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
    updateHighlightPosition()
  }
}

const skipAll = () => {
  emit('update:visible', false)
}

const finish = () => {
  localStorage.setItem('onboarding_completed', 'true')
  emit('update:visible', false)
}

watch(currentStep, () => {
  updateHighlightPosition()
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    currentStep.value = 0
    nextTick(() => {
      updateHighlightPosition()
    })
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="onboarding-overlay" :style="overlayStyle">
      <div class="onboarding-mask"></div>
      <div class="onboarding-highlight" :style="highlightStyle"></div>
      <div
        class="onboarding-bubble"
        :class="`arrow-${arrowPosition}`"
        :style="bubbleStyle"
      >
        <div class="onboarding-bubble-title">{{ steps[currentStep].title }}</div>
        <div class="onboarding-bubble-content">{{ steps[currentStep].content }}</div>
        <div class="onboarding-bubble-actions">
          <ElButton size="small" text @click="skipAll">跳过</ElButton>
          <div class="onboarding-bubble-nav">
            <ElButton v-if="currentStep > 0" size="small" text @click="prevStep">上一步</ElButton>
            <ElButton v-if="currentStep < steps.length - 1" type="primary" size="small" @click="nextStep">下一步</ElButton>
            <ElButton v-else type="primary" size="small" @click="finish">完成</ElButton>
          </div>
        </div>
        <div class="onboarding-steps-indicator">
          <span
            v-for="(step, index) in steps"
            :key="index"
            class="onboarding-step-dot"
            :class="{ active: index === currentStep }"
          ></span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.onboarding-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  pointer-events: none;
  /* CSS variables for mask positioning */
  --highlight-x: 50%;
  --highlight-y: 50%;
}

.onboarding-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  pointer-events: auto;
  /* 高亮区域不加遮罩 - 使用 mask 挖洞 */
  mask: radial-gradient(circle 80px at var(--highlight-x) var(--highlight-y), transparent 78px, black 80px);
  -webkit-mask: radial-gradient(circle 80px at var(--highlight-x) var(--highlight-y), transparent 78px, black 80px);
}

.onboarding-highlight {
  position: absolute;
  border: 2px solid white;
  border-radius: 8px;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.4), 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: opacity 0.2s ease, box-shadow 0.2s ease;
  pointer-events: none;
  z-index: 10000;
  /* 确保高亮区域背景透明，不遮挡下面内容 */
  background: transparent;
}

.onboarding-bubble {
  position: absolute;
  width: 180px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 10001;
  pointer-events: auto;
  backdrop-filter: blur(8px);
}

.onboarding-bubble.arrow-bottom::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-bottom-color: rgba(255, 255, 255, 0.95);
  border-top: none;
}

.onboarding-bubble.arrow-top::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.95);
  border-bottom: none;
}

.onboarding-bubble.arrow-left::before {
  content: '';
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-left-color: rgba(255, 255, 255, 0.95);
  border-right: none;
}

.onboarding-bubble.arrow-right::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-right-color: rgba(255, 255, 255, 0.95);
  border-left: none;
}

.onboarding-bubble-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-title, #2D2A26);
  margin-bottom: 4px;
}

.onboarding-bubble-content {
  font-size: 12px;
  color: var(--text-secondary, #666);
  line-height: 1.4;
  margin-bottom: 8px;
}

.onboarding-bubble-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.onboarding-bubble-nav {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* 确保 Element Plus 按钮不会超出气泡 */
.onboarding-bubble :deep(.el-button) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px 8px;
  font-size: 11px;
}

.onboarding-steps-indicator {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-light, #eee);
}

.onboarding-step-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border-light, #ddd);
  transition: opacity 0.2s ease, box-shadow 0.2s ease;
}

.onboarding-step-dot.active {
  background: var(--primary, #FF6B6B);
  transform: scale(1.2);
}

html[data-theme="dark"] .onboarding-bubble {
  background: rgba(45, 42, 38, 0.95);
}

html[data-theme="dark"] .onboarding-bubble-title {
  color: var(--text-title, #fff);
}

html[data-theme="dark"] .onboarding-bubble-content {
  color: var(--text-secondary, #aaa);
}

html[data-theme="dark"] .onboarding-bubble.arrow-bottom::before {
  border-bottom-color: rgba(45, 42, 38, 0.95);
}

html[data-theme="dark"] .onboarding-bubble.arrow-top::before {
  border-top-color: rgba(45, 42, 38, 0.95);
}

html[data-theme="dark"] .onboarding-bubble.arrow-left::before {
  border-left-color: rgba(45, 42, 38, 0.95);
}

html[data-theme="dark"] .onboarding-bubble.arrow-right::before {
  border-right-color: rgba(45, 42, 38, 0.95);
}

html[data-theme="dark"] .onboarding-steps-indicator {
  border-top-color: var(--border-light, #444);
}

html[data-theme="dark"] .onboarding-step-dot {
  background: var(--border-light, #555);
}
</style>
