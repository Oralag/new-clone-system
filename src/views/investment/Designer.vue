<template>
  <div class="designer-page">
    <!-- 左侧：对话区 -->
    <div class="chat-panel">
      <div class="designer-header">
        <div class="header-left">
          <span class="header-emoji">🎨</span>
          <div class="header-info">
            <h2 class="header-title">平面设计工坊</h2>
            <span class="header-sub">GRAPHIC DESIGN STUDIO · 独立设计师</span>
          </div>
        </div>
        <div class="header-badges">
          <span class="badge">海报</span>
          <span class="badge">Banner</span>
          <span class="badge">包装</span>
          <span class="badge">Logo</span>
          <span class="badge">社媒图</span>
        </div>
      </div>

      <!-- 快捷提示 -->
      <div v-if="!hasMessages" class="quick-prompts">
        <div class="prompts-title">快速开始</div>
        <div class="prompts-grid">
          <button v-for="p in quickPrompts" :key="p.label" class="prompt-card" :disabled="isLoading" @click="sendMessage(p.prompt)">
            <span class="prompt-icon">{{ p.icon }}</span>
            <span class="prompt-label">{{ p.label }}</span>
          </button>
        </div>
      </div>

      <!-- 聊天区域 -->
      <div v-else class="chat-area" ref="chatAreaRef">
        <div v-for="(msg, idx) in messages" :key="idx" class="chat-msg" :class="msg.role">
          <div class="msg-header">
            <span class="msg-role">{{ msg.role === 'user' ? '你' : '🎨 设计师' }}</span>
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
          <div class="msg-header"><span class="msg-role">🎨 设计师</span></div>
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
          placeholder="描述你的设计需求..."
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
    </div>

    <!-- 右侧：画布预览区 -->
    <div class="canvas-panel">
      <div class="canvas-header">
        <span class="canvas-title">设计预览</span>
        <button v-if="designData.length" class="clear-canvas-btn" @click="designData = []">清空</button>
      </div>
      <div class="canvas-body">
        <div v-if="!designData.length" class="canvas-empty">
          <div class="empty-icon">🖌️</div>
          <div class="empty-text">与设计师对话后<br>设计方案将在此展示</div>
        </div>

        <div v-for="(block, idx) in designData" :key="idx" class="design-block">
          <!-- 配色方案 -->
          <template v-if="block.type === 'palette'">
            <div class="block-label">🎨 配色方案</div>
            <div class="palette-grid">
              <div v-for="c in block.colors" :key="c.hex" class="palette-swatch" :style="{ background: c.hex }">
                <span class="swatch-hex">{{ c.hex }}</span>
                <span class="swatch-name">{{ c.name }}</span>
              </div>
            </div>
          </template>

          <!-- AI 生图提示词 -->
          <template v-if="block.type === 'prompt'">
            <div class="block-label">✨ AI 生图提示词</div>
            <div class="prompt-block">
              <pre class="prompt-text">{{ block.text }}</pre>
              <button class="copy-btn" @click="copyText(block.text)">{{ copiedIdx === idx ? '已复制' : '复制' }}</button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
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
  toolCalls?: ToolCall[]
}

interface PaletteColor { hex: string; name: string }
interface DesignBlock {
  type: 'palette' | 'prompt'
  colors?: PaletteColor[]
  text?: string
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isLoading = ref(false)
const isStreaming = ref(false)
const chatAreaRef = ref<HTMLDivElement>()
const inputRef = ref<HTMLTextAreaElement>()
const designData = ref<DesignBlock[]>([])
const copiedIdx = ref<number | null>(null)

const HISTORY_KEY = 'designer_agent_history'
const hasMessages = computed(() => messages.value.length > 0)

// 从 localStorage 恢复历史
try {
  const raw = localStorage.getItem(HISTORY_KEY)
  if (raw) messages.value = JSON.parse(raw).slice(-50)
} catch {}

const quickPrompts = [
  { icon: '🛍️', label: '电商主图', prompt: '帮我设计一张电商主图，产品是[描述你的产品]，目标平台是淘宝' },
  { icon: '📱', label: '社媒海报', prompt: '帮我设计一张小红书封面图，主题是[描述主题]' },
  { icon: '🖼️', label: '活动Banner', prompt: '帮我设计一张促销活动Banner，活动主题是[描述活动]' },
  { icon: '💳', label: '名片设计', prompt: '帮我设计一张商务名片，公司名称是[公司名]，风格偏简约现代' },
  { icon: '📦', label: '包装设计', prompt: '帮我设计产品包装方案，产品是[描述产品]，目标受众是[描述受众]' },
  { icon: '✦', label: 'Logo方案', prompt: '帮我设计Logo，品牌名是[品牌名]，行业是[行业]，希望传达[关键词]的感觉' },
  { icon: '🌈', label: '配色方案', prompt: '帮我生成一套配色方案，风格是[现代/复古/清新/高端/活泼]，用途是[用途]' },
  { icon: '📐', label: '排版建议', prompt: '帮我做排版设计建议，内容类型是[海报/宣传册/详情页]，信息量[多/中/少]' },
]

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

/** 从 AI 回复中提取配色方案和生图提示词 */
function extractDesignData(content: string) {
  // 提取 ```palette ... ``` 块
  const paletteRe = /```palette\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = paletteRe.exec(content)) !== null) {
    const lines = m[1].trim().split('\n')
    const colors: PaletteColor[] = []
    for (const line of lines) {
      const match = line.match(/(#[0-9A-Fa-f]{6})\s*\|\s*(.+)/)
      if (match) colors.push({ hex: match[1], name: match[2].trim() })
    }
    if (colors.length) designData.value.push({ type: 'palette', colors })
  }
  // 提取 ```prompt ... ``` 块
  const promptRe = /```prompt\n([\s\S]*?)```/g
  while ((m = promptRe.exec(content)) !== null) {
    const text = m[1].trim()
    if (text) designData.value.push({ type: 'prompt', text })
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text || '')
    const idx = designData.value.findIndex(b => b.text === text)
    copiedIdx.value = idx
    setTimeout(() => { copiedIdx.value = null }, 1500)
  } catch {}
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
      body: JSON.stringify({ messages: apiMessages, agentId: 'designer' }),
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

    if (!assistantMsg.content) assistantMsg.content = '设计师暂无回复'
    // 提取设计数据到画布
    extractDesignData(assistantMsg.content)
  } catch (e: any) {
    assistantMsg.content = `设计咨询出错：${e.message}`
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
.designer-page {
  height: 100%;
  display: flex;
  gap: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

/* ── 左侧对话面板 ── */
.chat-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
}

.designer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(225,29,72,0.03) 0%, transparent 100%);
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-emoji { font-size: 24px; }
.header-info { display: flex; flex-direction: column; gap: 2px; }
.header-title { font-size: 14px; font-weight: 700; color: var(--dark); margin: 0; }
.header-sub {
  font-size: 9px; color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
}
.header-badges { display: flex; gap: 4px; flex-wrap: wrap; }
.badge {
  font-size: 8px; font-weight: 700; padding: 2px 6px; border-radius: 3px;
  background: rgba(225,29,72,0.06); color: #e11d48;
  border: 1px solid rgba(225,29,72,0.12);
  font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.05em;
}

/* 快捷提示 */
.quick-prompts { padding: 24px 18px; flex: 1; overflow-y: auto; }
.prompts-title {
  font-size: 10px; font-weight: 700; color: var(--dim);
  letter-spacing: 0.1em; font-family: 'SF Mono', 'Fira Code', monospace;
  margin-bottom: 14px;
}
.prompts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.prompt-card {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  border-radius: 6px; border: 1px solid var(--border); background: var(--faint);
  cursor: pointer; transition: all 0.15s; text-align: left; font-family: inherit;
}
.prompt-card:hover { border-color: rgba(225,29,72,0.25); background: rgba(225,29,72,0.04); }
.prompt-card:disabled { opacity: 0.5; cursor: not-allowed; }
.prompt-icon { font-size: 18px; flex-shrink: 0; }
.prompt-label { font-size: 12px; color: var(--dark); font-weight: 500; }
/* 聊天区域 */
.chat-area {
  flex: 1; overflow-y: auto; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 12px; scrollbar-width: thin;
}
.chat-msg { max-width: 85%; }
.chat-msg.user { align-self: flex-end; }
.chat-msg.assistant { align-self: flex-start; }
.msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.msg-role { font-size: 10px; font-weight: 700; color: var(--dim); font-family: 'SF Mono', 'Fira Code', monospace; }
.msg-time { font-size: 9px; color: var(--dim); opacity: 0.6; font-family: 'SF Mono', 'Fira Code', monospace; }
.msg-content {
  font-size: 13px; line-height: 1.6; color: var(--dark);
  padding: 10px 14px; border-radius: 8px; word-break: break-word;
}
.user .msg-content { background: rgba(225,29,72,0.06); border: 1px solid rgba(225,29,72,0.12); }
.assistant .msg-content { background: var(--faint); border: 1px solid var(--border); }

/* 打字动画 */
.typing { display: flex; gap: 4px; padding: 12px 14px; }
.typing-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #e11d48; opacity: 0.4;
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
.tool-card.running { border-color: rgba(225,29,72,0.3); color: #e11d48; }
.tool-card.done { border-color: rgba(225,29,72,0.15); opacity: 0.7; }
.tool-icon { font-size: 11px; }
.tool-name { white-space: nowrap; }

/* Markdown */
.msg-content :deep(h1), .msg-content :deep(h2), .msg-content :deep(h3) { font-size: 13px; font-weight: 700; margin: 8px 0 4px; color: var(--dark); }
.msg-content :deep(ul), .msg-content :deep(ol) { padding-left: 18px; margin: 4px 0; }
.msg-content :deep(li) { margin: 2px 0; }
.msg-content :deep(code) { background: rgba(225,29,72,0.06); padding: 1px 4px; border-radius: 3px; font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace; }
.msg-content :deep(pre) { background: rgba(0,0,0,0.04); padding: 8px 10px; border-radius: 4px; overflow-x: auto; margin: 6px 0; font-size: 11px; }
.msg-content :deep(table) { border-collapse: collapse; margin: 6px 0; font-size: 12px; width: 100%; }
.msg-content :deep(th), .msg-content :deep(td) { border: 1px solid var(--border); padding: 4px 8px; text-align: left; }
.msg-content :deep(th) { background: var(--faint); font-weight: 600; }
.msg-content :deep(p) { margin: 4px 0; }
/* 输入区域 */
.input-area {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 12px 18px 16px; border-top: 1px solid var(--border); flex-shrink: 0;
}
.chat-input {
  flex: 1; border: 1px solid var(--border); border-radius: 6px;
  padding: 8px 12px; font-size: 13px; font-family: inherit;
  color: var(--dark); background: var(--faint); resize: none; outline: none;
  transition: border-color 0.15s; max-height: 120px;
}
.chat-input:focus { border-color: rgba(225,29,72,0.4); }
.chat-input::placeholder { color: var(--dim); }
.send-btn {
  width: 36px; height: 36px; border-radius: 6px;
  border: 1px solid rgba(225,29,72,0.2); background: rgba(225,29,72,0.06);
  color: #e11d48; cursor: pointer; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; transition: all 0.15s;
}
.send-btn:hover:not(:disabled) { background: rgba(225,29,72,0.12); border-color: rgba(225,29,72,0.3); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── 右侧画布面板 ── */
.canvas-panel {
  width: 360px; flex-shrink: 0; display: flex; flex-direction: column;
  background: var(--faint);
}
.canvas-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.canvas-title {
  font-size: 11px; font-weight: 700; color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.08em;
}
.clear-canvas-btn {
  font-size: 10px; color: var(--dim); background: none; border: 1px solid var(--border);
  border-radius: 4px; padding: 2px 8px; cursor: pointer; font-family: inherit;
}
.clear-canvas-btn:hover { color: #e11d48; border-color: rgba(225,29,72,0.3); }
.canvas-body { flex: 1; overflow-y: auto; padding: 16px; scrollbar-width: thin; }

/* 空状态 */
.canvas-empty { text-align: center; padding: 60px 20px; color: var(--dim); }
.empty-icon { font-size: 36px; margin-bottom: 12px; }
.empty-text { font-size: 13px; line-height: 1.6; }

/* 设计块 */
.design-block { margin-bottom: 20px; }
.block-label {
  font-size: 11px; font-weight: 700; color: var(--dark); margin-bottom: 8px;
}

/* 配色方案 */
.palette-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.palette-swatch {
  width: 100%; height: 56px; border-radius: 6px; position: relative;
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: 6px 8px; overflow: hidden;
}
.swatch-hex {
  font-size: 11px; font-weight: 700; color: #fff;
  font-family: 'SF Mono', 'Fira Code', monospace;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.swatch-name {
  font-size: 9px; color: rgba(255,255,255,0.8);
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

/* 提示词块 */
.prompt-block { position: relative; }
.prompt-text {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px;
  padding: 10px 12px; font-size: 12px; line-height: 1.5;
  font-family: 'SF Mono', 'Fira Code', monospace; color: var(--dark);
  white-space: pre-wrap; word-break: break-word; margin: 0;
}
.copy-btn {
  position: absolute; top: 6px; right: 6px;
  font-size: 10px; padding: 2px 8px; border-radius: 3px;
  border: 1px solid var(--border); background: var(--card-bg);
  color: var(--dim); cursor: pointer; font-family: inherit;
}
.copy-btn:hover { color: #e11d48; border-color: rgba(225,29,72,0.3); }

@media (max-width: 767px) {
  .designer-page { flex-direction: column; }
  .chat-panel { border-right: none; border-bottom: 1px solid var(--border); min-height: 50vh; }
  .canvas-panel { width: 100%; min-height: 40vh; }
  .designer-header { flex-direction: column; gap: 8px; align-items: flex-start; }
  .prompts-grid { grid-template-columns: 1fr; }
}
</style>

