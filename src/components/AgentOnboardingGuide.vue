<template>
  <div v-if="guide.active" class="onboarding-guide-root">
    <div v-if="!isOnTargetRoute" class="guide-backdrop" />

    <div
      v-if="isOnTargetRoute && targetRect"
      class="guide-spotlight"
      :style="spotlightStyle"
    />

    <div
      ref="panelRef"
      class="guide-panel"
      :class="{ centered: !targetRect || !isOnTargetRoute }"
      :style="panelStyle"
    >
      <div class="guide-panel-head">
        <div>
          <div class="guide-badge">{{ t('guideOverlay.agentGuide') }} · Step {{ guide.currentStep + 1 }}/{{ guide.steps.length }}</div>
          <div class="guide-title">{{ step.title }}</div>
          <p class="guide-desc">{{ step.desc }}</p>
          <div class="guide-sub-badge">{{ t('guideOverlay.action') }} {{ guide.currentAction + 1 }}/{{ guide.currentActionCount }}</div>
        </div>
        <button class="guide-close-btn" @click="guide.pauseGuide" :title="t('guideOverlay.continueLater')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="guide-progress-line">
        <div class="guide-progress-bar" :style="{ width: `${guide.progressPercent}%` }" />
      </div>

      <div v-if="!isOnTargetRoute" class="guide-status guide-status-info">
        {{ t('guideOverlay.routeNotOpen') }}
      </div>
      <div v-else-if="!targetRect" class="guide-status guide-status-warn">
        {{ t('guideOverlay.targetMissing') }}
      </div>
      <div v-else class="guide-status guide-status-success">
        {{ t('guideOverlay.targetReady') }}
      </div>

      <div class="guide-section">
        <div class="guide-section-title">{{ t('guideOverlay.suggestedOrder') }}</div>
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
        <div class="guide-section-title">{{ t('guideOverlay.completionCriteria') }}</div>
        <div class="guide-result-text">{{ step.result }}</div>
        <div v-if="step.tip" class="guide-tip-text">{{ t('guideOverlay.tipPrefix') }}{{ step.tip }}</div>
      </div>

      <div class="guide-panel-actions">
        <el-button text @click="guide.pauseGuide">{{ t('guideOverlay.continueLater') }}</el-button>
        <el-button @click="guide.goPrevActionOrStep">{{ t('guideOverlay.previous') }}</el-button>
        <el-button v-if="!isOnTargetRoute" @click="guide.openStep(guide.currentStep)">{{ t('guideOverlay.goCurrentPage') }}</el-button>
        <el-button v-else-if="!targetRect" @click="refreshPosition">{{ t('guideOverlay.relocate') }}</el-button>
        <el-button @click="guide.skipCurrentAndNext()">
          {{ isLastStep ? t('guideOverlay.skipAndFinish') : t('guideOverlay.skipStep') }}
        </el-button>
        <el-button type="primary" @click="guide.completeCurrentAndNext()">
          {{ isLastAction ? (isLastStep ? t('guideOverlay.finishGuide') : t('guideOverlay.finishStepNext')) : t('guideOverlay.finishAction') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAgentGuideStore } from '@/stores/agentGuide'
import { useI18n } from 'vue-i18n'

const guide = useAgentGuideStore()
const route = useRoute()
const { t } = useI18n()

const targetRect = ref<DOMRect | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const step = computed(() => guide.currentStepData)
const actions = computed(() => guide.currentActions)
const currentAction = computed(() => guide.currentActionData)
const isLastStep = computed(() => guide.currentStep >= guide.steps.length - 1)
const isLastAction = computed(() => guide.currentAction >= guide.currentActionCount - 1)
const isOnTargetRoute = computed(() => route.path === currentAction.value.path)

let retryTimer: number | null = null
let autoAdvanceTimer: number | null = null
let settleTimers: number[] = []
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

function clearSettleTimers() {
  settleTimers.forEach((timer) => window.clearTimeout(timer))
  settleTimers = []
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

function normalizeSelectorText(selector?: string) {
  return String(selector || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim()
}

function isElementVisible(element: HTMLElement | null): element is HTMLElement {
  if (!element) return false
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return false
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

function isInteractiveElement(element: HTMLElement) {
  const tag = element.tagName.toLowerCase()
  return (
    tag === 'button' ||
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    tag === 'a' ||
    element.matches('[role="button"], [tabindex], .el-button, .el-input__wrapper, .el-select__wrapper, .el-textarea__inner, .el-input__inner')
  )
}

function isButtonLikeElement(element: HTMLElement) {
  const tag = element.tagName.toLowerCase()
  return tag === 'button' || tag === 'a' || element.matches('.el-button, [role="button"]')
}

function isFieldLikeElement(element: HTMLElement) {
  const tag = element.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    element.matches('.el-input__wrapper, .el-select__wrapper, .el-textarea__inner, .el-input__inner')
  )
}

function findVisibleTargetFromElement(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null
  if (isElementVisible(element) && (isButtonLikeElement(element) || isFieldLikeElement(element))) {
    return element
  }

  const buttonCandidate = Array.from(
    element.querySelectorAll('button, .el-button, a, [role="button"]')
  ).find((candidate) => isElementVisible(candidate as HTMLElement)) as HTMLElement | undefined
  if (buttonCandidate) return buttonCandidate

  const fieldCandidate = Array.from(
    element.querySelectorAll('input, textarea, select, .el-input__wrapper, .el-select__wrapper, .el-textarea__inner, .el-input__inner')
  ).find((candidate) => isElementVisible(candidate as HTMLElement)) as HTMLElement | undefined
  if (fieldCandidate) return fieldCandidate

  if (isElementVisible(element)) return element

  const fallback = Array.from(
    element.querySelectorAll('[role="button"], [tabindex]')
  ).find((candidate) => isElementVisible(candidate as HTMLElement)) as HTMLElement | undefined
  return fallback || null
}

function findByGuideId(selector: string): HTMLElement | null {
  const match = selector.match(/data-guide-id\s*=\s*["']?([^"'\\\]]+)["']?/i)
  if (!match) return null
  const guideId = match[1].trim()
  const all = Array.from(document.querySelectorAll('[data-guide-id]')) as HTMLElement[]
  return all.find((el) => el.getAttribute('data-guide-id') === guideId) || null
}

function getTargetElement() {
  if (!guide.active || !isOnTargetRoute.value) return null
  const selector = normalizeSelectorText(currentAction.value.selector)
  if (!selector) return null
  try {
    const direct = document.querySelector(selector) as HTMLElement | null
    return findVisibleTargetFromElement(direct) || findVisibleTargetFromElement(findByGuideId(selector))
  } catch {
    return findVisibleTargetFromElement(findByGuideId(selector))
  }
}

function scheduleSettledReposition() {
  clearSettleTimers()
  const delays = [80, 180, 320, 520]
  settleTimers = delays.map((delay) =>
    window.setTimeout(() => {
      if (!guide.active) return
      updatePosition(false)
    }, delay)
  )
}

function updatePosition(scrollIntoView = false) {
  const element = getTargetElement()
  if (!element) {
    targetRect.value = null
    unbindTargetElement()
    return false
  }

  if (scrollIntoView) {
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' })
  }

  const rect = element.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) {
    targetRect.value = null
    unbindTargetElement()
    return false
  }

  targetRect.value = rect
  bindTargetElement(element)
  scheduleSettledReposition()
  return true
}

function locateTarget(scrollIntoView = true) {
  clearRetryTimer()
  let attempts = 0

  const tryLocate = () => {
    attempts += 1
    const ok = updatePosition(attempts === 1 && scrollIntoView)
    if (ok || attempts >= 12 || !guide.active) return
    retryTimer = window.setTimeout(tryLocate, 220)
  }

  nextTick(() => {
    retryTimer = window.setTimeout(tryLocate, 120)
  })
}

function refreshPosition() {
  locateTarget(true)
}

function handleViewportChange() {
  if (!guide.active) return
  updatePosition(false)
}

function getOverlapArea(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return width * height
}

function resolvePanelPosition(
  rect: DOMRect,
  panelWidth: number,
  panelHeight: number,
  preferredPlacement: 'right' | 'left' | 'bottom' | 'top',
) {
  const gap = 22
  const minLeft = 16
  const minTop = 16
  const maxLeft = Math.max(minLeft, window.innerWidth - panelWidth - 16)
  const maxTop = Math.max(minTop, window.innerHeight - panelHeight - 16)

  const makePlacement = (placement: 'right' | 'left' | 'bottom' | 'top') => {
    if (placement === 'left') {
      return {
        placement,
        left: rect.left - panelWidth - gap,
        top: rect.top + rect.height / 2 - panelHeight / 2,
      }
    }
    if (placement === 'bottom') {
      return {
        placement,
        left: rect.left + rect.width / 2 - panelWidth / 2,
        top: rect.bottom + gap,
      }
    }
    if (placement === 'top') {
      return {
        placement,
        left: rect.left + rect.width / 2 - panelWidth / 2,
        top: rect.top - panelHeight - gap,
      }
    }
    return {
      placement,
      left: rect.right + gap,
      top: rect.top + rect.height / 2 - panelHeight / 2,
    }
  }

  const placementOrder = [
    preferredPlacement,
    'right',
    'bottom',
    'left',
    'top',
  ].filter((placement, index, list) => list.indexOf(placement) === index) as Array<'right' | 'left' | 'bottom' | 'top'>

  const fitsInViewport = (position: { left: number; top: number }) =>
    position.left >= minLeft && position.left <= maxLeft && position.top >= minTop && position.top <= maxTop

  const fitCandidate = placementOrder
    .map((placement) => makePlacement(placement))
    .find((candidate) => fitsInViewport(candidate))

  if (fitCandidate) return fitCandidate

  const targetBox = {
    left: rect.left - 8,
    top: rect.top - 8,
    right: rect.right + 8,
    bottom: rect.bottom + 8,
  }

  const bestCandidate = placementOrder
    .map((placement) => {
      const raw = makePlacement(placement)
      const left = Math.min(Math.max(raw.left, minLeft), maxLeft)
      const top = Math.min(Math.max(raw.top, minTop), maxTop)
      const panelBox = {
        left,
        top,
        right: left + panelWidth,
        bottom: top + panelHeight,
      }
      const overlap = getOverlapArea(panelBox, targetBox)
      const drift = Math.abs(left - raw.left) + Math.abs(top - raw.top)
      return { ...raw, left, top, overlap, drift }
    })
    .sort((a, b) => a.overlap - b.overlap || a.drift - b.drift)[0]

  return bestCandidate
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
  if (!targetRect.value || !isOnTargetRoute.value) return {}

  const panelWidth = 360
  const panelHeight = panelRef.value?.offsetHeight || 420
  const rect = targetRect.value
  const placement = currentAction.value.placement || 'right'
  const resolved = resolvePanelPosition(rect, panelWidth, panelHeight, placement)

  return {
    left: `${resolved.left}px`,
    top: `${resolved.top}px`,
  }
})

watch(
  () => [guide.active, guide.currentStep, guide.currentAction, route.path],
  () => {
    if (!guide.active) {
      clearRetryTimer()
      clearAutoAdvanceTimer()
      clearSettleTimers()
      unbindTargetElement()
      targetRect.value = null
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
  clearSettleTimers()
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
  background: linear-gradient(90deg, #7c3aed, #2563eb);
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
.guide-section { margin-bottom: 14px; }
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
  background: #7c3aed;
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
  background: linear-gradient(180deg, rgba(124, 58, 237, 0.04), rgba(37, 99, 235, 0.04));
  border: 1px solid rgba(124, 58, 237, 0.12);
}
.guide-result-text,
.guide-tip-text {
  font-size: 13px;
  line-height: 1.7;
  color: #475569;
}
.guide-tip-text { margin-top: 6px; }
.guide-panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
</style>
