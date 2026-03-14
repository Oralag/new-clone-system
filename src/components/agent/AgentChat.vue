<template>
  <div class="agent-chat-wrap" :style="{ '--agent-color': agent.color }">

    <!-- 左：身份信息栏 -->
    <div class="agent-sidebar">
      <div class="agent-avatar">{{ agent.emoji }}</div>
      <div class="agent-name">{{ agent.name }}</div>
      <div class="agent-specialty">{{ agent.specialty }}</div>
      <div class="agent-status-dot" :class="{ active: streaming }">
        <span v-if="streaming" class="pulse"></span>
      </div>

      <!-- Quick prompts -->
      <div v-if="quickPrompts && quickPrompts.length > 0" class="qp-section">
        <div class="qp-label">快速开始</div>
        <div class="qp-list">
          <button
            v-for="qp in quickPrompts"
            :key="qp"
            class="qp-chip"
            @click="sendQuickPrompt(qp)"
          >{{ qp }}</button>
        </div>
      </div>

      <button v-if="messages.length > 0" class="btn-clear" @click="clearChat" title="清空对话">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        清空对话
      </button>
    </div>

    <!-- 右：对话区 -->
    <div class="agent-chat-right">
      <!-- Message Feed -->
      <div ref="feedRef" class="agent-feed">
        <div v-if="messages.length === 0" class="feed-empty">
          <div class="empty-emoji">{{ agent.emoji }}</div>
          <div class="empty-title">和 {{ agent.name }} 开始对话</div>
          <div class="empty-sub">{{ agent.specialty }} · 专业 AI 助理</div>
        </div>

        <template v-for="(msg, idx) in messages" :key="idx">
          <div v-if="msg.role === 'user'" class="msg msg-user">
            <div class="msg-bubble user-bubble">{{ msg.content }}</div>
          </div>
          <div v-else-if="msg.role === 'assistant'" class="msg msg-assistant">
            <div class="msg-agent-avatar">{{ agent.emoji }}</div>
            <div class="msg-body">
              <template v-for="(tc, ti) in msg.toolCalls" :key="ti">
                <div class="tool-chip" :class="tc.status">
                  <span class="tool-icon">{{ tc.status === 'running' ? '⚙' : tc.status === 'done' ? '✓' : '⚠' }}</span>
                  <span class="tool-name">{{ formatToolName(tc.name) }}</span>
                  <span v-if="tc.status === 'running'" class="tool-spin"></span>
                </div>
              </template>
              <div v-if="msg.content || (msg.streaming && !msg.content)" class="msg-bubble assistant-bubble">
                <span v-html="renderMd(msg.content)"></span>
                <span v-if="msg.streaming" class="cursor-blink">▌</span>
              </div>
            </div>
          </div>
        </template>

        <div v-if="lastError" class="feed-error">{{ lastError }}</div>
      </div>

      <!-- Compose -->
      <div class="agent-compose">
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="compose-input"
          :placeholder="`问 ${agent.name} 任何问题...`"
          rows="1"
          @keydown.enter.prevent="onEnter"
          @input="autoResize"
        ></textarea>
        <button class="compose-send" :disabled="!inputText.trim() || streaming" @click="sendMessage">
          <svg v-if="!streaming" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21L23 12 2 3v7l15 2-15 2z"/></svg>
          <span v-else class="send-spin"></span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { AGENTS } from '@/server/agents/agentRegistry'
import { marked } from 'marked'

const props = defineProps<{
  agentId: string
  quickPrompts?: string[]
}>()

const emit = defineEmits<{
  (e: 'streaming-change', v: boolean): void
  (e: 'message-sent'): void
}>()

const agent = computed(() => AGENTS[props.agentId] ?? AGENTS.copywriter)

interface ToolCall {
  id: string
  name: string
  status: 'running' | 'done' | 'error'
}
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  streaming?: boolean
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const streaming = ref(false)
const lastError = ref('')
const feedRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()

function renderMd(text: string) {
  if (!text) return ''
  return marked.parse(text) as string
}

function formatToolName(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function autoResize() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function scrollToBottom() {
  nextTick(() => {
    if (feedRef.value) feedRef.value.scrollTop = feedRef.value.scrollHeight
  })
}

function sendQuickPrompt(prompt: string) {
  inputText.value = prompt
  sendMessage()
}

function onEnter(e: KeyboardEvent) {
  if (e.shiftKey) return
  sendMessage()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || streaming.value) return

  inputText.value = ''
  lastError.value = ''
  if (inputRef.value) { inputRef.value.style.height = 'auto' }

  messages.value.push({ role: 'user', content: text })
  const assistantMsg: ChatMessage = { role: 'assistant', content: '', toolCalls: [], streaming: true }
  messages.value.push(assistantMsg)
  scrollToBottom()

  streaming.value = true
  emit('streaming-change', true)

  const token = localStorage.getItem('erp_token') || ''
  // Build conversation history (excluding the current empty assistant msg)
  const history = messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content }))

  try {
    const resp = await fetch('/api/agent-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-erp-token': token,
        'x-agent-id': props.agentId,
      },
      body: JSON.stringify({ messages: history, agentId: props.agentId }),
    })

    if (!resp.ok) {
      const err = await resp.json()
      throw new Error(err.error || `HTTP ${resp.status}`)
    }

    const reader = resp.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break
        try {
          const ev = JSON.parse(raw)
          if (ev.type === 'text') {
            assistantMsg.content += ev.text
            scrollToBottom()
          } else if (ev.type === 'tool_start') {
            assistantMsg.toolCalls!.push({ id: ev.id, name: ev.name, status: 'running' })
            scrollToBottom()
          } else if (ev.type === 'tool_result') {
            const tc = assistantMsg.toolCalls!.find(t => t.id === ev.id)
            if (tc) tc.status = 'done'
          } else if (ev.type === 'error') {
            lastError.value = ev.error
          }
        } catch {}
      }
    }
  } catch (e: any) {
    lastError.value = e.message || '请求失败'
  } finally {
    assistantMsg.streaming = false
    streaming.value = false
    emit('streaming-change', false)
    emit('message-sent')
    scrollToBottom()
  }
}

async function loadMemory() {
  const token = localStorage.getItem('erp_token') || ''
  if (!token) return
  try {
    const resp = await fetch(`/api/agent-chat?agentId=${props.agentId}`, {
      headers: { 'x-erp-token': token },
    })
    if (resp.ok) {
      const saved = await resp.json()
      if (Array.isArray(saved) && saved.length > 0) {
        messages.value = saved.map((m: any) => ({
          role: m.role,
          content: m.content,
          toolCalls: [],
          streaming: false,
        }))
      }
    }
  } catch {}
}

async function clearMemory() {
  const token = localStorage.getItem('erp_token') || ''
  if (token) {
    try {
      await fetch(`/api/agent-chat?agentId=${props.agentId}`, {
        method: 'DELETE',
        headers: { 'x-erp-token': token },
      })
    } catch {}
  }
  messages.value = []
  lastError.value = ''
}

function clearChat() {
  clearMemory()
}

onMounted(() => {
  loadMemory()
  nextTick(() => inputRef.value?.focus())
})

defineExpose({ sendQuickPrompt, clearChat })
</script>

<style scoped>
/* ── Outer shell: left sidebar + right chat ── */
.agent-chat-wrap {
  display: flex;
  flex-direction: row;
  height: 100%;
  min-height: 500px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
}

/* ── Left sidebar ── */
.agent-sidebar {
  width: 180px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--agent-color, #6366f1) 4%, white);
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 16px;
  gap: 6px;
}

.agent-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--agent-color, #6366f1) 12%, white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  border: 1.5px solid color-mix(in srgb, var(--agent-color, #6366f1) 25%, white);
  margin-bottom: 6px;
}

.agent-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  line-height: 1.3;
}
.agent-specialty {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  margin-top: 1px;
}

.agent-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  flex-shrink: 0;
  position: relative;
  margin-top: 6px;
}
.agent-status-dot.active { background: #22c55e; }
.pulse {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: #22c55e;
  opacity: 0.3;
  animation: pulse 1.5s ease-out infinite;
}
@keyframes pulse { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.2); opacity: 0; } }

.btn-clear {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  transition: color 0.15s;
  margin-top: auto;
  align-self: stretch;
  justify-content: center;
  align-items: center;
}
.btn-clear:hover { color: #94a3b8; }

/* ── Quick Prompts (in sidebar) ── */
.qp-section {
  width: 100%;
  margin-top: 12px;
}
.qp-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; text-align: center; }
.qp-list { display: flex; flex-direction: column; gap: 5px; }
.qp-chip {
  padding: 5px 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  line-height: 1.4;
  white-space: normal;
  word-break: keep-all;
}
.qp-chip:hover {
  border-color: var(--agent-color, #6366f1);
  color: var(--agent-color, #6366f1);
  background: color-mix(in srgb, var(--agent-color, #6366f1) 6%, white);
}

/* ── Right column ── */
.agent-chat-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ── Feed ── */
.agent-feed {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 300px;
}

.feed-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  color: #94a3b8;
  padding: 40px 0;
}
.empty-emoji { font-size: 40px; margin-bottom: 4px; }
.empty-title { font-size: 15px; font-weight: 600; color: #475569; }
.empty-sub { font-size: 12px; }

/* ── Messages ── */
.msg { display: flex; gap: 10px; align-items: flex-start; }
.msg-user { flex-direction: row-reverse; }
.msg-assistant { flex-direction: row; }

.msg-agent-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--agent-color, #6366f1) 12%, white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  border: 1px solid color-mix(in srgb, var(--agent-color, #6366f1) 20%, white);
}

.msg-body { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; max-width: 85%; }

.msg-bubble {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}
.user-bubble {
  background: var(--agent-color, #6366f1);
  color: #fff;
  border-radius: 14px 4px 14px 14px;
  max-width: 75%;
  margin-left: auto;
}
.assistant-bubble {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  border-radius: 4px 14px 14px 14px;
}
.assistant-bubble :deep(p) { margin: 0 0 8px; }
.assistant-bubble :deep(p:last-child) { margin-bottom: 0; }
.assistant-bubble :deep(ul), .assistant-bubble :deep(ol) { margin: 6px 0; padding-left: 20px; }
.assistant-bubble :deep(li) { margin-bottom: 3px; }
.assistant-bubble :deep(h1), .assistant-bubble :deep(h2), .assistant-bubble :deep(h3) { margin: 10px 0 6px; font-size: 1em; }
.assistant-bubble :deep(strong) { font-weight: 700; }
.assistant-bubble :deep(code) { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
.assistant-bubble :deep(pre) { background: #f1f5f9; padding: 10px; border-radius: 8px; overflow-x: auto; }
.assistant-bubble :deep(blockquote) { border-left: 3px solid #e2e8f0; padding-left: 10px; color: #64748b; margin: 6px 0; }

/* ── Tool calls ── */
.tool-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
  width: fit-content;
}
.tool-chip.running { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.tool-chip.done { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.tool-chip.error { background: #fef2f2; border-color: #fecaca; color: #991b1b; }

.tool-spin {
  width: 10px;
  height: 10px;
  border: 1.5px solid #f59e0b;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Error ── */
.feed-error {
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 13px;
}

/* ── Compose ── */
.agent-compose {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 14px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
}

.compose-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #1e293b;
  resize: none;
  line-height: 1.6;
  font-family: inherit;
  max-height: 160px;
  overflow-y: auto;
  padding: 4px 0;
}
.compose-input::placeholder { color: #94a3b8; }

.compose-send {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: var(--agent-color, #6366f1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.compose-send:disabled { opacity: 0.4; cursor: not-allowed; }
.compose-send:not(:disabled):hover { opacity: 0.85; }

.send-spin {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

.cursor-blink {
  animation: blink 1s step-end infinite;
  color: var(--agent-color, #6366f1);
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
</style>
