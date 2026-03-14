<template>
  <div class="captain-bar" :class="{ expanded: captainMessages.length > 0 || captainLoading }">

    <!-- 输入条（始终在顶部） -->
    <div class="bar-row">
      <div class="bar-identity" @click="toggle">
        <div class="bar-shield">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2L4 7v6c0 5 4.5 9.7 8 11 3.5-1.3 8-6 8-11V7L12 2z"/></svg>
        </div>
        <div class="bar-live-dot" :class="captainLoading ? 'dot-busy' : 'dot-live'" />
        <span class="bar-name">Captain 指挥官</span>
      </div>

      <div class="bar-actions" @click.stop>
        <input
          ref="inputRef"
          v-model="quickText"
          class="bar-input"
          :placeholder="lastPreview || 'AI 多智能体总调度 · 输入目标让 Captain 自动规划执行…'"
          :disabled="captainLoading"
          @keydown.enter.prevent="sendQuick"
        />
        <button v-if="captainMessages.length > 0" class="bar-tool-btn" @click="newSession" title="新建对话">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button v-if="captainMessages.length > 0" class="bar-tool-btn" @click="clearCurrent" title="清空">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
        <button class="bar-send" :disabled="captainLoading || !quickText.trim()" @click="sendQuick">
          <svg v-if="!captainLoading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          <span v-else class="spin" />
        </button>
      </div>
    </div>

    <!-- 消息区（在输入条下方往下展开） -->
    <div v-if="captainMessages.length > 0 || captainLoading" class="inline-feed">

      <!-- 查看更多：折叠的旧消息 -->
      <div v-if="captainMessages.length > 2 && !showAllMessages" class="feed-more-btn" @click="showAllMessages = true">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        查看更多 {{ captainMessages.length - 2 }} 条历史
      </div>

      <template v-for="(msg, idx) in (showAllMessages ? captainMessages : captainMessages.slice(-2))" :key="idx">
        <div v-if="msg.role === 'user'" class="row-user">
          <div class="bubble-user">{{ msg.content }}</div>
        </div>
        <div v-else class="row-agency">
          <div class="agency-inner">
            <template v-for="(step, si) in msg.steps" :key="si">
              <div v-if="step.type === 'captain_text'" class="step-text" v-html="renderMd(step.text)" />
              <div v-else-if="step.type === 'agent_start'" class="step-agent">
                <div class="agent-header" :style="{ background: agentColor(step.agentId) + '12' }">
                  <span class="agent-emoji">{{ step.emoji }}</span>
                  <span class="agent-name">{{ step.agentName }}</span>
                  <div class="agent-tag" :class="step.status === 'running' ? 'tag-running' : 'tag-done'">
                    <span v-if="step.status === 'running'" class="spin-sm" />
                    <span>{{ step.status === 'running' ? '执行中' : '完成' }}</span>
                  </div>
                </div>
                <div class="agent-task">{{ step.task }}</div>
                <div v-if="step.output" class="agent-output">{{ step.output }}</div>
              </div>
              <div v-else-if="step.type === 'tool'" class="step-tool">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                {{ step.label }}
                <span class="tool-dot" :class="step.status === 'done' ? 'dot-done' : 'dot-running'" />
              </div>
            </template>
          </div>
        </div>
      </template>

      <div v-if="captainLoading" class="row-thinking">
        <span class="thinking-label">🎯 Captain</span>
        <div class="thinking-dots"><span /><span /><span /></div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
interface Step {
  type: 'agent_start' | 'captain_text' | 'tool'
  agentId?: string; agentName?: string; emoji?: string
  task?: string; output?: string; status?: string
  text?: string; label?: string
}
interface CaptainMsg { role: 'user' | 'agency'; content: string; steps: Step[] }
interface HistoryItem { title: string; time: string; messages: CaptainMsg[] }

const HISTORY_KEY = 'captain_chat_history'
const TOOL_LABELS: Record<string, string> = {
  query_customers: '查询客户', query_suppliers: '查询供应商', query_goods: '查询商品',
  query_inventory: '查询库存', query_sales: '查询销售', query_purchases: '查询采购',
  query_finance: '查询财务', query_staff: '查询员工', query_warehouses: '查询仓库',
  navigate_to: '页面导航',
}
const agentList = [
  { id: 'copywriter', color: '#f59e0b' }, { id: 'poster', color: '#ec4899' },
  { id: 'video', color: '#ef4444' },      { id: 'brand', color: '#8b5cf6' },
  { id: 'publisher', color: '#10b981' },  { id: 'trend', color: '#06b6d4' },
]
const quickPrompts = [
  '分析本月销售数据，生成小红书推广文案',
  '帮我规划一个新品上市的内容发布计划',
  '追踪当前热点，给出3个选题方向',
]

const isExpanded = ref(false)
const showHistory = ref(false)
const quickText = ref('')
const captainInput = ref('')
const captainLoading = ref(false)
const captainMessages = ref<CaptainMsg[]>([])
const feedRef = ref<HTMLDivElement>()
const showAllMessages = ref(false)
const inputRef = ref<HTMLInputElement>()

// ── 历史记录 ────────────────────────────────────────────────────────────────
const historyList = ref<HistoryItem[]>(loadAllHistory())
const historyActiveIdx = ref<number | null>(null)

function loadAllHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

function saveCurrentToHistory() {
  if (captainMessages.value.length === 0) return
  const firstUser = captainMessages.value.find(m => m.role === 'user')
  const title = firstUser?.content.slice(0, 30) || '对话记录'
  const now = new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  const item: HistoryItem = { title, time: now, messages: JSON.parse(JSON.stringify(captainMessages.value)) }
  // 更新当前活跃 index 或新增
  if (historyActiveIdx.value !== null) {
    historyList.value[historyActiveIdx.value] = item
  } else {
    historyList.value.unshift(item)
    historyActiveIdx.value = 0
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList.value.slice(0, 30)))
}

function loadHistory(idx: number) {
  saveCurrentToHistory()
  captainMessages.value = JSON.parse(JSON.stringify(historyList.value[idx].messages))
  historyActiveIdx.value = idx
  showHistory.value = false
  nextTick(() => scrollBottom())
}

function newSession() {
  saveCurrentToHistory()
  captainMessages.value = []
  historyActiveIdx.value = null
  showHistory.value = false
  showAllMessages.value = false
}

function clearCurrent() {
  saveCurrentToHistory()
  captainMessages.value = []
  historyActiveIdx.value = null
  showAllMessages.value = false
}

function clearAllHistory() {
  historyList.value = []
  localStorage.removeItem(HISTORY_KEY)
}

// ── 其他 ────────────────────────────────────────────────────────────────────
const lastPreview = computed(() => {
  for (let i = captainMessages.value.length - 1; i >= 0; i--) {
    const msg = captainMessages.value[i]
    if (msg.role === 'agency') {
      const s = msg.steps.find(s => s.type === 'captain_text' && s.text)
      if (s?.text) return s.text.replace(/<[^>]+>/g, '').slice(0, 70)
    }
  }
  return ''
})

function agentColor(id?: string) { return agentList.find(a => a.id === id)?.color ?? '#0071e3' }
function renderMd(text = '') {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
}

function toggle() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) nextTick(() => { scrollBottom(); inputRef.value?.focus() })
}

async function sendQuick() {
  const text = quickText.value.trim()
  if (!text || captainLoading.value) return
  quickText.value = ''
  captainInput.value = text
  sendCaptain()
}

async function scrollBottom() {
  await nextTick()
  if (feedRef.value) feedRef.value.scrollTop = feedRef.value.scrollHeight
}

async function sendCaptain(text?: string) {
  const content = (text ?? captainInput.value).trim()
  if (!content || captainLoading.value) return
  captainInput.value = ''
  captainLoading.value = true
  isExpanded.value = true

  captainMessages.value.push({ role: 'user', content, steps: [] })
  const agencyMsg: CaptainMsg = { role: 'agency', content: '', steps: [] }
  captainMessages.value.push(agencyMsg)
  await scrollBottom()

  const agentSteps: Record<string, number> = {}
  const toolSteps: Record<string, number> = {}

  try {
    const history = captainMessages.value
      .filter(m => m.role === 'user')
      .map(m => ({ role: 'user', content: m.content }))

    const resp = await fetch('/api/captain-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': localStorage.getItem('erp_token') || '' },
      body: JSON.stringify({ messages: history }),
    })
    if (!resp.body) throw new Error('No response body')
    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break
        try {
          const evt = JSON.parse(raw)
          if (evt.type === 'agent_thinking') {
            if (evt.agentId === 'captain') {
              const last = agencyMsg.steps[agencyMsg.steps.length - 1]
              if (last?.type === 'captain_text') last.text = (last.text ?? '') + evt.text
              else if (evt.text) agencyMsg.steps.push({ type: 'captain_text', text: evt.text })
            } else {
              const idx = agentSteps[evt.agentId]
              if (idx !== undefined) agencyMsg.steps[idx].output = (agencyMsg.steps[idx].output ?? '') + evt.text
            }
          } else if (evt.type === 'agent_start') {
            agentSteps[evt.agentId] = agencyMsg.steps.length
            agencyMsg.steps.push({ type: 'agent_start', agentId: evt.agentId, agentName: evt.agentName, emoji: evt.emoji, task: evt.task, output: '', status: 'running' })
          } else if (evt.type === 'agent_done') {
            const idx = agentSteps[evt.agentId]
            if (idx !== undefined) agencyMsg.steps[idx].status = 'done'
          } else if (evt.type === 'tool_start') {
            toolSteps[evt.id] = agencyMsg.steps.length
            agencyMsg.steps.push({ type: 'tool', label: TOOL_LABELS[evt.name] ?? evt.name, status: 'running' })
          } else if (evt.type === 'tool_result') {
            const idx = toolSteps[evt.id]
            if (idx !== undefined) agencyMsg.steps[idx].status = 'done'
          }
          captainMessages.value = [...captainMessages.value]
          await scrollBottom()
        } catch {}
      }
    }
  } catch (e: any) {
    agencyMsg.steps.push({ type: 'captain_text', text: `❌ 出错：${e.message}` })
  } finally {
    captainLoading.value = false
    captainMessages.value = [...captainMessages.value]
    saveCurrentToHistory()
    await scrollBottom()
  }
}
</script>

<style scoped>
/* ── 智能体工作流页面顶部，风格匹配 ERP TopBar ── */
.captain-bar {
  position: relative;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  margin-bottom: 16px;
}

/* ── 收起态条 ── */
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
.bar-identity:hover { background: rgba(0, 113, 227, 0.06); }

.bar-shield {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #0071e3, #0058b9);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
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
  color: #1d1d1f;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.bar-divider {
  color: rgba(29, 29, 31, 0.15);
  font-size: 14px;
}

.bar-preview {
  font-size: 12px;
  color: rgba(29, 29, 31, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}

.bar-hint {
  font-size: 12px;
  color: rgba(29, 29, 31, 0.25);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 420px;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex: 1;
}

.bar-input {
  height: 40px;
  flex: 1;
  background: transparent;
  border: none;
  border-radius: 0;
  color: #1d1d1f;
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
  background: #0071e3;
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
.bar-send:hover:not(:disabled) { background: rgba(0,113,227,0.85); }
.bar-send:disabled { opacity: 0.35; cursor: not-allowed; }

.bar-toggle {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid rgba(0,0,0,0.09);
  border-radius: 8px;
  color: rgba(29,29,31,0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
  padding: 0;
}
.bar-toggle:hover { background: #f5f5f7; color: #1d1d1f; border-color: rgba(0,0,0,0.15); }

/* ── 内联消息区 ── */
.inline-feed {
  padding: 4px 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(0,0,0,0.06);
  background: #fafafa;
  border-radius: 0 0 14px 14px;
}

.feed-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  color: #0071e3;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
  user-select: none;
  align-self: flex-start;
}
.feed-more-btn:hover { background: rgba(0,113,227,0.07); }

/* 消息行 */
.row-user { display: flex; justify-content: flex-end; }
.bubble-user {
  background: #0071e3;
  color: #fff;
  border-radius: 16px 16px 4px 16px;
  padding: 9px 14px;
  font-size: 13px;
  max-width: 70%;
  line-height: 1.5;
  letter-spacing: -0.01em;
}

.row-agency { display: flex; }
.agency-inner { display: flex; flex-direction: column; gap: 8px; max-width: 92%; }

.step-text {
  font-size: 13px;
  color: #1d1d1f;
  line-height: 1.6;
  background: #fff;
  border-radius: 4px 16px 16px 16px;
  padding: 9px 14px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.step-agent {
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 10px;
  overflow: hidden;
  font-size: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.agent-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.agent-emoji { font-size: 14px; }
.agent-name { font-size: 12px; font-weight: 600; color: #1d1d1f; flex: 1; letter-spacing: -0.01em; }
.agent-tag {
  display: flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px;
  font-size: 11px; font-weight: 500;
}
.tag-running { background: #e8f4fd; color: #0071e3; }
.tag-done    { background: #f0fdf4; color: #16a34a; }
.agent-task  { padding: 7px 12px; color: rgba(29,29,31,0.55); font-size: 12px; }
.agent-output { padding: 0 12px 9px; color: rgba(29,29,31,0.4); font-size: 11px; line-height: 1.5; white-space: pre-wrap; }

.step-tool {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; color: rgba(29,29,31,0.4); padding: 3px 0;
}
.tool-dot { width: 6px; height: 6px; border-radius: 50%; }
.dot-running { background: #f59e0b; animation: blink 1s infinite; }
.dot-done    { background: #34d399; }

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

/* bar-tool-btn（新建/清空 小按钮，在输入条右侧） */
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
.bar-tool-btn:hover { background: #f5f5f7; color: #1d1d1f; border-color: rgba(0,0,0,0.15); }



/* 动画 */
.spin {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
.spin-sm {
  width: 8px; height: 8px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block; opacity: 0.7;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
