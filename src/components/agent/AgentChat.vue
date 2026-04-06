<template>
  <div ref="barRef" class="agent-bar" :class="{ expanded: (messages.length > 0 || streaming) && !isCollapsed, compact }" :style="{ '--ac': agent.color }" @click.stop>

    <!-- 输入条（始终在顶部） -->
    <div class="bar-row">
      <div class="bar-identity" @click="isCollapsed = false">
        <div class="bar-shield">{{ agent.emoji }}</div>
        <div class="bar-live-dot" :class="streaming ? 'dot-busy' : 'dot-live'" />
        <span class="bar-name">{{ agent.name }}</span>
      </div>

      <div class="bar-actions" @click.stop>
        <input
          ref="inputRef"
          v-model="inputText"
          class="bar-input"
          :placeholder="`和 ${agent.name} 对话...`"
          :disabled="streaming"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          enterkeyhint="send"
          @keydown.enter.prevent="sendMessage"
          @focus="isCollapsed = false"
        />
        <button v-if="messages.length > 0" class="bar-tool-btn" @click="clearChat" title="清空对话">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
        <!-- 收起按钮 -->
        <button v-if="(messages.length > 0 || streaming) && !isCollapsed" class="bar-tool-btn" @click="isCollapsed = true" title="收起">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
        <!-- 展开按钮 -->
        <button v-if="messages.length > 0 && isCollapsed" class="bar-tool-btn" @click="isCollapsed = false" title="展开">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <button class="bar-send" :disabled="streaming || !inputText.trim()" @click="sendMessage">
          <svg v-if="!streaming" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          <span v-else class="spin" />
        </button>
      </div>
    </div>

    <!-- 消息区（在输入条下方展开） -->
    <div v-if="(messages.length > 0 || streaming) && !isCollapsed" class="inline-feed">

      <!-- 查看更多 -->
      <div v-if="messages.length > 4 && !showAllMessages" class="feed-more-btn" @click.stop="showAllMessages = true">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        查看更多 {{ messages.length - 4 }} 条历史
      </div>

      <template v-for="(msg, idx) in displayMessages" :key="idx">
        <div v-if="msg.role === 'user'" class="row-user">
          <div class="bubble-user">{{ msg.content }}</div>
        </div>
        <div v-else-if="msg.role === 'assistant'" class="row-assistant">
          <div class="assistant-inner">
            <!-- 工具调用 -->
            <template v-for="(tc, ti) in msg.toolCalls" :key="ti">
              <div class="step-tool">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                {{ formatToolName(tc.name) }}
                <span class="tool-dot" :class="tc.status === 'done' ? 'dot-done' : tc.status === 'error' ? 'dot-error' : 'dot-running'" />
              </div>
            </template>
            <!-- 文本内容 -->
            <div v-if="msg.content || msg.streaming" class="step-text" v-html="renderMd(msg.content)"></div>
            <!-- 生成的图片 -->
            <div v-if="msg.images?.length" class="step-images">
              <a v-for="(url, i) in msg.images" :key="i" :href="url" target="_blank">
                <img :src="url" class="step-image" alt="AI生成图片" />
              </a>
            </div>
            <!-- 存入发布按钮 -->
            <div v-if="msg.content && !msg.streaming" class="step-actions">
              <button class="btn-save-publish" @click="saveToPublish(msg, idx)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v10M8 8l4 4 4-4M3 16v4h18v-4"/></svg>
                存入发布
              </button>
              <span v-if="savedIndexes.has(idx)" class="saved-hint">✓ 已存入</span>
            </div>
          </div>
        </div>
      </template>

      <div v-if="lastError" class="row-error">{{ lastError }}</div>

      <div v-if="streaming && !messages[messages.length - 1]?.content" class="row-thinking">
        <span class="thinking-label">{{ agent.emoji }} {{ agent.name }}</span>
        <div class="thinking-dots"><span /><span /><span /></div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { AGENTS } from '@/server/agents/agentRegistry'
import { useTrendingStore } from '@/stores/agent'
import { useBrandStore } from '@/stores/brand'
import { marked } from 'marked'

const props = defineProps<{
  agentId: string
  quickPrompts?: string[]
  compact?: boolean
  contextData?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'streaming-change', v: boolean): void
  (e: 'message-sent'): void
  (e: 'content-published', index: number): void
}>()

const agent = computed(() => AGENTS[props.agentId] ?? AGENTS.copywriter)
const agentStore = useTrendingStore()
const brandStore = useBrandStore()
const router = useRouter()
const savedIndexes = ref<Set<number>>(new Set())

// agentId → 发布类型映射
const agentTypeMap: Record<string, 'copy' | 'poster' | 'video_script'> = {
  copywriter: 'copy',
  poster: 'poster',
  designer: 'poster',
  video: 'video_script',
}

// agentId → 平台映射
const agentPlatformMap: Record<string, { platform: string; platformName: string }> = {
  copywriter: { platform: 'xiaohongshu', platformName: '小红书' },
  poster: { platform: 'xiaohongshu', platformName: '小红书' },
  designer: { platform: 'xiaohongshu', platformName: '小红书' },
  video: { platform: 'douyin', platformName: '抖音' },
}

function saveToPublish(msg: ChatMessage, idx: number) {
  const type = agentTypeMap[props.agentId] ?? 'copy'
  const { platform, platformName } = agentPlatformMap[props.agentId] ?? { platform: 'xiaohongshu', platformName: '小红书' }
  const imageUrl = msg.images?.[0] ?? ''
  agentStore.setFlowResults([
    ...agentStore.flowResults,
    { platform, platformName, topic: '', type, content: msg.content, imageUrl: imageUrl || undefined },
  ])
  savedIndexes.value = new Set([...savedIndexes.value, idx])
  ElMessage({ message: '已存入发布，前往发布页查看', type: 'success', duration: 2500,
    onClick: () => router.push('/agent/publish') })
}

interface ToolCall {
  id: string
  name: string
  status: 'running' | 'done' | 'error'
}
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  images?: string[]
  streaming?: boolean
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const streaming = ref(false)
const lastError = ref('')
const isCollapsed = ref(false)
const showAllMessages = ref(false)
const inputRef = ref<HTMLInputElement>()
const barRef = ref<HTMLDivElement>()

const displayMessages = computed(() =>
  showAllMessages.value ? messages.value : messages.value.slice(-4)
)

function renderMd(text: string) {
  if (!text) return ''
  return marked.parse(text) as string
}

function formatToolName(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// 点击外部自动收起
function onClickOutside(e: MouseEvent) {
  if (barRef.value && !barRef.value.contains(e.target as Node)) {
    isCollapsed.value = true
  }
}
onMounted(() => {
  document.addEventListener('click', onClickOutside)
  loadMemory()
  nextTick(() => inputRef.value?.focus())
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})

function sendQuickPrompt(prompt: string) {
  inputText.value = prompt
  isCollapsed.value = false
  nextTick(() => {
    inputRef.value?.focus()
    sendMessage()
  })
}

async function scrollBottom() {
  await nextTick()
  // 自动滚动到底部 — feed 区域
  const feed = barRef.value?.querySelector('.inline-feed')
  if (feed) feed.scrollTop = feed.scrollHeight
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || streaming.value) return

  inputText.value = ''
  lastError.value = ''
  isCollapsed.value = false

  messages.value.push({ role: 'user', content: text })
  const assistantMsg: ChatMessage = { role: 'assistant', content: '', toolCalls: [], streaming: true }
  messages.value.push(assistantMsg)
  await scrollBottom()

  streaming.value = true
  emit('streaming-change', true)

  const token = localStorage.getItem('erp_token') || ''
  const history = messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content }))

  try {
    const resp = await fetch('/api/agent-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-erp-token': token,
        'x-agent-id': props.agentId,
      },
      body: JSON.stringify({ messages: history, agentId: props.agentId, brandContext: brandStore.systemPrompt, ...(props.contextData || {}) }),
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
            messages.value = [...messages.value]
            await scrollBottom()
          } else if (ev.type === 'tool_start') {
            assistantMsg.toolCalls!.push({ id: ev.id, name: ev.name, status: 'running' })
            messages.value = [...messages.value]
            await scrollBottom()
          } else if (ev.type === 'tool_result') {
            const tc = assistantMsg.toolCalls!.find(t => t.id === ev.id)
            if (tc) tc.status = 'done'
            if (ev.result && typeof ev.result === 'string' && ev.result.startsWith('IMAGE_URL:')) {
              if (!assistantMsg.images) assistantMsg.images = []
              assistantMsg.images.push(ev.result.slice(10))
            }
            messages.value = [...messages.value]
          } else if (ev.type === 'error') {
            lastError.value = ev.error
          } else if (ev.type === 'published') {
            emit('content-published', ev.index)
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
    messages.value = [...messages.value]
    await scrollBottom()
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
  showAllMessages.value = false
}

function clearChat() {
  clearMemory()
}

defineExpose({ sendQuickPrompt, clearChat })
</script>

<style scoped>
/* ── 条形布局（仿 CaptainBar） ── */
.agent-bar {
  position: relative;
  z-index: 100;
  background: var(--card-bg, rgba(255,255,255,0.95));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  border: 1px solid var(--border, rgba(0,0,0,0.07));
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  margin-bottom: 16px;
}

/* ── 条 ── */
.bar-row {
  height: 68px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
}

.bar-identity {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 5px 16px 5px 5px;
  border-radius: 10px;
  transition: background 0.15s;
  border-right: 1px solid rgba(0,0,0,0.07);
  margin-right: 4px;
}
.bar-identity:hover { background: color-mix(in srgb, var(--ac, #6366f1) 6%, transparent); }

.bar-shield {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--ac, #6366f1), color-mix(in srgb, var(--ac, #6366f1) 70%, #000));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.bar-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-live { background: #34d399; box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
.dot-busy { background: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); animation: blink 1s infinite; }
@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.3 } }

.bar-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark, #1d1d1f);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex: 1;
  position: relative;
}

.bar-input {
  height: 40px;
  flex: 1;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--dark, #1d1d1f);
  font-size: 13.5px;
  padding: 0 12px;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}
.bar-input::placeholder { color: rgba(29,29,31,0.3); }
.bar-input:focus { background: transparent; border-color: transparent; box-shadow: none; }
.bar-input:disabled { opacity: 0.45; }

.bar-send {
  width: 40px;
  height: 40px;
  background: var(--ac, #6366f1);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
  padding: 0;
}
.bar-send:hover:not(:disabled) { opacity: 0.85; }
.bar-send:disabled { opacity: 0.35; cursor: not-allowed; }

.bar-tool-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid rgba(0,0,0,0.09);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(29,29,31,0.4);
  transition: all 0.15s;
  padding: 0;
  flex-shrink: 0;
}
.bar-tool-btn:hover { background: var(--gray, #f5f5f7); color: var(--dark, #1d1d1f); border-color: rgba(0,0,0,0.15); }

/* ── 内联消息区 ── */
.inline-feed {
  padding: 4px 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--border, rgba(0,0,0,0.06));
  background: var(--gray, #fafafa);
  border-radius: 0 0 14px 14px;
  max-height: 480px;
  overflow-y: auto;
}

.feed-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ac, #0071e3);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
  user-select: none;
  align-self: flex-start;
}
.feed-more-btn:hover { background: color-mix(in srgb, var(--ac, #0071e3) 7%, transparent); }

/* 消息行 */
.row-user { display: flex; justify-content: flex-end; }
.bubble-user {
  background: var(--ac, #6366f1);
  color: #fff;
  border-radius: 16px 16px 4px 16px;
  padding: 9px 14px;
  font-size: 13px;
  max-width: 70%;
  line-height: 1.5;
  letter-spacing: -0.01em;
}

.row-assistant { display: flex; }
.assistant-inner { display: flex; flex-direction: column; gap: 8px; max-width: 92%; }

.step-text {
  font-size: 13px;
  color: var(--dark, #1d1d1f);
  line-height: 1.6;
  background: var(--card-bg, #fff);
  border-radius: 4px 16px 16px 16px;
  padding: 9px 14px;
  border: 1px solid var(--border, rgba(0,0,0,0.06));
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.step-text :deep(p) { margin: 0 0 8px; }
.step-text :deep(p:last-child) { margin-bottom: 0; }
.step-text :deep(ul), .step-text :deep(ol) { margin: 6px 0; padding-left: 20px; }
.step-text :deep(li) { margin-bottom: 3px; }
.step-text :deep(h1), .step-text :deep(h2), .step-text :deep(h3) { margin: 10px 0 6px; font-size: 1em; }
.step-text :deep(strong) { font-weight: 700; }
.step-text :deep(code) { background: var(--gray, #f1f5f9); padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
.step-text :deep(pre) { background: var(--gray, #f1f5f9); padding: 10px; border-radius: 8px; overflow-x: auto; }
.step-text :deep(blockquote) { border-left: 3px solid var(--faint, #e2e8f0); padding-left: 10px; color: var(--mid, #64748b); margin: 6px 0; }
.step-images { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.step-image { max-width: 100%; border-radius: 6px; border: 1px solid var(--faint, #e2e8f0); cursor: pointer; display: block; }

.step-tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(29,29,31,0.4);
  padding: 3px 0;
}
.tool-dot { width: 6px; height: 6px; border-radius: 50%; }
.dot-running { background: #f59e0b; animation: blink 1s infinite; }
.dot-done    { background: #34d399; }
.dot-error   { background: #ef4444; }

/* 错误 */
.row-error {
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 12px;
}

/* 思考中 */
.row-thinking { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.thinking-label { font-size: 12px; color: rgba(29,29,31,0.4); }
.thinking-dots { display: flex; gap: 3px; }
.thinking-dots span {
  width: 5px; height: 5px; background: rgba(29,29,31,0.2);
  border-radius: 50%; animation: bounce 1.2s infinite;
}
.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,60%,100% { transform:translateY(0) } 30% { transform:translateY(-4px) } }

/* 动画 */
.spin {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── compact 模式（侧面板场景） ── */
.agent-bar.compact {
  margin-bottom: 0;
  border-radius: 0;
  border: none;
  box-shadow: none;
}
.agent-bar.compact .bar-row {
  height: 52px;
  padding: 0 12px;
  gap: 8px;
}
.agent-bar.compact .bar-shield {
  width: 24px;
  height: 24px;
  font-size: 12px;
}
.agent-bar.compact .bar-name { font-size: 12px; }
.agent-bar.compact .bar-input { font-size: 12.5px; height: 34px; }
.agent-bar.compact .bar-send { width: 34px; height: 34px; }
.agent-bar.compact .bar-tool-btn { width: 28px; height: 28px; }
.agent-bar.compact .inline-feed {
  padding: 4px 12px 10px;
  max-height: 340px;
}
.agent-bar.compact .bubble-user,
.agent-bar.compact .step-text { font-size: 12px; padding: 7px 11px; }

.step-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.btn-save-publish {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ac, #6366f1);
  background: color-mix(in srgb, var(--ac, #6366f1) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--ac, #6366f1) 20%, transparent);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.btn-save-publish:hover {
  background: color-mix(in srgb, var(--ac, #6366f1) 14%, transparent);
  border-color: color-mix(in srgb, var(--ac, #6366f1) 35%, transparent);
}

.saved-hint {
  font-size: 11px;
  color: #34d399;
  font-weight: 600;
}

/* 暗色模式 */
:global([data-theme='dark']) .agent-bar { background: #111827; border-color: #1f2937; }
:global([data-theme='dark']) .bar-name { color: #f8fafc; }
:global([data-theme='dark']) .inline-feed { background: #0d1117; }
:global([data-theme='dark']) .step-text { background: #1e293b; border-color: #334155; color: #e2e8f0; }
</style>
