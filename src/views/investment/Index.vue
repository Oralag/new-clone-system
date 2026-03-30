<template>
  <div class="obs-home">
    <!-- ── 第一层：亚当生命核心 ── -->
    <div class="layer layer-status">
      <div class="status-card">
        <!-- 极细网格纹理 -->
        <div class="card-grid-texture"></div>

        <div class="status-header">
          <div class="adam-identity">
            <!-- 亚当头像 + 状态光环 -->
            <div class="life-indicator" :class="adamStore.core.status">
              <span class="life-orbit orbit-1"></span>
              <span class="life-orbit orbit-2"></span>
              <img :src="adamAvatarUrl" class="adam-identity-img" alt="亚当" />
            </div>
            <div class="adam-name">
              <span class="name-main">ADAM <span class="name-id">#1</span></span>
              <span class="name-sub">DIGITAL_LIFE · ENTITY_001</span>
            </div>
          </div>
          <div class="header-right">
            <div class="sys-tag" :class="adamStore.core.status">
              <span class="sys-dot"></span>
              <span class="sys-label">{{ sysLabel }}</span>
            </div>
            <button v-if="adamStore.core.status === 'dormant'" class="activate-btn" @click="handleActivate">
              <span class="activate-glow"></span>
              <span class="activate-text">ACTIVATE</span>
            </button>
          </div>
        </div>

        <!-- 核心指标条 -->
        <div class="metrics-strip">
          <div class="metric-block">
            <span class="metric-key">NET_WORTH</span>
            <span class="metric-val" :class="{ positive: adamStore.core.netWorth > 0, negative: adamStore.core.netWorth < 0 }">
              ¥{{ adamStore.core.netWorth.toLocaleString() }}
            </span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">BUDGET</span>
            <span class="metric-val">¥{{ adamStore.core.budget.toLocaleString() }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">CREDIT</span>
            <span class="metric-val credit">{{ adamStore.core.creditLevel }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">ALIVE</span>
            <span class="metric-val">{{ adamStore.core.survivalDays }}<span class="metric-unit">d</span></span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-block">
            <span class="metric-key">ENERGY</span>
            <div class="energy-bar-wrap">
              <div class="energy-bar" :style="{ width: adamStore.core.energy + '%' }" :class="{ low: adamStore.core.energy < 30 }"></div>
            </div>
            <span class="metric-val energy-num">{{ adamStore.core.energy }}%</span>
          </div>
        </div>

        <!-- 情绪频谱条 -->
        <div class="emotion-strip">
          <span class="emotion-label">EMOTION_SPECTRUM</span>
          <div class="emotion-bars">
            <div v-for="(val, key) in adamStore.core.emotionState" :key="key" class="emotion-item" :title="emotionLabels[key] || key">
              <div class="emotion-bar-bg">
                <div class="emotion-bar-fill" :style="{ height: Math.max(val, 2) + '%' }" :class="emotionColor(key as string)"></div>
              </div>
              <span class="emotion-name">{{ (emotionLabels[key] || key).slice(0, 2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 第二层：指令 + 事件日志 ── -->
    <div class="layer layer-panels">
      <div class="dual-grid">
        <!-- 最新指令 -->
        <div class="panel panel-instruction">
          <div class="panel-head">
            <span class="panel-icon">◈</span>
            <span class="panel-title">LATEST_DIRECTIVE</span>
          </div>
          <div v-if="adamStore.latestRecommendation" class="instruction-card">
            <div class="instruction-glow-bar"></div>
            <div class="instruction-body">
              <div class="instruction-meta">
                <span class="instruction-conf" v-if="adamStore.latestRecommendation.confidence">
                  CONF: {{ (adamStore.latestRecommendation.confidence * 100).toFixed(0) }}%
                </span>
                <span class="instruction-time">{{ formatTime(adamStore.latestRecommendation.issuedAt) }}</span>
              </div>
              <div class="instruction-title">{{ adamStore.latestRecommendation.title }}</div>
              <div class="instruction-thesis">{{ adamStore.latestRecommendation.thesis }}</div>
              <div v-if="adamStore.latestRecommendation.riskNote" class="instruction-risk">
                <span class="risk-icon">⚠</span> {{ adamStore.latestRecommendation.riskNote }}
              </div>
              <div class="instruction-actions">
                <button class="btn-gold" @click="handleAdoptRecommendation">
                  <span class="btn-glow"></span>
                  已执行
                </button>
                <button class="btn-ghost" @click="handleSkipRecommendation">跳过</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">◇</div>
            <span class="empty-text">AWAITING_DIRECTIVE</span>
            <span class="empty-sub">亚当尚未发出指令</span>
          </div>
        </div>

        <!-- 事件日志 -->
        <div class="panel panel-log">
          <div class="panel-head">
            <span class="panel-icon">◉</span>
            <span class="panel-title">EVENT_LOG</span>
            <span class="panel-count" v-if="adamStore.recentEvents.length">{{ adamStore.recentEvents.length }}</span>
          </div>
          <div class="event-list">
            <div v-for="(event, idx) in adamStore.recentEvents.slice(0, 12)" :key="event.id" class="event-item">
              <div class="event-timeline">
                <span class="event-dot" :class="event.stage"></span>
                <span v-if="idx < Math.min(adamStore.recentEvents.length, 12) - 1" class="event-line"></span>
              </div>
              <span class="event-time">{{ formatTime(event.at) }}</span>
              <span class="event-stage-tag" :class="event.stage">{{ stageLabel(event.stage) }}</span>
              <span class="event-text">{{ event.title }}</span>
            </div>
            <div v-if="adamStore.recentEvents.length === 0" class="empty-state">
              <div class="empty-icon">○</div>
              <span class="empty-text">NO_EVENTS</span>
              <span class="empty-sub">等待亚当的第一个动作</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 第三层：通讯终端 ── -->
    <div class="layer layer-chat">
      <div class="panel panel-chat">
        <div class="panel-head">
          <span class="panel-icon chat-icon">⟐</span>
          <span class="panel-title">COMM_CHANNEL</span>
          <span class="panel-desc">与亚当通讯</span>
          <span class="comm-status" :class="{ online: adamStore.isAlive }">
            {{ adamStore.isAlive ? 'CONNECTED' : 'OFFLINE' }}
          </span>
        </div>

        <div ref="messagesDiv" class="chat-messages">
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
                <div v-if="call.result" class="tool-result" style="display:none">
                </div>
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

        <div class="chat-input-area">
          <div class="disclaimer">AI ANALYSIS · NOT INVESTMENT ADVICE · RISK ASSUMED</div>
          <!-- 待发送图片预览 -->
          <div v-if="pendingImages.length" class="pending-images">
            <div v-for="(img, idx) in pendingImages" :key="idx" class="pending-img-wrap">
              <img :src="img.previewUrl" class="pending-img" />
              <button class="pending-img-remove" @click="removePendingImage(idx)">×</button>
            </div>
          </div>
          <div class="input-row">
            <!-- 图片上传按钮 -->
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
          <!-- 隐藏 file input -->
          <input ref="fileInputRef" type="file" accept="image/*" multiple style="display:none" @change="onFileChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useAdamStore } from '@/stores/adam'
import { applyToolResult } from '@/utils/adamToolSync'
import { marked } from 'marked'
import adamAvatarUrl from '@/assets/adam-avatar.png'

// marked 配置：不换行产生段落，安全输出
marked.setOptions({ breaks: true, gfm: true })

const adamStore = useAdamStore()

const sysLabel = computed(() => {
  const map: Record<string, string> = { dormant: 'DORMANT', alive: 'SYS.ONLINE', survival: 'SURVIVAL', shutdown: 'SHUTDOWN' }
  return map[adamStore.core.status] || 'UNKNOWN'
})

const emotionLabels: Record<string, string> = {
  joy: '喜悦', anger: '愤怒', sorrow: '悲伤', fear: '恐惧',
  love: '热爱', disgust: '厌恶', desire: '渴望',
}

function emotionColor(key: string) {
  const map: Record<string, string> = {
    joy: 'em-gold', anger: 'em-red', sorrow: 'em-blue', fear: 'em-purple',
    love: 'em-pink', disgust: 'em-gray', desire: 'em-cyan',
  }
  return map[key] || 'em-gold'
}

function stageLabel(stage: string) {
  const map: Record<string, string> = { sense: 'SENSE', judge: 'JUDGE', act: 'ACT', settle: 'SETTLE', archive: 'ARCHIVE' }
  return map[stage] || stage.toUpperCase()
}

function handleActivate() {
  adamStore.activate()
}

function handleAdoptRecommendation() {
  const rec = adamStore.latestRecommendation
  if (!rec || rec.status === 'adopted' || rec.status === 'executed') return
  rec.status = 'adopted'
  const now = new Date().toISOString()
  const evtId = `evt_adopt_${Date.now()}`
  adamStore.addEvent({
    id: evtId,
    type: 'recommendation_adopted',
    stage: 'act',
    title: `已执行指令: ${rec.title}`,
    summary: rec.thesis?.slice(0, 60) || '',
    at: now,
    institutionId: 'bureau',
  })
  rec.linkedEventIds.push(evtId)
  adamStore.persist()
}

function handleSkipRecommendation() {
  const rec = adamStore.latestRecommendation
  if (!rec || rec.status === 'adopted' || rec.status === 'executed') return
  rec.status = 'archived'
  const now = new Date().toISOString()
  adamStore.addEvent({
    id: `evt_skip_${Date.now()}`,
    type: 'archive_recorded',
    stage: 'archive',
    title: `跳过指令: ${rec.title}`,
    summary: '规则传递者选择跳过',
    at: now,
    institutionId: 'bureau',
  })
  if (adamStore.core.recommendationAccuracy > 0) {
    adamStore.core.recommendationAccuracy = Math.max(0, adamStore.core.recommendationAccuracy - 2)
  }
  adamStore.persist()
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

interface ImageItem {
  previewUrl: string
  data: string       // base64（不含前缀）
  mediaType: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  images?: string[]  // previewUrl 列表，仅用于显示
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

onMounted(() => {
  // 刷新存活天数
  adamStore.refreshSurvivalDays()
  survivalTimer = window.setInterval(() => adamStore.refreshSurvivalDays(), 60 * 60 * 1000) // 每小时刷新

  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) messages.value = JSON.parse(raw)
  } catch { /* ignore */ }

  // 亚当主动留言系统
  if (adamStore.core.status === 'alive') {
    triggerWakeup()                                            // 进入页面触发一次唤醒
    pollTimer = window.setInterval(pollMessages, 30 * 1000)   // 每30秒轮询未读消息
  }
})

let survivalTimer: number | undefined
let pollTimer: number | undefined

onUnmounted(() => {
  if (survivalTimer) clearInterval(survivalTimer)
  if (pollTimer) clearInterval(pollTimer)
})

// ── 亚当主动留言 ────────────────────────────────────────────────────────────

async function triggerWakeup() {
  const token = localStorage.getItem('erp_token') || ''
  try {
    await fetch('/api/adam/wakeup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ adamState: { ...adamStore.core } }),
    })
    // wakeup 成功后稍等片刻再 poll（给 KV 写入留点时间）
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
            // 工具结果 → 回写 adamStore
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

// ── 图片处理 ──────────────────────────────────────────────────────────────

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
}</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   黑曜石观测舱 — Index.vue
   Bloomberg Terminal + Vercel Dashboard aesthetic
   ═══════════════════════════════════════════════════ */

.obs-home {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.layer { width: 100%; }

/* ── 共用面板 ── */
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
.panel-icon {
  font-size: 10px;
  color: #F5A623;
  opacity: 0.6;
}
.panel-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.panel-desc {
  font-size: 10px;
  color: var(--dim);
  opacity: 0.5;
}
.panel-count {
  margin-left: auto;
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  background: var(--faint);
  padding: 1px 6px;
  border-radius: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* ═══════════════════════════════════════
   第一层：亚当生命核心
   ═══════════════════════════════════════ */
.status-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px 24px 16px;
  overflow: hidden;
}

/* 极细网格纹理 */
.card-grid-texture {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(245,166,35,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245,166,35,0.02) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  position: relative;
}
.adam-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* 生命指示器 — 多环呼吸灯 */
.life-indicator {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.life-core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
  z-index: 2;
}
.adam-identity-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  position: relative;
  z-index: 2;
  border-radius: 50%;
}
.life-orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px solid transparent;
}
.orbit-1 {
  width: 24px;
  height: 24px;
}
.orbit-2 {
  width: 36px;
  height: 36px;
}

/* 状态: alive */
.life-indicator.alive .life-core {
  background: #00E5A0;
  box-shadow: 0 0 12px rgba(0,229,160,0.5), 0 0 24px rgba(0,229,160,0.2);
  animation: corePulse 2.5s ease-in-out infinite;
}
.life-indicator.alive .orbit-1 {
  border-color: rgba(0,229,160,0.25);
  animation: orbitSpin 8s linear infinite;
}
.life-indicator.alive .orbit-2 {
  border-color: rgba(0,229,160,0.10);
  animation: orbitSpin 12s linear infinite reverse;
}

/* 状态: dormant */
.life-indicator.dormant .life-core { background: var(--dim); opacity: 0.5; }
.life-indicator.dormant .orbit-1 { border-color: var(--border); }
.life-indicator.dormant .orbit-2 { border-color: transparent; }

/* 状态: survival */
.life-indicator.survival .life-core {
  background: #FF4D4D;
  box-shadow: 0 0 12px rgba(255,77,77,0.5);
  animation: corePulse 1s ease-in-out infinite;
}
.life-indicator.survival .orbit-1 {
  border-color: rgba(255,77,77,0.3);
  animation: orbitSpin 4s linear infinite;
}
.life-indicator.survival .orbit-2 {
  border-color: rgba(255,77,77,0.15);
  animation: orbitSpin 6s linear infinite reverse;
}

/* 状态: shutdown */
.life-indicator.shutdown .life-core { background: var(--dim); opacity: 0.2; }
.life-indicator.shutdown .orbit-1,
.life-indicator.shutdown .orbit-2 { border-color: transparent; }

@keyframes corePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
}
@keyframes orbitSpin {
  0% { transform: rotate(0deg); border-top-color: transparent; }
  25% { border-top-color: currentColor; }
  50% { transform: rotate(180deg); }
  75% { border-top-color: transparent; }
  100% { transform: rotate(360deg); }
}

.adam-name {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.name-main {
  font-size: 16px;
  font-weight: 700;
  color: var(--dark);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
}
.name-id { color: #F5A623; }
.name-sub {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
  opacity: 0.6;
}

/* Header right: system tag + activate */
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sys-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.sys-tag.alive { background: rgba(0,229,160,0.06); border: 1px solid rgba(0,229,160,0.15); }
.sys-tag.dormant { background: var(--faint); border: 1px solid var(--border); }
.sys-tag.survival { background: rgba(255,77,77,0.06); border: 1px solid rgba(255,77,77,0.15); }
.sys-tag.shutdown { background: var(--faint); border: 1px solid var(--border); }
.sys-dot { width: 5px; height: 5px; border-radius: 50%; }
.sys-tag.alive .sys-dot { background: #00E5A0; }
.sys-tag.dormant .sys-dot { background: var(--dim); }
.sys-tag.survival .sys-dot { background: #FF4D4D; animation: corePulse 1s ease-in-out infinite; }
.sys-tag.shutdown .sys-dot { background: var(--dim); opacity: 0.3; }
.sys-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.sys-tag.alive .sys-label { color: #00E5A0; }
.sys-tag.dormant .sys-label { color: var(--dim); }
.sys-tag.survival .sys-label { color: #FF4D4D; }
.sys-tag.shutdown .sys-label { color: var(--dim); opacity: 0.5; }

/* 激活按钮 */
.activate-btn {
  position: relative;
  padding: 8px 20px;
  border-radius: 4px;
  border: 1px solid rgba(245,166,35,0.35);
  background: transparent;
  color: #F5A623;
  font-size: 11px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}
.activate-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(245,166,35,0.08), transparent);
  animation: glowSweep 3s ease-in-out infinite;
}
@keyframes glowSweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.activate-btn:hover {
  background: #F5A623;
  color: var(--card-bg);
  box-shadow: 0 0 20px rgba(245,166,35,0.3), 0 0 40px rgba(245,166,35,0.1);
  border-color: #F5A623;
}
.activate-text { position: relative; z-index: 1; }

/* ── 核心指标条 ── */
.metrics-strip {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
  position: relative;
  overflow-x: auto;
}
.metric-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
  padding: 0 8px;
}
.metric-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
  flex-shrink: 0;
}
.metric-key {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.6;
}
.metric-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--dark);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: -0.02em;
}
.metric-val.positive { color: #00E5A0; }
.metric-val.negative { color: #FF4D4D; }
.metric-val.credit { color: #F5A623; }
.metric-unit { font-size: 11px; opacity: 0.5; margin-left: 1px; }
.metric-val.energy-num { font-size: 12px; }

/* 精力条 */
.energy-bar-wrap {
  width: 60px;
  height: 3px;
  background: var(--faint);
  border-radius: 2px;
  overflow: hidden;
}
.energy-bar {
  height: 100%;
  background: linear-gradient(90deg, #00E5A0, #00D4FF);
  border-radius: 2px;
  transition: width 0.5s ease;
}
.energy-bar.low {
  background: linear-gradient(90deg, #FF4D4D, #FF6B35);
}

/* ── 情绪频谱 ── */
.emotion-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}
.emotion-label {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.1em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.5;
  white-space: nowrap;
}
.emotion-bars {
  display: flex;
  gap: 8px;
  flex: 1;
}
.emotion-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
}
.emotion-bar-bg {
  width: 100%;
  max-width: 24px;
  height: 28px;
  background: var(--faint);
  border-radius: 2px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.emotion-bar-fill {
  width: 100%;
  border-radius: 2px 2px 0 0;
  transition: height 0.5s ease;
  min-height: 1px;
}
.emotion-bar-fill.em-gold { background: #F5A623; }
.emotion-bar-fill.em-red { background: #FF4D4D; }
.emotion-bar-fill.em-blue { background: #5B8DEF; }
.emotion-bar-fill.em-purple { background: #A78BFA; }
.emotion-bar-fill.em-pink { background: #EC4899; }
.emotion-bar-fill.em-gray { background: var(--dim); }
.emotion-bar-fill.em-cyan { background: #00D4FF; }
.emotion-name {
  font-size: 8px;
  color: var(--dim);
  opacity: 0.5;
}

/* ═══════════════════════════════════════
   第二层：指令 + 事件
   ═══════════════════════════════════════ */
.dual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 指令卡片 */
.instruction-card {
  position: relative;
  padding: 16px;
  background: linear-gradient(180deg, rgba(245,166,35,0.03) 0%, transparent 100%);
}
.instruction-glow-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #F5A623;
  box-shadow: 0 0 8px rgba(245,166,35,0.5), 0 0 16px rgba(245,166,35,0.2);
}
.instruction-body { padding-left: 14px; }
.instruction-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.instruction-conf {
  font-size: 9px;
  font-weight: 700;
  color: #F5A623;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  background: rgba(245,166,35,0.08);
  border-radius: 3px;
}
.instruction-time {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.instruction-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 6px;
  line-height: 1.4;
}
.instruction-thesis {
  font-size: 12px;
  color: var(--mid);
  margin-bottom: 6px;
  line-height: 1.6;
}
.instruction-risk {
  font-size: 11px;
  color: rgba(255,77,77,0.70);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.risk-icon { font-size: 10px; }
.instruction-actions { display: flex; gap: 8px; }

/* 按钮 */
.btn-gold {
  position: relative;
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid rgba(245,166,35,0.35);
  background: transparent;
  color: #F5A623;
  font-size: 11px;
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', monospace;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
}
.btn-gold .btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(245,166,35,0.06), transparent);
}
.btn-gold:hover {
  background: #F5A623;
  color: var(--card-bg);
  box-shadow: 0 0 12px rgba(245,166,35,0.25);
}
.btn-ghost {
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--dim);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  border-color: var(--mid);
  color: var(--dark);
}

/* ── 事件日志 ── */
.event-list {
  padding: 12px 16px 14px;
  max-height: 360px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.event-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 28px;
}
.event-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 10px;
  flex-shrink: 0;
  padding-top: 4px;
}
.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}
.event-dot.sense { background: #00D4FF; box-shadow: 0 0 4px rgba(0,212,255,0.4); }
.event-dot.judge { background: #F5A623; box-shadow: 0 0 4px rgba(245,166,35,0.4); }
.event-dot.act { background: #00E5A0; box-shadow: 0 0 4px rgba(0,229,160,0.4); }
.event-dot.settle { background: #A78BFA; box-shadow: 0 0 4px rgba(167,139,250,0.4); }
.event-dot.archive { background: var(--dim); }
.event-line {
  width: 1px;
  flex: 1;
  min-height: 16px;
  background: var(--border);
}
.event-time {
  font-size: 9px;
  font-weight: 600;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  min-width: 32px;
  flex-shrink: 0;
  padding-top: 2px;
}
.event-stage-tag {
  font-size: 8px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
}
.event-stage-tag.sense { color: #00D4FF; background: rgba(0,212,255,0.08); }
.event-stage-tag.judge { color: #F5A623; background: rgba(245,166,35,0.08); }
.event-stage-tag.act { color: #00E5A0; background: rgba(0,229,160,0.08); }
.event-stage-tag.settle { color: #A78BFA; background: rgba(167,139,250,0.08); }
.event-stage-tag.archive { color: var(--dim); background: var(--faint); }
.event-text {
  font-size: 12px;
  color: var(--mid);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  padding-top: 1px;
}

/* 空状态 */
.empty-state {
  padding: 32px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.empty-icon {
  font-size: 18px;
  color: var(--dim);
  opacity: 0.3;
}
.empty-text {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
  opacity: 0.5;
}
.empty-sub {
  font-size: 11px;
  color: var(--dim);
  opacity: 0.4;
}

/* ═══════════════════════════════════════
   第三层：通讯终端
   ═══════════════════════════════════════ */
.panel-chat {
  display: flex;
  flex-direction: column;
}
.chat-icon { color: #00D4FF; }
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
.comm-status.online {
  color: #00E5A0;
  background: rgba(0,229,160,0.06);
}

/* 消息列表 */
.chat-messages {
  min-height: 200px;
  max-height: 420px;
  overflow-y: auto;
  padding: 14px 16px;
  scrollbar-width: thin;
}

/* 空聊天 */
.chat-empty {
  padding: 40px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.chat-empty-icon { color: var(--dim); }
.chat-empty-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--mid);
  margin: 0;
}
.chat-empty-text {
  font-size: 11px;
  color: var(--dim);
  margin: 0;
  opacity: 0.6;
  max-width: 300px;
  line-height: 1.5;
}

/* 消息 */
.msg {
  padding: 8px 0;
}
.msg + .msg {
  border-top: 1px solid var(--border);
}
.msg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.msg-avatar {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  font-family: 'SF Mono', 'Fira Code', monospace;
  flex-shrink: 0;
}
.msg-avatar.user {
  background: var(--faint);
  color: var(--mid);
  border: 1px solid var(--border);
}
.msg-avatar.assistant {
  background: rgba(245,166,35,0.10);
  color: #F5A623;
  border: 1px solid rgba(245,166,35,0.20);
  overflow: hidden;
  padding: 0;
}
.adam-msg-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.msg-sender {
  font-size: 10px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
}
.msg.user .msg-sender { color: var(--mid); }
.msg.assistant .msg-sender { color: #F5A623; }
.msg-time {
  font-size: 8px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.5;
}
.msg-content {
  font-size: 13px;
  line-height: 1.65;
  color: var(--dark);
  padding-left: 28px;
}
.msg.user .msg-content { color: var(--mid); }

/* Markdown 渲染样式 */
.msg-content :deep(p) { margin: 0 0 6px; }
.msg-content :deep(p:last-child) { margin-bottom: 0; }
.msg-content :deep(ul), .msg-content :deep(ol) { margin: 4px 0; padding-left: 20px; }
.msg-content :deep(li) { margin: 2px 0; }
.msg-content :deep(code) {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  background: var(--faint);
  padding: 1px 4px;
  border-radius: 3px;
  color: #F5A623;
}
.msg-content :deep(pre) {
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 6px 0;
}
.msg-content :deep(pre code) { background: none; padding: 0; }
.msg-content :deep(strong) { color: var(--dark); }
.msg-content :deep(a) { color: #00D4FF; text-decoration: none; }
.msg-content :deep(a:hover) { text-decoration: underline; }
.msg-content :deep(blockquote) {
  border-left: 2px solid #F5A623;
  margin: 6px 0;
  padding: 4px 10px;
  color: var(--dim);
}

/* 工具调用 */
.tool-calls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding-left: 28px;
}
.tool-card {
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 8px 10px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.tool-header {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tool-status-indicator {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.tool-card.running .tool-status-indicator { background: #00D4FF; animation: indicatorPulse 1s infinite; }
.tool-card.success .tool-status-indicator { background: #00E5A0; }
.tool-card.error .tool-status-indicator { background: #FF4D4D; }
@keyframes indicatorPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }

.tool-fn {
  font-size: 10px;
  font-weight: 600;
  color: var(--mid);
}
.tool-status-label {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-left: auto;
}
.tool-card.running .tool-status-label { color: #00D4FF; }
.tool-card.success .tool-status-label { color: #00E5A0; }
.tool-card.error .tool-status-label { color: #FF4D4D; }

.tool-result {
  margin-top: 6px;
  border-top: 1px solid var(--border);
  padding-top: 6px;
}
.tool-result pre {
  font-size: 10px;
  color: var(--dim);
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 6px 0 6px 28px;
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
  0%, 60%, 100% { opacity: 0.15; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

/* 输入区 */
.chat-input-area {
  border-top: 1px solid var(--border);
  padding: 10px 16px;
  background: linear-gradient(180deg, transparent 0%, rgba(245,166,35,0.01) 100%);
}
.disclaimer {
  font-size: 8px;
  color: var(--dim);
  text-align: center;
  margin-bottom: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.12em;
  opacity: 0.4;
}
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.img-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--faint);
  color: var(--mid);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}
.img-btn:hover:not(:disabled) { color: #F5A623; border-color: #F5A623; }
.img-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pending-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.pending-img-wrap {
  position: relative;
}
.pending-img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border);
}
.pending-img-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.msg-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.msg-img-thumb {
  max-width: 200px;
  max-height: 160px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid var(--border);
}
.chat-input {
  flex: 1;
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 14px;
  color: var(--dark);
  font-size: 13px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  line-height: 1.5;
}
.chat-input::placeholder { color: var(--dim); opacity: 0.5; }
.chat-input:focus {
  border-color: rgba(245,166,35,0.25);
  box-shadow: 0 0 0 2px rgba(245,166,35,0.06);
}
.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid rgba(245,166,35,0.25);
  background: transparent;
  color: #F5A623;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) {
  background: #F5A623;
  color: var(--card-bg);
  box-shadow: 0 0 12px rgba(245,166,35,0.2);
}
.send-btn:disabled { opacity: 0.2; cursor: not-allowed; }

/* ── 响应式 ── */
@media (max-width: 767px) {
  .dual-grid { grid-template-columns: 1fr; }
  .metrics-strip { flex-wrap: wrap; gap: 8px; justify-content: center; }
  .metric-divider { display: none; }
  .metric-block { min-width: 60px; }
  .metric-val { font-size: 15px; }
  .emotion-strip { flex-direction: column; gap: 6px; }
  .emotion-label { text-align: center; }
  .chat-messages { max-height: 320px; }
  .name-main { font-size: 14px; }
  .life-indicator { width: 32px; height: 32px; }
  .orbit-1 { width: 20px; height: 20px; }
  .orbit-2 { width: 28px; height: 28px; }
}
</style>
