import { defineStore } from 'pinia'
import { ref } from 'vue'

// 会议室消息类型
export interface MeetingMessage {
  id: string
  agentId: string        // captain/copywriter/poster/video/brand/trend/publisher
  agentName: string      // 林晓文、张明远等
  agentEmoji: string
  agentColor: string
  role: 'captain' | 'member'
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
  phase: 'idle' | 'opening' | 'discussing' | 'summarizing' | 'done'
  summary: string        // 会议纪要
  assignedTasks: Record<string, string>  // agentId -> task
}

export const useMeetingStore = defineStore('meeting', () => {
  // 消息列表
  const messages = ref<MeetingMessage[]>([])
  // 会议是否进行中
  const isRunning = ref(false)
  // 当前议题
  const topic = ref('')
  // 会议阶段
  const phase = ref<MeetingState['phase']>('idle')
  // 会议纪要
  const summary = ref('')
  // 已分配的任务
  const assignedTasks = ref<Record<string, string>>({})

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
  }

  // 开始会议
  function startMeeting(newTopic: string) {
    topic.value = newTopic
    phase.value = 'opening'
    isRunning.value = true
    summary.value = ''
    assignedTasks.value = {}
  }

  // 结束会议
  function endMeeting(meetingSummary: string) {
    phase.value = 'done'
    isRunning.value = false
    summary.value = meetingSummary
  }

  // 重置会议（清空所有状态）
  function resetMeeting() {
    messages.value = []
    isRunning.value = false
    topic.value = ''
    phase.value = 'idle'
    summary.value = ''
    assignedTasks.value = {}
  }

  // 设置任务分配
  function assignTask(agentId: string, task: string) {
    assignedTasks.value[agentId] = task
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
    addMessage,
    appendToLastMessage,
    finalizeLastMessage,
    startMeeting,
    endMeeting,
    resetMeeting,
    assignTask,
    setPhase,
  }
})
