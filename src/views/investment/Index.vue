<template>
  <div class="obs-home">
    <!-- ── 第一层：他现在怎么样 ── -->
    <div class="layer layer-status">
      <div class="status-card">
        <div class="status-header">
          <div class="adam-identity">
            <span class="life-indicator" :class="adamStore.core.status">
              <span class="life-ring"></span>
            </span>
            <div class="adam-name">
              <span class="name-main">ADAM #1</span>
              <span class="name-sub">生命体 · 第一号</span>
            </div>
          </div>
          <button v-if="adamStore.core.status === 'dormant'" class="activate-btn" @click="handleActivate">
            激活亚当
          </button>
        </div>

        <div class="metrics-row">
          <div class="metric">
            <span class="metric-label">净值</span>
            <span class="metric-val" :class="{ positive: adamStore.core.netWorth > 0, negative: adamStore.core.netWorth < 0 }">
              ¥{{ adamStore.core.netWorth.toLocaleString() }}
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">预算</span>
            <span class="metric-val">¥{{ adamStore.core.budget.toLocaleString() }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">信用</span>
            <span class="metric-val credit">{{ adamStore.core.creditLevel }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">存活</span>
            <span class="metric-val">{{ adamStore.core.survivalDays }}天</span>
          </div>
          <div class="metric">
            <span class="metric-label">精力</span>
            <span class="metric-val">{{ adamStore.core.energy }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 第二层：指令 + 事件 ── -->
    <div class="layer layer-events">
      <div class="section-grid">
        <div class="panel panel-instruction">
          <div class="panel-header">
            <span class="panel-title">最新指令</span>
          </div>
          <div v-if="adamStore.latestRecommendation" class="instruction-card">
            <div class="instruction-glow"></div>
            <div class="instruction-body">
              <div class="instruction-title">{{ adamStore.latestRecommendation.title }}</div>
              <div class="instruction-thesis">{{ adamStore.latestRecommendation.thesis }}</div>
              <div class="instruction-risk">{{ adamStore.latestRecommendation.riskNote }}</div>
              <div class="instruction-actions">
                <button class="btn-gold">已执行</button>
                <button class="btn-ghost">跳过</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="empty-text">暂无指令</span>
          </div>
        </div>

        <div class="panel panel-log">
          <div class="panel-header">
            <span class="panel-title">事件日志</span>
          </div>
          <div class="event-list">
            <div v-for="event in adamStore.recentEvents.slice(0, 10)" :key="event.id" class="event-item">
              <span class="event-time">{{ formatTime(event.at) }}</span>
              <span class="event-dot" :class="event.stage"></span>
              <span class="event-text">{{ event.title }}</span>
            </div>
            <div v-if="adamStore.recentEvents.length === 0" class="empty-state">
              <span class="empty-text">暂无事件记录</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 第三层：与亚当通讯 ── -->
    <div class="layer layer-chat">
      <div class="panel panel-chat">
        <div class="panel-header">
          <span class="panel-title">通讯</span>
          <span class="panel-desc">与亚当对话</span>
        </div>

        <div ref="messagesDiv" class="chat-messages">
          <div v-if="messages.length === 0" class="chat-empty">
            <p class="chat-empty-text">亚当是决策者，你是操作手。他会主动找你，你也可以找他。</p>
          </div>

          <div v-for="msg in messages" :key="msg.id" class="msg" :class="msg.role">
            <div class="msg-meta">
              <span class="msg-sender">{{ msg.role === 'user' ? '你' : 'ADAM' }}</span>
              <span class="msg-time">{{ msg.time }}</span>
            </div>
            <div class="msg-content" v-html="renderMarkdown(msg.content)"></div>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useAdamStore } from '@/stores/adam'

const adamStore = useAdamStore()

function handleActivate() {
  adamStore.activate()
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return '--:--'
  }
}

// ── 通讯功能 ──

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
.obs-home { display: flex; flex-direction: column; gap: 20px; }
.layer { width: 100%; }

/* ── 第一层 ── */
.status-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 20px 24px; }
.status-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.adam-identity { display: flex; align-items: center; gap: 12px; }
.life-indicator { position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
.life-ring { width: 12px; height: 12px; border-radius: 50%; }
.life-indicator.alive .life-ring { background: #00E5A0; box-shadow: 0 0 12px rgba(0,229,160,0.4); animation: lifeping 2.5s ease-in-out infinite; }
.life-indicator.dormant .life-ring { background: var(--dim); }
.life-indicator.survival .life-ring { background: #FF4D4D; box-shadow: 0 0 12px rgba(255,77,77,0.4); animation: lifeping 1.2s ease-in-out infinite; }
.life-indicator.shutdown .life-ring { background: var(--faint); }
@keyframes lifeping { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.6; } }
.adam-name { display: flex; flex-direction: column; gap: 2px; }
.name-main { font-size: 16px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; color: var(--dark); letter-spacing: 0.05em; }
.name-sub { font-size: 11px; color: var(--dim); }
.activate-btn { padding: 8px 20px; border-radius: 6px; border: 1px solid rgba(245,166,35,0.30); background: transparent; color: #F5A623; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.activate-btn:hover { background: #F5A623; color: #fff; box-shadow: 0 0 16px rgba(245,166,35,0.3); }
.metrics-row { display: flex; gap: 24px; flex-wrap: wrap; }
.metric { display: flex; flex-direction: column; gap: 4px; min-width: 80px; }
.metric-label { font-size: 10px; font-weight: 600; color: var(--dim); }
.metric-val { font-size: 18px; font-weight: 700; color: var(--dark); font-family: 'SF Mono', 'Fira Code', monospace; }
.metric-val.positive { color: #00E5A0; }
.metric-val.negative { color: #FF4D4D; }
.metric-val.credit { color: #F5A623; }

/* ── 第二层 ── */
.section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.panel-header { display: flex; align-items: baseline; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.panel-title { font-size: 12px; font-weight: 700; color: var(--dark); }
.panel-desc { font-size: 10px; color: var(--dim); }
.instruction-card { position: relative; padding: 16px; }
.instruction-glow { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #F5A623; box-shadow: 0 0 10px #F5A623; }
.instruction-body { padding-left: 12px; }
.instruction-title { font-size: 13px; font-weight: 600; color: var(--dark); margin-bottom: 6px; }
.instruction-thesis { font-size: 12px; color: var(--mid); margin-bottom: 4px; line-height: 1.5; }
.instruction-risk { font-size: 11px; color: rgba(255,77,77,0.60); margin-bottom: 12px; }
.instruction-actions { display: flex; gap: 8px; }
.btn-gold { padding: 6px 14px; border-radius: 5px; border: 1px solid rgba(245,166,35,0.30); background: transparent; color: #F5A623; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.btn-gold:hover { background: #F5A623; color: #fff; }
.btn-ghost { padding: 6px 14px; border-radius: 5px; border: 1px solid var(--border); background: transparent; color: var(--mid); font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.btn-ghost:hover { border-color: var(--dim); color: var(--dark); }
.event-list { padding: 8px 16px 12px; max-height: 280px; overflow-y: auto; }
.event-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); }
.event-item:last-child { border-bottom: none; }
.event-time { font-size: 10px; font-weight: 600; color: var(--dim); font-family: 'SF Mono', 'Fira Code', monospace; min-width: 36px; }
.event-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.event-dot.sense { background: #00D4FF; } .event-dot.judge { background: #F5A623; }
.event-dot.act { background: #00E5A0; } .event-dot.settle { background: #A78BFA; }
.event-dot.archive { background: var(--dim); }
.event-text { font-size: 12px; color: var(--mid); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-state { padding: 24px 16px; text-align: center; }
.empty-text { font-size: 12px; color: var(--dim); }

/* ── 第三层：通讯 ── */
.panel-chat {
  display: flex;
  flex-direction: column;
}
.chat-messages {
  min-height: 200px;
  max-height: 420px;
  overflow-y: auto;
  padding: 12px 16px;
}
.chat-empty { padding: 32px 16px; text-align: center; }
.chat-empty-text { font-size: 12px; color: var(--dim); margin: 0; }

/* 消息 */
.msg { padding: 6px 0; }
.msg-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
.msg-sender { font-size: 10px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.05em; }
.msg.user .msg-sender { color: var(--mid); }
.msg.assistant .msg-sender { color: #F5A623; }
.msg-time { font-size: 9px; color: var(--dim); font-family: 'SF Mono', 'Fira Code', monospace; }
.msg-content { font-size: 13px; line-height: 1.6; color: var(--dark); }
.msg.user .msg-content { color: var(--mid); }

/* 工具调用卡片 */
.tool-calls { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.tool-card { background: var(--faint); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; }
.tool-header { display: flex; align-items: center; gap: 6px; }
.tool-status-dot { width: 5px; height: 5px; border-radius: 50%; }
.tool-card.running .tool-status-dot { background: #00D4FF; animation: toolpulse 1s infinite; }
.tool-card.success .tool-status-dot { background: #00E5A0; }
.tool-card.error .tool-status-dot { background: #FF4D4D; }
@keyframes toolpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.tool-name { font-size: 10px; font-weight: 600; color: var(--mid); font-family: 'SF Mono', 'Fira Code', monospace; }
.tool-status-label { font-size: 9px; color: var(--dim); margin-left: auto; }
.tool-result { font-size: 11px; color: var(--dim); margin-top: 6px; line-height: 1.4; word-break: break-all; }

/* 加载动画 */
.typing-indicator { display: flex; gap: 4px; padding: 4px 0; }
.typing-indicator span { width: 5px; height: 5px; border-radius: 50%; background: #F5A623; animation: typing 1.2s ease-in-out infinite; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%,60%,100% { opacity: 0.2; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-4px); } }

/* 输入区 */
.chat-input-area { border-top: 1px solid var(--border); padding: 10px 16px; }
.disclaimer { font-size: 9px; color: var(--dim); text-align: center; margin-bottom: 8px; font-family: 'SF Mono', 'Fira Code', monospace; }
.input-row { display: flex; align-items: flex-end; gap: 8px; }
.chat-input {
  flex: 1; background: var(--faint); border: 1px solid var(--border); border-radius: 8px;
  padding: 10px 14px; color: var(--dark); font-size: 13px; font-family: inherit;
  resize: none; outline: none; transition: border-color 0.15s; line-height: 1.5;
}
.chat-input::placeholder { color: var(--dim); }
.chat-input:focus { border-color: rgba(245,166,35,0.25); }
.send-btn {
  width: 38px; height: 38px; border-radius: 8px; border: 1px solid rgba(245,166,35,0.25);
  background: transparent; color: #F5A623; display: flex; align-items: center;
  justify-content: center; cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.send-btn:hover:not(:disabled) { background: #F5A623; color: #fff; }
.send-btn:disabled { opacity: 0.25; cursor: not-allowed; }

@media (max-width: 767px) {
  .section-grid { grid-template-columns: 1fr; }
  .metrics-row { gap: 12px; }
  .metric { min-width: 60px; }
  .metric-val { font-size: 15px; }
  .chat-messages { max-height: 320px; }
}
</style>
