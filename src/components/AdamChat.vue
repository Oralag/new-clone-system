<template>
  <div class="panel panel-chat" :class="{ collapsed: isCollapsed }">
    <div class="panel-head" @click="isCollapsed = !isCollapsed" style="cursor:pointer">
      <span class="panel-icon chat-icon">⟐</span>
      <span class="panel-title">COMM_CHANNEL</span>
      <span class="panel-desc">与亚当通讯</span>
      <span class="comm-status" :class="{ online: adamStore.isAlive }">
        {{ adamStore.isAlive ? 'CONNECTED' : 'OFFLINE' }}
      </span>
      <span class="collapse-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline :points="isCollapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15'" />
        </svg>
      </span>
    </div>

    <div v-show="!isCollapsed" ref="messagesDiv" class="chat-messages">
      <div v-if="messages.length === 0" class="chat-empty">
        <div class="chat-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p class="chat-empty-title">通讯通道已就绪</p>
        <p class="chat-empty-text">亚当是决策者，你是操作手。他会主动找你，你也可以找他。</p>
      </div>

      <div v-for="msg in messages" :key="msg.id" class="msg" :class="msg.role">
        <div class="msg-header">
          <span class="msg-avatar" :class="msg.role">
            <img v-if="msg.role === 'assistant'" :src="adamAvatarUrl" class="adam-msg-img" alt="亚当" />
            <template v-else>U</template>
          </span>
          <span class="msg-sender">{{ msg.role === 'user' ? 'OPERATOR' : 'ADAM' }}</span>
          <span class="msg-time">{{ msg.time }}</span>
        </div>
        <div class="msg-content" v-html="renderMarkdown(msg.content)"></div>
        <div v-if="msg.images?.length" class="msg-images">
          <img v-for="(url, i) in msg.images" :key="i" :src="url" class="msg-img-thumb" />
        </div>

        <div v-if="msg.toolCalls?.length" class="tool-calls">
          <div v-for="call in msg.toolCalls" :key="call.id" class="tool-card" :class="call.status">
            <div class="tool-header">
              <span class="tool-status-indicator"></span>
              <span class="tool-fn">{{ call.name }}</span>
              <span class="tool-status-label">
                {{ call.status === 'running' ? 'EXECUTING' : call.status === 'success' ? 'DONE' : 'FAILED' }}
              </span>
            </div>
            <div v-if="call.result" class="tool-result" style="display:none"></div>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="msg assistant">
        <div class="msg-header">
          <span class="msg-avatar assistant">
            <img :src="adamAvatarUrl" class="adam-msg-img" alt="亚当" />
          </span>
          <span class="msg-sender">ADAM</span>
        </div>
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <div v-show="!isCollapsed" class="chat-input-area">
      <div class="disclaimer">AI ANALYSIS · NOT INVESTMENT ADVICE · RISK ASSUMED</div>
      <div v-if="pendingImages.length" class="pending-images">
        <div v-for="(img, idx) in pendingImages" :key="idx" class="pending-img-wrap">
          <img :src="img.previewUrl" class="pending-img" />
          <button class="pending-img-remove" @click="removePendingImage(idx)">×</button>
        </div>
      </div>
      <div class="input-row">
        <button class="img-btn" title="发送图片" @click="openImagePicker" :disabled="isLoading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="chat-input"
          placeholder="对亚当说话...（可粘贴图片）"
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @input="autoResize"
          @paste="onPaste"
        />
        <button class="send-btn" :disabled="(!inputText.trim() && !pendingImages.length) || isLoading" @click="handleSend">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/>
          </svg>
        </button>
      </div>
      <input ref="fileInputRef" type="file" accept="image/*" multiple style="display:none" @change="onFileChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useAdamStore } from '@/stores/adam'
import { applyToolResult } from '@/utils/adamToolSync'
import { marked } from 'marked'
import adamAvatarUrl from '@/assets/adam-avatar.png'

marked.setOptions({ breaks: true, gfm: true })

const adamStore = useAdamStore()

interface ToolCallState {
  id: string
  name: string
  input: Record<string, any>
  result?: string
  status: 'running' | 'success' | 'error'
}

interface ImageItem {
  previewUrl: string
  data: string
  mediaType: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  images?: string[]
  toolCalls?: ToolCallState[]
}

const HISTORY_KEY = 'adam_chat_history'
const MAX_HISTORY = 80

const messagesDiv = ref<HTMLDivElement>()
const inputRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isLoading = ref(false)
const pendingImages = ref<ImageItem[]>([])
const isCollapsed = ref(true)

let pollTimer: number | undefined

onMounted(async () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) messages.value = JSON.parse(raw)
  } catch { /* ignore */ }

  if (adamStore.core.status === 'alive') {
    triggerWakeup()
    pollTimer = window.setInterval(pollMessages, 30 * 1000)
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

async function triggerWakeup() {
  const token = localStorage.getItem('erp_token') || ''
  try {
    await fetch('/api/adam/wakeup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ adamState: { ...adamStore.core } }),
    })
    setTimeout(pollMessages, 3000)
  } catch { /* ignore */ }
}

async function pollMessages() {
  const token = localStorage.getItem('erp_token') || ''
  try {
    const res = await fetch('/api/adam/messages', {
      headers: { 'x-erp-token': token },
    })
    if (!res.ok) return
    const data = await res.json() as { messages: Array<{ id: string; content: string; toolCalls?: any[]; timestamp: string }> }
    if (!data.messages?.length) return

    for (const msg of data.messages) {
      const chatMsg: ChatMessage = {
        id: msg.id,
        role: 'assistant',
        content: msg.content,
        time: formatMsgTime(msg.timestamp),
        toolCalls: msg.toolCalls?.map(tc => ({
          id: `tc_${Math.random().toString(36).slice(2)}`,
          name: tc.name,
          input: {},
          result: tc.result,
          status: 'success' as const,
        })),
      }
      messages.value.push(chatMsg)
    }
    isCollapsed.value = false
    persistHistory()
    scrollToBottom()
  } catch { /* ignore */ }
}

function formatMsgTime(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return nowStr()
  }
}

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
  return marked.parse(text) as string
}

async function handleSend() {
  const text = inputText.value.trim()
  if ((!text && !pendingImages.value.length) || isLoading.value) return

  const imagesToSend = [...pendingImages.value]
  const previewUrls = imagesToSend.map(i => i.previewUrl)

  const userMsg: ChatMessage = {
    id: `u_${Date.now()}`,
    role: 'user',
    content: text || '请分析这张图片。',
    time: nowStr(),
    images: previewUrls.length ? previewUrls : undefined,
  }
  messages.value.push(userMsg)
  inputText.value = ''
  pendingImages.value = []
  if (inputRef.value) inputRef.value.style.height = 'auto'
  isCollapsed.value = false
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
        images: imagesToSend.length > 0
          ? imagesToSend.map(i => ({ data: i.data, mediaType: i.mediaType }))
          : undefined,
        adamState: { ...adamStore.core },
        books: adamStore.books,
      }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    messages.value.push(assistantMsg)
    scrollToBottom()

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let streamDone = false

    while (reader && !streamDone) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') { streamDone = true; break }

        try {
          const data = JSON.parse(payload)
          if (data.type === 'text') {
            assistantMsg.content += data.text
            scrollToBottom()
          } else if (data.type === 'tool_start') {
            if (data.name === 'update_emotion') continue
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
            if (data.result) {
              applyToolResult(adamStore, data.name, data.result)
            }
            scrollToBottom()
          } else if (data.type === 'error') {
            assistantMsg.content += `\n[ERROR: ${data.error}]`
            scrollToBottom()
          }
        } catch { /* ignore parse error */ }
      }
    }
  } catch (e: any) {
    if (!assistantMsg.content) {
      assistantMsg.content = `CONNECTION_FAILED: ${e.message}`
    }
    if (!messages.value.includes(assistantMsg)) {
      messages.value.push(assistantMsg)
    }
  } finally {
    isLoading.value = false
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    persistHistory()
    scrollToBottom()
  }
}

function openImagePicker() {
  fileInputRef.value?.click()
}

function compressToJpeg(file: File): Promise<{ data: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        const data = dataUrl.split(',')[1]
        const previewUrl = URL.createObjectURL(file)
        resolve({ data, previewUrl })
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    const { data, previewUrl } = await compressToJpeg(file)
    pendingImages.value.push({ previewUrl, data, mediaType: 'image/jpeg' })
  }
  ;(e.target as HTMLInputElement).value = ''
}

async function onPaste(e: ClipboardEvent) {
  const items = Array.from(e.clipboardData?.items ?? []).filter(i => i.type.startsWith('image/'))
  for (const item of items) {
    const file = item.getAsFile()
    if (!file) continue
    const { data, previewUrl } = await compressToJpeg(file)
    pendingImages.value.push({ previewUrl, data, mediaType: 'image/jpeg' })
  }
}

function removePendingImage(idx: number) {
  URL.revokeObjectURL(pendingImages.value[idx].previewUrl)
  pendingImages.value.splice(idx, 1)
}
</script>

<style scoped>
.panel {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(245,166,35,0.02) 0%, transparent 100%);
}
.panel-icon { font-size: 10px; color: #F5A623; opacity: 0.6; }
.chat-icon { color: #00D4FF; }
.panel-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.panel-desc { font-size: 10px; color: var(--dim); opacity: 0.5; }
.comm-status {
  margin-left: auto;
  font-size: 8px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: 3px;
  background: var(--faint);
  color: var(--dim);
}
.comm-status.online { color: #00E5A0; background: rgba(0,229,160,0.06); }

.collapse-btn {
  margin-left: 8px;
  color: var(--dim);
  opacity: 0.5;
  display: flex;
  align-items: center;
  transition: opacity 0.15s;
}
.panel-head:hover .collapse-btn { opacity: 1; }

.chat-messages {
  min-height: 160px;
  max-height: 380px;
  overflow-y: auto;
  padding: 14px 16px;
  scrollbar-width: thin;
}
.chat-empty {
  padding: 40px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.chat-empty-icon { color: var(--dim); }
.chat-empty-title { font-size: 11px; font-weight: 600; color: var(--mid); margin: 0; }
.chat-empty-text { font-size: 11px; color: var(--dim); margin: 0; opacity: 0.6; max-width: 300px; line-height: 1.5; }

.msg { padding: 8px 0; }
.msg + .msg { border-top: 1px solid var(--border); }
.msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.msg-avatar {
  width: 20px; height: 20px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 800;
  font-family: 'SF Mono', 'Fira Code', monospace;
  flex-shrink: 0;
}
.msg-avatar.user { background: var(--faint); color: var(--mid); border: 1px solid var(--border); }
.msg-avatar.assistant { background: rgba(245,166,35,0.10); color: #F5A623; border: 1px solid rgba(245,166,35,0.20); overflow: hidden; padding: 0; }
.adam-msg-img { width: 100%; height: 100%; object-fit: contain; display: block; }
.msg-sender { font-size: 10px; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.06em; }
.msg.user .msg-sender { color: var(--mid); }
.msg.assistant .msg-sender { color: #F5A623; }
.msg-time { font-size: 8px; color: var(--dim); font-family: 'SF Mono', 'Fira Code', monospace; opacity: 0.5; }
.msg-content { font-size: 13px; line-height: 1.65; color: var(--dark); padding-left: 28px; }
.msg.user .msg-content { color: var(--mid); }

.msg-content :deep(p) { margin: 0 0 6px; }
.msg-content :deep(p:last-child) { margin-bottom: 0; }
.msg-content :deep(ul), .msg-content :deep(ol) { margin: 4px 0; padding-left: 20px; }
.msg-content :deep(li) { margin: 2px 0; }
.msg-content :deep(code) { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; background: var(--faint); padding: 1px 4px; border-radius: 3px; color: #F5A623; }
.msg-content :deep(pre) { background: var(--faint); border: 1px solid var(--border); border-radius: 4px; padding: 8px 10px; overflow-x: auto; margin: 6px 0; }
.msg-content :deep(pre code) { background: none; padding: 0; }
.msg-content :deep(strong) { color: var(--dark); }
.msg-content :deep(a) { color: #00D4FF; text-decoration: none; }
.msg-content :deep(a:hover) { text-decoration: underline; }
.msg-content :deep(blockquote) { border-left: 2px solid #F5A623; margin: 6px 0; padding: 4px 10px; color: var(--dim); }

.msg-images { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.msg-img-thumb { max-width: 200px; max-height: 160px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border); }

.tool-calls { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; padding-left: 28px; }
.tool-card { background: var(--faint); border: 1px solid var(--border); border-radius: 4px; padding: 8px 10px; font-family: 'SF Mono', 'Fira Code', monospace; }
.tool-header { display: flex; align-items: center; gap: 6px; }
.tool-status-indicator { width: 5px; height: 5px; border-radius: 50%; }
.tool-card.running .tool-status-indicator { background: #00D4FF; animation: indicatorPulse 1s infinite; }
.tool-card.success .tool-status-indicator { background: #00E5A0; }
.tool-card.error .tool-status-indicator { background: #FF4D4D; }
@keyframes indicatorPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
.tool-fn { font-size: 10px; font-weight: 600; color: var(--mid); }
.tool-status-label { font-size: 8px; font-weight: 700; letter-spacing: 0.08em; margin-left: auto; }
.tool-card.running .tool-status-label { color: #00D4FF; }
.tool-card.success .tool-status-label { color: #00E5A0; }
.tool-card.error .tool-status-label { color: #FF4D4D; }

.typing-indicator { display: flex; gap: 4px; padding: 6px 0 6px 28px; }
.typing-indicator span { width: 5px; height: 5px; border-radius: 50%; background: #F5A623; animation: typing 1.2s ease-in-out infinite; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing {
  0%, 60%, 100% { opacity: 0.15; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

.chat-input-area {
  border-top: 1px solid var(--border);
  padding: 10px 16px;
  background: linear-gradient(180deg, transparent 0%, rgba(245,166,35,0.01) 100%);
}
.disclaimer { font-size: 8px; color: var(--dim); text-align: center; margin-bottom: 8px; font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.12em; opacity: 0.4; }
.input-row { display: flex; align-items: flex-end; gap: 8px; }
.img-btn {
  flex-shrink: 0; width: 32px; height: 32px; border-radius: 6px;
  border: 1px solid var(--border); background: var(--faint); color: var(--mid);
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.15s;
}
.img-btn:hover:not(:disabled) { color: #F5A623; border-color: #F5A623; }
.img-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pending-images { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.pending-img-wrap { position: relative; }
.pending-img { width: 56px; height: 56px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); }
.pending-img-remove {
  position: absolute; top: -4px; right: -4px; width: 16px; height: 16px;
  border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff;
  font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;
}
.chat-input {
  flex: 1; background: var(--faint); border: 1px solid var(--border); border-radius: 6px;
  padding: 10px 14px; color: var(--dark); font-size: 13px; font-family: inherit;
  resize: none; outline: none; transition: border-color 0.2s, box-shadow 0.2s; line-height: 1.5;
}
.chat-input::placeholder { color: var(--dim); opacity: 0.5; }
.chat-input:focus { border-color: rgba(245,166,35,0.25); box-shadow: 0 0 0 2px rgba(245,166,35,0.06); }
.send-btn {
  width: 36px; height: 36px; border-radius: 6px; border: 1px solid rgba(245,166,35,0.25);
  background: transparent; color: #F5A623; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.send-btn:hover:not(:disabled) { background: #F5A623; color: var(--card-bg); box-shadow: 0 0 12px rgba(245,166,35,0.2); }
.send-btn:disabled { opacity: 0.2; cursor: not-allowed; }

@media (max-width: 767px) {
  .chat-messages { max-height: 280px; }
}
</style>
