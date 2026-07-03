<template>
  <div class="designer-dept">

    <DeptEmployeeCard
      name="Aria"
      role="平面设计师"
      emoji="🎨"
      desc="海报 · Banner · Logo · 包装 · 社媒图"
      color="#e2542e"
      illustId="designer"
      :busy="isLoading"
      :stats="[
        { value: designData.filter(d => d.type === 'image').length, label: '已生图' },
        { value: designData.filter(d => d.type === 'palette').length, label: '配色方案' },
      ]"
    />

    <div class="three-col">

      <!-- 左侧 -->
      <aside class="left-panel">
        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#e2542e"></span>今日目标</div>
          <textarea v-model="todayGoal" class="goal-input" placeholder="今日设计目标..." rows="3" @blur="saveGoal"/>
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
          <div class="panel-hd"><span class="panel-dot" style="background:#e0b32c"></span>部门状态</div>
          <div class="status-list">
            <div class="status-row"><span class="status-label">设计专员</span><span class="status-badge green">待命</span></div>
            <div class="status-row"><span class="status-label">今日生图</span><span class="status-badge red">{{ designData.filter(d=>d.type==='image').length }} 张</span></div>
            <div class="status-row"><span class="status-label">配色方案</span><span class="status-badge blue">{{ designData.filter(d=>d.type==='palette').length }} 套</span></div>
          </div>
          <button v-if="hasMessages" class="clear-btn" @click="clearHistory">清空记录</button>
        </div>
      </aside>

      <!-- 中间：对话 -->
      <section class="chat-panel" :style="{ '--ac': '#e2542e' }">
        <div class="chat-header">
          <div class="chat-header-left">
            <span class="chat-agent-emoji">🎨</span>
            <div>
              <div class="chat-agent-name">Aria · 平面设计师</div>
              <div class="chat-agent-sub">外聘 · 海报 & 视觉设计 & 配色</div>
            </div>
          </div>
          <span class="outsource-tag">外聘</span>
        </div>

        <div v-if="!hasMessages" class="quick-prompts-grid">
          <button v-for="p in quickPrompts.slice(0,4)" :key="p.label" class="prompt-card" :disabled="isLoading" @click="sendMessage(p.prompt)">
            <span class="prompt-icon">{{ p.icon }}</span>
            <span class="prompt-label">{{ p.label }}</span>
          </button>
        </div>

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

        <div class="chat-bar">
          <textarea
            v-model="inputText"
            class="bar-input"
            placeholder="描述你的设计需求..."
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

      <!-- 右侧：设计产出画布 -->
      <aside class="right-panel">
        <div class="panel-card output-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#e2542e"></span>
            设计产出
            <span class="panel-count">{{ designData.length }}</span>
            <button v-if="designData.length" class="clear-canvas-btn" @click="designData = []">清空</button>
          </div>
          <div v-if="!designData.length" class="output-empty">与设计师对话后<br>方案将在此展示</div>
          <div v-else class="design-list">
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
                <div class="block-label">✨ 生图提示词</div>
                <div class="prompt-block">
                  <pre class="prompt-text">{{ block.text }}</pre>
                  <button class="copy-btn" @click="copyText(block.text, idx)">{{ copiedIdx === idx ? '已复制' : '复制' }}</button>
                </div>
              </template>

              <!-- 生成图片 -->
              <template v-if="block.type === 'image'">
                <div class="block-label">🖼️ 生成图片</div>
                <div class="image-block">
                  <div v-if="block.imgLoading" class="img-loading">图片生成中...</div>
                  <img v-show="!block.imgLoading && !block.imgError" :src="block.imageUrl" class="generated-image"
                    @load="block.imgLoading = false" @error="block.imgLoading = false; block.imgError = true"
                    @click="openImage(block.imageUrl)" />
                  <div v-if="block.imgError" class="img-error">加载失败</div>
                  <a v-if="!block.imgLoading && !block.imgError" :href="block.imageUrl" target="_blank" class="image-link">新窗口打开</a>
                </div>
              </template>
            </div>
          </div>
        </div>
      </aside>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { marked } from 'marked'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'

interface ChatMessage { role: 'user' | 'assistant'; content: string; time: string }
interface PaletteColor { hex: string; name: string }
interface DesignBlock { type: 'palette' | 'prompt' | 'image'; colors?: PaletteColor[]; text?: string; imageUrl?: string; imgLoading?: boolean; imgError?: boolean }

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isLoading = ref(false)
const isStreaming = ref(false)
const chatAreaRef = ref<HTMLDivElement>()
const inputRef = ref<HTMLTextAreaElement>()
const designData = ref<DesignBlock[]>([])
const copiedIdx = ref<number | null>(null)

const HISTORY_KEY = 'designer_agent_history'
const todayGoal = ref(localStorage.getItem('designer_dept_goal') || '')
function saveGoal() { localStorage.setItem('designer_dept_goal', todayGoal.value) }
const hasMessages = computed(() => messages.value.length > 0)

try {
  const raw = localStorage.getItem(HISTORY_KEY)
  if (raw) messages.value = JSON.parse(raw).slice(-50)
} catch {}

const quickPrompts = [
  { icon: '🛍️', label: '电商主图', prompt: '帮我设计一张电商主图，产品是[描述你的产品]，目标平台是淘宝' },
  { icon: '📱', label: '社媒海报', prompt: '帮我设计一张小红书封面图，主题是[描述主题]' },
  { icon: '🖼️', label: '活动Banner', prompt: '帮我设计一张促销活动Banner，活动主题是[描述活动]' },
  { icon: '🌈', label: '配色方案', prompt: '帮我生成一套配色方案，风格是现代简约，用途是品牌视觉系统' },
  { icon: '✦', label: 'Logo方案', prompt: '帮我设计Logo，品牌名是[品牌名]，行业是[行业]' },
  { icon: '📦', label: '包装设计', prompt: '帮我设计产品包装方案，产品是[描述产品]' },
]

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.value.slice(-50))) } catch {}
}

function renderMarkdown(text: string) { return text ? marked.parse(text) as string : '' }

function autoResize() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
}

function scrollToBottom() {
  nextTick(() => { if (chatAreaRef.value) chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight })
}

function extractDesignData(content: string) {
  const paletteRe = /```palette\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = paletteRe.exec(content)) !== null) {
    const colors: PaletteColor[] = []
    for (const line of m[1].trim().split('\n')) {
      const match = line.match(/(#[0-9A-Fa-f]{6})\s*\|\s*(.+)/)
      if (match) colors.push({ hex: match[1], name: match[2].trim() })
    }
    if (colors.length) designData.value.push({ type: 'palette', colors })
  }
  const promptRe = /```prompt\n([\s\S]*?)```/g
  while ((m = promptRe.exec(content)) !== null) {
    const text = m[1].trim()
    if (text) designData.value.push({ type: 'prompt', text })
  }
}

async function copyText(text: string | undefined, idx: number) {
  try { await navigator.clipboard.writeText(text || ''); copiedIdx.value = idx; setTimeout(() => { copiedIdx.value = null }, 1500) } catch {}
}

function openImage(url?: string) { if (url) window.open(url, '_blank') }

function clearHistory() {
  messages.value = []
  designData.value = []
  try { localStorage.removeItem(HISTORY_KEY) } catch {}
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
      body: JSON.stringify({ messages: messages.value.slice(-10).map(m => ({ role: m.role, content: m.content })), agentId: 'designer' }),
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
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''
      for (const part of parts) {
        const line = part.startsWith('data: ') ? part : part.split('\n').find(l => l.startsWith('data: ')) || ''
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') break
        try {
          const data = JSON.parse(payload)
          if (data.type === 'text') { assistantMsg.content += data.text; scrollToBottom() }
          else if (data.type === 'tool_result' && data.result?.startsWith?.('IMAGE_URL:')) {
            designData.value.push({ type: 'image', imageUrl: data.result.slice(10), imgLoading: true, imgError: false })
          }
        } catch {}
      }
    }
    if (!assistantMsg.content) assistantMsg.content = '设计师暂无回复'
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
.designer-dept { display: flex; flex-direction: column; gap: 14px; padding-bottom: 40px; max-width: 1400px; --ink: #131311; --ink-soft: rgba(19,19,17,0.64); --ink-muted: rgba(19,19,17,0.4); --yellow: #f2df4e; --accent: #e2542e; }
.three-col { display: grid; grid-template-columns: 220px 1fr 260px; gap: 14px; align-items: start; }

.panel-card { background: #fff; border: none; border-radius: 20px; padding: 15px 16px; box-shadow: none; }
.panel-hd { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 800; color: var(--ink); margin-bottom: 10px; flex-wrap: wrap; }
.panel-dot { width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0; }
.panel-count { margin-left: auto; background: rgba(226,84,46,0.1); color: var(--accent); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; }

.left-panel { display: flex; flex-direction: column; gap: 10px; }
.goal-input { width: 100%; border: none; border-radius: 12px; padding: 9px 11px; font-size: 12px; color: var(--ink); background: rgba(19,19,17,0.04); resize: none; outline: none; font-family: inherit; line-height: 1.5; box-sizing: border-box; }
.goal-input:focus { box-shadow: 0 0 0 1.5px var(--ink); }
.quick-list { display: flex; flex-direction: column; gap: 6px; }
.quick-item { display: flex; align-items: flex-start; gap: 7px; padding: 8px 10px; border-radius: 12px; background: rgba(19,19,17,0.035); border: none; cursor: pointer; text-align: left; font-family: inherit; transition: background 0.15s; }
.quick-item:hover { background: var(--ink); } .quick-item:hover .quick-text { color: #fff; }
.quick-emoji { font-size: 13px; flex-shrink: 0; }
.quick-text { font-size: 11px; color: var(--ink-soft); line-height: 1.4; transition: color 0.15s; }
.status-list { display: flex; flex-direction: column; gap: 7px; }
.status-row { display: flex; align-items: center; justify-content: space-between; }
.status-label { font-size: 12px; color: #555; }
.status-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.status-badge.green { background: rgba(52,211,153,0.1); color: #059669; }
.status-badge.red   { background: rgba(225,29,72,0.1);  color: #e11d48; }
.status-badge.blue  { background: rgba(0,113,227,0.08); color: #0071e3; }
.clear-btn { width: 100%; margin-top: 10px; padding: 7px; border: 1px solid #E8E8E8; border-radius: 8px; background: #F8F8F6; font-size: 11px; color: #999; cursor: pointer; font-family: inherit; transition: all 0.15s; }
.clear-btn:hover { border-color: var(--ink); color: var(--ink); }

.chat-panel { background: #fff; border: none; border-radius: 24px; padding: 16px 16px 0; box-shadow: none; overflow: hidden; min-height: 520px; display: flex; flex-direction: column; }
.chat-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: -16px -16px 14px; padding: 14px 18px; background: var(--ink); flex-shrink: 0; }
.chat-header-left { display: flex; align-items: center; gap: 10px; }
.chat-agent-emoji { font-size: 24px; }
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

.typing { display: flex; gap: 4px; }
.typing-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); opacity: 0.4; animation: typingBounce 1.4s ease-in-out infinite; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce { 0%,100% { opacity: 0.4; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }

.chat-bar { display: flex; align-items: flex-end; gap: 8px; padding: 10px 0 14px; border-top: 1px solid rgba(0,0,0,0.06); flex-shrink: 0; }
.bar-input { flex: 1; border: none; border-radius: 999px; padding: 10px 15px; font-size: 13px; font-family: inherit; color: var(--ink); background: rgba(19,19,17,0.045); resize: none; outline: none; max-height: 120px; transition: box-shadow 0.15s; }
.bar-input:focus { box-shadow: 0 0 0 1.5px var(--ink); }
.bar-input::placeholder { color: var(--ink-muted); }
.bar-send { width: 38px; height: 38px; border-radius: 50%; border: none; background: var(--ink); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s, transform 0.15s; }
.bar-send:hover:not(:disabled) { background: var(--accent); transform: translateY(-1px); }
.bar-send:disabled { opacity: 0.4; cursor: not-allowed; }

.right-panel { display: flex; flex-direction: column; gap: 0; }
.output-empty { padding: 20px 0; text-align: center; font-size: 12px; color: #CCCCCC; font-style: italic; line-height: 1.6; }
.design-list { display: flex; flex-direction: column; gap: 14px; }
.design-block { }
.block-label { font-size: 11px; font-weight: 700; color: #555; margin-bottom: 7px; }
.palette-grid { display: flex; flex-direction: column; gap: 5px; }
.palette-swatch { width: 100%; height: 44px; border-radius: 7px; position: relative; display: flex; flex-direction: column; justify-content: flex-end; padding: 5px 8px; overflow: hidden; }
.swatch-hex { font-size: 10px; font-weight: 700; color: #fff; font-family: monospace; text-shadow: 0 1px 3px rgba(0,0,0,0.4); }
.swatch-name { font-size: 9px; color: rgba(255,255,255,0.8); text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
.prompt-block { position: relative; }
.prompt-text { background: #F8F8F6; border: 1px solid #E8E8E8; border-radius: 7px; padding: 9px 10px; font-size: 11px; line-height: 1.5; font-family: monospace; color: #444; white-space: pre-wrap; word-break: break-word; margin: 0; }
.copy-btn { position: absolute; top: 5px; right: 5px; font-size: 10px; padding: 2px 7px; border-radius: 4px; border: 1px solid #E8E8E8; background: #fff; color: #999; cursor: pointer; font-family: inherit; }
.copy-btn:hover { color: var(--ink); border-color: var(--ink); }
.image-block { }
.generated-image { width: 100%; border-radius: 8px; cursor: pointer; border: 1px solid #E8E8E8; transition: transform 0.15s; }
.generated-image:hover { transform: scale(1.02); }
.img-loading { padding: 16px; text-align: center; font-size: 12px; color: #AAAAAA; background: #F8F8F6; border-radius: 8px; border: 1px dashed #E8E8E8; }
.img-error { padding: 12px; text-align: center; font-size: 12px; color: #AAAAAA; }
.image-link { display: block; margin-top: 5px; font-size: 10px; color: #0071e3; text-decoration: none; }
.image-link:hover { opacity: 0.75; }
.clear-canvas-btn { margin-left: auto; background: none; border: none; font-size: 10px; color: #CCCCCC; cursor: pointer; font-family: inherit; padding: 0 2px; }
.clear-canvas-btn:hover { color: var(--accent); }

@media (max-width: 1100px) { .three-col { grid-template-columns: 1fr; } .left-panel, .right-panel { display: none; } }
</style>
