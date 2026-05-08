<template>
  <div class="ops-agent-page">
    <!-- 顶部：部门主管卡 -->
    <div class="dept-card">
      <div class="dept-avatar">🤖</div>
      <div class="dept-info">
        <div class="dept-name">智能运营部门</div>
        <div class="dept-sub">5位AI专员 · 7×24待命 · 实时数据驱动</div>
      </div>
      <div class="dept-stats">
        <div class="d-stat"><span class="d-val green">{{ alerts.length }}</span><small>预警</small></div>
        <div class="d-stat"><span class="d-val">{{ pendingTasks }}</span><small>待办</small></div>
      </div>
    </div>

    <!-- 三栏主体 -->
    <div class="three-col">

      <!-- 左栏：Agent选择 + 快捷指令 -->
      <aside class="left-panel">
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#0ea5e9"></span>
            AI运营团队
          </div>
          <div class="agent-list">
            <button
              v-for="agent in opsAgents" :key="agent.id"
              class="agent-item" :class="{ active: currentAgent?.id === agent.id }"
              @click="switchAgent(agent)"
            >
              <span class="agent-emoji">{{ agent.emoji }}</span>
              <div class="agent-meta">
                <div class="agent-name">{{ agent.name }}</div>
                <div class="agent-specialty">{{ agent.specialty }}</div>
              </div>
              <span class="agent-status" :class="'status-' + agent.status">{{ agent.statusText }}</span>
            </button>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#10b981"></span>
            快捷任务
          </div>
          <div class="quick-list">
            <button v-for="q in currentAgent?.quickTasks || []" :key="q.text" class="quick-item" @click="sendPrompt(q.text)">
              <span class="quick-emoji">{{ q.emoji }}</span>
              <span class="quick-text">{{ q.text }}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- 中栏：对话区 -->
      <section class="chat-panel" :style="{ '--ac': currentAgent?.color || '#0ea5e9' }">
        <div class="chat-header">
          <div class="chat-header-left">
            <span class="chat-agent-emoji">{{ currentAgent?.emoji || '🤖' }}</span>
            <div>
              <div class="chat-agent-name">{{ currentAgent?.name || '运营助手' }}</div>
              <div class="chat-agent-sub">智能运营部 · {{ currentAgent?.specialty || '' }}</div>
            </div>
          </div>
          <div class="chat-chips">
            <button v-for="chip in currentAgent?.chips || []" :key="chip.text" class="chip-btn" @click="sendPrompt(chip.text)">{{ chip.text }}</button>
          </div>
        </div>

        <div class="chat-messages" ref="chatContainer">
          <div v-if="messages.length === 0" class="chat-empty">
            <div class="empty-icon">{{ currentAgent?.emoji || '🤖' }}</div>
            <div class="empty-title">{{ currentAgent?.name || '运营助手' }} 已就位</div>
            <div class="empty-desc">{{ currentAgent?.welcome || '发送消息开始对话' }}</div>
          </div>
          <div v-for="(msg, idx) in messages" :key="idx" :class="['msg-wrap', msg.role === 'user' ? 'msg-user' : 'msg-assistant']">
            <div v-if="msg.role === 'assistant'" class="msg-avatar">{{ currentAgent?.emoji || '🤖' }}</div>
            <div class="msg-bubble" v-html="formatMsg(msg.content)"></div>
          </div>
          <div v-if="loading" class="msg-wrap msg-assistant">
            <div class="msg-avatar">{{ currentAgent?.emoji || '🤖' }}</div>
            <div class="msg-bubble loading-dots"><span></span><span></span><span></span></div>
          </div>
        </div>

        <div class="chat-input">
          <textarea v-model="inputText" class="chat-textarea" :placeholder="`询问${currentAgent?.name || 'AI助手'}...`" rows="2" @keydown.enter.ctrl="sendMessage" @keydown.enter.meta="sendMessage" />
          <button class="send-btn" :disabled="!inputText.trim() || loading" @click="sendMessage">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </section>

      <!-- 右栏：运营数据仪表盘 -->
      <aside class="right-panel">
        <!-- 实时预警 -->
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#ef4444"></span>
            实时预警
            <span class="alert-count">{{ alerts.length }}</span>
          </div>
          <div class="alert-list">
            <div v-if="!alerts.length" class="alert-empty">✅ 暂无预警</div>
            <div v-for="a in alerts" :key="a.id" class="alert-item">
              <span class="alert-icon">{{ a.emoji }}</span>
              <div class="alert-body">
                <div class="alert-title">{{ a.title }}</div>
                <div class="alert-desc">{{ a.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 今日运营数据 -->
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#f59e0b"></span>
            今日数据
          </div>
          <div class="data-list">
            <div class="data-row">
              <span class="data-label">全平台订单</span>
              <span class="data-val">{{ dashData.orders }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">全平台销售额</span>
              <span class="data-val">¥{{ dashData.sales.toLocaleString() }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">低库存商品</span>
              <span class="data-val warn">{{ dashData.lowStock }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">待发货订单</span>
              <span class="data-val warn">{{ dashData.pendingShip }}</span>
            </div>
          </div>
        </div>

        <!-- 团队协作记录 -->
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#8b5cf6"></span>
            最近任务
          </div>
          <div class="task-list">
            <div v-if="!tasks.length" class="task-empty">暂无任务记录</div>
            <div v-for="t in tasks" :key="t.id" class="task-item">
              <span class="task-emoji">{{ t.agentEmoji }}</span>
              <div class="task-body">
                <div class="task-text">{{ t.text }}</div>
                <div class="task-time">{{ t.time }}</div>
              </div>
              <span class="task-status" :class="'task-' + t.status">{{ t.statusText }}</span>
            </div>
          </div>
        </div>
      </aside>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

interface Agent {
  id: string
  name: string
  emoji: string
  specialty: string
  color: string
  status: 'idle' | 'busy'
  statusText: string
  welcome: string
  quickTasks: { emoji: string; text: string }[]
  chips: { text: string }[]
}

const opsAgents: Agent[] = [
  {
    id: 'ops_data', name: '数据官', emoji: '📊', specialty: '数据监控·预警',
    color: '#0ea5e9', status: 'idle', statusText: '待命',
    welcome: '我是数据官，实时监控各平台销售与库存数据，发现异常立即预警。',
    quickTasks: [
      { emoji: '📦', text: '检查今日库存预警' },
      { emoji: '📈', text: '今日销售日报' },
      { emoji: '⚠️', text: '各平台订单异常排查' },
    ],
    chips: [{ text: '今日预警' }, { text: '销售日报' }],
  },
  {
    id: 'ops_restock', name: '补货专员', emoji: '📦', specialty: '补货分析·采购草稿',
    color: '#10b981', status: 'idle', statusText: '待命',
    welcome: '我是补货专员，分析库存周转，生成采购单草稿。',
    quickTasks: [
      { emoji: '🔍', text: '查询低库存商品' },
      { emoji: '📋', text: '生成补货建议单' },
      { emoji: '✍️', text: '创建采购单草稿' },
    ],
    chips: [{ text: '补货分析' }, { text: '采购草稿' }],
  },
  {
    id: 'ops_pricing', name: '定价专员', emoji: '💰', specialty: '定价策略·利润优化',
    color: '#f59e0b', status: 'idle', statusText: '待命',
    welcome: '我是定价专员，基于数据优化定价策略，兼顾利润与销量。',
    quickTasks: [
      { emoji: '📊', text: '分析本月利润情况' },
      { emoji: '💡', text: '利润优化建议' },
      { emoji: '🎯', text: '618促销定价方案' },
    ],
    chips: [{ text: '定价建议' }, { text: '利润分析' }],
  },
  {
    id: 'ops_promo', name: '促销策划', emoji: '🎉', specialty: '促销活动全案策划',
    color: '#ec4899', status: 'idle', statusText: '待命',
    welcome: '我是促销策划，为各平台设计可落地的促销活动方案。',
    quickTasks: [
      { emoji: '🔥', text: '618大促方案' },
      { emoji: '🎁', text: '新品上市推广计划' },
      { emoji: '📱', text: '抖音短视频营销方案' },
    ],
    chips: [{ text: '促销方案' }, { text: '活动策划' }],
  },
  {
    id: 'ops_offline', name: '线下&私域', emoji: '🏪', specialty: '线下活动·私域运营',
    color: '#8b5cf6', status: 'idle', statusText: '待命',
    welcome: '我是线下&私域运营专员，负责客户管理、社群运营和线下活动。',
    quickTasks: [
      { emoji: '👥', text: '本月客户跟进计划' },
      { emoji: '💬', text: '设计私域社群活动' },
      { emoji: '📋', text: '展会活动策划方案' },
    ],
    chips: [{ text: '客户跟进' }, { text: '活动策划' }],
  },
]

const currentAgent = ref<Agent>(opsAgents[0])
const inputText = ref('')
const messages = ref<{ role: string; content: string }[]>([])
const loading = ref(false)
const chatContainer = ref<HTMLElement>()
const pendingTasks = ref(0)

const alerts = ref([
  { id: 1, emoji: '📦', title: '[抖音] 商品A库存不足', desc: '当前库存5件，低于预警线10件' },
  { id: 2, emoji: '📋', title: '[拼多多] 待发货订单积压', desc: '当前待发货23单，建议尽快处理' },
  { id: 3, emoji: '⚠️', title: '[淘宝] 转化率下降', desc: '本周转化率较上周下降12%' },
])

const dashData = reactive({
  orders: 0, sales: 0, lowStock: 0, pendingShip: 0,
})

const tasks = ref([
  { id: 1, agentEmoji: '📊', text: '生成本月销售日报', time: '10:32', status: 'done', statusText: '完成' },
  { id: 2, agentEmoji: '📦', text: '分析补货需求', time: '09:15', status: 'done', statusText: '完成' },
  { id: 3, agentEmoji: '🎉', text: '618活动方案制定', time: '08:00', status: 'pending', statusText: '进行中' },
])

function switchAgent(agent: Agent) {
  currentAgent.value = agent
  messages.value = []
}

async function sendPrompt(text: string) {
  inputText.value = text
  await sendMessage()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  loading.value = true
  scrollToBottom()
  try {
    const r = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: currentAgent.value.id,
        message: text,
      }),
    })
    const data = await r.json()
    messages.value.push({ role: 'assistant', content: data.reply || data.message || '处理中…' })
  } catch {
    messages.value.push({ role: 'assistant', content: '抱歉，服务暂时不可用，请稍后重试。' })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function formatMsg(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/^- /gm, '• ')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}
</script>

<style scoped>
.ops-agent-page { display: flex; flex-direction: column; height: calc(100vh - 120px); padding: 16px; gap: 12px; overflow: hidden; }

.dept-card { background: linear-gradient(135deg, #0891b2, #0e7490); border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; color: #fff; flex-shrink: 0; }
.dept-avatar { font-size: 32px; }
.dept-info { flex: 1; }
.dept-name { font-size: 16px; font-weight: 700; }
.dept-sub { font-size: 12px; opacity: 0.7; margin-top: 2px; }
.dept-stats { display: flex; gap: 16px; }
.d-stat { text-align: center; }
.d-val { display: block; font-size: 20px; font-weight: 800; }
.d-val.green { color: #86efac; }
.d-stat small { font-size: 11px; opacity: 0.7; }

.three-col { display: grid; grid-template-columns: 220px 1fr 240px; gap: 12px; flex: 1; min-height: 0; overflow: hidden; }
.left-panel, .right-panel { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.left-panel::-webkit-scrollbar, .right-panel::-webkit-scrollbar { display: none; }
.chat-panel { display: flex; flex-direction: column; background: #fff; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden; min-height: 0; }

.panel-card { background: #fff; border-radius: 12px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.panel-hd { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.alert-count { background: #ef4444; color: #fff; font-size: 10px; padding: 0 5px; border-radius: 8px; margin-left: auto; }

.agent-list { display: flex; flex-direction: column; gap: 4px; }
.agent-item { background: transparent; border: 1px solid transparent; border-radius: 10px; padding: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; }
.agent-item:hover { background: #f3f4f6; }
.agent-item.active { background: #e0f2fe; border-color: #0ea5e9; }
.agent-emoji { font-size: 20px; flex-shrink: 0; }
.agent-meta { flex: 1; min-width: 0; }
.agent-name { font-size: 13px; font-weight: 600; color: #333; }
.agent-specialty { font-size: 10px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.agent-status { font-size: 10px; padding: 1px 5px; border-radius: 6px; }
.status-idle { background: #d1fae5; color: #059669; }
.status-busy { background: #fef3c7; color: #d97706; }

.quick-list { display: flex; flex-direction: column; gap: 4px; }
.quick-item { background: #f8f9fa; border-radius: 8px; padding: 7px 10px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left; border: none; }
.quick-item:hover { background: #e8f4ff; }
.quick-emoji { font-size: 14px; }
.quick-text { font-size: 12px; color: #555; }

.chat-header { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; background: #fafafa; flex-shrink: 0; }
.chat-header-left { display: flex; gap: 10px; align-items: center; }
.chat-agent-emoji { font-size: 26px; }
.chat-agent-name { font-size: 14px; font-weight: 700; color: #333; }
.chat-agent-sub { font-size: 11px; color: #999; }
.chat-chips { display: flex; gap: 6px; }
.chip-btn { background: var(--ac, #0ea5e9); color: #fff; border: none; border-radius: 16px; padding: 4px 12px; font-size: 12px; cursor: pointer; }

.chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.chat-empty { text-align: center; padding: 40px 20px; color: #999; }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 4px; }
.empty-desc { font-size: 13px; }

.msg-wrap { display: flex; gap: 8px; align-items: flex-start; }
.msg-user { flex-direction: row-reverse; }
.msg-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--ac, #0ea5e9); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; }
.msg-bubble { background: #f3f4f6; border-radius: 12px; padding: 10px 14px; font-size: 13px; color: #333; line-height: 1.6; max-width: 85%; }
.msg-user .msg-bubble { background: var(--ac, #0ea5e9); color: #fff; }
:deep(.msg-bubble strong) { font-weight: 700; }
:deep(.msg-bubble code) { background: rgba(0,0,0,0.08); padding: 1px 4px; border-radius: 4px; font-size: 12px; }
.loading-dots { display: flex; gap: 4px; padding: 12px 16px; }
.loading-dots span { width: 6px; height: 6px; border-radius: 50%; background: #999; animation: bounce 1.4s infinite ease-in-out; }
.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

.chat-input { padding: 12px 16px; border-top: 1px solid #f3f4f6; display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0; }
.chat-textarea { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 12px; font-size: 13px; resize: none; outline: none; font-family: inherit; }
.chat-textarea:focus { border-color: var(--ac, #0ea5e9); }
.send-btn { width: 36px; height: 36px; border-radius: 10px; background: var(--ac, #0ea5e9); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: opacity 0.2s; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.alert-list { display: flex; flex-direction: column; gap: 6px; }
.alert-empty { font-size: 12px; color: #999; text-align: center; padding: 8px; }
.alert-item { display: flex; gap: 8px; background: #fef2f2; border-radius: 8px; padding: 8px; }
.alert-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.alert-title { font-size: 12px; font-weight: 600; color: #333; margin-bottom: 2px; }
.alert-desc { font-size: 11px; color: #666; }

.data-list { display: flex; flex-direction: column; gap: 6px; }
.data-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
.data-label { color: #999; }
.data-val { font-weight: 600; color: #333; }
.data-val.warn { color: #f59e0b; }

.task-list { display: flex; flex-direction: column; gap: 6px; }
.task-empty { font-size: 12px; color: #999; text-align: center; padding: 8px; }
.task-item { display: flex; gap: 8px; align-items: center; font-size: 12px; }
.task-emoji { font-size: 14px; flex-shrink: 0; }
.task-body { flex: 1; min-width: 0; }
.task-text { color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.task-time { font-size: 10px; color: #999; }
.task-status { font-size: 10px; padding: 1px 5px; border-radius: 6px; }
.task-done { background: #d1fae5; color: #059669; }
.task-pending { background: #fef3c7; color: #d97706; }
</style>
