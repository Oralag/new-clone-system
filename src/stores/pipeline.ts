import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 流水线步骤定义
export const PIPELINE_STAGES = [
  { id: 'intel',     label: '情报部', emoji: '📈', color: '#06b6d4' },
  { id: 'content',   label: '内容部', emoji: '✍️', color: '#f59e0b' },
  { id: 'creative',  label: '创意部', emoji: '🎨', color: '#ec4899' },
  { id: 'publish',   label: '发布部', emoji: '🚀', color: '#10b981' },
] as const

export type StageId = typeof PIPELINE_STAGES[number]['id']
export type TaskStatus = 'pending' | 'running' | 'done' | 'blocked'

export interface PipelineTask {
  id: string
  title: string           // 任务标题（来自会议室议题或手动创建）
  createdAt: number
  currentStage: number    // 当前在第几个阶段（0-3）
  status: TaskStatus
  stageOutputs: Partial<Record<StageId, string>>  // 各阶段产出摘要
  fromMeeting: boolean
}

// 跨部门传递的 payload
export interface StagePayload {
  taskId: string
  fromStage: StageId
  toStage: StageId
  content: string         // 传递的内容摘要
  timestamp: number
}

const STORAGE_KEY = 'agent_pipeline_tasks'

function load(): PipelineTask[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function save(tasks: PipelineTask[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) } catch {}
}

export const usePipelineStore = defineStore('pipeline', () => {
  const tasks = ref<PipelineTask[]>(load())

  function persist() { save(tasks.value) }

  // 从会议室同步任务
  function syncFromMeeting(topic: string, phase: string) {
    const existing = tasks.value.find(t => t.title === topic && t.fromMeeting)
    if (existing) {
      existing.status = phase === 'done' ? 'done' : 'running'
      if (phase === 'executing' || phase === 'done') existing.currentStage = 1
      if (phase === 'done') existing.currentStage = 3
      persist()
      return
    }
    if (phase === 'idle') return
    tasks.value.unshift({
      id: Date.now().toString(36),
      title: topic,
      createdAt: Date.now(),
      currentStage: 0,
      status: phase === 'done' ? 'done' : 'running',
      stageOutputs: {},
      fromMeeting: true,
    })
    persist()
  }

  // 手动创建任务
  function createTask(title: string) {
    tasks.value.unshift({
      id: Date.now().toString(36),
      title,
      createdAt: Date.now(),
      currentStage: 0,
      status: 'pending',
      stageOutputs: {},
      fromMeeting: false,
    })
    persist()
  }

  // 推进到下一阶段
  function advanceStage(taskId: string, output?: string) {
    const t = tasks.value.find(t => t.id === taskId)
    if (!t) return
    const stage = PIPELINE_STAGES[t.currentStage]
    if (output && stage) t.stageOutputs[stage.id] = output
    if (t.currentStage < PIPELINE_STAGES.length - 1) {
      t.currentStage++
      t.status = 'running'
    } else {
      t.status = 'done'
    }
    persist()
  }

  // 记录某阶段产出
  function recordOutput(taskId: string, stageId: StageId, output: string) {
    const t = tasks.value.find(t => t.id === taskId)
    if (!t) return
    t.stageOutputs[stageId] = output
    persist()
  }

  // 最近的运行中任务
  const activeTask = computed(() => tasks.value.find(t => t.status === 'running') || null)

  // 删除任务
  function removeTask(taskId: string) {
    tasks.value = tasks.value.filter(t => t.id !== taskId)
    persist()
  }

  return {
    tasks,
    activeTask,
    syncFromMeeting,
    createTask,
    advanceStage,
    recordOutput,
    removeTask,
  }
})
