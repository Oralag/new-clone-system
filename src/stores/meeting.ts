import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 会议室消息类型
export interface MeetingMessage {
  id: string
  agentId: string        // captain/copywriter/poster/video/brand/trend/publisher
  agentName: string      // 林晓文、张明远等
  agentEmoji: string
  agentColor: string
  role: 'captain' | 'member' | 'user'
  content: string
  timestamp: number
  isStreaming?: boolean
  taskAssigned?: string  // 给某个专员分配的任务
}

// 会议室状态类型
export interface MeetingState {
  messages: MeetingMessage[]
  isRunning: boolean
  topic: string          // 当前会议议题
  phase: 'idle' | 'opening' | 'discussing' | 'summarizing' | 'executing' | 'done'
  summary: string        // 会议纪要
  assignedTasks: Record<string, string>  // agentId -> task
}

const STORAGE_KEY = 'meeting_session'

function loadSession(): Partial<MeetingState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveSession(state: MeetingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* quota exceeded */ }
}

export const useMeetingStore = defineStore('meeting', () => {
  const saved = loadSession()
  // 消息列表
  const messages = ref<MeetingMessage[]>(saved.messages || [])
  // 会议是否进行中（恢复时如果之前在运行中但未完成，标记为非运行以避免卡死）
  const isRunning = ref(saved.isRunning && saved.phase !== 'done' ? false : false)
  // 当前议题
  const topic = ref(saved.topic || '')
  // 会议阶段（如果之前在执行中途断开，标记为done）
  const phase = ref<MeetingState['phase']>(
    saved.phase === 'executing' || saved.phase === 'discussing' || saved.phase === 'summarizing' || saved.phase === 'opening'
      ? 'done'
      : (saved.phase || 'idle')
  )
  // 会议纪要
  const summary = ref(saved.summary || '')
  // 已分配的任务
  const assignedTasks = ref<Record<string, string>>(saved.assignedTasks || {})
  // 执行状态跟踪
  const executionStatus = ref<Record<string, 'pending' | 'running' | 'done' | 'error'>>({})

  // 持久化：关键状态变化时自动保存
  function persist() {
    saveSession({
      messages: messages.value.map(m => ({ ...m, isStreaming: false })),
      isRunning: isRunning.value,
      topic: topic.value,
      phase: phase.value,
      summary: summary.value,
      assignedTasks: assignedTasks.value,
    })
  }

  // 新增消息
  function addMessage(msg: MeetingMessage) {
    messages.value.push(msg)
  }

  // 更新最后一条消息内容（用于流式追加）
  function appendToLastMessage(agentId: string, text: string) {
    const last = messages.value[messages.value.length - 1]
    if (last && last.agentId === agentId && last.isStreaming) {
      last.content += text
    }
  }

  // 结束最后一条消息的流式状态
  function finalizeLastMessage(agentId: string) {
    const last = messages.value[messages.value.length - 1]
    if (last && last.agentId === agentId) {
      last.isStreaming = false
    }
    persist()
  }

  // 开始会议
  function startMeeting(newTopic: string) {
    topic.value = newTopic
    phase.value = 'opening'
    isRunning.value = true
    summary.value = ''
    assignedTasks.value = {}
    executionStatus.value = {}
  }

  // 结束会议
  function endMeeting(meetingSummary: string) {
    phase.value = 'done'
    isRunning.value = false
    summary.value = meetingSummary
    persist()
  }

  // 重置会议（清空所有状态）
  function resetMeeting() {
    messages.value = []
    isRunning.value = false
    topic.value = ''
    phase.value = 'idle'
    summary.value = ''
    assignedTasks.value = {}
    executionStatus.value = {}
    localStorage.removeItem(STORAGE_KEY)
  }

  // 设置任务分配
  function assignTask(agentId: string, task: string) {
    assignedTasks.value[agentId] = task
  }

  // 设置执行状态
  function setExecutionStatus(agentId: string, status: 'pending' | 'running' | 'done' | 'error') {
    executionStatus.value = { ...executionStatus.value, [agentId]: status }
  }

  // 设置会议阶段
  function setPhase(newPhase: MeetingState['phase']) {
    phase.value = newPhase
  }

  return {
    messages,
    isRunning,
    topic,
    phase,
    summary,
    assignedTasks,
    executionStatus,
    addMessage,
    appendToLastMessage,
    finalizeLastMessage,
    startMeeting,
    endMeeting,
    resetMeeting,
    assignTask,
    setExecutionStatus,
    setPhase,
  }
})
