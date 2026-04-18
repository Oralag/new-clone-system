<template>
  <div class="ai-page">
    <!-- 顶部栏 -->
    <div class="ai-topbar">
      <div class="ai-topbar-info">
        <div class="ai-avatar"><el-icon :size="18"><Cpu /></el-icon></div>
        <div>
          <div class="ai-name">数字游牧 AI 助手</div>
          <div class="ai-status">{{ isLoading ? '正在输入...' : '在线' }}</div>
        </div>
      </div>
      <button class="ai-topbar-back" @click="router.back()" title="返回首页">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
    </div>

    <!-- 消息列表 -->
    <div ref="messagesRef" class="ai-messages">
      <!-- 欢迎界面 -->
      <div v-if="messages.length === 0" class="ai-welcome">
        <div class="ai-welcome-icon"><el-icon :size="44" color="#0071e3"><Cpu /></el-icon></div>
        <div class="ai-welcome-title">你好！我是数字游牧 AI 助手</div>
        <div class="ai-welcome-sub">用自然语言描述需求，我来帮你查询或录入数据</div>
        <div class="ai-quick-prompts">
          <div v-for="p in quickPrompts" :key="p" class="ai-quick-tag" @click="sendQuickPrompt(p)">{{ p }}</div>
        </div>
      </div>

      <!-- 消息 -->
      <div v-for="(msg, idx) in messages" :key="idx" class="ai-msg" :class="msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'">
        <div class="ai-msg-avatar">
          <el-icon v-if="msg.role === 'assistant'"><Cpu /></el-icon>
          <el-icon v-else><User /></el-icon>
        </div>
        <div class="ai-msg-bubble">
          <div v-if="msg.images?.length" class="ai-msg-images">
            <img v-for="(url,i) in msg.images" :key="i" :src="url" class="ai-msg-img" @click="previewImg = url" />
          </div>
          <AiToolCallCard
            v-for="tc in msg.toolCalls" :key="tc.id"
            :name="tc.name" :input="tc.input" :result="tc.result" :status="tc.status"
          />
          <div class="ai-msg-content" v-html="renderMarkdown(msg.content)" />
          <div v-if="msg.navRoute" class="ai-msg-nav">
            <el-button type="primary" size="small" @click="router.push(msg.navRoute!)">立即查看 →</el-button>
          </div>
          <div class="ai-msg-time">{{ msg.time }}</div>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="isLoading" class="ai-msg ai-msg-bot">
        <div class="ai-msg-avatar"><el-icon><Cpu /></el-icon></div>
        <div class="ai-msg-bubble">
          <div class="ai-typing"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="ai-input-area">
      <div v-if="pendingImages.length" class="ai-pending-images">
        <div v-for="(img, idx) in pendingImages" :key="idx" class="ai-pending-img-wrap">
          <img :src="img.previewUrl" class="ai-pending-img" />
          <div class="ai-pending-img-rm" @click="pendingImages.splice(idx, 1)">
            <el-icon><Close /></el-icon>
          </div>
        </div>
      </div>
      <div class="ai-input-row">
        <div class="ai-input-actions">
          <el-button tabindex="-1" :icon="Picture" circle size="small" plain @click="fileInputRef?.click()" :disabled="isLoading" />
          <el-button tabindex="-1" v-if="voiceSupported" :icon="Microphone" circle size="small"
            :type="isRecording ? 'danger' : ''" :plain="!isRecording"
            :class="{ 'mic-active': isRecording }"
            @click.prevent="toggleVoice" :disabled="isLoading" />
        </div>
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="ai-textarea"
          rows="1"
          :placeholder="isRecording ? '正在聆听...' : '问我任何事...'"
          :disabled="isLoading"
          enterkeyhint="send"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
        />
        <el-button type="primary" :icon="Promotion" :loading="isLoading"
          :disabled="!inputText.trim() && !pendingImages.length"
          @click="sendMessage" class="ai-send-btn" />
      </div>
    </div>

    <!-- 图片预览 -->
    <div v-if="previewImg" class="ai-img-preview" @click="previewImg = ''">
      <img :src="previewImg" />
    </div>

    <input ref="fileInputRef" type="file" accept="image/*" multiple style="display:none" @change="onFileChange" />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Cpu, User, Close, Picture, Microphone, Promotion } from '@element-plus/icons-vue'
import http from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import AiToolCallCard from '@/components/ai/AiToolCallCard.vue'

const router = useRouter()
const authStore = useAuthStore()

interface ToolCallState { id: string; name: string; input: any; result: any; status: 'running'|'success'|'error' }
interface Message {
  role: 'user'|'assistant'
  content: string
  time: string
  images?: string[]
  toolCalls?: ToolCallState[]
  navRoute?: string
}
interface ImageItem { previewUrl: string; data: string; mediaType: string }

const HISTORY_KEY = 'erp_ai_chat_history'
function loadHistory(): Message[] {
  try { const r = localStorage.getItem(HISTORY_KEY); if (r) return JSON.parse(r) } catch {}
  return []
}
function saveHistory(msgs: Message[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-100))) } catch {}
}

const messagesRef = ref<HTMLDivElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const messages = ref<Message[]>(loadHistory())
const inputText = ref('')
const isLoading = ref(false)
const pendingImages = ref<ImageItem[]>([])
const previewImg = ref('')

watch(messages, val => saveHistory(val), { deep: true })

const quickPrompts = ['新增一个客户','本月销售总额','查询库存商品','录入采购订单','录入一笔预付款']

function getNow() { return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }

function renderMarkdown(text: string) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/^- (.+)/gm, '• $1')
}

function scrollToBottom() {
  nextTick(() => { if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight })
}

function clearMessages() { messages.value = []; localStorage.removeItem(HISTORY_KEY) }

function autoResize() {
  nextTick(() => {
    if (!textareaRef.value) return
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 120) + 'px'
  })
}

async function sendQuickPrompt(p: string) { inputText.value = p; await sendMessage() }

// ── 图片上传 ──
async function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      const match = result.match(/^data:(.+);base64,(.+)$/)
      if (match) {
        pendingImages.value.push({ previewUrl: result, data: match[2], mediaType: match[1] })
      }
    }
    reader.readAsDataURL(file)
  }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ── 语音 ──
const voiceSupported = ref(!!(window.SpeechRecognition || (window as any).webkitSpeechRecognition))
const isRecording = ref(false)
let recognition: any = null
function toggleVoice() {
  if (isRecording.value) { recognition?.stop(); return }
  const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) return
  recognition = new SR()
  recognition.lang = 'zh-CN'; recognition.continuous = false; recognition.interimResults = false
  recognition.onresult = (e: any) => { inputText.value += e.results[0][0].transcript }
  recognition.onend = () => { isRecording.value = false }
  recognition.onerror = () => { isRecording.value = false }
  recognition.start(); isRecording.value = true
}

// ── 发送消息 ──
async function sendMessage() {
  const text = inputText.value.trim()
  const hasImages = pendingImages.value.length > 0
  if ((!text && !hasImages) || isLoading.value) return

  const imagesToSend = [...pendingImages.value]
  messages.value.push({
    role: 'user',
    content: text || '请识别这张单据图片',
    time: getNow(),
    images: imagesToSend.length ? imagesToSend.map(i => i.previewUrl) : undefined,
  })
  inputText.value = ''
  pendingImages.value = []
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
  isLoading.value = true
  nextTick(() => scrollToBottom())

  // 拼接上下文数据
  let contextData = ''
  if (text) { try { contextData = await fetchContextData(text) } catch {} }

  const BAD_PHRASES = ['无法直接操作', '仅为信息整理', '需要您手动', '手动在对应系统']
  const apiMessages = messages.value
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .filter(m => !BAD_PHRASES.some(p => m.content.includes(p)))
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content }))

  if (contextData) {
    const last = apiMessages[apiMessages.length - 1]
    if (last?.role === 'user') last.content += `\n\n[系统实时数据]\n${contextData}`
  }

  // 处理图片
  if (imagesToSend.length && apiMessages.length > 0) {
    const last = apiMessages[apiMessages.length - 1]
    ;(last as any).content = [
      { type: 'text', text: (last as any).content || '请识别这张单据' },
      ...imagesToSend.map(img => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
    ]
  }

  const assistantMsg: Message = { role: 'assistant', content: '', time: getNow(), toolCalls: [] }
  messages.value.push(assistantMsg)
  nextTick(() => scrollToBottom())

  try {
    const token = authStore.token || localStorage.getItem('erp_token') || ''
    const resp = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ messages: apiMessages }),
    })
    if (!resp.ok || !resp.body) throw new Error('请求失败')

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const evt = JSON.parse(data)
          if (evt.type === 'text') {
            assistantMsg.content += evt.text
            nextTick(() => scrollToBottom())
          } else if (evt.type === 'tool_start') {
            assistantMsg.toolCalls?.push({ id: evt.id, name: evt.name, input: evt.input, result: null, status: 'running' })
            nextTick(() => scrollToBottom())
          } else if (evt.type === 'tool_result') {
            const tc = assistantMsg.toolCalls?.find(t => t.id === evt.id)
            if (tc) { tc.result = evt.result; tc.status = evt.error ? 'error' : 'success' }
            nextTick(() => scrollToBottom())
          } else if (evt.type === 'nav') {
            assistantMsg.navRoute = evt.route
          } else if (evt.type === 'error') {
            assistantMsg.content += '\n[错误] ' + evt.message
          }
        } catch {}
      }
    }
  } catch (e: any) {
    assistantMsg.content = '网络错误，请检查连接后重试。'
  } finally {
    isLoading.value = false
    nextTick(() => scrollToBottom())
  }
}

// ── 数据上下文（复用 AiAssistant 同逻辑）──
async function fetchContextData(text: string): Promise<string> {
  const lower = text.toLowerCase()
  const results: string[] = []
  try {
    if (lower.includes('销售') || lower.includes('合同') || lower.includes('收入')) {
      const [outRes, contractRes]: any[] = await Promise.all([
        http.get('/stock/SaleOutOrder/index', { params: { list_rows: 100 } }),
        http.get('/shop/ContractOrder/index', { params: { list_rows: 50 } }),
      ])
      const outRows: any[] = outRes?.data?.rows || []
      results.push(`【销售出货单】共${outRows.length}条，合计¥${outRows.reduce((s:number,r:any)=>s+Number(r.total_amount||0),0).toFixed(2)}`)
      const cRows: any[] = contractRes?.data?.rows || []
      results.push(`【销售合同】共${cRows.length}份，合计¥${cRows.reduce((s:number,r:any)=>s+Number(r.total_amount||0),0).toFixed(2)}`)
    }
    if (lower.includes('库存')) {
      const res: any = await http.get('/stock/StockAll/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【库存】共${rows.length}种商品。前10条：${JSON.stringify(rows.slice(0,10).map((r:any)=>({商品:r.goods_name,库存:r.qty,单位:r.unit_name})))}`)
    }
    if (lower.includes('客户')) {
      const res: any = await http.get('/shop/ShopCustomer/index', { params: { list_rows: 200 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【客户】共${res?.data?.total||rows.length}位。前10：${JSON.stringify(rows.slice(0,10).map((r:any)=>({名称:r.nickname||r.name,手机:r.mobile})))}`)
    }
    if (lower.includes('商品')) {
      const res: any = await http.get('/goods/ShopGoods/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【商品】共${res?.data?.total||rows.length}种。前10：${JSON.stringify(rows.slice(0,10).map((r:any)=>({名称:r.goods_name,售价:r.sell_price})))}`)
    }
    if (lower.includes('采购')) {
      const res: any = await http.get('/procure/ProcureOrder/index', { params: { list_rows: 50 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【采购订单】共${rows.length}条`)
    }
    if (lower.includes('财务') || lower.includes('应收') || lower.includes('应付') || lower.includes('账户')) {
      const [fundRes]: any[] = await Promise.all([
        http.get('/finance/Fund/index', { params: { list_rows: 100 } }),
      ])
      const funds: any[] = fundRes?.data?.rows || []
      results.push(`【资金账户】${funds.map((f:any)=>f.name+'¥'+f.balance).join('、')}（录入时用fund_id：${JSON.stringify(funds.map((f:any)=>({id:f.id,name:f.name})))}）`)
    }
  } catch {}
  return results.join('\n')
}
</script>

<style scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: #f5f5f7;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.ai-topbar-back {
  width: 34px; height: 34px;
  background: #f5f5f7; border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #4e5969; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ai-topbar-back:active { background: #e8e8e8; }

/* ── 顶部栏 ── */
.ai-topbar {
  background: #fff;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.ai-topbar-info { display: flex; align-items: center; gap: 10px; }
.ai-avatar {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(0,113,227,0.1);
  display: flex; align-items: center; justify-content: center;
  color: #0071e3; flex-shrink: 0;
}
.ai-name { font-size: 15px; font-weight: 700; color: #1d2129; }
.ai-status { font-size: 11px; color: #86909c; }

/* ── 消息列表 ── */
.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  -webkit-overflow-scrolling: touch;
}

/* 欢迎 */
.ai-welcome {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 20px 0; text-align: center; gap: 8px;
}
.ai-welcome-icon { margin-bottom: 6px; }
.ai-welcome-title { font-size: 17px; font-weight: 700; color: #1d2129; }
.ai-welcome-sub { font-size: 13px; color: #86909c; line-height: 1.5; }
.ai-quick-prompts { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 16px; }
.ai-quick-tag {
  padding: 8px 14px; background: #fff; border-radius: 20px;
  font-size: 13px; color: #0071e3; font-weight: 500; cursor: pointer;
  border: 1px solid rgba(0,113,227,0.2);
  -webkit-tap-highlight-color: transparent;
}
.ai-quick-tag:active { background: rgba(0,113,227,0.06); }

/* 消息项 */
.ai-msg {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.ai-msg-user { flex-direction: row-reverse; }
.ai-msg-avatar {
  width: 30px; height: 30px; border-radius: 8px;
  background: #f0f0f0; color: #86909c;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 14px;
}
.ai-msg-user .ai-msg-avatar { background: #0071e3; color: #fff; }
.ai-msg-bubble {
  max-width: 80%;
  background: #fff;
  border-radius: 16px 16px 16px 4px;
  padding: 10px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.ai-msg-user .ai-msg-bubble {
  background: #0071e3;
  border-radius: 16px 16px 4px 16px;
}
.ai-msg-content { font-size: 14px; line-height: 1.6; color: #1d2129; word-break: break-word; }
.ai-msg-user .ai-msg-content { color: #fff; }
.ai-msg-user .ai-msg-content :deep(a) { color: rgba(255,255,255,0.85); }
.ai-msg-content :deep(p) { margin: 4px 0; }
.ai-msg-content :deep(ul), .ai-msg-content :deep(ol) { padding-left: 18px; margin: 4px 0; }
.ai-msg-content :deep(code) { background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 4px; font-size: 12px; }
.ai-msg-time { font-size: 10px; color: rgba(0,0,0,0.25); margin-top: 4px; text-align: right; }
.ai-msg-user .ai-msg-time { color: rgba(255,255,255,0.5); }

.ai-msg-images { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
.ai-msg-img { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; cursor: zoom-in; }

.ai-msg-nav { margin-top: 8px; }

/* 打字动画 */
.ai-typing { display: flex; gap: 4px; padding: 4px 2px; }
.ai-typing span {
  width: 6px; height: 6px; border-radius: 50%; background: #c2c8d5;
  animation: ai-bounce 1.2s ease-in-out infinite;
}
.ai-typing span:nth-child(2) { animation-delay: 0.2s; }
.ai-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes ai-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

/* ── 输入区 ── */
.ai-input-area {
  background: #fff;
  border-top: 1px solid #f0f0f0;
  padding: 10px 12px 14px;
  flex-shrink: 0;
}
.ai-pending-images { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.ai-pending-img-wrap { position: relative; }
.ai-pending-img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
.ai-pending-img-rm {
  position: absolute; top: -6px; right: -6px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #1d2129; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; cursor: pointer;
}

.ai-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.ai-input-actions { display: flex; gap: 6px; flex-shrink: 0; }
.ai-textarea {
  flex: 1;
  background: #f5f5f7;
  border: none;
  outline: none;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  color: #1d2129;
  resize: none;
  line-height: 1.5;
  min-height: 40px;
  max-height: 120px;
  font-family: inherit;
}
.ai-textarea::placeholder { color: #c2c8d5; }
.ai-send-btn { flex-shrink: 0; }

/* ── 图片预览 ── */
.ai-img-preview {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center;
}
.ai-img-preview img { max-width: 95vw; max-height: 90vh; border-radius: 12px; }

.mic-active { animation: mic-pulse 1s ease-in-out infinite; }
@keyframes mic-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
</style>
