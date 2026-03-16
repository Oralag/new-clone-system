import { computed } from 'vue'
import { useTrendingStore } from '@/stores/agent'

export type StepStatus = 'done' | 'active' | 'idle'

export interface WorkflowStepDef {
  key: string
  short: string
  status: StepStatus
}

export function useWorkflowStatus() {
  const agentStore = useTrendingStore()

  const stepStatuses = computed((): Record<string, StepStatus> => {
    const steps = [
      { key: '/agent/trending',    done: Object.values(agentStore.trending).some(a => a.length > 0) },
      { key: '/agent/copywriting', done: agentStore.copywritingResults.length > 0 },
      { key: '/agent/poster',      done: agentStore.flowResults.some(r => r.type === 'poster' && r.imageStatus === 'done') },
      { key: '/agent/video',       done: agentStore.videoResults.length > 0 },
      { key: '/agent/publish',     done: agentStore.history.some(h => (h.status ?? '') === 'published') },
    ]
    let foundActive = false
    return Object.fromEntries(steps.map(({ key, done }) => {
      if (done) return [key, 'done' as StepStatus]
      if (!foundActive) { foundActive = true; return [key, 'active' as StepStatus] }
      return [key, 'idle' as StepStatus]
    }))
  })

  const workflowProgressLabel = computed(() => {
    const map = stepStatuses.value
    const flowPaths = ['/agent/trending', '/agent/copywriting', '/agent/poster', '/agent/video', '/agent/publish']
    const labels: Record<string, string> = {
      '/agent/trending': '热搜', '/agent/copywriting': '文案',
      '/agent/poster': '海报', '/agent/video': '视频', '/agent/publish': '发布',
    }
    const doneCount = flowPaths.filter(p => map[p] === 'done').length
    if (doneCount === flowPaths.length) return '全部完成'
    const activeStep = flowPaths.find(p => map[p] === 'active')
    if (activeStep) return `步骤 ${doneCount + 1}/5 · ${labels[activeStep]}阶段`
    return '工作流就绪'
  })

  return { stepStatuses, workflowProgressLabel }
}
