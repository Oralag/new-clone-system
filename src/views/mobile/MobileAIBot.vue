<template>
  <div class="m-ai-bot">
    <!-- 顶部栏 -->
    <div class="m-ai-topbar">
      <button class="m-ai-back" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <div class="m-ai-title-area">
        <div class="m-ai-title">🦢 管家</div>
        <div class="m-ai-sub">AI 业务助手</div>
      </div>
      <div style="width:36px" />
    </div>

    <!-- 快捷命令提示 -->
    <div class="m-ai-prompts">
      <div class="m-ai-prompts-title">试试这样说：</div>
      <div class="m-ai-prompts-scroll">
        <div v-for="p in prompts" :key="p.text" class="m-ai-prompt-tag" @click="sendPrompt(p.text)">
          {{ p.text }}
        </div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="msgListRef" class="m-ai-messages">
      <!-- 欢迎 -->
      <div v-if="messages.length === 0" class="m-ai-welcome">
        <div class="m-ai-welcome-icon">🦢</div>
        <div class="m-ai-welcome-title">你好，我是管家</div>
        <div class="m-ai-welcome-sub">用自然语言告诉我您要做什么，我来帮您录入业务数据</div>
      </div>

      <div v-for="(msg, idx) in messages" :key="idx" class="m-ai-msg" :class="msg.role === 'user' ? 'm-ai-msg-user' : 'm-ai-msg-bot'">
        <div v-if="msg.role === 'assistant'" class="m-ai-msg-bot-avatar">🦢</div>
        <div v-else class="m-ai-msg-user-avatar">{{ authStore.userName?.[0] || '我' }}</div>

        <div class="m-ai-msg-content">
          <!-- 确认卡片 -->
          <div v-if="msg.type === 'confirm_card' && msg.parsed" class="m-ai-confirm-card" :class="getConfidenceClass(msg.confidence)">
            <div class="m-ai-confirm-header">
              <span class="m-ai-confirm-label">{{ getTypeName(msg.parsed.type) }}</span>
              <span class="m-ai-confirm-conf" :class="getConfidenceClass(msg.confidence)">
                {{ Math.round((msg.confidence || 0) * 100) }}%
              </span>
            </div>
            <div class="m-ai-confirm-body">
              <div v-for="(val, key) in formatParsedParams(msg.parsed)" :key="key" class="m-ai-confirm-row">
                <span class="m-ai-confirm-key">{{ key }}</span>
                <span class="m-ai-confirm-val">{{ val }}</span>
              </div>
            </div>
            <div v-if="msg.confidence < 0.85" class="m-ai-confirm-warning">
              ⚠️ 信息可能有偏差，请仔细核对
            </div>
            <div class="m-ai-confirm-actions">
              <button class="m-ai-confirm-btn" :disabled="msg._submitting" @click="submitOrder(msg)">
                {{ msg._submitting ? '录入中...' : '确认录入' }}
              </button>
              <button class="m-ai-modify-btn" @click="editOrder(msg)">修改</button>
              <button class="m-ai-cancel-btn" @click="removeMsg(idx)">取消</button>
            </div>
            <div v-if="msg.submitted" class="m-ai-confirm-submitted">
              ✅ 已录入系统，状态为「待审核」
            </div>
          </div>

          <!-- 普通回复 -->
          <div v-else-if="msg.role === 'assistant'" class="m-ai-bot-text" v-html="renderText(msg.content)" />
          <div v-else class="m-ai-user-text">{{ msg.content }}</div>

          <div class="m-ai-msg-time">{{ formatTime(msg.created_at) }}</div>
        </div>
      </div>

      <!-- 思考中 -->
      <div v-if="loading" class="m-ai-msg m-ai-msg-bot">
        <div class="m-ai-msg-bot-avatar">🦢</div>
        <div class="m-ai-msg-content">
          <div class="m-ai-thinking">
            <div class="m-ai-thinking-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>

      <div ref="bottomRef" />
    </div>

    <!-- 修改弹窗 -->
    <div v-if="editingMsg !== null" class="m-modal-mask" @click.self="editingMsg = null">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>修改信息</span>
          <button class="m-modal-close" @click="editingMsg = null">取消</button>
        </div>
        <div class="m-modal-body">
          <div v-for="field in editFields" :key="field.key" class="m-form-item">
            <label>{{ field.label }}</label>
            <input v-model="field.value" class="m-input" :placeholder="field.label" />
          </div>
        </div>
        <div class="m-modal-footer">
          <button class="m-btn-primary" @click="submitEdit">确认修改</button>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="m-ai-input-area">
      <textarea
        ref="inputRef"
        v-model="inputText"
        class="m-ai-textarea"
        placeholder="@管家 + 描述业务，如：录销售单，客户老王，奶茶5箱，200元"
        rows="1"
        @keydown.enter.exact.prevent="sendMessage"
        @input="autoResize"
      />
      <button class="m-ai-send-btn" :disabled="!inputText.trim() || loading" @click="sendMessage">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import http from '@/api/http'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const messages = ref<any[]>([])
const inputText = ref('')
const loading = ref(false)
const msgListRef = ref<HTMLElement>()
const bottomRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()
const editingMsg = ref<number | null>(null)
const editFields = ref<any[]>([])

const prompts = [
  { text: '录销售单，客户老王，奶茶5箱，200元' },
  { text: '录采购单，向蒙牛采购牛奶100箱' },
  { text: '查询奶茶库存' },
  { text: '安排小李明天盘点A仓库' },
  { text: '今天卖了多少钱' },
]

const typeNameMap: Record<string, string> = {
  sale: '📦 销售出库单',
  procure: '🛒 采购入库单',
  stock_query: '🔍 库存查询',
  customer_query: '👤 客户查询',
  task: '📋 任务安排',
  chat: '💬 闲聊',
}

function getTypeName(type: string) {
  return typeNameMap[type] || type
}

function getConfidenceClass(confidence: number) {
  if (confidence >= 0.85) return 'high'
  if (confidence >= 0.6) return 'med'
  return 'low'
}

function formatParsedParams(parsed: any) {
  if (!parsed?.params) return {}
  const p = parsed.params
  const result: Record<string, string> = {}
  if (p.customer) result['客户'] = p.customer
  if (p.supplier) result['供应商'] = p.supplier
  if (p.product || p.goods_name) result['商品'] = `${p.goods_name || p.product} × ${p.quantity || ''}${p.unit || '箱'}`
  if (p.amount !== undefined) result['金额'] = `¥${p.amount}`
  if (p.assignee) result['负责人'] = p.assignee
  if (p.due_date) result['截止日期'] = p.due_date
  if (p.title) result['任务'] = p.title
  if (p.stock !== undefined) result['库存'] = `${p.stock} ${p.unit || '箱'}`
  if (p.warning) result['⚠️'] = p.warning
  return result
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function renderText(text: string) {
  return text?.replace(/\n/g, '<br>') || ''
}

function autoResize() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 100) + 'px'
}

async function scrollToBottom() {
  await nextTick()
  bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
}

async function sendPrompt(text: string) {
  inputText.value = text
  await sendMessage()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  inputText.value = ''
  if (inputRef.value) inputRef.value.style.height = 'auto'

  const userMsg = {
    role: 'user',
    content: text,
    created_at: new Date().toISOString(),
  }
  messages.value.push(userMsg)
  loading.value = true
  await scrollToBottom()

  try {
    const res = await http.post('/ai/parse', {
      message: text,
      user_id: authStore.userInfo?.id,
    })
    const data = res?.data ?? res

    loading.value = false

    // 检查是否是业务指令
    if (data?.type && data?.type !== 'chat' && data?.confidence > 0) {
      messages.value.push({
        role: 'assistant',
        type: 'confirm_card',
        parsed: data,
        confidence: data.confidence || 0.85,
        created_at: new Date().toISOString(),
      })
    } else if (data?.response) {
      messages.value.push({
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      })
    } else if (data?.type === 'chat') {
      messages.value.push({
        role: 'assistant',
        content: data.response || '好的，请问还有什么需要帮忙的？',
        created_at: new Date().toISOString(),
      })
    } else {
      messages.value.push({
        role: 'assistant',
        content: '我理解您想做的事情，但信息不够完整。请补充以下内容：\n• 客户名/供应商名\n• 商品名称和数量\n• 金额\n\n例如："录销售单，客户老王，奶茶5箱，200元"',
        created_at: new Date().toISOString(),
      })
    }
  } catch (e: any) {
    loading.value = false
    messages.value.push({
      role: 'assistant',
      content: e?.message || '抱歉，网络出错了，请稍后重试。',
      created_at: new Date().toISOString(),
    })
  }

  await scrollToBottom()
}

async function submitOrder(msg: any) {
  msg._submitting = true
  try {
    await http.post('/ai/confirm-order', {
      parsed: msg.parsed,
      source: 'ai_bot',
      status: 'pending_review', // 默认待审核
    })
    msg.submitted = true
    ElMessage.success('已录入系统，状态为「待审核」，请等待管理员审批')
  } catch (e: any) {
    ElMessage.error(e?.message || '录入失败')
  } finally {
    msg._submitting = false
  }
}

function editOrder(msg: any) {
  const params = formatParsedParams(msg.parsed)
  editFields.value = Object.entries(params).map(([key, val]) => ({
    key,
    label: key,
    value: val as string,
  }))
  editingMsg.value = messages.value.indexOf(msg)
}

function submitEdit() {
  if (editingMsg.value === null) return
  const msg = messages.value[editingMsg.value]
  // 更新 parsed params
  if (msg.parsed?.params) {
    const p = msg.parsed.params
    if (editFields.value.find(f => f.key === '客户')) p.customer = editFields.value.find(f => f.key === '客户')?.value
    if (editFields.value.find(f => f.key === '供应商')) p.supplier = editFields.value.find(f => f.key === '供应商')?.value
    if (editFields.value.find(f => f.key.includes('商品'))) {
      const field = editFields.value.find(f => f.key.includes('商品'))
      if (field) {
        const match = field.value.match(/^(.+?)\s*×?\s*(\d+)/)
        if (match) { p.goods_name = match[1]; p.quantity = Number(match[2]) }
      }
    }
    if (editFields.value.find(f => f.key === '金额')) {
      const val = editFields.value.find(f => f.key === '金额')?.value
      p.amount = Number((val || '').replace(/[^0-9.]/g, ''))
    }
  }
  editingMsg.value = null
  ElMessage.success('已修改')
}

function removeMsg(idx: number) {
  messages.value.splice(idx, 1)
}

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<style scoped>
.m-ai-bot {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: #f5f5f7;
}

/* ── 顶部栏 ── */
.m-ai-topbar {
  height: 52px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid #e5e6eb;
  flex-shrink: 0;
}
.m-ai-back {
  width: 36px; height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #4e5969;
}
.m-ai-title-area { flex: 1; text-align: center; }
.m-ai-title { font-size: 17px; font-weight: 700; color: #1d2129; }
.m-ai-sub { font-size: 11px; color: #86909c; }

/* ── 快捷提示 ── */
.m-ai-prompts {
  background: #fff;
  padding: 10px 16px 8px;
  border-bottom: 1px solid #f2f3f5;
}
.m-ai-prompts-title { font-size: 11px; font-weight: 600; color: #86909c; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
.m-ai-prompts-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.m-ai-prompts-scroll::-webkit-scrollbar { display: none; }
.m-ai-prompt-tag {
  flex-shrink: 0;
  background: #f0f7ff;
  color: #0071e3;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border: 1px solid #bfdbfe;
}
.m-ai-prompt-tag:active { background: #dbeafe; }

/* ── 消息列表 ── */
.m-ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  -webkit-overflow-scrolling: touch;
}

.m-ai-welcome {
  text-align: center;
  padding: 40px 0 24px;
}
.m-ai-welcome-icon { font-size: 48px; margin-bottom: 12px; }
.m-ai-welcome-title { font-size: 18px; font-weight: 700; color: #1d2129; margin-bottom: 6px; }
.m-ai-welcome-sub { font-size: 13px; color: #86909c; line-height: 1.5; padding: 0 24px; }

.m-ai-msg {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 16px;
}
.m-ai-msg-user { flex-direction: row-reverse; }
.m-ai-msg-bot-avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, #0071e3, #005bb5);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.m-ai-msg-user-avatar {
  width: 32px; height: 32px;
  background: #e5e6eb;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #4e5969;
  flex-shrink: 0;
}
.m-ai-msg-content { display: flex; flex-direction: column; max-width: 75%; }
.m-ai-msg-user .m-ai-msg-content { align-items: flex-end; }
.m-ai-user-text {
  background: #0071e3;
  color: #fff;
  padding: 10px 14px;
  border-radius: 16px 16px 4px 16px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}
.m-ai-bot-text {
  background: #fff;
  color: #1d2129;
  padding: 10px 14px;
  border-radius: 16px 16px 16px 4px;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.m-ai-msg-time { font-size: 10px; color: #86909c; margin-top: 4px; padding: 0 4px; }

/* ── AI 确认卡片 ── */
.m-ai-confirm-card {
  background: #fff;
  border-radius: 16px;
  border: 1.5px solid #bfdbfe;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.m-ai-confirm-card.low { border-color: #fca5a5; }
.m-ai-confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
}
.m-ai-confirm-label { font-size: 14px; font-weight: 700; color: #1d2129; }
.m-ai-confirm-conf {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}
.m-ai-confirm-conf.high { background: #dcfce7; color: #16a34a; }
.m-ai-confirm-conf.med { background: #fef9c3; color: #ca8a04; }
.m-ai-confirm-conf.low { background: #fee2e2; color: #dc2626; }
.m-ai-confirm-body { padding: 12px 14px; }
.m-ai-confirm-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f2f3f5;
  font-size: 14px;
}
.m-ai-confirm-row:last-child { border-bottom: none; }
.m-ai-confirm-key { color: #86909c; font-weight: 500; }
.m-ai-confirm-val { color: #1d2129; font-weight: 600; text-align: right; }
.m-ai-confirm-warning {
  font-size: 12px;
  color: #92400e;
  background: #fef3c7;
  padding: 6px 14px;
}
.m-ai-confirm-actions {
  display: flex;
  gap: 8px;
  padding: 10px 14px 12px;
}
.m-ai-confirm-btn {
  flex: 1;
  height: 40px;
  background: #0071e3;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.m-ai-confirm-btn:disabled { background: #a0cfff; cursor: not-allowed; }
.m-ai-modify-btn, .m-ai-cancel-btn {
  height: 40px;
  padding: 0 16px;
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  background: #fff;
  color: #4e5969;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.m-ai-confirm-submitted {
  text-align: center;
  font-size: 13px;
  color: #16a34a;
  font-weight: 600;
  padding: 8px 14px 12px;
  background: #f0fdf4;
  border-top: 1px solid #dcfce7;
}

/* ── 思考中 ── */
.m-ai-thinking {
  background: #fff;
  padding: 14px 18px;
  border-radius: 16px 16px 16px 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  display: inline-block;
}
.m-ai-thinking-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}
.m-ai-thinking-dots span {
  width: 6px;
  height: 6px;
  background: #86909c;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.m-ai-thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.m-ai-thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* ── 输入区 ── */
.m-ai-input-area {
  background: #fff;
  border-top: 1px solid #e5e6eb;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.m-ai-textarea {
  flex: 1;
  background: #f5f5f7;
  border: 1.5px solid transparent;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 15px;
  color: #1d2129;
  outline: none;
  resize: none;
  line-height: 1.5;
  max-height: 100px;
  font-family: inherit;
  transition: border 0.15s;
}
.m-ai-textarea:focus { border-color: #0071e3; background: #fff; }
.m-ai-send-btn {
  width: 40px; height: 40px;
  background: #0071e3;
  border: none;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.m-ai-send-btn:disabled { background: #d1d5db; cursor: not-allowed; }

/* ── 弹窗 ── */
.m-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.m-modal-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
}
.m-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
}
.m-modal-close { border: none; background: transparent; color: #0071e3; font-size: 14px; cursor: pointer; }
.m-modal-body { padding: 16px; }
.m-modal-footer { padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px); border-top: 1px solid #f2f3f5; }
.m-form-item { margin-bottom: 12px; }
.m-form-item label { display: block; font-size: 13px; font-weight: 600; color: #4e5969; margin-bottom: 6px; }
.m-input {
  width: 100%;
  height: 44px;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 15px;
  color: #1d2129;
  outline: none;
  box-sizing: border-box;
}
.m-input:focus { border-color: #0071e3; background: #fff; }
.m-btn-primary {
  width: 100%;
  height: 48px;
  background: #0071e3;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
