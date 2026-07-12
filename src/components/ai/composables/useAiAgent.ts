import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useAdamStore } from '@/stores/adam'
import { getStoredLocale } from '@/i18n'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  time: string
  images?: string[]
  toolCalls?: ToolCallState[]
}

export interface ToolCallState {
  id: string
  name: string
  input: Record<string, any>
  result?: string
  status: 'running' | 'success' | 'error'
}

export interface ImageItem {
  previewUrl: string
  data: string
  mediaType: string
}

function getHistoryKey(): string {
  try {
    const userInfo = JSON.parse(localStorage.getItem('erp_user') || 'null')
    const id = userInfo?.id || userInfo?.account || ''
    if (id) return `erp_ai_chat_history_${id}`
  } catch {}
  return 'erp_ai_chat_history'
}

function getNow() {
  return new Date().toLocaleTimeString(getStoredLocale() === 'en-US' ? 'en-US' : 'zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function isToolResultError(result: unknown): boolean {
  const text = String(result ?? '')
  return /\[FAILED\]|失败|错误|出错|Error|error/.test(text)
}

export function useAiAgent(messagesRef: ReturnType<typeof ref<HTMLDivElement | undefined>>) {
  const adamStore = useAdamStore()
  const messages = ref<ChatMessage[]>(loadHistory())
  const isLoading = ref(false)

  function loadHistory(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(getHistoryKey())
      if (raw) return JSON.parse(raw) as ChatMessage[]
    } catch {}
    return []
  }

  function saveHistory() {
    try {
      localStorage.setItem(getHistoryKey(), JSON.stringify(messages.value.slice(-100)))
    } catch {}
  }

  function clearMessages() {
    messages.value = []
    localStorage.removeItem(getHistoryKey())
  }

  function scrollToBottom() {
    nextTick(() => {
      if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    })
  }

  async function sendMessage(text: string, pendingImages: ImageItem[]) {
    if ((!text.trim() && !pendingImages.length) || isLoading.value) return

    const imagesToSend = [...pendingImages]
    const previewUrls = imagesToSend.map(i => i.previewUrl)

    messages.value.push({
      role: 'user',
      content: text || '请识别这张单据图片，提取所有关键信息并帮我录入系统。',
      time: getNow(),
      images: previewUrls.length ? previewUrls : undefined,
    })

    isLoading.value = true
    scrollToBottom()

    // Build API messages (last 20, strip image previews)
    const apiMessages = messages.value
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    const assistantMsg: ChatMessage = { role: 'assistant', content: '', time: getNow(), toolCalls: [] }
    messages.value.push(assistantMsg)

    try {
      const erpToken = localStorage.getItem('erp_token') || ''
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-erp-token': erpToken,
        },
        body: JSON.stringify({
          messages: apiMessages,
          images: imagesToSend.length > 0
            ? imagesToSend.map(i => ({ data: i.data, mediaType: i.mediaType }))
            : undefined,
          books: adamStore.books,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        // Dev mode SSE
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) throw new Error('无法读取响应流')

        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'text') {
                assistantMsg.content += parsed.text
                scrollToBottom()
              } else if (parsed.type === 'tool_start') {
                // update_emotion 是内部情绪机制，不在界面上显示
                if (parsed.name === 'update_emotion') continue
                assistantMsg.toolCalls!.push({
                  id: parsed.id,
                  name: parsed.name,
                  input: parsed.input || {},
                  status: 'running',
                })
                scrollToBottom()
              } else if (parsed.type === 'tool_result') {
                const tc = assistantMsg.toolCalls!.find(t => t.id === parsed.id)
                if (tc) {
                  tc.result = parsed.result
                  tc.status = isToolResultError(parsed.result) ? 'error' : 'success'
                }
                scrollToBottom()
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error)
              }
            } catch (e: any) {
              if (e.message !== data) throw e
            }
          }
        }
      } else {
        // Production: plain JSON
        const result = await response.json()
        if (result.error) throw new Error(result.error.message || JSON.stringify(result.error))
        assistantMsg.content = result.content?.[0]?.text ?? ''
        scrollToBottom()
      }
    } catch (e: any) {
      assistantMsg.content = `抱歉，出现了错误：${e.message}`
    } finally {
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      isLoading.value = false
      saveHistory()
      scrollToBottom()
    }
  }

  return { messages, isLoading, sendMessage, clearMessages }
}
