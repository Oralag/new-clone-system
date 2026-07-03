<template>
  <div class="marketing-dept">

    <DeptEmployeeCard
      name="Max"
      role="营销顾问"
      emoji="📊"
      desc="STP · 4P · SWOT · 品牌定位 · 竞品分析"
      color="#e2542e"
      illustId="marketing"
      :busy="isLoading"
      :stats="[
        { value: Math.floor(messages.length / 2), label: '已咨询' },
        { value: captainMessages.length ? Math.floor(captainMessages.length / 2) : 0, label: 'Captain派发' },
      ]"
    />

    <div class="three-col">

      <!-- 左侧 -->
      <aside class="left-panel">
        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#e2542e"></span>今日目标</div>
          <textarea v-model="todayGoal" class="goal-input" placeholder="今日营销目标..." rows="3" @blur="saveGoal"/>
        </div>

        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#131311"></span>快捷指令</div>
          <div class="quick-list">
            <button v-for="q in quickPrompts" :key="q.label" class="quick-item" @click="sendMessage(q.prompt)">
              <span class="quick-emoji">{{ q.icon }}</span>
              <span class="quick-text">{{ q.label }}</span>
            </button>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#e0b32c"></span>方法论</div>
          <div class="badge-list">
            <span v-for="b in badges" :key="b" class="method-badge">{{ b }}</span>
          </div>
        </div>

        <!-- Captain 派发记录 -->
        <div class="panel-card" v-if="captainMessages.length">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#6366f1"></span>
            Captain 派发
            <span class="panel-count">{{ Math.floor(captainMessages.length / 2) }}</span>
          </div>
          <div class="caller-list">
            <div v-for="(pair, i) in captainPairs.slice(0,3)" :key="i" class="caller-item">
              <span class="caller-q">{{ pair.question.content.slice(0, 24) }}…</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中间：对话 -->
      <section class="chat-panel" :style="{ '--ac': '#e2542e' }">
        <div class="chat-header">
          <div class="chat-header-left">
            <span class="chat-agent-emoji">📊</span>
            <div>
              <div class="chat-agent-name">Max · 营销顾问</div>
              <div class="chat-agent-sub">外聘 · 科特勒《营销管理》+ 特劳特定位理论</div>
            </div>
          </div>
          <span class="outsource-tag">外聘</span>
        </div>

        <!-- 空状态快捷提示 -->
        <div v-if="!hasMessages" class="quick-prompts-grid">
          <button v-for="p in quickPrompts.slice(0,4)" :key="p.label" class="prompt-card" :disabled="isLoading" @click="sendMessage(p.prompt)">
            <span class="prompt-icon">{{ p.icon }}</span>
            <span class="prompt-label">{{ p.label }}</span>
          </button>
        </div>

        <!-- 聊天区域 -->
        <div class="chat-area" ref="chatAreaRef" v-show="hasMessages || isLoading">
          <div v-for="(msg, idx) in messages" :key="idx" class="chat-msg" :class="msg.role">
            <div class="msg-bubble" v-html="renderMarkdown(msg.content)"></div>
          </div>
          <div v-if="isLoading && !isStreaming" class="chat-msg assistant">
            <div class="msg-bubble typing">
              <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-bar">
          <textarea
            v-model="inputText"
            class="bar-input"
            placeholder="描述你的营销问题..."
            rows="1"
            :disabled="isLoading"
            @keydown.enter.exact.prevent="sendMessage(inputText)"
            @input="autoResize"
            ref="inputRef"
          />
          <button class="bar-send" :disabled="!inputText.trim() || isLoading" @click="sendMessage(inputText)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </section>

      <!-- 右侧：产出记录 -->
      <aside class="right-panel">
        <div class="panel-card output-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#059669"></span>
            咨询记录
            <span class="panel-count">{{ Math.floor(messages.length / 2) }}</span>
          </div>
          <div v-if="!hasMessages" class="output-empty">暂无咨询记录</div>
          <div v-else class="output-list">
            <div v-for="(pair, i) in recentPairs" :key="i" class="output-item">
              <div class="output-item-top">
                <span class="output-type">问答</span>
                <span class="output-time">{{ formatTime(pair.question.time) }}</span>
              </div>
              <div class="output-title">{{ pair.question.content.slice(0, 28) }}{{ pair.question.content.length > 28 ? '…' : '' }}</div>
            </div>
          </div>
        </div>

        <div class="panel-card" style="margin-top:10px">
          <div class="panel-hd"><span class="panel-dot" style="background:#059669"></span>顾问准确率</div>
          <div class="accuracy-bar">
            <div class="accuracy-label">策略精准</div>
            <div class="accuracy-track"><div class="accuracy-fill" style="width:93%"></div></div>
            <span class="accuracy-pct">93%</span>
          </div>
          <div class="accuracy-bar" style="margin-top:8px">
            <div class="accuracy-label">数据支撑</div>
            <div class="accuracy-track"><div class="accuracy-fill" style="width:88%"></div></div>
            <span class="accuracy-pct">88%</span>
          </div>
        </div>
      </aside>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { marked } from 'marked'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  time: string
}

const messages = ref<ChatMessage[]>([])
const captainMessages = ref<ChatMessage[]>([])
const inputText = ref('')
const isLoading = ref(false)
const isStreaming = ref(false)
const chatAreaRef = ref<HTMLDivElement>()
const inputRef = ref<HTMLTextAreaElement>()

const HISTORY_KEY = 'marketing_consultant_history'
const todayGoal = ref(localStorage.getItem('marketing_dept_goal') || '')
function saveGoal() { localStorage.setItem('marketing_dept_goal', todayGoal.value) }

const hasMessages = computed(() => messages.value.length > 0)
const recentPairs = computed(() => {
  const pairs = []
  for (let i = messages.value.length - 2; i >= 0 && pairs.length < 4; i -= 2) {
    if (messages.value[i]?.role === 'user') pairs.push({ question: messages.value[i], answer: messages.value[i+1] })
  }
  return pairs
})
const captainPairs = computed(() => {
  const pairs = []
  for (let i = 0; i < captainMessages.value.length - 1; i += 2)
    pairs.push({ question: captainMessages.value[i], answer: captainMessages.value[i+1] })
  return pairs
})

const badges = ['STP', '4P/7P', 'SWOT', '定位', '22条商规', 'RFM', 'CLV']

const quickPrompts = [
  { icon: '🎯', label: '品牌定位分析', prompt: '用特劳特定位理论帮我分析品牌定位，找到心智中的差异化位置' },
  { icon: '⚔️', label: '商战策略', prompt: '分析我们的市场位置，用《商战》四种战略模型制定竞争策略' },
  { icon: '📋', label: 'SWOT分析', prompt: '帮我做一份完整的SWOT分析，包括SO/WO/ST/WT策略' },
  { icon: '🚀', label: '新品上市方案', prompt: '帮我制定一个新品上市的完整营销方案，从定位到STP到4P' },
  { icon: '💰', label: '定价策略', prompt: '根据销售数据和市场情况，帮我制定产品定价策略' },
  { icon: '🔥', label: '品类创新', prompt: '用《品牌的起源》品类分化理论，帮我发现新品类机会' },
]

onMounted(async () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) messages.value = JSON.parse(raw).slice(-50)
  } catch {}
  const token = localStorage.getItem('erp_token') || ''
  if (!token) return
  try {
    const res = await fetch('/api/agent-memory?agentId=marketing&caller=captain', { headers: { 'x-erp-token': token } })
    if (res.ok) captainMessages.value = await res.json()
  } catch {}
})

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.value.slice(-50))) } catch {}
}

function formatTime(iso: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return `${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  } catch { return '' }
}

function renderMarkdown(text: string) {
  return text ? marked.parse(text) as string : ''
}

function autoResize() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
}

function scrollToBottom() {
  nextTick(() => { if (chatAreaRef.value) chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight })
}

async function sendMessage(text: string) {
  const trimmed = text.trim()
  if (!trimmed || isLoading.value) return
  inputText.value = ''
  if (inputRef.value) inputRef.value.style.height = 'auto'
  messages.value.push({ role: 'user', content: trimmed, time: new Date().toISOString() })
  scrollToBottom()
  isLoading.value = true
  const assistantMsg: ChatMessage = { role: 'assistant', content: '', time: new Date().toISOString() }
  try {
    const token = localStorage.getItem('erp_token') || ''
    const res = await fetch('/api/agent-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ messages: messages.value.slice(-20).map(m => ({ role: m.role, content: m.content })), agentId: 'marketing' }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    messages.value.push(assistantMsg)
    isStreaming.value = true
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
          if (data.type === 'text') { assistantMsg.content += data.text; scrollToBottom() }
        } catch {}
      }
    }
    if (!assistantMsg.content) assistantMsg.content = '营销顾问暂无回复'
  } catch (e: any) {
    assistantMsg.content = `咨询出错：${e.message}`
    messages.value.push(assistantMsg)
  } finally {
    isLoading.value = false
    isStreaming.value = false
    saveHistory()
    scrollToBottom()
  }
}
</script>

<style scoped>
.marketing-dept { display: flex; flex-direction: column; gap: 14px; padding-bottom: 40px; max-width: 1400px; --ink: #131311; --ink-soft: rgba(19,19,17,0.64); --ink-muted: rgba(19,19,17,0.4); --yellow: #f2df4e; --accent: #e2542e; }
.three-col { display: grid; grid-template-columns: 220px 1fr 220px; gap: 14px; align-items: start; }

.panel-card { background: #fff; border: none; border-radius: 20px; padding: 15px 16px; box-shadow: none; }
.panel-hd { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 800; color: var(--ink); margin-bottom: 10px; }
.panel-dot { width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0; }
.panel-count { margin-left: auto; background: rgba(226,84,46,0.1); color: var(--accent); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; }

.left-panel { display: flex; flex-direction: column; gap: 10px; }
.goal-input { width: 100%; border: none; border-radius: 12px; padding: 9px 11px; font-size: 12px; color: var(--ink); background: rgba(19,19,17,0.04); resize: none; outline: none; font-family: inherit; line-height: 1.5; box-sizing: border-box; }
.goal-input:focus { box-shadow: 0 0 0 1.5px var(--ink); }
.quick-list { display: flex; flex-direction: column; gap: 6px; }
.quick-item { display: flex; align-items: flex-start; gap: 7px; padding: 8px 10px; border-radius: 12px; background: rgba(19,19,17,0.035); border: none; cursor: pointer; text-align: left; font-family: inherit; transition: background 0.15s, color 0.15s; }
.quick-item:hover { background: var(--ink); }
.quick-item:hover .quick-text { color: #fff; }
.quick-emoji { font-size: 13px; flex-shrink: 0; }
.quick-text { font-size: 11px; color: var(--ink-soft); line-height: 1.4; transition: color 0.15s; }
.badge-list { display: flex; flex-wrap: wrap; gap: 5px; }
.method-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: var(--yellow); color: var(--ink); border: none; }
.caller-list { display: flex; flex-direction: column; gap: 5px; }
.caller-item { padding: 6px 9px; background: rgba(19,19,17,0.04); border-radius: 9px; }
.caller-q { font-size: 11px; color: var(--ink-soft); line-height: 1.4; }

.chat-panel {
  background: #fff; border: none;
  border-radius: 24px; padding: 16px 16px 0; box-shadow: none;
  overflow: hidden; min-height: 520px; display: flex; flex-direction: column;
}
.chat-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: -16px -16px 14px; padding: 14px 18px; background: var(--ink); flex-shrink: 0; }
.chat-header-left { display: flex; align-items: center; gap: 10px; }
.chat-agent-emoji { font-size: 22px; }
.chat-agent-name { font-size: 13px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
.chat-agent-sub { font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 2px; }
.outsource-tag { font-size: 9px; font-weight: 800; padding: 3px 9px; border-radius: 999px; border: none; background: var(--yellow); color: var(--ink); flex-shrink: 0; }

.quick-prompts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px 0 16px; flex-shrink: 0; }
.prompt-card { display: flex; align-items: center; gap: 8px; padding: 11px 13px; border-radius: 14px; border: none; background: rgba(19,19,17,0.035); cursor: pointer; transition: background 0.15s; text-align: left; font-family: inherit; }
.prompt-card:hover { background: var(--yellow); }
.prompt-card:disabled { opacity: 0.5; cursor: not-allowed; }
.prompt-icon { font-size: 16px; flex-shrink: 0; }
.prompt-label { font-size: 11px; color: var(--ink); font-weight: 600; line-height: 1.3; }

.chat-area { flex: 1; overflow-y: auto; padding: 4px 0 12px; display: flex; flex-direction: column; gap: 10px; scrollbar-width: thin; }
.chat-msg { max-width: 88%; }
.chat-msg.user { align-self: flex-end; }
.chat-msg.assistant { align-self: flex-start; }
.msg-bubble { font-size: 13px; line-height: 1.6; color: var(--ink); padding: 10px 14px; border-radius: 16px; word-break: break-word; }
.user .msg-bubble { background: var(--yellow); border: none; border-bottom-right-radius: 6px; }
.assistant .msg-bubble { background: rgba(19,19,17,0.045); border: none; border-bottom-left-radius: 6px; }
.msg-bubble :deep(p) { margin: 4px 0; }
.msg-bubble :deep(ul), .msg-bubble :deep(ol) { padding-left: 18px; margin: 4px 0; }
.msg-bubble :deep(li) { margin: 2px 0; }
.msg-bubble :deep(h3) { font-size: 13px; font-weight: 700; margin: 8px 0 4px; }
.msg-bubble :deep(table) { border-collapse: collapse; margin: 6px 0; font-size: 12px; width: 100%; }
.msg-bubble :deep(th), .msg-bubble :deep(td) { border: 1px solid rgba(19,19,17,0.1); padding: 4px 8px; }
.msg-bubble :deep(th) { background: rgba(19,19,17,0.04); font-weight: 600; }

.typing { display: flex; gap: 4px; }
.typing-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); opacity: 0.4; animation: typingBounce 1.4s ease-in-out infinite; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce { 0%,100% { opacity: 0.4; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }

.chat-bar {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 10px 0 14px; border-top: 1px solid rgba(0,0,0,0.06); flex-shrink: 0;
}
.bar-input { flex: 1; border: none; border-radius: 999px; padding: 10px 15px; font-size: 13px; font-family: inherit; color: var(--ink); background: rgba(19,19,17,0.045); resize: none; outline: none; max-height: 120px; transition: box-shadow 0.15s; }
.bar-input:focus { box-shadow: 0 0 0 1.5px var(--ink); }
.bar-input::placeholder { color: var(--ink-muted); }
.bar-send { width: 38px; height: 38px; border-radius: 50%; border: none; background: var(--ink); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s, transform 0.15s; }
.bar-send:hover:not(:disabled) { background: var(--accent); transform: translateY(-1px); }
.bar-send:disabled { opacity: 0.4; cursor: not-allowed; }

.right-panel { display: flex; flex-direction: column; gap: 0; }
.output-empty { padding: 14px 0; text-align: center; font-size: 12px; color: var(--ink-muted); }
.output-list { display: flex; flex-direction: column; gap: 6px; }
.output-item { padding: 9px 11px; border-radius: 12px; background: rgba(19,19,17,0.035); transition: background 0.15s; }
.output-item:hover { background: rgba(19,19,17,0.07); }
.output-item-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.output-type { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(226,84,46,0.12); color: var(--accent); }
.output-time { font-size: 10px; color: var(--ink-muted); }
.output-title { font-size: 12px; color: var(--ink); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.accuracy-bar { display: flex; align-items: center; gap: 8px; }
.accuracy-label { font-size: 11px; color: var(--ink-soft); width: 56px; flex-shrink: 0; }
.accuracy-track { flex: 1; height: 5px; background: rgba(19,19,17,0.1); border-radius: 999px; overflow: hidden; }
.accuracy-fill { height: 100%; background: var(--ink); border-radius: 999px; }
.accuracy-pct { font-size: 11px; font-weight: 800; color: var(--ink); width: 30px; text-align: right; flex-shrink: 0; }

@media (max-width: 1100px) { .three-col { grid-template-columns: 1fr; } .left-panel, .right-panel { display: none; } }
</style>
