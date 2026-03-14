import { defineStore } from 'pinia'
import { nextTick } from 'vue'
import router from '@/router'

export interface GuideAction {
  text: string
  selector?: string
  path?: string
  placement?: 'right' | 'left' | 'bottom' | 'top'
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
}

export interface NormalizedGuideAction {
  text: string
  selector: string
  path: string
  placement?: 'right' | 'left' | 'bottom' | 'top'
  autoAdvance: boolean
}

const STORAGE_KEY = 'erp_onboarding_state_v3'

const guideSteps: GuideStep[] = [
  {
    id: 'dashboard-overview',
    title: '先认识首页快捷入口',
    short: '首页',
    path: '/dashboard',
    selector: '[data-guide-id=”guide-dashboard-quick-grid”]',
    placement: 'bottom',
    desc: '先熟悉首页的快捷入口，后续操作都可以从这里快速进入，不用反复在菜单里找页面。',
    actions: [
      {
        text: '点击任意一个快捷入口，进入对应页面。',
        selector: '[data-guide-id=”guide-dashboard-quick-grid”]',
        placement: 'bottom',
        autoAdvance: true,
      },
    ],
    result: '你已经知道常用业务入口在哪里，后续找功能会更快。',
    tip: '如果你更习惯左侧菜单，也可以直接从左侧菜单进入对应页面。',
  },
  {
    id: 'sale-client-create',
    title: '新增客户档案',
    short: '客户',
    path: '/sale/client',
    selector: '[data-guide-id=”guide-client-create”]',
    desc: '销售流程第一步是先建立客户档案，后面的报价、合同、出库、收款都会引用这个客户。',
    actions: [
      { text: '点击”新增客户”按钮。', selector: '[data-guide-id=”guide-client-create”]', autoAdvance: true },
      { text: '填写客户名称等基础资料。', selector: '[data-guide-id=”guide-client-form-basic”]', autoAdvance: true },
      { text: '点击”确定”保存客户档案。', selector: '[data-guide-id=”guide-client-form-save”]', autoAdvance: true },
    ],
    result: '客户已进入系统，可在报价单、合同和收款单里直接选择。',
    tip: '建议顺手设置客户等级，后续报价和销售分析会更清晰。',
  },
  {
    id: 'sale-offer-create',
    title: '创建销售报价单',
    short: '报价',
    path: '/sale/offer',
    selector: '[data-guide-id=”guide-offer-create”]',
    desc: '报价单用于和客户确认商品、价格、数量，是正式签约前最常见的第一张业务单据。',
    actions: [
      { text: '点击”新增报价”按钮。', selector: '[data-guide-id=”guide-offer-create”]', autoAdvance: true },
      { text: '选择客户名称。', selector: '[data-guide-id=”guide-offer-customer”]', autoAdvance: true },
      { text: '点击”选择商品”添加商品。', selector: '[data-guide-id=”guide-offer-goods”]', autoAdvance: true },
      { text: '点击”保存”保存报价单。', selector: '[data-guide-id=”guide-offer-save”]', autoAdvance: true },
    ],
    result: '系统里会形成一张可追踪的报价单，后续可继续转成合同。',
    tip: '如果客户经常询价，先做报价单再转合同，能避免重复录入商品明细。',
  },
  {
    id: 'sale-contract-create',
    title: '创建销售合同',
    short: '合同',
    path: '/sale/contract',
    selector: '[data-guide-id=”guide-contract-create”]',
    desc: '客户确认报价后，再创建正式合同，锁定金额、交付时间和收款要求。',
    actions: [
      { text: '点击”新增合同”按钮。', selector: '[data-guide-id=”guide-contract-create”]', autoAdvance: true },
      { text: '选择客户名称。', selector: '[data-guide-id=”guide-contract-customer”]', autoAdvance: true },
      { text: '点击”选择商品”添加商品明细。', selector: '[data-guide-id=”guide-contract-goods”]', autoAdvance: true },
      { text: '点击”保存”完成合同创建。', selector: '[data-guide-id=”guide-contract-save”]', autoAdvance: true },
    ],
    result: '合同成为后续出库与回款跟踪的业务依据。',
    tip: '如果业务上已经有报价单，可优先使用”选择报价单”减少手工录入。',
  },
  {
    id: 'sale-out-create',
    title: '创建销售出库单',
    short: '出库',
    path: '/sale/out',
    selector: '[data-guide-id=”guide-saleout-create”]',
    desc: '商品发货时要创建销售出库单，系统会据此扣减库存，并为财务生成应收依据。',
    actions: [
      { text: '点击”新增出库”按钮。', selector: '[data-guide-id=”guide-saleout-create”]', autoAdvance: true },
      { text: '选择客户名称。', selector: '[data-guide-id=”guide-saleout-basic”]', autoAdvance: true },
      { text: '点击”选择商品”添加发货商品。', selector: '[data-guide-id=”guide-saleout-goods”]', autoAdvance: true },
      { text: '点击”保存”完成出库单。', selector: '[data-guide-id=”guide-saleout-save”]', autoAdvance: true },
    ],
    result: '库存会按出库数据变化，财务也能据此跟踪待收款。',
    tip: '审核前请确认仓库和数量，避免库存与实际发货不一致。',
  },
  {
    id: 'finance-receivable-overview',
    title: '查看应收账款',
    short: '应收',
    path: '/finance/receivable',
    selector: '[data-guide-id=”guide-receivable-card”]',
    desc: '出库完成后，可以在应收账款里查看客户还欠多少钱，以及哪些单据尚未回款。',
    actions: [
      { text: '查看应收账款列表，确认待收欠款金额。', selector: '[data-guide-id=”guide-receivable-card”]', autoAdvance: true },
    ],
    result: '你已经能定位客户欠款并确认应收来源。',
    tip: '如果要直接登记客户付款，可以从这里进入收款流程。',
  },
  {
    id: 'finance-collect-receipt-create',
    title: '录入收款单',
    short: '收款',
    path: '/finance/collect-receipt',
    selector: '[data-guide-id=”guide-collect-receipt-create”]',
    desc: '客户打款后，要及时录入收款单，系统才能形成回款记录并支持后续对账。',
    actions: [
      { text: '点击”新增收款单”按钮。', selector: '[data-guide-id=”guide-collect-receipt-create”]', autoAdvance: true },
      { text: '选择收款对象、填写金额和账户。', selector: '[data-guide-id=”guide-collect-receipt-form”]', autoAdvance: true },
      { text: '点击”保存”完成收款登记。', selector: '[data-guide-id=”guide-collect-receipt-save”]', autoAdvance: true },
    ],
    result: '客户回款会被记录下来，财务查询与统计都会更准确。',
    tip: '如果只收到部分款项，也照实填写本次金额，系统可以分多次登记。',
  },
  {
    id: 'reports-sale-rate',
    title: '查看销售统计报表',
    short: '报表',
    path: '/reports/sale-rate',
    selector: '[data-guide-id=”guide-sale-rate-card”]',
    desc: '完成前面的业务流程后，可以到销售统计里查看员工维度或时间维度的成交表现。',
    actions: [
      { text: '点击”查询”查看销售统计数据。', selector: '[data-guide-id=”guide-sale-rate-card”]', autoAdvance: true },
    ],
    result: '你已经完成从客户建档到收款、再到报表复盘的完整入门链路。',
    tip: '后续还可以继续查看销售台账、利润报表等更细的经营分析页面。',
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
      autoAdvance: false,
    }
  }
  return {
    text: action.text,
    selector: normalizeSelector(action.selector || step.selector),
    path: action.path || step.path,
    placement: action.placement || step.placement,
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
