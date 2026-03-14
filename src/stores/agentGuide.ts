import { defineStore } from 'pinia'
import router from '@/router'

export interface AgentGuideAction {
  text: string
  selector?: string
  path?: string
  placement?: 'right' | 'left' | 'bottom' | 'top'
  autoAdvance?: boolean
}

export interface AgentGuideStep {
  id: string
  title: string
  path: string
  selector: string
  desc: string
  actions: Array<string | AgentGuideAction>
  result: string
  tip?: string
  placement?: 'right' | 'left' | 'bottom' | 'top'
}

export interface NormalizedAgentGuideAction {
  text: string
  selector: string
  path: string
  placement?: 'right' | 'left' | 'bottom' | 'top'
  autoAdvance: boolean
}

const STORAGE_KEY = 'erp_agent_onboarding_state_v1'

const agentGuideSteps: AgentGuideStep[] = [
  {
    id: 'agent-dashboard-overview',
    title: '先认识智能体工作流入口',
    path: '/agent',
    selector: '[data-guide-id="agent-guide-dashboard-actions"]',
    placement: 'bottom',
    desc: '先熟悉智能体工作台的几个核心入口，后面抓热搜、生成文案、图文和发布都会从这里快速进入。',
    actions: [
      { text: '先看一遍工作流入口，确认热搜、文案、图文、视频、发布几个模块的位置。', selector: '[data-guide-id="agent-guide-dashboard-actions"]' },
      { text: '点击任意一个入口，确认可以正常跳转。', selector: '[data-guide-id="agent-guide-dashboard-actions"]' },
      { text: '回到工作台后，再继续下面的正式内容工作流。', selector: '[data-guide-id="agent-guide-dashboard-actions"]' },
    ],
    result: '你已经知道智能体工作流的主要入口位置。',
    tip: '如果你更习惯左侧菜单，也可以从左侧导航进入各个页面。',
  },
  {
    id: 'agent-trending-fetch',
    title: '先抓取热搜话题',
    path: '/agent/trending',
    selector: '[data-guide-id="agent-guide-trending-fetch"]',
    desc: '智能体工作流通常从热点开始。先抓取热搜，再挑选适合品牌借势的内容方向。',
    actions: [
      { text: '点击“获取最新热搜话题”。', selector: '[data-guide-id="agent-guide-trending-fetch"]', autoAdvance: true },
      { text: '在热搜列表里勾选你想要借势的热点话题。', selector: '[data-guide-id="agent-guide-trending-list"]' },
      { text: '点击“用选中话题生成文案”，进入下一步。', selector: '[data-guide-id="agent-guide-trending-generate"]', autoAdvance: true },
    ],
    result: '已从热点里选出待生成内容的话题。',
    tip: '建议优先选和品牌行业更相关、传播更强的话题。',
  },
  {
    id: 'agent-copywriting-generate',
    title: '生成第一批文案',
    path: '/agent/copywriting',
    selector: '[data-guide-id="agent-guide-copy-topic"]',
    desc: '把热搜话题转成平台可用文案，是智能体工作流最关键的一步。',
    actions: [
      { text: '确认或补充“话题 / 主题”。', selector: '[data-guide-id="agent-guide-copy-topic"]' },
      { text: '选择要生成的平台和内容风格。', selector: '[data-guide-id="agent-guide-copy-platforms"]' },
      { text: '点击“生成文案”。', selector: '[data-guide-id="agent-guide-copy-generate"]', autoAdvance: true },
    ],
    result: '系统已生成一批可编辑的文案结果。',
    tip: '如果一次要投多个平台，可以同时勾选多个平台生成。',
  },
  {
    id: 'agent-poster-generate',
    title: '继续生成图文海报',
    path: '/agent/poster',
    selector: '[data-guide-id="agent-guide-poster-topic"]',
    desc: '有了热点和文案后，可以继续生成图文内容方案，方便用于小红书、朋友圈等场景。',
    actions: [
      { text: '确认图文的话题和风格。', selector: '[data-guide-id="agent-guide-poster-topic"]' },
      { text: '选择图文风格、平台和色调。', selector: '[data-guide-id="agent-guide-poster-style"]' },
      { text: '点击“一键生成”。', selector: '[data-guide-id="agent-guide-poster-generate"]', autoAdvance: true },
    ],
    result: '系统已生成一套可直接编辑的图文内容方案。',
    tip: '如果你主攻小红书，优先选择“小红书笔记风”。',
  },
  {
    id: 'agent-publish-manage',
    title: '进入发布管理',
    path: '/agent/publish',
    selector: '[data-guide-id="agent-guide-publish-list"]',
    desc: '生成好的内容会统一汇总到发布管理，在这里完成最后的检查和发布动作。',
    actions: [
      { text: '先查看发布列表，确认刚生成的内容已经进入这里。', selector: '[data-guide-id="agent-guide-publish-list"]' },
      { text: '找到一条内容，点击“标记发布”或“确认发布”。', selector: '[data-guide-id="agent-guide-publish-button"]', autoAdvance: true },
    ],
    result: '你已经走通了智能体工作流从热点到发布的完整链路。',
    tip: '正式发布前，建议先编辑一下内容，确保更符合品牌调性。',
  },
]

type StoredAgentGuideState = {
  currentStep: number
  currentAction: number
  active: boolean
  completed: number[]
  skipped: number[]
}

function normalizeAction(step: AgentGuideStep, action: string | AgentGuideAction): NormalizedAgentGuideAction {
  if (typeof action === 'string') {
    return {
      text: action,
      selector: step.selector,
      path: step.path,
      placement: step.placement,
      autoAdvance: false,
    }
  }
  return {
    text: action.text,
    selector: action.selector || step.selector,
    path: action.path || step.path,
    placement: action.placement || step.placement,
    autoAdvance: action.autoAdvance === true,
  }
}

function getActions(step?: AgentGuideStep): NormalizedAgentGuideAction[] {
  if (!step) return []
  return (step.actions?.length ? step.actions : ['']).map((action) => normalizeAction(step, action))
}

function readStoredState(): StoredAgentGuideState {
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

export const useAgentGuideStore = defineStore('agentGuide', {
  state: () => {
    const saved = readStoredState()
    const currentStep = Math.max(0, Math.min(saved.currentStep, agentGuideSteps.length - 1))
    const currentAction = Math.max(0, Math.min(saved.currentAction, Math.max(getActions(agentGuideSteps[currentStep]).length - 1, 0)))
    return {
      steps: agentGuideSteps,
      currentStep,
      currentAction,
      active: saved.active,
      completed: saved.completed.filter((index) => index >= 0 && index < agentGuideSteps.length),
      skipped: saved.skipped.filter((index) => index >= 0 && index < agentGuideSteps.length),
    }
  },

  getters: {
    currentStepData: (state) => state.steps[state.currentStep] || state.steps[0],
    currentActions(): NormalizedAgentGuideAction[] {
      return getActions(this.currentStepData)
    },
    currentActionCount(): number {
      return this.currentActions.length || 1
    },
    currentActionData(): NormalizedAgentGuideAction {
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
      const count = Math.max(getActions(this.steps[stepIndex]).length, 1)
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
      if (this.isFinished) this.resetGuide()
      this.currentStep = typeof index === 'number' ? index : this.getFirstPendingStep()
      this.currentAction = 0
      this.active = true
      this.persist()
      this.navigateToCurrentAction()
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
      this.currentStep = Math.max(0, Math.min(index, this.steps.length - 1))
      this.currentAction = 0
      this.persist()
      this.navigateToCurrentAction()
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
      this.currentAction = this.clampActionIndex(prevStep, getActions(this.steps[prevStep]).length - 1)
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
