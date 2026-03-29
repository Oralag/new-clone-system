<template>
  <div class="marketing-page">
    <div class="marketing-header">
      <div class="header-left">
        <span class="header-emoji">📊</span>
        <div class="header-info">
          <h2 class="header-title">营销顾问事务所</h2>
          <span class="header-sub">MARKETING CONSULTANCY · 科特勒《营销管理》+ 特劳特&里斯《定位》系列</span>
        </div>
      </div>
      <div class="header-badges">
        <span class="badge">STP</span>
        <span class="badge">4P/7P</span>
        <span class="badge">SWOT</span>
        <span class="badge">定位</span>
        <span class="badge">22条商规</span>
      </div>
    </div>

    <!-- Tab 栏 -->
    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: activeTab === 'user' }" @click="activeTab = 'user'">
        💬 我的对话
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'captain' }" @click="activeTab = 'captain'">
        🎯 Captain 派发
        <span v-if="captainMessages.length" class="tab-badge">{{ Math.floor(captainMessages.length / 2) }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'adam' }" @click="activeTab = 'adam'">
        🧬 Adam 咨询
        <span v-if="adamMessages.length" class="tab-badge">{{ Math.floor(adamMessages.length / 2) }}</span>
      </button>
    </div>

    <!-- ===== 我的对话 Tab ===== -->
    <template v-if="activeTab === 'user'">
      <!-- 快捷提示 -->
      <div v-if="!hasMessages" class="quick-prompts">
        <div class="prompts-title">快速咨询</div>
        <div class="prompts-grid">
          <button
            v-for="p in quickPrompts"
            :key="p.label"
            class="prompt-card"
            :disabled="isLoading"
            @click="sendMessage(p.prompt)"
          >
            <span class="prompt-icon">{{ p.icon }}</span>
            <span class="prompt-label">{{ p.label }}</span>
          </button>
        </div>
      </div>

      <!-- 聊天区域 -->
      <div class="chat-area" ref="chatAreaRef">
        <div v-for="(msg, idx) in messages" :key="idx" class="chat-msg" :class="msg.role">
          <div class="msg-header">
            <span class="msg-role">{{ msg.role === 'user' ? '你' : '📊 营销顾问' }}</span>
            <span class="msg-time">{{ formatTime(msg.time) }}</span>
          </div>
          <div v-if="msg.toolCalls?.length" class="tool-calls">
            <div v-for="tc in msg.toolCalls" :key="tc.id" class="tool-card" :class="tc.status">
              <span class="tool-icon">{{ tc.status === 'running' ? '⏳' : '✅' }}</span>
              <span class="tool-name">{{ toolLabel(tc.name) }}</span>
            </div>
          </div>
          <div class="msg-content" v-html="renderMarkdown(msg.content)"></div>
        </div>
        <div v-if="isLoading && !isStreaming" class="chat-msg assistant">
          <div class="msg-header"><span class="msg-role">📊 营销顾问</span></div>
          <div class="msg-content typing">
            <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="input-area">
        <textarea
          v-model="inputText"
          class="chat-input"
          placeholder="描述你的营销问题..."
          rows="1"
          :disabled="isLoading"
          @keydown.enter.exact.prevent="sendMessage(inputText)"
          @input="autoResize"
          ref="inputRef"
        ></textarea>
        <button class="send-btn" :disabled="!inputText.trim() || isLoading" @click="sendMessage(inputText)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </template>

    <!-- ===== Captain / Adam 只读记录 Tab ===== -->
    <template v-else>
      <div class="chat-area readonly-area">
        <div v-if="currentCallerMessages.length === 0" class="empty-state">
          <div class="empty-icon">{{ activeTab === 'captain' ? '🎯' : '🧬' }}</div>
          <div class="empty-text">{{ activeTab === 'captain' ? 'Captain 暂未派发过任务给营销顾问' : 'Adam 暂未咨询过营销顾问' }}</div>
        </div>
        <template v-for="(pair, idx) in callerPairs" :key="idx">
          <div class="chat-msg user">
            <div class="msg-header">
              <span class="msg-role caller-tag" :class="activeTab">{{ activeTab === 'captain' ? '🎯 Captain' : '🧬 Adam' }}</span>
              <span class="msg-time">{{ formatTime(pair.question.time) }}</span>
            </div>
            <div class="msg-content" v-html="renderMarkdown(pair.question.content)"></div>
          </div>
          <div class="chat-msg assistant">
            <div class="msg-header">
              <span class="msg-role">📊 营销顾问</span>
              <span class="msg-time">{{ formatTime(pair.answer.time) }}</span>
            </div>
            <div class="msg-content" v-html="renderMarkdown(pair.answer.content)"></div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { marked } from 'marked'

interface ToolCall {
  id: string
  name: string
  status: 'running' | 'done'
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  time: string
  caller?: string
  toolCalls?: ToolCall[]
}

const messages = ref<ChatMessage[]>([])
const captainMessages = ref<ChatMessage[]>([])
const adamMessages = ref<ChatMessage[]>([])
const inputText = ref('')
const isLoading = ref(false)
const isStreaming = ref(false)
const activeTab = ref<'user' | 'captain' | 'adam'>('user')
const chatAreaRef = ref<HTMLDivElement>()
const inputRef = ref<HTMLTextAreaElement>()

const HISTORY_KEY = 'marketing_consultant_history'

const hasMessages = computed(() => messages.value.length > 0)

const currentCallerMessages = computed(() =>
  activeTab.value === 'captain' ? captainMessages.value : adamMessages.value
)

const callerPairs = computed(() => {
  const msgs = currentCallerMessages.value
  const pairs: Array<{ question: ChatMessage; answer: ChatMessage }> = []
  for (let i = 0; i < msgs.length - 1; i += 2) {
    if (msgs[i].role === 'user' && msgs[i + 1]?.role === 'assistant') {
      pairs.push({ question: msgs[i], answer: msgs[i + 1] })
    }
  }
  return pairs
})

const quickPrompts = [
  { icon: '🎯', label: '品牌定位分析', prompt: '用特劳特定位理论帮我分析品牌定位，找到心智中的差异化位置' },
  { icon: '⚔️', label: '商战策略', prompt: '分析我们的市场位置，用《商战》四种战略模型（防御/进攻/侧翼/游击）制定竞争策略' },
  { icon: '🎯', label: '客户细分分析', prompt: '帮我分析客户群体，做客户细分，制定差异化营销策略' },
  { icon: '💰', label: '定价策略', prompt: '根据销售数据和市场情况，帮我制定产品定价策略' },
  { icon: '📋', label: 'SWOT分析', prompt: '帮我做一份完整的SWOT分析，包括SO/WO/ST/WT策略' },
  { icon: '🔥', label: '品类创新', prompt: '用《品牌的起源》品类分化理论，帮我发现新品类机会，制定品类创新方案' },
  { icon: '🚀', label: '新品上市方案', prompt: '帮我制定一个新品上市的完整营销方案，从定位到STP到4P' },
  { icon: '📈', label: 'CLV计算', prompt: '分析我的主要客户的客户终身价值（CLV）和RFM分析' },
]

onMounted(async () => {
  // 加载本地历史
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) messages.value = JSON.parse(raw).slice(-50)
  } catch {}

  // 并行加载服务端 Captain/Adam 对话记录
  const token = localStorage.getItem('erp_token') || ''
  if (!token) return
  const headers = { 'x-erp-token': token }
  try {
    const [capRes, adamRes] = await Promise.all([
      fetch('/api/agent-memory?agentId=marketing&caller=captain', { headers }),
      fetch('/api/agent-memory?agentId=marketing&caller=adam', { headers }),
    ])
    if (capRes.ok) captainMessages.value = await capRes.json()
    if (adamRes.ok) adamMessages.value = await adamRes.json()
  } catch {}
})

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.value.slice(-50))) } catch {}
}

function formatTime(iso: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const M = (d.getMonth() + 1).toString().padStart(2, '0')
    const D = d.getDate().toString().padStart(2, '0')
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${M}-${D} ${h}:${m}`
  } catch { return '' }
}

function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}

const toolLabelMap: Record<string, string> = {
  query_customers: '查询客户', query_suppliers: '查询供应商', query_goods: '查询商品',
  query_inventory: '查询库存', query_sales: '查询销售数据', query_purchases: '查询采购数据',
  query_finance: '查询财务数据', query_staff: '查询员工', query_warehouses: '查询仓库',
  fetch_trending: '获取热搜', navigate_to: '页面跳转',
}
function toolLabel(name: string) { return toolLabelMap[name] || name }

function autoResize() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
}

function scrollToBottom() {
  nextTick(() => {
    if (chatAreaRef.value) chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
  })
}

async function sendMessage(text: string) {
  const trimmed = text.trim()
  if (!trimmed || isLoading.value) return
  inputText.value = ''
  if (inputRef.value) inputRef.value.style.height = 'auto'

  const userMsg: ChatMessage = { role: 'user', content: trimmed, time: new Date().toISOString() }
  messages.value.push(userMsg)
  scrollToBottom()

  isLoading.value = true
  const assistantMsg: ChatMessage = { role: 'assistant', content: '', time: new Date().toISOString(), toolCalls: [] }

  try {
    const token = localStorage.getItem('erp_token') || ''
    const apiMessages = messages.value.slice(-20).map((m) => ({ role: m.role, content: m.content }))
    const res = await fetch('/api/agent-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ messages: apiMessages, agentId: 'marketing' }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let streamDone = false

    messages.value.push(assistantMsg)
    isStreaming.value = true

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
            assistantMsg.toolCalls!.push({ id: data.id, name: data.name, status: 'running' })
            scrollToBottom()
          } else if (data.type === 'tool_result') {
            const tc = assistantMsg.toolCalls!.find(t => t.id === data.id)
            if (tc) tc.status = 'done'
          } else if (data.type === 'error') {
            assistantMsg.content += `\n⚠️ ${data.error}`
          }
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
.marketing-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.marketing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(5,150,105,0.03) 0%, transparent 100%);
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-emoji { font-size: 24px; }
.header-info { display: flex; flex-direction: column; gap: 2px; }
.header-title { font-size: 14px; font-weight: 700; color: var(--dark); margin: 0; }
.header-sub {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
}
.header-badges { display: flex; gap: 4px; }
.badge {
  font-size: 8px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(5,150,105,0.06);
  color: #059669;
  border: 1px solid rgba(5,150,105,0.12);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
}

/* Tab 栏 */
.tab-bar {
  display: flex;
  gap: 2px;
  padding: 8px 18px 0;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.tab-btn {
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dim);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
}
.tab-btn:hover { color: var(--dark); }
.tab-btn.active {
  color: #059669;
  border-bottom-color: #059669;
}
.tab-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(5,150,105,0.1);
  color: #059669;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* 快捷提示 */
.quick-prompts {
  padding: 24px 18px;
  flex: 1;
  overflow-y: auto;
}
.prompts-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.1em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  margin-bottom: 14px;
}
.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}
.prompt-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--faint);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-family: inherit;
}
.prompt-card:hover {
  border-color: rgba(5,150,105,0.25);
  background: rgba(5,150,105,0.04);
}
.prompt-card:disabled { opacity: 0.5; cursor: not-allowed; }
.prompt-icon { font-size: 18px; flex-shrink: 0; }
.prompt-label { font-size: 12px; color: var(--dark); font-weight: 500; }

/* 聊天区域 */
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
}
.readonly-area { padding-bottom: 24px; }
.chat-msg { max-width: 85%; }
.chat-msg.user { align-self: flex-end; }
.chat-msg.assistant { align-self: flex-start; }
.msg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.msg-role {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.caller-tag.captain { color: #6366f1; }
.caller-tag.adam { color: #8b5cf6; }
.msg-time {
  font-size: 9px;
  color: var(--dim);
  opacity: 0.6;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.msg-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--dark);
  padding: 10px 14px;
  border-radius: 8px;
  word-break: break-word;
}
.user .msg-content {
  background: rgba(5,150,105,0.06);
  border: 1px solid rgba(5,150,105,0.12);
}
.assistant .msg-content {
  background: var(--faint);
  border: 1px solid var(--border);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--dim);
}
.empty-icon { font-size: 36px; margin-bottom: 12px; }
.empty-text { font-size: 13px; }

/* 打字动画 */
.typing { display: flex; gap: 4px; padding: 12px 14px; }
.typing-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #059669; opacity: 0.4;
  animation: typingBounce 1.4s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce {
  0%, 100% { opacity: 0.4; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
}

/* 工具调用卡片 */
.tool-calls { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.tool-card {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 4px; font-size: 10px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  border: 1px solid var(--border); background: var(--faint); color: var(--dim);
}
.tool-card.running { border-color: rgba(5,150,105,0.3); color: #059669; }
.tool-card.done { border-color: rgba(5,150,105,0.15); opacity: 0.7; }
.tool-icon { font-size: 11px; }
.tool-name { white-space: nowrap; }

/* Markdown 内容样式 */
.msg-content :deep(h1),
.msg-content :deep(h2),
.msg-content :deep(h3) { font-size: 13px; font-weight: 700; margin: 8px 0 4px; color: var(--dark); }
.msg-content :deep(ul),
.msg-content :deep(ol) { padding-left: 18px; margin: 4px 0; }
.msg-content :deep(li) { margin: 2px 0; }
.msg-content :deep(code) {
  background: rgba(5,150,105,0.06); padding: 1px 4px; border-radius: 3px;
  font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace;
}
.msg-content :deep(pre) {
  background: rgba(0,0,0,0.04); padding: 8px 10px; border-radius: 4px;
  overflow-x: auto; margin: 6px 0; font-size: 11px;
}
.msg-content :deep(table) { border-collapse: collapse; margin: 6px 0; font-size: 12px; width: 100%; }
.msg-content :deep(th),
.msg-content :deep(td) { border: 1px solid var(--border); padding: 4px 8px; text-align: left; }
.msg-content :deep(th) { background: var(--faint); font-weight: 600; }
.msg-content :deep(p) { margin: 4px 0; }

/* 输入区域 */
.input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.chat-input {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  font-family: inherit;
  color: var(--dark);
  background: var(--faint);
  resize: none;
  outline: none;
  transition: border-color 0.15s;
  max-height: 120px;
}
.chat-input:focus { border-color: rgba(5,150,105,0.4); }
.chat-input::placeholder { color: var(--dim); }
.send-btn {
  width: 36px; height: 36px;
  border-radius: 6px;
  border: 1px solid rgba(5,150,105,0.2);
  background: rgba(5,150,105,0.06);
  color: #059669;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.send-btn:hover:not(:disabled) {
  background: rgba(5,150,105,0.12);
  border-color: rgba(5,150,105,0.3);
}
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 767px) {
  .marketing-header { flex-direction: column; gap: 8px; align-items: flex-start; }
  .header-badges { flex-wrap: wrap; }
  .prompts-grid { grid-template-columns: 1fr; }
  .tab-btn { padding: 6px 10px; font-size: 11px; }
}
</style>
