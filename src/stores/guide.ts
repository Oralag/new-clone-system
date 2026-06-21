import { defineStore } from 'pinia'
import { nextTick } from 'vue'
import router from '@/router'
import { t } from '@/i18n'

export interface GuideAction {
  text: string
  selector?: string
  path?: string
  placement?: 'right' | 'left' | 'bottom' | 'top'
  panelMode?: 'target' | 'fixed'
  autoAdvance?: boolean
}

export interface GuideStep {
  id: string
  title: string
  short: string
  path: string
  selector: string
  desc: string
  actions: Array<string | GuideAction>
  result: string
  tip?: string
  placement?: 'right' | 'left' | 'bottom' | 'top'
  panelMode?: 'target' | 'fixed'
}

export interface NormalizedGuideAction {
  text: string
  selector: string
  path: string
  placement?: 'right' | 'left' | 'bottom' | 'top'
  panelMode?: 'target' | 'fixed'
  autoAdvance: boolean
}

const STORAGE_KEY = 'erp_onboarding_state_v4'

const guideSteps: GuideStep[] = [
  {
    id: 'dashboard-overview',
    title: t('guideSteps.dashboardOverview.title'),
    short: t('guideSteps.dashboardOverview.short'),
    path: '/dashboard',
    selector: '[data-guide-id="guide-dashboard-quick-first"]',
    placement: 'bottom',
    desc: t('guideSteps.dashboardOverview.desc'),
    actions: [
      {
        text: t('guideSteps.dashboardOverview.action'),
        selector: '[data-guide-id="guide-dashboard-quick-first"]',
        placement: 'bottom',
        panelMode: 'fixed',
        autoAdvance: true,
      },
    ],
    result: t('guideSteps.dashboardOverview.result'),
    tip: t('guideSteps.dashboardOverview.tip'),
  },
  {
    id: 'sale-client-create',
    title: t('guideSteps.saleClientCreate.title'),
    short: t('guideSteps.saleClientCreate.short'),
    path: '/sale/client',
    selector: '[data-guide-id="guide-client-create"]',
    desc: t('guideSteps.saleClientCreate.desc'),
    actions: [
      { text: t('guideSteps.saleClientCreate.actions.create'), selector: '[data-guide-id="guide-client-create"]', autoAdvance: true },
      { text: t('guideSteps.saleClientCreate.actions.fill'), selector: '[data-guide-id="guide-client-form-basic"]', autoAdvance: true },
      { text: t('guideSteps.saleClientCreate.actions.save'), selector: '[data-guide-id="guide-client-form-save"]', autoAdvance: true },
    ],
    result: t('guideSteps.saleClientCreate.result'),
    tip: t('guideSteps.saleClientCreate.tip'),
  },
  {
    id: 'sale-offer-create',
    title: t('guideSteps.saleOfferCreate.title'),
    short: t('guideSteps.saleOfferCreate.short'),
    path: '/sale/offer',
    selector: '[data-guide-id=”guide-offer-create”]',
    desc: t('guideSteps.saleOfferCreate.desc'),
    actions: [
      { text: t('guideSteps.saleOfferCreate.actions.create'), selector: '[data-guide-id=”guide-offer-create”]', autoAdvance: true },
      { text: t('guideSteps.saleOfferCreate.actions.customer'), selector: '[data-guide-id=”guide-offer-customer”]', autoAdvance: true },
      { text: t('guideSteps.saleOfferCreate.actions.goods'), selector: '[data-guide-id=”guide-offer-goods”]', autoAdvance: true },
      { text: t('guideSteps.saleOfferCreate.actions.selectGoods'), selector: '[data-guide-id=”guide-offer-goods-table”]', placement: 'bottom', autoAdvance: false },
      { text: t('guideSteps.saleOfferCreate.actions.confirmAdd'), selector: '[data-guide-id=”guide-offer-goods-confirm”]', autoAdvance: true },
      { text: t('guideSteps.saleOfferCreate.actions.save'), selector: '[data-guide-id=”guide-offer-save”]', autoAdvance: true },
    ],
    result: t('guideSteps.saleOfferCreate.result'),
    tip: t('guideSteps.saleOfferCreate.tip'),
  },
  {
    id: 'sale-contract-create',
    title: t('guideSteps.saleContractCreate.title'),
    short: t('guideSteps.saleContractCreate.short'),
    path: '/sale/contract',
    selector: '[data-guide-id=”guide-contract-create”]',
    desc: t('guideSteps.saleContractCreate.desc'),
    actions: [
      { text: t('guideSteps.saleContractCreate.actions.create'), selector: '[data-guide-id=”guide-contract-create”]', autoAdvance: true },
      { text: t('guideSteps.saleContractCreate.actions.customer'), selector: '[data-guide-id=”guide-contract-customer”]', autoAdvance: true },
      { text: t('guideSteps.saleContractCreate.actions.goods'), selector: '[data-guide-id=”guide-contract-goods”]', autoAdvance: true },
      { text: t('guideSteps.saleContractCreate.actions.selectGoods'), selector: '[data-guide-id=”guide-contract-goods-table”]', placement: 'bottom', autoAdvance: false },
      { text: t('guideSteps.saleContractCreate.actions.confirmAdd'), selector: '[data-guide-id=”guide-contract-goods-confirm”]', autoAdvance: true },
      { text: t('guideSteps.saleContractCreate.actions.save'), selector: '[data-guide-id=”guide-contract-save”]', autoAdvance: true },
    ],
    result: t('guideSteps.saleContractCreate.result'),
    tip: t('guideSteps.saleContractCreate.tip'),
  },
  {
    id: 'sale-out-create',
    title: t('guideSteps.saleOutCreate.title'),
    short: t('guideSteps.saleOutCreate.short'),
    path: '/sale/out',
    selector: '[data-guide-id=”guide-saleout-create”]',
    desc: t('guideSteps.saleOutCreate.desc'),
    actions: [
      { text: t('guideSteps.saleOutCreate.actions.create'), selector: '[data-guide-id=”guide-saleout-create”]', autoAdvance: true },
      { text: t('guideSteps.saleOutCreate.actions.customer'), selector: '[data-guide-id=”guide-saleout-basic”]', autoAdvance: true },
      { text: t('guideSteps.saleOutCreate.actions.goods'), selector: '[data-guide-id=”guide-saleout-goods”]', autoAdvance: true },
      { text: t('guideSteps.saleOutCreate.actions.selectGoods'), selector: '[data-guide-id=”guide-saleout-goods-table”]', placement: 'bottom', autoAdvance: false },
      { text: t('guideSteps.saleOutCreate.actions.confirmAdd'), selector: '[data-guide-id=”guide-saleout-goods-confirm”]', autoAdvance: true },
      { text: t('guideSteps.saleOutCreate.actions.save'), selector: '[data-guide-id=”guide-saleout-save”]', autoAdvance: true },
    ],
    result: t('guideSteps.saleOutCreate.result'),
    tip: t('guideSteps.saleOutCreate.tip'),
  },
  {
    id: 'finance-receivable-overview',
    title: t('guideSteps.financeReceivableOverview.title'),
    short: t('guideSteps.financeReceivableOverview.short'),
    path: '/finance/receivable',
    selector: '[data-guide-id="guide-receivable-card"]',
    desc: t('guideSteps.financeReceivableOverview.desc'),
    actions: [
      { text: t('guideSteps.financeReceivableOverview.action'), selector: '[data-guide-id="guide-receivable-card"]', autoAdvance: true },
    ],
    result: t('guideSteps.financeReceivableOverview.result'),
    tip: t('guideSteps.financeReceivableOverview.tip'),
  },
  {
    id: 'finance-collect-receipt-create',
    title: t('guideSteps.financeCollectReceiptCreate.title'),
    short: t('guideSteps.financeCollectReceiptCreate.short'),
    path: '/finance/collect-receipt',
    selector: '[data-guide-id="guide-collect-receipt-create"]',
    desc: t('guideSteps.financeCollectReceiptCreate.desc'),
    actions: [
      { text: t('guideSteps.financeCollectReceiptCreate.actions.create'), selector: '[data-guide-id="guide-collect-receipt-create"]', autoAdvance: true },
      { text: t('guideSteps.financeCollectReceiptCreate.actions.fill'), selector: '[data-guide-id="guide-collect-receipt-form"]', autoAdvance: true },
      { text: t('guideSteps.financeCollectReceiptCreate.actions.save'), selector: '[data-guide-id="guide-collect-receipt-save"]', autoAdvance: true },
    ],
    result: t('guideSteps.financeCollectReceiptCreate.result'),
    tip: t('guideSteps.financeCollectReceiptCreate.tip'),
  },
  {
    id: 'reports-sale-rate',
    title: t('guideSteps.reportsSaleRate.title'),
    short: t('guideSteps.reportsSaleRate.short'),
    path: '/reports/sale-rate',
    selector: '[data-guide-id="guide-sale-rate-card"]',
    desc: t('guideSteps.reportsSaleRate.desc'),
    actions: [
      { text: t('guideSteps.reportsSaleRate.action'), selector: '[data-guide-id="guide-sale-rate-card"]', autoAdvance: true },
    ],
    result: t('guideSteps.reportsSaleRate.result'),
    tip: t('guideSteps.reportsSaleRate.tip'),
  },
]

type StoredGuideState = {
  currentStep: number
  currentAction: number
  active: boolean
  completed: number[]
  skipped: number[]
}

function normalizeSelector(selector?: string): string {
  return String(selector || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim()
}

function normalizeGuideAction(step: GuideStep, action: string | GuideAction): NormalizedGuideAction {
  if (typeof action === 'string') {
    return {
      text: action,
      selector: normalizeSelector(step.selector),
      path: step.path,
      placement: step.placement,
      panelMode: step.panelMode,
      autoAdvance: false,
    }
  }
  return {
    text: action.text,
    selector: normalizeSelector(action.selector || step.selector),
    path: action.path || step.path,
    placement: action.placement || step.placement,
    panelMode: action.panelMode || step.panelMode || 'target',
    autoAdvance: action.autoAdvance === true,
  }
}

function getStepActions(step?: GuideStep): NormalizedGuideAction[] {
  if (!step) return []
  return (step.actions?.length ? step.actions : ['']).map((action) => normalizeGuideAction(step, action))
}

function readStoredState(): StoredGuideState {
  if (typeof window === 'undefined') {
    return { currentStep: 0, currentAction: 0, active: false, completed: [], skipped: [] }
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      currentStep: Number(parsed.currentStep || 0),
      currentAction: Number(parsed.currentAction || 0),
      active: parsed.active === true,
      completed: Array.isArray(parsed.completed) ? parsed.completed.map(Number) : [],
      skipped: Array.isArray(parsed.skipped) ? parsed.skipped.map(Number) : [],
    }
  } catch {
    return { currentStep: 0, currentAction: 0, active: false, completed: [], skipped: [] }
  }
}

export const useGuideStore = defineStore('guide', {
  state: () => {
    const saved = readStoredState()
    const currentStep = Math.max(0, Math.min(saved.currentStep, guideSteps.length - 1))
    const currentAction = Math.max(0, Math.min(saved.currentAction, Math.max(getStepActions(guideSteps[currentStep]).length - 1, 0)))
    return {
      steps: guideSteps,
      currentStep,
      currentAction,
      active: saved.active,
      completed: saved.completed.filter((index) => index >= 0 && index < guideSteps.length),
      skipped: saved.skipped.filter((index) => index >= 0 && index < guideSteps.length),
    }
  },

  getters: {
    currentStepData: (state) => state.steps[state.currentStep] || state.steps[0],
    currentActions(): NormalizedGuideAction[] {
      return getStepActions(this.currentStepData)
    },
    currentActionCount(): number {
      return this.currentActions.length || 1
    },
    currentActionData(): NormalizedGuideAction {
      const index = Math.max(0, Math.min(this.currentAction, this.currentActionCount - 1))
      return this.currentActions[index]
    },
    completedCount: (state) => new Set(state.completed).size,
    skippedCount: (state) => new Set(state.skipped).size,
    handledCount: (state) => new Set([...state.completed, ...state.skipped]).size,
    progressPercent(): number {
      return Math.round((this.handledCount / this.steps.length) * 100)
    },
    isFinished(): boolean {
      return this.handledCount >= this.steps.length
    },
  },

  actions: {
    persist() {
      if (typeof window === 'undefined') return
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStep: this.currentStep,
        currentAction: this.currentAction,
        active: this.active,
        completed: [...new Set(this.completed)],
        skipped: [...new Set(this.skipped)],
      }))
    },

    clampActionIndex(stepIndex: number, actionIndex = 0) {
      const count = Math.max(getStepActions(this.steps[stepIndex]).length, 1)
      return Math.max(0, Math.min(actionIndex, count - 1))
    },

    navigateToCurrentAction() {
      router.push(this.currentActionData.path)
    },

    isStepCompleted(index: number) {
      return this.completed.includes(index)
    },

    isStepSkipped(index: number) {
      return this.skipped.includes(index)
    },

    isStepHandled(index: number) {
      return this.isStepCompleted(index) || this.isStepSkipped(index)
    },

    canOpenStep(index: number) {
      return index <= this.currentStep || this.isStepHandled(index)
    },

    setCurrentStep(index: number, actionIndex = 0) {
      const safeIndex = Math.max(0, Math.min(index, this.steps.length - 1))
      if (!this.canOpenStep(safeIndex) && safeIndex > this.currentStep) return
      this.currentStep = safeIndex
      this.currentAction = this.clampActionIndex(safeIndex, actionIndex)
      this.persist()
    },

    getFirstPendingStep() {
      const nextIndex = this.steps.findIndex((_, index) => !this.isStepHandled(index))
      return nextIndex === -1 ? 0 : nextIndex
    },

    getNextPendingStep(startIndex: number) {
      return this.steps.findIndex((_, index) => index > startIndex && !this.isStepHandled(index))
    },

    startGuide(index?: number) {
      if (this.isFinished) {
        this.resetGuide()
      }
      this.active = false
      this.currentStep = typeof index === 'number' ? index : this.getFirstPendingStep()
      this.currentAction = 0
      this.persist()
      // nextTick 后再设 active=true，确保 watch 能感知变化并触发跳转
      nextTick(() => {
        this.active = true
        this.persist()
      })
    },

    resumeGuide() {
      if (this.isFinished) {
        this.resetGuide()
      }
      this.active = false
      this.currentStep = this.getFirstPendingStep()
      this.currentAction = 0
      this.persist()
      nextTick(() => {
        this.active = true
        this.persist()
      })
    },

    pauseGuide() {
      this.active = false
      this.persist()
    },

    restartGuide() {
      this.resetGuide()
      this.startGuide(0)
    },

    openStep(index: number) {
      if (!this.canOpenStep(index) && index > this.currentStep) return
      this.active = false
      this.currentStep = Math.max(0, Math.min(index, this.steps.length - 1))
      this.currentAction = 0
      this.persist()
      nextTick(() => {
        this.active = true
        this.persist()
      })
    },

    goPrevActionOrStep() {
      if (this.currentAction > 0) {
        this.currentAction -= 1
        this.active = true
        this.persist()
        this.navigateToCurrentAction()
        return
      }
      if (this.currentStep <= 0) return
      const prevStep = this.currentStep - 1
      this.currentStep = prevStep
      this.currentAction = this.clampActionIndex(prevStep, getStepActions(this.steps[prevStep]).length - 1)
      this.active = true
      this.persist()
      this.navigateToCurrentAction()
    },

    advanceCurrentAction() {
      if (this.currentAction < this.currentActionCount - 1) {
        this.currentAction += 1
        this.active = true
        this.persist()
        this.navigateToCurrentAction()
        return true
      }
      return false
    },

    markCurrentCompleted() {
      if (!this.completed.includes(this.currentStep)) {
        this.completed.push(this.currentStep)
      }
      this.skipped = this.skipped.filter((index) => index !== this.currentStep)
    },

    markCurrentSkipped() {
      if (!this.skipped.includes(this.currentStep)) {
        this.skipped.push(this.currentStep)
      }
    },

    advanceAfterHandle() {
      const nextPendingStep = this.getNextPendingStep(this.currentStep)
      if (nextPendingStep !== -1) {
        this.currentStep = nextPendingStep
        this.currentAction = 0
        this.active = true
        this.persist()
        this.navigateToCurrentAction()
        return
      }
      this.active = false
      this.currentAction = 0
      this.persist()
    },

    completeCurrentAndNext() {
      if (this.advanceCurrentAction()) return
      this.markCurrentCompleted()
      this.advanceAfterHandle()
    },

    skipCurrentAndNext() {
      this.markCurrentSkipped()
      this.advanceAfterHandle()
    },

    skipAll() {
      for (let i = 0; i < this.steps.length; i++) {
        if (!this.isStepHandled(i)) {
          this.skipped.push(i)
        }
      }
      this.active = false
      this.currentAction = 0
      this.persist()
    },

    resetGuide() {
      this.currentStep = 0
      this.currentAction = 0
      this.active = false
      this.completed = []
      this.skipped = []
      this.persist()
    },
  },
})
