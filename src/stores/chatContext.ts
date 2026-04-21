import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ChatContextMessage {
  sender: string
  content: string
  isAI: boolean
  time: string
}

// 保存最近群聊和私聊的对话上下文，供两边 AI 共享
export const useChatContextStore = defineStore('chatContext', () => {
  const groupMessages = ref<ChatContextMessage[]>([])
  const privateMessages = ref<ChatContextMessage[]>([])

  function addGroupMessage(msg: ChatContextMessage) {
    groupMessages.value.push(msg)
    if (groupMessages.value.length > 30) groupMessages.value.shift()
  }

  function addPrivateMessage(msg: ChatContextMessage) {
    privateMessages.value.push(msg)
    if (privateMessages.value.length > 30) privateMessages.value.shift()
  }

  function getContextSummary(): string {
    const all = [
      ...groupMessages.value.map(m => `[群聊]${m.isAI ? 'AI管家' : m.sender}: ${m.content}`),
      ...privateMessages.value.map(m => `[私聊]${m.isAI ? 'AI管家' : m.sender}: ${m.content}`),
    ]
    if (all.length === 0) return ''
    return `\n\n【近期对话记录（群聊+私聊）】\n${all.join('\n')}`
  }

  function clear() {
    groupMessages.value = []
    privateMessages.value = []
  }

  return { groupMessages, privateMessages, addGroupMessage, addPrivateMessage, getContextSummary, clear }
})
