<template>
  <div v-if="guide.active" class="onboarding-guide-root">
    <div v-if="!targetRect || !isOnTargetRoute" class="guide-backdrop" />

    <div
      v-if="isOnTargetRoute && targetRect"
      class="guide-spotlight"
      :style="spotlightStyle"
    />

    <div
      class="guide-panel"
      :style="panelStyle"
    >
      <div class="guide-panel-head">
        <div>
          <div class="guide-badge">新手向导 · Step {{ guide.currentStep + 1 }}/{{ guide.steps.length }}</div>
          <div class="guide-title">{{ step.title }}</div>
          <p class="guide-desc">{{ step.desc }}</p>
          <div class="guide-sub-badge">操作 {{ guide.currentAction + 1 }}/{{ guide.currentActionCount }}</div>
        </div>
        <button class="guide-close-btn" @click="guide.pauseGuide" title="稍后继续">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="guide-progress-line">
        <div class="guide-progress-bar" :style="{ width: `${guide.progressPercent}%` }" />
      </div>

      <div v-if="!targetRect" class="guide-status guide-status-warn">
        已进入目标页面，正在定位操作位置；如果没高亮出来，可点击"重新定位"。
      </div>
      <div v-else class="guide-status guide-status-success">
        页面中的高亮区域就是你当前需要操作的位置。
      </div>

      <div class="guide-section">
        <div class="guide-section-title">建议按这个顺序操作</div>
        <div class="guide-action-list">
          <div
            v-for="(action, index) in actions"
            :key="`${step.id}-${index}-${action.text}`"
            class="guide-action-item"
            :class="{ active: index === guide.currentAction, done: index < guide.currentAction }"
          >
            <span class="guide-action-no">{{ index + 1 }}</span>
            <span>{{ action.text }}</span>
          </div>
        </div>
      </div>

      <div class="guide-result-box">
        <div class="guide-section-title">完成标准</div>
        <div class="guide-result-text">{{ step.result }}</div>
        <div v-if="step.tip" class="guide-tip-text">提示：{{ step.tip }}</div>
      </div>

      <div class="guide-panel-actions">
        <el-button text @click="guide.pauseGuide">稍后继续</el-button>
        <el-button @click="guide.goPrevActionOrStep">上一步</el-button>
        <el-button v-if="!targetRect" @click="refreshPosition">重新定位</el-button>
        <el-button @click="guide.skipCurrentAndNext()">
          {{ isLastStep ? '跳过并结束' : '跳过此步' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuideStore } from '@/stores/guide'

const guide = useGuideStore()
const route = useRoute()
const router = useRouter()

const targetRect = ref<DOMRect | null>(null)
const step = computed(() => guide.currentStepData)
const actions = computed(() => guide.currentActions)
const currentAction = computed(() => guide.currentActionData)
const isLastStep = computed(() => guide.currentStep >= guide.steps.length - 1)
const isLastAction = computed(() => guide.currentAction >= guide.currentActionCount - 1)
const isOnTargetRoute = computed(() => route.path === currentAction.value.path)

let retryTimer: number | null = null
let autoAdvanceTimer: number | null = null
let boundTargetElement: HTMLElement | null = null
let boundStepIndex = -1
let boundActionIndex = -1

function clearRetryTimer() {
  if (retryTimer !== null) {
    window.clearTimeout(retryTimer)
    retryTimer = null
  }
}

function clearAutoAdvanceTimer() {
  if (autoAdvanceTimer !== null) {
    window.clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = null
  }
}

function handleTargetAction() {
  const stepIndex = guide.currentStep
  const actionIndex = guide.currentAction
  clearAutoAdvanceTimer()
  autoAdvanceTimer = window.setTimeout(() => {
    if (!guide.active || guide.currentStep !== stepIndex || guide.currentAction !== actionIndex) return
    guide.completeCurrentAndNext()
  }, 260)
}

function handleTargetKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  handleTargetAction()
}

function unbindTargetElement() {
  if (!boundTargetElement) return
  boundTargetElement.removeEventListener('click', handleTargetAction, true)
  boundTargetElement.removeEventListener('keydown', handleTargetKeydown, true)
  boundTargetElement = null
  boundStepIndex = -1
  boundActionIndex = -1
}

function bindTargetElement(element: HTMLElement | null) {
  if (!currentAction.value.autoAdvance) {
    unbindTargetElement()
    return
  }
  if (!element) {
    unbindTargetElement()
    return
  }
  if (boundTargetElement === element && boundStepIndex === guide.currentStep && boundActionIndex === guide.currentAction) return
  unbindTargetElement()
  boundTargetElement = element
  boundStepIndex = guide.currentStep
  boundActionIndex = guide.currentAction
  element.addEventListener('click', handleTargetAction, true)
  element.addEventListener('keydown', handleTargetKeydown, true)
}

function getTargetElement() {
  if (!guide.active || !isOnTargetRoute.value) return null
  return document.querySelector(currentAction.value.selector) as HTMLElement | null
}

function updatePosition(scrollIntoView = false) {
  const element = getTargetElement()
  if (!element) {
    targetRect.value = null
    unbindTargetElement()
    return false
  }

  if (scrollIntoView) {
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
  }

  const rect = element.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) {
    targetRect.value = null
    unbindTargetElement()
    return false
  }

  targetRect.value = rect
  bindTargetElement(element)
  return true
}

function locateTarget(scrollIntoView = true) {
  clearRetryTimer()
  let attempts = 0

  const tryLocate = () => {
    attempts += 1
    const ok = updatePosition(attempts === 1 && scrollIntoView)
    if (ok || attempts >= 20 || !guide.active) return
    retryTimer = window.setTimeout(tryLocate, 300)
  }

  nextTick(() => {
    retryTimer = window.setTimeout(tryLocate, 300)
  })
}

function refreshPosition() {
  locateTarget(true)
}

function handleViewportChange() {
  if (!guide.active) return
  updatePosition(false)
}

const spotlightStyle = computed(() => {
  if (!targetRect.value) return {}
  const padding = 10
  return {
    top: `${Math.max(8, targetRect.value.top - padding)}px`,
    left: `${Math.max(8, targetRect.value.left - padding)}px`,
    width: `${targetRect.value.width + padding * 2}px`,
    height: `${targetRect.value.height + padding * 2}px`,
  }
})

const panelStyle = computed(() => {
  // 有目标元素时，定位在元素旁边
  if (targetRect.value && isOnTargetRoute.value) {
    const panelWidth = 360
    const gap = 22
    const rect = targetRect.value
    const placement = currentAction.value.placement || 'right'

    let top = rect.top
    let left = rect.right + gap

    if (placement === 'left') {
      left = rect.left - panelWidth - gap
    } else if (placement === 'bottom') {
      left = rect.left
      top = rect.bottom + gap
    } else if (placement === 'top') {
      left = rect.left
      top = rect.top - 420
    }

    const minLeft = 16
    const maxLeft = window.innerWidth - panelWidth - 16
    const minTop = 16
    const maxTop = window.innerHeight - 460

    return {
      left: `${Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft))}px`,
      top: `${Math.min(Math.max(top, minTop), Math.max(minTop, maxTop))}px`,
    }
  }
  // 找不到目标元素时，固定在右下角，不遮挡页面主体
  return {
    right: '24px',
    bottom: '90px',
    left: 'auto',
    top: 'auto',
  }
})

watch(
  () => [guide.active, guide.currentStep, guide.currentAction, route.path],
  () => {
    if (!guide.active) {
      clearRetryTimer()
      clearAutoAdvanceTimer()
      unbindTargetElement()
      targetRect.value = null
      return
    }
    // 自动跳转到当前步骤对应页面
    const targetPath = currentAction.value.path
    if (targetPath && route.path !== targetPath) {
      router.push(targetPath)
      return
    }
    locateTarget(true)
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('resize', handleViewportChange)
  document.addEventListener('scroll', handleViewportChange, true)
})

onBeforeUnmount(() => {
  clearRetryTimer()
  clearAutoAdvanceTimer()
  unbindTargetElement()
  window.removeEventListener('resize', handleViewportChange)
  document.removeEventListener('scroll', handleViewportChange, true)
})
</script>

<style scoped>
.onboarding-guide-root {
  position: fixed;
  inset: 0;
  z-index: 4000;
  pointer-events: none;
}

.guide-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(2px);
  pointer-events: auto;
}

.guide-spotlight {
  position: fixed;
  border-radius: 18px;
  border: 2px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 0 0 9999px rgba(15, 23, 42, 0.52),
    0 0 0 10px rgba(59, 130, 246, 0.16),
    0 16px 40px rgba(15, 23, 42, 0.25);
  pointer-events: none;
  transition: all 0.18s ease;
}

.guide-panel {
  position: fixed;
  width: min(360px, calc(100vw - 24px));
  background: #fff;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
  padding: 18px;
  pointer-events: auto;
}

.guide-panel.centered {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.guide-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.guide-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 10px;
}

.guide-title {
  font-size: 18px;
  line-height: 1.3;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.guide-desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.65;
  color: #475569;
}

.guide-sub-badge {
  margin-top: 8px;
  font-size: 12px;
  color: #2563eb;
  font-weight: 700;
}

.guide-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.guide-progress-line {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin: 14px 0;
}

.guide-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #22c55e);
  transition: width 0.25s ease;
}

.guide-status {
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  margin-bottom: 14px;
}

.guide-status-info {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.guide-status-warn {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fdba74;
}

.guide-status-success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #86efac;
}

.guide-section {
  margin-bottom: 14px;
}

.guide-section-title {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.guide-action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guide-action-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #f8fafc;
  color: #334155;
  font-size: 13px;
  line-height: 1.6;
}

.guide-action-item.active {
  background: #eff6ff;
  border: 1px solid #93c5fd;
}

.guide-action-item.done {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.guide-action-no {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.guide-result-box {
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.04), rgba(34, 197, 94, 0.04));
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.guide-result-text,
.guide-tip-text {
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
}

.guide-tip-text {
  margin-top: 8px;
  color: #475569;
}

.guide-panel-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .guide-panel {
    width: calc(100vw - 20px);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }
}
</style>
