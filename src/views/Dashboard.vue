<template>
  <div class="dashboard">
    <!-- Stats cards -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.key">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-sub">{{ stat.sub }}</div>
            </div>
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <!-- 账户余额单独占一行宽卡片 -->
      <el-col :span="24">
        <el-card class="stat-card balance-card" shadow="hover">
          <div class="balance-header">
            <el-icon :size="16"><Wallet /></el-icon>
            <span>资金账户余额</span>
          </div>
          <div class="balance-list" v-if="fundList.length">
            <div class="balance-item" v-for="f in fundList" :key="f.id">
              <span class="balance-name">{{ f.name }}</span>
              <span class="balance-amount">¥{{ Number(f.balance || 0).toFixed(2) }}</span>
            </div>
            <div class="balance-total">
              <span>合计</span>
              <span class="balance-total-amount">¥{{ fundTotal }}</span>
            </div>
          </div>
          <div v-else class="balance-empty">暂无账户数据</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts + Quick entries full width -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card header="近30天销售趋势">
          <div ref="saleTrendRef" style="height: 200px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="快捷入口">
          <div class="quick-list">
            <div v-for="item in quickItems" :key="item.path" class="quick-item" @click="item.newWindow ? openNewWindow() : router.push(item.path)">
              <div class="quick-icon" :style="{ background: item.color }">
                <el-icon :size="20"><component :is="item.icon" /></el-icon>
              </div>
              <span class="quick-label">{{ item.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- AI Assistant full width centered content -->
    <el-row :gutter="16">
      <el-col :span="24">
        <el-card class="ai-card">
          <template #header>
            <div class="ai-header">
              <span class="ai-title">🤖 AI 助手</span>
              <el-tag size="small" type="success">在线</el-tag>
            </div>
          </template>

          <div class="ai-messages" ref="messagesRef">
            <div v-for="(msg, i) in messages" :key="i" class="ai-message" :class="msg.role">
              <div class="msg-bubble">
                <span v-if="msg.role === 'assistant'" class="msg-avatar">🤖</span>
                <div class="msg-text" v-html="renderText(msg.content)" />
                <span v-if="msg.role === 'user'" class="msg-avatar user-icon">我</span>
              </div>
            </div>
            <div v-if="thinking" class="ai-message assistant">
              <div class="msg-bubble">
                <span class="msg-avatar">🤖</span>
                <div class="msg-text thinking">正在思考<span class="dots">...</span></div>
              </div>
            </div>
          </div>

          <div class="ai-input">
            <el-input
              v-model="inputText"
              placeholder="问我任何关于ERP的问题..."
              :disabled="thinking"
              @keyup.enter="sendMessage"
              clearable
            />
            <el-button type="primary" :loading="thinking" :disabled="!inputText.trim()" @click="sendMessage">
              发送
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { nextTick } from 'vue'
import { Wallet } from '@element-plus/icons-vue'
import { getFundList } from '@/api/finance'

const router = useRouter()

const stats = [
  { key: 'sale', label: '今日销售额', value: '--', sub: '环比昨日', icon: 'Money', color: '#ecf5ff' },
  { key: 'order', label: '今日订单', value: '--', sub: '待处理', icon: 'ShoppingCart', color: '#f0f9eb' },
  { key: 'customer', label: '客户总数', value: '--', sub: '本月新增', icon: 'User', color: '#fdf6ec' },
  { key: 'stock', label: '库存预警', value: '--', sub: '件商品不足', icon: 'WarningFilled', color: '#fef0f0' },
]

const quickItems = [
  { label: '收银台', path: '/cashregister', icon: 'CreditCard', color: '#e8f4fd', newWindow: true },
  { label: '客户管理', path: '/sale/client', icon: 'User', color: '#e8f0fe' },
  { label: '销售报价', path: '/sale/offer', icon: 'Document', color: '#fce8e6' },
  { label: '采购订单', path: '/procure/order', icon: 'Box', color: '#e6f4ea' },
  { label: '库存总览', path: '/warehouse/stock', icon: 'House', color: '#fef3e2' },
  { label: '应收账款', path: '/finance/receivable', icon: 'Wallet', color: '#e8eafd' },
  { label: '商品列表', path: '/goods/info', icon: 'Goods', color: '#fce8f3' },
  { label: '员工档案', path: '/personnel/staff', icon: 'Avatar', color: '#e3f2fd' },
  { label: '系统设置', path: '/setting/admin', icon: 'Setting', color: '#f3e5f5' },
]

function openNewWindow() {
  window.open('/#/cashregister', '_blank')
}

const saleTrendRef = ref<HTMLDivElement>()
const fundList = ref<any[]>([])
const fundTotal = computed(() =>
  fundList.value.reduce((s, f) => s + Number(f.balance || 0), 0).toFixed(2)
)

onMounted(async () => {
  if (saleTrendRef.value) {
    saleTrendRef.value.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#86909c;font-size:13px">暂无数据</div>`
  }
  try {
    const res = await getFundList({ list_rows: 100 })
    fundList.value = res.data?.rows ?? []
  } catch {}
})

// AI Assistant
interface Message { role: 'user' | 'assistant'; content: string }

const messages = ref<Message[]>([
  { role: 'assistant', content: '你好！我是ERP智能助手，可以帮你解答系统使用问题、业务操作、数据分析等。有什么我可以帮你的吗？' }
])
const inputText = ref('')
const thinking = ref(false)
const messagesRef = ref<HTMLDivElement>()

function renderText(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

async function scrollToBottom() {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || thinking.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  thinking.value = true
  await scrollToBottom()

  const assistantMsg: Message = { role: 'assistant', content: '' }
  messages.value.push(assistantMsg)

  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: '你是一个专业的ERP系统AI助手。系统包含：客户管理、销售管理（报价/合同/出库/退货）、采购管理（供应商/计划/订单/入库）、仓库管理（库存/调拨/盘点/报废）、财务管理（应收应付/收付款/发票/对账）、商品管理（资料/分类/单位/品牌/BOM）、生产管理、委外管理、零售管理、人事管理、办公管理、系统设置。请用简洁专业的中文回答，操作类问题给出清晰步骤。',
        messages: messages.value
          .slice(0, -1)
          .filter(m => m.content)
          .map(m => ({ role: m.role, content: m.content }))
      })
    })

    if (!response.ok || !response.body) throw new Error('请求失败')

    thinking.value = false  // hide spinner once streaming starts
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          if (parsed.text) {
            assistantMsg.content += parsed.text
            await scrollToBottom()
          }
          if (parsed.error) {
            assistantMsg.content = '抱歉，AI服务暂时不可用：' + parsed.error
          }
        } catch {}
      }
    }
  } catch (e: any) {
    assistantMsg.content = '网络错误，请检查连接后重试。'
  } finally {
    thinking.value = false
    if (!assistantMsg.content) {
      assistantMsg.content = '抱歉，未能获取回复，请重试。'
    }
    await scrollToBottom()
  }
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card { border-radius: 10px; }

.balance-card :deep(.el-card__body) { padding: 14px 20px; }

.balance-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 12px;
}

.balance-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
}

.balance-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 20px 4px 0;
  border-right: 1px solid #f0f0f0;
  margin-right: 20px;
}

.balance-name {
  font-size: 13px;
  color: #4e5969;
}

.balance-amount {
  font-size: 15px;
  font-weight: 600;
  color: #165dff;
}

.balance-total {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: #4e5969;
}

.balance-total-amount {
  font-size: 16px;
  font-weight: 700;
  color: #f53f3f;
}

.balance-empty {
  font-size: 13px;
  color: #86909c;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label { font-size: 13px; color: #86909c; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: #1d2129; line-height: 1; margin-bottom: 6px; }
.stat-sub { font-size: 12px; color: #86909c; }

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #165dff;
}

.quick-list { display: flex; flex-wrap: wrap; gap: 12px; }

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 10px;
  transition: background 0.15s;
  min-width: 68px;
}

.quick-item:hover { background: #f2f3f5; }

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #165dff;
}

.quick-label { font-size: 12px; color: #4e5969; }

/* AI Card */
.ai-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ai-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-title {
  font-weight: 600;
  font-size: 14px;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 360px;
  max-height: 480px;
}

.ai-message {
  display: flex;
}

.ai-message.user {
  justify-content: flex-end;
}

.ai-message.assistant {
  justify-content: flex-start;
}

.msg-bubble {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 85%;
}

.ai-message.user .msg-bubble {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  line-height: 28px;
  text-align: center;
}

.user-icon {
  background: #165dff;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.msg-text {
  background: #f2f3f5;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.6;
  color: #1d2129;
  word-break: break-word;
}

.ai-message.user .msg-text {
  background: #165dff;
  color: #fff;
  border-radius: 12px 2px 12px 12px;
}

.ai-message.assistant .msg-text {
  border-radius: 2px 12px 12px 12px;
}

.thinking {
  color: #86909c !important;
}

.dots {
  display: inline-block;
  animation: blink 1.2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.ai-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f2f3f5;
}

.ai-input .el-input {
  flex: 1;
}
</style>
