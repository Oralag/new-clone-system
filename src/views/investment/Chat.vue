<template>
  <div class="adam-chat">
    <!-- 消息列表 -->
    <div ref="messagesDiv" class="chat-messages">
      <div v-if="messages.length === 0" class="chat-empty">
        <div class="empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(245,166,35,0.3)" stroke-width="1"/>
            <circle cx="12" cy="12" r="4" fill="rgba(245,166,35,0.2)"/>
          </svg>
        </div>
        <p class="empty-title">与亚当通讯</p>
        <p class="empty-desc">亚当是决策者，你是操作手。他会主动找你，你也可以找他。</p>
      </div>

      <div v-for="msg in messages" :key="msg.id" class="msg" :class="msg.role">
        <div class="msg-meta">
          <span class="msg-sender">{{ msg.role === 'user' ? '你' : 'ADAM' }}</span>
          <span class="msg-time">{{ msg.time }}</span>
        </div>
        <div class="msg-content" v-html="renderMarkdown(msg.content)"></div>

        <!-- 工具调用卡片 -->
        <div v-if="msg.toolCalls?.length" class="tool-calls">
          <div v-for="call in msg.toolCalls" :key="call.id" class="tool-card" :class="call.status">
            <div class="tool-header">
              <span class="tool-status-dot"></span>
              <span class="tool-name">{{ call.name }}</span>
              <span class="tool-status-label">{{ call.status === 'running' ? '执行中' : call.status === 'success' ? '完成' : '失败' }}</span>
            </div>
            <div v-if="call.result" class="tool-result">{{ call.result.slice(0, 300) }}{{ call.result.length > 300 ? '...' : '' }}</div>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="msg assistant">
        <div class="msg-meta">
          <span class="msg-sender">ADAM</span>
        </div>
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="chat-input-area">
      <div class="disclaimer">AI 数据分析，不构成投资建议，风险自担</div>
      <div class="input-row">
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="chat-input"
          placeholder="对亚当说话..."
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @input="autoResize"
        />
        <button class="send-btn" :disabled="!inputText.trim() || isLoading" @click="handleSend">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useAdamStore } from '@/stores/adam'

interface ToolCallState {
  id: string
  name: string
  input: Record<string, any>
  result?: string
  status: 'running' | 'success' | 'error'
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  toolCalls?: ToolCallState[]
}

const HISTORY_KEY = 'adam_chat_history'
const MAX_HISTORY = 80

const adamStore = useAdamStore()
const messagesDiv = ref<HTMLDivElement>()
const inputRef = ref<HTMLTextAreaElement>()
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isLoading = ref(false)

onMounted(() => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) messages.value = JSON.parse(raw)
  } catch { /* ignore */ }
})

function persistHistory() {
  const trimmed = messages.value.slice(-MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesDiv.value) messagesDiv.value.scrollTop = messagesDiv.value.scrollHeight
  })
}

function autoResize() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
}

function nowStr() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function renderMarkdown(text: string) {
  // 简单 Markdown：加粗、换行
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  const userMsg: ChatMessage = {
    id: `u_${Date.now()}`,
    role: 'user',
    content: text,
    time: nowStr(),
  }
  messages.value.push(userMsg)
  inputText.value = ''
  if (inputRef.value) inputRef.value.style.height = 'auto'
  scrollToBottom()

  isLoading.value = true

  const assistantMsg: ChatMessage = {
    id: `a_${Date.now()}`,
    role: 'assistant',
    content: '',
    time: nowStr(),
    toolCalls: [],
  }

  try {
    const apiMessages = messages.value
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }))

    const token = localStorage.getItem('erp_token') || ''

    const res = await fetch('/api/adam-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-erp-token': token,
      },
      body: JSON.stringify({
        messages: apiMessages,
        adamState: { ...adamStore.core },
      }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    messages.value.push(assistantMsg)
    scrollToBottom()

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') break

        try {
          const data = JSON.parse(payload)
          if (data.type === 'text') {
            assistantMsg.content += data.text
            scrollToBottom()
          } else if (data.type === 'tool_start') {
            assistantMsg.toolCalls!.push({
              id: data.id,
              name: data.name,
              input: data.input || {},
              status: 'running',
            })
            scrollToBottom()
          } else if (data.type === 'tool_result') {
            const call = assistantMsg.toolCalls!.find((c) => c.id === data.id)
            if (call) {
              call.result = data.result
              call.status = 'success'
            }
            scrollToBottom()
          } else if (data.type === 'error') {
            assistantMsg.content += `\n[错误: ${data.error}]`
            scrollToBottom()
          }
        } catch { /* ignore parse error */ }
      }
    }
  } catch (e: any) {
    if (!assistantMsg.content) {
      assistantMsg.content = `连接失败：${e.message}`
    }
    if (!messages.value.includes(assistantMsg)) {
      messages.value.push(assistantMsg)
    }
  } finally {
    isLoading.value = false
    persistHistory()
    scrollToBottom()
  }
}
</script>

<style scoped>
.adam-chat {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 52px - 48px);
  min-height: 400px;
}

/* 消息列表 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 10px;
}
.empty-icon { opacity: 0.5; }
.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--mid);
  margin: 0;
}
.empty-desc {
  font-size: 12px;
  color: var(--dim);
  margin: 0;
  text-align: center;
  max-width: 300px;
}

/* 消息 */
.msg {
  padding: 8px 0;
}
.msg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.msg-sender {
  font-size: 10px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
}
.msg.user .msg-sender { color: var(--mid); }
.msg.assistant .msg-sender { color: #F5A623; }
.msg-time {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.msg-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--dark);
}
.msg.user .msg-content { color: var(--mid); }

/* 工具调用卡片 */
.tool-calls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}
.tool-card {
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
}
.tool-header {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tool-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.tool-card.running .tool-status-dot { background: #00D4FF; animation: toolpulse 1s infinite; }
.tool-card.success .tool-status-dot { background: #00E5A0; }
.tool-card.error .tool-status-dot { background: #FF4D4D; }
@keyframes toolpulse {
  0%,100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.tool-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--mid);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.tool-status-label {
  font-size: 9px;
  color: var(--dim);
  margin-left: auto;
}
.tool-result {
  font-size: 11px;
  color: var(--dim);
  margin-top: 6px;
  line-height: 1.4;
  word-break: break-all;
}

/* 加载动画 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}
.typing-indicator span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #F5A623;
  animation: typing 1.2s ease-in-out infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing {
  0%,60%,100% { opacity: 0.2; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

/* 输入区 */
.chat-input-area {
  border-top: 1px solid var(--border);
  padding: 10px 0 0;
}
.disclaimer {
  font-size: 9px;
  color: var(--dim);
  text-align: center;
  margin-bottom: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.chat-input {
  flex: 1;
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--dark);
  font-size: 13px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.15s;
  line-height: 1.5;
}
.chat-input::placeholder { color: var(--dim); }
.chat-input:focus { border-color: rgba(245,166,35,0.25); }
.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid rgba(245,166,35,0.25);
  background: transparent;
  color: #F5A623;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) {
  background: #F5A623;
  color: #fff;
}
.send-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

@media (max-width: 767px) {
  .adam-chat { height: calc(100vh - 50px - 28px); }
}
</style>
